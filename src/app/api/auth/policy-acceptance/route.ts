import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { termsAccepted, privacyAccepted, paymentAccepted, version = "1.0" } = body;

  if (!termsAccepted || !privacyAccepted || !paymentAccepted) {
    return NextResponse.json(
      {
        error:
          "All three policy acknowledgements (Terms of Service, Privacy Policy, and Payment Policy) are required.",
      },
      { status: 400 }
    );
  }

  const records = [
    {
      user_id: user.id,
      policy_type: "terms_of_service",
      policy_version: String(version),
      accepted_at: new Date().toISOString(),
    },
    {
      user_id: user.id,
      policy_type: "privacy_policy",
      policy_version: String(version),
      accepted_at: new Date().toISOString(),
    },
    {
      user_id: user.id,
      policy_type: "subscription_payment_policy",
      policy_version: String(version),
      accepted_at: new Date().toISOString(),
    },
  ];

  const { error: insertErr } = await supabase.from("policy_acceptances").insert(records);

  if (insertErr) {
    console.error("[Policy Acceptance] Insert error:", insertErr.message);
    // Non-fatal if table not yet run in SQL editor, but return warning
    return NextResponse.json(
      { success: true, recorded: false, warning: insertErr.message },
      { status: 200 }
    );
  }

  return NextResponse.json({ success: true, recorded: true });
}
