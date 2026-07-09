import { motion } from 'framer-motion';

const variants = {
  initial:  { opacity: 0, y: 8 },
  animate:  { opacity: 1, y: 0 },
  exit:     { opacity: 0, y: -8 },
};

export default function PageTransition({ children, className = '' }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`min-h-screen w-full bg-white ${className}`.trim()}
    >
      {children}
    </motion.div>
  );
}
