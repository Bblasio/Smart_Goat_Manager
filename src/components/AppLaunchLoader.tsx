import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

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
  logoUrl,
  farmName,
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

  // If this is a quick navigation transition, render a sleek floating badge with rotating spinner
  if (isNavigation) {
    return (
      <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-center pt-8">
        {/* Top Progress bar */}
        <div className="fixed top-0 left-0 right-0 h-1 bg-stone-200/50 dark:bg-stone-800/50 overflow-hidden z-50">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Floating Pill with rotating loader */}
        <div className="pointer-events-auto bg-stone-900/95 text-white px-5 py-2.5 rounded-2xl shadow-2xl border border-emerald-500/40 backdrop-blur-md flex items-center gap-3 transition-all duration-200">
          {/* Rotating Circular Spinner */}
          <div className="relative flex items-center justify-center w-6 h-6 shrink-0">
            <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-semibold text-white tracking-wide">
              {statusMessage || 'Loading Farm Records...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Full Initial App Launch Loader featuring a modern, elegant rotating spinner
  return (
    <div className="fixed inset-0 z-50 bg-stone-950 flex flex-col items-center justify-center p-6 select-none overflow-hidden">
      {/* Subtle radial ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-sm w-full flex flex-col items-center text-center space-y-6">
        {/* Elegant Multi-Ring Rotating Loading Animation */}
        <div className="relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28">
          {/* Subtle Ambient Pulse */}
          <div className="absolute -inset-3 rounded-full bg-emerald-500/20 blur-xl pointer-events-none animate-pulse" />

          {/* Outer Rotating Dashed Ring */}
          <div
            className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-500/40 animate-spin"
            style={{ animationDuration: '6s' }}
          />

          {/* Middle Rotating Gradient Ring (Reverse direction) */}
          <div
            className="absolute inset-2 rounded-full border-2 border-t-emerald-400 border-r-teal-400 border-b-transparent border-l-transparent shadow-lg animate-spin"
            style={{ animationDirection: 'reverse', animationDuration: '2.5s' }}
          />

          {/* Inner Glowing Core with Farm Emblem */}
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-400/80 flex items-center justify-center shadow-lg bg-stone-900">
            <img
              src={logoUrl || "/app.png"}
              alt={farmName || "Smart Goat Management"}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Smooth Animated Progress Bar */}
        <div className="w-full space-y-2 pt-2">
          <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden border border-stone-700/60 p-0.5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
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
