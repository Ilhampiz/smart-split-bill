import io
from app.main import validate_magic_bytes
from fastapi import HTTPException
from PIL import Image

def test_magic_bytes_jpeg():
    img = Image.new("RGB", (10, 10), color="white")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    mime = validate_magic_bytes(buf.getvalue())
    assert mime == "image/jpeg"

def test_magic_bytes_png():
    img = Image.new("RGB", (10, 10), color="blue")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    mime = validate_magic_bytes(buf.getvalue())
    assert mime == "image/png"

def test_magic_bytes_invalid():
    fake = b"plain text data"
    try:
        validate_magic_bytes(fake)
        assert False, "Should have raised HTTPException 415"
    except HTTPException as e:
        assert e.status_code == 415

if __name__ == "__main__":
    test_magic_bytes_jpeg()
    test_magic_bytes_png()
    test_magic_bytes_invalid()
    print("All backend validation tests passed successfully!")
