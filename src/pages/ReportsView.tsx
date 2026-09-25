import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { useUnits } from '../context/UnitsContext';
import { FinancialTrackingModule } from '../components/FinancialTrackingModule';
import { FarmReportModal } from '../components/FarmReportModal';
import { StatCard } from '../components/StatCard';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Award,
  AlertTriangle,
  TrendingUp,
  BrainCircuit,
  Lightbulb,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Download,
  FileText,
  DollarSign,
  Stethoscope,
  Printer,
  ClipboardList
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export const ReportsView: React.FC = () => {
  const { farmName, user, goats, breeding, sales, expenses, health, milk, workers } = useFarm();
  const { currency, weightUnit, formatCurrency, formatWeight } = useUnits();

  // Collapsible section states
  const [expandFinancialTracking, setExpandFinancialTracking] = useState(true);
  const [expandHighestSales, setExpandHighestSales] = useState(true);
  const [expandPredictedBirths, setExpandPredictedBirths] = useState(true);
  const [expandAnomalyDetection, setExpandAnomalyDetection] = useState(true);
  const [expandRevenueForecast, setExpandRevenueForecast] = useState(true);
  const [expandFarmRecommendations, setExpandFarmRecommendations] = useState(true);
  const [expandFarmSummary, setExpandFarmSummary] = useState(true);

  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const handleDownloadReport = (format: 'all' | 'sales' | 'gestation' | 'inventory' | 'financial' | 'herd_health' | 'herd' | 'health' = 'herd_health') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dateReadable = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let csv = '';

    const totalRev = sales.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
    const totalExp = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const netProfit = totalRev - totalExp;

    if (format === 'all' || format === 'herd_health') {
      csv += `# SMART GOAT MANAGEMENT - ${farmName.toUpperCase()} EXPORT\n`;
      csv += `# Generated Date: ${dateReadable} at ${new Date().toLocaleTimeString()}\n`;
      csv += `# Farm Owner: ${user?.owner_name || 'Registered Farm Manager'}\n`;
      csv += `# Location: ${user?.location || 'Main Farm'}\n`;
      csv += `# Total Registered Goats: ${goats.length}\n`;
      csv += `# Total Health Records: ${health.length}\n`;
      if (format === 'all') {
        csv += `# Total Revenue: ${formatCurrency(totalRev)}\n`;
        csv += `# Total Operating Expenses: ${formatCurrency(totalExp)}\n`;
        csv += `# Net Farm Profit: ${formatCurrency(netProfit)}\n`;
      }
      csv += `\n`;
    }

    // 1. HERD INVENTORY SECTION
    if (format === 'all' || format === 'herd_health' || format === 'herd' || format === 'inventory') {
      if (format === 'herd') {
        csv += `# ${farmName.toUpperCase()} - HERD LIVESTOCK INVENTORY\n`;
        csv += `# Export Date: ${dateReadable}\n`;
        csv += `# Total Registered Goats: ${goats.length}\n\n`;
      }
      csv += `--- HERD LIVESTOCK INVENTORY ---\n`;
      csv += ['Goat Tag ID', 'Name / Alias', 'Breed', 'Gender', 'Date of Birth', 'Weight (kg)', 'Current Status', 'Registration Date'].map(escapeCsv).join(',') + '\n';
      if (goats.length === 0) {
        csv += ['No goats registered in herd', '', '', '', '', '', '', ''].map(escapeCsv).join(',') + '\n';
      } else {
        goats.forEach(g => {
          csv += [
            g.tag_number,
            g.name || '—',
            g.breed,
            g.gender,
            g.dob,
            g.weight_kg != null ? g.weight_kg : '—',
            g.status || 'Active',
            g.created_at || '—',
          ].map(escapeCsv).join(',') + '\n';
        });
      }
      csv += '\n';
    }

    // 2. HEALTH & MEDICAL SECTION
    if (format === 'all' || format === 'herd_health' || format === 'health' || format === 'inventory') {
      if (format === 'health') {
        csv += `# ${farmName.toUpperCase()} - VETERINARY & HEALTH RECORDS\n`;
        csv += `# Export Date: ${dateReadable}\n`;
        csv += `# Total Health Interventions: ${health.length}\n\n`;
      }
      csv += `--- VETERINARY & HEALTH RECORDS ---\n`;
      csv += [
        'Health ID',
        'Goat Tag ID',
        'Checkup Date',
        'Diagnosis / Condition',
        'Treatment Administered',
        'Health Status',
        'Checkup Type',
        'Attending Vet',
        'Pregnant',
        'Fetal Age (Days)',
      ].map(escapeCsv).join(',') + '\n';
      if (health.length === 0) {
        csv += ['No health records registered', '', '', '', '', '', '', '', '', ''].map(escapeCsv).join(',') + '\n';
      } else {
        health.forEach(h => {
          csv += [
            h.id,
            h.goat_id,
            h.checkup_date,
            h.condition,
            h.treatment,
            h.status || 'Healthy',
            h.checkup_type || 'Routine',
            h.vet_name || '—',
            h.is_pregnant ? 'Yes' : 'No',
            h.fetal_age_days != null ? h.fetal_age_days : '—',
          ].map(escapeCsv).join(',') + '\n';
        });
      }
      csv += '\n';
    }

    // 3. FINANCIAL EXPENSES
    if (format === 'all' || format === 'financial') {
      if (format === 'financial') {
        csv += `# ${farmName.toUpperCase()} - FINANCIAL LEDGER & OPERATING EXPENSES\n`;
        csv += `# Export Date: ${dateReadable}\n`;
        csv += `# Total Revenue: ${formatCurrency(totalRev)}\n`;
        csv += `# Total Expenses: ${formatCurrency(totalExp)}\n`;
        csv += `# Net Profit: ${formatCurrency(netProfit)}\n\n`;
      }
      csv += `--- OPERATING EXPENSES (FEED, VET, EQUIPMENT, LABOR) ---\n`;
      csv += ['Expense ID', 'Category', 'Description / Item', `Amount (${currency})`, 'Date', 'Receipt Number', 'Notes'].map(escapeCsv).join(',') + '\n';
      if (expenses.length === 0) {
        csv += ['No expenses recorded', '', '', '', '', '', ''].map(escapeCsv).join(',') + '\n';
      } else {
        expenses.forEach(e => {
          csv += [e.id, e.category, e.title, e.amount, e.date || '—', e.receipt_number || '—', e.notes || '—'].map(escapeCsv).join(',') + '\n';
        });
      }
      csv += '\n';
    }

    // 4. SALES & REVENUE
    if (format === 'all' || format === 'sales') {
      if (format === 'sales') {
        csv += `# ${farmName.toUpperCase()} - SALES TRANSACTIONS\n`;
        csv += `# Export Date: ${dateReadable}\n`;
        csv += `# Total Sales Revenue: ${formatCurrency(totalRev)}\n\n`;
      }
      csv += `--- SALES & REVENUE TRANSACTIONS ---\n`;
      csv += ['Sale ID', 'Goat Tag ID', `Price (${currency})`, 'Buyer Name', 'Sale Date'].map(escapeCsv).join(',') + '\n';
      if (sales.length === 0) {
        csv += ['No sales recorded', '', '', '', ''].map(escapeCsv).join(',') + '\n';
      } else {
        sales.forEach(s => {
          csv += [s.id, s.goat_id, s.price, s.buyer_name || '—', s.sale_date || '—'].map(escapeCsv).join(',') + '\n';
        });
      }
      csv += '\n';
    }

    // 5. BREEDING & GESTATION
    if (format === 'all' || format === 'gestation') {
      csv += `--- BREEDING & PREDICTED GESTATION RECORDS ---\n`;
      csv += ['Breeding ID', 'Female Tag', 'Male Buck Tag', 'Mating Date', 'Expected Kidding Date', 'Gestation Days', 'Status', 'Kids Born', 'Clinical Notes'].map(escapeCsv).join(',') + '\n';
      if (breeding.length === 0) {
        csv += ['No breeding records', '', '', '', '', '', '', '', ''].map(escapeCsv).join(',') + '\n';
      } else {
        breeding.forEach(b => {
          csv += [
            b.id,
            b.female_id,
            b.male_id,
            b.mating_date,
            b.expected_birth || '—',
            b.gestation_days || 150,
            b.status || 'Active',
            b.kids_born != null ? b.kids_born : '—',
            b.notes || '—',
          ].map(escapeCsv).join(',') + '\n';
        });
      }
      csv += '\n';
    }

    if (format === 'all') {
      if (milk.length > 0) {
        csv += `--- MILK YIELD PRODUCTION ---\n`;
        csv += ['Log ID', 'Goat Tag ID', 'Date', 'Morning Liters', 'Evening Liters', 'Total Liters'].map(escapeCsv).join(',') + '\n';
        milk.forEach(m => {
          csv += [m.id, m.goat_id, m.date, m.morning_liters, m.evening_liters, m.total_liters].map(escapeCsv).join(',') + '\n';
        });
        csv += '\n';
      }

      if (workers.length > 0) {
        csv += `--- FARM STAFF & WORKERS ---\n`;
        csv += ['Staff ID', 'Full Name', 'Phone Contact', 'Station / Location'].map(escapeCsv).join(',') + '\n';
        workers.forEach(w => {
          csv += [w.id, w.full_name, w.phone || '—', w.location || '—'].map(escapeCsv).join(',') + '\n';
        });
        csv += '\n';
      }
    }

    // Trigger instant browser download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedFarm = farmName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    let downloadFilename = `${sanitizedFarm}_farm_report_${timestamp.slice(0, 10)}.csv`;
    let successText = 'Farm report exported to CSV successfully!';

    if (format === 'herd_health') {
      downloadFilename = `${sanitizedFarm}_herd_and_health_records_${timestamp.slice(0, 10)}.csv`;
      successText = `Herd and health records exported to CSV (${goats.length} goats, ${health.length} health logs)!`;
    } else if (format === 'herd') {
      downloadFilename = `${sanitizedFarm}_herd_inventory_${timestamp.slice(0, 10)}.csv`;
      successText = `Herd records exported to CSV (${goats.length} goats)!`;
    } else if (format === 'health') {
      downloadFilename = `${sanitizedFarm}_health_records_${timestamp.slice(0, 10)}.csv`;
      successText = `Health records exported to CSV (${health.length} logs)!`;
    } else if (format === 'financial') {
      downloadFilename = `${sanitizedFarm}_financial_ledger_${timestamp.slice(0, 10)}.csv`;
      successText = 'Financial ledger exported to CSV successfully!';
    } else if (format === 'sales') {
      downloadFilename = `${sanitizedFarm}_sales_transactions_${timestamp.slice(0, 10)}.csv`;
      successText = 'Sales transactions exported to CSV successfully!';
    } else if (format === 'gestation') {
      downloadFilename = `${sanitizedFarm}_gestation_calendar_${timestamp.slice(0, 10)}.csv`;
      successText = 'Breeding & gestation calendar exported to CSV successfully!';
    }

    link.setAttribute('download', downloadFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowExportMenu(false);
    setDownloadSuccess(successText);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const today = new Date();

  // 1. Highest Sales
  const sortedSales = [...sales].sort((a, b) => (b.price || 0) - (a.price || 0));
  const topSales = sortedSales.slice(0, 5);
  const topSale = sortedSales[0];

  // 2. Predicted Birth Dates
  const predictedBirthsList = breeding
    .map(b => {
      if (!b.expected_birth && !b.mating_date) return null;
      let expDate: Date;
      if (b.expected_birth) {
        expDate = new Date(b.expected_birth);
      } else {
        expDate = new Date(b.mating_date);
        expDate.setDate(expDate.getDate() + 150);
      }
      const daysLeft = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return {
        femaleId: b.female_id,
        maleId: b.male_id,
        matingDate: b.mating_date,
        expectedBirthFormatted: expDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        daysLeft: Math.max(0, daysLeft),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a!.daysLeft - b!.daysLeft);

  const dueSoonBirths = predictedBirthsList.filter(b => b!.daysLeft <= 7);

  // 3. Statistical Anomaly Detection (Statistical Outlier Model on sales)
  let anomalies: typeof sales = [];
  if (sales.length >= 3) {
    const prices = sales.map(s => s.price);
    const mean = prices.reduce((acc, p) => acc + p, 0) / prices.length;
    const stdDev = Math.sqrt(
      prices.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / prices.length
    );
    // Flag items > 1.3 std deviations away from mean (mimicking outlier detection)
    anomalies = sales.filter(s => Math.abs(s.price - mean) > 1.3 * (stdDev || 1));
  }

  // 4. Trend Projection: Predict Future Revenue (Linear Regression)
  // Aggregate sales by month
  const monthlyRevenueMap: Record<string, number> = {};
  sales.forEach(s => {
    if (!s.sale_date) return;
    try {
      const d = new Date(s.sale_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenueMap[key] = (monthlyRevenueMap[key] || 0) + s.price;
    } catch {
      // ignore
    }
  });

  const sortedMonthKeys = Object.keys(monthlyRevenueMap).sort();
  const historicalData = sortedMonthKeys.map((key, index) => {
    const [year, month] = key.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
    const label = dateObj.toLocaleString('default', { month: 'short', year: '2-digit' });
    return {
      t: index,
      label,
      revenue: monthlyRevenueMap[key],
    };
  });

  // Calculate Linear Regression if we have at least 2 data points
  let forecastRows: { month: string; predictedRevenue: number }[] = [];
  let forecastChartData: any[] = [];

  if (historicalData.length >= 2) {
    const n = historicalData.length;
    const sumX = historicalData.reduce((acc, d) => acc + d.t, 0);
    const sumY = historicalData.reduce((acc, d) => acc + d.revenue, 0);
    const sumXY = historicalData.reduce((acc, d) => acc + d.t * d.revenue, 0);
    const sumX2 = historicalData.reduce((acc, d) => acc + d.t * d.t, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
    const intercept = (sumY - slope * sumX) / n;

    // Project next 3 months
    forecastRows = [1, 2, 3].map(i => {
      const futureT = n - 1 + i;
      const pred = Math.max(0, Math.round(slope * futureT + intercept));
      return {
        month: `Next Month +${i}`,
        predictedRevenue: pred,
      };
    });

    forecastChartData = [
      ...historicalData.map(d => ({
        name: d.label,
        ActualRevenue: d.revenue,
        ForecastRevenue: null,
      })),
      ...forecastRows.map(f => ({
        name: f.month,
        ActualRevenue: null,
        ForecastRevenue: f.predictedRevenue,
      })),
    ];
  }

  // 5. Smart Recommendations
  const recs: { id: string; text: string; type: 'warning' | 'info' | 'success' }[] = [];
  const totalGoats = goats.length;
  const totalSalesAmount = sales.reduce((sum, s) => sum + s.price, 0);
  const sickGoats = health.filter(h =>
    h.condition.toLowerCase().includes('sick') ||
    h.condition.toLowerCase().includes('weak') ||
    h.condition.toLowerCase().includes('fever')
  );

  if (totalGoats > 0 && breeding.length > 0) {
    const ratio = breeding.length / totalGoats;
    if (ratio < 0.2) {
      recs.push({
        id: 'rec-low-ratio',
        text: '🔁 Low breeding ratio (< 20%) — consider synchronizing mating schedules with prime bucks.',
        type: 'warning',
      });
    } else if (ratio > 0.6) {
      recs.push({
        id: 'rec-high-preg',
        text: 'High pregnancy rate (> 60%) — ensure sufficient maternity pen space, creep feed, and colostrum supplies.',
        type: 'info',
      });
    }
  }

  if (sickGoats.length > 0) {
    recs.push({
      id: 'rec-sick',
      text: `⚕️ ${sickGoats.length} goat(s) recently reported with illness symptoms (${sickGoats.map(s => s.goat_id).join(', ')}) — verify strict isolation and treatment compliance.`,
      type: 'warning',
    });
  } else {
    recs.push({
      id: 'rec-healthy',
      text: '✅ All goats appear healthy with no active infection indicators reported.',
      type: 'success',
    });
  }

  if (totalSalesAmount > 0) {
    recs.push({
      id: 'rec-revenue',
      text: `💰 Commercial revenue to date: ${formatCurrency(totalSalesAmount)}. Strong transaction velocity.`,
      type: 'info',
    });
  }

  if (totalGoats < 5) {
    recs.push({
      id: 'rec-herd-size',
      text: '📉 Low herd size (< 5 goats) — consider acquiring breeding stock to improve commercial economies of scale.',
      type: 'warning',
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Printable Report Header for Standard A4 Paper (hidden on screen, visible only when printing) */}
      <div className="hidden print:block mb-8 pb-4 border-b-2 border-emerald-800 text-stone-950">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[9px] uppercase tracking-wider">
              Smart Goat Enterprise • Official Audit Document
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-stone-950 mt-1">{farmName}</h1>
            <p className="text-xs font-semibold text-emerald-800">Livestock Herd Census, Clinical Health & Financial Analytics</p>
            <p className="text-[11px] text-stone-600">
              Location: {user?.location || 'Main Farm Facility'} • Operator: {user?.owner_name || 'Farm Administrator'} • Contact: {user?.phone || user?.email || 'Registered Herd Office'}
            </p>
          </div>
          <div className="text-right text-xs text-stone-700 space-y-1">
            <span className="inline-block px-2.5 py-0.5 border border-emerald-700 bg-emerald-50 text-emerald-900 font-mono font-bold text-[10px] uppercase rounded">
              Standard A4 Audit
            </span>
            <p className="font-mono text-[11px] text-stone-900 font-bold">
              Report Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-[11px] text-stone-600">
              Total Herd: <strong>{goats.length}</strong> | Clinical Logs: <strong>{health.length}</strong> | Breeding: <strong>{breeding.length}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Title & Action Bar (screen only) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 mb-2">
            <BrainCircuit className="w-3.5 h-3.5" />
            Farm Analytics Engine
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white tracking-tight">
            {farmName} — Farm Reports & Analytics
          </h2>
          <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
            Production analytics, anomaly detection, gestation calendars, and revenue projections.
          </p>
        </div>

        {/* Download & Print Report Actions:
            - <600px: Stack to a single vertical column, full-width buttons
            - 600px - 1099px: Wrap into a 2x2 grid
            - >=1100px: One clean horizontal flex row
        */}
        <div className="shrink-0 w-full min-[1100px]:w-auto grid grid-cols-1 sm:grid-cols-2 min-[1100px]:flex min-[1100px]:items-center gap-2">
          <button
            id="btn-generate-duration-report"
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="w-full min-[1100px]:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Generate custom duration report (Yesterday, Today, Specific Day, 2 Days, 1 Month) for Sales, Expenses, Milk, or Summary"
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span className="truncate">Generate Duration Report</span>
          </button>

          {/* Print Button */}
          <button
            id="btn-print-report"
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="w-full min-[1100px]:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            title="Open printable report document with farm branding"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span className="truncate">Print Report</span>
          </button>

          <button
            id="btn-export-herd-health-csv"
            type="button"
            onClick={() => handleDownloadReport('herd_health')}
            className="w-full min-[1100px]:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors"
            title="Download herd livestock and health records in CSV format"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span className="truncate">Export Herd & Health (CSV)</span>
          </button>

          <div className="relative inline-block text-left w-full min-[1100px]:w-auto">
            <button
              id="btn-toggle-export-menu"
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="w-full min-[1100px]:w-auto px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs sm:text-sm font-semibold rounded-xl border border-stone-200 dark:border-stone-700 shadow-xs transition-colors flex items-center justify-center gap-1.5"
              aria-label="More CSV export options"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>More Exports</span>
              <ChevronDown className="w-3.5 h-3.5 shrink-0" />
            </button>

            {showExportMenu && (
              <div
                id="export-options-menu"
                className="absolute right-0 mt-2 w-72 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl shadow-xl z-20 py-2 text-xs font-medium animate-fade-in"
              >
                <div className="px-3 py-1.5 text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                  CSV Export Options
                </div>
                <button
                  type="button"
                  id="btn-export-herd-health-menu"
                  onClick={() => handleDownloadReport('herd_health')}
                  className="w-full px-4 py-2.5 text-left text-emerald-900 dark:text-emerald-300 bg-emerald-50/70 hover:bg-emerald-50 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 flex items-center gap-2.5"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <div className="font-bold text-emerald-950 dark:text-emerald-200">Herd & Health Records (Combined)</div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400">All livestock tags, weights, and health checkups</div>
                  </div>
                </button>
                <button
                  type="button"
                  id="btn-export-herd-only-csv"
                  onClick={() => handleDownloadReport('herd')}
                  className="w-full px-4 py-2 text-left text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2.5 border-t border-stone-100 dark:border-stone-800"
                >
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <div className="font-semibold text-stone-900 dark:text-stone-100">Herd Inventory Only</div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400">Goat tag numbers, breeds, weights & statuses</div>
                  </div>
                </button>
                <button
                  type="button"
                  id="btn-export-health-only-csv"
                  onClick={() => handleDownloadReport('health')}
                  className="w-full px-4 py-2 text-left text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2.5 border-t border-stone-100 dark:border-stone-800"
                >
                  <Stethoscope className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <div className="font-semibold text-stone-900 dark:text-stone-100">Health & Veterinary Records Only</div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400">Diagnoses, treatments, clinical status & vet logs</div>
                  </div>
                </button>
                <button
                  type="button"
                  id="btn-export-all-csv"
                  onClick={() => handleDownloadReport('all')}
                  className="w-full px-4 py-2.5 text-left text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2.5 border-t border-stone-100 dark:border-stone-800"
                >
                  <FileSpreadsheet className="w-4 h-4 text-stone-500" />
                  <div>
                    <div className="font-semibold text-stone-900">Complete Farm Dossier</div>
                    <div className="text-[11px] text-stone-500">All herd, sales, breeding, expenses & health data</div>
                  </div>
                </button>
                <button
                  type="button"
                  id="btn-export-financial-csv"
                  onClick={() => handleDownloadReport('financial')}
                  className="w-full px-4 py-2.5 text-left text-stone-700 hover:bg-stone-50 flex items-center gap-2.5 border-t border-stone-100"
                >
                  <DollarSign className="w-4 h-4 text-stone-500" />
                  <div>
                    <div className="font-semibold text-stone-900">Financial Ledger & Expenses (P&L)</div>
                    <div className="text-[11px] text-stone-500">Feed, vet, equipment costs vs sales revenue</div>
                  </div>
                </button>
                <button
                  type="button"
                  id="btn-export-sales-csv"
                  onClick={() => handleDownloadReport('sales')}
                  className="w-full px-4 py-2.5 text-left text-stone-700 hover:bg-stone-50 flex items-center gap-2.5 border-t border-stone-100"
                >
                  <TrendingUp className="w-4 h-4 text-stone-500" />
                  <div>
                    <div className="font-semibold text-stone-900">Sales & Valuation Only</div>
                    <div className="text-[11px] text-stone-500">Financial transactions and buyer log</div>
                  </div>
                </button>
                <button
                  type="button"
                  id="btn-export-gestation-csv"
                  onClick={() => handleDownloadReport('gestation')}
                  className="w-full px-4 py-2.5 text-left text-stone-700 hover:bg-stone-50 flex items-center gap-2.5 border-t border-stone-100"
                >
                  <Calendar className="w-4 h-4 text-stone-500" />
                  <div>
                    <div className="font-semibold text-stone-900">Breeding & Gestation Calendar</div>
                    <div className="text-[11px] text-stone-500">Sire, dam, mating & expected delivery</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* 0. FINANCIAL TRACKING & OPERATIONAL LEDGER (FEED, VET, EQUIPMENT VS SALES) */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        <button
          id="btn-toggle-financial-tracking"
          onClick={() => setExpandFinancialTracking(!expandFinancialTracking)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📊</span>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Financial Tracking & Operational Expenses (Feed, Vet, Equipment)
              </h3>
              <p className="text-xs text-stone-500">
                Live ledger tracking operating costs and sales revenue with summary balance table
              </p>
            </div>
          </div>
          {expandFinancialTracking ? (
            <ChevronUp className="w-5 h-5 text-stone-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-stone-400" />
          )}
        </button>

        {expandFinancialTracking && (
          <div className="p-6 pt-3 border-t border-stone-100">
            <FinancialTrackingModule />
          </div>
        )}
      </div>

      {/* 1. HIGHEST SALES SECTION */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        <button
          onClick={() => setExpandHighestSales(!expandHighestSales)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">💰</span>
            <div>
              <h3 className="text-base font-bold text-stone-900">Highest Sales & Valuation</h3>
              <p className="text-xs text-stone-500">Top-performing individual goat transactions</p>
            </div>
          </div>
          {expandHighestSales ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
        </button>

        {expandHighestSales && (
          <div className="p-6 pt-2 border-t border-stone-100 space-y-4">
            {topSale && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-900 text-sm font-semibold">
                <Award className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  🏆 Top sale record: {formatCurrency(topSale.price)} for Goat {topSale.goat_id} ({topSale.buyer_name || 'Verified Buyer'})
                </span>
              </div>
            )}

            {topSales.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
                <table className="w-full text-left text-sm record-table-grid">
                  <thead className="bg-stone-50 dark:bg-stone-800/80 text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Rank</th>
                      <th className="px-5 py-3">Goat ID</th>
                      <th className="px-5 py-3">Price ({currency})</th>
                      <th className="px-5 py-3">Buyer Name</th>
                      <th className="px-5 py-3">Sale Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-stone-900">
                    {topSales.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-stone-50/50">
                        <td className="px-5 py-3 text-xs font-bold text-stone-400 font-mono">
                          #{idx + 1}
                        </td>
                        <td className="px-5 py-3 font-bold text-stone-900">{s.goat_id}</td>
                        <td className="px-5 py-3 font-semibold text-emerald-700">
                          {formatCurrency(s.price)}
                        </td>
                        <td className="px-5 py-3 text-stone-600">{s.buyer_name || '—'}</td>
                        <td className="px-5 py-3 text-stone-500 font-mono text-xs">{s.sale_date || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-stone-400 text-sm py-4">No sales recorded yet.</p>
            )}
          </div>
        )}
      </div>

      {/* 2. PREDICTED BIRTH DATES (GESTATION TRACKER) */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        <button
          onClick={() => setExpandPredictedBirths(!expandPredictedBirths)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🤰</span>
            <div>
              <h3 className="text-base font-bold text-stone-900">Predicted Birth Dates (Gestation Schedule)</h3>
              <p className="text-xs text-stone-500">150-day biological gestation countdown per breeding record</p>
            </div>
          </div>
          {expandPredictedBirths ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
        </button>

        {expandPredictedBirths && (
          <div className="p-6 pt-2 border-t border-stone-100 space-y-4">
            {dueSoonBirths.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-900 text-sm font-semibold">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  ⚠️ {dueSoonBirths.length} birth(s) due within 7 days! Prepare maternity pen and sterile kits.
                </span>
              </div>
            )}

            {predictedBirthsList.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
                <table className="w-full text-left text-sm record-table-grid">
                  <thead className="bg-stone-50 dark:bg-stone-800/80 text-xs font-semibold text-stone-600 dark:text-stone-300 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Female Tag</th>
                      <th className="px-5 py-3">Sire (Male Tag)</th>
                      <th className="px-5 py-3">Mating Date</th>
                      <th className="px-5 py-3">Predicted Birth</th>
                      <th className="px-5 py-3">Days Left</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-stone-900">
                    {predictedBirthsList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/50">
                        <td className="px-5 py-3 font-bold text-stone-900">{item!.femaleId}</td>
                        <td className="px-5 py-3 text-stone-600">{item!.maleId}</td>
                        <td className="px-5 py-3 text-stone-500 font-mono text-xs">{item!.matingDate}</td>
                        <td className="px-5 py-3 font-semibold text-stone-900 font-mono text-xs">
                          {item!.expectedBirthFormatted}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                              item!.daysLeft <= 7
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {item!.daysLeft === 0 ? 'Today!' : `${item!.daysLeft} days`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-stone-400 text-sm py-4">No active breeding records available.</p>
            )}
          </div>
        )}
      </div>

      {/* 3. TRANSACTION ANOMALY DETECTION */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        <button
          onClick={() => setExpandAnomalyDetection(!expandAnomalyDetection)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📊</span>
            <div>
              <h3 className="text-base font-bold text-stone-900">Transaction Anomaly Detection</h3>
              <p className="text-xs text-stone-500">Statistical outlier detection for transaction pricing</p>
            </div>
          </div>
          {expandAnomalyDetection ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
        </button>

        {expandAnomalyDetection && (
          <div className="p-6 pt-2 border-t border-stone-100 space-y-4">
            {sales.length < 3 ? (
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-stone-600 text-sm">
                ℹ️ Not enough sales data for anomaly detection (minimum 3 records required).
              </div>
            ) : anomalies.length > 0 ? (
              <>
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-900 text-sm font-semibold">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>
                    🚨 Detected {anomalies.length} unusual sale(s) — possible pricing anomalies or premium outliers.
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
                  <table className="w-full text-left text-sm record-table-grid">
                    <thead className="bg-rose-50/50 dark:bg-rose-950/40 text-xs font-semibold text-rose-900 dark:text-rose-200 uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3">Goat ID</th>
                        <th className="px-5 py-3">Price ({currency})</th>
                        <th className="px-5 py-3">Buyer Name</th>
                        <th className="px-5 py-3">Sale Date</th>
                        <th className="px-5 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-stone-900">
                      {anomalies.map(a => (
                        <tr key={a.id} className="hover:bg-rose-50/20">
                          <td className="px-5 py-3 font-bold text-stone-900">{a.goat_id}</td>
                          <td className="px-5 py-3 font-bold text-rose-700">
                            {formatCurrency(a.price)}
                          </td>
                          <td className="px-5 py-3 text-stone-600">{a.buyer_name}</td>
                          <td className="px-5 py-3 text-stone-500 font-mono text-xs">{a.sale_date}</td>
                          <td className="px-5 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                              Outlier Deviation
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-900 text-sm font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>✅ No anomalies detected in sales data. Transaction prices follow normal distribution.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. REVENUE FORECAST (LINEAR REGRESSION) */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        <button
          onClick={() => setExpandRevenueForecast(!expandRevenueForecast)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📈</span>
            <div>
              <h3 className="text-base font-bold text-stone-900">Revenue Forecast & Projections</h3>
              <p className="text-xs text-stone-500">Ordinary Least Squares regression projecting future quarterly sales</p>
            </div>
          </div>
          {expandRevenueForecast ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
        </button>

        {expandRevenueForecast && (
          <div className="p-6 pt-2 border-t border-stone-100 space-y-4">
            {forecastRows.length > 0 ? (
              <>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>📊 Forecast generated using linear regression across historic monthly sales totals.</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {forecastRows.map((f, i) => (
                    <StatCard
                      key={i}
                      label={f.month}
                      value={formatCurrency(f.predictedRevenue)}
                      subtext="Predicted Yield"
                      icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
                    />
                  ))}
                </div>

                {/* Forecast Chart */}
                <div className="h-64 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecastChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#78716c' }} />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#78716c' }}
                        tickFormatter={(val: number) => `${Math.round(val / 1000)}k`}
                      />
                      <Tooltip
                        formatter={(val: any) => val ? [formatCurrency(Number(val)), 'Revenue'] : ['—', '']}
                        contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e7e5e4' }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="ActualRevenue"
                        name={`Actual Revenue (${currency})`}
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="ForecastRevenue"
                        name={`Projected Forecast (${currency})`}
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        strokeDasharray="5 5"
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-stone-600 text-sm">
                ℹ️ Not enough historical data for revenue forecasting (at least 2 months with sales required).
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. FARM RECOMMENDATIONS */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        <button
          onClick={() => setExpandFarmRecommendations(!expandFarmRecommendations)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">💡</span>
            <div>
              <h3 className="text-base font-bold text-stone-900">Farm Recommendations & Advisory</h3>
              <p className="text-xs text-stone-500">Heuristic rules for reproductive balance, biosecurity, and commercial scale</p>
            </div>
          </div>
          {expandFarmRecommendations ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
        </button>

        {expandFarmRecommendations && (
          <div className="p-6 pt-2 border-t border-stone-100 space-y-3">
            {recs.length > 0 ? (
              recs.map(rec => (
                <div
                  key={rec.id}
                  className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${
                    rec.type === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : rec.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-stone-50 border-stone-200 text-stone-800'
                  }`}
                >
                  <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-stone-500" />
                  <span>{rec.text}</span>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm">
                🌿 Your farm is performing optimally!
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. FARM SUMMARY */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        <button
          onClick={() => setExpandFarmSummary(!expandFarmSummary)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📋</span>
            <div>
              <h3 className="text-base font-bold text-stone-900">Farm Summary Metrics</h3>
              <p className="text-xs text-stone-500">Core operational index count</p>
            </div>
          </div>
          {expandFarmSummary ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
        </button>

        {expandFarmSummary && (
          <div className="p-6 pt-2 border-t border-stone-100 dark:border-stone-800">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard
                label="Total Goats"
                value={goats.length}
                icon={<ClipboardList className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                subtext="Registered herd"
              />
              <StatCard
                label="Breeding Records"
                value={breeding.length}
                icon={<Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                variant="purple"
                subtext="Matings & gestations"
              />
              <StatCard
                label="Sales"
                value={sales.length}
                icon={<TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                variant="blue"
                subtext="Transactions"
              />
              <StatCard
                label="Expenses"
                value={expenses.length}
                icon={<DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
                variant="amber"
                subtext="Disbursements"
              />
              <StatCard
                label="Health Records"
                value={health.length}
                icon={<Stethoscope className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
                variant="rose"
                subtext="Vet checkups"
              />
            </div>
          </div>
        )}
      </div>

      {/* Printable Report Footer */}
      <div className="hidden print:block mt-8 pt-4 border-t border-stone-300 text-stone-600 text-center text-xs">
        © {new Date().getFullYear()} {farmName}. All rights reserved. • Generated on {new Date().toLocaleDateString()}
      </div>

      {/* Farm Performance, Sales, Expenditure & Operations Report Modal */}
      <FarmReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};
