import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  Database,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  ExternalLink,
  X,
  ShieldAlert,
  ArrowUpRight,
  HardDrive
} from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ isOpen, onClose }) => {
  const {
    firebaseUser,
    syncStatus,
    syncError,
    syncAllCurrentRecordsToFirebase,
    refreshFromFirebase,
    goats,
    breeding,
    health,
    sales,
    expenses,
    workers,
    milk,
    isDemoMode,
  } = useFarm();

  const [isSyncing, setIsSyncing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedRules, setCopiedRules] = useState(false);

  if (!isOpen) return null;

  const dbUrl = "https://goat-smart-farm-default-rtdb.firebaseio.com/";

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setFeedback(null);
    try {
      const res = await syncAllCurrentRecordsToFirebase();
      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'Synchronized successfully',
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'Could not write to Firebase. Check database security rules.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error communicating with Firebase database.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRefresh = async () => {
    setIsSyncing(true);
    setFeedback(null);
    try {
      await refreshFromFirebase();
      setFeedback({
        type: 'success',
        message: 'Successfully polled latest records from Firebase Realtime Database.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to refresh from database.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const recommendedRules = `{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}`;

  const copyRulesToClipboard = () => {
    navigator.clipboard.writeText(recommendedRules);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2500);
  };

  const isPermissionDenied = syncError?.toLowerCase().includes('permission') || syncError?.toLowerCase().includes('denied');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50/70">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              syncStatus === 'connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <span>Firebase Realtime Database Sync</span>
              </h3>
              <p className="text-xs text-stone-500 font-mono">
                {dbUrl}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Status Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            syncStatus === 'connected'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : syncStatus === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            {syncStatus === 'connected' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : syncStatus === 'error' ? (
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <Cloud className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <div className="font-bold flex items-center gap-2 text-sm">
                <span>
                  {syncStatus === 'connected'
                    ? 'Connected & Synchronized with Firebase'
                    : syncStatus === 'error'
                    ? 'Firebase Database Permission / Sync Notice'
                    : 'Connecting to Realtime Database...'}
                </span>
              </div>
              <p className="mt-1 leading-relaxed">
                {syncError ? (
                  <span className="font-mono">{syncError}</span>
                ) : syncStatus === 'connected' ? (
                  'Your farm entries are actively saved and synchronized across your sessions.'
                ) : isDemoMode ? (
                  'You are in demo mode. Log in with your farm account to save and sync your records permanently.'
                ) : (
                  'Attempting handshake with Firebase Realtime Database.'
                )}
              </p>
            </div>
          </div>

          {/* Feedback message if any */}
          {feedback && (
            <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                : 'bg-rose-100 text-rose-900 border border-rose-200'
            }`}>
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Records Summary */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
            <div className="text-xs font-bold text-stone-700 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-stone-500" />
                Active Farm Records in Memory & Local Storage:
              </span>
              <span className="text-[11px] font-normal text-stone-500">
                {firebaseUser ? `User: ${firebaseUser.email}` : 'Local Session'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                <div className="text-lg font-bold text-emerald-700">{goats.length}</div>
                <div className="text-[11px] text-stone-500">Goats</div>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                <div className="text-lg font-bold text-emerald-700">{breeding.length}</div>
                <div className="text-[11px] text-stone-500">Breeding</div>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                <div className="text-lg font-bold text-emerald-700">{health.length}</div>
                <div className="text-[11px] text-stone-500">Health</div>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                <div className="text-lg font-bold text-emerald-700">{sales.length + expenses.length}</div>
                <div className="text-[11px] text-stone-500">Finances</div>
              </div>
            </div>
          </div>

          {/* Database Security Rules Guide (Shown especially if permission denied or error) */}
          {(isPermissionDenied || syncStatus === 'error') && (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300/80 text-amber-950 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>How to enable Realtime Database in Firebase Console:</span>
                </div>
                <button
                  type="button"
                  onClick={copyRulesToClipboard}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-md border border-amber-300 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedRules ? 'Copied!' : 'Copy Rules'}</span>
                </button>
              </div>

              <p className="text-[11px] text-amber-900 leading-relaxed">
                By default, newly provisioned Firebase Realtime Databases lock all read/write access. To allow your logged-in farm account to read and write records:
              </p>

              <ol className="text-[11px] list-decimal list-inside space-y-1 text-amber-900 font-medium">
                <li>Go to your <strong>Firebase Console</strong> → select project <strong>goat-smart-farm</strong></li>
                <li>In Build menu, click <strong>Realtime Database</strong></li>
                <li>Click the <strong>Rules</strong> tab at the top</li>
                <li>Paste the following rule and click <strong>Publish</strong>:</li>
              </ol>

              <pre className="p-3 bg-stone-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto shadow-inner">
                {recommendedRules}
              </pre>
            </div>
          )}

          {/* Sync actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              id="btn-modal-push-sync"
              onClick={handleSyncNow}
              disabled={isSyncing || !firebaseUser}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
            >
              <Cloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
              <span>{isSyncing ? 'Writing to Firebase...' : 'Push All Local Records to Database'}</span>
            </button>

            <button
              type="button"
              id="btn-modal-refresh-sync"
              onClick={handleRefresh}
              disabled={isSyncing || !firebaseUser}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Fetch & Poll Database</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-stone-200 bg-stone-50/80 text-xs text-stone-500">
          <span>Target: <span className="font-mono text-stone-700">users/{firebaseUser?.uid || 'offline'}/records</span></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
