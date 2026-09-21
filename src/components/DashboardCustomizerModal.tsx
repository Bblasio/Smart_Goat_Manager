import React, { useState } from 'react';
import {
  X,
  Pin,
  Check,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Clock,
  DollarSign,
  Receipt,
  PieChart as PieIcon,
  BarChart3,
  Baby,
  AlertTriangle,
  ShieldAlert,
  CloudSun,
  RotateCcw,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';

export type DashboardWidgetId =
  | 'weight_trends'
  | 'recent_activity'
  | 'cash_flow'
  | 'recent_sales'
  | 'demographics'
  | 'breeding_trends'
  | 'kid_nursery'
  | 'feed_alerts'
  | 'quarantine_monitor'
  | 'weather_advisory';

export interface WidgetDefinition {
  id: DashboardWidgetId;
  title: string;
  category: 'graph' | 'activity' | 'monitor';
  categoryLabel: string;
  description: string;
  icon: React.ElementType;
  accentColor: string;
}

export const ALL_DASHBOARD_WIDGETS: WidgetDefinition[] = [
  {
    id: 'weight_trends',
    title: 'Weight & Growth Trends Graph',
    category: 'graph',
    categoryLabel: 'Analytical Graph',
    description: '6-month herd weight velocity, comparing young stock growth against mature herd average.',
    icon: TrendingUp,
    accentColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800'
  },
  {
    id: 'recent_activity',
    title: 'Recent Activity Feed',
    category: 'activity',
    categoryLabel: 'Activity Feed',
    description: 'Live operational audit stream tracking recent births, veterinary treatments, sales, and weight logs.',
    icon: Clock,
    accentColor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800'
  },
  {
    id: 'cash_flow',
    title: 'Financial Cash Flow & P&L',
    category: 'graph',
    categoryLabel: 'Financial Graph',
    description: 'Monthly revenue versus farm expenditure sparkline, net margin, and quick transaction buttons.',
    icon: DollarSign,
    accentColor: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800'
  },
  {
    id: 'recent_sales',
    title: 'Recent Livestock Sales Feed',
    category: 'activity',
    categoryLabel: 'Activity Feed',
    description: 'Audit log of recent livestock and milk sales, customer names, quantity, and unit revenue.',
    icon: Receipt,
    accentColor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800'
  },
  {
    id: 'demographics',
    title: 'Herd Demographics Breakdown',
    category: 'graph',
    categoryLabel: 'Analytical Graph',
    description: 'Interactive pie chart detailing female to male herd ratio for reproduction planning.',
    icon: PieIcon,
    accentColor: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800'
  },
  {
    id: 'breeding_trends',
    title: 'Monthly Breeding Activity',
    category: 'graph',
    categoryLabel: 'Analytical Graph',
    description: 'Seasonal mating services frequency and reproduction heat monitoring bar chart.',
    icon: BarChart3,
    accentColor: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800'
  },
  {
    id: 'kid_nursery',
    title: 'Kid Nursery & ADG Benchmark',
    category: 'monitor',
    categoryLabel: 'Care Monitor',
    description: 'Tracks kid growth velocity, target weight thresholds, weaning readiness, and nursery metrics.',
    icon: Baby,
    accentColor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800'
  },
  {
    id: 'feed_alerts',
    title: 'Feed Silo & Medicine Alerts',
    category: 'monitor',
    categoryLabel: 'Care Monitor',
    description: 'Critical inventory alarms for feed silos below 20% and depleted veterinary medicine supplies.',
    icon: AlertTriangle,
    accentColor: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800'
  },
  {
    id: 'quarantine_monitor',
    title: 'Quarantine & Biosecurity Status',
    category: 'monitor',
    categoryLabel: 'Care Monitor',
    description: 'Active isolation pens, biosecurity status, and quarantine recovery countdowns.',
    icon: ShieldAlert,
    accentColor: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800'
  },
  {
    id: 'weather_advisory',
    title: 'Farm Weather & Grazing Index',
    category: 'monitor',
    categoryLabel: 'Care Monitor',
    description: 'Current temperature, pasture comfort index, rainfall forecast, and field grazing advisory.',
    icon: CloudSun,
    accentColor: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800'
  }
];

export const DEFAULT_PINNED_WIDGETS: DashboardWidgetId[] = [
  'weight_trends',
  'recent_activity',
  'cash_flow'
];

interface DashboardCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pinnedWidgetIds: DashboardWidgetId[];
  onSavePinnedWidgets: (newPinnedIds: DashboardWidgetId[]) => void;
}

