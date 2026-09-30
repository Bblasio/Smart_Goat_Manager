import React, { useState, useEffect } from 'react';
import { useFarm } from '../context/FarmContext';
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
  PanelLeftClose,
  PanelLeftOpen,
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
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
  isCollapsed = false,
  onToggleCollapse,
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
    breeding,
    kidGrowthRecords,
  } = useFarm();

  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [user?.logo_url]);

  const lowStockCount =
    (feeds?.filter(f => f.quantity <= f.min_threshold).length || 0) +
    (medications?.filter(m => m.quantity <= m.min_threshold).length || 0);

  const dueBreedingCount = (breeding || []).filter(b => {
    if (b.status === 'Delivered') return false;
    const target = new Date(b.expected_birth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    return target.getTime() <= today.getTime();
  }).length;

  const activeGestationCount = (breeding || []).filter(b => b.status === 'Active' || !b.status).length;
  const kidsCount = kidGrowthRecords?.length || 0;

  // Group 1 — Overview: Dashboard, Task
  const group1Items: NavItemConfig[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutGrid,
    },
    {
      id: 'tasks',
      label: 'Task',
      icon: CheckSquare,
      badge: todayNotificationCount > 0 ? `${todayNotificationCount}` : undefined,
      badgeClass: todayNotificationCount > 0 ? 'bg-rose-600 text-white' : undefined,
    },
  ];

  // Group 2 — Operations & Herd: Feeds & Suppy, Breeding Estimator, Farm records, Health
  const group2Items: NavItemConfig[] = [
    {
      id: 'feed_supply',
      label: 'Feeds & Suppy',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} ALERT${lowStockCount > 1 ? 'S' : ''}` : undefined,
      badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    },
    {
      id: 'breeding_estimator',
      label: 'Breeding Estimator',
      icon: Calendar,
      badge: dueBreedingCount > 0 ? `${dueBreedingCount} DUE` : activeGestationCount > 0 ? `${activeGestationCount}` : undefined,
      badgeClass: dueBreedingCount > 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    },
    {
      id: 'records',
      label: 'Farm records',
      icon: ClipboardList,
      badge: kidsCount > 0 ? `${kidsCount} KIDS` : undefined,
      badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    },
    {
      id: 'health_vet',
      label: 'Health',
      icon: Stethoscope,
    },
  ];

  // Group 3 — Reports & Settings
  const group3Items: NavItemConfig[] = [
    {
      id: 'reports',
      label: 'Reports',
      icon: TrendingUp,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

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
              {/* Icon with high contrast and collapsed dot badge */}
              <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-white' : 'text-stone-300 group-hover:text-white'
                  }`}
                  strokeWidth={1.75}
                />
                {/* Collapsed dot indicator on the icon */}
                {item.badge && (
                  <span
                    className={`${
                      isCollapsed ? 'hidden md:block' : 'hidden md:block xl:hidden'
                    } absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-stone-900 ${
                      item.id === 'feed_supply'
                        ? 'bg-amber-400 animate-pulse'
                        : item.id === 'tasks'
                        ? 'bg-rose-500 animate-pulse'
                        : 'bg-emerald-400'
                    }`}
                  />
                )}
              </div>

              {/* Label: hidden when navigation is minimized */}
              <span
                className={`text-xs whitespace-normal sm:whitespace-nowrap transition-colors ${
                  isCollapsed ? 'hidden' : 'md:hidden xl:inline'
                } ${isActive ? 'text-white font-semibold' : 'text-stone-300 group-hover:text-white font-medium'}`}
              >
                {item.label}
              </span>
            </div>

            {/* Inline Count Badge (e.g. numeric "3") */}
            {item.badge && isCountBadge && (
              <span
                className={`shrink-0 ml-1.5 ${
                  isCollapsed ? 'hidden' : 'md:hidden xl:inline-flex'
                } items-center justify-center min-w-[20px] h-5 rounded-full text-[10.5px] font-bold px-1.5 ${
                  item.badgeClass || (isActive ? 'bg-emerald-700 text-white' : 'bg-stone-800 text-stone-300')
                }`}
              >
                {item.badge}
              </span>
            )}

            {/* Desktop-only Inline Text Badge for >=1280px */}
            {item.badge && !isCountBadge && (
              <span
                className={`${
                  isCollapsed ? 'hidden' : 'hidden xl:inline-block'
                } shrink-0 ml-1.5 rounded-full text-[10px] uppercase font-semibold leading-none px-2 py-1 ${
                  item.badgeClass || (isActive ? 'bg-emerald-800 text-white' : 'bg-stone-800 text-stone-300')
                }`}
              >
                {item.badge}
              </span>
            )}
          </div>

          {/* Mobile Drawer (< 768px): If Text Badge (not count), wrap below label on its own line */}
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

        {/* Hover Tooltip when Navigation is Minimized (Tablet Rail or Minimized Desktop) */}
        <div className={`${
          isCollapsed ? 'hidden md:flex' : 'hidden md:flex xl:hidden'
        } pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3.5 z-50 whitespace-nowrap bg-stone-900 border border-stone-700 text-white text-xs font-medium py-1.5 px-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity`}>
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
          - Collapsed mode (user toggled or tablet): Compact icon rail (w-[68px])
          - Expanded mode: Full sidebar (w-64)
      */}
      <aside
        aria-label="Application Sidebar"
        className={`no-print fixed top-0 bottom-0 left-0 z-55 bg-[#0e1512] text-stone-100 flex flex-col justify-between border-r border-stone-800 transition-all duration-300 ease-in-out ${
          mobileOpen
            ? 'flex translate-x-0 min-w-[285px] w-[285px] sm:w-72 shadow-2xl'
            : isCollapsed
            ? 'hidden md:flex md:translate-x-0 md:w-[68px] xl:w-[68px]'
            : 'hidden md:flex md:translate-x-0 md:w-[68px] xl:w-64'
        }`}
      >
        {/* Top Header / Branding */}
        <div className={`p-3 md:p-2.5 ${isCollapsed ? 'xl:p-2.5' : 'xl:p-4'} border-b border-stone-800 transition-all`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between md:justify-center xl:justify-between'}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-3'} text-left min-w-0`}>
              {user?.logo_url && !logoFailed ? (
                <div
                  onClick={onToggleCollapse}
                  className="relative group/logo cursor-pointer shrink-0"
                  title={isCollapsed ? "Click to expand navigation ([ or ⌘B)" : farmName}
                >
                  <img
                    src={user.logo_url}
                    alt={farmName}
                    onError={() => setLogoFailed(true)}
                    className="w-9 h-9 rounded-xl object-cover border border-emerald-500/50 shadow-xs"
                  />
                  {isCollapsed && (
                    <div className="absolute inset-0 bg-emerald-950/80 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                      <PanelLeftOpen className="w-4 h-4 text-emerald-300" />
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onClick={onToggleCollapse}
                  className="relative group/logo cursor-pointer shrink-0"
                  title={isCollapsed ? "Click to expand navigation ([ or ⌘B)" : farmName}
                >
                  <div className="w-9 h-9 rounded-xl overflow-hidden border border-emerald-500/50 shadow-xs bg-stone-800">
                    <img
                      src="/app.png"
                      alt={farmName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {isCollapsed && (
                    <div className="absolute inset-0 bg-emerald-950/80 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                      <PanelLeftOpen className="w-4 h-4 text-emerald-300" />
                    </div>
                  )}
                </div>
              )}
              <div className={`min-w-0 ${isCollapsed ? 'hidden' : 'md:hidden xl:block'}`}>
                <h1 className="font-bold text-white text-sm tracking-tight truncate">
                  {farmName}
                </h1>
                <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]"></span>
                  <span title={`${daysActive} total days active`}>
                    {formatActiveDurationCompact(daysActive)} active
                  </span>
                </div>
              </div>
            </div>

            {/* Minimize / Collapse Toggle Button at Top Header (Desktop >=1280px when expanded) */}
            {onToggleCollapse && !isCollapsed && (
              <button
                type="button"
                id="btn-sidebar-collapse-top"
                onClick={onToggleCollapse}
                className="hidden xl:flex p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800/80 transition-colors shrink-0"
                title="Minimize navigation ([ or ⌘B)"
                aria-label="Minimize navigation"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}

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

        {/* Bottom Bar: Minimize / Expand Navigation Toggle */}
        {onToggleCollapse && (
          <div className="border-t border-stone-800 bg-[#0a0f0d] p-2 hidden md:block relative group">
            <button
              type="button"
              id="btn-sidebar-collapse-toggle"
              onClick={onToggleCollapse}
              title={isCollapsed ? "Expand navigation ([ or ⌘B)" : "Minimize navigation ([ or ⌘B)"}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-1' : 'justify-between px-2.5'} py-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800/80 transition-all text-xs font-medium`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {isCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                ) : (
                  <PanelLeftClose className="w-4 h-4 text-stone-400 group-hover:text-white group-hover:scale-110 transition-transform" />
                )}
                {!isCollapsed && <span className="truncate">Minimize Navigation</span>}
              </div>
              {!isCollapsed && (
                <kbd className="hidden xl:inline-flex items-center px-1.5 py-0.5 rounded bg-stone-800 border border-stone-700 text-[10px] font-mono text-stone-400">
                  [
                </kbd>
              )}
            </button>
            {isCollapsed && (
              <div className="pointer-events-none absolute left-full bottom-2 ml-3.5 z-50 whitespace-nowrap bg-stone-900 border border-stone-700 text-white text-xs font-medium py-1.5 px-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Expand navigation ([ or ⌘B)</span>
              </div>
            )}
          </div>
        )}

        {/* Footer: Demo Reset Action (if in demo mode only; hidden when collapsed to save space) */}
        {isDemoMode && !isCollapsed && (
          <div className="border-t border-stone-800 bg-[#0a0f0d] p-3 md:hidden xl:block">
            <button
              type="button"
              id="btn-sidebar-reset-data"
              onClick={resetToSampleData}
              title="Reset Sample Records"
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-300" strokeWidth={1.75} />
              <span>Reset Demo Records</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
