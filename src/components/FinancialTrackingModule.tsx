import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { ExpenseCategory } from '../types';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Trash2,
  Filter,
  Search,
  Receipt,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Stethoscope,
  Wrench,
  Tag,
  CheckCircle2,
  Download,
  AlertCircle,
  Wheat,
  Briefcase
} from 'lucide-react';

export const FinancialTrackingModule: React.FC = () => {
  const { sales, expenses, addExpense, deleteExpense, addSale, deleteSale, goats, farmName } = useFarm();

  // Modal / Form state
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddRevenueModal, setShowAddRevenueModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filter & Search state
  const [activeFilter, setActiveFilter] = useState<'all' | 'revenue' | 'expense' | 'feed' | 'vet' | 'equipment'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New Expense form state
  const todayStr = new Date().toISOString().split('T')[0];
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('Feed');
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(todayStr);
  const [expReceipt, setExpReceipt] = useState('');
  const [expNotes, setExpNotes] = useState('');

  // New Revenue (Sale) form state
  const [revGoatId, setRevGoatId] = useState('');
  const [revBuyer, setRevBuyer] = useState('');
  const [revPrice, setRevPrice] = useState('');
  const [revDate, setRevDate] = useState(todayStr);
  const [revError, setRevError] = useState<string | null>(null);

  // Financial aggregates
  const totalRevenue = useMemo(() => {
    return sales.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  }, [sales]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  // Category breakdowns
  const categoryTotals = useMemo(() => {
    const totals: Record<ExpenseCategory, number> = {
      Feed: 0,
      Vet: 0,
      Equipment: 0,
      Labor: 0,
      Other: 0,
    };
    expenses.forEach(e => {
      const cat = e.category || 'Other';
      totals[cat] = (totals[cat] || 0) + (Number(e.amount) || 0);
    });
    return totals;
  }, [expenses]);

  // Unified financial ledger entries
  interface LedgerEntry {
    id: string;
    originalId: string;
    type: 'revenue' | 'expense';
    category: string;
    title: string;
    reference: string;
    date: string;
    amount: number;
    rawDate: number;
  }

  const unifiedLedger = useMemo(() => {
    const entries: LedgerEntry[] = [];

    // Sales -> Revenue entries
    sales.forEach(s => {
      const dateVal = s.sale_date || '';
      entries.push({
        id: `sale-${s.id}`,
        originalId: s.id,
        type: 'revenue',
        category: 'Goat Sale',
        title: `Goat Sale (${s.goat_id || 'Herd Stock'})`,
        reference: s.buyer_name ? `Buyer: ${s.buyer_name}` : 'Commercial Sale',
        date: dateVal,
        amount: Number(s.price) || 0,
        rawDate: dateVal ? new Date(dateVal).getTime() : 0,
      });
    });

    // Expenses -> Cost entries
    expenses.forEach(e => {
      const dateVal = e.date || '';
      entries.push({
        id: `exp-${e.id}`,
        originalId: e.id,
        type: 'expense',
        category: e.category,
        title: e.title || `${e.category} Expense`,
        reference: e.receipt_number ? `Ref #${e.receipt_number}` : (e.notes || '—'),
        date: dateVal,
        amount: Number(e.amount) || 0,
        rawDate: dateVal ? new Date(dateVal).getTime() : 0,
      });
    });

    // Sort newest to oldest
    entries.sort((a, b) => b.rawDate - a.rawDate);
    return entries;
  }, [sales, expenses]);

  // Filtered ledger
  const filteredLedger = useMemo(() => {
    return unifiedLedger.filter(entry => {
      // Filter tab check
      if (activeFilter === 'revenue' && entry.type !== 'revenue') return false;
      if (activeFilter === 'expense' && entry.type !== 'expense') return false;
      if (activeFilter === 'feed' && entry.category !== 'Feed') return false;
      if (activeFilter === 'vet' && entry.category !== 'Vet') return false;
      if (activeFilter === 'equipment' && entry.category !== 'Equipment') return false;

      // Search query check
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = entry.title.toLowerCase().includes(query);
        const matchesRef = entry.reference.toLowerCase().includes(query);
        const matchesCategory = entry.category.toLowerCase().includes(query);
        const matchesDate = entry.date.toLowerCase().includes(query);
        const matchesAmount = entry.amount.toString().includes(query);
        if (!matchesTitle && !matchesRef && !matchesCategory && !matchesDate && !matchesAmount) {
          return false;
        }
      }

      return true;
    });
  }, [unifiedLedger, activeFilter, searchQuery]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || !expAmount || Number(expAmount) <= 0) return;

    setIsSubmitting(true);
    try {
      await addExpense({
        category: expCategory,
        title: expTitle.trim(),
        amount: Number(expAmount),
        date: expDate || todayStr,
        notes: expNotes.trim() || undefined,
        receipt_number: expReceipt.trim() || undefined,
      });

      setExpTitle('');
      setExpAmount('');
      setExpReceipt('');
      setExpNotes('');
      setShowAddExpenseModal(false);
      setSuccessToast(`Expense "${expTitle.trim()}" logged successfully!`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevError(null);
    if (!revGoatId.trim()) {
      setRevError('Please select a goat from the herd.');
      return;
    }

    const trimmedInput = revGoatId.trim();
    const existingGoat = goats.find(
      g => g.tag_number.toUpperCase() === trimmedInput.toUpperCase() ||
           g.id === trimmedInput ||
           (g.name && g.name.trim().toLowerCase() === trimmedInput.toLowerCase())
    );

    if (!existingGoat) {
      setRevError(`Cannot sell goat: "${trimmedInput}" is not in your herd list by Tag ID or Name.`);
      return;
    }

    if (existingGoat.status === 'Sold') {
      setRevError(`Cannot sell goat: Goat ${existingGoat.tag_number}${existingGoat.name ? ` (${existingGoat.name})` : ''} is already marked as Sold.`);
      return;
    }

    if (existingGoat.status === 'Dead') {
      setRevError(`Cannot sell goat: Goat ${existingGoat.tag_number}${existingGoat.name ? ` (${existingGoat.name})` : ''} is recorded as Deceased / Dead in farm records.`);
      return;
    }

    if (!revPrice || Number(revPrice) <= 0) {
      setRevError('Please enter a valid sale price.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addSale({
        goat_id: existingGoat.tag_number,
        buyer_name: revBuyer.trim() || 'Verified Buyer',
        price: Number(revPrice),
        sale_date: revDate || todayStr,
      });

      setRevGoatId('');
      setRevBuyer('');
      setRevPrice('');
      setRevError(null);
      setShowAddRevenueModal(false);
      setSuccessToast(`Goat ${existingGoat.tag_number} sale of Ksh ${Number(revPrice).toLocaleString()} recorded! Status updated to Sold.`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      setRevError(err?.message || 'Failed to record goat sale');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (entry: LedgerEntry) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete this ${entry.type} record: "${entry.title}"?`);
    if (!confirmDelete) return;

    if (entry.type === 'expense') {
      await deleteExpense(entry.originalId);
      setSuccessToast('Expense record removed.');
    } else {
      await deleteSale(entry.originalId);
      setSuccessToast('Sale transaction removed.');
    }
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleExportFinancialCsv = () => {
    let csv = `# SMART GOAT MANAGEMENT - ${farmName.toUpperCase()} FINANCIAL LEDGER\n`;
    csv += `# Export Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
    csv += `# Total Revenue: Ksh ${totalRevenue.toLocaleString()}\n`;
    csv += `# Total Expenses: Ksh ${totalExpenses.toLocaleString()}\n`;
    csv += `# Net Farm Profit: Ksh ${netProfit.toLocaleString()}\n\n`;

    csv += ['Transaction ID', 'Date', 'Type', 'Category', 'Description', 'Reference / Buyer', 'Cash Inflow (Ksh)', 'Cash Outflow (Ksh)'].map(val => `"${val}"`).join(',') + '\n';

    unifiedLedger.forEach(entry => {
      csv += [
        entry.id,
        entry.date || '—',
        entry.type.toUpperCase(),
        entry.category,
        entry.title,
        entry.reference,
        entry.type === 'revenue' ? entry.amount : 0,
        entry.type === 'expense' ? entry.amount : 0,
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitized = farmName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute('download', `${sanitized}_financial_ledger_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSuccessToast('Financial Ledger exported to CSV!');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const getCategoryBadge = (category: string, type: 'revenue' | 'expense') => {
    if (type === 'revenue') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <ArrowUpRight className="w-3 h-3 text-emerald-600" />
          Revenue: {category}
        </span>
      );
    }
    switch (category) {
      case 'Feed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
            <Wheat className="w-3 h-3 text-amber-600" />
            Feed Expense
          </span>
        );
      case 'Vet':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-900 border border-sky-200">
            <Stethoscope className="w-3 h-3 text-sky-600" />
            Vet Care
          </span>
        );
      case 'Equipment':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-900 border border-purple-200">
            <Wrench className="w-3 h-3 text-purple-600" />
            Equipment
          </span>
        );
      case 'Labor':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-900 border border-indigo-200">
            <Briefcase className="w-3 h-3 text-indigo-600" />
            Farm Labor
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-200">
            <Tag className="w-3 h-3 text-stone-500" />
            {category || 'Operating Cost'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold shadow-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Action Bar & Summary Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            Financial Tracking & Operational Ledger
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Log farm operational expenses (feed, vet, equipment) and commercial revenue to monitor cash flow and net profitability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            id="btn-log-expense-trigger"
            onClick={() => setShowAddExpenseModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Log Expense</span>
          </button>

          <button
            type="button"
            id="btn-log-revenue-trigger"
            onClick={() => setShowAddRevenueModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Log Revenue</span>
          </button>

          <button
            type="button"
            id="btn-export-financial-csv"
            onClick={handleExportFinancialCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl border border-stone-200 transition-colors"
            title="Download Financial CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Revenue, Expenses, Net Profit */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Total Revenue (Sales)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight font-mono">
              Ksh {totalRevenue.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{sales.length} commercial sale transaction(s)</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Total Operating Expenses
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight font-mono">
              Ksh {totalExpenses.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-xs text-rose-700 font-medium flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>{expenses.length} expense log(s) across operations</span>
          </div>
        </div>

        {/* Net Profit / Margin */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Net Farm Cash Flow
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                netProfit >= 0
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}
            >
              {profitMargin}% Margin
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-mono ${
                netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {netProfit >= 0 ? '+' : ''}Ksh {netProfit.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-xs text-stone-500">
            {netProfit >= 0 ? 'Profitable commercial return' : 'Operating investment deficit'}
          </div>
        </div>
      </div>

      {/* Operating Expense Breakdown by Category */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80">
          <div className="flex items-center gap-1.5 text-amber-900 text-xs font-semibold">
            <Wheat className="w-3.5 h-3.5 text-amber-600" />
            <span>Feed & Forage</span>
          </div>
          <div className="text-base font-bold text-amber-950 font-mono mt-1">
            Ksh {categoryTotals.Feed.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-700 mt-0.5">
            {totalExpenses > 0 ? Math.round((categoryTotals.Feed / totalExpenses) * 100) : 0}% of expenses
          </div>
        </div>

        <div className="p-3.5 bg-sky-50/60 rounded-xl border border-sky-200/80">
          <div className="flex items-center gap-1.5 text-sky-900 text-xs font-semibold">
            <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
            <span>Vet & Healthcare</span>
          </div>
          <div className="text-base font-bold text-sky-950 font-mono mt-1">
            Ksh {categoryTotals.Vet.toLocaleString()}
          </div>
          <div className="text-[11px] text-sky-700 mt-0.5">
            {totalExpenses > 0 ? Math.round((categoryTotals.Vet / totalExpenses) * 100) : 0}% of expenses
          </div>
        </div>

        <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200/80">
          <div className="flex items-center gap-1.5 text-purple-900 text-xs font-semibold">
            <Wrench className="w-3.5 h-3.5 text-purple-600" />
            <span>Equipment & Tools</span>
          </div>
          <div className="text-base font-bold text-purple-950 font-mono mt-1">
            Ksh {categoryTotals.Equipment.toLocaleString()}
          </div>
          <div className="text-[11px] text-purple-700 mt-0.5">
            {totalExpenses > 0 ? Math.round((categoryTotals.Equipment / totalExpenses) * 100) : 0}% of expenses
          </div>
        </div>

        <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
          <div className="flex items-center gap-1.5 text-stone-700 text-xs font-semibold">
            <Tag className="w-3.5 h-3.5 text-stone-500" />
            <span>Labor & Other</span>
          </div>
          <div className="text-base font-bold text-stone-900 font-mono mt-1">
            Ksh {(categoryTotals.Labor + categoryTotals.Other).toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">
            {totalExpenses > 0 ? Math.round(((categoryTotals.Labor + categoryTotals.Other) / totalExpenses) * 100) : 0}% of expenses
          </div>
        </div>
      </div>

      {/* Summary Table with Filtering & Search */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Filter Tabs and Search Bar */}
        <div className="p-4 border-b border-stone-100 bg-stone-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              id="filter-all-financials"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeFilter === 'all'
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              All Logs ({unifiedLedger.length})
            </button>
            <button
              type="button"
              id="filter-revenue-only"
              onClick={() => setActiveFilter('revenue')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeFilter === 'revenue'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              Revenue ({sales.length})
            </button>
            <button
              type="button"
              id="filter-expense-only"
              onClick={() => setActiveFilter('expense')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeFilter === 'expense'
                  ? 'bg-rose-700 text-white'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              Expenses ({expenses.length})
            </button>
            <button
              type="button"
              id="filter-feed-only"
              onClick={() => setActiveFilter('feed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeFilter === 'feed'
                  ? 'bg-amber-700 text-white'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              Feed
            </button>
            <button
              type="button"
              id="filter-vet-only"
              onClick={() => setActiveFilter('vet')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeFilter === 'vet'
                  ? 'bg-sky-700 text-white'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              Vet Care
            </button>
            <button
              type="button"
              id="filter-equipment-only"
              onClick={() => setActiveFilter('equipment')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                activeFilter === 'equipment'
                  ? 'bg-purple-700 text-white'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              Equipment
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
            <input
              id="input-search-financials"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search description, buyer..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-xs font-semibold text-stone-600 uppercase tracking-wider border-b border-stone-200">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Description / Item</th>
                <th className="px-5 py-3">Reference / Counterparty</th>
                <th className="px-5 py-3 text-right">Inflow (Revenue)</th>
                <th className="px-5 py-3 text-right">Outflow (Expense)</th>
                <th className="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredLedger.length > 0 ? (
                filteredLedger.map(entry => (
                  <tr key={entry.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-stone-500 font-mono whitespace-nowrap">
                      {entry.date || '—'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {getCategoryBadge(entry.category, entry.type)}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-stone-900">
                      {entry.title}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-stone-500">
                      {entry.reference}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-xs whitespace-nowrap">
                      {entry.type === 'revenue' ? (
                        <span className="font-bold text-emerald-700">
                          +Ksh {entry.amount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-stone-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-xs whitespace-nowrap">
                      {entry.type === 'expense' ? (
                        <span className="font-bold text-rose-700">
                          -Ksh {entry.amount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-stone-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(entry)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-stone-400 text-sm">
                    No transactions found matching the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
            {/* Table Footer Totals */}
            {filteredLedger.length > 0 && (
              <tfoot className="bg-stone-50 font-semibold text-xs border-t border-stone-200">
                <tr>
                  <td colSpan={4} className="px-5 py-3 text-stone-700 uppercase tracking-wider">
                    Total Filtered ({filteredLedger.length} items)
                  </td>
                  <td className="px-5 py-3 text-right font-mono font-bold text-emerald-700">
                    +Ksh{' '}
                    {filteredLedger
                      .filter(e => e.type === 'revenue')
                      .reduce((sum, e) => sum + e.amount, 0)
                      .toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right font-mono font-bold text-rose-700">
                    -Ksh{' '}
                    {filteredLedger
                      .filter(e => e.type === 'expense')
                      .reduce((sum, e) => sum + e.amount, 0)
                      .toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* LOG EXPENSE MODAL */}
      {showAddExpenseModal && (
        <div
          id="modal-log-expense"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-stone-200 animate-scale-in">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-base">Log Farm Expense</h4>
                  <p className="text-xs text-stone-500">Record costs for feed, vet care, equipment, or labor</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddExpenseModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Expense Category *
                </label>
                <select
                  id="select-expense-category"
                  value={expCategory}
                  onChange={e => setExpCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="Feed">🌾 Feed & Forage</option>
                  <option value="Vet">⚕️ Veterinary & Health</option>
                  <option value="Equipment">🛠️ Equipment & Infrastructure</option>
                  <option value="Labor">💼 Farm Staff & Labor</option>
                  <option value="Other">🏷️ Other Operating Cost</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Expense Title / Description *
                </label>
                <input
                  id="input-expense-title"
                  type="text"
                  required
                  value={expTitle}
                  onChange={e => setExpTitle(e.target.value)}
                  placeholder="e.g. Dairy Meal 10 bags, CCPP Vaccines, Mineral Salt"
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Amount (Ksh) *
                  </label>
                  <input
                    id="input-expense-amount"
                    type="number"
                    min="1"
                    required
                    value={expAmount}
                    onChange={e => setExpAmount(e.target.value)}
                    placeholder="e.g. 14500"
                    className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Date *
                  </label>
                  <input
                    id="input-expense-date"
                    type="date"
                    required
                    value={expDate}
                    onChange={e => setExpDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Receipt / Invoice Number (Optional)
                </label>
                <input
                  id="input-expense-receipt"
                  type="text"
                  value={expReceipt}
                  onChange={e => setExpReceipt(e.target.value)}
                  placeholder="e.g. REC-8921 or VET-440"
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="input-expense-notes"
                  rows={2}
                  value={expNotes}
                  onChange={e => setExpNotes(e.target.value)}
                  placeholder="e.g. Purchased from Nakuru Millers, supplier delivery included"
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-expense"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG REVENUE (SALE) MODAL */}
      {showAddRevenueModal && (
        <div
          id="modal-log-revenue"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-stone-200 animate-scale-in">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-base">Log Farm Revenue / Sale</h4>
                  <p className="text-xs text-stone-500">Record animal sale proceeds or dairy commercial revenue</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddRevenueModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRevenue} className="space-y-3.5">
              {revError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{revError}</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Select Goat from Herd to Sell *
                  </label>
                  <span className="text-[11px] text-stone-500 font-medium">
                    {goats.filter(g => g.status !== 'Sold' && g.status !== 'Dead').length} available to sell
                  </span>
                </div>

                {goats.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    ⚠️ No goats currently registered in your herd. Please add goats first before recording sales.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      id="input-revenue-goat-id"
                      value={revGoatId}
                      onChange={e => {
                        setRevGoatId(e.target.value);
                        setRevError(null);
                      }}
                      className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                    >
                      <option value="">-- Choose Goat from Herd --</option>
                      {goats.map(g => (
                        <option
                          key={g.id}
                          value={g.tag_number}
                          disabled={g.status === 'Sold' || g.status === 'Dead'}
                        >
                          {g.tag_number} {g.name ? `(${g.name})` : ''} - {g.breed} [{g.status || 'Active'}]{g.status === 'Sold' ? ' — Sold' : g.status === 'Dead' ? ' — Deceased (Dead)' : ''}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Or enter Goat ID or Name..."
                      value={revGoatId}
                      onChange={e => {
                        setRevGoatId(e.target.value);
                        setRevError(null);
                      }}
                      className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                    />

                    {revGoatId && (() => {
                      const trimmed = revGoatId.trim().toUpperCase();
                      const sel = goats.find(
                        g => g.tag_number.toUpperCase() === trimmed ||
                             (g.name && g.name.trim().toUpperCase() === trimmed) ||
                             g.id === revGoatId.trim()
                      );
                      if (!sel) return null;
                      return (
                        <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                          <span className="font-semibold">
                            {sel.tag_number} {sel.name ? `• ${sel.name}` : ''} • {sel.breed}
                          </span>
                          <span className="text-[11px] font-mono bg-emerald-100 px-2 py-0.5 rounded-md text-emerald-800">
                            Status: {sel.status || 'Active'}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Buyer Name / Client *
                </label>
                <input
                  id="input-revenue-buyer"
                  type="text"
                  required
                  value={revBuyer}
                  onChange={e => setRevBuyer(e.target.value)}
                  placeholder="e.g. David Mwangi or Rift Valley Livestock"
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Sale Price (Ksh) *
                  </label>
                  <input
                    id="input-revenue-price"
                    type="number"
                    min="1"
                    required
                    value={revPrice}
                    onChange={e => setRevPrice(e.target.value)}
                    placeholder="e.g. 28000"
                    className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Sale Date *
                  </label>
                  <input
                    id="input-revenue-date"
                    type="date"
                    required
                    value={revDate}
                    onChange={e => setRevDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddRevenueModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  id="btn-submit-revenue"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Save Revenue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
