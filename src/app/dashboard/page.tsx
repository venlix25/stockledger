"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import StatCard from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import {
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  Plus,
  UserPlus,
  CreditCard,
  Bell,
  TrendingUp,
  ArrowRight,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { Invoice, Payment } from "@/types";
import { format, subMonths, startOfMonth, endOfMonth, isBefore, addDays } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getSavedCurrency, formatMoney } from "@/lib/currency";

// Sample showcase data directly from design blueprint (shown if DB has no invoices yet)
const DEMO_INVOICES: any[] = [
  { id: "demo-1", invoice_number: "INV-10021", customer: { name: "Min Naing Trade" }, amount: 450, status: "pending", due_date: format(addDays(new Date(), 2), "yyyy-MM-dd"), created_at: new Date().toISOString() },
  { id: "demo-2", invoice_number: "INV-10020", customer: { name: "Shwe Pyi Thar" }, amount: 320, status: "paid", due_date: format(subDays(new Date(), 3), "yyyy-MM-dd"), created_at: new Date().toISOString() },
  { id: "demo-3", invoice_number: "INV-10019", customer: { name: "Kyaw Win Wholesale" }, amount: 780, status: "pending", due_date: format(addDays(new Date(), 4), "yyyy-MM-dd"), created_at: new Date().toISOString() },
  { id: "demo-4", invoice_number: "INV-10018", customer: { name: "Moe Moe Store" }, amount: 210, status: "paid", due_date: format(subDays(new Date(), 5), "yyyy-MM-dd"), created_at: new Date().toISOString() },
  { id: "demo-5", invoice_number: "INV-10017", customer: { name: "Aung Myint Co." }, amount: 640, status: "overdue", due_date: format(subDays(new Date(), 2), "yyyy-MM-dd"), created_at: new Date().toISOString() },
];

const DEMO_PAYMENTS: any[] = [
  { id: "pay-1", customer: { name: "Shwe Pyi Thar" }, amount: 320, payment_date: format(subDays(new Date(), 2), "yyyy-MM-dd"), method: "bank_transfer" },
  { id: "pay-2", customer: { name: "Moe Moe Store" }, amount: 210, payment_date: format(subDays(new Date(), 4), "yyyy-MM-dd"), method: "cash" },
  { id: "pay-3", customer: { name: "Aung Myint Co." }, amount: 400, payment_date: format(subDays(new Date(), 10), "yyyy-MM-dd"), method: "credit_card" },
  { id: "pay-4", customer: { name: "Min Naing Trade" }, amount: 270, payment_date: format(subDays(new Date(), 15), "yyyy-MM-dd"), method: "online_payment" },
];

