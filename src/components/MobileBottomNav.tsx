import React from 'react';
import { AppView, RecordType } from '../types';
import { Plus } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: AppView;
  setActiveTab: (tab: AppView) => void;
  onOpenAddModal: (type?: RecordType) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
}) => {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200 dark:border-stone-800 px-3 py-1.5 flex items-center justify-around shadow-lg transition-colors duration-200"
    >
      {/* 1. Dashboard */}
      <button
        type="button"
        id="btn-mobile-nav-dashboard"
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors min-w-[56px] min-h-[44px] ${
          activeTab === 'dashboard'
            ? 'text-stone-900 dark:text-white font-bold'
            : 'text-stone-500 dark:text-stone-400 font-medium hover:text-stone-900 dark:hover:text-stone-200'
        }`}
      >
        <div className={`w-5 h-5 rounded-md overflow-hidden shrink-0 border mb-0.5 ${
          activeTab === 'dashboard' ? 'border-emerald-600 dark:border-emerald-400 shadow-2xs' : 'border-stone-200 dark:border-stone-700'
        }`}>
          <img src="/images/nav/dashboard.jpg" alt="Dashboard" className="w-full h-full object-cover" />
        </div>
        <span className="text-[10px] leading-tight">Dashboard</span>
      </button>

      {/* 2. Herd Records */}
      <button
        type="button"
        id="btn-mobile-nav-records"
        onClick={() => setActiveTab('records')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors min-w-[56px] min-h-[44px] ${
          activeTab === 'records'
            ? 'text-stone-900 dark:text-white font-bold'
            : 'text-stone-500 dark:text-stone-400 font-medium hover:text-stone-900 dark:hover:text-stone-200'
        }`}
      >
        <div className={`w-5 h-5 rounded-md overflow-hidden shrink-0 border mb-0.5 ${
          activeTab === 'records' ? 'border-emerald-600 dark:border-emerald-400 shadow-2xs' : 'border-stone-200 dark:border-stone-700'
        }`}>
          <img src="/images/nav/records.jpg" alt="Herd" className="w-full h-full object-cover" />
        </div>
        <span className="text-[10px] leading-tight">Herd</span>
      </button>

      {/* 3. Center Quick Add Button */}
      <div className="relative -top-3">
        <button
          type="button"
          id="btn-mobile-center-add"
          onClick={() => onOpenAddModal('goat')}
          className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 border-2 border-white dark:border-stone-900 transition-transform active:scale-95"
          title="Add New Farm Record"
          aria-label="Add Record"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* 4. Veterinary & Health */}
      <button
        type="button"
        id="btn-mobile-nav-health"
        onClick={() => setActiveTab('health_vet')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors min-w-[56px] min-h-[44px] ${
          activeTab === 'health_vet'
            ? 'text-stone-900 dark:text-white font-bold'
            : 'text-stone-500 dark:text-stone-400 font-medium hover:text-stone-900 dark:hover:text-stone-200'
        }`}
      >
        <div className={`w-5 h-5 rounded-md overflow-hidden shrink-0 border mb-0.5 ${
          activeTab === 'health_vet' ? 'border-emerald-600 dark:border-emerald-400 shadow-2xs' : 'border-stone-200 dark:border-stone-700'
        }`}>
          <img src="/images/nav/health_vet.jpg" alt="Health" className="w-full h-full object-cover" />
        </div>
        <span className="text-[10px] leading-tight">Health</span>
      </button>

      {/* 5. Tasks */}
      <button
        type="button"
        id="btn-mobile-nav-tasks"
        onClick={() => setActiveTab('tasks')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors min-w-[56px] min-h-[44px] ${
          activeTab === 'tasks'
            ? 'text-stone-900 dark:text-white font-bold'
            : 'text-stone-500 dark:text-stone-400 font-medium hover:text-stone-900 dark:hover:text-stone-200'
        }`}
      >
        <div className={`w-5 h-5 rounded-md overflow-hidden shrink-0 border mb-0.5 ${
          activeTab === 'tasks' ? 'border-emerald-600 dark:border-emerald-400 shadow-2xs' : 'border-stone-200 dark:border-stone-700'
        }`}>
          <img src="/images/nav/tasks.jpg" alt="Tasks" className="w-full h-full object-cover" />
        </div>
        <span className="text-[10px] leading-tight">Tasks</span>
      </button>
    </nav>
  );
};
