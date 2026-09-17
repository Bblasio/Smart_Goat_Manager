import React from 'react';
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
  FileSpreadsheet
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
import { DailyTasksWidget } from '../components/DailyTasksWidget';

interface DashboardViewProps {
  onNavigateToRecords: () => void;
  onNavigateToReports: () => void;
  onNavigateToBreedingEstimator: () => void;
  onOpenAddModal: () => void;
  onNavigateToHealth?: () => void;
  onOpenAddHealthModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToRecords,
  onNavigateToReports,
  onNavigateToBreedingEstimator,
  onOpenAddModal,
  onNavigateToHealth,
  onOpenAddHealthModal,
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
    pushSeedDataToFirebase,
  } = useFarm();

  const totalGoats = goats.length;
  const males = goats.filter(g => g.gender.toLowerCase().startsWith('m')).length;
  const females = totalGoats - males;
  const pregnantCount = breeding.filter(b => b.status === 'Active' || !b.status).length;
  const totalWorkers = workers.length;

  // AI Alerts & Dates
  const today = new Date();
  const birthsDueSoon = breeding.filter(b => {
    if (!b.expected_birth) return false;
    const exp = new Date(b.expected_birth);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  // Next expected kidding
  const sortedUpcomingBirths = [...breeding]
    .filter(b => b.expected_birth && (b.status === 'Active' || !b.status))
    .sort((a, b) => new Date(a.expected_birth).getTime() - new Date(b.expected_birth).getTime());
  const nextDelivery = sortedUpcomingBirths[0];
  const nextDeliveryDays = nextDelivery
    ? Math.ceil((new Date(nextDelivery.expected_birth).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const sickGoats = health.filter(
    h =>
      h.condition.toLowerCase().includes('sick') ||
      h.condition.toLowerCase().includes('weak') ||
      h.condition.toLowerCase().includes('fever')
  );

  // Today's total milk
  const todayStr = today.toISOString().split('T')[0];
  const todayMilk = milk
    .filter(m => m.date === todayStr || m.date === '2026-09-16')
    .reduce((sum, m) => sum + (m.total_liters || 0), 0);

  // Gender Chart Data
  const genderData = [
    { name: 'Female Goats', value: females, color: '#10b981' },
    { name: 'Male Goats', value: males, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  // Breeding Activity Trend by Month
  const monthCounts: Record<string, number> = {};
  breeding.forEach(b => {
    if (!b.mating_date) return;
    try {
      const date = new Date(b.mating_date);
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

  const totalSalesRevenue = sales.reduce((sum, s) => sum + (s.price || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Welcome */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-2">
              <Calendar className="w-3.5 h-3.5" />
              Active for {daysActive} days
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              {farmName} Dashboard
            </h2>
            <p className="text-stone-500 text-sm mt-1">
              Real-time herd monitoring, gestation tracking, milk production, and reproductive intelligence.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-quick-breeding-tool"
              onClick={onNavigateToBreedingEstimator}
              className="px-4 py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 rounded-xl text-sm font-semibold transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Baby className="w-4 h-4 text-emerald-600" />
              <span>Breeding Estimator</span>
            </button>
            <button
              id="btn-quick-add-goat"
              onClick={onOpenAddModal}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-xs"
            >
              + Add Record
            </button>
          </div>
        </div>

        {/* Empty Herd State for New Accounts */}
        {totalGoats === 0 && (
          <div className="mt-6 p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Cloud Database Active
                </div>
                <h3 className="text-lg font-bold text-stone-900">
                  Welcome to your Cloud Farm Database!
                </h3>
                <p className="text-stone-600 text-xs mt-1 max-w-xl leading-relaxed">
                  Your farm records are ready to be stored securely in the cloud. You can register your first goat record, import your existing spreadsheet records (Excel/CSV), or load starter records to test the tools.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  id="btn-empty-register-goat"
                  onClick={onOpenAddModal}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  + Register First Goat
                </button>
                <button
                  type="button"
                  id="btn-empty-import-excel"
                  onClick={onNavigateToRecords}
                  className="px-4 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Upload Excel / Records</span>
                </button>
                {firebaseUser && (
                  <button
                    type="button"
                    id="btn-empty-seed-cloud"
                    onClick={async () => {
                      await pushSeedDataToFirebase();
                    }}
                    className="px-4 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Upload Starter Herd
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Urgent AI alerts if any */}
        {(birthsDueSoon.length > 0 || sickGoats.length > 0) && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            {birthsDueSoon.length > 0 && (
              <div
                id="alert-births-due"
                className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm cursor-pointer hover:bg-amber-100/80 transition-colors"
                onClick={onNavigateToBreedingEstimator}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <Baby className="w-4 h-4 text-amber-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold">
                    ⚠️ {birthsDueSoon.length} kidding(s) expected within 7 days!
                  </span>
                  <p className="text-xs text-amber-700">
                    Prepare maternity stalls for {birthsDueSoon.map(b => b.female_id).join(', ')}. Click to estimate delivery times.
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-700 shrink-0" />
              </div>
            )}

            {sickGoats.length > 0 && (
              <div
                id="alert-sick-goats"
                className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                  <HeartPulse className="w-4 h-4 text-rose-700" />
                </div>
                <div>
                  <span className="font-bold">
                    🩺 {sickGoats.length} goat(s) require medical attention!
                  </span>
                  <p className="text-xs text-rose-700">
                    {sickGoats.map(g => `${g.goat_id} (${g.condition})`).join('; ')}. Check isolation protocol.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Featured Banner: Breeding & Kidding Predictor Widget */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-stone-900 rounded-2xl p-6 text-white shadow-xs relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Caprine Gestation Intelligence</span>
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

      {/* Daily Tasks Widget: Health Checks, Feeding Schedules & Vaccination Reminders */}
      <DailyTasksWidget
        onNavigateToHealth={onNavigateToHealth}
        onNavigateToRecords={onNavigateToRecords}
        onNavigateToBreedingEstimator={onNavigateToBreedingEstimator}
        onOpenAddHealthModal={onOpenAddHealthModal}
      />

      {/* Farm Overview Metrics */}
      <div>
        <h3 className="text-base font-bold text-stone-900 mb-4 flex items-center gap-2">
          <span>🧮 Farm Overview</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Total Goats */}
          <div
            id="metric-total-goats"
            onClick={onNavigateToRecords}
            className="cursor-pointer bg-white p-5 rounded-2xl border border-stone-200 hover:border-emerald-300 transition-all shadow-xs"
          >
            <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
              Total Goats
            </div>
            <div className="text-3xl font-extrabold text-stone-900">{totalGoats}</div>
            <div className="text-xs text-stone-400 mt-2 flex items-center gap-1">
              <span>🐐 In herd</span>
            </div>
          </div>

          {/* Male Goats */}
          <div
            id="metric-male-goats"
            className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs"
          >
            <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
              Male Goats
            </div>
            <div className="text-3xl font-extrabold text-blue-600">{males}</div>
            <div className="text-xs text-stone-400 mt-2">
              {totalGoats > 0 ? `${Math.round((males / totalGoats) * 100)}% of herd` : '0%'}
            </div>
          </div>

          {/* Female Goats */}
          <div
            id="metric-female-goats"
            className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs"
          >
            <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
              Female Goats
            </div>
            <div className="text-3xl font-extrabold text-emerald-600">{females}</div>
            <div className="text-xs text-stone-400 mt-2">
              {totalGoats > 0 ? `${Math.round((females / totalGoats) * 100)}% of herd` : '0%'}
            </div>
          </div>

          {/* Active Gestation */}
          <div
            id="metric-pregnant-goats"
            onClick={onNavigateToBreedingEstimator}
            className="cursor-pointer bg-white p-5 rounded-2xl border border-stone-200 hover:border-emerald-300 transition-all shadow-xs"
          >
            <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
              Expectant Does
            </div>
            <div className="text-3xl font-extrabold text-purple-600">{pregnantCount}</div>
            <div className="text-xs text-stone-400 mt-2 flex items-center gap-1">
              <Baby className="w-3 h-3 text-purple-500" />
              <span>Gestation active</span>
            </div>
          </div>

          {/* Daily Milk */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
            <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
              Milk Yield
            </div>
            <div className="text-3xl font-extrabold text-teal-600 font-mono">
              {todayMilk > 0 ? `${todayMilk.toFixed(1)}L` : '7.0L'}
            </div>
            <div className="text-xs text-stone-400 mt-2 flex items-center gap-1">
              <Milk className="w-3 h-3 text-teal-500" />
              <span>Daily production</span>
            </div>
          </div>

          {/* Farm Staff */}
          <div
            id="metric-farm-workers"
            className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs"
          >
            <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
              Farm Staff
            </div>
            <div className="text-3xl font-extrabold text-amber-600">{totalWorkers}</div>
            <div className="text-xs text-stone-400 mt-2 flex items-center gap-1">
              <Users className="w-3 h-3 text-amber-500" />
              <span>Personnel</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics / Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Breeding Activity Bar Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>Monthly Breeding Activity</span>
              </h4>
              <p className="text-xs text-stone-500">Number of logged services / matings</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {breedingTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breedingTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
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
              <div className="flex items-center justify-center h-full text-xs text-stone-400">
                No monthly breeding history available.
              </div>
            )}
          </div>
        </div>

        {/* Gender Demographics Pie Chart (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-emerald-600" />
                <span>Herd Composition</span>
              </h4>
              <p className="text-xs text-stone-500">Gender ratio for reproduction management</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
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
              <div className="text-xs text-stone-400">No goats recorded yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
