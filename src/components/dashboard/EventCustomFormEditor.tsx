"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  FileText,
  CreditCard,
  Phone,
  Droplet,
  Shirt,
  GraduationCap,
  Utensils,
  Eye,
  Settings2,
  Check,
  AlertCircle,
  HelpCircle,
  UploadCloud,
  ListFilter,
  Layers,
} from "lucide-react";
import type { CustomQuestionType, EventCustomQuestion } from "@/types/saas";

export interface FormQuestionDraft {
  id?: string;
  questionText: string;
  questionType: CustomQuestionType;
  options?: string[];
  isRequired: boolean;
  ticketTierIds?: string[];
  displayOrder?: number;
  placeholder?: string;
  helpText?: string;
}

interface EventCustomFormEditorProps {
  questions: FormQuestionDraft[];
  onChange: (updated: FormQuestionDraft[]) => void;
  availableTiers?: Array<{ id?: string; name: string }>;
  isSaving?: boolean;
}

const PRESETS = [
  {
    label: "Aadhaar Number",
    icon: ShieldCheck,
    color: "from-blue-600 to-indigo-600",
    badge: "Identity",
    draft: {
      questionText: "Aadhaar Card Number",
      questionType: "aadhaar" as CustomQuestionType,
      isRequired: true,
      placeholder: "XXXX XXXX XXXX",
      helpText: "12-digit UIDAI number. Collected strictly for venue entrance accreditation.",
      options: [],
    },
  },
  {
    label: "PAN Card Number",
    icon: CreditCard,
    color: "from-indigo-600 to-purple-600",
    badge: "Govt ID",
    draft: {
      questionText: "PAN Card Number",
      questionType: "pan" as CustomQuestionType,
      isRequired: true,
      placeholder: "ABCDE1234F",
      helpText: "10-character alphanumeric PAN for identity and tax verification.",
      options: [],
    },
  },
  {
    label: "Address Proof / Govt ID",
    icon: UploadCloud,
    color: "from-emerald-600 to-teal-600",
    badge: "Document",
    draft: {
      questionText: "Govt ID / Address Proof Document",
      questionType: "file_upload" as CustomQuestionType,
      isRequired: true,
      placeholder: "Upload clear photo / document",
      helpText: "Upload photo of Aadhaar, Passport, Driving License, or Voter ID.",
      options: [],
    },
  },
  {
    label: "Emergency Phone",
    icon: Phone,
    color: "from-rose-600 to-pink-600",
    badge: "Safety",
    draft: {
      questionText: "Emergency Contact Phone Number",
      questionType: "phone" as CustomQuestionType,
      isRequired: true,
      placeholder: "10-digit mobile number",
      helpText: "Immediate emergency contact reachable during event hours.",
      options: [],
    },
  },
  {
    label: "Blood Group",
    icon: Droplet,
    color: "from-red-600 to-rose-600",
    badge: "Medical",
    draft: {
      questionText: "Blood Group",
      questionType: "dropdown" as CustomQuestionType,
      isRequired: false,
      placeholder: "Select your blood group",
      helpText: "Kept on medical stand-by file for attendee safety.",
      options: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    },
  },
  {
    label: "T-Shirt / Kit Size",
    icon: Shirt,
    color: "from-amber-600 to-orange-600",
    badge: "Merch",
    draft: {
      questionText: "Delegate T-Shirt Size",
      questionType: "dropdown" as CustomQuestionType,
      isRequired: false,
      placeholder: "Select your size",
      helpText: "For your convention delegate welcome kit.",
      options: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
    },
  },
  {
    label: "College / Company",
    icon: GraduationCap,
    color: "from-cyan-600 to-blue-600",
    badge: "Profile",
    draft: {
      questionText: "Institution / Company Name",
      questionType: "short_text" as CustomQuestionType,
      isRequired: false,
      placeholder: "e.g., BMS College of Engineering / Infosys",
      helpText: "Printed on your convention accreditation badge.",
      options: [],
    },
  },
  {
    label: "Meal Preference",
    icon: Utensils,
    color: "from-emerald-600 to-green-600",
    badge: "Hospitality",
    draft: {
      questionText: "Dietary & Meal Preference",
      questionType: "dropdown" as CustomQuestionType,
      isRequired: false,
      placeholder: "Select meal option",
      helpText: "Helps catering committee prepare appropriate convention meals.",
      options: ["Vegetarian", "Non-Vegetarian", "Jain Vegetarian", "Vegan"],
    },
  },
];

