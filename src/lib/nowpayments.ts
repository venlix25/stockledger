import crypto from "crypto";

export interface PlanConfig {
  id: "quarterly" | "yearly";
  amount: number;
  label: string;
  days: number;
  description: string;
  savingsNote?: string;
}

export const PAID_PLANS: Record<"quarterly" | "yearly", PlanConfig> = {
  quarterly: {
    id: "quarterly",
    amount: 25.0,
    label: "StockLedger Pro — Quarterly",
    days: 90,
    description:
      "Manage your business invoices, record customer payments, and track outstanding balances in one organized workspace. Get 3 months of StockLedger access for $25.",
  },
  yearly: {
    id: "yearly",
    amount: 79.0,
    label: "StockLedger Pro — Yearly",
    days: 365,
    description:
      "Keep your business organized throughout the year with StockLedger. Create invoices, record customer payments, and monitor outstanding balances in one place. Get a full year of access for $79, saving $21 compared with paying quarterly.",
    savingsNote: "Save $21 compared with 4 quarterly payments (~21% off)",
  },
};

export function getNowPaymentsBaseUrl(): string {
  const isSandbox =
    process.env.NOWPAYMENTS_ENV === "sandbox" ||
    process.env.NOWPAYMENTS_SANDBOX === "true" ||
    process.env.NEXT_PUBLIC_NOWPAYMENTS_ENV === "sandbox";
  return isSandbox
    ? "https://api-sandbox.nowpayments.io/v1"
    : "https://api.nowpayments.io/v1";
}

/**
 * NOWPayments IPN Signature Verification.
 * Officially documented algorithm:
 * 1. Sort the payload keys alphabetically.
 * 2. Format with JSON.stringify(payload, sortedKeys).
 * 3. Calculate HMAC-SHA512 hash using the IPN Secret Key.
 * 4. Timing-safe compare computed hex with x-nowpayments-sig header.
 */
export function verifyNowPaymentsSignature(
  payload: Record<string, any> | string,
  receivedSignature: string,
  secretKey: string
): boolean {
  if (!receivedSignature || !secretKey) {
    return false;
  }

  let parsed: Record<string, any>;
  if (typeof payload === "string") {
    try {
      parsed = JSON.parse(payload);
    } catch {
      return false;
    }
  } else {
    parsed = payload;
  }

  if (!parsed || typeof parsed !== "object" || Object.keys(parsed).length === 0) {
    return false;
  }

  try {
    const sortedKeys = Object.keys(parsed).sort();
    const sortedPayloadString = JSON.stringify(parsed, sortedKeys);

    const hmac = crypto.createHmac("sha512", secretKey);
    hmac.update(sortedPayloadString);
    const computedSignature = hmac.digest("hex");

    const receivedBuf = Buffer.from(receivedSignature.trim().toLowerCase(), "utf8");
    const computedBuf = Buffer.from(computedSignature.trim().toLowerCase(), "utf8");

    if (receivedBuf.length !== computedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(receivedBuf, computedBuf);
  } catch (err) {
    return false;
  }
}

export type NowPaymentsStatus =
  | "waiting"
  | "confirming"
  | "confirmed"
  | "sending"
  | "partially_paid"
  | "finished"
  | "failed"
  | "refunded"
  | "expired";

/**
 * Statuses that represent sufficient confirmation to activate a subscription.
 * In NOWPayments, "finished" is full wallet settlement. "confirmed" is confirmed on-chain.
 * We require "finished" or "confirmed".
 */
export const ACTIVATION_STATUSES: NowPaymentsStatus[] = ["finished", "confirmed"];
export const TERMINAL_FAILED_STATUSES: NowPaymentsStatus[] = ["failed", "refunded", "expired"];
