# Directive: Indian UPI Payment Receipt OCR

## 1. Goal
Provide a fast (< 3 seconds on VPS), 99%+ accurate OCR scanning pipeline for Indian UPI payment screenshots (Kotak Mahindra Bank, POP UPI, Paytm, slice, Google Pay, PhonePe, CRED, BHIM, Amazon Pay).
Extract:
1. NPCI-standard 12-digit UTR (Unique Transaction Reference / Ref No / Txn ID / RRN).
2. Paid amount verification against expected order total.

## 2. Architecture & Components
- **Deep-Learning Model**: EasyOCR (CRAFT text detector + ResNet/BiLSTM text recognizer).
  - Selected over legacy Tesseract because Tesseract fails on low-contrast stylized UPI fonts, colored backgrounds (e.g. POP UPI green pinstripes), and takes 40-80s on CPU.
  - EasyOCR performs end-to-end deep detection and recognition in 1.8s–2.8s on CPU.
- **Microservice Layer (`execution/ocr_service.py`)**:
  - FastAPI server running on `http://127.0.0.1:5055`.
  - Keeps PyTorch and EasyOCR model weights pre-warmed in RAM for 0ms cold-start latency.
  - Endpoint: `POST /scan` (multipart/form-data: `file`, `expected_amount`).
- **CLI Fallback Worker (`execution/scan_receipt.py`)**:
  - Callable on-demand: `python execution/scan_receipt.py <image_path> [expected_amount]`.
  - Used automatically if the HTTP microservice is unreachable.
- **Orchestration Route (`src/app/api/ocr/scan-receipt/route.ts`)**:
  - Receives client upload.
  - Dispatches to `127.0.0.1:5055/scan`.
  - Falls back to `child_process.execFile("python", ["execution/scan_receipt.py", ...])` if daemon is offline.
  - Returns unified JSON response: `{ success, utr, detectedAmount, amountMatches, appName, confidence }`.

## 3. Supported Receipt Schemas
| App | UTR Label Identifier | Example Pattern |
|---|---|---|
| Kotak Mahindra | "UPI txn ID" | 12 digits (e.g. 665129393381) |
| POP UPI | "Txn ID" | 12 digits (e.g. 663554724974) |
| Paytm | "UPI Ref No" | 12 digits (e.g. 208580688509) |
| slice | "RRN" | 12 digits (e.g. 628396121121) |
| Google Pay | "UPI transaction ID" | 12 digits |
| PhonePe | "UTR" or "Transaction ID" | 12 digits |
| CRED | "UTR" / "Reference ID" | 12 digits |

## 4. Rupee Symbol Glyph Handling
The standard Indian Rupee symbol `₹` is frequently mapped to OCR characters `8`, `2`, `z`, or `Rs` in standard Latin OCR models.
The parser tests for:
- Exact number: `499`
- Glyph-prefixed numbers: `8499`, `2499`, `8240`, `2945`
Matching is verified against `expectedAmount` passed from the checkout session.
