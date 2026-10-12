/**
 * AI & OCR UPI UTR Number Scanner
 * Runs high-accuracy client-side dual-pass OCR via Tesseract.js WebAssembly worker
 * with intelligent image upscaling, adaptive contrast thresholding, and multi-app
 * pattern matching for all Indian UPI payment apps (Kotak Mahindra, POP, Paytm, slice,
 * Super.money, Google Pay, PhonePe, CRED, BHIM, Amazon Pay, Axis, HDFC, ICICI, SBI).
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
 * Handles ₹, Rs, INR, as well as typical OCR misread symbols like F, f, ¥, $, 3.
 */
export function parseAmountFromText(
  rawText: string,
  expectedAmount?: number
): { detectedAmount?: number; amountMatches?: boolean } {
  if (!rawText || !rawText.trim()) {
    return {};
  }

  const cleaned = cleanOcrText(rawText);

  // 1. If expectedAmount is specified, first check if exact expected amount appears directly
  if (typeof expectedAmount === "number" && expectedAmount > 0) {
    const targetStr = expectedAmount.toString();
    const regexExact = new RegExp(`\\b${targetStr.replace(".", "\\.")}(?:\\.00)?\\b`);
    if (regexExact.test(cleaned)) {
      return { detectedAmount: expectedAmount, amountMatches: true };
    }
    const regexPrefix = new RegExp(`(?:[₹¥$Ff3z]|rs\\.?|inr)?${targetStr.replace(".", "\\.")}\\b`, "i");
    if (regexPrefix.test(cleaned)) {
      return { detectedAmount: expectedAmount, amountMatches: true };
    }
  }

  // Filter out dates, times, phone/account masked numbers, years, and 12-digit UTRs
  // so dates like "26 Sept" or "16 Jun" are not mistaken for paid amounts
  const amountSearchText = cleaned
    .replace(/\b\d{1,2}\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+['’]?\d{2,4})?\b/gi, " ")
    .replace(/\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:,\s*\d{2,4})?\b/gi, " ")
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?\b/gi, " ")
    .replace(/\bxx+\d{2,6}\b/gi, " ")
    .replace(/\*+\d{2,6}\b/gi, " ")
    .replace(/bank\s*-\s*\d{2,6}/gi, " ")
    .replace(/\b\d{12}\b/g, " ")
    .replace(/\b202[0-9]\b/g, " ");

  const highPriorityCandidates: number[] = [];
  const fallbackCandidates: number[] = [];

  const addCandidate = (val: number, highPriority = false) => {
    if (!isNaN(val) && val > 0 && val <= 500000) {
      if (highPriority) {
        if (!highPriorityCandidates.includes(val)) highPriorityCandidates.push(val);
      } else {
        if (!fallbackCandidates.includes(val)) fallbackCandidates.push(val);
      }
    }
  };

  // 1. Explicit labels: Paid, Amount, Total, Debited, Transfer
  const labelMatches = amountSearchText.matchAll(
    /(?:amount|paid|total|debited|sent|transfer(?:red)?|transferred\s*to)\s*[:=-]?\s*(?:[₹¥$Ff3z]|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/gi
  );
  for (const m of labelMatches) {
    if (m && m[1]) addCandidate(parseFloat(m[1].replace(/,/g, "")), true);
  }

  // 2. Preceded by Indian currency markers (₹, Rs, INR, and OCR misreads ¥, $, F, f)
  const currencyMatches = amountSearchText.matchAll(
    /(?:[₹¥$]|rs\.?|inr|[Ff](?=[0-9]))\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/gi
  );
  for (const m of currencyMatches) {
    if (m && m[1]) addCandidate(parseFloat(m[1].replace(/,/g, "")), true);
  }

  // 3. Standalone decimals with 2 decimal places e.g. "499.00", "2474.46"
  const decimalMatches = amountSearchText.matchAll(/\b([0-9]+(?:\.[0-9]{2}))\b/g);
  for (const m of decimalMatches) {
    if (m && m[1]) addCandidate(parseFloat(m[1]), true);
  }

  // 4. Standalone numbers e.g. 240, 945, 499 (only used as fallback when no labeled currency amounts found)
  const standaloneNums = amountSearchText.matchAll(/\b([1-9][0-9]{1,5})\b/g);
  for (const m of standaloneNums) {
    if (m && m[1]) addCandidate(parseFloat(m[1]), false);
  }

  const finalCandidates = highPriorityCandidates.length > 0 ? highPriorityCandidates : fallbackCandidates;

  if (finalCandidates.length === 0) {
    return {};
  }

  // If expectedAmount is provided, check if any extracted candidate matches
  if (typeof expectedAmount === "number" && expectedAmount > 0) {
    const exactMatch = finalCandidates.find((c) => Math.abs(c - expectedAmount) < 0.5);
    if (exactMatch !== undefined) {
      return {
        detectedAmount: exactMatch,
        amountMatches: true,
      };
    }

    return {
      detectedAmount: finalCandidates[0],
      amountMatches: false,
    };
  }

  return {
    detectedAmount: finalCandidates[0],
  };
}

/**
 * Searches extracted OCR text for 12-digit UPI UTR / Reference numbers
 * across all major Indian payment apps and banking formats.
 */
export function parseUtrFromText(rawText: string): { utr?: string; appName?: string; confidence: number } {
  if (!rawText || !rawText.trim()) {
    return { confidence: 0 };
  }

  const cleaned = cleanOcrText(rawText);

  // Detect UPI App Signature
  let appName: string | undefined = undefined;
  if (/slice/i.test(cleaned)) appName = "slice";
  else if (/pop\b|paid securely via pop/i.test(cleaned)) appName = "POP UPI";
  else if (/upi ref no|paytm/i.test(cleaned)) appName = "Paytm";
  else if (/kotak/i.test(cleaned)) appName = "Kotak Mahindra";
  else if (/super\.?money/i.test(cleaned)) appName = "Super.money";
  else if (/gpay|google\s*pay/i.test(cleaned)) appName = "Google Pay";
  else if (/phonepe/i.test(cleaned)) appName = "PhonePe";
  else if (/cred\b/i.test(cleaned)) appName = "CRED";
  else if (/bhim\b/i.test(cleaned)) appName = "BHIM";
  else if (/amazon\s*pay/i.test(cleaned)) appName = "Amazon Pay";
  else if (/hdfc/i.test(cleaned)) appName = "HDFC Bank";
  else if (/icici/i.test(cleaned)) appName = "ICICI Bank";
  else if (/axis/i.test(cleaned)) appName = "Axis Bank";
  else if (/sbi|yono/i.test(cleaned)) appName = "State Bank of India";

  // Tier 1: Labeled UPI Reference / UTR
  // Handles singleline and multiline labels (e.g. Kotak "UPI txn ID\n665129393381", slice "RRN: 628396121121",
  // Paytm "UPI Ref No: 208580688509 Copy", POP "Txn ID: 663554724974")
  const labeledPatterns = [
    // RRN (slice, POS, bank apps)
    /\brrn\s*(?:[:=-]|\n|\r\n)?\s*(\d{4}\s*\d{4}\s*\d{4}|\d{12})\b/i,
    // UPI Ref No / UPI Ref (Paytm)
    /upi\s*ref(?:\s*(?:no|id|number))?\s*(?:[:=-]|\n|\r\n)?\s*(\d{4}\s*\d{4}\s*\d{4}|\d{12})\b/i,
    // UPI Txn ID (Kotak, GPay - handles OCR variations UPI / UPL / UP1 / UP|)
    /(?:up[il1|]\s*(?:txn|transaction)\s*(?:id|no|number)?)\s*(?:[:=-]|\n|\r\n)?\s*(\d{4}\s*\d{4}\s*\d{4}|\d{12})\b/i,
    // Txn ID (POP, Mobikwik)
    /\btxn\s*(?:id|no|number)?\s*(?:[:=-]|\n|\r\n)?\s*(\d{4}\s*\d{4}\s*\d{4}|\d{12})\b/i,
    // Standard UTR label (PhonePe, banks)
    /\butr(?:\s*(?:no|number|id))?\s*(?:[:=-]|\n|\r\n)?\s*(\d{4}\s*\d{4}\s*\d{4}|\d{12})\b/i,
    // Super.money / Generic Ref ID
    /\bref\s*(?:id|no|number)?\s*(?:[:=-]|\n|\r\n)?\s*(\d{4}\s*\d{4}\s*\d{4}|\d{12})\b/i,
    // Bank / Txn Reference
    /(?:bank|transaction)\s*(?:ref|reference|id|number)?\s*(?:[:=-]|\n|\r\n)?\s*(\d{4}\s*\d{4}\s*\d{4}|\d{12})\b/i,
    // Google Transaction ID
    /(?:google|upi)?\s*transaction\s*id\s*(?:[:=-]|\n|\r\n)?\s*(\d{4}\s*\d{4}\s*\d{4}|\d{12})\b/i,
  ];

  for (const pattern of labeledPatterns) {
    const match = cleaned.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].replace(/\s+/g, "");
      if (/^\d{12}$/.test(candidate)) {
        return { utr: candidate, appName, confidence: 0.99 };
      }
    }
  }

  // Tier 2: Search line-by-line and line-ahead for reference keywords
  const lines = cleaned.split("\n").map((l) => l.trim()).filter(Boolean);
  const refKeywords = /ref|utr|upi|upl|txn|trans|id|bank|debited|rrn/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (refKeywords.test(line)) {
      // Check current line for 12 digits
      const match1 = line.match(/\b(\d{12})\b/) || line.match(/\b(\d{4}\s*\d{4}\s*\d{4})\b/);
      if (match1 && match1[1]) {
        const candidate = match1[1].replace(/\s+/g, "");
        if (/^\d{12}$/.test(candidate)) {
          return { utr: candidate, appName, confidence: 0.95 };
        }
      }
      // Check next line (e.g. label on line i and 12-digit number on line i+1)
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        const match2 = nextLine.match(/\b(\d{12})\b/) || nextLine.match(/\b(\d{4}\s*\d{4}\s*\d{4})\b/);
        if (match2 && match2[1]) {
          const candidate = match2[1].replace(/\s+/g, "");
          if (/^\d{12}$/.test(candidate)) {
            return { utr: candidate, appName, confidence: 0.95 };
          }
        }
      }
    }
  }

  // Tier 3: Scan for any standalone 12-digit number in the entire text
  const standaloneMatches = Array.from(cleaned.matchAll(/\b(\d{12})\b/g)).map((m) => m[1]);
  if (standaloneMatches.length > 0) {
    return { utr: standaloneMatches[0], appName, confidence: 0.88 };
  }

  // Tier 4: Look for 12 digits grouped with spaces e.g. "4292 1827 3849"
  const groupedMatch = cleaned.match(/\b(\d{4}\s+\d{4}\s+\d{4})\b/);
  if (groupedMatch && groupedMatch[1]) {
    const candidate = groupedMatch[1].replace(/\s+/g, "");
    if (/^\d{12}$/.test(candidate)) {
      return { utr: candidate, appName, confidence: 0.85 };
    }
  }

  return { confidence: 0, appName };
}

