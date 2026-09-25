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
import { StatCard } from './StatCard';
import { useUnits } from '../context/UnitsContext';

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
  const { formatMilk } = useUnits();

  // Filter out sold and deceased goats from active on-farm herd metrics
  const soldOrDeadIdentifiers = new Set(
    goats
      .filter(g => g.status === 'Sold' || g.status === 'Dead')
      .flatMap(g => [g.id, g.tag_number.toUpperCase(), (g.name || '').toUpperCase()].filter(Boolean))
  );

  // Present on-farm herd (strictly excluding sold and deceased goats)
  const presentGoats = goats.filter(g => g.status !== 'Sold' && g.status !== 'Dead');
  const totalHerdCount = presentGoats.length;
  const activeGoats = presentGoats.filter(g => g.status === 'Active' || !g.status).length;
  const quarantineGoats = presentGoats.filter(g => g.status === 'Quarantine').length;
  const soldGoats = goats.filter(g => g.status === 'Sold').length;
  const males = presentGoats.filter(g => g.gender?.toLowerCase().startsWith('m')).length;
  const females = totalHerdCount - males;

  // Active pregnancies calculation (strictly excludes sold does)
  const activePregnancies = breeding.filter(b => {
    if (b.status && b.status !== 'Active') return false;
    if (!b.expected_birth) return false;
    const cleanDam = (b.female_id || '').trim().toUpperCase();
    if (soldOrDeadIdentifiers.has(cleanDam)) return false;
    return true;
  });
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

  // Recent Health Alerts: Sick or quarantined or medical condition (excluding sold goats)
  const sickConditions = ['sick', 'mastitis', 'fever', 'isolated', 'foot rot', 'respiratory', 'injury', 'bloat'];
  const activeHealthAlerts = health.filter(h => {
    const cleanGoat = (h.goat_id || '').trim().toUpperCase();
    if (soldOrDeadIdentifiers.has(cleanGoat)) return false;
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
      className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 sm:p-6 shadow-xs transition-all duration-200"
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Live Herd Vitality Metrics
            </span>
          </div>
          <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-1 tracking-tight">
            Executive Farm Summary
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {onNavigateToTasks && (
            <button
              type="button"
              onClick={onNavigateToTasks}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold transition-colors shadow-2xs"
            >
              <span>View Tasks & Schedules</span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
            </button>
          )}
        </div>
      </div>

      {/* 3 Core Metric Panels + 1 Production Companion using unified StatCard */}
      <div className="stat-grid pt-4">
        {/* Metric 1: Total Herd Count */}
        <StatCard
          id="summary-total-herd-count"
          onClick={onNavigateToRecords}
          label="Total Herd Count"
          value={totalHerdCount}
          unit={`${activeGoats} active`}
          icon={<Users className="w-4 h-4" />}
          iconBgColor="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
          footer={
            <>
              <div className="flex items-center justify-between text-stone-600 dark:text-stone-300 font-medium">
                <span>{females} Does • {males} Bucks</span>
                <span className="text-stone-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center">
                  Records <ArrowUpRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
              {quarantineGoats > 0 && (
                <div className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  ⚠️ {quarantineGoats} in quarantine bay
                </div>
              )}
            </>
          }
        />

        {/* Metric 2: Active Pregnancies */}
        <StatCard
          id="summary-active-pregnancies"
          onClick={onNavigateToBreedingEstimator}
          variant="purple"
          label="Active Pregnancies"
          value={activePregnanciesCount}
          unit="expectant does"
          icon={<Baby className="w-4 h-4" />}
          footer={
            <>
              {nextExpectedKid ? (
                <div className="text-purple-900 dark:text-purple-200 font-medium flex items-center justify-between">
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
                <div className="text-stone-500 dark:text-stone-400">
                  No active gestations logged
                </div>
              )}
              {birthsDueWithin7Days > 0 && (
                <div className="mt-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                  ⚡ {birthsDueWithin7Days} kidding(s) due within 7 days
                </div>
              )}
            </>
          }
        />

        {/* Metric 3: Recent Health Alerts */}
        <StatCard
          id="summary-recent-health-alerts"
          onClick={onNavigateToTasks || onNavigateToHealth}
          variant={totalHealthAlertsCount > 0 ? 'rose' : 'default'}
          label="Recent Health Alerts"
          value={totalHealthAlertsCount}
          unit={totalHealthAlertsCount > 0 ? 'active flags' : 'all healthy'}
          icon={totalHealthAlertsCount > 0 ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          iconBgColor={totalHealthAlertsCount > 0 ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300' : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'}
          footer={
            totalHealthAlertsCount > 0 ? (
              <div className="text-rose-900 dark:text-rose-200 font-medium flex items-center justify-between">
                <span className="truncate">
                  {quarantineGoats > 0 ? `${quarantineGoats} quarantined • ` : ''}
                  {activeHealthAlerts.length > 0 ? `${activeHealthAlerts.length} medical issues` : 'Isolation active'}
                </span>
                <span className="text-rose-600 dark:text-rose-400 group-hover:underline shrink-0 ml-1">
                  Tasks →
                </span>
              </div>
            ) : (
              <div className="text-emerald-800 dark:text-emerald-300 font-medium flex items-center justify-between">
                <span>100% Herd bio-security clear</span>
                <span className="text-emerald-600 dark:text-emerald-400 group-hover:underline">
                  Tasks →
                </span>
              </div>
            )
          }
        />

        {/* Metric 4: Daily Milk Yield & Production */}
        <StatCard
          id="summary-milk-yield-companion"
          variant="blue"
          label="Daily Milk Yield"
          value={formatMilk(todayMilkYield)}
          unit="today"
          icon={<Milk className="w-4 h-4" />}
          footer={
            <div className="text-sky-900 dark:text-sky-200 font-medium flex items-center justify-between">
              <span>Dairy Doe Group</span>
              <span className="text-sky-600 dark:text-sky-400 font-semibold">
                {females > 0 ? `${females} potential does` : '—'}
              </span>
            </div>
          }
        />
      </div>
    </div>
  );
};
