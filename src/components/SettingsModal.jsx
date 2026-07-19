import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, ShieldAlert, Cpu, Sliders, Wifi, WifiOff, CheckCircle2, XCircle } from 'lucide-react';
import { useStadium } from '../context/StadiumContext';
import { useState, useEffect } from 'react';

const PROVIDERS = [
  { value: 'cohere',      label: 'Cohere',        sub: '1000 free/month',         envKey: 'VITE_COHERE_API_KEY' },
  { value: 'mistral',     label: 'Mistral AI',     sub: 'Free tier',               envKey: 'VITE_MISTRAL_API_KEY' },
  { value: 'huggingface', label: 'Hugging Face',   sub: 'Free open-source models', envKey: 'VITE_HF_API_KEY' },
  { value: 'demo',        label: 'Demo Mode',      sub: 'No API key needed',       envKey: null },
];

// Read env var status (available at bundle time via import.meta.env)
const ENV = import.meta.env;

export default function SettingsModal() {
  const {
    settingsOpen,
    setSettingsOpen,
    aiProvider: ctxAiProvider,
    saveSettings,
    footballApiKey,
  } = useStadium();

  const [provider, setProvider] = useState(ctxAiProvider || 'cohere');

  // Re-sync when modal opens
  useEffect(() => {
    if (settingsOpen) {
      setProvider(ctxAiProvider || 'cohere');
    }
  }, [settingsOpen, ctxAiProvider]);

  if (!settingsOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    saveSettings({ provider, cohereKeyVal: '', mistralKeyVal: '', mistralModelVal: '', hfKeyVal: '', hfModelVal: '' });
    setSettingsOpen(false);
  };

  // Check env vars
  const cohereActive     = Boolean(ENV.VITE_COHERE_API_KEY);
  const mistralActive    = Boolean(ENV.VITE_MISTRAL_API_KEY);
  const hfActive         = Boolean(ENV.VITE_HF_API_KEY);
  const footballActive   = Boolean(ENV.VITE_FOOTBALL_API_KEY) || Boolean(footballApiKey);

  const providerActive = {
    cohere:      cohereActive,
    mistral:     mistralActive,
    huggingface: hfActive,
    demo:        true,
  };

  const selectedActive = providerActive[provider];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white border-4 border-gray-900 w-full max-w-md p-6 flex flex-col gap-5 shadow-[8px_8px_0px_#111827] relative"
        >
          {/* Close */}
          <button
            onClick={() => setSettingsOpen(false)}
            className="absolute top-4 right-4 p-1.5 border-2 border-gray-900 bg-white hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 border-b-2 border-gray-200 pb-3">
            <Cpu className="text-blue-600" size={24} />
            <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">
              StadiumIQ Settings
            </h3>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-5">

            {/* ── AI Provider Switch ─────────────────────────── */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Sliders size={14} className="text-blue-600" /> AI Provider
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PROVIDERS.map(p => {
                  const active = providerActive[p.value];
                  const selected = provider === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setProvider(p.value)}
                      className={`relative flex flex-col items-start p-3 border-2 text-left transition-all cursor-pointer
                        ${selected
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-500'
                        }`}
                    >
                      {/* Active env badge */}
                      {p.envKey && (
                        <span className={`absolute top-2 right-2 ${active ? 'text-green-500' : 'text-gray-300'}`}>
                          {active ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        </span>
                      )}
                      <span className="text-sm font-black">{p.label}</span>
                      <span className="text-[10px] font-semibold text-gray-500 mt-0.5">{p.sub}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400 font-semibold">
                API keys are configured via environment variables — no key entry needed.
              </p>
            </div>

            {/* ── AI Status Panel ────────────────────────────── */}
            <div className={`p-4 border-2 flex items-start gap-3 ${
              selectedActive
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              {selectedActive ? (
                <>
                  <ShieldCheck size={20} className="text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide">
                      AI STATUS: ACTIVE — {
                        provider === 'cohere'      ? 'Cohere API key detected' :
                        provider === 'mistral'     ? 'Mistral API key detected' :
                        provider === 'huggingface' ? 'Hugging Face token detected' :
                        'Demo mode — no key required'
                      }
                    </p>
                    <p className="text-[10px] mt-1 opacity-80">
                      Key loaded from environment variable
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide">
                      AI STATUS: KEY MISSING — {
                        provider === 'cohere'      ? 'Add VITE_COHERE_API_KEY to Vercel' :
                        provider === 'mistral'     ? 'Add VITE_MISTRAL_API_KEY to Vercel' :
                        'Add VITE_HF_API_KEY to Vercel'
                      }
                    </p>
                    <p className="text-[10px] mt-1 opacity-80">
                      Set it in Vercel → Project → Environment Variables
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* ── Football API Status ────────────────────────── */}
            <div className="border-t-2 border-gray-200 pt-4">
              <div className={`p-3 border-2 flex items-center gap-3 ${
                footballActive
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-gray-50 border-gray-200 text-gray-500'
              }`}>
                {footballActive
                  ? <><Wifi size={16} className="text-green-600 shrink-0" /><div><p className="text-xs font-black uppercase tracking-wide">Football API: ACTIVE — WC 2026 live data ready</p><p className="text-[10px] opacity-70 mt-0.5">Key loaded from environment variable</p></div></>
                  : <><WifiOff size={16} className="text-gray-400 shrink-0" /><div><p className="text-xs font-bold">Football API: No key — add VITE_FOOTBALL_API_KEY to Vercel</p></div></>
                }
              </div>
            </div>

            {/* ── Actions ────────────────────────────────────── */}
            <div className="flex justify-end gap-3 mt-1">
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="px-5 py-3 border-2 border-gray-900 bg-white text-gray-900 hover:bg-gray-100 text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white border-2 border-blue-700 hover:bg-blue-700 transition-colors text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Save Provider
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
