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
  Keyboard,
  Sun,
  Moon,
  Sparkle,
} from "lucide-react";
import { clsx } from "clsx";
import { getSavedTheme, saveTheme, ThemeMode } from "@/lib/theme";

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
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>("light");

  const plan = subDetails?.plan || "free";

  useEffect(() => {
    setCurrentTheme(getSavedTheme());
    const onThemeChanged = (e: any) => {
      if (e?.detail) setCurrentTheme(e.detail);
    };
    window.addEventListener("stockledger_theme_changed", onThemeChanged);

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
      window.removeEventListener("stockledger_theme_changed", onThemeChanged);
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleCycleTheme = () => {
    const nextTheme: ThemeMode =
      currentTheme === "light" ? "dark" : currentTheme === "dark" ? "midnight" : "light";
    setCurrentTheme(nextTheme);
    saveTheme(nextTheme);
  };

  const handleOpenShortcuts = () => {
    window.dispatchEvent(new CustomEvent("stockledger_open_shortcuts"));
  };

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 min-h-screen flex flex-col shadow-sm transition-colors duration-200">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm shadow-blue-200">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">StockLedger</h1>
            <p className="text-xs text-gray-400">Invoices & Payments</p>
          </div>
        </Link>
      </div>

      {/* User Greeting + Quick Theme Button */}
      <div className="px-4 py-3.5 border-b border-gray-50 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Workspace</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
            {isAuthenticated
              ? (userName ? `Hello, ${userName} 👋` : "Hello 👋")
              : "Showcase Visitor 👋"}
          </p>
        </div>
        <button
          onClick={handleCycleTheme}
          title={`Current Theme: ${currentTheme.toUpperCase()} (Click or press 'T' to switch)`}
          className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 transition-colors flex-shrink-0"
        >
          {currentTheme === "light" ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : currentTheme === "dark" ? (
            <Moon className="w-4 h-4 text-blue-400" />
          ) : (
            <Sparkles className="w-4 h-4 text-indigo-400" />
          )}
        </button>
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
                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/60 hover:text-gray-800 dark:hover:text-gray-200"
              )}
            >
              <Icon
                className={clsx(
                  "w-5 h-5",
                  active ? "text-blue-600 dark:text-blue-400" : "text-gray-400"
                )}
              />
              {label}
            </Link>
          );
        })}

        {/* Shortcuts & Guide Trigger */}
        <button
          onClick={handleOpenShortcuts}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/60 hover:text-gray-800 dark:hover:text-gray-200 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <Keyboard className="w-5 h-5 text-gray-400" />
            <span>Shortcuts & Guide</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-[10px] font-mono border border-gray-200 dark:border-slate-700 text-gray-500">
            ?
          </kbd>
        </button>
      </nav>

      {/* Plan Status or Showcase Card */}
      {isAuthenticated ? (
        <div className="mx-3 mb-3 p-3.5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/60 border border-blue-100/60 dark:border-slate-700 rounded-2xl">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              {plan === "pro" ? (
                <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              )}
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                {plan === "pro" ? "Pro Unlimited" : subDetails?.isExpired ? "Pro Expired" : "Free Plan"}
              </span>
            </div>
            <span
              className={clsx(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase",
                plan === "pro"
                  ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                  : subDetails?.isExpired
                  ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              )}
            >
              {plan === "pro"
                ? `${subDetails?.daysRemaining ?? 0}d Left`
                : subDetails?.isExpired
                ? "Expired"
                : "5 Cust. Max"}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2.5">
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
        <div className="mx-3 mb-3 p-3.5 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800/60 border border-indigo-100/80 dark:border-slate-700 rounded-2xl">
          <div className="flex items-center gap-1.5 mb-1 text-xs font-bold text-indigo-900 dark:text-indigo-200">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Product Showcase</span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2.5 leading-relaxed">
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
      <div className="px-3 pb-4 pt-2 border-t border-gray-100 dark:border-slate-800">
        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            Sign Out
          </button>
        ) : (
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all"
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
