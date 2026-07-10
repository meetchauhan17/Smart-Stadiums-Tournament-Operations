// ─── Keyboard Shortcuts Overlay ───────────────────────────────────
// Press ? anywhere to open. Esc to close.
// Communicates available shortcuts to power users.

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Keyboard, X, Users, Radio, Shield, Leaf, Home } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['F'], label: 'Fan Experience Hub',       icon: Users,   route: '/fan'          },
  { keys: ['O'], label: 'Volunteer Co-Pilot',        icon: Radio,   route: '/operations'   },
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
    <kbd className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-none bg-gray-100 border-2 border-gray-900 text-gray-900 text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_#111827]">
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
        className="fixed bottom-5 left-5 z-[500] hidden md:flex items-center gap-1.5 text-[10px] text-gray-500 font-bold cursor-pointer hover:text-gray-900 transition-colors group select-none"
        onClick={() => setOpen(true)}
        role="button"
        aria-label="Show keyboard shortcuts"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setOpen(true)}
      >
        <Keyboard size={12} className="group-hover:text-gray-900 transition-colors" />
        <span className="uppercase tracking-widest">Press <Key k="?" /> for shortcuts</span>
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
              className="fixed inset-0 z-[550] bg-gray-900/60 backdrop-blur-sm"
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
                className="pointer-events-auto w-full max-w-lg bg-white border-4 border-gray-900 rounded-none shadow-[8px_8px_0px_#111827] overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-label="Keyboard shortcuts"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b-4 border-gray-900 bg-amber-400">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-none bg-white border-2 border-gray-900 flex items-center justify-center shadow-[2px_2px_0px_#111827]">
                      <Keyboard size={15} className="text-gray-900" />
                    </div>
                    <div>
                      <h2 className="font-black text-lg text-gray-900 uppercase tracking-tight">Keyboard Shortcuts</h2>
                      <p className="text-[10px] text-gray-800 font-bold uppercase tracking-widest">Navigate StadiumIQ at full speed</p>
                    </div>
                  </div>
                  <button
                    onClick={close}
                    aria-label="Close shortcuts overlay"
                    className="p-2 rounded-none hover:bg-amber-300 text-gray-900 transition-colors cursor-pointer border-2 border-transparent hover:border-gray-900"
                  >
                    <X size={16} strokeWidth={3} />
                  </button>
                </div>

                <div className="p-6 grid gap-6 bg-white">
                  {/* Navigation shortcuts */}
                  <div>
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">
                      Page Navigation
                    </h3>
                    <div className="space-y-2">
                      {SHORTCUTS.map(({ keys, label, icon: Icon, route }) => (
                        <button
                          key={route}
                          onClick={() => { navigate(route); close(); }}
                          className="w-full flex items-center justify-between p-3 rounded-none border-2 border-gray-200 bg-gray-50 hover:border-blue-600 hover:bg-blue-50 transition-all duration-150 group cursor-pointer"
                        >
                          <span className="flex items-center gap-2.5 text-xs text-gray-900 font-bold uppercase tracking-wider">
                            <Icon size={14} className="text-gray-400 group-hover:text-blue-600" />
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
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">
                      System
                    </h3>
                    <div className="space-y-2">
                      {SYSTEM_SHORTCUTS.map(({ keys, label }) => (
                        <div key={label} className="flex items-center justify-between text-xs border-b-2 border-gray-100 pb-2">
                          <span className="text-gray-600 font-bold uppercase tracking-wider text-[10px]">{label}</span>
                          <div className="flex gap-1">
                            {keys.map(k => <Key key={k} k={k} />)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3 border-t-4 border-gray-900 flex items-center justify-between bg-gray-100">
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">StadiumIQ 2026 — FIFA World Cup</span>
                  <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-1">
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
