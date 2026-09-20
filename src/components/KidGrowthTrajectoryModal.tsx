import React, { useMemo } from 'react';
import {
  X,
  TrendingUp,
  Scale,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Award,
  Sparkles,
  Printer,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ReferenceLine
} from 'recharts';
import { KidGrowthRecord } from '../types';

interface KidGrowthTrajectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  kid: KidGrowthRecord | null;
}

export const KidGrowthTrajectoryModal: React.FC<KidGrowthTrajectoryModalProps> = ({
  isOpen,
  onClose,
  kid,
}) => {
  if (!isOpen || !kid) return null;

  // Calculate age in days
  const calculateAgeDays = (dobStr: string): number => {
    try {
      const birth = new Date(dobStr).getTime();
      const now = new Date().getTime();
      return Math.max(1, Math.floor((now - birth) / (1000 * 60 * 60 * 24)));
    } catch {
      return 1;
    }
  };

  const ageDays = calculateAgeDays(kid.dob);
  const birthWeight = Number(kid.birth_weight_kg) || 3.5;
  const currentWeight = Number(kid.weaning_weight_kg || kid.thirty_day_weight_kg || birthWeight);
  
  // Calculate Average Daily Gain (ADG in grams/day)
  const adgGrams = useMemo(() => {
    if (kid.adg_grams_per_day && kid.adg_grams_per_day > 0) return kid.adg_grams_per_day;
    if (ageDays <= 0) return 0;
    const gainKg = currentWeight - birthWeight;
    return Math.max(0, Math.round((gainKg / ageDays) * 1000));
  }, [kid, ageDays, currentWeight, birthWeight]);

  // Generate trajectory curve dataset (Day 0 to Day 90)
  const chartData = useMemo(() => {
    const isMeatBreed = ['boer', 'kalahari', 'savanna', 'meat'].some(b => (kid.breed || '').toLowerCase().includes(b));
    // Breed target curves (g/day average expectation)
    const targetDailyGainKg = isMeatBreed ? 0.180 : 0.145;

    const milestones = [
      { day: 0, label: 'Birth', targetKg: Number(birthWeight.toFixed(1)) },
      { day: 15, label: 'Day 15', targetKg: Number((birthWeight + targetDailyGainKg * 15).toFixed(1)) },
      { day: 30, label: 'Day 30', targetKg: Number((birthWeight + targetDailyGainKg * 30).toFixed(1)) },
      { day: 45, label: 'Day 45', targetKg: Number((birthWeight + targetDailyGainKg * 45).toFixed(1)) },
      { day: 60, label: 'Day 60', targetKg: Number((birthWeight + targetDailyGainKg * 60).toFixed(1)) },
      { day: 75, label: 'Day 75', targetKg: Number((birthWeight + targetDailyGainKg * 75).toFixed(1)) },
      { day: 90, label: 'Day 90 (Weaning)', targetKg: Number((birthWeight + targetDailyGainKg * 90).toFixed(1)) },
    ];

    // Map actual points
    return milestones.map(m => {
      let actualKg: number | null = null;
      if (m.day === 0) {
        actualKg = birthWeight;
      } else if (m.day <= ageDays) {
        // Interpolate or reflect actual measured weight at current age
        const progressRatio = Math.min(1, m.day / ageDays);
        actualKg = Number((birthWeight + (currentWeight - birthWeight) * progressRatio).toFixed(1));
      }

      return {
        label: m.label,
        day: m.day,
        StandardTarget: m.targetKg,
        ActualWeight: actualKg,
      };
    });
  }, [kid, birthWeight, currentWeight, ageDays]);

  // Projected 90-Day Weaning Weight
  const projectedWeaningWeight = useMemo(() => {
    if (adgGrams > 0) {
      return (birthWeight + (adgGrams / 1000) * 90).toFixed(1);
    }
    return (birthWeight + 0.16 * 90).toFixed(1);
  }, [birthWeight, adgGrams]);

  // Nutritional Status & Protocol Advice
  const statusAudit = useMemo(() => {
    if (adgGrams >= 180) {
      return {
        rating: 'High Gain (Premier Growth)',
        badgeColor: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300',
        advice: 'Outstanding feed conversion and maternal milk yield. Exceeds commercial meat growth standards.',
        statusIcon: CheckCircle2,
      };
    }
    if (adgGrams >= 140) {
      return {
        rating: 'Optimal Commercial Target',
        badgeColor: 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border-sky-300',
        advice: 'Meeting standard target weight for weaning. Maintain quality forage and continue nursing routine.',
        statusIcon: CheckCircle2,
      };
    }
    return {
      rating: 'Underperforming (Needs Creep Feed)',
      badgeColor: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300',
      advice: 'Growth rate is below 140 g/day benchmark. Initiate creep feeding with 18% CP pelleted starter and inspect for coccidiosis/parasites.',
      statusIcon: AlertCircle,
    };
  }, [adgGrams]);

  const StatusIcon = statusAudit.statusIcon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl p-5 sm:p-7 space-y-6 my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white tracking-tight">
                  Kid Weight Trajectory & ADG Performance
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                  Tag #{kid.kid_tag}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {kid.kid_name ? `${kid.kid_name} • ` : ''}Breed: {kid.breed} • Gender: {kid.gender} • Age: {ageDays} Days
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80">
            <div className="text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Birth Weight
            </div>
            <div className="text-xl font-black text-stone-900 dark:text-white mt-1">
              {birthWeight} <span className="text-xs font-normal text-stone-500">kg</span>
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">Logged at birth</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80">
            <div className="text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Current / Recorded
            </div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {currentWeight} <span className="text-xs font-normal text-stone-500">kg</span>
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">Gain: +{(currentWeight - birthWeight).toFixed(1)} kg</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80">
            <div className="text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Average Daily Gain (ADG)
            </div>
            <div className="text-xl font-black text-sky-600 dark:text-sky-400 mt-1">
              {adgGrams} <span className="text-xs font-normal text-stone-500">g/day</span>
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">Benchmark: 140+ g/day</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80">
            <div className="text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Projected Weaning (90d)
            </div>
            <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">
              {projectedWeaningWeight} <span className="text-xs font-normal text-stone-500">kg</span>
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">Target: 16.0+ kg</div>
          </div>
        </div>

        {/* Performance Audit Banner */}
        <div className={`p-4 rounded-2xl border flex items-start gap-3 shadow-2xs ${statusAudit.badgeColor}`}>
          <StatusIcon className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="text-xs font-black uppercase tracking-wider">
              Nutritional Status: {statusAudit.rating}
            </div>
            <p className="text-xs leading-relaxed opacity-90">
              {statusAudit.advice}
            </p>
          </div>
        </div>

        {/* Growth Trajectory Chart */}
        <div className="flex-1 overflow-y-auto space-y-3 min-h-[260px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-emerald-600" />
              <span>Weight Progression vs. Breed Target Curve (0 to 90 Days)</span>
            </span>
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>Actual Weight (kg)</span>
              </span>
              <span className="flex items-center gap-1 text-stone-400">
                <span className="w-2.5 h-2.5 rounded-full bg-stone-400 inline-block"></span>
                <span>Standard Target (kg)</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.6} />
                <XAxis
                  dataKey="label"
                  stroke="#9ca3af"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={10}
                  tickLine={false}
                  domain={[0, 'auto']}
                  unit="kg"
                />
                <Tooltip
                  formatter={(value: any, name: string) => [
                    `${value} kg`,
                    name === 'ActualWeight' ? 'Actual Kid Weight' : 'Breed Benchmark Target',
                  ]}
                  contentStyle={{
                    backgroundColor: '#1c1917',
                    borderColor: '#44403c',
                    borderRadius: '12px',
                    color: '#f5f5f4',
                    fontSize: '11px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="StandardTarget"
                  stroke="#a8a29e"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: '#a8a29e' }}
                  name="Standard Target"
                />
                <Line
                  type="monotone"
                  dataKey="ActualWeight"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#059669', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7 }}
                  name="Actual Weight"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-stone-100 dark:border-stone-800 text-xs">
          <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Regular 14-day weight logs provide higher precision for creep feed rationing.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-black dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 rounded-xl font-bold transition-colors"
          >
            Close Trajectory
          </button>
        </div>

      </div>
    </div>
  );
};
