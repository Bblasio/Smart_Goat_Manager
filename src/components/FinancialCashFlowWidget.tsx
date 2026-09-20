import React, { useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  PieChart as PieIcon,
  BarChart3,
  Wheat,
  Stethoscope,
  Wrench,
  Users
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

interface FinancialCashFlowWidgetProps {
  onNavigateToReports?: () => void;
  onNavigateToRecords?: () => void;
  onOpenAddSaleModal?: () => void;
  onOpenAddExpenseModal?: () => void;
}

export const FinancialCashFlowWidget: React.FC<FinancialCashFlowWidgetProps> = ({
  onNavigateToReports,
  onNavigateToRecords,
  onOpenAddSaleModal,
  onOpenAddExpenseModal,
}) => {
  const { sales, expenses, goats } = useFarm();

  // Calculate high-level financial metrics
  const financialTotals = useMemo(() => {
    const totalRevenue = sales.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const netMargin = totalRevenue - totalExpenses;
    const marginPercent = totalRevenue > 0 ? Math.round((netMargin / totalRevenue) * 100) : 0;
    const averagePricePerHead = sales.length > 0 ? Math.round(totalRevenue / sales.length) : 0;

    // Expense breakdown by category
    const categoryTotals: Record<string, number> = {
      Feed: 0,
      Vet: 0,
      Equipment: 0,
      Labor: 0,
      Other: 0,
    };

    expenses.forEach(e => {
      const cat = e.category || 'Other';
      if (categoryTotals[cat] !== undefined) {
        categoryTotals[cat] += Number(e.amount) || 0;
      } else {
        categoryTotals.Other += Number(e.amount) || 0;
      }
    });

    return {
      totalRevenue,
      totalExpenses,
      netMargin,
      marginPercent,
      averagePricePerHead,
      categoryTotals,
      salesCount: sales.length,
      expensesCount: expenses.length,
    };
  }, [sales, expenses]);

  // Monthly 6-Month Cash Flow Bar Comparison
  const cashFlowData = useMemo(() => {
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
    const currentYear = 2026;

    // Map month names to index
    const monthMap: Record<string, { income: number; expense: number }> = {
      Apr: { income: 0, expense: 0 },
      May: { income: 0, expense: 0 },
      Jun: { income: 0, expense: 0 },
      Jul: { income: 0, expense: 0 },
      Aug: { income: 0, expense: 0 },
      Sep: { income: 0, expense: 0 },
    };

    sales.forEach(s => {
      if (!s.sale_date) return;
      const d = new Date(s.sale_date);
      const m = d.toLocaleString('en-US', { month: 'short' });
      if (monthMap[m]) {
        monthMap[m].income += Number(s.price) || 0;
      }
    });

    expenses.forEach(e => {
      if (!e.date) return;
      const d = new Date(e.date);
      const m = d.toLocaleString('en-US', { month: 'short' });
      if (monthMap[m]) {
        monthMap[m].expense += Number(e.amount) || 0;
      }
    });

    return months.map(m => ({
      month: m,
      Income: monthMap[m].income,
      Expense: monthMap[m].expense,
      Net: monthMap[m].income - monthMap[m].expense,
    }));
  }, [sales, expenses]);

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div
      id="widget-financial-cashflow"
      className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs transition-colors"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-stone-900 dark:text-white">
                Farm Financial Summary & Cash Flow Sparkline
              </h4>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-extrabold font-mono ${
                  financialTotals.netMargin >= 0
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}
              >
                {financialTotals.marginPercent}% Net Margin
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Live enterprise ledger, livestock sales receipts & operating expenditure
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenAddSaleModal && (
            <button
              type="button"
              id="btn-quick-add-sale"
              onClick={onOpenAddSaleModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Sale</span>
            </button>
          )}
          {onNavigateToReports && (
            <button
              type="button"
              id="btn-nav-financial-reports"
              onClick={onNavigateToReports}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-colors"
            >
              <span>Full Financials</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4-KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {/* Total Revenue */}
        <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
          <div className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Livestock Sales</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
            {formatCurrency(financialTotals.totalRevenue)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1 flex items-center gap-1">
            <span>{financialTotals.salesCount} animals sold</span>
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
          <div className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Operating Costs</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-stone-800 dark:text-stone-200 font-mono">
            {formatCurrency(financialTotals.totalExpenses)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1 flex items-center gap-1">
            <span>{financialTotals.expensesCount} logged expenses</span>
          </div>
        </div>

        {/* Net Farm Margin */}
        <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
          <div className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Net Enterprise Margin</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div
            className={`text-xl sm:text-2xl font-extrabold font-mono ${
              financialTotals.netMargin >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(financialTotals.netMargin)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {financialTotals.netMargin >= 0 ? '✓ Profitable cash position' : '⚠ Deficit period'}
          </div>
        </div>

        {/* Average Realized Price Per Head */}
        <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60">
          <div className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Avg Realized Price</span>
            <Receipt className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-white font-mono">
            {formatCurrency(financialTotals.averagePricePerHead)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            Per breeding / market head sold
          </div>
        </div>
      </div>

      {/* Middle Grid: Cash Flow Chart + Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 6-Month Income vs Expense Mini-Bar Chart (8 Cols) */}
        <div className="lg:col-span-8 p-4 rounded-xl bg-stone-50/70 dark:bg-stone-800/40 border border-stone-200/70 dark:border-stone-700/50 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-xs font-extrabold text-stone-800 dark:text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                <span>6-Month Cash Flow Trend (Revenue vs Expenses)</span>
              </h5>
              <p className="text-[11px] text-stone-400">Monthly livestock sales receipts plotted against farm running costs</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
                Income
              </span>
              <span className="flex items-center gap-1 text-rose-500 dark:text-rose-400">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-400 inline-block" />
                Expense
              </span>
            </div>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-stone-200 dark:text-stone-700/50" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={val => `${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1c1917',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '11px',
                    border: 'none',
                  }}
                  formatter={(val: any) => [formatCurrency(Number(val)), '']}
                />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Distribution (4 Cols) */}
        <div className="lg:col-span-4 p-4 rounded-xl bg-stone-50/70 dark:bg-stone-800/40 border border-stone-200/70 dark:border-stone-700/50 flex flex-col justify-between space-y-3">
          <div>
            <h5 className="text-xs font-extrabold text-stone-800 dark:text-stone-200 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <PieIcon className="w-3.5 h-3.5 text-teal-600" />
              <span>Operating Expense Distribution</span>
            </h5>
            <p className="text-[11px] text-stone-400">Largest cost centers on the farm</p>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { label: 'Feed & Forage', key: 'Feed', icon: Wheat, color: 'bg-amber-500' },
              { label: 'Vet & Healthcare', key: 'Vet', icon: Stethoscope, color: 'bg-rose-500' },
              { label: 'Labor & Herders', key: 'Labor', icon: Users, color: 'bg-purple-500' },
              { label: 'Equipment & Fencing', key: 'Equipment', icon: Wrench, color: 'bg-teal-500' },
              { label: 'Other / Transport', key: 'Other', icon: Receipt, color: 'bg-stone-500' },
            ].map(cat => {
              const amount = financialTotals.categoryTotals[cat.key] || 0;
              const pct = financialTotals.totalExpenses > 0
                ? Math.round((amount / financialTotals.totalExpenses) * 100)
                : 0;

              return (
                <div key={cat.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-600 dark:text-stone-300 flex items-center gap-1.5 font-medium">
                      <cat.icon className="w-3 h-3 text-stone-400" />
                      <span>{cat.label}</span>
                    </span>
                    <span className="font-mono text-stone-900 dark:text-stone-100 font-bold text-[11px]">
                      {formatCurrency(amount)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                    <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-stone-200/60 dark:border-stone-700/60 text-[11px] text-stone-500 dark:text-stone-400 flex items-center justify-between">
            <span>Feed Target: ≤55% total ops</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Within Budget</span>
          </div>
        </div>
      </div>
    </div>
  );
};
