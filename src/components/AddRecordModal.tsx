import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { RecordType } from '../types';
import { X, Check, Baby, Milk, Stethoscope } from 'lucide-react';

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: RecordType;
}

export const AddRecordModal: React.FC<AddRecordModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'goat',
}) => {
  const { addGoat, addBreeding, addHealth, addSale, addWorker, addMilk, goats } = useFarm();
  const [recordType, setRecordType] = useState<RecordType>(defaultType);

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to calculate expected birth date (mating + gestation days)
  const calcExpectedBirth = (matingDateStr: string, days: number = 150) => {
    try {
      const d = new Date(matingDateStr);
      d.setDate(d.getDate() + Number(days));
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Goat form state
  const [goatTag, setGoatTag] = useState('');
  const [goatBreed, setGoatBreed] = useState('Boer');
  const [goatGender, setGoatGender] = useState<'Male' | 'Female'>('Female');
  const [goatDob, setGoatDob] = useState(todayStr);
  const [goatWeight, setGoatWeight] = useState('45');

  // Breeding form state
  const [breedFemale, setBreedFemale] = useState('');
  const [breedMale, setBreedMale] = useState('');
  const [matingDate, setMatingDate] = useState(todayStr);
  const [gestationDays, setGestationDays] = useState('150');
  const [expectedBirth, setExpectedBirth] = useState(() => calcExpectedBirth(todayStr, 150));

  // Health form state
  const [healthGoatId, setHealthGoatId] = useState('');
  const [healthCondition, setHealthCondition] = useState('');
  const [healthTreatment, setHealthTreatment] = useState('');
  const [healthDate, setHealthDate] = useState(todayStr);
  const [checkupType, setCheckupType] = useState<'Routine' | 'Pregnancy Check' | 'Vaccination' | 'Deworming' | 'Illness'>('Routine');
  const [isPregnant, setIsPregnant] = useState(false);
  const [fetalAgeDays, setFetalAgeDays] = useState('60');
  const [vetName, setVetName] = useState('');

  // Sales form state
  const [saleGoatId, setSaleGoatId] = useState('');
  const [saleBuyer, setSaleBuyer] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [saleDate, setSaleDate] = useState(todayStr);

  // Worker form state
  const [workerName, setWorkerName] = useState('');
  const [workerPhone, setWorkerPhone] = useState('');
  const [workerLocation, setWorkerLocation] = useState('');

  // Milk form state
  const [milkGoatId, setMilkGoatId] = useState('');
  const [milkDate, setMilkDate] = useState(todayStr);
  const [morningLiters, setMorningLiters] = useState('2.0');
  const [eveningLiters, setEveningLiters] = useState('1.5');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleMatingOrGestationChange = (date: string, days: string) => {
    setMatingDate(date);
    setGestationDays(days);
    const calculated = calcExpectedBirth(date, parseInt(days) || 150);
    setExpectedBirth(calculated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (recordType === 'goat') {
        if (!goatTag.trim() || !goatBreed.trim()) {
          setErrorMsg('Tag Number and Breed are required.');
          return;
        }
        addGoat({
          tag_number: goatTag.trim().toUpperCase(),
          breed: goatBreed.trim(),
          gender: goatGender,
          dob: goatDob,
          weight_kg: parseFloat(goatWeight) || 45,
          status: 'Active',
        });
        setSuccessMsg(`Goat ${goatTag.trim().toUpperCase()} added successfully!`);
        setGoatTag('');
      } else if (recordType === 'breeding') {
        if (!breedFemale.trim() || !breedMale.trim()) {
          setErrorMsg('Both Female Tag and Male Tag are required.');
          return;
        }
        const gDays = parseInt(gestationDays) || 150;
        const calcBirth = expectedBirth || calcExpectedBirth(matingDate, gDays);
        addBreeding({
          female_id: breedFemale.trim().toUpperCase(),
          male_id: breedMale.trim().toUpperCase(),
          mating_date: matingDate,
          expected_birth: calcBirth,
          gestation_days: gDays,
          status: 'Active',
          notes: `Gestation: ${gDays} days.`,
        });
        setSuccessMsg(`Breeding schedule saved! Expected delivery: ${calcBirth}`);
        setBreedFemale('');
        setBreedMale('');
      } else if (recordType === 'health') {
        if (!healthGoatId.trim()) {
          setErrorMsg('Goat Tag ID is required.');
          return;
        }
        addHealth({
          goat_id: healthGoatId.trim().toUpperCase(),
          condition: healthCondition.trim() || 'General Health Check',
          treatment: healthTreatment.trim() || 'Observation',
          checkup_date: healthDate,
          checkup_type: checkupType,
          is_pregnant: isPregnant,
          fetal_age_days: isPregnant ? parseInt(fetalAgeDays) || undefined : undefined,
          custom_gestation_days: isPregnant ? 150 : undefined,
          vet_name: vetName.trim() || 'Attending Vet',
        });
        setSuccessMsg(`Health record added for ${healthGoatId.trim().toUpperCase()}`);
        setHealthGoatId('');
        setHealthCondition('');
        setHealthTreatment('');
      } else if (recordType === 'sale') {
        if (!saleGoatId.trim()) {
          setErrorMsg('Goat Tag ID is required.');
          return;
        }
        const numericPrice = parseFloat(salePrice);
        if (isNaN(numericPrice) || numericPrice < 0) {
          setErrorMsg('Please enter a valid sale price.');
          return;
        }
        addSale({
          goat_id: saleGoatId.trim().toUpperCase(),
          buyer_name: saleBuyer.trim() || 'Private Buyer',
          price: numericPrice,
          sale_date: saleDate,
        });
        setSuccessMsg(`Sale of Ksh ${numericPrice.toLocaleString()} recorded!`);
        setSaleGoatId('');
        setSaleBuyer('');
        setSalePrice('');
      } else if (recordType === 'worker') {
        if (!workerName.trim()) {
          setErrorMsg('Worker full name is required.');
          return;
        }
        addWorker({
          full_name: workerName.trim(),
          phone: workerPhone.trim() || '—',
          location: workerLocation.trim() || 'Main Farm',
        });
        setSuccessMsg(`Worker ${workerName.trim()} added!`);
        setWorkerName('');
        setWorkerPhone('');
        setWorkerLocation('');
      } else if (recordType === 'milk') {
        if (!milkGoatId.trim()) {
          setErrorMsg('Goat Tag ID is required.');
          return;
        }
        const mYield = parseFloat(morningLiters) || 0;
        const eYield = parseFloat(eveningLiters) || 0;
        addMilk({
          goat_id: milkGoatId.trim().toUpperCase(),
          date: milkDate,
          morning_liters: mYield,
          evening_liters: eYield,
          total_liters: +(mYield + eYield).toFixed(2),
        });
        setSuccessMsg(`Milk record of ${(mYield + eYield).toFixed(2)}L logged!`);
        setMilkGoatId('');
      }

      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 900);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error adding record');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <div>
            <h3 className="text-lg font-bold text-stone-900">Add New Farm Record</h3>
            <p className="text-xs text-stone-500">Record livestock, breeding, health, milk yield, or staff</p>
          </div>
          <button
            id="btn-close-modal"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Record Type Selector */}
        <div className="px-6 pt-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
            Record Type
          </label>
          <div className="grid grid-cols-6 gap-1 p-1 bg-stone-100 rounded-xl">
            {(
              [
                { type: 'goat', label: 'Goat', icon: '🐐' },
                { type: 'breeding', label: 'Breed', icon: '🧬' },
                { type: 'health', label: 'Health', icon: '💊' },
                { type: 'milk', label: 'Milk', icon: '🥛' },
                { type: 'sale', label: 'Sale', icon: '💰' },
                { type: 'worker', label: 'Staff', icon: '👷' },
              ] as const
            ).map(item => (
              <button
                key={item.type}
                type="button"
                id={`btn-select-type-${item.type}`}
                onClick={() => {
                  setRecordType(item.type);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex flex-col items-center py-1.5 px-1 rounded-lg text-xs font-medium transition-all ${
                  recordType === item.type
                    ? 'bg-white text-emerald-800 font-bold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
                <span className="text-[11px] truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mx-6 mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-1.5 font-medium">
            <Check className="w-4 h-4 text-emerald-600" />
            {successMsg}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
          {/* TYPE: GOAT */}
          {recordType === 'goat' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Tag Number (Unique Ear ID) *
                </label>
                <input
                  id="input-goat-tag"
                  type="text"
                  placeholder="e.g. GT-109"
                  value={goatTag}
                  onChange={e => setGoatTag(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Breed *
                  </label>
                  <input
                    id="input-goat-breed"
                    type="text"
                    placeholder="Boer, Galla, Saanen..."
                    value={goatBreed}
                    onChange={e => setGoatBreed(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Gender *
                  </label>
                  <select
                    id="select-goat-gender"
                    value={goatGender}
                    onChange={e => setGoatGender(e.target.value as 'Male' | 'Female')}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Female">Female (Doe)</option>
                    <option value="Male">Male (Buck)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    id="input-goat-dob"
                    type="date"
                    value={goatDob}
                    onChange={e => setGoatDob(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Current Weight (kg)
                  </label>
                  <input
                    id="input-goat-weight"
                    type="number"
                    value={goatWeight}
                    onChange={e => setGoatWeight(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* TYPE: BREEDING */}
          {recordType === 'breeding' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Female Tag (Dam) *
                  </label>
                  <input
                    id="input-breed-female"
                    type="text"
                    placeholder="e.g. GT-102"
                    value={breedFemale}
                    onChange={e => setBreedFemale(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Male Tag (Sire) *
                  </label>
                  <input
                    id="input-breed-male"
                    type="text"
                    placeholder="e.g. GT-101"
                    value={breedMale}
                    onChange={e => setBreedMale(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Mating Date *
                  </label>
                  <input
                    id="input-breed-mating-date"
                    type="date"
                    value={matingDate}
                    onChange={e => handleMatingOrGestationChange(e.target.value, gestationDays)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Gestation Days (145–155d)
                  </label>
                  <input
                    id="input-breed-gestation"
                    type="number"
                    min={140}
                    max={160}
                    value={gestationDays}
                    onChange={e => handleMatingOrGestationChange(matingDate, e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <label className="block text-xs font-semibold text-emerald-900 mb-0.5">
                  Predicted Kidding Date (Calculated):
                </label>
                <div className="text-sm font-bold text-emerald-800 font-mono">
                  {expectedBirth || 'Select mating date'}
                </div>
              </div>
            </>
          )}

          {/* TYPE: HEALTH */}
          {recordType === 'health' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Goat Tag ID *
                  </label>
                  <input
                    id="input-health-goat-id"
                    type="text"
                    placeholder="e.g. GT-103"
                    value={healthGoatId}
                    onChange={e => setHealthGoatId(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Checkup Type
                  </label>
                  <select
                    id="select-checkup-type"
                    value={checkupType}
                    onChange={e => {
                      const val = e.target.value as any;
                      setCheckupType(val);
                      if (val === 'Pregnancy Check') setIsPregnant(true);
                    }}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Routine">Routine Inspection</option>
                    <option value="Pregnancy Check">Pregnancy / Ultrasound Check</option>
                    <option value="Vaccination">Vaccination (CD/T, etc.)</option>
                    <option value="Deworming">Deworming Drench</option>
                    <option value="Illness">Illness / Treatment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Condition / Clinical Observation
                </label>
                <input
                  id="input-health-condition"
                  type="text"
                  placeholder="e.g. Good health, or Weak / Fever"
                  value={healthCondition}
                  onChange={e => setHealthCondition(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Treatment / Medication Administered
                </label>
                <input
                  id="input-health-treatment"
                  type="text"
                  placeholder="e.g. CD/T booster, Albendazole, or Mineral lick"
                  value={healthTreatment}
                  onChange={e => setHealthTreatment(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Pregnancy / Gestation details toggle */}
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800">
                  <input
                    type="checkbox"
                    checked={isPregnant}
                    onChange={e => setIsPregnant(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Observed Pregnant (Sync to Breeding Predictor)</span>
                </label>

                {isPregnant && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Observed Fetal Age (Days)
                      </label>
                      <input
                        type="number"
                        min={10}
                        max={145}
                        value={fetalAgeDays}
                        onChange={e => setFetalAgeDays(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Attending Vet / Practitioner
                      </label>
                      <input
                        type="text"
                        placeholder="Dr. Mutua"
                        value={vetName}
                        onChange={e => setVetName(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Checkup Date
                </label>
                <input
                  id="input-health-date"
                  type="date"
                  value={healthDate}
                  onChange={e => setHealthDate(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </>
          )}

          {/* TYPE: MILK */}
          {recordType === 'milk' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Goat Tag ID (Lactating Doe) *
                  </label>
                  <input
                    id="input-milk-goat-id"
                    type="text"
                    placeholder="e.g. GT-104"
                    value={milkGoatId}
                    onChange={e => setMilkGoatId(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Date *
                  </label>
                  <input
                    id="input-milk-date"
                    type="date"
                    value={milkDate}
                    onChange={e => setMilkDate(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Morning Yield (Liters)
                  </label>
                  <input
                    id="input-milk-morning"
                    type="number"
                    step="0.1"
                    min="0"
                    value={morningLiters}
                    onChange={e => setMorningLiters(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Evening Yield (Liters)
                  </label>
                  <input
                    id="input-milk-evening"
                    type="number"
                    step="0.1"
                    min="0"
                    value={eveningLiters}
                    onChange={e => setEveningLiters(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-900">Total Daily Production:</span>
                <span className="text-base font-bold text-emerald-800 font-mono">
                  {((parseFloat(morningLiters) || 0) + (parseFloat(eveningLiters) || 0)).toFixed(2)} Liters
                </span>
              </div>
            </>
          )}

          {/* TYPE: SALE */}
          {recordType === 'sale' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Goat Tag ID *
                </label>
                <input
                  id="input-sale-goat-id"
                  type="text"
                  placeholder="e.g. GT-089"
                  value={saleGoatId}
                  onChange={e => setSaleGoatId(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Buyer Name
                  </label>
                  <input
                    id="input-sale-buyer"
                    type="text"
                    placeholder="David Mwangi"
                    value={saleBuyer}
                    onChange={e => setSaleBuyer(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Sale Price (Ksh) *
                  </label>
                  <input
                    id="input-sale-price"
                    type="number"
                    placeholder="25000"
                    value={salePrice}
                    onChange={e => setSalePrice(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Sale Date
                </label>
                <input
                  id="input-sale-date"
                  type="date"
                  value={saleDate}
                  onChange={e => setSaleDate(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </>
          )}

          {/* TYPE: WORKER */}
          {recordType === 'worker' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Name *
                </label>
                <input
                  id="input-worker-name"
                  type="text"
                  placeholder="e.g. Samuel Kipchoge"
                  value={workerName}
                  onChange={e => setWorkerName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    id="input-worker-phone"
                    type="text"
                    placeholder="+254 7..."
                    value={workerPhone}
                    onChange={e => setWorkerPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Assigned Barn / Area
                  </label>
                  <input
                    id="input-worker-location"
                    type="text"
                    placeholder="Maternity Pen, Pasture..."
                    value={workerLocation}
                    onChange={e => setWorkerLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Submit Action */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-record"
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs"
            >
              Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
