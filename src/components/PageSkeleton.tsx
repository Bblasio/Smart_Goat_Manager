import React from 'react';
import { AppView } from '../types';

interface PageSkeletonProps {
  tab?: AppView;
}

export const PageSkeleton: React.FC<PageSkeletonProps> = () => {
  return (
    <div className="w-full space-y-6 animate-pulse py-1">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/60 dark:border-stone-800">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-stone-200 dark:bg-stone-800 rounded-xl" />
          <div className="h-4 w-72 bg-stone-200/70 dark:bg-stone-800/70 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-stone-200 dark:bg-stone-800 rounded-xl" />
          <div className="h-9 w-32 bg-emerald-200 dark:bg-emerald-950/60 rounded-xl" />
        </div>
      </div>

      {/* 4 Census / Summary Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map(idx => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-3 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-20 bg-stone-200 dark:bg-stone-800 rounded-md" />
              <div className="w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-800" />
            </div>
            <div className="h-8 w-16 bg-stone-300 dark:bg-stone-700 rounded-lg" />
            <div className="h-3 w-28 bg-stone-200/70 dark:bg-stone-800/70 rounded-md" />
          </div>
        ))}
      </div>

      {/* Search & Action Bar Skeleton */}
      <div className="p-3 bg-stone-50/80 dark:bg-stone-900/80 rounded-2xl border border-stone-200/80 dark:border-stone-800 flex flex-col sm:flex-row gap-3">
        <div className="h-10 flex-1 bg-stone-200/70 dark:bg-stone-800 rounded-xl" />
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-stone-200/70 dark:bg-stone-800 rounded-xl" />
          <div className="h-10 w-28 bg-stone-200/70 dark:bg-stone-800 rounded-xl" />
        </div>
      </div>

      {/* Table & Record Roster Skeleton */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-3xl overflow-hidden shadow-xs space-y-0">
        {/* Table Header */}
        <div className="bg-stone-100/70 dark:bg-stone-800/60 px-6 py-3.5 border-b border-stone-200 dark:border-stone-700/80 flex items-center justify-between">
          <div className="h-4 w-28 bg-stone-300 dark:bg-stone-700 rounded-md" />
          <div className="h-4 w-24 bg-stone-300 dark:bg-stone-700 rounded-md" />
          <div className="h-4 w-24 bg-stone-300 dark:bg-stone-700 rounded-md hidden md:block" />
          <div className="h-4 w-20 bg-stone-300 dark:bg-stone-700 rounded-md hidden lg:block" />
          <div className="h-4 w-20 bg-stone-300 dark:bg-stone-700 rounded-md" />
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {[1, 2, 3, 4, 5].map(row => (
            <div key={row} className="px-6 py-4 flex items-center justify-between">
              <div className="space-y-1.5 min-w-0">
                <div className="h-4 w-24 bg-stone-200 dark:bg-stone-800 rounded-md" />
                <div className="h-3 w-16 bg-stone-200/60 dark:bg-stone-800/60 rounded-md" />
              </div>
              <div className="h-6 w-20 bg-stone-200 dark:bg-stone-800 rounded-full" />
              <div className="h-4 w-20 bg-stone-200 dark:bg-stone-800 rounded-md hidden md:block" />
              <div className="h-4 w-16 bg-stone-200 dark:bg-stone-800 rounded-md hidden lg:block" />
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-lg bg-stone-200/80 dark:bg-stone-800" />
                <div className="w-8 h-8 rounded-lg bg-stone-200/80 dark:bg-stone-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
