import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ plan: "free", status: "unauthenticated" }, { status: 401 });
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status, starts_at, expires_at")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const now = Date.now();
  const expiresMs = sub?.expires_at ? new Date(sub.expires_at).getTime() : 0;
  const diffMs = expiresMs - now;
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const isExpired = expiresMs > 0 && diffMs <= 0;

  if (!sub || isExpired || sub.status !== "active") {
    return NextResponse.json({
      plan: "free",
      status: isExpired ? "expired" : "inactive",
      daysRemaining: 0,
      isExpired: Boolean(isExpired),
      expires_at: sub?.expires_at || null,
    });
  }

  return NextResponse.json({
    plan: "pro",
    status: sub.status,
    subscriptionPlan: sub.plan,
    starts_at: sub.starts_at,
    expires_at: sub.expires_at,
    daysRemaining,
    isExpired: false,
  });
}
