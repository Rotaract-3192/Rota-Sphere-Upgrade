/**
 * Native Excel (.xlsx) Export Engine
 * Generates genuine Microsoft Excel (.xlsx) workbooks with styled column widths,
 * auto-populated Club & Zone information, and an automated Zonal Count Breakdown Summary.
 */

import * as XLSX from "xlsx";
import { resolveClubAndZone } from "./zoneResolver";

export interface AttendeeExportItem {
  ticket_code?: string;
  ticket_id?: string;
  id?: string;
  event_title?: string;
  attendee_name?: string;
  attendee_email?: string;
  attendee_phone?: string;
  member_type?: string;
  club_name?: string;
  designation?: string;
  zone?: string;
  tier_name?: string;
  unit_price?: string | number;
  order_status?: string;
  ticket_status?: string;
  status?: string;
  payment_method?: string;
  upi_transaction_id?: string;
  checked_in_at?: string;
  created_at?: string;
  custom_answers?: Record<string, any>;
  customAnswers?: Record<string, any>;
  qr_token?: string;
  qr_code_hash?: string;
  saas_events?: { title?: string };
  saas_ticket_tiers?: { name?: string; price?: number };
}

/**
 * Export Event Delegates to a dual-sheet .xlsx Workbook
 * Sheet 1: "Delegates Roster" (Full delegate breakdown with Club & Zone)
 * Sheet 2: "Zonal Count Summary" (Aggregated count and check-in count per District Zone)
 */
