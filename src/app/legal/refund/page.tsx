export default function RefundPolicyPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <div className="mb-6 pb-4 border-b border-gray-100">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Dispute &amp; Refund Guidelines</span>
        <h1 className="text-3xl font-extrabold text-gray-900 mt-1">Refund Policy</h1>
        <p className="text-xs text-gray-400 mt-1">
          Version 1.0 (Draft) · Effective Date: October 2026
        </p>
      </div>

      <section className="space-y-4 text-sm text-gray-700 leading-relaxed">
        <h2 className="text-lg font-bold text-gray-900 mt-6">1. General Principles</h2>
        <p>
          Because cryptocurrency transactions are irreversible on the blockchain and incur non-refundable network miner fees, payments made to StockLedger are generally considered final once confirmed. However, we strive to be fair and transparent with all business owners.
        </p>
        <p>
          Nothing in this policy limits or waives any statutory consumer rights that cannot legally be waived under applicable local legislation in your jurisdiction.
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">2. Eligibility for Refund Review</h2>
        <p>You may request a refund evaluation under the following circumstances:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Accidental Duplicate Payment:</strong> If you accidentally submitted two identical payments for the same subscription period due to network lag.
          </li>
          <li>
            <strong>Technical Service Failure:</strong> If an extended technical defect on our platform prevented you from using your Pro subscription, and our engineering team was unable to resolve the issue within a reasonable timeframe.
          </li>
          <li>
            <strong>Payment Confirmed but Access Not Granted:</strong> If your payment completed on the blockchain but the system failed to activate your account and manual resolution is declined.
          </li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900 mt-6">3. Ineligible Scenarios</h2>
        <p>Refunds cannot be issued for:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Network blockchain miner/gas fees deducted by your wallet or exchange.</li>
          <li>Payments sent to the wrong cryptocurrency address or on an unsupported blockchain network.</li>
          <li>Change of mind after extensive use of the Pro tier during the subscription period.</li>
          <li>Expired subscriptions where the full period of service was already made available.</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900 mt-6">4. How to Submit a Refund Request</h2>
        <p>
          To submit a request, contact our support team on Telegram:{" "}
          <a
            href="https://t.me/Venlix25"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline font-semibold"
          >
            Contact StockLedger Support on Telegram
          </a>
          .
        </p>
        <p>Please include:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Your registered StockLedger account email.</li>
          <li>Your Order ID and NOWPayments Payment ID.</li>
          <li>Transaction hash (TXID) from the blockchain.</li>
          <li>A clear explanation of the issue encountered.</li>
        </ul>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
          <strong>Important Security Notice:</strong> Submitting a refund request does not automatically approve a refund or alter your subscription status. We will <strong>never</strong> ask you for your wallet password, private keys, seed phrase, or account password. Never disclose private keys to anyone.
        </div>

        <h2 className="text-lg font-bold text-gray-900 mt-6">5. Refund Processing</h2>
        <p>
          Approved refunds will be processed via cryptocurrency to a verified payout address specified by the customer, net of any mandatory third-party blockchain network transfer fees.
        </p>
      </section>
    </article>
  );
}
