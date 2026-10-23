export default function TermsPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <div className="mb-6 pb-4 border-b border-gray-100">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Legal Agreement</span>
        <h1 className="text-3xl font-extrabold text-gray-900 mt-1">Terms of Service</h1>
        <p className="text-xs text-gray-400 mt-1">
          Version 1.0 (Draft) · Effective Date: October 2026
        </p>
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          <strong>Notice:</strong> This is a working draft prepared for launch. Legal entity name, registration address, and jurisdiction details are marked as placeholders below and must be finalized by the business owner before public paid onboarding.
        </div>
      </div>

      <section className="space-y-4 text-sm text-gray-700 leading-relaxed">
        <h2 className="text-lg font-bold text-gray-900 mt-6">1. Acceptance of Terms</h2>
        <p>
          By creating an account or accessing StockLedger (&quot;we&quot;, &quot;our&quot;, or &quot;the Service&quot;), operated by <strong>[DRAFT — Registered Entity / Business Name to be inserted before launch]</strong>, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">2. Description of the Service</h2>
        <p>
          StockLedger is an online invoice and customer payment tracking workspace designed for wholesalers and growing businesses. The Service allows users to create invoices, record customer payments, monitor receivable balances, view reporting metrics, and manage customer directories.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">3. Accounts and Security</h2>
        <p>
          You must provide an accurate email address upon registration. You are responsible for safeguarding your login credentials. You agree to notify us immediately of any unauthorized use of your account. We reserve the right to suspend or terminate accounts that violate these terms.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">4. Subscription Plans and Payment</h2>
        <p>
          StockLedger offers a Free Starter Tier and two paid tiers:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Free Tier:</strong> Limited to 5 customers and 10 invoices.</li>
          <li><strong>Pro Quarterly ($25 USD):</strong> Unlimited invoices and customers for a 90-day period.</li>
          <li><strong>Pro Yearly ($79 USD):</strong> Unlimited invoices and customers for a 365-day period (save $21 vs quarterly).</li>
        </ul>
        <p>
          Payments are processed through cryptocurrency transactions via NOWPayments. All paid periods are fixed-term and do not automatically recur or charge your crypto wallet. To maintain continuous access, users must manually submit a renewal payment prior to or upon expiration.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">5. User Data and Business Records</h2>
        <p>
          You retain full ownership of all customer data, invoice details, and business records you submit to StockLedger. You grant StockLedger only the rights necessary to host, store, and display your data to you and your authorized sessions. When a subscription period expires, we do not delete your existing business data or invoices; your account reverts to free tier access rules.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">6. Prohibited Activities</h2>
        <p>
          You agree not to: (a) attempt to reverse engineer or extract source code; (b) probe, scan, or breach system security or bypass tenant isolation; (c) manipulate prices or submit forged webhook signals; (d) use the Service for illegal, fraudulent, or deceptive commercial activities.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">7. Limitation of Liability and Disclaimer</h2>
        <p>
          The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. To the maximum extent permitted by applicable law, StockLedger disclaims all warranties, express or implied. Nothing in these terms excludes rights that cannot be excluded under applicable mandatory consumer law.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">8. Governing Law and Contact</h2>
        <p>
          These terms shall be governed by the laws of <strong>[DRAFT — Applicable Jurisdiction / Country]</strong> without regard to conflict of law principles.
        </p>
        <p>
          For questions or support regarding these terms,{" "}
          <a
            href="https://t.me/Venlix25"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline font-semibold"
          >
            Contact StockLedger Support on Telegram
          </a>
          . Never share account passwords or wallet private keys with support agents.
        </p>
      </section>
    </article>
  );
}
