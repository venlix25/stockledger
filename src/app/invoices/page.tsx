"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/StatusBadge";
import type { Invoice, InvoiceStatus } from "@/types";
import {
  Plus,
  Search,
  FileText,
  Trash2,
  CheckSquare,
  Download,
  Printer,
  X,
  ChevronDown,
  Check,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { getSavedCurrency, formatMoney } from "@/lib/currency";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "pending" | "overdue">("all");
  const [currencySymbol, setCurrencySymbol] = useState("$");

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Status dropdown open state: invoiceId -> boolean
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);

  // Invoice Print / View Modal
  const [activeModalInvoice, setActiveModalInvoice] = useState<Invoice | null>(null);

  const loadInvoices = async () => {
    setCurrencySymbol(getSavedCurrency().symbol);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("invoices")
      .select("*, customer:customers(name, email, phone, address)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setInvoices(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  // Filter calculations
  const filtered = invoices.filter((inv) => {
    const matchSearch =
      (inv.customer as any)?.name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoice_number.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || inv.status === filter;
    return matchSearch && matchFilter;
  });

  const pendingCount = invoices.filter((i) => i.status === "pending").length;
  const paidCount = invoices.filter((i) => i.status === "paid").length;
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;

  // Single status change (Optimistic update)
  const handleUpdateStatus = async (id: string, newStatus: InvoiceStatus) => {
    setStatusMenuId(null);
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: newStatus } : inv))
    );

    const supabase = createClient();
    await supabase.from("invoices").update({ status: newStatus }).eq("id", id);
  };

  // Single delete (Optimistic update)
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    setSelectedIds((prev) => prev.filter((i) => i !== id));

    const supabase = createClient();
    await supabase.from("invoices").delete().eq("id", id);
  };

  // Multi-selection handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((inv) => inv.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ${selectedIds.length} selected invoice(s)?`
      )
    ) {
      return;
    }

    setBulkProcessing(true);
    const idsToDelete = [...selectedIds];

    // Optimistically remove from state immediately
    setInvoices((prev) => prev.filter((inv) => !idsToDelete.includes(inv.id)));
    setSelectedIds([]);

    const supabase = createClient();
    await supabase.from("invoices").delete().in("id", idsToDelete);
    setBulkProcessing(false);
  };

  // Bulk Mark Paid
  const handleBulkMarkPaid = async () => {
    if (selectedIds.length === 0) return;
    setBulkProcessing(true);
    const idsToUpdate = [...selectedIds];

    // Optimistically update
    setInvoices((prev) =>
      prev.map((inv) =>
        idsToUpdate.includes(inv.id) ? { ...inv, status: "paid" } : inv
      )
    );
    setSelectedIds([]);

    const supabase = createClient();
    await supabase.from("invoices").update({ status: "paid" }).in("id", idsToUpdate);
    setBulkProcessing(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filtered.length === 0) return;

    const headers = [
      "Invoice Number",
      "Customer",
      "Amount",
      "Status",
      "Due Date",
      "Notes",
      "Created Date",
    ];

    const rows = filtered.map((inv) => [
      `"${inv.invoice_number}"`,
      `"${(inv.customer as any)?.name || ""}"`,
      inv.amount,
      inv.status,
      inv.due_date ? format(new Date(inv.due_date), "yyyy-MM-dd") : "",
      `"${(inv.notes || "").replace(/"/g, '""')}"`,
      inv.created_at ? format(new Date(inv.created_at), "yyyy-MM-dd") : "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `stockledger-invoices-${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
          <p className="text-gray-500 text-sm mt-1">
            {invoices.length} total invoices · Total value:{" "}
            <span className="font-semibold text-gray-900">
              {formatMoney(
                invoices.reduce((sum, i) => sum + Number(i.amount), 0),
                currencySymbol
              )}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {invoices.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="btn-secondary text-xs sm:text-sm py-2 px-3 gap-1.5"
              title="Download spreadsheet"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          )}
          <Link href="/invoices/new" className="btn-primary text-xs sm:text-sm py-2 px-3 gap-1.5">
            <Plus className="w-4 h-4" /> New Invoice
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search customer name or invoice number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 w-full"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {[
            { id: "all", label: `All (${invoices.length})` },
            { id: "pending", label: `Pending (${pendingCount})` },
            { id: "paid", label: `Paid (${paidCount})` },
            { id: "overdue", label: `Overdue (${overdueCount})` },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilter(id as any)}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                filter === id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Action Banner */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-sm font-bold text-blue-900">
              {selectedIds.length} invoice{selectedIds.length > 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBulkMarkPaid}
              disabled={bulkProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5" /> Mark Paid
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedIds.length})
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Invoices Table Card */}
      <div className="card p-0 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 px-4">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-semibold text-base">No invoices found</p>
            <p className="text-gray-400 text-sm mt-1">
              {search || filter !== "all"
                ? "Try clearing your search or filter"
                : "Create your first wholesale invoice to get started"}
            </p>
            <Link
              href="/invoices/new"
              className="btn-primary mt-4 inline-flex text-sm py-2 px-4"
            >
              + Create First Invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/80 border-b border-gray-100 select-none">
                <tr className="text-xs text-gray-500 font-semibold">
                  <th className="pl-6 pr-2 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        filtered.length > 0 &&
                        selectedIds.length === filtered.length
                      }
                      onChange={handleToggleSelectAll}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      title="Select all"
                    />
                  </th>
                  <th className="px-4 py-4">Invoice #</th>
                  <th className="px-4 py-4">Customer</th>
                  <th className="px-4 py-4">Amount</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Due Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((inv) => {
                  const isSelected = selectedIds.includes(inv.id);
                  const isMenuOpen = statusMenuId === inv.id;

                  return (
                    <tr
                      key={inv.id}
                      className={`transition-colors ${
                        isSelected ? "bg-blue-50/40" : "hover:bg-gray-50/70"
                      }`}
                    >
                      <td className="pl-6 pr-2 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(inv.id)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                      </td>

                      <td className="px-4 py-4">
                        <button
                          onClick={() => setActiveModalInvoice(inv)}
                          className="font-mono text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                          title="View / Print Invoice"
                        >
                          {inv.invoice_number}
                        </button>
                      </td>

                      <td className="px-4 py-4 font-semibold text-gray-900 max-w-[200px] truncate">
                        {(inv.customer as any)?.name || "—"}
                      </td>

                      <td className="px-4 py-4 font-bold text-gray-900 whitespace-nowrap">
                        {formatMoney(inv.amount, currencySymbol)}
                      </td>

                      {/* Interactive Status Changer */}
                      <td className="px-4 py-4 relative">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={() =>
                              setStatusMenuId(isMenuOpen ? null : inv.id)
                            }
                            className="inline-flex items-center gap-1 group cursor-pointer focus:outline-none"
                            title="Click to change status"
                          >
                            <StatusBadge status={inv.status} />
                            <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-700 transition-colors" />
                          </button>

                          {isMenuOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setStatusMenuId(null)}
                              />
                              <div className="absolute left-0 mt-2 w-36 rounded-xl bg-white shadow-xl border border-gray-100 py-1.5 z-20 animate-in fade-in zoom-in-95 duration-100">
                                {(
                                  [
                                    { key: "pending", label: "⏳ Pending" },
                                    { key: "paid", label: "✓ Paid" },
                                    { key: "overdue", label: "⚠ Overdue" },
                                    { key: "cancelled", label: "✕ Cancelled" },
                                  ] as const
                                ).map((st) => (
                                  <button
                                    key={st.key}
                                    type="button"
                                    onClick={() =>
                                      handleUpdateStatus(inv.id, st.key)
                                    }
                                    className={`w-full text-left px-3.5 py-1.5 text-xs font-semibold flex items-center justify-between hover:bg-gray-50 transition-colors ${
                                      inv.status === st.key
                                        ? "text-blue-600 bg-blue-50/50"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    <span>{st.label}</span>
                                    {inv.status === st.key && (
                                      <Check className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-gray-500 whitespace-nowrap">
                        {inv.due_date
                          ? format(new Date(inv.due_date), "MMM d, yyyy")
                          : "—"}
                      </td>

                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setActiveModalInvoice(inv)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Print / View Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {inv.status !== "paid" && (
                            <button
                              onClick={() => handleUpdateStatus(inv.id, "paid")}
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                              title="Mark as Paid"
                            >
                              <CheckSquare className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete invoice"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Invoice Modal */}
      {activeModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            {/* Modal Controls */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Invoice Details
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  onClick={() => setActiveModalInvoice(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Invoice Print Content */}
            <div className="py-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                    StockLedger
                  </h1>
                  <p className="text-xs text-gray-400">Wholesale Invoice</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-gray-500">
                    {activeModalInvoice.invoice_number}
                  </div>
                  <div className="mt-1">
                    <StatusBadge status={activeModalInvoice.status} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                <div>
                  <div className="font-semibold text-gray-400 uppercase text-[10px]">
                    Billed To:
                  </div>
                  <div className="font-bold text-gray-900 text-sm mt-0.5">
                    {(activeModalInvoice.customer as any)?.name || "Customer"}
                  </div>
                  {(activeModalInvoice.customer as any)?.email && (
                    <div className="text-gray-500 mt-0.5">
                      {(activeModalInvoice.customer as any).email}
                    </div>
                  )}
                  {(activeModalInvoice.customer as any)?.phone && (
                    <div className="text-gray-500">
                      {(activeModalInvoice.customer as any).phone}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-400 uppercase text-[10px]">
                    Due Date:
                  </div>
                  <div className="font-bold text-gray-900 text-sm mt-0.5">
                    {activeModalInvoice.due_date
                      ? format(new Date(activeModalInvoice.due_date), "MMM d, yyyy")
                      : "—"}
                  </div>
                  <div className="font-semibold text-gray-400 uppercase text-[10px] mt-2">
                    Issued Date:
                  </div>
                  <div className="text-gray-600">
                    {activeModalInvoice.created_at
                      ? format(new Date(activeModalInvoice.created_at), "MMM d, yyyy")
                      : "—"}
                  </div>
                </div>
              </div>

              {/* Amount Box */}
              <div className="p-5 rounded-2xl bg-blue-600 text-white flex justify-between items-center shadow-md shadow-blue-200">
                <div>
                  <div className="text-xs font-semibold text-blue-100 uppercase tracking-wider">
                    Total Amount Due
                  </div>
                  <div className="text-3xl font-black tracking-tight mt-0.5">
                    {formatMoney(activeModalInvoice.amount, currencySymbol)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase backdrop-blur-sm">
                    {activeModalInvoice.status}
                  </span>
                </div>
              </div>

              {activeModalInvoice.notes && (
                <div className="text-xs text-gray-500 border-t border-gray-100 pt-4">
                  <span className="font-semibold text-gray-700">Notes: </span>
                  {activeModalInvoice.notes}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setActiveModalInvoice(null)}
                className="btn-secondary text-xs py-2 px-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
