import React from 'react';
import { Bell, Activity, Syringe, ChevronRight, X } from 'lucide-react';
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
    <div className="relative overflow-hidden rounded-2xl bg-[#FCEBEB] dark:bg-[#501313] border border-[#E3E1D8] dark:border-[#33322E] p-4 shadow-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#A32D2D] dark:bg-[#F09595] text-white dark:text-[#501313] flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#A32D2D] text-white">
                Today&apos;s Farm Alert: {activeToday.length} Scheduled Task{activeToday.length > 1 ? 's' : ''}
              </span>
              {breedingCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0F6E56] dark:text-[#5DCAA5] bg-[#E7F4EE] dark:bg-[#04342C] border border-[#C3E6D6] dark:border-[#085041] px-2 py-0.5 rounded-md">
                  <Activity className="w-3 h-3" />
                  <span>{breedingCount} Kidding / Breeding</span>
                </span>
              )}
              {vaccineCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#A32D2D] dark:text-[#F09595] bg-[#FCEBEB] dark:bg-[#501313] border border-[#A32D2D]/30 px-2 py-0.5 rounded-md">
                  <Syringe className="w-3 h-3" />
                  <span>{vaccineCount} Vaccination</span>
                </span>
              )}
            </div>

            <p className="text-xs font-normal text-[#1F1F1D] dark:text-[#F1F0EA] mt-1 leading-relaxed">
              {activeToday[0].title}
              {activeToday.length > 1 && (
                <span className="text-[#5F5E5A] dark:text-[#B4B2A9] ml-1">
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
            className="px-3.5 py-2 bg-[#A32D2D] hover:bg-[#822424] dark:bg-[#F09595] dark:hover:bg-[#f3abab] text-white dark:text-[#501313] font-medium text-xs rounded-xl shadow-none transition-colors flex items-center gap-1.5"
          >
            <span>Review Alerts</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
