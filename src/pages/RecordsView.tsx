import React, { useState, useEffect } from 'react';
import { useFarm } from '../context/FarmContext';
import { useToast } from '../context/ToastContext';
import { RecordType, AppView, GoatRecord, SaleRecord, HealthRecord, BreedingRecord } from '../types';
import {
  Trash2,
  Plus,
  Search,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  HeartPulse,
  Lock,
  Users,
  Download,
  Milk,
  ExternalLink,
  ChevronRight,
  FileSpreadsheet,
  Upload,
  X,
  Filter,
  Tag,
  AlertTriangle,
  Activity,
  FileText,
  Calendar,
  Printer,
  CheckSquare,
  Square,
  Layers,
  Edit,
  GitFork
} from 'lucide-react';
import { ExcelImportModal } from '../components/ExcelImportModal';
import { FarmReportModal } from '../components/FarmReportModal';
import { PedigreeTreeModal } from '../components/PedigreeTreeModal';
import { HerdRecordsHeaderTemplate } from '../components/HerdRecordsHeaderTemplate';
import { GoatRecordsTableTemplate } from '../components/GoatRecordsTableTemplate';
import { KidGrowthTracker } from '../components/KidGrowthTracker';
import { RecordKiddingModal } from '../components/RecordKiddingModal';
import { GoatKidIcon } from '../components/GoatKidIcon';
import { useUnits } from '../context/UnitsContext';
import {
  formatGoatsForExcel,
  formatBreedingForExcel,
  formatHealthForExcel,
  formatMilkForExcel,
  formatSalesForExcel,
  formatWorkersForExcel,
  downloadExcelFile,
  downloadCsvWithProperHeadings,
} from '../utils/excelExport';
import { exportTableToPDF } from '../utils/pdfExport';

export type TabType = 'goats' | 'kids' | 'breeding' | 'health' | 'milk' | 'sales' | 'workers' | 'advisor';

interface RecordsViewProps {
  onOpenAddModal: (type?: RecordType) => void;
  onNavigate?: (view: AppView) => void;
  onOpenNotificationModal?: () => void;
  initialTab?: TabType;
}

