export type UserPlan = "free" | "pro";

export const PLAN_LIMITS = {
  free: {
    maxCustomers: 5,
    maxInvoices: 10,
    name: "Starter (Free)",
    price: "$0",
  },
  pro: {
    maxCustomers: Infinity,
    maxInvoices: Infinity,
    name: "Pro Unlimited",
    price: "$9/mo or $49 Lifetime",
  },
};

export function getUserPlan(): UserPlan {
  if (typeof window === "undefined") return "free";
  const saved = localStorage.getItem("stockledger_plan");
  return saved === "pro" ? "pro" : "free";
}

export function setUserPlan(plan: UserPlan): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("stockledger_plan", plan);
  window.dispatchEvent(new Event("plan_updated"));
}
