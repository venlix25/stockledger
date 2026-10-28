import { PAID_PLANS, ACTIVATION_STATUSES, NowPaymentsStatus } from "./nowpayments";

export interface WebhookResult {
  statusCode: number;
  success: boolean;
  message: string;
  activated?: boolean;
  plan?: string;
  expires_at?: string;
  orderId?: string;
}

export async function processPaymentWebhook(
  payload: Record<string, any>,
  supabaseAdmin: any
): Promise<WebhookResult> {
  const orderId = payload?.order_id as string;
  const paymentStatus = (payload?.payment_status as string)?.toLowerCase() as NowPaymentsStatus;
  const paymentId = payload?.payment_id ? String(payload.payment_id) : null;
  const priceAmount = Number(payload?.price_amount);
  const priceCurrency = (payload?.price_currency as string)?.toLowerCase();

  if (!orderId) {
    return { statusCode: 400, success: false, message: "Missing order_id" };
  }

  if (!paymentStatus) {
    return { statusCode: 400, success: false, message: "Missing payment_status" };
  }

  // 1. Fetch order from DB
  const { data: order, error: orderErr } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderErr || !order) {
    return { statusCode: 404, success: false, message: `Order not found: ${orderId}` };
  }

  // 2. Validate currency
  if (priceCurrency && priceCurrency !== "usd") {
    return {
      statusCode: 400,
      success: false,
      message: `Invalid currency: expected usd, received ${priceCurrency}`,
    };
  }

  // 3. Handle duplicate/out-of-order callbacks
  const isAlreadyFinished = order.status === "finished" || order.payment_status === "finished";

  if (isAlreadyFinished) {
    if (ACTIVATION_STATUSES.includes(paymentStatus)) {
      return {
        statusCode: 200,
        success: true,
        message: "Order already fulfilled (duplicate callback ignored)",
        activated: true,
        plan: order.plan,
      };
    }
    // If incoming status is an outdated/delayed non-success event, do not downgrade
    return {
      statusCode: 200,
      success: true,
      message: `Delayed status '${paymentStatus}' ignored for completed order`,
      activated: true,
    };
  }

  // 4. Validate amount on activation
  if (ACTIVATION_STATUSES.includes(paymentStatus)) {
    const expectedAmount = Number(order.amount_usd);
    if (!isNaN(priceAmount) && priceAmount < expectedAmount) {
      // Underpaid!
      await supabaseAdmin
        .from("orders")
        .update({
          status: "partially_paid",
          payment_status: "partially_paid",
          actually_paid: payload.actually_paid ?? payload.pay_amount ?? null,
          pay_currency: payload.pay_currency ?? null,
          nowpayments_payment_id: paymentId ?? order.nowpayments_payment_id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      return {
        statusCode: 200,
        success: true,
        message: "Payment underpaid: amount received is less than order amount",
        activated: false,
      };
    }

    // Amount is verified! Activate subscription.
    const planConfig = PAID_PLANS[order.plan as "quarterly" | "yearly"] || PAID_PLANS.quarterly;
    const daysToAdd = planConfig.days;
    const durationMs = daysToAdd * 24 * 60 * 60 * 1000;

    // Check for existing active subscription
    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", order.user_id)
      .eq("status", "active")
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = new Date();
    let startsAt: Date;
    let newExpiresAt: Date;

    if (existingSub && existingSub.expires_at && new Date(existingSub.expires_at) > now) {
      // Early renewal: extend from existing expiry date to preserve paid time!
      startsAt = new Date(existingSub.starts_at || now);
      newExpiresAt = new Date(new Date(existingSub.expires_at).getTime() + durationMs);
    } else {
      startsAt = now;
      newExpiresAt = new Date(now.getTime() + durationMs);
    }

    // Insert or update subscription
    if (existingSub) {
      let subUpRes = await supabaseAdmin
        .from("subscriptions")
        .update({
          plan: order.plan,
          status: "active",
          starts_at: startsAt.toISOString(),
          expires_at: newExpiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSub.id);

      if (subUpRes.error && subUpRes.error.message?.includes("check constraint")) {
        await supabaseAdmin
          .from("subscriptions")
          .update({
            plan: "monthly",
            status: "active",
            starts_at: startsAt.toISOString(),
            expires_at: newExpiresAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSub.id);
      }
    } else {
      let subInsRes = await supabaseAdmin.from("subscriptions").insert({
        user_id: order.user_id,
        plan: order.plan,
        status: "active",
        starts_at: startsAt.toISOString(),
        expires_at: newExpiresAt.toISOString(),
      });

      if (subInsRes.error && subInsRes.error.message?.includes("check constraint")) {
        await supabaseAdmin.from("subscriptions").insert({
          user_id: order.user_id,
          plan: "monthly",
          status: "active",
          starts_at: startsAt.toISOString(),
          expires_at: newExpiresAt.toISOString(),
        });
      }
    }

    // Update order status
    await supabaseAdmin
      .from("orders")
      .update({
        status: paymentStatus,
        payment_status: paymentStatus,
        nowpayments_payment_id: paymentId ?? order.nowpayments_payment_id,
        actually_paid: payload.actually_paid ?? payload.pay_amount ?? null,
        pay_currency: payload.pay_currency ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    return {
      statusCode: 200,
      success: true,
      message: `Subscription activated for plan: ${order.plan}`,
      activated: true,
      plan: order.plan,
      expires_at: newExpiresAt.toISOString(),
      orderId,
    };
  }

  // 5. Handle terminal failures / cancellations / refunds
  if (paymentStatus === "refunded") {
    // Revoke subscription if associated with this order
    await supabaseAdmin
      .from("subscriptions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("user_id", order.user_id)
      .eq("status", "active");

    await supabaseAdmin
      .from("orders")
      .update({
        status: "refunded",
        payment_status: "refunded",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    return {
      statusCode: 200,
      success: true,
      message: "Order marked refunded and subscription revoked",
      activated: false,
    };
  }

  // 6. Non-activating status (waiting, confirming, sending, failed, expired, etc.)
  await supabaseAdmin
    .from("orders")
    .update({
      status: paymentStatus,
      payment_status: paymentStatus,
      nowpayments_payment_id: paymentId ?? order.nowpayments_payment_id,
      actually_paid: payload.actually_paid ?? payload.pay_amount ?? null,
      pay_currency: payload.pay_currency ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  return {
    statusCode: 200,
    success: true,
    message: `Order status updated to: ${paymentStatus}`,
    activated: false,
    orderId,
  };
}
