"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function PasswordInput({
  label,
  error,
  className = "",
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          className={`w-full bg-gray-50 dark:bg-gray-800 border ${
            error ? "border-rose-400 focus:border-rose-500" : "border-gray-200 dark:border-gray-700 focus:border-[#0758fc]"
          } rounded-2xl pl-4 pr-12 py-3 text-xs font-medium text-gray-900 dark:text-white outline-none transition-all ${className}`}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 cursor-pointer transition-colors"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && (
        <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 animate-in fade-in">
          {error}
        </p>
      )}
    </div>
  );
}
