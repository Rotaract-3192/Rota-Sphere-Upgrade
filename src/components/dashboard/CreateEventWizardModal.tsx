"use client";

/**
 * Premium 5-Step Event Creation Wizard Modal
 * Matches website theme (#ff385c brand, crisp white canvas, dark ink text, smooth borders, local device image upload, and Google Maps auto-fill).
 */

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Sparkles,
  Ticket,
  Users,
  Clock,
  ShieldCheck,
  X,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Check,
  Globe,
  Lock,
  Search,
  Bell,
  Mail,
  Phone,
  Compass,
  CheckCircle2,
  UploadCloud,
  ImageIcon,
  FolderOpen,
} from "lucide-react";
import { createEventAction, parseGoogleMapsUrlAction, CreateEventInput } from "@/app/actions/eventActions";
import type { EventFormat, TicketTierType } from "@/types/saas";

interface CreateEventWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (slug: string) => void;
}

const BANNER_PRESETS = [
  { label: "Tech Hall", url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80" },
  { label: "Developer Meetup", url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&auto=format&fit=crop&q=80" },
  { label: "Concert Lights", url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80" },
  { label: "DJ Stage", url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80" },
  { label: "Corporate Speech", url: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&auto=format&fit=crop&q=80" },
];

const ROTARACT_CLUBS = [
  "Rotaract Club of Bangalore",
  "Rotaract Club of Bangalore Junction",
  "Rotaract Club of Surat West",
  "Rotaract Club of Ahmedabad Greater",
  "Rotaract Club of Vadodara Midtown",
  "Rotaract Club of Rajkot Youth",
  "Rotaract Club of PES University",
  "Rotaract Club of RVCE",
  "Rotaract District 3192 Council",
];

const CATEGORIES = [
  "Community Service",
  "Professional Development",
  "Conferences & Summits",
  "Youth Leadership & TEDx",
  "Cultural & Arts Festival",
  "Sports & Athletics",
  "Impact & Social Service",
  "Workshops & Masterclasses",
];

export function CreateEventWizardModal({ isOpen, onClose, onSuccess }: CreateEventWizardModalProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [touchedSteps, setTouchedSteps] = useState<Record<number, boolean>>({});

  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Step 1: Basic Info
  const [title, setTitle] = useState("RotaSphere Global Tech Summit 2026");
  const [slug, setSlug] = useState("rotasphere-global-tech-summit-2026");
  const [tagline, setTagline] = useState("A concise, one-sentence description summarizing the event main theme.");
  const [description, setDescription] = useState(
    "Describe details, schedules, keynote presenters, food offerings, networking schedules..."
  );
  const [bannerUrl, setBannerUrl] = useState(BANNER_PRESETS[0].url);
  const [bannerFileName, setBannerFileName] = useState<string | null>(null);
  
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80");
  const [thumbnailFileName, setThumbnailFileName] = useState<string | null>(null);

  // Step 2: Date & Time
  const now = new Date();
  const defaultStart = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 16);
  const defaultEnd = new Date(now.getTime() + 9 * 86400000).toISOString().slice(0, 16);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [timezone, setTimezone] = useState("Eastern Standard Time (EST) - UTC-5");

  // Step 3: Event Settings
  const [priceModel, setPriceModel] = useState<"FREE" | "PAID">("FREE");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [hostingClub, setHostingClub] = useState("Rotaract District 3192 Council");
  const [locationDeliveryType, setLocationDeliveryType] = useState<"IN_PERSON" | "ONLINE" | "HYBRID">("IN_PERSON");

  // Ticket Tiers
  const [capacity, setCapacity] = useState(500);
  const [allowWaitlist, setAllowWaitlist] = useState(true);
  const [allowTransfer, setAllowTransfer] = useState(true);
  const [allowRefunds, setAllowRefunds] = useState(true);
  const [ticketTiers, setTicketTiers] = useState<
    Array<{ name: string; tierType: TicketTierType; price: number; totalCapacity: number; description?: string }>
  >([
    { name: "General Admission Pass", tierType: "REGULAR", price: 0, totalCapacity: 500, description: "Complimentary delegate pass" },
  ]);

  // Step 4: Venue Details & Google Maps Auto-Fill
  const [mapsUrl, setMapsUrl] = useState("");
  const [mapsLoading, setMapsLoading] = useState(false);
  const [mapsSuccess, setMapsSuccess] = useState<string | null>(null);

  const [venueName, setVenueName] = useState("Moscone Convention Center");
  const [venueDirections, setVenueDirections] = useState("Enter through West Lobby building doors");
  const [country, setCountry] = useState("United States");
  const [stateRegion, setStateRegion] = useState("California");
  const [city, setCity] = useState("San Francisco");
  const [streetAddress, setStreetAddress] = useState("747 Howard St");
  const [pincode, setPincode] = useState("94103");
  const [onlineMeetingUrl, setOnlineMeetingUrl] = useState("");

  // Step 5: Additional Details
  const [category, setCategory] = useState("Community Service");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(["leadership", "rotaract", "tech"]);
  const [contactEmail, setContactEmail] = useState("support@rotasphere.com");
  const [contactPhone, setContactPhone] = useState("+1 (555) 019-2834");

  if (!isOpen) return null;

  function handleTitleChange(val: string) {
    setTitle(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(autoSlug);
  }

  function handleThumbnailFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select an image file (PNG, JPG, JPEG, WEBP)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setThumbnailUrl(event.target.result as string);
        setThumbnailFileName(file.name);
        setErrorMessage(null);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleBannerFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select an image file (PNG, JPG, JPEG, WEBP)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setBannerUrl(event.target.result as string);
        setBannerFileName(file.name);
        setErrorMessage(null);
      }
    };
    reader.readAsDataURL(file);
  }

  function handlePriceModelChange(model: "FREE" | "PAID") {
    setPriceModel(model);
    if (model === "FREE") {
      setTicketTiers([
        { name: "Complimentary Pass", tierType: "COMPLIMENTARY", price: 0, totalCapacity: capacity, description: "Free delegate entry" },
      ]);
    } else {
      setTicketTiers([
        { name: "Early Bird Delegate Pass", tierType: "EARLY_BIRD", price: 499, totalCapacity: 100, description: "Full access + kit" },
        { name: "VIP All-Access", tierType: "VIP", price: 1299, totalCapacity: 50, description: "VIP front row seating" },
        { name: "General Admission", tierType: "REGULAR", price: 799, totalCapacity: 350, description: "Full event access" },
      ]);
    }
  }

  async function handleAutoFillMaps() {
    if (!mapsUrl.trim()) {
      setErrorMessage("Please paste a Google Maps link or place name");
      return;
    }

    setMapsLoading(true);
    setErrorMessage(null);
    setMapsSuccess(null);

    const res = await parseGoogleMapsUrlAction(mapsUrl.trim());
    setMapsLoading(false);

    if (res.success) {
      if (res.venueName) setVenueName(res.venueName);
      if (res.streetAddress) setStreetAddress(res.streetAddress);
      if (res.city) setCity(res.city);
      if (res.stateRegion) setStateRegion(res.stateRegion);
      if (res.country) setCountry(res.country);
      if (res.pincode) setPincode(res.pincode);
      if (res.venueDirections) setVenueDirections(res.venueDirections);

      setMapsSuccess(`✓ Successfully auto-filled: ${res.venueName} (${res.city}, ${res.stateRegion})`);
    } else {
      setErrorMessage(res.error || "Failed to auto-fill location from link");
    }
  }

  function handleAddTag() {
    if (!tagInput.trim()) return;
    const clean = tagInput.trim().toLowerCase().replace(/[^\w-]/g, "");
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput("");
  }

  function handleRemoveTag(t: string) {
    setTags(tags.filter((item) => item !== t));
  }

  function handleNext() {
    setTouchedSteps({ ...touchedSteps, [currentStep]: true });

    if (currentStep === 1 && !title.trim()) {
      setErrorMessage("Please enter an event title");
      return;
    }
    if (currentStep === 2 && !startDate) {
      setErrorMessage("Start date and time is required");
      return;
    }
    if (currentStep === 4 && locationDeliveryType !== "ONLINE" && !venueName.trim()) {
      setErrorMessage("Please enter the venue name");
      return;
    }

    setErrorMessage(null);
    setCurrentStep((s) => Math.min(5, s + 1));
  }

  function handleBack() {
    setErrorMessage(null);
    setCurrentStep((s) => Math.max(1, s - 1));
  }

  async function handleFinalSubmit() {
    setLoading(true);
    setErrorMessage(null);

    if (tags.length === 0) {
      setLoading(false);
      setErrorMessage("At least one search tag is required");
      return;
    }

    const eventFormat: EventFormat =
      locationDeliveryType === "ONLINE" ? "ONLINE" : locationDeliveryType === "HYBRID" ? "HYBRID" : "OFFLINE";

    try {
      const fullAddress = `${streetAddress}, ${city}, ${stateRegion} ${pincode}, ${country}`;
      const payload: CreateEventInput = {
        title,
        slug,
        summary: tagline,
        description,
        coverImageUrl: bannerUrl,
        logoUrl: thumbnailUrl,
        eventType: eventFormat,
        venueName: eventFormat !== "ONLINE" ? venueName : undefined,
        address: eventFormat !== "ONLINE" ? fullAddress : undefined,
        city,
        state: stateRegion,
        onlineMeetingUrl: eventFormat !== "OFFLINE" ? onlineMeetingUrl : undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        timezone,
        capacity,
        visibility,
        allowWaitlist,
        allowTicketTransfer: allowTransfer,
        allowRefunds,
        contactEmail,
        contactPhone,
        ticketTiers,
      };

      const res = await createEventAction(payload);
      setLoading(false);

      if (res.success && res.slug) {
        onSuccess(res.slug);
      } else {
        setErrorMessage(res.error || "Failed to create event");
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err?.message || "An unexpected error occurred");
    }
  }

  const stepMeta = [
    { num: 1, label: "BASIC INFO" },
    { num: 2, label: "DATE & TIME" },
    { num: 3, label: "SETTINGS" },
    { num: 4, label: "VENUE DETAILS" },
    { num: 5, label: "ADDITIONAL INFO" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-5xl bg-white border border-gray-200/90 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col text-gray-900 relative">
        
        {/* ── TOP HEADER (CREATE EVENT & SEARCH) ────────────────────────── */}
        <div className="bg-white border-b border-gray-100 px-6 sm:px-10 py-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#ff385c] block">
              Event Management Studio
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-serif tracking-tight mt-0.5">
              Create Event
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search presets & tags..."
                className="bg-gray-50 border border-gray-200 rounded-full pl-9 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 outline-none w-48 focus:w-64 focus:bg-white focus:border-[#ff385c] focus:ring-2 focus:ring-[#ff385c]/10 transition-all"
              />
            </div>

            <div className="relative cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                <Bell size={16} />
              </div>
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#ff385c] border-2 border-white" />
            </div>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── 1. WIZARD STEP HEADER WITH CONNECTING LINES ──────────────── */}
        <div className="bg-gray-50/70 border-b border-gray-100 px-6 sm:px-12 py-6">
          <div className="flex items-center justify-between relative max-w-3xl mx-auto">
            {stepMeta.map((s, idx) => {
              const isCompleted = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              const hasNext = idx < stepMeta.length - 1;

              return (
                <div key={s.num} className="flex-1 flex items-center relative">
                  {/* Step Node */}
                  <button
                    type="button"
                    onClick={() => setCurrentStep(s.num)}
                    className="flex flex-col items-center gap-2 cursor-pointer z-10 mx-auto group"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                        isCurrent
                          ? "bg-[#ff385c] text-white ring-4 ring-[#ff385c]/25 shadow-lg shadow-[#ff385c]/30 scale-110 font-bold"
                          : isCompleted
                          ? "bg-gray-900 text-white shadow-sm"
                          : "bg-white text-gray-400 border border-gray-200 group-hover:border-gray-400 group-hover:text-gray-700"
                      }`}
                    >
                      {isCompleted ? <Check size={16} strokeWidth={3} /> : s.num}
                    </div>
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap transition-colors ${
                        isCurrent
                          ? "text-[#ff385c]"
                          : isCompleted
                          ? "text-gray-800"
                          : "text-gray-400"
                      }`}
                    >
                      {s.label}
                    </span>
                  </button>

                  {/* Connecting Line to next step */}
                  {hasNext && (
                    <div
                      className={`absolute top-5 left-1/2 w-full h-[2px] -z-0 transition-all duration-500 ${
                        currentStep > s.num ? "bg-[#ff385c]" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 2. WIZARD STEP CARD BODY ──────────────────────────────────── */}
        <div className="p-6 sm:p-12 space-y-8 flex-1 overflow-y-auto max-h-[72vh] bg-white">
          
          {/* Top highlight bar */}
          <div className="h-[3px] w-full bg-gradient-to-r from-[#ff385c] via-[#e00b41] to-amber-500 rounded-full -mt-4 mb-6 opacity-90" />

          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold flex items-center gap-2">
              <X size={16} className="text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ──────── STEP 1: BASIC INFO ──────────────────────────────── */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in-50">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight font-serif">
                  Basic Information
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Set up the core elements of your event brand identity.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                    EVENT TITLE *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. RotaSphere Global Tech Summit 2026"
                    className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#ff385c] focus:ring-2 focus:ring-[#ff385c]/15 transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                    EVENT SLUG *
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="rotasphere-global-tech-summit-2026"
                    className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#ff385c] focus:ring-2 focus:ring-[#ff385c]/15 transition-all font-mono shadow-sm"
                  />
                  <span className="text-[11px] text-gray-500 mt-1.5 px-3 block">
                    Unique URL string: eventsphere.com/events/[slug]
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                  SHORT TAGLINE DESCRIPTION *
                </label>
                <input
                  type="text"
                  required
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="A concise, one-sentence description summarizing the event main theme."
                  className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#ff385c] focus:ring-2 focus:ring-[#ff385c]/15 transition-all shadow-sm"
                />
                <span className="text-[11px] text-gray-500 mt-1.5 px-3 block">
                  Appears on the homepage event card grid (max 160 characters).
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                  FULL EVENT DESCRIPTION *
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe details, schedules, keynote presenters, food offerings, networking schedules..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-3xl p-6 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#ff385c] focus:ring-2 focus:ring-[#ff385c]/15 transition-all leading-relaxed shadow-sm"
                />
                <span className="text-[11px] text-gray-500 mt-1.5 px-3 block">
                  Explain all features in markdown format.
                </span>
              </div>

              {/* Promo Banner & Thumbnail Upload Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                
                {/* ── BANNER PROMO IMAGE ─────────────────────────────── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                      EVENT PROMO BANNER IMAGE *
                    </label>
                    <span className="text-[10px] text-gray-400 font-medium">16:9 ratio</span>
                  </div>

                  <div className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden border border-gray-200 bg-gray-100 shadow-md group">
                    <Image src={bannerUrl} alt="Event Promo Banner" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => bannerInputRef.current?.click()}
                        className="bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 cursor-pointer hover:scale-105 transition-transform"
                      >
                        <FolderOpen size={14} /> Change Banner
                      </button>
                    </div>
                  </div>

                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={bannerInputRef}
                    accept="image/*"
                    onChange={handleBannerFileChange}
                    className="hidden"
                  />

                  {/* Upload from local device button */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      className="w-full bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 rounded-2xl py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                      <UploadCloud size={16} className="text-[#ff385c]" />
                      <span>{bannerFileName ? "Change Banner from Device" : "Upload Banner from Device"}</span>
                    </button>
                  </div>

                  {bannerFileName && (
                    <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={13} /> {bannerFileName}
                    </p>
                  )}
                </div>

                {/* ── CARD THUMBNAIL IMAGE (LOCAL DEVICE ONLY) ─────────── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                      EVENT CARD THUMBNAIL IMAGE *
                    </label>
                    <span className="text-[10px] text-[#ff385c] font-bold">Local Device Upload</span>
                  </div>

                  {/* Thumbnail Preview Area & Drag/Drop Card */}
                  <div
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-[#ff385c] bg-gray-50/80 shadow-md group cursor-pointer transition-all flex flex-col items-center justify-center p-4"
                  >
                    {thumbnailUrl ? (
                      <>
                        <Image src={thumbnailUrl} alt="Card Thumbnail" fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5">
                            <FolderOpen size={14} /> Browse from Device
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
                        <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-[#ff385c] flex items-center justify-center">
                          <UploadCloud size={24} />
                        </div>
                        <span className="text-xs font-bold text-gray-800">Choose thumbnail from your computer</span>
                        <span className="text-[10px] text-gray-400">PNG, JPG, WEBP up to 10MB</span>
                      </div>
                    )}
                  </div>

                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={thumbnailInputRef}
                    accept="image/*"
                    onChange={handleThumbnailFileChange}
                    className="hidden"
                  />

                  {/* Action button */}
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="w-full bg-[#ff385c]/10 hover:bg-[#ff385c]/15 text-[#ff385c] border border-[#ff385c]/30 rounded-2xl py-2.5 px-4 text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <FolderOpen size={16} />
                    <span>{thumbnailFileName ? "Select Different File from Device" : "Browse & Upload from Device"}</span>
                  </button>

                  {thumbnailFileName ? (
                    <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={13} /> {thumbnailFileName} (Selected from device)
                    </p>
                  ) : (
                    <p className="text-[11px] text-gray-500">
                      Thumbnail is used on the event discovery grid and attendee tickets.
                    </p>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ──────── STEP 2: DATE & TIME ──────────────────────────────── */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in-50">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight font-serif">
                  Date &amp; Time
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Define schedule parameters and local timezone settings.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Event Start Date */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-2 text-[#ff385c]">
                    EVENT START DATE &amp; TIME *
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      required
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setErrorMessage(null);
                      }}
                      className={`w-full bg-gray-50 border rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 outline-none transition-all shadow-sm ${
                        !startDate
                          ? "border-rose-400 focus:ring-2 focus:ring-rose-400/20"
                          : "border-gray-200 focus:bg-white focus:border-[#ff385c] focus:ring-2 focus:ring-[#ff385c]/15"
                      }`}
                    />
                  </div>
                  {!startDate && (
                    <span className="text-[11px] text-rose-500 mt-1.5 px-3 block font-medium">
                      Start date and time is required
                    </span>
                  )}
                </div>

                {/* Event End Date */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                    EVENT END DATE &amp; TIME *
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 outline-none focus:bg-white focus:border-[#ff385c] focus:ring-2 focus:ring-[#ff385c]/15 transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Timezone */}
              <div className="pt-2">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                  TIMEZONE *
                </label>
                <div className="relative">
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 outline-none focus:bg-white focus:border-[#ff385c] focus:ring-2 focus:ring-[#ff385c]/15 transition-all cursor-pointer appearance-none shadow-sm"
                  >
                    <option value="Eastern Standard Time (EST) - UTC-5">Eastern Standard Time (EST) - UTC-5</option>
                    <option value="India Standard Time (IST) - UTC+05:30">India Standard Time (IST) - UTC+05:30</option>
                    <option value="Universal Coordinated Time (UTC) - UTC+0">Universal Coordinated Time (UTC) - UTC+0</option>
                    <option value="Pacific Standard Time (PST) - UTC-8">Pacific Standard Time (PST) - UTC-8</option>
                    <option value="Central European Time (CET) - UTC+1">Central European Time (CET) - UTC+1</option>
                  </select>
                </div>
                <span className="text-[11px] text-gray-500 mt-1.5 px-3 block">
                  Global attendees will see event times aligned to this region.
                </span>
              </div>
            </div>
          )}

          {/* ──────── STEP 3: EVENT SETTINGS ───────────────────────────── */}
          {currentStep === 3 && (
            <div className="space-y-8 animate-in fade-in-50">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight font-serif">
                  Event Settings
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Select ticketing modes, accessibility, and location types.
                </p>
              </div>

              {/* 1. TICKET PRICE MODEL */}
              <div className="space-y-3">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                  TICKET PRICE MODEL *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Free Event Option */}
                  <button
                    type="button"
                    onClick={() => handlePriceModelChange("FREE")}
                    className={`p-6 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                      priceModel === "FREE"
                        ? "bg-[#ff385c]/5 border-[#ff385c] ring-2 ring-[#ff385c]/20 shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <Ticket size={28} className={priceModel === "FREE" ? "text-[#ff385c]" : "text-gray-400"} />
                    <h4 className="text-base font-bold text-gray-900">Free Event</h4>
                    <p className="text-xs text-gray-500">No charges apply for passes</p>
                  </button>

                  {/* Paid Tickets Option */}
                  <button
                    type="button"
                    onClick={() => handlePriceModelChange("PAID")}
                    className={`p-6 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                      priceModel === "PAID"
                        ? "bg-[#ff385c]/5 border-[#ff385c] ring-2 ring-[#ff385c]/20 shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-2xl font-bold text-emerald-600">₹</span>
                    <h4 className="text-base font-bold text-gray-900">Paid Tickets</h4>
                    <p className="text-xs text-gray-500">Require attendee payout</p>
                  </button>
                </div>
              </div>

              {/* 2. EVENT VISIBILITY */}
              <div className="space-y-3">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                  EVENT VISIBILITY *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Public Listing */}
                  <button
                    type="button"
                    onClick={() => setVisibility("PUBLIC")}
                    className={`p-5 rounded-full border text-left transition-all cursor-pointer flex items-center gap-4 px-6 ${
                      visibility === "PUBLIC"
                        ? "bg-[#ff385c]/5 border-[#ff385c] ring-2 ring-[#ff385c]/20 shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#ff385c]/10 flex items-center justify-center flex-shrink-0">
                      <Lock size={18} className={visibility === "PUBLIC" ? "text-[#ff385c]" : "text-gray-400"} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Public Listing</h4>
                      <p className="text-xs text-gray-500">Listed on search and event grids</p>
                    </div>
                  </button>

                  {/* Private Invite */}
                  <button
                    type="button"
                    onClick={() => setVisibility("PRIVATE")}
                    className={`p-5 rounded-full border text-left transition-all cursor-pointer flex items-center gap-4 px-6 ${
                      visibility === "PRIVATE"
                        ? "bg-[#ff385c]/5 border-[#ff385c] ring-2 ring-[#ff385c]/20 shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <Lock size={18} className={visibility === "PRIVATE" ? "text-[#ff385c]" : "text-gray-400"} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Private Invite</h4>
                      <p className="text-xs text-gray-500">Only accessible via direct link</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* 3. HOSTING ROTARACT CLUB */}
              <div className="space-y-2">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                  HOSTING ROTARACT CLUB *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={hostingClub}
                    onChange={(e) => setHostingClub(e.target.value)}
                    list="clubs-datalist"
                    placeholder="Select host club name..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#ff385c] shadow-sm"
                  />
                  <Users size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <datalist id="clubs-datalist">
                    {ROTARACT_CLUBS.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <span className="text-[11px] text-gray-500 px-3 block">
                  Select the Rotaract Club hosting this event.
                </span>
              </div>

              {/* 4. LOCATION DELIVERY TYPE */}
              <div className="space-y-3">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                  LOCATION DELIVERY TYPE *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* In-Person */}
                  <button
                    type="button"
                    onClick={() => setLocationDeliveryType("IN_PERSON")}
                    className={`p-5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      locationDeliveryType === "IN_PERSON"
                        ? "bg-[#ff385c]/5 border-[#ff385c] ring-2 ring-[#ff385c]/20 shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <MapPin size={22} className={locationDeliveryType === "IN_PERSON" ? "text-[#ff385c]" : "text-gray-400"} />
                    <h4 className="text-sm font-bold text-gray-900">In-Person</h4>
                    <p className="text-[11px] text-gray-500">Physical venue location</p>
                  </button>

                  {/* Online Virtual */}
                  <button
                    type="button"
                    onClick={() => setLocationDeliveryType("ONLINE")}
                    className={`p-5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      locationDeliveryType === "ONLINE"
                        ? "bg-[#ff385c]/5 border-[#ff385c] ring-2 ring-[#ff385c]/20 shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <Globe size={22} className={locationDeliveryType === "ONLINE" ? "text-[#ff385c]" : "text-gray-400"} />
                    <h4 className="text-sm font-bold text-gray-900">Online Virtual</h4>
                    <p className="text-[11px] text-gray-500">Zoom, Meet, or streaming Link</p>
                  </button>

                  {/* Hybrid format */}
                  <button
                    type="button"
                    onClick={() => setLocationDeliveryType("HYBRID")}
                    className={`p-5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      locationDeliveryType === "HYBRID"
                        ? "bg-[#ff385c]/5 border-[#ff385c] ring-2 ring-[#ff385c]/20 shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <Sparkles size={22} className={locationDeliveryType === "HYBRID" ? "text-[#ff385c]" : "text-gray-400"} />
                    <h4 className="text-sm font-bold text-gray-900">Hybrid format</h4>
                    <p className="text-[11px] text-gray-500">Both physical and streaming</p>
                  </button>
                </div>
                <span className="text-[11px] text-gray-500 px-3 block">
                  If Online is selected, the venue details step is skipped.
                </span>
              </div>
            </div>
          )}

          {/* ──────── STEP 4: VENUE DETAILS (WITH GOOGLE MAPS AUTO-FILL) ─── */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in-50">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight font-serif">
                  Venue Details
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Provide instructions to help attendees find the physical location.
                </p>
              </div>

              {locationDeliveryType !== "ONLINE" ? (
                <div className="space-y-6 pt-2">
                  
                  {/* ── GOOGLE MAPS AUTO-FILL BAR ───────────────────────── */}
                  <div className="p-5 bg-gradient-to-r from-rose-50/80 via-orange-50/50 to-amber-50/40 border border-rose-200/90 rounded-3xl space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#ff385c] uppercase tracking-wider">
                        <Sparkles size={14} className="text-[#ff385c]" />
                        <span>Auto-Fill with Google Maps Link</span>
                      </div>
                      <span className="text-[11px] text-gray-500 hidden sm:block font-medium">
                        Paste link &amp; we&apos;ll auto-fill venue, city, state &amp; address
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="relative flex-1">
                        <Compass size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={mapsUrl}
                          onChange={(e) => {
                            setMapsUrl(e.target.value);
                            setMapsSuccess(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAutoFillMaps();
                            }
                          }}
                          placeholder="Paste Google Maps link or type place name (e.g. NIMHANS Convention Centre)"
                          className="w-full bg-white border border-rose-200 rounded-full pl-12 pr-6 py-3 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#ff385c] focus:ring-2 focus:ring-[#ff385c]/20 transition-all font-mono shadow-sm"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleAutoFillMaps}
                        disabled={mapsLoading}
                        className="bg-gray-900 hover:bg-black text-white font-bold text-xs px-6 py-3 rounded-full transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 flex-shrink-0"
                      >
                        {mapsLoading ? <Loader2 size={14} className="animate-spin" /> : "Auto-Fill"}
                      </button>
                    </div>

                    {mapsSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-in fade-in-50">
                        <CheckCircle2 size={15} className="text-emerald-600" />
                        <span>{mapsSuccess}</span>
                      </div>
                    )}
                  </div>

                  {/* Row 1: Venue Name & Directions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                        VENUE NAME *
                      </label>
                      <input
                        type="text"
                        required
                        value={venueName}
                        onChange={(e) => setVenueName(e.target.value)}
                        placeholder="e.g. Moscone Convention Center"
                        className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#ff385c] focus:ring-2 focus:ring-[#ff385c]/15 transition-all shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                        VENUE ACCESS / DIRECTIONS (OPTIONAL)
                      </label>
                      <input
                        type="text"
                        value={venueDirections}
                        onChange={(e) => setVenueDirections(e.target.value)}
                        placeholder="e.g. Enter through West Lobby building doors"
                        className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#ff385c] focus:ring-2 focus:ring-[#ff385c]/15 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Row 2: Country, State, City */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                        COUNTRY *
                      </label>
                      <input
                        type="text"
                        required
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="United States"
                        className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#ff385c] focus:ring-2 focus:ring-[#ff385c]/15 transition-all shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                        STATE / REGION
                      </label>
                      <input
                        type="text"
                        value={stateRegion}
                        onChange={(e) => setStateRegion(e.target.value)}
                        placeholder="California"
                        className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#ff385c] focus:ring-2 focus:ring-[#ff385c]/15 transition-all shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                        CITY *
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="San Francisco"
                        className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#ff385c] focus:ring-2 focus:ring-[#ff385c]/15 transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Row 3: Street Address & Zip Code (Unequal columns) */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-8">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                        STREET ADDRESS *
                      </label>
                      <input
                        type="text"
                        required
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        placeholder="747 Howard St"
                        className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#ff385c] focus:ring-2 focus:ring-[#ff385c]/15 transition-all shadow-sm"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                        PINCODE / ZIP CODE *
                      </label>
                      <input
                        type="text"
                        required
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="94103"
                        className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#ff385c] focus:ring-2 focus:ring-[#ff385c]/15 transition-all font-mono shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="p-6 bg-gray-50 border border-gray-200 rounded-3xl shadow-sm">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                      VIRTUAL STREAMING / MEETING LINK *
                    </label>
                    <input
                      type="url"
                      required
                      value={onlineMeetingUrl}
                      onChange={(e) => setOnlineMeetingUrl(e.target.value)}
                      placeholder="https://meet.google.com/xyz-abc or Zoom URL"
                      className="w-full bg-white border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#ff385c]"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ──────── STEP 5: ADDITIONAL DETAILS ───────────────────────── */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in-50">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight font-serif">
                  Additional Details
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Add tags, seat capacities, and organizer contact details.
                </p>
              </div>

              {/* Row 1: Category & Max Attendees */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                    CATEGORY *
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 outline-none focus:bg-white focus:border-[#ff385c] cursor-pointer appearance-none shadow-sm"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                    MAXIMUM ATTENDEES LIMIT *
                  </label>
                  <div className="relative">
                    <Users size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="number"
                      required
                      min={1}
                      value={capacity}
                      onChange={(e) => setCapacity(Number(e.target.value))}
                      placeholder="500"
                      className="w-full bg-gray-50 border border-gray-200 rounded-full pl-12 pr-6 py-3.5 text-xs sm:text-sm text-gray-900 outline-none focus:bg-white focus:border-[#ff385c] shadow-sm"
                    />
                  </div>
                  <span className="text-[11px] text-gray-500 mt-1.5 px-3 block">
                    Limits total tickets that can be booked.
                  </span>
                </div>
              </div>

              {/* Row 2: Search Tags & Topics */}
              <div className="pt-2">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-2 text-[#ff385c]">
                  SEARCH TAGS &amp; TOPICS *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Type a tag (e.g. react, marketing, rock) and press Enter"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#ff385c] shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="w-11 h-11 rounded-full bg-[#ff385c] hover:bg-[#e00b41] text-white flex items-center justify-center flex-shrink-0 transition-all shadow-md cursor-pointer"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {/* Tags Pill List */}
                {tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1.5 bg-gray-100 border border-gray-200 text-gray-800 text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-xs"
                      >
                        #{t}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="text-gray-400 hover:text-rose-600 cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 px-2 space-y-1">
                    <p className="text-[11px] text-gray-500 italic">No tags added yet. Enter at least one tag.</p>
                    <p className="text-[11px] text-rose-600 font-medium">At least one tag is required</p>
                  </div>
                )}
              </div>

              {/* Row 3: Organizer Contact Email & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                    ORGANIZER CONTACT EMAIL *
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="support@rotasphere.com"
                      className="w-full bg-gray-50 border border-gray-200 rounded-full pl-12 pr-6 py-3.5 text-xs sm:text-sm text-gray-900 outline-none focus:bg-white focus:border-[#ff385c] shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                    ORGANIZER CONTACT PHONE (OPTIONAL)
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      className="w-full bg-gray-50 border border-gray-200 rounded-full pl-12 pr-6 py-3.5 text-xs sm:text-sm text-gray-900 outline-none focus:bg-white focus:border-[#ff385c] shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── 3. WIZARD FOOTER NAVIGATION ────────────────────────────── */}
        <div className="bg-gray-50/80 border-t border-gray-100 px-8 sm:px-12 py-5 flex items-center justify-between">
          {/* Bottom-Left: Back Pill Button */}
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs sm:text-sm px-6 py-3 rounded-full transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <div />
          )}

          {/* Bottom-Right: Cancel Text + Next / Publish Event Pill Button */}
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={onClose}
              className="text-xs sm:text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="bg-[#ff385c] hover:bg-[#e00b41] text-white font-extrabold text-xs sm:text-sm px-8 py-3.5 rounded-full transition-all shadow-lg shadow-[#ff385c]/30 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
              >
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={loading}
                className="bg-[#ff385c] hover:bg-[#e00b41] text-white font-extrabold text-xs sm:text-sm px-8 py-3.5 rounded-full transition-all shadow-lg shadow-[#ff385c]/30 flex items-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <>Publish Event <Check size={16} strokeWidth={3} /></>}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
