"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Invoice, Customer } from "@/types";
import { ArrowLeft, CreditCard } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

export default function NewPaymentPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    invoice_id: "",
    amount: "",
    payment_date: format(new Date(), "yyyy-MM-dd"),
    method: "cash",
    notes: "",
  });

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("invoices")
        .select("*, customer:customers(name)")
        .neq("status", "paid")
        .order("created_at", { ascending: false });
      setInvoices(data || []);
    };
    load();
  }, []);

  const selectedInvoice = invoices.find((i) => i.id === form.invoice_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.invoice_id) { setError("Please select an invoice."); return; }
    if (!form.amount || isNaN(Number(form.amount))) { setError("Enter a valid amount."); return; }

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/"); return; }

    const invoice = invoices.find((i) => i.id === form.invoice_id);
    if (!invoice) { setError("Invoice not found."); setLoading(false); return; }

    const { error: err } = await supabase.from("payments").insert({
      user_id: user.id,
      invoice_id: form.invoice_id,
      customer_id: invoice.customer_id,
      amount: parseFloat(form.amount),
      payment_date: form.payment_date,
      method: form.method,
      notes: form.notes || null,
    });

    if (err) { setError(err.message); setLoading(false); return; }

    // Mark invoice as paid if full amount
    if (parseFloat(form.amount) >= Number(invoice.amount)) {
      await supabase.from("invoices").update({ status: "paid" }).eq("id", form.invoice_id);
    }

    router.push("/payments");
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/payments" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Payments
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Record Payment</h2>
            <p className="text-sm text-gray-500">Log a payment received from a customer</p>
          </div>
        </div>
      </div>

      <div className="card">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-5">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Invoice *</label>
            {invoices.length === 0 ? (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700">
                No pending invoices.{" "}
                <Link href="/invoices/new" className="font-semibold underline">Create an invoice first →</Link>
              </div>
            ) : (
              <select
                value={form.invoice_id}
                onChange={(e) => {
                  const inv = invoices.find((i) => i.id === e.target.value);
                  setForm({ ...form, invoice_id: e.target.value, amount: inv ? String(inv.amount) : "" });
                }}
                className="input-field"
                required
              >
                <option value="">Select an invoice...</option>
                {invoices.map((i) => (
                  <option key={i.id} value={i.id}>
                    {(i.customer as any)?.name} — {i.invoice_number} (${Number(i.amount).toFixed(2)})
                  </option>
                ))}
              </select>
            )}
            {selectedInvoice && (
              <p className="text-xs text-gray-500 mt-1.5">
                Invoice total: <span className="font-semibold text-gray-700">${Number(selectedInvoice.amount).toFixed(2)}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Amount Paid *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="input-field pl-8"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Date *</label>
            <input
              type="date"
              value={form.payment_date}
              onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
            <select
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}
              className="input-field"
            >
              <option value="cash">💵 Cash</option>
              <option value="bank_transfer">🏦 Bank Transfer / Wire</option>
              <option value="credit_card">💳 Credit / Debit Card</option>
              <option value="online_payment">🌐 Online (Stripe, PayPal, Wise)</option>
              <option value="mobile_payment">📱 Mobile Money / Digital Wallet</option>
              <option value="check">📝 Check / Cheque</option>
              <option value="other">📦 Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Notes (optional)</label>
            <textarea
              placeholder="Any notes about this payment..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="input-field resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading || invoices.length === 0} className="btn-success flex-1 text-center justify-center">
              {loading ? "Recording..." : "✓ Record Payment"}
            </button>
            <Link href="/payments" className="btn-secondary flex-1 justify-center">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
