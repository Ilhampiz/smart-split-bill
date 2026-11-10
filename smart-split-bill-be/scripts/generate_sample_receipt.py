"""
Script Pembuat Gambar Struk Kafe Sintetis untuk Demo & Pengujian (PRD Lampiran 8.5)
Menghasilkan gambar JPG berpenampilan kertas struk thermal kafe.
"""

import os
from PIL import Image, ImageDraw, ImageFont

def generate_sample_receipt(output_path="demo_receipts/sample_struk_cafe.jpg"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Ukuran kertas struk thermal khas (lebar 550px)
    width = 500
    height = 700

    # Background kertas agak abu-abu thermal dengan tekstur bersih
    img = Image.new("RGB", (width, height), color="#fcfcfc")
    draw = ImageDraw.Draw(img)

    # Font default sistem (monospace/sans)
    try:
        font_title = ImageFont.truetype("arial.ttf", 22)
        font_header = ImageFont.truetype("arial.ttf", 13)
        font_body = ImageFont.truetype("cour.ttf", 15)  # Courier New (Monospace struk)
        font_bold = ImageFont.truetype("courbd.ttf", 15)
    except Exception:
        font_title = font_header = font_body = font_bold = ImageFont.load_default()

    # Header Toko
    draw.text((width // 2, 40), "KOPI SENJA INDONESIA", fill="#111111", font=font_title, anchor="mt")
    draw.text((width // 2, 70), "Jl. Boulevard No. 88, Jakarta Selatan", fill="#555555", font=font_header, anchor="mt")
    draw.text((width // 2, 90), "Telp: 021-5558899 | Meja: 07", fill="#555555", font=font_header, anchor="mt")

    # Garis Pembatas
    draw.line([(30, 120), (width - 30, 120)], fill="#bbbbbb", width=1)
    draw.text((35, 130), "2026-11-09 20:45   Order #KS-8921", fill="#666666", font=font_header)
    draw.line([(30, 150), (width - 30, 150)], fill="#bbbbbb", width=1)

    # Daftar Item Pesanan
    items = [
        ("2 Nasi Goreng Spesial", "56.000"),
        ("1 Mie Godog Jawa", "26.000"),
        ("2 Es Kopi Susu Aren", "44.000"),
        ("1 Es Teh Manis", "8.000"),
        ("1 Kentang Goreng", "22.000"),
    ]

    y = 170
    for name, price in items:
        draw.text((35, y), name, fill="#111111", font=font_body)
        draw.text((width - 35, y), price, fill="#111111", font=font_body, anchor="ra")
        y += 30

    # Garis Pembatas Ringkasan
    draw.line([(30, y + 10), (width - 30, y + 10)], fill="#bbbbbb", width=1)
    y += 25

    # Rekapitulasi Biaya
    summaries = [
        ("Subtotal", "156.000"),
        ("PB1 Pajak (10%)", "15.600"),
        ("Service Charge (5%)", "7.800"),
        ("Diskon Promo", "-10.000"),
    ]

    for label, val in summaries:
        draw.text((35, y), label, fill="#444444", font=font_body)
        draw.text((width - 35, y), val, fill="#444444", font=font_body, anchor="ra")
        y += 26

    # Grand Total
    draw.line([(30, y + 5), (width - 30, y + 5)], fill="#444444", width=2)
    y += 18
    draw.text((35, y), "TOTAL BAYAR", fill="#111111", font=font_bold)
    draw.text((width - 35, y), "Rp 169.400", fill="#111111", font=font_bold, anchor="ra")

    # Footer
    draw.line([(30, y + 35), (width - 30, y + 35)], fill="#bbbbbb", width=1)
    draw.text((width // 2, y + 55), "Terima Kasih Atas Kunjungan Anda!", fill="#666666", font=font_header, anchor="mt")
    draw.text((width // 2, y + 75), "Password WiFi: kopisenja2026", fill="#888888", font=font_header, anchor="mt")

    img.save(output_path, "JPEG", quality=95)
    print(f"✓ Berhasil membuat sampel struk sintetis di: {output_path}")

if __name__ == "__main__":
    generate_sample_receipt()

