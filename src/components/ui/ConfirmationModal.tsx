"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmationModal({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 text-gray-900 dark:text-white"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                isDestructive
                  ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                  : "bg-blue-50 dark:bg-blue-950/50 text-[#0758fc]"
              }`}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">{title}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{description}</p>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-2xl text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 font-extrabold py-3 rounded-2xl text-xs transition-all shadow-md cursor-pointer disabled:opacity-50 text-white ${
              isDestructive
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                : "bg-[#0758fc] hover:bg-[#054fe0] shadow-[#0758fc]/20"
            }`}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