function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [userName, setUserName] = useState<string>("Merchant");
  const [currencySymbol, setCurrencySymbol] = useState<string>("$");
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const cur = getSavedCurrency();
    setCurrencySymbol(cur.symbol);

    const onCurrencyChange = () => {
      const updated = getSavedCurrency();
      setCurrencySymbol(updated.symbol);
    };
    window.addEventListener("currency_changed", onCurrencyChange);

    const load = async () => {
      const supabase = createClient();
      const [
        { data: userRes },
        { data: inv },
        { data: pay }
      ] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from("invoices")
          .select("*, customer:customers(name)")
          .order("created_at", { ascending: false }),
        supabase
          .from("payments")
          .select("*, customer:customers(name)")
          .order("payment_date", { ascending: false }),
      ]);

      const user = userRes?.user;
      if (user) {
        const savedBiz = localStorage.getItem("stockledger_business_name");
        if (savedBiz) {
          setUserName(savedBiz);
        } else if (user.user_metadata?.full_name) {
          setUserName(user.user_metadata.full_name);
        } else if (user.email) {
          const prefix = user.email.split("@")[0];
          setUserName(prefix.charAt(0).toUpperCase() + prefix.slice(1));
        }
      }

      if (inv && inv.length > 0) {
        setInvoices(inv);
        setPayments(pay || []);
        setIsDemoMode(false);
      } else {
        // Fallback to demo blueprint data so user immediately sees the rich UI/UX
        setInvoices(DEMO_INVOICES);
        setPayments(DEMO_PAYMENTS);
        setIsDemoMode(true);
      }
      setLoading(false);
    };
    load();

    return () => window.removeEventListener("currency_changed", onCurrencyChange);
  }, []);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const now = new Date();
  const totalOutstanding = invoices
    .filter((i) => i.status !== "paid")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const paidThisMonth = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + Number(i.amount), 0) + (isDemoMode ? 670 : 0);

  const totalCount = isDemoMode ? 12 : invoices.length;
  const pendingCount = invoices.filter((i) => i.status === "pending").length;
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;

  // Invoices due soon
  const dueSoonInvoices = invoices.filter((i) => {
    if (i.status === "paid") return false;
    const dueDate = new Date(i.due_date);
    return isBefore(dueDate, addDays(now, 7));
  });

  // Dynamic 6-month chart data
  const dynamicChartData = Array.from({ length: 6 }, (_, idx) => {
    const date = subMonths(new Date(), 5 - idx);
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    let paidSum = payments
      .filter((p) => {
        const d = new Date(p.payment_date);
        return d >= start && d <= end;
      })
      .reduce((s, p) => s + Number(p.amount), 0);

    let pendingSum = invoices
      .filter((inv) => {
        const d = new Date(inv.created_at);
        return inv.status !== "paid" && d >= start && d <= end;
      })
      .reduce((s, inv) => s + Number(inv.amount), 0);

    if (isDemoMode) {
      // Realistic historical curve from design blueprint
      const demoValues = [
        { paid: 800, pending: 400 },
        { paid: 1200, pending: 600 },
        { paid: 950, pending: 300 },
        { paid: 1400, pending: 800 },
        { paid: 1100, pending: 520 },
        { paid: 1200, pending: 480 },
      ];
      paidSum = demoValues[idx].paid;
      pendingSum = demoValues[idx].pending;
    }

    return {
      month: format(date, "MMM"),
      paid: paidSum,
      pending: pendingSum,
    };
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Demo Banner */}
      {isDemoMode && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white shadow-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold">Interactive Demo Preview</p>
              <p className="text-xs text-blue-100 mt-0.5">
                Showing sample wholesale activity from the design blueprint. Click below to add your own real invoices!
              </p>
            </div>
          </div>
          <Link
            href="/invoices/new"
            className="px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-sm"
          >
            + Create First Invoice
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {userName}! 👋
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Here's what's happening with your business today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/invoices"
            className="relative p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {dueSoonInvoices.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[11px] rounded-full flex items-center justify-center font-bold shadow-sm">
                {dueSoonInvoices.length}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Due Soon Alert (From Concept 3 / Reminders) */}
      {dueSoonInvoices.length > 0 && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                {dueSoonInvoices.length} invoice{dueSoonInvoices.length > 1 ? "s" : ""} require your attention
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Some invoices are overdue or due within the next 7 days. Follow up with your customers to keep cash flow smooth.
              </p>
            </div>
          </div>
          <Link
            href="/invoices"
            className="text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors"
          >
            Review Invoices →
          </Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Total Outstanding"
          value={formatMoney(totalOutstanding, currencySymbol)}
          subtitle={`${pendingCount + overdueCount} invoices pending`}
          icon={DollarSign}
          color="orange"
          trend="Needs collection"
        />
        <StatCard
          title="Paid This Month"
          value={formatMoney(paidThisMonth, currencySymbol)}
          subtitle={`${isDemoMode ? 7 : invoices.filter((i) => i.status === "paid").length} payments received`}
          icon={CheckCircle}
          color="green"
          trend="This month"
        />
        <StatCard
          title="Total Invoices"
          value={String(totalCount)}
          subtitle="All time"
          icon={FileText}
          color="blue"
          trend="Tracked"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Recent Invoices */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">Recent Invoices</h3>
            <Link
              href="/invoices"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.slice(0, 5).map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 font-medium text-gray-800">
                      {(inv.customer as any)?.name || "—"}
                    </td>
                    <td className="py-3 font-semibold text-gray-900">
                      {formatMoney(inv.amount, currencySymbol)}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="py-3 text-gray-500">
                      {format(new Date(inv.due_date), "MMM d")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Status Breakdown */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Payment Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-green-50 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-gray-700">Paid</span>
              </div>
              <span className="text-sm font-bold text-green-700">
                {isDemoMode ? 7 : invoices.filter((i) => i.status === "paid").length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-amber-50 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-sm font-medium text-gray-700">Pending</span>
              </div>
              <span className="text-sm font-bold text-amber-700">
                {isDemoMode ? 4 : pendingCount}
              </span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-red-50 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-sm font-medium text-gray-700">Overdue</span>
              </div>
              <span className="text-sm font-bold text-red-700">
                {isDemoMode ? 1 : overdueCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 card">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Sales Overview (Last 6 Months)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dynamicChartData} barSize={18}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
                }}
                formatter={(val) => [formatMoney(val as number, currencySymbol), ""]}
              />
              <Legend />
              <Bar dataKey="paid" fill="#22c55e" radius={[6, 6, 0, 0]} name="Paid" />
              <Bar dataKey="pending" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Recent Transactions</h3>
            <Link href="/payments" className="text-xs text-blue-600 font-medium">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {payments.slice(0, 4).map((pay) => (
              <div key={pay.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {(pay.customer as any)?.name || "—"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {format(new Date(pay.payment_date), "MMM d")}
                  </p>
                </div>
                <span className="text-sm font-bold text-green-600">
                  +{formatMoney(pay.amount, currencySymbol)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link href="/invoices/new" className="btn-primary">
            <Plus className="w-4 h-4" /> Create Invoice
          </Link>
          <Link href="/customers/new" className="btn-secondary">
            <UserPlus className="w-4 h-4" /> Add Customer
          </Link>
          <Link href="/payments/new" className="btn-secondary">
            <CreditCard className="w-4 h-4" /> Record Payment
          </Link>
        </div>
      </div>
    </div>
  );
}
