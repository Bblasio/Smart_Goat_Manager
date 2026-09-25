import React, { useState } from 'react';
import {
  GoatRecord,
  HealthRecord,
  BreedingRecord,
  SaleRecord,
} from '../types';
import { useUnits } from '../context/UnitsContext';
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
  Layers,
  ChevronDown,
  ChevronUp
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
  const { formatWeight, weightUnit, formatCurrency } = useUnits();
  const [activeMenuGoatId, setActiveMenuGoatId] = useState<string | null>(null);
  const [expandedMobileGoatIds, setExpandedMobileGoatIds] = useState<Record<string, boolean>>({});
  const [quickViewGoat, setQuickViewGoat] = useState<GoatRecord | null>(null);

  const toggleMobileExpand = (goatId: string) => {
    setExpandedMobileGoatIds(prev => ({
      ...prev,
      [goatId]: !prev[goatId],
    }));
  };
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
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | undefined>(undefined);

  const handleOpenEdit = (goat: GoatRecord) => {
    setQuickEditGoat(goat);
    setEditTag(goat.tag_number);
    setEditName(goat.name || '');
    setEditBreed(goat.breed);
    setEditGender(goat.gender);
    setEditWeight(goat.weight_kg || '');
    setEditDob(goat.dob || '');
    setEditStatus(goat.status);
    setEditPhotoUrl(goat.photo_url);
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
      photo_url: editPhotoUrl,
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
    return formatCurrency(sale.price);
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
      {/* Mobile Card-per-Row Fallback (visible on screens < 768px) */}
      <div className="block md:hidden space-y-3 mb-4">
        {sortedGoats.length > 0 ? (
          sortedGoats.map(goat => {
            const effectiveStatus = getGoatEffectiveStatus(goat);
            const healthInfo = getGoatHealthInfo(goat);
            const salePrice = effectiveStatus === 'Sold' ? getSaleInfo(goat) : null;
            const isSelected = selectedGoatIds.includes(goat.id);
            const isExpanded = !!expandedMobileGoatIds[goat.id];

            return (
              <div
                key={`mobile-${goat.id}`}
                className={`p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs transition-all ${
                  isSelected ? 'ring-2 ring-amber-500/60' : ''
                }`}
              >
                {/* Primary Card View: Tag & Name, Health Status, Breed */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {isBulkMode && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelectGoat(goat.id)}
                        className="rounded border-stone-300 dark:border-stone-600 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                        title={`Select ${goat.tag_number}`}
                      />
                    )}
                    <div>
                      <div className="font-extrabold text-stone-900 dark:text-stone-100 font-mono text-sm tracking-tight">
                        {goat.tag_number}
                      </div>
                      <div className="mt-0.5">
                        {goat.name && goat.name !== 'Unnamed Goat' ? (
                          <span className="px-2 py-0.5 rounded-full border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-[11px] text-stone-700 dark:text-stone-300 font-medium inline-block">
                            {goat.name}
                          </span>
                        ) : (
                          <span className="italic text-[#b7bab2] text-xs">No name</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Health Status Pill (Primary Field) */}
                  <div className="flex flex-col items-end gap-1">
                    {healthInfo.status === 'Healthy' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                        Healthy
                      </span>
                    )}
                    {healthInfo.status === 'Pregnant' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                        Pregnant
                      </span>
                    )}
                    {healthInfo.status === 'Sick' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#e11d48]" />
                        Critical
                      </span>
                    )}
                  </div>
                </div>

                {/* Primary Field: Breed */}
                <div className="mt-2.5 flex items-center justify-between text-xs text-stone-600 dark:text-stone-300 pt-2 border-t border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-1.5">
                    <span className="text-stone-400 text-[11px] uppercase tracking-wide">Breed:</span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                      {goat.breed || <span className="italic text-[#b7bab2] font-normal">—</span>}
                    </span>
                  </div>

                  {/* Tap to expand/collapse remaining fields */}
                  <button
                    type="button"
                    onClick={() => toggleMobileExpand(goat.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 p-1 rounded-md"
                  >
                    <span>{isExpanded ? 'Less' : 'Details'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="mt-2.5 pt-2.5 border-t border-dashed border-stone-200 dark:border-stone-800 space-y-2.5 text-xs animate-fade-in">
                    <div className="grid grid-cols-2 gap-2 text-stone-600 dark:text-stone-300">
                      <div>
                        <span className="text-stone-400 text-[10px] uppercase block">Herd Status</span>
                        <div className="mt-0.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              effectiveStatus === 'Active'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300'
                                : effectiveStatus === 'Pregnant'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300'
                                : effectiveStatus === 'Sold'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300'
                                : effectiveStatus === 'Quarantine'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/80 dark:text-yellow-300 border border-yellow-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300'
                            }`}
                          >
                            {effectiveStatus}
                          </span>
                          {salePrice !== null && (
                            <span className="block text-[11px] font-mono text-amber-700 dark:text-amber-400 font-bold mt-0.5">
                              {formatCurrency(salePrice)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-stone-400 text-[10px] uppercase block">Gender</span>
                        <span className="font-medium text-stone-800 dark:text-stone-200 mt-0.5 block">
                          {goat.gender === 'Female' ? '♀ Female' : '♂ Male'}
                        </span>
                      </div>

                      <div>
                        <span className="text-stone-400 text-[10px] uppercase block">Weight ({weightUnit})</span>
                        <span className="font-mono font-medium text-stone-800 dark:text-stone-200 mt-0.5 block">
                          {goat.weight_kg ? formatWeight(goat.weight_kg) : <span className="italic text-[#b7bab2] font-normal">—</span>}
                        </span>
                      </div>

                      <div>
                        <span className="text-stone-400 text-[10px] uppercase block">Date of Birth</span>
                        <span className="font-mono text-stone-800 dark:text-stone-200 mt-0.5 block">
                          {goat.dob ? formatDateDisplay(goat.dob) : <span className="italic text-[#b7bab2] font-normal">—</span>}
                        </span>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between gap-1 pt-2 border-t border-stone-100 dark:border-stone-800">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setQuickViewGoat(goat)}
                          className="px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1"
                          title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(goat)}
                          className="px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onViewPedigree(goat)}
                          className="px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1"
                          title="Breeding record"
                        >
                          <GitFork className="w-3.5 h-3.5" />
                          <span>Pedigree</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteGoat(goat.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-stone-500 text-sm">
            No goat records found matching your filters.
          </div>
        )}
      </div>

      {/* Table Container (visible on md+ with sticky header & 56px zebra rows) */}
      <div className="hidden md:block bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[calc(100vh-230px)] overflow-y-auto">
          <table className="w-full text-left text-sm border-collapse record-table-grid">
            {/* Sticky Table Header (#f7f6f2 with 1px bottom border) */}
            <thead className="sticky top-0 z-20 select-none">
              <tr className="border-b border-[#e5e5dc] dark:border-stone-700 bg-[#f7f6f2] dark:bg-stone-800 text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                {isBulkMode && (
                  <th className="px-4 py-3.5 w-12 text-center bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">
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
                  className="px-6 py-3.5 cursor-pointer hover:text-stone-900 dark:hover:text-white transition-colors bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700"
                >
                  <div className="flex items-center gap-1.5">
                    <span>TAG & NAME</span>
                    <span className="text-stone-400 font-mono text-[10px]">⇅</span>
                  </div>
                </th>

                <th
                  onClick={() => toggleSort('status')}
                  className="px-6 py-3.5 cursor-pointer hover:text-stone-900 dark:hover:text-white transition-colors bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700"
                >
                  <div className="flex items-center gap-1.5">
                    <span>HERD STATUS</span>
                    <span className="text-stone-400 font-mono text-[10px]">⇅</span>
                  </div>
                </th>

                <th
                  onClick={() => toggleSort('breed')}
                  className="px-6 py-3.5 cursor-pointer hover:text-stone-900 dark:hover:text-white transition-colors bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700"
                >
                  <div className="flex items-center gap-1.5">
                    <span>BREED</span>
                    <span className="text-stone-400 font-mono text-[10px]">⇅</span>
                  </div>
                </th>

                <th
                  onClick={() => toggleSort('gender')}
                  className="px-6 py-3.5 cursor-pointer hover:text-stone-900 dark:hover:text-white transition-colors bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700"
                >
                  <div className="flex items-center gap-1.5">
                    <span>GENDER</span>
                    <span className="text-stone-400 font-mono text-[10px]">⇅</span>
                  </div>
                </th>

                <th
                  onClick={() => toggleSort('weight')}
                  className="px-6 py-3.5 cursor-pointer hover:text-stone-900 dark:hover:text-white transition-colors bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700"
                >
                  <div className="flex items-center gap-1.5">
                    <span>WEIGHT ({weightUnit.toUpperCase()})</span>
                    <span className="text-stone-400 font-mono text-[10px]">⇅</span>
                  </div>
                </th>

                <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">
                  DATE OF BIRTH
                </th>

                <th className="px-6 py-3.5 text-right bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">
                  <div className="flex items-center justify-end gap-2">
                    <span>ACTIONS</span>
                    <Settings className="w-3.5 h-3.5 text-stone-400" />
                  </div>
                </th>
              </tr>
            </thead>

            {/* Table Body with 15px row padding, Zebra Striping (#fbfbf9), and #e7f3ec hover */}
            <tbody className="divide-y divide-stone-200/50 dark:divide-stone-800/80">
              {sortedGoats.length > 0 ? (
                sortedGoats.map((goat, index) => {
                  const effectiveStatus = getGoatEffectiveStatus(goat);
                  const healthInfo = getGoatHealthInfo(goat);
                  const salePrice = effectiveStatus === 'Sold' ? getSaleInfo(goat) : null;
                  const isSelected = selectedGoatIds.includes(goat.id);

                  // Zebra striping: Even rows #fbfbf9, odd rows pure white
                  const isEvenRow = index % 2 === 1;
                  const zebraBgClass = isEvenRow ? 'bg-[#fbfbf9] dark:bg-stone-900/60' : 'bg-white dark:bg-stone-900';

                  return (
                    <tr
                      key={goat.id}
                      className={`transition-colors ${zebraBgClass} hover:bg-[#e7f3ec] dark:hover:bg-emerald-950/35 ${
                        isSelected ? 'ring-2 ring-amber-500/60 ring-inset' : ''
                      }`}
                    >
                      {/* Column 1: Checkbox */}
                      {isBulkMode && (
                        <td className="px-4 py-[15px] text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleSelectGoat(goat.id)}
                            className="rounded border-stone-300 dark:border-stone-600 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                            title={`Select ${goat.tag_number}`}
                          />
                        </td>
                      )}

                      {/* Column 2: Tag & Name */}
                      <td className="px-6 py-[15px]">
                        <div>
                          <div className="font-extrabold text-stone-900 dark:text-stone-100 font-mono text-sm tracking-tight flex items-center gap-1.5">
                            <span>{goat.tag_number}</span>
                          </div>
                          <div className="mt-1">
                            {goat.name && goat.name !== 'Unnamed Goat' ? (
                              <span className="px-2.5 py-0.5 rounded-full border border-stone-300 dark:border-stone-700 bg-white/80 dark:bg-stone-800 text-[11px] text-stone-700 dark:text-stone-300 font-medium inline-block shadow-2xs">
                                {goat.name}
                              </span>
                            ) : (
                              <span className="italic text-[#b7bab2] text-xs">No name</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column: Herd Status (Static Badge + Price if Sold) */}
                      <td className="px-6 py-[15px]">
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
                              {salePrice || formatCurrency(30000)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 5: Breed */}
                      <td className="px-6 py-[15px] text-stone-700 dark:text-stone-300 font-medium">
                        {goat.breed || <span className="italic text-[#b7bab2] text-xs font-normal">—</span>}
                      </td>

                      {/* Column 6: Gender */}
                      <td className="px-6 py-[15px]">
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

                      {/* Column 7: Weight */}
                      <td className="px-6 py-[15px] font-extrabold text-stone-900 dark:text-stone-100 font-mono text-xs">
                        {goat.weight_kg ? formatWeight(goat.weight_kg) : <span className="italic text-[#b7bab2] text-xs font-normal">—</span>}
                      </td>

                      {/* Column 8: Date of Birth */}
                      <td className="px-6 py-[15px] text-stone-600 dark:text-stone-400 font-mono text-xs whitespace-nowrap">
                        {goat.dob ? formatDateDisplay(goat.dob) : <span className="italic text-[#b7bab2] text-xs font-normal">—</span>}
                      </td>

                      {/* Column 9: 4 Action Buttons with Clear Plain-Word Tooltips */}
                      <td className="px-6 py-[15px] text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. Eye Button: Quick Inspect */}
                          <button
                            type="button"
                            onClick={() => setQuickViewGoat(goat)}
                            className="w-8 h-8 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-100/90 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 transition-colors shadow-2xs"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* 2. Pencil Button: Edit Goat */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(goat)}
                            className="w-8 h-8 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-100/90 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 transition-colors shadow-2xs"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* 3. Pedigree Tree Button */}
                          <button
                            type="button"
                            onClick={() => onViewPedigree(goat)}
                            className="w-8 h-8 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-100/90 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 transition-colors shadow-2xs"
                            title="Breeding record"
                          >
                            <GitFork className="w-4 h-4" />
                          </button>

                          {/* 4. More Options Button (...) */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveMenuGoatId(activeMenuGoatId === goat.id ? null : goat.id)}
                              className="w-8 h-8 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-100/90 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 transition-colors shadow-2xs"
                              title="More actions"
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
                  <td colSpan={8} className="px-6 py-12 text-center text-stone-500 dark:text-stone-400 text-sm">
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
              <div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white font-mono">
                  {quickViewGoat.tag_number}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {quickViewGoat.name && quickViewGoat.name !== 'Unnamed Goat' ? (
                    quickViewGoat.name
                  ) : (
                    <span className="italic text-[#b7bab2]">No name</span>
                  )}{' '}
                  • {quickViewGoat.breed || <span className="italic text-[#b7bab2]">—</span>}
                </p>
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
                  {quickViewGoat.weight_kg ? formatWeight(quickViewGoat.weight_kg) : formatWeight(45)}
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
                <label className="block text-stone-600 dark:text-stone-400 font-semibold mb-1">Weight ({weightUnit})</label>
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
