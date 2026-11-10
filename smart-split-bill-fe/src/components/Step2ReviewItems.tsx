import { useState, type FormEvent } from 'react';
import { useBillStore } from '../store/useBillStore';
import { Plus, X, ArrowLeft, ArrowRight, AlertTriangle, Tag } from './icons';

export const Step2ReviewItems = () => {
  const {
    items,
    tax,
    serviceCharge,
    discount,
    confidence,
    warnings,
    updateItem,
    removeItem,
    addItem,
    updateBillSummary,
    setStep,
  } = useBillStore();

  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState<number | ''>('');
  const [newItemDiscount, setNewItemDiscount] = useState<number | ''>('');

  // Mode [Rp | %] untuk Pajak, Service, dan Diskon
  const [taxMode, setTaxMode] = useState<'rp' | 'percent'>('rp');
  const [taxPercent, setTaxPercent] = useState<number | ''>('');

  const [serviceMode, setServiceMode] = useState<'rp' | 'percent'>('rp');
  const [servicePercent, setServicePercent] = useState<number | ''>('');

  const [discountMode, setDiscountMode] = useState<'rp' | 'percent'>('rp');
  const [discountPercent, setDiscountPercent] = useState<number | ''>('');

  const handleAddNewItem = (e: FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice || Number(newItemPrice) <= 0) return;

    addItem({
      name: newItemName.trim(),
      qty: newItemQty,
      unit_price: Number(newItemPrice),
      line_total: newItemQty * Number(newItemPrice),
      discount: Number(newItemDiscount) || 0,
    });

    setNewItemName('');
    setNewItemQty(1);
    setNewItemPrice('');
    setNewItemDiscount('');
  };

  const calculatedSubtotal = items.reduce(
    (acc, it) => acc + Math.max(0, it.line_total - (it.discount || 0)),
    0
  );
  const calculatedGrandTotal = Math.max(0, calculatedSubtotal + tax + serviceCharge - discount);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header & Quality Metric */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
            Verifikasi & Koreksi Pos Transaksi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pastikan nama item, kuantitas, dan nilai harga sesuai dengan bukti pembayaran fisik.
          </p>
        </div>
        {confidence < 0.7 && items.length > 0 && (
          <span className="self-start sm:self-auto text-[11px] font-medium px-2.5 py-1 bg-amber-50 text-amber-800 rounded-md border border-amber-200">
            Skor Keyakinan OCR: {Math.round(confidence * 100)}%
          </span>
        )}
      </div>

      {/* Warnings Banner */}
      {warnings.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
          {warnings.map((w, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Data Table of Items */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden mb-6">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 grid grid-cols-12 gap-2 text-xs font-semibold text-slate-600">
          <div className="col-span-6">Nama Pesanan / Deskripsi</div>
          <div className="col-span-2 text-center">Kuantitas</div>
          <div className="col-span-3 text-right">Total (Rp)</div>
          <div className="col-span-1 text-center" aria-label="Aksi"></div>
        </div>

        <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-xs">
              Belum ada baris item. Gunakan formulir di bawah untuk menambah data manual.
            </div>
          ) : (
            items.map((it) => {
              const itemDiscount = it.discount || 0;
              const netPrice = Math.max(0, it.line_total - itemDiscount);

              return (
                <div key={it.id} className="p-3 text-xs hover:bg-slate-50/40 transition">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6">
                      <input
                        type="text"
                        value={it.name}
                        aria-label="Nama item"
                        onChange={(e) => updateItem(it.id, { name: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-slate-900 font-medium"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        value={it.qty}
                        aria-label="Kuantitas"
                        onChange={(e) =>
                          updateItem(it.id, { qty: Math.max(1, parseInt(e.target.value) || 1) })
                        }
                        className="w-full px-2 py-1.5 rounded-md border border-slate-200 text-center focus:border-slate-900 outline-none font-medium text-slate-800"
                      />
                    </div>
                    <div className="col-span-3">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-medium">
                          Rp
                        </span>
                        <input
                          type="number"
                          step="500"
                          value={it.line_total}
                          aria-label="Harga total item"
                          onChange={(e) => {
                            const newTotal = parseInt(e.target.value) || 0;
                            updateItem(it.id, {
                              line_total: newTotal,
                              unit_price: Math.round(newTotal / it.qty),
                            });
                          }}
                          className="w-full pl-8 pr-2.5 py-1.5 rounded-md border border-slate-200 text-right font-semibold text-slate-900 focus:border-slate-900 outline-none"
                        />
                      </div>
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(it.id)}
                        className="text-slate-400 hover:text-rose-600 transition p-1 rounded hover:bg-slate-100"
                        title="Hapus baris item"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Item-level Discount Input */}
                  <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <Tag size={12} className="text-slate-400" />
                        <span>Diskon Item:</span>
                      </span>
                      <div className="relative w-28">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                          Rp
                        </span>
                        <input
                          type="number"
                          step="500"
                          placeholder="0"
                          value={itemDiscount || ''}
                          onChange={(e) => {
                            const disc = Math.max(0, parseInt(e.target.value) || 0);
                            updateItem(it.id, { discount: disc });
                          }}
                          className="w-full pl-7 pr-2 py-1 rounded border border-slate-200 text-right font-medium text-emerald-700 focus:border-slate-900 outline-none bg-white text-xs"
                        />
                      </div>
                      {itemDiscount > 0 && (
                        <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
                          Hemat Rp {itemDiscount.toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 text-[10px]">Nilai Bersih: </span>
                      <span className="font-semibold text-slate-900 text-xs">
                        Rp {netPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add New Line Form */}
        <form
          onSubmit={handleAddNewItem}
          className="p-3 bg-slate-50 border-t border-slate-200 grid grid-cols-12 gap-2 items-center"
        >
          <div className="col-span-6">
            <input
              type="text"
              placeholder="Tambah nama item..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs focus:border-slate-900 outline-none bg-white font-medium"
            />
          </div>
          <div className="col-span-2">
            <input
              type="number"
              min="1"
              value={newItemQty}
              onChange={(e) => setNewItemQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-2 py-1.5 rounded-md border border-slate-300 text-xs text-center focus:border-slate-900 outline-none bg-white font-medium"
            />
          </div>
          <div className="col-span-3">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]">
                Rp
              </span>
              <input
                type="number"
                placeholder="Harga"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full pl-8 pr-2.5 py-1.5 rounded-md border border-slate-300 text-xs text-right font-medium focus:border-slate-900 outline-none bg-white"
              />
            </div>
          </div>
          <div className="col-span-1 text-center">
            <button
              type="submit"
              disabled={!newItemName.trim() || !newItemPrice}
              className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-white rounded-md text-xs font-medium transition flex items-center justify-center"
              title="Tambah baris"
            >
              <Plus size={14} />
            </button>
          </div>
        </form>
      </div>

      {/* Additional Costs Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-2xs">
        <h3 className="text-xs font-semibold text-slate-700 tracking-tight mb-3">
          Penyesuaian Biaya Tambahan (Pajak, Layanan, Diskon)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Pajak */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-slate-700 font-medium text-[11px]">Pajak (PB1 / PPN)</label>
              <div className="inline-flex rounded border border-slate-200 bg-white p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setTaxMode('rp')}
                  className={`px-1.5 py-0.5 rounded font-semibold transition ${
                    taxMode === 'rp' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Rp
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTaxMode('percent');
                    if (tax > 0 && calculatedSubtotal > 0 && taxPercent === '') {
                      setTaxPercent(Number(((tax / calculatedSubtotal) * 100).toFixed(1)));
                    }
                  }}
                  className={`px-1.5 py-0.5 rounded font-semibold transition ${
                    taxMode === 'percent' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  %
                </button>
              </div>
            </div>

            {taxMode === 'rp' ? (
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]">
                  Rp
                </span>
                <input
                  type="number"
                  value={tax}
                  onChange={(e) =>
                    updateBillSummary({ tax: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-md border border-slate-200 font-semibold text-slate-900 text-right focus:border-slate-900 outline-none bg-white"
                />
              </div>
            ) : (
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  placeholder="Misal 10"
                  value={taxPercent}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setTaxPercent(val);
                    const calcVal = typeof val === 'number' ? Math.round((calculatedSubtotal * val) / 100) : 0;
                    updateBillSummary({ tax: calcVal });
                  }}
                  className="w-full pl-3 pr-7 py-1.5 rounded-md border border-slate-200 font-semibold text-slate-900 text-right focus:border-slate-900 outline-none bg-white"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-semibold">
                  %
                </span>
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-1.5 text-right font-medium">
              {taxMode === 'percent'
                ? `≈ Rp ${tax.toLocaleString('id-ID')}`
                : calculatedSubtotal > 0
                ? `≈ ${((tax / calculatedSubtotal) * 100).toFixed(1)}%`
                : ''}
            </p>
          </div>

          {/* Service Charge */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-slate-700 font-medium text-[11px]">Biaya Layanan</label>
              <div className="inline-flex rounded border border-slate-200 bg-white p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setServiceMode('rp')}
                  className={`px-1.5 py-0.5 rounded font-semibold transition ${
                    serviceMode === 'rp' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Rp
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setServiceMode('percent');
                    if (serviceCharge > 0 && calculatedSubtotal > 0 && servicePercent === '') {
                      setServicePercent(Number(((serviceCharge / calculatedSubtotal) * 100).toFixed(1)));
                    }
                  }}
                  className={`px-1.5 py-0.5 rounded font-semibold transition ${
                    serviceMode === 'percent' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  %
                </button>
              </div>
            </div>

            {serviceMode === 'rp' ? (
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]">
                  Rp
                </span>
                <input
                  type="number"
                  value={serviceCharge}
                  onChange={(e) =>
                    updateBillSummary({
                      serviceCharge: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-md border border-slate-200 font-semibold text-slate-900 text-right focus:border-slate-900 outline-none bg-white"
                />
              </div>
            ) : (
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  placeholder="Misal 5"
                  value={servicePercent}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setServicePercent(val);
                    const calcVal = typeof val === 'number' ? Math.round((calculatedSubtotal * val) / 100) : 0;
                    updateBillSummary({ serviceCharge: calcVal });
                  }}
                  className="w-full pl-3 pr-7 py-1.5 rounded-md border border-slate-200 font-semibold text-slate-900 text-right focus:border-slate-900 outline-none bg-white"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-semibold">
                  %
                </span>
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-1.5 text-right font-medium">
              {serviceMode === 'percent'
                ? `≈ Rp ${serviceCharge.toLocaleString('id-ID')}`
                : calculatedSubtotal > 0
                ? `≈ ${((serviceCharge / calculatedSubtotal) * 100).toFixed(1)}%`
                : ''}
            </p>
          </div>

          {/* Diskon Struk */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-slate-700 font-medium text-[11px]">Diskon / Voucher</label>
              <div className="inline-flex rounded border border-slate-200 bg-white p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setDiscountMode('rp')}
                  className={`px-1.5 py-0.5 rounded font-semibold transition ${
                    discountMode === 'rp' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Rp
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDiscountMode('percent');
                    if (discount > 0 && calculatedSubtotal > 0 && discountPercent === '') {
                      setDiscountPercent(Number(((discount / calculatedSubtotal) * 100).toFixed(1)));
                    }
                  }}
                  className={`px-1.5 py-0.5 rounded font-semibold transition ${
                    discountMode === 'percent' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  %
                </button>
              </div>
            </div>

            {discountMode === 'rp' ? (
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]">
                  Rp
                </span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) =>
                    updateBillSummary({
                      discount: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-md border border-slate-200 font-semibold text-emerald-700 text-right focus:border-slate-900 outline-none bg-white"
                />
              </div>
            ) : (
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  placeholder="Misal 20"
                  value={discountPercent}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setDiscountPercent(val);
                    const calcVal = typeof val === 'number' ? Math.round((calculatedSubtotal * val) / 100) : 0;
                    updateBillSummary({ discount: calcVal });
                  }}
                  className="w-full pl-3 pr-7 py-1.5 rounded-md border border-slate-200 font-semibold text-emerald-700 text-right focus:border-slate-900 outline-none bg-white"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-semibold">
                  %
                </span>
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-1.5 text-right font-medium">
              {discountMode === 'percent'
                ? `≈ -Rp ${discount.toLocaleString('id-ID')}`
                : calculatedSubtotal > 0
                ? `≈ ${((discount / calculatedSubtotal) * 100).toFixed(1)}%`
                : ''}
            </p>
          </div>
        </div>

        {/* Financial Summary Strip */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500">Subtotal Item Bersih: </span>
            <span className="font-semibold text-slate-800">
              Rp {calculatedSubtotal.toLocaleString('id-ID')}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Total Tagihan: </span>
            <span className="font-bold text-slate-900 text-sm">
              Rp {calculatedGrandTotal.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft size={14} />
          <span>Foto Ulang</span>
        </button>
        <button
          type="button"
          disabled={items.length === 0}
          onClick={() => {
            updateBillSummary({ total: calculatedGrandTotal });
            setStep(3);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold shadow-xs transition"
        >
          <span>Lanjut Bagi Peserta</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
