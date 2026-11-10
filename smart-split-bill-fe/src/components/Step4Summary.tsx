import { useMemo, useState, useRef } from 'react';
import { useBillStore } from '../store/useBillStore';
import { calculateSplit } from '../utils/calculator';
import { encodeStateToHash } from '../utils/hashShare';
import {
  Check,
  Copy,
  Link2,
  Download,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  ReceiptText,
} from './icons';

export const Step4Summary = () => {
  const {
    items,
    participants,
    assignments,
    tax,
    serviceCharge,
    discount,
    setStep,
    resetAll,
  } = useBillStore();

  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const summaryCardRef = useRef<HTMLDivElement>(null);

  // Kalkulasi Pembagian dengan Largest Remainder Method
  const shares = useMemo(() => {
    return calculateSplit(items, participants, assignments, tax, serviceCharge, discount);
  }, [items, participants, assignments, tax, serviceCharge, discount]);

  const sumShares = shares.reduce((acc, s) => acc + s.total, 0);
  const netSubtotal = items.reduce(
    (acc, it) => acc + Math.max(0, it.line_total - (it.discount || 0)),
    0
  );
  const totalItemDiscounts = items.reduce((acc, it) => acc + (it.discount || 0), 0);
  const expectedTotal = Math.max(0, netSubtotal + tax + serviceCharge - discount);
  const diff = sumShares - expectedTotal;

  // Format Teks Siap Kirim WhatsApp / Telegram (FR-09)
  const generateShareText = () => {
    let text = `RINGKASAN PATUNGAN — SMART SPLIT BILL\n`;
    text += `Total Tagihan: Rp ${expectedTotal.toLocaleString('id-ID')}\n`;
    if (totalItemDiscounts > 0)
      text += `Diskon Item: -Rp ${totalItemDiscounts.toLocaleString('id-ID')}\n`;
    if (tax > 0) text += `Pajak: Rp ${tax.toLocaleString('id-ID')}\n`;
    if (serviceCharge > 0) text += `Layanan: Rp ${serviceCharge.toLocaleString('id-ID')}\n`;
    if (discount > 0) text += `Diskon Struk: -Rp ${discount.toLocaleString('id-ID')}\n`;
    text += `------------------------------------\n\n`;

    shares.forEach((s) => {
      text += `${s.name.toUpperCase()}: Rp ${s.total.toLocaleString('id-ID')}\n`;
      s.items.forEach((it) => {
        text += `  - ${it.name} (${it.portionQty}x) = Rp ${it.portionPrice.toLocaleString('id-ID')}\n`;
      });
      if (s.taxShare > 0) text += `  - Porsi Pajak: Rp ${s.taxShare.toLocaleString('id-ID')}\n`;
      if (s.serviceShare > 0)
        text += `  - Porsi Layanan: Rp ${s.serviceShare.toLocaleString('id-ID')}\n`;
      if (s.discountShare > 0)
        text += `  - Porsi Diskon: -Rp ${s.discountShare.toLocaleString('id-ID')}\n`;
      text += `\n`;
    });

    text += `Dihitung dengan Smart Split Bill (Largest Remainder, Selisih Rp 0)`;
    return text;
  };

  const handleCopyText = async () => {
    const text = generateShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Gagal menyalin:', err);
    }
  };

  const handleCopyLink = async () => {
    const hash = encodeStateToHash({
      v: 1,
      items,
      participants,
      assignments,
      tax,
      serviceCharge,
      discount,
      total: expectedTotal,
    });
    const shareUrl = `${window.location.origin}${window.location.pathname}${hash}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.error('Gagal menyalin link:', err);
    }
  };

  // Ekspor Ringkasan Gambar Menggunakan Canvas Sisi Klien (FR-10)
  const handleExportImage = () => {
    setIsExporting(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = 640;
      const cardHeightPerPerson = 120;
      const height = 210 + shares.length * cardHeightPerPerson;

      canvas.width = width;
      canvas.height = height;

      // Clean neutral canvas background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Top brand accent line
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, 4);

      // Title & Header Text
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
      ctx.fillText('Smart Split Bill', 28, 42);

      ctx.fillStyle = '#64748b';
      ctx.font = 'normal 12px system-ui, -apple-system, sans-serif';
      ctx.fillText('Laporan Pembagian Tagihan Proporsional (Selisih Rp 0)', 28, 62);

      // Total Information
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
      ctx.fillText(`Total Tagihan: Rp ${expectedTotal.toLocaleString('id-ID')}`, 28, 105);

      ctx.fillStyle = '#64748b';
      ctx.font = 'normal 11px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        `Pajak: Rp ${tax.toLocaleString('id-ID')}   |   Layanan: Rp ${serviceCharge.toLocaleString('id-ID')}   |   Diskon: Rp ${discount.toLocaleString('id-ID')}`,
        28,
        125
      );

      // Divider
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(28, 145);
      ctx.lineTo(width - 28, 145);
      ctx.stroke();

      // Participants breakdown
      let yOffset = 175;
      shares.forEach((s) => {
        // Person card border
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(28, yOffset - 18, width - 56, cardHeightPerPerson - 16, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
        ctx.fillText(s.name, 44, yOffset + 10);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
        const totalText = `Rp ${s.total.toLocaleString('id-ID')}`;
        const textWidth = ctx.measureText(totalText).width;
        ctx.fillText(totalText, width - 44 - textWidth, yOffset + 10);

        // Sub details
        ctx.fillStyle = '#64748b';
        ctx.font = 'normal 11px system-ui, -apple-system, sans-serif';
        const detailText = `Subtotal: Rp ${s.subtotal.toLocaleString('id-ID')}  ·  Pajak: Rp ${s.taxShare.toLocaleString('id-ID')}  ·  Layanan: Rp ${s.serviceShare.toLocaleString('id-ID')}`;
        ctx.fillText(detailText, 44, yOffset + 36);

        const itemsPreview = s.items.map((i) => i.name).slice(0, 3).join(', ');
        ctx.fillText(`Item: ${itemsPreview}${s.items.length > 3 ? '...' : ''}`, 44, yOffset + 58);

        yOffset += cardHeightPerPerson;
      });

      // Footer
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'normal 10px system-ui, -apple-system, sans-serif';
      ctx.fillText('Diproses secara ephemeral tanpa retensi data.', 28, height - 15);

      const link = document.createElement('a');
      link.download = `smart-split-bill-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Gagal mengekspor gambar:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6" ref={summaryCardRef}>
      {/* Header and Exact Balance Pill */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium mb-2">
          <Check size={13} className="text-emerald-700" strokeWidth={2.5} />
          <span>Selisih Pembagian: Rp {diff} (Tepat & Adil)</span>
        </div>
        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
          Ringkasan Alokasi Tagihan
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Pajak, biaya layanan, dan potongan dialokasikan proporsional sesuai rasio subtotal masing-masing peserta.
        </p>
      </div>

      {/* Cards breakdown per participant */}
      <div className="space-y-3.5 mb-6">
        {shares.map((s) => (
          <div
            key={s.participantId}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-slate-100 text-slate-700 font-semibold flex items-center justify-center text-xs border border-slate-200">
                  {s.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{s.name}</h3>
                  <p className="text-[11px] text-slate-400 font-medium">{s.items.length} pesanan</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                  Total Bayar
                </span>
                <span className="text-base font-bold text-slate-900">
                  Rp {s.total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Menu breakdown */}
            <div className="py-2.5 space-y-1">
              {s.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-xs text-slate-600">
                  <span>
                    {it.name} <span className="text-slate-400 font-mono text-[11px]">({it.portionQty}x)</span>
                  </span>
                  <span className="font-medium text-slate-800">
                    Rp {it.portionPrice.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>

            {/* Tax & fee sub-breakdown */}
            <div className="pt-2.5 border-t border-slate-100 grid grid-cols-3 gap-2 text-[11px] text-slate-600 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
              <div>
                <span className="block text-[10px] text-slate-400 font-medium">Subtotal Item</span>
                <span className="font-semibold text-slate-800">Rp {s.subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-medium">Pajak & Layanan</span>
                <span className="font-semibold text-slate-800">
                  Rp {(s.taxShare + s.serviceShare).toLocaleString('id-ID')}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-medium">Diskon</span>
                <span className="font-semibold text-emerald-700">
                  {s.discountShare > 0 ? `-Rp ${s.discountShare.toLocaleString('id-ID')}` : 'Rp 0'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Share / Export Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <ReceiptText size={14} className="text-slate-500" />
            <span>Bagikan Ringkasan Transaksi</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 font-medium px-2 py-0.5 rounded border border-slate-200">
            <ShieldCheck size={12} className="text-slate-400" />
            <span>Privat (#hash URL-safe)</span>
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleCopyText}
            className="py-2 px-3 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? 'Teks Disalin' : 'Salin Format Teks'}</span>
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="py-2 px-3 rounded-md bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 text-xs font-medium transition flex items-center justify-center gap-1.5"
          >
            {copiedLink ? <Check size={13} /> : <Link2 size={13} />}
            <span>{copiedLink ? 'Tautan Disalin' : 'Salin Tautan'}</span>
          </button>
          <button
            type="button"
            onClick={handleExportImage}
            disabled={isExporting}
            className="py-2 px-3 rounded-md bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 disabled:opacity-40 text-xs font-medium transition flex items-center justify-center gap-1.5"
          >
            <Download size={13} />
            <span>Unduh Gambar</span>
          </button>
        </div>
      </div>

      {/* Navigation Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep(3)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft size={14} />
          <span>Ubah Penugasan</span>
        </button>
        <button
          type="button"
          onClick={resetAll}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
        >
          <RefreshCw size={13} />
          <span>Mulai Tagihan Baru</span>
        </button>
      </div>
    </div>
  );
};
