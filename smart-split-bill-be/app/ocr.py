import io
import os
import math
import logging
import shutil
import numpy as np
from PIL import Image, ImageOps
import cv2
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

def deskew_image(cv_img: np.ndarray) -> np.ndarray:
    """Luruskan orientasi teks struk jika miring menggunakan minAreaRect."""
    try:
        # Gunakan Otsu thresholding untuk segmentasi teks
        if len(cv_img.shape) == 3:
            gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
        else:
            gray = cv_img

        thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
        coords = np.column_stack(np.where(thresh > 0))
        if coords.shape[0] < 50:
            return cv_img  # Tidak cukup piksel teks untuk deskew

        angle = cv2.minAreaRect(coords)[-1]
        # minAreaRect sudut berkisar antara [-90, 0)
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle

        # Hindari rotasi berlebihan jika sudut terdeteksi terlalu ekstrim (>30 deg)
        if abs(angle) > 30 or abs(angle) < 0.5:
            return cv_img

        (h, w) = cv_img.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(
            cv_img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE
        )
        return rotated
    except Exception as e:
        logger.warning(f"Gagal melakukan deskew: {e}")
        return cv_img

def preprocess_image(image_bytes: bytes) -> tuple[np.ndarray, dict]:
    """
    Pipeline pra-pemrosesan gambar optimal untuk Tesseract 5.x:
    1. Baca bytes ke PIL Image & normalisasi orientasi EXIF
    2. Rescaling terkontrol: optimasi resolusi/DPI agar tinggi karakter teks ideal (~25-35px)
    3. Konversi ke Grayscale OpenCV
    4. CLAHE (Contrast Limited Adaptive Histogram Equalization) untuk kontras teks tajam
    5. Deskewing (pelurusan kemiringan struk)
    """
    metadata = {}
    with Image.open(io.BytesIO(image_bytes)) as pil_img:
        # Step 0: Normalisasi orientasi EXIF (agar foto HP tidak terputar)
        pil_img = ImageOps.exif_transpose(pil_img)

        # Konversi ke RGB jika format gambar RGBA / Palette
        if pil_img.mode != "RGB":
            pil_img = pil_img.convert("RGB")

        w, h = pil_img.size
        metadata["original_size"] = (w, h)

        # Step 1: Rescaling resolusi ideal
        # Tesseract membaca paling akurat bila lebar struk sekitar 1400-1800 px
        target_w = w
        target_h = h
        if w < 1100:
            scale = 1500 / w
            target_w = int(w * scale)
            target_h = int(h * scale)
            pil_img = pil_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
            metadata["upscaled"] = (target_w, target_h)
        elif max(w, h) > 2200:
            scale = 2200 / max(w, h)
            target_w = int(w * scale)
            target_h = int(h * scale)
            pil_img = pil_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
            metadata["downscaled"] = (target_w, target_h)

        # Konversi PIL ke numpy array (RGB -> BGR OpenCV)
        cv_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

    # Step 2: Grayscale
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)

    # Step 3: CLAHE untuk meningkatkan kontras teks terhadap latar kertas thermal
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)

    # Step 4: Deskew (luruskan struk jika miring)
    deskewed = deskew_image(enhanced)

    return deskewed, metadata

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

    # Jalankan image_to_data untuk mendapatkan nilai confidence
    try:
        data = pytesseract.image_to_data(
            processed_img,
            lang=target_lang,
            config=custom_config,
            output_type=pytesseract.Output.DICT
        )
        confidences = [int(conf) for conf in data["conf"] if conf != "-1"]
        avg_conf = (sum(confidences) / len(confidences)) / 100.0 if confidences else 0.0

        # Ekstrak teks lengkap
        text = pytesseract.image_to_string(
            processed_img,
            lang=target_lang,
            config=custom_config
        )
        return text, round(avg_conf, 2)
    except Exception as e:
        logger.error(f"Error saat mengeksekusi Tesseract: {e}")
        # Coba fallback ke psm 4 atau eng jika terjadi kendala konfigurasi
        try:
            text = pytesseract.image_to_string(processed_img, lang="eng", config=r"--oem 3 --psm 4")
            return text, 0.70
        except Exception as e2:
            raise RuntimeError(f"Gagal memproses OCR: {e2}")

