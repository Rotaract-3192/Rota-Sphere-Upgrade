import sys
import os
import json
import re
import time
import warnings

# Suppress PyTorch and EasyOCR console logs so CLI returns pure JSON
warnings.filterwarnings("ignore")
os.environ["PYTHONWARNINGS"] = "ignore"

import easyocr
from PIL import Image, ImageOps
import numpy as np

# Initialize reader globally when imported as a module / FastAPI service
_reader = None

def get_reader():
    global _reader
    if _reader is None:
        # EasyOCR CRAFT + ResNet + BiLSTM for English
        _reader = easyocr.Reader(['en'], gpu=False, verbose=False)
    return _reader

def detect_app_name(all_text_lower):
    if "kotak" in all_text_lower:
        return "Kotak Mahindra Bank"
    if "pop" in all_text_lower:
        return "POP UPI"
    if "paytm" in all_text_lower:
        return "Paytm"
    if "slice" in all_text_lower:
        return "slice"
    if "google pay" in all_text_lower or "gpay" in all_text_lower:
        return "Google Pay"
    if "phonepe" in all_text_lower:
        return "PhonePe"
    if "cred" in all_text_lower:
        return "CRED"
    if "bhim" in all_text_lower:
        return "BHIM"
    if "amazon" in all_text_lower:
        return "Amazon Pay"
    return "UPI Payment App"

def fixup_ocr_digits(s):
    """Normalize common OCR letter-to-digit misreadings in 12-digit transaction numbers."""
    replacements = {
        'O': '0', 'o': '0',
        'I': '1', 'l': '1', 'i': '1', '|': '1',
        'S': '5', 's': '5',
        'B': '8',
        'Z': '2', 'z': '2'
    }
    cleaned = []
    for ch in s:
        if ch.isdigit():
            cleaned.append(ch)
        elif ch in replacements:
            cleaned.append(replacements[ch])
    return "".join(cleaned)

