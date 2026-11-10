import os
import io
import gc
import time
import logging
from typing import Optional
from fastapi import FastAPI, Request, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.ocr import preprocess_image, run_tesseract_ocr, is_tesseract_available
from app.parser import parse_receipt_text, ReceiptParseResponse

# Konfigurasi Logging: Hanya mencatat metadata teknis tanpa konten pengguna (NFR-P5)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("smart_split_bill.api")

# Proteksi Decompression Bomb (NFR-S3)
Image.MAX_IMAGE_PIXELS = 50_000_000

# Fungsi penentu IP klien untuk rate limiting di belakang reverse proxy Render (NFR-S4)
def get_client_ip(request: Request) -> str:
    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        # Ambil IP pertama sebelum koma
        return x_forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

# Inisialisasi Rate Limiter
RATE_LIMIT_RULE = os.getenv("RATE_LIMIT", "15/minute")
limiter = Limiter(key_func=get_client_ip)

app = FastAPI(
    title="Smart Split Bill API",
    description="Stateless & Ephemeral OCR Receipt Parsing Service",
    version="1.1.0"
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Allowlist (NFR-S2)
allowed_origins_env = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
)
origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "5"))
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024

def validate_magic_bytes(data: bytes) -> str:
    """
    Validasi berkas berdasarkan magic bytes header (bukan hanya ekstensi file).
    Mendukung JPEG, PNG, dan WebP.
    """
    if len(data) < 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Berkas terlalu kecil atau rusak."
        )
    # JPEG magic bytes: FF D8 FF
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    # PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    # WebP magic bytes: RIFF .... WEBP
    if data.startswith(b"RIFF") and data[8:12] == b"WEBP":
        return "image/webp"

    raise HTTPException(
        status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        detail="Format berkas tidak didukung. Harap unggah foto berekstensi JPG, PNG, atau WebP."
    )

@app.get("/health")
@limiter.limit("60/minute")
def health_check(request: Request):
    """
    Endpoint health check & warm-up ping untuk mitigasi cold start Render (FR-12, NFR-F3).
    """
    tess_available = is_tesseract_available()
    return {
        "status": "ok",
        "tesseract": "5.x" if tess_available else "mock/dev-mode",
        "languages": ["ind", "eng"],
        "ephemeral_storage": "tmpfs (/dev/shm)" if os.path.exists("/dev/shm") else "RAM-only",
        "timestamp": int(time.time())
    }

@app.post("/api/v1/ocr/parse", response_model=ReceiptParseResponse)
@limiter.limit(RATE_LIMIT_RULE)
async def parse_receipt(request: Request, file: UploadFile = File(...)):
    """
    Mengekstrak daftar item, kuantitas, harga, dan total dari foto struk secara ephemeral.
    Foto hanya berada di memori selama request dan langsung dibersihkan di blok finally.
    """
    start_time = time.time()
    raw_bytes: Optional[bytes] = None
    processed_img = None

    try:
        # 1. Baca byte stream dari file upload
        raw_bytes = await file.read()
        file_size = len(raw_bytes)

        # 2. Validasi ukuran file (maks 5MB)
        if file_size > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Ukuran berkas melebihi batas maksimal {MAX_UPLOAD_MB} MB."
            )

        # 3. Validasi magic bytes (JPEG / PNG / WebP)
        mime_type = validate_magic_bytes(raw_bytes)

        # 4. Pipeline Pra-pemrosesan Gambar (OpenCV & Pillow)
        try:
            processed_img, prep_metadata = preprocess_image(raw_bytes)
        except Exception as e:
            logger.warning(f"Gagal memproses gambar: {type(e).__name__}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Berkas gambar tidak dapat didekode atau rusak."
            )

        # 5. Eksekusi OCR Tesseract (bahasa ind + eng)
        try:
            ocr_text, avg_confidence = run_tesseract_ocr(processed_img, languages="ind+eng")
        except Exception as e:
            logger.error(f"Gagal menjalankan OCR engine: {e}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Gagal mengekstrak teks dari gambar struk."
            )

        # 6. Parsing teks struk menjadi struktur JSON
        parse_result = parse_receipt_text(ocr_text, confidence=avg_confidence)

        duration = round(time.time() - start_time, 3)
        # Log metadata teknis saja tanpa konten pribadi pengguna (NFR-P5)
        logger.info(
            f"Parsed receipt: size={file_size}B mime={mime_type} "
            f"items_count={len(parse_result.items)} duration={duration}s"
        )

        return parse_result

    finally:
        # Jaminan Ephemeral (NFR-P1, NFR-P4): bersihkan referensi data gambar dari memori
        del raw_bytes
        del processed_img
        try:
            await file.close()
        except Exception:
            pass
        gc.collect()
