"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Customer } from "@/types";
import { Plus, Search, Users, Phone, Mail, Trash2, CheckSquare, X } from "lucide-react";
import Link from "next/link";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const loadCustomers = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", user.id)
      .order("name");
    setCustomers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Single delete (Optimistic update)
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this customer and all their associated records?")) return;
    setDeletingId(id);

    // Optimistically remove from state immediately
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    setSelectedIds((prev) => prev.filter((i) => i !== id));

    const supabase = createClient();
    await supabase.from("customers").delete().eq("id", id);
    setDeletingId(null);
  };

  // Toggle select all
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((c) => c.id));
    }
  };

  // Toggle select one
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
        `Are you sure you want to delete ${selectedIds.length} selected customer(s)? This will also remove their invoices.`
      )
    ) {
      return;
    }

    setBulkDeleting(true);
    const idsToDelete = [...selectedIds];

    // Optimistically remove from state immediately
    setCustomers((prev) => prev.filter((c) => !idsToDelete.includes(c.id)));
    setSelectedIds([]);

    const supabase = createClient();
    await supabase.from("customers").delete().in("id", idsToDelete);
    setBulkDeleting(false);
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || "").includes(search) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
          <p className="text-gray-500 text-sm mt-1">{customers.length} total customers</p>
        </div>
        <div className="flex items-center gap-2">
          {customers.length > 0 && (
            <button
              onClick={handleToggleSelectAll}
              className="btn-secondary text-xs sm:text-sm py-2 px-3 gap-1.5"
            >
              <CheckSquare className="w-4 h-4" />
              {selectedIds.length === filtered.length ? "Deselect All" : "Select All"}
            </button>
          )}
          <Link href="/customers/new" className="btn-primary text-xs sm:text-sm py-2 px-3 gap-1.5">
            <Plus className="w-4 h-4" /> Add Customer
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by customer name, phone, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-9 w-full"
        />
      </div>

      {/* Bulk Action Banner */}
      {selectedIds.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <span className="text-sm font-bold text-red-900">
              {selectedIds.length} customer{selectedIds.length > 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
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

      {/* Grid of Customer Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 bg-white rounded-2xl animate-pulse border border-gray-100 shadow-sm"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 px-4 card">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-semibold text-base">No customers found</p>
          <p className="text-gray-400 text-sm mt-1">
            {search
              ? "Try clearing your search term"
              : "Add your first wholesale customer to start creating invoices"}
          </p>
          <Link href="/customers/new" className="btn-primary mt-4 inline-flex text-sm py-2 px-4">
            + Add First Customer
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const isSelected = selectedIds.includes(c.id);

            return (
              <div
                key={c.id}
                className={`card p-5 transition-all relative group ${
                  isSelected
                    ? "ring-2 ring-blue-500 bg-blue-50/20"
                    : "hover:shadow-md hover:border-gray-300"
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelectOne(c.id)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer flex-shrink-0"
                    />
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-sm">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3
                        className="font-bold text-gray-900 text-base leading-tight truncate"
                        title={c.name}
                      >
                        {c.name}
                      </h3>
                      {c.address && (
                        <p className="text-xs text-gray-400 truncate mt-0.5" title={c.address}>
                          {c.address}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
                    title="Delete customer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Details */}
                <div className="space-y-1.5 py-2 border-t border-gray-100 text-xs text-gray-600">
                  {c.phone && (
                    <div className="flex items-center gap-2 truncate">
                      <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{c.phone}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                </div>

                {/* Card Action */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                  <Link
                    href={`/invoices/new?customer=${c.id}`}
                    className="w-full text-center text-xs font-bold text-blue-600 hover:text-blue-700 py-2 rounded-xl bg-blue-50/60 hover:bg-blue-100 transition-colors inline-block"
                  >
                    + Create Invoice
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
