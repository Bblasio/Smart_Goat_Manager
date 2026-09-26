import React from 'react';
import { motion } from 'motion/react';
import { AppView } from '../types';
import {
  LayoutDashboard,
  ClipboardList,
  Wheat,
  Dna,
  FolderKanban,
  Stethoscope,
  TrendingUp,
  Settings,
  Loader2
} from 'lucide-react';

interface PageContentSkeletonProps {
  targetTab: AppView;
}

export const PageContentSkeleton: React.FC<PageContentSkeletonProps> = ({ targetTab }) => {
  const getTabMeta = (tab: AppView) => {
    switch (tab) {
      case 'dashboard':
        return {
          title: 'Farm Overview & Live Analytics',
          category: 'Dashboard',
          icon: LayoutDashboard,
          hint: 'Loading livestock metrics, weight trends & financial health...',
        };
      case 'tasks':
        return {
          title: 'Tasks & Operational Schedules',
          category: 'Operations',
          icon: ClipboardList,
          hint: 'Loading scheduled farm tasks, feeding & health reminders...',
        };
      case 'feed_supply':
        return {
          title: 'Feed & Stockpile Inventory',
          category: 'Nutrition',
          icon: Wheat,
          hint: 'Loading silo stockpiles, forage rations & medication supplies...',
        };
      case 'breeding_estimator':
        return {
          title: 'Breeding & Gestation Predictor',
          category: 'Breeding',
          icon: Dna,
          hint: 'Calculating gestation milestones, kidding countdowns & dam history...',
        };
      case 'records':
        return {
          title: 'Herd & Farm Records',
          category: 'Livestock Registry',
          icon: FolderKanban,
          hint: 'Loading herd census, kid nursery roster & pedigree data...',
        };
      case 'health_vet':
        return {
          title: 'Veterinary Records & Clinical Healthcare',
          category: 'Healthcare',
          icon: Stethoscope,
          hint: 'Loading clinical logs, quarantine alerts & vaccine protocol...',
        };
      case 'reports':
        return {
          title: 'Farm Intelligence & Financial Forecasts',
          category: 'Analytics',
          icon: TrendingUp,
          hint: 'Compiling financial ledger, revenue velocity & yield projections...',
        };
      case 'settings':
      case 'profile':
      default:
        return {
          title: 'Settings & Farm Profile',
          category: 'System Defaults',
          icon: Settings,
          hint: 'Loading farm preferences, currency units & system configuration...',
        };
    }
  };

  const meta = getTabMeta(targetTab);
  const IconComponent = meta.icon;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200 select-none pb-12">
      {/* Top Velocity Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-stone-200/50 dark:bg-stone-800/50 overflow-hidden z-50 pointer-events-none">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300"
          initial={{ width: '15%' }}
          animate={{ width: ['15%', '70%', '95%'] }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
        />
      </div>

      {/* Dynamic Header Skeleton matching the target page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80 dark:border-stone-800/80">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <IconComponent className="w-4 h-4 shrink-0" />
            <span>{meta.category}</span>
            <span className="text-stone-300 dark:text-stone-700">·</span>
            <span className="inline-flex items-center gap-1.5 text-stone-500 dark:text-stone-400">
              <Loader2 className="w-3 h-3 animate-spin text-emerald-600 dark:text-emerald-400" />
              <span>Loading content</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-3">
            <span>{meta.title}</span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {meta.hint}
          </p>
        </div>

        {/* Action Button Skeletons */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-9 w-24 rounded-xl bg-stone-200 dark:bg-stone-800 animate-pulse" />
          <div className="h-9 w-32 rounded-xl bg-emerald-600/30 dark:bg-emerald-600/20 animate-pulse" />
        </div>
      </div>

      {/* PAGE-SPECIFIC SKELETON LAYOUTS */}
      {targetTab === 'dashboard' && <DashboardSkeleton />}
      {targetTab === 'records' && <RecordsSkeleton />}
      {targetTab === 'tasks' && <TasksSkeleton />}
      {targetTab === 'feed_supply' && <FeedSupplySkeleton />}
      {targetTab === 'breeding_estimator' && <BreedingSkeleton />}
      {targetTab === 'health_vet' && <HealthSkeleton />}
      {targetTab === 'reports' && <ReportsSkeleton />}
      {(targetTab === 'settings' || targetTab === 'profile') && <SettingsSkeleton />}
    </div>
  );
};

