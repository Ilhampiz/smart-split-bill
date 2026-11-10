"""
Test parser untuk struk Indomaret dan Alfamart.
Format realistis berdasarkan struk asli yang beredar.
"""
import sys
sys.path.insert(0, ".")
from app.parser import parse_receipt_text

# ============================================================
# FORMAT INDOMARET (1-baris: Nama  Qty  Harga  Total)
# ============================================================
indomaret_ocr = """
INDOMARET
Jl. Raya Pahlawan No. 12
Telp. 024-7612345
No. Trans : 00123/INM/26
Kasir     : SARI
Tanggal   : 09-11-2026 20:30

NAMA BARANG            QTY    HARGA  TOTAL
Indomie Goreng Spesial   2    3,500  7,000
Aqua Botol 600ml         3    4,000 12,000
Ultra Milk Full Cream    1   16,500 16,500
Teh Botol Sosro          2    5,000 10,000
Chitato Rasa Sapi        1   12,000 12,000
Susu Bear Brand          2   10,000 20,000
Roti Tawar Sari Roti     1   16,000 16,000
-------------------------------------------
Sub Total               :            93,500
Diskon Member           :            -5,000
PPN                     :             7,000
TOTAL                   :            95,500
Tunai                   :           100,000
Kembali                 :             4,500
-------------------------------------------
Terima Kasih
"""

# ============================================================
# FORMAT ALFAMART (campuran: beberapa 1-baris, beberapa 2-baris)
# ============================================================
alfamart_ocr = """
ALFAMART
Jl. Pemuda No. 5, Semarang
021-8812345
Kasir: BUDI    Meja: -
Struk: ALF/0092/26

PRODUK                  JML    HARGA    TOTAL
Mie Sedaap Goreng         2    2,900    5,800
Pocari Sweat 500ml
8886010100481  1 PCS x 9,500    9,500
Chitato Rumput Laut
8991101170004  2 PCS x 11,000   22,000
Nabati Richeese          1    6,500    6,500
ABC Sardines 155gr
8999999024516  3 PCS x 8,500   25,500
Good Day Cappuccino       1    4,500    4,500
-----------------------------------------
SUBTOTAL                           73,800
Disc. Promo              :         -3,000
TOTAL BELANJA            :         70,800
TUNAI                    :         75,000
KEMBALIAN                :          4,200
-----------------------------------------
www.alfamart.co.id
Member ID: 0812-3456-7890
Point: 70
"""

# ============================================================
# FORMAT INDOMARET DENGAN KODE BARCODE (2-baris)
# ============================================================
indomaret_barcode_ocr = """
INDOMARET PLUS
Jl. Diponegoro 100, Bandung
Telp 022-7123456
No.Nota: IND-20261109-0088
Kasir: DEWI

Tolak Angin Cair Sido Muncul
3302001004018  1 PCS x 25,000   25,000
Bango Kecap Manis 135ml
8999999008003  2 PCS x 12,500   25,000
Lifebuoy Sabun Mandi 110gr
8710447227046  3 PCS x  5,500   16,500
Pepsodent Pasta Gigi 190gr
8999999109283  1 PCS x 16,000   16,000
So Klin Lantai Cemara 800ml
8999999119824  1 PCS x 24,500   24,500
--------------------------------------
Subtotal                          107,000
PPN 11%                            11,770
TOTAL                             118,770
DEBIT BCA                         118,770
Auth: 087654
Terima Kasih, Selamat Belanja!
"""

def run_test(name, ocr_text, expected_items, expected_total=None):
    print(f"\n{'='*60}")
    print(f"TEST: {name}")
    print(f"{'='*60}")
    
    result = parse_receipt_text(ocr_text)
    
    print(f"Items terdeteksi ({len(result.items)}):")
    for item in result.items:
        print(f"  ✓ {item.qty}x '{item.name}' = Rp {item.line_total:,}")
    
    print(f"\nSubtotal : Rp {result.subtotal:,}")
    print(f"Pajak    : Rp {result.tax:,}")
    print(f"Diskon   : Rp {result.discount:,}")
    print(f"Total    : Rp {result.total:,}")
    
    if result.warnings:
        print(f"Warnings : {result.warnings}")
    
    errors = []
    
    # Cek item count
    if len(result.items) != expected_items:
        errors.append(f"❌ Item count: got {len(result.items)}, expected {expected_items}")
    else:
        print(f"\n✅ Item count tepat: {len(result.items)}")
    
    # Cek tidak ada item noise
    noise_patterns = ["tunai", "kembali", "cash", "kembalian", "total", "subtotal",
                      "kasir", "terima", "auth", "struk", "member", "point", "www",
                      "telp", "no.", "tanggal", "debit"]
    noise_items = [i for i in result.items 
                   if any(n in i.name.lower() for n in noise_patterns)]
    if noise_items:
        errors.append(f"❌ Item noise terdeteksi: {[i.name for i in noise_items]}")
    else:
        print(f"✅ Tidak ada item noise/metadata")
    
    # Cek harga tahun (2026 dst)
    year_items = [i for i in result.items if 1900 <= i.line_total <= 2099]
    if year_items:
        errors.append(f"❌ Item dengan harga tahun: {[(i.name, i.line_total) for i in year_items]}")
    else:
        print(f"✅ Tidak ada item dengan harga berupa tahun")
    
    # Cek item dengan nama terlalu pendek atau noise
    short_items = [i for i in result.items if len(i.name) < 3]
    if short_items:
        errors.append(f"❌ Item nama terlalu pendek: {[i.name for i in short_items]}")
    else:
        print(f"✅ Semua nama item cukup panjang")
    
    # Cek total jika diberikan
    if expected_total and result.total != expected_total:
        errors.append(f"❌ Total: got Rp {result.total:,}, expected Rp {expected_total:,}")
    elif expected_total:
        print(f"✅ Total tepat: Rp {result.total:,}")
    
    if errors:
        print(f"\n{'!'*40}")
        for e in errors:
            print(f"  {e}")
        return False
    else:
        print(f"\n🎉 SEMUA TEST LULUS untuk {name}")
        return True

# Jalankan semua test
results = []
results.append(run_test(
    "Indomaret (format 1-baris kolom)",
    indomaret_ocr,
    expected_items=7,
    expected_total=95500
))

results.append(run_test(
    "Alfamart (campuran 1-baris & 2-baris)",
    alfamart_ocr,
    expected_items=6,
    expected_total=70800
))

results.append(run_test(
    "Indomaret Plus (format 2-baris dengan barcode)",
    indomaret_barcode_ocr,
    expected_items=5,
    expected_total=118770
))

print(f"\n{'='*60}")
passed = sum(results)
print(f"RINGKASAN: {passed}/{len(results)} test lulus")
if passed == len(results):
    print("✅ Semua minimarket receipt format berhasil!")
else:
    print("⚠️  Ada format yang masih perlu diperbaiki")
print(f"{'='*60}")

sys.exit(0 if passed == len(results) else 1)

