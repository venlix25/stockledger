"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  SUPPORTED_CURRENCIES,
  getSavedCurrency,
  saveCurrency,
} from "@/lib/currency";
import {
  Settings,
  Building2,
  Coins,
  ShieldCheck,
  LogOut,
  Save,
  CheckCircle,
  Zap,
  Clock,
  FileText,
  Shield,
  HelpCircle,
  AlertTriangle,
  Download,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  Copy,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getUserSubscriptionDetails,
  PLAN_LIMITS,
  type SubscriptionDetails,
} from "@/lib/plan";
import UpgradeModal from "@/components/UpgradeModal";

export default function SettingsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [savedMessage, setSavedMessage] = useState(false);
  const [subDetails, setSubDetails] = useState<SubscriptionDetails | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Report Error Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCategory, setReportCategory] = useState("Payment Verification");
  const [reportMessage, setReportMessage] = useState("");
  const [reportOrderId, setReportOrderId] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  const plan = subDetails?.plan || "free";

  useEffect(() => {
    getUserSubscriptionDetails().then(setSubDetails);

    const loadUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        setEmail(user.email || "");
      }

      const savedBiz = localStorage.getItem("stockledger_business_name");
      if (savedBiz) {
        setBusinessName(savedBiz);
      } else if (user?.email) {
        const defaultName = `${user.email.split("@")[0]}'s Wholesale`;
        setBusinessName(defaultName);
      }

      const currentCur = getSavedCurrency();
      setSelectedCurrency(currentCur.code);
    };
    loadUser();

    const handlePlanUpdate = () => {
      getUserSubscriptionDetails().then(setSubDetails);
    };
    window.addEventListener("plan_updated", handlePlanUpdate);
    return () => window.removeEventListener("plan_updated", handlePlanUpdate);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (businessName.trim()) {
      localStorage.setItem("stockledger_business_name", businessName.trim());
      window.dispatchEvent(new Event("profile_updated"));
    }
    saveCurrency(selectedCurrency);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  // Export User Data as JSON
  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const supabase = createClient();
      const [
        { data: customers },
        { data: invoices },
        { data: payments },
        { data: orders },
      ] = await Promise.all([
        supabase.from("customers").select("*"),
        supabase.from("invoices").select("*"),
        supabase.from("payments").select("*"),
        supabase.from("orders").select("*"),
      ]);

      const backupData = {
        exportDate: new Date().toISOString(),
        businessName,
        accountEmail: email,
        customers: customers || [],
        invoices: invoices || [],
        payments: payments || [],
        orders: orders || [],
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `StockLedger_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export backup. Please check your network connection.");
    } finally {
      setExportLoading(false);
    }
  };

  const handleCopyDiagnostic = () => {
    const diagnostic = `[StockLedger Support Report]
Timestamp: ${new Date().toISOString()}
User Email: ${email}
User ID: ${userId}
Plan: ${subDetails?.plan} (${subDetails?.tier || "none"})
Days Remaining: ${subDetails?.daysRemaining ?? 0}
Category: ${reportCategory}
Order ID: ${reportOrderId || "N/A"}
Message: ${reportMessage || "(No message entered)"}
`;
    navigator.clipboard.writeText(diagnostic);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 3000);
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    setReportSent(true);
  };

  // Progress percentage for subscription duration
  const totalDays = subDetails?.totalDurationDays || 90;
  const daysLeft = subDetails?.daysRemaining || 0;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((daysLeft / totalDays) * 100))
  );

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            Settings & Preferences
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage your account, wholesale preferences, subscription countdown, and legal policies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Report Issue
          </button>
          <a
            href="https://t.me/Venlix25"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-blue-600" /> Support
          </a>
        </div>
      </div>

      {savedMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3 text-green-700 text-sm animate-fade-in">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span>Your settings have been saved successfully!</span>
        </div>
      )}

      {/* SECTION 1: Subscription Status & Countdown */}
      <div className="card border-2 border-blue-100 bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/30 p-6 rounded-3xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                plan === "pro"
                  ? "bg-green-100 text-green-700"
                  : subDetails?.isExpired
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {plan === "pro" ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <Zap className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">
                  {plan === "pro"
                    ? `StockLedger Pro — ${subDetails?.tier === "yearly" ? "Yearly Plan" : "Quarterly Plan"}`
                    : subDetails?.isExpired
                    ? "StockLedger Pro (Expired)"
                    : "Starter Free Tier"}
                </h3>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                    plan === "pro"
                      ? "bg-green-100 text-green-700"
                      : subDetails?.isExpired
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {plan === "pro" ? "Active" : subDetails?.isExpired ? "Expired" : "Free"}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                {plan === "pro"
                  ? "Unlimited invoices, customers, overdue tracking, and all 10 currencies."
                  : subDetails?.isExpired
                  ? "Your Pro period has ended. Accounts automatically revert to the Free Starter tier."
                  : "Free tier capped at 5 customers and 10 invoices."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/pricing"
              className="py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              {plan === "pro" ? "Extend / Renew Plan" : "View Plans & Upgrade"}
            </Link>
          </div>
        </div>

        {/* Detailed Countdown if Pro or Expired */}
        {subDetails && subDetails.expiresAt && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-gray-600 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                {plan === "pro" ? "Subscription Remaining" : "Status"}
              </span>
              <span className={plan === "pro" ? "text-blue-900 font-bold" : "text-red-600 font-bold"}>
                {plan === "pro"
                  ? `${subDetails.daysRemaining} Days Remaining`
                  : "0 Days Remaining (Expired)"}
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  plan === "pro"
                    ? progressPercent > 20
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600"
                      : "bg-amber-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${plan === "pro" ? progressPercent : 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
              <span>
                Started:{" "}
                <strong>
                  {subDetails.startsAt ? new Date(subDetails.startsAt).toLocaleDateString() : "Active"}
                </strong>
              </span>
              <span>
                Expires:{" "}
                <strong className={plan === "pro" ? "text-gray-700" : "text-red-600"}>
                  {new Date(subDetails.expiresAt).toLocaleDateString()}
                </strong>
              </span>
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Non-recurring cryptocurrency billing · Early renewals automatically extend your expiration.</span>
          <span className="font-semibold text-gray-700">Quarterly: $25 / 90d · Yearly: $79 / 365d</span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 2: Business Profile & Account */}
        <div className="card">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-600" />
            Business Profile & Account
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Business / Merchant Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Acme Wholesale Ltd."
                className="input-field"
                required
              />
              <p className="text-[11px] text-gray-400 mt-1">Appears on invoices and customer receipts.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Account Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="input-field bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-[11px] text-gray-400 mt-1">Managed via Supabase Authentication.</p>
            </div>
          </div>
        </div>

        {/* SECTION 3: Currency & Regional Configuration */}
        <div className="card">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-600" />
            Currency & Regional Settings
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Choose the default currency for recording customer payments and generating invoices.
          </p>
          <div className="max-w-md">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Default Wholesale Currency
            </label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="input-field"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Save Preferences Button */}
        <div className="flex items-center justify-between pt-2">
          <button type="submit" className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" /> Save Profile & Currency
          </button>
        </div>
      </form>

      {/* SECTION 4: Data Management & Backup */}
      <div className="card">
        <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Download className="w-5 h-5 text-indigo-600" />
          Data Management & Local Backups
        </h3>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          Download a complete local JSON backup of your customers, invoices, payments, and orders. Zero vendor lock-in.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportData}
            disabled={exportLoading}
            className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            {exportLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4 text-gray-600" />
            )}
            {exportLoading ? "Generating Backup..." : "Export Business Data (JSON)"}
          </button>
        </div>
      </div>

      {/* SECTION 5: Policies, Legal Terms & Consent */}
      <div className="card">
        <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-700" />
          Legal Policies & Compliance
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Review our service terms, non-custodial crypto payment policy, and security architecture.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/legal/terms"
            className="p-3.5 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 group-hover:text-blue-700">Terms of Service</p>
                <p className="text-[11px] text-gray-400">Fixed-period usage and rights</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600" />
          </Link>

          <Link
            href="/legal/privacy"
            className="p-3.5 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-700">Privacy Policy</p>
                <p className="text-[11px] text-gray-400">Data ownership & RLS protection</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600" />
          </Link>

          <Link
            href="/legal/payment-policy"
            className="p-3.5 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 group-hover:text-amber-700">Payment & Subscription Policy</p>
                <p className="text-[11px] text-gray-400">Crypto non-recurring billing</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-amber-600" />
          </Link>

          <Link
            href="/legal/refund"
            className="p-3.5 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 group-hover:text-purple-700">Refund Policy</p>
                <p className="text-[11px] text-gray-400">On-chain transaction rules</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-600" />
          </Link>
        </div>
      </div>

      {/* SECTION 6: Account Actions (Sign Out / Switch) */}
      <div className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-red-100 bg-red-50/20">
        <div>
          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-gray-600" /> Active Session
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Signed in as <strong>{email}</strong>. Logging out ends your secure browser session.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-red-600 bg-white hover:bg-red-50 border border-red-200 transition-colors shadow-sm whitespace-nowrap"
        >
          <LogOut className="w-4 h-4 text-red-500" /> Sign Out
        </button>
      </div>

      {/* REPORT ISSUE MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 sm:p-7">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Report an Issue / Bug</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowReportModal(false);
                  setReportSent(false);
                }}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {reportSent ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-gray-900">Report Ready to Send</h4>
                <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                  For the fastest response, reach out to our official support team directly on Telegram with your diagnostic details:
                </p>
                <div className="pt-2 flex flex-col gap-2">
                  <a
                    href="https://t.me/Venlix25"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" /> Contact @Venlix25 on Telegram
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyDiagnostic}
                    className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" /> {copiedReport ? "Diagnostic Copied!" : "Copy Diagnostic Info"}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Issue Category</label>
                  <select
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value)}
                    className="input-field text-xs"
                  >
                    <option value="Payment Verification">Payment / Verification Issue</option>
                    <option value="Invoice Calculation">Invoice or Customer Data Bug</option>
                    <option value="Account Login">Login / Authentication Issue</option>
                    <option value="Feature Request">Feedback / Feature Request</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Order ID (Optional, if payment-related)
                  </label>
                  <input
                    type="text"
                    value={reportOrderId}
                    onChange={(e) => setReportOrderId(e.target.value)}
                    placeholder="e.g. order_uuid or NOWPayments invoice ID"
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={4}
                    value={reportMessage}
                    onChange={(e) => setReportMessage(e.target.value)}
                    placeholder="Describe what happened or what error message appeared..."
                    className="input-field text-xs"
                    required
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleCopyDiagnostic}
                    className="text-xs text-gray-500 hover:text-gray-800 font-semibold inline-flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" /> {copiedReport ? "Copied!" : "Copy Diagnostics"}
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowReportModal(false)}
                      className="px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition-colors"
                    >
                      Submit Report
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="Upgrade to StockLedger Pro for unlimited invoicing, customers, and priority features."
      />
    </div>
  );
}
