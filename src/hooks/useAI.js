import { useState, useCallback, useRef } from 'react';
import { callAI, buildDefaultSystemPrompt } from '../utils/aiHelper';
import { AI_FUNCTIONS } from '../utils/aiClient';
import { logger } from '../utils/logger';

// ─── Types ────────────────────────────────────────────────────────
/**
 * @typedef AIResult
 * @property {boolean} success
 * @property {string}  data
 * @property {string|null} error
 * @property {boolean} isMock   — true when running without an API key
 */

// ═══════════════════════════════════════════════════════════════════
//  HOOK 1: useAI  — streaming chat interface (unchanged contract)
//  Used by: Fan.jsx chat tab, any conversational component
// ═══════════════════════════════════════════════════════════════════

/**
 * useAI — Streaming Claude chat hook.
 *
 * @param {string} systemPrompt  - Optional system context for the conversation
 * @returns {{
 *   messages:     Array<{id, role, content, streaming?, error?}>,
 *   isLoading:    boolean,
 *   error:        string|null,
 *   sendMessage:  (text: string, overridePrompt?: string) => Promise<void>,
 *   clearMessages: () => void,
 *   sendQuickPrompt: (prompt: string) => Promise<void>,
 *   isConfigured: boolean,
 * }}
 */
export function useAI(systemPrompt) {
  const [messages,  setMessages]  = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState(null);

  // Not used internally but available to consumers wanting abort capability
  const abortRef = useRef(null);

  const isConfigured = Boolean(
    localStorage.getItem('stadiumiq_ai_provider') === 'huggingface'
      ? localStorage.getItem('stadiumiq_hf_token')
      : localStorage.getItem('stadiumiq_claude_key')
  );

  const sendMessage = useCallback(
    async (userText, overrideSystemPrompt) => {
      if (!userText?.trim()) return;
      setError(null);
      setIsLoading(true);

      const userMsg      = { id: Date.now(),     role: 'user',      content: userText };
      const assistantMsg = { id: Date.now() + 1, role: 'assistant', content: '', streaming: true };

      setMessages(prev => [...prev, userMsg, assistantMsg]);

      // Build history from current messages (before we appended the new pair)
      const history = messages.map(m => ({ role: m.role, content: m.content }));

      let fullText = '';

      try {
        await callAI({
          prompt:       userText,
          messages:     history,
          systemPrompt: overrideSystemPrompt || systemPrompt || buildDefaultSystemPrompt(),
          onStream: (chunk) => {
            fullText += chunk;
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMsg.id
                  ? { ...m, content: fullText, streaming: true }
                  : m
              )
            );
          },
        });

        // Finalise streaming
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsg.id
              ? { ...m, content: fullText || m.content, streaming: false }
              : m
          )
        );
      } catch (err) {
        setError(err.message);
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsg.id
              ? { ...m, content: `⚠️ ${err.message}`, streaming: false, error: true }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [messages, systemPrompt]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const sendQuickPrompt = useCallback(
    (prompt) => sendMessage(prompt),
    [sendMessage]
  );

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    sendQuickPrompt,
    isConfigured,
  };
}

// ═══════════════════════════════════════════════════════════════════
//  HOOK 2: useAIAction  — one-shot AI function calls
//  Used by: Navigation, Incident Response, PA Generator, Reports
// ═══════════════════════════════════════════════════════════════════

/**
 * useAIAction — Dispatch any registered aiClient function.
 *
 * @returns {{
 *   loading:   boolean,
 *   result:    AIResult|null,
 *   error:     string|null,
 *   isMock:    boolean,
 *   callAI:    (fnName: string, ...args: any[]) => Promise<AIResult>,
 *   reset:     () => void,
 * }}
 *
 * Available fnNames (from AI_FUNCTIONS registry):
 *   'getNavigationDirections'   (currentZone, destination, venueName)
 *   'translateAndRespond'       (userMessage, targetLanguage, stadiumContext)
 *   'getIncidentResponse'       (incidentType, zone, description)
 *   'getStaffProtocol'          (scenario, staffRole)
 *   'generatePAnnouncement'     (situation, language)
 *   'getSustainabilityReport'   (metrics)
 *   'generateAnnouncement'      (context, language)
 */
export function useAIAction() {
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState(null);
  const [isMock,  setIsMock]  = useState(false);

  const callAI = useCallback(async (fnName, ...args) => {
    const fn = AI_FUNCTIONS[fnName];
    if (!fn) {
      const msg = `[useAIAction] Unknown function: "${fnName}". Available: ${Object.keys(AI_FUNCTIONS).join(', ')}`;
      logger.error(msg);
      setError(msg);
      return { success: false, data: '', error: msg };
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fn(...args);
      setResult(res);
      setIsMock(res.isMock ?? false);
      if (!res.success) setError(res.error || 'Unknown error');
      return res;
    } catch (err) {
      const msg = err.message || 'Unexpected error in AI call';
      setError(msg);
      const fallback = { success: false, data: '', error: msg, isMock: true };
      setResult(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setResult(null);
    setError(null);
    setIsMock(false);
  }, []);

  return { loading, result, error, isMock, callAI, reset };
}

// ═══════════════════════════════════════════════════════════════════
//  HOOK 3: useAIQueue  — sequential multi-step AI pipeline
//  Used by: Staff briefing generator, batch report generation
// ═══════════════════════════════════════════════════════════════════

/**
 * useAIQueue — Run multiple AI calls sequentially and collect all results.
 *
 * @returns {{
 *   running:   boolean,
 *   results:   AIResult[],
 *   progress:  number,          0–1
 *   runQueue:  (steps: Array<{fn: string, args: any[]}>) => Promise<AIResult[]>,
 *   reset:     () => void,
 * }}
 */
export function useAIQueue() {
  const [running,  setRunning]  = useState(false);
  const [results,  setResults]  = useState([]);
  const [progress, setProgress] = useState(0);

  const runQueue = useCallback(async (steps = []) => {
    if (!steps.length) return [];
    setRunning(true);
    setResults([]);
    setProgress(0);

    const collected = [];

    for (let i = 0; i < steps.length; i++) {
      const { fn: fnName, args = [] } = steps[i];
      const fn = AI_FUNCTIONS[fnName];

      if (!fn) {
        collected.push({ success: false, data: '', error: `Unknown fn: ${fnName}`, isMock: true });
      } else {
        try {
          const res = await fn(...args);
          collected.push(res);
        } catch (err) {
          collected.push({ success: false, data: '', error: err.message, isMock: true });
        }
      }

      setResults([...collected]);
      setProgress((i + 1) / steps.length);
    }

    setRunning(false);
    return collected;
  }, []);

  const reset = useCallback(() => {
    setRunning(false);
    setResults([]);
    setProgress(0);
  }, []);

  return { running, results, progress, runQueue, reset };
}

// ─── Default export (backwards compat) ────────────────────────────
export default useAI;