const QUESTION_TYPES: Array<{
  value: CustomQuestionType;
  label: string;
  description: string;
}> = [
  { value: "short_text", label: "Short Text", description: "Single line input for names, IDs, handles" },
  { value: "long_text", label: "Paragraph / Long Text", description: "Multi-line text for detailed notes or medical info" },
  { value: "number", label: "Number", description: "Numeric values only (e.g. age, experience)" },
  { value: "phone", label: "Phone Number", description: "10-digit telephone with validation" },
  { value: "aadhaar", label: "Aadhaar Card", description: "12-digit Indian Aadhaar with formatted spaces" },
  { value: "pan", label: "PAN Card", description: "10-char uppercase PAN with regex check" },
  { value: "dropdown", label: "Dropdown Select", description: "Choose one option from a selectable list" },
  { value: "radio", label: "Radio Buttons", description: "Single-choice pill buttons" },
  { value: "checkbox", label: "Multi-Select Checkboxes", description: "Select multiple applicable choices" },
  { value: "file_upload", label: "File / Document Upload", description: "Photo of ID proof, student badge, or PDF" },
  { value: "date", label: "Date Picker", description: "Calendar date selection" },
];

export function EventCustomFormEditor({
  questions,
  onChange,
  availableTiers = [],
}: EventCustomFormEditorProps) {
  const [activeTab, setActiveTab] = useState<"builder" | "preview">("builder");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newOptionInput, setNewOptionInput] = useState<{ [qIdx: number]: string }>({});

  // Add from Preset
  function handleAddPreset(presetDraft: typeof PRESETS[0]["draft"]) {
    const newQ: FormQuestionDraft = {
      ...presetDraft,
      displayOrder: questions.length + 1,
      ticketTierIds: [],
    };
    onChange([...questions, newQ]);
    setEditingIndex(questions.length);
  }

  // Add Blank Custom Field
  function handleAddCustomField() {
    const newQ: FormQuestionDraft = {
      questionText: "",
      questionType: "short_text",
      isRequired: false,
      placeholder: "",
      helpText: "",
      options: [],
      ticketTierIds: [],
      displayOrder: questions.length + 1,
    };
    onChange([...questions, newQ]);
    setEditingIndex(questions.length);
  }

  // Update specific question field
  function updateQuestion(idx: number, updates: Partial<FormQuestionDraft>) {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], ...updates };
    onChange(updated);
  }

  // Delete question
  function deleteQuestion(idx: number) {
    const updated = questions.filter((_, i) => i !== idx);
    onChange(updated);
    if (editingIndex === idx) setEditingIndex(null);
    else if (editingIndex !== null && editingIndex > idx) setEditingIndex(editingIndex - 1);
  }

  // Reorder questions
  function moveQuestion(idx: number, direction: "UP" | "DOWN") {
    if (direction === "UP" && idx === 0) return;
    if (direction === "DOWN" && idx === questions.length - 1) return;
    const targetIdx = direction === "UP" ? idx - 1 : idx + 1;
    const updated = [...questions];
    const [moved] = updated.splice(idx, 1);
    updated.splice(targetIdx, 0, moved);
    // re-index display orders
    updated.forEach((q, i) => { q.displayOrder = i + 1; });
    onChange(updated);
    setEditingIndex(targetIdx);
  }

  // Add option to dropdown/radio/checkbox
  function addOption(idx: number) {
    const text = (newOptionInput[idx] || "").trim();
    if (!text) return;
    const current = questions[idx].options || [];
    if (!current.includes(text)) {
      updateQuestion(idx, { options: [...current, text] });
    }
    setNewOptionInput({ ...newOptionInput, [idx]: "" });
  }

  // Remove option
  function removeOption(idx: number, optIdx: number) {
    const current = questions[idx].options || [];
    updateQuestion(idx, { options: current.filter((_, i) => i !== optIdx) });
  }

  // Toggle tier selection
  function toggleTierScope(idx: number, tierId: string) {
    const current = questions[idx].ticketTierIds || [];
    if (current.includes(tierId)) {
      updateQuestion(idx, { ticketTierIds: current.filter((id) => id !== tierId) });
    } else {
      updateQuestion(idx, { ticketTierIds: [...current, tierId] });
    }
  }

  return (
    <div className="space-y-6">
      {/* ── TOP CONTROL BAR: Header & View Toggle ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
        <div>
          <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings2 size={16} className="text-[#0758fc]" />
            Attendee Registration Form Builder
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Configure custom fields and identity verification forms that delegates fill during ticket booking.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex p-0.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("builder")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "builder"
                  ? "bg-white dark:bg-gray-900 text-[#0758fc] shadow-xs"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
              }`}
            >
              <Settings2 size={13} />
              <span>Builder ({questions.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "preview"
                  ? "bg-white dark:bg-gray-900 text-[#0758fc] shadow-xs"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
              }`}
            >
              <Eye size={13} />
              <span>Live Preview</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddCustomField}
            className="px-3.5 py-1.5 bg-[#0758fc] hover:bg-[#0546c7] text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Plus size={14} />
            <span>Add Custom Field</span>
          </button>
        </div>
      </div>

      {/* ── 1-CLICK QUICK PRESETS STRIP ─────────────────────────────────── */}
      {activeTab === "builder" && (
        <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/70 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/40 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-500" />
              1-Click Quick Presets (Popular Indian Event Fields)
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">
              Click any pill to instantly add with pre-configured validation
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset, idx) => {
              const Icon = preset.icon;
              const isAlreadyAdded = questions.some(
                (q) => q.questionType === preset.draft.questionType || q.questionText.toLowerCase().includes(preset.label.toLowerCase())
              );

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddPreset(preset.draft)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-2xs cursor-pointer active:scale-95 ${
                    isAlreadyAdded
                      ? "bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#0758fc]"
                      : "bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-blue-200 dark:border-blue-800 hover:border-[#0758fc] hover:bg-blue-50/50"
                  }`}
                >
                  <Icon size={13} className="text-[#0758fc] shrink-0" />
                  <span>{preset.label}</span>
                  {isAlreadyAdded && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Already added" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT: BUILDER VIEW ──────────────────────────────────── */}
      {activeTab === "builder" && (
        <div className="space-y-3.5">
          {questions.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0758fc] flex items-center justify-center mx-auto shadow-xs">
                <FileText size={22} />
              </div>
              <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">
                No Custom Questions Added Yet
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                By default, tickets only collect Attendee Name, Email, Phone, and Rotary/Rotaract Club. Click a preset above (e.g. <strong>Aadhaar</strong>, <strong>PAN</strong>, <strong>Govt ID Proof</strong>) or click <strong>Add Custom Field</strong>.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAddCustomField}
                  className="px-4 py-2 bg-[#0758fc] hover:bg-[#0546c7] text-white rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <Plus size={14} />
                  <span>Create First Custom Question</span>
                </button>
              </div>
            </div>
          ) : (
            questions.map((q, idx) => {
              const isExpanded = editingIndex === idx;
              const hasOptions = ["dropdown", "radio", "checkbox"].includes(q.questionType);

              return (
                <div
                  key={idx}
                  className={`bg-white dark:bg-gray-900 rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
                    isExpanded
                      ? "border-[#0758fc] ring-2 ring-blue-500/10 shadow-md"
                      : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                  }`}
                >
                  {/* Card Header Summary */}
                  <div className="p-3.5 flex items-center justify-between gap-3 bg-gray-50/60 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800">
                    <div
                      className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                      onClick={() => setEditingIndex(isExpanded ? null : idx)}
                    >
                      <span className="w-6 h-6 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-black flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-gray-900 dark:text-white truncate">
                            {q.questionText || "Untitled Question"}
                          </span>
                          {q.isRequired ? (
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 shrink-0">
                              Required *
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-gray-200/70 dark:bg-gray-800 text-gray-500 shrink-0">
                              Optional
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400 font-medium capitalize">
                          Type: {QUESTION_TYPES.find((t) => t.value === q.questionType)?.label || q.questionType}
                          {q.ticketTierIds && q.ticketTierIds.length > 0 && ` · ${q.ticketTierIds.length} tier(s) only`}
                        </span>
                      </div>
                    </div>

                    {/* Actions: Move Up / Down, Delete, Expand */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveQuestion(idx, "UP")}
                        disabled={idx === 0}
                        className="w-7 h-7 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveQuestion(idx, "DOWN")}
                        disabled={idx === questions.length - 1}
                        className="w-7 h-7 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteQuestion(idx)}
                        className="w-7 h-7 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 flex items-center justify-center cursor-pointer transition-colors"
                        title="Delete Question"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingIndex(isExpanded ? null : idx)}
                        className="ml-1 text-xs font-bold text-[#0758fc] hover:underline px-2 py-1 rounded-lg"
                      >
                        {isExpanded ? "Done" : "Edit"}
                      </button>
                    </div>
                  </div>

                  {/* Card Expanded Settings Drawer */}
                  {isExpanded && (
                    <div className="p-4 space-y-4 animate-in fade-in duration-150">
                      {/* Row 1: Question Label & Input Type */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                            Question Title / Prompt <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Aadhaar Number, PAN Number, Emergency Phone..."
                            value={q.questionText}
                            onChange={(e) => updateQuestion(idx, { questionText: e.target.value })}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-[#0758fc]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                            Field Type
                          </label>
                          <select
                            value={q.questionType}
                            onChange={(e) => updateQuestion(idx, { questionType: e.target.value as CustomQuestionType })}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-[#0758fc] cursor-pointer"
                          >
                            {QUESTION_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label} ({t.description})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Row 2: Placeholder & Help Subtitle */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                            Placeholder Hint Text <span className="text-gray-400 font-normal">(Optional)</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., XXXX XXXX XXXX or 10-digit number"
                            value={q.placeholder || ""}
                            onChange={(e) => updateQuestion(idx, { placeholder: e.target.value })}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-[#0758fc]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                            Helper / Subtitle Note <span className="text-gray-400 font-normal">(Optional)</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Collected solely for venue security clearance"
                            value={q.helpText || ""}
                            onChange={(e) => updateQuestion(idx, { helpText: e.target.value })}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:border-[#0758fc]"
                          />
                        </div>
                      </div>

                      {/* Row 3: Required Switch & Ticket Tier Scope */}
                      <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/70 dark:border-gray-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={q.isRequired}
                            onChange={(e) => updateQuestion(idx, { isRequired: e.target.checked })}
                            className="w-4 h-4 rounded text-[#0758fc] focus:ring-[#0758fc] cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-extrabold text-gray-900 dark:text-white block">
                              Mark as Mandatory / Required
                            </span>
                            <span className="text-[11px] text-gray-500">
                              Attendees cannot proceed to payment without answering this field.
                            </span>
                          </div>
                        </label>
                      </div>

                      {/* Tier Restriction Filter (If multiple tiers exist) */}
                      {availableTiers.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                            <Layers size={13} className="text-indigo-500" />
                            Target Ticket Tiers:
                          </span>
                          <p className="text-[11px] text-gray-400">
                            Leave unselected to apply to all tiers, or check specific tiers (e.g. require Student ID only on Student pass).
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {availableTiers.map((tier) => {
                              const isChecked = (q.ticketTierIds || []).includes(tier.id || tier.name);
                              return (
                                <button
                                  key={tier.id || tier.name}
                                  type="button"
                                  onClick={() => toggleTierScope(idx, tier.id || tier.name)}
                                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                    isChecked
                                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700"
                                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300"
                                  }`}
                                >
                                  {isChecked && "✓ "}
                                  {tier.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Options Manager (for Dropdown / Radio / Checkbox) */}
                      {hasOptions && (
                        <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                          <label className="block text-xs font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                            <ListFilter size={13} className="text-amber-500" />
                            Choice Options List:
                          </label>

                          <div className="flex flex-wrap gap-2">
                            {(q.options || []).map((opt, optIdx) => (
                              <div
                                key={optIdx}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-bold text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
                              >
                                <span>{opt}</span>
                                <button
                                  type="button"
                                  onClick={() => removeOption(idx, optIdx)}
                                  className="text-gray-400 hover:text-rose-500 cursor-pointer"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2 pt-1 max-w-sm">
                            <input
                              type="text"
                              placeholder="Type option (e.g. Vegetarian, S, Option 1)..."
                              value={newOptionInput[idx] || ""}
                              onChange={(e) => setNewOptionInput({ ...newOptionInput, [idx]: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addOption(idx);
                                }
                              }}
                              className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-white outline-none focus:border-[#0758fc]"
                            />
                            <button
                              type="button"
                              onClick={() => addOption(idx)}
                              className="px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white rounded-xl text-xs font-bold hover:bg-black cursor-pointer"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── LIVE ATTENDEE PREVIEW VIEW ──────────────────────────────────── */}
      {activeTab === "preview" && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <div>
              <span className="text-xs font-black uppercase text-gray-400 tracking-wider block">
                Live Simulation
              </span>
              <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">
                How Attendees See This Form In Checkout:
              </h4>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl">
              ✓ Interactive Preview
            </span>
          </div>

          {questions.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              No custom questions to preview. Add questions in the Builder tab.
            </div>
          ) : (
            <div className="p-4 bg-gray-50/70 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3.5 max-w-lg mx-auto">
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 block">
                Attendee #1 · Delegate Details
              </span>

              {questions.map((q, idx) => (
                <div key={idx} className="space-y-1 text-left">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-200">
                    {q.questionText || "Untitled Question"}{" "}
                    {q.isRequired && <span className="text-rose-500">*</span>}
                  </label>

                  {q.helpText && (
                    <p className="text-[11px] text-gray-400 leading-tight">
                      {q.helpText}
                    </p>
                  )}

                  {q.questionType === "dropdown" ? (
                    <select
                      disabled
                      className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white opacity-80"
                    >
                      <option value="">{q.placeholder || "Select an option..."}</option>
                      {(q.options || []).map((opt, optIdx) => (
                        <option key={optIdx} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : q.questionType === "long_text" ? (
                    <textarea
                      disabled
                      placeholder={q.placeholder || "Enter details..."}
                      rows={2}
                      className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white opacity-80 resize-none"
                    />
                  ) : q.questionType === "file_upload" ? (
                    <div className="p-3 bg-white dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-center space-y-1 cursor-not-allowed opacity-80">
                      <UploadCloud size={20} className="mx-auto text-gray-400" />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                        {q.placeholder || "Click or Drag Photo of ID Proof"}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        Supports Camera / Photos / PDF (auto-compressed)
                      </span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      disabled
                      placeholder={q.placeholder || (q.questionType === "aadhaar" ? "XXXX XXXX XXXX" : q.questionType === "pan" ? "ABCDE1234F" : q.questionText)}
                      className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white opacity-80"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
