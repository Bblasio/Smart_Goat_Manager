import React from 'react';
import { useFarm } from '../context/FarmContext';
import { AppView } from '../types';
import { ChevronUp } from 'lucide-react';

interface AppFooterProps {
  onNavigate?: (view: AppView) => void;
  onOpenAddModal?: () => void;
  isSettingsOpen?: boolean;
  onToggleSettings?: () => void;
}

export const AppFooter: React.FC<AppFooterProps> = () => {
  const { farmName, user } = useFarm();

  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="no-print mt-auto mb-16 md:mb-0 transition-colors border-t border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/90 text-stone-600 dark:text-stone-400 py-3.5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-center sm:text-left">
            <span>© {currentYear} <strong>{user?.farm_name || farmName}</strong>. All rights reserved.</span>
            <span className="hidden sm:inline text-stone-300 dark:text-stone-700">•</span>
            <span>Precision Caprine Agriculture</span>
            <span className="hidden sm:inline text-stone-300 dark:text-stone-700">•</span>
            <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
              v2.5
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="btn-footer-scroll-top"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-medium text-xs transition-colors shadow-2xs active:scale-98 cursor-pointer"
              title="Return to top of page"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Back to Top</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