export const RecordsView: React.FC<RecordsViewProps> = ({ onOpenAddModal, onNavigate, onOpenNotificationModal, initialTab }) => {
  const {
    farmName,
    user,
    goats,
    updateGoat,
    bulkUpdateGoats,
    bulkDeleteGoats,
    deleteGoat,
    breeding,
    deleteBreeding,
    health,
    deleteHealth,
    sales,
    deleteSale,
    workers,
    deleteWorker,
    milk,
    deleteMilk,
    kidGrowthRecords,
    addKidGrowthRecord,
    updateBreeding,
  } = useFarm();
  const { showToast } = useToast();
  const { currency, weightUnit, milkUnit, formatCurrency, formatWeight, formatMilk } = useUnits();

  const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'goats');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedGoatIds, setSelectedGoatIds] = useState<string[]>([]);
  const [bulkStatusTarget, setBulkStatusTarget] = useState<'Active' | 'Pregnant' | 'Quarantine' | 'Sold' | 'Dead'>('Quarantine');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [isBatchEditModalOpen, setIsBatchEditModalOpen] = useState(false);
  const [selectedBreedingForDelivery, setSelectedBreedingForDelivery] = useState<BreedingRecord | null>(null);
  const [batchEditForm, setBatchEditForm] = useState<{
    updateStatus: boolean;
    status: 'Active' | 'Pregnant' | 'Quarantine' | 'Sold' | 'Dead';
    updateBreed: boolean;
    breed: string;
    updateGender: boolean;
    gender: 'Male' | 'Female';
    updateWeight: boolean;
    weightMode: 'set' | 'adjust_add' | 'adjust_sub';
    weightValue: string;
  }>({
    updateStatus: false,
    status: 'Active',
    updateBreed: false,
    breed: '',
    updateGender: false,
    gender: 'Female',
    updateWeight: false,
    weightMode: 'set',
    weightValue: '',
  });
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [goatStatusFilter, setGoatStatusFilter] = useState<'all' | 'remaining' | 'Active' | 'Pregnant' | 'Quarantine' | 'Sold' | 'Dead'>('all');
  const [goatHealthFilter, setGoatHealthFilter] = useState<'all' | 'Healthy' | 'Under Treatment' | 'Critical' | 'Observation' | 'Pregnant'>('all');
  const [goatBreedFilter, setGoatBreedFilter] = useState<string>('all');
  const [healthStatusFilter, setHealthStatusFilter] = useState<'all' | 'Healthy' | 'Under Treatment' | 'Critical' | 'Pregnancy Check'>('all');
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelCategory, setExcelCategory] = useState<'goats' | 'breeding' | 'health' | 'milk'>('goats');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [pedigreeTargetGoat, setPedigreeTargetGoat] = useState<GoatRecord | null>(null);

  const handleOpenTabExcelUpload = (category: 'goats' | 'breeding' | 'health' | 'milk') => {
    setExcelCategory(category);
    setIsExcelModalOpen(true);
  };

  const handleApplyBatchEdit = async () => {
    if (selectedGoatIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      const updates: Partial<GoatRecord> = {};
      if (batchEditForm.updateStatus) {
        updates.status = batchEditForm.status;
      }
      if (batchEditForm.updateBreed && batchEditForm.breed.trim()) {
        updates.breed = batchEditForm.breed.trim();
      }
      if (batchEditForm.updateGender) {
        updates.gender = batchEditForm.gender;
      }

      if (batchEditForm.updateWeight && batchEditForm.weightValue !== '') {
        const val = parseFloat(batchEditForm.weightValue);
        if (!isNaN(val)) {
          if (batchEditForm.weightMode === 'set') {
            updates.weight_kg = val;
            await bulkUpdateGoats(selectedGoatIds, updates);
          } else {
            // Per-goat relative calculation for add or subtract
            for (const id of selectedGoatIds) {
              const target = goats.find(g => g.id === id);
              if (target) {
                const currentW = target.weight_kg || 0;
                const nextW = batchEditForm.weightMode === 'adjust_add' ? currentW + val : Math.max(0, currentW - val);
                await updateGoat(id, { ...updates, weight_kg: parseFloat(nextW.toFixed(1)) });
              }
            }
          }
        } else {
          await bulkUpdateGoats(selectedGoatIds, updates);
        }
      } else {
        await bulkUpdateGoats(selectedGoatIds, updates);
      }

      showToast(`Successfully updated ${selectedGoatIds.length} goat record(s).`, 'success');
      setBulkSuccessMsg(`Batch updated ${selectedGoatIds.length} goat(s) successfully.`);
      setIsBatchEditModalOpen(false);
      setSelectedGoatIds([]);
      setTimeout(() => setBulkSuccessMsg(null), 4500);
    } catch (err: any) {
      showToast(err.message || 'Failed to apply batch updates', 'error');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Helper to determine effective goat status, fetching from sales if sold
  const getGoatEffectiveStatus = (goat: GoatRecord): 'Active' | 'Pregnant' | 'Quarantine' | 'Sold' | 'Dead' => {
    if (goat.status === 'Dead' || (goat.status as any) === 'Deceased') return 'Dead';
    if (goat.status === 'Sold') return 'Sold';
    // Check if recorded in sales transactions by tag_number, id, or name
    const cleanTag = goat.tag_number.toUpperCase();
    const cleanName = goat.name ? goat.name.trim().toUpperCase() : '';
    const hasSaleRecord = sales.some(s => {
      const saleTarget = (s.goat_id || '').trim().toUpperCase();
      return saleTarget === cleanTag || s.goat_id === goat.id || (cleanName && saleTarget === cleanName);
    });
    if (hasSaleRecord) return 'Sold';
    if (goat.status === 'Quarantine') return 'Quarantine';
    const isCurrentlyBreeding = breeding.some(
      b =>
        (b.female_id.toUpperCase() === cleanTag || b.female_id === goat.id) &&
        (b.status === 'Active' || !b.status)
    );
    if (isCurrentlyBreeding && goat.gender === 'Female') return 'Pregnant';
    if (goat.status === 'Pregnant' && !isCurrentlyBreeding) return 'Active';
    return goat.status || 'Active';
  };

  const getGoatSaleRecord = (goat: GoatRecord) => {
    const cleanTag = goat.tag_number.toUpperCase();
    const cleanName = goat.name ? goat.name.trim().toUpperCase() : '';
    return sales.find(s => {
      const saleTarget = (s.goat_id || '').trim().toUpperCase();
      return saleTarget === cleanTag || s.goat_id === goat.id || (cleanName && saleTarget === cleanName);
    });
  };

  const renderGoatStatusBadge = (status?: string, saleInfo?: SaleRecord) => {
    const s = status || 'Active';
    switch (s) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>Active</span>
          </span>
        );
      case 'Pregnant':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700 shadow-2xs">
            <span>Pregnant</span>
          </span>
        );
      case 'Quarantine':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Quarantine</span>
          </span>
        );
      case 'Sold':
        return (
          <div className="inline-flex flex-col">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-600 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-stone-500 shrink-0" />
              <span>Sold</span>
            </span>
            {saleInfo && (
              <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono mt-0.5">
                {formatCurrency(saleInfo.price)}
              </span>
            )}
          </div>
        );
      case 'Dead':
      case 'Deceased':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
            <span>Dead / Deceased</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>{s}</span>
          </span>
        );
    }
  };

  const getGoatLatestHealth = (goat: GoatRecord): HealthRecord | undefined => {
    const cleanTag = goat.tag_number.trim().toUpperCase();
    const cleanName = goat.name ? goat.name.trim().toUpperCase() : '';
    const matches = health.filter(h => {
      const target = (h.goat_id || '').trim().toUpperCase();
      return target === cleanTag || h.goat_id === goat.id || (cleanName && target === cleanName);
    });
    if (!matches.length) return undefined;
    return [...matches].sort((a, b) => new Date(b.checkup_date).getTime() - new Date(a.checkup_date).getTime())[0];
  };

  const getGoatHealthStatus = (goat: GoatRecord): {
    status: 'Healthy' | 'Under Treatment' | 'Critical' | 'Observation' | 'Pregnant' | 'Deceased';
    condition?: string;
    treatment?: string;
    date?: string;
    isPregnant?: boolean;
  } => {
    const effectiveHerdStatus = getGoatEffectiveStatus(goat);
    if (effectiveHerdStatus === 'Dead') {
      return { status: 'Deceased', condition: 'Deceased' };
    }

    const latest = getGoatLatestHealth(goat);
    if (latest) {
      const condLower = (latest.condition || '').toLowerCase();

      if (latest.status === 'Critical' || condLower.includes('critical')) {
        return { status: 'Critical', condition: latest.condition, treatment: latest.treatment, date: latest.checkup_date, isPregnant: latest.is_pregnant };
      }
      if (
        latest.status === 'Under Treatment' ||
        condLower.includes('sick') ||
        condLower.includes('fever') ||
        condLower.includes('infection') ||
        condLower.includes('mastitis') ||
        condLower.includes('pneumonia') ||
        condLower.includes('bloat') ||
        condLower.includes('weak')
      ) {
        return { status: 'Under Treatment', condition: latest.condition, treatment: latest.treatment, date: latest.checkup_date, isPregnant: latest.is_pregnant };
      }
      if (latest.status === 'Observation' || effectiveHerdStatus === 'Quarantine') {
        return { status: 'Observation', condition: latest.condition || 'Quarantine protocol', treatment: latest.treatment, date: latest.checkup_date, isPregnant: latest.is_pregnant };
      }
      const cleanTag = goat.tag_number.toUpperCase();
      const isBreeding = breeding.some(
        b =>
          (b.female_id.toUpperCase() === cleanTag || b.female_id === goat.id) &&
          (b.status === 'Active' || !b.status)
      );
      if (
        effectiveHerdStatus === 'Pregnant' ||
        (isBreeding && (latest.is_pregnant || latest.checkup_type === 'Pregnancy Check'))
      ) {
        return { status: 'Pregnant', condition: latest.condition || 'Confirmed In-Kid', treatment: latest.treatment, date: latest.checkup_date, isPregnant: true };
      }
      return { status: 'Healthy', condition: latest.condition || 'Sound & Normal', treatment: latest.treatment, date: latest.checkup_date };
    }

    if (effectiveHerdStatus === 'Quarantine') {
      return { status: 'Observation', condition: 'Quarantine / Isolation' };
    }
    if (effectiveHerdStatus === 'Pregnant') {
      return { status: 'Pregnant', condition: 'Gestation underway', isPregnant: true };
    }

    return { status: 'Healthy', condition: 'Sound & Normal' };
  };

  const renderGoatHealthBadge = (healthInfo: ReturnType<typeof getGoatHealthStatus>) => {
    switch (healthInfo.status) {
      case 'Healthy':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>Healthy</span>
          </span>
        );
      case 'Under Treatment':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs">
            <HeartPulse className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
            <span>Under Treatment</span>
          </span>
        );
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700 shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>Critical</span>
          </span>
        );
      case 'Observation':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-50 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700 shadow-2xs">
            <Activity className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400 shrink-0" />
            <span>Observation</span>
          </span>
        );
      case 'Pregnant':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700 shadow-2xs">
            <span>Pregnant</span>
          </span>
        );
      case 'Deceased':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-300 dark:border-stone-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-stone-400 shrink-0" />
            <span>Deceased</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
            <span>{healthInfo.status}</span>
          </span>
        );
    }
  };

  const getGoatStatusDotClass = (status?: string) => {
    switch (status) {
      case 'Pregnant':
        return 'bg-purple-500 ring-2 ring-purple-200 dark:ring-purple-900';
      case 'Quarantine':
        return 'bg-amber-500 ring-2 ring-amber-200 dark:ring-amber-900';
      case 'Sold':
        return 'bg-stone-400 ring-2 ring-stone-200 dark:ring-stone-700';
      case 'Dead':
      case 'Deceased':
        return 'bg-rose-500 ring-2 ring-rose-200 dark:ring-rose-900';
      case 'Active':
      default:
        return 'bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900';
    }
  };

  const today = new Date();
  const dueSoon = breeding.filter(b => {
    if (!b.expected_birth) return false;
    const exp = new Date(b.expected_birth);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  const sickGoats = health.filter(
    h =>
      h.condition.toLowerCase().includes('sick') ||
      h.condition.toLowerCase().includes('weak') ||
      h.condition.toLowerCase().includes('fever') ||
      h.status === 'Under Treatment' ||
      h.status === 'Critical'
  );

  const totalSalesRevenue = sales.reduce((sum, s) => sum + (s.price || 0), 0);

  // Herd Head Count & Census Reconciliation
  const totalHerdRegistered = goats.length;
  const soldCount = goats.filter(g => getGoatEffectiveStatus(g) === 'Sold').length;
  const deceasedCount = goats.filter(g => getGoatEffectiveStatus(g) === 'Dead').length;
  const remainingHeadCount = Math.max(0, totalHerdRegistered - (soldCount + deceasedCount));
  const kidsCount = kidGrowthRecords.length;
  const nursingKidsCount = kidGrowthRecords.filter(k => k.status === 'Nursing').length;
  const weanedKidsCount = kidGrowthRecords.filter(k => k.status === 'Weaned').length;

  // Map goats by tag for quick name and detail lookup
  const goatMap = new Map(goats.map(g => [g.tag_number.toUpperCase(), g]));

  // Unique breeds present in current herd
  const availableBreeds = Array.from(new Set(goats.map(g => g.breed).filter(Boolean))).sort();

  // Search & Status filters
  const filteredGoats = goats.filter(g => {
    const q = searchQuery.trim().toLowerCase();
    const effectiveStatus = getGoatEffectiveStatus(g);
    const healthInfo = getGoatHealthStatus(g);

    // Filter by ID, Breed, or Current Health Status / Condition / Treatment
    const matchesSearch =
      !q ||
      g.tag_number.toLowerCase().includes(q) ||
      (g.name && g.name.toLowerCase().includes(q)) ||
      g.breed.toLowerCase().includes(q) ||
      g.gender.toLowerCase().includes(q) ||
      healthInfo.status.toLowerCase().includes(q) ||
      (healthInfo.condition && healthInfo.condition.toLowerCase().includes(q)) ||
      (healthInfo.treatment && healthInfo.treatment.toLowerCase().includes(q)) ||
      effectiveStatus.toLowerCase().includes(q);

    // Herd Status Filter
    const matchesHerdStatus =
      goatStatusFilter === 'all' ||
      (goatStatusFilter === 'remaining'
        ? effectiveStatus !== 'Sold' && effectiveStatus !== 'Dead'
        : effectiveStatus.toLowerCase() === goatStatusFilter.toLowerCase());

    // Health Status Filter
    const matchesHealthStatus =
      goatHealthFilter === 'all' ||
      (goatHealthFilter === 'Healthy' && healthInfo.status === 'Healthy') ||
      (goatHealthFilter === 'Under Treatment' && healthInfo.status === 'Under Treatment') ||
      (goatHealthFilter === 'Critical' && healthInfo.status === 'Critical') ||
      (goatHealthFilter === 'Observation' && healthInfo.status === 'Observation') ||
      (goatHealthFilter === 'Pregnant' && (healthInfo.status === 'Pregnant' || healthInfo.isPregnant || effectiveStatus === 'Pregnant'));

    // Breed Filter
    const matchesBreed =
      goatBreedFilter === 'all' ||
      g.breed.toLowerCase() === goatBreedFilter.toLowerCase();

    return matchesSearch && matchesHerdStatus && matchesHealthStatus && matchesBreed;
  });

  const handleOpenKiddingModal = (b: BreedingRecord) => {
    setSelectedBreedingForDelivery(b);
  };

  const filteredBreeding = breeding.filter(b => {
    const q = searchQuery.trim().toLowerCase();
    const female = goatMap.get(b.female_id.toUpperCase());
    const male = goatMap.get(b.male_id.toUpperCase());
    return (
      !q ||
      b.female_id.toLowerCase().includes(q) ||
      b.male_id.toLowerCase().includes(q) ||
      (female?.name && female.name.toLowerCase().includes(q)) ||
      (male?.name && male.name.toLowerCase().includes(q)) ||
      (b.status && b.status.toLowerCase().includes(q))
    );
  });

  const filteredHealth = health.filter(h => {
    const q = searchQuery.trim().toLowerCase();
    const matchedGoat = goatMap.get(h.goat_id.toUpperCase());
    const goatName = matchedGoat?.name || '';

    const matchesSearch =
      !q ||
      h.goat_id.toLowerCase().includes(q) ||
      goatName.toLowerCase().includes(q) ||
      (h.status && h.status.toLowerCase().includes(q)) ||
      h.condition.toLowerCase().includes(q) ||
      h.treatment.toLowerCase().includes(q) ||
      (h.checkup_type && h.checkup_type.toLowerCase().includes(q)) ||
      (h.vet_name && h.vet_name.toLowerCase().includes(q)) ||
      (h.is_pregnant && 'pregnant'.includes(q));

    const matchesStatus =
      healthStatusFilter === 'all' ||
      (healthStatusFilter === 'Healthy' && (h.status === 'Healthy' || h.condition.toLowerCase().includes('healthy') || h.condition.toLowerCase().includes('good'))) ||
      (healthStatusFilter === 'Under Treatment' && (h.status === 'Under Treatment' || h.condition.toLowerCase().includes('sick') || h.condition.toLowerCase().includes('weak') || h.condition.toLowerCase().includes('fever'))) ||
      (healthStatusFilter === 'Pregnancy Check' && (h.checkup_type === 'Pregnancy Check' || h.is_pregnant)) ||
      (healthStatusFilter === 'Critical' && (h.status === 'Critical' || h.condition.toLowerCase().includes('critical')));

    return matchesSearch && matchesStatus;
  });

  const filteredMilk = milk.filter(
    m =>
      m.goat_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.date.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSales = sales.filter(
    s =>
      s.goat_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.buyer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredWorkers = workers.filter(
    w =>
      w.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // High quality Excel, CSV & PDF export with defined headings
  const handleExportData = (
    tab: TabType | 'selected-goats',
    format: 'excel' | 'csv' | 'pdf' = 'excel',
    customData?: any[]
  ) => {
    let rows: Record<string, any>[] = [];
    let baseFilename = '';
    let sheetTitle = '';

    if (tab === 'selected-goats' || (tab === 'goats' && customData)) {
      const targetGoats = customData || goats;
      rows = formatGoatsForExcel(targetGoats);
      baseFilename = `selected_goats_registry`;
      sheetTitle = 'Selected Goats';
    } else if (tab === 'goats') {
      const targetGoats = customData || (filteredGoats.length > 0 ? filteredGoats : goats);
      rows = formatGoatsForExcel(targetGoats);
      baseFilename = `herd_goats_registry`;
      sheetTitle = 'Herd Registry';
    } else if (tab === 'breeding') {
      const targetBreeding = customData || (filteredBreeding.length > 0 ? filteredBreeding : breeding);
      rows = formatBreedingForExcel(targetBreeding, goats);
      baseFilename = `breeding_gestation_records`;
      sheetTitle = 'Breeding Records';
    } else if (tab === 'health') {
      const targetHealth = customData || (filteredHealth.length > 0 ? filteredHealth : health);
      rows = formatHealthForExcel(targetHealth, goats);
      baseFilename = `health_veterinary_records`;
      sheetTitle = 'Health Records';
    } else if (tab === 'milk') {
      const targetMilk = customData || (filteredMilk.length > 0 ? filteredMilk : milk);
      rows = formatMilkForExcel(targetMilk, goats);
      baseFilename = `milk_production_harvests`;
      sheetTitle = 'Milk Records';
    } else if (tab === 'sales') {
      const targetSales = customData || (filteredSales.length > 0 ? filteredSales : sales);
      rows = formatSalesForExcel(targetSales, goats);
      baseFilename = `sales_dispatches_ledger`;
      sheetTitle = 'Sales Ledger';
    } else if (tab === 'workers') {
      const targetWorkers = customData || (filteredWorkers.length > 0 ? filteredWorkers : workers);
      rows = formatWorkersForExcel(targetWorkers);
      baseFilename = `farm_staff_directory`;
      sheetTitle = 'Farm Workers';
    } else if (tab === 'kids') {
      const targetKids = customData || kidGrowthRecords;
      rows = targetKids.map((k: any) => ({
        'Kid Tag': k.kid_tag,
        'Name': k.kid_name || '—',
        'Gender': k.gender,
        'Breed': k.breed,
        'Date of Birth': k.dob,
        'Birth Weight (kg)': k.birth_weight_kg,
        'Current Weight (kg)': k.current_weight_kg || '—',
        'Dam Tag': k.dam_tag || '—',
        'Sire Tag': k.sire_tag || '—',
        'Nursery Status': k.status,
        'Notes': k.notes || '—',
      }));
      baseFilename = `nursery_kids_growth_records`;
      sheetTitle = 'Kids Nursery Records';
    }

    if (rows.length === 0) {
      showToast(`No ${tab} records available to export.`, 'info');
      return;
    }

    if (format === 'excel') {
      downloadExcelFile(rows, sheetTitle, baseFilename);
      showToast(`Exported ${rows.length} ${sheetTitle} records to Excel (.xlsx) with defined headings.`, 'success');
    } else if (format === 'csv') {
      downloadCsvWithProperHeadings(rows, baseFilename);
      showToast(`Exported ${rows.length} ${sheetTitle} records to CSV with defined headings.`, 'success');
    } else if (format === 'pdf') {
      const filterSummary =
        tab === 'goats'
          ? [
              goatStatusFilter !== 'all' ? `Status: ${goatStatusFilter}` : '',
              goatHealthFilter !== 'all' ? `Health: ${goatHealthFilter}` : '',
              goatBreedFilter !== 'all' ? `Breed: ${goatBreedFilter}` : '',
              searchQuery ? `Search: "${searchQuery}"` : '',
            ].filter(Boolean).join(' • ')
          : searchQuery ? `Search: "${searchQuery}"` : '';

      exportTableToPDF({
        title: `${sheetTitle} Document`,
        subtitle: `Official Caprine Herd Registry • ${rows.length} Total Records`,
        records: rows,
        filename: baseFilename,
        farmName: user?.farm_name || farmName || 'Smart Goat Manager Farm',
        userEmail: user?.email || '',
        farmLocation: user?.location || '',
        farmLogo: user?.logo_url,
        filtersApplied: filterSummary,
      });
      showToast(`Generating formatted PDF document for ${rows.length} ${sheetTitle} records...`, 'success');
    }
  };

  // Backwards compatible exportToCSV
  const exportToCSV = (data: any[], filename: string) => {
    handleExportData(activeTab, 'csv', data);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner and Navigation Tabs via HerdRecordsHeaderTemplate */}
      <HerdRecordsHeaderTemplate
        farmName={farmName || 'Lula'}
        userName={user?.owner_name || user?.manager_name || 'User'}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAddRecord={() => onOpenAddModal(activeTab === 'kids' ? 'kid_growth' : activeTab === 'advisor' ? 'goat' : (activeTab as RecordType))}
        onOpenExcelUpload={() => handleOpenTabExcelUpload(activeTab === 'advisor' ? 'goats' : (activeTab as any))}
        onOpenReport={() => setIsReportModalOpen(true)}
        onOpenNotificationModal={onOpenNotificationModal}
        activeTab={activeTab}
        onSelectTab={(id) => {
          setActiveTab(id as any);
          setSearchQuery('');
          setGoatStatusFilter('all');
          setGoatHealthFilter('all');
          setGoatBreedFilter('all');
        }}
        tabs={[
          { id: 'goats', label: 'Goats (Adults)', count: goats.length },
          { id: 'kids', label: 'Kids & Nursery', count: kidGrowthRecords.length },
          { id: 'breeding', label: 'Breeding', count: breeding.length },
          { id: 'health', label: 'Health', count: health.length },
          { id: 'milk', label: 'Milk Yield', count: milk.length },
          { id: 'sales', label: 'Sales', count: sales.length },
          { id: 'workers', label: 'Workers', count: workers.length },
          { id: 'advisor', label: 'Farm Insights' },
        ]}
      />

      {/* Herd Census Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Remaining Head Count */}
        <button
          type="button"
          id="census-btn-remaining"
          onClick={() => {
            setActiveTab('goats');
            setGoatStatusFilter('remaining');
          }}
          className={`p-4 rounded-2xl text-left transition-all border ${
            activeTab === 'goats' && goatStatusFilter === 'remaining'
              ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-emerald-500 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wide">
              Remaining
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 mt-1.5 font-serif">
            {remainingHeadCount} <span className="text-xs font-sans font-semibold text-emerald-700 dark:text-emerald-400">head</span>
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
            Active on farm
          </div>
        </button>

        {/* Total Herd Registered */}
        <button
          type="button"
          id="census-btn-total-registered"
          onClick={() => {
            setActiveTab('goats');
            setGoatStatusFilter('all');
          }}
          className={`p-4 rounded-2xl text-left transition-all border ${
            activeTab === 'goats' && goatStatusFilter === 'all'
              ? 'bg-stone-100 dark:bg-stone-800 border-stone-400 shadow-xs'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-400 shadow-2xs'
          }`}
        >
          <div className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide">
            Total Herd Registered
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 mt-1.5 font-serif">
            {totalHerdRegistered} <span className="text-xs font-sans font-semibold text-stone-500">head</span>
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
            Total registered
          </div>
        </button>

        {/* Sold */}
        <button
          type="button"
          id="census-btn-sold"
          onClick={() => {
            setActiveTab('goats');
            setGoatStatusFilter('Sold');
          }}
          className={`p-4 rounded-2xl text-left transition-all border ${
            activeTab === 'goats' && goatStatusFilter === 'Sold'
              ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-400 shadow-xs'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-amber-400 shadow-2xs'
          }`}
        >
          <div className="text-xs font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wide">
            Sold
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-900 dark:text-amber-300 mt-1.5 font-serif">
            {soldCount} <span className="text-xs font-sans font-semibold text-amber-700 dark:text-amber-400">head</span>
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
            Sold
          </div>
        </button>

        {/* Deceased */}
        <button
          type="button"
          id="census-btn-deceased"
          onClick={() => {
            setActiveTab('goats');
            setGoatStatusFilter('Dead');
          }}
          className={`p-4 rounded-2xl text-left transition-all border ${
            activeTab === 'goats' && goatStatusFilter === 'Dead'
              ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-400 shadow-xs'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-rose-400 shadow-2xs'
          }`}
        >
          <div className="text-xs font-semibold text-rose-800 dark:text-rose-400 uppercase tracking-wide">
            Deceased
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-900 dark:text-rose-300 mt-1.5 font-serif">
            {deceasedCount} <span className="text-xs font-sans font-semibold text-rose-700 dark:text-rose-400">head</span>
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
            Deceased
          </div>
        </button>

        {/* Kids & Nursery */}
        <button
          type="button"
          id="census-btn-kids"
          onClick={() => setActiveTab('kids')}
          className={`p-4 rounded-2xl text-left transition-all border sm:col-span-2 lg:col-span-1 ${
            activeTab === 'kids'
              ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-amber-500 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide flex items-center gap-1">
              <GoatKidIcon className="w-3.5 h-3.5 text-amber-600" />
              Kids
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300">
              {nursingKidsCount} nursing
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-200 mt-1.5 font-serif">
            {kidsCount} <span className="text-xs font-sans font-semibold text-amber-700 dark:text-amber-400">kids</span>
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
            {weanedKidsCount} weaned
          </div>
        </button>
      </div>

      {/* Action Toolbar & Filters */}
      <div className="flex flex-col gap-3">

        {/* Dedicated Search & Filter Bar with Per-Record Action Controls */}
        {activeTab !== 'advisor' && (
          <div className="flex flex-col gap-2.5 bg-stone-50/80 dark:bg-stone-900/80 p-3 rounded-2xl border border-stone-200 dark:border-stone-800">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="input-record-search"
                  type="text"
                  placeholder={
                    activeTab === 'goats'
                      ? 'Search herd by Goat ID (e.g. GT-101), Breed (e.g. Boer), or Current Health Status (Healthy, Under Treatment, Mastitis)...'
                      : activeTab === 'health'
                      ? 'Filter health records by ear tag (e.g. GT-103), goat name (Nala), or status (Healthy, Under Treatment)...'
                      : `Filter ${activeTab} records by keyword or tag...`
                  }
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    id="btn-clear-search"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full hover:bg-stone-100 dark:hover:bg-stone-700"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Per-Record Upload & Manual Add Actions */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  id="btn-tab-add-manually"
                  onClick={() => onOpenAddModal(activeTab === 'kids' ? 'kid_growth' : (activeTab as RecordType))}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>
                    {activeTab === 'goats'
                      ? 'Add Goat'
                      : activeTab === 'kids'
                      ? 'Register Kid'
                      : activeTab === 'breeding'
                      ? 'Add Breeding'
                      : activeTab === 'health'
                      ? 'Add Health'
                      : activeTab === 'milk'
                      ? 'Record Milk'
                      : activeTab === 'sales'
                      ? 'Add Sale'
                      : activeTab === 'workers'
                      ? 'Add Worker'
                      : 'Add Record'}
                  </span>
                </button>

                {(activeTab === 'goats' || activeTab === 'breeding' || activeTab === 'health' || activeTab === 'milk') && (
                  <button
                    type="button"
                    id={`btn-upload-${activeTab}-tab`}
                    onClick={() => handleOpenTabExcelUpload(activeTab)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-xs font-semibold rounded-xl transition-colors shadow-2xs"
                    title={`Upload ${activeTab} spreadsheet document (.xlsx, .xls, .csv)`}
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Upload {activeTab === 'goats' ? 'Goats' : activeTab === 'breeding' ? 'Breeding' : activeTab === 'health' ? 'Health' : 'Milk'} (Excel/CSV)</span>
                  </button>
                )}

                {activeTab === 'goats' && (
                  <button
                    type="button"
                    id="btn-toggle-bulk-mode"
                    onClick={() => {
                      setIsBulkMode(prev => !prev);
                      setSelectedGoatIds([]);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors shadow-2xs ${
                      isBulkMode
                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                        : 'bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700'
                    }`}
                    title="Toggle batch selection checkboxes to update or delete multiple records"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>{isBulkMode ? 'Batch Select (Active)' : 'Batch Select'}</span>
                  </button>
                )}

                <button
                  type="button"
                  id="btn-tab-open-report"
                  onClick={() => setIsReportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-black dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold rounded-xl transition-colors shadow-2xs"
                  title="Generate Duration Report"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Report</span>
                </button>

                <button
                  id="btn-export-excel-tab"
                  onClick={() => handleExportData(activeTab, 'excel')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold rounded-xl transition-colors shadow-2xs"
                  title="Download formatted Excel (.xlsx) spreadsheet with defined headings"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Excel</span>
                </button>

                <button
                  id="btn-export-csv"
                  onClick={() => handleExportData(activeTab, 'csv')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold rounded-xl transition-colors shadow-2xs"
                  title="Download CSV file with defined headings"
                >
                  <Download className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                  <span>CSV</span>
                </button>

                <button
                  type="button"
                  id="btn-export-pdf-tab"
                  onClick={() => handleExportData(activeTab, 'pdf')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-semibold rounded-xl transition-colors shadow-2xs"
                  title="Export records table as a formatted PDF document utilizing existing print styles"
                >
                  <Printer className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            {/* Quick Status and Health Filters for Goats */}
            {activeTab === 'goats' && (
              <div className="flex flex-col gap-2.5 pt-1 border-t border-stone-200/70 dark:border-stone-800">
                {/* 1. Health Status Filters */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-300 flex items-center gap-1 mr-1">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                    Health Status:
                  </span>
                  {[
                    { id: 'all', label: 'All Health', count: goats.length },
                    { id: 'Healthy', label: 'Healthy', count: goats.filter(g => getGoatHealthStatus(g).status === 'Healthy').length, dot: 'bg-emerald-500' },
                    { id: 'Under Treatment', label: 'Under Treatment', count: goats.filter(g => getGoatHealthStatus(g).status === 'Under Treatment').length, dot: 'bg-amber-500' },
                    { id: 'Critical', label: 'Critical', count: goats.filter(g => getGoatHealthStatus(g).status === 'Critical').length, dot: 'bg-rose-500' },
                    { id: 'Observation', label: 'Observation', count: goats.filter(g => getGoatHealthStatus(g).status === 'Observation').length, dot: 'bg-yellow-500' },
                    { id: 'Pregnant', label: 'Pregnant', count: goats.filter(g => getGoatHealthStatus(g).status === 'Pregnant' || getGoatHealthStatus(g).isPregnant || getGoatEffectiveStatus(g) === 'Pregnant').length, dot: 'bg-purple-500' },
                  ].map(pill => (
                    <button
                      key={pill.id}
                      id={`pill-goat-health-${pill.id.toLowerCase().replace(/\s+/g, '-')}`}
                      type="button"
                      onClick={() => setGoatHealthFilter(pill.id as any)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        goatHealthFilter === pill.id
                          ? 'bg-rose-600 text-white font-semibold shadow-2xs'
                          : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      {pill.dot && <span className={`w-1.5 h-1.5 rounded-full ${goatHealthFilter === pill.id ? 'bg-white' : pill.dot}`} />}
                      <span>{pill.label}</span>
                      <span
                        className={`text-[10px] px-1 rounded-full ${
                          goatHealthFilter === pill.id
                            ? 'bg-rose-800 text-white'
                            : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                        }`}
                      >
                        {pill.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* 2. Herd Status & Breed Filters */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-300 flex items-center gap-1 mr-1">
                      <Filter className="w-3.5 h-3.5 text-emerald-600" />
                      Herd Status:
                    </span>
                    {[
                      { id: 'all', label: 'All Registered', count: totalHerdRegistered },
                      { id: 'remaining', label: 'Remaining (Present)', count: remainingHeadCount },
                      { id: 'Active', label: 'Active', count: goats.filter(g => getGoatEffectiveStatus(g) === 'Active').length },
                      { id: 'Pregnant', label: 'Pregnant', count: goats.filter(g => getGoatEffectiveStatus(g) === 'Pregnant').length },
                      { id: 'Quarantine', label: 'Quarantine', count: goats.filter(g => getGoatEffectiveStatus(g) === 'Quarantine').length },
                      { id: 'Sold', label: 'Sold', count: soldCount },
                      { id: 'Dead', label: 'Deceased', count: deceasedCount },
                    ].map(pill => (
                      <button
                        key={pill.id}
                        id={`pill-goat-status-${pill.id.toLowerCase()}`}
                        type="button"
                        onClick={() => setGoatStatusFilter(pill.id as any)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          goatStatusFilter === pill.id
                            ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                            : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700'
                        }`}
                      >
                        <span>{pill.label}</span>
                        <span
                          className={`text-[10px] px-1 rounded-full ${
                            goatStatusFilter === pill.id
                              ? 'bg-emerald-800 text-white'
                              : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                          }`}
                        >
                          {pill.count}
                        </span>
                      </button>
                    ))}

                    {/* Breed Selector */}
                    {availableBreeds.length > 0 && (
                      <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-stone-200 dark:border-stone-700">
                        <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-300">
                          Breed:
                        </span>
                        <select
                          id="select-goat-breed-filter"
                          value={goatBreedFilter}
                          onChange={e => setGoatBreedFilter(e.target.value)}
                          className="text-xs bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                        >
                          <option value="all">All Breeds ({goats.length})</option>
                          {availableBreeds.map(b => (
                            <option key={b} value={b}>
                              {b} ({goats.filter(g => g.breed === b).length})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Filter Summary & Quick Reset */}
                  <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                    <span>
                      Showing <strong className="text-stone-800 dark:text-stone-200">{filteredGoats.length}</strong> of{' '}
                      <strong className="text-stone-800 dark:text-stone-200">{goats.length}</strong> goats
                    </span>
                    {(searchQuery || goatStatusFilter !== 'all' || goatHealthFilter !== 'all' || goatBreedFilter !== 'all') && (
                      <button
                        id="btn-reset-goat-filters"
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setGoatStatusFilter('all');
                          setGoatHealthFilter('all');
                          setGoatBreedFilter('all');
                        }}
                        className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-semibold hover:underline ml-1"
                      >
                        <X className="w-3 h-3" />
                        <span>Reset Filters</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Active Filter Tags */}
                {(searchQuery || goatStatusFilter !== 'all' || goatHealthFilter !== 'all' || goatBreedFilter !== 'all') && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 dark:text-stone-500">
                      Active Filters:
                    </span>
                    {searchQuery && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <span>Keyword: &ldquo;{searchQuery}&rdquo;</span>
                        <button type="button" onClick={() => setSearchQuery('')} className="hover:text-emerald-950 dark:hover:text-white">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {goatHealthFilter !== 'all' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        <span>Health: {goatHealthFilter}</span>
                        <button type="button" onClick={() => setGoatHealthFilter('all')} className="hover:text-rose-950 dark:hover:text-white">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {goatStatusFilter !== 'all' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <span>Herd: {goatStatusFilter}</span>
                        <button type="button" onClick={() => setGoatStatusFilter('all')} className="hover:text-emerald-950 dark:hover:text-white">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {goatBreedFilter !== 'all' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700">
                        <span>Breed: {goatBreedFilter}</span>
                        <button type="button" onClick={() => setGoatBreedFilter('all')} className="hover:text-stone-900 dark:hover:text-white">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Quick Status Filter Pills for Health */}
            {activeTab === 'health' && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1 mr-1">
                    <Filter className="w-3 h-3 text-stone-400" />
                    Status:
                  </span>
                  {[
                    { id: 'all', label: 'All Records', count: health.length },
                    {
                      id: 'Healthy',
                      label: 'Healthy',
                      count: health.filter(h => h.status === 'Healthy' || h.condition.toLowerCase().includes('healthy') || h.condition.toLowerCase().includes('good')).length
                    },
                    {
                      id: 'Under Treatment',
                      label: 'Under Treatment / Sick',
                      count: health.filter(h => h.status === 'Under Treatment' || h.condition.toLowerCase().includes('sick') || h.condition.toLowerCase().includes('fever')).length
                    },
                    {
                      id: 'Pregnancy Check',
                      label: 'Pregnancy / Ultrasound',
                      count: health.filter(h => h.checkup_type === 'Pregnancy Check' || h.is_pregnant).length
                    },
                    {
                      id: 'Critical',
                      label: 'Critical',
                      count: health.filter(h => h.status === 'Critical' || h.condition.toLowerCase().includes('critical')).length
                    },
                  ].map(pill => (
                    <button
                      key={pill.id}
                      id={`pill-health-status-${pill.id.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => setHealthStatusFilter(pill.id as any)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        healthStatusFilter === pill.id
                          ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                          : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      <span>{pill.label}</span>
                      <span
                        className={`text-[10px] px-1 rounded-full ${
                          healthStatusFilter === pill.id
                            ? 'bg-emerald-800 text-white'
                            : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                        }`}
                      >
                        {pill.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <span>
                    Showing <strong className="text-stone-800">{filteredHealth.length}</strong> of{' '}
                    <strong className="text-stone-800">{health.length}</strong> health records
                  </span>
                  {(searchQuery || healthStatusFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setHealthStatusFilter('all');
                      }}
                      className="text-xs text-emerald-700 hover:underline font-medium"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TAB 1: GOATS */}
      {activeTab === 'goats' && (
        <>
          {/* Enhanced Batch Action Bar for Goats */}
          {selectedGoatIds.length > 0 && (
            <div className="sticky top-16 z-20 bg-stone-900 dark:bg-stone-950 text-white border border-stone-800 dark:border-stone-700/80 rounded-2xl p-4 mb-4 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Layers className="w-5 h-5 text-emerald-400" />
                </span>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Batch Selection Active</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-stone-950">
                      {selectedGoatIds.length} of {filteredGoats.length} Selected
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-300">
                    Apply bulk status modifications or permanently delete selected goat records.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                <button
                  type="button"
                  id="btn-batch-select-all"
                  onClick={() => {
                    if (selectedGoatIds.length === filteredGoats.length) {
                      setSelectedGoatIds([]);
                    } else {
                      setSelectedGoatIds(filteredGoats.map(g => g.id));
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors"
                >
                  {selectedGoatIds.length === filteredGoats.length && filteredGoats.length > 0 ? 'Deselect All' : 'Select All Filtered'}
                </button>

                {/* Batch Status Dropdown & Apply */}
                <div className="flex items-center gap-1.5 bg-stone-800 border border-stone-700 rounded-xl px-3 py-1">
                  <span className="text-xs font-medium text-stone-400">Status:</span>
                  <select
                    id="select-bulk-status"
                    value={bulkStatusTarget}
                    onChange={e => setBulkStatusTarget(e.target.value as any)}
                    className="text-xs font-bold bg-transparent text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Quarantine" className="bg-stone-900 text-white">Quarantine</option>
                    <option value="Active" className="bg-stone-900 text-white">Active</option>
                    <option value="Pregnant" className="bg-stone-900 text-white">Pregnant</option>
                    <option value="Sold" className="bg-stone-900 text-white">Sold</option>
                    <option value="Dead" className="bg-stone-900 text-white">Dead (Culled / Deceased)</option>
                  </select>
                </div>

                <button
                  type="button"
                  id="btn-apply-bulk-update"
                  disabled={selectedGoatIds.length === 0 || isBulkUpdating}
                  onClick={async () => {
                    if (selectedGoatIds.length === 0) return;
                    setIsBulkUpdating(true);
                    try {
                      await bulkUpdateGoats(selectedGoatIds, { status: bulkStatusTarget });
                      showToast(`Updated herd status to "${bulkStatusTarget}" for ${selectedGoatIds.length} goat(s).`, 'success');
                      if (bulkStatusTarget === 'Quarantine') {
                        setBulkSuccessMsg(`Isolated ${selectedGoatIds.length} goat(s) to "Quarantine". Automated 7-day and 14-day checkup tasks scheduled.`);
                      } else {
                        setBulkSuccessMsg(`Successfully updated ${selectedGoatIds.length} goat(s) to "${bulkStatusTarget}".`);
                      }
                      setSelectedGoatIds([]);
                      setTimeout(() => setBulkSuccessMsg(null), 4500);
                    } catch (e: any) {
                      showToast(e.message || 'Failed to update selected goats', 'error');
                    } finally {
                      setIsBulkUpdating(false);
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all shadow-xs flex items-center gap-1.5 ${
                    selectedGoatIds.length === 0 || isBulkUpdating
                      ? 'bg-stone-700 text-stone-400 cursor-not-allowed opacity-60'
                      : 'bg-emerald-600 hover:bg-emerald-500 active:scale-98'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>{isBulkUpdating ? 'Updating...' : `Update Status (${selectedGoatIds.length})`}</span>
                </button>

                {/* Batch Edit Details Modal Trigger */}
                <button
                  type="button"
                  id="btn-open-batch-edit-modal"
                  disabled={selectedGoatIds.length === 0 || isBulkUpdating}
                  onClick={() => setIsBatchEditModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 active:scale-98 text-white transition-all shadow-xs flex items-center gap-1.5"
                  title="Update multiple fields (status, breed, gender, weight) across selected goats"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Details ({selectedGoatIds.length})</span>
                </button>

                {/* Batch Delete Button */}
                <button
                  type="button"
                  id="btn-open-batch-delete-modal"
                  disabled={selectedGoatIds.length === 0 || isBulkUpdating}
                  onClick={() => setIsBatchDeleteModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 active:scale-98 text-white transition-all shadow-xs flex items-center gap-1.5"
                  title="Permanently delete all selected goat records"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected ({selectedGoatIds.length})</span>
                </button>

                {/* Export Selected to Excel & CSV */}
                <button
                  type="button"
                  id="btn-export-selected-excel"
                  onClick={() => {
                    const selectedRecords = goats.filter(g => selectedGoatIds.includes(g.id));
                    handleExportData('selected-goats', 'excel', selectedRecords);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-600 transition-colors flex items-center gap-1.5"
                  title="Export only selected goats to formatted Excel file"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="hidden sm:inline">Excel</span>
                </button>

                <button
                  type="button"
                  id="btn-export-selected-goats"
                  onClick={() => {
                    const selectedRecords = goats.filter(g => selectedGoatIds.includes(g.id));
                    handleExportData('selected-goats', 'csv', selectedRecords);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors flex items-center gap-1.5"
                  title="Export only selected goats to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-stone-400" />
                  <span className="hidden sm:inline">CSV</span>
                </button>

                <button
                  type="button"
                  id="btn-export-selected-pdf"
                  onClick={() => {
                    const selectedRecords = goats.filter(g => selectedGoatIds.includes(g.id));
                    handleExportData('selected-goats', 'pdf', selectedRecords);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-rose-800 hover:bg-rose-700 text-rose-100 border border-rose-600 transition-colors flex items-center gap-1.5"
                  title="Export only selected goats as a formatted PDF document"
                >
                  <Printer className="w-3.5 h-3.5 text-rose-300" />
                  <span className="hidden sm:inline">PDF</span>
                </button>

                {/* Clear selection */}
                <button
                  type="button"
                  onClick={() => setSelectedGoatIds([])}
                  className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
                  title="Clear selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {bulkSuccessMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{bulkSuccessMsg}</span>
              </div>
              <button onClick={() => setBulkSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <GoatRecordsTableTemplate
            goats={filteredGoats}
            health={health}
            breeding={breeding}
            sales={sales}
            isBulkMode={isBulkMode}
            selectedGoatIds={selectedGoatIds}
            onToggleSelectGoat={(id) => {
              setSelectedGoatIds(prev =>
                prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
              );
            }}
            onSelectAllFiltered={(checked) => {
              if (checked) {
                setSelectedGoatIds(filteredGoats.map(g => g.id));
              } else {
                setSelectedGoatIds([]);
              }
            }}
            onUpdateGoatStatus={async (id, newStatus) => {
              await updateGoat(id, { status: newStatus });
              showToast(`Updated status to "${newStatus}"`, 'success');
            }}
            onEditGoat={async (updatedGoat) => {
              await updateGoat(updatedGoat.id, updatedGoat);
              showToast(`Updated goat ${updatedGoat.tag_number}`, 'success');
            }}
            onDeleteGoat={async (id) => {
              await deleteGoat(id);
              showToast(`Goat record deleted`, 'info');
            }}
            onViewPedigree={(goat) => {
              setPedigreeTargetGoat(goat);
            }}
            onNavigateToHealthWithGoat={(goatTag) => {
              setActiveTab('health');
              setSearchQuery(goatTag);
            }}
          />
        </>
      )}

      {/* TAB: KIDS & NURSERY */}
      {activeTab === 'kids' && (
        <div className="space-y-6">
          <KidGrowthTracker />
        </div>
      )}

      {/* TAB 2: BREEDING */}
      {activeTab === 'breeding' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto max-h-[calc(100vh-250px)] overflow-y-auto">
            <table className="w-full text-left text-sm border-collapse record-table-grid">
              <thead className="sticky top-0 z-20 select-none bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Female Tag (Dam)</th>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Male Tag (Sire)</th>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Mating Date</th>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Gestation Period</th>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Expected Delivery</th>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/50 dark:divide-stone-800/80">
                {filteredBreeding.length > 0 ? (
                  filteredBreeding.map((item, index) => {
                    const todayMidnight = new Date();
                    todayMidnight.setHours(0, 0, 0, 0);
                    const exp = new Date(item.expected_birth);
                    const expMidnight = new Date(exp);
                    expMidnight.setHours(0, 0, 0, 0);
                    const diffDays = Math.ceil(
                      (expMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const isDue = diffDays <= 0;
                    const isDueSoon = diffDays > 0 && diffDays <= 7;
                    const isEven = index % 2 === 1;

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isEven ? 'bg-[#fbfbf9] dark:bg-stone-900/60' : 'bg-white dark:bg-stone-900'
                        } hover:bg-[#e7f3ec] dark:hover:bg-emerald-950/35`}
                      >
                        <td className="px-6 py-[15px] font-bold text-stone-900 dark:text-stone-100">
                          {item.female_id || <span className="italic text-[#b7bab2] text-xs font-normal">—</span>}
                        </td>
                        <td className="px-6 py-[15px] text-stone-700 dark:text-stone-300">
                          {item.male_id || <span className="italic text-[#b7bab2] text-xs font-normal">—</span>}
                        </td>
                        <td className="px-6 py-[15px] text-stone-600 dark:text-stone-400 font-mono text-xs">
                          {item.mating_date || <span className="italic text-[#b7bab2] text-xs font-normal">—</span>}
                        </td>
                        <td className="px-6 py-[15px] font-mono text-xs text-stone-600 dark:text-stone-400">
                          {item.gestation_days ? `${item.gestation_days} days` : '150 days'}
                        </td>
                        <td className="px-6 py-[15px] font-mono text-xs">
                          {item.expected_birth ? (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium ${
                                isDueSoon
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-bold'
                                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                              }`}
                            >
                              {isDueSoon && <span>Due soon ({diffDays}d)!</span>}
                              <span>{item.expected_birth}</span>
                            </span>
                          ) : (
                            <span className="italic text-[#b7bab2] text-xs font-normal">—</span>
                          )}
                        </td>
                        <td className="px-6 py-[15px] text-right flex items-center justify-end gap-2">
                          {item.status === 'Delivered' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Delivered ({item.kids_born || 1} {item.kids_born === 1 ? 'kid' : 'kids'})</span>
                            </span>
                          ) : isDue ? (
                            <button
                              type="button"
                              id={`btn-record-kidding-${item.id}`}
                              onClick={() => handleOpenKiddingModal(item)}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all shadow-2xs ring-2 ring-emerald-500/20 cursor-pointer animate-pulse"
                              title="Expected kidding date reached! Click to record delivery & add kid"
                            >
                              <GoatKidIcon className="w-3.5 h-3.5" />
                              <span>Goat Gave Birth</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled
                                className="px-2 py-1 text-xs font-semibold rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 border border-stone-200 dark:border-stone-700 flex items-center gap-1.5 cursor-not-allowed opacity-80"
                                title={`Gestation in progress (${diffDays} days remaining). Activates on due date (${item.expected_birth}).`}
                              >
                                <Lock className="w-3 h-3 text-stone-400 dark:text-stone-500" />
                                <span>Active on Due Date ({diffDays}d)</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenKiddingModal(item)}
                                className="text-[11px] text-emerald-600 dark:text-emerald-400 underline hover:text-emerald-700 dark:hover:text-emerald-300 cursor-pointer"
                                title="Click to record delivery if goat gave birth early"
                              >
                                Early?
                              </button>
                            </div>
                          )}
                          {onNavigate && (
                            <button
                              type="button"
                              onClick={() => onNavigate('breeding_estimator')}
                              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                              title="Predict kidding date"
                            >
                              <span>Predict</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            id={`btn-del-breed-${item.id}`}
                            onClick={() => deleteBreeding(item.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                            title="Delete record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="max-w-md mx-auto text-center space-y-3">
                        <p className="text-stone-700 dark:text-stone-300 font-semibold">No breeding records found</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          Track mating events, gestation timelines, and kidding forecasts.
                        </p>
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => onOpenAddModal('breeding')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Breeding Manually</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenTabExcelUpload('breeding')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-semibold transition-colors shadow-2xs"
                          >
                            <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Upload Breeding (Excel/CSV)</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: HEALTH */}
      {activeTab === 'health' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto max-h-[calc(100vh-250px)] overflow-y-auto">
            <table className="w-full text-left text-sm border-collapse record-table-grid">
              <thead className="sticky top-0 z-20 select-none bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Goat Tag & Name</th>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Health Status</th>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Checkup Date</th>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Condition & Type</th>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Treatment / Medication</th>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Gestation / Ultrasound</th>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Attending Vet</th>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/50 dark:divide-stone-800/80">
                {filteredHealth.length > 0 ? (
                  filteredHealth.map((item, index) => {
                    const matchedGoat = goatMap.get(item.goat_id.toUpperCase());
                    const isUnderTreatment =
                      item.status === 'Under Treatment' ||
                      item.condition.toLowerCase().includes('sick') ||
                      item.condition.toLowerCase().includes('weak') ||
                      item.condition.toLowerCase().includes('fever');
                    const isCritical = item.status === 'Critical' || item.condition.toLowerCase().includes('critical');
                    const isHealthy =
                      !isUnderTreatment && !isCritical && (item.status === 'Healthy' || item.condition.toLowerCase().includes('healthy') || item.condition.toLowerCase().includes('good'));
                    const isEven = index % 2 === 1;

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isEven ? 'bg-[#fbfbf9] dark:bg-stone-900/60' : 'bg-white dark:bg-stone-900'
                        } hover:bg-[#e7f3ec] dark:hover:bg-emerald-950/35`}
                      >
                        <td className="px-6 py-[15px]">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 dark:text-stone-100 font-mono text-sm">{item.goat_id}</span>
                            {matchedGoat?.name ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <Tag className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                                {matchedGoat.name}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-6 py-[15px]">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                              isCritical
                                ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                : isUnderTreatment
                                ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            {item.status || (isCritical ? 'Critical' : isUnderTreatment ? 'Under Treatment' : 'Healthy')}
                          </span>
                        </td>
                        <td className="px-6 py-[15px] text-stone-600 dark:text-stone-400 font-mono text-xs">
                          {item.checkup_date || <span className="italic text-[#b7bab2] text-xs font-normal">—</span>}
                        </td>
                        <td className="px-6 py-[15px]">
                          <div className="flex flex-col gap-1">
                            <span className="text-stone-800 dark:text-stone-200 font-medium text-xs">
                              {item.condition || <span className="italic text-[#b7bab2] text-xs font-normal">—</span>}
                            </span>
                            {item.checkup_type && (
                              <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                                Type: {item.checkup_type}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-[15px] text-stone-700 dark:text-stone-300 text-xs max-w-xs">
                          {item.treatment || <span className="italic text-[#b7bab2] text-xs font-normal">—</span>}
                        </td>
                        <td className="px-6 py-[15px]">
                          {item.fetal_age_days ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              {item.fetal_age_days}d fetal age
                            </span>
                          ) : item.is_pregnant ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              Pregnant
                            </span>
                          ) : (
                            <span className="italic text-[#b7bab2] text-xs font-normal">—</span>
                          )}
                        </td>
                        <td className="px-6 py-[15px] text-stone-600 dark:text-stone-400 text-xs font-medium">
                          {item.vet_name || 'Staff Attendant'}
                        </td>
                        <td className="px-6 py-[15px] text-right">
                          <button
                            id={`btn-del-health-${item.id}`}
                            onClick={() => deleteHealth(item.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                            title="Delete record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="max-w-md mx-auto text-center space-y-3">
                        <p className="text-stone-700 dark:text-stone-300 font-semibold">No health records found</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          Log treatments, vaccinations, and veterinary checkups manually or upload health spreadsheets.
                        </p>
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => onOpenAddModal('health')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Health Manually</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenTabExcelUpload('health')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-semibold transition-colors shadow-2xs"
                          >
                            <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Upload Health (Excel/CSV)</span>
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setHealthStatusFilter('all');
                          }}
                          className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-block"
                        >
                          Clear Search & Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MILK YIELD */}
      {activeTab === 'milk' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto max-h-[calc(100vh-250px)] overflow-y-auto">
            <table className="w-full text-left text-sm border-collapse record-table-grid">
              <thead className="sticky top-0 z-20 select-none bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Doe Tag</th>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Log Date</th>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Morning Yield</th>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Evening Yield</th>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Total Daily Yield ({milkUnit})</th>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/50 dark:divide-stone-800/80">
                {filteredMilk.length > 0 ? (
                  filteredMilk.map((m, index) => {
                    const isEven = index % 2 === 1;
                    return (
                      <tr
                        key={m.id}
                        className={`transition-colors ${
                          isEven ? 'bg-[#fbfbf9] dark:bg-stone-900/60' : 'bg-white dark:bg-stone-900'
                        } hover:bg-[#e7f3ec] dark:hover:bg-emerald-950/35`}
                      >
                        <td className="px-6 py-[15px] font-bold text-stone-900 dark:text-stone-100">{m.goat_id}</td>
                        <td className="px-6 py-[15px] text-stone-600 dark:text-stone-400 font-mono text-xs">{m.date}</td>
                        <td className="px-6 py-[15px] font-mono text-xs text-stone-700 dark:text-stone-300">{formatMilk(m.morning_liters)}</td>
                        <td className="px-6 py-[15px] font-mono text-xs text-stone-700 dark:text-stone-300">{formatMilk(m.evening_liters)}</td>
                        <td className="px-6 py-[15px]">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono">
                            {formatMilk(m.total_liters)}
                          </span>
                        </td>
                        <td className="px-6 py-[15px] text-right">
                          <button
                            onClick={() => deleteMilk(m.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                            title="Delete record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="max-w-md mx-auto text-center space-y-3">
                        <p className="text-stone-700 dark:text-stone-300 font-semibold">No milk yield logs found</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          Record morning and evening milk production per doe manually or upload milk spreadsheets.
                        </p>
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => onOpenAddModal('milk')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Record Milk Manually</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenTabExcelUpload('milk')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-semibold transition-colors shadow-2xs"
                          >
                            <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Upload Milk (Excel/CSV)</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SALES */}
      {activeTab === 'sales' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto max-h-[calc(100vh-250px)] overflow-y-auto">
            <table className="w-full text-left text-sm border-collapse record-table-grid">
              <thead className="sticky top-0 z-20 select-none bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Goat Tag</th>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Buyer Name</th>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Sale Date</th>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700 text-right">Price ({currency})</th>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/50 dark:divide-stone-800/80">
                {filteredSales.length > 0 ? (
                  filteredSales.map((item, index) => {
                    const isEven = index % 2 === 1;
                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isEven ? 'bg-[#fbfbf9] dark:bg-stone-900/60' : 'bg-white dark:bg-stone-900'
                        } hover:bg-[#e7f3ec] dark:hover:bg-emerald-950/35`}
                      >
                        <td className="px-6 py-[15px] font-bold text-stone-900 dark:text-stone-100">{item.goat_id}</td>
                        <td className="px-6 py-[15px] text-stone-700 dark:text-stone-300">
                          {item.buyer_name || <span className="italic text-[#b7bab2] text-xs font-normal">—</span>}
                        </td>
                        <td className="px-6 py-[15px] text-stone-600 dark:text-stone-400 font-mono text-xs">
                          {item.sale_date || <span className="italic text-[#b7bab2] text-xs font-normal">—</span>}
                        </td>
                        <td className="px-6 py-[15px] font-bold text-emerald-700 dark:text-emerald-400 font-mono text-right">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-6 py-[15px] text-right">
                          <button
                            id={`btn-del-sale-${item.id}`}
                            onClick={() => deleteSale(item.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                            title="Delete record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-stone-400 dark:text-stone-500">
                      No sales records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: WORKERS */}
      {activeTab === 'workers' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto max-h-[calc(100vh-250px)] overflow-y-auto">
            <table className="w-full text-left text-sm border-collapse record-table-grid">
              <thead className="sticky top-0 z-20 select-none bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Full Name</th>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Phone Contact</th>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700">Assigned Facility / Area</th>
                  <th className="px-6 py-3.5 bg-[#f7f6f2] dark:bg-stone-800 border-b border-[#e5e5dc] dark:border-stone-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/50 dark:divide-stone-800/80">
                {filteredWorkers.length > 0 ? (
                  filteredWorkers.map((item, index) => {
                    const isEven = index % 2 === 1;
                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isEven ? 'bg-[#fbfbf9] dark:bg-stone-900/60' : 'bg-white dark:bg-stone-900'
                        } hover:bg-[#e7f3ec] dark:hover:bg-emerald-950/35`}
                      >
                        <td className="px-6 py-[15px] font-bold text-stone-900 dark:text-stone-100">{item.full_name}</td>
                        <td className="px-6 py-[15px] text-stone-600 dark:text-stone-400 font-mono text-xs">
                          {item.phone || <span className="italic text-[#b7bab2] text-xs font-normal">—</span>}
                        </td>
                        <td className="px-6 py-[15px] text-stone-700 dark:text-stone-300">
                          {item.location || <span className="italic text-[#b7bab2] text-xs font-normal">—</span>}
                        </td>
                        <td className="px-6 py-[15px] text-right">
                          <button
                            id={`btn-del-worker-${item.id}`}
                            onClick={() => deleteWorker(item.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                            title="Delete record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-stone-400 dark:text-stone-500">
                      No worker records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: FARM ADVISOR INSIGHTS */}
      {activeTab === 'advisor' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-stone-900 p-5 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-stone-500 dark:text-stone-400">
                <GoatKidIcon className="w-4 h-4 text-amber-600" />
                <span>Kidding Soon</span>
              </div>
              <div className="text-2xl font-bold text-stone-900 dark:text-white mt-2">
                {dueSoon.length} Does
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Due within the next 7 days. Prepare kidding pens and sterilized equipment.
              </p>
            </div>

            <div className="bg-white dark:bg-stone-900 p-5 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-stone-500 dark:text-stone-400">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <span>Health Warnings</span>
              </div>
              <div className="text-2xl font-bold text-rose-700 dark:text-rose-400 mt-2">
                {sickGoats.length} Goats
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Currently recorded with fever, weakness, or under medical observation.
              </p>
            </div>

            <div className="bg-white dark:bg-stone-900 p-5 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-stone-500 dark:text-stone-400">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Total Recorded Revenue</span>
              </div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-2 font-mono">
                {formatCurrency(totalSalesRevenue)}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Cumulative livestock sales recorded in your farm ledger.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Excel & Spreadsheet Document Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        defaultCategory={excelCategory}
      />

      {/* Farm Duration Performance & Operational Report Modal */}
      <FarmReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      {/* Multi-Generational Pedigree & Inbreeding Safety Tree Modal */}
      <PedigreeTreeModal
        isOpen={!!pedigreeTargetGoat}
        onClose={() => setPedigreeTargetGoat(null)}
        rootSubject={pedigreeTargetGoat}
        allGoats={goats}
      />

      {/* Batch Edit Modal */}
      {isBatchEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                    Batch Update {selectedGoatIds.length} Goat Records
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Select the fields you want to update across all selected goats.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchEditModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selected goats preview chips */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Targeted Goats ({selectedGoatIds.length}):
              </div>
              <div className="max-h-24 overflow-y-auto p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 flex flex-wrap gap-1.5">
                {goats
                  .filter(g => selectedGoatIds.includes(g.id))
                  .map(g => (
                    <span
                      key={g.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-600 shadow-2xs"
                    >
                      <span>{g.tag_number}</span>
                      {g.name && <span className="font-sans font-normal text-stone-500 dark:text-stone-400 text-[10px]">({g.name})</span>}
                    </span>
                  ))}
              </div>
            </div>

            {/* Form Fields to Update */}
            <div className="space-y-3.5 divide-y divide-stone-100 dark:divide-stone-800">
              {/* 1. Status Update */}
              <div className="pt-2 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="batch-update-status-check"
                  checked={batchEditForm.updateStatus}
                  onChange={e => setBatchEditForm(prev => ({ ...prev, updateStatus: e.target.checked }))}
                  className="mt-1 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1 space-y-1.5">
                  <label htmlFor="batch-update-status-check" className="text-xs font-bold text-stone-900 dark:text-stone-100 cursor-pointer">
                    Update Herd Status
                  </label>
                  <select
                    disabled={!batchEditForm.updateStatus}
                    value={batchEditForm.status}
                    onChange={e => setBatchEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className={`w-full text-xs font-medium rounded-xl border p-2 bg-white dark:bg-stone-800 transition-colors ${
                      batchEditForm.updateStatus
                        ? 'border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500/20'
                        : 'border-stone-200 dark:border-stone-800 text-stone-400 dark:text-stone-600 cursor-not-allowed bg-stone-50 dark:bg-stone-800/40'
                    }`}
                  >
                    <option value="Active">Active (Healthy Herd)</option>
                    <option value="Pregnant">Pregnant</option>
                    <option value="Quarantine">Quarantine (Isolation)</option>
                    <option value="Sold">Sold</option>
                    <option value="Dead">Dead (Deceased / Culled)</option>
                  </select>
                </div>
              </div>

              {/* 2. Breed Update */}
              <div className="pt-3 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="batch-update-breed-check"
                  checked={batchEditForm.updateBreed}
                  onChange={e => setBatchEditForm(prev => ({ ...prev, updateBreed: e.target.checked }))}
                  className="mt-1 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1 space-y-1.5">
                  <label htmlFor="batch-update-breed-check" className="text-xs font-bold text-stone-900 dark:text-stone-100 cursor-pointer">
                    Update Breed
                  </label>
                  <input
                    type="text"
                    list="batch-breed-suggestions"
                    disabled={!batchEditForm.updateBreed}
                    value={batchEditForm.breed}
                    onChange={e => setBatchEditForm(prev => ({ ...prev, breed: e.target.value }))}
                    placeholder="e.g. Boer, Anglo-Nubian, Saanen..."
                    className={`w-full text-xs font-medium rounded-xl border p-2 bg-white dark:bg-stone-800 transition-colors ${
                      batchEditForm.updateBreed
                        ? 'border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-500/20'
                        : 'border-stone-200 dark:border-stone-800 text-stone-400 dark:text-stone-600 cursor-not-allowed bg-stone-50 dark:bg-stone-800/40'
                    }`}
                  />
                  <datalist id="batch-breed-suggestions">
                    {availableBreeds.map(b => (
                      <option key={b} value={b} />
                    ))}
                    <option value="Boer" />
                    <option value="Anglo-Nubian" />
                    <option value="Saanen" />
                    <option value="Alpine" />
                    <option value="Kiko" />
                    <option value="LaMancha" />
                    <option value="Nigerian Dwarf" />
                    <option value="Kalahari Red" />
                    <option value="Crossbreed" />
                  </datalist>
                </div>
              </div>

              {/* 3. Gender Update */}
              <div className="pt-3 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="batch-update-gender-check"
                  checked={batchEditForm.updateGender}
                  onChange={e => setBatchEditForm(prev => ({ ...prev, updateGender: e.target.checked }))}
                  className="mt-1 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1 space-y-1.5">
                  <label htmlFor="batch-update-gender-check" className="text-xs font-bold text-stone-900 dark:text-stone-100 cursor-pointer">
                    Update Gender
                  </label>
                  <div className="flex items-center gap-4">
                    <label className={`inline-flex items-center gap-1.5 text-xs ${batchEditForm.updateGender ? 'cursor-pointer text-stone-800 dark:text-stone-200' : 'text-stone-400 dark:text-stone-600 cursor-not-allowed'}`}>
                      <input
                        type="radio"
                        name="batch-gender"
                        value="Female"
                        disabled={!batchEditForm.updateGender}
                        checked={batchEditForm.gender === 'Female'}
                        onChange={() => setBatchEditForm(prev => ({ ...prev, gender: 'Female' }))}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Female (Doe)</span>
                    </label>
                    <label className={`inline-flex items-center gap-1.5 text-xs ${batchEditForm.updateGender ? 'cursor-pointer text-stone-800 dark:text-stone-200' : 'text-stone-400 dark:text-stone-600 cursor-not-allowed'}`}>
                      <input
                        type="radio"
                        name="batch-gender"
                        value="Male"
                        disabled={!batchEditForm.updateGender}
                        checked={batchEditForm.gender === 'Male'}
                        onChange={() => setBatchEditForm(prev => ({ ...prev, gender: 'Male' }))}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Male (Buck)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 4. Weight Update */}
              <div className="pt-3 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="batch-update-weight-check"
                  checked={batchEditForm.updateWeight}
                  onChange={e => setBatchEditForm(prev => ({ ...prev, updateWeight: e.target.checked }))}
                  className="mt-1 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1 space-y-2">
                  <label htmlFor="batch-update-weight-check" className="text-xs font-bold text-stone-900 dark:text-stone-100 cursor-pointer">
                    Update Weight (kg)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      disabled={!batchEditForm.updateWeight}
                      value={batchEditForm.weightMode}
                      onChange={e => setBatchEditForm(prev => ({ ...prev, weightMode: e.target.value as any }))}
                      className={`text-xs font-medium rounded-xl border p-2 bg-white dark:bg-stone-800 transition-colors ${
                        batchEditForm.updateWeight
                          ? 'border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100'
                          : 'border-stone-200 dark:border-stone-800 text-stone-400 dark:text-stone-600 cursor-not-allowed bg-stone-50 dark:bg-stone-800/40'
                      }`}
                    >
                      <option value="set">Set exact weight</option>
                      <option value="adjust_add">Add weight (+ kg)</option>
                      <option value="adjust_sub">Subtract weight (- kg)</option>
                    </select>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      disabled={!batchEditForm.updateWeight}
                      value={batchEditForm.weightValue}
                      onChange={e => setBatchEditForm(prev => ({ ...prev, weightValue: e.target.value }))}
                      placeholder="e.g. 35.5"
                      className={`text-xs font-medium rounded-xl border p-2 bg-white dark:bg-stone-800 transition-colors ${
                        batchEditForm.updateWeight
                          ? 'border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100'
                          : 'border-stone-200 dark:border-stone-800 text-stone-400 dark:text-stone-600 cursor-not-allowed bg-stone-50 dark:bg-stone-800/40'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setIsBatchEditModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-batch-edit"
                disabled={
                  isBulkUpdating ||
                  (!batchEditForm.updateStatus &&
                    !batchEditForm.updateBreed &&
                    !batchEditForm.updateGender &&
                    !batchEditForm.updateWeight)
                }
                onClick={handleApplyBatchEdit}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isBulkUpdating ? 'Saving Changes...' : `Apply Updates (${selectedGoatIds.length} Goats)`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Modal */}
      {isBatchDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  Delete {selectedGoatIds.length} Goat Records?
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
              You are about to permanently remove <strong className="font-bold text-rose-950 dark:text-rose-100">{selectedGoatIds.length} goat(s)</strong> from your herd. These records will be erased from your active registry, health logs, weight charts, and cloud database.
            </div>

            {/* List of tags to be deleted */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Selected Goats for Deletion:
              </div>
              <div className="max-h-36 overflow-y-auto p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 flex flex-wrap gap-1.5">
                {goats
                  .filter(g => selectedGoatIds.includes(g.id))
                  .map(g => (
                    <span
                      key={g.id}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-bold bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-600 shadow-2xs"
                    >
                      <span>{g.tag_number}</span>
                      {g.name && <span className="font-sans font-normal text-stone-500 dark:text-stone-400 text-[11px]">({g.name})</span>}
                    </span>
                  ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                disabled={isBatchDeleting}
                onClick={() => setIsBatchDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-batch-delete"
                disabled={isBatchDeleting}
                onClick={async () => {
                  setIsBatchDeleting(true);
                  try {
                    const count = selectedGoatIds.length;
                    await bulkDeleteGoats(selectedGoatIds);
                    showToast(`Successfully deleted ${count} goat record(s) from herd.`, 'success');
                    setSelectedGoatIds([]);
                    setIsBatchDeleteModalOpen(false);
                  } catch (err: any) {
                    showToast(err.message || 'Failed to delete selected goats', 'error');
                  } finally {
                    setIsBatchDeleting(false);
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-xs flex items-center gap-1.5 active:scale-98 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isBatchDeleting ? 'Deleting Goats...' : `Confirm Delete (${selectedGoatIds.length})`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kidding / Delivery Modal */}
      <RecordKiddingModal
        isOpen={!!selectedBreedingForDelivery}
        onClose={() => setSelectedBreedingForDelivery(null)}
        breedingRecord={selectedBreedingForDelivery}
        onSuccess={() => {
          setActiveTab('kids');
          setSearchQuery('');
        }}
      />
    </div>
  );
};
