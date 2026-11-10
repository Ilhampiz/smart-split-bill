from app.parser import parse_receipt_text
from app.ocr import detect_and_configure_tesseract, preprocess_image
import pytesseract

detect_and_configure_tesseract()
img_path = r'C:/Users/Asus/.gemini/antigravity/brain/e8567e0b-e268-407b-95d0-a6408bcabf1b/.user_uploaded/media_1794243124389_ec50ade9.jpg'
raw_bytes = open(img_path, 'rb').read()
p_img, _ = preprocess_image(raw_bytes)
text = pytesseract.image_to_string(p_img, lang='ind+eng', config='--psm 6')

res = parse_receipt_text(text)
print(f"=== TOTAL ITEMS PARSED: {len(res.items)} ===")
for it in res.items:
    print(f"-> {it.qty}x '{it.name}' : Rp {it.line_total:,}")
print("Subtotal:", res.subtotal)
print("Tax:", res.tax)
print("Total:", res.total)

