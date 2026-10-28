"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Customer } from "@/types";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { getSavedCurrency } from "@/lib/currency";
import { getUserPlanFromDB, PLAN_LIMITS } from "@/lib/plan";
import UpgradeModal from "@/components/UpgradeModal";

export default function NewInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currency, setCurrency] = useState(getSavedCurrency());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [form, setForm] = useState({
    customer_id: "",
    amount: "",
    due_date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    status: "pending" as "pending" | "paid",
    notes: "",
  });

  useEffect(() => {
    setCurrency(getSavedCurrency());
    const load = async () => {
      const supabase = createClient();
      const [
        { data: custData },
        { count: invCount }
      ] = await Promise.all([
        supabase.from("customers").select("*").order("name"),
        supabase.from("invoices").select("*", { count: "exact", head: true }),
      ]);
      setCustomers(custData || []);
      setInvoiceCount(invCount || 0);
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Immediate lock to prevent double clicks
    if (!form.customer_id) { setError("Please select a customer."); return; }
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const plan = await getUserPlanFromDB();
      if (plan === "free" && invoiceCount >= PLAN_LIMITS.free.maxInvoices) {
        setShowUpgradeModal(true);
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }

      const invoiceNumber = `INV-${Date.now().toString().slice(-5)}`;
      const { data: newInv, error: err } = await supabase
        .from("invoices")
        .insert({
          user_id: user.id,
          customer_id: form.customer_id,
          invoice_number: invoiceNumber,
          amount: parseFloat(form.amount),
          due_date: form.due_date,
          notes: form.notes || null,
          status: form.status,
        })
        .select()
        .single();

      if (err) { setError(err.message); setLoading(false); return; }

      // If user selected "paid" upon creation, automatically log the payment!
      if (form.status === "paid" && newInv) {
        await supabase.from("payments").insert({
          user_id: user.id,
          invoice_id: newInv.id,
          customer_id: form.customer_id,
          amount: parseFloat(form.amount),
          payment_date: format(new Date(), "yyyy-MM-dd"),
          method: "cash",
          notes: "Initial full payment recorded at invoice creation",
        });
      }

      router.push("/invoices");
    } catch (e: any) {
      setError(e?.message || "Failed to create invoice");
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/invoices" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create Invoice</h2>
            <p className="text-sm text-gray-500">Fill in the details below</p>
          </div>
        </div>
      </div>

      <div className="card">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-5">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Customer *</label>
            {customers.length === 0 ? (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700">
                No customers yet.{" "}
                <Link href="/customers/new" className="font-semibold underline">Add a customer first →</Link>
              </div>
            ) : (
              <select
                value={form.customer_id}
                onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                className="input-field"
                required
              >
                <option value="">Select a customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Amount ({currency.symbol}) *
            </label>
            <div className="flex rounded-xl shadow-sm border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 overflow-hidden bg-white">
              {currency.position === "prefix" && (
                <span className="inline-flex items-center px-4 bg-gray-50 text-gray-600 border-r border-gray-200 text-sm font-semibold select-none">
                  {currency.symbol}
                </span>
              )}
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="flex-1 block w-full border-0 py-3 px-4 text-gray-900 focus:ring-0 text-sm outline-none bg-transparent"
                required
              />
              {currency.position === "suffix" && (
                <span className="inline-flex items-center px-4 bg-gray-50 text-gray-600 border-l border-gray-200 text-sm font-semibold select-none">
                  {currency.symbol}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date *</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Initial Status</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  form.status === "pending"
                    ? "border-blue-600 bg-blue-50/50 text-blue-900 font-semibold"
                    : "border-gray-200 hover:bg-gray-50 text-gray-700"
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value="pending"
                  checked={form.status === "pending"}
                  onChange={() => setForm({ ...form, status: "pending" })}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-semibold">⏳ Unpaid (Pending)</div>
                  <div className="text-xs text-gray-500">Awaiting customer payment</div>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  form.status === "paid"
                    ? "border-green-600 bg-green-50/50 text-green-900 font-semibold"
                    : "border-gray-200 hover:bg-gray-50 text-gray-700"
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value="paid"
                  checked={form.status === "paid"}
                  onChange={() => setForm({ ...form, status: "paid" })}
                  className="text-green-600 focus:ring-green-500"
                />
                <div>
                  <div className="text-sm font-semibold">✓ Paid (Settled)</div>
                  <div className="text-xs text-gray-500">Auto-records payment</div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (optional)</label>
            <textarea
              placeholder="Add any notes about this invoice..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="input-field resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || customers.length === 0}
              className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Invoice...
                </span>
              ) : (
                "✓ Create Invoice"
              )}
            </button>
            <Link href="/invoices" className="btn-secondary flex-1 justify-center">
              Cancel
            </Link>
          </div>
        </form>
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="The Free Starter plan allows up to 10 invoices. Upgrade to Pro for unlimited invoices, payments & records!"
      />
    </div>
  );
}
