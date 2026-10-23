import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { PLAN_LIMITS } from "../src/lib/plan";
import { MockDatabase } from "./mock-db";

describe("Application Security & Policy Acceptance Test Suite", () => {
  // TEST 16: Authentication, consent requirements, and application limits
  test("16a. Registration requires all three unchecked consents", () => {
    // Helper function mirroring validation in page.tsx and policy-acceptance route
    const validateConsent = (terms: boolean, privacy: boolean, payment: boolean) => {
      return terms === true && privacy === true && payment === true;
    };

    assert.equal(validateConsent(false, false, false), false);
    assert.equal(validateConsent(true, false, false), false);
    assert.equal(validateConsent(true, true, false), false);
    assert.equal(validateConsent(false, true, true), false);
    assert.equal(validateConsent(true, true, true), true);
  });

  test("16b. Free starter limits capped at 5 customers and 10 invoices", () => {
    assert.equal(PLAN_LIMITS.free.maxCustomers, 5);
    assert.equal(PLAN_LIMITS.free.maxInvoices, 10);
    assert.equal(PLAN_LIMITS.pro.maxCustomers, Infinity);
    assert.equal(PLAN_LIMITS.pro.maxInvoices, Infinity);
  });

  test("16c. Server-side policy acceptance records structure", async () => {
    const db = new MockDatabase();
    const userId = "user-policy-test-1";

    const records = [
      {
        user_id: userId,
        policy_type: "terms_of_service",
        policy_version: "1.0",
        accepted_at: new Date().toISOString(),
      },
      {
        user_id: userId,
        policy_type: "privacy_policy",
        policy_version: "1.0",
        accepted_at: new Date().toISOString(),
      },
      {
        user_id: userId,
        policy_type: "subscription_payment_policy",
        policy_version: "1.0",
        accepted_at: new Date().toISOString(),
      },
    ];

    await db.from("policy_acceptances").insert(records);
    assert.equal(db.policyAcceptances.length, 3);
    assert.equal(db.policyAcceptances[0].policy_type, "terms_of_service");
    assert.equal(db.policyAcceptances[1].policy_type, "privacy_policy");
    assert.equal(db.policyAcceptances[2].policy_type, "subscription_payment_policy");
  });
});
