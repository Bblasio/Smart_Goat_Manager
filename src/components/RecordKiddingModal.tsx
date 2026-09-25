import React, { useState, useEffect } from 'react';
import { useFarm } from '../context/FarmContext';
import { useToast } from '../context/ToastContext';
import { useUnits } from '../context/UnitsContext';
import { BreedingRecord, GoatRecord } from '../types';
import {
  X,
  Baby,
  Calendar,
  Tag,
  CheckCircle2,
  Lock,
  Plus,
  Trash2,
  Sparkles,
  Scale,
  Dna,
  Heart
} from 'lucide-react';

export interface RecordKiddingModalProps {
  isOpen: boolean;
  onClose: () => void;
  breedingRecord: BreedingRecord | null;
  onSuccess?: (info: { damTag: string; kidsCount: number }) => void;
}

interface NewbornKidState {
  id: string;
  tag: string;
  name: string;
  gender: 'Female' | 'Male';
  birthWeight: string;
  breed: string;
  notes: string;
}

export const RecordKiddingModal: React.FC<RecordKiddingModalProps> = ({
  isOpen,
  onClose,
  breedingRecord,
  onSuccess,
}) => {
  const { goats, breeding, updateBreeding, updateGoat, addGoat, addKidGrowthRecord, addHealth, kidGrowthRecords } = useFarm();
  const { showToast } = useToast();
  const { weightUnit } = useUnits();

  const todayStr = new Date().toISOString().split('T')[0];

  const [deliveryDate, setDeliveryDate] = useState<string>(todayStr);
  const [kids, setKids] = useState<NewbornKidState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to generate unique kid tag
  const generateKidTag = (indexOffset = 0): string => {
    const existingTags = new Set([
      ...goats.map(g => g.tag_number.toUpperCase()),
      ...kidGrowthRecords.map(k => k.kid_tag.toUpperCase())
    ]);

    // Try finding next sequential KD number
    for (let num = 200 + indexOffset; num < 999; num++) {
      const candidate = `KD-${num}`;
      if (!existingTags.has(candidate)) {
        return candidate;
      }
    }
    return `KD-${Math.floor(100 + Math.random() * 900)}`;
  };

  // Find Dam Doe and Sire Buck from herd records
  const damGoat = breedingRecord
    ? goats.find(
        g =>
          g.tag_number.toUpperCase() === breedingRecord.female_id.toUpperCase() ||
          g.id === breedingRecord.female_id
      )
    : null;

  const sireGoat = breedingRecord
    ? goats.find(
        g =>
          g.tag_number.toUpperCase() === breedingRecord.male_id.toUpperCase() ||
          g.id === breedingRecord.male_id
      )
    : null;

  const defaultBreed = damGoat?.breed || sireGoat?.breed || 'Boer';

  // Initialize form whenever modal opens with a new breeding record
  useEffect(() => {
    if (isOpen && breedingRecord) {
      setDeliveryDate(todayStr);
      setKids([
        {
          id: 'kid-' + Math.random().toString(36).slice(2, 7),
          tag: generateKidTag(0),
          name: '',
          gender: 'Female',
          birthWeight: '3.5',
          breed: defaultBreed,
          notes: '',
        },
      ]);
    }
  }, [isOpen, breedingRecord]);

  if (!isOpen || !breedingRecord) return null;

  // Add another kid (twins / triplets)
  const handleAddKid = () => {
    const nextOffset = kids.length;
    setKids(prev => [
      ...prev,
      {
        id: 'kid-' + Math.random().toString(36).slice(2, 7),
        tag: generateKidTag(nextOffset),
        name: '',
        gender: prev.length % 2 === 1 ? 'Male' : 'Female',
        birthWeight: '3.5',
        breed: defaultBreed,
        notes: '',
      },
    ]);
  };

  // Remove kid
  const handleRemoveKid = (index: number) => {
    if (kids.length <= 1) return;
    setKids(prev => prev.filter((_, idx) => idx !== index));
  };

  // Update field of specific kid
  const handleUpdateKid = (index: number, field: keyof NewbornKidState, val: string) => {
    setKids(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  // Gestation variance calculation (days early or late)
  let gestationVarianceInfo = '';
  if (breedingRecord.mating_date && deliveryDate) {
    try {
      const matingD = new Date(breedingRecord.mating_date);
      const deliveryD = new Date(deliveryDate);
      const actualGestationDays = Math.round(
        (deliveryD.getTime() - matingD.getTime()) / (1000 * 60 * 60 * 24)
      );
      const expectedDays = breedingRecord.gestation_days || 150;
      const diff = actualGestationDays - expectedDays;

      if (diff === 0) {
        gestationVarianceInfo = `Delivered exactly on target gestation (${actualGestationDays} days)`;
      } else if (diff < 0) {
        gestationVarianceInfo = `Early delivery: Day ${actualGestationDays} (${Math.abs(diff)} days ahead of schedule)`;
      } else {
        gestationVarianceInfo = `Overdue delivery: Day ${actualGestationDays} (${diff} days post-schedule)`;
      }
    } catch {
      gestationVarianceInfo = '';
    }
  }

  // Submit Handler
  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validation
    const enteredTags = new Set<string>();
    for (let i = 0; i < kids.length; i++) {
      const k = kids[i];
      const cleanTag = k.tag.trim().toUpperCase();
      if (!cleanTag) {
        showToast(`Please enter an ear tag for Kid #${i + 1}`, 'warning');
        return;
      }
      if (enteredTags.has(cleanTag)) {
        showToast(`Duplicate tag "${cleanTag}". Each kid must have a distinct ear tag.`, 'warning');
        return;
      }
      enteredTags.add(cleanTag);

      const parsedWeight = parseFloat(k.birthWeight);
      if (isNaN(parsedWeight) || parsedWeight <= 0) {
        showToast(`Please provide a valid birth weight for Kid #${i + 1}`, 'warning');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const femaleTag = breedingRecord.female_id.trim().toUpperCase();
      const maleTag = breedingRecord.male_id.trim().toUpperCase();

      // 1. Update Breeding Record to 'Delivered'
      await updateBreeding(breedingRecord.id, {
        status: 'Delivered',
        actual_birth_date: deliveryDate,
        kids_born: kids.length,
        notes: `Delivery recorded on ${deliveryDate}. ${kids.length} newborn kid(s) born: ${kids
          .map(k => `${k.tag.trim().toUpperCase()}${k.name ? ` (${k.name})` : ''} [${k.gender}]`)
          .join(', ')}. ${gestationVarianceInfo}`,
      });

      // 2. Update Dam doe to Active status (no longer Pregnant)
      if (damGoat) {
        await updateGoat(damGoat.id, { status: 'Active' });
      } else {
        // Fallback: search by tag
        const matchDoe = goats.find(g => g.tag_number.toUpperCase() === femaleTag);
        if (matchDoe) {
          await updateGoat(matchDoe.id, { status: 'Active' });
        }
      }

      // 3. Add Health Record confirming successful delivery and post-partum health
      await addHealth({
        goat_id: femaleTag,
        condition: `Successful Kidding Delivery (${kids.length} kid${kids.length > 1 ? 's' : ''})`,
        treatment: 'Post-partum recovery observation. Maternal nursing & colostrum suckling active.',
        checkup_date: deliveryDate,
        checkup_type: 'Routine',
        status: 'Healthy',
        is_pregnant: false,
        vet_name: 'Attended Kidding',
      });

      // 4. Register each newborn kid into:
      // A) Herd Records (`addGoat`) - so they appear in Herd & Farm Records table & cards with Sire & Dam
      // B) Nursery & Growth Tracker (`addKidGrowthRecord`) - so they appear in Nursery tracking
      for (const kid of kids) {
        const cleanTag = kid.tag.trim().toUpperCase();
        const cleanName = kid.name.trim() || undefined;
        const kidBreed = kid.breed.trim() || defaultBreed;
        const rawWeight = parseFloat(kid.birthWeight) || 3.5;
        // Convert to standard kg if user entered in lbs
        const weightKg = weightUnit === 'lbs' ? Number((rawWeight / 2.20462).toFixed(2)) : rawWeight;

        // Register in main Herd table
        await addGoat({
          tag_number: cleanTag,
          name: cleanName,
          breed: kidBreed,
          gender: kid.gender,
          dob: deliveryDate,
          weight_kg: weightKg,
          dam_tag: femaleTag,
          sire_tag: maleTag,
          status: 'Active',
        });

        // Register in Nursery / Kid Growth Tracker
        await addKidGrowthRecord({
          kid_tag: cleanTag,
          kid_name: cleanName,
          gender: kid.gender,
          breed: kidBreed,
          dob: deliveryDate,
          dam_tag: femaleTag,
          sire_tag: maleTag,
          birth_weight_kg: weightKg,
          target_weaning_weight_kg: 15.0,
          status: 'Nursing',
          notes: kid.notes.trim() || `Born via confirmed delivery on ${deliveryDate} from Dam ${femaleTag} & Sire ${maleTag}`,
        });
      }

      showToast(
        `Kidding confirmed! Dam ${femaleTag} is now Active. ${kids.length} newborn kid(s) enrolled in herd and nursery records.`,
        'success'
      );

      if (onSuccess) {
        onSuccess({ damTag: femaleTag, kidsCount: kids.length });
      }

      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to record kidding delivery', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-kidding-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative space-y-5 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
              <Baby className="w-5 h-5" />
            </div>
            <div>
              <h3 id="record-kidding-title" className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Record Goat Delivery &amp; Add Kid
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Log the birth, automatically reset doe status from Pregnant to Active, and register newborn kids.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close delivery modal"
            className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Breeding Pair Information (Auto-linked from breeding record) */}
        <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <Dna className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Official Breeding Record Pair</span>
            </span>
            <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
              Mating: {breedingRecord.mating_date} • Expected: {breedingRecord.expected_birth}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Mother Doe */}
            <div className="p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                  Mother (Dam Tag)
                </span>
                <span className="text-sm font-extrabold text-stone-900 dark:text-stone-100 font-mono">
                  {breedingRecord.female_id}
                </span>
                {damGoat?.name && (
                  <span className="text-xs text-stone-500 block">{damGoat.name}</span>
                )}
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-semibold">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>Auto-picked</span>
              </div>
            </div>

            {/* Father Buck */}
            <div className="p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                  Father (Sire Tag)
                </span>
                <span className="text-sm font-extrabold text-stone-900 dark:text-stone-100 font-mono">
                  {breedingRecord.male_id}
                </span>
                {sireGoat?.name && (
                  <span className="text-xs text-stone-500 block">{sireGoat.name}</span>
                )}
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-semibold">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>Auto-picked</span>
              </div>
            </div>
          </div>

          {gestationVarianceInfo && (
            <p className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
              {gestationVarianceInfo}
            </p>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirmDelivery} className="space-y-4">
          {/* Delivery Date */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Actual Delivery / Kidding Date *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                id="input-delivery-date"
                value={deliveryDate}
                max={todayStr}
                onChange={e => setDeliveryDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-stone-300 dark:border-stone-700 rounded-xl text-sm bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          {/* Kids List Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Baby className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Newborn Kids ({kids.length})</span>
              </span>
              <button
                type="button"
                id="btn-add-kid-entry"
                onClick={handleAddKid}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Kid (Twins/Triplets)</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {kids.map((kid, idx) => (
                <div
                  key={kid.id}
                  className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-700/80 bg-stone-50/50 dark:bg-stone-800/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span>Kid #{idx + 1}</span>
                    </span>

                    {kids.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveKid(idx)}
                        className="text-stone-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                        title="Remove kid"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Kid Tag */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-stone-600 dark:text-stone-400">
                          Ear Tag *
                        </label>
                        <button
                          type="button"
                          onClick={() => handleUpdateKid(idx, 'tag', generateKidTag(idx))}
                          className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Generate</span>
                        </button>
                      </div>
                      <div className="relative">
                        <Tag className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={kid.tag}
                          onChange={e => handleUpdateKid(idx, 'tag', e.target.value.toUpperCase())}
                          placeholder="e.g. KD-105"
                          className="w-full pl-8 pr-2.5 py-1.5 border border-stone-300 dark:border-stone-700 dark:bg-stone-800 rounded-lg text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500 text-stone-900 dark:text-stone-100"
                          required
                        />
                      </div>
                    </div>

                    {/* Kid Name */}
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        Kid Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={kid.name}
                        onChange={e => handleUpdateKid(idx, 'name', e.target.value)}
                        placeholder="e.g. Daisy, Atlas"
                        className="w-full px-2.5 py-1.5 border border-stone-300 dark:border-stone-700 dark:bg-stone-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-stone-900 dark:text-stone-100"
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        Gender *
                      </label>
                      <select
                        value={kid.gender}
                        onChange={e => handleUpdateKid(idx, 'gender', e.target.value as 'Female' | 'Male')}
                        className="w-full px-2.5 py-1.5 border border-stone-300 dark:border-stone-700 dark:bg-stone-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-stone-900 dark:text-stone-100"
                      >
                        <option value="Female">♀ Female (Doeling)</option>
                        <option value="Male">♂ Male (Buckling)</option>
                      </select>
                    </div>

                    {/* Birth Weight */}
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                        Birth Weight ({weightUnit}) *
                      </label>
                      <div className="relative">
                        <Scale className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          step="0.1"
                          min="0.5"
                          max="20"
                          value={kid.birthWeight}
                          onChange={e => handleUpdateKid(idx, 'birthWeight', e.target.value)}
                          placeholder="3.5"
                          className="w-full pl-8 pr-2.5 py-1.5 border border-stone-300 dark:border-stone-700 dark:bg-stone-800 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 text-stone-900 dark:text-stone-100"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Automated System Actions Notice */}
          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/80 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Automatic Record Updates on Confirmation</span>
            </div>
            <ul className="text-[11px] text-emerald-800 dark:text-emerald-300 list-disc list-inside space-y-0.5 leading-relaxed">
              <li>
                <strong>Dam {breedingRecord.female_id}:</strong> Status updated from <em>Pregnant</em> to <strong>Active</strong>.
              </li>
              <li>
                <strong>Breeding Table:</strong> Schedule marked <strong>Delivered</strong> and removed from the active countdown watchlist.
              </li>
              <li>
                <strong>Herd Records:</strong> Kid(s) added with Dam &amp; Sire tags automatically recorded.
              </li>
              <li>
                <strong>Nursery:</strong> Kid(s) enrolled in the Growth Tracker under Nursing status.
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-confirm-kidding-submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs flex items-center gap-1.5 active:scale-98 disabled:opacity-50"
            >
              <Baby className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Saving Delivery...'
                  : `Confirm Birth & Add ${kids.length} Kid${kids.length > 1 ? 's' : ''}`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
