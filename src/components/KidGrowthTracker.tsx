import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { useToast } from '../context/ToastContext';
import { KidGrowthRecord } from '../types';
import {
  Baby,
  Scale,
  Calendar,
  TrendingUp,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Heart,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Award,
  GitFork,
  UserCheck
} from 'lucide-react';
import { PedigreeTreeModal } from './PedigreeTreeModal';
import { KidGrowthTrajectoryModal } from './KidGrowthTrajectoryModal';

interface KidGrowthTrackerProps {
  onScanTagRequest?: () => void;
}

export const KidGrowthTracker: React.FC<KidGrowthTrackerProps> = () => {
  const {
    kidGrowthRecords,
    addKidGrowthRecord,
    updateKidGrowthRecord,
    deleteKidGrowthRecord,
    goats,
    addGoat
  } = useFarm();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Nursing' | 'Weaned' | 'Sold' | 'Retained'>('all');
  const [breedFilter, setBreedFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWeanModal, setShowWeanModal] = useState(false);
  const [selectedKid, setSelectedKid] = useState<KidGrowthRecord | null>(null);
  const [selectedTrajectoryKid, setSelectedTrajectoryKid] = useState<KidGrowthRecord | null>(null);
  const [selectedPedigreeKid, setSelectedPedigreeKid] = useState<KidGrowthRecord | null>(null);

  // New Kid Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [newTag, setNewTag] = useState('');
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<'Male' | 'Female'>('Male');
  const [newBreed, setNewBreed] = useState('Boer');
  const [newDob, setNewDob] = useState(todayStr);
  const [newDamTag, setNewDamTag] = useState('');
  const [newDamName, setNewDamName] = useState('');
  const [newSireTag, setNewSireTag] = useState('');
  const [newSireName, setNewSireName] = useState('');
  const [newBirthWeight, setNewBirthWeight] = useState('3.8');
  const [newThirtyDayWeight, setNewThirtyDayWeight] = useState('');
  const [newTargetWeaningWeight, setNewTargetWeaningWeight] = useState('15.0');
  const [newStatus, setNewStatus] = useState<'Nursing' | 'Weaned' | 'Sold' | 'Retained'>('Nursing');
  const [newNotes, setNewNotes] = useState('');

  // Wean / Update Weight Form State
  const [weanDate, setWeanDate] = useState(todayStr);
  const [weanWeight, setWeanWeight] = useState('');
  const [thirtyDayWeightInput, setThirtyDayWeightInput] = useState('');
  const [weanStatus, setWeanStatus] = useState<'Nursing' | 'Weaned' | 'Sold' | 'Retained'>('Weaned');
  const [weanNotes, setWeanNotes] = useState('');

  // Unique breeds
  const availableBreeds = useMemo(() => {
    const set = new Set<string>();
    kidGrowthRecords.forEach(k => {
      if (k.breed) set.add(k.breed);
    });
    return Array.from(set);
  }, [kidGrowthRecords]);

  // Helper: calculate kid age in days
  const calculateAgeDays = (dobStr: string): number => {
    try {
      const birth = new Date(dobStr).getTime();
      const now = new Date().getTime();
      return Math.max(0, Math.floor((now - birth) / (1000 * 60 * 60 * 24)));
    } catch {
      return 0;
    }
  };

  // Helper: get ADG rating badge
  const getAdgBadge = (adg?: number) => {
    if (!adg || adg <= 0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
          Calculating...
        </span>
      );
    }
    if (adg >= 180) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          <span>{adg} g/day (High Gain)</span>
        </span>
      );
    }
    if (adg >= 140) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-300/60 dark:border-sky-800 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          <span>{adg} g/day (Optimal)</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        <span>{adg} g/day (Needs Creep Feed)</span>
      </span>
    );
  };

  // Filtered kids
  const filteredKids = useMemo(() => {
    return kidGrowthRecords.filter(kid => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        kid.kid_tag.toLowerCase().includes(q) ||
        (kid.kid_name && kid.kid_name.toLowerCase().includes(q)) ||
        (kid.dam_tag && kid.dam_tag.toLowerCase().includes(q)) ||
        (kid.sire_tag && kid.sire_tag.toLowerCase().includes(q)) ||
        kid.breed.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'all' || kid.status === statusFilter;
      const matchBreed = breedFilter === 'all' || kid.breed === breedFilter;

      return matchSearch && matchStatus && matchBreed;
    });
  }, [kidGrowthRecords, searchQuery, statusFilter, breedFilter]);

  // Aggregate stats
  const totalKids = kidGrowthRecords.length;
  const nursingKids = kidGrowthRecords.filter(k => k.status === 'Nursing').length;
  const weanedKids = kidGrowthRecords.filter(k => k.status === 'Weaned').length;

  const validAdgList = kidGrowthRecords
    .filter(k => k.adg_grams_per_day && k.adg_grams_per_day > 0)
    .map(k => k.adg_grams_per_day!);
  const averageAdg =
    validAdgList.length > 0
      ? Math.round(validAdgList.reduce((acc, curr) => acc + curr, 0) / validAdgList.length)
      : 0;

  const onTargetWeaned = kidGrowthRecords.filter(
    k => k.status === 'Weaned' && k.weaning_weight_kg && k.target_weaning_weight_kg && k.weaning_weight_kg >= k.target_weaning_weight_kg
  ).length;
  const onTargetRate = weanedKids > 0 ? Math.round((onTargetWeaned / weanedKids) * 100) : 0;

  // Handle Add Kid Submit
  const handleAddKidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim() || !newBreed.trim()) return;

    await addKidGrowthRecord({
      kid_tag: newTag.trim().toUpperCase(),
      kid_name: newName.trim() || undefined,
      gender: newGender,
      breed: newBreed.trim(),
      dob: newDob,
      dam_tag: newDamTag.trim() || undefined,
      dam_name: newDamName.trim() || undefined,
      sire_tag: newSireTag.trim() || undefined,
      sire_name: newSireName.trim() || undefined,
      birth_weight_kg: parseFloat(newBirthWeight) || 3.5,
      thirty_day_weight_kg: newThirtyDayWeight ? parseFloat(newThirtyDayWeight) : undefined,
      target_weaning_weight_kg: newTargetWeaningWeight ? parseFloat(newTargetWeaningWeight) : 15.0,
      status: newStatus,
      notes: newNotes.trim() || undefined,
    });

    // Reset Form
    setNewTag('');
    setNewName('');
    setNewNotes('');
    setNewThirtyDayWeight('');
    setShowAddModal(false);
  };

  // Open Log Weight / Wean Modal
  const openWeanModal = (kid: KidGrowthRecord) => {
    setSelectedKid(kid);
    setWeanDate(kid.weaning_date || todayStr);
    setWeanWeight(kid.weaning_weight_kg ? kid.weaning_weight_kg.toString() : '');
    setThirtyDayWeightInput(kid.thirty_day_weight_kg ? kid.thirty_day_weight_kg.toString() : '');
    setWeanStatus(kid.status || 'Weaned');
    setWeanNotes(kid.notes || '');
    setShowWeanModal(true);
  };

  // Save Weight / Weaning changes
  const handleSaveWeanModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKid) return;

    const updates: Partial<KidGrowthRecord> = {
      status: weanStatus,
      notes: weanNotes.trim() || selectedKid.notes,
    };

    if (thirtyDayWeightInput) {
      updates.thirty_day_weight_kg = parseFloat(thirtyDayWeightInput);
    }

    if (weanWeight) {
      updates.weaning_weight_kg = parseFloat(weanWeight);
      updates.weaning_date = weanDate;
    }

    await updateKidGrowthRecord(selectedKid.id, updates);
    setShowWeanModal(false);
    setSelectedKid(null);
  };

  // Graduate kid into main adult herd
  const handleGraduateKidToAdult = async (kid: KidGrowthRecord) => {
    const existing = goats.find(g => g.tag_number.toUpperCase() === kid.kid_tag.toUpperCase());
    if (existing) {
      showToast(`Goat with ear tag ${kid.kid_tag} is already in the main adult herd!`, 'info');
      return;
    }

    await addGoat({
      tag_number: kid.kid_tag.toUpperCase(),
      name: kid.kid_name || undefined,
      breed: kid.breed || 'Boer',
      gender: kid.gender,
      dob: kid.dob,
      weight_kg: Number(kid.weaning_weight_kg || kid.thirty_day_weight_kg || kid.birth_weight_kg || 15),
      status: 'Active',
      dam_tag: kid.dam_tag || undefined,
      sire_tag: kid.sire_tag || undefined,
    });

    await updateKidGrowthRecord(kid.id, {
      status: 'Retained',
      notes: (kid.notes ? `${kid.notes} | ` : '') + 'Graduated to Adult Herd',
    });

    showToast(`Enrolled kid ${kid.kid_tag} as an Active member in the Adult Herd registry!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <Baby className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-stone-900 dark:text-white">
                Kid Growth & Weaning Tracker
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Track birth weights, 30-day milestones, weaning progress, and Average Daily Gain (ADG)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Kid</span>
          </button>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            Total Kids Tracked
          </div>
          <div className="text-2xl font-black text-stone-900 dark:text-white mt-1">
            {totalKids}
          </div>
          <div className="text-[11px] text-stone-400 mt-0.5">Herd Nursery Roster</div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Active Nursing
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">
            {nursingKids}
          </div>
          <div className="text-[11px] text-amber-600/80 dark:text-amber-400/70 mt-0.5">Under Dam or Bottle</div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Successfully Weaned
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
            {weanedKids}
          </div>
          <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/70 mt-0.5">On Solid Forage / Creep</div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            Avg Daily Gain (ADG)
          </div>
          <div className="text-2xl font-black text-sky-700 dark:text-sky-400 mt-1 flex items-baseline gap-1">
            <span>{averageAdg || '--'}</span>
            <span className="text-xs font-bold text-sky-600">g/day</span>
          </div>
          <div className="text-[11px] text-sky-600/80 dark:text-sky-400/70 mt-0.5">Herd-Wide Growth Rate</div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs col-span-2 lg:col-span-1">
          <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Target Wean Rate
          </div>
          <div className="text-2xl font-black text-indigo-700 dark:text-indigo-400 mt-1 flex items-baseline gap-1">
            <span>{onTargetRate}%</span>
          </div>
          <div className="text-[11px] text-indigo-600/80 dark:text-indigo-400/70 mt-0.5">Hit Target Weight</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search kid tag, dam, sire, breed..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-white placeholder-stone-400 focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl shrink-0">
            {(['all', 'Nursing', 'Weaned', 'Sold', 'Retained'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === tab
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                {tab === 'all' ? 'All Kids' : tab}
              </button>
            ))}
          </div>

          {availableBreeds.length > 0 && (
            <select
              value={breedFilter}
              onChange={e => setBreedFilter(e.target.value)}
              className="px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-bold text-stone-700 dark:text-stone-300 shrink-0"
            >
              <option value="all">All Breeds</option>
              {availableBreeds.map(b => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Kid Growth Records Table / Cards */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-xs">
        {filteredKids.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <Baby className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto" />
            <h4 className="text-base font-bold text-stone-700 dark:text-stone-300">
              No kid records found
            </h4>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search terms or filters.'
                : 'Start tracking young livestock growth and weaning metrics by registering a new kid.'}
            </p>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register First Kid</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs record-table-grid">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-800/40 text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Kid Identifier</th>
                  <th className="py-3.5 px-4">Breed & Gender</th>
                  <th className="py-3.5 px-4">Age / DOB</th>
                  <th className="py-3.5 px-4">Pedigree (Dam / Sire)</th>
                  <th className="py-3.5 px-4">Birth Wt</th>
                  <th className="py-3.5 px-4">30-Day Wt</th>
                  <th className="py-3.5 px-4">Weaning Status</th>
                  <th className="py-3.5 px-4">Daily Gain (ADG)</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-stone-900">
                {filteredKids.map(kid => {
                  const ageDays = calculateAgeDays(kid.dob);
                  const ageWeeks = (ageDays / 7).toFixed(1);

                  return (
                    <tr
                      key={kid.id}
                      className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="font-mono font-black text-sm text-stone-900 dark:text-white">
                            {kid.kid_tag}
                          </div>
                          {kid.kid_name && (
                            <span className="text-xs text-stone-500 dark:text-stone-400">
                              ({kid.kid_name})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-800 dark:text-stone-200">
                          {kid.breed}
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1">
                          <span>{kid.gender === 'Male' ? '♂ Buck Kid' : '♀ Doe Kid'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-800 dark:text-stone-200">
                          {ageDays} days <span className="text-stone-400">({ageWeeks} wks)</span>
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400">
                          DOB: {kid.dob}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-[11px] text-stone-700 dark:text-stone-300">
                          <span className="text-stone-400">Dam:</span>{' '}
                          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {kid.dam_tag || 'N/A'}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-700 dark:text-stone-300">
                          <span className="text-stone-400">Sire:</span>{' '}
                          <span className="font-mono font-bold text-sky-700 dark:text-sky-400">
                            {kid.sire_tag || 'N/A'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-stone-900 dark:text-white">
                          {kid.birth_weight_kg} kg
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {kid.thirty_day_weight_kg ? (
                          <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                            {kid.thirty_day_weight_kg} kg
                          </span>
                        ) : (
                          <span className="text-stone-400 italic text-[11px]">Not logged</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              kid.status === 'Weaned'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60'
                                : kid.status === 'Nursing'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300/60'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                            }`}
                          >
                            {kid.status}
                          </span>
                          {kid.weaning_weight_kg && (
                            <div className="text-[11px] text-stone-600 dark:text-stone-400 font-mono">
                              Weaned: {kid.weaning_weight_kg} kg{' '}
                              {kid.target_weaning_weight_kg && (
                                <span className="text-stone-400">
                                  (Target: {kid.target_weaning_weight_kg}kg)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {getAdgBadge(kid.adg_grams_per_day)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            id={`btn-trajectory-kid-${kid.id}`}
                            onClick={() => setSelectedTrajectoryKid(kid)}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors flex items-center gap-1"
                            title="View ADG Growth Trajectory & Target Curve"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Trajectory</span>
                          </button>
                          <button
                            type="button"
                            id={`btn-pedigree-kid-${kid.id}`}
                            onClick={() => setSelectedPedigreeKid(kid)}
                            className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 text-xs font-bold transition-colors flex items-center gap-1"
                            title="View Pedigree Family Tree"
                          >
                            <GitFork className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Lineage</span>
                          </button>
                          <button
                            type="button"
                            id={`btn-wean-kid-${kid.id}`}
                            onClick={() => openWeanModal(kid)}
                            className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-emerald-100 dark:bg-stone-800 dark:hover:bg-emerald-950 text-stone-700 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-400 text-xs font-bold transition-colors"
                            title="Log 30-Day or Weaning Weight"
                          >
                            Log Weight
                          </button>
                          {kid.status !== 'Sold' && (
                            <button
                              type="button"
                              id={`btn-graduate-kid-${kid.id}`}
                              onClick={() => handleGraduateKidToAdult(kid)}
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                              title="Promote / Graduate Kid to Main Adult Goat Registry"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">To Herd</span>
                            </button>
                          )}
                          <button
                            type="button"
                            id={`btn-delete-kid-${kid.id}`}
                            onClick={() => {
                              if (confirm(`Delete kid growth record ${kid.kid_tag}?`)) {
                                deleteKidGrowthRecord(kid.id);
                              }
                            }}
                            className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Register New Kid */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Baby className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-black text-stone-900 dark:text-white">
                  Register Newborn or Nursery Kid
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddKidSubmit} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                    Kid Tag Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    placeholder="e.g. KD-204"
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl font-mono text-stone-900 dark:text-white uppercase focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                    Kid Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. Penny"
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                    Gender *
                  </label>
                  <select
                    value={newGender}
                    onChange={e => setNewGender(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white"
                  >
                    <option value="Male">Male (Buck)</option>
                    <option value="Female">Female (Doe)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                    Breed *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBreed}
                    onChange={e => setNewBreed(e.target.value)}
                    placeholder="e.g. Boer, Kalahari, Saanen"
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                    Date of Birth (DOB) *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDob}
                    onChange={e => setNewDob(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Pedigree */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                    Dam Tag (Mother Doe)
                  </label>
                  <input
                    type="text"
                    value={newDamTag}
                    onChange={e => setNewDamTag(e.target.value)}
                    placeholder="e.g. GT-101"
                    className="w-full px-3.5 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl font-mono text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                    Sire Tag (Father Buck)
                  </label>
                  <input
                    type="text"
                    value={newSireTag}
                    onChange={e => setNewSireTag(e.target.value)}
                    placeholder="e.g. GT-002"
                    className="w-full px-3.5 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl font-mono text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Weights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                    Birth Weight (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newBirthWeight}
                    onChange={e => setNewBirthWeight(e.target.value)}
                    placeholder="3.5"
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl font-mono text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                    30-Day Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newThirtyDayWeight}
                    onChange={e => setNewThirtyDayWeight(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl font-mono text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                    Target Weaning (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newTargetWeaningWeight}
                    onChange={e => setNewTargetWeaningWeight(e.target.value)}
                    placeholder="15.0"
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl font-mono text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                  Status
                </label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white"
                >
                  <option value="Nursing">Nursing</option>
                  <option value="Weaned">Weaned</option>
                  <option value="Retained">Retained for Breeding</option>
                  <option value="Sold">Sold</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                  Notes / Observations
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Vigor, colostrum intake, creep feeding notes..."
                  className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs transition-colors"
                >
                  Save Kid Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Weight / Wean */}
      {showWeanModal && selectedKid && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-stone-900 dark:text-white">
                  Log Weights for {selectedKid.kid_tag}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWeanModal(false)}
                className="text-stone-400 hover:text-stone-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-stone-500">Birth Weight:</span>
                <span className="font-bold font-mono">{selectedKid.birth_weight_kg} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Target Weaning Weight:</span>
                <span className="font-bold font-mono text-emerald-600">
                  {selectedKid.target_weaning_weight_kg || 15.0} kg
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveWeanModal} className="space-y-3.5 text-xs font-medium">
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                  30-Day Milestone Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={thirtyDayWeightInput}
                  onChange={e => setThirtyDayWeightInput(e.target.value)}
                  placeholder="e.g. 8.5"
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl font-mono text-stone-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                    Weaning Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weanWeight}
                    onChange={e => setWeanWeight(e.target.value)}
                    placeholder="e.g. 15.4"
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl font-mono text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                    Weaning Date
                  </label>
                  <input
                    type="date"
                    value={weanDate}
                    onChange={e => setWeanDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                  Current Status
                </label>
                <select
                  value={weanStatus}
                  onChange={e => setWeanStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white font-bold"
                >
                  <option value="Nursing">Nursing (Still on dam / bottle)</option>
                  <option value="Weaned">Weaned (Solid forage / pasture)</option>
                  <option value="Retained">Retained for Breeding Herd</option>
                  <option value="Sold">Sold / Marketed</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={weanNotes}
                  onChange={e => setWeanNotes(e.target.value)}
                  placeholder="Feed intake, vaccinations given at weaning..."
                  className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowWeanModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs transition-colors"
                >
                  Save Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kid Weight Trajectory & ADG Performance Modal */}
      <KidGrowthTrajectoryModal
        isOpen={!!selectedTrajectoryKid}
        onClose={() => setSelectedTrajectoryKid(null)}
        kid={selectedTrajectoryKid}
      />

      {/* Multi-Generational Pedigree & Inbreeding Safety Tree Modal */}
      <PedigreeTreeModal
        isOpen={!!selectedPedigreeKid}
        onClose={() => setSelectedPedigreeKid(null)}
        rootSubject={
          selectedPedigreeKid
            ? {
                tag_number: selectedPedigreeKid.kid_tag,
                name: selectedPedigreeKid.kid_name,
                breed: selectedPedigreeKid.breed,
                gender: selectedPedigreeKid.gender,
                dob: selectedPedigreeKid.dob,
                dam_tag: selectedPedigreeKid.dam_tag,
                sire_tag: selectedPedigreeKid.sire_tag,
                status: selectedPedigreeKid.status,
              }
            : null
        }
        allGoats={goats}
      />
    </div>
  );
};
