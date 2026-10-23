import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyNowPaymentsSignature } from "@/lib/nowpayments";
import { processPaymentWebhook } from "@/lib/payment-processor";

export async function POST(req: NextRequest) {
  const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!ipnSecret) {
    console.error("[NOWPayments Webhook] NOWPAYMENTS_IPN_SECRET is not configured on server");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const signature = req.headers.get("x-nowpayments-sig");
  if (!signature) {
    return NextResponse.json({ error: "Missing x-nowpayments-sig header" }, { status: 400 });
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (err) {
    return NextResponse.json({ error: "Unable to read request body" }, { status: 400 });
  }

  let payload: Record<string, any>;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const isValid = verifyNowPaymentsSignature(payload, signature, ipnSecret);
  if (!isValid) {
    console.warn("[NOWPayments Webhook] Invalid signature verification attempt");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[NOWPayments Webhook] Supabase service credentials missing");
    return NextResponse.json({ error: "Database configuration error" }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    const result = await processPaymentWebhook(payload, supabaseAdmin);
    return NextResponse.json(
      { success: result.success, message: result.message },
      { status: result.statusCode }
    );
  } catch (err: any) {
    console.error("[NOWPayments Webhook] Database processing error:", err?.message || err);
    return NextResponse.json({ error: "Failed to process payment event" }, { status: 500 });
  }
}
