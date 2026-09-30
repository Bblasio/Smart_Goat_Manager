import React from 'react';

interface HerdRecordsHeaderTemplateProps {
  farmName?: string;
  userName?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenAddRecord?: () => void;
  onOpenExcelUpload?: () => void;
  onOpenReport?: () => void;
  onOpenNotificationModal?: () => void;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  tabs: { id: string; label: string; count?: number }[];
}

export const HerdRecordsHeaderTemplate: React.FC<HerdRecordsHeaderTemplateProps> = ({
  activeTab,
  onSelectTab,
  tabs,
}) => {
  return (
    <div className="space-y-4">
      {/* Compact Hero: Title + one line + "Synced just now" with dot */}
      <div className="rounded-2xl p-4 sm:p-5 bg-stone-50 dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight font-serif">
            Herd &amp; Farm Records
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1 max-w-2xl">
            Comprehensive livestock pedigree registry, reproductive tracking, veterinary health certificates, and operational herd ledgers.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-medium text-stone-600 dark:text-stone-300 shadow-2xs shrink-0 self-start sm:self-center">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>Synced just now</span>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-stone-200 dark:border-stone-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id
                    ? 'bg-emerald-800 text-white'
                    : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
