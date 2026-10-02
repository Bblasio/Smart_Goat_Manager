import React, { useState, useEffect } from 'react';

interface AppLaunchLoaderProps {
  statusMessage?: string;
  isNavigation?: boolean;
  customTitle?: string;
  logoUrl?: string;
  farmName?: string;
  onComplete?: () => void;
}

export const AppLaunchLoader: React.FC<AppLaunchLoaderProps> = ({
  statusMessage,
  isNavigation = false,
  logoUrl,
  farmName,
  onComplete,
}) => {
  const [progress, setProgress] = useState(isNavigation ? 15 : 10);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const steps = [
    'Initializing Smart Goat Management...',
    'Loading herd registry & livestock records...',
    'Synchronizing feed stockpiles & vet supplies...',
    'Farm ledger ready.',
  ];

  useEffect(() => {
    if (isNavigation) {
      // Smooth continuous progress:
      // 0ms: 15% -> 120ms: 42% -> 300ms: 76% (exact 76% from screenshot) -> 520ms: 95% -> 700ms: 100%
      const t1 = setTimeout(() => setProgress(42), 120);
      const t2 = setTimeout(() => setProgress(76), 300);
      const t3 = setTimeout(() => setProgress(95), 520);
      const t4 = setTimeout(() => setProgress(100), 700);

      // Begin graceful fade-out when reaching 100%
      const tFade = setTimeout(() => {
        setIsFadingOut(true);
      }, 760);

      // Notify parent to unmount after fade completes
      const tDone = setTimeout(() => {
        onComplete?.();
      }, 980);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        clearTimeout(tFade);
        clearTimeout(tDone);
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
  }, [isNavigation, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 select-none overflow-hidden transition-opacity duration-300 ease-in-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${
        isNavigation
          ? 'bg-stone-950/95 backdrop-blur-md'
          : 'bg-stone-950'
      }`}
    >
      {/* Subtle radial ambient background emerald glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-sm w-full flex flex-col items-center text-center space-y-6">
        {/* Multi-Ring Rotating Loading Animation matching the user photo */}
        <div className="relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28">
          {/* Ambient Glow */}
          <div className="absolute -inset-3 rounded-full bg-emerald-500/25 blur-xl pointer-events-none" />

          {/* Outer Rotating Dashed Ring */}
          <div
            className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-400/50 animate-spin"
            style={{ animationDuration: '4s' }}
          />

          {/* Middle Rotating Gradient Ring (Reverse direction) */}
          <div
            className="absolute inset-2 rounded-full border-2 border-t-emerald-400 border-r-teal-400 border-b-transparent border-l-transparent shadow-lg animate-spin"
            style={{ animationDirection: 'reverse', animationDuration: '2s' }}
          />

          {/* Inner Glowing Core with Farm Emblem */}
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-400/80 flex items-center justify-center shadow-lg bg-stone-900 p-0.5">
            <img
              src={logoUrl || "/app.png"}
              alt={farmName || "Smart Goat Management"}
              className="w-full h-full object-cover rounded-full"
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
            <span className="flex items-center gap-1.5 text-stone-300 truncate max-w-[240px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="truncate">{statusMessage || steps[currentStepIndex]}</span>
            </span>
            <span className="font-mono text-emerald-400 font-bold shrink-0">{Math.min(100, progress)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
