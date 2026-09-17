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
  Upload
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
      h.condition.toLowerCase().includes('fever')
  );

  const totalSalesRevenue = sales.reduce((sum, s) => sum + (s.price || 0), 0);

  // Search filters
  const filteredGoats = goats.filter(
    g =>
      g.tag_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.breed.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBreeding = breeding.filter(
    b =>
      b.female_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.male_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHealth = health.filter(
    h =>
      h.goat_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.condition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.treatment.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
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
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-900">
              Transitioning from Traditional Paper or Spreadsheet Books?
            </h4>
            <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
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

      {/* Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-200 pb-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'goats', label: 'Goats', count: goats.length },
            { id: 'breeding', label: 'Breeding', count: breeding.length },
            { id: 'health', label: 'Health', count: health.length },
            { id: 'milk', label: 'Milk Yield', count: milk.length },
            { id: 'sales', label: 'Sales', count: sales.length },
            { id: 'workers', label: 'Workers', count: workers.length },
            { id: 'advisor', label: 'Farm Insights', badge: 'AI' },
          ].map(tab => (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === tab.id ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        {activeTab !== 'advisor' && (
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-record-search"
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}
      </div>

      {/* TAB 1: GOATS */}
      {activeTab === 'goats' && (
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-600 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Tag Number</th>
                  <th className="px-6 py-3.5">Breed</th>
                  <th className="px-6 py-3.5">Gender</th>
                  <th className="px-6 py-3.5">Weight (kg)</th>
                  <th className="px-6 py-3.5">Date of Birth</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredGoats.length > 0 ? (
                  filteredGoats.map(goat => (
                    <tr key={goat.id} className="hover:bg-stone-50/75 transition-colors">
                      <td className="px-6 py-4 font-bold text-stone-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        {goat.tag_number}
                      </td>
                      <td className="px-6 py-4 text-stone-700">{goat.breed}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            goat.gender === 'Female'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {goat.gender}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-stone-600">
                        {goat.weight_kg ? `${goat.weight_kg} kg` : '45 kg'}
                      </td>
                      <td className="px-6 py-4 text-stone-600 font-mono text-xs">
                        {goat.dob || '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          id={`btn-del-goat-${goat.id}`}
                          onClick={() => deleteGoat(goat.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Goat Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-stone-400">
                      No goat records found.
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
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-600 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Female Tag (Dam)</th>
                  <th className="px-6 py-3.5">Male Tag (Sire)</th>
                  <th className="px-6 py-3.5">Mating Date</th>
                  <th className="px-6 py-3.5">Gestation Period</th>
                  <th className="px-6 py-3.5">Expected Delivery</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredBreeding.length > 0 ? (
                  filteredBreeding.map(item => {
                    const exp = new Date(item.expected_birth);
                    const diffDays = Math.ceil(
                      (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const isDueSoon = diffDays >= 0 && diffDays <= 7;

                    return (
                      <tr key={item.id} className="hover:bg-stone-50/75 transition-colors">
                        <td className="px-6 py-4 font-bold text-stone-900">
                          {item.female_id}
                        </td>
                        <td className="px-6 py-4 text-stone-700">{item.male_id}</td>
                        <td className="px-6 py-4 text-stone-600 font-mono text-xs">
                          {item.mating_date || '—'}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-stone-600">
                          {item.gestation_days || 150} days
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium ${
                              isDueSoon
                                ? 'bg-amber-100 text-amber-800 border border-amber-300 font-bold'
                                : 'bg-stone-100 text-stone-700'
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
                              className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                            >
                              <span>Predict</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            id={`btn-del-breed-${item.id}`}
                            onClick={() => deleteBreeding(item.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
                    <td colSpan={6} className="px-6 py-12 text-center text-stone-400">
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
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-600 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Goat Tag</th>
                  <th className="px-6 py-3.5">Checkup Date</th>
                  <th className="px-6 py-3.5">Condition</th>
                  <th className="px-6 py-3.5">Treatment / Intervention</th>
                  <th className="px-6 py-3.5">Pregnancy / Fetal Age</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredHealth.length > 0 ? (
                  filteredHealth.map(item => (
                    <tr key={item.id} className="hover:bg-stone-50/75 transition-colors">
                      <td className="px-6 py-4 font-bold text-stone-900">{item.goat_id}</td>
                      <td className="px-6 py-4 text-stone-600 font-mono text-xs">
                        {item.checkup_date || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                            item.condition.toLowerCase().includes('healthy') ||
                            item.condition.toLowerCase().includes('good')
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {item.condition}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-stone-700 text-xs max-w-xs">{item.treatment}</td>
                      <td className="px-6 py-4">
                        {item.fetal_age_days ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            {item.fetal_age_days}d pregnant
                          </span>
                        ) : (
                          <span className="text-stone-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          id={`btn-del-health-${item.id}`}
                          onClick={() => deleteHealth(item.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Health Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-stone-400">
                      No health records found.
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
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-600 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Doe Tag</th>
                  <th className="px-6 py-3.5">Log Date</th>
                  <th className="px-6 py-3.5">Morning Yield</th>
                  <th className="px-6 py-3.5">Evening Yield</th>
                  <th className="px-6 py-3.5">Total Daily Yield</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredMilk.length > 0 ? (
                  filteredMilk.map(m => (
                    <tr key={m.id} className="hover:bg-stone-50/75 transition-colors">
                      <td className="px-6 py-4 font-bold text-stone-900">{m.goat_id}</td>
                      <td className="px-6 py-4 text-stone-600 font-mono text-xs">{m.date}</td>
                      <td className="px-6 py-4 font-mono text-xs text-stone-700">{m.morning_liters} L</td>
                      <td className="px-6 py-4 font-mono text-xs text-stone-700">{m.evening_liters} L</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 font-mono">
                          {m.total_liters} Liters
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => deleteMilk(m.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Milk Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-stone-400">
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
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-600 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Goat Tag</th>
                  <th className="px-6 py-3.5">Buyer Name</th>
                  <th className="px-6 py-3.5">Sale Date</th>
                  <th className="px-6 py-3.5 text-right">Price (Ksh)</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredSales.length > 0 ? (
                  filteredSales.map(item => (
                    <tr key={item.id} className="hover:bg-stone-50/75 transition-colors">
                      <td className="px-6 py-4 font-bold text-stone-900">{item.goat_id}</td>
                      <td className="px-6 py-4 text-stone-700">{item.buyer_name}</td>
                      <td className="px-6 py-4 text-stone-600 font-mono text-xs">
                        {item.sale_date || '—'}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-700 font-mono text-right">
                        Ksh {Number(item.price).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          id={`btn-del-sale-${item.id}`}
                          onClick={() => deleteSale(item.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Sale Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-stone-400">
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
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-600 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Full Name</th>
                  <th className="px-6 py-3.5">Phone Contact</th>
                  <th className="px-6 py-3.5">Assigned Facility / Area</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredWorkers.length > 0 ? (
                  filteredWorkers.map(item => (
                    <tr key={item.id} className="hover:bg-stone-50/75 transition-colors">
                      <td className="px-6 py-4 font-bold text-stone-900">{item.full_name}</td>
                      <td className="px-6 py-4 text-stone-600 font-mono text-xs">
                        {item.phone || '—'}
                      </td>
                      <td className="px-6 py-4 text-stone-700">{item.location || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          id={`btn-del-worker-${item.id}`}
                          onClick={() => deleteWorker(item.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Staff Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-stone-400">
                      No worker records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: AI ADVISOR INSIGHTS */}
      {activeTab === 'advisor' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 border border-stone-200 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-stone-500">
                <Baby className="w-4 h-4 text-amber-600" />
                <span>Kidding Soon</span>
              </div>
              <div className="text-2xl font-bold text-stone-900 mt-2">
                {dueSoon.length} Does
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Due within the next 7 days. Prepare kidding pens and sterilized equipment.
              </p>
            </div>

            <div className="bg-white p-5 border border-stone-200 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-stone-500">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <span>Health Warnings</span>
              </div>
              <div className="text-2xl font-bold text-rose-700 mt-2">
                {sickGoats.length} Goats
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Currently recorded with fever, weakness, or under medical observation.
              </p>
            </div>

            <div className="bg-white p-5 border border-stone-200 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-stone-500">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Total Recorded Revenue</span>
              </div>
              <div className="text-2xl font-bold text-emerald-700 mt-2 font-mono">
                Ksh {totalSalesRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-stone-500 mt-1">
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
