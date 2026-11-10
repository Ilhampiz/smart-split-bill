from app.parser import parse_receipt_text, clean_currency_str

def test_clean_currency_str():
    assert clean_currency_str("28.000") == 28000
    assert clean_currency_str("Rp 28,000.00") == 28000
    assert clean_currency_str("15000") == 15000
    assert clean_currency_str("Rp. 5.500") == 5500
    assert clean_currency_str("") is None
    assert clean_currency_str("abc") is None

def test_parse_receipt_text():
    sample_text = """
    WARUNG KOPI DEMO
    Jl. Kenanga No. 12
    -----------------------
    2 Nasi Goreng Spesial 56.000
    3 Es Teh Manis 18.000
    1 Kentang Goreng 15.000
    -----------------------
    Subtotal: 89.000
    PB1 10%: 8.900
    Service Charge: 4.450
    Diskon Promo: 5.000
    Total: 97.350
    """
    result = parse_receipt_text(sample_text)
    assert len(result.items) == 3
    assert result.items[0].name == "Nasi Goreng Spesial"
    assert result.items[0].qty == 2
    assert result.items[0].unit_price == 28000
    assert result.items[0].line_total == 56000

    assert result.items[1].name == "Es Teh Manis"
    assert result.items[1].qty == 3
    assert result.items[1].unit_price == 6000
    assert result.items[1].line_total == 18000

    assert result.subtotal == 89000
    assert result.tax == 8900
    assert result.service_charge == 4450
    assert result.discount == 5000
    assert result.total == 97350

if __name__ == "__main__":
    test_clean_currency_str()
    test_parse_receipt_text()
    print("All backend parser tests passed successfully!")

