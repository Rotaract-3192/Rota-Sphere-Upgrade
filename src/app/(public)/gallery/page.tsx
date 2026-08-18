"use client";

/**
 * Gallery Page — District 3192 Moments & Memories
 * Fully mobile-responsive photography showcase for Rotaract events.
 * Features: Horizontal touch-scroll filter pills, fluid card animations, high-contrast badges, and mobile bottom-sheet lightbox.
 */

import { useState } from "react";
import Image from "next/image";
import { Sparkles, MapPin, Calendar, Heart, X, ZoomIn, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GalleryItem {
  id: string;
  title: string;
  category: "conference" | "leadership" | "fellowship" | "service" | "sports";
  city: string;
  date: string;
  imageUrl: string;
  likes: number;
  description?: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "gal-1",
    title: "District Conference 2026 Opening Gala",
    category: "conference",
    city: "Bengaluru",
    date: "Feb 2026",
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80",
    likes: 142,
    description: "Over 800 delegates gathered for the ceremonial lighting and keynote addresses at District Conference Synergy.",
  },
  {
    id: "gal-2",
    title: "Youth Leadership Conclave & Trek",
    category: "leadership",
    city: "Nandi Hills, Bengaluru",
    date: "Jan 2026",
    imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80",
    likes: 98,
    description: "Outdoor team-building immersion fostering resilience, leadership communication, and camaraderie.",
  },
  {
    id: "gal-3",
    title: "Annual Awards & Recognition Night",
    category: "fellowship",
    city: "Bengaluru",
    date: "Dec 2025",
    imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80",
    likes: 215,
    description: "Celebrating outstanding community impact projects and stellar club leadership across District 3192.",
  },
  {
    id: "gal-4",
    title: "Green Earth Mega Tree Plantation Drive",
    category: "service",
    city: "Tumakuru",
    date: "Nov 2025",
    imageUrl: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=1200&auto=format&fit=crop&q=80",
    likes: 176,
    description: "Volunteers planted 5,000+ saplings in urban green belts as part of District 3192's climate action initiative.",
  },
  {
    id: "gal-5",
    title: "Inter-Club Sports League Championship",
    category: "sports",
    city: "Kolar",
    date: "Oct 2025",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80",
    likes: 134,
    description: "High-energy athletics, football, and cricket showdown bringing together 30+ Rotaract clubs.",
  },
  {
    id: "gal-6",
    title: "Global Changemakers Keynote Session",
    category: "conference",
    city: "Bengaluru",
    date: "Sep 2025",
    imageUrl: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&auto=format&fit=crop&q=80",
    likes: 189,
    description: "Distinguished speakers sharing actionable insights on social entrepreneurship and youth innovation.",
  },
];

