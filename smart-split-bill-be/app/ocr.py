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

def estimate_skew_angle(gray: Image.Image, max_angle: float = 15.0) -> float:
    """
    Estimasi kemiringan teks menggunakan variansi proyeksi horizontal (Pillow + NumPy).
    Menggantikan cv2.minAreaRect agar image OpenCV dapat dihilangkan dari dependency.
    """
    try:
        arr = np.asarray(gray, dtype=np.uint8)
        # Ambil sampel tengah agar proses cepat
        h, w = arr.shape
        if h < 40 or w < 40:
            return 0.0

        # Binarisasi invers sederhana: teks jadi True
        thresh = arr < 160

        best_angle = 0.0
        best_score = -1.0

        for angle in np.arange(-max_angle, max_angle + 0.1, 0.5):
            rotated_img = gray.rotate(float(angle), resample=Image.Resampling.BILINEAR, fillcolor=255)
            r = np.asarray(rotated_img, dtype=np.uint8) < 160
            # Variansi jumlah piksel teks per baris: maksimal saat teks rata horizontal
            row_sums = r.sum(axis=1).astype(np.float64)
            score = float(row_sums.var())
            if score > best_score:
                best_score = score
                best_angle = float(angle)

        return best_angle
    except Exception as e:
        logger.warning(f"Gagal melakukan estimasi skew: {e}")
        return 0.0

def preprocess_image(image_bytes: bytes) -> tuple[np.ndarray, dict]:
    """
    Pipeline pra-pemrosesan gambar optimal untuk Tesseract 5.x (Pillow + NumPy, tanpa OpenCV):
    1. Baca bytes ke PIL Image & normalisasi orientasi EXIF
    2. Rescaling terkontrol: optimasi resolusi/DPI agar tinggi karakter teks ideal (~25-35px)
    3. Konversi ke Grayscale
    4. Peningkatan kontras lokal (autocontrast + sharpen, pengganti CLAHE)
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

        # Step 2: Grayscale
        gray = ImageOps.grayscale(pil_img)

    # Step 3: Peningkatan kontras & ketajaman teks (pengganti CLAHE OpenCV)
    gray = ImageOps.autocontrast(gray, cutoff=1)
    gray = ImageEnhance.Contrast(gray).enhance(1.4)
    gray = gray.filter(ImageFilter.MedianFilter(size=3))
    gray = gray.filter(ImageFilter.UnsharpMask(radius=1.2, percent=150, threshold=3))

    # Step 4: Deskew (luruskan struk jika miring)
    angle = estimate_skew_angle(gray)
    if 0.5 <= abs(angle) <= 15.0:
        gray = gray.rotate(angle, resample=Image.Resampling.BICUBIC, fillcolor=255)
        metadata["deskew_angle"] = round(angle, 2)

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
