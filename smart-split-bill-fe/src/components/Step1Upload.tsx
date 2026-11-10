import { useState, useRef, type ChangeEvent, type DragEvent } from 'react';
import { useBillStore } from '../store/useBillStore';
import { prepareReceiptImage } from '../utils/imageHelper';
import { parseReceiptApi } from '../services/api';
import {
  UploadCloud,
  Camera,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from './icons';

export const Step1Upload = () => {
  const {
    setProcessing,
    applyOCRResult,
    setError,
    setStep,
    errorMessage,
    isProcessing,
    statusMessage,
    backendStatus,
  } = useBillStore();

  const [dragOver, setDragOver] = useState(false);
  const [compressProgress, setCompressProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    try {
      setError(null);
      setProcessing(true, 'Menyiapkan berkas (konversi format & kompresi)...');
      setCompressProgress(0);

      // 1. Kompresi & EXIF/HEIC Normalisasi di Browser (FR-02)
      const optimizedFile = await prepareReceiptImage(file, (progress) => {
        setCompressProgress(Math.round(progress));
      });

      setCompressProgress(null);
      setProcessing(true, 'Mengekstrak data struk dengan Tesseract OCR...');

      // 2. Kirim ke Backend API
      const result = await parseReceiptApi(optimizedFile);
      applyOCRResult(result);
    } catch (err: any) {
      console.error(err);
      let msg = 'Gagal memproses struk.';
      if (err.response?.data?.detail) {
        msg = err.response.data.detail;
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        msg = 'Waktu permintaan habis. Server Render sedang aktif kembali dari status idle. Coba ulangi atau gunakan entri manual.';
      } else if (!window.navigator.onLine) {
        msg = 'Koneksi internet terputus.';
      }
      setError(msg);
    }
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
          Unggah Bukti Transaksi
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Pindai struk restoran, kafe, atau minimarket untuk membaca pos transaksi secara otomatis.
        </p>
      </div>

      {/* Cold Start Notice */}
      {backendStatus === 'cold-starting' && (
        <div className="mb-4 p-3.5 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-amber-900">Instance Backend Sedang Bangun</p>
            <p className="text-amber-800 leading-relaxed">
              Layanan Render di tier gratis sedang aktif dari kondisi idle. Pemrosesan pertama memerlukan waktu ±30–60 detik.
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="text-xs font-semibold text-rose-900 hover:text-rose-950 underline underline-offset-2 shrink-0"
          >
            Input Manual
          </button>
        </div>
      )}

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`border border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[250px] bg-white ${
          dragOver
            ? 'border-slate-900 bg-slate-50/80'
            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          capture="environment"
          onChange={onFileInputChange}
          className="hidden"
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={28} className="text-slate-800" />
            <p className="text-sm font-medium text-slate-800">{statusMessage}</p>
            {compressProgress !== null && (
              <div className="w-48 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-slate-800 h-full transition-all duration-300"
                  style={{ width: `${compressProgress}%` }}
                />
              </div>
            )}
            <p className="text-xs text-slate-500 max-w-xs">
              Foto Anda diproses langsung di RAM (tmpfs) dan segera dimusnahkan.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
              <UploadCloud size={22} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Pilih foto struk atau seret berkas ke sini
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Format yang didukung: JPG, PNG, WebP, dan HEIC (iPhone)
              </p>
            </div>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium bg-slate-900 text-white shadow-xs hover:bg-slate-800 transition">
                <Camera size={14} />
                <span>Buka Kamera / Berkas</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Privacy Guarantee & Manual Fallback Link */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-600 bg-white p-3.5 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} className="text-slate-500 shrink-0" />
          <span>Pemrosesan stateless di RAM. Tidak ada penyimpanan foto.</span>
        </div>
        <button
          type="button"
          onClick={() => setStep(2)}
          className="inline-flex items-center gap-1 text-slate-900 hover:text-slate-700 font-semibold transition"
        >
          <span>Lanjut manual tanpa foto</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
