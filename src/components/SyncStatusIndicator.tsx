import React, { useState, useRef, useEffect } from 'react';
import { useFarm } from '../context/FarmContext';
import { useToast } from '../context/ToastContext';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  Database,
  ArrowUpRight,
  ShieldCheck,
  X
} from 'lucide-react';

interface SyncStatusIndicatorProps {
  compact?: boolean;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ compact = false }) => {
  const {
    isOnline,
    isSyncing,
    syncStatus,
    syncError,
    lastSyncedAt,
    syncAllCurrentRecordsToFirebase,
    isDemoMode,
    user
  } = useFarm();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) {
      showToast('Cannot sync to cloud while offline. Please check your internet connection.', 'warning');
      return;
    }
    if (isDemoMode) {
      showToast('Demo mode: records are saved locally. Sign in to sync to cloud.', 'info');
      return;
    }

    setIsManualSyncing(true);
    try {
      const res = await syncAllCurrentRecordsToFirebase();
      if (res.success) {
        showToast('All farm records successfully synced to cloud!', 'success');
      } else {
        showToast(res.message || 'Cloud sync failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Sync error', 'error');
    } finally {
      setIsManualSyncing(false);
    }
  };

  const formatLastSync = (date: Date | null): string => {
    if (!date) return 'Not yet synced';
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
    if (diffSeconds < 10) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMins = Math.round(diffSeconds / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Determine current badge style and label
  const getStatusDetails = () => {
    if (!isOnline || syncStatus === 'local_fallback') {
      return {
        label: 'Offline (Local)',
        shortLabel: 'Offline',
        tooltip: 'Working offline. Changes are saved locally on this device and will sync automatically once reconnected.',
        badgeClass: 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300',
        dotClass: 'bg-amber-500',
        icon: CloudOff,
        isWarning: true
      };
    }
    if (isSyncing || isManualSyncing) {
      return {
        label: 'Syncing to Cloud...',
        shortLabel: 'Syncing...',
        tooltip: 'Actively syncing herd updates to cloud database...',
        badgeClass: 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-300',
        dotClass: 'bg-sky-500 animate-pulse',
        icon: RefreshCw,
        spinning: true
      };
    }
    if (syncStatus === 'connecting') {
      return {
        label: 'Connecting...',
        shortLabel: 'Connecting',
        tooltip: 'Connecting to cloud database...',
        badgeClass: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
        dotClass: 'bg-amber-500 animate-ping',
        icon: RefreshCw,
        spinning: true
      };
    }
    if (syncStatus === 'error') {
      return {
        label: 'Sync Warning',
        shortLabel: 'Warning',
        tooltip: syncError || 'Cloud synchronization paused. Retrying...',
        badgeClass: 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300',
        dotClass: 'bg-rose-500',
        icon: AlertCircle,
        isError: true
      };
    }
    // Default: connected & online
    return {
      label: 'Cloud Synced',
      shortLabel: 'Synced',
      tooltip: `Online • All records safely synced (${formatLastSync(lastSyncedAt)})`,
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
      dotClass: 'bg-emerald-500',
      icon: CheckCircle2
    };
  };

  const status = getStatusDetails();
  const IconComponent = status.icon;

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Trigger Button / Badge */}
      <button
        type="button"
        id="btn-sync-status-indicator"
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex items-center gap-1.5 rounded-full border text-xs font-semibold transition-all hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
          status.badgeClass
        } ${compact ? 'px-2 py-1' : 'px-2.5 py-1'}`}
        title={status.tooltip}
        aria-expanded={isOpen}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          {(isSyncing || status.spinning) && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.dotClass}`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${status.dotClass}`} />
        </span>

        <IconComponent className={`w-3 h-3 shrink-0 ${status.spinning ? 'animate-spin' : ''}`} />

        {compact ? (
          <span className="whitespace-nowrap font-medium text-[10px] sm:text-[11px]">
            {status.shortLabel}
          </span>
        ) : (
          <span className="whitespace-nowrap font-medium text-[11px] sm:text-xs">
            {status.label}
          </span>
        )}
      </button>

      {/* Detail Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl z-50 p-4 text-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                Cloud & Sync Status
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="py-3 space-y-3">
            {/* Internet Status */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60">
              <div className="flex items-center gap-2.5">
                {isOnline ? (
                  <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                )}
                <div>
                  <div className="font-bold text-stone-800 dark:text-stone-200">
                    Network Connection
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400">
                    {isOnline ? 'Online • Internet active' : 'Offline • No internet'}
                  </div>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isOnline
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                }`}
              >
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Cloud Database Status */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60">
              <div className="flex items-center gap-2.5">
                <Cloud className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <div>
                  <div className="font-bold text-stone-800 dark:text-stone-200">
                    Cloud Database
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400">
                    {isSyncing || isManualSyncing
                      ? 'Actively syncing...'
                      : syncStatus === 'connected'
                      ? 'Firebase RTDB Connected'
                      : syncStatus === 'local_fallback' || !isOnline
                      ? 'Local offline storage active'
                      : 'Connecting to cloud...'}
                  </div>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  syncStatus === 'connected' && isOnline
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    : isSyncing || isManualSyncing
                    ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 animate-pulse'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                }`}
              >
                {isSyncing || isManualSyncing ? 'Syncing' : syncStatus === 'connected' && isOnline ? 'Synced' : 'Offline Mode'}
              </span>
            </div>

            {/* Sync Timestamp info */}
            <div className="px-1 text-[11px] text-stone-500 dark:text-stone-400 flex items-center justify-between">
              <span>Last cloud sync:</span>
              <strong className="text-stone-700 dark:text-stone-300 font-medium">
                {formatLastSync(lastSyncedAt)}
              </strong>
            </div>

            {/* Helpful explanation */}
            <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/50 text-[11px] text-emerald-900 dark:text-emerald-200">
              <div className="flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  All records are encrypted and preserved locally on this device. When online, your herd data syncs automatically in real-time.
                </span>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              id="btn-force-manual-sync"
              disabled={!isOnline || isSyncing || isManualSyncing}
              onClick={handleManualSync}
              className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs ${
                !isOnline || isSyncing || isManualSyncing
                  ? 'bg-stone-100 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
              <span>{isManualSyncing ? 'Synchronizing Records...' : 'Sync All Records to Cloud'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
