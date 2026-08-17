"use client";

import React from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export function FormSuccessAlert({
  title = "Success",
  message,
  onDismiss,
}: {
  title?: string;
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start justify-between gap-3 text-emerald-900 dark:text-emerald-200 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-start gap-3">
        <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-xs font-black uppercase tracking-wider">{title}</p>
          <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">{message}</p>
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-emerald-600 dark:text-emerald-400 hover:opacity-75 cursor-pointer p-0.5"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export function FormErrorAlert({
  title = "Error",
  message,
  onDismiss,
}: {
  title?: string;
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start justify-between gap-3 text-rose-900 dark:text-rose-200 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-start gap-3">
        <AlertCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-xs font-black uppercase tracking-wider">{title}</p>
          <p className="text-xs font-medium text-rose-800 dark:text-rose-300">{message}</p>
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-rose-600 dark:text-rose-400 hover:opacity-75 cursor-pointer p-0.5"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
