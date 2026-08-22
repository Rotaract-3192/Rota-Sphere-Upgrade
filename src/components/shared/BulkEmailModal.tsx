"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mail,
  Send,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Paperclip,
  QrCode,
  Users,
  CheckSquare,
  FileText,
  TestTube,
  Eye,
  Edit3,
} from "lucide-react";
import {
  getBroadcastRecipientsAction,
  sendBatchEmailChunkAction,
  sendTestEmailAction,
  RecipientAttendee,
} from "@/app/actions/emailActions";

interface BulkEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  events?: Array<{ id: string; title: string }>;
  defaultEventId?: string;
  isSuperAdmin?: boolean;
}

export function BulkEmailModal({
  isOpen,
  onClose,
  events = [],
  defaultEventId = "",
  isSuperAdmin = false,
}: BulkEmailModalProps) {
  const [selectedEventId, setSelectedEventId] = useState(defaultEventId || (events[0]?.id || ""));
  const [targetScope, setTargetScope] = useState<"ALL_APPROVED" | "SELECTED_ROWS" | "CUSTOM_EMAILS" | "TEST_MODE">(
    "ALL_APPROVED"
  );
  const [customEmails, setCustomEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [bannerTitle, setBannerTitle] = useState("");
  const [message, setMessage] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [includeQrCode, setIncludeQrCode] = useState(true);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [activeViewTab, setActiveViewTab] = useState<"COMPOSE" | "PREVIEW">("COMPOSE");

  // State for recipient fetching & batch sending
  const [fetchingRecipients, setFetchingRecipients] = useState(false);
  const [recipients, setRecipients] = useState<RecipientAttendee[]>([]);
  const [testSending, setTestSending] = useState(false);
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);

  // Batch progress modal state
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [batchStatusText, setBatchStatusText] = useState("");
  const [broadcastComplete, setBroadcastComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync default event selection
  useEffect(() => {
    if (defaultEventId) setSelectedEventId(defaultEventId);
    else if (events.length > 0 && !selectedEventId) setSelectedEventId(events[0].id);
  }, [defaultEventId, events]);

  // Fetch recipient list when inputs change
  useEffect(() => {
    if (!isOpen) return;

    async function loadRecipients() {
      setFetchingRecipients(true);
      const res = await getBroadcastRecipientsAction({
        eventId: selectedEventId,
        scope: targetScope,
        customEmailString: customEmails,
      });
      setFetchingRecipients(false);
      if (res.success) {
        setRecipients(res.recipients);
      }
    }

    loadRecipients();
  }, [isOpen, selectedEventId, targetScope, customEmails]);

  if (!isOpen) return null;

  // Insert placeholder into message text area
  function insertPlaceholder(tag: string) {
    setMessage((prev) => prev + ` ${tag}`);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  // Send single test email
  async function handleSendTestEmail() {
    setTestSending(true);
    setTestSuccessMessage(null);
    setErrorMessage(null);

    const activeEvent = events.find((e) => e.id === selectedEventId);

    const res = await sendTestEmailAction({
      subject,
      bannerTitle,
      messageContent: message,
      buttonText,
      buttonUrl,
      includeQrCode,
      eventName: activeEvent?.title || "RotaSphere Event",
    });

    setTestSending(false);

    if (res.success) {
      setTestSuccessMessage(`Test preview email sent to ${res.testEmail}! Check your inbox.`);
      setTimeout(() => setTestSuccessMessage(null), 5000);
    } else {
      setErrorMessage(res.error || "Failed to send test preview email.");
    }
  }

  // Start chunked batch dispatching
  async function handleStartBroadcast() {
    if (!subject.trim() || !message.trim()) {
      setErrorMessage("Subject line and message content are required.");
      return;
    }

    if (recipients.length === 0) {
      setErrorMessage("No target recipients found for the selected group.");
      return;
    }

    setIsBroadcasting(true);
    setBroadcastComplete(false);
    setErrorMessage(null);
    setSentCount(0);
    setFailedCount(0);

    const BATCH_SIZE = 5;
    const totalCount = recipients.length;
    const totalB = Math.ceil(totalCount / BATCH_SIZE);
    setTotalBatches(totalB);

    let totalSent = 0;
    let totalFailed = 0;
    const activeEvent = events.find((e) => e.id === selectedEventId);

    for (let i = 0; i < totalB; i++) {
      const start = i * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, totalCount);
      const chunk = recipients.slice(start, end);

      setCurrentBatchIndex(i + 1);
      setBatchStatusText(`Dispatching Batch ${i + 1} of ${totalB} (${start + 1} - ${end} of ${totalCount})...`);

      const res = await sendBatchEmailChunkAction({
        recipientsBatch: chunk,
        subject,
        bannerTitle,
        messageContent: message,
        buttonText,
        buttonUrl,
        includeQrCode,
        eventId: selectedEventId,
        eventName: activeEvent?.title || "RotaSphere",
      });

      if (res.success) {
        totalSent += res.sentCount;
        totalFailed += res.failedCount;
      } else {
        totalFailed += chunk.length;
      }

      setSentCount(totalSent);
      setFailedCount(totalFailed);

      if (i < totalB - 1) {
        await new Promise((r) => setTimeout(r, 1200));
      }
    }

    setBroadcastComplete(true);
  }

  const selectedEventTitle = events.find((e) => e.id === selectedEventId)?.title || "RotaSphere Event";
  const progressPercent = totalBatches > 0 ? Math.round((currentBatchIndex / totalBatches) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-5xl bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col text-gray-900 relative max-h-[92vh]">
        
        {/* ── MODAL TOP HEADER BAR ────────────────────────────────────────── */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0758fc] flex items-center justify-center">
              <Mail size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#0758fc] px-2.5 py-0.5 rounded-full border border-blue-200">
                  RO TASPHERE BROADCAST STUDIO
                </span>
                <span className="text-xs font-bold text-gray-500">
                  {fetchingRecipients ? "Loading recipients..." : `${recipients.length} Target Recipients`}
                </span>
              </div>
              <h2 className="text-lg font-black text-gray-900 tracking-tight mt-0.5">
                Bulk Email &amp; Rules Broadcast
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Tab Switcher */}
            <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveViewTab("COMPOSE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeViewTab === "COMPOSE" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Edit3 size={13} /> Compose
              </button>
              <button
                type="button"
                onClick={() => setActiveViewTab("PREVIEW")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeViewTab === "PREVIEW" ? "bg-white text-[#0758fc] shadow-2xs" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Eye size={13} /> Live Preview
              </button>
            </div>

            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={testSending || isBroadcasting}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {testSending ? <Loader2 size={14} className="animate-spin text-[#0758fc]" /> : <TestTube size={14} className="text-[#0758fc]" />}
              <span>Test Email</span>
            </button>

            <button
              type="button"
              onClick={handleStartBroadcast}
              disabled={isBroadcasting || recipients.length === 0}
              className="bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold text-xs px-5 py-2 rounded-xl transition-all flex items-center gap-2 shadow-md shadow-[#0758fc]/20 cursor-pointer disabled:opacity-50"
            >
              <Send size={14} />
              <span>Send Broadcast</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── MODAL WORKSPACE BODY ───────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          
          {testSuccessMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2.5">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span>{testSuccessMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeViewTab === "COMPOSE" ? (
            <div className="space-y-6">
              
              {/* Event & Target Group Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.length > 0 && (
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">
                      Target Event
                    </label>
                    <select
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-[#0758fc]"
                    >
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">
                    Target Audience Group
                  </label>
                  <select
                    value={targetScope}
                    onChange={(e) => setTargetScope(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-[#0758fc]"
                  >
                    <option value="ALL_APPROVED">All Confirmed Event Delegates ({recipients.length})</option>
                    <option value="CUSTOM_EMAILS">Custom Email List</option>
                    <option value="TEST_MODE">Single Test Mode Email</option>
                  </select>
                </div>
              </div>

              {targetScope === "CUSTOM_EMAILS" && (
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">
                    Custom Email Addresses (Comma Separated)
                  </label>
                  <textarea
                    rows={2}
                    value={customEmails}
                    onChange={(e) => setCustomEmails(e.target.value)}
                    placeholder="email1@domain.com, email2@domain.com..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-mono text-gray-900 outline-none focus:border-[#0758fc]"
                  />
                </div>
              )}

              {/* Subject Line & Banner Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">
                    Email Subject Line *
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Important Event Rules & Entry Guidelines"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-[#0758fc]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">
                    Banner Header Title
                  </label>
                  <input
                    type="text"
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    placeholder="e.g. Official Delegate Guidelines"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-[#0758fc]"
                  />
                </div>
              </div>

              {/* Message Content & Personalization Tags */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                    Message Content &amp; Rules *
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-gray-400 font-medium">Insert tags:</span>
                    {["{{name}}", "{{ticket_code}}", "{{category}}"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => insertPlaceholder(tag)}
                        className="bg-gray-100 hover:bg-gray-200 text-[#0758fc] text-[11px] font-mono font-bold px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  required
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message guidelines, update details, or instructions here... (Use tags above for personalization)"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs font-medium text-gray-900 outline-none focus:border-[#0758fc] leading-relaxed resize-none"
                />
              </div>

              {/* Custom CTA Button Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">
                    Button Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="e.g. View Photos GDrive Link"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:border-[#0758fc]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">
                    Button Target URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={buttonUrl}
                    onChange={(e) => setButtonUrl(e.target.value)}
                    placeholder="https://rotasphere.in/gallery"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-mono text-gray-900 outline-none focus:border-[#0758fc]"
                  />
                </div>
              </div>

              {/* Toggle Switch: QR Code & Badge */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0758fc] flex items-center justify-center">
                    <QrCode size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Include Attendee QR Code &amp; Entry Badge</h4>
                    <p className="text-[11px] text-gray-500">
                      Embeds recipient's unique entry QR code image &amp; ticket code for venue check-in.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIncludeQrCode(!includeQrCode)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    includeQrCode ? "bg-[#0758fc]" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      includeQrCode ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Attachments Section */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip size={16} className="text-[#0758fc]" />
                    <span className="text-xs font-bold text-gray-900">Email Attachments ({attachments.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors shadow-2xs"
                  >
                    + Add Files
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {attachments.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic">No files attached. You can attach PDFs or documents.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((file, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-gray-200 text-gray-800 text-[11px] font-semibold px-3 py-1.5 rounded-xl flex items-center gap-2"
                      >
                        <FileText size={13} className="text-[#0758fc]" />
                        <span className="truncate max-w-[150px]">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="text-gray-400 hover:text-rose-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* LIVE PREVIEW TAB */
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="text-center pb-2">
                <span className="text-xs font-bold text-[#0758fc] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  Live Email Template Preview
                </span>
              </div>

              <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xl">
                <div className="bg-[#0758fc] p-6 text-center text-white">
                  <h3 className="text-xl font-extrabold uppercase tracking-wide">{selectedEventTitle}</h3>
                  <p className="text-xs text-white/80 font-semibold mt-1">Official Delegate Announcement</p>
                </div>

                {bannerTitle && (
                  <div className="bg-gray-50 border-b border-gray-200 p-4 text-center">
                    <h4 className="text-sm font-bold text-gray-900">{bannerTitle}</h4>
                  </div>
                )}

                <div className="p-6 space-y-4 text-gray-800">
                  <p className="text-xs font-bold text-gray-900">Hello Alex (Sample Recipient),</p>
                  <div className="text-xs leading-relaxed whitespace-pre-line text-gray-700">{message}</div>

                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Attendee:</span>
                      <span className="font-bold text-gray-900">Alex</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Category:</span>
                      <span className="font-bold text-gray-900">VIP Pass</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ticket Code:</span>
                      <span className="font-mono font-bold text-[#0758fc]">TKT-SAMPLE-8821</span>
                    </div>
                  </div>

                  {includeQrCode && (
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center space-y-2">
                      <div className="w-28 h-28 bg-white border border-gray-300 rounded-xl mx-auto flex items-center justify-center p-2">
                        <QrCode size={80} className="text-gray-800" />
                      </div>
                      <p className="text-[10px] font-bold text-gray-500">Entry QR Gate Code</p>
                    </div>
                  )}

                  {buttonText && (
                    <div className="text-center pt-2">
                      <span className="inline-block bg-[#0758fc] text-white font-extrabold text-xs px-6 py-3 rounded-xl uppercase tracking-wider shadow-md shadow-[#0758fc]/20">
                        {buttonText}
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 border-t border-gray-200 text-center text-[11px] text-gray-500">
                  © 2026 RotaSphere Platform · Official Event Broadcast
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ── CHUNKED BATCH DISPATCH PROGRESS MODAL ───────────────────────── */}
      {isBroadcasting && (
        <div className="fixed inset-0 z-[999999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-5 text-center relative">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-[#0758fc] flex items-center justify-center mx-auto shadow-md">
              <Send size={24} className={broadcastComplete ? "" : "animate-pulse"} />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-gray-900">
                {broadcastComplete ? "Broadcast Complete!" : "Broadcasting Emails..."}
              </h3>
              <p className="text-xs text-gray-600">
                {broadcastComplete
                  ? `Sent ${sentCount} emails (${failedCount} failed).`
                  : batchStatusText}
              </p>
            </div>

            {!broadcastComplete && (
              <div className="space-y-2">
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden p-0.5 border border-gray-200">
                  <div
                    className="bg-[#0758fc] h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-600 font-mono">
                  <span>Batch {currentBatchIndex} / {totalBatches}</span>
                  <span className="text-[#0758fc]">{progressPercent}%</span>
                  <span>{sentCount} of {recipients.length}</span>
                </div>
              </div>
            )}

            {!broadcastComplete ? (
              <p className="text-[11px] text-gray-500 bg-gray-50 border border-gray-200 p-3 rounded-xl">
                Sending 5 emails per batch with 1.2s pause to protect SMTP server connections.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsBroadcasting(false);
                  onClose();
                }}
                className="w-full bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold text-xs py-3 px-6 rounded-xl transition-all shadow-md cursor-pointer"
              >
                Done
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
