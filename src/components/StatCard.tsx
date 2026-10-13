import { clsx } from "clsx";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  color: "blue" | "green" | "orange" | "purple" | "red";
  trend?: string;
}

const colorMap = {
  blue: {
    bg: "bg-blue-50",
    icon: "bg-blue-100 text-blue-600",
    value: "text-blue-700",
    badge: "bg-blue-100 text-blue-600",
  },
  green: {
    bg: "bg-green-50",
    icon: "bg-green-100 text-green-600",
    value: "text-green-700",
    badge: "bg-green-100 text-green-600",
  },
  orange: {
    bg: "bg-orange-50",
    icon: "bg-orange-100 text-orange-600",
    value: "text-orange-700",
    badge: "bg-orange-100 text-orange-600",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "bg-purple-100 text-purple-600",
    value: "text-purple-700",
    badge: "bg-purple-100 text-purple-600",
  },
  red: {
    bg: "bg-red-50",
    icon: "bg-red-100 text-red-600",
    value: "text-red-700",
    badge: "bg-red-100 text-red-600",
  },
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={clsx("rounded-2xl p-5 border border-white/60 shadow-sm", c.bg)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">{title}</p>
          <p className={clsx("text-2xl font-bold", c.value)}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center", c.icon)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {trend && (
        <div className={clsx("inline-flex items-center mt-3 px-2 py-0.5 rounded-full text-xs font-medium", c.badge)}>
          {trend}
        </div>
      )}
    </div>
  );
}
