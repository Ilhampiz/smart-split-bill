import { useBillStore } from '../store/useBillStore';
import { Check } from './icons';

const steps = [
  { num: 1, label: 'Unggah' },
  { num: 2, label: 'Review Item' },
  { num: 3, label: 'Bagi Peserta' },
  { num: 4, label: 'Ringkasan' },
];

export const StepWizard = () => {
  const { currentStep, setStep, items } = useBillStore();

  return (
    <nav aria-label="Alur langkah proses" className="max-w-2xl mx-auto px-4 pt-6 pb-2">
      <ol className="grid grid-cols-4 gap-2">
        {steps.map((s) => {
          const isPassed = currentStep > s.num;
          const isCurrent = currentStep === s.num;
          const canClick = s.num <= currentStep || (s.num === 2 && items.length > 0);

          return (
            <li key={s.num} className="relative">
              <button
                type="button"
                disabled={!canClick}
                onClick={() => canClick && setStep(s.num)}
                className={`w-full flex items-center justify-center gap-2 py-2 px-2 rounded-md text-xs font-medium border text-left transition ${
                  isCurrent
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : isPassed
                    ? 'border-slate-300 bg-white text-slate-800 hover:border-slate-400'
                    : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${
                    isCurrent
                      ? 'bg-white text-slate-900'
                      : isPassed
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isPassed ? <Check size={11} strokeWidth={2.6} /> : s.num}
                </span>
                <span className="truncate hidden sm:inline">{s.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
