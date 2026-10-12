import path from "path";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { createWorker } from "tesseract.js";
import { parseUtrFromText, parseAmountFromText } from "@/lib/utils/utrScanner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Dedicated 100% Backend Payment Receipt OCR API Route
 * Handles multipart/form-data binary uploads of any size (up to 20MB)
 * without base64 bloat or Next.js Server Action 1MB limits.
 * Runs in ~1.5s on the VPS and eliminates all mobile device lag and timeouts.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const expectedAmountStr = formData.get("expectedAmount") as string | null;
    const expectedAmount = expectedAmountStr ? parseFloat(expectedAmountStr) : undefined;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No receipt image provided in request." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    if (!inputBuffer || inputBuffer.length === 0) {
      return NextResponse.json(
        { success: false, error: "Empty image payload received." },
        { status: 400 }
      );
    }

    const meta = await sharp(inputBuffer).metadata();
    const naturalW = meta.width || 600;
    const naturalH = meta.height || 800;

    // 2.5x high-fidelity upscale: ensures tiny 8px labels (e.g. UPI Ref No, RRN, Txn ID) are sharp
    const targetW = Math.min(2400, Math.max(1600, Math.round(naturalW * 2.5)));
    const targetH = Math.round(naturalH * (targetW / naturalW));

    // Analyze overall luminance to handle dark receipts (POP UPI, dark mode) vs light receipts (Paytm, slice, Kotak)
    const stats = await sharp(inputBuffer).grayscale().stats();
    const isDarkReceipt = stats.channels[0].mean < 110;

    // Pass 1: Polarity-aware high-sensitivity binarization
    let pass1Buffer: Buffer;
    if (isDarkReceipt) {
      pass1Buffer = await sharp(inputBuffer)
        .resize({ width: targetW, height: targetH })
        .grayscale()
        .negate()
        .threshold(160)
        .toBuffer();
    } else {
      pass1Buffer = await sharp(inputBuffer)
        .resize({ width: targetW, height: targetH })
        .grayscale()
        .threshold(200)
        .toBuffer();
    }

    // Pass 2: Enhanced contrast normalization
    const pass2Buffer = await sharp(inputBuffer)
      .resize({ width: targetW, height: targetH })
      .grayscale()
      .normalize()
      .sharpen()
      .toBuffer();

    // Node.js server worker with explicit absolute workerPath to prevent Next.js bundler path virtualization
    const workerPath = path.resolve(process.cwd(), "node_modules/tesseract.js/src/worker-script/node/index.js");
    const worker = await createWorker("eng", 1, { workerPath });
    const ret1 = await worker.recognize(pass1Buffer);
    let combinedText = ret1.data.text || "";

    let parsedUtr = parseUtrFromText(combinedText);
    let parsedAmount = parseAmountFromText(combinedText, expectedAmount);

    if (!parsedUtr.utr || parsedUtr.confidence < 0.95 || typeof parsedAmount.detectedAmount !== "number") {
      const ret2 = await worker.recognize(pass2Buffer);
      combinedText = `${combinedText}\n${ret2.data.text || ""}`;
      parsedUtr = parseUtrFromText(combinedText);
      parsedAmount = parseAmountFromText(combinedText, expectedAmount);
    }

    await worker.terminate();

    if (parsedUtr.utr || typeof parsedAmount.detectedAmount === "number") {
      return NextResponse.json({
        success: true,
        utr: parsedUtr.utr,
        detectedAmount: parsedAmount.detectedAmount,
        amountMatches: parsedAmount.amountMatches,
        appName: parsedUtr.appName,
        confidence: parsedUtr.confidence,
      });
    }

    return NextResponse.json({
      success: false,
      error: "Could not auto-detect a 12-digit UTR number or paid amount from screenshot.",
    });
  } catch (err: any) {
    console.error("[/api/ocr/scan-receipt] VPS OCR error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to scan receipt on server.",
      },
      { status: 500 }
    );
  }
}
