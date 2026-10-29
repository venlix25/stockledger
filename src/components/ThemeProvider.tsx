"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { applyThemeToDOM, getSavedTheme, ThemeMode, saveTheme } from "@/lib/theme";
import ShortcutsModal from "@/components/ShortcutsModal";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    // 1. Initialize theme on client mount
    const initialTheme = getSavedTheme();
    applyThemeToDOM(initialTheme);
    setMounted(true);

    const onThemeChanged = (e: any) => {
      if (e?.detail) {
        applyThemeToDOM(e.detail as ThemeMode);
      }
    };
    window.addEventListener("stockledger_theme_changed", onThemeChanged);

    // 2. Global Keyboard Shortcut Handler
    let keyBuffer: string[] = [];
    let bufferTimer: any = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing in an input, textarea, or select
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      // Escape closes shortcuts
      if (e.key === "Escape") {
        setShowShortcuts(false);
        return;
      }

      // Shift + / or '?' opens shortcuts
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
        return;
      }

      // 'T' cycles theme
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        const current = getSavedTheme();
        const nextTheme: ThemeMode =
          current === "light" ? "dark" : current === "dark" ? "midnight" : "light";
        saveTheme(nextTheme);
        return;
      }

      // 2-key sequence handler (e.g. G then D, N then I)
      const key = e.key.toUpperCase();
      keyBuffer.push(key);

      clearTimeout(bufferTimer);
      bufferTimer = setTimeout(() => {
        keyBuffer = [];
      }, 900);

      const sequence = keyBuffer.join("");

      if (sequence === "GD") {
        router.push("/dashboard");
        keyBuffer = [];
      } else if (sequence === "GI") {
        router.push("/invoices");
        keyBuffer = [];
      } else if (sequence === "GC") {
        router.push("/customers");
        keyBuffer = [];
      } else if (sequence === "GP") {
        router.push("/payments");
        keyBuffer = [];
      } else if (sequence === "GR") {
        router.push("/reports");
        keyBuffer = [];
      } else if (sequence === "GS") {
        router.push("/settings");
        keyBuffer = [];
      } else if (sequence === "NI") {
        router.push("/invoices/new");
        keyBuffer = [];
      } else if (sequence === "NC") {
        router.push("/customers/new");
        keyBuffer = [];
      } else if (sequence === "NP") {
        router.push("/payments/new");
        keyBuffer = [];
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Global custom event to trigger shortcut modal from sidebar/header
    const onOpenShortcuts = () => setShowShortcuts(true);
    window.addEventListener("stockledger_open_shortcuts", onOpenShortcuts);

    return () => {
      window.removeEventListener("stockledger_theme_changed", onThemeChanged);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("stockledger_open_shortcuts", onOpenShortcuts);
      clearTimeout(bufferTimer);
    };
  }, [router]);

  return (
    <>
      {children}
      <ShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </>
  );
}
