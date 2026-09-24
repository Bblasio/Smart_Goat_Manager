import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showBackOnlineToast, setShowBackOnlineToast] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBackOnlineToast(true);
      const timer = setTimeout(() => setShowBackOnlineToast(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBackOnlineToast(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed bottom-16 sm:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-stone-900/95 dark:bg-stone-800/95 border border-amber-500/50 px-3.5 py-2 text-xs font-medium text-white shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-2">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <WifiOff className="w-3.5 h-3.5 text-amber-400" />
        <span>Offline Mode — Cached herd records &amp; app shell active</span>
      </div>
    );
  }

  if (showBackOnlineToast) {
    return (
      <div className="fixed bottom-16 sm:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-medium text-white shadow-xl animate-in fade-in duration-300">
        <Wifi className="w-3.5 h-3.5 text-white" />
        <span>Back Online — Changes synced</span>
      </div>
    );
  }

  return null;
};
