import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StockLedger – Invoices. Payments. Stronger Business.",
  description: "A simple web app that helps wholesalers create invoices, track payments, and manage customer balances.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
