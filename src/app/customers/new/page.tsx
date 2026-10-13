"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserPlan, PLAN_LIMITS } from "@/lib/plan";
import UpgradeModal from "@/components/UpgradeModal";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [customerCount, setCustomerCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const supabase = createClient();
      const { count } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true });
      setCustomerCount(count || 0);
    };
    fetchCount();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Customer name is required."); return; }

    const plan = getUserPlan();
    if (plan === "free" && customerCount >= PLAN_LIMITS.free.maxCustomers) {
      setShowUpgradeModal(true);
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/"); return; }

    const { error: err } = await supabase.from("customers").insert({
      user_id: user.id,
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
    });

    if (err) { setError(err.message); setLoading(false); return; }
    router.push("/customers");
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/customers" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Customers
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add Customer</h2>
            <p className="text-sm text-gray-500">Add a new customer to your list</p>
          </div>
        </div>
      </div>

      <div className="card">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-5">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name / Business Name *</label>
            <input
              type="text"
              placeholder="e.g. Apex Global Traders, Sarah Jenkins"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              placeholder="e.g. +1 555-019-2834"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email (optional)</label>
            <input
              type="email"
              placeholder="e.g. contact@apexglobal.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Address (optional)</label>
            <textarea
              placeholder="e.g. 742 Evergreen Terrace, Suite 100, Springfield"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={2}
              className="input-field resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? "Saving..." : "✓ Save Customer"}
            </button>
            <Link href="/customers" className="btn-secondary flex-1 justify-center">Cancel</Link>
          </div>
        </form>
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="The Free Starter plan allows up to 5 customers. Upgrade to Pro for unlimited customers & invoices!"
      />
    </div>
  );
}
