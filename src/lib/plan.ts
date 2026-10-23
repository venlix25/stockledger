import { createClient } from "@/lib/supabase/client";

export type UserPlan = "free" | "pro";

export interface SubscriptionDetails {
  plan: UserPlan;
  status: "active" | "expired" | "none";
  tier?: "quarterly" | "yearly";
  startsAt?: string;
  expiresAt?: string;
  daysRemaining: number;
  isExpired: boolean;
  totalDurationDays?: number;
}

export const PLAN_LIMITS = {
  free: {
    maxCustomers: 5,
    maxInvoices: 10,
    name: "Starter (Free)",
    price: "Free",
  },
  pro: {
    maxCustomers: Infinity,
    maxInvoices: Infinity,
    name: "Pro Unlimited",
    price: "$25/quarter or $79/yr",
  },
};

/**
 * Detailed subscription checker: queries the authoritative Supabase subscriptions table.
 * Calculates exact days remaining, expiration status, and tier.
 */
export async function getUserSubscriptionDetails(): Promise<SubscriptionDetails> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return {
        plan: "free",
        status: "none",
        daysRemaining: 0,
        isExpired: false,
      };
    }

    const { data } = await supabase
      .from("subscriptions")
      .select("plan, status, starts_at, expires_at")
      .eq("user_id", user.id)
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) {
      setUserPlan("free");
      return {
        plan: "free",
        status: "none",
        daysRemaining: 0,
        isExpired: false,
      };
    }

    const now = Date.now();
    const expiresMs = data.expires_at ? new Date(data.expires_at).getTime() : 0;
    const diffMs = expiresMs - now;
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const isExpired = expiresMs > 0 && diffMs <= 0;

    const isActive = data.status === "active" && !isExpired;
    const activePlan: UserPlan = isActive ? "pro" : "free";

    // Synchronize local cache
    setUserPlan(activePlan);

    return {
      plan: activePlan,
      status: isExpired ? "expired" : isActive ? "active" : "none",
      tier: (data.plan as "quarterly" | "yearly") || "quarterly",
      startsAt: data.starts_at,
      expiresAt: data.expires_at,
      daysRemaining,
      isExpired,
      totalDurationDays: data.plan === "yearly" ? 365 : 90,
    };
  } catch (err) {
    console.error("[plan] Error fetching subscription details:", err);
    return {
      plan: "free",
      status: "none",
      daysRemaining: 0,
      isExpired: false,
    };
  }
}

/**
 * Authoritative client-side verification: checks Supabase subscriptions table.
 * If expired or non-existent, falls back to "free".
 */
export async function getUserPlanFromDB(): Promise<UserPlan> {
  const details = await getUserSubscriptionDetails();
  return details.plan;
}

/**
 * Fast synchronous check with fallback. In browser environments, checks cached state.
 * To strictly prevent client manipulation, server routes always query the DB directly.
 */
export function getUserPlan(): UserPlan {
  if (typeof window === "undefined") return "free";
  const saved = localStorage.getItem("stockledger_plan");
  if (saved === "pro") return "pro";
  return "free";
}

export function setUserPlan(plan: UserPlan) {
  if (typeof window !== "undefined") {
    localStorage.setItem("stockledger_plan", plan);
    window.dispatchEvent(new Event("plan_updated"));
  }
}
