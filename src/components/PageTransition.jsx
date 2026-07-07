// ─── PageTransition Wrapper ───────────────────────────────────────
// Wrap each page in this to get slide-in-from-right on navigate.
// Uses framer-motion AnimatePresence with slide + fade combo.

import { motion } from 'framer-motion';

const variants = {
  initial:  { opacity: 0, x: 32, filter: 'blur(2px)' },
  animate:  { opacity: 1, x: 0,  filter: 'blur(0px)' },
  exit:     { opacity: 0, x: -24, filter: 'blur(1px)' },
};

export default function PageTransition({ children, className = '' }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
