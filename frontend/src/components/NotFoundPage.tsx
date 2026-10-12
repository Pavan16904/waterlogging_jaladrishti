import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Satellite, Home, Droplets, AlertTriangle } from 'lucide-react';

interface NotFoundPageProps {
  onNavigateHome: () => void;
}

/**
 * NotFoundPage — Branded 404 page for JalaDrishti AI.
 * Shown when a user navigates to an unrecognised tab/route.
 * Preserves the platform's dark-mode-first aesthetic.
 */
export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigateHome }) => {
  const [countdown, setCountdown] = useState<number>(10);

  // Auto-redirect to home after 10 seconds
  useEffect(() => {
    if (countdown <= 0) {
      onNavigateHome();
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onNavigateHome]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary,#080c14)] text-slate-100">
      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl" />
      </div>

      <main
        id="not-found-page"
        className="flex-1 flex flex-col items-center justify-center px-4 text-center relative z-10"
        aria-label="Page not found"
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="max-w-lg w-full"
        >
          {/* Brand mark */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25">
              <Satellite className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              JalaDrishti AI
            </span>
          </div>

          {/* 404 display */}
          <div className="relative mb-6">
            <h1
              id="error-code"
              className="text-[120px] sm:text-[160px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-slate-300/60 to-slate-700/30 select-none"
            >
              404
            </h1>
            {/* Floating droplet icon */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-1">
                <Droplets className="w-10 h-10 text-cyan-400/80" />
                <AlertTriangle className="w-5 h-5 text-amber-400/60" />
              </div>
            </motion.div>
          </div>

          {/* Heading & message */}
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Page Not Found
          </h2>
          <p className="text-slate-400 text-base mb-2 leading-relaxed">
            The section you're looking for doesn't exist or has been moved.
            Check the navigation tabs above to find what you need.
          </p>
          <p className="text-slate-500 text-sm mb-8">
            Returning to the Flood Map in{' '}
            <span className="font-bold text-cyan-400 tabular-nums">{countdown}s</span>
          </p>

          {/* CTA */}
          <button
            id="go-home-btn"
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-105 active:scale-100 transition-all duration-200"
          >
            <Home className="w-4 h-4" />
            Go to Flood Map
          </button>

          {/* Status indicators */}
          <div className="mt-10 flex items-center justify-center gap-6 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sentinel SAR · Live
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              Open-Meteo · Live
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              FAO-56 · Live
            </span>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default NotFoundPage;
