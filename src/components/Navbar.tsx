import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { formatActiveDurationCompact } from '../utils/dateHelper';
import { AppView } from '../types';
import {
  LayoutDashboard,
  ClipboardList,
  TrendingUp,
  PlusCircle,
  LogOut,
  RotateCcw,
  Calendar,
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  CheckSquare,
  Package
} from 'lucide-react';

interface NavbarProps {
  activeTab: AppView;
  setActiveTab: (tab: AppView) => void;
  onOpenAddModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
}) => {
  const {
    farmName,
    daysActive,
    user,
    firebaseUser,
    syncStatus,
    syncError,
    logout,
    resetToSampleData,
    syncAllCurrentRecordsToFirebase,
  } = useFarm();

  const [isPushing, setIsPushing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handlePushData = async () => {
    setIsPushing(true);
    setSyncFeedback(null);
    try {
      const res = await syncAllCurrentRecordsToFirebase();
      setSyncFeedback(res.message);
      setTimeout(() => setSyncFeedback(null), 3500);
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Farm Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-emerald-500/50 shadow-sm shrink-0 bg-stone-100">
              <img
                src="/jamunapari-goats.png"
                alt={farmName}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-stone-900 text-lg leading-tight tracking-tight">
                  {farmName}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200" title={`${daysActive} days recorded`}>
                  <Calendar className="w-3 h-3" />
                  {formatActiveDurationCompact(daysActive)} active
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {/* Sync Connection Status Badge */}
                {syncStatus === 'connected' && (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Live Synced
                  </span>
                )}
                {syncStatus === 'connecting' && (
                  <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                    <RefreshCw className="w-3 h-3 animate-spin text-amber-500" />
                    Connecting...
                  </span>
                )}
                {syncStatus === 'local_fallback' && (
                  <span className="inline-flex items-center gap-1 text-stone-500 font-medium">
                    <CloudOff className="w-3 h-3 text-stone-400" />
                    Local Mode
                  </span>
                )}
                {syncStatus === 'error' && (
                  <span
                    className="inline-flex items-center gap-1 text-rose-600 font-medium cursor-help"
                    title={syncError || 'Sync connection notice'}
                  >
                    <AlertCircle className="w-3 h-3" />
                    Sync Notice
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {[
              { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
              { id: 'tasks' as const, label: 'Tasks', icon: CheckSquare },
              { id: 'feed_supply' as const, label: 'Feed & Supply', icon: Package },
              { id: 'records' as const, label: 'Records', icon: ClipboardList },
              { id: 'reports' as const, label: 'Reports', icon: TrendingUp },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all border ${
                    isActive
                      ? 'font-bold text-stone-900 dark:text-white bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 shadow-2xs'
                      : 'font-medium border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-stone-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Actions & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sync / Upload to Firebase button (if logged into Firebase) */}
            {firebaseUser && (
              <button
                id="btn-sync-to-cloud"
                onClick={handlePushData}
                disabled={isPushing}
                title="Save and synchronize all farm records"
                className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
              >
                <UploadCloud className={`w-3.5 h-3.5 ${isPushing ? 'animate-bounce text-emerald-600' : 'text-stone-500'}`} />
                <span>Sync Records</span>
              </button>
            )}

            <button
              id="btn-open-add-record"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Add Record</span>
            </button>

            <div className="h-6 w-px bg-stone-200 hidden md:block" />

            {/* Reset mock data */}
            <button
              id="btn-reset-sample-data"
              onClick={resetToSampleData}
              title="Reset Sample Data"
              className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors hidden md:inline-flex"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* User / Logout */}
            <button
              id="btn-logout"
              onClick={logout}
              title={`Logged in as ${firebaseUser?.email || user?.email || 'User'}`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync feedback notification bar if active */}
      {syncFeedback && (
        <div className="bg-emerald-600 text-white text-xs py-1.5 px-4 text-center font-medium shadow-inner transition-all flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{syncFeedback}</span>
        </div>
      )}
    </header>
  );
};
