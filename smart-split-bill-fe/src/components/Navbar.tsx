import { useBillStore } from '../store/useBillStore';
import { ReceiptText, ShieldCheck, RefreshCw } from './icons';

export const Navbar = () => {
  const { backendStatus, currentStep, resetAll } = useBillStore();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <button
          type="button"
          onClick={resetAll}
          className="flex items-center gap-2.5 text-left group transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded-md"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center transition group-hover:bg-slate-800">
            <ReceiptText size={17} strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-sm tracking-tight">
                Smart Split Bill
              </span>
              <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                PaaS · CDN
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block leading-none mt-0.5">
              OCR & Ephemeral Bill Splitter
            </p>
          </div>
        </button>

        {/* Status Indicators & Reset Action */}
        <div className="flex items-center gap-2.5">
          {/* Backend Status Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border bg-slate-50 border-slate-200">
            {backendStatus === 'ready' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span className="text-slate-700">OCR Siap</span>
              </>
            )}
            {backendStatus === 'cold-starting' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-amber-800">Menghidupkan Server...</span>
              </>
            )}
            {backendStatus === 'checking' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                <span className="text-slate-600">Menghubungkan</span>
              </>
            )}
            {backendStatus === 'error' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span className="text-rose-700">Offline (Manual)</span>
              </>
            )}
          </div>

          {/* Ephemeral Guarantee Badge */}
          <div
            className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200"
            title="Foto diproses sementara di RAM dan langsung dimusnahkan. Tanpa basis data persisten."
          >
            <ShieldCheck size={14} className="text-slate-600" />
            <span>Tanpa Database</span>
          </div>

          {currentStep > 1 && (
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded-md hover:bg-slate-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              <RefreshCw size={12} />
              <span>Mulai Ulang</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
