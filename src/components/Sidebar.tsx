"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  BarChart2,
  Settings,
  BookOpen,
  LogOut,
  Sparkles,
} from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/reports", label: "Reports", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

import { getUserSubscriptionDetails, type SubscriptionDetails, type UserPlan } from "@/lib/plan";
import UpgradeModal from "@/components/UpgradeModal";
import { Zap, ShieldCheck } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");
  const [subDetails, setSubDetails] = useState<SubscriptionDetails | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  const plan = subDetails?.plan || "free";

  useEffect(() => {
    getUserSubscriptionDetails().then(setSubDetails);

    const handlePlanUpdate = () => {
      getUserSubscriptionDetails().then(setSubDetails);
    };
    window.addEventListener("plan_updated", handlePlanUpdate);

    const fetchUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setIsAuthenticated(true);
        if (user.user_metadata?.full_name) {
          setUserName(user.user_metadata.full_name);
        } else if (user.user_metadata?.name) {
          setUserName(user.user_metadata.name);
        } else if (user.email) {
          const prefix = user.email.split("@")[0];
          setUserName(prefix.charAt(0).toUpperCase() + prefix.slice(1));
        } else {
          setUserName("User");
        }
      } else {
        setIsAuthenticated(false);
        setUserName("");
      }
    };
    fetchUser();

    return () => {
      window.removeEventListener("plan_updated", handlePlanUpdate);
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-100 min-h-screen flex flex-col shadow-sm">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm shadow-blue-200">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">StockLedger</h1>
            <p className="text-xs text-gray-400">Invoices & Payments</p>
          </div>
        </Link>
      </div>

      {/* User Greeting */}
      <div className="px-5 py-4 border-b border-gray-50 bg-slate-50/50">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {isAuthenticated
            ? (userName ? `Hello, ${userName} 👋` : "Hello 👋")
            : "Showcase Visitor 👋"}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                active
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              )}
            >
              <Icon
                className={clsx(
                  "w-5 h-5",
                  active ? "text-blue-600" : "text-gray-400"
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Plan Status or Showcase Card */}
      {isAuthenticated ? (
        <div className="mx-3 mb-3 p-3.5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/60 rounded-2xl">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              {plan === "pro" ? (
                <ShieldCheck className="w-4 h-4 text-green-600" />
              ) : (
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              )}
              <span className="text-xs font-bold text-gray-900">
                {plan === "pro" ? "Pro Unlimited" : subDetails?.isExpired ? "Pro Expired" : "Free Plan"}
              </span>
            </div>
            <span
              className={clsx(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase",
                plan === "pro"
                  ? "bg-green-100 text-green-700"
                  : subDetails?.isExpired
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-800"
              )}
            >
              {plan === "pro"
                ? `${subDetails?.daysRemaining ?? 0}d Left`
                : subDetails?.isExpired
                ? "Expired"
                : "5 Cust. Max"}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mb-2.5">
            {plan === "pro"
              ? subDetails?.daysRemaining && subDetails.daysRemaining > 0
                ? `${subDetails.daysRemaining} days left · ${subDetails.tier === "yearly" ? "Yearly" : "Quarterly"}`
                : "Unlimited invoices, customers & global currencies."
              : subDetails?.isExpired
              ? "Your subscription has ended. Renew now to restore unlimited access."
              : "Free tier capped at 5 customers & 10 invoices."}
          </p>
          {plan === "free" && (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full py-1.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1"
            >
              <Zap className="w-3.5 h-3.5 fill-white" /> {subDetails?.isExpired ? "Renew Pro Plan" : "Upgrade to Pro"}
            </button>
          )}
        </div>
      ) : (
        <div className="mx-3 mb-3 p-3.5 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100/80 rounded-2xl">
          <div className="flex items-center gap-1.5 mb-1 text-xs font-bold text-indigo-900">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Product Showcase</span>
          </div>
          <p className="text-[11px] text-gray-500 mb-2.5 leading-relaxed">
            Test-driving wholesale ledger features. Create a free account to track your real business.
          </p>
          <Link
            href="/"
            className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1 text-center"
          >
            Create Free Account →
          </Link>
        </div>
      )}

      {/* Logout or Sign In */}
      <div className="px-3 pb-4 pt-2 border-t border-gray-100">
        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            Sign Out
          </button>
        ) : (
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-all"
          >
            Sign In / Register
          </Link>
        )}
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="Upgrade to StockLedger Pro for unlimited invoicing, customers, and priority features."
      />
    </aside>
  );
}
