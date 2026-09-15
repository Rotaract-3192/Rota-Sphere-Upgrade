"use client";

/**
 * BulkSlabManagerPanel
 * Admin UI for creating, toggling, and deleting Bulk Ticket Slabs for an event.
 * Displayed inside the Super Admin event management section.
 */

import { useState, useEffect } from "react";
import { Users, Plus, Trash2, ToggleLeft, ToggleRight, Loader2, ChevronDown, ChevronUp, Package, AlertTriangle, CheckCircle2, X } from "lucide-react";
import {
  createBulkSlabTierAction,
  toggleBulkSlabActiveAction,
  deleteBulkSlabTierAction,
  getBulkSlabsForEventAction,
  type CreateBulkSlabInput,
} from "@/app/actions/adminActions";

interface BulkSlab {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  bulk_slab_size: number;
  total_capacity: number;
  sold_count: number;
  is_active: boolean;
  sales_start: string;
  sales_end: string;
}

interface BulkSlabManagerPanelProps {
  eventId: string;
  eventTitle: string;
  existingSlabs?: BulkSlab[];
  onRefresh?: () => void;
}

function formatINR(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  } catch { return iso; }
}

export function BulkSlabManagerPanel({ eventId, eventTitle, existingSlabs = [], onRefresh }: BulkSlabManagerPanelProps) {
  const [slabs, setSlabs] = useState<BulkSlab[]>(existingSlabs);

  useEffect(() => {
    let mounted = true;
    getBulkSlabsForEventAction(eventId).then((res) => {
      if (mounted && res.success && res.slabs) {
        setSlabs(res.slabs as BulkSlab[]);
      }
    });
    return () => {
      mounted = false;
    };
  }, [eventId]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSlabSize, setFormSlabSize] = useState("");
  const [formPricePerPerson, setFormPricePerPerson] = useState("");
  const [formTotalGroupSlots, setFormTotalGroupSlots] = useState("");
  const [formSalesStart, setFormSalesStart] = useState("");
  const [formSalesEnd, setFormSalesEnd] = useState("");

  function resetForm() {
    setFormName("");
    setFormDescription("");
    setFormSlabSize("");
    setFormPricePerPerson("");
    setFormTotalGroupSlots("");
    setFormSalesStart("");
    setFormSalesEnd("");
    setShowCreateForm(false);
  }

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const slabSize = parseInt(formSlabSize);
    const pricePerPerson = parseFloat(formPricePerPerson);
    const totalGroupSlots = parseInt(formTotalGroupSlots) * slabSize; // admin enters # of groups, we store total tickets

    if (!formName.trim() || isNaN(slabSize) || isNaN(pricePerPerson) || isNaN(totalGroupSlots)) {
      showMessage("error", "Please fill in all required fields.");
      return;
    }

    if (!formSalesStart || !formSalesEnd) {
      showMessage("error", "Sales start and end dates are required.");
      return;
    }

    setLoading(true);
    const input: CreateBulkSlabInput = {
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      bulkSlabSize: slabSize,
      pricePerPerson,
      totalGroupSlots,
      salesStart: new Date(formSalesStart).toISOString(),
      salesEnd: new Date(formSalesEnd).toISOString(),
    };

    const res = await createBulkSlabTierAction(eventId, input);
    setLoading(false);

    if (res.success) {
      showMessage("success", `Bulk slab "${formName}" created successfully!`);
      resetForm();
      // Optimistically add to local state
      setSlabs((prev) => [
        ...prev,
        {
          id: res.tierId || "new",
          name: input.name,
          description: input.description || null,
          price: input.pricePerPerson,
          bulk_slab_size: input.bulkSlabSize,
          total_capacity: input.totalGroupSlots,
          sold_count: 0,
          is_active: true,
          sales_start: input.salesStart,
          sales_end: input.salesEnd,
        },
      ]);
      onRefresh?.();
    } else {
      showMessage("error", res.error || "Failed to create bulk slab.");
    }
  }

  async function handleToggle(slab: BulkSlab) {
    setLoading(true);
    const res = await toggleBulkSlabActiveAction(slab.id, !slab.is_active);
    setLoading(false);

    if (res.success) {
      setSlabs((prev) => prev.map((s) => s.id === slab.id ? { ...s, is_active: !s.is_active } : s));
      showMessage("success", `Slab "${slab.name}" ${slab.is_active ? "disabled" : "enabled"}.`);
    } else {
      showMessage("error", res.error || "Toggle failed.");
    }
  }

  async function handleDelete(slab: BulkSlab) {
    if (!confirm(`Delete "${slab.name}"? This cannot be undone.`)) return;
    setLoading(true);
    const res = await deleteBulkSlabTierAction(slab.id);
    setLoading(false);

    if (res.success) {
      setSlabs((prev) => prev.filter((s) => s.id !== slab.id));
      showMessage("success", `Bulk slab "${slab.name}" deleted.`);
    } else {
      showMessage("error", res.error || "Delete failed.");
    }
  }

  const groupsAvailable = (slab: BulkSlab) => {
    const remaining = slab.total_capacity - slab.sold_count;
    return Math.floor(remaining / slab.bulk_slab_size);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center">
            <Package size={16} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Bulk Ticket Slabs</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Fixed-size group passes for {eventTitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
        >
          {showCreateForm ? <X size={14} /> : <Plus size={14} />}
          {showCreateForm ? "Cancel" : "New Slab"}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 text-xs font-bold px-4 py-3 rounded-2xl border ${
          message.type === "success"
            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
            : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
        }`}>
          {message.type === "success" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          {message.text}
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreate}
          className="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl p-5 space-y-4"
        >
          <h4 className="text-xs font-extrabold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">Create New Bulk Slab</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Slab Name */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">Slab Name *</label>
              <input
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Club Delegation Pass (Group of 15)"
                className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-500 focus:border-indigo-400"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">Description (optional)</label>
              <textarea
                rows={2}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="What's included in this group pass?"
                className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Group Size */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                Group Size (exact) *
              </label>
              <div className="relative">
                <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  required
                  type="number"
                  min={2}
                  max={200}
                  value={formSlabSize}
                  onChange={(e) => setFormSlabSize(e.target.value)}
                  placeholder="e.g. 15"
                  className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-xl pl-8 pr-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-500"
                />
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Buyer must register exactly this many people</p>
            </div>

            {/* Price per person */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                Price Per Person (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
                <input
                  required
                  type="number"
                  min={0}
                  step={1}
                  value={formPricePerPerson}
                  onChange={(e) => setFormPricePerPerson(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-xl pl-7 pr-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-500"
                />
              </div>
              {formSlabSize && formPricePerPerson && (
                <p className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold mt-1">
                  Total per group: ₹{(parseInt(formSlabSize || "0") * parseFloat(formPricePerPerson || "0")).toLocaleString("en-IN")}
                </p>
              )}
            </div>

            {/* Number of Groups available */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                Number of Groups to Release *
              </label>
              <input
                required
                type="number"
                min={1}
                value={formTotalGroupSlots}
                onChange={(e) => setFormTotalGroupSlots(e.target.value)}
                placeholder="e.g. 10"
                className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-500"
              />
              {formSlabSize && formTotalGroupSlots && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                  Total tickets: {parseInt(formSlabSize || "0") * parseInt(formTotalGroupSlots || "0")}
                </p>
              )}
            </div>

            {/* Sales Start */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">Sales Start *</label>
              <input
                required
                type="datetime-local"
                value={formSalesStart}
                onChange={(e) => setFormSalesStart(e.target.value)}
                className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-500"
              />
            </div>

            {/* Sales End */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">Sales End *</label>
              <input
                required
                type="datetime-local"
                value={formSalesEnd}
                onChange={(e) => setFormSalesEnd(e.target.value)}
                className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Create Bulk Slab
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 hover:border-gray-300 px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Existing Slabs List */}
      {slabs.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-indigo-200 dark:border-indigo-800/60 rounded-2xl bg-indigo-50/30 dark:bg-indigo-950/20">
          <Package size={28} className="text-indigo-300 dark:text-indigo-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400">No bulk slabs yet</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Create your first group ticket slab above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {slabs.map((slab) => {
            const groupsLeft = groupsAvailable(slab);
            const totalGroups = Math.floor(slab.total_capacity / slab.bulk_slab_size);
            const soldGroups = Math.floor(slab.sold_count / slab.bulk_slab_size);
            const pctSold = totalGroups > 0 ? Math.min(100, Math.round((soldGroups / totalGroups) * 100)) : 0;
            const totalPerGroup = slab.price * slab.bulk_slab_size;

            return (
              <div
                key={slab.id}
                className={`border rounded-2xl p-4 space-y-3 transition-all ${
                  slab.is_active
                    ? "bg-white dark:bg-gray-800/70 border-gray-200 dark:border-gray-700"
                    : "bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700/60 opacity-70"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-extrabold text-gray-900 dark:text-white truncate">{slab.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        slab.is_active
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600"
                      }`}>
                        {slab.is_active ? "● Active" : "○ Disabled"}
                      </span>
                      <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-full">
                        👥 Group of {slab.bulk_slab_size}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400 flex-wrap">
                      <span className="font-bold text-gray-900 dark:text-white">{formatINR(slab.price)}<span className="font-normal text-gray-400">/person</span></span>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span className="font-semibold text-indigo-700 dark:text-indigo-300">{formatINR(totalPerGroup)} total</span>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span>{soldGroups}/{totalGroups} groups sold</span>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span className={groupsLeft === 0 ? "text-rose-600 dark:text-rose-400 font-bold" : "text-emerald-700 dark:text-emerald-300 font-semibold"}>
                        {groupsLeft === 0 ? "Sold Out" : `${groupsLeft} groups left`}
                      </span>
                    </div>
                    {slab.description && (
                      <p className="text-[11px] text-gray-400 italic">{slab.description}</p>
                    )}
                    <div className="text-[10px] text-gray-400">
                      {formatDate(slab.sales_start)} → {formatDate(slab.sales_end)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Toggle Active */}
                    <button
                      type="button"
                      onClick={() => handleToggle(slab)}
                      disabled={loading}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer disabled:opacity-50 ${
                        slab.is_active
                          ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700"
                          : "bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-500"
                      }`}
                      title={slab.is_active ? "Disable Slab" : "Enable Slab"}
                    >
                      {slab.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(slab)}
                      disabled={loading || slab.sold_count > 0}
                      className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title={slab.sold_count > 0 ? "Cannot delete: tickets already sold" : "Delete Slab"}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>{pctSold}% sold</span>
                    <span>{slab.sold_count}/{slab.total_capacity} tickets</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pctSold >= 100 ? "bg-rose-500" : pctSold >= 75 ? "bg-amber-500" : "bg-indigo-500"
                      }`}
                      style={{ width: `${pctSold}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
