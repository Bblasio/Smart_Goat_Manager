import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, Smartphone, CheckCircle2, X } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'card' | 'inline';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showDesktopHelpModal, setShowDesktopHelpModal] = useState(false);

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
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      setShowDesktopHelpModal(true);
    }
  };

  // Header Variant (Compact button for top bars)
  if (variant === 'header') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition-all active:scale-95 ${className}`}
          title="Install Smart Goat Manager to home screen"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install App</span>
        </button>

        {showIOSModal && <IOSInstallModal onClose={() => setShowIOSModal(false)} />}
        {showDesktopHelpModal && <DesktopInstallModal onClose={() => setShowDesktopHelpModal(false)} />}
      </>
    );
  }

  // Sidebar Variant (Full width button for drawer/navigation)
  if (variant === 'sidebar') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className={`w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-colors ${className}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div>Install Application</div>
              <div className="text-[10px] font-normal text-emerald-700/80 dark:text-emerald-400">
                {isIOS ? 'Add to Home Screen (iOS)' : 'Fast launch & offline mode'}
              </div>
            </div>
          </div>
          <span className="text-[11px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-md">
            Install
          </span>
        </button>

        {showIOSModal && <IOSInstallModal onClose={() => setShowIOSModal(false)} />}
        {showDesktopHelpModal && <DesktopInstallModal onClose={() => setShowDesktopHelpModal(false)} />}
      </>
    );
  }

  // Card Variant (For Settings page)
  return (
    <>
      <div className={`p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 space-y-3 ${className}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100">
                Install Smart Goat App
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Install as a native home screen app with zero browser url bars and offline caching.
              </p>
            </div>
          </div>
        </div>

        {isIOS ? (
          <div className="space-y-2">
            <div className="text-xs text-stone-600 dark:text-stone-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5">
              <div className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 mb-1">
                <Share2 className="w-3.5 h-3.5" />
                <span>iOS Safari Installation</span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                Tap the Safari <strong>Share</strong> button, then scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowIOSModal(true)}
              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-2xs flex items-center justify-center gap-2"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>View iOS Install Guide</span>
            </button>
          </div>
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
      {showDesktopHelpModal && <DesktopInstallModal onClose={() => setShowDesktopHelpModal(false)} />}
    </>
  );
};

// Modal for iOS Safari Users with Visual Steps
export const IOSInstallModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              🐐
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Install on iPhone / iPad
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Safari requires manual home screen pinning
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
                <span>Scroll down and tap</span>
                <span className="inline-flex items-center gap-1 font-bold text-stone-800 dark:text-stone-200 bg-stone-200 dark:bg-stone-700 px-1.5 py-0.5 rounded">
                  <PlusSquare className="w-3 h-3" /> Add to Home Screen
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                This adds the Smart Goat icon directly to your applications grid.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 text-xs mt-0.5">
              3
            </div>
            <div>
              <div className="font-semibold text-stone-900 dark:text-stone-100">
                Confirm by tapping <span className="font-bold text-emerald-600 dark:text-emerald-400">Add</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Launch anytime with full offline caching and full-screen pasture workflow!
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

// Modal for Desktop Chrome / Edge when beforeinstallprompt is in standard mode
export const DesktopInstallModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              🐐
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Install Smart Goat App
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Standalone desktop &amp; mobile app
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

        <div className="text-xs text-stone-600 dark:text-stone-300 space-y-2">
          <p>
            To install Smart Goat Manager directly onto your desktop or phone:
          </p>
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 space-y-1.5">
            <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>In Chrome / Edge Address Bar:</span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Click the <strong>Install icon</strong> in the right side of the address bar, or open the browser menu (⋮) and select <strong>"Install Smart Goat Manager..."</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-2xs"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
