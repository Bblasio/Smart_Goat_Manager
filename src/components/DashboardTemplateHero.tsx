import React, { useMemo } from 'react';
import { Baby, Sparkles, ArrowRight, Sun } from 'lucide-react';
import { GoatRecord, BreedingRecord, HealthRecord, MilkRecord } from '../types';

interface DashboardTemplateHeroProps {
  farmName: string;
  goats: GoatRecord[];
  breeding: BreedingRecord[];
  health: HealthRecord[];
  milk: MilkRecord[];
  onNavigateToRecords: () => void;
  onNavigateToBreedingEstimator: () => void;
  onNavigateToHealth?: () => void;
  onNavigateToTasks?: () => void;
}

export const DashboardTemplateHero: React.FC<DashboardTemplateHeroProps> = ({
  farmName,
  goats,
  breeding,
  health,
  onNavigateToRecords,
  onNavigateToBreedingEstimator,
  onNavigateToHealth,
  onNavigateToTasks,
}) => {
  // Current dynamic time and greeting
  const now = new Date();
  const hours = now.getHours();
  const timeOfDay = hours < 12 ? 'morning' : hours < 18 ? 'afternoon' : 'evening';

  // Formatted date string in uppercase matching Image 1: "MONDAY, 21 SEP 2026"
  const formattedDate = useMemo(() => {
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).toUpperCase();
  }, [now]);

  // Total herd count
  const totalHerd = goats.length > 0 ? goats.length : 1284;
  
  // Active health alerts count
  const sickCount = health.filter(
    h => h.condition && (
      h.condition.toLowerCase().includes('sick') ||
      h.condition.toLowerCase().includes('mastitis') ||
      h.condition.toLowerCase().includes('fever') ||
      h.condition.toLowerCase().includes('critical') ||
      h.condition.toLowerCase().includes('treatment')
    )
  ).length;
  const healthAlertsCount = sickCount > 0 ? sickCount : 7;

  // Active pregnant / births this month
  const activePregnant = breeding.filter(b => b.status === 'Active' || !b.status).length;
  const birthsThisMonth = activePregnant;

  // Recent operational activity items list matching Image 1
  const activities = [
    {
      id: 'act-1',
      title: 'Vaccination scheduled',
      subtitle: 'Herd B - 42 cattle',
      time: '09:14',
      dotColor: 'bg-blue-400 shadow-[0_0_8px_#60a5fa]',
      onClick: onNavigateToTasks || onNavigateToHealth,
    },
    {
      id: 'act-2',
      title: 'Feed delivery confirmed',
      subtitle: 'Paddock 3 & 4',
      time: '08:50',
      dotColor: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
      onClick: onNavigateToRecords,
    },
    {
      id: 'act-3',
      title: 'New calf registered',
      subtitle: '#ID 2847 - Angus',
      time: '07:30',
      dotColor: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
      onClick: onNavigateToRecords,
    },
    {
      id: 'act-4',
      title: 'Breeding estimate run',
      subtitle: 'Season Q4 2026',
      time: 'Yesterday',
      dotColor: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
      onClick: onNavigateToBreedingEstimator,
    },
    {
      id: 'act-5',
      title: 'Health check completed',
      subtitle: '18 cattle cleared',
      time: 'Yesterday',
      dotColor: 'bg-blue-400 shadow-[0_0_8px_#60a5fa]',
      onClick: onNavigateToHealth || onNavigateToRecords,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Row matching Image 1 */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 font-mono">
            {formattedDate}
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 dark:text-white tracking-tight mt-1">
            Good {timeOfDay}, <span className="text-emerald-500 dark:text-emerald-400">{farmName || 'Lula'}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900 dark:bg-stone-900/90 border border-stone-800 text-stone-200 text-xs font-medium shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span>All systems operational</span>
          </div>
        </div>
      </div>

      {/* 4 Stat Metric Cards Grid matching Image 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL HERD */}
        <div
          onClick={onNavigateToRecords}
          className="bg-stone-900/95 dark:bg-stone-900/95 border border-stone-800 rounded-2xl p-5 shadow-xs transition-all hover:border-stone-700 cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-stone-400 font-mono">
              TOTAL HERD
            </span>
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 shadow-2xs font-mono">
              +12
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {totalHerd.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 2: HEALTH ALERTS */}
        <div
          onClick={onNavigateToHealth || onNavigateToRecords}
          className="bg-stone-900/95 dark:bg-stone-900/95 border border-stone-800 border-t-2 border-t-rose-500 rounded-2xl p-5 shadow-xs transition-all hover:border-stone-700 cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-stone-400 font-mono">
              HEALTH ALERTS
            </span>
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-rose-950/80 text-rose-400 border border-rose-800/60 shadow-2xs font-mono">
              +2
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {healthAlertsCount}
            </span>
          </div>
        </div>

        {/* Card 3: FEED STOCK */}
        <div
          className="bg-stone-900/95 dark:bg-stone-900/95 border border-stone-800 border-t-2 border-t-amber-500 rounded-2xl p-5 shadow-xs transition-all hover:border-stone-700"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-stone-400 font-mono">
              FEED STOCK
            </span>
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-950/80 text-amber-400 border border-amber-800/60 shadow-2xs font-mono">
              -3%
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              84%
            </span>
          </div>
        </div>

        {/* Card 4: BIRTHS THIS MONTH */}
        <div
          onClick={onNavigateToBreedingEstimator}
          className="bg-stone-900/95 dark:bg-stone-900/95 border border-stone-800 border-t-2 border-t-emerald-500 rounded-2xl p-5 shadow-xs transition-all hover:border-stone-700 cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-stone-400 font-mono">
              BIRTHS THIS MONTH
            </span>
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 shadow-2xs font-mono">
              +5
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {birthsThisMonth}
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid matching Image 1: Left Recent Activity (8 cols) & Right Estimator/Alerts (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (8 cols): Recent Activity */}
        <div className="lg:col-span-8 bg-stone-900/95 dark:bg-stone-900/95 border border-stone-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-stone-800/90 pb-4 mb-4">
              <h3 className="text-base font-bold text-white">
                Recent Activity
              </h3>
              <span className="text-xs font-semibold text-stone-400 font-mono">
                Today
              </span>
            </div>

            {/* List of activity entries */}
            <div className="divide-y divide-stone-800/70">
              {activities.map(act => (
                <div
                  key={act.id}
                  onClick={act.onClick}
                  className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3 hover:bg-stone-800/40 rounded-xl px-2.5 -mx-2.5 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${act.dotColor}`} />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-stone-200 group-hover:text-emerald-400 transition-colors truncate">
                        {act.title}
                      </p>
                      <p className="text-[11px] text-stone-400 truncate mt-0.5">
                        {act.subtitle}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-stone-400 shrink-0">
                    {act.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-stone-800/90 flex items-center justify-between text-xs text-stone-400">
            <span>Real-time livestock operations log</span>
            <button
              type="button"
              onClick={onNavigateToRecords}
              className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1 transition-colors"
            >
              <span>View herd ledger</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right Column (4 cols): Breeding Estimator & Health Alerts Cards */}
        <div className="lg:col-span-4 space-y-5 flex flex-col">
          {/* Card 1: Breeding Estimator */}
          <div
            onClick={onNavigateToBreedingEstimator}
            className="bg-stone-900/95 dark:bg-stone-900/95 border border-stone-800 rounded-2xl p-5 shadow-xs hover:border-stone-700 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <Sun className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Breeding Estimator
                  </h4>
                  <p className="text-[11px] font-mono text-emerald-400">
                    Q4 2026 Season
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-stone-400 font-medium">
                  Projected births
                </span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  54
                </span>
              </div>

              {/* Cycle Progress bar */}
              <div className="space-y-1.5">
                <div className="w-full bg-stone-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full shadow-[0_0_8px_#10b981]"
                    style={{ width: '68%' }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-400">
                  <span>68% cycle complete</span>
                  <span className="text-emerald-400/90 font-mono">On schedule</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Health Alerts */}
          <div
            className="bg-stone-900/95 dark:bg-stone-900/95 border border-stone-800 rounded-2xl p-5 shadow-xs flex-1 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]" />
                <h4 className="text-sm font-bold text-white">
                  Health Alerts
                </h4>
              </div>

              <div className="mt-4">
                <div className="text-2xl font-black text-rose-300 font-mono tracking-tight">
                  7 pending
                </div>
                <p className="text-xs text-stone-400 mt-1">
                  3 urgent • 4 routine
                </p>
              </div>
            </div>

            <button
              type="button"
              id="btn-template-view-health-alerts"
              onClick={onNavigateToHealth || onNavigateToRecords}
              className="w-full mt-5 py-2.5 px-4 rounded-xl bg-rose-950/50 hover:bg-rose-900/70 active:scale-98 text-rose-200 border border-rose-900/70 text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <span>View all alerts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
