import React from 'react';
import { Bell, Baby, Syringe, ChevronRight, X, Sparkles } from 'lucide-react';
import { FarmNotification } from '../utils/notificationHelper';

interface DailyNotificationBannerProps {
  todayNotifications: FarmNotification[];
  dismissedIds?: string[];
  onOpenModal: () => void;
  onDismissNotification?: (id: string) => void;
}

export const DailyNotificationBanner: React.FC<DailyNotificationBannerProps> = ({
  todayNotifications,
  dismissedIds = [],
  onOpenModal,
  onDismissNotification,
}) => {
  const activeToday = todayNotifications.filter(n => !dismissedIds.includes(n.id));

  if (activeToday.length === 0) return null;

  const breedingCount = activeToday.filter(n => n.type === 'breeding').length;
  const vaccineCount = activeToday.filter(n => n.type === 'vaccination').length;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-amber-500/10 dark:from-rose-950/40 dark:via-purple-950/30 dark:to-amber-950/30 border border-rose-300 dark:border-rose-800/80 p-4 shadow-sm animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white shadow-2xs">
                Today&apos;s Farm Alert: {activeToday.length} Scheduled Task{activeToday.length > 1 ? 's' : ''}
              </span>
              {breedingCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-md">
                  <Baby className="w-3 h-3" />
                  <span>{breedingCount} Kidding / Breeding</span>
                </span>
              )}
              {vaccineCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded-md">
                  <Syringe className="w-3 h-3" />
                  <span>{vaccineCount} Vaccination</span>
                </span>
              )}
            </div>

            <p className="text-xs font-medium text-stone-800 dark:text-stone-200 mt-1 leading-relaxed">
              {activeToday[0].title}
              {activeToday.length > 1 && (
                <span className="text-stone-500 dark:text-stone-400 ml-1">
                  (and {activeToday.length - 1} other item{activeToday.length - 1 > 1 ? 's' : ''} scheduled for today)
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            id="btn-open-today-notifications-banner"
            onClick={onOpenModal}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span>Review Alerts</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
