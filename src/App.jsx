import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { StadiumProvider } from './context/StadiumContext';
import { ToastProvider } from './components/Toast';
import { useLiveData } from './hooks/useLiveData';
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import SettingsModal from './components/SettingsModal';

// Lazy load all page components for code-splitting and performance
const Landing        = lazy(() => import('./pages/Landing'));
const Fan            = lazy(() => import('./pages/Fan'));
const Operations     = lazy(() => import('./pages/Operations'));
const Staff          = lazy(() => import('./pages/Staff'));
const Sustainability = lazy(() => import('./pages/Sustainability'));

// ─── Animated Routes ──────────────────────────────────────────────
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
  useLiveData();

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Accessibility: Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:bg-blue-500 focus:text-white focus:px-4 focus:py-2.5 focus:rounded-md focus:z-[999] font-bold text-xs uppercase tracking-wider"
      >
        Skip to main content
      </a>

      {/* Global Navbar */}
      <Navbar />

      {/* Keyboard shortcut overlay (press ?) */}
      <KeyboardShortcuts />

      {/* Global Settings Modal */}
      <SettingsModal />

      {/* Main Pages routes wrapped under accessible main and lazy Suspense */}
      <main id="main-content" tabIndex="-1" className="relative focus:outline-none">
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

export default function App() {
  return (
    <ToastProvider>
      <StadiumProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </StadiumProvider>
    </ToastProvider>
  );
}