/**
 * Preprocesses an image in browser memory using HTML5 Canvas:
 * 1. Upscales image 2.5x with bicubic smoothing so tiny 8px-11px text (labels & txn IDs) is sharp.
 * 2. Creates a high-sensitivity binarized threshold canvas (gray < 200 -> black) to capture faint light gray text.
 * 3. Creates an enhanced contrast normalized canvas for colored amounts and headers.
 */
async function preprocessImageInBrowser(
  imageSource: string | File | Blob
): Promise<{ thresholdCanvasUrl?: string; normalizedCanvasUrl?: string }> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return {};
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      let objectUrlToRevoke: string | null = null;

      img.onload = () => {
        try {
          const naturalW = img.naturalWidth || img.width || 600;
          const naturalH = img.naturalHeight || img.height || 800;

          // Upscale factor: ensure width is at least 1600px, max 2400px
          const targetW = Math.min(2400, Math.max(1600, Math.round(naturalW * 2.5)));
          const targetH = Math.round(naturalH * (targetW / naturalW));

          // ── Pass 1: High-Sensitivity Binarized Threshold Canvas ──
          // Catches ultra-small, faint-gray text (e.g., "UPI txn ID", "Kotak txn ID", "Remarks", "RRN:")
          const canvasA = document.createElement("canvas");
          canvasA.width = targetW;
          canvasA.height = targetH;
          const ctxA = canvasA.getContext("2d", { willReadFrequently: true });
          if (!ctxA) {
            if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
            return resolve({});
          }

          ctxA.imageSmoothingEnabled = true;
          ctxA.imageSmoothingQuality = "high";
          ctxA.drawImage(img, 0, 0, targetW, targetH);

          const imgDataA = ctxA.getImageData(0, 0, targetW, targetH);
          const dataA = imgDataA.data;
          // Compute average luminance to detect if receipt has a dark background (e.g. POP UPI or dark mode)
          let totalLuminance = 0;
          for (let i = 0; i < dataA.length; i += 4) {
            totalLuminance += 0.299 * dataA[i] + 0.587 * dataA[i + 1] + 0.114 * dataA[i + 2];
          }
          const avgLuminance = totalLuminance / (dataA.length / 4);
          const isDarkReceipt = avgLuminance < 110;

          for (let i = 0; i < dataA.length; i += 4) {
            const r = dataA[i];
            const g = dataA[i + 1];
            const b = dataA[i + 2];
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            // Polarity-aware high-sensitivity binarization:
            // - Dark background: bright text pixels (>80) turn black (0), dark background turns white (255)
            // - Light background: faint gray/dark text (<200) turns black (0), white background stays white (255)
            const v = isDarkReceipt ? (gray > 80 ? 0 : 255) : (gray < 200 ? 0 : 255);
            dataA[i] = v;
            dataA[i + 1] = v;
            dataA[i + 2] = v;
          }
          ctxA.putImageData(imgDataA, 0, 0);
          const thresholdCanvasUrl = canvasA.toDataURL("image/png");

          // ── Pass 2: Enhanced Contrast Normalized Canvas ──
          // Catches colored amounts, bold headers, and app logos
          const canvasB = document.createElement("canvas");
          canvasB.width = targetW;
          canvasB.height = targetH;
          const ctxB = canvasB.getContext("2d", { willReadFrequently: true });
          let normalizedCanvasUrl: string | undefined = undefined;

          if (ctxB) {
            ctxB.imageSmoothingEnabled = true;
            ctxB.imageSmoothingQuality = "high";
            ctxB.drawImage(img, 0, 0, targetW, targetH);

            const imgDataB = ctxB.getImageData(0, 0, targetW, targetH);
            const dataB = imgDataB.data;

            for (let i = 0; i < dataB.length; i += 4) {
              const r = dataB[i];
              const g = dataB[i + 1];
              const b = dataB[i + 2];
              const gray = 0.299 * r + 0.587 * g + 0.114 * b;
              const stretched = Math.min(255, Math.max(0, (gray - 30) * 1.4));
              dataB[i] = stretched;
              dataB[i + 1] = stretched;
              dataB[i + 2] = stretched;
            }
            ctxB.putImageData(imgDataB, 0, 0);
            normalizedCanvasUrl = canvasB.toDataURL("image/png");
          }

          if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
          resolve({ thresholdCanvasUrl, normalizedCanvasUrl });
        } catch {
          if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
          resolve({});
        }
      };

      img.onerror = () => {
        if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
        resolve({});
      };

      if (typeof imageSource === "string") {
        img.src = imageSource;
      } else {
        objectUrlToRevoke = URL.createObjectURL(imageSource);
        img.src = objectUrlToRevoke;
      }
    } catch {
      resolve({});
    }
  });
}

