/**
 * AI & OCR UPI UTR Number Scanner
 * Runs client-side OCR via Tesseract.js WebAssembly worker to automatically
 * detect 12-digit UPI UTR / Reference numbers from Indian UPI payment screenshots
 * (Super.money, Google Pay, PhonePe, Paytm, CRED, BHIM, Amazon Pay, Bank apps).
 */

export interface UtrScanResult {
  success: boolean;
  utr?: string;
  detectedAmount?: number;
  amountMatches?: boolean;
  confidence?: number;
  appName?: string;
  rawText?: string;
  error?: string;
}

/**
 * Normalizes text to handle common Indian UPI screenshot variations & OCR quirks
 */
function cleanOcrText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[—–]/g, "-")
    .replace(/[|]/g, "I");
}

/**
 * Extracts and verifies the paid amount from Indian UPI payment receipt text.
 * Handles ₹, Rs, INR, as well as typical OCR misread symbols like ¥ or $.
 */
export function parseAmountFromText(
  rawText: string,
  expectedAmount?: number
): { detectedAmount?: number; amountMatches?: boolean } {
  if (!rawText || !rawText.trim()) {
    return {};
  }

  const cleaned = cleanOcrText(rawText);
  const candidates: number[] = [];

  const amountPatterns = [
    // 1. Explicit labels: Paid, Amount, Total, Debited, Transfer
    /(?:amount|paid|total|debited|sent|transfer(?:red)?|transferred\s*to)\s*[:=-]?\s*(?:[₹¥$]|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/gi,
    // 2. Preceded by Indian currency markers (including ₹, Rs, INR, and OCR misreads ¥, $)
    /(?:[₹¥$]|rs\.?|inr)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/gi,
    // 3. Standalone decimals with 2 decimal places e.g. "239.00"
    /\b([0-9]+(?:\.[0-9]{2}))\b/g,
  ];

  for (const regex of amountPatterns) {
    const matches = Array.from(cleaned.matchAll(regex));
    for (const m of matches) {
      if (m && m[1]) {
        const numStr = m[1].replace(/,/g, "").trim();
        const val = parseFloat(numStr);
        // Valid range for event ticket amounts (₹1 to ₹500,000)
        if (
          !isNaN(val) &&
          val > 0 &&
          val <= 500000 &&
          numStr.length < 9 &&
          val !== 2024 &&
          val !== 2025 &&
          val !== 2026 &&
          val !== 2027
        ) {
          if (!candidates.includes(val)) {
            candidates.push(val);
          }
        }
      }
    }
  }

  if (candidates.length === 0) {
    return {};
  }

  // If expectedAmount is provided, check if any extracted candidate matches
  if (typeof expectedAmount === "number" && expectedAmount > 0) {
    const exactMatch = candidates.find((c) => Math.abs(c - expectedAmount) < 0.5);
    if (exactMatch !== undefined) {
      return {
        detectedAmount: exactMatch,
        amountMatches: true,
      };
    }

    return {
      detectedAmount: candidates[0],
      amountMatches: false,
    };
  }

  return {
    detectedAmount: candidates[0],
  };
}

/**
 * Searches extracted OCR text for 12-digit UPI UTR / Reference numbers
 */
export function parseUtrFromText(rawText: string): { utr?: string; appName?: string; confidence: number } {
  if (!rawText || !rawText.trim()) {
    return { confidence: 0 };
  }

  const cleaned = cleanOcrText(rawText);
  const lines = cleaned.split("\n").map((l) => l.trim()).filter(Boolean);

  // Detect UPI App Signature
  let appName: string | undefined = undefined;
  if (/super\.?money/i.test(cleaned)) appName = "Super.money";
  else if (/gpay|google\s*pay/i.test(cleaned)) appName = "Google Pay";
  else if (/phonepe/i.test(cleaned)) appName = "PhonePe";
  else if (/paytm/i.test(cleaned)) appName = "Paytm";
  else if (/cred/i.test(cleaned)) appName = "CRED";
  else if (/bhim/i.test(cleaned)) appName = "BHIM";

  // Tier 1: Explicit labels directly preceding 12 digits (with optional spaces or dashes)
  // e.g. "Ref ID: 894551688081", "UTR: 429218273849", "UPI Ref No: 4292 1827 3849"
  const labeledPatterns = [
    // Super.money / Generic Ref ID
    /ref\s*(?:id|no|number)?[.:\s-]+(\d{4}\s*\d{4}\s*\d{4}|\d{12})\b/i,
    // UPI Ref / UPI Reference
    /upi\s*ref(?:erence)?(?:\s*(?:no|id|number))?[.:\s-]+(\d{4}\s*\d{4}\s*\d{4}|\d{12})\b/i,
    // Standard UTR label
    /\butr(?:\s*(?:no|number|id))?[.:\s-]+(\d{4}\s*\d{4}\s*\d{4}|\d{12})\b/i,
    // Bank / Txn Reference
    /(?:bank|txn|transaction)\s*(?:ref|reference|id|number)[.:\s-]+(\d{4}\s*\d{4}\s*\d{4}|\d{12})\b/i,
    // Google Transaction ID / UPI Transaction ID
    /(?:google|upi)?\s*transaction\s*id[.:\s-]+(\d{4}\s*\d{4}\s*\d{4}|\d{12})\b/i,
  ];

  for (const pattern of labeledPatterns) {
    const match = cleaned.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].replace(/\s+/g, "");
      if (/^\d{12}$/.test(candidate)) {
        return { utr: candidate, appName, confidence: 0.95 };
      }
    }
  }

  // Tier 2: Search line-by-line in lines that mention reference keywords
  const refKeywords = /ref|utr|upi|txn|trans|id|bank|debited/i;
  for (const line of lines) {
    if (refKeywords.test(line)) {
      // Find any 12 digit sequence on that line
      const lineMatch = line.match(/\b(\d{12})\b/) || line.match(/\b(\d{4}\s*\d{4}\s*\d{4})\b/);
      if (lineMatch && lineMatch[1]) {
        const candidate = lineMatch[1].replace(/\s+/g, "");
        if (/^\d{12}$/.test(candidate)) {
          return { utr: candidate, appName, confidence: 0.88 };
        }
      }
    }
  }

  // Tier 3: Scan for any standalone 12-digit number in the entire text
  const standaloneMatches = Array.from(cleaned.matchAll(/\b(\d{12})\b/g)).map((m) => m[1]);
  if (standaloneMatches.length > 0) {
    if (standaloneMatches.length === 1) {
      return { utr: standaloneMatches[0], appName, confidence: 0.8 };
    }
    return { utr: standaloneMatches[0], appName, confidence: 0.75 };
  }

  // Tier 4: Look for 12 digits grouped with spaces e.g. "4292 1827 3849"
  const groupedMatch = cleaned.match(/\b(\d{4}\s+\d{4}\s+\d{4})\b/);
  if (groupedMatch && groupedMatch[1]) {
    const candidate = groupedMatch[1].replace(/\s+/g, "");
    if (/^\d{12}$/.test(candidate)) {
      return { utr: candidate, appName, confidence: 0.78 };
    }
  }

  return { confidence: 0, appName };
}

