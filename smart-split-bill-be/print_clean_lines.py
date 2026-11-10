from app.ocr import detect_and_configure_tesseract, preprocess_image
import pytesseract

detect_and_configure_tesseract()
img_path = r'C:/Users/Asus/.gemini/antigravity/brain/e8567e0b-e268-407b-95d0-a6408bcabf1b/.user_uploaded/media_1794243124389_ec50ade9.jpg'
raw_bytes = open(img_path, 'rb').read()
p_img, _ = preprocess_image(raw_bytes)
text = pytesseract.image_to_string(p_img, lang='ind+eng', config='--psm 6')

lines = [l.strip() for l in text.split('\n') if l.strip()]
for idx, l in enumerate(lines):
    print(f"[{idx}] {l}")

