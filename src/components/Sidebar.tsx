import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { ThemeToggle } from './ThemeToggle';
import { formatActiveDurationCompact } from '../utils/dateHelper';
import {
  LayoutDashboard,
  ClipboardList,
  CheckSquare,
  LogOut,
  RotateCcw,
  Calendar,
  Stethoscope,
  X,
  Building2,
  TrendingUp,
  Package,
  Bell,
  PlusCircle,
  LucideIcon
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

interface NavItemConfig {
  id: AppView;
  label: string;
  icon: LucideIcon;
  badge?: string;
  badgeClass?: string;
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

  // Group 1 — Overview: Dashboard, Tasks
  const group1Items: NavItemConfig[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckSquare,
      badge: todayNotificationCount > 0 ? `${todayNotificationCount}` : undefined,
      badgeClass: todayNotificationCount > 0 ? 'bg-rose-600 text-white' : undefined,
    },
  ];

  // Group 2 — Operations & Herd: Feed & Supply, Breeding Estimator, Herd & Farm Records, Veterinary & Health
  const group2Items: NavItemConfig[] = [
    {
      id: 'feed_supply',
      label: 'Feed & Supply',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} ALERT${lowStockCount > 1 ? 'S' : ''}` : undefined,
      badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    },
    {
      id: 'breeding_estimator',
      label: 'Breeding Estimator',
      icon: Calendar,
      badge: 'PIPELINE',
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
  ];

  // Group 3 — Analysis & Administration: Reports & Forecasts, Farm Profile
  const group3Items: NavItemConfig[] = [
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

  const renderNavButton = (item: NavItemConfig) => {
    const isActive = activeTab === item.id;
    const Icon = item.icon;

    return (
      <div key={item.id} className="relative group">
        <button
          type="button"
          id={`nav-left-${item.id}`}
          onClick={() => {
            setActiveTab(item.id);
            setMobileOpen(false);
          }}
          title={item.label}
          className={`w-full flex items-center justify-center md:justify-center xl:justify-between px-3 py-2.5 rounded-xl text-left transition-all border ${
            isActive
              ? 'bg-[#143c2c] text-white border-transparent shadow-xs'
              : 'bg-transparent hover:bg-stone-800/50 text-stone-300 hover:text-white border-transparent'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-5 h-5 flex items-center justify-center shrink-0 transition-colors ${
                isActive ? 'text-white' : 'text-stone-400 group-hover:text-stone-200'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={1.5} />
            </div>
            {/* Label hidden on tablet rail (768-1279px), visible on mobile drawer and desktop >=1280px */}
            <span
              className={`text-xs truncate font-medium transition-colors md:hidden xl:inline ${
                isActive ? 'text-white' : 'text-stone-300 group-hover:text-white'
              }`}
            >
              {item.label}
            </span>
          </div>

          {/* Standardized Badge: Small pill, 10.5px uppercase, 4px x 8px padding */}
          {item.badge && (
            <span
              className={`shrink-0 ml-1.5 md:hidden xl:inline-block rounded-full text-[10.5px] uppercase font-semibold leading-none px-2 py-1 ${
                item.badgeClass || (isActive ? 'bg-emerald-800 text-white' : 'bg-stone-800 text-stone-300')
              }`}
            >
              {item.badge}
            </span>
          )}
        </button>

        {/* Floating tooltip for tablet rail (768-1279px) on hover */}
        <div className="hidden md:flex xl:hidden pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3.5 z-50 whitespace-nowrap bg-stone-900 border border-stone-700 text-white text-xs font-medium py-1.5 px-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
          <span>{item.label}</span>
          {item.badge && (
            <span className="ml-1.5 text-[9.5px] font-bold text-emerald-400 uppercase">
              ({item.badge})
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop (< 768px) */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="no-print fixed inset-0 bg-stone-900/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Left Navigation Plane
          - <768px: Slide-out drawer (w-[240px])
          - 768px-1279px: Collapsed icon-only rail (w-16 / 64px)
          - >=1280px: Full sidebar (w-[240px])
      */}
      <aside
        className={`no-print fixed top-0 bottom-0 left-0 z-50 bg-stone-900 text-stone-100 flex flex-col justify-between border-r border-stone-800 transition-all duration-200 ease-in-out ${
          mobileOpen
            ? 'translate-x-0 w-[240px]'
            : '-translate-x-full md:translate-x-0 w-[240px] md:w-16 xl:w-[240px]'
        }`}
      >
        {/* Top Header / Branding */}
        <div className="p-3 md:p-3 xl:p-4 border-b border-stone-800">
          <div className="flex items-center justify-between md:justify-center xl:justify-between">
            <button
              type="button"
              onClick={() => {
                setActiveTab('profile');
                setMobileOpen(false);
              }}
              className="flex items-center gap-3 text-left group transition-opacity hover:opacity-90 focus:outline-none min-w-0"
              title="View & Edit Farm Profile / Logo"
            >
              {user?.logo_url && !logoFailed ? (
                <img
                  src={user.logo_url}
                  alt={farmName}
                  onError={() => setLogoFailed(true)}
                  className="w-9 h-9 md:w-8 md:h-8 xl:w-9 xl:h-9 rounded-xl object-cover border border-emerald-500/50 shadow-xs shrink-0 group-hover:border-emerald-400 transition-colors"
                />
              ) : (
                <div className="w-9 h-9 md:w-8 md:h-8 xl:w-9 xl:h-9 rounded-xl overflow-hidden border border-emerald-500/50 shadow-xs shrink-0 group-hover:scale-105 transition-transform bg-stone-800">
                  <img
                    src="/app.png"
                    alt={farmName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="min-w-0 md:hidden xl:block">
                <h1 className="font-bold text-white text-sm tracking-tight truncate group-hover:text-emerald-300 transition-colors">
                  {farmName}
                </h1>
                <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]"></span>
                  <span title={`${daysActive} total days active`}>
                    {formatActiveDurationCompact(daysActive)} active
                  </span>
                </div>
              </div>
            </button>

            {/* Mobile close button (< md only) */}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
              aria-label="Close Navigation"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>

          {/* Daily Farm Alerts Quick Button (Mobile & Desktop >= 1280px) */}
          {onOpenNotificationModal && (
            <button
              type="button"
              id="btn-sidebar-notifications"
              onClick={() => {
                onOpenNotificationModal();
                setMobileOpen(false);
              }}
              title="Daily Farm Alerts"
              className={`w-full mt-2.5 flex items-center justify-between md:hidden xl:flex px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                todayNotificationCount > 0
                  ? 'bg-rose-950/50 hover:bg-rose-900/70 text-rose-200 border-rose-800/80 shadow-xs'
                  : 'bg-stone-800/70 hover:bg-stone-700/80 text-stone-300 border-stone-700/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Bell className={`w-4 h-4 ${todayNotificationCount > 0 ? 'text-rose-400 animate-bounce' : 'text-stone-400'}`} strokeWidth={1.5} />
                  {todayNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </div>
                <span>Daily Alerts</span>
              </div>
              {todayNotificationCount > 0 ? (
                <span className="rounded-full text-[10.5px] uppercase font-semibold leading-none px-2 py-1 bg-rose-600 text-white shadow-2xs">
                  {todayNotificationCount} Today
                </span>
              ) : (
                <span className="text-[10px] text-stone-400">All Clear</span>
              )}
            </button>
          )}
        </div>

        {/* Primary Navigation Links with Section Grouping & 6px vertical spacing */}
        <div className="flex-1 overflow-y-auto px-2 md:px-2 xl:px-3 py-3">
          {/* Section 1: Overview */}
          <div className="space-y-1.5">
            {group1Items.map(renderNavButton)}
          </div>

          {/* Hairline Divider 1 */}
          <div className="border-t border-stone-800/80 my-2.5" />

          {/* Section 2: Operations & Herd */}
          <div className="space-y-1.5">
            {group2Items.map(renderNavButton)}
          </div>

          {/* Hairline Divider 2 */}
          <div className="border-t border-stone-800/80 my-2.5" />

          {/* Section 3: Analysis & Profile */}
          <div className="space-y-1.5">
            {group3Items.map(renderNavButton)}
          </div>

          {/* Add Record Quick Action Button */}
          <div className="pt-3 px-1 md:hidden xl:block">
            <button
              id="btn-sidebar-add-record"
              onClick={() => {
                onOpenAddModal();
                setMobileOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-700/85 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl transition-all shadow-xs border border-emerald-600/50"
            >
              <PlusCircle className="w-4 h-4" strokeWidth={1.5} />
              <span>Add Farm Record</span>
            </button>
          </div>
        </div>

        {/* Footer: User Identity & Account Actions */}
        <div className="p-3 md:p-2 xl:p-3 border-t border-stone-800 space-y-2.5 bg-stone-950/40">
          {/* User Account Info */}
          <div className="px-1 text-xs md:hidden xl:block">
            <div className="text-[11px] text-stone-400 font-medium">
              <span>{isDemoMode ? 'Mode:' : 'Farm Account:'}</span>
            </div>
            <div className="text-stone-200 font-medium truncate font-mono text-[11px] mt-0.5" title={firebaseUser?.email || 'Demo'}>
              {firebaseUser?.email || (isDemoMode ? 'Demo Account (Local)' : 'Not signed in')}
            </div>
          </div>

          {/* Theme Toggle Button */}
          <div>
            <ThemeToggle className="w-full justify-between" showLabel={true} />
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            {isDemoMode && (
              <button
                type="button"
                id="btn-sidebar-reset-data"
                onClick={resetToSampleData}
                title="Reset Sample Records"
                className="col-span-2 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="md:hidden xl:inline">Reset Demo Records</span>
              </button>
            )}

            <button
              type="button"
              id="btn-sidebar-logout"
              onClick={logout}
              title={isDemoMode ? 'Exit Demo / Sign In' : 'Sign Out'}
              className="col-span-2 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/50 text-xs font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="md:hidden xl:inline">{isDemoMode ? 'Exit Demo / Sign In' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
