"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  Zap,
  ShieldCheck,
  Clock,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  ExternalLink,
  Coins,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { PAID_PLANS } from "@/lib/nowpayments";
import { createClient } from "@/lib/supabase/client";
import { setUserPlan } from "@/lib/plan";

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get("plan") === "yearly" ? "yearly" : "quarterly";
  const orderIdParam = searchParams.get("order_id");
  const returnStatus = searchParams.get("status");

  const [selectedPlan, setSelectedPlan] = useState<"quarterly" | "yearly">(initialPlan);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [userLoaded, setUserLoaded] = useState(false);

  // Order verification states
  const [pollingOrder, setPollingOrder] = useState<string | null>(orderIdParam);
  const [orderData, setOrderData] = useState<any>(null);
  const [pollCount, setPollCount] = useState(0);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (redirectCountdown === null) return;
    if (redirectCountdown <= 0) {
      router.push("/dashboard?payment_success=true");
      return;
    }
    const timer = setTimeout(() => {
      setRedirectCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [redirectCountdown, router]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
      setUserLoaded(true);
      if (data?.user) {
        supabase
          .from("subscriptions")
          .select("plan, status, expires_at")
          .eq("user_id", data.user.id)
          .eq("status", "active")
          .order("expires_at", { ascending: false })
          .limit(1)
          .maybeSingle()
          .then(({ data: sub }) => {
            if (sub && (!sub.expires_at || new Date(sub.expires_at) > new Date())) {
              setActiveSub(sub);
            }
          });
      }
    });
  }, []);

  // Poll order status if order_id is present
  useEffect(() => {
    if (!pollingOrder) return;

    let isMounted = true;
    const checkOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${pollingOrder}`);
        if (!res.ok) {
          if (res.status === 401) {
            setErrorMessage("Please sign in to check your order status.");
          }
          return;
        }
        const data = await res.json();
        if (!isMounted) return;

        setOrderData(data);
        if (data.isConfirmed) {
          // Immediately activate Pro state in local client
          setUserPlan("pro");
          window.dispatchEvent(new Event("plan_updated"));
          setActiveSub(data.subscription);
          setRedirectCountdown(3);
          return;
        }

        if (pollCount < 20) {
          // Poll every 5s for up to 20 tries (100 seconds)
          setTimeout(() => {
            if (isMounted) setPollCount((c) => c + 1);
          }, 5000);
        }
      } catch (err) {
        console.error("Failed to check order status", err);
      }
    };

    checkOrder();

    return () => {
      isMounted = false;
    };
  }, [pollingOrder, pollCount]);

  const handleCheckout = async (plan: "quarterly" | "yearly") => {
    if (loading) return; // Prevent double checkout initiation
    setErrorMessage(null);
    if (!user) {
      router.push("/?redirect=/pricing");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to start checkout. Please try again.");
        setLoading(false);
        return;
      }

      if (data.invoiceUrl) {
        // Redirect to NOWPayments secure checkout page
        window.location.href = data.invoiceUrl;
      } else {
        setErrorMessage("Payment provider did not return a valid invoice URL.");
        setLoading(false);
      }
    } catch (err) {
      setErrorMessage("Network error connecting to payment gateway.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <a
            href="https://t.me/Venlix25"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full"
          >
            Need Help? Telegram Support
          </a>
        </div>

        {/* Status Alert for Returned Checkouts */}
        {orderIdParam && (
          <div className="mb-8">
            {orderData?.isConfirmed ? (
              <div className="p-5 bg-green-50 border-2 border-green-300 rounded-3xl flex items-start gap-4">
                <ShieldCheck className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-base font-bold text-green-900">
                    Payment Verified & Subscription Active! 🎉
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    Your {orderData.order?.plan === "yearly" ? "Yearly" : "Quarterly"} Pro Plan is active
                    until{" "}
                    <strong>
                      {orderData.subscription?.expires_at
                        ? new Date(orderData.subscription.expires_at).toLocaleDateString()
                        : "the end of your subscription period"}
                    </strong>
                    . Thank you for choosing StockLedger.
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <Link
                      href="/dashboard?payment_success=true"
                      className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold shadow hover:bg-green-700 transition-colors inline-flex items-center gap-1.5"
                    >
                      Go to Dashboard Now →
                    </Link>
                    {redirectCountdown !== null && (
                      <span className="text-xs text-green-700 font-medium">
                        Redirecting in <strong>{redirectCountdown}</strong>s...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : returnStatus === "cancelled" ? (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between gap-3 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-gray-500" />
                  <span>The payment checkout was cancelled. No charges were made.</span>
                </div>
                <button
                  onClick={() => setPollingOrder(null)}
                  className="text-xs text-gray-500 underline"
                >
                  Dismiss
                </button>
              </div>
            ) : (
              <div className="p-5 bg-amber-50 border border-amber-200 rounded-3xl flex items-start gap-4">
                <Clock className="w-6 h-6 text-amber-600 animate-spin flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-base font-bold text-amber-900">
                    Checking Payment Status on Blockchain...
                  </h3>
                  <p className="text-sm text-amber-800 mt-1">
                    Order ID: <code className="text-xs bg-amber-100 px-1.5 py-0.5 rounded">{orderIdParam}</code>.
                    {orderData?.order?.payment_status === "confirming"
                      ? " Transaction detected! Waiting for required network confirmations."
                      : " Awaiting payment notification from NOWPayments."}
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Cryptocurrency confirmations usually take between 2 to 15 minutes depending on network congestion. This page updates automatically.
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      onClick={() => setPollCount((c) => c + 1)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Check Status Now
                    </button>
                    <a
                      href="https://t.me/Venlix25"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-amber-900 underline"
                    >
                      Contact Support
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active Subscription Banner */}
        {activeSub && !orderData?.isConfirmed && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <div>
                <span className="text-sm font-bold text-blue-900">
                  You currently have an active Pro Plan ({activeSub.plan})
                </span>
                <span className="text-xs text-blue-700 block">
                  Expires on: {new Date(activeSub.expires_at).toLocaleDateString()}. Renewing early adds time to your current expiry date!
                </span>
              </div>
            </div>
            <span className="text-xs font-bold bg-blue-600 text-white px-2.5 py-1 rounded-full uppercase">
              Active
            </span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{errorMessage}</p>
              <p className="text-xs text-red-600 mt-1">
                If you encounter any issues, please reach out to{" "}
                <a
                  href="https://t.me/Venlix25"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-bold"
                >
                  Contact StockLedger Support on Telegram
                </a>
                .
              </p>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Transparent Wholesale Pricing
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Simple, honest pricing for growing businesses
          </h1>
          <p className="mt-3 text-base text-gray-600">
            Start free or upgrade to Pro for unlimited customers, unlimited invoices, overdue alerts, and all 10 international currencies.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Quarterly Plan */}
          <div
            className={`relative rounded-3xl p-8 transition-all flex flex-col justify-between border-2 ${
              selectedPlan === "quarterly"
                ? "border-blue-600 bg-white shadow-xl shadow-blue-100/50"
                : "border-gray-200 bg-white hover:border-gray-300 shadow-sm"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-blue-600">
                  Quarterly Plan
                </span>
                <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full">
                  Flexible
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-black text-gray-900">$25</span>
                <span className="text-gray-500 font-medium">/ 3 months</span>
              </div>

              <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                {PAID_PLANS.quarterly.description}
              </p>

              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                <div className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                  Everything in Pro:
                </div>
                <ul className="space-y-2.5 text-sm text-gray-700">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <strong>Unlimited Customers</strong>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <strong>Unlimited Invoices & Payments</strong>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Automatic Overdue & Due-Date Tracking
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    All 10 Global Currencies (USD, EUR, GBP, SGD, etc.)
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Full 90-day subscription access
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <button
                onClick={() => {
                  setSelectedPlan("quarterly");
                  handleCheckout("quarterly");
                }}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2"
              >
                {loading && selectedPlan === "quarterly" ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Preparing Checkout...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white" /> Get Quarterly Access ($25)
                  </>
                )}
              </button>
              <p className="text-[11px] text-center text-gray-400 mt-2">
                3-month access · Manual renewal · No recurring card charges
              </p>
            </div>
          </div>

          {/* Yearly Plan */}
          <div
            className={`relative rounded-3xl p-8 transition-all flex flex-col justify-between border-2 ${
              selectedPlan === "yearly"
                ? "border-blue-600 bg-white shadow-xl shadow-blue-100/50 ring-2 ring-blue-500/20"
                : "border-gray-200 bg-white hover:border-gray-300 shadow-sm"
            }`}
          >
            <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
              Best Value · Save ~21%
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wider text-blue-600">
                  Yearly Plan
                </span>
                <span className="text-xs font-bold bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full">
                  Save $21 vs Quarterly
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-black text-gray-900">$79</span>
                <span className="text-gray-500 font-medium">/ year</span>
              </div>

              <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                {PAID_PLANS.yearly.description}
              </p>

              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                <div className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                  Everything in Quarterly plus:
                </div>
                <ul className="space-y-2.5 text-sm text-gray-700">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <strong>Full 365 Days of Access ($79 one-time payment)</strong>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <strong>Save $21</strong> compared with 4 quarterly payments ($100 value)
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Unlimited Customers, Invoices, and Payments all year
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Early renewals automatically extend existing expiration
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Direct priority support on Telegram
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <button
                onClick={() => {
                  setSelectedPlan("yearly");
                  handleCheckout("yearly");
                }}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
              >
                {loading && selectedPlan === "yearly" ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Preparing Checkout...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white" /> Get Yearly Access ($79)
                  </>
                )}
              </button>
              <p className="text-[11px] text-center text-gray-400 mt-2">
                1-year access · Manual renewal · Best savings for active businesses
              </p>
            </div>
          </div>
        </div>

        {/* Cryptocurrency Payment Instructions */}
        <div className="bg-white rounded-3xl border border-gray-200 p-8 mb-12 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                How Cryptocurrency Payment Works
              </h3>
              <p className="text-xs text-gray-500">
                Processed securely via NOWPayments with zero hidden fees
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-gray-600">
            <div className="space-y-1.5">
              <p className="font-bold text-gray-900 text-sm">1. Choose your coin</p>
              <p className="text-xs leading-relaxed">
                When you click upgrade, you will be redirected to the secure NOWPayments invoice page where you can pick BTC, USDT, ETH, SOL, or dozens of other supported cryptocurrencies.
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="font-bold text-gray-900 text-sm">2. Send exact amount</p>
              <p className="text-xs leading-relaxed">
                Transfer the exact amount to the generated deposit address or scan the QR code using your preferred wallet or exchange before the invoice expires.
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="font-bold text-gray-900 text-sm">3. Automatic verification</p>
              <p className="text-xs leading-relaxed">
                Once the transaction is confirmed on the blockchain, NOWPayments securely notifies StockLedger via verified IPN webhook and your Pro subscription is activated immediately.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-gray-500">
            <p>
              <strong>Important:</strong> A crypto payment purchases access for the specified subscription period (90 days or 365 days). Subscriptions do not automatically rebill or deduct from your wallet. When your period expires, simply submit a renewal payment.
            </p>
            <a
              href="https://t.me/Venlix25"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-bold whitespace-nowrap inline-flex items-center gap-1"
            >
              Contact Support <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-center space-y-4">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-semibold text-gray-500">
            <Link href="/legal/terms" className="hover:text-blue-600">Terms of Service</Link>
            <Link href="/legal/privacy" className="hover:text-blue-600">Privacy Policy</Link>
            <Link href="/legal/payment-policy" className="hover:text-blue-600">Subscription & Payment Policy</Link>
            <Link href="/legal/refund" className="hover:text-blue-600">Refund Policy</Link>
            <Link href="/legal/security" className="hover:text-blue-600">Security Information</Link>
            <a
              href="https://t.me/Venlix25"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700"
            >
              Contact StockLedger Support on Telegram
            </a>
          </div>
          <p className="text-xs text-gray-400">
            StockLedger — Invoice and customer payment tracking platform for wholesalers & growing businesses.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-black text-gray-900 mb-3">Choose Your Plan</h1>
              <p className="text-gray-500 text-lg">Unlock unlimited invoices, customers & payments</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Quarterly skeleton */}
              <div className="rounded-2xl border-2 border-blue-500 bg-white p-8 shadow-lg">
                <div className="text-sm font-bold text-blue-600 uppercase mb-2">Quarterly Plan</div>
                <div className="text-5xl font-black text-gray-900 mb-1">$25</div>
                <div className="text-gray-500 mb-6">per 90 days</div>
                <div className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-center flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Loading...
                </div>
              </div>
              {/* Yearly skeleton */}
              <div className="rounded-2xl border-2 border-gray-200 bg-white p-8 shadow">
                <div className="text-sm font-bold text-gray-500 uppercase mb-2">Yearly Plan</div>
                <div className="text-5xl font-black text-gray-900 mb-1">$79</div>
                <div className="text-gray-500 mb-6">per year — Save $21</div>
                <div className="w-full py-3 rounded-xl bg-gray-800 text-white font-bold text-center flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Loading...
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
