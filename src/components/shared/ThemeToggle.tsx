"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  const applyTheme = (mode: "light" | "dark") => {
    setTheme(mode);
    try {
      localStorage.setItem("rotasphere-theme", mode);
    } catch {}

    const root = document.documentElement;
    const body = document.body;

    if (mode === "dark") {
      root.classList.add("dark");
      body.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      body.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  };

  useEffect(() => {
    setMounted(true);
    let initial: "light" | "dark" = "light";
    try {
      const saved = localStorage.getItem("rotasphere-theme") as "light" | "dark" | null;
      if (saved) {
        initial = saved;
      } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        initial = "dark";
      }
    } catch {}

    applyTheme(initial);

    const handleSync = (e: CustomEvent<"light" | "dark">) => {
      if (e.detail && (e.detail === "light" || e.detail === "dark")) {
        setTheme(e.detail);
      }
    };

    window.addEventListener("rotasphere-theme-change" as any, handleSync as any);
    return () => {
      window.removeEventListener("rotasphere-theme-change" as any, handleSync as any);
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    applyTheme(next);
    window.dispatchEvent(new CustomEvent("rotasphere-theme-change", { detail: next }));
  };

  if (!mounted) {
    return (
      <div className={`w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 ${className}`} />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
        theme === "dark"
          ? "bg-gray-800 text-amber-300 hover:bg-gray-700 ring-1 ring-white/10 shadow-inner"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 shadow-2xs"
      } ${className}`}
    >
      {theme === "dark" ? (
        <Sun size={17} className="transition-transform rotate-0 hover:rotate-45" />
      ) : (
        <Moon size={17} className="transition-transform rotate-0 hover:-rotate-12" />
      )}
    </button>
  );
}
