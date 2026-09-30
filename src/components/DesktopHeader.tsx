import React from 'react';
import { useFarm } from '../context/FarmContext';
import { AppView } from '../types';
import {
  Search,
  Bell,
  ChevronRight
} from 'lucide-react';

interface DesktopHeaderProps {
  activeTab: AppView;
  setActiveTab: (tab: AppView) => void;
  onOpenSearchModal: () => void;
  onOpenNotificationModal: () => void;
  todayNotificationCount: number;
  isSidebarCollapsed?: boolean;
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearchModal,
  onOpenNotificationModal,
  todayNotificationCount,
  isSidebarCollapsed = false,
}) => {
  const { farmName } = useFarm();

  const getTabTitle = (tab: AppView): string => {
    switch (tab) {
      case 'dashboard':
        return 'Executive Dashboard';
      case 'tasks':
        return 'Tasks & Daily Schedules';
      case 'feed_supply':
        return 'Feed & Supply Inventory';
      case 'breeding_estimator':
        return 'Breeding Cycle Estimator';
      case 'records':
        return 'Herd & Farm Records';
      case 'health_vet':
        return 'Veterinary & Health Log';
      case 'reports':
        return 'Analytics & Forecast Reports';
      case 'profile':
        return 'Settings';
      case 'settings':
        return 'Settings';
      default:
        return 'Farm Ledger';
    }
  };

  return (
    <header className="no-print hidden md:flex sticky top-0 z-30 h-16 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800/80 px-4 xl:px-6 items-center justify-between transition-colors duration-200">
      {/* Left: Breadcrumb Navigation */}
      <div className={`flex items-center gap-2.5 min-w-0 ${isSidebarCollapsed ? 'pl-12' : ''} transition-[padding] duration-200`}>
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className="text-xs font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors truncate"
        >
          {farmName || 'Smart Goat Farm'}
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-stone-400 dark:text-stone-600 shrink-0" />
        <span className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
          {getTabTitle(activeTab)}
        </span>
      </div>

      {/* Right: Search & Notifications */}
      <div className="flex items-center gap-3">
        {/* Quick Search Button / Shortcut */}
        <button
          type="button"
          id="btn-desktop-quick-search"
          onClick={onOpenSearchModal}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800/90 hover:bg-stone-200/70 dark:hover:bg-stone-700/70 border border-stone-200 dark:border-stone-700/80 text-xs text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-all shadow-2xs group cursor-pointer"
          title="Search herd records, tag numbers, or views (Press / or ⌘K)"
        >
          <Search className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-500 transition-colors" />
          <span className="font-medium hidden xl:inline">Search herd records...</span>
          <span className="font-medium xl:hidden">Search...</span>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 text-[10px] font-mono text-stone-500 dark:text-stone-300 shadow-2xs">
            /
          </kbd>
        </button>

        {/* Notification Bell */}
        <button
          type="button"
          id="btn-desktop-notifications"
          onClick={onOpenNotificationModal}
          className={`relative p-2 rounded-xl border transition-all cursor-pointer ${
            todayNotificationCount > 0
              ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 shadow-2xs'
              : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
          }`}
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {todayNotificationCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-2xs">
              {todayNotificationCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
