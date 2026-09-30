import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  Calendar,
  Sparkles,
  Heart,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Info,
  ArrowRight,
  Plus,
  Sliders,
  ChevronRight,
  Save,
  Lock
} from 'lucide-react';
import { AppView, GoatRecord, HealthRecord, BreedingRecord } from '../types';
import { RecordKiddingModal } from '../components/RecordKiddingModal';
import { GoatKidIcon } from '../components/GoatKidIcon';

interface BreedPreset {
  name: string;
  defaultGestation: number;
  description: string;
}

const BREED_PRESETS: BreedPreset[] = [
  { name: 'Boer (Meat)', defaultGestation: 150, description: 'Standard meat goat gestation (148-152 days)' },
  { name: 'Galla / Boran', defaultGestation: 150, description: 'Hardy indigenous pastoral breed' },
  { name: 'Saanen (Dairy)', defaultGestation: 151, description: 'High-yield dairy goat gestation' },
  { name: 'Alpine (Dairy)', defaultGestation: 150, description: 'Cold-hardy commercial dairy doe' },
  { name: 'Toggenburg', defaultGestation: 151, description: 'Swiss dairy breed gestation' },
  { name: 'Nubian / Anglo-Nubian', defaultGestation: 150, description: 'Dual-purpose high butterfat doe' },
  { name: 'East African Dwarf / Pygmy', defaultGestation: 145, description: 'Shorter gestation period (143-147 days)' },
];

interface BreedingEstimatorViewProps {
  onNavigate?: (view: AppView, subTab?: string) => void;
}

