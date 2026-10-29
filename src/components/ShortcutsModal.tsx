"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Keyboard,
  X,
  Command,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Sun,
  Moon,
  Zap,
} from "lucide-react";
import { getSavedTheme, saveTheme } from "@/lib/theme";

interface ShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShortcutsModal({ isOpen, onClose }: ShortcutModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const SHORTCUT_GROUPS = [
    {
      title: "Navigation (Jump anywhere instantly)",
      items: [
        { keys: ["G", "D"], desc: "Go to Dashboard (Home)", action: () => router.push("/dashboard") },
        { keys: ["G", "I"], desc: "Go to Invoices list", action: () => router.push("/invoices") },
        { keys: ["G", "C"], desc: "Go to Customers list", action: () => router.push("/customers") },
        { keys: ["G", "P"], desc: "Go to Payments ledger", action: () => router.push("/payments") },
        { keys: ["G", "R"], desc: "Go to Reports & analytics", action: () => router.push("/reports") },
        { keys: ["G", "S"], desc: "Go to Settings", action: () => router.push("/settings") },
      ],
    },
    {
      title: "Quick Creation",
      items: [
        { keys: ["N", "I"], desc: "New Invoice form", action: () => router.push("/invoices/new") },
        { keys: ["N", "C"], desc: "New Customer form", action: () => router.push("/customers/new") },
        { keys: ["N", "P"], desc: "Record Payment form", action: () => router.push("/payments/new") },
      ],
    },
    {
      title: "Appearance & Guides",
      items: [
        {
          keys: ["T"],
          desc: "Cycle Theme (Light / Dark / Midnight)",
          action: () => {
            const current = getSavedTheme();
            const next = current === "light" ? "dark" : current === "dark" ? "midnight" : "light";
            saveTheme(next);
          },
        },
        { keys: ["?"], desc: "Open this Shortcut & Guide helper", action: () => {} },
        { keys: ["Esc"], desc: "Close any modal or dialog", action: () => onClose() },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto text-gray-900 dark:text-gray-100 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">StockLedger Quick Guide & Shortcuts</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Work at lightning speed with wholesale keyboard controls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick How to Use Guide */}
        <div className="my-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-slate-800/80 dark:to-slate-800/50 border border-blue-100/80 dark:border-slate-700 text-xs space-y-2">
          <div className="font-bold text-blue-950 dark:text-blue-200 text-sm flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Quick 30-Second Guide to Using StockLedger:
          </div>
          <ol className="list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-300 leading-relaxed">
            <li><strong>Add Customers:</strong> Add your wholesale buyers (name, phone, billing address).</li>
            <li><strong>Issue Invoices:</strong> Choose a customer, amount, due date, and initial status (Pending or Paid).</li>
            <li><strong>Record Payments:</strong> When cash, wire, or crypto settles, record it to update customer balance.</li>
            <li><strong>Batch Controls:</strong> Use checkboxes to delete or mark multiple invoices paid simultaneously.</li>
            <li><strong>Print & Export:</strong> Click any invoice number to view a clean printable receipt or click Export CSV.</li>
          </ol>
        </div>

        {/* Shortcut Groups */}
        <div className="space-y-6">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {group.title}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.items.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      item.action();
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/40 hover:bg-blue-50/70 dark:hover:bg-slate-800 hover:border-blue-200 dark:hover:border-slate-700 transition-all text-left group"
                  >
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {item.desc}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-[10px] font-mono font-bold shadow-2xs text-gray-800 dark:text-gray-200"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-6 mt-6 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs text-gray-400">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 font-mono text-gray-700 dark:text-gray-300">?</kbd> anywhere to re-open this guide.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
