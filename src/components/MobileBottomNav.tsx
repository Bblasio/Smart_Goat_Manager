import React from 'react';
import { AppView } from '../types';
import {
  LayoutGrid,
  ClipboardList,
  Stethoscope,
  CheckSquare,
  Settings
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: AppView;
  setActiveTab: (tab: AppView) => void;
  onOpenSettings?: () => void;
  isDrawerOpen?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  isDrawerOpen = false,
}) => {
  // If mobile drawer is open, hide bottom nav completely to prevent floating conflict
  if (isDrawerOpen) {
    return null;
  }

  const handleSettingsClick = () => {
    if (onOpenSettings) {
      onOpenSettings();
    }
    const settingsElem = document.getElementById('farm-bottom-settings');
    if (settingsElem) {
      settingsElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      aria-label="Mobile Navigation"
      className="no-print md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 px-2 py-1.5 flex items-center justify-around shadow-lg transition-colors duration-200"
    >
      {/* 1. Dashboard */}
      <button
        type="button"
        id="btn-mobile-nav-dashboard"
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors min-w-[52px] min-h-[44px] ${
          activeTab === 'dashboard'
            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
            : 'text-stone-500 dark:text-stone-400 font-medium hover:text-stone-900 dark:hover:text-stone-200'
        }`}
      >
        <LayoutGrid className="w-5 h-5 mb-0.5" strokeWidth={1.75} />
        <span className="text-[10px] leading-tight">Dashboard</span>
      </button>

      {/* 2. Herd Records */}
      <button
        type="button"
        id="btn-mobile-nav-records"
        onClick={() => setActiveTab('records')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors min-w-[52px] min-h-[44px] ${
          activeTab === 'records'
            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
            : 'text-stone-500 dark:text-stone-400 font-medium hover:text-stone-900 dark:hover:text-stone-200'
        }`}
      >
        <ClipboardList className="w-5 h-5 mb-0.5" strokeWidth={1.75} />
        <span className="text-[10px] leading-tight">Herd</span>
      </button>

      {/* 3. Veterinary & Health */}
      <button
        type="button"
        id="btn-mobile-nav-health"
        onClick={() => setActiveTab('health_vet')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors min-w-[52px] min-h-[44px] ${
          activeTab === 'health_vet'
            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
            : 'text-stone-500 dark:text-stone-400 font-medium hover:text-stone-900 dark:hover:text-stone-200'
        }`}
      >
        <Stethoscope className="w-5 h-5 mb-0.5" strokeWidth={1.75} />
        <span className="text-[10px] leading-tight">Health</span>
      </button>

      {/* 4. Tasks */}
      <button
        type="button"
        id="btn-mobile-nav-tasks"
        onClick={() => setActiveTab('tasks')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors min-w-[52px] min-h-[44px] ${
          activeTab === 'tasks'
            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
            : 'text-stone-500 dark:text-stone-400 font-medium hover:text-stone-900 dark:hover:text-stone-200'
        }`}
      >
        <CheckSquare className="w-5 h-5 mb-0.5" strokeWidth={1.75} />
        <span className="text-[10px] leading-tight">Tasks</span>
      </button>

      {/* 5. Settings */}
      <button
        type="button"
        id="btn-mobile-nav-settings"
        onClick={() => setActiveTab('settings')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors min-w-[52px] min-h-[44px] ${
          activeTab === 'settings'
            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
            : 'text-stone-500 dark:text-stone-400 font-medium hover:text-stone-900 dark:hover:text-stone-200'
        }`}
        title="Settings"
      >
        <Settings className="w-5 h-5 mb-0.5" strokeWidth={1.75} />
        <span className="text-[10px] leading-tight">Settings</span>
      </button>
    </nav>
  );
};
