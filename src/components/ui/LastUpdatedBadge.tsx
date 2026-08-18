"use client";

import { Clock } from "lucide-react";

interface LastUpdatedBadgeProps {
  date?: string | Date;
  label?: string;
  className?: string;
  onClick?: () => void;
}

export function LastUpdatedBadge({
  date,
  label = "Last updated",
  className = "",
  onClick,
}: LastUpdatedBadgeProps) {
  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "RY 2026–27 (Current)";

  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 border border-gray-200/80 dark:border-gray-700/60 transition-all ${
        onClick ? "hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer hover:border-gray-300 dark:hover:border-gray-600" : ""
      } ${className}`}
    >
      <Clock size={12} className="text-[#0758fc]" />
      <span>
        {label}: <span className="font-extrabold text-gray-800 dark:text-gray-200">{formattedDate}</span>
      </span>
    </Tag>
  );
}
