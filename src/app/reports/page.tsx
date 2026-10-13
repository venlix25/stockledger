"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import StatCard from "@/components/StatCard";
import type { Invoice, Payment } from "@/types";
import { DollarSign, FileText, CheckCircle, Clock, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { getSavedCurrency, formatMoney } from "@/lib/currency";

const COLORS = ["#22c55e", "#f59e0b", "#ef4444"];

export default function ReportsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState("$");

  useEffect(() => {
    setCurrencySymbol(getSavedCurrency().symbol);
    const load = async () => {
      const supabase = createClient();
      const [{ data: inv }, { data: pay }] = await Promise.all([
        supabase.from("invoices").select("*").order("created_at"),
        supabase.from("payments").select("*").order("payment_date"),
      ]);
      setInvoices(inv || []);
      setPayments(pay || []);
      setLoading(false);
    };
    load();
  }, []);

  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalOutstanding = invoices.filter(i => i.status !== "paid").reduce((s, i) => s + Number(i.amount), 0);
  const paidCount = invoices.filter(i => i.status === "paid").length;
  const pendingCount = invoices.filter(i => i.status === "pending").length;
  const overdueCount = invoices.filter(i => i.status === "overdue").length;

  // Monthly revenue for bar chart (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const revenue = payments
      .filter(p => {
        const d = new Date(p.payment_date);
        return d >= start && d <= end;
      })
      .reduce((s, p) => s + Number(p.amount), 0);
    return { month: format(date, "MMM"), revenue };
  });

  // Pie data
  const pieData = [
    { name: "Paid", value: paidCount },
    { name: "Pending", value: pendingCount },
    { name: "Overdue", value: overdueCount },
  ].filter(d => d.value > 0);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
        <p className="text-gray-500 text-sm mt-1">Your business performance at a glance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Revenue" value={formatMoney(totalRevenue, currencySymbol)} icon={DollarSign} color="green" subtitle="All time collected" />
        <StatCard title="Outstanding" value={formatMoney(totalOutstanding, currencySymbol)} icon={Clock} color="orange" subtitle="Yet to collect" />
        <StatCard title="Paid Invoices" value={String(paidCount)} icon={CheckCircle} color="blue" subtitle="Successfully paid" />
        <StatCard title="Total Invoices" value={String(invoices.length)} icon={FileText} color="purple" subtitle="All time" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue */}
        <div className="lg:col-span-2 card">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Monthly Revenue (Last 6 Months)
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} barSize={24}>
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }}
                formatter={(val) => [formatMoney(val as number, currencySymbol), "Revenue"]}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Invoice Status Pie */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Invoice Status</h3>
          {pieData.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [val, "Invoices"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Summary Table */}
      <div className="card mt-6">
        <h3 className="font-bold text-gray-900 mb-4">Business Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 rounded-xl text-center">
            <p className="text-xs text-gray-500 mb-1">Collection Rate</p>
            <p className="text-2xl font-bold text-green-700">
              {invoices.length > 0 ? Math.round((paidCount / invoices.length) * 100) : 0}%
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl text-center">
            <p className="text-xs text-gray-500 mb-1">Avg Invoice</p>
            <p className="text-2xl font-bold text-blue-700">
              {formatMoney(invoices.length > 0 ? (invoices.reduce((s, i) => s + Number(i.amount), 0) / invoices.length) : 0, currencySymbol)}
            </p>
          </div>
          <div className="p-4 bg-orange-50 rounded-xl text-center">
            <p className="text-xs text-gray-500 mb-1">Overdue</p>
            <p className="text-2xl font-bold text-orange-700">{overdueCount}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl text-center">
            <p className="text-xs text-gray-500 mb-1">Total Payments</p>
            <p className="text-2xl font-bold text-purple-700">{payments.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
