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
    <div className="min-h-screen bg-[#FFFFFF] text-[#111827] relative overflow-hidden selection:bg-[#3B82F6]/20 selection:text-[#111827]">
      {/* Accessibility: Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:bg-[#3B82F6] focus:text-white focus:px-4 focus:py-2.5 focus:rounded-md focus:z-[999] font-bold text-xs uppercase tracking-wider ring-2 ring-offset-2 ring-[#3B82F6]"
      >
        Skip to main content
      </a>

      {/* Global Navbar */}
      <Navbar />

      {/* Keyboard shortcut overlay (press ?) */}
      <KeyboardShortcuts />

      {/* Decorative top ambient grid background - replaced with flat subtle geometric pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#F3F4F6_1px,transparent_1px),linear-gradient(to_bottom,#F3F4F6_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-70 pointer-events-none z-0" />

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
