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
    <kbd className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded bg-[#111827] text-white text-[10px] font-mono font-bold uppercase tracking-wider shadow-none">
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
        className="fixed bottom-5 left-5 z-[500] hidden md:flex items-center gap-1.5 text-[10px] text-[#6B7280] font-mono cursor-pointer hover:text-[#3B82F6] transition-colors group select-none"
        onClick={() => setOpen(true)}
        role="button"
        aria-label="Show keyboard shortcuts"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setOpen(true)}
      >
        <Keyboard size={12} className="group-hover:text-[#3B82F6] transition-colors" />
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
              className="fixed inset-0 z-[550] bg-black/40"
              onClick={close}
              aria-hidden="true"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{    opacity: 0, scale: 0.95,  y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-0 z-[560] flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="pointer-events-auto w-full max-w-lg bg-white border-4 border-[#111827] rounded-lg shadow-none overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-label="Keyboard shortcuts"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#E5E7EB]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#3B82F6]/10 flex items-center justify-center">
                      <Keyboard size={15} className="text-[#3B82F6]" />
                    </div>
                    <div>
                      <h2 className="font-heading font-extrabold text-sm text-[#111827]">Keyboard Shortcuts</h2>
                      <p className="text-[10px] text-[#6B7280] font-semibold">Navigate StadiumIQ at full speed</p>
                    </div>
                  </div>
                  <button
                    onClick={close}
                    aria-label="Close shortcuts overlay"
                    className="p-2 rounded hover:bg-gray-100 text-[#6B7280] hover:text-[#111827] transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="p-6 grid gap-6">
                  {/* Navigation shortcuts */}
                  <div>
                    <h3 className="text-[9px] font-bold text-[#3B82F6] uppercase tracking-wider mb-3">
                      Page Navigation
                    </h3>
                    <div className="space-y-2">
                      {SHORTCUTS.map(({ keys, label, icon: Icon, route }) => (
                        <button
                          key={route}
                          onClick={() => { navigate(route); close(); }}
                          className="w-full flex items-center justify-between p-2.5 rounded border-2 border-[#E5E7EB] bg-white hover:border-[#3B82F6] hover:bg-[#EFF6FF] transition-all duration-150 group cursor-pointer"
                        >
                          <span className="flex items-center gap-2.5 text-xs text-[#111827] font-semibold">
                            <Icon size={13} className="text-[#6B7280] group-hover:text-[#3B82F6]" />
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
                    <h3 className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider mb-3">
                      System
                    </h3>
                    <div className="space-y-2">
                      {SYSTEM_SHORTCUTS.map(({ keys, label }) => (
                        <div key={label} className="flex items-center justify-between text-xs border-b border-[#E5E7EB]/50 pb-2">
                          <span className="text-[#6B7280] font-semibold">{label}</span>
                          <div className="flex gap-1">
                            {keys.map(k => <Key key={k} k={k} />)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3 border-t-2 border-[#E5E7EB] flex items-center justify-between bg-[#F3F4F6]">
                  <span className="text-[10px] text-[#6B7280] font-semibold">StadiumIQ 2026 — FIFA World Cup Platform</span>
                  <span className="text-[10px] text-[#6B7280] font-semibold flex items-center gap-1">
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
