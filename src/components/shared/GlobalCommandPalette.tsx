"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Calendar, Users, Image as ImageIcon, Ticket, HelpCircle, FileText, X } from "lucide-react";

export function GlobalCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  // Keyboard shortcut listener for Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navigateTo = (path: string) => {
    setOpen(false);
    setQuery("");
    router.push(path);
  };

  const quickLinks = [
    { title: "Explore All Events", path: "/events", icon: Calendar, cat: "Navigation" },
    { title: "District 3192 Chartered Clubs (85+)", path: "/clubs", icon: Users, cat: "Clubs" },
    { title: "Photo Gallery & Memorabilia", path: "/gallery", icon: ImageIcon, cat: "Media" },
    { title: "My Passes & Tickets", path: "/tickets", icon: Ticket, cat: "User" },
    { title: "District 3192 Council & Zones", path: "/district", icon: Users, cat: "About" },
    { title: "Help Center & FAQs", path: "/help", icon: HelpCircle, cat: "Support" },
    { title: "Contact District Leadership", path: "/contact", icon: FileText, cat: "Support" },
  ];

  const filteredLinks = quickLinks.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.cat.toLowerCase().includes(query.toLowerCase())
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigateTo(`/events?q=${encodeURIComponent(query.trim())}`);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Form */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search events, clubs, passes, or pages... (Press Enter to search)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-bold text-gray-900 placeholder:text-gray-400 outline-none"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <X size={16} />
          </button>
        </form>

        {/* Quick Results List */}
        <div className="p-3 max-h-80 overflow-y-auto space-y-1">
          <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-3 py-1.5">
            Quick Navigation
          </div>
          {filteredLinks.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-500">
              Press Enter to search events for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.path}
                  type="button"
                  onClick={() => navigateTo(link.path)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-blue-50 text-left group transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-100 group-hover:bg-[#1e9df1] group-hover:text-white text-gray-600 flex items-center justify-center transition-colors shrink-0">
                      <Icon size={16} />
                    </div>
                    <span className="text-xs font-bold text-gray-800 group-hover:text-gray-900">
                      {link.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 group-hover:bg-blue-100 group-hover:text-[#1e9df1] px-2 py-0.5 rounded-full transition-colors">
                    {link.cat}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-semibold">
          <span>Search events, clubs &amp; passes</span>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-gray-200 rounded shadow-2xs text-gray-600">
              ESC
            </kbd>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
