export default function PrivacyPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <div className="mb-6 pb-4 border-b border-gray-100">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Privacy & Data Handling</span>
        <h1 className="text-3xl font-extrabold text-gray-900 mt-1">Privacy Policy</h1>
        <p className="text-xs text-gray-400 mt-1">
          Version 1.0 (Draft) · Effective Date: October 2026
        </p>
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          <strong>Notice:</strong> This policy reflects the real implementation of StockLedger. Official contact email, data controller entity, and physical address are marked as placeholders to be finalized prior to full commercial operation.
        </div>
      </div>

      <section className="space-y-4 text-sm text-gray-700 leading-relaxed">
        <h2 className="text-lg font-bold text-gray-900 mt-6">1. Overview</h2>
        <p>
          This Privacy Policy explains how StockLedger (&quot;we&quot;, &quot;us&quot;) collects, uses, and protects information when you use our invoice and customer payment tracking application.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">2. Information We Collect</h2>
        <p>We collect only the information necessary to provide the service:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Account Information:</strong> Email address and hashed password authentication credentials handled via Supabase Auth.</li>
          <li><strong>Business &amp; Preference Data:</strong> Business name (stored locally and in profile), preferred display currency (USD, EUR, GBP, SGD, etc.).</li>
          <li><strong>Application Data:</strong> Customer directory details (customer names, contact phone, email, addresses), invoice records (invoice numbers, amounts, due dates, notes, statuses), and payment records (amounts, payment dates, payment methods).</li>
          <li><strong>Payment &amp; Order Data:</strong> Order identifiers, requested plan (Monthly/Yearly), USD amount, and payment references returned by NOWPayments (payment ID, cryptocurrency used, actually paid amount, and payment status). We never collect or store your private wallet keys, credit card numbers, or seed phrases.</li>
          <li><strong>Policy Acceptance Records:</strong> Timestamp and version of terms and policies you consented to during account creation.</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900 mt-6">3. How We Use Your Information</h2>
        <p>Your information is used exclusively to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provide, maintain, and secure your personal ledger workspace.</li>
          <li>Authenticate your sessions and enforce tenant isolation (preventing other users from viewing your business data).</li>
          <li>Process cryptocurrency checkout requests and verify payment notifications via secure webhook.</li>
          <li>Display dashboard reporting, collection statistics, and due-date alerts.</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900 mt-6">4. Third-Party Service Providers</h2>
        <p>We integrate with the following external service providers to deliver StockLedger:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Supabase:</strong> For cloud database hosting, authentication, and row-level security.</li>
          <li><strong>NOWPayments:</strong> For cryptocurrency payment invoice generation and Instant Payment Notification (IPN) webhook verification.</li>
          <li><strong>Vercel:</strong> For serverless frontend and backend hosting.</li>
        </ul>
        <p>We do not sell, rent, or trade your personal or business data to third-party advertisers or data brokers.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">5. Data Retention and Account Deletion</h2>
        <p>
          Your data is retained for as long as your account remains active. If your paid subscription expires, your existing invoices and customer records are retained so you do not lose your historical business ledger. You may request account deletion and removal of all associated customer and invoice records at any time by contacting our support team.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">6. Security and Tenant Isolation</h2>
        <p>
          We employ PostgreSQL Row Level Security (RLS) policies requiring authentication tokens (`auth.uid() = user_id`) for every database query on customer, invoice, and payment tables, ensuring strict multi-tenant isolation.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">7. Contact and Support</h2>
        <p>
          For privacy inquiries or data requests:{" "}
          <a
            href="https://t.me/Venlix25"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline font-semibold"
          >
            Contact StockLedger Support on Telegram
          </a>
          . Official email: <strong>[DRAFT — privacy@stockledger.app or designated email]</strong>.
        </p>
      </section>
    </article>
  );
}
