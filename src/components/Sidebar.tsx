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

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string>("Merchant");

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check saved business name first
        const savedBizName = localStorage.getItem("stockledger_business_name");
        if (savedBizName) {
          setUserName(savedBizName);
        } else if (user.user_metadata?.full_name) {
          setUserName(user.user_metadata.full_name);
        } else if (user.email) {
          const prefix = user.email.split("@")[0];
          setUserName(prefix.charAt(0).toUpperCase() + prefix.slice(1));
        }
      }
    };
    fetchUser();

    const handleProfileUpdate = () => {
      const savedBizName = localStorage.getItem("stockledger_business_name");
      if (savedBizName) setUserName(savedBizName);
    };
    window.addEventListener("profile_updated", handleProfileUpdate);
    return () => window.removeEventListener("profile_updated", handleProfileUpdate);
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
        <p className="text-xs text-gray-400">Signed in as</p>
        <p className="text-sm font-semibold text-gray-800 truncate">{userName} 👋</p>
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

      {/* Motivational Card (from Concept 3) */}
      <div className="mx-3 mb-3 p-3.5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/60 rounded-2xl">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-blue-900">Get Paid On Time</span>
        </div>
        <p className="text-[11px] text-blue-700 leading-relaxed">
          Your business grows when cash flow stays steady.
        </p>
      </div>

      {/* Logout */}
      <div className="px-3 pb-4 pt-2 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-4 h-4 text-red-500" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
