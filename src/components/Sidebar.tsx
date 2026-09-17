import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  LayoutDashboard,
  ClipboardList,
  Sparkles,
  PlusCircle,
  LogOut,
  RotateCcw,
  Calendar,
  CloudOff,
  RefreshCw,
  AlertCircle,
  UploadCloud,
  CheckCircle2,
  Baby,
  Stethoscope,
  ChevronRight,
  Menu,
  X,
  Building2
} from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  activeTab: AppView;
  setActiveTab: (tab: AppView) => void;
  onOpenAddModal: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  mobileOpen,
  setMobileOpen,
}) => {
  const {
    farmName,
    daysActive,
    user,
    firebaseUser,
    isDemoMode,
    syncStatus,
    syncError,
    logout,
    resetToSampleData,
    pushSeedDataToFirebase,
  } = useFarm();

  const [isPushing, setIsPushing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handlePushData = async () => {
    setIsPushing(true);
    setSyncFeedback(null);
    try {
      const res = await pushSeedDataToFirebase();
      setSyncFeedback(res.message);
      setTimeout(() => setSyncFeedback(null), 3500);
    } finally {
      setIsPushing(false);
    }
  };

  const navItems: { id: AppView; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'breeding_estimator', label: 'Breeding Estimator', icon: Baby, badge: 'New' },
    { id: 'records', label: 'Herd & Farm Records', icon: ClipboardList },
    { id: 'health_vet', label: 'Veterinary & Health', icon: Stethoscope },
    { id: 'reports', label: 'AI Reports & Forecasts', icon: Sparkles },
    { id: 'profile', label: 'Farm Profile', icon: Building2 },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-stone-900/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Left Navigation Plane */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-stone-900 text-stone-100 flex flex-col justify-between border-r border-stone-800 transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header / Branding */}
        <div className="p-5 border-b border-stone-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-xs">
                🐐
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-white text-base tracking-tight truncate">
                  {farmName}
                </h1>
                <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{daysActive}d active</span>
                </div>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sync Status Pill */}
          <div className="mt-3.5 pt-3 border-t border-stone-800/80 text-xs">
            {syncStatus === 'connected' && (
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-mono text-[11px]">Cloud Synced</span>
              </div>
            )}
            {syncStatus === 'connecting' && (
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-950/60 border border-amber-800/50 text-amber-300">
                <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                <span className="font-mono text-[11px]">Connecting Cloud...</span>
              </div>
            )}
            {syncStatus === 'local_fallback' && (
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-stone-800/80 text-stone-300">
                <CloudOff className="w-3 h-3 text-stone-400" />
                <span className="font-mono text-[11px]">Local Mode</span>
              </div>
            )}
            {syncStatus === 'error' && (
              <div
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800/50 text-rose-300"
                title={syncError || 'Sync Notice'}
              >
                <AlertCircle className="w-3 h-3 text-rose-400" />
                <span className="font-mono text-[11px]">Offline</span>
              </div>
            )}
          </div>
        </div>

        {/* Primary Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          <div className="px-3 pb-1 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
            Menu Navigation
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`nav-left-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-900/60 text-emerald-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Add Record Quick Action Button */}
          <div className="pt-4 px-1">
            <button
              id="btn-sidebar-add-record"
              onClick={() => {
                onOpenAddModal();
                setMobileOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs border border-emerald-600/50"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Farm Record</span>
            </button>
          </div>
        </div>

        {/* Footer: User Identity & Account Actions */}
        <div className="p-4 border-t border-stone-800 space-y-3 bg-stone-950/40">
          {syncFeedback && (
            <div className="p-2 rounded-lg bg-emerald-900/80 border border-emerald-700 text-emerald-200 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{syncFeedback}</span>
            </div>
          )}

          {/* User Account Info */}
          <div className="px-1 text-xs">
            <div className="text-[11px] text-stone-400 font-medium">
              {isDemoMode ? 'Mode:' : 'Farm Account:'}
            </div>
            <div className="text-stone-200 font-semibold truncate font-mono text-[11px]">
              {firebaseUser?.email || (isDemoMode ? 'Demo Account (Local)' : 'Not signed in')}
            </div>
            {!isDemoMode && firebaseUser && (
              <div className="text-[10px] text-emerald-400/90 font-mono truncate mt-0.5">
                ● Cloud Synchronized
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {firebaseUser && (
              <button
                type="button"
                id="btn-sidebar-push-cloud"
                onClick={handlePushData}
                disabled={isPushing}
                title="Upload sample starter herd records to cloud"
                className="col-span-2 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-emerald-950/70 border border-emerald-800/60 hover:bg-emerald-900/80 text-emerald-200 text-xs font-medium transition-colors"
              >
                <UploadCloud className={`w-3.5 h-3.5 ${isPushing ? 'animate-bounce text-emerald-400' : ''}`} />
                <span>Upload Starter Herd to Cloud</span>
              </button>
            )}

            {isDemoMode && (
              <button
                type="button"
                id="btn-sidebar-reset-data"
                onClick={resetToSampleData}
                title="Reset Sample Records"
                className="col-span-2 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo Records</span>
              </button>
            )}

            <button
              type="button"
              id="btn-sidebar-logout"
              onClick={logout}
              className="col-span-2 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/50 text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isDemoMode ? 'Exit Demo / Sign In' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