def extract_receipt_data(image_path, expected_amount=None):
    reader = get_reader()
    
    # 1. Load image and auto-orient according to EXIF tags (critical for mobile camera uploads)
    try:
        pil_img = Image.open(image_path)
        pil_img = ImageOps.exif_transpose(pil_img)
        img_input = np.array(pil_img.convert('RGB'))
    except Exception:
        img_input = image_path

    t0 = time.time()
    # readtext returns list of [ [bbox], text, confidence ]
    results = reader.readtext(img_input)
    scan_time = round(time.time() - t0, 3)

    raw_tokens = [r[1].strip() for r in results if r[1].strip()]
    all_text = " ".join(raw_tokens)
    all_text_lower = all_text.lower()
    app_name = detect_app_name(all_text_lower)

    # --- 1. UTR DETECTION ---
    utr = None
    utr_confidence = 0.0

    # Strong UTR indicator labels used across Indian UPI apps
    utr_keywords = [
        r"upi\s*txn\s*id",
        r"txn\s*id",
        r"upi\s*ref(?:erence)?\s*(?:no|number)?",
        r"rrn",
        r"ref(?:erence)?\s*no",
        r"utr(?:\s*no)?",
        r"transaction\s*id",
        r"bank\s*ref",
        r"ref\s*id"
    ]
    utr_keyword_regex = re.compile("|".join(utr_keywords), re.IGNORECASE)

    # Strategy A: Check tokens that directly contain both keyword and 12 digits
    for bbox, text, conf in results:
        clean = text.replace(" ", "").replace("-", "")
        if utr_keyword_regex.search(text):
            digits_match = re.search(r'\b(\d{12})\b', clean)
            if digits_match:
                utr = digits_match.group(1)
                utr_confidence = float(conf)
                break

    # Strategy B: Find token with keyword, then search adjacent tokens for 12 digits
    if not utr:
        for i, (bbox, text, conf) in enumerate(results):
            if utr_keyword_regex.search(text):
                # Check up to 4 following tokens
                for j in range(i + 1, min(i + 5, len(results))):
                    adj_text = results[j][1].replace(" ", "").replace("-", "")
                    
                    # Direct 12 digits
                    m12 = re.findall(r'\b\d{12}\b', adj_text)
                    if m12:
                        utr = m12[0]
                        utr_confidence = float(results[j][2])
                        break
                    
                    # Any continuous 12-digit sequence
                    any12 = re.findall(r'\d{12}', adj_text)
                    if any12:
                        utr = any12[0]
                        utr_confidence = float(results[j][2])
                        break

                    # OCR letter-to-digit fixup (e.g. 66512939338O -> 665129393380)
                    fixed = fixup_ocr_digits(adj_text)
                    if len(fixed) == 12:
                        utr = fixed
                        utr_confidence = float(results[j][2])
                        break

                if utr:
                    break

    # Strategy C: Check combined tokens if digits were split across 2 lines (e.g. 665129 + 393381)
    if not utr:
        for i in range(len(results) - 1):
            combined_digits = re.sub(r'\D', '', results[i][1] + results[i+1][1])
            if len(combined_digits) == 12:
                utr = combined_digits
                utr_confidence = float(results[i][2])
                break

    # Strategy D: Standalone 12-digit tokens anywhere in the image
    if not utr:
        for bbox, text, conf in results:
            clean = text.replace(" ", "").replace("-", "")
            matches = re.findall(r'\b\d{12}\b', clean)
            if matches:
                # Exclude if it looks like placeholder '429218273849' from screen UI
                if matches[0] != "429218273849":
                    utr = matches[0]
                    utr_confidence = float(conf)
                    break

    # Strategy E: Fallback regex search on joined full text
    if not utr:
        full_clean = re.sub(r'[\s\-]', '', all_text)
        all_12 = re.findall(r'\d{12}', full_clean)
        for candidate in all_12:
            if candidate != "429218273849":
                utr = candidate
                utr_confidence = 0.85
                break

    # --- 2. AMOUNT DETECTION ---
    detected_amount = None
    amount_matches = False

    if expected_amount is not None:
        expected_amount_num = float(expected_amount)
        # Formatted string variations: e.g. 499, 499.00, 2474.46, 2,474.46
        exp_int_str = str(int(expected_amount_num)) if expected_amount_num.is_integer() else f"{expected_amount_num:.2f}"
        exp_formatted_str = f"{expected_amount_num:,.2f}"

        for bbox, text, conf in results:
            clean_t = text.replace(",", "").strip()
            
            # Exact presence
            if exp_int_str in clean_t or exp_formatted_str.replace(",", "") in clean_t:
                detected_amount = expected_amount_num
                amount_matches = True
                break

            # Rupee symbol OCR distortions: ₹ frequently read as '8', '2', 'z', 'Rs', '₹'
            for prefix in ['8', '2', 'z', '₹', 'R']:
                if f"{prefix}{exp_int_str}" in clean_t or f"{prefix} {exp_int_str}" in clean_t:
                    detected_amount = expected_amount_num
                    amount_matches = True
                    break
            if amount_matches:
                break

    # If amount not verified by expected amount, search for prominent money patterns
    if detected_amount is None:
        amount_patterns = [
            r'(?:₹|rs\.?|inr|amount|paid|total|paying)\s*[:\-]?\s*([82]?\d{2,6}(?:\.\d{1,2})?)',
            r'\b([82]?\d{2,6}\.\d{2})\b',
            r'\b(\d{3,6})\b'
        ]
        
        candidates = []
        for bbox, text, conf in results:
            clean_t = text.replace(",", "").strip()
            for pat in amount_patterns:
                m = re.search(pat, clean_t, re.IGNORECASE)
                if m:
                    val_str = m.group(1)
                    # Strip leading OCR artifact '8' or '2' if it makes the number abnormally large
                    if len(val_str) >= 4 and val_str[0] in ['8', '2'] and '.' not in val_str:
                        stripped = float(val_str[1:])
                        candidates.append(stripped)
                    try:
                        candidates.append(float(val_str))
                    except ValueError:
                        pass
        if candidates:
            # Pick first sensible candidate under 1,00,000
            for c in candidates:
                if 10 <= c <= 100000:
                    detected_amount = c
                    break

    return {
        "success": bool(utr or (detected_amount is not None)),
        "utr": utr,
        "confidence": round(utr_confidence, 3),
        "detected_amount": detected_amount,
        "amount_matches": amount_matches if expected_amount is not None else None,
        "app_name": app_name,
        "scan_time_seconds": scan_time,
        "raw_text_summary": all_text[:200]
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Usage: python scan_receipt.py <image_path> [expected_amount]"}))
        sys.exit(1)

    img_path = sys.argv[1]
    exp_amt = None
    if len(sys.argv) > 2:
        try:
            exp_amt = float(sys.argv[2])
        except ValueError:
            pass

    if not os.path.exists(img_path):
        print(json.dumps({"success": False, "error": f"File not found: {img_path}"}))
        sys.exit(1)

    try:
        data = extract_receipt_data(img_path, exp_amt)
        print(json.dumps(data))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)
