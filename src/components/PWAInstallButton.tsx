import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, Smartphone, CheckCircle2, X } from 'lucide-react';

export const isMobileOrTablet = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isMobileUA = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(ua);
  const isTouchTablet = ('ontouchstart' in window || navigator.maxTouchPoints > 0) && window.innerWidth <= 1024;
  const isSmallScreen = window.innerWidth < 1024;
  return isMobileUA || isTouchTablet || isSmallScreen;
};

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'card' | 'inline';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'card',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // Strictly Mobile & Tablet only: PWA installation is disabled on Desktop
  if (!isMobileOrTablet()) {
    return null;
  }

  // If already installed in standalone mode
  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Installed as standalone application</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
    } else if (isInstallable) {
      await install();
    } else {
      await install();
    }
  };

  // Card Variant (For mobile/tablet Settings page)
  return (
    <>
      <div className={`p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 space-y-3 ${className}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100">
            Install Smart Goat App
          </div>
        </div>

        {isIOS ? (
          <button
            type="button"
            onClick={() => setShowIOSModal(true)}
            className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-2xs flex items-center justify-center gap-2"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Install on iOS</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-2xs flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install to Device</span>
          </button>
        )}
      </div>

      {showIOSModal && <IOSInstallModal onClose={() => setShowIOSModal(false)} />}
    </>
  );
};

// Modal for iOS Safari Users with Visual Steps & Auto-dismiss Timer
export const IOSInstallModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [countdown, setCountdown] = useState(8);

  React.useEffect(() => {
    if (countdown <= 0) {
      onClose();
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 shadow-2xl space-y-4">
        {/* Auto-dismiss progress bar */}
        <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-1 overflow-hidden">
          <div
            className="bg-emerald-500 h-full transition-all duration-1000 ease-linear"
            style={{ width: `${(countdown / 8) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              🐐
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Install on iPhone / iPad
              </h3>
              <p className="text-[10px] text-stone-400">
                Auto-dismissing in {countdown}s
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 text-xs mt-0.5">
              1
            </div>
            <div>
              <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <span>Tap the</span>
                <span className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                  <Share2 className="w-3 h-3" /> Share
                </span>
                <span>button</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Located at the bottom of Safari on iPhone, or top bar on iPad.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 text-xs mt-0.5">
              2
            </div>
            <div>
              <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <span>Scroll down and select</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                  <PlusSquare className="w-3 h-3" /> Add to Home Screen
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Launches full-screen with offline support and fastest access.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-bold text-xs transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
