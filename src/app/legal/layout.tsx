import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-gray-800">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-900 font-bold">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <BookOpen className="w-4 h-4" />
            </div>
            <span>StockLedger Legal & Policies</span>
          </Link>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/pricing" className="text-gray-600 hover:text-blue-600">
              Pricing
            </Link>
            <a
              href="https://t.me/Venlix25"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full"
            >
              Contact Support on Telegram
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
        </div>
        <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-12 shadow-sm">
          {children}
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white py-8 px-4 text-center text-xs text-gray-500 space-y-3">
        <div className="flex flex-wrap justify-center gap-4 font-medium">
          <Link href="/legal/terms" className="hover:text-blue-600">Terms of Service</Link>
          <span>·</span>
          <Link href="/legal/privacy" className="hover:text-blue-600">Privacy Policy</Link>
          <span>·</span>
          <Link href="/legal/payment-policy" className="hover:text-blue-600">Subscription & Payment</Link>
          <span>·</span>
          <Link href="/legal/refund" className="hover:text-blue-600">Refund Policy</Link>
          <span>·</span>
          <Link href="/legal/security" className="hover:text-blue-600">Security Information</Link>
        </div>
        <p>
          Need assistance?{" "}
          <a
            href="https://t.me/Venlix25"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-semibold"
          >
            Contact StockLedger Support on Telegram
          </a>
          . We will never ask for your password, wallet seed phrase, or private keys.
        </p>
        <p className="text-gray-400">
          StockLedger Platform · Current policy version: 1.0 (Draft)
        </p>
      </footer>
    </div>
  );
}
