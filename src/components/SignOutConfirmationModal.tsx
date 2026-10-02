import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { LogOut, AlertTriangle, ShieldCheck, X, WifiOff } from 'lucide-react';

interface SignOutConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => Promise<void> | void;
}

export const SignOutConfirmationModal: React.FC<SignOutConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { farmName, user, firebaseUser, isDemoMode, isOnline, logout } = useFarm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const displayEmail = firebaseUser?.email || user?.email || (isDemoMode ? 'demo@smartgoat.farm' : 'Signed-in User');
  const displayFarm = farmName || 'Smart Goat Farm';

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      if (onConfirm) {
        await onConfirm();
      } else {
        await logout();
      }
      onClose();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Icon & Close */}
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
            <LogOut className="w-6 h-6" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-stone-900 dark:text-white">
            {isDemoMode ? 'Exit Demo Session?' : 'Sign Out of Farm Session?'}
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
            {isDemoMode
              ? 'You are about to exit demo mode. You will return to the welcome and sign-in screen.'
              : 'Are you sure you want to sign out? You will need your login credentials to access your herd records, breeding schedules, and reports again.'}
          </p>
        </div>

        {/* Account Summary Chip */}
        <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 text-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
            {displayFarm.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-stone-900 dark:text-white truncate">
              {displayFarm}
            </div>
            <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
              {displayEmail}
            </div>
          </div>
        </div>

        {/* Offline Warning Notice if disconnected */}
        {!isOnline && (
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Offline Warning: </span>
              You are currently disconnected. Make sure you don't clear your browser data before reconnecting so your pending local sync updates are preserved.
            </div>
          </div>
        )}

        {/* Reassurance Banner */}
        <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 pt-1">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>All saved herd data and transactions are safely stored.</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100 dark:border-stone-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            id="btn-confirm-signout"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>{isSubmitting ? 'Signing out...' : isDemoMode ? 'Exit Demo' : 'Yes, Sign Out'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