/**
 * Runs dual-pass high-accuracy client-side OCR on an image source.
 * Prioritizes 99%+ accuracy over speed by running preprocessed high-resolution passes.
 */
export async function extractUtrFromImage(
  imageSource: string | File | Blob,
  onProgress?: (progress: number, statusText: string) => void,
  expectedAmount?: number
): Promise<UtrScanResult> {
  try {
    onProgress?.(0.1, "Initializing High-Accuracy AI OCR Engine...");

    // Dynamic import to keep main bundle lean
    const { createWorker } = await import("tesseract.js");

    const worker = await createWorker("eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          const p = 0.3 + (m.progress || 0) * 0.6;
          onProgress?.(p, `AI deep-scanning screenshot (${Math.round((m.progress || 0) * 100)}%)...`);
        } else if (m.status) {
          onProgress?.(0.2, "Processing image pixels...");
        }
      },
    });

    onProgress?.(0.25, "Enhancing resolution & contrast for tiny text...");

    // 1. Client-side canvas preprocessing
    const { thresholdCanvasUrl, normalizedCanvasUrl } = await preprocessImageInBrowser(imageSource);

    // Primary source to recognize: use threshold canvas if available, else raw image
    const primaryInput = thresholdCanvasUrl || imageSource;

    onProgress?.(0.4, "Analyzing transaction labels & 12-digit UTR...");
    const retA = await worker.recognize(primaryInput);
    let combinedText = retA.data.text || "";

    let parsedUtr = parseUtrFromText(combinedText);
    let parsedAmount = parseAmountFromText(combinedText, expectedAmount);

    // If UTR is not yet high confidence, or amount is missing, run Pass B for maximum accuracy
    if ((!parsedUtr.utr || parsedUtr.confidence < 0.95 || typeof parsedAmount.detectedAmount !== "number") && normalizedCanvasUrl) {
      onProgress?.(0.7, "Running secondary deep pass for amount verification...");
      const retB = await worker.recognize(normalizedCanvasUrl);
      combinedText = `${combinedText}\n${retB.data.text || ""}`;
      parsedUtr = parseUtrFromText(combinedText);
      parsedAmount = parseAmountFromText(combinedText, expectedAmount);
    }

    await worker.terminate();

    onProgress?.(0.95, "Cross-verifying payment receipt...");

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
        rawText: combinedText,
      };
    }

    return {
      success: false,
      rawText: combinedText,
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
