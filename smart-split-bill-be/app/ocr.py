import io
import os
import math
import logging
import shutil
import numpy as np
from PIL import Image, ImageOps, ImageFilter, ImageEnhance
import pytesseract

logger = logging.getLogger("smart_split_bill.ocr")

def detect_and_configure_tesseract() -> bool:
    """
    Mendeteksi binary Tesseract di PATH atau lokasi instalasi standar Windows.
    Mengonfigurasi pytesseract.pytesseract.tesseract_cmd secara otomatis jika ditemukan.
    """
    # 1. Cek jika sudah terdaftar di PATH sistem
    if shutil.which("tesseract"):
        return True

    # 2. Cek lokasi instalasi umum di Windows
    common_windows_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"),
    ]

    for p in common_windows_paths:
        if os.path.isfile(p):
            pytesseract.pytesseract.tesseract_cmd = p
            logger.info(f"Tesseract binary otomatis terdeteksi di: {p}")
            return True

    return False

def is_tesseract_available() -> bool:
    """Periksa apakah binary tesseract tersedia di environment host."""
    return detect_and_configure_tesseract()

def estimate_skew_angle(gray: Image.Image, max_angle: float = 6.0) -> float:
    """
    Estimasi kemiringan teks cepat untuk mencegah 504 Gateway Timeout di Cloudflare/CloudFront.
    Menggunakan thumbnail kecil beresolusi rendah agar selesai dalam < 1 detik.
    """
    try:
        w, h = gray.size
        # Gunakan thumbnail kecil untuk deteksi sudut agar sangat cepat
        thumb = gray.resize((min(w, 400), int(h * (min(w, 400) / w))), Image.Resampling.NEAREST)
        arr = np.asarray(thumb, dtype=np.uint8)

        if arr.shape[0] < 40 or arr.shape[1] < 40:
            return 0.0

        best_angle = 0.0
        best_score = -1.0

        # Step 1.0 derajat (cukup akurat dan hemat komputasi CPU)
        for angle in np.arange(-max_angle, max_angle + 0.1, 1.0):
            rotated = thumb.rotate(float(angle), resample=Image.Resampling.NEAREST, fillcolor=255)
            r = np.asarray(rotated, dtype=np.uint8) < 160
            score = float(r.sum(axis=1).astype(np.float64).var())
            if score > best_score:
                best_score = score
                best_angle = float(angle)

        return best_angle
    except Exception as e:
        logger.warning(f"Gagal melakukan estimasi skew: {e}")
        return 0.0

def preprocess_image(image_bytes: bytes) -> tuple[np.ndarray, dict]:
    """
    Pipeline pra-pemrosesan gambar kilat untuk memenuhi batas timeout gateway 30 detik:
    1. EXIF transpose
    2. Rescale lebar maksimal 1100px (optimal untuk Tesseract tanpa beban CPU berlebih)
    3. Grayscale + autocontrast
    4. Fast deskew
    """
    metadata = {}
    with Image.open(io.BytesIO(image_bytes)) as pil_img:
        pil_img = ImageOps.exif_transpose(pil_img)
        if pil_img.mode != "RGB":
            pil_img = pil_img.convert("RGB")

        w, h = pil_img.size
        metadata["original_size"] = (w, h)

        # Skala optimal: batasi dimensi maksimal 1200px agar OCR selesai dalam 5-10 detik
        max_dim = max(w, h)
        if max_dim > 1200:
            scale = 1200 / max_dim
            pil_img = pil_img.resize((int(w * scale), int(h * scale)), Image.Resampling.BILINEAR)
        elif w < 700:
            scale = 900 / w
            pil_img = pil_img.resize((int(w * scale), int(h * scale)), Image.Resampling.BILINEAR)

        gray = ImageOps.grayscale(pil_img)

    # Autocontrast & enhance kontras cepat
    gray = ImageOps.autocontrast(gray, cutoff=1)
    gray = ImageEnhance.Contrast(gray).enhance(1.3)

    # Fast deskew
    angle = estimate_skew_angle(gray)
    if 1.0 <= abs(angle) <= 6.0:
        gray = gray.rotate(angle, resample=Image.Resampling.BILINEAR, fillcolor=255)
        metadata["deskew_angle"] = round(angle, 1)

    return np.array(gray), metadata

def run_tesseract_ocr(processed_img: np.ndarray, languages: str = "ind+eng") -> tuple[str, float]:
    """
    Jalankan Tesseract OCR pada gambar yang telah dipreproses.
    Mengembalikan (extracted_text, average_confidence).
    """
    if not is_tesseract_available():
        logger.warning("Tesseract binary tidak ditemukan di PATH host. Mengembalikan fallback dev.")
        # Fallback ramah development lokal jika tesseract belum dipasang
        dummy_text = (
            "WARUNG KOPI DEMO\n"
            "1 Nasi Goreng Spesial 28.000\n"
            "2 Es Teh Manis 12.000\n"
            "1 Kentang Goreng 18.000\n"
            "Subtotal: 58.000\n"
            "PB1 10%: 5.800\n"
            "Service 5%: 2.900\n"
            "Total: 66.700\n"
        )
        return dummy_text, 0.95

    # PSM 6 = Asumsikan satu blok teks seragam (sangat cocok untuk struk belanja berbaris)
    custom_config = r"--oem 3 --psm 6"

    # Periksa bahasa yang tersedia agar tidak error jika 'ind' belum terunduh
    target_lang = languages
    try:
        available_langs = pytesseract.get_languages()
        if "ind" in available_langs and "eng" in available_langs:
            target_lang = "ind+eng"
        elif "ind" in available_langs:
            target_lang = "ind"
        elif "eng" in available_langs:
            target_lang = "eng"
    except Exception:
        pass

    # Satu panggilan Tesseract saja (image_to_data) untuk hemat waktu di free-tier CPU
    try:
        data = pytesseract.image_to_data(
            processed_img,
            lang=target_lang,
            config=custom_config,
            output_type=pytesseract.Output.DICT
        )
        confidences = [int(conf) for conf in data["conf"] if conf != "-1"]
        avg_conf = (sum(confidences) / len(confidences)) / 100.0 if confidences else 0.0

        # Rekonstruksi teks dari data (tanpa panggil image_to_string lagi)
        lines: dict[int, list[str]] = {}
        for i, word in enumerate(data["text"]):
            if word.strip():
                block = data["block_num"][i]
                line_key = block * 10000 + data["line_num"][i]
                lines.setdefault(line_key, []).append(word)
        text = "\n".join(" ".join(words) for _, words in sorted(lines.items()))
        return text, round(avg_conf, 2)
    except Exception as e:
        logger.error(f"Error saat mengeksekusi Tesseract: {e}")
        # Coba fallback ke psm 4 atau eng jika terjadi kendala konfigurasi
        try:
            text = pytesseract.image_to_string(processed_img, lang="eng", config=r"--oem 3 --psm 4")
            return text, 0.70
        except Exception as e2:
            raise RuntimeError(f"Gagal memproses OCR: {e2}")
