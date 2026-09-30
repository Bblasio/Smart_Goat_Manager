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
  TrendingUp,
  Package,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  LucideIcon
} from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  activeTab: AppView;
  setActiveTab: (tab: AppView) => void;
  onOpenAddModal?: () => void;
  onOpenSearchModal?: () => void;
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
  onOpenAddModal: _onOpenAddModal,
  onOpenSearchModal,
  mobileOpen,
  setMobileOpen,
  onOpenNotificationModal: _onOpenNotificationModal,
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
  } = useFarm();

  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [user?.logo_url]);

  const lowStockCount =
    (feeds?.filter(f => f.quantity <= f.min_threshold).length || 0) +
    (medications?.filter(m => m.quantity <= m.min_threshold).length || 0);

  const rawName = user?.owner_name || user?.manager_name || firebaseUser?.displayName || farmName || 'FM';
  const userInitials = rawName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join('') || 'FM';

  const displayName = user?.owner_name || user?.manager_name || firebaseUser?.displayName || farmName || 'Farm Owner';
  const displayRole = user?.location || user?.farm_type || 'Farm Manager';

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
    },
    {
      id: 'records',
      label: 'Farm records',
      icon: ClipboardList,
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
      <button
        key={item.id}
        type="button"
        id={`nav-left-${item.id}`}
        onClick={() => {
          setActiveTab(item.id);
          setMobileOpen(false);
        }}
        title={item.label}
        className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-left transition-all border cursor-pointer ${
          isActive
            ? 'bg-[#143c2c] text-white border-emerald-600/40 shadow-xs font-semibold'
            : 'bg-transparent hover:bg-stone-800/70 text-stone-300 hover:text-white border-transparent font-medium'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon
            className={`w-4.5 h-4.5 shrink-0 transition-colors ${
              isActive ? 'text-white' : 'text-stone-400 group-hover:text-white'
            }`}
            strokeWidth={1.75}
          />
          <span className="text-xs truncate">{item.label}</span>
        </div>

        {item.badge && isCountBadge && (
          <span
            className={`shrink-0 items-center justify-center min-w-[20px] h-5 rounded-full text-[10.5px] font-bold px-1.5 flex ${
              item.badgeClass || (isActive ? 'bg-emerald-700 text-white' : 'bg-stone-800 text-stone-300')
            }`}
          >
            {item.badge}
          </span>
        )}

        {item.badge && !isCountBadge && (
          <span
            className={`shrink-0 rounded-full text-[10px] uppercase font-semibold leading-none px-2 py-1 inline-block ${
              item.badgeClass || (isActive ? 'bg-emerald-800 text-white' : 'bg-stone-800 text-stone-300')
            }`}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile Drawer Backdrop (< 768px) with z-40 to overlay content */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="no-print fixed inset-0 bg-stone-950/75 z-40 md:hidden backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Navigation Sidebar Pane:
          - Mobile: Slide-out drawer
          - Desktop: Smooth slide animation in or out (w-64)
      */}
      <aside
        aria-label="Application Sidebar"
        className={`no-print fixed top-0 bottom-0 left-0 z-40 w-64 max-w-[85vw] bg-[#0e1512] text-stone-100 flex flex-col justify-between border-r border-stone-800 transition-transform duration-300 ease-in-out ${
          mobileOpen
            ? 'translate-x-0 shadow-2xl'
            : isCollapsed
            ? '-translate-x-full'
            : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header / Branding with Minimizing Button ON the Navigation Pane */}
        <div className="p-3 border-b border-stone-800/90 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {user?.logo_url && !logoFailed ? (
                <img
                  src={user.logo_url}
                  alt={farmName}
                  onError={() => setLogoFailed(true)}
                  className="w-8 h-8 rounded-lg object-cover border border-emerald-500/40 shadow-xs shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-emerald-500/40 shadow-xs bg-stone-800 shrink-0">
                  <img src="/app.png" alt={farmName} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="font-bold text-white text-sm tracking-tight truncate leading-tight">
                  {farmName}
                </h1>
                <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span title={`${daysActive} total days active`}>
                    {formatActiveDurationCompact(daysActive)} active
                  </span>
                </div>
              </div>
            </div>

            {/* Actions on Navigation Pane: Search & Minimizing Button */}
            <div className="flex items-center gap-1 shrink-0">
              {onOpenSearchModal && (
                <button
                  type="button"
                  id="btn-sidebar-search"
                  onClick={onOpenSearchModal}
                  className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
                  title="Search (⌘K or /)"
                  aria-label="Search"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}

              {onToggleCollapse && (
                <button
                  type="button"
                  id="btn-sidebar-collapse-toggle"
                  onClick={onToggleCollapse}
                  className="hidden md:flex p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
                  title="Close sidebar ([ or ⌘B)"
                  aria-label="Close sidebar"
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
        </div>

        {/* Primary Navigation Links with Section Grouping */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3">
          <div className="space-y-1">
            {group1Items.map(renderNavButton)}
          </div>

          <div className="pt-2 border-t border-stone-800/80 space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Herd Operations
            </div>
            {group2Items.map(renderNavButton)}
          </div>

          <div className="pt-2 border-t border-stone-800/80 space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Management
            </div>
            {group3Items.map(renderNavButton)}
          </div>
        </div>

        {/* Bottom Profile Bar */}
        <div className="border-t border-stone-800 bg-[#0a0f0d] p-2.5 shrink-0">
          {isDemoMode && (
            <div className="mb-2">
              <button
                type="button"
                id="btn-sidebar-reset-data"
                onClick={resetToSampleData}
                title="Reset Sample Records"
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 text-xs font-medium transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-stone-400" strokeWidth={1.75} />
                <span>Reset Demo Records</span>
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-stone-800/70 transition-colors">
            <button
              type="button"
              onClick={() => {
                setActiveTab('profile');
                setMobileOpen(false);
              }}
              className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-bold shrink-0 border border-emerald-600/50">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-stone-200 group-hover:text-white truncate">
                  {displayName}
                </div>
                <div className="text-[10px] text-stone-400 truncate">
                  {displayRole}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={logout}
              className="p-1.5 text-stone-400 hover:text-rose-400 rounded-lg hover:bg-stone-800 transition-colors shrink-0 cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Expand button when Navigation Pane is Minimized (Owned by Navigation Pane, not on the page) */}
      {isCollapsed && onToggleCollapse && (
        <div className="no-print fixed top-3 left-3 z-40 hidden md:block">
          <button
            type="button"
            id="btn-sidebar-expand-toggle"
            onClick={onToggleCollapse}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#0e1512] hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 shadow-md transition-all cursor-pointer group"
            title="Open sidebar ([ or ⌘B)"
            aria-label="Open sidebar"
          >
            <PanelLeftOpen className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      )}
    </>
  );
};
