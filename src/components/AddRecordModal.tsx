import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { useToast } from '../context/ToastContext';
import { RecordType, ExpenseCategory } from '../types';
import { X, Check, Baby, Milk, Stethoscope, FileSpreadsheet, Camera } from 'lucide-react';
import { ExcelImportModal } from './ExcelImportModal';
import { GoatAvatar } from './GoatAvatar';

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
  const { addGoat, addBreeding, addHealth, addSale, addExpense, addWorker, addMilk, goats } = useFarm();
  const { showToast } = useToast();
  const [recordType, setRecordType] = useState<RecordType>(defaultType);
  const [isExcelOpen, setIsExcelOpen] = useState(false);

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

  // Expense form state
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('Feed');
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(todayStr);
  const [expReceipt, setExpReceipt] = useState('');
  const [expNotes, setExpNotes] = useState('');

  // Goat form state
  const [goatTag, setGoatTag] = useState('');
  const [goatName, setGoatName] = useState('');
  const [goatBreed, setGoatBreed] = useState('Boer');
  const [goatGender, setGoatGender] = useState<'Male' | 'Female'>('Female');
  const [goatDob, setGoatDob] = useState(todayStr);
  const [goatWeight, setGoatWeight] = useState('45');
  const [goatStatus, setGoatStatus] = useState<'Active' | 'Pregnant' | 'Quarantine' | 'Sold'>('Active');
  const [goatPhoto, setGoatPhoto] = useState<string | undefined>(undefined);

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
  const [healthStatus, setHealthStatus] = useState<'Healthy' | 'Under Treatment' | 'Critical' | 'Recovered' | 'Observation'>('Healthy');
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
          name: goatName.trim() || undefined,
          breed: goatBreed.trim(),
          gender: goatGender,
          dob: goatDob,
          weight_kg: parseFloat(goatWeight) || 45,
          status: goatStatus,
          photo_url: goatPhoto || undefined,
        });
        setSuccessMsg(`Goat ${goatTag.trim().toUpperCase()}${goatName ? ` (${goatName})` : ''} added successfully!`);
        setGoatTag('');
        setGoatName('');
        setGoatPhoto(undefined);
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
          status: healthStatus,
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
          setErrorMsg('Goat Tag ID or Name is required.');
          return;
        }
        const trimmedInput = saleGoatId.trim();
        const existingGoat = goats.find(
          g => g.tag_number.toUpperCase() === trimmedInput.toUpperCase() ||
               g.id === trimmedInput ||
               (g.name && g.name.trim().toLowerCase() === trimmedInput.toLowerCase())
        );
        if (!existingGoat) {
          setErrorMsg(`Cannot sell goat: "${trimmedInput}" was not found in your herd list by Tag ID or Name.`);
          return;
        }
        if (existingGoat.status === 'Sold') {
          setErrorMsg(`Cannot sell goat: Goat ${existingGoat.tag_number}${existingGoat.name ? ` (${existingGoat.name})` : ''} is already marked as Sold.`);
          return;
        }
        if (existingGoat.status === 'Dead') {
          setErrorMsg(`Cannot sell goat: Goat ${existingGoat.tag_number}${existingGoat.name ? ` (${existingGoat.name})` : ''} is recorded as Deceased / Dead.`);
          return;
        }

        const numericPrice = parseFloat(salePrice);
        if (isNaN(numericPrice) || numericPrice < 0) {
          setErrorMsg('Please enter a valid sale price.');
          return;
        }
        addSale({
          goat_id: existingGoat.tag_number,
          buyer_name: saleBuyer.trim() || 'Private Buyer',
          price: numericPrice,
          sale_date: saleDate,
        });
        setSuccessMsg(`Sale of ${existingGoat.tag_number}${existingGoat.name ? ` (${existingGoat.name})` : ''} for Ksh ${numericPrice.toLocaleString()} recorded! Status updated to Sold.`);
        setSaleGoatId('');
        setSaleBuyer('');
        setSalePrice('');
      } else if (recordType === 'expense') {
        if (!expTitle.trim()) {
          setErrorMsg('Expense description is required.');
          return;
        }
        const numericAmount = parseFloat(expAmount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
          setErrorMsg('Please enter a valid expense amount.');
          return;
        }
        addExpense({
          category: expCategory,
          title: expTitle.trim(),
          amount: numericAmount,
          date: expDate || todayStr,
          receipt_number: expReceipt.trim() || undefined,
          notes: expNotes.trim() || undefined,
        });
        setSuccessMsg(`Expense "${expTitle.trim()}" of Ksh ${numericAmount.toLocaleString()} recorded!`);
        setExpTitle('');
        setExpAmount('');
        setExpReceipt('');
        setExpNotes('');
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

      showToast(`New ${recordType} record saved successfully!`, 'success');

      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 900);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error adding record');
      showToast(err.message || 'Error adding record', 'error');
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
          <div className="grid grid-cols-7 gap-1 p-1 bg-stone-100 rounded-xl">
            {(
              [
                { type: 'goat', label: 'Goat', icon: '📋' },
                { type: 'breeding', label: 'Breed', icon: '🧬' },
                { type: 'health', label: 'Health', icon: '💊' },
                { type: 'milk', label: 'Milk', icon: '🥛' },
                { type: 'sale', label: 'Sale', icon: '💰' },
                { type: 'expense', label: 'Expense', icon: '💸' },
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

          {/* Constant Excel Spreadsheet Ingestion Banner */}
          <div className="mt-3 px-3.5 py-2.5 bg-emerald-50/90 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-900 font-medium">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Have spreadsheet logs? Upload Excel (.xlsx)</span>
            </div>
            <button
              type="button"
              id="btn-add-record-open-excel"
              onClick={() => setIsExcelOpen(true)}
              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shrink-0 transition-colors shadow-xs text-[11px]"
            >
              Upload Excel File →
            </button>
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
              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Goat Name (Optional)
                  </label>
                  <input
                    id="input-goat-name"
                    type="text"
                    placeholder="e.g. Bella, Apollo"
                    value={goatName}
                    onChange={e => setGoatName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
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

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Herd Status *
                  </label>
                  <select
                    id="select-goat-status"
                    value={goatStatus}
                    onChange={e => setGoatStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Pregnant">Pregnant</option>
                    <option value="Quarantine">Quarantine</option>
                    <option value="Sold">Sold</option>
                    <option value="Dead">Dead (Deceased)</option>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    Health Status *
                  </label>
                  <select
                    id="select-health-status"
                    value={healthStatus}
                    onChange={e => setHealthStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Healthy">Healthy / Normal</option>
                    <option value="Under Treatment">Under Treatment</option>
                    <option value="Critical">Critical</option>
                    <option value="Recovered">Recovered</option>
                    <option value="Observation">Observation</option>
                  </select>
                </div>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Select Goat by ID or Name to Sell *
                  </label>
                  <span className="text-[11px] text-stone-500 font-medium">
                    {goats.filter(g => g.status !== 'Sold' && g.status !== 'Dead').length} available to sell
                  </span>
                </div>

                {goats.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    ⚠️ No goats currently registered in your herd. You must first register a goat before you can record a sale.
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <select
                        id="select-sale-goat-id"
                        value={saleGoatId}
                        onChange={e => setSaleGoatId(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono bg-white"
                      >
                        <option value="">-- Choose Goat from Herd or Type Below --</option>
                        {goats.map(g => (
                          <option
                            key={g.id}
                            value={g.tag_number}
                            disabled={g.status === 'Sold' || g.status === 'Dead'}
                          >
                            {g.tag_number} {g.name ? `(${g.name})` : ''} - {g.breed} [{g.status || 'Active'}]{g.status === 'Sold' ? ' — Already Sold' : g.status === 'Dead' ? ' — Deceased (Dead)' : ''}
                          </option>
                        ))}
                      </select>

                      <div className="relative">
                        <input
                          id="input-sale-goat-id-or-name"
                          type="text"
                          placeholder="Or type Goat ID (e.g. GT-101) or Goat Name (e.g. Bella)..."
                          value={saleGoatId}
                          onChange={e => setSaleGoatId(e.target.value)}
                          className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                        <span className="text-[10px] text-stone-400 mt-1 block">
                          Tip: Entering Goat ID or Name will automatically update that goat's status to <strong>Sold</strong>.
                        </span>
                      </div>
                    </div>

                    {/* Quick helper feedback when a goat is selected */}
                    {saleGoatId && (() => {
                      const trimmed = saleGoatId.trim().toUpperCase();
                      const sel = goats.find(
                        g => g.tag_number.toUpperCase() === trimmed ||
                             (g.name && g.name.trim().toUpperCase() === trimmed) ||
                             g.id === saleGoatId.trim()
                      );
                      if (!sel) return null;
                      return (
                        <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                          <span className="font-semibold">
                            {sel.tag_number} {sel.name ? `• ${sel.name}` : ''} • {sel.breed} ({sel.gender})
                          </span>
                          <span className="text-[11px] font-mono bg-emerald-100 px-2 py-0.5 rounded-md text-emerald-800">
                            Status: {sel.status || 'Active'}
                          </span>
                        </div>
                      );
                    })()}
                  </>
                )}
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

          {/* TYPE: EXPENSE */}
          {recordType === 'expense' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Expense Category *
                  </label>
                  <select
                    id="select-expense-category"
                    value={expCategory}
                    onChange={e => setExpCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Feed">🌾 Feed & Nutrition</option>
                    <option value="Vet">🩺 Veterinary & Health</option>
                    <option value="Equipment">🔧 Equipment & Hardware</option>
                    <option value="Labor">👷 Farm Labor</option>
                    <option value="Other">🏷️ Other Operating Cost</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Amount (Ksh) *
                  </label>
                  <input
                    id="input-expense-amount"
                    type="number"
                    min="1"
                    placeholder="e.g. 8500"
                    value={expAmount}
                    onChange={e => setExpAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Description / Item Title *
                </label>
                <input
                  id="input-expense-title"
                  type="text"
                  placeholder="e.g. High-protein dairy meal & mineral blocks"
                  value={expTitle}
                  onChange={e => setExpTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Expense Date *
                  </label>
                  <input
                    id="input-expense-date"
                    type="date"
                    value={expDate}
                    onChange={e => setExpDate(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Receipt / Voucher #
                  </label>
                  <input
                    id="input-expense-receipt"
                    type="text"
                    placeholder="e.g. REC-2026-904"
                    value={expReceipt}
                    onChange={e => setExpReceipt(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Notes / Supplier Details
                </label>
                <input
                  id="input-expense-notes"
                  type="text"
                  placeholder="e.g. Purchased from Rift Valley Agrovet, Nakuru"
                  value={expNotes}
                  onChange={e => setExpNotes(e.target.value)}
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

      {/* Embedded Excel Import Modal for constant access */}
      <ExcelImportModal
        isOpen={isExcelOpen}
        onClose={() => setIsExcelOpen(false)}
        defaultCategory={
          recordType === 'breeding'
            ? 'breeding'
            : recordType === 'health'
            ? 'health'
            : recordType === 'milk'
            ? 'milk'
            : 'goats'
        }
      />
    </div>
  );
};