export const BreedingEstimatorView: React.FC<BreedingEstimatorViewProps> = ({ onNavigate }) => {
  const { goats, breeding, health, kidGrowthRecords, addBreeding, updateBreeding, addHealth } = useFarm();

  const does = goats.filter(g => g.gender === 'Female');
  const bucks = goats.filter(g => g.gender === 'Male');

  // Watchlist filter state
  const [watchlistFilter, setWatchlistFilter] = useState<'all' | 'active' | 'delivered'>('all');

  // Input states
  const [calculationMode, setCalculationMode] = useState<'mating_date' | 'health_record'>('mating_date');
  const [selectedDoeTag, setSelectedDoeTag] = useState<string>(does[0]?.tag_number || 'GT-102');
  const [selectedSireTag, setSelectedSireTag] = useState<string>(bucks[0]?.tag_number || 'GT-101');
  const [matingDate, setMatingDate] = useState<string>(
    new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [gestationDays, setGestationDays] = useState<number>(150);
  const [selectedBreedPreset, setSelectedBreedPreset] = useState<string>('Boer (Meat)');

  // Health record mode states
  const [selectedHealthRecordId, setSelectedHealthRecordId] = useState<string>('');
  const [fetalAgeDays, setFetalAgeDays] = useState<number>(60);
  const [checkupDate, setCheckupDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Save feedback state
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Kidding & delivery state
  const [selectedBreedingForDelivery, setSelectedBreedingForDelivery] = useState<BreedingRecord | null>(null);
  const [watchlistTab, setWatchlistTab] = useState<'active' | 'delivered'>('active');

  const activeExpectantDoes = breeding.filter(b => b.status === 'Active' || !b.status);
  const deliveredBreedingRecords = breeding.filter(b => b.status === 'Delivered');
  const totalKidsRecordedCount = deliveredBreedingRecords.reduce((acc, curr) => acc + (curr.kids_born || 1), 0);

  // Check if currently selected doe has an active breeding schedule
  const activeBreedingForSelectedDoe = breeding.find(
    b =>
      b.female_id.toUpperCase() === selectedDoeTag.toUpperCase() &&
      (b.status === 'Active' || !b.status)
  );

  // Check if currently selected doe has a delivered breeding record
  const deliveredBreedingForSelectedDoe = breeding.find(
    b =>
      b.female_id.toUpperCase() === selectedDoeTag.toUpperCase() &&
      b.status === 'Delivered'
  );

  // Filter health records that have pregnancy checkups
  const pregnancyHealthRecords = health.filter(
    h => h.is_pregnant || h.checkup_type === 'Pregnancy Check' || h.condition.toLowerCase().includes('pregnant')
  );

  // Handle doe selection change
  const handleDoeSelect = (doeTag: string) => {
    setSelectedDoeTag(doeTag);
    const doe = goats.find(g => g.tag_number === doeTag);
    if (doe) {
      // Look up matching preset
      const preset = BREED_PRESETS.find(p => doe.breed.toLowerCase().includes(p.name.toLowerCase().split(' ')[0]));
      if (preset) {
        setSelectedBreedPreset(preset.name);
        setGestationDays(preset.defaultGestation);
      }
    }

    // Also check if this doe has a health pregnancy record
    const relatedHealth = health.find(h => h.goat_id === doeTag && (h.is_pregnant || h.checkup_type === 'Pregnancy Check'));
    if (relatedHealth) {
      setSelectedHealthRecordId(relatedHealth.id);
      if (relatedHealth.fetal_age_days) setFetalAgeDays(relatedHealth.fetal_age_days);
      if (relatedHealth.checkup_date) setCheckupDate(relatedHealth.checkup_date);
      if (relatedHealth.custom_gestation_days) setGestationDays(relatedHealth.custom_gestation_days);
    }
  };

  // Handle health record selection
  const handleHealthRecordSelect = (recId: string) => {
    setSelectedHealthRecordId(recId);
    const rec = health.find(h => h.id === recId);
    if (rec) {
      setSelectedDoeTag(rec.goat_id);
      setCheckupDate(rec.checkup_date);
      if (rec.fetal_age_days) setFetalAgeDays(rec.fetal_age_days);
      if (rec.custom_gestation_days) setGestationDays(rec.custom_gestation_days);
    }
  };

  // Compute Conception & Kidding Dates
  let effectiveConceptionDate: Date;
  if (calculationMode === 'mating_date') {
    effectiveConceptionDate = new Date(matingDate || Date.now());
  } else {
    // Conception date = checkup date - fetal age
    const chk = new Date(checkupDate || Date.now());
    effectiveConceptionDate = new Date(chk.getTime() - fetalAgeDays * 24 * 60 * 60 * 1000);
  }

  // Kidding date = conception date + gestationDays
  const kiddingTargetDate = new Date(
    effectiveConceptionDate.getTime() + gestationDays * 24 * 60 * 60 * 1000
  );

  // Kidding Window (±3 days standard variance)
  const kiddingWindowStart = new Date(
    kiddingTargetDate.getTime() - 3 * 24 * 60 * 60 * 1000
  );
  const kiddingWindowEnd = new Date(
    kiddingTargetDate.getTime() + 3 * 24 * 60 * 60 * 1000
  );

  // Current progress calculation
  const today = new Date();
  const daysElapsed = Math.max(
    0,
    Math.floor((today.getTime() - effectiveConceptionDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  const daysRemaining = Math.max(
    0,
    Math.ceil((kiddingTargetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );
  const progressPercent = Math.min(100, Math.round((daysElapsed / gestationDays) * 100));

  // Determine Trimester
  let currentTrimester: string;
  let trimesterBadgeColor: string;
  let trimesterAdvice: string;

  if (daysElapsed < 50) {
    currentTrimester = '1st Trimester (Days 1–50)';
    trimesterBadgeColor = 'bg-sky-100 text-sky-800 border-sky-300';
    trimesterAdvice =
      'Embryonic attachment and vital organ formation. Avoid severe handling or feed abruptness to prevent early resorption.';
  } else if (daysElapsed < 100) {
    currentTrimester = '2nd Trimester (Days 51–100)';
    trimesterBadgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
    trimesterAdvice =
      'Fetal skeletal development. Maintain balanced good-quality forage and trace mineral block with selenium.';
  } else {
    currentTrimester = '3rd Trimester (Days 101–150)';
    trimesterBadgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
    trimesterAdvice =
      'High-velocity growth: 70% of kid weight is gained now. Provide concentrate grain feed, CD/T vaccine booster at day 120, and prepare warm maternity stall.';
  }

  // Key Clinical Milestones
  const milestones = [
    {
      day: 35,
      title: 'Ultrasound Pregnancy Confirmation',
      date: new Date(effectiveConceptionDate.getTime() + 35 * 24 * 60 * 60 * 1000),
      desc: 'Transabdominal or real-time B-mode ultrasound can accurately identify fetal heartbeats and count twins.',
      type: 'clinical',
    },
    {
      day: 100,
      title: 'Nutritional Energy Ramp-Up',
      date: new Date(effectiveConceptionDate.getTime() + 100 * 24 * 60 * 60 * 1000),
      desc: 'Begin introducing grain concentrate (0.5 kg/day) to support fetal brain development and prevent pregnancy toxemia.',
      type: 'nutrition',
    },
    {
      day: 120,
      title: 'CD/T Vaccine Booster (Essential)',
      date: new Date(effectiveConceptionDate.getTime() + 120 * 24 * 60 * 60 * 1000),
      desc: 'Administer Clostridium perfringens Types C & D and Tetanus toxoid to enrich maternal colostrum antibodies for newborns.',
      type: 'vaccine',
    },
    {
      day: 135,
      title: 'Maternity Pen Setup & Udder Inspection',
      date: new Date(effectiveConceptionDate.getTime() + 135 * 24 * 60 * 60 * 1000),
      desc: 'Clean and bed individual kidding pen with fresh wood shavings or dry straw. Observe "bagging up" of udder.',
      type: 'prep',
    },
    {
      day: 145,
      title: 'Active Kidding Watch (Day 145–150)',
      date: new Date(effectiveConceptionDate.getTime() + 145 * 24 * 60 * 60 * 1000),
      desc: 'Check for ligament relaxation around tailhead, clear cervical discharge, nesting behavior, and slight body temperature drop (101.5°F).',
      type: 'delivery',
    },
  ];

  // Save to Breeding Records handler
  const handleSaveToBreeding = async () => {
    const formattedKiddingDate = kiddingTargetDate.toISOString().split('T')[0];
    const formattedConceptionDate = effectiveConceptionDate.toISOString().split('T')[0];

    const cleanDoe = selectedDoeTag.trim().toUpperCase();
    const cleanSire = selectedSireTag.trim().toUpperCase();

    // Check if an active record already exists for this doe
    const existing = breeding.find(
      b =>
        b.female_id.trim().toUpperCase() === cleanDoe &&
        (b.status === 'Active' || !b.status)
    );

    if (existing) {
      await updateBreeding(existing.id, {
        male_id: cleanSire,
        mating_date: formattedConceptionDate,
        expected_birth: formattedKiddingDate,
        gestation_days: gestationDays,
        status: 'Active',
        notes: `Estimated via Breeding Tool (${gestationDays}d gestation). Predicted window: ${kiddingWindowStart.toISOString().split('T')[0]} to ${kiddingWindowEnd.toISOString().split('T')[0]}.`,
      });
      setSaveSuccessMsg(`Breeding schedule updated for ${selectedDoeTag}.`);
    } else {
      await addBreeding({
        female_id: cleanDoe,
        male_id: cleanSire,
        mating_date: formattedConceptionDate,
        expected_birth: formattedKiddingDate,
        gestation_days: gestationDays,
        status: 'Active',
        notes: `Calculated via Breeding Tool with ${gestationDays} days gestation.`,
      });
      setSaveSuccessMsg(`Breeding schedule saved for ${selectedDoeTag}.`);
    }

    // Also update/add a health note if in health mode
    if (calculationMode === 'health_record') {
      await addHealth({
        goat_id: selectedDoeTag,
        condition: `Pregnancy Confirmed (${fetalAgeDays}d fetal age)`,
        treatment: `Gestation tracked (${gestationDays}d total). Expected kidding: ${formattedKiddingDate}`,
        checkup_date: checkupDate,
        checkup_type: 'Pregnancy Check',
        is_pregnant: true,
        fetal_age_days: fetalAgeDays,
        custom_gestation_days: gestationDays,
        vet_name: 'Breeding Calculator',
      });
    }

    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-2">
          Breeding &amp; Kidding Estimation Tool
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
          Gestation & Kidding Date Predictor
        </h2>
        <p className="text-stone-500 text-sm mt-1 max-w-3xl">
          Accurately calculate kidding dates, delivery windows, trimester nutrition protocols, and health milestones
          based on mating dates, breed-specific gestation curves, or pregnancy checkup observations in goat health records.
        </p>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Grid: Calculator Inputs (Left) & Live Predictive Outputs (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* CALCULATOR CONTROLS (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>Calculation Parameters</span>
            </h3>

            {/* Mode Toggle */}
            <div className="flex rounded-xl bg-stone-100 p-1 text-xs font-semibold text-stone-600">
              <button
                type="button"
                id="btn-mode-mating-date"
                onClick={() => setCalculationMode('mating_date')}
                className={`flex-1 py-2 px-3 rounded-lg transition-all ${
                  calculationMode === 'mating_date'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'hover:text-stone-900'
                }`}
              >
                Mating / Breeding Date
              </button>
              <button
                type="button"
                id="btn-mode-health-record"
                onClick={() => setCalculationMode('health_record')}
                className={`flex-1 py-2 px-3 rounded-lg transition-all ${
                  calculationMode === 'health_record'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'hover:text-stone-900'
                }`}
              >
                Health Checkup / Fetal Age
              </button>
            </div>

            {/* Doe Selection */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Select Dam (Female Goat) *
              </label>
              <select
                id="select-doe-tag"
                value={selectedDoeTag}
                onChange={e => handleDoeSelect(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {does.map(d => (
                  <option key={d.id} value={d.tag_number}>
                    {d.tag_number} — {d.breed} ({d.status || 'Active'})
                  </option>
                ))}
              </select>
            </div>

            {/* Sire Selection */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Sire (Buck Tag)
              </label>
              <select
                id="select-sire-tag"
                value={selectedSireTag}
                onChange={e => setSelectedSireTag(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {bucks.map(b => (
                  <option key={b.id} value={b.tag_number}>
                    {b.tag_number} — {b.breed} (Buck)
                  </option>
                ))}
              </select>
            </div>

            {/* Calculation Mode Specific Inputs with Smooth Crossfade */}
            <div key={calculationMode} className="transition-all duration-200 ease-out animate-in fade-in">
              {/* Mode 1: Mating Date Input */}
              {calculationMode === 'mating_date' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Breeding / Mating Date *
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="input-mating-date"
                      type="date"
                      value={matingDate}
                      onChange={e => setMatingDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Mode 2: Health Record Sync */}
              {calculationMode === 'health_record' && (
                <div className="space-y-4 p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <div className="flex items-center text-xs font-bold text-emerald-900">
                    <span>Observed Pregnancy from Health Records</span>
                  </div>

                  {pregnancyHealthRecords.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Link Existing Health Checkup:
                      </label>
                      <select
                        id="select-health-record"
                        value={selectedHealthRecordId}
                        onChange={e => handleHealthRecordSelect(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">-- Choose Checkup Record --</option>
                        {pregnancyHealthRecords.map(h => (
                          <option key={h.id} value={h.id}>
                            {h.goat_id} ({h.checkup_date}) — {h.condition}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Checkup Date *
                      </label>
                      <input
                      id="input-health-checkup-date"
                      type="date"
                      value={checkupDate}
                      onChange={e => setCheckupDate(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Fetal Age (Days) *
                    </label>
                    <input
                      id="input-fetal-age-days"
                      type="number"
                      min={10}
                      max={145}
                      value={fetalAgeDays}
                      onChange={e => setFetalAgeDays(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      required
                    />
                  </div>
                </div>

                <p className="text-[11px] text-stone-500 leading-relaxed">
                  💡 Inferred conception date: <strong className="text-stone-800">{effectiveConceptionDate.toLocaleDateString()}</strong> (calculated by subtracting observed fetal age from the examination date).
                </p>
              </div>
            )}
            </div>

            {/* Gestation Period Adjuster */}
            <div className="space-y-3 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700">
                  Gestation Period: <span className="text-emerald-700 font-bold">{gestationDays} Days</span>
                </label>
                <span className="text-[11px] text-stone-400">Normal Range: 145–155d</span>
              </div>

              {/* Breed Presets Pills */}
              <div>
                <span className="text-[11px] font-medium text-stone-500 block mb-1.5">
                  Preset by Breed:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {BREED_PRESETS.map(preset => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setSelectedBreedPreset(preset.name);
                        setGestationDays(preset.defaultGestation);
                      }}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                        selectedBreedPreset === preset.name
                          ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {preset.name} ({preset.defaultGestation}d)
                    </button>
                  ))}
                </div>
              </div>

              {/* Range Slider */}
              <div className="pt-2">
                <input
                  id="range-gestation-days"
                  type="range"
                  min={140}
                  max={160}
                  value={gestationDays}
                  onChange={e => setGestationDays(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                  <span>140d (Early/Dwarf)</span>
                  <span>150d (Standard Caprine)</span>
                  <span>160d (Late/Large)</span>
                </div>
              </div>
            </div>

            {/* Save & Sync Button */}
            <button
              id="btn-save-breeding-record"
              type="button"
              onClick={handleSaveToBreeding}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save & Sync to Breeding Records</span>
            </button>
          </div>
        </div>

        {/* PREDICTIVE RESULTS & GESTATION ROADMAP (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Hero Card: Predicted Kidding Date */}
          <div className="bg-gradient-to-br from-emerald-800 to-stone-900 text-white rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
                  Target Kidding Estimate
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                  {kiddingTargetDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
              </div>
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xs text-center min-w-[90px]">
                <div className="text-2xl font-black font-mono leading-none">
                  {daysRemaining}
                </div>
                <div className="text-[10px] uppercase font-semibold text-emerald-200 mt-1">
                  Days Left
                </div>
              </div>
            </div>

            {/* Delivery Window (± 3 Days) */}
            <div className="p-3 rounded-xl bg-white/10 border border-white/10 flex items-center justify-between text-xs sm:text-sm">
              <span className="text-emerald-100 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-300" />
                Delivery Window (±3 days standard range):
              </span>
              <span className="font-bold text-white font-mono">
                {kiddingWindowStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} —{' '}
                {kiddingWindowEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            {/* Gestation Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-emerald-100">
                <span>
                  Gestation Progress: <strong className="text-white">Day {daysElapsed}</strong> of {gestationDays}d
                </span>
                <span className="font-bold text-white">{progressPercent}%</span>
              </div>
              <div className="w-full bg-stone-700/60 rounded-full h-3 overflow-hidden p-0.5 border border-white/10">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-emerald-200/80 font-mono">
                <span>Conception: {effectiveConceptionDate.toLocaleDateString()}</span>
                <span>Expected: {kiddingTargetDate.toLocaleDateString()}</span>
              </div>
            </div>

            {/* Current Trimester & Veterinary Protocol */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${trimesterBadgeColor}`}>
                  {currentTrimester}
                </span>
                <span className="text-xs text-emerald-200">Clinical Protocol</span>
              </div>
              <p className="text-xs text-stone-200 leading-relaxed">
                {trimesterAdvice}
              </p>
            </div>

            {/* Quick Action: Enter Goat Gave Birth for Currently Selected Doe */}
            {activeBreedingForSelectedDoe ? (() => {
              const doeTargetDate = new Date(activeBreedingForSelectedDoe.expected_birth);
              const t = new Date();
              t.setHours(0, 0, 0, 0);
              const target = new Date(doeTargetDate);
              target.setHours(0, 0, 0, 0);
              const doeDaysLeft = Math.ceil((target.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
              const isDoeDue = doeDaysLeft <= 0;

              return (
                <div className="p-3.5 rounded-xl bg-white/10 border border-white/20 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
                  <div className="text-xs text-emerald-100 flex items-center gap-2">
                    {isDoeDue ? (
                      <GoatKidIcon className="w-4 h-4 text-emerald-300 shrink-0" />
                    ) : (
                      <Lock className="w-4 h-4 text-emerald-300 shrink-0" />
                    )}
                    <span>
                      {isDoeDue
                        ? `Doe ${selectedDoeTag} has reached expected kidding date (${activeBreedingForSelectedDoe.expected_birth})!`
                        : `Doe ${selectedDoeTag} in gestation: ${doeDaysLeft} days remaining until due date (${activeBreedingForSelectedDoe.expected_birth}).`}
                    </span>
                  </div>
                  {isDoeDue ? (
                    <button
                      type="button"
                      id="btn-hero-goat-gave-birth"
                      onClick={() => setSelectedBreedingForDelivery(activeBreedingForSelectedDoe)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer ring-2 ring-emerald-300 animate-pulse"
                      title="Expected kidding date reached! Click to record delivery & add kid"
                    >
                      <GoatKidIcon className="w-4 h-4 text-stone-950" />
                      <span>Enter Goat Gave Birth</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled
                        className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-emerald-200 text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed opacity-80"
                        title={`Activates on or after expected due date (${activeBreedingForSelectedDoe.expected_birth}). ${doeDaysLeft} days remaining.`}
                      >
                        <Lock className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Active on Due Date ({doeDaysLeft}d)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedBreedingForDelivery(activeBreedingForSelectedDoe)}
                        className="text-[11px] text-emerald-200 underline hover:text-white transition-colors cursor-pointer"
                        title="Click here if the doe delivered early before schedule"
                      >
                        Delivered early?
                      </button>
                    </div>
                  )}
                </div>
              );
            })() : deliveredBreedingForSelectedDoe ? (
              <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
                <div className="text-xs text-emerald-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>
                    Doe {selectedDoeTag} successfully delivered on {deliveredBreedingForSelectedDoe.actual_birth_date || 'schedule'}. Status: <strong className="text-white">Delivered</strong> ({deliveredBreedingForSelectedDoe.kids_born || deliveredBreedingForSelectedDoe.registered_kids?.length || 1} kid{((deliveredBreedingForSelectedDoe.kids_born || deliveredBreedingForSelectedDoe.registered_kids?.length || 1) === 1 ? '' : 's')}).
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedBreedingForDelivery(deliveredBreedingForSelectedDoe)}
                    className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/20"
                    title="View or modify kids from this delivered kidding"
                  >
                    <GoatKidIcon className="w-3.5 h-3.5" />
                    <span>Manage Kids ({deliveredBreedingForSelectedDoe.kids_born || deliveredBreedingForSelectedDoe.registered_kids?.length || 1})</span>
                  </button>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('records', 'kids')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Nursery
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Clinical Milestones Timeline */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Critical Gestation Milestones &amp; Vet Protocol</span>
              </h3>
              <span className="text-xs text-stone-400 font-mono">{gestationDays} Day Schedule</span>
            </div>

            <div className="divide-y divide-stone-100">
              {milestones.map((m, idx) => {
                const isPassed = daysElapsed >= m.day;
                const isCurrent = Math.abs(daysElapsed - m.day) <= 5;

                return (
                  <div key={idx} className="py-3 flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold font-mono ${
                        isPassed
                          ? 'bg-emerald-100 text-emerald-800'
                          : isCurrent
                          ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-400'
                          : 'bg-stone-100 text-stone-400'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : m.day}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={`text-sm font-bold ${
                            isCurrent ? 'text-amber-900' : isPassed ? 'text-stone-800' : 'text-stone-600'
                          }`}
                        >
                          {m.title}
                        </h4>
                        <span className="text-xs font-mono text-stone-400 shrink-0">
                          {m.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVE HERD GESTATION WATCHLIST */}
      {(() => {
        const activeBreeding = breeding.filter(b => b.status === 'Active' || !b.status);
        const deliveredBreeding = breeding.filter(b => b.status === 'Delivered');
        const totalKidsRecorded = kidGrowthRecords.length;

        const filteredWatchlist = breeding.filter(b => {
          if (watchlistFilter === 'active') return b.status === 'Active' || !b.status;
          if (watchlistFilter === 'delivered') return b.status === 'Delivered';
          return true; // 'all' default keeps all does in stable positions so entries do not move
        });

        return (
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Herd Gestation &amp; Kidding Watchlist</span>
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Live tracking of expectant does, delivery countdowns, and recorded births
                </p>
              </div>

              {/* Status and Kid Count Badges */}
              <div className="flex items-center flex-wrap gap-2">
                <span
                  id="badge-active-gestations"
                  className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{activeBreeding.length} Active Expectant Does</span>
                </span>
                <span
                  id="badge-kids-recorded"
                  className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 flex items-center gap-1.5 shadow-2xs"
                >
                  <GoatKidIcon className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <span>{totalKidsRecorded} Recorded Kids</span>
                </span>
              </div>
            </div>

            {/* Filter Toggle Controls */}
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl w-fit text-xs font-semibold">
              <button
                type="button"
                id="filter-watchlist-all"
                onClick={() => setWatchlistFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  watchlistFilter === 'all'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                All Schedules ({breeding.length})
              </button>
              <button
                type="button"
                id="filter-watchlist-active"
                onClick={() => setWatchlistFilter('active')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  watchlistFilter === 'active'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                Active Countdown ({activeBreeding.length})
              </button>
              <button
                type="button"
                id="filter-watchlist-delivered"
                onClick={() => setWatchlistFilter('delivered')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  watchlistFilter === 'delivered'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                Delivered ({deliveredBreeding.length})
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
              <table className="w-full text-left text-sm record-table-grid">
                <thead className="bg-stone-50 dark:bg-stone-800/80 text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Doe Tag</th>
                    <th className="px-5 py-3">Sire</th>
                    <th className="px-5 py-3">Conception / Mating</th>
                    <th className="px-5 py-3">Gestation</th>
                    <th className="px-5 py-3">Target Kidding</th>
                    <th className="px-5 py-3">Status / Countdown</th>
                    <th className="px-5 py-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-stone-900 divide-y divide-stone-100 dark:divide-stone-800">
                  {filteredWatchlist.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center">
                        <div className="max-w-sm mx-auto space-y-2">
                          <GoatKidIcon className="w-8 h-8 text-stone-400 mx-auto opacity-60" />
                          <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                            {watchlistFilter === 'delivered'
                              ? 'No delivered kidding records yet'
                              : 'No expectant does currently in countdown'}
                          </p>
                          <p className="text-xs text-stone-500 dark:text-stone-400">
                            {watchlistFilter === 'delivered'
                              ? 'When expectant does reach their due date, use "Goat Gave Birth" to record deliveries and register kids.'
                              : 'When does are bred or confirmed pregnant, save them using the Gestation Predictor above to monitor active delivery countdowns.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredWatchlist.map(b => {
                      const isDelivered = b.status === 'Delivered';
                      const targetDate = new Date(b.expected_birth);
                      const todayMidnight = new Date();
                      todayMidnight.setHours(0, 0, 0, 0);
                      const targetMidnight = new Date(targetDate);
                      targetMidnight.setHours(0, 0, 0, 0);
                      const daysLeft = Math.ceil((targetMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
                      const isDue = daysLeft <= 0;
                      const isDueSoon = daysLeft <= 7 && daysLeft > 0;
                      const isOverdue = daysLeft < 0;

                      return (
                        <tr
                          key={b.id}
                          className={`transition-colors ${
                            isDelivered
                              ? 'bg-emerald-50/20 dark:bg-emerald-950/10 hover:bg-emerald-50/40'
                              : 'hover:bg-stone-50/50 dark:hover:bg-stone-800/40'
                          }`}
                        >
                          <td className="px-5 py-3.5 font-bold text-stone-900 dark:text-stone-100 font-mono">
                            {b.female_id}
                          </td>
                          <td className="px-5 py-3.5 text-stone-600 dark:text-stone-400 font-mono text-xs">
                            {b.male_id}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs text-stone-500 dark:text-stone-400">
                            {b.mating_date}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs text-stone-600 dark:text-stone-300">
                            {b.gestation_days || 150} days
                          </td>
                          <td className="px-5 py-3.5 font-bold text-stone-900 dark:text-stone-100 font-mono text-xs">
                            <div>
                              {targetDate.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </div>
                            {isDelivered && b.actual_birth_date && (
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                Delivered {b.actual_birth_date}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {isDelivered ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1.5 w-fit">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Delivered ({b.kids_born || b.registered_kids?.length || (b.kid_tags ? b.kid_tags.length : 1)} {((b.kids_born || b.registered_kids?.length || (b.kid_tags ? b.kid_tags.length : 1)) === 1 ? 'kid' : 'kids')})</span>
                              </span>
                            ) : (
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                                  isOverdue
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                    : isDueSoon
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse'
                                    : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                }`}
                              >
                                {isOverdue
                                  ? `Overdue (${Math.abs(daysLeft)}d)`
                                  : daysLeft === 0
                                  ? 'Due Today!'
                                  : `${daysLeft} days left`}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isDelivered ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedBreedingForDelivery(b)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-all cursor-pointer"
                                    title="View and edit registered kids for this kidding delivery"
                                  >
                                    <GoatKidIcon className="w-3.5 h-3.5" />
                                    <span>Manage Kids ({b.kids_born || b.registered_kids?.length || (b.kid_tags ? b.kid_tags.length : 1)})</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onNavigate) {
                                        onNavigate('records', 'kids');
                                      }
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer"
                                    title="View newborn kids in Nursery & Growth Tracker"
                                  >
                                    <span>Nursery</span>
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : isDue ? (
                                <button
                                  type="button"
                                  id={`btn-birth-${b.id}`}
                                  onClick={() => setSelectedBreedingForDelivery(b)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all active:scale-95 cursor-pointer ring-2 ring-emerald-500/20"
                                  title={`Doe ${b.female_id} reached expected due date! Click to record kidding delivery`}
                                >
                                  <GoatKidIcon className="w-4 h-4 shrink-0" />
                                  <span>Goat Gave Birth</span>
                                </button>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border border-stone-200 dark:border-stone-700/80 cursor-not-allowed opacity-80"
                                    title={`Gestation in progress (${daysLeft} days remaining). Activates on due date (${targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}).`}
                                  >
                                    <Lock className="w-3 h-3 text-stone-400 dark:text-stone-500 shrink-0" />
                                    <span>Active on Due Date ({daysLeft}d)</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedBreedingForDelivery(b)}
                                    className="text-[10px] text-emerald-600 dark:text-emerald-400 underline hover:text-emerald-700 dark:hover:text-emerald-300 cursor-pointer"
                                    title="Record delivery if goat gave birth early"
                                  >
                                    Early?
                                  </button>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDoeTag(b.female_id);
                                  setSelectedSireTag(b.male_id);
                                  setMatingDate(b.mating_date);
                                  setGestationDays(b.gestation_days || 150);
                                  setCalculationMode('mating_date');
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:underline px-2 py-1"
                                title="Load parameters into gestation calculator"
                              >
                                Load
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Kidding & Newborn Kid Registration Modal */}
      <RecordKiddingModal
        isOpen={!!selectedBreedingForDelivery}
        onClose={() => setSelectedBreedingForDelivery(null)}
        breedingRecord={selectedBreedingForDelivery}
        onSuccess={({ damTag, kidsCount }) => {
          setSelectedBreedingForDelivery(null);
          setSaveSuccessMsg(
            `Birth confirmed for ${damTag} (${kidsCount} kid${kidsCount > 1 ? 's' : ''}). Dam is now Active.`
          );
          setTimeout(() => setSaveSuccessMsg(null), 5000);
        }}
      />
    </div>
  );
};
