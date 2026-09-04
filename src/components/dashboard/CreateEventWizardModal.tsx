"use client";

/**
 * Premium 5-Step Event Creation & Editing Wizard Modal
 * Matches website theme (#0758fc brand, crisp white canvas, dark ink text, smooth borders, local device image upload, Google Maps auto-fill, and full Edit Mode support).
 */

import React, { useState, useRef, useEffect } from "react";
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
  Edit3,
  QrCode,
  ChevronDown,
  Building2,
  AlertCircle,
} from "lucide-react";
import { createEventAction, updateEventAction, parseGoogleMapsUrlAction, CreateEventInput } from "@/app/actions/eventActions";
import { DISTRICT_3192_CLUBS } from "@/lib/data/districtClubsData";
import { compressImageFile } from "@/lib/utils/imageCompressor";
import {
  TIMEZONE_OPTIONS,
  resolveIanaTimezone,
  formatTimezoneLabel,
  combineDateAndTimeWithTz,
  formatDateStringToInput,
  formatTimeStringToInput,
} from "@/lib/utils/dateTimeUtils";
import type { EventFormat, TicketTierType } from "@/types/saas";

interface CreateEventWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (slug: string) => void;
  eventToEdit?: any | null;
  defaultClubName?: string;
  defaultOrganizationId?: string;
}

