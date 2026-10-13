"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/StatusBadge";
import type { Invoice } from "@/types";
import { Plus, Search, FileText, Trash2, CheckSquare } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { getSavedCurrency, formatMoney } from "@/lib/currency";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "pending" | "overdue">("all");
  const [currencySymbol, setCurrencySymbol] = useState("$");

  const loadInvoices = async () => {
    setCurrencySymbol(getSavedCurrency().symbol);
    const supabase = createClient();
    const { data } = await supabase
      .from("invoices")
      .select("*, customer:customers(name)")
      .order("created_at", { ascending: false });
    setInvoices(data || []);
    setLoading(false);
  };

  useEffect(() => { loadInvoices(); }, []);

  const handleMarkPaid = async (id: string) => {
    const supabase = createClient();
    await supabase.from("invoices").update({ status: "paid" }).eq("id", id);
    loadInvoices();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this invoice?")) return;
    const supabase = createClient();
    await supabase.from("invoices").delete().eq("id", id);
    loadInvoices();
  };

  const filtered = invoices.filter((inv) => {
    const matchSearch = (inv.customer as any)?.name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoice_number.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || inv.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
          <p className="text-gray-500 text-sm mt-1">{invoices.length} total invoices</p>
        </div>
        <Link href="/invoices/new" className="btn-primary">
          <Plus className="w-4 h-4" /> New Invoice
        </Link>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search customer or invoice #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "paid", "pending", "overdue"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                filter === f
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No invoices found</p>
            <Link href="/invoices/new" className="text-blue-600 text-sm font-medium mt-2 inline-block">
              Create your first invoice →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-xs text-gray-500">
                <th className="px-6 py-4 font-semibold">Invoice #</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Due Date</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{inv.invoice_number}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">
                    {(inv.customer as any)?.name || "—"}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">{formatMoney(inv.amount, currencySymbol)}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {format(new Date(inv.due_date), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {inv.status !== "paid" && (
                        <button
                          onClick={() => handleMarkPaid(inv.id)}
                          className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                          title="Mark as paid"
                        >
                          <CheckSquare className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(inv.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
