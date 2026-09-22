import React from 'react';
import { Search, Bell, Plus, RefreshCw, ChevronDown, Upload, FileText } from 'lucide-react';

interface HerdRecordsHeaderTemplateProps {
  farmName?: string;
  userName?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAddRecord: () => void;
  onOpenExcelUpload?: () => void;
  onOpenReport?: () => void;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  tabs: { id: string; label: string; count?: number }[];
}

export const HerdRecordsHeaderTemplate: React.FC<HerdRecordsHeaderTemplateProps> = ({
  farmName = 'Lula',
  userName = 'User',
  searchQuery,
  onSearchChange,
  onOpenAddRecord,
  onOpenExcelUpload,
  onOpenReport,
  activeTab,
  onSelectTab,
  tabs,
}) => {
  return (
    <div className="space-y-5">
      {/* Top Breadcrumb & User Action Bar matching the template */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Lula > User breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
          <span className="font-bold text-stone-900 dark:text-white tracking-tight text-base font-serif">
            {farmName}
          </span>
          <span className="text-stone-400">&gt;</span>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
            <span className="text-xs">👤</span>
            <span>{userName}</span>
            <ChevronDown className="w-3 h-3 text-stone-400" />
          </div>
        </div>

        {/* Right: Search, Sync, Bell, + Add Record button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search bar */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
            />
          </div>

          {/* Sync indicator */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-medium text-stone-600 dark:text-stone-300 shadow-2xs">
            <RefreshCw className="w-3.5 h-3.5 text-stone-400" />
            <span>Sync. 0m</span>
          </div>

          {/* Notifications bell */}
          <button
            type="button"
            className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors shadow-2xs"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Primary + Add Record Button matching dark green #184d39 */}
          <button
            type="button"
            onClick={onOpenAddRecord}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#184d39] hover:bg-[#123829] active:scale-98 text-white transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Topographic Watermark Banner with Serif Header matching Image 2 */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-stone-100 via-stone-50 to-stone-100 dark:from-stone-900 dark:via-stone-900/90 dark:to-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-xs">
        {/* Subtle SVG Topographic Contour Watermark Background */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-20 dark:opacity-10"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 800 200"
        >
          <path
            d="M0,60 C150,120 350,-20 500,80 C650,180 750,40 800,70 L800,200 L0,200 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-stone-400 dark:text-stone-600"
          />
          <path
            d="M0,100 C200,40 300,160 550,70 C700,-10 750,120 800,110"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-stone-400 dark:text-stone-600"
          />
          <path
            d="M0,140 C180,80 320,180 500,120 C680,60 760,160 800,140"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            className="text-stone-400 dark:text-stone-600"
          />
          <path
            d="M0,30 C220,90 400,10 600,100 C720,150 780,20 800,40"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            className="text-stone-400 dark:text-stone-600"
          />
        </svg>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3.5 mb-1.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shrink-0 border border-stone-300 dark:border-stone-700 shadow-xs">
                <img
                  src="/images/nav/records.jpg"
                  alt="Herd & Farm Records"
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1e293b] dark:text-stone-100 font-serif tracking-tight">
                Herd &amp; Farm Records
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1 max-w-2xl font-sans">
              Comprehensive livestock pedigree registry, reproductive tracking, veterinary health certificates, and operational herd ledgers.
            </p>
          </div>

          {/* Quick utility triggers */}
          <div className="flex items-center gap-2">
            {onOpenExcelUpload && (
              <button
                type="button"
                onClick={onOpenExcelUpload}
                className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white/80 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Upload Excel</span>
              </button>
            )}

            {onOpenReport && (
              <button
                type="button"
                onClick={onOpenReport}
                className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white/80 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
                <span>Report</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-stone-200 dark:border-stone-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
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
