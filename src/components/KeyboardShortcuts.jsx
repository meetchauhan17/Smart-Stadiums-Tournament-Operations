// ─── Keyboard Shortcuts Overlay ───────────────────────────────────
// Press ? anywhere to open. Esc to close.
// Communicates available shortcuts to power users.

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Keyboard, X, Users, Radio, Shield, Leaf, Home } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['F'], label: 'Fan Experience Hub',       icon: Users,   route: '/fan'          },
  { keys: ['O'], label: 'Operations Control Room',  icon: Radio,   route: '/operations'   },
  { keys: ['S'], label: 'Staff Command Center',     icon: Shield,  route: '/staff'        },
  { keys: ['G'], label: 'Sustainability Dashboard', icon: Leaf,    route: '/sustainability'},
  { keys: ['H'], label: 'Home / Landing',           icon: Home,    route: '/'             },
];

const SYSTEM_SHORTCUTS = [
  { keys: ['?'],           label: 'Toggle this shortcuts overlay'    },
  { keys: ['Esc'],         label: 'Close modals / overlays'          },
  { keys: ['Tab'],         label: 'Navigate focusable elements'      },
  { keys: ['Arrow Keys'],  label: 'Cycle zones in ZoneMap'           },
  { keys: ['Enter'],       label: 'Select focused zone'              },
];

function Key({ k }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md text-[10px] font-mono font-bold text-[#060D1A] bg-[#00D4FF] shadow-[0_1px_0_rgba(0,0,0,0.4)]">
      {k}
    </kbd>
  );
}

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const handler = (e) => {
      // Ignore if typing in an input/textarea/select
      const tag = e.target?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case '?':
          e.preventDefault();
          setOpen(v => !v);
          break;
        case 'Escape':
          setOpen(false);
          break;
        case 'f': case 'F':
          if (!open) { navigate('/fan');          }
          break;
        case 'o': case 'O':
          if (!open) { navigate('/operations');   }
          break;
        case 's': case 'S':
          if (!open) { navigate('/staff');        }
          break;
        case 'g': case 'G':
          if (!open) { navigate('/sustainability');}
          break;
        case 'h': case 'H':
          if (!open) { navigate('/');             }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, navigate]);

  return (
    <>
      {/* Trigger hint — bottom-left corner */}
      <div
        className="fixed bottom-5 left-5 z-[500] hidden md:flex items-center gap-1.5 text-[10px] text-[#4A6580] font-mono cursor-pointer hover:text-[#00D4FF] transition-colors group select-none"
        onClick={() => setOpen(true)}
        role="button"
        aria-label="Show keyboard shortcuts"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setOpen(true)}
      >
        <Keyboard size={12} className="group-hover:text-[#00D4FF] transition-colors" />
        <span>Press <Key k="?" /> for shortcuts</span>
      </div>

      {/* Modal overlay */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[550] bg-black/70 backdrop-blur-sm"
              onClick={close}
              aria-hidden="true"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{    opacity: 0, scale: 0.9,  y: 20 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 z-[560] flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="pointer-events-auto w-full max-w-lg bg-[#0A192F] border border-[#00D4FF]/20 rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(0,212,255,0.08)] overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-label="Keyboard shortcuts"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center">
                      <Keyboard size={15} className="text-[#00D4FF]" />
                    </div>
                    <div>
                      <h2 className="font-heading font-bold text-sm text-white">Keyboard Shortcuts</h2>
                      <p className="text-[10px] text-[#4A6580]">Navigate StadiumIQ at full speed</p>
                    </div>
                  </div>
                  <button
                    onClick={close}
                    aria-label="Close shortcuts overlay"
                    className="p-2 rounded-xl text-[#4A6580] hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="p-6 grid gap-6">
                  {/* Navigation shortcuts */}
                  <div>
                    <h3 className="text-[9px] font-bold text-[#00D4FF] uppercase tracking-[0.2em] mb-3">
                      Page Navigation
                    </h3>
                    <div className="space-y-2">
                      {SHORTCUTS.map(({ keys, label, icon: Icon, route }) => (
                        <button
                          key={route}
                          onClick={() => { navigate(route); close(); }}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-[#0D1B2E]/50 hover:border-[#00D4FF]/20 hover:bg-[#00D4FF]/5 transition-all group"
                        >
                          <span className="flex items-center gap-2.5 text-xs text-[#E8F4FD] group-hover:text-white">
                            <Icon size={13} className="text-[#4A6580] group-hover:text-[#00D4FF]" />
                            {label}
                          </span>
                          <div className="flex gap-1">
                            {keys.map(k => <Key key={k} k={k} />)}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* System shortcuts */}
                  <div>
                    <h3 className="text-[9px] font-bold text-[#4A6580] uppercase tracking-[0.2em] mb-3">
                      System
                    </h3>
                    <div className="space-y-2">
                      {SYSTEM_SHORTCUTS.map(({ keys, label }) => (
                        <div key={label} className="flex items-center justify-between text-xs">
                          <span className="text-[#4A6580]">{label}</span>
                          <div className="flex gap-1">
                            {keys.map(k => <Key key={k} k={k} />)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-[#4A6580]">StadiumIQ 2026 — FIFA World Cup Platform</span>
                  <span className="text-[10px] text-[#4A6580] flex items-center gap-1">
                    Press <Key k="Esc" /> to close
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
