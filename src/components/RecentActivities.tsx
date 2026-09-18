import React, { useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  Clock,
  HeartPulse,
  Baby,
  Tag,
  Milk,
  DollarSign,
  Receipt,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

interface RecentActivitiesProps {
  onNavigateToRecords?: () => void;
  onNavigateToHealth?: () => void;
  onNavigateToBreeding?: () => void;
}

interface ActivityItem {
  id: string;
  type: 'goat' | 'health' | 'birth' | 'breeding' | 'milk' | 'sale' | 'expense';
  title: string;
  detail: string;
  badge: string;
  dateStr: string;
  timestamp: number;
}

export const RecentActivities: React.FC<RecentActivitiesProps> = ({
  onNavigateToRecords,
  onNavigateToHealth,
  onNavigateToBreeding,
}) => {
  const { goats, health, breeding, milk, sales, expenses } = useFarm();

  const activities: ActivityItem[] = useMemo(() => {
    const list: ActivityItem[] = [];

    // 1. Goats registered
    goats.forEach(g => {
      let ts = Date.now();
      if (g.created_at) {
        ts = new Date(g.created_at).getTime();
      } else if (g.dob) {
        ts = new Date(g.dob).getTime();
      }
      list.push({
        id: `goat-${g.id}`,
        type: 'goat',
        title: `Goat: ${g.tag_number || g.name || g.id}`,
        detail: `${g.breed || 'Caprine'} • ${g.gender || 'Unknown'} • ${g.weight_kg ? `${g.weight_kg} kg` : 'Active'}`,
        badge: 'Herd Registry',
        dateStr: g.created_at ? new Date(g.created_at).toLocaleDateString() : (g.dob || 'Recently'),
        timestamp: ts,
      });
    });

    // 2. Health & Vaccination logs
    health.forEach(h => {
      const ts = h.checkup_date ? new Date(h.checkup_date).getTime() : Date.now();
      list.push({
        id: `health-${h.id}`,
        type: 'health',
        title: `Health: ${h.treatment || h.condition || 'Routine Checkup'}`,
        detail: `Goat ${h.goat_id || 'Herd'} • ${h.condition || 'General health'} • ${h.status || 'Logged'}`,
        badge: 'Health & Vet',
        dateStr: h.checkup_date || 'Recently',
        timestamp: ts,
      });
    });

    // 3. Breeding & Births
    breeding.forEach(b => {
      const isBirth = b.actual_birth_date || (b.status && b.status.toLowerCase() === 'delivered') || (b.kids_born && b.kids_born > 0);
      if (isBirth) {
        const ts = b.actual_birth_date ? new Date(b.actual_birth_date).getTime() : Date.now();
        list.push({
          id: `birth-${b.id}`,
          type: 'birth',
          title: `New Birth: ${b.kids_born ? `${b.kids_born} Kids Born` : 'Kidding Completed'}`,
          detail: `Dam: ${b.female_id || 'Doe'} • Sire: ${b.male_id || 'Buck'}`,
          badge: 'New Birth',
          dateStr: b.actual_birth_date || b.expected_birth || 'Recently',
          timestamp: ts,
        });
      } else {
        const ts = b.mating_date ? new Date(b.mating_date).getTime() : Date.now();
        list.push({
          id: `breeding-${b.id}`,
          type: 'breeding',
          title: `Breeding: ${b.female_id || 'Doe'}`,
          detail: `Mated with ${b.male_id || 'Buck'} • Due: ${b.expected_birth || 'Scheduled'}`,
          badge: 'Breeding',
          dateStr: b.mating_date || 'Recently',
          timestamp: ts,
        });
      }
    });

    // 4. Milk records
    milk.forEach(m => {
      const ts = m.date ? new Date(m.date).getTime() : Date.now();
      const total = m.total_liters ?? ((m.morning_liters || 0) + (m.evening_liters || 0));
      list.push({
        id: `milk-${m.id}`,
        type: 'milk',
        title: `Milk Harvest: ${total.toFixed(1)} Liters`,
        detail: `Goat ${m.goat_id || 'Doe'} • Morning: ${m.morning_liters || 0}L • Evening: ${m.evening_liters || 0}L`,
        badge: 'Dairy Yield',
        dateStr: m.date || 'Recently',
        timestamp: ts,
      });
    });

    // 5. Sales records
    sales.forEach(s => {
      const ts = s.sale_date ? new Date(s.sale_date).getTime() : Date.now();
      list.push({
        id: `sale-${s.id}`,
        type: 'sale',
        title: `Livestock Sale: ${s.goat_id || 'Goat'}`,
        detail: `Amount: Ksh ${s.price?.toLocaleString() || '0'} • Buyer: ${s.buyer_name || 'Market'}`,
        badge: 'Farm Sale',
        dateStr: s.sale_date || 'Recently',
        timestamp: ts,
      });
    });

    // 6. Expense records
    expenses.forEach(e => {
      const ts = e.date ? new Date(e.date).getTime() : Date.now();
      list.push({
        id: `expense-${e.id}`,
        type: 'expense',
        title: `Expense: ${e.category || 'Farm Supply'}`,
        detail: `${e.title || 'Farm maintenance'} • Cost: Ksh ${e.amount?.toLocaleString() || '0'}`,
        badge: 'Expense',
        dateStr: e.date || 'Recently',
        timestamp: ts,
      });
    });

    // Sort descending by timestamp and take last 5 records added
    list.sort((a, b) => b.timestamp - a.timestamp);
    return list.slice(0, 5);
  }, [goats, health, breeding, milk, sales, expenses]);

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'goat':
        return <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'health':
        return <HeartPulse className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'birth':
        return <Baby className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'breeding':
        return <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'milk':
        return <Milk className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'sale':
        return <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'expense':
        return <Receipt className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-stone-600 dark:text-stone-400" />;
    }
  };

  const getBadgeClass = (type: ActivityItem['type']) => {
    switch (type) {
      case 'goat':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      case 'health':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
      case 'birth':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800';
      case 'breeding':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
      case 'milk':
        return 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800';
      case 'sale':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
      case 'expense':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800';
      default:
        return 'bg-stone-50 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700';
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <span>Recent Activities</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                Last 5 Records
              </span>
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Audit log of newly logged livestock, health updates, and farm events
            </p>
          </div>
        </div>

        {onNavigateToRecords && (
          <button
            type="button"
            onClick={onNavigateToRecords}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {activities.length === 0 ? (
        <div className="py-8 text-center text-xs text-stone-400 dark:text-stone-500">
          No farm activities logged yet. Register a goat or log a health check to see recent updates here.
        </div>
      ) : (
        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {activities.map(item => (
            <div
              key={item.id}
              className="py-3 flex items-start justify-between gap-3 hover:bg-stone-50/60 dark:hover:bg-stone-800/40 rounded-xl px-2.5 -mx-2.5 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 p-2 rounded-xl bg-stone-100 dark:bg-stone-800 shrink-0">
                  {getIcon(item.type)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-stone-900 dark:text-stone-100 text-xs sm:text-sm truncate">
                      {item.title}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getBadgeClass(
                        item.type
                      )}`}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                    {item.detail}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] font-mono text-stone-400 dark:text-stone-500 block">
                  {item.dateStr}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
