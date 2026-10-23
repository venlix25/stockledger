export default function SecurityPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <div className="mb-6 pb-4 border-b border-gray-100">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Infrastructure &amp; Safety</span>
        <h1 className="text-3xl font-extrabold text-gray-900 mt-1">Account &amp; Security Information</h1>
        <p className="text-xs text-gray-400 mt-1">
          Version 1.0 (Draft) · Effective Date: October 2026
        </p>
      </div>

      <section className="space-y-4 text-sm text-gray-700 leading-relaxed">
        <h2 className="text-lg font-bold text-gray-900 mt-6">1. Security Architecture</h2>
        <p>
          StockLedger is engineered with a strict principle of least privilege, data isolation, and cryptographic integrity to protect your business records and invoices.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">2. Tenant Isolation &amp; Row Level Security (RLS)</h2>
        <p>
          Every customer, invoice, payment, and order record in our database is bound to the owner&apos;s unique user identifier (<code>user_id</code>). All read and write operations in PostgreSQL are governed by Row Level Security (RLS) policies enforcing <code>auth.uid() = user_id</code>.
        </p>
        <p>
          This guarantees that one business cannot view, query, or modify the customers, balances, or invoices of any other business on the platform.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">3. Authentication &amp; Credential Protection</h2>
        <p>
          User authentication is managed via Supabase Auth. Passwords are encrypted and salted using robust hashing algorithms before storage. Passwords are never stored in plain text, logged, or visible to system administrators.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">4. Payment Security &amp; Webhook Cryptography</h2>
        <p>
          Payment credentials and IPN secrets are strictly maintained server-side and are never exposed in browser JavaScript bundles.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>HMAC-SHA512 Signature Verification:</strong> Every payment callback from NOWPayments is cryptographically authenticated using HMAC-SHA512 with timing-safe comparison to prevent forgery and timing attacks.</li>
          <li><strong>Zero Wallet Key Custody:</strong> StockLedger never requests, collects, stores, or accesses your cryptocurrency wallet private keys, seed phrases, or exchange credentials.</li>
          <li><strong>Server-Enforced Entitlements:</strong> Subscriptions are granted exclusively through verified server-side orders and confirmed webhooks. Client-side browser tampering cannot unlock paid features.</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900 mt-6">5. Responsible Vulnerability Disclosure</h2>
        <p>
          If you believe you have discovered a security vulnerability in StockLedger, please contact our security team immediately:{" "}
          <a
            href="https://t.me/Venlix25"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline font-semibold"
          >
            Contact StockLedger Support on Telegram
          </a>
          . We appreciate responsible disclosures and address verified security concerns expeditiously.
        </p>
      </section>
    </article>
  );
}
