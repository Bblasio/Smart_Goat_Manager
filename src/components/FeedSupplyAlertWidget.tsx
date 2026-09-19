import React from 'react';
import { useFarm } from '../context/FarmContext';
import {
  Package,
  Pill,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowUpRight,
  Layers,
  Clock
} from 'lucide-react';

interface FeedSupplyAlertWidgetProps {
  onNavigateToFeedSupply: () => void;
}

export const FeedSupplyAlertWidget: React.FC<FeedSupplyAlertWidgetProps> = ({
  onNavigateToFeedSupply
}) => {
  const { feeds, medications } = useFarm();

  const lowStockFeeds = feeds.filter(f => f.quantity <= f.min_threshold);
  const lowStockMeds = medications.filter(m => m.quantity <= m.min_threshold);
  const totalLowStock = lowStockFeeds.length + lowStockMeds.length;

  // Check for medications expiring within 60 days
  const expiringMeds = medications.filter(m => {
    if (!m.expiry_date) return false;
    const diffMs = new Date(m.expiry_date).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 60;
  });

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-stone-900 dark:text-white">
                Feed & Veterinary Supply Status
              </h4>
              {feeds.length === 0 && medications.length === 0 ? (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                  Ready for Setup
                </span>
              ) : totalLowStock > 0 ? (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 animate-pulse">
                  {totalLowStock} Low Stock Alert{totalLowStock > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                  Reserves Optimal
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Inventory thresholds for forage, concentrates, and herd pharmaceuticals
            </p>
          </div>
        </div>

        <button
          type="button"
          id="btn-widget-feed-supply"
          onClick={onNavigateToFeedSupply}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-colors"
        >
          <span>Open Feed & Supply</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Summary Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-100 dark:border-stone-800">
          <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
            Feed Varieties
          </div>
          <div className="mt-1 text-lg font-bold text-stone-900 dark:text-stone-100">
            {feeds.length}
          </div>
          <div className="text-[11px] text-stone-400">
            {feeds.length === 0 ? (
              'None entered'
            ) : lowStockFeeds.length > 0 ? (
              <span className="text-amber-600 font-medium">{lowStockFeeds.length} low</span>
            ) : (
              'All stocked'
            )}
          </div>
        </div>

        <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-100 dark:border-stone-800">
          <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
            Medications
          </div>
          <div className="mt-1 text-lg font-bold text-stone-900 dark:text-stone-100">
            {medications.length}
          </div>
          <div className="text-[11px] text-stone-400">
            {medications.length === 0 ? (
              'None entered'
            ) : lowStockMeds.length > 0 ? (
              <span className="text-amber-600 font-medium">{lowStockMeds.length} low</span>
            ) : (
              'Cabinet full'
            )}
          </div>
        </div>

        <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-100 dark:border-stone-800">
          <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
            Stock Warnings
          </div>
          <div className={`mt-1 text-lg font-bold ${totalLowStock > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-stone-900 dark:text-stone-100'}`}>
            {totalLowStock}
          </div>
          <div className="text-[11px] text-stone-400">
            Below safe minimum
          </div>
        </div>

        <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-100 dark:border-stone-800">
          <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
            Expiring Soon
          </div>
          <div className="mt-1 text-lg font-bold text-stone-900 dark:text-stone-100">
            {expiringMeds.length}
          </div>
          <div className="text-[11px] text-stone-400">
            Within 60 days
          </div>
        </div>
      </div>

      {/* Urgent low stock list or reassuring empty message */}
      {feeds.length === 0 && medications.length === 0 ? (
        <div className="p-3.5 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-dashed border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div className="text-xs text-stone-600 dark:text-stone-300">
              <span className="font-semibold">No feed or medication inventory registered yet.</span> Add your farm's stocks to enable automated low-supply alerts.
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToFeedSupply}
            className="self-start sm:self-center px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg whitespace-nowrap shadow-xs"
          >
            Add First Stock
          </button>
        </div>
      ) : totalLowStock === 0 && expiringMeds.length === 0 ? (
        <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xs text-emerald-900 dark:text-emerald-300">
            <span className="font-semibold">All Feed & Medical Supplies Adequately Provisioned.</span> Hay, grains, mineral licks, and critical medicines are above reserve thresholds.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Low Stock Items */}
          {lowStockFeeds.map(f => (
            <div
              key={f.id}
              onClick={onNavigateToFeedSupply}
              className="cursor-pointer p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between hover:bg-amber-100/70 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-300">
                  <Package className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    {f.name}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Remaining: <strong className="text-amber-700 dark:text-amber-400">{f.quantity} {f.unit}</strong> (Min: {f.min_threshold} {f.unit})
                  </div>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
                <span>Reorder</span>
                <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          ))}

          {lowStockMeds.map(m => (
            <div
              key={m.id}
              onClick={onNavigateToFeedSupply}
              className="cursor-pointer p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-between hover:bg-rose-100/70 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-300">
                  <Pill className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    {m.name}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Only <strong className="text-rose-600 dark:text-rose-400">{m.quantity} {m.unit}</strong> left in vet cabinet
                  </div>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 dark:text-rose-300">
                <span>Restock</span>
                <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          ))}

          {/* Expiring meds */}
          {expiringMeds.map(m => (
            <div
              key={`exp-${m.id}`}
              onClick={onNavigateToFeedSupply}
              className="cursor-pointer p-3 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-center justify-between hover:bg-purple-100/70 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-300">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    {m.name} Expiring Soon
                  </div>
                  <div className="text-[11px] text-purple-700 dark:text-purple-300">
                    Expires on {m.expiry_date} (Batch: {m.batch_number || 'N/A'})
                  </div>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 dark:text-purple-300">
                <span>Review</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
