import React, { useState, useRef, useEffect } from 'react';
import { useFarm } from '../context/FarmContext';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { AppView, RecordType } from '../types';
import {
  Search,
  Plus,
  Bell,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  CloudOff,
  AlertCircle,
  Sparkles,
  ClipboardList,
  HeartPulse,
  Milk,
  DollarSign,
  Baby,
  Building2
} from 'lucide-react';

interface DesktopHeaderProps {
  activeTab: AppView;
  setActiveTab: (tab: AppView) => void;
  onOpenAddModal: (type?: RecordType) => void;
  onOpenSearchModal: () => void;
  onOpenNotificationModal: () => void;
  todayNotificationCount: number;
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onOpenSearchModal,
  onOpenNotificationModal,
  todayNotificationCount,
}) => {
  const { farmName, user, syncStatus, syncError } = useFarm();
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const addOptions: { label: string; type: RecordType; icon: React.ComponentType<{ className?: string }> }[] = [
    { label: 'Goat / Kid', type: 'goat', icon: ClipboardList },
    { label: 'Health Record', type: 'health', icon: HeartPulse },
    { label: 'Daily Milk Yield', type: 'milk', icon: Milk },
    { label: 'Breeding Mating', type: 'breeding', icon: Baby },
    { label: 'Goat Sale', type: 'sale', icon: DollarSign },
    { label: 'Expense', type: 'expense', icon: DollarSign },
  ];

  return (
    <header className="no-print hidden md:flex sticky top-0 z-30 h-16 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800/80 px-4 xl:px-6 items-center justify-between transition-colors duration-200">
      {/* Left: Breadcrumb Navigation */}
      <div className="flex items-center gap-2.5 min-w-0">
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

      {/* Middle & Right: Search, Quick Add, Alerts, Status & Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Search Button / Shortcut */}
        <button
          type="button"
          id="btn-desktop-quick-search"
          onClick={onOpenSearchModal}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800/90 hover:bg-stone-200/70 dark:hover:bg-stone-700/70 border border-stone-200 dark:border-stone-700/80 text-xs text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-all shadow-2xs group"
          title="Search herd records, tag numbers, or actions (Press / or ⌘K)"
        >
          <Search className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-500 transition-colors" />
          <span className="font-medium hidden xl:inline">Search herd or actions...</span>
          <span className="font-medium xl:hidden">Search...</span>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 text-[10px] font-mono text-stone-500 dark:text-stone-300 shadow-2xs">
            /
          </kbd>
        </button>

        {/* Live Cloud & Sync Status Indicator */}
        <SyncStatusIndicator />

        {/* Notification Alert Bell */}
        <button
          type="button"
          id="btn-desktop-notifications"
          onClick={onOpenNotificationModal}
          className={`relative p-2 rounded-xl border transition-all ${
            todayNotificationCount > 0
              ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 shadow-2xs'
              : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
          }`}
          title="Daily Notifications & Alerts"
        >
          <Bell className="w-4 h-4" />
          {todayNotificationCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-2xs">
              {todayNotificationCount}
            </span>
          )}
        </button>

        {/* Quick Add Dropdown Menu */}
        <div className="relative" ref={addMenuRef}>
          <button
            type="button"
            id="btn-desktop-quick-add"
            onClick={() => setIsAddMenuOpen(prev => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Record</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isAddMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isAddMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 border-b border-stone-100 dark:border-stone-700/60 mb-1">
                Select Record Type
              </div>
              {addOptions.map(opt => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => {
                      setIsAddMenuOpen(false);
                      onOpenAddModal(opt.type);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors text-left"
                  >
                    <Icon className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Settings / Profile Avatar Link */}
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200/80 dark:hover:bg-stone-700/80 border border-stone-200 dark:border-stone-700 transition-colors"
          title="Settings & Farm Profile"
        >
          {user?.logo_url ? (
            <img
              src={user.logo_url}
              alt={farmName}
              className="w-6 h-6 rounded-lg object-cover border border-stone-300 dark:border-stone-600 shrink-0"
            />
          ) : (
            <img
              src="/app.png"
              alt={farmName}
              className="w-6 h-6 rounded-lg object-cover border border-stone-300 dark:border-stone-600 shrink-0"
            />
          )}
          <span className="text-xs font-bold text-stone-800 dark:text-stone-200 max-w-[100px] truncate">
            {farmName}
          </span>
        </button>
      </div>
    </header>
  );
};
