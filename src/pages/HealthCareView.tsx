import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Calendar,
  HeartPulse,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { HealthRecord, AppView } from '../types';

interface HealthCareViewProps {
  onNavigate: (view: AppView) => void;
  onOpenAddModal: () => void;
}

export const HealthCareView: React.FC<HealthCareViewProps> = ({ onNavigate, onOpenAddModal }) => {
  const { health, goats, deleteHealth } = useFarm();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedMobileIds, setExpandedMobileIds] = useState<Record<string, boolean>>({});

  const toggleMobileExpand = (id: string) => {
    setExpandedMobileIds(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const pregnancyChecks = health.filter(
    h => h.is_pregnant || h.checkup_type === 'Pregnancy Check' || h.condition.toLowerCase().includes('pregnant')
  );

  const vaccinations = health.filter(
    h => h.checkup_type === 'Vaccination' || h.treatment.toLowerCase().includes('vaccin') || h.treatment.toLowerCase().includes('cd/t')
  );

  const dewormings = health.filter(
    h => h.checkup_type === 'Deworming' || h.treatment.toLowerCase().includes('deworm') || h.treatment.toLowerCase().includes('albendazole')
  );

  const filteredRecords = health.filter(record => {
    const matchesSearch =
      record.goat_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.treatment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.vet_name && record.vet_name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterType === 'all') return matchesSearch;
    if (filterType === 'pregnancy') return matchesSearch && (record.is_pregnant || record.checkup_type === 'Pregnancy Check');
    if (filterType === 'vaccination') return matchesSearch && (record.checkup_type === 'Vaccination' || record.treatment.toLowerCase().includes('vaccin'));
    if (filterType === 'deworming') return matchesSearch && (record.checkup_type === 'Deworming' || record.treatment.toLowerCase().includes('deworm'));
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-2">
            Veterinary &amp; Clinical Protocols
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Herd Health &amp; Pregnancy Checks
          </h2>
          <p className="text-stone-500 text-sm mt-1">
            Track pregnancy ultrasounds, observed gestation age, vaccination booster dates, and treatments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('breeding_estimator')}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors shadow-xs"
          >
            <span>Open Breeding Predictor</span>
          </button>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Health Log</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
              Confirmed Pregnancies
            </span>
            <div className="text-2xl font-bold text-stone-900 mt-1">
              {pregnancyChecks.length} Does
            </div>
            <div className="text-xs text-emerald-700 mt-1 flex items-center gap-1">
              <span>Ultrasound &amp; fetal age verified</span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold text-xs border border-emerald-200">
            Active
          </span>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
              Vaccination Logs
            </span>
            <div className="text-2xl font-bold text-stone-900 mt-1">
              {vaccinations.length} Administered
            </div>
            <div className="text-xs text-stone-500 mt-1">
              CD/T, PPR, &amp; Clostridial boosters
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 font-semibold text-xs border border-stone-200">
            Protocol
          </span>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
              Parasite &amp; Deworming
            </span>
            <div className="text-2xl font-bold text-stone-900 mt-1">
              {dewormings.length} Treated
            </div>
            <div className="text-xs text-stone-500 mt-1">
              Albendazole &amp; Ivermectin doses
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-semibold text-xs border border-amber-200">
            Routine
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search goat tag, condition, treatment..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'all' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Logs ({health.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('pregnancy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'pregnancy' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Pregnancies ({pregnancyChecks.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('vaccination')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'vaccination' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Vaccines ({vaccinations.length})
          </button>
        </div>
      </div>

      {/* Mobile Card-per-Row Fallback (< 768px) */}
      <div className="block md:hidden space-y-3 mb-4">
        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-stone-500 text-xs">
            No matching veterinary records found.
          </div>
        ) : (
          filteredRecords.map(item => {
            const isExpanded = !!expandedMobileIds[item.id];
            const isCritical = item.condition.toLowerCase().includes('sick') || item.condition.toLowerCase().includes('mastitis') || item.condition.toLowerCase().includes('pneumonia') || item.condition.toLowerCase().includes('fever');
            const isObservation = item.condition.toLowerCase().includes('monitor') || item.condition.toLowerCase().includes('limp') || item.condition.toLowerCase().includes('wound') || item.condition.toLowerCase().includes('treatment');

            return (
              <div
                key={`mobile-health-${item.id}`}
                className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs transition-all"
              >
                {/* Primary Card View: Tag, Condition Status Pill, Date */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-extrabold text-stone-900 dark:text-stone-100 font-mono text-sm tracking-tight">
                      {item.goat_id}
                    </div>
                    <div className="text-[11px] font-mono text-stone-500 dark:text-stone-400 mt-0.5">
                      {item.checkup_date}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {item.is_pregnant || item.fetal_age_days ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                        Pregnant
                      </span>
                    ) : isCritical ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#e11d48]" />
                        Critical
                      </span>
                    ) : isObservation ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Observation
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                        Healthy
                      </span>
                    )}
                  </div>
                </div>

                {/* Primary Field: Condition / Diagnosis */}
                <div className="mt-2.5 flex items-center justify-between text-xs text-stone-600 dark:text-stone-300 pt-2 border-t border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-stone-400 text-[11px] uppercase tracking-wide">Diagnosis:</span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200 truncate">
                      {item.condition || <span className="italic text-[#b7bab2] font-normal">—</span>}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleMobileExpand(item.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 p-1 rounded-md shrink-0"
                  >
                    <span>{isExpanded ? 'Less' : 'Details'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Expandable Details */}
                {isExpanded && (
                  <div className="mt-2.5 pt-2.5 border-t border-dashed border-stone-200 dark:border-stone-800 space-y-2 text-xs animate-fade-in">
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase block">Treatment & Protocol</span>
                      <span className="font-medium text-stone-800 dark:text-stone-200 mt-0.5 block">
                        {item.treatment || <span className="italic text-[#b7bab2] font-normal">—</span>}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-stone-600 dark:text-stone-300">
                      <div>
                        <span className="text-stone-400 text-[10px] uppercase block">Gestation / Fetal Age</span>
                        {item.fetal_age_days ? (
                          <div className="mt-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              {item.fetal_age_days}d gestation
                            </span>
                          </div>
                        ) : (
                          <span className="italic text-[#b7bab2] text-xs font-normal mt-0.5 block">—</span>
                        )}
                      </div>

                      <div>
                        <span className="text-stone-400 text-[10px] uppercase block">Attending Vet</span>
                        <span className="font-medium text-stone-800 dark:text-stone-200 mt-0.5 block">
                          {item.vet_name || <span className="italic text-[#b7bab2] font-normal">—</span>}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-2 border-t border-stone-100 dark:border-stone-800">
                      <button
                        type="button"
                        onClick={() => deleteHealth(item.id)}
                        className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-1"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Health Records Desktop Table (Sticky Header, 56px Zebra Rows, Hover Tint) */}
      <div className="hidden md:block bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-230px)] overflow-y-auto">
          <table className="w-full text-left text-sm record-table-grid border-collapse">
            <thead className="sticky top-0 z-20 select-none">
              <tr className="bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700 text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Goat Tag</th>
                <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Checkup Date</th>
                <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Condition / Diagnosis</th>
                <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Treatment & Protocol</th>
                <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Gestation / Fetal Age</th>
                <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Attending Vet</th>
                <th className="px-6 py-3.5 text-right bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/50 dark:divide-stone-800/80">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-stone-400 text-xs">
                    No matching veterinary records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item, index) => {
                  const isEvenRow = index % 2 === 1;
                  const zebraBgClass = isEvenRow ? 'bg-[#fbfbf9] dark:bg-stone-900/60' : 'bg-white dark:bg-stone-900';
                  const isCritical = item.condition.toLowerCase().includes('sick') || item.condition.toLowerCase().includes('mastitis') || item.condition.toLowerCase().includes('pneumonia') || item.condition.toLowerCase().includes('fever');
                  const isObservation = item.condition.toLowerCase().includes('monitor') || item.condition.toLowerCase().includes('limp') || item.condition.toLowerCase().includes('wound') || item.condition.toLowerCase().includes('treatment');

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${zebraBgClass} hover:bg-[#e7f3ec] dark:hover:bg-emerald-950/35`}
                    >
                      <td className="px-6 py-[15px] font-extrabold text-stone-900 dark:text-stone-100 font-mono text-sm tracking-tight">
                        {item.goat_id}
                      </td>
                      <td className="px-6 py-[15px] font-mono text-xs text-stone-500 dark:text-stone-400">
                        {item.checkup_date}
                      </td>
                      <td className="px-6 py-[15px]">
                        <div className="flex flex-col gap-1 items-start">
                          <div className="font-semibold text-stone-800 dark:text-stone-200 text-xs">
                            {item.condition || <span className="italic text-[#b7bab2] font-normal">—</span>}
                          </div>
                          {item.is_pregnant || item.fetal_age_days ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200">
                              Pregnant
                            </span>
                          ) : isCritical ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#e11d48]" />
                              Critical
                            </span>
                          ) : isObservation ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Observation
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                              Healthy
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-[15px] text-xs text-stone-600 dark:text-stone-300 max-w-xs">
                        {item.treatment || <span className="italic text-[#b7bab2] font-normal">—</span>}
                      </td>
                      <td className="px-6 py-[15px]">
                        {item.fetal_age_days ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200">
                              {item.fetal_age_days}d gestation
                            </span>
                            <button
                              type="button"
                              onClick={() => onNavigate('breeding_estimator')}
                              className="block text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                            >
                              Predict kidding date →
                            </button>
                          </div>
                        ) : (
                          <span className="italic text-[#b7bab2] text-xs font-normal">—</span>
                        )}
                      </td>
                      <td className="px-6 py-[15px] text-xs text-stone-600 dark:text-stone-400 font-medium">
                        {item.vet_name || <span className="italic text-[#b7bab2] font-normal">—</span>}
                      </td>
                      <td className="px-6 py-[15px] text-right">
                        <button
                          type="button"
                          onClick={() => deleteHealth(item.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
