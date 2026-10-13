"use client";
import { useState } from "react";
import { setUserPlan } from "@/lib/plan";
import {
  X,
  Zap,
  Check,
  ShieldCheck,
  Sparkles,
  Users,
  FileText,
  CreditCard,
} from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  reason = "Unlock unlimited growth for your wholesale business.",
}: UpgradeModalProps) {
  const [activated, setActivated] = useState(false);

  if (!isOpen) return null;

  const handleActivatePro = () => {
    setUserPlan("pro");
    setActivated(true);
    setTimeout(() => {
      onClose();
      window.location.reload();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 sm:p-8 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-2xl shadow-lg shadow-orange-200 text-white mb-3">
            <Zap className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Upgrade to StockLedger Pro
          </h2>
          <p className="text-sm text-gray-600 mt-1.5 max-w-md mx-auto">
            {reason}
          </p>
        </div>

        {/* Feature comparison */}
        <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
              Free Starter
            </span>
            <ul className="text-xs text-gray-600 space-y-2">
              <li className="flex items-center gap-1.5">
                <span className="text-gray-400">•</span> Up to 5 Customers
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-gray-400">•</span> Up to 10 Invoices
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-gray-400">•</span> Basic Dashboard
              </li>
            </ul>
          </div>
          <div className="border-l border-slate-200 pl-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Pro Plan
            </span>
            <ul className="text-xs text-gray-800 space-y-2 font-medium">
              <li className="flex items-center gap-1.5 text-blue-700">
                <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />{" "}
                Unlimited Customers
              </li>
              <li className="flex items-center gap-1.5 text-blue-700">
                <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />{" "}
                Unlimited Invoices & Payments
              </li>
              <li className="flex items-center gap-1.5 text-blue-700">
                <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />{" "}
                Overdue Alerts & Due-Dates
              </li>
              <li className="flex items-center gap-1.5 text-blue-700">
                <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />{" "}
                All 10 Global Currencies
              </li>
            </ul>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-2xl border border-gray-200 bg-white hover:border-blue-400 transition-all text-center">
            <p className="text-xs font-semibold text-gray-500">Monthly Plan</p>
            <div className="mt-1">
              <span className="text-2xl font-extrabold text-gray-900">$9</span>
              <span className="text-xs text-gray-500"> / month</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Cancel anytime</p>
          </div>

          <div className="relative p-4 rounded-2xl border-2 border-orange-500 bg-orange-50/40 text-center shadow-sm">
            <span className="absolute -top-2.5 right-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Early Bird Deal
            </span>
            <p className="text-xs font-semibold text-orange-900">Lifetime Pass</p>
            <div className="mt-1">
              <span className="text-2xl font-extrabold text-gray-900">$49</span>
              <span className="text-xs text-gray-600"> one-time</span>
            </div>
            <p className="text-[11px] text-orange-700 font-medium mt-1">
              Pay once, use forever
            </p>
          </div>
        </div>

        {/* Activation Actions */}
        {activated ? (
          <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-center rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            Pro Plan Activated Successfully! Reloading...
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={handleActivatePro}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-white" /> Activate Pro Plan Now
            </button>
            <p className="text-[11px] text-center text-gray-400">
              For custom payment (Wise, Wire Transfer, Stripe), contact:{" "}
              <a
                href="mailto:support@stockledger.app"
                className="text-blue-600 underline font-medium"
              >
                support@stockledger.app
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
