import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { useUnits } from '../context/UnitsContext';
import { GoatRecord, RecordType } from '../types';
import {
  X,
  Tag,
  Calendar,
  Weight,
  Stethoscope,
  Baby,
  Milk,
  GitFork,
  Edit2,
  Printer,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  HeartPulse,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Plus
} from 'lucide-react';

interface AnimalRecordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  goat: GoatRecord | null;
  onEditGoat?: (goat: GoatRecord) => void;
  onViewPedigree?: (goat: GoatRecord) => void;
  onOpenAddRecord?: (type: RecordType, prefillGoatTag?: string) => void;
  onSelectGoatByTag?: (tagNumber: string) => void;
}

export const AnimalRecordDetailModal: React.FC<AnimalRecordDetailModalProps> = ({
  isOpen,
  onClose,
  goat,
  onEditGoat,
  onViewPedigree,
  onOpenAddRecord,
  onSelectGoatByTag,
}) => {
  const { goats, health, breeding, milk, sales } = useFarm();
  const { formatWeight, formatMilk, formatCurrency } = useUnits();
  const [activeTab, setActiveTab] = useState<'overview' | 'health' | 'breeding' | 'milk' | 'pedigree'>('overview');

  // Format date helper
  const formatDateDisplay = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts;
        const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      }
      return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Calculate age helper
  const calculateAge = (dobString?: string): string => {
    if (!dobString) return 'Unknown age';
    const birth = new Date(dobString);
    if (isNaN(birth.getTime())) return 'Unknown age';
    const now = new Date();
    let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (now.getDate() < birth.getDate()) months--;
    if (months < 0) return 'Newborn';
    if (months < 1) {
      const days = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
      return `${Math.max(1, days)} days old`;
    }
    if (months < 12) return `${months} mo${months > 1 ? 's' : ''} old`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return `${years} yr${years > 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths}m` : ''} old`;
  };

  // Filter records matching this goat
  const goatHealthRecords = useMemo(() => {
    if (!goat) return [];
    const tag = goat.tag_number.trim().toLowerCase();
    const id = goat.id;
    return health
      .filter(h => h.goat_id?.trim().toLowerCase() === tag || h.goat_id === id)
      .sort((a, b) => new Date(b.checkup_date).getTime() - new Date(a.checkup_date).getTime());
  }, [goat, health]);

  const goatBreedingRecords = useMemo(() => {
    if (!goat) return [];
    const tag = goat.tag_number.trim().toLowerCase();
    return breeding
      .filter(b => b.female_id?.trim().toLowerCase() === tag || b.male_id?.trim().toLowerCase() === tag)
      .sort((a, b) => new Date(b.mating_date).getTime() - new Date(a.mating_date).getTime());
  }, [goat, breeding]);

  const goatMilkRecords = useMemo(() => {
    if (!goat) return [];
    const tag = goat.tag_number.trim().toLowerCase();
    const id = goat.id;
    return milk
      .filter(m => m.goat_id?.trim().toLowerCase() === tag || m.goat_id === id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [goat, milk]);

  const goatSaleRecord = useMemo(() => {
    if (!goat) return null;
    const tag = goat.tag_number.trim().toLowerCase();
    const id = goat.id;
    return sales.find(s => s.goat_id?.trim().toLowerCase() === tag || s.goat_id === id) || null;
  }, [goat, sales]);

  // Total milk liters
  const totalMilkLiters = useMemo(() => {
    return goatMilkRecords.reduce((acc, m) => acc + (m.total_liters || (m.morning_liters + m.evening_liters) || 0), 0);
  }, [goatMilkRecords]);

  // Total kids born
  const totalKidsBorn = useMemo(() => {
    return goatBreedingRecords.reduce((acc, b) => acc + (b.kids_born || b.registered_kids?.length || 0), 0);
  }, [goatBreedingRecords]);

  // Parents
  const damGoat = useMemo(() => {
    if (!goat?.dam_tag) return null;
    const damTag = goat.dam_tag.trim().toLowerCase();
    return goats.find(g => g.tag_number.trim().toLowerCase() === damTag) || null;
  }, [goat, goats]);

  const sireGoat = useMemo(() => {
    if (!goat?.sire_tag) return null;
    const sireTag = goat.sire_tag.trim().toLowerCase();
    return goats.find(g => g.tag_number.trim().toLowerCase() === sireTag) || null;
  }, [goat, goats]);

  if (!isOpen || !goat) return null;

  const isFemale = goat.gender === 'Female';
  const defaultPhoto = isFemale ? '/images/nav/doe.jpg' : '/jamunapari-goats.png';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="p-4 sm:p-6 bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              {/* Photo */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-stone-200 dark:border-stone-700 shrink-0 shadow-sm bg-stone-100 dark:bg-stone-800">
                <img
                  src={goat.photo_url || defaultPhoto}
                  alt={goat.tag_number}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Title & Tag */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-lg text-sm sm:text-base font-bold font-mono bg-stone-900 dark:bg-white text-white dark:text-stone-900">
                    {goat.tag_number}
                  </span>
                  {goat.name && goat.name !== 'Unnamed Goat' && (
                    <span className="text-sm sm:text-base font-bold text-stone-900 dark:text-white truncate">
                      {goat.name}
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                      goat.gender === 'Female'
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                        : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {goat.gender === 'Female' ? '♀ Doe / Female' : '♂ Buck / Male'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                      goat.status === 'Active'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : goat.status === 'Pregnant'
                        ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                        : goat.status === 'Quarantine'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        : goat.status === 'Sold'
                        ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                        : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    ● {goat.status || 'Active'}
                  </span>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 text-xs text-stone-500 dark:text-stone-400 mt-1 flex-wrap">
                  <span className="font-medium text-stone-700 dark:text-stone-300">
                    Breed: {goat.breed || 'Caprine'}
                  </span>
                  <span>•</span>
                  <span>{calculateAge(goat.dob)}</span>
                  <span>•</span>
                  <span>Born: {formatDateDisplay(goat.dob)}</span>
                  {goat.weight_kg && (
                    <>
                      <span>•</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        {formatWeight(goat.weight_kg)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions in Header */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {onViewPedigree && (
                <button
                  type="button"
                  onClick={() => onViewPedigree(goat)}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="View pedigree lineage"
                >
                  <GitFork className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">Pedigree</span>
                </button>
              )}

              {onEditGoat && (
                <button
                  type="button"
                  onClick={() => onEditGoat(goat)}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Edit goat details"
                >
                  <Edit2 className="w-3.5 h-3.5 text-stone-500" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              )}

              <button
                type="button"
                onClick={handlePrint}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-200 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Print animal dossier"
              >
                <Printer className="w-3.5 h-3.5 text-stone-500" />
                <span className="hidden md:inline">Print</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer ml-1"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-stone-200/80 dark:border-stone-800/80 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('health')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                activeTab === 'health'
                  ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Health & Vet</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'health' ? 'bg-stone-700 dark:bg-stone-200 text-white dark:text-stone-900' : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
              }`}>
                {goatHealthRecords.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('breeding')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                activeTab === 'breeding'
                  ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              <Baby className="w-3.5 h-3.5" />
              <span>Breeding & Kids</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'breeding' ? 'bg-stone-700 dark:bg-stone-200 text-white dark:text-stone-900' : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
              }`}>
                {goatBreedingRecords.length}
              </span>
            </button>

            {isFemale && (
              <button
                type="button"
                onClick={() => setActiveTab('milk')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                  activeTab === 'milk'
                    ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
                }`}
              >
                <Milk className="w-3.5 h-3.5" />
                <span>Milk Yield</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'milk' ? 'bg-stone-700 dark:bg-stone-200 text-white dark:text-stone-900' : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                }`}>
                  {goatMilkRecords.length}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('pedigree')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                activeTab === 'pedigree'
                  ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Pedigree Lineage</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 4 KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                    <Weight className="w-3.5 h-3.5 text-emerald-500" /> Current Weight
                  </span>
                  <div className="text-base sm:text-lg font-bold text-stone-900 dark:text-white mt-1">
                    {goat.weight_kg ? formatWeight(goat.weight_kg) : '—'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-500" /> Health Logs
                  </span>
                  <div className="text-base sm:text-lg font-bold text-stone-900 dark:text-white mt-1">
                    {goatHealthRecords.length} recorded
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                    <Baby className="w-3.5 h-3.5 text-purple-500" /> Kids / Offspring
                  </span>
                  <div className="text-base sm:text-lg font-bold text-stone-900 dark:text-white mt-1">
                    {totalKidsBorn} kids
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                    <Milk className="w-3.5 h-3.5 text-blue-500" /> Lifetime Yield
                  </span>
                  <div className="text-base sm:text-lg font-bold text-stone-900 dark:text-white mt-1">
                    {isFemale ? formatMilk(totalMilkLiters) : 'N/A (Buck)'}
                  </div>
                </div>
              </div>

              {/* Vital Information Grid */}
              <div className="rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
                <div className="px-4 py-3 bg-stone-100/70 dark:bg-stone-800/70 border-b border-stone-200 dark:border-stone-800 font-bold text-xs uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Animal Registry Attributes
                </div>
                <div className="divide-y divide-stone-200 dark:divide-stone-800 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3 gap-2">
                    <span className="text-stone-500 dark:text-stone-400 font-medium">Tag Number</span>
                    <span className="sm:col-span-2 font-mono font-bold text-stone-900 dark:text-white">
                      {goat.tag_number}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3 gap-2">
                    <span className="text-stone-500 dark:text-stone-400 font-medium">Name / Alias</span>
                    <span className="sm:col-span-2 text-stone-900 dark:text-white">
                      {goat.name || <span className="italic text-stone-400">Unnamed Goat</span>}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3 gap-2">
                    <span className="text-stone-500 dark:text-stone-400 font-medium">Breed & Gender</span>
                    <span className="sm:col-span-2 text-stone-900 dark:text-white font-semibold">
                      {goat.breed} • {goat.gender}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3 gap-2">
                    <span className="text-stone-500 dark:text-stone-400 font-medium">Date of Birth & Age</span>
                    <span className="sm:col-span-2 text-stone-900 dark:text-white font-mono">
                      {formatDateDisplay(goat.dob)} ({calculateAge(goat.dob)})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3 gap-2">
                    <span className="text-stone-500 dark:text-stone-400 font-medium">Herd Status</span>
                    <span className="sm:col-span-2 font-semibold text-stone-900 dark:text-white">
                      {goat.status || 'Active'}
                      {goat.quarantine_start_date && (
                        <span className="text-amber-600 dark:text-amber-400 text-xs ml-2">
                          (Quarantine since {formatDateDisplay(goat.quarantine_start_date)})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 p-3 gap-2">
                    <span className="text-stone-500 dark:text-stone-400 font-medium">Parentage</span>
                    <div className="sm:col-span-2 flex items-center gap-3">
                      <div>
                        <span className="text-stone-400 mr-1">Dam:</span>
                        {goat.dam_tag ? (
                          <button
                            type="button"
                            onClick={() => onSelectGoatByTag && onSelectGoatByTag(goat.dam_tag!)}
                            className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            {goat.dam_tag}
                            {damGoat?.name ? ` (${damGoat.name})` : ''}
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-stone-400 italic">Not recorded</span>
                        )}
                      </div>
                      <span>•</span>
                      <div>
                        <span className="text-stone-400 mr-1">Sire:</span>
                        {goat.sire_tag ? (
                          <button
                            type="button"
                            onClick={() => onSelectGoatByTag && onSelectGoatByTag(goat.sire_tag!)}
                            className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            {goat.sire_tag}
                            {sireGoat?.name ? ` (${sireGoat.name})` : ''}
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-stone-400 italic">Not recorded</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {goatSaleRecord && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 p-3 gap-2 bg-blue-50/50 dark:bg-blue-950/20">
                      <span className="text-blue-700 dark:text-blue-300 font-medium">Sale Information</span>
                      <span className="sm:col-span-2 text-stone-900 dark:text-white font-medium">
                        Sold to <strong className="font-bold">{goatSaleRecord.buyer_name}</strong> on {formatDateDisplay(goatSaleRecord.sale_date)} for {formatCurrency(goatSaleRecord.price)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HEALTH & VET */}
          {activeTab === 'health' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Veterinary, Checkup & Medication History
                  </h4>
                  <p className="text-xs text-stone-400">
                    Complete medical dossier and treatment log for {goat.tag_number}
                  </p>
                </div>
                {onOpenAddRecord && (
                  <button
                    type="button"
                    onClick={() => onOpenAddRecord('health', goat.tag_number)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Treatment</span>
                  </button>
                )}
              </div>

              {goatHealthRecords.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 space-y-2">
                  <Stethoscope className="w-8 h-8 text-stone-400 mx-auto" />
                  <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                    No veterinary or health logs found for {goat.tag_number}.
                  </p>
                  <p className="text-[11px] text-stone-400 max-w-sm mx-auto">
                    Record regular deworming, CDT vaccinations, routine health examinations, or medical treatments.
                  </p>
                  {onOpenAddRecord && (
                    <button
                      type="button"
                      onClick={() => onOpenAddRecord('health', goat.tag_number)}
                      className="mt-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add First Health Checkup
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {goatHealthRecords.map(h => (
                    <div
                      key={h.id}
                      className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850 hover:border-stone-300 dark:hover:border-stone-700 transition-colors shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-900 dark:text-white font-mono">
                            {formatDateDisplay(h.checkup_date)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              h.checkup_type === 'Vaccination'
                                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                                : h.checkup_type === 'Deworming'
                                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                                : h.checkup_type === 'Pregnancy Check'
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                            }`}
                          >
                            {h.checkup_type || 'Routine'}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                            h.status === 'Healthy'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : h.status === 'Critical'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          ● {h.status || 'Healthy'}
                        </span>
                      </div>

                      <div className="text-xs text-stone-700 dark:text-stone-300">
                        <span className="font-semibold text-stone-900 dark:text-white">Condition: </span>
                        {h.condition || 'General health check'}
                      </div>

                      <div className="text-xs text-stone-700 dark:text-stone-300">
                        <span className="font-semibold text-stone-900 dark:text-white">Treatment / Medication: </span>
                        {h.treatment || 'None prescribed'}
                      </div>

                      {h.vet_name && (
                        <div className="text-[11px] text-stone-400">
                          Attending Veterinarian: <span className="text-stone-600 dark:text-stone-300 font-medium">{h.vet_name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BREEDING & KIDS */}
          {activeTab === 'breeding' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Reproduction & Kidding History
                  </h4>
                  <p className="text-xs text-stone-400">
                    Matings, gestation tracking, and offspring for {goat.tag_number} ({goat.gender === 'Female' ? 'Doe' : 'Sire Buck'})
                  </p>
                </div>
                {onOpenAddRecord && (
                  <button
                    type="button"
                    onClick={() => onOpenAddRecord('breeding', goat.tag_number)}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Mating</span>
                  </button>
                )}
              </div>

              {goatBreedingRecords.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 space-y-2">
                  <Baby className="w-8 h-8 text-stone-400 mx-auto" />
                  <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                    No breeding or mating events logged for {goat.tag_number}.
                  </p>
                  <p className="text-[11px] text-stone-400 max-w-sm mx-auto">
                    Track natural and AI service dates, calculate 150-day gestation schedules, and record born kids.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {goatBreedingRecords.map(b => (
                    <div
                      key={b.id}
                      className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850 hover:border-stone-300 dark:hover:border-stone-700 transition-colors shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-900 dark:text-white font-mono">
                            Mated: {formatDateDisplay(b.mating_date)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              b.status === 'Delivered'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                : b.status === 'Failed'
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                : 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                            }`}
                          >
                            {b.status || 'Active Gestation'}
                          </span>
                        </div>
                        <span className="text-xs text-stone-500 font-mono">
                          Due Date: {formatDateDisplay(b.expected_birth)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800">
                          <span className="text-stone-400 text-[10px] block">Female (Doe)</span>
                          <span className="font-mono font-bold">{b.female_id}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800">
                          <span className="text-stone-400 text-[10px] block">Male (Sire Buck)</span>
                          <span className="font-mono font-bold">{b.male_id}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800">
                          <span className="text-stone-400 text-[10px] block">Kids Delivered</span>
                          <span className="font-bold text-emerald-600">{b.kids_born || b.registered_kids?.length || 0}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800">
                          <span className="text-stone-400 text-[10px] block">Delivery Date</span>
                          <span className="font-mono">{b.actual_birth_date ? formatDateDisplay(b.actual_birth_date) : 'Pending'}</span>
                        </div>
                      </div>

                      {b.registered_kids && b.registered_kids.length > 0 && (
                        <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                          <span className="text-[11px] font-bold text-stone-500 block mb-1">
                            Registered Kids:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {b.registered_kids.map(kid => (
                              <span
                                key={kid.tag}
                                className="px-2 py-0.5 rounded-lg text-xs font-mono bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300"
                              >
                                {kid.tag} {kid.name ? `(${kid.name})` : ''} • {kid.gender} ({kid.birthWeight}kg)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MILK YIELD (FEMALE ONLY) */}
          {activeTab === 'milk' && isFemale && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Daily Milk Lactation Records
                  </h4>
                  <p className="text-xs text-stone-400">
                    Production logs for Doe {goat.tag_number}
                  </p>
                </div>
                {onOpenAddRecord && (
                  <button
                    type="button"
                    onClick={() => onOpenAddRecord('milk', goat.tag_number)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Milk Yield</span>
                  </button>
                )}
              </div>

              {goatMilkRecords.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 space-y-2">
                  <Milk className="w-8 h-8 text-stone-400 mx-auto" />
                  <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                    No milk logs recorded for Doe {goat.tag_number}.
                  </p>
                  <p className="text-[11px] text-stone-400 max-w-sm mx-auto">
                    Record morning and evening milking volumes to monitor peak lactation curves.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 dark:bg-stone-800 text-stone-500 font-semibold uppercase text-[10px]">
                        <tr>
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5">Morning Yield</th>
                          <th className="px-4 py-2.5">Evening Yield</th>
                          <th className="px-4 py-2.5 text-right">Total Liters</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                        {goatMilkRecords.map(m => {
                          const total = m.total_liters || (m.morning_liters + m.evening_liters);
                          return (
                            <tr key={m.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                              <td className="px-4 py-2.5 font-mono font-medium">{formatDateDisplay(m.date)}</td>
                              <td className="px-4 py-2.5">{formatMilk(m.morning_liters)}</td>
                              <td className="px-4 py-2.5">{formatMilk(m.evening_liters)}</td>
                              <td className="px-4 py-2.5 font-bold text-right text-emerald-600 dark:text-emerald-400">
                                {formatMilk(total)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PEDIGREE */}
          {activeTab === 'pedigree' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Lineage & Pedigree Architecture
                  </h4>
                  <p className="text-xs text-stone-400">
                    Parentage and bloodline records for {goat.tag_number}
                  </p>
                </div>
                {onViewPedigree && (
                  <button
                    type="button"
                    onClick={() => onViewPedigree(goat)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <GitFork className="w-3.5 h-3.5" />
                    <span>Open Full Visual Tree</span>
                  </button>
                )}
              </div>

              {/* Pedigree Preview Card */}
              <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    Direct Lineage (Parents)
                  </span>
                  <span className="text-[11px] text-stone-400">
                    Breed: {goat.breed}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Dam Card */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      ♀ Dam (Mother)
                    </span>
                    {damGoat ? (
                      <div>
                        <div className="font-mono font-bold text-sm text-stone-900 dark:text-white">
                          {damGoat.tag_number}
                        </div>
                        <div className="text-xs text-stone-500">
                          {damGoat.name || 'Unnamed'} • {damGoat.breed}
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectGoatByTag && onSelectGoatByTag(damGoat.tag_number)}
                          className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          View Mother's Records <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-stone-400 italic text-xs">
                        {goat.dam_tag ? `Dam Tag: ${goat.dam_tag} (Not in registry)` : 'No maternal record entered'}
                      </p>
                    )}
                  </div>

                  {/* Sire Card */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      ♂ Sire (Father)
                    </span>
                    {sireGoat ? (
                      <div>
                        <div className="font-mono font-bold text-sm text-stone-900 dark:text-white">
                          {sireGoat.tag_number}
                        </div>
                        <div className="text-xs text-stone-500">
                          {sireGoat.name || 'Unnamed'} • {sireGoat.breed}
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectGoatByTag && onSelectGoatByTag(sireGoat.tag_number)}
                          className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          View Father's Records <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-stone-400 italic text-xs">
                        {goat.sire_tag ? `Sire Tag: ${goat.sire_tag} (Not in registry)` : 'No paternal record entered'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 shrink-0">
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-stone-400" />
            <span>Tag: <strong className="font-mono font-bold text-stone-800 dark:text-stone-200">{goat.tag_number}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
