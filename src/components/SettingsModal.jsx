import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, ShieldCheck, ShieldAlert, Cpu, Sliders, Wifi, WifiOff, Trophy } from 'lucide-react';
import { useStadium } from '../context/StadiumContext';
import { useState, useEffect } from 'react';

const MISTRAL_PRESET_MODELS = [
  { value: 'mistral-small-latest', label: 'mistral-small-latest (default, free)' },
  { value: 'open-mistral-7b',      label: 'open-mistral-7b (open source, free)' },
  { value: 'open-mixtral-8x7b',    label: 'open-mixtral-8x7b (multilingual, free)' },
];

export default function SettingsModal() {
  const {
    settingsOpen,
    setSettingsOpen,
    cohereKey: ctxCohereKey,
    aiProvider: ctxAiProvider,
    mistralKey: ctxMistralKey,
    mistralModel: ctxMistralModel,
    saveSettings,
    footballApiKey: ctxFootballKey,
    saveFootballApiKey,
    hfKey: ctxHfKey,
    hfModel: ctxHfModel,
  } = useStadium();

  const [provider, setProvider] = useState(ctxAiProvider || 'cohere');
  const [cohereKey, setCohereKey] = useState(ctxCohereKey || '');
  const [mistralKey, setMistralKey] = useState(ctxMistralKey || '');
  const [mistralModel, setMistralModel] = useState(ctxMistralModel || 'mistral-small-latest');
  const [fbKey, setFbKey] = useState(ctxFootballKey || '');
  const [fbTestStatus, setFbTestStatus] = useState(null);
  const [fbTesting, setFbTesting] = useState(false);

  const [hfKey, setHfKey] = useState(ctxHfKey || '');
  const [hfModel, setHfModel] = useState(ctxHfModel || 'Qwen/Qwen2.5-72B-Instruct');

  const [testStatus, setTestStatus] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  // Sync state with Context values when settings panel opens
  useEffect(() => {
    if (settingsOpen) {
      setProvider(ctxAiProvider || 'cohere');
      setCohereKey(ctxCohereKey || '');
      setMistralKey(ctxMistralKey || '');
      setMistralModel(ctxMistralModel || 'mistral-small-latest');
      setFbKey(ctxFootballKey || '');
      setHfKey(ctxHfKey || '');
      setHfModel(ctxHfModel || 'Qwen/Qwen2.5-72B-Instruct');
      setTestStatus(null);
      setFbTestStatus(null);
    }
  }, [settingsOpen, ctxAiProvider, ctxCohereKey, ctxMistralKey, ctxMistralModel, ctxFootballKey, ctxHfKey, ctxHfModel]);

  if (!settingsOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    
    // As requested, also manually set the localstorage keys 
    // even though saveSettings handles it
    if (provider === 'cohere') {
      localStorage.setItem('stadiumiq_cohere_key', cohereKey);
    } else if (provider === 'mistral') {
      localStorage.setItem('stadiumiq_mistral_key', mistralKey);
      localStorage.setItem('stadiumiq_mistral_model', mistralModel);
    } else if (provider === 'huggingface') {
      localStorage.setItem('stadiumiq_hf_key', hfKey);
      localStorage.setItem('stadiumiq_hf_model', hfModel);
    }

    saveSettings({
      provider,
      cohereKeyVal: cohereKey,
      mistralKeyVal: mistralKey,
      mistralModelVal: mistralModel,
      hfKeyVal: hfKey,
      hfModelVal: hfModel,
    });

    // Save football API key
    saveFootballApiKey(fbKey);

    setSettingsOpen(false);
  };

  const handleRemoveKey = () => {
    saveSettings({
      provider,
      cohereKeyVal: provider === 'cohere' ? '' : cohereKey,
      mistralKeyVal: provider === 'mistral' ? '' : mistralKey,
      mistralModelVal: provider === 'mistral' ? 'mistral-small-latest' : mistralModel,
      hfKeyVal: provider === 'huggingface' ? '' : hfKey,
      hfModelVal: provider === 'huggingface' ? 'Qwen/Qwen2.5-72B-Instruct' : hfModel,
    });
    if (provider === 'cohere') setCohereKey('');
    if (provider === 'mistral') setMistralKey('');
    if (provider === 'huggingface') setHfKey('');
    setTestStatus(null);
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestStatus(null);
    try {
      if (provider === 'cohere') {
        const cohereEndpoint = import.meta.env.MODE === 'test'
          ? 'https://api.cohere.com/v2/chat'
          : '/api/cohere?path=/v2/chat';
          
        const res = await fetch(cohereEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cohereKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'command-r-08-2024',
            max_tokens: 50,
            temperature: 0.1,
            messages: [{ role: 'user', content: "Reply with just the word OK" }],
          })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.message || `HTTP ${res.status}`);
        }
        const data = await res.json();
        const reply = data?.message?.content?.[0]?.text || data?.text || '';
        if (reply.includes('OK')) {
          setTestStatus({ success: true, message: 'Connected — Cohere responding' });
        } else {
          setTestStatus({ success: false, message: `Failed: Unexpected response: ${reply}` });
        }
      } else if (provider === 'mistral') {
        const mistralEndpoint = import.meta.env.MODE === 'test'
          ? 'https://api.mistral.ai/v1/chat/completions'
          : '/api/mistral?path=/v1/chat/completions';
          
        const res = await fetch(mistralEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mistralKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: mistralModel,
            max_tokens: 50,
            temperature: 0.1,
            messages: [{ role: 'user', content: "Reply with just the word OK" }],
          })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.message || `HTTP ${res.status}`);
        }
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content || '';
        if (reply.includes('OK')) {
          setTestStatus({ success: true, message: 'Connected — Mistral AI responding' });
        } else {
          setTestStatus({ success: false, message: `Failed: Unexpected response: ${reply}` });
        }
      } else if (provider === 'huggingface') {
        const hfEndpoint = import.meta.env.MODE === 'test'
          ? 'https://api-inference.huggingface.co/v1/chat/completions'
          : '/api/huggingface?path=/v1/chat/completions';
          
        const res = await fetch(hfEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hfKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: hfModel || 'Qwen/Qwen2.5-72B-Instruct',
            max_tokens: 50,
            temperature: 0.1,
            messages: [{ role: 'user', content: "Reply with just the word OK" }],
          })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message || err?.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content || '';
        if (reply.includes('OK') || reply.trim().length > 0) {
          setTestStatus({ success: true, message: 'Connected — Hugging Face Serverless API responding' });
        } else {
          setTestStatus({ success: false, message: `Failed: Empty or invalid response` });
        }
      }
    } catch (e) {
      setTestStatus({ success: false, message: `Failed: ${e.message}` });
    } finally {
      setIsTesting(false);
    }
  };

  const isCurrentConfigured = (provider === 'cohere' && Boolean(cohereKey)) || 
                              (provider === 'mistral' && Boolean(mistralKey)) ||
                              (provider === 'huggingface' && Boolean(hfKey));

  // ── Football-Data.org key test ──────────────────────────────
  const handleTestFbKey = async () => {
    if (!fbKey.trim()) return;
    setFbTesting(true);
    setFbTestStatus(null);
    try {
      const endpoint = import.meta.env.MODE === 'test'
        ? 'https://api.football-data.org/v4/competitions/WC'
        : '/api/football?path=/competitions/WC';
      const res = await fetch(endpoint, {
        headers: { 'X-Auth-Token': fbKey.trim() },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = await res.json();
        setFbTestStatus({ success: true, message: `Connected ✅ — ${data.name || 'FIFA World Cup 2026'}` });
      } else if (res.status === 403) {
        setFbTestStatus({ success: false, message: 'Invalid API key — check your football-data.org token' });
      } else {
        setFbTestStatus({ success: false, message: `HTTP ${res.status} — ${res.statusText}` });
      }
    } catch (e) {
      setFbTestStatus({ success: false, message: `Connection failed: ${e.message}` });
    } finally {
      setFbTesting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white border-4 border-gray-900 w-full max-w-md p-6 flex flex-col gap-6 shadow-[8px_8px_0px_#111827] relative"
        >
          {/* Close button */}
          <button
            onClick={() => setSettingsOpen(false)}
            className="absolute top-4 right-4 p-1.5 border-2 border-gray-900 bg-white hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3 border-b-2 border-gray-200 pb-3">
            <Cpu className="text-blue-600" size={24} />
            <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">
              STADIUMIQ SETTINGS
            </h3>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-4">
            {/* Provider Selector */}
            <div className="flex flex-col gap-2">
              <label htmlFor="ai-provider-select" className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Sliders size={14} className="text-blue-600" /> AI Provider
              </label>
              <select
                id="ai-provider-select"
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value);
                  setTestStatus(null);
                }}
                className="w-full border-2 border-gray-900 p-3 rounded-none text-base font-bold text-gray-900 focus:outline-none focus:border-blue-600 bg-white"
              >
                <option value="cohere">Cohere (Recommended — 1000 free/month)</option>
                <option value="mistral">Mistral AI (Free tier)</option>
                <option value="huggingface">Hugging Face (Free Open-Source models)</option>
                <option value="demo">Demo Mode (no API key needed)</option>
              </select>
            </div>

            {/* Conditionally Render Inputs based on Provider */}
            {provider === 'cohere' && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                  <Key size={14} className="text-blue-600" /> COHERE API KEY
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={cohereKey}
                    onChange={(e) => setCohereKey(e.target.value)}
                    placeholder="Enter Cohere API Key..."
                    className="w-full border-2 border-gray-900 p-3 rounded-none text-base font-bold text-gray-900 focus:outline-none focus:border-blue-600 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleTest}
                    disabled={!cohereKey || isTesting}
                    className="px-4 py-3 bg-blue-600 text-white font-black uppercase tracking-wider border-2 border-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isTesting ? '...' : 'Test'}
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
                  Free at dashboard.cohere.com — 1000 calls/month, no credit card
                </p>
                <p className="text-[10px] text-blue-600 font-semibold leading-relaxed">
                  Using command-r-08-2024 model
                </p>
              </div>
            )}

            {provider === 'mistral' && (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                    <Key size={14} className="text-blue-600" /> MISTRAL API KEY
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={mistralKey}
                      onChange={(e) => setMistralKey(e.target.value)}
                      placeholder="Enter Mistral API Key..."
                      className="w-full border-2 border-gray-900 p-3 rounded-none text-base font-bold text-gray-900 focus:outline-none focus:border-blue-600 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleTest}
                      disabled={!mistralKey || isTesting}
                      className="px-4 py-3 bg-blue-600 text-white font-black uppercase tracking-wider border-2 border-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isTesting ? '...' : 'Test'}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
                    Free tier at console.mistral.ai
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="mistral-model-select" className="text-xs font-black uppercase tracking-wider text-gray-700">
                    Model selector
                  </label>
                  <select
                    id="mistral-model-select"
                    value={mistralModel}
                    onChange={(e) => setMistralModel(e.target.value)}
                    className="w-full border-2 border-gray-900 p-3 rounded-none text-base font-bold text-gray-900 focus:outline-none focus:border-blue-600 bg-white"
                  >
                    {MISTRAL_PRESET_MODELS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {provider === 'huggingface' && (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                    <Key size={14} className="text-blue-600" /> HUGGING FACE TOKEN
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={hfKey}
                      onChange={(e) => setHfKey(e.target.value)}
                      placeholder="Enter Hugging Face token..."
                      className="w-full border-2 border-gray-900 p-3 rounded-none text-base font-bold text-gray-900 focus:outline-none focus:border-blue-600 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleTest}
                      disabled={!hfKey || isTesting}
                      className="px-4 py-3 bg-blue-600 text-white font-black uppercase tracking-wider border-2 border-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isTesting ? '...' : 'Test'}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
                    Free token at huggingface.co/settings/tokens — Serverless Inference API
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-gray-700">
                    Open-Source Model ID
                  </label>
                  <input
                    type="text"
                    value={hfModel}
                    onChange={(e) => setHfModel(e.target.value)}
                    placeholder="Qwen/Qwen2.5-72B-Instruct"
                    className="w-full border-2 border-gray-900 p-3 rounded-none text-base font-bold text-gray-900 focus:outline-none focus:border-blue-600 bg-white"
                  />
                  <p className="text-[10px] text-blue-600 font-semibold leading-relaxed">
                    Popular options: Qwen/Qwen2.5-72B-Instruct, mistralai/Mistral-7B-Instruct-v0.3
                  </p>
                </div>
              </>
            )}

            {provider === 'demo' && (
              <div className="p-4 bg-gray-100 border-2 border-gray-300 text-gray-800 mt-2">
                <p className="text-xs font-semibold leading-relaxed">
                  Demo mode uses pre-built fallback responses. Add an API key for live AI responses.
                </p>
              </div>
            )}

            {/* Test Result Message */}
            {testStatus && (
              <div className={`p-3 border-2 ${testStatus.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                <p className="text-xs font-bold">{testStatus.success ? `✅ ${testStatus.message}` : `❌ ${testStatus.message}`}</p>
              </div>
            )}

            {/* Connection Status Panel */}
            <div className={`p-4 border-2 flex items-start gap-3 ${
              (provider === 'cohere' && ctxCohereKey) || 
              (provider === 'mistral' && ctxMistralKey) ||
              (provider === 'huggingface' && ctxHfKey)
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              {((provider === 'cohere' && ctxCohereKey) || 
                (provider === 'mistral' && ctxMistralKey) ||
                (provider === 'huggingface' && ctxHfKey)) ? (
                <>
                  <ShieldCheck size={20} className="text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide">
                      AI STATUS: CONNECTED — {
                        provider === 'cohere' ? 'Cohere command-r-08-2024 active' : 
                        provider === 'mistral' ? `Mistral AI (${ctxMistralModel}) active` :
                        `Hugging Face (${ctxHfModel || 'Qwen'}) active`
                      }
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide">AI STATUS: DEMO MODE — Add API key for live AI</p>
                  </div>
                </>
              )}
            </div>

            {/* ── Football Data API Key Section ─────────────────── */}
            <div className="border-t-2 border-gray-200 pt-4 flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Trophy size={14} className="text-gray-900 shrink-0" /> Football API Key <span className="text-[9px] text-green-600 font-bold normal-case ml-1">(football-data.org — free)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={fbKey}
                  onChange={(e) => setFbKey(e.target.value)}
                  placeholder="Your football-data.org token..."
                  className="w-full border-2 border-gray-900 p-3 rounded-none text-sm font-bold text-gray-900 focus:outline-none focus:border-green-600 bg-white font-mono"
                />
                <button
                  type="button"
                  onClick={handleTestFbKey}
                  disabled={!fbKey || fbTesting}
                  className="px-4 py-3 bg-green-600 text-white font-black uppercase tracking-wider border-2 border-green-700 hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {fbTesting ? '...' : 'Test'}
                </button>
              </div>
              {fbTestStatus && (
                <div className={`p-2.5 border-2 ${fbTestStatus.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                  <p className="text-xs font-bold">{fbTestStatus.success ? `✅ ${fbTestStatus.message}` : `❌ ${fbTestStatus.message}`}</p>
                </div>
              )}
              <div className={`p-3 border-2 flex items-center gap-2 ${
                ctxFootballKey ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}>
                {ctxFootballKey
                  ? <><Wifi size={14} className="text-green-600 shrink-0" /><p className="text-xs font-black uppercase tracking-wide">Football API: LIVE — WC 2026 data active</p></>
                  : <><WifiOff size={14} className="text-gray-400 shrink-0" /><p className="text-xs font-bold">No key saved — demo matches used in Live Match Center</p></>
                }
              </div>
              <p className="text-[10px] text-gray-400 font-semibold">
                Free at <a href="https://www.football-data.org/client/register" target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold">football-data.org</a> · 10 req/min · No credit card required
              </p>
            </div>

            <div className="flex justify-between items-center gap-4 mt-2">
              {isCurrentConfigured && provider !== 'demo' && (
                <button
                  type="button"
                  onClick={handleRemoveKey}
                  className="px-4 py-3 border-2 border-red-900 bg-white text-red-700 hover:bg-red-50 text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Remove Key
                </button>
              )}
              <div className="flex-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="px-5 py-3 border-2 border-gray-900 bg-white text-gray-900 hover:bg-gray-100 text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gray-900 text-white border-2 border-gray-900 hover:bg-blue-600 hover:border-blue-700 transition-colors text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
