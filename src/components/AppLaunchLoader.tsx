import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Leaf } from 'lucide-react';

interface AppLaunchLoaderProps {
  statusMessage?: string;
  isNavigation?: boolean;
  customTitle?: string;
  logoUrl?: string;
  farmName?: string;
}

export const AppLaunchLoader: React.FC<AppLaunchLoaderProps> = ({
  statusMessage,
  isNavigation = false,
}) => {
  const [progress, setProgress] = useState(isNavigation ? 40 : 15);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = [
    'Initializing Smart Goat Management...',
    'Loading herd registry & livestock records...',
    'Synchronizing feed stockpiles & vet supplies...',
    'Farm ledger ready.',
  ];

  useEffect(() => {
    if (isNavigation) {
      const p1 = setTimeout(() => setProgress(75), 100);
      const p2 = setTimeout(() => setProgress(100), 220);
      return () => {
        clearTimeout(p1);
        clearTimeout(p2);
      };
    }

    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 92) return 96;
        return prev + Math.floor(Math.random() * 14) + 8;
      });
    }, 240);

    const stepTimer = setInterval(() => {
      setCurrentStepIndex(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 500);

    return () => {
      clearInterval(progressTimer);
      clearInterval(stepTimer);
    };
  }, [isNavigation]);

  // If this is a quick navigation transition, render a sleek lively floating badge
  if (isNavigation) {
    return (
      <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-center pt-8">
        {/* Top Progress bar */}
        <div className="fixed top-0 left-0 right-0 h-1 bg-stone-200/50 dark:bg-stone-800/50 overflow-hidden z-50">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />
        </div>

        {/* Lively Floating Pill */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.95 }}
          className="pointer-events-auto bg-stone-900/95 text-white px-5 py-2.5 rounded-2xl shadow-2xl border border-emerald-500/40 backdrop-blur-md flex items-center gap-3.5"
        >
          {/* Lively hopping goat icon with reactive ground shadow */}
          <div className="relative flex flex-col items-center justify-center w-9 h-9 shrink-0">
            <motion.div
              animate={{
                y: [0, -11, -12, -2, 0],
                rotate: [-4, 6, -3, 2, -4],
                scaleX: [1, 0.92, 0.94, 1.1, 1],
                scaleY: [1, 1.12, 1.08, 0.9, 1],
              }}
              transition={{
                repeat: Infinity,
                duration: 0.75,
                ease: 'easeInOut',
              }}
              className="text-2xl select-none filter drop-shadow-sm z-10"
            >
              🐐
            </motion.div>
            <motion.div
              animate={{
                scaleX: [1, 0.5, 0.45, 1.2, 1],
                opacity: [0.5, 0.2, 0.15, 0.6, 0.5],
              }}
              transition={{
                repeat: Infinity,
                duration: 0.75,
                ease: 'easeInOut',
              }}
              className="w-5 h-1.5 bg-black/60 rounded-full blur-[1px] -mt-1"
            />
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              <span>{statusMessage || 'Loading Farm Records...'}</span>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
              </motion.span>
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  // Full Initial App Launch Loader featuring the lively system goat icon
  return (
    <div className="fixed inset-0 z-50 bg-stone-950 flex flex-col items-center justify-center p-6 select-none overflow-hidden">
      {/* Subtle radial ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating little celebratory pasture leaves */}
      <motion.div
        animate={{ y: [-10, -60], opacity: [0, 0.8, 0], x: [-15, 10] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeOut' }}
        className="absolute left-1/3 top-1/2 pointer-events-none text-emerald-400"
      >
        <Leaf className="w-4 h-4" />
      </motion.div>
      <motion.div
        animate={{ y: [-5, -70], opacity: [0, 0.7, 0], x: [10, -20] }}
        transition={{ repeat: Infinity, duration: 2.6, delay: 0.8, ease: 'easeOut' }}
        className="absolute right-1/3 top-1/2 pointer-events-none text-emerald-400"
      >
        <Sparkles className="w-4 h-4" />
      </motion.div>

      <div className="relative z-10 max-w-sm w-full flex flex-col items-center text-center space-y-6">
        {/* Lively Animated Main System Goat Emblem */}
        <div className="relative flex flex-col items-center justify-center pt-2">
          {/* Animated glowing pulse ring */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.25, 0.5, 0.25],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.8,
              ease: 'easeInOut',
            }}
            className="absolute -inset-4 rounded-full bg-emerald-500/25 blur-xl pointer-events-none"
          />

          {/* Lively hopping goat mascot */}
          <div className="relative flex flex-col items-center justify-center">
            <motion.div
              animate={{
                y: [0, -18, -20, -3, 0],
                rotate: [-4, 6, -3, 2, -4],
                scaleX: [1, 0.9, 0.92, 1.1, 1],
                scaleY: [1, 1.14, 1.1, 0.9, 1],
              }}
              transition={{
                repeat: Infinity,
                duration: 0.85,
                ease: 'easeInOut',
              }}
              className="text-7xl select-none filter drop-shadow-xl z-10"
            >
              🐐
            </motion.div>

            {/* Reactive ground shadow */}
            <motion.div
              animate={{
                scaleX: [1, 0.5, 0.45, 1.25, 1],
                opacity: [0.55, 0.2, 0.15, 0.65, 0.55],
              }}
              transition={{
                repeat: Infinity,
                duration: 0.85,
                ease: 'easeInOut',
              }}
              className="w-14 h-3 bg-stone-900/90 rounded-full blur-[2px] mt-1"
            />
          </div>
        </div>

        {/* Smooth Animated Progress Bar */}
        <div className="w-full space-y-2 pt-2">
          <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden border border-stone-700/60 p-0.5 shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-400 px-0.5">
            <span className="flex items-center gap-1.5 text-stone-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{statusMessage || steps[currentStepIndex]}</span>
            </span>
            <span className="font-mono text-emerald-400 font-semibold">{Math.min(100, progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
