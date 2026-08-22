"use client";

/**
 * GalleryUploadModal — Multi-Photo Uploader for Super Admin & Organizers
 * Allows adding multiple photos per moment, selecting category, city, and date.
 */

import { useState } from "react";
import { X, Plus, Trash2, Image as ImageIcon, Sparkles, Loader2, Upload, CheckCircle2 } from "lucide-react";
import { createGalleryPhotoAction } from "@/app/actions/galleryActions";
import { motion, AnimatePresence } from "framer-motion";

interface GalleryUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES = [
  { id: "conference", label: "Conferences" },
  { id: "leadership", label: "Leadership" },
  { id: "fellowship", label: "Fellowship" },
  { id: "service", label: "Community Service" },
  { id: "sports", label: "Sports & Culturals" },
] as const;

export function GalleryUploadModal({ isOpen, onClose, onSuccess }: GalleryUploadModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("conference");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  function handleAddImageUrl() {
    setImageUrls((prev) => [...prev, ""]);
  }

  function handleRemoveImageUrl(index: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function handleImageUrlChange(index: number, val: string) {
    setImageUrls((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, index: number) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        handleImageUrlChange(index, result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validUrls = imageUrls.map((u) => u.trim()).filter((u) => u.length > 0);
    if (!title.trim()) {
      setError("Please provide a title for this moment");
      return;
    }
    if (validUrls.length === 0) {
      setError("Please add at least one photo URL or upload an image file");
      return;
    }

    setLoading(true);
    const res = await createGalleryPhotoAction({
      title: title.trim(),
      category,
      city: city.trim(),
      date: date.trim(),
      imageUrls: validUrls,
      description: description.trim(),
    });

    setLoading(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1200);
    } else {
      setError(res.error || "Failed to publish gallery photos");
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#0758fc] flex items-center justify-center">
              <ImageIcon size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                Add Moment to District Gallery
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Upload one or multiple photos for attendees to scroll &amp; explore
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors active:scale-95"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        {success ? (
          <div className="p-12 text-center space-y-3">
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto animate-bounce" />
            <h4 className="text-xl font-black text-gray-900 dark:text-white">Photos Published Live!</h4>
            <p className="text-xs text-gray-500">The new album has been added to the District Gallery.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {error && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs font-bold text-rose-700 dark:text-rose-400">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Album / Moment Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., District Assembly Synergy 2026 Keynote"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-[#0758fc]"
              />
            </div>

            {/* Category & City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-[#0758fc] cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  City / Location
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g., Bengaluru / Tumakuru / Kolar"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-[#0758fc]"
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Event Date Tag
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="e.g., Feb 2026 or 18 Aug 2026"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-[#0758fc]"
              />
            </div>

            {/* Multiple Photos Container */}
            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                  Photos ({imageUrls.filter((u) => u.trim().length > 0).length} added)
                </label>
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="text-xs font-bold text-[#0758fc] hover:underline flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Plus size={14} /> Add Another Photo
                </button>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {imageUrls.map((url, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-gray-50 dark:bg-gray-800/60 p-3 rounded-2xl border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex-1 space-y-2">
                      <input
                        type="url"
                        value={url.startsWith("data:") ? "[Local Uploaded Image File]" : url}
                        onChange={(e) => handleImageUrlChange(index, e.target.value)}
                        placeholder={`Photo ${index + 1} Image URL (https://...)`}
                        disabled={url.startsWith("data:")}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-[#0758fc]"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold cursor-pointer transition-colors shrink-0">
                        <Upload size={13} />
                        <span>File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, index)}
                          className="hidden"
                        />
                      </label>

                      {imageUrls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveImageUrl(index)}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                          aria-label="Remove photo"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Description / Highlights
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share key highlights or context about this moment..."
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-[#0758fc] resize-none"
              />
            </div>

            {/* Footer Submit */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                Publish Moment
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
