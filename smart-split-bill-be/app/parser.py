import re
from typing import List, Optional
from pydantic import BaseModel, Field

class ReceiptItem(BaseModel):
    name: str = Field(..., description="Nama pesanan/item")
    qty: int = Field(1, description="Kuantitas item")
    unit_price: int = Field(0, description="Harga satuan dalam Rupiah")
    line_total: int = Field(0, description="Total harga baris dalam Rupiah")
    discount: int = Field(0, description="Diskon khusus item (Rupiah)")

class ReceiptParseResponse(BaseModel):
    items: List[ReceiptItem] = Field(default_factory=list)
    subtotal: int = 0
    tax: int = 0
    service_charge: int = 0
    discount: int = 0
    total: int = 0
    confidence: float = 0.0
    warnings: List[str] = Field(default_factory=list)

def clean_currency_str(val: str) -> Optional[int]:
    """
    Mengubah representasi string uang (contoh: '28.000', 'Rp 28,000.00', '15000')
    menjadi integer Rupiah bulat.
    """
    if not val:
        return None
    cleaned = re.sub(r"[^\d,\.]", "", val)
    if not cleaned:
        return None

    # Tangani kasus desimal seperti 28.000,00 atau 28,000.00
    if re.search(r"[,\.]\d{2}$", cleaned):
        cleaned = cleaned[:-3]

    # Bersihkan pemisah ribuan (. atau ,)
    cleaned = re.sub(r"[,\.]", "", cleaned)
    try:
        return int(cleaned)
    except ValueError:
        return None

def strip_barcode_and_sku(text: str) -> str:
    """
    Menghapus kode barcode/PLU/SKU panjang di awal baris produk swalayan.
    Contoh: '8992388123456 INDOMIE GOR' -> 'INDOMIE GOR'
    """
    cleaned = re.sub(r"^\s*\d{6,14}\s+", "", text)
    cleaned = re.sub(r"^\s*plu\s*\d+\s+", "", cleaned, flags=re.IGNORECASE)
    return cleaned.strip()

