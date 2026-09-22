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
  Sparkles
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

      {/* Health Records Table */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm record-table-grid">
            <thead className="bg-stone-50 dark:bg-stone-800/80 text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Goat Tag</th>
                <th className="px-6 py-3.5">Checkup Date</th>
                <th className="px-6 py-3.5">Condition / Diagnosis</th>
                <th className="px-6 py-3.5">Treatment & Protocol</th>
                <th className="px-6 py-3.5">Gestation / Fetal Age</th>
                <th className="px-6 py-3.5">Attending Vet</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-stone-900">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-stone-400 text-xs">
                    No matching veterinary records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(item => (
                  <tr key={item.id} className="hover:bg-stone-50/50">
                    <td className="px-6 py-3.5 font-bold text-stone-900">{item.goat_id}</td>
                    <td className="px-6 py-3.5 font-mono text-xs text-stone-500">{item.checkup_date}</td>
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-stone-800 text-xs">{item.condition}</div>
                      {item.checkup_type && (
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-600">
                          {item.checkup_type}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-stone-600 max-w-xs">{item.treatment}</td>
                    <td className="px-6 py-3.5">
                      {item.fetal_age_days ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            {item.fetal_age_days}d gestation
                          </span>
                          <button
                            type="button"
                            onClick={() => onNavigate('breeding_estimator')}
                            className="block text-[10px] font-semibold text-emerald-700 hover:underline"
                          >
                            Predict kidding date →
                          </button>
                        </div>
                      ) : (
                        <span className="text-stone-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-stone-500 font-medium">
                      {item.vet_name || 'Dr. Mutua'}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => deleteHealth(item.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
