import React, { useMemo, useState } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  Users,
  Baby,
  Activity,
  AlertTriangle,
  HeartPulse,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Sparkles,
  ChevronRight,
  Milk,
  Stethoscope,
  ArrowUpRight,
  FileSpreadsheet,
  Bell,
  Pin,
  SlidersHorizontal,
  LayoutGrid
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { DashboardSummaryCard } from '../components/DashboardSummaryCard';
import { WeightTrendsChart } from '../components/WeightTrendsChart';
import { RecentActivities } from '../components/RecentActivities';
import { LocalFarmWeatherWidget } from '../components/LocalFarmWeatherWidget';
import { RecentSalesFeed } from '../components/RecentSalesFeed';
import { FeedSupplyAlertWidget } from '../components/FeedSupplyAlertWidget';
import { QuarantineMonitorWidget } from '../components/QuarantineMonitorWidget';
import { KidNurseryWidget } from '../components/KidNurseryWidget';
import { FinancialCashFlowWidget } from '../components/FinancialCashFlowWidget';
import { DailyNotificationBanner } from '../components/DailyNotificationBanner';
import {
  DashboardCustomizerModal,
  DashboardWidgetId,
  DEFAULT_PINNED_WIDGETS,
  ALL_DASHBOARD_WIDGETS
} from '../components/DashboardCustomizerModal';
import { formatActiveDuration } from '../utils/dateHelper';
import { getFarmNotifications } from '../utils/notificationHelper';