def parse_receipt_text(raw_text: str, confidence: float = 0.85) -> ReceiptParseResponse:
    """
    Parser cerdas multi-line untuk struk restoran, kafe, maupun swalayan/minimarket (Indomaret/Alfamart).
    Mendukung format 1-baris dan format 2-baris (Nama di atas, Qty & Harga di bawah).
    """
    raw_lines = [line.strip() for line in raw_text.split("\n") if line.strip()]
    items: List[ReceiptItem] = []
    warnings: List[str] = []

    subtotal = 0
    tax = 0
    service_charge = 0
    discount = 0
    total = 0

    # Kata kunci rekapitulasi / total
    tax_keywords = ["tax", "pajak", "pb1", "ppn", "vat"]
    service_keywords = ["service", "sc", "layanan", "srvc"]
    discount_keywords = ["disc", "discount", "potongan", "hemat", "promo", "voucher", "diskon"]
    subtotal_keywords = ["subtotal", "sub total", "sub-total", "jumlah belanja", "total item"]
    total_keywords = ["total", "grand total", "total bayar", "amount due", "netto", "total belanja", "total akhir"]

    # Kata kunci transaksi pembayaran / non-produk (DIABAIKAN agar tidak dikira nama barang)
    payment_and_meta_keywords = [
        "tunai", "cash", "kembali", "kembalian", "change", "debit", "qris",
        "kartu", "card", "bca", "mandiri", "bni", "bri", "cimb", "gopay", "ovo",
        "shopeepay", "dana", "dpp", "ppn 11%", "faktur", "nomor faktur", "no. trans",
        "kasir", "cashier", "operator", "pos", "terminal", "meja", "table",
        "jl.", "jalan", "telp", "phone", "terima kasih", "thank you", "kunjungan",
        "member", "point", "poin", "promo berhadiah", "pax", "guest", "npwp",
        "struk ini", "barang yang sudah", "rekening", "auth", "approval", "trace",
        "batch", "reff", "tid", "mid", "apra", "aid",
        # Footer info non-produk
        "wifi", "password", "pw:", "ssid", "hotspot", "instagram", "ig:", "wa:",
        "whatsapp", "website", "http", "www.", ".com", "order #", "no. meja",
        "no order", "no. order", "invoice", "receipt", "tanggal", "jam",
        "harga termasuk", "harga sudah", "telah diperiksa", "dicetak",
        "powered by", "verified", "signature",
    ]

    money_pattern = r"(?:rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d+)"

    # Pre-filter baris garis pembatas dan baris noise
    clean_lines = []
    for line in raw_lines:
        if re.match(r"^[-=_*~.]{3,}$", line):
            continue
        # Skip baris yang terlalu pendek atau hampir semua simbol (misal: "| |", "> i", "~~~")
        alpha_num_count = len(re.findall(r"[a-zA-Z0-9]", line))
        if alpha_num_count < 3:
            continue
        clean_lines.append(line)

    idx = 0
    while idx < len(clean_lines):
        line = clean_lines[idx]
        line_lower = line.lower()

        # 1. Pengecekan Pajak
        if any(kw in line_lower for kw in tax_keywords) and not any(kw in line_lower for kw in ["include", "termasuk"]):
            matches = list(re.finditer(money_pattern, line_lower))
            if matches:
                val = clean_currency_str(matches[-1].group(0))
                if val is not None and val < 50_000_000:
                    tax = val
            idx += 1
            continue

        # 2. Pengecekan Service Charge
        if any(kw in line_lower for kw in service_keywords):
            matches = list(re.finditer(money_pattern, line_lower))
            if matches:
                val = clean_currency_str(matches[-1].group(0))
                if val is not None:
                    service_charge = val
            idx += 1
            continue

        # 3. Pengecekan Diskon Struk / Global
        if any(kw in line_lower for kw in discount_keywords) and not any(kw in line_lower for kw in ["item", "menu"]):
            matches = list(re.finditer(money_pattern, line_lower))
            if matches:
                val = clean_currency_str(matches[-1].group(0))
                if val is not None:
                    discount = abs(val)
            idx += 1
            continue

        # 4. Pengecekan Subtotal
        if any(kw in line_lower for kw in subtotal_keywords) and not any(kw in line_lower for kw in total_keywords):
            matches = list(re.finditer(money_pattern, line_lower))
            if matches:
                val = clean_currency_str(matches[-1].group(0))
                if val is not None:
                    subtotal = val
            idx += 1
            continue

        # 5. Pengecekan Grand Total
        if any(kw in line_lower for kw in total_keywords) and not any(kw in line_lower for kw in ["item", "qty", "kembali"]):
            matches = list(re.finditer(money_pattern, line_lower))
            if matches:
                val = clean_currency_str(matches[-1].group(0))
                if val is not None:
                    total = val
            idx += 1
            continue

        # 6. Abaikan baris pembayaran / transaksi kasir / nomor NPWP / perizinan
        is_payment_line = any(kw in line_lower for kw in payment_and_meta_keywords)
        has_tax_id_pattern = bool(re.search(r"\d{2}[.,]\d{3}[.,]\d{3}", line))
        # Nomor telepon format 0xx-xxxxxxx atau (0xx) xxxxxxx (hanya angka+tanda, tanpa huruf produk)
        is_phone_number = bool(re.match(r"^\(?\d{2,4}\)?[-.\s]\d{3,8}[-.\s]?\d{0,6}$", line.strip()))
        # Baris hanya berisi kode/nomor tanpa nama produk (mis: "021-8812345" atau "ID: 00123")
        alpha_only = re.sub(r"[^a-zA-Z]", "", line)
        is_code_only_line = len(alpha_only) <= 2 and bool(re.search(r"\d{4,}", line))

        food_keywords = ["kopi", "teh", "nasi", "mie", "roti", "ayam", "susu", "aqua",
                         "choc", "mineral", "snack", "minu", "maka", "beras", "gula",
                         "garam", "minyak", "kecap", "saos", "saus", "sabun", "sampo"]

        if (is_payment_line or has_tax_id_pattern or is_phone_number or is_code_only_line) and \
           not any(kw in line_lower for kw in food_keywords):
            idx += 1
            continue

        # 7. Cek format 2-baris swalayan (Supermarket / Minimarket):
        # Baris sekarang (idx): Nama produk (contoh: "INDOMILK KENTAL MANIS POUCH 535GR/")
        # Baris berikutnya (idx+1): "2304027  1 PCS x 17,500   17,500" atau "2 PCS @ 3.100  6.200"
        has_price_end = bool(re.search(r"(?:(rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})+|\d{4,9}))\s*$", line_lower))

        if not has_price_end and (idx + 1 < len(clean_lines)):
            next_line = clean_lines[idx + 1].strip()

            # Pisahkan baris kedua menggunakan pemisah 'x', 'X', '*', atau '@'
            split_parts = re.split(r'\s+[xX*@]\s+', next_line, maxsplit=1)
            if len(split_parts) == 2:
                left_part, right_part = split_parts[0], split_parts[1]

                # Qty: ambil angka terakhir sebelum 'x' (mengabaikan kode PLU di awal jika ada)
                qty_candidates = re.findall(r'\b\d{1,3}\b', left_part)
                qty = int(qty_candidates[-1]) if qty_candidates else 1
                if qty <= 0 or qty > 100:
                    qty = 1

                # Harga: cari semua pola nominal rupiah di sebelah kanan 'x'
                price_candidates = re.findall(r'\d{1,3}(?:[.,]\d{3})+|\d{4,9}', right_part)
                if price_candidates:
                    line_total = clean_currency_str(price_candidates[-1]) or 0
                    unit_price = clean_currency_str(price_candidates[0]) if len(price_candidates) > 1 else (line_total // max(1, qty))

                    # Bersihkan nama produk dari barcode depan dan kode rak/batch di belakang
                    prod_name = strip_barcode_and_sku(line)
                    prod_name = re.sub(r"[\/#]\d+.*$", "", prod_name).strip()
                    prod_name = re.sub(r"[\[\]\/\\_~^|]+$", "", prod_name).strip()

                    if len(prod_name) >= 2 and line_total > 0:
                        items.append(ReceiptItem(
                            name=prod_name,
                            qty=qty,
                            unit_price=unit_price if unit_price > 0 else (line_total // max(1, qty)),
                            line_total=line_total,
                            discount=0
                        ))
                        idx += 2  # Sukses mengurai pasangan 2-baris
                        continue

        # 3. Format 1-baris standar:
        # Contoh: "INDOMIE GOR 3.100" atau "2 Nasi Goreng 56.000"
        price_match = re.search(r"(?:(rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})*|\d{4,9}))\s*$", line_lower)
        if price_match:
            has_rp_prefix = bool(price_match.group(1))
            price_str = price_match.group(2)
            has_separator = ("." in price_str) or ("," in price_str)
            line_price = clean_currency_str(price_str)

            if not line_price or line_price <= 0:
                idx += 1
                continue
            # Angka kecil tanpa pemisah ribuan bukan harga (misal nomor meja)
            if line_price < 500 and not (has_rp_prefix or has_separator):
                idx += 1
                continue
            # Angka 4 digit yang merupakan tahun (1900-2099) bukan harga
            if 1900 <= line_price <= 2099 and not has_separator:
                idx += 1
                continue

            desc_part = line[:price_match.start()].strip()
            # Bersihkan barcode jika ada
            desc_part = strip_barcode_and_sku(desc_part)

            if not desc_part or len(desc_part) < 2:
                idx += 1
                continue

            # Abaikan jika desc_part mengandung kata kunci metadata bayar
            if any(kw in desc_part.lower() for kw in payment_and_meta_keywords):
                idx += 1
                continue

            # Ekstrak Qty
            qty = 1
            qty_match_start = re.match(r"^(\d+)\s*(?:x|\*|\s|pcs|btl)\s*(.+)$", desc_part, re.IGNORECASE)
            if qty_match_start:
                qty = int(qty_match_start.group(1))
                item_name = qty_match_start.group(2).strip()
            else:
                qty_match_end = re.search(r"^(.*?)\s+(\d+)\s*(?:x|\*|pcs)?$", desc_part, re.IGNORECASE)
                if qty_match_end and len(qty_match_end.group(1).strip()) > 2:
                    potential_qty = int(qty_match_end.group(2))
                    if 1 <= potential_qty <= 50:
                        qty = potential_qty
                        item_name = qty_match_end.group(1).strip()
                    else:
                        item_name = desc_part
                else:
                    item_name = desc_part

            # Bersihkan simbol & kata satuan di awal/akhir nama produk
            item_name = re.sub(r"^[^\w]+|[^\w]+$", "", item_name).strip()
            item_name = re.sub(r"\s*@\s*$", "", item_name).strip()

            if len(item_name) >= 2:
                unit_price = line_price // max(1, qty)
                items.append(ReceiptItem(
                    name=item_name,
                    qty=qty,
                    unit_price=unit_price,
                    line_total=line_price,
                    discount=0
                ))

        idx += 1

    # Kalkulasi Subtotal jika tidak terdeteksi
    calculated_subtotal = sum(i.line_total for i in items)
    if subtotal == 0:
        subtotal = calculated_subtotal

    # Kalkulasi Total jika tidak terdeteksi
    if total == 0:
        total = subtotal + tax + service_charge - discount

    # Validasi kesesuaian subtotal
    if items and abs(calculated_subtotal - subtotal) > 500:
        warnings.append(
            f"Jumlah item (Rp {calculated_subtotal:,}) berbeda dari subtotal struk (Rp {subtotal:,}). Silakan periksa kembali baris item."
        )

    return ReceiptParseResponse(
        items=items,
        subtotal=subtotal,
        tax=tax,
        service_charge=service_charge,
        discount=discount,
        total=total,
        confidence=confidence,
        warnings=warnings
    )
