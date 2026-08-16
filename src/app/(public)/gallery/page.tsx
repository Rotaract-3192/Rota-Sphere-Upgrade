"use client";

/**
 * Gallery Page — District 3192 Moments & Memories
 * High-resolution interactive photography showcase for Rotaract events.
 */

import { useState } from "react";
import Image from "next/image";
import { Sparkles, MapPin, Calendar, Heart, Eye, Filter, X } from "lucide-react";

interface GalleryItem {
  id: string;
  title: string;
  category: "conference" | "leadership" | "fellowship" | "service" | "sports";
  city: string;
  date: string;
  imageUrl: string;
  likes: number;
}

const GALLERY_ITEMS: GalleryItem[] = [];

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

  function toggleLike(id: string) {
    setLikedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="bg-[#0b0d12] text-white min-h-screen font-sans">
      {/* ── 1. HERO HEADER ────────────────────────────────────────────── */}
      <section className="relative py-16 sm:py-20 px-4 sm:px-8 text-center border-b border-white/10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-[#0b0d12] to-[#0b0d12]">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-widest">
            <Sparkles size={14} className="text-amber-400" /> District 3192 Visual Archives
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
            MOMENTS & MEMORIES
          </h1>
          <p className="text-base sm:text-lg text-gray-300 font-light max-w-xl mx-auto">
            Capturing the spirit of fellowship, leadership, and community service across Rotaract District 3192.
          </p>

          {/* Filter Pills */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-2">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={[
                    "px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer",
                    active
                      ? "bg-amber-400 text-gray-900 shadow-md shadow-amber-400/20 scale-105"
                      : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 2. GALLERY MASONRY GRID ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 border border-white/10 rounded-3xl bg-white/5 backdrop-blur-md p-8">
            <Sparkles className="mx-auto text-amber-400 mb-3" size={36} />
            <h3 className="text-lg font-bold text-white">No gallery moments uploaded yet</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto mt-1">
              Event photos and highlights from District 3192 will appear here once uploaded.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const isLiked = likedMap[item.id];
              return (
                <div
                  key={item.id}
                  className="group relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-md shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-400/50"
                >
                  {/* Photo aspect ratio container */}
                  <div className="relative w-full aspect-4/3 overflow-hidden bg-gray-900">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                    {/* Top-right Like button */}
                    <button
                      onClick={() => toggleLike(item.id)}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center hover:scale-110 transition-transform"
                      aria-label="Like moment"
                    >
                      <Heart
                        size={18}
                        className={isLiked ? "fill-[#ff385c] text-[#ff385c]" : "text-white/80"}
                      />
                    </button>

                    {/* Top-left Category badge */}
                    <div className="absolute top-3 left-3 bg-amber-400/90 text-gray-900 font-bold px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider shadow-sm">
                      {item.category}
                    </div>

                    {/* Lightbox trigger button */}
                    <button
                      onClick={() => setActiveItem(item)}
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 cursor-pointer"
                    >
                      <span className="w-12 h-12 rounded-full bg-amber-400 text-gray-900 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                        <Eye size={20} />
                      </span>
                    </button>
                  </div>

                  {/* Info Footer */}
                  <div className="p-5 space-y-2">
                    <h3 className="text-base font-bold text-white line-clamp-1">{item.title}</h3>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1 text-amber-300 font-semibold">
                        <MapPin size={13} /> {item.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={13} /> {item.date}
                      </span>
                      <span className="text-gray-400 font-medium">
                        ❤️ {item.likes + (isLiked ? 1 : 0)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 3. LIGHTBOX PREVIEW MODAL ──────────────────────────────────── */}
      {activeItem && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-[#121620] border border-white/15 rounded-3xl overflow-hidden shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => setActiveItem(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-white hover:text-gray-900 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="relative w-full aspect-16/9 bg-black">
              <Image
                src={activeItem.imageUrl}
                alt={activeItem.title}
                fill
                className="object-contain"
              />
            </div>

            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/10 bg-black/50">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  {activeItem.category} · {activeItem.city}
                </span>
                <h3 className="text-xl font-extrabold text-white mt-0.5">{activeItem.title}</h3>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-300">
                <span className="flex items-center gap-1"><Calendar size={15} /> {activeItem.date}</span>
                <button
                  onClick={() => toggleLike(activeItem.id)}
                  className="flex items-center gap-1 px-4 py-2 rounded-full bg-white/10 hover:bg-amber-400 hover:text-gray-900 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Heart size={14} className={likedMap[activeItem.id] ? "fill-red-500 text-red-500" : ""} />
                  {activeItem.likes + (likedMap[activeItem.id] ? 1 : 0)} Likes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
