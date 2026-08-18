"use client";

/**
 * Gallery Page — District 3192 Real Moments & Memories
 * Multi-photo scrollable albums, live database persistence,
 * edge-to-edge category filters, and admin/organizer upload modal.
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  Sparkles, MapPin, Calendar, Heart, X, ZoomIn, Share2, 
  Plus, ChevronLeft, ChevronRight, Trash2, Camera, Loader2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { 
  getGalleryPhotosAction, 
  deleteGalleryPhotoAction, 
  toggleGalleryPhotoLikeAction, 
  GalleryPhotoRecord 
} from "@/app/actions/galleryActions";
import { GalleryUploadModal } from "@/components/gallery/GalleryUploadModal";

const CATEGORIES = [
  { id: "all", label: "All Photos" },
  { id: "conference", label: "Conferences" },
  { id: "leadership", label: "Leadership" },
  { id: "fellowship", label: "Fellowship" },
  { id: "service", label: "Community Service" },
  { id: "sports", label: "Sports & Culturals" },
] as const;

function useSafeUser() {
  try {
    return useUser();
  } catch {
    return { isSignedIn: false, isLoaded: true, user: null };
  }
}

export default function GalleryPage() {
  const { isSignedIn, user } = useSafeUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const isSuperAdmin = userEmail === "tech.rotaract3192@gmail.com";

  const [items, setItems] = useState<GalleryPhotoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeItem, setActiveItem] = useState<GalleryPhotoRecord | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [cardPhotoIndices, setCardPhotoIndices] = useState<Record<string, number>>({});
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Load photos from real database
  async function loadPhotos() {
    setLoading(true);
    const res = await getGalleryPhotosAction(selectedCategory);
    if (res.success) {
      setItems(res.data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadPhotos();
  }, [selectedCategory]);

  function handleCardPrev(id: string, total: number, e: React.MouseEvent) {
    e.stopPropagation();
    setCardPhotoIndices((prev) => ({
      ...prev,
      [id]: ((prev[id] || 0) - 1 + total) % total,
    }));
  }

  function handleCardNext(id: string, total: number, e: React.MouseEvent) {
    e.stopPropagation();
    setCardPhotoIndices((prev) => ({
      ...prev,
      [id]: ((prev[id] || 0) + 1) % total,
    }));
  }

  async function handleToggleLike(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const wasLiked = likedMap[id];
    setLikedMap((prev) => ({ ...prev, [id]: !wasLiked }));
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, likes: it.likes + (wasLiked ? -1 : 1) } : it))
    );
    if (!wasLiked) {
      await toggleGalleryPhotoLikeAction(id);
    }
  }

  function handleShare(item: GalleryPhotoRecord, e: React.MouseEvent) {
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

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this moment from the gallery?")) return;
    const res = await deleteGalleryPhotoAction(id);
    if (res.success) {
      setItems((prev) => prev.filter((it) => it.id !== id));
      if (activeItem?.id === id) setActiveItem(null);
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white min-h-screen font-sans">
      
      {/* ── 1. MOBILE-OPTIMIZED HERO HEADER ───────────────────────────── */}
      <section className="py-8 sm:py-14 px-4 sm:px-6 md:px-8 text-center bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 animate-fade-in-up">
        <div className="max-w-2xl mx-auto space-y-3">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
            MOMENTS &amp; MEMORIES
          </h1>
          
          <p className="text-xs sm:text-sm md:text-base text-gray-500 dark:text-gray-400 font-normal leading-relaxed max-w-lg mx-auto">
            Capturing the spirit of fellowship, leadership, and community service across Rotaract District 3192.
          </p>

          {/* Add Moment CTA Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2 bg-[#1e9df1] hover:bg-[#1583cd] text-white font-extrabold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={16} /> Add Photos to Gallery
            </button>
          </div>
        </div>

        {/* Touch-Friendly Edge-to-Edge Horizontally Scrollable Filter Pills */}
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

      {/* ── 2. RESPONSIVE MULTI-PHOTO GALLERY GRID ─────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 size={32} className="animate-spin text-[#1e9df1] mx-auto" />
            <p className="text-xs text-gray-400 font-bold">Loading District Moments...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="w-full max-w-xl mx-auto text-center py-16 sm:py-20 border border-gray-200 dark:border-gray-800 rounded-3xl bg-white dark:bg-gray-900 p-6 sm:p-8 shadow-xs animate-fade-in-up space-y-4">
            <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#1e9df1] flex items-center justify-center mx-auto">
              <Camera size={28} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                No gallery moments in this category yet
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 w-full max-w-md mx-auto mt-1 leading-relaxed">
                Be the first to upload official conference, fellowship, or community photos!
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-1.5 bg-[#1e9df1] hover:bg-[#1583cd] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              <Plus size={15} /> Upload Photos
            </button>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8"
          >
            {items.map((item) => {
              const images = item.image_urls && item.image_urls.length > 0 ? item.image_urls : ["/brand/logo.png"];
              const currentIndex = cardPhotoIndices[item.id] || 0;
              const currentImageUrl = images[currentIndex] || images[0];
              const isLiked = likedMap[item.id];
              const canDelete = isSuperAdmin || (userEmail && userEmail === item.uploader_email?.toLowerCase());

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  key={item.id}
                  onClick={() => {
                    setActiveItem(item);
                    setLightboxIndex(currentIndex);
                  }}
                  className="group relative rounded-3xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col active:scale-[0.99] touch-manipulation"
                >
                  {/* Photo aspect ratio container with Multi-Photo Controls */}
                  <div className="relative w-full aspect-4/3 overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <Image
                      src={currentImageUrl}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Multi-Photo Indicator Badge */}
                    {images.length > 1 && (
                      <div className="absolute top-3 left-3 bg-black/65 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full border border-white/20 shadow-xs flex items-center gap-1 z-10">
                        <span>{currentIndex + 1} / {images.length}</span>
                      </div>
                    )}

                    {/* Carousel Nav Arrows for Multi-Photo Cards */}
                    {images.length > 1 && (
                      <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none z-10">
                        <button
                          type="button"
                          onClick={(e) => handleCardPrev(item.id, images.length, e)}
                          className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center pointer-events-auto transition-transform active:scale-90 cursor-pointer"
                          aria-label="Previous photo"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleCardNext(item.id, images.length, e)}
                          className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center pointer-events-auto transition-transform active:scale-90 cursor-pointer"
                          aria-label="Next photo"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}
                    
                    {/* Top-right Like, Share, and Delete Buttons */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                      {canDelete && (
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          className="w-8 h-8 rounded-full bg-rose-600/90 text-white backdrop-blur-md flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-xs cursor-pointer"
                          aria-label="Delete moment"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}

                      <button
                        onClick={(e) => handleShare(item, e)}
                        className="w-8 h-8 rounded-full bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-200 backdrop-blur-md flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-xs cursor-pointer"
                        aria-label="Share photo"
                      >
                        <Share2 size={13} />
                      </button>

                      <button
                        onClick={(e) => handleToggleLike(item.id, e)}
                        className={`w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-xs cursor-pointer ${
                          isLiked ? "bg-[#1e9df1] text-white" : "bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-200"
                        }`}
                        aria-label="Like moment"
                      >
                        <Heart size={14} fill={isLiked ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </div>

                  {/* Card Bottom Meta */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-2.5">
                    <div>
                      <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        <span className="text-[#1e9df1] font-black">{item.category}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><MapPin size={11} /> {item.city || "District 3192"}</span>
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
                        {item.likes}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>

      {/* ── 3. FULL LIGHTBOX MODAL WITH MULTI-PHOTO SLIDER ────────────────── */}
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
              className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row text-gray-900 dark:text-white max-h-[92vh] sm:max-h-none overflow-y-auto"
            >
              {/* Modal Image Slider */}
              <div className="relative w-full md:w-3/5 aspect-4/3 sm:aspect-video md:aspect-auto min-h-[260px] sm:min-h-[380px] bg-black shrink-0 flex items-center justify-center">
                {activeItem.image_urls && activeItem.image_urls.length > 0 && (
                  <Image
                    src={activeItem.image_urls[lightboxIndex] || activeItem.image_urls[0]}
                    alt={activeItem.title}
                    fill
                    className="object-contain"
                  />
                )}

                {/* Lightbox Slider Buttons */}
                {activeItem.image_urls && activeItem.image_urls.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setLightboxIndex((idx) =>
                          (idx - 1 + activeItem.image_urls.length) % activeItem.image_urls.length
                        )
                      }
                      className="absolute left-3 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-transform active:scale-90 cursor-pointer z-10"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() =>
                        setLightboxIndex((idx) => (idx + 1) % activeItem.image_urls.length)
                      }
                      className="absolute right-3 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-transform active:scale-90 cursor-pointer z-10"
                      aria-label="Next photo"
                    >
                      <ChevronRight size={20} />
                    </button>
                    <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 z-10">
                      {activeItem.image_urls.map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full transition-all ${
                            lightboxIndex === i ? "bg-[#1e9df1] w-5" : "bg-white/50"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
                
                {/* Close Button on Mobile overlay */}
                <button
                  onClick={() => setActiveItem(null)}
                  className="sm:hidden absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer shadow-lg active:scale-95 z-20"
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
                    {activeItem.description || "Captured live during Rotaract District 3192 flagship events."}
                  </p>

                  <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
                    <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Location:</span>
                      <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
                        <MapPin size={13} className="text-[#1e9df1]" /> {activeItem.city || "District 3192"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Event Date:</span>
                      <span className="font-bold text-gray-900 dark:text-white">{activeItem.date}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Total Photos:</span>
                      <span className="font-bold text-gray-900 dark:text-white">{activeItem.image_urls?.length || 1} Photo(s)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={(e) => handleToggleLike(activeItem.id, e)}
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

      {/* ── 4. MULTI-PHOTO UPLOAD MODAL ───────────────────────────────── */}
      <GalleryUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => loadPhotos()}
      />

    </div>
  );
}
