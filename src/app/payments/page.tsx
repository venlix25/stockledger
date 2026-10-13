"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Payment, Customer, Invoice } from "@/types";
import { Plus, CreditCard, Search } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { getSavedCurrency, formatMoney } from "@/lib/currency";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("$");

  useEffect(() => {
    setCurrencySymbol(getSavedCurrency().symbol);
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("payments")
        .select("*, customer:customers(name), invoice:invoices(invoice_number)")
        .order("payment_date", { ascending: false });
      setPayments(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = payments.filter((p) =>
    (p.customer as any)?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payments</h2>
          <p className="text-gray-500 text-sm mt-1">Total collected: <span className="font-bold text-green-600">{formatMoney(totalPaid, currencySymbol)}</span></p>
        </div>
        <Link href="/payments/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Record Payment
        </Link>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-9"
        />
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No payments recorded yet</p>
            <Link href="/payments/new" className="text-blue-600 text-sm font-medium mt-2 inline-block">
              Record first payment →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-xs text-gray-500">
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Invoice</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Method</th>
                <th className="px-6 py-4 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-800">
                    {(p.customer as any)?.name || "—"}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">
                    {(p.invoice as any)?.invoice_number || "—"}
                  </td>
                  <td className="px-6 py-4 font-bold text-green-600">
                    +{formatMoney(p.amount, currencySymbol)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full capitalize font-medium">
                      {p.method || "cash"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {format(new Date(p.payment_date), "MMM d, yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
