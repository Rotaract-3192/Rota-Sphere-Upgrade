import os
import sys
import tempfile
import warnings
from typing import Optional

# Suppress PyTorch and EasyOCR warnings
warnings.filterwarnings("ignore")
os.environ["PYTHONWARNINGS"] = "ignore"

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from execution.scan_receipt import extract_receipt_data, get_reader

app = FastAPI(title="RotaSphere Deep-Learning Receipt OCR Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pre-warm EasyOCR model on startup
@app.on_event("startup")
def startup_event():
    print("Pre-warming EasyOCR model weights in memory...")
    reader = get_reader()
    print("EasyOCR deep-learning model pre-warmed and ready for inference!")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "RotaSphere OCR Microservice", "model": "EasyOCR CRAFT+ResNet"}

@app.post("/scan")
async def scan_receipt(
    file: UploadFile = File(...),
    expected_amount: Optional[float] = Form(None)
):
    if not file:
        raise HTTPException(status_code=400, detail="No receipt image uploaded")

    # Save to a temporary file for EasyOCR processing
    suffix = os.path.splitext(file.filename or "")[1] or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp_path = tmp.name
        content = await file.read()
        tmp.write(content)

    try:
        data = extract_receipt_data(tmp_path, expected_amount)
        print(f"[OCR Service] Processed {file.filename} in {data.get('scan_time_seconds')}s -> UTR: {data.get('utr')}, Amount: {data.get('detected_amount')}, App: {data.get('app_name')}")
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("execution.ocr_service:app", host="127.0.0.1", port=5055, reload=False, workers=1)
