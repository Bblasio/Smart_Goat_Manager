import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { ThemeToggle } from './ThemeToggle';
import { formatActiveDurationCompact } from '../utils/dateHelper';
import {
  LayoutDashboard,
  ClipboardList,
  CheckSquare,
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
  Stethoscope,
  ChevronRight,
  Menu,
  X,
  Building2,
  TrendingUp,
  Package,
  Bell
} from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  activeTab: AppView;
  setActiveTab: (tab: AppView) => void;
  onOpenAddModal: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onOpenNotificationModal?: () => void;
  todayNotificationCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  mobileOpen,
  setMobileOpen,
  onOpenNotificationModal,
  todayNotificationCount = 0,
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
    feeds,
    medications,
  } = useFarm();

  const [logoFailed, setLogoFailed] = useState(false);

  React.useEffect(() => {
    setLogoFailed(false);
  }, [user?.logo_url]);

  const lowStockCount =
    (feeds?.filter(f => f.quantity <= f.min_threshold).length || 0) +
    (medications?.filter(m => m.quantity <= m.min_threshold).length || 0);

  interface NavItemConfig {
    id: AppView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeClass?: string;
  }

  const navItems: NavItemConfig[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: 'Live',
      badgeClass: 'bg-stone-800 text-stone-300 border border-stone-700',
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckSquare,
      badge: todayNotificationCount > 0 ? `${todayNotificationCount}` : undefined,
      badgeClass: todayNotificationCount > 0 ? 'bg-rose-500 text-white' : undefined,
    },
    {
      id: 'feed_supply',
      label: 'Feed & Supply',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} alert${lowStockCount > 1 ? 's' : ''}` : undefined,
      badgeClass: 'bg-amber-900/60 text-amber-200 border border-amber-700/60',
    },
    {
      id: 'breeding_estimator',
      label: 'Breeding Estimator',
      icon: Calendar,
      badge: 'Pipeline',
      badgeClass: 'bg-stone-800 text-stone-300 border border-stone-700',
    },
    {
      id: 'records',
      label: 'Herd & Farm Records',
      icon: ClipboardList,
    },
    {
      id: 'health_vet',
      label: 'Veterinary & Health',
      icon: Stethoscope,
    },
    {
      id: 'reports',
      label: 'Reports & Forecasts',
      icon: TrendingUp,
    },
    {
      id: 'profile',
      label: 'Farm Profile',
      icon: Building2,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="no-print fixed inset-0 bg-stone-900/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Left Navigation Plane */}
      <aside
        className={`no-print fixed top-0 bottom-0 left-0 z-50 w-64 bg-stone-900 text-stone-100 flex flex-col justify-between border-r border-stone-800 transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header / Branding */}
        <div className="p-5 border-b border-stone-800">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setActiveTab('profile');
                setMobileOpen(false);
              }}
              className="flex items-center gap-3 text-left group transition-opacity hover:opacity-90 focus:outline-none"
              title="View & Edit Farm Profile / Logo"
            >
              {user?.logo_url && !logoFailed ? (
                <img
                  src={user.logo_url}
                  alt={farmName}
                  onError={() => setLogoFailed(true)}
                  className="w-10 h-10 rounded-xl object-cover border border-emerald-500/50 shadow-xs shrink-0 group-hover:border-emerald-400 transition-colors"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-emerald-500/50 shadow-xs shrink-0 group-hover:scale-105 transition-transform bg-stone-800">
                  <img
                    src="/jamunapari-goats.png"
                    alt={farmName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="font-bold text-white text-base tracking-tight truncate group-hover:text-emerald-300 transition-colors">
                  {farmName}
                </h1>
                <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span title={`${daysActive} total days active`}>{formatActiveDurationCompact(daysActive)} active</span>
                </div>
              </div>
            </button>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Daily Farm Alerts Quick Button */}
          {onOpenNotificationModal && (
            <button
              type="button"
              id="btn-sidebar-notifications"
              onClick={() => {
                onOpenNotificationModal();
                setMobileOpen(false);
              }}
              className={`w-full mt-3 flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                todayNotificationCount > 0
                  ? 'bg-rose-950/50 hover:bg-rose-900/70 text-rose-200 border-rose-800/80 shadow-xs'
                  : 'bg-stone-800/70 hover:bg-stone-700/80 text-stone-300 border-stone-700/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Bell className={`w-4 h-4 ${todayNotificationCount > 0 ? 'text-rose-400 animate-bounce' : 'text-stone-400'}`} />
                  {todayNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </div>
                <span>Daily Alerts</span>
              </div>
              {todayNotificationCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-2xs">
                  {todayNotificationCount} Today
                </span>
              ) : (
                <span className="text-[10px] text-stone-400">All Clear</span>
              )}
            </button>
          )}

          {/* Sync Status Pill */}
          <div className="mt-3.5 pt-3 border-t border-stone-800/80 text-xs">
            {syncStatus === 'connected' && (
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-mono text-[11px]">Live Synced</span>
              </div>
            )}
            {syncStatus === 'connecting' && (
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-950/60 border border-amber-800/50 text-amber-300">
                <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                <span className="font-mono text-[11px]">Connecting...</span>
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
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                id={`nav-left-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all border ${
                  isActive
                    ? 'bg-stone-800/80 border-stone-700/60 shadow-xs'
                    : 'bg-transparent hover:bg-stone-800/40 border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-stone-400 group-hover:text-stone-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-xs truncate transition-colors ${
                      isActive ? 'font-bold text-white' : 'font-medium text-stone-300 group-hover:text-white'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                {item.badge && (
                  <span
                    className={`shrink-0 ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                      item.badgeClass || (isActive ? 'bg-stone-700 text-white' : 'bg-stone-800 text-stone-400')
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
                ● Live Synchronized
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <div className="pt-1">
            <ThemeToggle className="w-full justify-between" showLabel={true} />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
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
