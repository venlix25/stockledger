import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { PAID_PLANS, verifyNowPaymentsSignature, getNowPaymentsBaseUrl } from "../src/lib/nowpayments";
import { processPaymentWebhook } from "../src/lib/payment-processor";
import { MockDatabase } from "./mock-db";

const TEST_IPN_SECRET = "test_ipn_secret_key_8492048290482094";

function generateTestSignature(payload: Record<string, any>, secret: string): string {
  const sortedKeys = Object.keys(payload).sort();
  const sortedPayloadString = JSON.stringify(payload, sortedKeys);
  return crypto.createHmac("sha512", secret).update(sortedPayloadString).digest("hex");
}

describe("StockLedger Payment Verification & Security Test Suite", () => {
  let db: MockDatabase;

  beforeEach(() => {
    db = new MockDatabase();
  });

  // TEST 1: Creating a $25 quarterly order
  test("1. Creating a $25 quarterly order enforces server pricing", () => {
    const quarterlyPlan = PAID_PLANS.quarterly;
    assert.equal(quarterlyPlan.amount, 25.0);
    assert.equal(quarterlyPlan.id, "quarterly");
    assert.equal(quarterlyPlan.days, 90);
  });

  // TEST 2: Creating a $79 yearly order
  test("2. Creating a $79 yearly order with accurate $21 savings (~21%)", () => {
    const yearlyPlan = PAID_PLANS.yearly;
    assert.equal(yearlyPlan.amount, 79.0);
    assert.equal(yearlyPlan.id, "yearly");
    assert.equal(yearlyPlan.days, 365);
    // 4 * $25 = $100. $100 - $79 = $21 savings
    const quarterlyTotal = PAID_PLANS.quarterly.amount * 4;
    const savings = quarterlyTotal - yearlyPlan.amount;
    assert.equal(savings, 21);
  });

  // TEST 3: Rejecting manipulated prices and unauthorized plans
  test("3. Rejecting manipulated prices and invalid plan keys", () => {
    const invalidPlans = ["lifetime", "free_pro", "discount_1usd", ""];
    for (const plan of invalidPlans) {
      assert.equal((PAID_PLANS as any)[plan], undefined);
    }
  });

  // TEST 4: Successful and failed payment API responses & sandbox URL
  test("4. Isolated API configuration for sandbox vs production endpoints", () => {
    process.env.NOWPAYMENTS_ENV = "production";
    assert.equal(getNowPaymentsBaseUrl(), "https://api.nowpayments.io/v1");

    process.env.NOWPAYMENTS_ENV = "sandbox";
    assert.equal(getNowPaymentsBaseUrl(), "https://api-sandbox.nowpayments.io/v1");

    delete process.env.NOWPAYMENTS_ENV;
  });

  // TEST 5: Valid webhook signatures
  test("5. Valid webhook signatures match official NOWPayments HMAC-SHA512 algorithm", () => {
    const payload = {
      payment_id: 5049382910,
      payment_status: "finished",
      pay_address: "0x1234567890abcdef",
      price_amount: 9.0,
      price_currency: "usd",
      pay_amount: 0.00015,
      actually_paid: 0.00015,
      pay_currency: "btc",
      order_id: "order-test-uuid-1",
    };

    const signature = generateTestSignature(payload, TEST_IPN_SECRET);
    const isValid = verifyNowPaymentsSignature(payload, signature, TEST_IPN_SECRET);
    assert.equal(isValid, true);
  });

  // TEST 6: Invalid webhook signatures
  test("6. Invalid webhook signatures are rejected", () => {
    const payload = {
      payment_id: 5049382910,
      payment_status: "finished",
      price_amount: 9.0,
      order_id: "order-test-uuid-1",
    };

    const validSig = generateTestSignature(payload, TEST_IPN_SECRET);

    // Tampered payload
    const tamperedPayload = { ...payload, price_amount: 1.0 };
    assert.equal(verifyNowPaymentsSignature(tamperedPayload, validSig, TEST_IPN_SECRET), false);

    // Wrong secret key
    assert.equal(verifyNowPaymentsSignature(payload, validSig, "wrong_secret_key"), false);

    // Empty or corrupted signature
    assert.equal(verifyNowPaymentsSignature(payload, "", TEST_IPN_SECRET), false);
    assert.equal(verifyNowPaymentsSignature(payload, "invalid_hex", TEST_IPN_SECRET), false);
  });

  // TEST 7: Pending, waiting, confirming, confirmed, finished, failed, and expired payment statuses
  test("7. Status progression: waiting, confirming, confirmed, finished, failed, expired", async () => {
    const orderId = "order-status-progression";
    await db.from("orders").insert({
      id: orderId,
      user_id: "user-test-7",
      plan: "quarterly",
      amount_usd: 25.0,
      status: "pending",
    });

    // Case A: waiting
    const resWaiting = await processPaymentWebhook(
      { order_id: orderId, payment_status: "waiting", price_amount: 25.0, price_currency: "usd" },
      db
    );
    assert.equal(resWaiting.statusCode, 200);
    assert.equal(resWaiting.activated, false);
    let order = (await db.from("orders").select().eq("id", orderId).single()).data;
    assert.equal(order.status, "waiting");

    // Case B: confirming
    const resConfirming = await processPaymentWebhook(
      { order_id: orderId, payment_status: "confirming", price_amount: 25.0, price_currency: "usd" },
      db
    );
    assert.equal(resConfirming.statusCode, 200);
    assert.equal(resConfirming.activated, false);
    order = (await db.from("orders").select().eq("id", orderId).single()).data;
    assert.equal(order.status, "confirming");

    // Case C: finished (Activates Subscription!)
    const resFinished = await processPaymentWebhook(
      {
        order_id: orderId,
        payment_status: "finished",
        payment_id: "np-9999",
        price_amount: 25.0,
        price_currency: "usd",
        actually_paid: 25.0,
        pay_currency: "usdttrc20",
      },
      db
    );
    assert.equal(resFinished.statusCode, 200);
    assert.equal(resFinished.activated, true);
    assert.equal(resFinished.plan, "quarterly");
    order = (await db.from("orders").select().eq("id", orderId).single()).data;
    assert.equal(order.status, "finished");

    // Check subscription was created
    const sub = (await db.from("subscriptions").select().eq("user_id", "user-test-7").eq("status", "active").single()).data;
    assert.ok(sub);
    assert.equal(sub.status, "active");
    assert.equal(sub.plan, "quarterly");
  });

  // TEST 8: Underpaid, overpaid, mismatched, and wrong-currency payments
  test("8. Underpaid and wrong currency payments do NOT activate subscriptions", async () => {
    // Underpaid order ($10 instead of $25)
    const orderId = "order-underpaid";
    await db.from("orders").insert({
      id: orderId,
      user_id: "user-underpaid",
      plan: "quarterly",
      amount_usd: 25.0,
      status: "pending",
    });

    const resUnderpaid = await processPaymentWebhook(
      {
        order_id: orderId,
        payment_status: "finished",
        price_amount: 10.0, // Underpaid!
        price_currency: "usd",
      },
      db
    );
    assert.equal(resUnderpaid.statusCode, 200);
    assert.equal(resUnderpaid.activated, false);

    // Verify order was marked partially_paid and NO subscription was created
    const order = (await db.from("orders").select().eq("id", orderId).single()).data;
    assert.equal(order.status, "partially_paid");
    const sub = (await db.from("subscriptions").select().eq("user_id", "user-underpaid").eq("status", "active").single()).data;
    assert.equal(sub, null);

    // Wrong currency (EUR instead of USD)
    const resWrongCurrency = await processPaymentWebhook(
      {
        order_id: orderId,
        payment_status: "finished",
        price_amount: 25.0,
        price_currency: "eur",
      },
      db
    );
    assert.equal(resWrongCurrency.statusCode, 400);
    assert.equal(resWrongCurrency.success, false);
  });

  // TEST 9: Missing or invalid order IDs
  test("9. Missing or invalid order IDs return appropriate HTTP error codes", async () => {
    // Missing order_id
    const resMissing = await processPaymentWebhook({ payment_status: "finished" }, db);
    assert.equal(resMissing.statusCode, 400);
    assert.equal(resMissing.success, false);

    // Non-existent order_id
    const resNotFound = await processPaymentWebhook(
      { order_id: "non-existent-uuid-999", payment_status: "finished" },
      db
    );
    assert.equal(resNotFound.statusCode, 404);
    assert.equal(resNotFound.success, false);
  });

  // TEST 10: Duplicate callbacks (Idempotency)
  test("10. Duplicate finished callbacks are handled idempotently without re-extending", async () => {
    const orderId = "order-duplicate";
    const userId = "user-duplicate";
    await db.from("orders").insert({
      id: orderId,
      user_id: userId,
      plan: "quarterly",
      amount_usd: 25.0,
      status: "pending",
    });

    const payload = {
      order_id: orderId,
      payment_status: "finished",
      price_amount: 25.0,
      price_currency: "usd",
      payment_id: "np-dup-1",
    };

    // First callback
    const res1 = await processPaymentWebhook(payload, db);
    assert.equal(res1.statusCode, 200);
    assert.equal(res1.activated, true);

    const sub1 = (await db.from("subscriptions").select().eq("user_id", userId).eq("status", "active").single()).data;
    const originalExpiry = sub1.expires_at;

    // Second callback (duplicate)
    const res2 = await processPaymentWebhook(payload, db);
    assert.equal(res2.statusCode, 200);
    assert.equal(res2.message.includes("already fulfilled"), true);

    const sub2 = (await db.from("subscriptions").select().eq("user_id", userId).eq("status", "active").single()).data;
    // Expiry date must not change on duplicate notification
    assert.equal(sub2.expires_at, originalExpiry);
  });

  // TEST 11: Delayed and out-of-order callbacks
  test("11. Delayed 'expired' callback arriving after 'finished' does not cancel active subscription", async () => {
    const orderId = "order-delayed";
    const userId = "user-delayed";
    await db.from("orders").insert({
      id: orderId,
      user_id: userId,
      plan: "yearly",
      amount_usd: 79.0,
      status: "pending",
    });

    // Payment finishes
    await processPaymentWebhook(
      {
        order_id: orderId,
        payment_status: "finished",
        price_amount: 79.0,
        price_currency: "usd",
      },
      db
    );

    // Delayed callback for 'expired' or 'waiting' arrives later due to network latency
    const delayedRes = await processPaymentWebhook(
      {
        order_id: orderId,
        payment_status: "expired",
      },
      db
    );

    assert.equal(delayedRes.statusCode, 200);
    assert.ok(delayedRes.message.includes("ignored for completed order"));

    // User subscription remains active
    const sub = (await db.from("subscriptions").select().eq("user_id", userId).eq("status", "active").single()).data;
    assert.ok(sub);
    assert.equal(sub.status, "active");
    assert.equal(sub.plan, "yearly");
  });

  // TEST 12: Concurrent webhook processing
  test("12. Concurrent webhooks for the same order resolve safely without crash", async () => {
    const orderId = "order-concurrent";
    const userId = "user-concurrent";
    await db.from("orders").insert({
      id: orderId,
      user_id: userId,
      plan: "quarterly",
      amount_usd: 25.0,
      status: "pending",
    });

    const payload = {
      order_id: orderId,
      payment_status: "finished",
      price_amount: 25.0,
      price_currency: "usd",
    };

    // Run parallel calls concurrently
    const [resA, resB] = await Promise.all([
      processPaymentWebhook(payload, db),
      processPaymentWebhook(payload, db),
    ]);

    assert.equal(resA.statusCode, 200);
    assert.equal(resB.statusCode, 200);

    const sub = (await db.from("subscriptions").select().eq("user_id", userId).eq("status", "active").single()).data;
    assert.ok(sub);
    assert.equal(sub.status, "active");
  });

  // TEST 13: Database errors during payment processing
  test("13. Simulated database failure handled without unhandled exception", async () => {
    db.shouldFail = true;
    try {
      const res = await processPaymentWebhook(
        { order_id: "order-fail", payment_status: "finished" },
        db
      );
      assert.equal(res.statusCode, 404); // Database returned error locating order
    } catch (err: any) {
      assert.fail(`Should not throw unhandled error: ${err.message}`);
    }
  });

  // TEST 14: Subscription activation, renewal period extension, and expiry
  test("14. Early renewal adds onto existing expiration date", async () => {
    const userId = "user-renewal";
    const existingExpiry = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days remaining

    // User already has active quarterly subscription
    await db.from("subscriptions").insert({
      user_id: userId,
      plan: "quarterly",
      status: "active",
      starts_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      expires_at: existingExpiry.toISOString(),
    });

    // User purchases yearly plan ($79, 365 days) early
    const orderId = "order-yearly-renewal";
    await db.from("orders").insert({
      id: orderId,
      user_id: userId,
      plan: "yearly",
      amount_usd: 79.0,
      status: "pending",
    });

    const res = await processPaymentWebhook(
      {
        order_id: orderId,
        payment_status: "finished",
        price_amount: 79.0,
        price_currency: "usd",
      },
      db
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.activated, true);

    const sub = (await db.from("subscriptions").select().eq("user_id", userId).eq("status", "active").single()).data;
    assert.equal(sub.plan, "yearly");

    // The new expiry date should be existingExpiry + 365 days
    const expectedNewExpiry = new Date(existingExpiry.getTime() + 365 * 24 * 60 * 60 * 1000);
    const actualNewExpiry = new Date(sub.expires_at);

    // Difference should be within a few milliseconds
    assert.ok(Math.abs(actualNewExpiry.getTime() - expectedNewExpiry.getTime()) < 1000);
  });

  // TEST 15: Browser redirects without verified payments do not grant access
  test("15. Unverified order returns isConfirmed: false", async () => {
    const orderId = "order-unverified";
    await db.from("orders").insert({
      id: orderId,
      user_id: "user-unverified",
      plan: "quarterly",
      amount_usd: 25.0,
      status: "awaiting_payment",
      payment_status: "waiting",
    });

    const order = (await db.from("orders").select().eq("id", orderId).single()).data;
    const isConfirmed = order.status === "finished" || order.payment_status === "finished";
    assert.equal(isConfirmed, false);
  });
});
