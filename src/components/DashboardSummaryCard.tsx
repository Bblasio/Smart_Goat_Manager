import React from 'react';
import {
  Users,
  Baby,
  HeartPulse,
  Milk,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { GoatRecord, BreedingRecord, HealthRecord, MilkRecord } from '../types';

interface DashboardSummaryCardProps {
  goats: GoatRecord[];
  breeding: BreedingRecord[];
  health: HealthRecord[];
  milk: MilkRecord[];
  onNavigateToRecords?: () => void;
  onNavigateToBreedingEstimator?: () => void;
  onNavigateToTasks?: () => void;
  onNavigateToHealth?: () => void;
}

export const DashboardSummaryCard: React.FC<DashboardSummaryCardProps> = ({
  goats,
  breeding,
  health,
  milk,
  onNavigateToRecords,
  onNavigateToBreedingEstimator,
  onNavigateToTasks,
  onNavigateToHealth,
}) => {
  const totalHerdCount = goats.length;
  const activeGoats = goats.filter(g => g.status === 'Active' || !g.status).length;
  const quarantineGoats = goats.filter(g => g.status === 'Quarantine').length;
  const soldGoats = goats.filter(g => g.status === 'Sold').length;
  const males = goats.filter(g => g.gender?.toLowerCase().startsWith('m')).length;
  const females = totalHerdCount - males;

  // Active pregnancies calculation
  const activePregnancies = breeding.filter(
    b => (b.status === 'Active' || !b.status) && b.expected_birth
  );
  const activePregnanciesCount = activePregnancies.length;

  const today = new Date();
  const sortedUpcomingBirths = [...activePregnancies].sort(
    (a, b) => new Date(a.expected_birth!).getTime() - new Date(b.expected_birth!).getTime()
  );
  const nextExpectedKid = sortedUpcomingBirths[0];
  const nextDeliveryDays = nextExpectedKid?.expected_birth
    ? Math.ceil((new Date(nextExpectedKid.expected_birth).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const birthsDueWithin7Days = activePregnancies.filter(b => {
    if (!b.expected_birth) return false;
    const diffDays = Math.ceil((new Date(b.expected_birth).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }).length;

  // Recent Health Alerts: Sick or quarantined or medical condition
  const sickConditions = ['sick', 'mastitis', 'fever', 'isolated', 'foot rot', 'respiratory', 'injury', 'bloat'];
  const activeHealthAlerts = health.filter(h => {
    const cond = (h.condition || '').toLowerCase();
    const treat = (h.treatment || '').toLowerCase();
    return sickConditions.some(s => cond.includes(s) || treat.includes(s));
  });

  const totalHealthAlertsCount = activeHealthAlerts.length + quarantineGoats;

  // Daily Milk Yield & Production
  const todayStr = today.toISOString().split('T')[0];
  const todayMilkYield = milk
    .filter(m => m.date === todayStr)
    .reduce((sum, m) => sum + (m.total_liters || 0), 0);

  return (
    <div
      id="dashboard-summary-card"
      className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-7 shadow-sm transition-all duration-200"
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-stone-100 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Live Herd Vitality Metrics
            </span>
          </div>
          <h3 className="text-xl font-black text-stone-900 dark:text-white mt-1">
            Executive Farm Summary
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {onNavigateToTasks && (
            <button
              type="button"
              onClick={onNavigateToTasks}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold transition-colors"
            >
              <span>View Tasks & Schedules</span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
            </button>
          )}
        </div>
      </div>

      {/* 3 Core Metric Panels + 1 Production Companion */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 pt-5">
        {/* Metric 1: Total Herd Count */}
        <div
          id="summary-total-herd-count"
          onClick={onNavigateToRecords}
          className="group relative p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Total Herd Count
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-white tracking-tight">
                {totalHerdCount}
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {activeGoats} active
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-200/60 dark:border-stone-700/60">
            <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-300 font-medium">
              <span>{females} Does • {males} Bucks</span>
              <span className="text-stone-400 group-hover:text-emerald-600 transition-colors flex items-center">
                Records <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
            {quarantineGoats > 0 && (
              <div className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                ⚠️ {quarantineGoats} in quarantine bay
              </div>
            )}
          </div>
        </div>

        {/* Metric 2: Active Pregnancies */}
        <div
          id="summary-active-pregnancies"
          onClick={onNavigateToBreedingEstimator}
          className="group relative p-5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/70 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300">
                Active Pregnancies
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                <Baby className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-purple-950 dark:text-purple-100 tracking-tight">
                {activePregnanciesCount}
              </span>
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                expectant does
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-purple-200/60 dark:border-purple-800/60">
            {nextExpectedKid ? (
              <div className="text-xs text-purple-900 dark:text-purple-200 font-medium flex items-center justify-between">
                <span className="truncate">
                  Doe {nextExpectedKid.female_id}:{' '}
                  {nextDeliveryDays !== null && nextDeliveryDays >= 0
                    ? `Due in ${nextDeliveryDays}d`
                    : 'Due now'}
                </span>
                <span className="text-purple-600 dark:text-purple-400 group-hover:underline shrink-0 ml-1">
                  Predictor →
                </span>
              </div>
            ) : (
              <div className="text-xs text-stone-500 dark:text-stone-400">
                No active gestations logged
              </div>
            )}
            {birthsDueWithin7Days > 0 && (
              <div className="mt-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                ⚡ {birthsDueWithin7Days} kidding(s) due within 7 days
              </div>
            )}
          </div>
        </div>

        {/* Metric 3: Recent Health Alerts */}
        <div
          id="summary-recent-health-alerts"
          onClick={onNavigateToTasks || onNavigateToHealth}
          className={`group relative p-5 rounded-2xl border hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${
            totalHealthAlertsCount > 0
              ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/80 hover:border-rose-400'
              : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  totalHealthAlertsCount > 0
                    ? 'text-rose-800 dark:text-rose-300'
                    : 'text-emerald-800 dark:text-emerald-300'
                }`}
              >
                Recent Health Alerts
              </span>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  totalHealthAlertsCount > 0
                    ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                    : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {totalHealthAlertsCount > 0 ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-3xl sm:text-4xl font-black tracking-tight ${
                  totalHealthAlertsCount > 0
                    ? 'text-rose-950 dark:text-rose-100'
                    : 'text-emerald-950 dark:text-emerald-100'
                }`}
              >
                {totalHealthAlertsCount}
              </span>
              <span
                className={`text-xs font-semibold ${
                  totalHealthAlertsCount > 0
                    ? 'text-rose-700 dark:text-rose-400'
                    : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {totalHealthAlertsCount > 0 ? 'active flags' : 'all healthy'}
              </span>
            </div>
          </div>

          <div
            className={`mt-4 pt-3 border-t ${
              totalHealthAlertsCount > 0
                ? 'border-rose-200/60 dark:border-rose-800/60'
                : 'border-emerald-200/60 dark:border-emerald-800/60'
            }`}
          >
            {totalHealthAlertsCount > 0 ? (
              <div className="text-xs text-rose-900 dark:text-rose-200 font-medium flex items-center justify-between">
                <span className="truncate">
                  {quarantineGoats > 0 ? `${quarantineGoats} quarantined • ` : ''}
                  {activeHealthAlerts.length > 0 ? `${activeHealthAlerts.length} medical issues` : 'Isolation active'}
                </span>
                <span className="text-rose-600 dark:text-rose-400 group-hover:underline shrink-0 ml-1">
                  Tasks →
                </span>
              </div>
            ) : (
              <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center justify-between">
                <span>100% Herd bio-security clear</span>
                <span className="text-emerald-600 dark:text-emerald-400 group-hover:underline">
                  Tasks →
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Metric 4: Daily Milk Yield & Production (Invented operational companion) */}
        <div
          id="summary-milk-yield-companion"
          className="group relative p-5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/70 hover:border-teal-400 dark:hover:border-teal-600 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                Daily Milk Yield
              </span>
              <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                <Milk className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-teal-950 dark:text-teal-100 tracking-tight font-mono">
                {todayMilkYield > 0 ? `${todayMilkYield.toFixed(1)}L` : '0.0L'}
              </span>
              <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                today
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-teal-200/60 dark:border-teal-800/60 text-xs text-teal-900 dark:text-teal-200 font-medium flex items-center justify-between">
            <span>Dairy Doe Group</span>
            <span className="text-teal-600 dark:text-teal-400 font-semibold">
              {females > 0 ? `${females} potential does` : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
