import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const orderId = params?.id;
  if (!orderId) {
    return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Tenant isolation: order must belong to authenticated user
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id, plan, amount_usd, status, payment_status, actually_paid, pay_currency, created_at, updated_at")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Also check if user has an active subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id, plan, status, starts_at, expires_at")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const isSubscriptionActive =
    subscription &&
    subscription.status === "active" &&
    (!subscription.expires_at || new Date(subscription.expires_at) > new Date());

  return NextResponse.json({
    order: {
      id: order.id,
      plan: order.plan,
      amount_usd: order.amount_usd,
      status: order.status,
      payment_status: order.payment_status,
      actually_paid: order.actually_paid,
      pay_currency: order.pay_currency,
      created_at: order.created_at,
      updated_at: order.updated_at,
    },
    subscription: isSubscriptionActive
      ? {
          plan: subscription.plan,
          status: subscription.status,
          starts_at: subscription.starts_at,
          expires_at: subscription.expires_at,
        }
      : null,
    isConfirmed: order.status === "finished" || order.payment_status === "finished" || Boolean(isSubscriptionActive),
  });
}
