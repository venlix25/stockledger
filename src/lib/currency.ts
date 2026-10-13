"use client";

export interface CurrencyConfig {
  code: string;
  symbol: string;
  label: string;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: "USD", symbol: "$", label: "USD ($) - US Dollar" },
  { code: "EUR", symbol: "€", label: "EUR (€) - Euro" },
  { code: "GBP", symbol: "£", label: "GBP (£) - British Pound" },
  { code: "SGD", symbol: "S$", label: "SGD (S$) - Singapore Dollar" },
  { code: "AUD", symbol: "A$", label: "AUD (A$) - Australian Dollar" },
  { code: "CAD", symbol: "C$", label: "CAD (C$) - Canadian Dollar" },
  { code: "JPY", symbol: "¥", label: "JPY (¥) - Japanese Yen" },
  { code: "MMK", symbol: "Ks", label: "MMK (Ks) - Myanmar Kyat" },
  { code: "THB", symbol: "฿", label: "THB (฿) - Thai Baht" },
  { code: "INR", symbol: "₹", label: "INR (₹) - Indian Rupee" },
];

const STORAGE_KEY = "stockledger_currency";

export function getSavedCurrency(): CurrencyConfig {
  if (typeof window === "undefined") {
    return SUPPORTED_CURRENCIES[0];
  }
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const found = SUPPORTED_CURRENCIES.find((c) => c.code === saved);
    if (found) return found;
  }
  return SUPPORTED_CURRENCIES[0]; // default USD
}

export function saveCurrency(code: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, code);
    window.dispatchEvent(new Event("currency_changed"));
  }
}

export function formatMoney(amount: number | string, symbol = "$"): string {
  const num = typeof amount === "number" ? amount : parseFloat(amount) || 0;
  return `${symbol}${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
