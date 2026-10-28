import { clsx } from "clsx";
import { InvoiceStatus } from "@/types";

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize",
        status === "paid" && "bg-green-100 text-green-700",
        status === "pending" && "bg-orange-100 text-orange-700",
        status === "overdue" && "bg-red-100 text-red-700",
        status === "cancelled" && "bg-gray-100 text-gray-700"
      )}
    >
      {status === "paid" && "✓ "}
      {status === "pending" && "⏳ "}
      {status === "overdue" && "⚠ "}
      {status === "cancelled" && "✕ "}
      {status}
    </span>
  );
}
