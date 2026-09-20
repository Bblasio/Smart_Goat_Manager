import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { KidGrowthRecord } from '../types';
import {
  Baby,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  LineChart as LineChartIcon,
  Scale,
  Calendar,
  CheckCircle2,
  Wheat,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { KidGrowthTrajectoryModal } from './KidGrowthTrajectoryModal';

interface KidNurseryWidgetProps {
  onNavigateToRecords?: () => void;
  onNavigateToBreeding?: () => void;
}

export const KidNurseryWidget: React.FC<KidNurseryWidgetProps> = ({
  onNavigateToRecords,
  onNavigateToBreeding,
}) => {
  const { kidGrowthRecords, goats } = useFarm();
  const [selectedTrajectoryKid, setSelectedTrajectoryKid] = useState<KidGrowthRecord | null>(null);

  // Active nursing / young kids
  const nursingKids = useMemo(() => {
    return kidGrowthRecords.filter(k => k.status === 'Nursing');
  }, [kidGrowthRecords]);

  const allKids = useMemo(() => {
    return kidGrowthRecords;
  }, [kidGrowthRecords]);

  // Calculate Flock Average Daily Gain (ADG)
  const stats = useMemo(() => {
    const today = new Date();
    
    // Kids with calculated ADG
    const adgValues: number[] = [];
    const creepAlerts: KidGrowthRecord[] = [];
    const highGainers: KidGrowthRecord[] = [];
    const weaningDueSoon: { kid: KidGrowthRecord; ageDays: number; daysUntilWeaning: number }[] = [];

    allKids.forEach(kid => {
      // Calculate age
      const dob = new Date(kid.dob);
      const diffTime = today.getTime() - dob.getTime();
      const ageDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      
      const birthWeight = Number(kid.birth_weight_kg) || 3.5;
      const latestWeight = Number(kid.weaning_weight_kg || kid.thirty_day_weight_kg || birthWeight);
      
      let effectiveAdg = kid.adg_grams_per_day || 0;
      if (!effectiveAdg && ageDays > 0 && latestWeight > birthWeight) {
        effectiveAdg = Math.round(((latestWeight - birthWeight) / ageDays) * 1000);
      }

      if (effectiveAdg > 0) {
        adgValues.push(effectiveAdg);
      }

      // Check creep feed threshold (< 140 g/day)
      if (kid.status === 'Nursing' && effectiveAdg > 0 && effectiveAdg < 140) {
        creepAlerts.push(kid);
      } else if (effectiveAdg >= 180) {
        highGainers.push(kid);
      }

      // Weaning milestone (90 days standard)
      if (kid.status === 'Nursing') {
        const daysUntilWeaning = 90 - ageDays;
        if (daysUntilWeaning <= 15) {
          weaningDueSoon.push({ kid, ageDays, daysUntilWeaning });
        }
      }
    });

    const averageAdg = adgValues.length > 0 
      ? Math.round(adgValues.reduce((a, b) => a + b, 0) / adgValues.length)
      : 0;

    return {
      averageAdg,
      nursingCount: nursingKids.length,
      weanedCount: allKids.filter(k => k.status === 'Weaned').length,
      creepAlerts,
      highGainersCount: highGainers.length,
      weaningDueSoon,
    };
  }, [allKids, nursingKids]);

  return (
    <div
      id="widget-kid-nursery"
      className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs transition-colors"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
            <Baby className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-stone-900 dark:text-white">
                Kid Nursery & Average Daily Gain (ADG) Benchmark
              </h4>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300">
                {stats.nursingCount} Nursing Kids
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Pre-weaning caprine growth tracking, creep feeding alerts & target trajectory
            </p>
          </div>
        </div>

        {onNavigateToRecords && (
          <button
            type="button"
            id="btn-nursery-records"
            onClick={onNavigateToRecords}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-xs font-semibold transition-colors"
          >
            <span>Full Growth Tracker</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        {/* Flock Average ADG */}
        <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
          <div className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Flock Mean ADG</span>
            <Scale className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-stone-900 dark:text-white font-mono">
              {stats.averageAdg}
            </span>
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">g / day</span>
          </div>
          <div className="text-[11px] mt-1.5 flex items-center gap-1">
            <span
              className={`font-semibold ${
                stats.averageAdg >= 160
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {stats.averageAdg >= 180 ? '⭐ Elite' : stats.averageAdg >= 160 ? '✓ On Target' : '⚠ Sub-Target'}
            </span>
            <span className="text-stone-400 text-[10px]">(Target: ≥160g/d)</span>
          </div>
        </div>

        {/* Creep Feeding Alerts */}
        <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
          <div className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Creep Feed Alerts</span>
            <Wheat className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900 dark:text-white font-mono">
            {stats.creepAlerts.length}
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1.5">
            {stats.creepAlerts.length > 0
              ? 'Kids < 140g/d needing supplemental ration'
              : 'All nursing kids meeting weight benchmarks'}
          </p>
        </div>

        {/* High Gain Performers */}
        <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
          <div className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>High Gainers</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900 dark:text-white font-mono">
            {stats.highGainersCount}
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1.5">
            Gaining ≥180 g/day for stud selection
          </p>
        </div>

        {/* Weaning Horizon */}
        <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
          <div className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Weaning Horizon</span>
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900 dark:text-white font-mono">
            {stats.weaningDueSoon.length}
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1.5">
            Approaching 90-day weaning milestone
          </p>
        </div>
      </div>

      {/* Creep Feeding Intervention Alert Banner if any */}
      {stats.creepAlerts.length > 0 && (
        <div className="mb-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <div className="font-bold">
              Creep Feeding Intervention Recommended ({stats.creepAlerts.map(k => k.kid_tag).join(', ')})
            </div>
            <p className="text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
              These nursing kids are registering an ADG below 140 g/day. Provide separate creep pens with 18% crude protein starter pellets, legume fodder, and check doe lactation yield.
            </p>
          </div>
        </div>
      )}

      {/* Nursery Kids List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300 px-1">
          <span>Active Nursery Kids ({nursingKids.length})</span>
          <span className="text-[11px] text-stone-400 font-normal">Click kid to inspect ADG trajectory curve</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {nursingKids.map(kid => {
            const today = new Date();
            const dob = new Date(kid.dob);
            const ageDays = Math.max(1, Math.floor((today.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24)));
            const adg = kid.adg_grams_per_day || 0;
            const currentWt = kid.weaning_weight_kg || kid.thirty_day_weight_kg || kid.birth_weight_kg;

            return (
              <div
                key={kid.id}
                id={`kid-card-${kid.id}`}
                className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700/60 hover:border-teal-300 dark:hover:border-teal-700 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 flex items-center justify-center font-bold text-xs">
                      {kid.gender === 'Male' ? '♂' : '♀'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-stone-900 dark:text-white text-xs">
                          {kid.kid_tag}
                        </span>
                        {kid.kid_name && (
                          <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                            "{kid.kid_name}"
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-stone-400 truncate max-w-[140px]">
                        {kid.breed} • {ageDays}d old
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold font-mono ${
                      adg >= 180
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : adg >= 140
                        ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {adg > 0 ? `${adg} g/d` : 'No Weight Yet'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-stone-200/60 dark:border-stone-700/60">
                  <div>
                    <span className="text-stone-400 text-[10px] block">Birth / Current Wt:</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200 font-mono">
                      {kid.birth_weight_kg}kg → {currentWt}kg
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] block">Target 90d Wt:</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200 font-mono">
                      {kid.target_weaning_weight_kg || 18}kg
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  id={`btn-open-trajectory-${kid.id}`}
                  onClick={() => setSelectedTrajectoryKid(kid)}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <LineChartIcon className="w-3.5 h-3.5" />
                  <span>Inspect ADG Trajectory Curve</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kid Weight Trajectory & ADG Performance Modal */}
      <KidGrowthTrajectoryModal
        isOpen={!!selectedTrajectoryKid}
        onClose={() => setSelectedTrajectoryKid(null)}
        kid={selectedTrajectoryKid}
      />
    </div>
  );
};