/* =========================================================================
   1. DASHBOARD SKELETON
   ========================================================================= */
const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Hero Welcome Card Skeleton */}
      <div className="p-6 rounded-3xl bg-stone-100 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse">
        <div className="space-y-2">
          <div className="h-6 w-56 bg-stone-300 dark:bg-stone-700 rounded-lg" />
          <div className="h-4 w-80 bg-stone-200 dark:bg-stone-800 rounded-md" />
        </div>
        <div className="flex gap-2.5">
          <div className="h-9 w-28 bg-stone-300 dark:bg-stone-700 rounded-xl" />
          <div className="h-9 w-28 bg-emerald-600/30 rounded-xl" />
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2.5 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-stone-200 dark:bg-stone-800 rounded" />
              <div className="w-6 h-6 rounded-lg bg-stone-200 dark:bg-stone-800" />
            </div>
            <div className="h-7 w-16 bg-stone-300 dark:bg-stone-700 rounded-md" />
            <div className="h-3 w-24 bg-stone-100 dark:bg-stone-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* 2-Column Main Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Weight trends chart */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="h-4 w-40 bg-stone-300 dark:bg-stone-700 rounded" />
                <div className="h-3 w-56 bg-stone-200 dark:bg-stone-800 rounded" />
              </div>
              <div className="h-8 w-24 bg-stone-200 dark:bg-stone-800 rounded-xl" />
            </div>
            {/* Chart Graphic Skeleton */}
            <div className="h-64 rounded-2xl bg-stone-100 dark:bg-stone-800/40 border border-dashed border-stone-200 dark:border-stone-700/60 flex items-center justify-center p-4">
              <div className="w-full h-full flex items-end gap-3 pt-8 pb-2">
                {[45, 60, 55, 75, 70, 85, 90, 80, 95].map((h, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-stone-200 dark:bg-stone-700/60 rounded-t-md"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Recent Sales Feed */}
          <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3 animate-pulse">
            <div className="h-4 w-36 bg-stone-300 dark:bg-stone-700 rounded" />
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {[1, 2, 3].map(i => (
                <div key={i} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-stone-200 dark:bg-stone-800" />
                    <div className="space-y-1">
                      <div className="h-3 w-28 bg-stone-300 dark:bg-stone-700 rounded" />
                      <div className="h-2.5 w-20 bg-stone-200 dark:bg-stone-800 rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-16 bg-emerald-500/20 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Gestation Watchlist & Cash Flow */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-4 w-44 bg-stone-300 dark:bg-stone-700 rounded" />
              <div className="h-5 w-16 bg-stone-200 dark:bg-stone-800 rounded-full" />
            </div>
            <div className="space-y-2.5">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="h-3.5 w-24 bg-stone-300 dark:bg-stone-700 rounded" />
                    <div className="h-2.5 w-32 bg-stone-200 dark:bg-stone-800 rounded" />
                  </div>
                  <div className="h-6 w-20 bg-amber-500/20 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3 animate-pulse">
            <div className="h-4 w-32 bg-stone-300 dark:bg-stone-700 rounded" />
            <div className="h-24 rounded-2xl bg-stone-100 dark:bg-stone-800/40" />
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   2. RECORDS SKELETON
   ========================================================================= */
const RecordsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Census Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {[
          'Total Head Count',
          'Active Adults',
          'Pregnant In-Kid',
          'Quarantine Alert',
          'Kids & Nursery',
        ].map((title, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2 animate-pulse"
          >
            <div className="h-3 w-24 bg-stone-200 dark:bg-stone-800 rounded" />
            <div className="h-7 w-16 bg-stone-300 dark:bg-stone-700 rounded-md" />
            <div className="h-2.5 w-20 bg-stone-100 dark:bg-stone-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Tabs navigation row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-stone-200 dark:border-stone-800 animate-pulse">
        {['Herd Records', 'Kids & Nursery', 'Breeding', 'Health', 'Milk', 'Sales', 'Workers'].map((t, idx) => (
          <div
            key={idx}
            className="h-9 w-28 bg-stone-200 dark:bg-stone-800 rounded-xl shrink-0"
          />
        ))}
      </div>

      {/* Search and Filters Toolbar */}
      <div className="p-3.5 rounded-2xl bg-stone-100/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center gap-3 animate-pulse">
        <div className="h-9 flex-1 bg-stone-200 dark:bg-stone-800 rounded-xl w-full" />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="h-9 w-28 bg-stone-200 dark:bg-stone-800 rounded-xl" />
          <div className="h-9 w-28 bg-stone-200 dark:bg-stone-800 rounded-xl" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs animate-pulse">
        <div className="h-11 bg-stone-100 dark:bg-stone-800/70 border-b border-stone-200 dark:border-stone-700 px-6 flex items-center justify-between">
          <div className="h-3 w-28 bg-stone-300 dark:bg-stone-600 rounded" />
          <div className="h-3 w-24 bg-stone-300 dark:bg-stone-600 rounded" />
          <div className="h-3 w-20 bg-stone-300 dark:bg-stone-600 rounded" />
          <div className="h-3 w-20 bg-stone-300 dark:bg-stone-600 rounded" />
          <div className="h-3 w-16 bg-stone-300 dark:bg-stone-600 rounded" />
        </div>
        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="py-4 px-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-1/4">
                <div className="w-8 h-8 rounded-lg bg-stone-200 dark:bg-stone-800 shrink-0" />
                <div className="space-y-1">
                  <div className="h-3.5 w-20 bg-stone-300 dark:bg-stone-700 rounded" />
                  <div className="h-2.5 w-14 bg-stone-200 dark:bg-stone-800 rounded" />
                </div>
              </div>
              <div className="h-5 w-20 bg-emerald-500/15 rounded-full" />
              <div className="h-3 w-16 bg-stone-200 dark:bg-stone-800 rounded" />
              <div className="h-3 w-14 bg-stone-200 dark:bg-stone-800 rounded" />
              <div className="h-3 w-14 bg-stone-200 dark:bg-stone-800 rounded" />
              <div className="h-8 w-8 rounded-lg bg-stone-200 dark:bg-stone-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   3. TASKS SKELETON
   ========================================================================= */
const TasksSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 4 Task Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {['Overdue Tasks', 'Due Today', 'Upcoming 7 Days', 'Completed'].map((label, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2 animate-pulse"
          >
            <div className="h-3 w-24 bg-stone-200 dark:bg-stone-800 rounded" />
            <div className="h-8 w-14 bg-stone-300 dark:bg-stone-700 rounded-md" />
            <div className="h-2.5 w-32 bg-stone-100 dark:bg-stone-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Segmented Category Filter bar */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-stone-100 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 animate-pulse">
        {['All Tasks', 'Breeding', 'Health & Vet', 'Feeding', 'Farm Ops'].map((c, i) => (
          <div key={i} className="h-8 w-24 rounded-xl bg-stone-200 dark:bg-stone-800" />
        ))}
      </div>

      {/* Task Checklist Items */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-4 animate-pulse"
          >
            <div className="flex items-center gap-3.5 flex-1">
              <div className="w-5 h-5 rounded-lg bg-stone-200 dark:bg-stone-800 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-3/4 bg-stone-300 dark:bg-stone-700 rounded" />
                <div className="flex items-center gap-2">
                  <div className="h-3 w-20 bg-stone-200 dark:bg-stone-800 rounded" />
                  <div className="h-3 w-16 bg-stone-200 dark:bg-stone-800 rounded" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-20 bg-amber-500/20 rounded-full" />
              <div className="w-7 h-7 rounded-full bg-stone-200 dark:bg-stone-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* =========================================================================
   4. FEED & SUPPLY SKELETON
   ========================================================================= */
const FeedSupplySkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Inventory Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {['Total Feed in Silo', 'Low Stock Warning', 'Feed Expense Ledger', 'Active Ration Groups'].map((l, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2 animate-pulse"
          >
            <div className="h-3 w-28 bg-stone-200 dark:bg-stone-800 rounded" />
            <div className="h-8 w-20 bg-stone-300 dark:bg-stone-700 rounded-md" />
            <div className="h-2.5 w-24 bg-stone-100 dark:bg-stone-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Stockpiles Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-4 animate-pulse"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-2xl bg-stone-200 dark:bg-stone-800" />
              <div className="h-5 w-16 bg-stone-200 dark:bg-stone-800 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <div className="h-4 w-32 bg-stone-300 dark:bg-stone-700 rounded" />
              <div className="h-3 w-20 bg-stone-200 dark:bg-stone-800 rounded" />
            </div>
            {/* Progress gauge placeholder */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <div className="h-2 w-12 bg-stone-200 dark:bg-stone-800 rounded" />
                <div className="h-2 w-8 bg-stone-200 dark:bg-stone-800 rounded" />
              </div>
              <div className="h-2 w-full rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                <div className="h-full bg-emerald-500/40 w-3/5 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Restock History Table Skeleton */}
      <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-3 animate-pulse">
        <div className="h-4 w-44 bg-stone-300 dark:bg-stone-700 rounded" />
        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="py-3 flex items-center justify-between">
              <div className="h-3.5 w-40 bg-stone-200 dark:bg-stone-800 rounded" />
              <div className="h-3.5 w-24 bg-stone-200 dark:bg-stone-800 rounded" />
              <div className="h-3.5 w-16 bg-emerald-500/20 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   5. BREEDING ESTIMATOR SKELETON
   ========================================================================= */
const BreedingSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Gestation Predictor Dual Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Panel */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-4 animate-pulse">
          <div className="h-5 w-48 bg-stone-300 dark:bg-stone-700 rounded" />
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="h-3 w-28 bg-stone-200 dark:bg-stone-800 rounded" />
              <div className="h-10 w-full bg-stone-100 dark:bg-stone-800 rounded-xl" />
            </div>
            <div className="space-y-1">
              <div className="h-3 w-28 bg-stone-200 dark:bg-stone-800 rounded" />
              <div className="h-10 w-full bg-stone-100 dark:bg-stone-800 rounded-xl" />
            </div>
            <div className="space-y-1">
              <div className="h-3 w-32 bg-stone-200 dark:bg-stone-800 rounded" />
              <div className="h-10 w-full bg-stone-100 dark:bg-stone-800 rounded-xl" />
            </div>
          </div>
          <div className="h-11 w-full bg-emerald-600/30 rounded-xl mt-4" />
        </div>

        {/* Right Prediction Results Panel */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-stone-100/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 space-y-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-4 w-36 bg-stone-300 dark:bg-stone-700 rounded" />
            <div className="h-6 w-24 bg-emerald-500/20 rounded-full" />
          </div>
          <div className="h-28 rounded-2xl bg-white dark:bg-stone-800/60 p-4 space-y-2">
            <div className="h-3 w-28 bg-stone-200 dark:bg-stone-700 rounded" />
            <div className="h-8 w-48 bg-stone-300 dark:bg-stone-600 rounded" />
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-xl bg-white dark:bg-stone-800/60 p-2 space-y-1.5">
                <div className="h-2 w-12 bg-stone-200 dark:bg-stone-700 rounded" />
                <div className="h-3.5 w-16 bg-stone-300 dark:bg-stone-600 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Watchlist Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-4 w-52 bg-stone-300 dark:bg-stone-700 rounded" />
          <div className="h-5 w-28 bg-stone-200 dark:bg-stone-800 rounded-full" />
        </div>
        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="py-3 flex items-center justify-between">
              <div className="h-3.5 w-24 bg-stone-300 dark:bg-stone-700 rounded" />
              <div className="h-3.5 w-20 bg-stone-200 dark:bg-stone-800 rounded" />
              <div className="h-3.5 w-28 bg-stone-200 dark:bg-stone-800 rounded" />
              <div className="h-6 w-24 bg-emerald-500/20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   6. HEALTH SKELETON
   ========================================================================= */
const HealthSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 5 Health Status Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {['Healthy Herd %', 'Under Treatment', 'Quarantine Protocol', 'Vaccines Due', 'Deworming Plan'].map((l, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2 animate-pulse"
          >
            <div className="h-3 w-24 bg-stone-200 dark:bg-stone-800 rounded" />
            <div className="h-7 w-16 bg-stone-300 dark:bg-stone-700 rounded-md" />
            <div className="h-2.5 w-20 bg-stone-100 dark:bg-stone-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="p-3.5 rounded-2xl bg-stone-100/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 flex items-center gap-3 animate-pulse">
        <div className="h-9 flex-1 bg-stone-200 dark:bg-stone-800 rounded-xl" />
        <div className="h-9 w-32 bg-stone-200 dark:bg-stone-800 rounded-xl" />
      </div>

      {/* Clinical Logs Table */}
      <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-3 animate-pulse">
        <div className="h-4 w-44 bg-stone-300 dark:bg-stone-700 rounded" />
        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="py-3 flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-3.5 w-24 bg-stone-300 dark:bg-stone-700 rounded" />
                <div className="h-2.5 w-40 bg-stone-200 dark:bg-stone-800 rounded" />
              </div>
              <div className="h-5 w-24 bg-amber-500/20 rounded-full" />
              <div className="h-3 w-20 bg-stone-200 dark:bg-stone-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   7. REPORTS & FORECASTS SKELETON
   ========================================================================= */
const ReportsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 4 Financial Ledger KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {['Total Commercial Revenue', 'Operating Expenses', 'Net Farm Profit', 'Sales Margin Velocity'].map((l, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2.5 animate-pulse"
          >
            <div className="h-3 w-32 bg-stone-200 dark:bg-stone-800 rounded" />
            <div className="h-8 w-28 bg-stone-300 dark:bg-stone-700 rounded-md" />
            <div className="h-2.5 w-20 bg-emerald-500/20 rounded" />
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-4 w-48 bg-stone-300 dark:bg-stone-700 rounded" />
            <div className="h-8 w-32 bg-stone-200 dark:bg-stone-800 rounded-xl" />
          </div>
          <div className="h-64 rounded-2xl bg-stone-100 dark:bg-stone-800/40 border border-dashed border-stone-200 dark:border-stone-700/60" />
        </div>

        <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-4 animate-pulse">
          <div className="h-4 w-36 bg-stone-300 dark:bg-stone-700 rounded" />
          <div className="h-64 rounded-2xl bg-stone-100 dark:bg-stone-800/40" />
        </div>
      </div>

      {/* Forecast Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2 animate-pulse"
          >
            <div className="h-3 w-20 bg-stone-200 dark:bg-stone-800 rounded" />
            <div className="h-7 w-28 bg-stone-300 dark:bg-stone-700 rounded-md" />
            <div className="h-2.5 w-24 bg-stone-100 dark:bg-stone-800/60 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};

/* =========================================================================
   8. SETTINGS & PROFILE SKELETON
   ========================================================================= */
const SettingsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
      {/* Left Settings Nav Sidebar (4 cols) */}
      <div className="lg:col-span-4 space-y-2 p-3 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div
            key={i}
            className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-stone-800/60 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-stone-200 dark:bg-stone-800 shrink-0" />
            <div className="space-y-1 flex-1">
              <div className="h-3.5 w-28 bg-stone-300 dark:bg-stone-700 rounded" />
              <div className="h-2.5 w-40 bg-stone-200 dark:bg-stone-800 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Right Settings Form Area (8 cols) */}
      <div className="lg:col-span-8 p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-5">
        <div className="space-y-1.5 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="h-5 w-44 bg-stone-300 dark:bg-stone-700 rounded" />
          <div className="h-3 w-64 bg-stone-200 dark:bg-stone-800 rounded" />
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="h-3 w-28 bg-stone-200 dark:bg-stone-800 rounded" />
            <div className="h-10 w-full bg-stone-100 dark:bg-stone-800 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="h-3 w-28 bg-stone-200 dark:bg-stone-800 rounded" />
              <div className="h-10 w-full bg-stone-100 dark:bg-stone-800 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-28 bg-stone-200 dark:bg-stone-800 rounded" />
              <div className="h-10 w-full bg-stone-100 dark:bg-stone-800 rounded-xl" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-20 bg-stone-200 dark:bg-stone-800 rounded" />
            <div className="h-24 w-full bg-stone-100 dark:bg-stone-800 rounded-xl" />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <div className="h-10 w-32 bg-emerald-600/40 rounded-xl" />
        </div>
      </div>
    </div>
  );
};
