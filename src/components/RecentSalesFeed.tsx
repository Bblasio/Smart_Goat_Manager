import React from 'react';
import {
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  Tag,
  CheckCircle2,
  Calendar,
  User,
  ShoppingBag,
  ChevronRight,
  Plus
} from 'lucide-react';
import { SaleRecord, GoatRecord } from '../types';

interface RecentSalesFeedProps {
  sales: SaleRecord[];
  goats: GoatRecord[];
  onNavigateToRecords?: () => void;
  onOpenAddSale?: () => void;
  className?: string;
}

export const RecentSalesFeed: React.FC<RecentSalesFeedProps> = ({
  sales,
  goats,
  onNavigateToRecords,
  onOpenAddSale,
  className = '',
}) => {
  // Sort sales newest to oldest and take last 5
  const recentTransactions = [...sales]
    .sort((a, b) => {
      const dateA = a.sale_date ? new Date(a.sale_date).getTime() : 0;
      const dateB = b.sale_date ? new Date(b.sale_date).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  // Financial Insights calculations
  const recentRevenue = recentTransactions.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  const avgSalePrice =
    recentTransactions.length > 0
      ? Math.round(recentRevenue / recentTransactions.length)
      : 0;
  const maxSale = recentTransactions.reduce(
    (max, s) => (s.price > max ? s.price : max),
    0
  );
  
  // Total sold goats count
  const totalSoldGoats = goats.filter(g => {
    if (g.status === 'Sold') return true;
    const cleanTag = g.tag_number.toUpperCase();
    const cleanName = g.name ? g.name.trim().toUpperCase() : '';
    return sales.some(s => {
      const target = (s.goat_id || '').trim().toUpperCase();
      return target === cleanTag || s.goat_id === g.id || (cleanName && target === cleanName);
    });
  }).length;

  return (
    <div
      id="recent-sales-activity-feed"
      className={`bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-xs transition-colors ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Commercial Velocity
              </span>
              <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                Last 5 Transactions
              </span>
            </div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-1.5 mt-0.5">
              <span>Recent Sales Activity</span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenAddSale && (
            <button
              type="button"
              id="btn-quick-record-sale"
              onClick={onOpenAddSale}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Sale</span>
            </button>
          )}
          {onNavigateToRecords && (
            <button
              type="button"
              id="btn-view-all-sales"
              onClick={onNavigateToRecords}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Financial Insights Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-stone-100 dark:border-stone-800">
        <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
          <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
            Recent Cash Inflow
          </div>
          <div className="text-lg font-black text-emerald-900 dark:text-emerald-100 font-mono mt-0.5">
            Ksh {recentRevenue.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-400">
            From last 5 sales
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800">
          <div className="text-[11px] font-semibold text-stone-600 dark:text-stone-300">
            Avg Price / Head
          </div>
          <div className="text-lg font-black text-stone-900 dark:text-white font-mono mt-0.5">
            Ksh {avgSalePrice.toLocaleString()}
          </div>
          <div className="text-[10px] text-stone-500 dark:text-stone-400">
            Commercial benchmark
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800">
          <div className="text-[11px] font-semibold text-stone-600 dark:text-stone-300">
            Highest Valued Sale
          </div>
          <div className="text-lg font-black text-stone-900 dark:text-white font-mono mt-0.5">
            Ksh {maxSale.toLocaleString()}
          </div>
          <div className="text-[10px] text-stone-500 dark:text-stone-400">
            Top single animal
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800">
          <div className="text-[11px] font-semibold text-stone-600 dark:text-stone-300">
            Total Sold Goats
          </div>
          <div className="text-lg font-black text-stone-900 dark:text-white font-mono mt-0.5">
            {totalSoldGoats} Head
          </div>
          <div className="text-[10px] text-stone-500 dark:text-stone-400">
            Marked 'Sold' in records
          </div>
        </div>
      </div>

      {/* Transaction Feed */}
      <div className="pt-4">
        {recentTransactions.length > 0 ? (
          <div className="divide-y divide-stone-100 dark:divide-stone-800/80">
            {recentTransactions.map((sale, index) => {
              const matchedGoat = goats.find(g => {
                const target = (sale.goat_id || '').trim().toUpperCase();
                return (
                  g.tag_number.toUpperCase() === target ||
                  g.id === sale.goat_id ||
                  (g.name && g.name.trim().toUpperCase() === target)
                );
              });

              return (
                <div
                  key={sale.id || index}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/60 dark:hover:bg-stone-800/30 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                      #{index + 1}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-stone-900 dark:text-white font-mono text-sm">
                          {sale.goat_id}
                        </span>
                        {matchedGoat?.name && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <Tag className="w-2.5 h-2.5" />
                            {matchedGoat.name}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                          <CheckCircle2 className="w-3 h-3 text-stone-500" />
                          Sold
                        </span>
                        {matchedGoat && (
                          <span className="text-xs text-stone-500 dark:text-stone-400">
                            • {matchedGoat.breed} ({matchedGoat.gender})
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-stone-500 dark:text-stone-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-stone-400" />
                          Buyer: <strong className="text-stone-700 dark:text-stone-300 font-medium">{sale.buyer_name || 'Private Client'}</strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          {sale.sale_date || 'Recent'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right flex sm:flex-col justify-between items-center sm:items-end">
                    <div className="text-base font-black text-emerald-700 dark:text-emerald-400 font-mono">
                      +Ksh {Number(sale.price).toLocaleString()}
                    </div>
                    <span className="text-[10px] text-stone-400 font-medium">
                      Status Synced to Herd Record
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                No Sales Recorded Yet
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mt-0.5">
                When you record a goat sale or revenue, the animal will automatically update its status to <strong>Sold</strong> in your herd records.
              </p>
            </div>
            {onOpenAddSale && (
              <button
                type="button"
                onClick={onOpenAddSale}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register First Goat Sale</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
