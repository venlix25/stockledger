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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getUserPlan, setUserPlan, PLAN_LIMITS, type UserPlan } from "@/lib/plan";
import UpgradeModal from "@/components/UpgradeModal";

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [savedMessage, setSavedMessage] = useState(false);
  const [plan, setPlan] = useState<UserPlan>("free");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    setPlan(getUserPlan());

    const loadUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
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

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          Settings
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Manage your business profile, international currency, and preferences
        </p>
      </div>

      {savedMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3 text-green-700 text-sm">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span>Your settings have been saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Profile */}
        <div className="card">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-600" />
            Business Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Acme Wholesale Ltd."
                className="input-field"
                required
              />
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
            </div>
          </div>
        </div>

        {/* Currency & Internationalization */}
        <div className="card">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-600" />
            Currency & Region
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Choose your preferred currency for invoices, reports, and payments.
          </p>
          <div className="max-w-md">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Default Currency
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

        {/* Subscription / Plan Card */}
        <div className="card border-blue-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {plan === "pro" ? (
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                ) : (
                  <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                )}
                <h3 className="text-base font-bold text-gray-900">
                  Current Plan: {plan === "pro" ? "Pro Unlimited ($9/mo)" : "Starter (Free Tier)"}
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                {plan === "pro"
                  ? "Full unlimited access to invoices, customers, due alerts, and all currencies."
                  : "Free tier limited to 5 customers and 10 invoices."}
              </p>
            </div>
            <span
              className={`px-3 py-1 font-semibold text-xs rounded-full ${
                plan === "pro"
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {plan === "pro" ? "Pro Active" : "Free Tier"}
            </span>
          </div>

          <div className="mt-4 pt-4 border-t border-blue-100 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Pro Plan: <strong>$9/month</strong> or <strong>$49 Lifetime</strong>
            </div>
            {plan === "free" ? (
              <button
                type="button"
                onClick={() => setShowUpgradeModal(true)}
                className="py-1.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-1"
              >
                <Zap className="w-3.5 h-3.5 fill-white" /> Upgrade to Pro
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setUserPlan("free");
                  setPlan("free");
                }}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Switch to Free (Test Mode)
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button type="submit" className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" /> Save Preferences
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </form>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="Upgrade to StockLedger Pro for unlimited invoicing, customers, and priority features."
      />
    </div>
  );
}