interface DashboardViewProps {
  onNavigateToRecords: () => void;
  onNavigateToReports: () => void;
  onNavigateToBreedingEstimator: () => void;
  onOpenAddModal?: () => void;
  onNavigateToHealth?: () => void;
  onNavigateToTasks?: () => void;
  onNavigateToFeedSupply?: () => void;
  onNavigateToProfile?: () => void;
  onOpenAddHealthModal?: () => void;
  onOpenAddSaleModal?: () => void;
  onOpenAddExpenseModal?: () => void;
  onOpenNotificationModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToRecords,
  onNavigateToReports,
  onNavigateToBreedingEstimator,
  onOpenAddModal,
  onNavigateToHealth,
  onNavigateToTasks,
  onNavigateToFeedSupply,
  onNavigateToProfile,
  onOpenAddHealthModal,
  onOpenAddSaleModal,
  onOpenAddExpenseModal,
  onOpenNotificationModal,
}) => {
  const {
    farmName,
    daysActive,
    goats,
    breeding,
    health,
    workers,
    sales,
    milk,
    firebaseUser,
    user,
  } = useFarm();

  // Farm Profile Completion Checklist
  const profileFields = [
    { key: 'farm_name', label: 'Farm Name', filled: Boolean(user?.farm_name?.trim() || farmName) },
    { key: 'owner_name', label: 'Owner / Manager', filled: Boolean(user?.owner_name?.trim() || user?.manager_name?.trim()) },
    { key: 'location', label: 'Location / County', filled: Boolean(user?.location?.trim()) },
    { key: 'phone', label: 'Contact Phone', filled: Boolean(user?.phone?.trim()) },
    { key: 'primary_breed', label: 'Primary Breed', filled: Boolean(user?.primary_breed?.trim()) },
    { key: 'farm_size', label: 'Farm Size / Scale', filled: Boolean(user?.farm_size?.trim() || user?.size?.trim()) },
  ];
  const filledCount = profileFields.filter(f => f.filled).length;
  const isProfileIncomplete = filledCount < profileFields.length;
  const completionPercentage = Math.round((filledCount / profileFields.length) * 100);
  const missingFields = profileFields.filter(f => !f.filled);

  // Exclude sold and deceased goats from active on-farm herd metrics
  const soldOrDeadIdentifiers = useMemo(() => {
    return new Set(
      goats
        .filter(g => g.status === 'Sold' || g.status === 'Dead')
        .flatMap(g => [g.id, g.tag_number.toUpperCase(), (g.name || '').toUpperCase()].filter(Boolean))
    );
  }, [goats]);

  const presentGoats = useMemo(() => {
    return goats.filter(g => g.status !== 'Sold' && g.status !== 'Dead');
  }, [goats]);

  const totalGoats = presentGoats.length;
  const males = presentGoats.filter(g => g.gender.toLowerCase().startsWith('m')).length;
  const females = totalGoats - males;
  const pregnantCount = breeding.filter(b => {
    if (b.status && b.status !== 'Active') return false;
    const cleanDam = (b.female_id || '').trim().toUpperCase();
    if (soldOrDeadIdentifiers.has(cleanDam)) return false;
    return true;
  }).length;
  const totalWorkers = workers.length;

  // Farm Alerts & Dates (strictly excluding sold goats)
  const today = new Date();
  const birthsDueSoon = breeding.filter(b => {
    if (!b.expected_birth) return false;
    if (b.status && b.status !== 'Active') return false;
    const cleanDam = (b.female_id || '').trim().toUpperCase();
    if (soldOrDeadIdentifiers.has(cleanDam)) return false;
    const exp = new Date(b.expected_birth);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  // Next expected kidding (strictly excluding sold does)
  const sortedUpcomingBirths = [...breeding]
    .filter(b => {
      if (!b.expected_birth) return false;
      if (b.status && b.status !== 'Active') return false;
      const cleanDam = (b.female_id || '').trim().toUpperCase();
      return !soldOrDeadIdentifiers.has(cleanDam);
    })
    .sort((a, b) => new Date(a.expected_birth).getTime() - new Date(b.expected_birth).getTime());
  const nextDelivery = sortedUpcomingBirths[0];
  const nextDeliveryDays = nextDelivery
    ? Math.ceil((new Date(nextDelivery.expected_birth).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const sickGoats = health.filter(
    h => {
      if (!h.condition) return false;
      const cleanGoat = (h.goat_id || '').trim().toUpperCase();
      if (soldOrDeadIdentifiers.has(cleanGoat)) return false;
      return (
        h.condition.toLowerCase().includes('sick') ||
        h.condition.toLowerCase().includes('mastitis') ||
        h.condition.toLowerCase().includes('fever') ||
        h.condition.toLowerCase().includes('isolated') ||
        h.condition.toLowerCase().includes('foot rot')
      );
    }
  );

  // Today's milk production
  const todayStr = today.toISOString().split('T')[0];
  const todayMilk = milk
    .filter(m => m.date === todayStr)
    .reduce((sum, m) => sum + (m.total_liters || 0), 0);

  // Gender Chart Data (reflecting only active, unsold herd)
  const genderData = [
    { name: 'Female Goats', value: females, color: '#10b981' },
    { name: 'Male Goats', value: males, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  // Breeding Activity Trend by Month
  const monthCounts: Record<string, number> = {};
  breeding.forEach(b => {
    const dStr = b.mating_date;
    if (!dStr) return;
    try {
      const date = new Date(dStr);
      const monthStr = date.toLocaleString('default', { month: 'short' });
      monthCounts[monthStr] = (monthCounts[monthStr] || 0) + 1;
    } catch {
      // ignore
    }
  });

  const breedingTrendData = Object.entries(monthCounts).map(([month, count]) => ({
    month,
    Matings: count,
  }));

  const notifications = useMemo(() => getFarmNotifications(goats, breeding, health), [goats, breeding, health]);

  // Customizable Dashboard Pinned Widgets State (Graphs & Activity Summaries)
  const [pinnedWidgetIds, setPinnedWidgetIds] = useState<DashboardWidgetId[]>(() => {
    try {
      const saved = localStorage.getItem('smartgoat_pinned_widgets_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_PINNED_WIDGETS;
  });

  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  const handleSavePinnedWidgets = (newIds: DashboardWidgetId[]) => {
    setPinnedWidgetIds(newIds);
    try {
      localStorage.setItem('smartgoat_pinned_widgets_v2', JSON.stringify(newIds));
    } catch {
      // ignore
    }
  };

  const handleTogglePin = (id: DashboardWidgetId) => {
    const next = pinnedWidgetIds.includes(id)
      ? pinnedWidgetIds.filter(item => item !== id)
      : [...pinnedWidgetIds, id];
    handleSavePinnedWidgets(next);
  };

  const renderDemographicsCard = () => (
    <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs transition-colors flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Herd Demographics</span>
          </h4>
          <p className="text-xs text-stone-500 dark:text-stone-400">Gender ratio for reproduction management</p>
        </div>
        {!pinnedWidgetIds.includes('demographics') && (
          <button
            type="button"
            onClick={() => handleTogglePin('demographics')}
            className="text-[11px] text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold px-2 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1"
            title="Pin to top"
          >
            <Pin className="w-3 h-3" />
            <span>Pin</span>
          </button>
        )}
      </div>

      <div className="h-60 w-full flex items-center justify-center">
        {genderData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1c1917',
                  color: '#fff',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-xs text-stone-400 dark:text-stone-500">No goats recorded yet.</div>
        )}
      </div>

      <div className="pt-3 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400 flex justify-between">
        <span>Females: {females} ({totalGoats > 0 ? Math.round((females / totalGoats) * 100) : 0}%)</span>
        <span>Males: {males} ({totalGoats > 0 ? Math.round((males / totalGoats) * 100) : 0}%)</span>
      </div>
    </div>
  );

  const renderBreedingActivityCard = () => (
    <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Monthly Breeding Activity</span>
          </h4>
          <p className="text-xs text-stone-500 dark:text-stone-400">Number of logged services / matings</p>
        </div>
        {!pinnedWidgetIds.includes('breeding_trends') && (
          <button
            type="button"
            onClick={() => handleTogglePin('breeding_trends')}
            className="text-[11px] text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold px-2 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1"
            title="Pin to top"
          >
            <Pin className="w-3 h-3" />
            <span>Pin</span>
          </button>
        )}
      </div>

      <div className="h-60 w-full">
        {breedingTrendData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={breedingTrendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-stone-100 dark:text-stone-800" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1c1917',
                  color: '#fff',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="Matings" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-stone-400 dark:text-stone-500">
            No monthly breeding history available.
          </div>
        )}
      </div>
    </div>
  );

  const renderWidgetContent = (id: DashboardWidgetId) => {
    switch (id) {
      case 'weight_trends':
        return <WeightTrendsChart goats={goats} healthRecords={health} />;
      case 'recent_activity':
        return (
          <RecentActivities
            onNavigateToRecords={onNavigateToRecords}
            onNavigateToHealth={onNavigateToHealth}
            onNavigateToBreeding={onNavigateToBreedingEstimator}
          />
        );
      case 'cash_flow':
        return (
          <FinancialCashFlowWidget
            onNavigateToReports={onNavigateToReports}
            onNavigateToRecords={onNavigateToRecords}
            onOpenAddSaleModal={onOpenAddSaleModal}
            onOpenAddExpenseModal={onOpenAddExpenseModal}
          />
        );
      case 'recent_sales':
        return (
          <RecentSalesFeed
            sales={sales}
            goats={goats}
            onNavigateToRecords={onNavigateToRecords}
            onOpenAddSale={onOpenAddSaleModal}
          />
        );
      case 'demographics':
        return renderDemographicsCard();
      case 'breeding_trends':
        return renderBreedingActivityCard();
      case 'kid_nursery':
        return (
          <KidNurseryWidget
            onNavigateToRecords={onNavigateToRecords}
            onNavigateToBreeding={onNavigateToBreedingEstimator}
          />
        );
      case 'feed_alerts':
        return (
          <FeedSupplyAlertWidget
            onNavigateToFeedSupply={onNavigateToFeedSupply || onNavigateToRecords}
          />
        );
      case 'quarantine_monitor':
        return (
          <QuarantineMonitorWidget
            onNavigateToTasks={onNavigateToTasks}
            onNavigateToHealth={onNavigateToHealth}
            onNavigateToRecords={onNavigateToRecords}
          />
        );
      case 'weather_advisory':
        return (
          <LocalFarmWeatherWidget
            customLocation={user?.location || farmName || undefined}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Scheduled For Today Notification Banner (Alerts upcoming breeding & vaccination reminders) */}
      <DailyNotificationBanner
        todayNotifications={notifications.todayNotifications}
        onOpenModal={() => onOpenNotificationModal?.()}
      />

      {/* Header and Summary Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-emerald-500/60 shadow-md shrink-0 bg-stone-100 dark:bg-stone-800 ring-2 ring-emerald-500/20">
            <img
              src="/images/nav/dashboard.jpg"
              alt="Farm Operations Dashboard"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white tracking-tight">
              Good {(() => {
                const h = new Date().getHours();
                return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
              })()}, <span className="text-emerald-600 dark:text-emerald-400">{farmName || 'Farm'}</span>
            </h2>
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-0.5">
              Overview of your herd's performance, breeding pipeline, and daily operations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            id="btn-customize-dashboard"
            onClick={() => setIsCustomizerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-700 shadow-2xs transition-colors"
            title="Pin, unpin, and reorder dashboard widgets"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            <span>Customize</span>
          </button>

          {onOpenAddModal && (
            <button
              id="btn-dashboard-add-goat"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              <span>Add Record</span>
            </button>
          )}
        </div>
      </div>

      <DashboardSummaryCard
        goats={goats}
        breeding={breeding}
        health={health}
        milk={milk}
        onNavigateToRecords={onNavigateToRecords}
        onNavigateToBreedingEstimator={onNavigateToBreedingEstimator}
        onNavigateToTasks={onNavigateToTasks}
        onNavigateToHealth={onNavigateToHealth}
      />

      {/* Secondary Alerts & Profile Prompt if needed */}
      <div>
        {/* Farmer Profile Completion Notification for Newly Created / Incomplete Accounts */}
        {isProfileIncomplete && (
          <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-amber-950/40 border border-amber-300 dark:border-amber-800/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-amber-500 text-white shadow-2xs">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-black tracking-wide uppercase text-amber-900 dark:text-amber-200">
                    Action Required: Complete Farm Profile ({filledCount}/{profileFields.length} Completed • {completionPercentage}%)
                  </span>
                </div>
                <h3 className="text-base font-bold text-stone-900 dark:text-white">
                  Finish setting up your farm details to unlock full reports & certificates
                </h3>
                <p className="text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                  Your account is created, but key farm profile details ({missingFields.map(f => f.label).join(', ')}) are not filled yet. Complete your profile to ensure official pedigree export sheets, veterinary receipts, and sales contracts show verified farm contact information.
                </p>
                <div className="w-full sm:w-72 bg-amber-200 dark:bg-amber-900/60 rounded-full h-2 overflow-hidden mt-2">
                  <div
                    className="bg-amber-600 dark:bg-amber-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
              {onNavigateToProfile && (
                <button
                  type="button"
                  id="btn-dashboard-complete-profile"
                  onClick={onNavigateToProfile}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-1.5"
                >
                  <span>Complete Farm Profile</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Empty Herd State for New Accounts */}
        {totalGoats === 0 && (
          <div className="mt-6 p-6 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 mb-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Farm Records Ready
                </div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                  Welcome to Your Farm Management System!
                </h3>
                <p className="text-stone-600 dark:text-stone-300 text-xs mt-1 max-w-xl leading-relaxed">
                  Your farm records are ready. You can inspect your herd records or import existing spreadsheet records (Excel/CSV) into your real-time database.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  id="btn-empty-import-excel"
                  onClick={onNavigateToRecords}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                  <span>Go to Herd Records</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Urgent herd alerts if any */}
        {(birthsDueSoon.length > 0 || sickGoats.length > 0) && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            {birthsDueSoon.length > 0 && (
              <div
                id="alert-births-due"
                className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-sm cursor-pointer hover:bg-amber-100/80 dark:hover:bg-amber-900/50 transition-colors"
                onClick={onNavigateToBreedingEstimator}
              >
                <div className="flex-1 min-w-0">
                  <span className="font-bold">
                    {birthsDueSoon.length} kidding(s) expected within 7 days!
                  </span>
                  <p className="text-xs text-amber-700 dark:text-amber-300/80">
                    Prepare maternity stalls for {birthsDueSoon.map(b => b.female_id).join(', ')}. Click to estimate delivery times.
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
              </div>
            )}

            {sickGoats.length > 0 && (
              <div
                id="alert-sick-goats"
                className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/70 flex items-center justify-center shrink-0">
                  <HeartPulse className="w-4 h-4 text-rose-700 dark:text-rose-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold">
                    ⚠️ {sickGoats.length} goat(s) flagged with active medical conditions
                  </span>
                  <p className="text-xs text-rose-700 dark:text-rose-300/80">
                    {sickGoats.map(g => `${g.goat_id} (${g.condition})`).join('; ')}. Check isolation protocol.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Customizable Pinned Widgets Section: Allows users to pin specific graphs or recent activity summaries to see first */}
      <div id="dashboard-customizable-widget-section" className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-bold shrink-0 shadow-2xs">
              <Pin className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900 dark:text-white">
                  Pinned Highlights
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {pinnedWidgetIds.length} Pinned First
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Your prioritized graphs & recent activity summaries displayed first
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              id="btn-customize-dashboard-widgets"
              onClick={() => setIsCustomizerOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-black dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-bold shadow-xs transition-colors w-full sm:w-auto"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Customize Widgets</span>
            </button>
          </div>
        </div>

        {/* Pinned Widgets List */}
        {pinnedWidgetIds.length > 0 ? (
          <div className="space-y-6">
            {pinnedWidgetIds.map((widgetId, idx) => {
              const widgetMeta = ALL_DASHBOARD_WIDGETS.find(w => w.id === widgetId);
              return (
                <div key={`pinned-${widgetId}`} className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <Pin className="w-2.5 h-2.5 fill-current" />
                        <span>Pinned #{idx + 1}</span>
                      </span>
                      <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                        {widgetMeta?.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePin(widgetId)}
                      className="text-[11px] text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium px-2 py-0.5 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      title="Unpin widget from top section"
                    >
                      Unpin
                    </button>
                  </div>
                  {renderWidgetContent(widgetId)}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white dark:bg-stone-900 border border-dashed border-stone-300 dark:border-stone-700 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
              <Pin className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200">No widgets pinned to top</h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-md mx-auto">
                Customize your dashboard by pinning weight graphs, financial cash flow, or recent activity feeds to see them right here first.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCustomizerOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Choose Widgets to Pin</span>
            </button>
          </div>
        )}
      </div>

      {/* Local Farm Weather & Micro-Climate Advisory Widget (Live Forecast) */}
      {!pinnedWidgetIds.includes('weather_advisory') && (
        <LocalFarmWeatherWidget
          customLocation={user?.location || farmName || undefined}
        />
      )}

      {/* Feed & Veterinary Supply Status & Low-Stock Alerts */}
      {!pinnedWidgetIds.includes('feed_alerts') && (
        <FeedSupplyAlertWidget
          onNavigateToFeedSupply={onNavigateToFeedSupply || onNavigateToRecords}
        />
      )}

      {/* Feature 1: Biosecurity & Active Quarantine Monitor */}
      {!pinnedWidgetIds.includes('quarantine_monitor') && (
        <QuarantineMonitorWidget
          onNavigateToTasks={onNavigateToTasks}
          onNavigateToHealth={onNavigateToHealth}
          onNavigateToRecords={onNavigateToRecords}
        />
      )}

      {/* Featured Banner: Breeding & Kidding Predictor Widget */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-stone-900 rounded-2xl p-6 text-white shadow-xs relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Caprine Gestation Tracker</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
            Breeding & Kidding Date Predictor
          </h3>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            Input mating dates or veterinarian ultrasound gestation age to forecast delivery windows (±3 days),
            clinical trimester care milestones, and CD/T booster vaccine dates.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
          {nextDelivery && (
            <div className="p-3.5 bg-white/10 rounded-xl backdrop-blur-xs border border-white/10 text-left">
              <div className="text-[11px] text-emerald-200 uppercase font-semibold">
                Next Expected Kid ({nextDelivery.female_id})
              </div>
              <div className="text-lg font-mono font-bold text-white mt-0.5">
                {nextDeliveryDays !== null && nextDeliveryDays >= 0
                  ? `In ${nextDeliveryDays} days (${nextDelivery.expected_birth})`
                  : `Overdue: ${nextDelivery.expected_birth}`}
              </div>
            </div>
          )}

          <button
            type="button"
            id="btn-banner-estimator"
            onClick={onNavigateToBreedingEstimator}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-emerald-900 font-bold text-sm hover:bg-stone-100 transition-colors shadow-sm"
          >
            <span>Launch Predictor</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-700" />
          </button>
        </div>
      </div>

      {/* Daily Farm Operations & Bio-Security Protocol (Companion module) */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-base font-bold text-stone-900 dark:text-white">
                Daily Herd Operations & Bio-Security Protocol
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Morning & evening livestock management standards
              </p>
            </div>
          </div>
          {onNavigateToTasks && (
            <button
              type="button"
              onClick={onNavigateToTasks}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-semibold transition-colors"
            >
              <span>Go to Tasks Hub</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              <span>🌾 Rumen Nutrition</span>
              <span className="text-emerald-600 dark:text-emerald-400">Optimal</span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
              Legume hay + dry roughage for rumen flora. Salt lick blocks accessible.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              <span>💧 Fresh Water Supply</span>
              <span className="text-teal-600 dark:text-teal-400">Inspected</span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
              Troughs scrubbed & refilled. Clean water stimulates higher daily lactation.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              <span>🛡️ Biosecurity Protocol</span>
              <span className="text-emerald-600 dark:text-emerald-400">Active</span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
              Footbaths at barn entryways. Isolation pens ready for new stock quarantine.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              <span>🍼 Colostrum Bank</span>
              <span className="text-purple-600 dark:text-purple-400">Prepared</span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
              Frozen quality colostrum available for newborn kids within first 2-4 hours.
            </p>
          </div>
        </div>
      </div>

      {/* Farm Overview Metrics */}
      <div>
        <h3 className="text-base font-bold text-stone-900 dark:text-white mb-4 flex items-center gap-2">
          <span>🧮 Farm Overview</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Total Goats */}
          <div
            id="metric-total-goats"
            onClick={onNavigateToRecords}
            className="cursor-pointer bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all shadow-xs"
          >
            <div className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">
              Total Goats
            </div>
            <div className="text-3xl font-extrabold text-stone-900 dark:text-white">{totalGoats}</div>
            <div className="text-xs text-stone-400 dark:text-stone-500 mt-2 flex items-center gap-1">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">● In active herd</span>
            </div>
          </div>

          {/* Male Goats */}
          <div
            id="metric-male-goats"
            className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs"
          >
            <div className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">
              Male Goats
            </div>
            <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{males}</div>
            <div className="text-xs text-stone-400 dark:text-stone-500 mt-2">
              {totalGoats > 0 ? `${Math.round((males / totalGoats) * 100)}% of herd` : '0%'}
            </div>
          </div>

          {/* Female Goats */}
          <div
            id="metric-female-goats"
            className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs"
          >
            <div className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">
              Female Goats
            </div>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{females}</div>
            <div className="text-xs text-stone-400 dark:text-stone-500 mt-2">
              {totalGoats > 0 ? `${Math.round((females / totalGoats) * 100)}% of herd` : '0%'}
            </div>
          </div>

          {/* Active Gestation */}
          <div
            id="metric-pregnant-goats"
            onClick={onNavigateToBreedingEstimator}
            className="cursor-pointer bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all shadow-xs"
          >
            <div className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">
              Expectant Does
            </div>
            <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">{pregnantCount}</div>
            <div className="text-xs text-stone-400 dark:text-stone-500 mt-2 flex items-center gap-1">
              <span className="text-purple-600 dark:text-purple-400 font-medium">● Gestation active</span>
            </div>
          </div>

          {/* Daily Milk */}
          <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">
              Milk Yield
            </div>
            <div className="text-3xl font-extrabold text-teal-600 dark:text-teal-400 font-mono">
              {todayMilk > 0 ? `${todayMilk.toFixed(1)}L` : '0.0L'}
            </div>
            <div className="text-xs text-stone-400 dark:text-stone-500 mt-2 flex items-center gap-1">
              <Milk className="w-3 h-3 text-teal-500" />
              <span>Daily production</span>
            </div>
          </div>

          {/* Farm Staff */}
          <div
            id="metric-farm-workers"
            className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs"
          >
            <div className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">
              Farm Staff
            </div>
            <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{totalWorkers}</div>
            <div className="text-xs text-stone-400 dark:text-stone-500 mt-2 flex items-center gap-1">
              <Users className="w-3 h-3 text-amber-500" />
              <span>Personnel</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature 2: Kid Nursery & Average Daily Gain (ADG) Benchmark */}
      {!pinnedWidgetIds.includes('kid_nursery') && (
        <KidNurseryWidget
          onNavigateToRecords={onNavigateToRecords}
          onNavigateToBreeding={onNavigateToBreedingEstimator}
        />
      )}

      {/* Primary Analytical Row: 6-Month Weight Trends Chart */}
      {!pinnedWidgetIds.includes('weight_trends') && (
        <WeightTrendsChart goats={goats} healthRecords={health} />
      )}

      {/* Feature 4: Financial Summary & Cash Flow Sparkline */}
      {!pinnedWidgetIds.includes('cash_flow') && (
        <FinancialCashFlowWidget
          onNavigateToReports={onNavigateToReports}
          onNavigateToRecords={onNavigateToRecords}
          onOpenAddSaleModal={onOpenAddSaleModal}
          onOpenAddExpenseModal={onOpenAddExpenseModal}
        />
      )}

      {/* Recent Sales Activity Feed: Last 5 Transactions & Quick Financial Insights */}
      {!pinnedWidgetIds.includes('recent_sales') && (
        <RecentSalesFeed
          sales={sales}
          goats={goats}
          onNavigateToRecords={onNavigateToRecords}
          onOpenAddSale={onOpenAddSaleModal}
        />
      )}

      {/* Secondary Dashboard Grid: Recent Activities & Herd Demographics */}
      {(!pinnedWidgetIds.includes('recent_activity') || !pinnedWidgetIds.includes('demographics')) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {!pinnedWidgetIds.includes('recent_activity') && (
            <div className={!pinnedWidgetIds.includes('demographics') ? 'lg:col-span-7' : 'lg:col-span-12'}>
              <RecentActivities
                onNavigateToRecords={onNavigateToRecords}
                onNavigateToHealth={onNavigateToHealth}
                onNavigateToBreeding={onNavigateToBreedingEstimator}
              />
            </div>
          )}

          {!pinnedWidgetIds.includes('demographics') && (
            <div className={!pinnedWidgetIds.includes('recent_activity') ? 'lg:col-span-5' : 'lg:col-span-12'}>
              {renderDemographicsCard()}
            </div>
          )}
        </div>
      )}

      {/* Monthly Breeding Activity Bar Chart */}
      {!pinnedWidgetIds.includes('breeding_trends') && renderBreedingActivityCard()}

      {/* Dashboard Customizer Modal for Pinning & Ordering Preferred Widgets */}
      <DashboardCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        pinnedWidgetIds={pinnedWidgetIds}
        onSavePinnedWidgets={handleSavePinnedWidgets}
      />
    </div>
  );
};