const CATEGORIES = [
  { id: "all", label: "All Photos" },
  { id: "conference", label: "Conferences" },
  { id: "leadership", label: "Leadership" },
  { id: "fellowship", label: "Fellowship" },
  { id: "service", label: "Community Service" },
  { id: "sports", label: "Sports & Culturals" },
] as const;

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  const filteredItems = selectedCategory === "all"
    ? GALLERY_ITEMS
    : GALLERY_ITEMS.filter((item) => item.category === selectedCategory);

  function toggleLike(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setLikedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleShare(item: GalleryItem, e: React.MouseEvent) {
    e.stopPropagation();
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: item.title,
        text: `Check out ${item.title} on RotaSphere District 3192!`,
        url: window.location.href,
      }).catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white min-h-screen font-sans">
      
      {/* ── 1. MOBILE-OPTIMIZED HERO HEADER ───────────────────────────── */}
      <section className="py-8 sm:py-14 px-4 sm:px-6 md:px-8 text-center bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 animate-fade-in-up">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1e9df1]/10 text-[#1e9df1] text-[11px] sm:text-xs font-black uppercase tracking-widest">
            <Sparkles size={13} /> District 3192 Visual Archives
          </div>
          
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
            MOMENTS &amp; MEMORIES
          </h1>
          
          <p className="text-xs sm:text-sm md:text-base text-gray-500 dark:text-gray-400 font-normal leading-relaxed max-w-lg mx-auto">
            Capturing the spirit of fellowship, leadership, and community service across Rotaract District 3192.
          </p>
        </div>

        {/* Touch-Friendly Edge-to-Edge Horizontally Scrollable Filter Pills on Mobile */}
        <div className="mt-6 -mx-4 px-4 sm:mx-auto sm:px-0 max-w-4xl">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none sm:justify-center">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer touch-manipulation active:scale-95 whitespace-nowrap ${
                    active
                      ? "bg-[#1e9df1] text-white shadow-md shadow-[#1e9df1]/25"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 2. RESPONSIVE GALLERY GRID ────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {filteredItems.length === 0 ? (
          <div className="w-full max-w-xl mx-auto text-center py-16 sm:py-20 border border-gray-200 dark:border-gray-800 rounded-3xl bg-white dark:bg-gray-900 p-6 sm:p-8 shadow-xs animate-fade-in-up">
            <Sparkles className="mx-auto text-[#1e9df1] mb-3" size={32} />
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">No moments in this category yet</h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 w-full max-w-md mx-auto mt-2 leading-relaxed">
              Event photos and highlights from District 3192 will appear here once uploaded.
            </p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8"
          >
            {filteredItems.map((item) => {
              const isLiked = likedMap[item.id];
              const likesCount = item.likes + (isLiked ? 1 : 0);

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  key={item.id}
                  onClick={() => setActiveItem(item)}
                  className="group relative rounded-3xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col active:scale-[0.99] touch-manipulation"
                >
                  {/* Photo aspect ratio container */}
                  <div className="relative w-full aspect-4/3 overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Top-right Like & Share Buttons with 40px touch target */}
                    <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                      <button
                        onClick={(e) => handleShare(item, e)}
                        className="w-9 h-9 rounded-full bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-200 backdrop-blur-md flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-xs cursor-pointer"
                        aria-label="Share photo"
                      >
                        <Share2 size={14} />
                      </button>

                      <button
                        onClick={(e) => toggleLike(item.id, e)}
                        className={`w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-xs cursor-pointer ${
                          isLiked ? "bg-[#1e9df1] text-white" : "bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-200"
                        }`}
                        aria-label="Like moment"
                      >
                        <Heart size={15} fill={isLiked ? "currentColor" : "none"} />
                      </button>
                    </div>

                    {/* Overlay Zoom Icon on hover */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center">
                      <span className="w-10 h-10 rounded-full bg-white/90 text-gray-900 flex items-center justify-center shadow-lg">
                        <ZoomIn size={18} />
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom Meta */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-2.5">
                    <div>
                      <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        <span className="text-[#1e9df1] font-black">{item.category}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><MapPin size={11} /> {item.city}</span>
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white leading-snug group-hover:text-[#1e9df1] transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 dark:border-gray-800 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-gray-400" /> {item.date}
                      </span>
                      <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300 font-bold">
                        <Heart size={13} className={isLiked ? "text-[#1e9df1] fill-[#1e9df1]" : "text-gray-400"} />
                        {likesCount}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>

      {/* ── 3. MOBILE-OPTIMIZED FULL LIGHTBOX MODAL ───────────────────── */}
      <AnimatePresence>
        {activeItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveItem(null)}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4 md:p-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row text-gray-900 dark:text-white max-h-[90vh] sm:max-h-none overflow-y-auto"
            >
              {/* Modal Image */}
              <div className="relative w-full md:w-3/5 aspect-4/3 sm:aspect-video md:aspect-auto min-h-[240px] sm:min-h-[360px] bg-black shrink-0">
                <Image
                  src={activeItem.imageUrl}
                  alt={activeItem.title}
                  fill
                  className="object-cover"
                />
                
                {/* Close Button on Mobile overlay */}
                <button
                  onClick={() => setActiveItem(null)}
                  className="sm:hidden absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer shadow-lg active:scale-95"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Meta Details */}
              <div className="w-full md:w-2/5 p-5 sm:p-6 md:p-8 flex flex-col justify-between space-y-4 sm:space-y-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="hidden sm:flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-[#1e9df1]/10 text-[#1e9df1] tracking-wider">
                      {activeItem.category}
                    </span>
                    <button
                      onClick={() => setActiveItem(null)}
                      className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <h2 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 dark:text-white leading-tight">
                    {activeItem.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {activeItem.description || "Captured live during Rotaract District 3192 events and assemblies."}
                  </p>

                  <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
                    <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Location:</span>
                      <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
                        <MapPin size={13} className="text-[#1e9df1]" /> {activeItem.city}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Event Date:</span>
                      <span className="font-bold text-gray-900 dark:text-white">{activeItem.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={(e) => toggleLike(activeItem.id, e)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer active:scale-95 touch-manipulation ${
                      likedMap[activeItem.id]
                        ? "bg-[#1e9df1] text-white shadow-md shadow-[#1e9df1]/20"
                        : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                    }`}
                  >
                    <Heart size={15} fill={likedMap[activeItem.id] ? "currentColor" : "none"} />
                    <span>{likedMap[activeItem.id] ? "Liked" : "Like Photo"}</span>
                  </button>

                  <button
                    onClick={() => setActiveItem(null)}
                    className="px-5 py-3 rounded-2xl bg-gray-900 dark:bg-gray-700 hover:bg-black text-white text-xs font-bold cursor-pointer active:scale-95"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
