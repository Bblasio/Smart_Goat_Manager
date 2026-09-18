import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { RecordType, AppView } from '../types';
import {
  Trash2,
  Plus,
  Search,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  HeartPulse,
  Baby,
  Users,
  Download,
  Milk,
  ExternalLink,
  ChevronRight,
  FileSpreadsheet,
  Upload,
  X,
  Filter,
  Tag
} from 'lucide-react';
import { ExcelImportModal } from '../components/ExcelImportModal';

interface RecordsViewProps {
  onOpenAddModal: (type?: RecordType) => void;
  onNavigate?: (view: AppView) => void;
}

export const RecordsView: React.FC<RecordsViewProps> = ({ onOpenAddModal, onNavigate }) => {
  const {
    goats,
    deleteGoat,
    breeding,
    deleteBreeding,
    health,
    deleteHealth,
    sales,
    deleteSale,
    workers,
    deleteWorker,
    milk,
    deleteMilk,
  } = useFarm();

  const [activeTab, setActiveTab] = useState<
    'goats' | 'breeding' | 'health' | 'milk' | 'sales' | 'workers' | 'advisor'
  >('goats');
  const [searchQuery, setSearchQuery] = useState('');
  const [goatStatusFilter, setGoatStatusFilter] = useState<'all' | 'Active' | 'Pregnant' | 'Quarantine' | 'Sold'>('all');
  const [healthStatusFilter, setHealthStatusFilter] = useState<'all' | 'Healthy' | 'Under Treatment' | 'Critical' | 'Pregnancy Check'>('all');
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  const today = new Date();
  const dueSoon = breeding.filter(b => {
    if (!b.expected_birth) return false;
    const exp = new Date(b.expected_birth);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  const sickGoats = health.filter(
    h =>
      h.condition.toLowerCase().includes('sick') ||
      h.condition.toLowerCase().includes('weak') ||
      h.condition.toLowerCase().includes('fever') ||
      h.status === 'Under Treatment' ||
      h.status === 'Critical'
  );

  const totalSalesRevenue = sales.reduce((sum, s) => sum + (s.price || 0), 0);

  // Map goats by tag for quick name and detail lookup
  const goatMap = new Map(goats.map(g => [g.tag_number.toUpperCase(), g]));

  // Search & Status filters
  const filteredGoats = goats.filter(g => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      g.tag_number.toLowerCase().includes(q) ||
      (g.name && g.name.toLowerCase().includes(q)) ||
      (g.status && g.status.toLowerCase().includes(q)) ||
      g.breed.toLowerCase().includes(q) ||
      g.gender.toLowerCase().includes(q);

    const matchesStatus =
      goatStatusFilter === 'all' ||
      (g.status && g.status.toLowerCase() === goatStatusFilter.toLowerCase());

    return matchesSearch && matchesStatus;
  });

  const filteredBreeding = breeding.filter(b => {
    const q = searchQuery.trim().toLowerCase();
    const female = goatMap.get(b.female_id.toUpperCase());
    const male = goatMap.get(b.male_id.toUpperCase());
    return (
      !q ||
      b.female_id.toLowerCase().includes(q) ||
      b.male_id.toLowerCase().includes(q) ||
      (female?.name && female.name.toLowerCase().includes(q)) ||
      (male?.name && male.name.toLowerCase().includes(q)) ||
      (b.status && b.status.toLowerCase().includes(q))
    );
  });

  const filteredHealth = health.filter(h => {
    const q = searchQuery.trim().toLowerCase();
    const matchedGoat = goatMap.get(h.goat_id.toUpperCase());
    const goatName = matchedGoat?.name || '';

    const matchesSearch =
      !q ||
      h.goat_id.toLowerCase().includes(q) ||
      goatName.toLowerCase().includes(q) ||
      (h.status && h.status.toLowerCase().includes(q)) ||
      h.condition.toLowerCase().includes(q) ||
      h.treatment.toLowerCase().includes(q) ||
      (h.checkup_type && h.checkup_type.toLowerCase().includes(q)) ||
      (h.vet_name && h.vet_name.toLowerCase().includes(q)) ||
      (h.is_pregnant && 'pregnant'.includes(q));

    const matchesStatus =
      healthStatusFilter === 'all' ||
      (healthStatusFilter === 'Healthy' && (h.status === 'Healthy' || h.condition.toLowerCase().includes('healthy') || h.condition.toLowerCase().includes('good'))) ||
      (healthStatusFilter === 'Under Treatment' && (h.status === 'Under Treatment' || h.condition.toLowerCase().includes('sick') || h.condition.toLowerCase().includes('weak') || h.condition.toLowerCase().includes('fever'))) ||
      (healthStatusFilter === 'Pregnancy Check' && (h.checkup_type === 'Pregnancy Check' || h.is_pregnant)) ||
      (healthStatusFilter === 'Critical' && (h.status === 'Critical' || h.condition.toLowerCase().includes('critical')));

    return matchesSearch && matchesStatus;
  });

  const filteredMilk = milk.filter(
    m =>
      m.goat_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.date.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSales = sales.filter(
    s =>
      s.goat_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.buyer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredWorkers = workers.filter(
    w =>
      w.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // CSV Export utility
  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers
          .map(fieldName => {
            const val = row[fieldName] !== undefined && row[fieldName] !== null ? row[fieldName] : '';
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <span>🐐 Herd & Farm Records</span>
          </h2>
          <p className="text-stone-500 text-sm mt-1">
            Maintain accurate records for herd identity, breeding schedules, medical interventions, milk production, and staff.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'breeding' && onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('breeding_estimator')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              <Baby className="w-4 h-4 text-emerald-600" />
              <span>Breeding Estimator</span>
            </button>
          )}

          <button
            type="button"
            id="btn-open-excel-import"
            onClick={() => setIsExcelModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold transition-colors shadow-xs"
            title="Import Excel spreadsheet document (.xlsx, .xls, .csv)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Upload Excel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeTab === 'goats') exportToCSV(goats, 'goats-registry');
              if (activeTab === 'breeding') exportToCSV(breeding, 'breeding-schedule');
              if (activeTab === 'health') exportToCSV(health, 'health-records');
              if (activeTab === 'milk') exportToCSV(milk, 'milk-yield');
              if (activeTab === 'sales') exportToCSV(sales, 'sales-ledger');
              if (activeTab === 'workers') exportToCSV(workers, 'farm-staff');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-xl text-xs font-semibold transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            <span>Export CSV</span>
          </button>

          <button
            id="btn-records-add-entry"
            onClick={() => onOpenAddModal(activeTab === 'advisor' ? 'goat' : (activeTab as RecordType))}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Traditional Farm Digital Transition Notice */}
      <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-700 flex items-center justify-center text-amber-800 dark:text-amber-300 shrink-0 mt-0.5">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
              Transitioning from Traditional Paper or Spreadsheet Books?
            </h4>
            <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5 leading-relaxed">
              If your farm currently tracks goats, mating dates, treatments, or milk in notebooks or Excel, you can upload your document directly (.xlsx, .xls, .csv) to auto-populate your herd ledger.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsExcelModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs shrink-0"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Spreadsheet</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-col gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {([
            { id: 'goats', label: 'Goats', count: goats.length },
            { id: 'breeding', label: 'Breeding', count: breeding.length },
            { id: 'health', label: 'Health', count: health.length },
            { id: 'milk', label: 'Milk Yield', count: milk.length },
            { id: 'sales', label: 'Sales', count: sales.length },
            { id: 'workers', label: 'Workers', count: workers.length },
            { id: 'advisor', label: 'Farm Insights' },
          ] as { id: string; label: string; count?: number; badge?: string }[]).map(tab => (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-emerald-800 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === tab.id ? 'bg-emerald-800 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Dedicated Search & Filter Bar */}
        {activeTab !== 'advisor' && (
          <div className="flex flex-col gap-2.5 bg-stone-50/80 dark:bg-stone-900/80 p-3 rounded-2xl border border-stone-200 dark:border-stone-800">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-record-search"
                  type="text"
                  placeholder={
                    activeTab === 'goats'
                      ? 'Filter goats by ear tag (e.g. GT-101), name (Apollo), breed, or status (Active, Pregnant, Quarantine)...'
                      : activeTab === 'health'
                      ? 'Filter health records by ear tag (e.g. GT-103), goat name (Nala), or status (Healthy, Under Treatment)...'
                      : `Filter ${activeTab} records by keyword or tag...`
                  }
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    id="btn-clear-search"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full hover:bg-stone-100 dark:hover:bg-stone-700"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  id="btn-export-csv"
                  onClick={() => {
                    if (activeTab === 'goats') exportToCSV(filteredGoats, 'goats-records.csv');
                    else if (activeTab === 'health') exportToCSV(filteredHealth, 'health-records.csv');
                    else if (activeTab === 'breeding') exportToCSV(filteredBreeding, 'breeding-records.csv');
                    else if (activeTab === 'milk') exportToCSV(filteredMilk, 'milk-records.csv');
                    else if (activeTab === 'sales') exportToCSV(filteredSales, 'sales-records.csv');
                    else if (activeTab === 'workers') exportToCSV(filteredWorkers, 'workers-records.csv');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold rounded-xl transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Quick Status Filter Pills for Goats */}
            {activeTab === 'goats' && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1 mr-1">
                    <Filter className="w-3 h-3 text-stone-400" />
                    Status:
                  </span>
                  {[
                    { id: 'all', label: 'All Goats', count: goats.length },
                    { id: 'Active', label: 'Active', count: goats.filter(g => (g.status || 'Active') === 'Active').length },
                    { id: 'Pregnant', label: 'Pregnant', count: goats.filter(g => g.status === 'Pregnant').length },
                    { id: 'Quarantine', label: 'Quarantine', count: goats.filter(g => g.status === 'Quarantine').length },
                    { id: 'Sold', label: 'Sold', count: goats.filter(g => g.status === 'Sold').length },
                  ].map(pill => (
                    <button
                      key={pill.id}
                      id={`pill-goat-status-${pill.id}`}
                      onClick={() => setGoatStatusFilter(pill.id as any)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        goatStatusFilter === pill.id
                          ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                          : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      <span>{pill.label}</span>
                      <span
                        className={`text-[10px] px-1 rounded-full ${
                          goatStatusFilter === pill.id
                            ? 'bg-emerald-800 text-white'
                            : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                        }`}
                      >
                        {pill.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                  <span>
                    Showing <strong className="text-stone-800 dark:text-stone-200">{filteredGoats.length}</strong> of{' '}
                    <strong className="text-stone-800 dark:text-stone-200">{goats.length}</strong> goats
                  </span>
                  {(searchQuery || goatStatusFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setGoatStatusFilter('all');
                      }}
                      className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-medium"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Quick Status Filter Pills for Health */}
            {activeTab === 'health' && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1 mr-1">
                    <Filter className="w-3 h-3 text-stone-400" />
                    Status:
                  </span>
                  {[
                    { id: 'all', label: 'All Records', count: health.length },
                    {
                      id: 'Healthy',
                      label: 'Healthy',
                      count: health.filter(h => h.status === 'Healthy' || h.condition.toLowerCase().includes('healthy') || h.condition.toLowerCase().includes('good')).length
                    },
                    {
                      id: 'Under Treatment',
                      label: 'Under Treatment / Sick',
                      count: health.filter(h => h.status === 'Under Treatment' || h.condition.toLowerCase().includes('sick') || h.condition.toLowerCase().includes('fever')).length
                    },
                    {
                      id: 'Pregnancy Check',
                      label: 'Pregnancy / Ultrasound',
                      count: health.filter(h => h.checkup_type === 'Pregnancy Check' || h.is_pregnant).length
                    },
                    {
                      id: 'Critical',
                      label: 'Critical',
                      count: health.filter(h => h.status === 'Critical' || h.condition.toLowerCase().includes('critical')).length
                    },
                  ].map(pill => (
                    <button
                      key={pill.id}
                      id={`pill-health-status-${pill.id.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => setHealthStatusFilter(pill.id as any)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        healthStatusFilter === pill.id
                          ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                          : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      <span>{pill.label}</span>
                      <span
                        className={`text-[10px] px-1 rounded-full ${
                          healthStatusFilter === pill.id
                            ? 'bg-emerald-800 text-white'
                            : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                        }`}
                      >
                        {pill.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <span>
                    Showing <strong className="text-stone-800">{filteredHealth.length}</strong> of{' '}
                    <strong className="text-stone-800">{health.length}</strong> health records
                  </span>
                  {(searchQuery || healthStatusFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setHealthStatusFilter('all');
                      }}
                      className="text-xs text-emerald-700 hover:underline font-medium"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TAB 1: GOATS */}
      {activeTab === 'goats' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Ear Tag & Name</th>
                  <th className="px-6 py-3.5">Herd Status</th>
                  <th className="px-6 py-3.5">Breed</th>
                  <th className="px-6 py-3.5">Gender</th>
                  <th className="px-6 py-3.5">Weight (kg)</th>
                  <th className="px-6 py-3.5">Date of Birth</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredGoats.length > 0 ? (
                  filteredGoats.map(goat => (
                    <tr key={goat.id} className="hover:bg-stone-50/75 dark:hover:bg-stone-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <span className="font-bold text-stone-900 dark:text-stone-100 font-mono text-sm">{goat.tag_number}</span>
                          {goat.name && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <Tag className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                              {goat.name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                            goat.status === 'Pregnant'
                              ? 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                              : goat.status === 'Quarantine'
                              ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : goat.status === 'Sold'
                              ? 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                              : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {goat.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-stone-700 dark:text-stone-300">{goat.breed}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            goat.gender === 'Female'
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          {goat.gender}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-stone-600 dark:text-stone-300">
                        {goat.weight_kg ? `${goat.weight_kg} kg` : '45 kg'}
                      </td>
                      <td className="px-6 py-4 text-stone-600 dark:text-stone-400 font-mono text-xs">
                        {goat.dob || '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          id={`btn-del-goat-${goat.id}`}
                          onClick={() => deleteGoat(goat.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                          title="Delete Goat Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="max-w-xs mx-auto text-center space-y-2">
                        <p className="text-stone-500 dark:text-stone-400 font-medium">No goats match your filter</p>
                        <p className="text-xs text-stone-400 dark:text-stone-500">
                          Try searching with a different tag (e.g. GT-101), name (Apollo), or change the status filter.
                        </p>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setGoatStatusFilter('all');
                          }}
                          className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                        >
                          Clear Search & Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BREEDING */}
      {activeTab === 'breeding' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Female Tag (Dam)</th>
                  <th className="px-6 py-3.5">Male Tag (Sire)</th>
                  <th className="px-6 py-3.5">Mating Date</th>
                  <th className="px-6 py-3.5">Gestation Period</th>
                  <th className="px-6 py-3.5">Expected Delivery</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredBreeding.length > 0 ? (
                  filteredBreeding.map(item => {
                    const exp = new Date(item.expected_birth);
                    const diffDays = Math.ceil(
                      (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const isDueSoon = diffDays >= 0 && diffDays <= 7;

                    return (
                      <tr key={item.id} className="hover:bg-stone-50/75 dark:hover:bg-stone-800/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-stone-900 dark:text-stone-100">
                          {item.female_id}
                        </td>
                        <td className="px-6 py-4 text-stone-700 dark:text-stone-300">{item.male_id}</td>
                        <td className="px-6 py-4 text-stone-600 dark:text-stone-400 font-mono text-xs">
                          {item.mating_date || '—'}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-stone-600 dark:text-stone-400">
                          {item.gestation_days || 150} days
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium ${
                              isDueSoon
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-bold'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                            }`}
                          >
                            {isDueSoon && <span>⚠️ Due soon ({diffDays}d)!</span>}
                            <span>{item.expected_birth || '—'}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                          {onNavigate && (
                            <button
                              type="button"
                              onClick={() => onNavigate('breeding_estimator')}
                              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                            >
                              <span>Predict</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            id={`btn-del-breed-${item.id}`}
                            onClick={() => deleteBreeding(item.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                            title="Delete Breeding Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-stone-400 dark:text-stone-500">
                      No breeding records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: HEALTH */}
      {activeTab === 'health' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Goat Tag & Name</th>
                  <th className="px-6 py-3.5">Health Status</th>
                  <th className="px-6 py-3.5">Checkup Date</th>
                  <th className="px-6 py-3.5">Condition & Type</th>
                  <th className="px-6 py-3.5">Treatment / Medication</th>
                  <th className="px-6 py-3.5">Gestation / Ultrasound</th>
                  <th className="px-6 py-3.5">Attending Vet</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredHealth.length > 0 ? (
                  filteredHealth.map(item => {
                    const matchedGoat = goatMap.get(item.goat_id.toUpperCase());
                    const isUnderTreatment =
                      item.status === 'Under Treatment' ||
                      item.condition.toLowerCase().includes('sick') ||
                      item.condition.toLowerCase().includes('weak') ||
                      item.condition.toLowerCase().includes('fever');
                    const isCritical = item.status === 'Critical' || item.condition.toLowerCase().includes('critical');
                    const isHealthy =
                      !isUnderTreatment && !isCritical && (item.status === 'Healthy' || item.condition.toLowerCase().includes('healthy') || item.condition.toLowerCase().includes('good'));

                    return (
                      <tr key={item.id} className="hover:bg-stone-50/75 dark:hover:bg-stone-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 dark:text-stone-100 font-mono text-sm">{item.goat_id}</span>
                            {matchedGoat?.name && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <Tag className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                                {matchedGoat.name}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                              isCritical
                                ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                : isUnderTreatment
                                ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            {item.status || (isCritical ? 'Critical' : isUnderTreatment ? 'Under Treatment' : 'Healthy')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-stone-600 dark:text-stone-400 font-mono text-xs">
                          {item.checkup_date || '—'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-stone-800 dark:text-stone-200 font-medium text-xs">
                              {item.condition}
                            </span>
                            {item.checkup_type && (
                              <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                                Type: {item.checkup_type}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-stone-700 dark:text-stone-300 text-xs max-w-xs">{item.treatment}</td>
                        <td className="px-6 py-4">
                          {item.fetal_age_days ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              {item.fetal_age_days}d fetal age
                            </span>
                          ) : item.is_pregnant ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              Pregnant
                            </span>
                          ) : (
                            <span className="text-stone-400 dark:text-stone-500 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-stone-600 dark:text-stone-400 text-xs font-medium">
                          {item.vet_name || 'Staff Attendant'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            id={`btn-del-health-${item.id}`}
                            onClick={() => deleteHealth(item.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                            title="Delete Health Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="max-w-xs mx-auto text-center space-y-2">
                        <p className="text-stone-500 dark:text-stone-400 font-medium">No health records match your filter</p>
                        <p className="text-xs text-stone-400 dark:text-stone-500">
                          Try searching by tag (e.g. GT-103), goat name, or status (Healthy, Under Treatment).
                        </p>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setHealthStatusFilter('all');
                          }}
                          className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                        >
                          Clear Search & Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MILK YIELD */}
      {activeTab === 'milk' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Doe Tag</th>
                  <th className="px-6 py-3.5">Log Date</th>
                  <th className="px-6 py-3.5">Morning Yield</th>
                  <th className="px-6 py-3.5">Evening Yield</th>
                  <th className="px-6 py-3.5">Total Daily Yield</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredMilk.length > 0 ? (
                  filteredMilk.map(m => (
                    <tr key={m.id} className="hover:bg-stone-50/75 dark:hover:bg-stone-800/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-stone-900 dark:text-stone-100">{m.goat_id}</td>
                      <td className="px-6 py-4 text-stone-600 dark:text-stone-400 font-mono text-xs">{m.date}</td>
                      <td className="px-6 py-4 font-mono text-xs text-stone-700 dark:text-stone-300">{m.morning_liters} L</td>
                      <td className="px-6 py-4 font-mono text-xs text-stone-700 dark:text-stone-300">{m.evening_liters} L</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono">
                          {m.total_liters} Liters
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => deleteMilk(m.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                          title="Delete Milk Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-stone-400 dark:text-stone-500">
                      No milk records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SALES */}
      {activeTab === 'sales' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Goat Tag</th>
                  <th className="px-6 py-3.5">Buyer Name</th>
                  <th className="px-6 py-3.5">Sale Date</th>
                  <th className="px-6 py-3.5 text-right">Price (Ksh)</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredSales.length > 0 ? (
                  filteredSales.map(item => (
                    <tr key={item.id} className="hover:bg-stone-50/75 dark:hover:bg-stone-800/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-stone-900 dark:text-stone-100">{item.goat_id}</td>
                      <td className="px-6 py-4 text-stone-700 dark:text-stone-300">{item.buyer_name}</td>
                      <td className="px-6 py-4 text-stone-600 dark:text-stone-400 font-mono text-xs">
                        {item.sale_date || '—'}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-700 dark:text-emerald-400 font-mono text-right">
                        Ksh {Number(item.price).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          id={`btn-del-sale-${item.id}`}
                          onClick={() => deleteSale(item.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                          title="Delete Sale Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-stone-400 dark:text-stone-500">
                      No sales records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: WORKERS */}
      {activeTab === 'workers' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Full Name</th>
                  <th className="px-6 py-3.5">Phone Contact</th>
                  <th className="px-6 py-3.5">Assigned Facility / Area</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredWorkers.length > 0 ? (
                  filteredWorkers.map(item => (
                    <tr key={item.id} className="hover:bg-stone-50/75 dark:hover:bg-stone-800/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-stone-900 dark:text-stone-100">{item.full_name}</td>
                      <td className="px-6 py-4 text-stone-600 dark:text-stone-400 font-mono text-xs">
                        {item.phone || '—'}
                      </td>
                      <td className="px-6 py-4 text-stone-700 dark:text-stone-300">{item.location || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          id={`btn-del-worker-${item.id}`}
                          onClick={() => deleteWorker(item.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                          title="Delete Staff Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-stone-400 dark:text-stone-500">
                      No worker records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: FARM ADVISOR INSIGHTS */}
      {activeTab === 'advisor' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-stone-900 p-5 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-stone-500 dark:text-stone-400">
                <Baby className="w-4 h-4 text-amber-600" />
                <span>Kidding Soon</span>
              </div>
              <div className="text-2xl font-bold text-stone-900 dark:text-white mt-2">
                {dueSoon.length} Does
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Due within the next 7 days. Prepare kidding pens and sterilized equipment.
              </p>
            </div>

            <div className="bg-white dark:bg-stone-900 p-5 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-stone-500 dark:text-stone-400">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <span>Health Warnings</span>
              </div>
              <div className="text-2xl font-bold text-rose-700 dark:text-rose-400 mt-2">
                {sickGoats.length} Goats
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Currently recorded with fever, weakness, or under medical observation.
              </p>
            </div>

            <div className="bg-white dark:bg-stone-900 p-5 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-stone-500 dark:text-stone-400">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Total Recorded Revenue</span>
              </div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-2 font-mono">
                Ksh {totalSalesRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Cumulative livestock sales recorded in your farm ledger.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Excel & Spreadsheet Document Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        defaultCategory={
          activeTab === 'breeding'
            ? 'breeding'
            : activeTab === 'health'
            ? 'health'
            : activeTab === 'milk'
            ? 'milk'
            : 'goats'
        }
      />
    </div>
  );
};
