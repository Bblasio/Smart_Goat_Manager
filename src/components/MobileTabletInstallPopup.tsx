import React, { useState, useEffect, useRef } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';
import { IOSInstallModal } from './PWAInstallButton';

const POPUP_DURATION_MS = 8000;
const SESSION_DISMISSED_KEY = 'sgm_pwa_popup_dismissed_session';

export const MobileTabletInstallPopup: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [progressPercent, setProgressPercent] = useState(100);
  const popupRef = useRef<HTMLDivElement>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInteractingRef = useRef<boolean>(false);

  // Check if device is Mobile or Tablet (never Desktop!)
  const isMobileOrTablet = () => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const isMobileUA = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(ua);
    const isTouchTablet = ('ontouchstart' in window || navigator.maxTouchPoints > 0) && window.innerWidth <= 1024;
    const isSmallScreen = window.innerWidth < 1024;
    return isMobileUA || isTouchTablet || isSmallScreen;
  };

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem(SESSION_DISMISSED_KEY, 'true');
    } catch {
      // ignore
    }
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  useEffect(() => {
    // 1. Strict guard: ONLY Mobile and Tablet, NEVER Desktop!
    if (!isMobileOrTablet()) {
      return;
    }

    // 2. Already running standalone PWA
    if (isInstalled) {
      return;
    }

    // 3. Already dismissed in this session
    try {
      if (sessionStorage.getItem(SESSION_DISMISSED_KEY) === 'true') {
        return;
      }
    } catch {
      // ignore
    }

    // 4. Delayed appearance so page finishes loading
    const delayTimer = setTimeout(() => {
      setIsVisible(true);

      const startTime = Date.now();
      // Progress bar animation interval
      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, POPUP_DURATION_MS - elapsed);
        const pct = (remaining / POPUP_DURATION_MS) * 100;
        setProgressPercent(pct);
        if (remaining <= 0) {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        }
      }, 100);

      // Auto-dismiss countdown timer
      dismissTimerRef.current = setTimeout(() => {
        handleDismiss();
      }, POPUP_DURATION_MS);
    }, 1500);

    return () => {
      clearTimeout(delayTimer);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isInstalled]);

  // Dismiss as soon as user starts interacting with the app outside this popup
  useEffect(() => {
    if (!isVisible) return;

    const handleUserSystemInteraction = (e: Event) => {
      // If user tapped or interacted inside the popup, don't dismiss
      if (popupRef.current && popupRef.current.contains(e.target as Node)) {
        return;
      }
      // User tapped, scrolled, or navigated anywhere else on the system -> disappear immediately
      handleDismiss();
    };

    // User interaction listeners
    window.addEventListener('scroll', handleUserSystemInteraction, { passive: true, capture: true });
    window.addEventListener('touchstart', handleUserSystemInteraction, { passive: true, capture: true });
    window.addEventListener('pointerdown', handleUserSystemInteraction, { passive: true, capture: true });
    window.addEventListener('keydown', handleUserSystemInteraction, { passive: true, capture: true });

    return () => {
      window.removeEventListener('scroll', handleUserSystemInteraction, { capture: true });
      window.removeEventListener('touchstart', handleUserSystemInteraction, { capture: true });
      window.removeEventListener('pointerdown', handleUserSystemInteraction, { capture: true });
      window.removeEventListener('keydown', handleUserSystemInteraction, { capture: true });
    };
  }, [isVisible]);

  const handleActionClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    isInteractingRef.current = true;
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    if (isIOS) {
      setIsVisible(false);
      setShowIOSModal(true);
    } else {
      setIsVisible(false);
      await install();
    }
  };

  // Do not render anything on Desktop, or when not visible
  if (!isVisible && !showIOSModal) {
    return null;
  }

  return (
    <>
      {isVisible && (
        <div
          ref={popupRef}
          id="mobile-pwa-install-popup"
          className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-xs z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-emerald-500/40 dark:border-emerald-600/40 rounded-2xl p-3.5 shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in"
          role="dialog"
          aria-label="Install Smart Goat Manager App"
        >
          {/* Visual duration progress bar */}
          <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-1 mb-2.5 overflow-hidden">
            <div
              className="bg-emerald-600 dark:bg-emerald-500 h-full transition-all duration-100 ease-linear rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                🐐
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-stone-900 dark:text-white truncate">
                  Smart Goat Manager
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                  Install app on device
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                id="btn-popup-install-mobile"
                onClick={handleActionClick}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-transform flex items-center gap-1.5"
              >
                {isIOS ? (
                  <>
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Install</span>
                  </>
                )}
              </button>

              <button
                type="button"
                id="btn-popup-dismiss-mobile"
                onClick={handleDismiss}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                aria-label="Dismiss install prompt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showIOSModal && <IOSInstallModal onClose={() => setShowIOSModal(false)} />}
    </>
  );
};
