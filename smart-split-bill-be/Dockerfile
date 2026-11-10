FROM python:3.12-slim

# Instal Tesseract OCR & paket bahasa Indonesia + Inggris
RUN apt-get update && apt-get install -y --no-install-recommends \
        tesseract-ocr tesseract-ocr-ind tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*

# Berkas sementara diarahkan ke tmpfs (RAM)
ENV TMPDIR=/dev/shm \
    PYTHONUNBUFFERED=1

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app/ ./app/

# Jalankan sebagai non-root
RUN useradd -m appuser
USER appuser

EXPOSE 8000

# --proxy-headers & --forwarded-allow-ips agar IP asli terbaca di belakang reverse proxy Render
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]