export const DashboardCustomizerModal: React.FC<DashboardCustomizerModalProps> = ({
  isOpen,
  onClose,
  pinnedWidgetIds,
  onSavePinnedWidgets
}) => {
  const [currentPinned, setCurrentPinned] = useState<DashboardWidgetId[]>(pinnedWidgetIds);
  const [filterCategory, setFilterCategory] = useState<'all' | 'graph' | 'activity' | 'monitor'>('all');

  // Keep state in sync when opened
  React.useEffect(() => {
    if (isOpen) {
      setCurrentPinned(pinnedWidgetIds);
    }
  }, [isOpen, pinnedWidgetIds]);

  if (!isOpen) return null;

  const togglePin = (id: DashboardWidgetId) => {
    if (currentPinned.includes(id)) {
      setCurrentPinned(prev => prev.filter(item => item !== id));
    } else {
      setCurrentPinned(prev => [...prev, id]);
    }
  };

  const moveWidget = (id: DashboardWidgetId, direction: 'up' | 'down') => {
    const index = currentPinned.indexOf(id);
    if (index === -1) return;

    const newPinned = [...currentPinned];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newPinned.length) return;

    const temp = newPinned[index];
    newPinned[index] = newPinned[targetIndex];
    newPinned[targetIndex] = temp;

    setCurrentPinned(newPinned);
  };

  const applyPreset = (presetIds: DashboardWidgetId[]) => {
    setCurrentPinned(presetIds);
  };

  const handleSave = () => {
    onSavePinnedWidgets(currentPinned);
    onClose();
  };

  const filteredWidgets = ALL_DASHBOARD_WIDGETS.filter(w => {
    if (filterCategory === 'all') return true;
    return w.category === filterCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customizer-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 id="customizer-title" className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>Customize Dashboard Widgets</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-medium">
                  {currentPinned.length} Pinned
                </span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Pin graphs or recent activity summaries to display them first at the top
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets & Filter Bar */}
        <div className="px-6 py-3 border-b border-stone-100 dark:border-stone-800/80 bg-stone-50/40 dark:bg-stone-850/40 space-y-2.5">
          {/* Quick Preset Buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Presets:</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => applyPreset(['weight_trends', 'recent_activity', 'cash_flow'])}
                className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors text-[11px]"
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => applyPreset(['cash_flow', 'recent_sales', 'weight_trends'])}
                className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-700 dark:hover:text-teal-300 transition-colors text-[11px]"
              >
                Financial Focus
              </button>
              <button
                type="button"
                onClick={() => applyPreset(['recent_activity', 'kid_nursery', 'breeding_trends'])}
                className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 transition-colors text-[11px]"
              >
                Breeding & Nursery
              </button>
              <button
                type="button"
                onClick={() => applyPreset(['quarantine_monitor', 'feed_alerts', 'weather_advisory', 'recent_activity'])}
                className="px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-300 transition-colors text-[11px]"
              >
                Daily Operations
              </button>
              <button
                type="button"
                onClick={() => applyPreset(DEFAULT_PINNED_WIDGETS)}
                className="px-2 py-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors text-[11px] flex items-center gap-1"
                title="Reset to default"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filterCategory === 'all'
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              All Available ({ALL_DASHBOARD_WIDGETS.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('graph')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filterCategory === 'graph'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              Graphs & Charts
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('activity')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filterCategory === 'activity'
                  ? 'bg-blue-700 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              Activity Feeds
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('monitor')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                filterCategory === 'monitor'
                  ? 'bg-amber-700 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              Care Monitors
            </button>
          </div>
        </div>

        {/* Scrollable Widget Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 divide-y divide-stone-100 dark:divide-stone-800/80">
          {filteredWidgets.map(widget => {
            const isPinned = currentPinned.includes(widget.id);
            const pinnedIndex = currentPinned.indexOf(widget.id);
            const Icon = widget.icon;

            return (
              <div
                key={widget.id}
                className={`pt-3 first:pt-0 flex items-center justify-between gap-4 p-3 rounded-xl transition-colors ${
                  isPinned
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/50'
                    : 'hover:bg-stone-50 dark:hover:bg-stone-800/40 border border-transparent'
                }`}
              >
                {/* Left info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${widget.accentColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                        {widget.title}
                      </h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                        {widget.categoryLabel}
                      </span>
                      {isPinned && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white flex items-center gap-1">
                          <Pin className="w-2.5 h-2.5 fill-current" />
                          <span>#{pinnedIndex + 1}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-1">
                      {widget.description}
                    </p>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Order controls if pinned */}
                  {isPinned && (
                    <div className="flex items-center bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 p-0.5 mr-1">
                      <button
                        type="button"
                        onClick={() => moveWidget(widget.id, 'up')}
                        disabled={pinnedIndex === 0}
                        className="p-1 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 disabled:opacity-30 disabled:hover:text-stone-500 rounded transition-colors"
                        title="Move Up in priority"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveWidget(widget.id, 'down')}
                        disabled={pinnedIndex === currentPinned.length - 1}
                        className="p-1 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 disabled:opacity-30 disabled:hover:text-stone-500 rounded transition-colors"
                        title="Move Down in priority"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Pin toggle button */}
                  <button
                    type="button"
                    onClick={() => togglePin(widget.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isPinned
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                        : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700'
                    }`}
                  >
                    {isPinned ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Pinned</span>
                      </>
                    ) : (
                      <>
                        <Pin className="w-3.5 h-3.5" />
                        <span>Pin to Top</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 flex items-center justify-between text-xs">
          <div className="text-stone-500 dark:text-stone-400">
            <span>{currentPinned.length} widget{currentPinned.length === 1 ? '' : 's'} will appear at top</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs transition-colors"
            >
              Save & Apply Pins
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
