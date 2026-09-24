import React, { useState, useRef, useEffect } from 'react';
import { useFarm } from '../context/FarmContext';
import { ThemeToggle } from './ThemeToggle';
import { PWAInstallButton } from './PWAInstallButton';
import { formatActiveDurationCompact } from '../utils/dateHelper';
import {
  LayoutGrid,
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
  Settings,
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
  onOpenSettings?: () => void;
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
  onOpenSettings,
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
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLogoFailed(false);
  }, [user?.logo_url]);

  // Close tablet avatar dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(e.target as Node)) {
        setAccountDropdownOpen(false);
      }
    };
    if (accountDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [accountDropdownOpen]);

  const lowStockCount =
    (feeds?.filter(f => f.quantity <= f.min_threshold).length || 0) +
    (medications?.filter(m => m.quantity <= m.min_threshold).length || 0);

  // Group 1 — Overview: Dashboard, Tasks
  const group1Items: NavItemConfig[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutGrid,
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

  // Group 3 — Analysis & Administration: Reports & Forecasts, Settings
  const group3Items: NavItemConfig[] = [
    {
      id: 'reports',
      label: 'Reports & Forecasts',
      icon: TrendingUp,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  const handleTriggerSettings = () => {
    setActiveTab('settings');
    setMobileOpen(false);
  };

  const renderNavButton = (item: NavItemConfig) => {
    const isActive = activeTab === item.id;
    const Icon = item.icon;
    const isCountBadge = item.badge ? /^\d+$/.test(item.badge.trim()) : false;

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
          className={`w-full flex flex-col items-stretch px-3 py-2.5 rounded-xl text-left transition-all border ${
            isActive
              ? 'bg-[#143c2c] text-white border-emerald-600/30 shadow-xs'
              : 'bg-transparent hover:bg-stone-800/60 text-stone-300 hover:text-white border-transparent'
          }`}
        >
          {/* Main Row: Icon + Label + Inline Badge */}
          <div className="flex items-center justify-between gap-2.5 w-full min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              {/* Icon with high contrast and tablet dot badge */}
              <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-white' : 'text-stone-300 group-hover:text-white'
                  }`}
                  strokeWidth={1.75}
                />
                {/* Tablet rail collapsed dot indicator on the icon */}
                {item.badge && (
                  <span
                    className={`hidden md:block xl:hidden absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-stone-900 ${
                      item.id === 'feed_supply'
                        ? 'bg-amber-400 animate-pulse'
                        : item.id === 'tasks'
                        ? 'bg-rose-500 animate-pulse'
                        : 'bg-emerald-400'
                    }`}
                  />
                )}
              </div>

              {/* Label: never truncated to prevent 'Breeding Esti...' */}
              <span
                className={`text-xs whitespace-normal sm:whitespace-nowrap transition-colors md:hidden xl:inline ${
                  isActive ? 'text-white font-semibold' : 'text-stone-300 group-hover:text-white font-medium'
                }`}
              >
                {item.label}
              </span>
            </div>

            {/* Inline Count Badge (e.g. numeric "3") */}
            {item.badge && isCountBadge && (
              <span
                className={`shrink-0 ml-1.5 md:hidden xl:inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-[10.5px] font-bold px-1.5 ${
                  item.badgeClass || (isActive ? 'bg-emerald-700 text-white' : 'bg-stone-800 text-stone-300')
                }`}
              >
                {item.badge}
              </span>
            )}

            {/* Desktop-only Inline Text Badge for >=1280px */}
            {item.badge && !isCountBadge && (
              <span
                className={`hidden xl:inline-block shrink-0 ml-1.5 rounded-full text-[10px] uppercase font-semibold leading-none px-2 py-1 ${
                  item.badgeClass || (isActive ? 'bg-emerald-800 text-white' : 'bg-stone-800 text-stone-300')
                }`}
              >
                {item.badge}
              </span>
            )}
          </div>

          {/* Mobile Drawer (< 768px): If Text Badge (not count), wrap below label on its own line, indented 32px to align with label */}
          {item.badge && !isCountBadge && (
            <div className="md:hidden pl-8 pt-1">
              <span
                className={`inline-block rounded-md text-[9.5px] uppercase font-bold tracking-wider leading-none px-1.5 py-0.5 ${
                  item.badgeClass || (isActive ? 'bg-emerald-800 text-white' : 'bg-stone-800 text-stone-300')
                }`}
              >
                {item.badge}
              </span>
            </div>
          )}
        </button>

        {/* Hover Tooltip on Tablet Rail (768-1279px) */}
        <div className="hidden md:flex xl:hidden pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3.5 z-50 whitespace-nowrap bg-stone-900 border border-stone-700 text-white text-xs font-medium py-1.5 px-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
          <span>{item.label}</span>
          {item.badge && (
            <span className="ml-1.5 text-[10px] font-bold text-emerald-400 uppercase">
              ({item.badge})
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Drawer Backdrop (< 768px) with z-50 to overlay bottom nav and content */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="no-print fixed inset-0 bg-stone-950/75 z-50 md:hidden backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Responsive Navigation Sidebar:
          - <768px: Slide-out drawer (min-w-[285px] w-[285px] sm:w-72, hidden by default, translate-x-0 when mobileOpen, z-55)
          - 768-1279px (tablet): Collapsed icon-only rail (w-[68px])
          - >=1280px (desktop): Full sidebar (w-64)
      */}
      <aside
        aria-label="Application Sidebar"
        className={`no-print fixed top-0 bottom-0 left-0 z-55 bg-[#0e1512] text-stone-100 flex-col justify-between border-r border-stone-800 transition-all duration-200 ease-in-out ${
          mobileOpen
            ? 'flex translate-x-0 min-w-[285px] w-[285px] sm:w-72 shadow-2xl'
            : 'hidden md:flex md:translate-x-0 md:w-[68px] xl:w-64'
        }`}
      >
        {/* Top Header / Branding */}
        <div className="p-3 md:p-2.5 xl:p-4 border-b border-stone-800">
          <div className="flex items-center justify-between md:justify-center xl:justify-between">
            <button
              type="button"
              onClick={() => {
                setActiveTab('settings');
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
                  className="w-9 h-9 md:w-9 md:h-9 xl:w-9 xl:h-9 rounded-xl object-cover border border-emerald-500/50 shadow-xs shrink-0 group-hover:border-emerald-400 transition-colors"
                />
              ) : (
                <div className="w-9 h-9 md:w-9 md:h-9 xl:w-9 xl:h-9 rounded-xl overflow-hidden border border-emerald-500/50 shadow-xs shrink-0 group-hover:scale-105 transition-transform bg-stone-800">
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

            {/* Mobile Close Button (< md only) */}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 focus:outline-none"
              aria-label="Close Navigation"
            >
              <X className="w-5 h-5" strokeWidth={1.75} />
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
                  <Bell className={`w-4 h-4 ${todayNotificationCount > 0 ? 'text-rose-400 animate-bounce' : 'text-stone-300'}`} strokeWidth={1.75} />
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

          {/* Tablet Notification Quick Bell (768-1279px) */}
          {onOpenNotificationModal && (
            <div className="relative group mt-2 hidden md:flex xl:hidden justify-center">
              <button
                type="button"
                id="btn-sidebar-notifications-tablet"
                onClick={onOpenNotificationModal}
                className="p-2 rounded-xl bg-stone-800/80 text-stone-300 hover:text-white hover:bg-stone-700 relative transition-colors"
                title="Daily Alerts"
              >
                <Bell className={`w-5 h-5 ${todayNotificationCount > 0 ? 'text-rose-400 animate-bounce' : 'text-stone-300'}`} strokeWidth={1.75} />
                {todayNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-stone-900 animate-pulse" />
                )}
              </button>
              <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3.5 z-50 whitespace-nowrap bg-stone-900 border border-stone-700 text-white text-xs font-medium py-1.5 px-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Daily Alerts {todayNotificationCount > 0 ? `(${todayNotificationCount})` : ''}</span>
              </div>
            </div>
          )}
        </div>

        {/* Primary Navigation Links with Section Grouping */}
        <div className="flex-1 overflow-y-auto px-2 md:px-1.5 xl:px-3 py-3">
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
        </div>

        {/* Footer: User Identity, Settings & Account Actions */}
        <div className="border-t border-stone-800 bg-[#0a0f0d]">
          {/* Desktop & Mobile Drawer Footer */}
          <div className="p-3 md:hidden xl:block space-y-2.5">
            {/* User Account Info */}
            <div className="px-1 text-xs">
              <div className="text-[11px] text-stone-400 font-medium">
                <span>{isDemoMode ? 'Mode:' : 'Farm Account:'}</span>
              </div>
              <div className="text-stone-200 font-medium truncate font-mono text-[11px] mt-0.5" title={firebaseUser?.email || user?.email || 'Demo'}>
                {firebaseUser?.email || user?.email || (isDemoMode ? 'Demo Account (Local)' : 'Not signed in')}
              </div>
            </div>

            {/* Farm Settings Quick Button */}
            {/* PWA Install Button (Mobile Drawer & Desktop XL) */}
            <PWAInstallButton variant="sidebar" />

            <button
              type="button"
              id="btn-sidebar-open-settings"
              onClick={handleTriggerSettings}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 transition-colors text-xs font-semibold"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-500" />
                <span>Settings</span>
              </div>
              <span className="text-[10px] text-stone-500">Configure</span>
            </button>

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
                  <RotateCcw className="w-3.5 h-3.5 text-stone-300" strokeWidth={1.75} />
                  <span>Reset Demo Records</span>
                </button>
              )}

              <button
                type="button"
                id="btn-sidebar-logout"
                onClick={logout}
                title={isDemoMode ? 'Exit Demo / Sign In' : 'Sign Out'}
                className="col-span-2 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/50 text-xs font-medium transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" strokeWidth={1.75} />
                <span>{isDemoMode ? 'Exit Demo / Sign In' : 'Sign Out'}</span>
              </button>
            </div>
          </div>

          {/* Tablet (768-1279px) Collapsed Account Avatar & Popover Dropdown */}
          <div className="hidden md:flex xl:hidden justify-center py-2.5" ref={accountDropdownRef}>
            <div className="relative group">
              <button
                type="button"
                id="btn-sidebar-tablet-avatar"
                onClick={() => setAccountDropdownOpen(prev => !prev)}
                className="relative p-0.5 rounded-xl border border-stone-700 hover:border-emerald-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                title="Account Settings & Sign Out"
              >
                {user?.logo_url && !logoFailed ? (
                  <img
                    src={user.logo_url}
                    alt={farmName}
                    className="w-9 h-9 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-emerald-900/60 border border-emerald-700/60 flex items-center justify-center text-white font-bold text-xs">
                    {(farmName || 'FM').substring(0, 2).toUpperCase()}
                  </div>
                )}
              </button>

              {/* Tablet Avatar Tooltip when dropdown is closed */}
              {!accountDropdownOpen && (
                <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3.5 z-50 whitespace-nowrap bg-stone-900 border border-stone-700 text-white text-xs font-medium py-1.5 px-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Account &amp; Sign Out</span>
                </div>
              )}

              {/* Tablet Avatar Dropdown Menu (Opened on tap) */}
              {accountDropdownOpen && (
                <div className="absolute left-full bottom-0 ml-3.5 w-60 bg-stone-900 border border-stone-700 rounded-2xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="pb-2.5 border-b border-stone-800">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      {isDemoMode ? 'Demo Session' : 'Farm Account'}
                    </div>
                    <div className="text-xs font-semibold text-white truncate mt-0.5" title={firebaseUser?.email || user?.email || 'Farm User'}>
                      {firebaseUser?.email || user?.email || (isDemoMode ? 'Demo Account (Local)' : 'Farm Account')}
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5 truncate">
                      {farmName} • {daysActive}d active
                    </div>
                  </div>

                  <div className="py-2.5 border-b border-stone-800">
                    <ThemeToggle className="w-full justify-between" showLabel={true} />
                  </div>

                  <div className="pt-2 space-y-1.5">
                    <button
                      type="button"
                      id="btn-sidebar-tablet-settings"
                      onClick={() => {
                        setAccountDropdownOpen(false);
                        handleTriggerSettings();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-stone-300 hover:text-white hover:bg-stone-800 rounded-xl transition-colors text-left"
                    >
                      <Settings className="w-4 h-4 text-emerald-400" strokeWidth={1.75} />
                      <span>Farm &amp; App Settings</span>
                    </button>

                    {isDemoMode && (
                      <button
                        type="button"
                        onClick={() => {
                          setAccountDropdownOpen(false);
                          resetToSampleData();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-stone-300 hover:text-white hover:bg-stone-800 rounded-xl transition-colors text-left"
                      >
                        <RotateCcw className="w-4 h-4 text-stone-300" strokeWidth={1.75} />
                        <span>Reset Demo Records</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setAccountDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-950/50 rounded-xl transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" strokeWidth={1.75} />
                      <span>{isDemoMode ? 'Exit Demo / Sign In' : 'Sign Out'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