/**
 * Runs client-side OCR on an image source (data URL, Object URL, or Blob)
 * and returns the auto-detected 12-digit UTR and verified amount paid.
 */
export async function extractUtrFromImage(
  imageSource: string | File | Blob,
  onProgress?: (progress: number, statusText: string) => void,
  expectedAmount?: number
): Promise<UtrScanResult> {
  try {
    onProgress?.(0.1, "Initializing AI OCR Engine...");
    
    // Dynamic import to keep main bundle lean
    const { createWorker } = await import("tesseract.js");

    const worker = await createWorker("eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          const p = 0.2 + (m.progress || 0) * 0.7;
          onProgress?.(p, `AI scanning screenshot (${Math.round((m.progress || 0) * 100)}%)...`);
        } else if (m.status) {
          onProgress?.(0.2, "Reading image pixels...");
        }
      },
    });

    onProgress?.(0.3, "Analyzing screenshot text...");
    const ret = await worker.recognize(imageSource);
    await worker.terminate();

    const rawText = ret.data.text || "";
    onProgress?.(0.95, "Checking UTR & Amount Paid...");

    const parsedUtr = parseUtrFromText(rawText);
    const parsedAmount = parseAmountFromText(rawText, expectedAmount);

    const hasUtr = Boolean(parsedUtr.utr);
    const hasAmount = typeof parsedAmount.detectedAmount === "number";

    if (hasUtr || hasAmount) {
      onProgress?.(1.0, "Scan Complete!");
      return {
        success: true,
        utr: parsedUtr.utr,
        detectedAmount: parsedAmount.detectedAmount,
        amountMatches: parsedAmount.amountMatches,
        appName: parsedUtr.appName,
        confidence: parsedUtr.confidence,
        rawText,
      };
    }

    return {
      success: false,
      rawText,
      error: "Could not auto-detect a 12-digit UTR number or paid amount from screenshot.",
    };
  } catch (err: any) {
    console.error("[utrScanner] Error running OCR:", err);
    return {
      success: false,
      error: err?.message || "Failed to scan screenshot.",
    };
  }
}
