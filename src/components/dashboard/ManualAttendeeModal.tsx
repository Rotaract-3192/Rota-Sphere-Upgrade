"use client";

import { useState, useEffect } from "react";
import {
  X,
  UserPlus,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building,
  DollarSign,
  Mail,
  Phone,
  User,
  ShieldCheck,
  Layers,
  Sparkles,
  Briefcase,
} from "lucide-react";
import {
  createManualAttendeeAction,
  ManualAttendeeInput,
  getEventCustomQuestionsAction,
  getEventTiersAction,
} from "@/app/actions/orderActions";
import { getDistrictClubsWithZones, getClubZone } from "@/lib/utils/zoneResolver";
import { SearchableClubSelect } from "@/components/ui/SearchableClubSelect";

interface ManualAttendeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: any[];
  initialEventId?: string;
  onAttendeeAdded?: (newTicket: any) => void;
}

const DISTRICT_CLUBS = getDistrictClubsWithZones();

export function ManualAttendeeModal({
  isOpen,
  onClose,
  events,
  initialEventId,
  onAttendeeAdded,
}: ManualAttendeeModalProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>(
    initialEventId || (events[0]?.id ? String(events[0].id) : "")
  );

  const selectedEvent = events.find((e) => String(e.id) === String(selectedEventId)) || events[0];

  // Dynamic Tiers and Dynamic Questions
  const [tiers, setTiers] = useState<any[]>(selectedEvent?.saas_ticket_tiers || []);
  const [customQuestions, setCustomQuestions] = useState<any[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(false);

  const [selectedTierId, setSelectedTierId] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [memberType, setMemberType] = useState<"Rotaract" | "Rotary" | "Non-Rotaract">("Rotaract");
  const [selectedClub, setSelectedClub] = useState("");
  const [customClubName, setCustomClubName] = useState("");
  const [designation, setDesignation] = useState("");
  const [zone, setZone] = useState("");
  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({});
  const [paymentMethod, setPaymentMethod] = useState<string>("OFFLINE_CASH");
  const [amountPaid, setAmountPaid] = useState<string>("0");
  const [referenceNote, setReferenceNote] = useState("");
  const [sendEmail, setSendEmail] = useState<boolean>(true);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    orderNumber: string;
    ticketCode: string;
    attendeeName: string;
  } | null>(null);

  // Sync initialEventId prop
  useEffect(() => {
    if (initialEventId) {
      setSelectedEventId(String(initialEventId));
    }
  }, [initialEventId]);

  // Load tiers and custom questions whenever selectedEventId changes
  useEffect(() => {
    if (!selectedEventId || !isOpen) return;

    // 1. Fetch Tiers if not in memory or to ensure freshness
    const inMemoryTiers = selectedEvent?.saas_ticket_tiers || [];
    if (inMemoryTiers.length > 0) {
      setTiers(inMemoryTiers);
      setSelectedTierId(String(inMemoryTiers[0].id));
      setAmountPaid(String(inMemoryTiers[0].price || 0));
    } else {
      setLoadingTiers(true);
      getEventTiersAction(selectedEventId).then((res) => {
        setLoadingTiers(false);
        if (res.success && res.tiers && res.tiers.length > 0) {
          setTiers(res.tiers);
          setSelectedTierId(String(res.tiers[0].id));
          setAmountPaid(String(res.tiers[0].price || 0));
        } else {
          setTiers([]);
          setSelectedTierId("");
          setAmountPaid("0");
        }
      });
    }

    // 2. Fetch Event Custom Registration Questions
    getEventCustomQuestionsAction(selectedEventId).then((res) => {
      if (res.success && res.questions) {
        setCustomQuestions(res.questions);
      } else {
        setCustomQuestions([]);
      }
    });
  }, [selectedEventId, isOpen, selectedEvent]);

  // Auto-populate Zone when Club is selected
  function handleClubChange(clubVal: string) {
    setSelectedClub(clubVal);
    if (clubVal === "custom") {
      setZone("");
    } else if (clubVal) {
      const resolved = getClubZone(clubVal);
      setZone(resolved);
    } else {
      setZone("");
    }
  }

  // Handle tier selection to auto-update suggested price
  function handleTierChange(tierId: string) {
    setSelectedTierId(tierId);
    const matchedTier = tiers.find((t) => String(t.id) === String(tierId));
    if (matchedTier) {
      setAmountPaid(String(matchedTier.price || 0));
      if (Number(matchedTier.price) === 0) {
        setPaymentMethod("VIP_COMPLIMENTARY");
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEventId) {
      setErrorMessage("Please select an event.");
      return;
    }
    if (!selectedTierId) {
      setErrorMessage("Please select a ticket tier.");
      return;
    }
    if (!name.trim() || !email.trim()) {
      setErrorMessage("Attendee Name and Email are required.");
      return;
    }

    if (memberType === "Rotaract") {
      const club = selectedClub === "custom" ? customClubName.trim() : selectedClub.trim();
      if (!club) {
        setErrorMessage("Rotaract Club is required for Rotaract members.");
        return;
      }
    } else if (memberType === "Rotary") {
      if (!selectedClub.trim()) {
        setErrorMessage("Rotary Club Name is required for Rotary members.");
        return;
      }
    }

    // Validate required custom questions
    for (const q of customQuestions) {
      if (q.is_required && !customAnswers[q.id]?.toString().trim()) {
        setErrorMessage(`Please answer "${q.question_text}"`);
        return;
      }
    }

    setLoading(true);
    setErrorMessage(null);

    const finalClub =
      memberType === "Non-Rotaract"
        ? (selectedClub || "Guest / Non-Rotaractor")
        : memberType === "Rotary"
        ? selectedClub.trim()
        : selectedClub === "custom"
        ? customClubName.trim()
        : selectedClub;

    const payload: ManualAttendeeInput = {
      eventId: selectedEventId,
      ticketTierId: selectedTierId,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      memberType,
      clubName: finalClub || undefined,
      designation: designation.trim() || undefined,
      zone: zone.trim() || undefined,
      paymentMethod,
      amountPaid: Number(amountPaid) || 0,
      referenceNote: referenceNote.trim() || undefined,
      foodPreference: customAnswers["food_preference"] || customAnswers["food"] || undefined,
      sendConfirmationEmail: sendEmail,
    };

    const res = await createManualAttendeeAction(payload);
    setLoading(false);

    if (res.success && res.ticketCode) {
      setSuccessResult({
        orderNumber: res.orderNumber || "RS-MANUAL",
        ticketCode: res.ticketCode,
        attendeeName: name.trim(),
      });

      if (onAttendeeAdded) {
        onAttendeeAdded({
          ticket_code: res.ticketCode,
          order_number: res.orderNumber,
          attendee_name: name.trim(),
          attendee_email: email.trim(),
          attendee_phone: phone.trim(),
          ticket_tier_id: selectedTierId,
          event_id: selectedEventId,
          status: "CONFIRMED",
          created_at: new Date().toISOString(),
          custom_answers: {
            ...customAnswers,
            member_type: memberType,
            club_name: finalClub,
            designation: designation.trim(),
            zone: zone.trim(),
            payment_mode: paymentMethod,
          },
        });
      }
    } else {
      setErrorMessage(res.error || "Failed to create manual attendee entry.");
    }
  }

  function handleReset() {
    setName("");
    setEmail("");
    setPhone("");
    setMemberType("Rotaract");
    setSelectedClub("");
    setCustomClubName("");
    setDesignation("");
    setZone("");
    setCustomAnswers({});
    setReferenceNote("");
    setSuccessResult(null);
    setErrorMessage(null);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in-50">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer" />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-gray-900 border border-transparent dark:border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 max-h-[92vh] text-gray-900 dark:text-white mx-auto">
        {/* Header */}
        <div className="bg-gray-900 dark:bg-gray-950 text-white p-5 sm:p-6 flex items-center justify-between relative overflow-hidden shrink-0 border-b border-gray-800">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-[#0758fc]/20 border border-[#0758fc]/40 text-[#60a5fa] flex items-center justify-center shrink-0">
              <UserPlus size={22} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#60a5fa] flex items-center gap-1.5 leading-none">
                <ShieldCheck size={12} /> SPOT REGISTRATION &amp; MANUAL ENTRY
              </span>
              <h2 className="text-lg font-black text-white leading-tight">Create Manual Attendee</h2>
              <p className="text-xs text-gray-400 font-medium">Issue passes for cash, direct transfer, or VIP guests</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
          {/* Success State */}
          {successResult ? (
            <div className="p-6 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-3xl text-center space-y-5 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-emerald-950 dark:text-emerald-200">Pass Issued Successfully!</h3>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                  Manual attendee ticket for <strong className="font-extrabold">{successResult.attendeeName}</strong> has been registered.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-850 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-xs space-y-2 text-left max-w-md mx-auto font-mono text-xs">
                <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                  <span className="text-gray-500 dark:text-gray-400 font-sans">Ticket Pass Code:</span>
                  <span className="font-bold text-[#0758fc] dark:text-blue-400">{successResult.ticketCode}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                  <span className="text-gray-500 dark:text-gray-400 font-sans">Order Number:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{successResult.orderNumber}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-gray-500 dark:text-gray-400 font-sans">Gate Entry Status:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">CONFIRMED (READY TO SCAN)</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="bg-[#0758fc] hover:bg-blue-600 text-white font-extrabold text-xs px-6 py-3 rounded-2xl transition-all shadow-md cursor-pointer"
                >
                  + Add Another Attendee
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 font-bold text-xs px-6 py-3 rounded-2xl transition-all cursor-pointer"
                >
                  Close &amp; View Attendees
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Target Event & Ticket Tier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Event Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Layers size={14} className="text-[#0758fc] dark:text-blue-400" />
                    Event *
                  </label>
                  <select
                    required
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-[#0758fc] focus:bg-white dark:focus:bg-gray-900 cursor-pointer"
                  >
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} {ev.city ? `(${ev.city})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tier Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <QrCode size={14} className="text-[#0758fc] dark:text-blue-400" />
                    Ticket Tier *
                  </label>
                  <select
                    required
                    value={selectedTierId}
                    onChange={(e) => handleTierChange(e.target.value)}
                    disabled={loadingTiers}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-[#0758fc] focus:bg-white dark:focus:bg-gray-900 cursor-pointer disabled:opacity-50"
                  >
                    {loadingTiers && <option value="">Loading ticket tiers...</option>}
                    {!loadingTiers && tiers.length === 0 && <option value="">No tiers configured</option>}
                    {!loadingTiers &&
                      tiers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} — {Number(t.price) === 0 ? "Free Pass" : `₹${Number(t.price).toFixed(2)}`}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* 2. Delegate Details (Identical to Normal Registration) */}
              <div className="space-y-3 pt-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                  Delegate Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300">Full Name *</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                      <input
                        type="text"
                        required
                        placeholder="Full Name *"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-[#0758fc] focus:bg-white dark:focus:bg-gray-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300">Email Address *</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                      <input
                        type="email"
                        required
                        placeholder="Email Address *"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-[#0758fc] focus:bg-white dark:focus:bg-gray-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300">Phone Number</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-[#0758fc] focus:bg-white dark:focus:bg-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Rotary Affiliation & Club Category (3 Parts) */}
              <div className="p-4 bg-blue-50/40 dark:bg-gray-800/80 border border-blue-200/60 dark:border-gray-700 rounded-3xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#0758fc] dark:text-blue-400 flex items-center gap-1.5">
                    <Building size={14} /> Affiliation &amp; Club Details
                  </span>
                  {zone && (
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-[#0758fc] dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      Zone: {zone}
                    </span>
                  )}
                </div>

                {/* 3-Part Category Switcher */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300">Affiliation Category</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Rotaract", "Rotary", "Non-Rotaract"] as const).map((type) => {
                      const isSelected = memberType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setMemberType(type);
                            if (type === "Non-Rotaract") {
                              setSelectedClub("Non-Rotaract Guest");
                              setZone("General / Guest");
                            } else if (type === "Rotary") {
                              setSelectedClub("");
                              setZone("Rotary International");
                            } else {
                              setSelectedClub("");
                              setZone("");
                            }
                          }}
                          className={`py-2 px-2.5 rounded-xl text-xs font-extrabold transition-all border text-center cursor-pointer active:scale-95 ${
                            isSelected
                              ? "bg-[#0758fc] text-white border-[#0758fc] shadow-xs"
                              : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100/80 dark:hover:bg-gray-800"
                          }`}
                        >
                          {type === "Rotaract"
                            ? "● Rotaract"
                            : type === "Rotary"
                            ? "● Rotary"
                            : "● Non-Rotarian"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Club Details Based on Affiliation */}
                {memberType === "Rotary" ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300">
                        Rotary Club Name <span className="text-rose-500 font-extrabold">*</span>
                      </label>
                      <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                        Required
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rotary Club of Bangalore Central, RC Yelahanka..."
                      value={selectedClub === "Non-Rotaract Guest" ? "" : selectedClub}
                      onChange={(e) => setSelectedClub(e.target.value)}
                      className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-3 py-2.5 text-xs font-bold text-gray-800 dark:text-white outline-none focus:border-[#0758fc]"
                    />
                  </div>
                ) : memberType === "Non-Rotaract" ? (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300">Organization / College / Company (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. University Name, Corporate, Guest of Rtr. X..."
                      value={selectedClub === "Non-Rotaract Guest" ? "" : selectedClub}
                      onChange={(e) => setSelectedClub(e.target.value || "Non-Rotaract Guest")}
                      className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-3 py-2.5 text-xs font-bold text-gray-800 dark:text-white outline-none focus:border-[#0758fc]"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300">
                        Search District 3192 Club <span className="text-rose-500 font-extrabold">*</span>
                      </label>
                      <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                        Required
                      </span>
                    </div>
                    <SearchableClubSelect
                      value={selectedClub}
                      customValue={customClubName}
                      zone={zone}
                      required={true}
                      onChange={(clubName, clubZone, isCustom) => {
                        setSelectedClub(clubName);
                        setZone(clubZone);
                        if (!isCustom && clubName !== "custom") {
                          setCustomClubName("");
                        }
                      }}
                      onCustomChange={(customVal) => setCustomClubName(customVal)}
                      placeholder="Type to search District 3192 clubs (e.g. Koramangala, Bangalore)..."
                    />
                  </div>
                )}

                {/* 4. Designation / Role (NORMAL TEXT INPUT COLUMN — NOT A DROPDOWN) */}
                <div className="space-y-1 pt-1 border-t border-blue-200/50 dark:border-gray-700/50">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Briefcase size={13} className="text-[#0758fc] dark:text-blue-400" /> Designation / Role
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal">Free text input</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. President, Sergeant-at-Arms, DRR, Secretary, Member..."
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-[#0758fc] focus:ring-2 focus:ring-[#0758fc]/10"
                  />
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">
                    Type any official designation (President, Sergeant-at-Arms, DRR, Secretary, Member, Guest, etc.)
                  </p>
                </div>
              </div>

              {/* 4. Event Custom Registration Questions (Matches Normal Ticket Entry 1:1) */}
              {customQuestions.length > 0 && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-3xl space-y-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300 block">
                    Event Registration Questions
                  </span>

                  <div className="space-y-3">
                    {customQuestions.map((q) => (
                      <div key={q.id} className="space-y-1 text-left">
                        <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300">
                          {q.question_text} {q.is_required && <span className="text-rose-500">*</span>}
                        </label>
                        {q.question_type === "dropdown" ? (
                          <select
                            value={customAnswers[q.id] || ""}
                            onChange={(e) =>
                              setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })
                            }
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-[#0758fc] cursor-pointer"
                          >
                            <option value="">Select an option...</option>
                            {(Array.isArray(q.options) ? q.options : []).map((opt: string, optIdx: number) => (
                              <option key={optIdx} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder={q.question_text}
                            value={customAnswers[q.id] || ""}
                            onChange={(e) =>
                              setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })
                            }
                            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-[#0758fc]"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Payment & Billing Details */}
              <div className="space-y-3 pt-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                  Payment Collection &amp; Receipt Note
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300">Payment Mode</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-[#0758fc] focus:bg-white dark:focus:bg-gray-900 cursor-pointer"
                    >
                      <option value="OFFLINE_CASH">💵 Cash at Desk</option>
                      <option value="DIRECT_BANK_TRANSFER">🏦 Bank IMPS/NEFT</option>
                      <option value="VIP_COMPLIMENTARY">👑 VIP / Complimentary</option>
                      <option value="MANUAL_UPI">📱 Offline UPI Verified</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300">Amount Collected (₹)</label>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        className="w-full pl-8 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-[#0758fc] focus:bg-white dark:focus:bg-gray-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300">Receipt / Reference Note</label>
                    <input
                      type="text"
                      placeholder="Receipt / UTR / Note"
                      value={referenceNote}
                      onChange={(e) => setReferenceNote(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-[#0758fc] focus:bg-white dark:focus:bg-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* 6. Dispatch Email Checkbox */}
              <div className="p-3.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Mail size={13} className="text-[#0758fc] dark:text-blue-400" />
                    Send Ticket Confirmation Email with QR Pass
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Sends official digital ticket, scannable QR token, and calendar invite to attendee's email.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="w-4 h-4 text-[#0758fc] rounded border-gray-300 dark:border-gray-600 focus:ring-[#0758fc] cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-2xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#0758fc] hover:bg-blue-600 text-white font-extrabold text-xs px-6 py-3 rounded-2xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  <span>Issue Pass &amp; Create Attendee</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
