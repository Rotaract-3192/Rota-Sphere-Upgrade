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
  CreditCard,
  Layers,
  Sparkles,
} from "lucide-react";
import { createManualAttendeeAction, ManualAttendeeInput } from "@/app/actions/orderActions";
import { getDistrictClubsWithZones, getClubZone } from "@/lib/utils/zoneResolver";

interface ManualAttendeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: any[];
  initialEventId?: string;
  onAttendeeAdded?: (newTicket: any) => void;
}

const DISTRICT_CLUBS = getDistrictClubsWithZones();
const KNOWN_ZONES = [
  "Taranga",
  "Pravaha",
  "Varuna",
  "Arnava",
  "Zone 1",
  "Zone 2",
  "Zone 3",
  "Zone 4",
  "Zone 5",
  "Zone 6",
  "Zone 7",
  "Zone 8",
  "Zone 9",
  "Zone 10",
  "Other / External Zone",
];

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

  const tiers: any[] = selectedEvent?.saas_ticket_tiers || selectedEvent?.ticket_tiers || [];

  const [selectedTierId, setSelectedTierId] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedClub, setSelectedClub] = useState("");
  const [customClubName, setCustomClubName] = useState("");
  const [zone, setZone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("OFFLINE_CASH");
  const [amountPaid, setAmountPaid] = useState<string>("0");
  const [referenceNote, setReferenceNote] = useState("");
  const [foodPreference, setFoodPreference] = useState<string>("Veg");
  const [sendEmail, setSendEmail] = useState<boolean>(true);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    orderNumber: string;
    ticketCode: string;
    attendeeName: string;
  } | null>(null);

  // Sync tier selection when event or tiers change
  useEffect(() => {
    if (tiers.length > 0) {
      setSelectedTierId(String(tiers[0].id));
      setAmountPaid(String(tiers[0].price || 0));
    } else {
      setSelectedTierId("");
      setAmountPaid("0");
    }
  }, [selectedEventId, tiers.length]);

  // When initialEventId changes
  useEffect(() => {
    if (initialEventId) {
      setSelectedEventId(String(initialEventId));
    }
  }, [initialEventId]);

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

    setLoading(true);
    setErrorMessage(null);

    const finalClub = selectedClub === "custom" ? customClubName.trim() : selectedClub;

    const payload: ManualAttendeeInput = {
      eventId: selectedEventId,
      ticketTierId: selectedTierId,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      clubName: finalClub || "Individual Delegate",
      zone: zone.trim() || "General / Unassigned",
      paymentMethod,
      amountPaid: Number(amountPaid) || 0,
      referenceNote: referenceNote.trim() || "Manual Spot Entry",
      foodPreference,
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
            club_name: finalClub,
            zone: zone.trim(),
            food_preference: foodPreference,
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
    setSelectedClub("");
    setCustomClubName("");
    setZone("");
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
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 max-h-[92vh] text-gray-900 mx-auto">
        {/* Header */}
        <div className="bg-gray-900 text-white p-5 sm:p-6 flex items-center justify-between relative overflow-hidden shrink-0">
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
            <div className="p-6 bg-emerald-50/70 border border-emerald-200 rounded-3xl text-center space-y-5 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-emerald-950">Pass Issued Successfully!</h3>
                <p className="text-xs text-emerald-800 font-medium">
                  Manual attendee ticket for <strong className="font-extrabold">{successResult.attendeeName}</strong> has been registered.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs space-y-2 text-left max-w-md mx-auto font-mono text-xs">
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-500 font-sans">Ticket Pass Code:</span>
                  <span className="font-bold text-[#0758fc]">{successResult.ticketCode}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-500 font-sans">Order Number:</span>
                  <span className="font-bold text-gray-800">{successResult.orderNumber}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-gray-500 font-sans">Gate Entry Status:</span>
                  <span className="font-bold text-emerald-600 uppercase">CONFIRMED (READY TO SCAN)</span>
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
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs px-6 py-3 rounded-2xl transition-all cursor-pointer"
                >
                  Close &amp; View Attendees
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Target Event & Ticket Tier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Event Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                    <Layers size={14} className="text-[#0758fc]" />
                    Event *
                  </label>
                  <select
                    required
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-[#0758fc] focus:bg-white cursor-pointer"
                  >
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} ({ev.city || "Bangalore"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tier Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                    <QrCode size={14} className="text-[#0758fc]" />
                    Ticket Tier *
                  </label>
                  <select
                    required
                    value={selectedTierId}
                    onChange={(e) => handleTierChange(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-[#0758fc] focus:bg-white cursor-pointer"
                  >
                    {tiers.length === 0 && <option value="">No tiers configured</option>}
                    {tiers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} — ₹{Number(t.price).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. Delegate Details */}
              <div className="space-y-3 pt-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500 block">
                  Delegate Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-gray-700">Full Name *</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        required
                        placeholder="Rtr. John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium outline-none focus:border-[#0758fc] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-gray-700">Email Address *</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        required
                        placeholder="delegate@rotaract3192.org"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium outline-none focus:border-[#0758fc] focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-gray-700">Phone Number</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        placeholder="+91 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium outline-none focus:border-[#0758fc] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-gray-700">Food Preference</label>
                    <select
                      value={foodPreference}
                      onChange={(e) => setFoodPreference(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium outline-none focus:border-[#0758fc] focus:bg-white cursor-pointer"
                    >
                      <option value="Veg">Vegetarian (Veg)</option>
                      <option value="Non-Veg">Non-Vegetarian (Non-Veg)</option>
                      <option value="Jain">Jain Food</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. Rotaract Club & Auto-Populated Zone */}
              <div className="p-4 bg-blue-50/40 border border-blue-200/60 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#0758fc] flex items-center gap-1.5">
                    <Building size={14} /> District 3192 Club &amp; Zone
                  </span>
                  {zone && (
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0758fc] border border-blue-200">
                      Auto Zone: {zone}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-gray-700">Select Rotaract Club</label>
                    <select
                      value={selectedClub}
                      onChange={(e) => handleClubChange(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-2xl px-3 py-2.5 text-xs font-bold text-gray-800 outline-none focus:border-[#0758fc] cursor-pointer"
                    >
                      <option value="">-- Choose Club ({DISTRICT_CLUBS.length} Clubs) --</option>
                      {DISTRICT_CLUBS.map((c, idx) => (
                        <option key={idx} value={c.name}>
                          {c.name} ({c.zone})
                        </option>
                      ))}
                      <option value="custom">-- Other / Non-3192 Club --</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-gray-700">District Zone</label>
                    <select
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-2xl px-3 py-2.5 text-xs font-bold text-gray-800 outline-none focus:border-[#0758fc] cursor-pointer"
                    >
                      <option value="">-- Select or Auto-Filled Zone --</option>
                      {KNOWN_ZONES.map((z) => (
                        <option key={z} value={z}>
                          {z}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedClub === "custom" && (
                  <div className="pt-1 animate-in fade-in-50">
                    <input
                      type="text"
                      required
                      placeholder="Enter custom Club name..."
                      value={customClubName}
                      onChange={(e) => setCustomClubName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-2xl px-3 py-2 text-xs font-bold outline-none focus:border-[#0758fc]"
                    />
                  </div>
                )}
              </div>

              {/* 4. Payment & Billing Details */}
              <div className="space-y-3 pt-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500 block">
                  Payment Collection &amp; Receipt Note
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="block text-[11px] font-bold text-gray-700">Payment Mode</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold outline-none focus:border-[#0758fc] focus:bg-white cursor-pointer"
                    >
                      <option value="OFFLINE_CASH">💵 Cash at Desk</option>
                      <option value="DIRECT_BANK_TRANSFER">🏦 Bank IMPS/NEFT</option>
                      <option value="VIP_COMPLIMENTARY">👑 VIP / Complimentary</option>
                      <option value="MANUAL_UPI">📱 Offline UPI Verified</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="block text-[11px] font-bold text-gray-700">Amount Collected (₹)</label>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold outline-none focus:border-[#0758fc] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="block text-[11px] font-bold text-gray-700">Receipt / Desk Note</label>
                    <input
                      type="text"
                      placeholder="e.g. Receipt #104"
                      value={referenceNote}
                      onChange={(e) => setReferenceNote(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium outline-none focus:border-[#0758fc] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Dispatch Email Checkbox */}
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Mail size={13} className="text-[#0758fc]" />
                    Send Ticket Confirmation Email with QR Pass
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Sends official digital ticket, scannable QR token, and calendar invite to attendee's email.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="w-4 h-4 text-[#0758fc] rounded border-gray-300 focus:ring-[#0758fc] cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-2xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
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
