import { useEffect } from 'react';
import { useBillStore } from './store/useBillStore';
import { checkBackendHealth } from './services/api';
import { decodeStateFromHash } from './utils/hashShare';
import { Navbar } from './components/Navbar';
import { StepWizard } from './components/StepWizard';
import { Step1Upload } from './components/Step1Upload';
import { Step2ReviewItems } from './components/Step2ReviewItems';
import { Step3Assign } from './components/Step3Assign';
import { Step4Summary } from './components/Step4Summary';
import { ShieldCheck, Server } from './components/icons';

export function App() {
  const { currentStep, setBackendStatus, loadFromSharedPayload } = useBillStore();

  // 1. Cek apakah ada shared state dari URL fragment (#hash - FR-13)
  useEffect(() => {
    if (window.location.hash) {
      const payload = decodeStateFromHash(window.location.hash);
      if (payload) {
        loadFromSharedPayload(payload);
      }
    }
  }, [loadFromSharedPayload]);

  // 2. Warm-up ping ke backend Render saat aplikasi dibuka (FR-12, NFR-F3)
  useEffect(() => {
    let isMounted = true;
    const pingBackend = async () => {
      setBackendStatus('checking');
      try {
        await checkBackendHealth();
        if (isMounted) setBackendStatus('ready');
      } catch {
        if (isMounted) {
          setBackendStatus('cold-starting');
          setTimeout(async () => {
            try {
              await checkBackendHealth();
              if (isMounted) setBackendStatus('ready');
            } catch {
              if (isMounted) setBackendStatus('error');
            }
          }, 4000);
        }
      }
    };

    pingBackend();
    return () => {
      isMounted = false;
    };
  }, [setBackendStatus]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased selection:bg-slate-200">
      <Navbar />
      <StepWizard />

      <main className="flex-1 pb-16">
        {currentStep === 1 && <Step1Upload />}
        {currentStep === 2 && <Step2ReviewItems />}
        {currentStep === 3 && <Step3Assign />}
        {currentStep === 4 && <Step4Summary />}
      </main>

      {/* Footer Finansial Minimalis & Edukatif */}
      <footer className="border-t border-slate-200 bg-white py-5 text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-slate-600">
            <ShieldCheck size={14} className="text-slate-500 shrink-0" />
            <span>
              <strong>Zero Data Retention:</strong> Foto struk hanya diproses di RAM (tmpfs) dan langsung dimusnahkan.
            </span>
          </p>
          <p className="flex items-center gap-1.5 text-slate-400">
            <Server size={13} className="shrink-0" />
            <span>Multi-provider: Vercel (Frontend) · Render (FastAPI Docker)</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
