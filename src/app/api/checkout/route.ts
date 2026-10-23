import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { PAID_PLANS, getNowPaymentsBaseUrl } from "@/lib/nowpayments";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized. Please sign in to upgrade." }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const planKey = body?.plan as "quarterly" | "yearly";
  if (!planKey || !PAID_PLANS[planKey]) {
    return NextResponse.json(
      { error: "Invalid plan. Choose 'quarterly' ($25) or 'yearly' ($79)." },
      { status: 400 }
    );
  }

  // Server-controlled pricing
  const plan = PAID_PLANS[planKey];
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  const baseUrl = (process.env.APP_BASE_URL || "https://stockledger-wine.vercel.app").replace(/\/$/, "");

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Payment gateway is currently being configured. Please contact support on Telegram (@Venlix25) to activate your account directly.",
      },
      { status: 503 }
    );
  }

  // 1. Insert order record into database
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      plan: plan.id,
      amount_usd: plan.amount,
      status: "pending",
    })
    .select()
    .single();

  if (orderErr || !order) {
    console.error("[Checkout] Failed to insert order:", orderErr?.message || orderErr);
    return NextResponse.json({ error: "Failed to initialize order record" }, { status: 500 });
  }

  // 2. Call NOWPayments Invoice API
  const nowPaymentsUrl = `${getNowPaymentsBaseUrl()}/invoice`;

  try {
    const nowRes = await fetch(nowPaymentsUrl, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount: plan.amount,
        price_currency: "usd",
        order_id: order.id,
        order_description: plan.label,
        ipn_callback_url: `${baseUrl}/api/webhook/nowpayments`,
        success_url: `${baseUrl}/pricing?order_id=${order.id}&status=check`,
        cancel_url: `${baseUrl}/pricing?order_id=${order.id}&status=cancelled`,
      }),
    });

    const nowData = await nowRes.json();

    if (!nowRes.ok || !nowData.invoice_url) {
      console.error("[Checkout] NOWPayments returned error:", nowData);
      await supabase.from("orders").update({ status: "failed" }).eq("id", order.id);
      return NextResponse.json(
        { error: nowData.message || "Failed to create checkout invoice with NOWPayments" },
        { status: 502 }
      );
    }

    // Save NOWPayments invoice and status
    await supabase
      .from("orders")
      .update({
        nowpayments_invoice_id: String(nowData.id),
        nowpayments_order_id: String(nowData.order_id || nowData.id),
        status: "awaiting_payment",
      })
      .eq("id", order.id);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      invoiceId: nowData.id,
      invoiceUrl: nowData.invoice_url,
    });
  } catch (err: any) {
    console.error("[Checkout] Network failure contacting NOWPayments:", err?.message || err);
    await supabase.from("orders").update({ status: "failed" }).eq("id", order.id);
    return NextResponse.json(
      { error: "Payment gateway is temporarily unreachable. Please try again shortly." },
      { status: 502 }
    );
  }
}
