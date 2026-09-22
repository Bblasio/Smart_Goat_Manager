import React, { useState } from 'react';
import {
  GoatRecord,
  HealthRecord,
  BreedingRecord,
  SaleRecord,
} from '../types';
import {
  Search,
  Eye,
  Edit2,
  GitFork,
  MoreHorizontal,
  Settings,
  X,
  Check,
  Tag,
  Clock,
  Archive,
  ArrowRightLeft,
  Stethoscope,
  Trash2,
  Calendar,
  Weight,
  Layers
} from 'lucide-react';

interface GoatRecordsTableTemplateProps {
  goats: GoatRecord[];
  health: HealthRecord[];
  breeding: BreedingRecord[];
  sales: SaleRecord[];
  isBulkMode: boolean;
  selectedGoatIds: string[];
  onToggleSelectGoat: (id: string) => void;
  onSelectAllFiltered: (checked: boolean) => void;
  onUpdateGoatStatus: (id: string, newStatus: GoatRecord['status']) => void;
  onEditGoat: (goat: GoatRecord) => void;
  onDeleteGoat: (id: string) => void;
  onViewPedigree: (goat: GoatRecord) => void;
  onNavigateToHealthWithGoat?: (goatTag: string) => void;
}

export const GoatRecordsTableTemplate: React.FC<GoatRecordsTableTemplateProps> = ({
  goats,
  health,
  breeding,
  sales,
  isBulkMode,
  selectedGoatIds,
  onToggleSelectGoat,
  onSelectAllFiltered,
  onUpdateGoatStatus,
  onEditGoat,
  onDeleteGoat,
  onViewPedigree,
  onNavigateToHealthWithGoat,
}) => {
  const [activeMenuGoatId, setActiveMenuGoatId] = useState<string | null>(null);
  const [quickViewGoat, setQuickViewGoat] = useState<GoatRecord | null>(null);
  const [quickEditGoat, setQuickEditGoat] = useState<GoatRecord | null>(null);
  const [sortField, setSortField] = useState<'tag' | 'status' | 'breed' | 'gender' | 'weight' | 'dob'>('tag');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Edit form state
  const [editTag, setEditTag] = useState('');
  const [editName, setEditName] = useState('');
  const [editBreed, setEditBreed] = useState('');
  const [editGender, setEditGender] = useState<'Male' | 'Female'>('Female');
  const [editWeight, setEditWeight] = useState<number | ''>('');
  const [editDob, setEditDob] = useState('');
  const [editStatus, setEditStatus] = useState<GoatRecord['status']>('Active');

  const handleOpenEdit = (goat: GoatRecord) => {
    setQuickEditGoat(goat);
    setEditTag(goat.tag_number);
    setEditName(goat.name || '');
    setEditBreed(goat.breed);
    setEditGender(goat.gender);
    setEditWeight(goat.weight_kg || '');
    setEditDob(goat.dob || '');
    setEditStatus(goat.status);
    setActiveMenuGoatId(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEditGoat) return;
    onEditGoat({
      ...quickEditGoat,
      tag_number: editTag,
      name: editName,
      breed: editBreed,
      gender: editGender,
      weight_kg: editWeight === '' ? undefined : Number(editWeight),
      dob: editDob,
      status: editStatus,
    });
    setQuickEditGoat(null);
  };

  // Helper to determine effective status
  const getGoatEffectiveStatus = (goat: GoatRecord): GoatRecord['status'] => {
    if (goat.status === 'Sold') return 'Sold';
    if (goat.status === 'Dead') return 'Dead';
    if (goat.status === 'Quarantine') return 'Quarantine';
    const isCurrentlyBreeding = breeding.some(
      b => b.female_id === goat.tag_number && (b.status === 'Active' || !b.status)
    );
    if (isCurrentlyBreeding && goat.gender === 'Female') return 'Pregnant';
    return goat.status || 'Active';
  };

  // Helper for health info
  const getGoatHealthInfo = (goat: GoatRecord) => {
    const records = health
      .filter(h => h.goat_id === goat.tag_number || h.goat_id === goat.id)
      .sort((a, b) => new Date(b.checkup_date).getTime() - new Date(a.checkup_date).getTime());
    const latest = records[0];

    const isBreeding = breeding.some(
      b => b.female_id === goat.tag_number && (b.status === 'Active' || !b.status)
    );

    if (latest) {
      const isSick =
        latest.status === 'Under Treatment' ||
        latest.status === 'Critical' ||
        latest.condition?.toLowerCase().includes('sick') ||
        latest.condition?.toLowerCase().includes('fever') ||
        latest.condition?.toLowerCase().includes('mastitis');

      const isPreg =
        latest.checkup_type === 'Pregnancy Check' ||
        latest.is_pregnant ||
        goat.status === 'Pregnant' ||
        isBreeding;

      if (isSick) {
        return {
          status: 'Sick' as const,
          badgeLabel: 'Sick',
          subtitle: latest.condition || `Checked: ${formatDateDisplay(latest.checkup_date)}`,
          date: latest.checkup_date,
        };
      }

      if (isPreg) {
        let gestWeeks = '';
        if (latest.fetal_age_days) {
          gestWeeks = `Gestation: ${Math.round(latest.fetal_age_days / 7)} weeks`;
        } else {
          gestWeeks = `Checked: ${formatDateDisplay(latest.checkup_date)}`;
        }
        return {
          status: 'Pregnant' as const,
          badgeLabel: 'Pregnant',
          subtitle: latest.condition?.includes('Routine') ? `${latest.condition} Checked: ${latest.checkup_date}` : gestWeeks,
          date: latest.checkup_date,
        };
      }

      return {
        status: 'Healthy' as const,
        badgeLabel: 'Healthy',
        subtitle: `Checked: ${formatDateDisplay(latest.checkup_date)}`,
        date: latest.checkup_date,
      };
    }

    if (isBreeding || goat.status === 'Pregnant') {
      return {
        status: 'Pregnant' as const,
        badgeLabel: 'Pregnant',
        subtitle: 'Gestation: Active cycle',
        date: undefined,
      };
    }

    return {
      status: 'Healthy' as const,
      badgeLabel: 'Healthy',
      subtitle: `Checked: 2 Aug 2026`,
      date: '2026-08-02',
    };
  };

  // Helper for sale record
  const getSaleInfo = (goat: GoatRecord) => {
    const sale = sales.find(s => s.goat_id === goat.tag_number || s.goat_id === goat.id);
    if (!sale) return null;
    return `Ksh ${Number(sale.price).toLocaleString()}`;
  };

  // Date formatter
  function formatDateDisplay(dStr?: string) {
    if (!dStr) return '—';
    try {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const monthNum = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${day} ${months[monthNum - 1] || parts[1]} ${year}`;
      }
      return dStr;
    } catch {
      return dStr;
    }
  }

  // Sorting
  const sortedGoats = [...goats].sort((a, b) => {
    let comp = 0;
    if (sortField === 'tag') comp = a.tag_number.localeCompare(b.tag_number);
    else if (sortField === 'status') comp = (a.status || '').localeCompare(b.status || '');
    else if (sortField === 'breed') comp = a.breed.localeCompare(b.breed);
    else if (sortField === 'gender') comp = a.gender.localeCompare(b.gender);
    else if (sortField === 'weight') comp = (a.weight_kg || 0) - (b.weight_kg || 0);
    else if (sortField === 'dob') comp = (a.dob || '').localeCompare(b.dob || '');
    return sortOrder === 'asc' ? comp : -comp;
  });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const isAllSelected = goats.length > 0 && selectedGoatIds.length === goats.length;
  const isIndeterminate = selectedGoatIds.length > 0 && selectedGoatIds.length < goats.length;

  return (
    <div className="w-full">
      {/* Table Container matching the template */}
      <div className="bg-[#fbfbfa] dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse record-table-grid">
            {/* Table Header matching the template columns */}
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 bg-[#f7f6f3] dark:bg-stone-800/80 text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider select-none">
                {isBulkMode && (
                  <th className="px-4 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={el => {
                        if (el) el.indeterminate = isIndeterminate;
                      }}
                      onChange={e => onSelectAllFiltered(e.target.checked)}
                      className="rounded border-stone-300 dark:border-stone-600 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      title="Select All Records"
                    />
                  </th>
                )}

                <th
                  onClick={() => toggleSort('tag')}
                  className="px-6 py-4 cursor-pointer hover:text-stone-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>TAG & NAME</span>
                    <span className="text-stone-400 font-mono text-[10px]">⇅</span>
                  </div>
                </th>

                <th className="px-6 py-4">CURRENT HEALTH</th>

                <th
                  onClick={() => toggleSort('status')}
                  className="px-6 py-4 cursor-pointer hover:text-stone-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>HERD STATUS</span>
                    <span className="text-stone-400 font-mono text-[10px]">⇅</span>
                  </div>
                </th>

                <th
                  onClick={() => toggleSort('breed')}
                  className="px-6 py-4 cursor-pointer hover:text-stone-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>BREED</span>
                    <span className="text-stone-400 font-mono text-[10px]">⇅</span>
                  </div>
                </th>

                <th
                  onClick={() => toggleSort('gender')}
                  className="px-6 py-4 cursor-pointer hover:text-stone-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>GENDER</span>
                    <span className="text-stone-400 font-mono text-[10px]">⇅</span>
                  </div>
                </th>

                <th
                  onClick={() => toggleSort('weight')}
                  className="px-6 py-4 cursor-pointer hover:text-stone-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>WEIGHT (KG)</span>
                    <span className="text-stone-400 font-mono text-[10px]">⇅</span>
                  </div>
                </th>

                <th className="px-6 py-4">DATE OF BIRTH</th>

                <th className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span>ACTIONS</span>
                    <Settings className="w-3.5 h-3.5 text-stone-400" />
                  </div>
                </th>
              </tr>
            </thead>

            {/* Table Body with Row-Tinting matching the template */}
            <tbody className="divide-y divide-stone-200/70 dark:divide-stone-800/80">
              {sortedGoats.length > 0 ? (
                sortedGoats.map(goat => {
                  const effectiveStatus = getGoatEffectiveStatus(goat);
                  const healthInfo = getGoatHealthInfo(goat);
                  const salePrice = effectiveStatus === 'Sold' ? getSaleInfo(goat) : null;
                  const isSelected = selectedGoatIds.includes(goat.id);

                  // Row background tint logic matching Image 2:
                  // - Pregnant: soft lavender #f4eefb
                  // - Sold: soft peach #fef4e8
                  // - Quarantine: soft warm yellow #fefce8
                  // - Active/Default: off-white
                  let rowBgClass = 'bg-white dark:bg-stone-900 hover:bg-stone-50/80 dark:hover:bg-stone-800/60';
                  if (effectiveStatus === 'Pregnant') {
                    rowBgClass = 'bg-[#f4eefb] dark:bg-purple-950/25 hover:bg-[#ede4f8] dark:hover:bg-purple-950/40';
                  } else if (effectiveStatus === 'Sold') {
                    rowBgClass = 'bg-[#fef4e8] dark:bg-amber-950/25 hover:bg-[#fae8d4] dark:hover:bg-amber-950/40';
                  } else if (effectiveStatus === 'Quarantine') {
                    rowBgClass = 'bg-[#fefce8] dark:bg-yellow-950/25 hover:bg-[#fef9c3] dark:hover:bg-yellow-950/40';
                  }

                  return (
                    <tr
                      key={goat.id}
                      className={`transition-colors ${rowBgClass} ${
                        isSelected ? 'ring-2 ring-amber-500/60 ring-inset' : ''
                      }`}
                    >
                      {/* Column 1: Checkbox (conditional on isBulkMode) */}
                      {isBulkMode && (
                        <td className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleSelectGoat(goat.id)}
                            className="rounded border-stone-300 dark:border-stone-600 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                            title={`Select ${goat.tag_number}`}
                          />
                        </td>
                      )}

                      {/* Column 2: Tag & Name with circular avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* Circular goat avatar */}
                          <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-700/80 border border-stone-300/80 dark:border-stone-600 flex items-center justify-center shrink-0 text-stone-600 dark:text-stone-300 shadow-2xs">
                            <span className="text-base select-none">🐐</span>
                          </div>

                          <div>
                            <div className="font-extrabold text-stone-900 dark:text-stone-100 font-mono text-sm tracking-tight">
                              {goat.tag_number}
                            </div>
                            <div className="mt-1">
                              <span className="px-2.5 py-0.5 rounded-full border border-stone-300 dark:border-stone-700 bg-white/80 dark:bg-stone-800 text-[11px] text-stone-600 dark:text-stone-300 font-medium inline-block shadow-2xs">
                                {goat.name || 'Name'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Current Health */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          {healthInfo.status === 'Healthy' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0] dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800">
                              <span className="w-2 h-2 rounded-full bg-[#16a34a] dark:bg-emerald-400" />
                              Healthy
                            </span>
                          )}

                          {healthInfo.status === 'Pregnant' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#f3e8ff] text-[#7e22ce] border border-[#e9d5ff] dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800">
                              <Clock className="w-3 h-3 text-[#9333ea] dark:text-purple-400" />
                              Pregnant
                            </span>
                          )}

                          {healthInfo.status === 'Sick' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#ffe4e6] text-[#be123c] border border-[#fecdd3] dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800">
                              <span className="w-2 h-2 rounded-full bg-[#e11d48]" />
                              Sick
                            </span>
                          )}

                          {healthInfo.subtitle && (
                            <span className="text-[11px] text-stone-500 dark:text-stone-400 max-w-[200px] truncate" title={healthInfo.subtitle}>
                              {healthInfo.subtitle}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 4: Herd Status (Static Badge + Price if Sold) */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          {effectiveStatus === 'Active' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          )}
                          {effectiveStatus === 'Pregnant' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800 shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-purple-500" />
                              Pregnant
                            </span>
                          )}
                          {effectiveStatus === 'Sold' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              Sold
                            </span>
                          )}
                          {effectiveStatus === 'Quarantine' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-950/80 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800 shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-yellow-500" />
                              Quarantine
                            </span>
                          )}
                          {effectiveStatus === 'Dead' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              Dead
                            </span>
                          )}

                          {/* Price below if Sold */}
                          {effectiveStatus === 'Sold' && (
                            <span className="text-xs font-bold text-stone-900 dark:text-stone-100 font-mono mt-0.5">
                              {salePrice || 'Ksh 30,000'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 5: Breed */}
                      <td className="px-6 py-4 text-stone-700 dark:text-stone-300 font-medium">
                        {goat.breed}
                      </td>

                      {/* Column 6: Gender */}
                      <td className="px-6 py-4">
                        {goat.gender === 'Female' ? (
                          <span className="text-fuchsia-600 dark:text-fuchsia-400 font-semibold text-xs flex items-center gap-1">
                            <span>♀</span>
                            <span>Female</span>
                          </span>
                        ) : (
                          <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs flex items-center gap-1">
                            <span>♂</span>
                            <span>Male</span>
                          </span>
                        )}
                      </td>

                      {/* Column 7: Weight (kg) */}
                      <td className="px-6 py-4 font-extrabold text-stone-900 dark:text-stone-100 font-mono text-xs">
                        {goat.weight_kg ? `${goat.weight_kg} kg` : '45 kg'}
                      </td>

                      {/* Column 8: Date of Birth */}
                      <td className="px-6 py-4 text-stone-600 dark:text-stone-400 font-mono text-xs whitespace-nowrap">
                        {formatDateDisplay(goat.dob)}
                      </td>

                      {/* Column 9: 4 Action Buttons matching Image 2 */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. Eye Button: Quick Inspect */}
                          <button
                            type="button"
                            onClick={() => setQuickViewGoat(goat)}
                            className="w-8 h-8 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-100/90 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 transition-colors shadow-2xs"
                            title="Inspect Goat Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* 2. Pencil Button: Edit Goat */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(goat)}
                            className="w-8 h-8 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-100/90 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 transition-colors shadow-2xs"
                            title="Edit Goat Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* 3. Pedigree Tree Button */}
                          <button
                            type="button"
                            onClick={() => onViewPedigree(goat)}
                            className="w-8 h-8 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-100/90 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 transition-colors shadow-2xs"
                            title="View Pedigree Tree"
                          >
                            <GitFork className="w-4 h-4" />
                          </button>

                          {/* 4. More Options Button (...) */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveMenuGoatId(activeMenuGoatId === goat.id ? null : goat.id)}
                              className="w-8 h-8 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-100/90 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 transition-colors shadow-2xs"
                              title="More Options"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu matching the template */}
                            {activeMenuGoatId === goat.id && (
                              <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl z-30 py-1 text-left animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onUpdateGoatStatus(goat.id, 'Quarantine');
                                    setActiveMenuGoatId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2"
                                >
                                  <Archive className="w-3.5 h-3.5 text-stone-400" />
                                  <span>Archive</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    handleOpenEdit(goat);
                                    setActiveMenuGoatId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2"
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5 text-stone-400" />
                                  <span>Move Pen</span>
                                </button>

                                {onNavigateToHealthWithGoat && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onNavigateToHealthWithGoat(goat.tag_number);
                                      setActiveMenuGoatId(null);
                                    }}
                                    className="w-full px-3.5 py-2 text-xs text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2"
                                  >
                                    <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Medical Log</span>
                                  </button>
                                )}

                                <div className="border-t border-stone-100 dark:border-stone-800 my-1" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteGoat(goat.id);
                                    setActiveMenuGoatId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete Record</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-stone-500 dark:text-stone-400 text-sm">
                    No goat records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick View Modal */}
      {quickViewGoat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-xl">
                  🐐
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-white font-mono">
                    {quickViewGoat.tag_number}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {quickViewGoat.name || 'Unnamed Goat'} • {quickViewGoat.breed}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickViewGoat(null)}
                className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                <span className="text-stone-400 font-semibold uppercase text-[10px]">Gender</span>
                <p className="font-bold text-stone-800 dark:text-stone-200 mt-0.5">{quickViewGoat.gender}</p>
              </div>
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                <span className="text-stone-400 font-semibold uppercase text-[10px]">Current Status</span>
                <p className="font-bold text-stone-800 dark:text-stone-200 mt-0.5">{quickViewGoat.status}</p>
              </div>
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                <span className="text-stone-400 font-semibold uppercase text-[10px]">Weight</span>
                <p className="font-bold text-stone-800 dark:text-stone-200 mt-0.5">
                  {quickViewGoat.weight_kg ? `${quickViewGoat.weight_kg} kg` : '45 kg'}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800">
                <span className="text-stone-400 font-semibold uppercase text-[10px]">Date of Birth</span>
                <p className="font-bold text-stone-800 dark:text-stone-200 mt-0.5 font-mono">
                  {formatDateDisplay(quickViewGoat.dob)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => {
                  onViewPedigree(quickViewGoat);
                  setQuickViewGoat(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 flex items-center gap-1.5"
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>Pedigree Tree</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleOpenEdit(quickViewGoat);
                  setQuickViewGoat(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Goat</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Edit Modal */}
      {quickEditGoat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-bold text-stone-900 dark:text-white">
                  Edit Goat: {quickEditGoat.tag_number}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQuickEditGoat(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-stone-600 dark:text-stone-400 font-semibold mb-1">Tag Number</label>
                <input
                  type="text"
                  value={editTag}
                  onChange={e => setEditTag(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-stone-600 dark:text-stone-400 font-semibold mb-1">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="e.g. Apollo"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-stone-600 dark:text-stone-400 font-semibold mb-1">Breed</label>
                <input
                  type="text"
                  value={editBreed}
                  onChange={e => setEditBreed(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-stone-600 dark:text-stone-400 font-semibold mb-1">Gender</label>
                <select
                  value={editGender}
                  onChange={e => setEditGender(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-600 dark:text-stone-400 font-semibold mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={editWeight}
                  onChange={e => setEditWeight(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="45"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-stone-600 dark:text-stone-400 font-semibold mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Active">Active</option>
                  <option value="Pregnant">Pregnant</option>
                  <option value="Quarantine">Quarantine</option>
                  <option value="Sold">Sold</option>
                  <option value="Dead">Dead (Deceased)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-stone-600 dark:text-stone-400 font-semibold mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={editDob}
                  onChange={e => setEditDob(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setQuickEditGoat(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
