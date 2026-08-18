"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface FaqItem {
  question: string;
  answer: string;
  category?: string;
}

export function ExpandableFaq({
  items,
  title = "Frequently Asked Questions",
  description = "Find fast answers to common questions about ticket booking, QR passes, and venue entry.",
}: {
  items: FaqItem[];
  title?: string;
  description?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#0758fc] text-xs font-bold border border-blue-200 dark:border-blue-900/50">
          <HelpCircle size={14} />
          <span>HELP &amp; FAQS</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          {description}
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden transition-all shadow-2xs hover:border-gray-300 dark:hover:border-gray-700"
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                aria-expanded={isOpen}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
              >
                <span className="text-sm font-extrabold text-gray-900 dark:text-white leading-snug">
                  {item.question}
                </span>
                <div
                  className={`w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180 bg-[#0758fc] text-white" : ""
                  }`}
                >
                  <ChevronDown size={16} />
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-5 pb-5 pt-1 text-xs text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-800/80">
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
