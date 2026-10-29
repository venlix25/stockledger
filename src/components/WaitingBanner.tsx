"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, Loader2, Hourglass } from "lucide-react";
import { getRandomWaitingMessage, WAITING_MESSAGES } from "@/lib/tips";

interface WaitingBannerProps {
  actionName?: string;
  className?: string;
}

export default function WaitingBanner({
  actionName = "Processing request",
  className = "",
}: WaitingBannerProps) {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * WAITING_MESSAGES.length));
  const [dots, setDots] = useState("");

  useEffect(() => {
    // Cycle dots
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 450);

    // Rotate motivational tips every 4 seconds if waiting continues
    const msgInterval = setInterval(() => {
      setIndex((prev) => (prev + 1) % WAITING_MESSAGES.length);
    }, 4000);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(msgInterval);
    };
  }, []);

  const current = WAITING_MESSAGES[index];

  return (
    <div
      className={`rounded-2xl p-4 border animate-in fade-in duration-300 transition-all ${
        current.category === "tip"
          ? "bg-blue-50/80 border-blue-200/80 text-blue-900 dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-200"
          : current.category === "motivation"
          ? "bg-amber-50/80 border-amber-200/80 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-200"
          : "bg-purple-50/80 border-purple-200/80 text-purple-900 dark:bg-purple-950/40 dark:border-purple-900/60 dark:text-purple-200"
      } ${className}`}
    >
      <div className="flex items-center gap-3 mb-1.5">
        <Loader2 className="w-4 h-4 animate-spin text-current flex-shrink-0" />
        <span className="text-xs font-bold uppercase tracking-wider">
          Please wait — {actionName}
          {dots}
        </span>
      </div>
      <p className="text-xs leading-relaxed flex items-center gap-1.5 pl-7 opacity-95">
        <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{current.text}</span>
      </p>
    </div>
  );
}
