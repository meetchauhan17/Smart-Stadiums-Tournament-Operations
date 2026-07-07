import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { StadiumProvider } from './context/StadiumContext';
import { ToastProvider } from './components/ToastProvider';
import { useLiveData } from './hooks/useLiveData';
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';
import KeyboardShortcuts from './components/KeyboardShortcuts';

// Lazy load all page components for code-splitting and performance
const Landing        = lazy(() => import('./pages/Landing'));
const Fan            = lazy(() => import('./pages/Fan'));
const Operations     = lazy(() => import('./pages/Operations'));
const Staff          = lazy(() => import('./pages/Staff'));
const Sustainability = lazy(() => import('./pages/Sustainability'));

// ─── Animated Routes ──────────────────────────────────────────────
// Must be inside BrowserRouter to use useLocation
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/"              element={<Landing />}        />
        <Route path="/fan"           element={<Fan />}            />
        <Route path="/operations"    element={<Operations />}     />
        <Route path="/staff"         element={<Staff />}          />
        <Route path="/sustainability" element={<Sustainability />} />
      </Routes>
    </AnimatePresence>
  );
}

// ─── Inner Content Component ──────────────────────────────────────
function AppContent() {
  // Activate real-time stadium updates simulation
  useLiveData();

  return (
    <div className="min-h-screen bg-[#060D1A] text-[#E8F4FD] relative overflow-hidden selection:bg-[#00D4FF]/30 selection:text-white">
      {/* Accessibility: Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:bg-[#00D4FF] focus:text-[#060D1A] focus:px-4 focus:py-2.5 focus:rounded-xl focus:z-[999] font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,212,255,0.4)]"
      >
        Skip to main content
      </a>

      {/* Global Navbar */}
      <Navbar />

      {/* Keyboard shortcut overlay (press ?) */}
      <KeyboardShortcuts />

      {/* Decorative top ambient grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c1b30_1px,transparent_1px),linear-gradient(to_bottom,#0c1b30_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none z-0" />

      {/* Main Pages routes wrapped under accessible main and lazy Suspense */}
      <main id="main-content" tabIndex="-1" className="relative z-10 min-h-screen flex flex-col justify-between focus:outline-none">
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner size="md" />
          </div>
        }>
          <AnimatedRoutes />
        </Suspense>
      </main>
    </div>
  );
}

// ─── Top Level Router and Provider Wrapper ────────────────────────
export default function App() {
  return (
    <StadiumProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ToastProvider>
    </StadiumProvider>
  );
}
