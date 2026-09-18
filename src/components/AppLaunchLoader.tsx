import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface AppLaunchLoaderProps {
  statusMessage?: string;
}

export const AppLaunchLoader: React.FC<AppLaunchLoaderProps> = ({
  statusMessage
}) => {
  const [progress, setProgress] = useState(15);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = [
    'Initializing Smart Goat Management...',
    'Loading herd registry & livestock records...',
    'Preparing breeding & gestation schedules...',
    'Farm ledger ready.',
  ];

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 92) return 95;
        return prev + Math.floor(Math.random() * 12) + 6;
      });
    }, 280);

    const stepTimer = setInterval(() => {
      setCurrentStepIndex(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 550);

    return () => {
      clearInterval(progressTimer);
      clearInterval(stepTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 flex flex-col items-center justify-center p-6 select-none overflow-hidden">
      {/* Subtle radial ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-sm w-full flex flex-col items-center text-center space-y-6">
        {/* Animated Farm Emblem */}
        <div className="relative">
          {/* Animated pulse ring */}
          <div className="absolute -inset-3 rounded-3xl bg-emerald-500/20 blur-md animate-pulse" />
          
          {/* Main emblem container */}
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 border border-emerald-400/40 shadow-xl flex items-center justify-center text-4xl transform transition-transform duration-700 hover:scale-105">
            <span className="animate-bounce select-none">🐐</span>
          </div>

          {/* Corner badge */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-stone-900 border border-emerald-500/50 flex items-center justify-center text-emerald-400 text-xs shadow-md">
            <Sparkles className="w-3 h-3" />
          </div>
        </div>

        {/* Title and Tagline */}
        <div className="space-y-1.5">
          <h1 className="text-2xl font-black text-white tracking-tight">
            Smart Goat Management
          </h1>
          <p className="text-xs text-emerald-400/90 font-medium tracking-wide uppercase">
            Livestock & Farm Records System
          </p>
        </div>

        {/* Smooth Animated Progress Bar */}
        <div className="w-full space-y-2 pt-2">
          <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden border border-stone-700/60 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-300 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-400 px-0.5">
            <span className="flex items-center gap-1.5 text-stone-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{statusMessage || steps[currentStepIndex]}</span>
            </span>
            <span className="font-mono text-stone-500">{progress}%</span>
          </div>
        </div>

        {/* Footnote */}
        <div className="pt-4 text-[11px] text-stone-600 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600/70" />
          <span>Local offline caching & real-time sync active</span>
        </div>
      </div>
    </div>
  );
};
