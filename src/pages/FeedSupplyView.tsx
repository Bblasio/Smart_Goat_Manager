import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { FeedRecord, MedicationRecord, FeedCategory, MedicationCategory, FeedUnit, MedicationUnit } from '../types';
import {
  Package,
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  Trash2,
  Edit2,
  X,
  Pill,
  Sparkles,
  MapPin,
  Clock,
  ShieldAlert,
  HelpCircle,
  Truck
} from 'lucide-react';

interface FeedSupplyViewProps {
  initialTab?: 'feeds' | 'meds' | 'alerts';
}

export const FeedSupplyView: React.FC<FeedSupplyViewProps> = ({ initialTab = 'feeds' }) => {
  const {
    feeds,
    medications,
    addFeed,
    updateFeed,
    deleteFeed,
    clearAllFeeds,
    consumeFeed,
    restockFeed,
    addMedication,
    updateMedication,
    deleteMedication,
    clearAllMedications,
    consumeMedication,
    restockMedication,
    goats,
  } = useFarm();

  const [activeTab, setActiveTab] = useState<'feeds' | 'meds' | 'alerts'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeedCategory, setSelectedFeedCategory] = useState<string>('All');
  const [selectedMedCategory, setSelectedMedCategory] = useState<string>('All');

  // Delete Confirmation State
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{
    type: 'feed' | 'med';
    id: string;
    name: string;
    unit?: string;
  } | null>(null);
  const [isClearAllFeedsOpen, setIsClearAllFeedsOpen] = useState(false);

  // Modals state
  const [isAddFeedOpen, setIsAddFeedOpen] = useState(false);
  const [isAddMedOpen, setIsAddMedOpen] = useState(false);
  const [editingFeed, setEditingFeed] = useState<FeedRecord | null>(null);
  const [editingMed, setEditingMed] = useState<MedicationRecord | null>(null);

  // Quick Action Modals
  const [usageItem, setUsageItem] = useState<{ type: 'feed' | 'med'; item: FeedRecord | MedicationRecord } | null>(null);
  const [usageAmount, setUsageAmount] = useState<number>(1);
  const [usageNotes, setUsageNotes] = useState<string>('');
  const [usageGoatId, setUsageGoatId] = useState<string>('');

  const [restockItem, setRestockItem] = useState<{ type: 'feed' | 'med'; item: FeedRecord | MedicationRecord } | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(10);
  const [restockCost, setRestockCost] = useState<string>('');

  // Low stock calculations
  const lowStockFeeds = useMemo(() => feeds.filter(f => f.quantity <= f.min_threshold), [feeds]);
  const lowStockMeds = useMemo(() => medications.filter(m => m.quantity <= m.min_threshold), [medications]);
  
  // Expiry calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const expiringMeds = useMemo(() => {
    return medications.filter(m => {
      if (!m.expiry_date) return false;
      const diffMs = new Date(m.expiry_date).getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return diffDays <= 60; // within 60 days
    });
  }, [medications]);

  const totalAlertsCount = lowStockFeeds.length + lowStockMeds.length + expiringMeds.length;

  // Filtered feeds
  const filteredFeeds = useMemo(() => {
    return feeds.filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.supplier && f.supplier.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (f.storage_location && f.storage_location.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCat = selectedFeedCategory === 'All' || f.category === selectedFeedCategory;
      return matchesSearch && matchesCat;
    });
  }, [feeds, searchQuery, selectedFeedCategory]);

  // Filtered meds
  const filteredMeds = useMemo(() => {
    return medications.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.target_diseases && m.target_diseases.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.batch_number && m.batch_number.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCat = selectedMedCategory === 'All' || m.category === selectedMedCategory;
      return matchesSearch && matchesCat;
    });
  }, [medications, searchQuery, selectedMedCategory]);

  // Handle Feed Submit
  const handleSaveFeed = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload: Omit<FeedRecord, 'id'> = {
      name: formData.get('name') as string,
      category: formData.get('category') as FeedCategory,
      quantity: Number(formData.get('quantity')) || 0,
      unit: formData.get('unit') as FeedUnit,
      min_threshold: Number(formData.get('min_threshold')) || 0,
      cost_per_unit: formData.get('cost_per_unit') ? Number(formData.get('cost_per_unit')) : undefined,
      supplier: (formData.get('supplier') as string) || undefined,
      storage_location: (formData.get('storage_location') as string) || undefined,
      expiry_date: (formData.get('expiry_date') as string) || undefined,
      notes: (formData.get('notes') as string) || undefined,
      last_restocked: editingFeed?.last_restocked || new Date().toISOString().split('T')[0],
    };

    if (editingFeed) {
      await updateFeed(editingFeed.id, payload);
      setEditingFeed(null);
    } else {
      await addFeed(payload);
    }
    setIsAddFeedOpen(false);
  };

  // Handle Med Submit
  const handleSaveMed = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload: Omit<MedicationRecord, 'id'> = {
      name: formData.get('name') as string,
      category: formData.get('category') as MedicationCategory,
      quantity: Number(formData.get('quantity')) || 0,
      unit: formData.get('unit') as MedicationUnit,
      min_threshold: Number(formData.get('min_threshold')) || 0,
      batch_number: (formData.get('batch_number') as string) || undefined,
      expiry_date: formData.get('expiry_date') as string,
      target_diseases: (formData.get('target_diseases') as string) || undefined,
      withdrawal_period_days: formData.get('withdrawal_period_days') ? Number(formData.get('withdrawal_period_days')) : 0,
      storage_requirements: (formData.get('storage_requirements') as string) || undefined,
      supplier: (formData.get('supplier') as string) || undefined,
      notes: (formData.get('notes') as string) || undefined,
      last_restocked: editingMed?.last_restocked || new Date().toISOString().split('T')[0],
    };

    if (editingMed) {
      await updateMedication(editingMed.id, payload);
      setEditingMed(null);
    } else {
      await addMedication(payload);
    }
    setIsAddMedOpen(false);
  };

  // Usage confirmation
  const handleConfirmUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usageItem || usageAmount <= 0) return;

    if (usageItem.type === 'feed') {
      await consumeFeed(usageItem.item.id, usageAmount, usageNotes);
    } else {
      await consumeMedication(usageItem.item.id, usageAmount, usageGoatId || undefined, usageNotes);
    }
    setUsageItem(null);
    setUsageAmount(1);
    setUsageNotes('');
    setUsageGoatId('');
  };

  // Restock confirmation
  const handleConfirmRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem || restockAmount <= 0) return;

    if (restockItem.type === 'feed') {
      const cost = restockCost ? Number(restockCost) : undefined;
      await restockFeed(restockItem.item.id, restockAmount, cost);
    } else {
      await restockMedication(restockItem.item.id, restockAmount);
    }
    setRestockItem(null);
    setRestockAmount(10);
    setRestockCost('');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-xl">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                Feed & Supply Management
              </h1>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Track feed stockpiles, mineral supplements, and veterinary medicines with automated low-stock warnings.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-add-feed-stock"
            onClick={() => {
              setEditingFeed(null);
              setIsAddFeedOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Feed Stock</span>
          </button>
          <button
            id="btn-add-medication"
            onClick={() => {
              setEditingMed(null);
              setIsAddMedOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-xs transition-colors"
          >
            <Pill className="w-4 h-4" />
            <span>Add Medication</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-stone-900 p-5 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Feed Inventory
            </span>
            <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              {feeds.length}
            </span>
            <span className="text-xs text-stone-500">items stocked</span>
          </div>
          <div className="mt-2 text-xs text-stone-500">
            {lowStockFeeds.length > 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                {lowStockFeeds.length} items below safety threshold
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">All feed reserves safe</span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Veterinary Medicine
            </span>
            <span className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Pill className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              {medications.length}
            </span>
            <span className="text-xs text-stone-500">pharmaceuticals</span>
          </div>
          <div className="mt-2 text-xs text-stone-500">
            {lowStockMeds.length > 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                {lowStockMeds.length} vials/packs low in cabinet
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Vet cabinet well-provisioned</span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Low Stock Warnings
            </span>
            <span className={`p-2 rounded-lg ${
              totalAlertsCount > 0
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${
              totalAlertsCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-stone-900 dark:text-stone-100'
            }`}>
              {lowStockFeeds.length + lowStockMeds.length}
            </span>
            <span className="text-xs text-stone-500">items need reordering</span>
          </div>
          <div className="mt-2 text-xs text-stone-500">
            Click alerts tab for direct purchase links
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Expiring Supplies
            </span>
            <span className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              {expiringMeds.length}
            </span>
            <span className="text-xs text-stone-500">within 60 days</span>
          </div>
          <div className="mt-2 text-xs text-stone-500">
            {expiringMeds.length > 0 ? 'Prioritize before shelf expiry' : 'Zero expired medications'}
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center p-1 bg-stone-100 dark:bg-stone-800 rounded-xl w-full sm:w-auto">
            <button
              id="tab-feeds"
              onClick={() => setActiveTab('feeds')}
              className={`flex-1 sm:flex-initial px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'feeds'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Feed & Forage</span>
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-stone-200 dark:bg-stone-600 text-stone-700 dark:text-stone-300">
                {feeds.length}
              </span>
            </button>

            <button
              id="tab-meds"
              onClick={() => setActiveTab('meds')}
              className={`flex-1 sm:flex-initial px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'meds'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              <Pill className="w-4 h-4" />
              <span>Veterinary Medicines</span>
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-stone-200 dark:bg-stone-600 text-stone-700 dark:text-stone-300">
                {medications.length}
              </span>
            </button>

            <button
              id="tab-alerts"
              onClick={() => setActiveTab('alerts')}
              className={`flex-1 sm:flex-initial px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'alerts'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Low-Stock Alerts</span>
              {totalAlertsCount > 0 && (
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-amber-500 text-white font-bold animate-pulse">
                  {totalAlertsCount}
                </span>
              )}
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              id="input-supply-search"
              placeholder="Search items, ingredients, suppliers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-900 dark:text-stone-100"
            />
          </div>
        </div>

        {/* Category Filters */}
        {activeTab === 'feeds' && (
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-stone-500 font-medium whitespace-nowrap">Filter category:</span>
              {['All', 'Fodder & Hay', 'Concentrate', 'Mineral & Salt', 'Silage', 'Supplement'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedFeedCategory(cat)}
                  className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedFeedCategory === cat
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {feeds.length > 0 && (
              <button
                type="button"
                id="btn-clear-all-feeds"
                onClick={() => setIsClearAllFeedsOpen(true)}
                className="ml-auto text-xs text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="Clear all feeds"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Feeds</span>
              </button>
            )}
          </div>
        )}

        {activeTab === 'meds' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-stone-500 font-medium whitespace-nowrap">Filter category:</span>
            {['All', 'Dewormer', 'Antibiotic', 'Vaccine', 'Vitamin & Mineral', 'Antiseptic', 'Pain Relief'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedMedCategory(cat)}
                className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedMedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab 1: Feeds Content */}
      {activeTab === 'feeds' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFeeds.map(feed => {
            const isLow = feed.quantity <= feed.min_threshold;
            const stockPct = Math.min(100, Math.round((feed.quantity / (feed.min_threshold * 2)) * 100));

            return (
              <div
                key={feed.id}
                className={`bg-white dark:bg-stone-900 rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                  isLow
                    ? 'border-amber-300 dark:border-amber-900/60 ring-1 ring-amber-400/30'
                    : 'border-stone-200 dark:border-stone-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                      {feed.category}
                    </span>
                    {isLow ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        <AlertTriangle className="w-3 h-3" />
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" />
                        In Stock
                      </span>
                    )}
                  </div>

                  <h3 className="mt-2 text-base font-bold text-stone-900 dark:text-stone-100">
                    {feed.name}
                  </h3>

                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="text-3xl font-extrabold text-stone-900 dark:text-stone-100">
                        {feed.quantity}
                      </span>
                      <span className="ml-1 text-sm font-medium text-stone-500">
                        {feed.unit}
                      </span>
                    </div>
                    <div className="text-right text-xs text-stone-400">
                      <span>Min Alert: </span>
                      <span className="font-semibold text-stone-700 dark:text-stone-300">
                        {feed.min_threshold} {feed.unit}
                      </span>
                    </div>
                  </div>

                  {/* Stock progress bar */}
                  <div className="mt-2 w-full bg-stone-100 dark:bg-stone-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isLow ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(5, stockPct)}%` }}
                    />
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-stone-500">
                    {feed.storage_location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">{feed.storage_location}</span>
                      </div>
                    )}
                    {feed.supplier && (
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">Supplier: {feed.supplier}</span>
                      </div>
                    )}
                    {feed.cost_per_unit && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-stone-700 dark:text-stone-300">
                          ${feed.cost_per_unit.toFixed(2)}
                        </span>
                        <span>per {feed.unit}</span>
                      </div>
                    )}
                  </div>

                  {feed.notes && (
                    <p className="mt-3 text-xs text-stone-500 dark:text-stone-400 italic bg-stone-50 dark:bg-stone-800/40 p-2 rounded-lg">
                      "{feed.notes}"
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      id={`btn-feed-use-${feed.id}`}
                      onClick={() => setUsageItem({ type: 'feed', item: feed })}
                      className="px-2.5 py-1.5 text-xs font-medium bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-lg flex items-center gap-1 transition-colors"
                      title="Log Feed Usage"
                    >
                      <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                      <span>Use</span>
                    </button>
                    <button
                      id={`btn-feed-restock-${feed.id}`}
                      onClick={() => {
                        setRestockItem({ type: 'feed', item: feed });
                        setRestockCost(feed.cost_per_unit ? String(feed.cost_per_unit) : '');
                      }}
                      className="px-2.5 py-1.5 text-xs font-medium bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 rounded-lg flex items-center gap-1 transition-colors"
                      title="Restock Feed"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Restock</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      id={`btn-feed-edit-${feed.id}`}
                      onClick={() => {
                        setEditingFeed(feed);
                        setIsAddFeedOpen(true);
                      }}
                      className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg transition-colors"
                      title="Edit item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`btn-feed-delete-${feed.id}`}
                      onClick={() => {
                        setDeleteConfirmItem({
                          type: 'feed',
                          id: feed.id,
                          name: feed.name,
                          unit: feed.unit,
                        });
                      }}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Delete item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredFeeds.length === 0 && (
            <div className="col-span-full py-16 px-6 text-center bg-white dark:bg-stone-900 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-3">
                <Package className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                {feeds.length === 0 ? 'No Feed Stock Records Yet' : 'No Matching Feed Stocks'}
              </h3>
              <p className="mt-1.5 text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                {feeds.length === 0
                  ? "Feed inventory is not predefined. Enter your farm's own hay, grains, concentrate pellets, silage, or supplements below."
                  : 'Try adjusting your search keywords or category filters.'}
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                {feeds.length === 0 ? (
                  <button
                    id="btn-add-first-feed-stock"
                    onClick={() => {
                      setEditingFeed(null);
                      setIsAddFeedOpen(true);
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add First Feed Item</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedFeedCategory('All');
                    }}
                    className="px-4 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Medications Content */}
      {activeTab === 'meds' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMeds.map(med => {
            const isLow = med.quantity <= med.min_threshold;
            const expiryDate = new Date(med.expiry_date);
            const isExpired = expiryDate.getTime() < Date.now();
            const daysToExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const isExpiringSoon = daysToExpiry > 0 && daysToExpiry <= 60;

            return (
              <div
                key={med.id}
                className={`bg-white dark:bg-stone-900 rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                  isExpired
                    ? 'border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-500/30'
                    : isLow
                    ? 'border-amber-300 dark:border-amber-900/60 ring-1 ring-amber-400/30'
                    : 'border-stone-200 dark:border-stone-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                      {med.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isExpired ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300">
                          <ShieldAlert className="w-3 h-3" />
                          Expired
                        </span>
                      ) : isExpiringSoon ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                          <Clock className="w-3 h-3" />
                          Exp in {daysToExpiry}d
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                          <AlertTriangle className="w-3 h-3" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          Stocked
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="mt-2 text-base font-bold text-stone-900 dark:text-stone-100">
                    {med.name}
                  </h3>

                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="text-3xl font-extrabold text-stone-900 dark:text-stone-100">
                        {med.quantity}
                      </span>
                      <span className="ml-1 text-sm font-medium text-stone-500">
                        {med.unit}
                      </span>
                    </div>
                    <div className="text-right text-xs text-stone-400">
                      <span>Safety Min: </span>
                      <span className="font-semibold text-stone-700 dark:text-stone-300">
                        {med.min_threshold} {med.unit}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-stone-500">
                    {med.batch_number && (
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400">Batch Code:</span>
                        <span className="font-mono font-medium text-stone-700 dark:text-stone-300">
                          {med.batch_number}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400">Expiry Date:</span>
                      <span className={`font-semibold ${isExpired ? 'text-rose-600' : isExpiringSoon ? 'text-amber-600' : 'text-stone-700 dark:text-stone-300'}`}>
                        {med.expiry_date}
                      </span>
                    </div>
                    {med.withdrawal_period_days !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400">Withdrawal Period:</span>
                        <span className="font-medium text-amber-700 dark:text-amber-400">
                          {med.withdrawal_period_days > 0 ? `${med.withdrawal_period_days} days` : '0 days (None)'}
                        </span>
                      </div>
                    )}
                    {med.target_diseases && (
                      <div className="pt-1">
                        <span className="text-stone-400 block mb-0.5">Indications:</span>
                        <span className="text-stone-700 dark:text-stone-300 line-clamp-2">
                          {med.target_diseases}
                        </span>
                      </div>
                    )}
                    {med.storage_requirements && (
                      <div className="flex items-center gap-1.5 pt-1 text-stone-500">
                        <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">{med.storage_requirements}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      id={`btn-med-administer-${med.id}`}
                      onClick={() => setUsageItem({ type: 'med', item: med })}
                      className="px-2.5 py-1.5 text-xs font-medium bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 rounded-lg flex items-center gap-1 transition-colors"
                      title="Administer Dose"
                    >
                      <Pill className="w-3.5 h-3.5" />
                      <span>Administer</span>
                    </button>
                    <button
                      id={`btn-med-restock-${med.id}`}
                      onClick={() => setRestockItem({ type: 'med', item: med })}
                      className="px-2.5 py-1.5 text-xs font-medium bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-lg flex items-center gap-1 transition-colors"
                      title="Restock vials"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Restock</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      id={`btn-med-edit-${med.id}`}
                      onClick={() => {
                        setEditingMed(med);
                        setIsAddMedOpen(true);
                      }}
                      className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`btn-med-delete-${med.id}`}
                      onClick={() => {
                        setDeleteConfirmItem({
                          type: 'med',
                          id: med.id,
                          name: med.name,
                          unit: med.unit,
                        });
                      }}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Delete medication"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredMeds.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white dark:bg-stone-900 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700">
              <Pill className="w-10 h-10 mx-auto text-stone-400" />
              <p className="mt-2 text-base font-semibold text-stone-700 dark:text-stone-300">
                No medication records found
              </p>
              <p className="text-sm text-stone-500">
                Track dewormers, antibiotics, CD/T vaccines, and antiseptic sprays.
              </p>
              <button
                onClick={() => setIsAddMedOpen(true)}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
              >
                + Add Medication
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Alerts & Low-Stock Focus */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {totalAlertsCount === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-8 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-stone-900 dark:text-stone-100">
                All Farm Supplies are Adequately Stocked
              </h2>
              <p className="mt-1 text-sm text-stone-500 max-w-md mx-auto">
                No feed reserves or veterinary medicines are currently below their minimum safety thresholds or expiring within 60 days.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Low stock feeds */}
              {lowStockFeeds.length > 0 && (
                <div className="bg-white dark:bg-stone-900 rounded-2xl border border-amber-200 dark:border-amber-900/60 p-5 shadow-xs">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                      Low Feed & Forage Reserves ({lowStockFeeds.length})
                    </h3>
                  </div>

                  <div className="divide-y divide-stone-100 dark:divide-stone-800">
                    {lowStockFeeds.map(feed => (
                      <div key={feed.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-stone-900 dark:text-stone-100">
                              {feed.name}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600">
                              {feed.category}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-stone-500 flex items-center gap-3">
                            <span>Current: <strong className="text-amber-600">{feed.quantity} {feed.unit}</strong></span>
                            <span>Min Safe: {feed.min_threshold} {feed.unit}</span>
                            {feed.supplier && <span>Supplier: {feed.supplier}</span>}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setRestockItem({ type: 'feed', item: feed });
                            setRestockCost(feed.cost_per_unit ? String(feed.cost_per_unit) : '');
                          }}
                          className="self-start sm:self-center px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>Restock Now</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Low stock meds */}
              {lowStockMeds.length > 0 && (
                <div className="bg-white dark:bg-stone-900 rounded-2xl border border-blue-200 dark:border-blue-900/60 p-5 shadow-xs">
                  <div className="flex items-center gap-2 mb-4">
                    <Pill className="w-5 h-5 text-blue-600" />
                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                      Low Veterinary Medication Stocks ({lowStockMeds.length})
                    </h3>
                  </div>

                  <div className="divide-y divide-stone-100 dark:divide-stone-800">
                    {lowStockMeds.map(med => (
                      <div key={med.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-stone-900 dark:text-stone-100">
                              {med.name}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700">
                              {med.category}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-stone-500 flex items-center gap-3">
                            <span>Remaining: <strong className="text-rose-600">{med.quantity} {med.unit}</strong></span>
                            <span>Min Threshold: {med.min_threshold} {med.unit}</span>
                            <span>Expiry: {med.expiry_date}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => setRestockItem({ type: 'med', item: med })}
                          className="self-start sm:self-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>Restock Cabinet</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expiring meds */}
              {expiringMeds.length > 0 && (
                <div className="bg-white dark:bg-stone-900 rounded-2xl border border-purple-200 dark:border-purple-900/60 p-5 shadow-xs">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                      Pharmaceuticals Expiring Soon ({expiringMeds.length})
                    </h3>
                  </div>

                  <div className="divide-y divide-stone-100 dark:divide-stone-800">
                    {expiringMeds.map(med => (
                      <div key={med.id} className="py-3 flex items-center justify-between gap-3">
                        <div>
                          <span className="font-semibold text-stone-900 dark:text-stone-100">
                            {med.name}
                          </span>
                          <p className="text-xs text-stone-500">
                            Expires on <strong className="text-purple-600">{med.expiry_date}</strong>. Batch: {med.batch_number || 'N/A'}. Quantity: {med.quantity} {med.unit}.
                          </p>
                        </div>
                        <span className="text-xs px-2.5 py-1 bg-purple-50 dark:bg-purple-950 text-purple-700 rounded-lg font-medium">
                          Use or Replace
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Feed Modal */}
      {isAddFeedOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <span>{editingFeed ? 'Edit Feed Record' : 'Add Feed Stock'}</span>
              </h2>
              <button
                onClick={() => setIsAddFeedOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFeed} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Feed / Forage Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingFeed?.name || ''}
                  placeholder="e.g., Alfalfa Hay Bales, Dairy Goat Pellets 16%"
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Category *
                  </label>
                  <select
                    name="category"
                    required
                    defaultValue={editingFeed?.category || 'Fodder & Hay'}
                    className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                  >
                    <option value="Fodder & Hay">Fodder & Hay</option>
                    <option value="Concentrate">Concentrate</option>
                    <option value="Mineral & Salt">Mineral & Salt</option>
                    <option value="Silage">Silage</option>
                    <option value="Supplement">Supplement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Unit of Measurement *
                  </label>
                  <select
                    name="unit"
                    required
                    defaultValue={editingFeed?.unit || 'bales'}
                    className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                  >
                    <option value="bales">bales</option>
                    <option value="bags">bags</option>
                    <option value="kg">kg</option>
                    <option value="tons">tons</option>
                    <option value="blocks">blocks</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Current Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    step="any"
                    required
                    defaultValue={editingFeed ? editingFeed.quantity : ''}
                    placeholder="e.g. 50"
                    className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Low-Stock Alert Level *
                  </label>
                  <input
                    type="number"
                    name="min_threshold"
                    step="any"
                    required
                    defaultValue={editingFeed ? editingFeed.min_threshold : ''}
                    placeholder="e.g. 10"
                    className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Cost per Unit ($)
                  </label>
                  <input
                    type="number"
                    name="cost_per_unit"
                    step="0.01"
                    defaultValue={editingFeed?.cost_per_unit || ''}
                    placeholder="e.g. 8.50"
                    className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Storage Location
                  </label>
                  <input
                    type="text"
                    name="storage_location"
                    defaultValue={editingFeed?.storage_location || ''}
                    placeholder="e.g. Barn Shed A, Silo 1"
                    className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Supplier Name
                </label>
                <input
                  type="text"
                  name="supplier"
                  defaultValue={editingFeed?.supplier || ''}
                  placeholder="e.g. Rift Valley Forages Ltd"
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Notes & Nutrient Specifications
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingFeed?.notes || ''}
                  placeholder="e.g., 18% crude protein, fed twice daily to lactation group"
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddFeedOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                >
                  {editingFeed ? 'Update Feed' : 'Save Feed Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Medication Modal */}
      {isAddMedOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 w-full max-w-lg rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Pill className="w-5 h-5 text-blue-600" />
                <span>{editingMed ? 'Edit Medication Record' : 'Add Veterinary Medication'}</span>
              </h2>
              <button
                onClick={() => setIsAddMedOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMed} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Medication Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingMed?.name || ''}
                  placeholder="e.g., Albendazole 10%, Oxytetracycline 20%, CD/T Vaccine"
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Category *
                  </label>
                  <select
                    name="category"
                    required
                    defaultValue={editingMed?.category || 'Dewormer'}
                    className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                  >
                    <option value="Dewormer">Dewormer</option>
                    <option value="Antibiotic">Antibiotic</option>
                    <option value="Vaccine">Vaccine</option>
                    <option value="Vitamin & Mineral">Vitamin & Mineral</option>
                    <option value="Antiseptic">Antiseptic</option>
                    <option value="Pain Relief">Pain Relief</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Unit *
                  </label>
                  <select
                    name="unit"
                    required
                    defaultValue={editingMed?.unit || 'vials'}
                    className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                  >
                    <option value="vials">vials</option>
                    <option value="bottles">bottles</option>
                    <option value="ml">ml</option>
                    <option value="doses">doses</option>
                    <option value="tubes">tubes</option>
                    <option value="bolus">bolus</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Quantity Stocked *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    required
                    defaultValue={editingMed ? editingMed.quantity : ''}
                    placeholder="e.g. 10"
                    className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Low-Stock Alert Level *
                  </label>
                  <input
                    type="number"
                    name="min_threshold"
                    required
                    defaultValue={editingMed ? editingMed.min_threshold : ''}
                    placeholder="e.g. 2"
                    className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    name="expiry_date"
                    required
                    defaultValue={editingMed?.expiry_date || '2027-06-30'}
                    className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Withdrawal Period (Days)
                  </label>
                  <input
                    type="number"
                    name="withdrawal_period_days"
                    defaultValue={editingMed?.withdrawal_period_days ?? 14}
                    placeholder="0 if none"
                    className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Batch Code
                  </label>
                  <input
                    type="text"
                    name="batch_number"
                    defaultValue={editingMed?.batch_number || ''}
                    placeholder="e.g. BATCH-2026-X"
                    className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Storage Requirement
                  </label>
                  <input
                    type="text"
                    name="storage_requirements"
                    defaultValue={editingMed?.storage_requirements || ''}
                    placeholder="e.g. Refrigerate 2-8°C, Cool Dark Cabinet"
                    className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Indications / Target Conditions
                </label>
                <input
                  type="text"
                  name="target_diseases"
                  defaultValue={editingMed?.target_diseases || ''}
                  placeholder="e.g. Barber pole worm, Pneumonia, Mastitis, Foot rot"
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMedOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
                >
                  {editingMed ? 'Update Medication' : 'Save Medication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Usage / Administer Modal */}
      {usageItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 w-full max-w-md rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <ArrowDownRight className="w-5 h-5 text-rose-500" />
                <span>Log {usageItem.type === 'feed' ? 'Feed Consumption' : 'Dose Administration'}</span>
              </h2>
              <button
                onClick={() => setUsageItem(null)}
                className="p-1 text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmUsage} className="mt-4 space-y-4">
              <p className="text-xs text-stone-500">
                Item: <strong className="text-stone-800 dark:text-stone-200">{usageItem.item.name}</strong>
                <br />
                Currently in stock: <strong>{usageItem.item.quantity} {usageItem.item.unit}</strong>
              </p>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Amount to Deduct ({usageItem.item.unit}) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  max={usageItem.item.quantity}
                  required
                  value={usageAmount}
                  onChange={e => setUsageAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                />
              </div>

              {usageItem.type === 'med' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Recipient Goat (Optional)
                  </label>
                  <select
                    value={usageGoatId}
                    onChange={e => setUsageGoatId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                  >
                    <option value="">-- General Herd Treatment --</option>
                    {goats.map(g => (
                      <option key={g.id} value={g.tag_number}>
                        {g.tag_number} ({g.name || g.breed})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Usage Notes / Purpose
                </label>
                <input
                  type="text"
                  value={usageNotes}
                  onChange={e => setUsageNotes(e.target.value)}
                  placeholder="e.g., Morning paddock feeding, deworming batch"
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUsageItem(null)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
                >
                  Confirm & Deduct Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Restock Modal */}
      {restockItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 w-full max-w-md rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                <span>Restock {restockItem.item.name}</span>
              </h2>
              <button
                onClick={() => setRestockItem(null)}
                className="p-1 text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmRestock} className="mt-4 space-y-4">
              <p className="text-xs text-stone-500">
                Currently in stock: <strong>{restockItem.item.quantity} {restockItem.item.unit}</strong>
              </p>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Quantity to Add ({restockItem.item.unit}) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  required
                  value={restockAmount}
                  onChange={e => setRestockAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                />
              </div>

              {restockItem.type === 'feed' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Cost per Unit ($) - Auto-records Farm Expense
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={restockCost}
                    onChange={e => setRestockCost(e.target.value)}
                    placeholder="e.g. 8.50"
                    className="w-full px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl"
                  />
                  {restockCost && Number(restockCost) > 0 && (
                    <p className="mt-1 text-xs text-emerald-600 font-medium">
                      Will add ${Math.round(restockAmount * Number(restockCost))} to farm financial expenses.
                    </p>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRestockItem(null)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
                >
                  Confirm Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 w-full max-w-sm rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-center text-stone-900 dark:text-stone-100">
              Delete {deleteConfirmItem.type === 'feed' ? 'Feed Record' : 'Medication'}?
            </h3>
            <p className="mt-2 text-xs text-center text-stone-500 dark:text-stone-400">
              Are you sure you want to delete <strong className="text-stone-800 dark:text-stone-200">{deleteConfirmItem.name}</strong>? This item will be permanently removed from your inventory and cloud database.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="flex-1 px-4 py-2 text-xs font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-item"
                onClick={() => {
                  if (deleteConfirmItem.type === 'feed') {
                    deleteFeed(deleteConfirmItem.id);
                  } else {
                    deleteMedication(deleteConfirmItem.id);
                  }
                  setDeleteConfirmItem(null);
                }}
                className="flex-1 px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Feeds Modal */}
      {isClearAllFeedsOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 w-full max-w-sm rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-center text-stone-900 dark:text-stone-100">
              Clear All Feed Records?
            </h3>
            <p className="mt-2 text-xs text-center text-stone-500 dark:text-stone-400">
              This will remove all {feeds.length} feed and forage records from your inventory so you can start with a fresh, empty list.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsClearAllFeedsOpen(false)}
                className="flex-1 px-4 py-2 text-xs font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-clear-all"
                onClick={() => {
                  clearAllFeeds();
                  setIsClearAllFeedsOpen(false);
                }}
                className="flex-1 px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