const BANNER_PRESETS = [
  { label: "Tech Hall", url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80" },
  { label: "Developer Meetup", url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&auto=format&fit=crop&q=80" },
  { label: "Concert Lights", url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80" },
  { label: "DJ Stage", url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80" },
  { label: "Corporate Speech", url: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&auto=format&fit=crop&q=80" },
];

const ROTARACT_CLUBS = Array.from(
  new Set([
    "Rotaract District 3192 Council",
    ...DISTRICT_3192_CLUBS.map((c) => c.name),
  ])
).sort((a, b) => (a === "Rotaract District 3192 Council" ? -1 : b === "Rotaract District 3192 Council" ? 1 : a.localeCompare(b)));

const CATEGORIES = [
  "Community & Social Service",
  "Community Service",
  "Professional Development",
  "Conferences",
  "Conferences & Summits",
  "TEDx & Keynote Talks",
  "Youth Leadership & TEDx",
  "College & Youth Festivals",
  "Concerts & Cultural Nights",
  "Cultural & Arts Festival",
  "Sports & Tournaments",
  "Sports & Athletics",
  "Networking & Meetups",
  "Workshops & Masterclasses",
];

function formatDateString(dateVal: Date | string | number | null | undefined): string {
  if (!dateVal) return "";
  const d = typeof dateVal === "string" || typeof dateVal === "number" ? new Date(dateVal) : dateVal;
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatTimeString(dateVal: Date | string | number | null | undefined): string {
  if (!dateVal) return "";
  const d = typeof dateVal === "string" || typeof dateVal === "number" ? new Date(dateVal) : dateVal;
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function combineDateAndTime(dateStr: string, timeStr: string, tzStr?: string): Date | null {
  return combineDateAndTimeWithTz(dateStr, timeStr, tzStr || "India Standard Time (IST) - UTC+05:30");
}

function getDefaultEventSchedule() {
  const start = new Date(Date.now() + 7 * 86400000);
  start.setHours(10, 0, 0, 0); // 10:00 AM local time 7 days from now
  const end = new Date(start.getTime() + 4 * 3600000); // 2:00 PM (4 hours later)
  return {
    startDate: formatDateString(start),
    startTime: formatTimeString(start),
    endDate: formatDateString(end),
    endTime: formatTimeString(end),
  };
}

export function CreateEventWizardModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  eventToEdit,
  defaultClubName,
  defaultOrganizationId,
}: CreateEventWizardModalProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [touchedSteps, setTouchedSteps] = useState<Record<number, boolean>>({});

  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Step 1: Basic Info
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState(BANNER_PRESETS[0].url);
  const [bannerFileName, setBannerFileName] = useState<string | null>(null);
  
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80");
  const [thumbnailFileName, setThumbnailFileName] = useState<string | null>(null);

  // Step 2: Date & Time (Separated for reliability & intuitive UX)
  const defaultSchedule = getDefaultEventSchedule();
  const [startDate, setStartDate] = useState(defaultSchedule.startDate);
  const [startTime, setStartTime] = useState(defaultSchedule.startTime);
  const [endDate, setEndDate] = useState(defaultSchedule.endDate);
  const [endTime, setEndTime] = useState(defaultSchedule.endTime);
  const [timezone, setTimezone] = useState("India Standard Time (IST) - UTC+05:30");

  // Step 3: Event Settings
  const [priceModel, setPriceModel] = useState<"FREE" | "PAID">("FREE");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [hostingClub, setHostingClub] = useState(defaultClubName || "");
  const [locationDeliveryType, setLocationDeliveryType] = useState<"IN_PERSON" | "ONLINE" | "HYBRID">("IN_PERSON");
  const [upiId, setUpiId] = useState("");
  const [upiPayeeName, setUpiPayeeName] = useState("");

  // Ticket Tiers & Eligibility
  const [capacity, setCapacity] = useState(100);
  const [allowWaitlist, setAllowWaitlist] = useState(true);
  const [allowTransfer, setAllowTransfer] = useState(true);
  const [allowRefunds, setAllowRefunds] = useState(true);
  const [notifyAllMembers, setNotifyAllMembers] = useState(true);
  const [ticketTiers, setTicketTiers] = useState<
    Array<{
      id?: string;
      name: string;
      tierType: TicketTierType;
      price: number;
      totalCapacity: number;
      description?: string;
      allowNonRotaract?: boolean;
      allowedAudience?: "ALL" | "ROTARACT_ONLY" | "NON_ROTARACT_ONLY";
      hasCustomSchedule?: boolean;
      salesStartDate?: string;
      salesStartTime?: string;
      salesEndDate?: string;
      salesEndTime?: string;
      maxPerOrder?: number;
    }>
  >([
    {
      name: "",
      tierType: "REGULAR",
      price: 0,
      totalCapacity: 100,
      description: "",
      allowNonRotaract: true,
      allowedAudience: "ALL",
      hasCustomSchedule: false,
      salesStartDate: "",
      salesStartTime: "09:00",
      salesEndDate: "",
      salesEndTime: "23:59",
      maxPerOrder: 10,
    },
  ]);

  // Step 4: Venue Details & Google Maps Auto-Fill
  const [mapsUrl, setMapsUrl] = useState("");
  const [mapsLoading, setMapsLoading] = useState(false);
  const [mapsSuccess, setMapsSuccess] = useState<string | null>(null);

  const [venueName, setVenueName] = useState("");
  const [venueDirections, setVenueDirections] = useState("");
  const [country, setCountry] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [city, setCity] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [onlineMeetingUrl, setOnlineMeetingUrl] = useState("");

  // Step 5: Additional Details
  const [category, setCategory] = useState("Community Service");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Initialize or reset form when eventToEdit changes
  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title || "");
      setSlug(eventToEdit.slug || "");
      setTagline(eventToEdit.summary || "");
      setDescription(eventToEdit.description || "");
      setBannerUrl(eventToEdit.cover_image_url || BANNER_PRESETS[0].url);
      setThumbnailUrl(eventToEdit.logo_url || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80");
      const tz = eventToEdit.timezone || "India Standard Time (IST) - UTC+05:30";
      setTimezone(tz);
      if (eventToEdit.start_date) {
        setStartDate(formatDateStringToInput(eventToEdit.start_date, tz));
        setStartTime(formatTimeStringToInput(eventToEdit.start_date, tz));
      }
      if (eventToEdit.end_date) {
        setEndDate(formatDateStringToInput(eventToEdit.end_date, tz));
        setEndTime(formatTimeStringToInput(eventToEdit.end_date, tz));
      }
      if (eventToEdit.capacity) setCapacity(eventToEdit.capacity);
      if (eventToEdit.venue_name) setVenueName(eventToEdit.venue_name);
      if (eventToEdit.city) setCity(eventToEdit.city);
      if (eventToEdit.state) setStateRegion(eventToEdit.state);
      if (eventToEdit.country) setCountry(eventToEdit.country);
      if (eventToEdit.address) setStreetAddress(eventToEdit.address);
      if (eventToEdit.online_meeting_url) setOnlineMeetingUrl(eventToEdit.online_meeting_url);
      if (eventToEdit.upi_id) setUpiId(eventToEdit.upi_id);
      if (eventToEdit.category_name) {
        setCategory(eventToEdit.category_name);
      } else if (eventToEdit.category) {
        setCategory(eventToEdit.category);
      }
      if (eventToEdit.contact_email) {
        setContactEmail(eventToEdit.contact_email);
      }
      if (eventToEdit.contact_phone) {
        setContactPhone(eventToEdit.contact_phone);
      }
      if (Array.isArray(eventToEdit.tags)) {
        setTags(eventToEdit.tags.filter(Boolean));
      } else if (typeof eventToEdit.tags === "string" && eventToEdit.tags.trim()) {
        try {
          const parsed = JSON.parse(eventToEdit.tags);
          setTags(Array.isArray(parsed) ? parsed : [eventToEdit.tags]);
        } catch {
          setTags(eventToEdit.tags.split(",").map((s: string) => s.trim()).filter(Boolean));
        }
      }
      if (eventToEdit.google_maps_url) setMapsUrl(eventToEdit.google_maps_url);

      if (eventToEdit.saas_ticket_tiers && eventToEdit.saas_ticket_tiers.length > 0) {
        const hasPaidTier = eventToEdit.saas_ticket_tiers.some((t: any) => Number(t.price) > 0);
        setPriceModel(hasPaidTier ? "PAID" : "FREE");
        setTicketTiers(
          eventToEdit.saas_ticket_tiers.map((t: any) => {
            const hasCustom = Boolean(t.sales_start || t.sales_end);
            return {
              id: t.id,
              name: t.name,
              tierType: t.tier_type || "REGULAR",
              price: Number(t.price) || 0,
              totalCapacity: t.total_capacity || 100,
              description: t.description || "",
              allowNonRotaract: t.allow_non_rotaract !== false,
              allowedAudience: t.allowed_audience || (t.allow_non_rotaract !== false ? "ALL" : "ROTARACT_ONLY"),
              hasCustomSchedule: hasCustom,
              salesStartDate: t.sales_start ? formatDateStringToInput(t.sales_start, tz) : "",
              salesStartTime: t.sales_start ? formatTimeStringToInput(t.sales_start, tz) : "09:00",
              salesEndDate: t.sales_end ? formatDateStringToInput(t.sales_end, tz) : "",
              salesEndTime: t.sales_end ? formatTimeStringToInput(t.sales_end, tz) : "23:59",
              maxPerOrder: t.max_per_order ? Number(t.max_per_order) : 10,
            };
          })
        );
      } else {
        setPriceModel("FREE");
      }
      if (eventToEdit.org_name || eventToEdit.organization_name || eventToEdit.organizations?.name) {
        setHostingClub(eventToEdit.org_name || eventToEdit.organization_name || eventToEdit.organizations?.name);
      } else if (defaultClubName) {
        setHostingClub(defaultClubName);
      }
      setLocationDeliveryType(
        eventToEdit.event_type === "ONLINE"
          ? "ONLINE"
          : eventToEdit.event_type === "HYBRID"
          ? "HYBRID"
          : "IN_PERSON"
      );
    }
  }, [eventToEdit, defaultClubName]);

  // Auto-sync overall event capacity with the sum of ticket pass tier seats
  useEffect(() => {
    if (ticketTiers && ticketTiers.length > 0) {
      const sumTierCapacity = ticketTiers.reduce((sum, tier) => sum + (Number(tier.totalCapacity) || 0), 0);
      if (sumTierCapacity > 0) {
        setCapacity(sumTierCapacity);
      }
    }
  }, [ticketTiers]);

  if (!isOpen) return null;

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!eventToEdit) {
      const autoSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(autoSlug);
    }
  }

  async function handleThumbnailFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select an image file (PNG, JPG, JPEG, WEBP)");
      return;
    }
    try {
      const compressed = await compressImageFile(file, 800, 0.8);
      setThumbnailUrl(compressed);
      setThumbnailFileName(file.name);
      setErrorMessage(null);
    } catch {
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
  }

  async function handleBannerFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select an image file (PNG, JPG, JPEG, WEBP)");
      return;
    }
    try {
      const compressed = await compressImageFile(file, 1600, 0.8);
      setBannerUrl(compressed);
      setBannerFileName(file.name);
      setErrorMessage(null);
    } catch {
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
  }

  function handlePriceModelChange(model: "FREE" | "PAID") {
    setPriceModel(model);
    if (model === "FREE") {
      setTicketTiers((prev) =>
        prev.map((t) => ({ ...t, price: 0 }))
      );
    } else {
      // Switching to PAID: Preserve existing tiers, do NOT wipe user configuration!
      setTicketTiers((prev) => {
        if (!prev || prev.length === 0) {
          const todayStr = new Date().toISOString().split("T")[0];
          return [
            {
              name: "Early Bird Pass",
              tierType: "EARLY_BIRD",
              price: 199,
              totalCapacity: 100,
              description: "Discounted early access pass",
              allowNonRotaract: true,
              allowedAudience: "ALL",
              hasCustomSchedule: true,
              salesStartDate: todayStr,
              salesStartTime: "09:00",
              salesEndDate: startDate || "",
              salesEndTime: "23:59",
              maxPerOrder: 1,
            },
            {
              name: "General Release Pass",
              tierType: "REGULAR",
              price: 499,
              totalCapacity: 350,
              description: "Full delegate access",
              allowNonRotaract: true,
              allowedAudience: "ALL",
              hasCustomSchedule: false,
              salesStartDate: "",
              salesStartTime: "09:00",
              salesEndDate: "",
              salesEndTime: "23:59",
              maxPerOrder: 10,
            },
          ];
        }

        // Keep every single tier with its existing ID, capacity, schedule, name!
        // If price is 0, give it a default paid price (e.g. 199 for early bird, 499 for regular)
        return prev.map((t) => {
          const currentP = Number(t.price) || 0;
          let newP = currentP;
          if (newP <= 0) {
            newP = t.tierType === "EARLY_BIRD" || /early/i.test(t.name) ? 199 : 499;
          }
          return {
            ...t,
            price: newP,
          };
        });
      });
    }
  }

  function addNewTier() {
    const defaultPrice = priceModel === "FREE" ? 0 : 199;
    setTicketTiers([
      ...ticketTiers,
      {
        name: "",
        tierType: "REGULAR",
        price: defaultPrice,
        totalCapacity: 100,
        description: "",
        allowNonRotaract: true,
        allowedAudience: "ALL",
        hasCustomSchedule: false,
        salesStartDate: "",
        salesStartTime: "09:00",
        salesEndDate: "",
        salesEndTime: "23:59",
        maxPerOrder: 10,
      },
    ]);
  }

  function addPresetTier(
    name: string,
    tierType: TicketTierType,
    price: number,
    totalCapacity: number,
    description: string,
    allowedAudience: "ALL" | "ROTARACT_ONLY" | "NON_ROTARACT_ONLY" = "ALL",
    hasCustomSchedule: boolean = tierType === "EARLY_BIRD",
    maxPerOrder: number = 10
  ) {
    if (price > 0) {
      setPriceModel("PAID");
    }
    const tierAllowsNonRotaract = allowedAudience !== "ROTARACT_ONLY";
    const todayStr = new Date().toISOString().split("T")[0];
    setTicketTiers([
      ...ticketTiers,
      {
        name,
        tierType,
        price: price, // Use the actual preset price!
        totalCapacity,
        description,
        allowNonRotaract: tierAllowsNonRotaract,
        allowedAudience,
        hasCustomSchedule,
        salesStartDate: hasCustomSchedule ? todayStr : "",
        salesStartTime: "09:00",
        salesEndDate: hasCustomSchedule ? startDate || "" : "",
        salesEndTime: "23:59",
        maxPerOrder,
      },
    ]);
  }

  function updateTierField(index: number, field: string, value: any) {
    if (field === "price" && Number(value) > 0 && priceModel === "FREE") {
      setPriceModel("PAID");
    }
    if (field === "tierType" && value === "EARLY_BIRD") {
      setTicketTiers((prev) =>
        prev.map((tier, i) =>
          i === index
            ? {
                ...tier,
                tierType: "EARLY_BIRD",
                hasCustomSchedule: true,
                salesStartDate: tier.salesStartDate || new Date().toISOString().split("T")[0],
                salesStartTime: tier.salesStartTime || "09:00",
                salesEndDate: tier.salesEndDate || startDate || "",
                salesEndTime: tier.salesEndTime || "23:59",
              }
            : tier
        )
      );
      return;
    }
    setTicketTiers((prev) =>
      prev.map((tier, i) => (i === index ? { ...tier, [field]: value } : tier))
    );
  }

  function removeTier(index: number) {
    if (ticketTiers.length <= 1) return;
    setTicketTiers((prev) => prev.filter((_, i) => i !== index));
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

  function applyDurationPreset(type: "2h" | "4h" | "fullday" | "nextday") {
    if (!startDate) return;
    const s = combineDateAndTimeWithTz(startDate, startTime || "10:00", timezone);
    if (!s) return;

    if (type === "2h") {
      const e = new Date(s.getTime() + 2 * 3600000);
      setEndDate(formatDateStringToInput(e, timezone));
      setEndTime(formatTimeStringToInput(e, timezone));
    } else if (type === "4h") {
      const e = new Date(s.getTime() + 4 * 3600000);
      setEndDate(formatDateStringToInput(e, timezone));
      setEndTime(formatTimeStringToInput(e, timezone));
    } else if (type === "fullday") {
      setStartTime("09:00");
      setEndDate(startDate);
      setEndTime("18:00");
    } else if (type === "nextday") {
      const e = new Date(s.getTime() + 24 * 3600000);
      setEndDate(formatDateStringToInput(e, timezone));
      setEndTime(startTime || "10:00");
    }
    setErrorMessage(null);
  }

  function handleAddTag(manualTag?: string) {
    const raw = manualTag !== undefined ? manualTag : tagInput;
    if (!raw.trim()) return;
    const pieces = raw
      .split(/[, ]+/)
      .map((p) => p.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""))
      .filter((p) => p.length > 0);

    const next = [...tags];
    for (const piece of pieces) {
      if (!next.includes(piece)) {
        next.push(piece);
      }
    }
    setTags(next);
    if (manualTag === undefined) {
      setTagInput("");
    }
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
    if (currentStep === 2) {
      if (!startDate) {
        setErrorMessage("Event start date is required");
        return;
      }
      if (!startTime) {
        setErrorMessage("Event start time is required");
        return;
      }
      const sDate = combineDateAndTimeWithTz(startDate, startTime, timezone);
      if (!sDate) {
        setErrorMessage("Please enter a valid start date and time");
        return;
      }
      if (!endDate) {
        setErrorMessage("Event end date is required");
        return;
      }
      if (!endTime) {
        setErrorMessage("Event end time is required");
        return;
      }
      const eDate = combineDateAndTimeWithTz(endDate, endTime, timezone);
      if (!eDate) {
        setErrorMessage("Please enter a valid end date and time");
        return;
      }
      if (eDate <= sDate) {
        setErrorMessage("Event end date and time must be after the start date and time");
        return;
      }
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

    let finalTags = [...tags];
    if (tagInput.trim()) {
      const extra = tagInput
        .split(/[, ]+/)
        .map((p) => p.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""))
        .filter((p) => p.length > 0 && !finalTags.includes(p));
      finalTags = [...finalTags, ...extra];
    }
    if (finalTags.length === 0) {
      finalTags = ["rotaract", "district3192"];
    }

    const eventFormat: EventFormat =
      locationDeliveryType === "ONLINE" ? "ONLINE" : locationDeliveryType === "HYBRID" ? "HYBRID" : "OFFLINE";

    try {
      const sDate = combineDateAndTimeWithTz(startDate, startTime, timezone);
      const eDate = combineDateAndTimeWithTz(endDate, endTime, timezone);

      if (!sDate) {
        setErrorMessage("Please enter a valid start date and time");
        setLoading(false);
        return;
      }
      if (!eDate || eDate <= sDate) {
        setErrorMessage("Event end date and time must be after the start date and time");
        setLoading(false);
        return;
      }

      const fullAddress = `${streetAddress}, ${city}, ${stateRegion} ${pincode}, ${country}`;
      const overallAllowNonRotaract =
        ticketTiers.length > 0
          ? ticketTiers.some(
              (t) => (t.allowedAudience ? t.allowedAudience !== "ROTARACT_ONLY" : t.allowNonRotaract !== false)
            )
          : true;

      const effectivePriceModel =
        priceModel === "PAID" || ticketTiers.some((t) => Number(t.price) > 0) ? "PAID" : "FREE";

      const formattedTicketTiers = ticketTiers.map((t) => {
        let salesStartISO: string | undefined = undefined;
        let salesEndISO: string | undefined = undefined;

        if (t.hasCustomSchedule) {
          if (t.salesStartDate && t.salesStartTime) {
            const dt = combineDateAndTimeWithTz(t.salesStartDate, t.salesStartTime, timezone);
            if (dt) salesStartISO = dt.toISOString();
          }
          if (t.salesEndDate && t.salesEndTime) {
            const dt = combineDateAndTimeWithTz(t.salesEndDate, t.salesEndTime, timezone);
            if (dt) salesEndISO = dt.toISOString();
          }
        }

        let tierFinalPrice = 0;
        if (effectivePriceModel === "PAID") {
          tierFinalPrice = Number(t.price) > 0 ? Number(t.price) : 199;
        }

        return {
          id: t.id,
          name: t.name.trim(),
          description: t.description?.trim(),
          tierType: t.tierType,
          price: tierFinalPrice,
          totalCapacity: Number(t.totalCapacity) || 100,
          allowNonRotaract: t.allowNonRotaract !== false,
          allowedAudience: t.allowedAudience || "ALL",
          salesStart: salesStartISO,
          salesEnd: salesEndISO,
          maxPerOrder: t.maxPerOrder ? Number(t.maxPerOrder) : 10,
        };
      });

      const payload: CreateEventInput = {
        organizationId: defaultOrganizationId,
        hostingClub: hostingClub.trim() || undefined,
        clubName: hostingClub.trim() || undefined,
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
        startDate: sDate.toISOString(),
        endDate: eDate.toISOString(),
        timezone,
        capacity,
        visibility,
        allowWaitlist,
        allowTicketTransfer: allowTransfer,
        allowRefunds,
        allowNonRotaract: overallAllowNonRotaract,
        googleMapsUrl: mapsUrl.trim() || undefined,
        notifyAllMembers,
        contactEmail,
        contactPhone,
        upiId: upiId.trim(),
        upiPayeeName: upiPayeeName.trim(),
        category,
        tags: finalTags,
        ticketTiers: formattedTicketTiers,
      };

      if (eventToEdit?.id) {
        // Edit Mode
        const res = await updateEventAction(eventToEdit.id, payload);
        setLoading(false);
        if (res.success) {
          onSuccess(slug);
        } else {
          setErrorMessage(res.error || "Failed to update event");
        }
      } else {
        // Create Mode
        const res = await createEventAction(payload);
        setLoading(false);
        if (res.success && res.slug) {
          onSuccess(res.slug);
        } else {
          setErrorMessage(res.error || "Failed to create event");
        }
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

  const isEditMode = Boolean(eventToEdit?.id);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-5xl bg-white border border-gray-200/90 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col text-gray-900 relative">
        
        {/* ── TOP HEADER (CREATE / EDIT EVENT & SEARCH) ────────────────── */}
        <div className="bg-white border-b border-gray-100 px-6 sm:px-10 py-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0758fc] block">
              {isEditMode ? "Edit Event Listing" : "Event Management Studio"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-serif tracking-tight mt-0.5">
              {isEditMode ? "Update Event Details" : "Create Event"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search presets & tags..."
                className="bg-gray-50 border border-gray-200 rounded-full pl-9 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 outline-none w-48 focus:w-64 focus:bg-white focus:border-[#0758fc] focus:ring-2 focus:ring-[#0758fc]/10 transition-all"
              />
            </div>

            <div className="relative cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                <Bell size={16} />
              </div>
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#0758fc] border-2 border-white" />
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
        <div className="bg-gray-50/70 border-b border-gray-100 px-4 sm:px-12 py-4 sm:py-6 overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-between relative max-w-3xl min-w-[340px] sm:min-w-0 mx-auto">
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
                          ? "bg-[#0758fc] text-white ring-4 ring-[#0758fc]/25 shadow-lg shadow-[#0758fc]/30 scale-110 font-bold"
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
                          ? "text-[#0758fc]"
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
                        currentStep > s.num ? "bg-[#0758fc]" : "bg-gray-200"
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
          <div className="h-[3px] w-full bg-gradient-to-r from-[#0758fc] via-[#054fe0] to-amber-500 rounded-full -mt-4 mb-6 opacity-90" />

          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold flex items-center justify-between gap-2 animate-in fade-in-50">
              <div className="flex items-center gap-2">
                <X size={16} className="text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-500 hover:text-rose-800 p-1 rounded-lg hover:bg-rose-100/60 transition-colors cursor-pointer shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* ──────── STEP 1: BASIC INFO ──────────────────────────────── */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in-50">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight font-serif">
                  {isEditMode ? "Edit Basic Information" : "Basic Information"}
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
                    className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#0758fc] focus:ring-2 focus:ring-[#0758fc]/15 transition-all shadow-sm"
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
                    className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#0758fc] focus:ring-2 focus:ring-[#0758fc]/15 transition-all font-mono shadow-sm"
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
                  className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#0758fc] focus:ring-2 focus:ring-[#0758fc]/15 transition-all shadow-sm"
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
                  className="w-full bg-gray-50 border border-gray-200 rounded-3xl p-6 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#0758fc] focus:ring-2 focus:ring-[#0758fc]/15 transition-all leading-relaxed shadow-sm"
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

                  <input
                    type="file"
                    ref={bannerInputRef}
                    accept="image/*"
                    onChange={handleBannerFileChange}
                    className="hidden"
                  />

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      className="w-full bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 rounded-2xl py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                      <UploadCloud size={16} className="text-[#0758fc]" />
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
                    <span className="text-[10px] text-[#0758fc] font-bold">Local Device Upload</span>
                  </div>

                  <div
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-[#0758fc] bg-gray-50/80 shadow-md group cursor-pointer transition-all flex flex-col items-center justify-center p-4"
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
                        <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-[#0758fc] flex items-center justify-center">
                          <UploadCloud size={24} />
                        </div>
                        <span className="text-xs font-bold text-gray-800">Choose thumbnail from your computer</span>
                        <span className="text-[10px] text-gray-400">PNG, JPG, WEBP up to 10MB</span>
                      </div>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={thumbnailInputRef}
                    accept="image/*"
                    onChange={handleThumbnailFileChange}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="w-full bg-[#0758fc]/10 hover:bg-[#0758fc]/15 text-[#0758fc] border border-[#0758fc]/30 rounded-2xl py-2.5 px-4 text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
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
                  Specify exact start and end dates and times for your event schedule.
                </p>
              </div>

              {/* ── 1. SEPARATED START & END SCHEDULE CARDS ─────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-1">
                
                {/* START CARD */}
                <div className="bg-blue-50/40 border border-blue-100 rounded-3xl p-5 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-blue-100/70 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#0758fc] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                        <Calendar size={15} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">
                          1. Event Start
                        </h4>
                        <p className="text-[11px] text-gray-500">When attendees begin arriving</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold text-[#0758fc] bg-white border border-blue-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Required
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center gap-1">
                        <Calendar size={12} className="text-[#0758fc]" /> Start Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => {
                          const newStartDate = e.target.value;
                          setStartDate(newStartDate);
                          setErrorMessage(null);
                          if (newStartDate && (!endDate || endDate < newStartDate)) {
                            setEndDate(newStartDate);
                          }
                        }}
                        className={`w-full bg-white border rounded-2xl px-4 py-3 text-xs sm:text-sm text-gray-900 font-medium outline-none transition-all shadow-xs ${
                          !startDate
                            ? "border-rose-400 focus:ring-2 focus:ring-rose-400/20"
                            : "border-gray-200 focus:border-[#0758fc] focus:ring-2 focus:ring-[#0758fc]/15"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center gap-1">
                        <Clock size={12} className="text-[#0758fc]" /> Start Time *
                      </label>
                      <input
                        type="time"
                        required
                        value={startTime}
                        onChange={(e) => {
                          setStartTime(e.target.value);
                          setErrorMessage(null);
                        }}
                        className={`w-full bg-white border rounded-2xl px-4 py-3 text-xs sm:text-sm text-gray-900 font-medium outline-none transition-all shadow-xs ${
                          !startTime
                            ? "border-rose-400 focus:ring-2 focus:ring-rose-400/20"
                            : "border-gray-200 focus:border-[#0758fc] focus:ring-2 focus:ring-[#0758fc]/15"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* END CARD */}
                <div className="bg-gray-50/70 border border-gray-200 rounded-3xl p-5 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-gray-200/80 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                        <Clock size={15} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">
                          2. Event End
                        </h4>
                        <p className="text-[11px] text-gray-500">When the event wraps up</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Required
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center gap-1">
                        <Calendar size={12} className="text-gray-500" /> End Date *
                      </label>
                      <input
                        type="date"
                        required
                        min={startDate || undefined}
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setErrorMessage(null);
                        }}
                        className={`w-full bg-white border rounded-2xl px-4 py-3 text-xs sm:text-sm text-gray-900 font-medium outline-none transition-all shadow-xs ${
                          !endDate
                            ? "border-rose-400 focus:ring-2 focus:ring-rose-400/20"
                            : "border-gray-200 focus:border-[#0758fc] focus:ring-2 focus:ring-[#0758fc]/15"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-700 mb-1.5 flex items-center gap-1">
                        <Clock size={12} className="text-gray-500" /> End Time *
                      </label>
                      <input
                        type="time"
                        required
                        value={endTime}
                        onChange={(e) => {
                          setEndTime(e.target.value);
                          setErrorMessage(null);
                        }}
                        className={`w-full bg-white border rounded-2xl px-4 py-3 text-xs sm:text-sm text-gray-900 font-medium outline-none transition-all shadow-xs ${
                          !endTime
                            ? "border-rose-400 focus:ring-2 focus:ring-rose-400/20"
                            : "border-gray-200 focus:border-[#0758fc] focus:ring-2 focus:ring-[#0758fc]/15"
                        }`}
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* ── 2. QUICK DURATION SHORTCUT BUTTONS ─────────────────────── */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mr-1 flex items-center gap-1">
                  <Sparkles size={13} className="text-amber-500" /> Quick Duration:
                </span>
                <button
                  type="button"
                  onClick={() => applyDurationPreset("2h")}
                  className="bg-gray-50 hover:bg-[#0758fc]/10 hover:text-[#0758fc] hover:border-[#0758fc]/30 border border-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs"
                >
                  ⚡ +2 Hours
                </button>
                <button
                  type="button"
                  onClick={() => applyDurationPreset("4h")}
                  className="bg-gray-50 hover:bg-[#0758fc]/10 hover:text-[#0758fc] hover:border-[#0758fc]/30 border border-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs"
                >
                  ⚡ +4 Hours (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => applyDurationPreset("fullday")}
                  className="bg-gray-50 hover:bg-[#0758fc]/10 hover:text-[#0758fc] hover:border-[#0758fc]/30 border border-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs"
                >
                  ☀️ Full Day (9:00 AM - 6:00 PM)
                </button>
                <button
                  type="button"
                  onClick={() => applyDurationPreset("nextday")}
                  className="bg-gray-50 hover:bg-[#0758fc]/10 hover:text-[#0758fc] hover:border-[#0758fc]/30 border border-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs"
                >
                  📅 +1 Day Multi-Day
                </button>
              </div>

              {/* ── 3. REAL-TIME SCHEDULE PREVIEW BANNER ────────────────────── */}
              {(() => {
                const s = combineDateAndTimeWithTz(startDate, startTime, timezone);
                const e = combineDateAndTimeWithTz(endDate, endTime, timezone);

                if (!s) {
                  return (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center gap-2">
                      <AlertCircle size={15} className="text-amber-600 shrink-0" />
                      <span>Please select a valid start date and time.</span>
                    </div>
                  );
                }

                if (e && e.getTime() <= s.getTime()) {
                  return (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
                      <AlertCircle size={16} className="text-rose-600 shrink-0" />
                      <span className="font-bold">Event end date &amp; time must be later than the start date &amp; time.</span>
                    </div>
                  );
                }

                const ianaTz = resolveIanaTimezone(timezone);
                const tzShort = formatTimezoneLabel(timezone);
                const sDateStr = s.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: ianaTz });
                const sTimeStr = s.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: ianaTz });

                let durationText = "";
                let endFormatted = "";
                if (e) {
                  const isSameDay = s.toLocaleDateString("en-IN", { timeZone: ianaTz }) === e.toLocaleDateString("en-IN", { timeZone: ianaTz });
                  const eDateStr = e.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: ianaTz });
                  const eTimeStr = e.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: ianaTz });
                  endFormatted = isSameDay ? eTimeStr : `${eDateStr} at ${eTimeStr}`;

                  const diffMs = e.getTime() - s.getTime();
                  if (diffMs > 0) {
                    const totalMins = Math.floor(diffMs / (1000 * 60));
                    const days = Math.floor(totalMins / (60 * 24));
                    const remainingMins = totalMins % (60 * 24);
                    const hrs = Math.floor(remainingMins / 60);
                    const mins = remainingMins % 60;
                    
                    const parts: string[] = [];
                    if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
                    if (hrs > 0) parts.push(`${hrs} hr${hrs > 1 ? "s" : ""}`);
                    if (mins > 0) parts.push(`${mins} min`);
                    durationText = parts.join(" ") || "0 min";
                  }
                }

                return (
                  <div className="p-4 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-xs space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between font-extrabold text-[#0758fc]">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        <span>Schedule Summary</span>
                      </div>
                      {durationText && (
                        <span className="bg-[#0758fc] text-white px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-xs">
                          ⏱️ {durationText}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-800 font-medium text-xs leading-relaxed">
                      Starts: <span className="font-bold text-gray-950">{sDateStr} at {sTimeStr}</span>
                      {endFormatted ? (
                        <> ➔ Ends: <span className="font-bold text-gray-950">{endFormatted}</span></>
                      ) : null}
                      {" "}<span className="text-gray-500 font-normal">({tzShort})</span>
                    </p>
                  </div>
                );
              })()}

              {/* ── 4. TIMEZONE SELECTOR ───────────────────────────────────── */}
              <div className="pt-2">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                  TIMEZONE *
                </label>
                <div className="relative">
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 outline-none focus:bg-white focus:border-[#0758fc] focus:ring-2 focus:ring-[#0758fc]/15 transition-all cursor-pointer appearance-none shadow-sm font-medium"
                  >
                    <option value="India Standard Time (IST) - UTC+05:30">India Standard Time (IST) - UTC+05:30</option>
                    <option value="Eastern Standard Time (EST) - UTC-5">Eastern Standard Time (EST) - UTC-5</option>
                    <option value="Universal Coordinated Time (UTC) - UTC+0">Universal Coordinated Time (UTC) - UTC+0</option>
                    <option value="Pacific Standard Time (PST) - UTC-8">Pacific Standard Time (PST) - UTC-8</option>
                    <option value="Central European Time (CET) - UTC+1">Central European Time (CET) - UTC+1</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
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
                  <button
                    type="button"
                    onClick={() => handlePriceModelChange("FREE")}
                    className={`p-6 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                      priceModel === "FREE"
                        ? "bg-[#0758fc]/5 border-[#0758fc] ring-2 ring-[#0758fc]/20 shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <Ticket size={28} className={priceModel === "FREE" ? "text-[#0758fc]" : "text-gray-400"} />
                    <h4 className="text-base font-bold text-gray-900">Free Event</h4>
                    <p className="text-xs text-gray-500">No charges apply for passes</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePriceModelChange("PAID")}
                    className={`p-6 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                      priceModel === "PAID"
                        ? "bg-[#0758fc]/5 border-[#0758fc] ring-2 ring-[#0758fc]/20 shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-2xl font-bold text-emerald-600">₹</span>
                    <h4 className="text-base font-bold text-gray-900">Paid Tickets</h4>
                    <p className="text-xs text-gray-500">Require attendee payout</p>
                  </button>
                </div>
              </div>

              {/* 🎟️ TICKET PASSES & TIER PRICING BUILDER */}
              <div className="bg-gray-50 border border-gray-200 rounded-3xl p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                      <Ticket size={18} className="text-[#0758fc]" />
                      Ticket Passes &amp; Tier Pricing
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Configure Early Bird pricing, General Release passes, and VIP delegate tiers.
                    </p>
                  </div>

                  {/* Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => addPresetTier("Early Bird Pass", "EARLY_BIRD", 199, 50, "Discounted early access pass", "ALL")}
                      className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-bold hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                      + Early Bird (₹199)
                    </button>
                    <button
                      type="button"
                      onClick={() => addPresetTier("General Release Pass", "REGULAR", 499, 200, "Standard delegate pass", "ALL")}
                      className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      + General Pass (₹499)
                    </button>
                    <button
                      type="button"
                      onClick={() => addPresetTier("VIP Delegate Pass", "VIP", 999, 25, "VIP seating + merchandise kit", "ALL")}
                      className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-bold hover:bg-purple-100 transition-colors cursor-pointer"
                    >
                      + VIP Pass (₹999)
                    </button>
                    <button
                      type="button"
                      onClick={() => addPresetTier("Non-Rotaract Guest Pass", "REGULAR", 599, 100, "Pass for general public & non-Rotaract delegates", "NON_ROTARACT_ONLY")}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      + Non-Rotaract Pass (₹599)
                    </button>
                    <button
                      type="button"
                      onClick={() => addPresetTier("Rotaract Member Exclusive", "REGULAR", 299, 150, "Special pass for chartered Rotaract members", "ROTARACT_ONLY")}
                      className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      + Rotaract Only (₹299)
                    </button>
                  </div>
                </div>

                {/* Tier Cards */}
                <div className="space-y-4">
                  {ticketTiers.map((tier, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">
                            Tier #{idx + 1}
                          </span>
                          <input
                            type="text"
                            required
                            value={tier.name}
                            onChange={(e) => updateTierField(idx, "name", e.target.value)}
                            placeholder="e.g. Early Bird Pass, General Release..."
                            className="font-bold text-sm text-gray-900 bg-transparent border-b border-gray-200 focus:border-[#0758fc] outline-none px-1 py-0.5 w-48 sm:w-64"
                          />
                        </div>

                        {ticketTiers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTier(idx)}
                            className="text-gray-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                            title="Delete this ticket tier"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                        {/* Price INR */}
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                            Ticket Price (INR ₹)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={priceModel === "FREE" ? 0 : tier.price}
                              onChange={(e) => {
                                const newPrice = parseFloat(e.target.value) || 0;
                                if (newPrice > 0 && priceModel === "FREE") {
                                  setPriceModel("PAID");
                                }
                                updateTierField(idx, "price", newPrice);
                              }}
                              placeholder="0 for Free"
                              className={`w-full border rounded-xl pl-7 pr-3 py-2 text-xs font-bold text-gray-900 outline-none transition-all ${
                                priceModel === "FREE"
                                  ? "bg-gray-100/80 border-gray-200 text-gray-600 focus:bg-white focus:border-[#0758fc]"
                                  : "bg-gray-50 border-gray-200 focus:bg-white focus:border-[#0758fc]"
                              }`}
                            />
                          </div>
                          {priceModel === "FREE" ? (
                            <span className="text-[10px] text-emerald-600 font-bold mt-1 block">Free Event (₹0)</span>
                          ) : (
                            <span className="text-[10px] text-[#0758fc] font-bold mt-1 block">Paid Pass (₹{tier.price})</span>
                          )}
                        </div>

                        {/* Capacity */}
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                            Seats / Capacity
                          </label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={tier.totalCapacity}
                            onChange={(e) => updateTierField(idx, "totalCapacity", parseInt(e.target.value) || 100)}
                            placeholder="100"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-[#0758fc]"
                          />
                        </div>

                        {/* Category */}
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                            Pass Category
                          </label>
                          <select
                            value={tier.tierType}
                            onChange={(e) => updateTierField(idx, "tierType", e.target.value as any)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-[#0758fc] cursor-pointer"
                          >
                            <option value="EARLY_BIRD">Early Bird Pass</option>
                            <option value="REGULAR">General Release Pass</option>
                            <option value="VIP">VIP Pass</option>
                            <option value="STUDENT">Student Pass</option>
                            <option value="DONATION">Donation Pass</option>
                          </select>
                        </div>

                        {/* Allowed Audience */}
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                            Audience Eligibility
                          </label>
                          <select
                            value={tier.allowedAudience || (tier.allowNonRotaract !== false ? "ALL" : "ROTARACT_ONLY")}
                            onChange={(e) => {
                              const aud = e.target.value as "ALL" | "ROTARACT_ONLY" | "NON_ROTARACT_ONLY";
                              updateTierField(idx, "allowedAudience", aud);
                              updateTierField(idx, "allowNonRotaract", aud !== "ROTARACT_ONLY");
                            }}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-[#0758fc] cursor-pointer"
                          >
                            <option value="ALL">👥 Open to All (Rotaract &amp; Guests)</option>
                            <option value="ROTARACT_ONLY">🛡️ Rotaract &amp; Rotary Only</option>
                            <option value="NON_ROTARACT_ONLY">🌐 Non-Rotaractors &amp; Guests Only</option>
                          </select>
                        </div>
                      </div>

                      {/* Description / Perks */}
                      <div>
                        <input
                          type="text"
                          value={tier.description || ""}
                          onChange={(e) => updateTierField(idx, "description", e.target.value)}
                          placeholder="Perks description (e.g. Includes delegate badge, lunch kit & certificate)"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-700 placeholder-gray-400 outline-none focus:bg-white focus:border-[#0758fc]"
                        />
                      </div>

                      {/* 🎟️ PURCHASE LIMIT CONTROL (Single Ticket vs Multi-Pass) */}
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 border border-gray-200">
                          <div>
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800 select-none">
                              <input
                                type="checkbox"
                                checked={tier.maxPerOrder === 1}
                                onChange={(e) => {
                                  updateTierField(idx, "maxPerOrder", e.target.checked ? 1 : 10);
                                }}
                                className="w-4 h-4 rounded text-[#0758fc] focus:ring-[#0758fc] cursor-pointer"
                              />
                              <span className="flex items-center gap-1.5">
                                <Ticket size={13} className="text-[#0758fc]" />
                                <span>Limit to 1 ticket per attendee / order</span>
                              </span>
                            </label>
                            <p className="text-[11px] text-gray-500 ml-6 mt-0.5">
                              Buyers can only purchase 1 ticket of this tier (prevents bulk hoarding for limited passes).
                            </p>
                          </div>
                          {tier.maxPerOrder === 1 ? (
                            <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                              🔒 Max 1 Ticket
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-gray-400 shrink-0">
                              Standard (Up to 10)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ⏱️ SCHEDULED TIME-SLAB / TIMED RELEASE CONTROLS */}
                      <div className="pt-2 border-t border-gray-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800 select-none">
                            <input
                              type="checkbox"
                              checked={Boolean(tier.hasCustomSchedule)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                updateTierField(idx, "hasCustomSchedule", checked);
                                if (checked && !tier.salesStartDate) {
                                  updateTierField(idx, "salesStartDate", new Date().toISOString().split("T")[0]);
                                  updateTierField(idx, "salesStartTime", "09:00");
                                  updateTierField(idx, "salesEndDate", startDate || "");
                                  updateTierField(idx, "salesEndTime", "23:59");
                                }
                              }}
                              className="w-4 h-4 rounded text-[#0758fc] focus:ring-[#0758fc] cursor-pointer"
                            />
                            <span className="flex items-center gap-1.5">
                              <Clock size={13} className="text-[#0758fc]" />
                              <span>Schedule Release Time-Slab {tier.tierType === "EARLY_BIRD" ? "(Early Bird Window)" : "(Timed Release)"}</span>
                            </span>
                          </label>

                          {tier.hasCustomSchedule && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                              ⏱️ Timed Release Active
                            </span>
                          )}
                        </div>

                        {tier.hasCustomSchedule && (
                          <div className="p-3.5 bg-blue-50/50 dark:bg-gray-800/60 border border-blue-100 dark:border-gray-700 rounded-2xl space-y-3 animate-in fade-in-50">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* Open Sales At */}
                              <div className="space-y-1">
                                <label className="block text-[10px] font-bold uppercase text-gray-600 dark:text-gray-400">
                                  Release / Sales Opens On
                                </label>
                                <div className="grid grid-cols-2 gap-1.5">
                                  <input
                                    type="date"
                                    value={tier.salesStartDate || ""}
                                    onChange={(e) => updateTierField(idx, "salesStartDate", e.target.value)}
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-900 dark:text-white outline-none focus:border-[#0758fc]"
                                  />
                                  <input
                                    type="time"
                                    value={tier.salesStartTime || "09:00"}
                                    onChange={(e) => updateTierField(idx, "salesStartTime", e.target.value)}
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-900 dark:text-white outline-none focus:border-[#0758fc]"
                                  />
                                </div>
                              </div>

                              {/* Close Sales At */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <label className="block text-[10px] font-bold uppercase text-gray-600 dark:text-gray-400">
                                    Sales Window Closes On
                                  </label>
                                  {tier.salesEndDate ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        updateTierField(idx, "salesEndDate", "");
                                        updateTierField(idx, "salesEndTime", "");
                                      }}
                                      className="text-[9px] text-[#0758fc] dark:text-blue-400 hover:underline font-bold cursor-pointer"
                                    >
                                      Switch to Sold-Out Only
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        updateTierField(idx, "salesEndDate", startDate || new Date().toISOString().split("T")[0]);
                                        updateTierField(idx, "salesEndTime", startTime || "23:59");
                                      }}
                                      className="text-[9px] text-[#0758fc] dark:text-blue-400 hover:underline font-bold cursor-pointer"
                                    >
                                      + Set Specific Date
                                    </button>
                                  )}
                                </div>

                                {tier.salesEndDate ? (
                                  <div className="grid grid-cols-2 gap-1.5">
                                    <input
                                      type="date"
                                      value={tier.salesEndDate || ""}
                                      onChange={(e) => updateTierField(idx, "salesEndDate", e.target.value)}
                                      className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-900 dark:text-white outline-none focus:border-[#0758fc]"
                                    />
                                    <input
                                      type="time"
                                      value={tier.salesEndTime || "23:59"}
                                      onChange={(e) => updateTierField(idx, "salesEndTime", e.target.value)}
                                      className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-900 dark:text-white outline-none focus:border-[#0758fc]"
                                    />
                                  </div>
                                ) : (
                                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-between">
                                    <span>🎟️ Closes automatically once all seats are sold out</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Quick Presets */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px]">
                              <span className="text-gray-500 dark:text-gray-400 font-bold">Quick Presets:</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!tier.salesStartDate) {
                                    updateTierField(idx, "salesStartDate", formatDateStringToInput(new Date(), timezone));
                                  }
                                  if (!tier.salesStartTime || tier.salesStartTime === "00:00") {
                                    updateTierField(idx, "salesStartTime", "09:00");
                                  }
                                  updateTierField(idx, "salesEndDate", "");
                                  updateTierField(idx, "salesEndTime", "");
                                }}
                                className={`px-2 py-1 border rounded-md font-bold cursor-pointer transition-all shadow-2xs ${
                                  !tier.salesEndDate
                                    ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-400/30"
                                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-[#0758fc] text-gray-800 dark:text-gray-200"
                                }`}
                              >
                                🎟️ Close After Sold Out (No Time Limit)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  updateTierField(idx, "salesStartDate", formatDateStringToInput(new Date(), timezone));
                                  updateTierField(idx, "salesStartTime", formatTimeStringToInput(new Date(), timezone) || "09:00");
                                  updateTierField(idx, "salesEndDate", startDate || "");
                                  updateTierField(idx, "salesEndTime", startTime || "09:00");
                                }}
                                className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-[#0758fc] dark:hover:border-[#0758fc] rounded-md text-gray-800 dark:text-gray-200 font-semibold cursor-pointer transition-colors shadow-2xs"
                              >
                                Opens Now ➔ Closes at Event Start
                              </button>
                              {startDate && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const s = new Date(startDate);
                                      s.setDate(s.getDate() - 3);
                                      updateTierField(idx, "salesStartDate", new Date().toISOString().split("T")[0]);
                                      updateTierField(idx, "salesStartTime", "09:00");
                                      updateTierField(idx, "salesEndDate", s.toISOString().split("T")[0]);
                                      updateTierField(idx, "salesEndTime", "23:59");
                                    }}
                                    className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-[#0758fc] dark:hover:border-[#0758fc] rounded-md text-gray-800 dark:text-gray-200 font-semibold cursor-pointer transition-colors shadow-2xs"
                                  >
                                    Closes 3 Days Before Event
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const s = new Date(startDate);
                                      s.setDate(s.getDate() - 7);
                                      updateTierField(idx, "salesStartDate", new Date().toISOString().split("T")[0]);
                                      updateTierField(idx, "salesStartTime", "09:00");
                                      updateTierField(idx, "salesEndDate", s.toISOString().split("T")[0]);
                                      updateTierField(idx, "salesEndTime", "23:59");
                                    }}
                                    className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-[#0758fc] dark:hover:border-[#0758fc] rounded-md text-gray-800 dark:text-gray-200 font-semibold cursor-pointer transition-colors shadow-2xs"
                                  >
                                    Closes 7 Days Before Event
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addNewTier}
                  className="w-full bg-white hover:bg-gray-50 border border-dashed border-gray-300 hover:border-[#0758fc] text-gray-700 hover:text-[#0758fc] font-bold text-xs py-3 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Plus size={16} /> Add Custom Ticket Pass Tier
                </button>
              </div>

              {/* EVENT VISIBILITY */}
              <div className="space-y-3">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                  EVENT VISIBILITY *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setVisibility("PUBLIC")}
                    className={`p-5 rounded-full border text-left transition-all cursor-pointer flex items-center gap-4 px-6 ${
                      visibility === "PUBLIC"
                        ? "bg-[#0758fc]/5 border-[#0758fc] ring-2 ring-[#0758fc]/20 shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#0758fc]/10 flex items-center justify-center flex-shrink-0">
                      <Lock size={18} className={visibility === "PUBLIC" ? "text-[#0758fc]" : "text-gray-400"} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Public Listing</h4>
                      <p className="text-xs text-gray-500">Listed on search and event grids</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisibility("PRIVATE")}
                    className={`p-5 rounded-full border text-left transition-all cursor-pointer flex items-center gap-4 px-6 ${
                      visibility === "PRIVATE"
                        ? "bg-[#0758fc]/5 border-[#0758fc] ring-2 ring-[#0758fc]/20 shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <Lock size={18} className={visibility === "PRIVATE" ? "text-[#0758fc]" : "text-gray-400"} />
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
                    className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#0758fc] shadow-sm"
                  />
                  <Users size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <datalist id="clubs-datalist">
                    {ROTARACT_CLUBS.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* 4. LOCATION DELIVERY TYPE */}
              <div className="space-y-3">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                  LOCATION DELIVERY TYPE *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setLocationDeliveryType("IN_PERSON")}
                    className={`p-5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      locationDeliveryType === "IN_PERSON"
                        ? "bg-[#0758fc]/5 border-[#0758fc] ring-2 ring-[#0758fc]/20 shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <MapPin size={22} className={locationDeliveryType === "IN_PERSON" ? "text-[#0758fc]" : "text-gray-400"} />
                    <h4 className="text-sm font-bold text-gray-900">In-Person</h4>
                    <p className="text-[11px] text-gray-500">Physical venue location</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLocationDeliveryType("ONLINE")}
                    className={`p-5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      locationDeliveryType === "ONLINE"
                        ? "bg-[#0758fc]/5 border-[#0758fc] ring-2 ring-[#0758fc]/20 shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <Globe size={22} className={locationDeliveryType === "ONLINE" ? "text-[#0758fc]" : "text-gray-400"} />
                    <h4 className="text-sm font-bold text-gray-900">Online Virtual</h4>
                    <p className="text-[11px] text-gray-500">Zoom, Meet, or streaming Link</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLocationDeliveryType("HYBRID")}
                    className={`p-5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      locationDeliveryType === "HYBRID"
                        ? "bg-[#0758fc]/5 border-[#0758fc] ring-2 ring-[#0758fc]/20 shadow-sm"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <Sparkles size={22} className={locationDeliveryType === "HYBRID" ? "text-[#0758fc]" : "text-gray-400"} />
                    <h4 className="text-sm font-bold text-gray-900">Hybrid format</h4>
                    <p className="text-[11px] text-gray-500">Both physical and streaming</p>
                  </button>
                </div>
              </div>

              {/* 5. TICKET POLICY — REFUNDS & TRANSFERS */}
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-3xl space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900">Ticket Policy</h4>
                    <p className="text-xs text-gray-500">Control whether attendees can request refunds or transfer their passes to another person.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Refund Toggle */}
                  <button
                    type="button"
                    onClick={() => setAllowRefunds(!allowRefunds)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                      allowRefunds
                        ? "bg-emerald-50 border-emerald-200 ring-1 ring-emerald-300/50"
                        : "bg-gray-100 border-gray-200"
                    }`}
                  >
                    <div className="text-left">
                      <p className={`text-sm font-extrabold ${allowRefunds ? "text-emerald-700" : "text-gray-500"}`}>
                        Refunds
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Attendees can request a refund
                      </p>
                    </div>
                    {/* Toggle pill */}
                    <div className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${allowRefunds ? "bg-emerald-500" : "bg-gray-300"}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${allowRefunds ? "translate-x-5" : ""}`} />
                    </div>
                  </button>

                  {/* Transfer Toggle */}
                  <button
                    type="button"
                    onClick={() => setAllowTransfer(!allowTransfer)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                      allowTransfer
                        ? "bg-emerald-50 border-emerald-200 ring-1 ring-emerald-300/50"
                        : "bg-gray-100 border-gray-200"
                    }`}
                  >
                    <div className="text-left">
                      <p className={`text-sm font-extrabold ${allowTransfer ? "text-emerald-700" : "text-gray-500"}`}>
                        Ticket Transfers
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Attendees can transfer to others
                      </p>
                    </div>
                    {/* Toggle pill */}
                    <div className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${allowTransfer ? "bg-emerald-500" : "bg-gray-300"}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${allowTransfer ? "translate-x-5" : ""}`} />
                    </div>
                  </button>
                </div>
              </div>

              {/* 6. ORGANIZER DYNAMIC UPI PAYMENT RECEIVING ACCOUNT */}
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-[#0758fc] text-white flex items-center justify-center font-black">
                      <QrCode size={16} />
                    </span>
                    <div>
                      <h4 className="text-sm font-extrabold text-gray-900">Organizer UPI Receiving Account</h4>
                      <p className="text-xs text-gray-500">
                        Dynamic UPI QR codes will be generated with this VPA for attendees to pay directly.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                      OFFICIAL UPI ID / VPA *
                    </label>
                    <input
                      type="text"
                      required
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. rotaractclub@okaxis or 9876543210@paytm"
                      className="w-full bg-white border border-gray-200 rounded-full px-5 py-3 text-xs sm:text-sm font-mono font-bold text-gray-900 placeholder-gray-400 outline-none focus:border-[#0758fc] shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-1.5">
                      PAYEE ACCOUNT NAME *
                    </label>
                    <input
                      type="text"
                      required
                      value={upiPayeeName}
                      onChange={(e) => setUpiPayeeName(e.target.value)}
                      placeholder="e.g. Rotaract Club of Bengaluru"
                      className="w-full bg-white border border-gray-200 rounded-full px-5 py-3 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0758fc] shadow-sm"
                    />
                  </div>
                </div>
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
                  <div className="p-5 bg-gradient-to-r from-rose-50/80 via-orange-50/50 to-amber-50/40 border border-rose-200/90 rounded-3xl space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#0758fc] uppercase tracking-wider">
                        <Sparkles size={14} className="text-[#0758fc]" />
                        <span>Auto-Fill with Google Maps Link or Place Name</span>
                      </div>
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
                          className="w-full bg-white border border-rose-200 rounded-full pl-12 pr-6 py-3 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0758fc] focus:ring-2 focus:ring-[#0758fc]/20 transition-all font-mono shadow-sm"
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
                        className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#0758fc] focus:ring-2 focus:ring-[#0758fc]/15 transition-all shadow-sm"
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
                        className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#0758fc] focus:ring-2 focus:ring-[#0758fc]/15 transition-all shadow-sm"
                      />
                    </div>
                  </div>

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
                        placeholder="e.g. India"
                        className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#0758fc] focus:ring-2 focus:ring-[#0758fc]/15 transition-all shadow-sm"
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
                        placeholder="e.g. Karnataka"
                        className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#0758fc] focus:ring-2 focus:ring-[#0758fc]/15 transition-all shadow-sm"
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
                        placeholder="e.g. Bengaluru"
                        className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#0758fc] focus:ring-2 focus:ring-[#0758fc]/15 transition-all shadow-sm"
                      />
                    </div>
                  </div>

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
                        placeholder="e.g. 123 Main St, Indiranagar"
                        className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#0758fc] focus:ring-2 focus:ring-[#0758fc]/15 transition-all shadow-sm"
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
                        placeholder="e.g. 560038"
                        className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0758fc] focus:ring-2 focus:ring-[#0758fc]/15 transition-all font-mono shadow-sm"
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
                      className="w-full bg-white border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0758fc]"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                    CATEGORY *
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-full pl-6 pr-10 py-3.5 text-xs sm:text-sm text-gray-900 outline-none focus:bg-white focus:border-[#0758fc] cursor-pointer appearance-none shadow-sm font-medium"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
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
                      value={capacity === 0 ? "" : capacity}
                      onChange={(e) => {
                        const val = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                        setCapacity(isNaN(val) ? 0 : val);
                      }}
                      placeholder="e.g. 100"
                      className="w-full bg-gray-50 border border-gray-200 rounded-full pl-12 pr-6 py-3.5 text-xs sm:text-sm text-gray-900 outline-none focus:bg-white focus:border-[#0758fc] shadow-sm font-medium"
                    />
                  </div>
                  <span className="text-[11px] text-gray-500 mt-1.5 px-3 block">
                    Overall event cap (auto-synced from total ticket tier seats: {ticketTiers.reduce((acc, t) => acc + (Number(t.totalCapacity) || 0), 0)} seats).
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#0758fc]">
                    SEARCH TAGS &amp; TOPICS {tags.length > 0 && <span className="text-gray-400 font-normal">({tags.length} added)</span>}
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Type a tag (e.g. react, marketing, rock) and press Enter or comma"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-[#0758fc] shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTag()}
                    className="w-11 h-11 rounded-full bg-[#0758fc] hover:bg-[#054fe0] text-white flex items-center justify-center flex-shrink-0 transition-all shadow-md cursor-pointer"
                    title="Add tag"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {/* Quick Suggestion Pills */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                  <span className="text-[11px] font-bold text-gray-400">Suggestions:</span>
                  {[
                    "rotaract",
                    "district3192",
                    "community",
                    "leadership",
                    "fellowship",
                    "cultural",
                    "conference",
                    "sports",
                  ].map((sugg) => (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => handleAddTag(sugg)}
                      disabled={tags.includes(sugg)}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer border disabled:opacity-40 disabled:cursor-not-allowed bg-gray-50 text-gray-600 border-gray-200 hover:bg-[#0758fc]/10 hover:text-[#0758fc] hover:border-[#0758fc]/30"
                    >
                      +{sugg}
                    </button>
                  ))}
                </div>

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
                  <div className="mt-2 px-2">
                    <p className="text-[11px] text-gray-500 italic">
                      No tags added yet. Choose from suggestions above or type custom topics to help attendees find your event.
                    </p>
                  </div>
                )}
              </div>

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
                      placeholder="organizer@rotaract3192.org"
                      className="w-full bg-gray-50 border border-gray-200 rounded-full pl-12 pr-6 py-3.5 text-xs sm:text-sm text-gray-900 outline-none focus:bg-white focus:border-[#0758fc] shadow-sm"
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
                      placeholder="+91 9876543210"
                      className="w-full bg-gray-50 border border-gray-200 rounded-full pl-12 pr-6 py-3.5 text-xs sm:text-sm text-gray-900 outline-none focus:bg-white focus:border-[#0758fc] shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 🔔 EMAIL BROADCAST ANNOUNCEMENT TOGGLE */}
              {!isEditMode && (
                <div className="p-5 bg-gradient-to-r from-blue-50/90 to-indigo-50/70 border border-blue-200/80 rounded-3xl flex items-center justify-between gap-4 mt-2">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#0758fc] text-white flex items-center justify-center shadow-xs shrink-0">
                      <Bell size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-gray-900">Email Notification Broadcast</h4>
                      <p className="text-[11px] sm:text-xs text-gray-600">
                        Automatically send a rich announcement email to all registered portal members in the background upon publishing.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifyAllMembers(!notifyAllMembers)}
                    className={`relative w-12 h-7 rounded-full transition-colors shrink-0 cursor-pointer ${
                      notifyAllMembers ? "bg-[#0758fc]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        notifyAllMembers ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* ── 3. WIZARD FOOTER NAVIGATION ────────────────────────────── */}
        <div className="bg-gray-50/80 border-t border-gray-100 px-8 sm:px-12 py-5 flex items-center justify-between">
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
                className="bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold text-xs sm:text-sm px-8 py-3.5 rounded-full transition-all shadow-lg shadow-[#0758fc]/30 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
              >
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={loading}
                className="bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold text-xs sm:text-sm px-8 py-3.5 rounded-full transition-all shadow-lg shadow-[#0758fc]/30 flex items-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    {isEditMode ? "Save Changes" : "Publish Event"} <Check size={16} strokeWidth={3} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
