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
  Inbox,
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
import { getSavedCurrency, formatMoney, type CurrencyConfig } from "@/lib/currency";

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [userName, setUserName] = useState<string>("Merchant");
  const [currency, setCurrency] = useState<CurrencyConfig>(getSavedCurrency());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCurrency(getSavedCurrency());

    const onCurrencyChange = () => {
      setCurrency(getSavedCurrency());
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

      setInvoices(inv || []);
      setPayments(pay || []);
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
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);

  const totalOutstanding = invoices
    .filter((i) => i.status !== "paid")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const paidThisMonth = payments
    .filter((p) => {
      const d = new Date(p.payment_date);
      return d >= currentMonthStart && d <= currentMonthEnd;
    })
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalCount = invoices.length;
  const pendingCount = invoices.filter((i) => i.status === "pending").length;
  const overdueCount = invoices.filter((i) => {
    if (i.status === "paid") return false;
    const due = new Date(i.due_date);
    return isBefore(due, now);
  }).length;
  const paidCount = invoices.filter((i) => i.status === "paid").length;

  // Invoices due soon (within 7 days and unpaid)
  const dueSoonInvoices = invoices.filter((i) => {
    if (i.status === "paid") return false;
    const dueDate = new Date(i.due_date);
    return isBefore(dueDate, addDays(now, 7));
  });

  // Dynamic 6-month chart data from real database
  const dynamicChartData = [5, 4, 3, 2, 1, 0].map((monthsAgo) => {
    const date = subMonths(now, monthsAgo);
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    const paidSum = payments
      .filter((p) => {
        const d = new Date(p.payment_date);
        return d >= start && d <= end;
      })
      .reduce((s, p) => s + Number(p.amount), 0);

    const pendingSum = invoices
      .filter((inv) => {
        const d = new Date(inv.created_at);
        return inv.status !== "paid" && d >= start && d <= end;
      })
      .reduce((s, inv) => s + Number(inv.amount), 0);

    return {
      month: format(date, "MMM"),
      paid: paidSum,
      pending: pendingSum,
    };
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {userName}! 👋
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Here&apos;s what&apos;s happening with your business today.
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

      {/* Due Soon Alert */}
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
          value={formatMoney(totalOutstanding, currency)}
          subtitle={`${pendingCount + overdueCount} invoices pending`}
          icon={DollarSign}
          color="orange"
          trend="Needs collection"
        />
        <StatCard
          title="Paid This Month"
          value={formatMoney(paidThisMonth, currency)}
          subtitle={`${payments.length} payment${payments.length === 1 ? "" : "s"} recorded`}
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
            {invoices.length > 0 && (
              <Link
                href="/invoices"
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {invoices.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-gray-200 rounded-2xl">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-base font-semibold text-gray-800">No invoices yet</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Create your first invoice to start tracking customer balances and receivables.
              </p>
              <Link
                href="/invoices/new"
                className="inline-flex items-center gap-1.5 mt-4 btn-primary text-xs py-2 px-4"
              >
                <Plus className="w-3.5 h-3.5" /> Create First Invoice
              </Link>
            </div>
          ) : (
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
                        {formatMoney(inv.amount, currency)}
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
          )}
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
                {paidCount}
              </span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-amber-50 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-sm font-medium text-gray-700">Pending</span>
              </div>
              <span className="text-sm font-bold text-amber-700">
                {pendingCount}
              </span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-red-50 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-sm font-medium text-gray-700">Overdue</span>
              </div>
              <span className="text-sm font-bold text-red-700">
                {overdueCount}
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
                formatter={(val) => [formatMoney(val as number, currency), ""]}
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
            {payments.length > 0 && (
              <Link href="/payments" className="text-xs text-blue-600 font-medium">
                View all
              </Link>
            )}
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-10 px-4 border border-dashed border-gray-200 rounded-2xl">
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                <CreditCard className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-gray-800">No payments yet</p>
              <p className="text-xs text-gray-500 mt-1">
                Recorded payments will automatically appear here.
              </p>
            </div>
          ) : (
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
                    +{formatMoney(pay.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
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