export function exportEventAttendeesToExcel(
  eventTitle: string,
  attendees: AttendeeExportItem[],
  customFilename?: string
) {
  const sanitizedTitle = (eventTitle || "Event_Delegates").replace(/[^a-zA-Z0-9]/g, "_");
  const filename =
    customFilename ||
    `${sanitizedTitle}_Delegates_${new Date().toISOString().slice(0, 10)}.xlsx`;

  // 1. Build Header Row for Sheet 1
  const header = [
    "Ticket / Pass Code",
    "Attendee Name",
    "Designation / Role",
    "Rotary Affiliation",
    "Club / Organization",
    "District Zone",
    "Ticket Tier",
    "Amount Paid (INR)",
    "Payment Mode",
    "Payment Status",
    "UTR / Txn Reference",
    "Check-In Status",
    "Checked-In Timestamp",
    "Registration Date",
    "Event Title",
    "Custom Form Responses",
    "QR Entry Token",
  ];

  // Zonal Aggregator
  const zoneStats = new Map<string, { total: number; checkedIn: number; clubs: Set<string> }>();

  const rows: any[][] = [header];

  for (const t of attendees) {
    const { clubName, zone, memberType, designation } = resolveClubAndZone({
      member_type: t.member_type,
      club_name: t.club_name,
      designation: t.designation,
      zone: t.zone,
      custom_answers: t.custom_answers || t.customAnswers,
    });

    const isCheckedIn = t.ticket_status === "USED" || t.status === "USED" || !!t.checked_in_at;
    const tierName = t.tier_name || t.saas_ticket_tiers?.name || "General Admission";
    const price = t.unit_price || t.saas_ticket_tiers?.price || 0;
    const paymentMode = t.payment_method || (t.upi_transaction_id ? "UPI" : "ONLINE");
    const isRejected = t.status === "PAYMENT_REJECTED" || t.status === "REJECTED" || t.order_status === "PAYMENT_REJECTED";
    const isPending = t.status === "PENDING_VERIFICATION" || t.status === "PENDING" || t.order_status === "PENDING_VERIFICATION";
    const paymentStatus = isRejected ? "REJECTED" : isPending ? "PENDING_APPROVAL" : (t.order_status || t.status || "CONFIRMED");
    const checkInTime = t.checked_in_at ? new Date(t.checked_in_at).toLocaleString("en-IN") : "Not Scanned";
    const regDate = t.created_at ? new Date(t.created_at).toLocaleString("en-IN") : "";
    const customResp = JSON.stringify(t.custom_answers || t.customAnswers || {});

    // Update Zonal Aggregator
    const currentStats = zoneStats.get(zone) || { total: 0, checkedIn: 0, clubs: new Set<string>() };
    currentStats.total += 1;
    if (isCheckedIn) currentStats.checkedIn += 1;
    if (clubName && clubName !== "Individual Delegate") currentStats.clubs.add(clubName);
    zoneStats.set(zone, currentStats);

    rows.push([
      t.ticket_code || t.ticket_id || t.id || "",
      t.attendee_name || "Delegate",
      designation || "Member",
      memberType || "Rotaract",
      clubName,
      zone,
      tierName,
      Number(price) || 0,
      paymentMode,
      paymentStatus,
      t.upi_transaction_id || "N/A",
      isCheckedIn ? "CHECKED_IN" : "PENDING",
      checkInTime,
      regDate,
      t.event_title || t.saas_events?.title || eventTitle,
      customResp,
      t.qr_token || t.qr_code_hash || "",
    ]);
  }

  // 2. Build Sheet 2: Zonal Count Summary
  const zonalHeader = [
    "District Zone",
    "Total Registered Delegates",
    "Checked-In Delegates",
    "Pending Gate Check-In",
    "Attendance Rate (%)",
    "Participating Clubs",
  ];

  const zonalRows: any[][] = [zonalHeader];
  let grandTotal = 0;
  let grandCheckedIn = 0;

  // Sort zones alphabetically
  const sortedZones = Array.from(zoneStats.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  for (const [zoneName, stats] of sortedZones) {
    grandTotal += stats.total;
    grandCheckedIn += stats.checkedIn;
    const rate = stats.total > 0 ? ((stats.checkedIn / stats.total) * 100).toFixed(1) + "%" : "0%";
    const clubsList = Array.from(stats.clubs).join(", ") || "Individual Registrations";

    zonalRows.push([
      zoneName,
      stats.total,
      stats.checkedIn,
      stats.total - stats.checkedIn,
      rate,
      clubsList,
    ]);
  }

  // Add Grand Total Row
  zonalRows.push([
    "★ GRAND TOTAL DISTRICT 3192",
    grandTotal,
    grandCheckedIn,
    grandTotal - grandCheckedIn,
    grandTotal > 0 ? ((grandCheckedIn / grandTotal) * 100).toFixed(1) + "%" : "0%",
    "All Participating Clubs",
  ]);

  // 3. Create Workbook & Sheets
  const wb = XLSX.utils.book_new();

  // Create Delegates Sheet
  const ws1 = XLSX.utils.aoa_to_sheet(rows);
  ws1["!cols"] = [
    { wch: 18 }, // Ticket Code
    { wch: 22 }, // Name
    { wch: 22 }, // Designation / Role
    { wch: 18 }, // Rotary Affiliation
    { wch: 32 }, // Club / Organization
    { wch: 16 }, // Zone
    { wch: 20 }, // Tier
    { wch: 18 }, // Price
    { wch: 15 }, // Payment Mode
    { wch: 15 }, // Payment Status
    { wch: 20 }, // UTR
    { wch: 15 }, // Check-In
    { wch: 22 }, // Checked-In Time
    { wch: 22 }, // Reg Date
    { wch: 28 }, // Event Title
    { wch: 30 }, // Custom answers
    { wch: 25 }, // QR token
  ];
  XLSX.utils.book_append_sheet(wb, ws1, "Delegates Roster");

  // Create Zonal Summary Sheet
  const ws2 = XLSX.utils.aoa_to_sheet(zonalRows);
  ws2["!cols"] = [
    { wch: 24 }, // Zone
    { wch: 26 }, // Total Registered
    { wch: 22 }, // Checked In
    { wch: 22 }, // Pending
    { wch: 20 }, // Attendance Rate
    { wch: 60 }, // Clubs
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "Zonal Count Summary");

  // Write and trigger download
  XLSX.writeFile(wb, filename);
}

/**
 * Generic Table Exporter for Admin & Ledger Reports
 */
export function exportTableToExcel(
  filename: string,
  sheetName: string,
  rows: Record<string, any>[]
) {
  if (!rows || rows.length === 0) return;

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-calculate column widths
  const keys = Object.keys(rows[0]);
  ws["!cols"] = keys.map((k) => ({
    wch: Math.max(k.length + 4, 14),
  }));

  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));

  const targetFilename = filename.toLowerCase().endsWith(".xlsx")
    ? filename
    : `${filename.replace(/\.[^/.]+$/, "")}.xlsx`;

  XLSX.writeFile(wb, targetFilename);
}
