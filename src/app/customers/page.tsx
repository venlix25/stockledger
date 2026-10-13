"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Customer } from "@/types";
import { Plus, Search, Users, Phone, Mail, Trash2, DollarSign } from "lucide-react";
import Link from "next/link";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadCustomers = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("customers").select("*").order("name");
    setCustomers(data || []);
    setLoading(false);
  };

  useEffect(() => { loadCustomers(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this customer and all their invoices?")) return;
    const supabase = createClient();
    await supabase.from("customers").delete().eq("id", id);
    loadCustomers();
  };

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || "").includes(search)
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
          <p className="text-gray-500 text-sm mt-1">{customers.length} total customers</p>
        </div>
        <Link href="/customers/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Add Customer
        </Link>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-9"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-white rounded-2xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No customers found</p>
          <Link href="/customers/new" className="text-blue-600 text-sm font-medium mt-2 inline-block">
            Add your first customer →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="card hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{c.name}</h3>
              {c.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Phone className="w-3.5 h-3.5" />
                  {c.phone}
                </div>
              )}
              {c.email && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Mail className="w-3.5 h-3.5" />
                  {c.email}
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
                <Link
                  href={`/invoices/new?customer=${c.id}`}
                  className="flex-1 text-center text-xs font-semibold text-blue-600 hover:text-blue-700 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  + Invoice
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
