import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
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
  FileText
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
  const { farmName, user, goats, breeding, sales, health, milk, workers } = useFarm();

  // Collapsible section states (matching the 6 expanders in reports.py)
  const [expandHighestSales, setExpandHighestSales] = useState(true);
  const [expandPredictedBirths, setExpandPredictedBirths] = useState(true);
  const [expandAnomalyDetection, setExpandAnomalyDetection] = useState(true);
  const [expandRevenueForecast, setExpandRevenueForecast] = useState(true);
  const [expandAIRecommendations, setExpandAIRecommendations] = useState(true);
  const [expandFarmSummary, setExpandFarmSummary] = useState(true);

  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const handleDownloadReport = (format: 'all' | 'sales' | 'gestation' | 'inventory' = 'all') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dateReadable = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let csv = '';

    if (format === 'all') {
      csv += `# SMART GOAT MANAGEMENT - ${farmName.toUpperCase()} EXPORT\n`;
      csv += `# Generated Date: ${dateReadable} at ${new Date().toLocaleTimeString()}\n`;
      csv += `# Farm Owner: ${user?.owner_name || 'Registered Farm Manager'}\n`;
      csv += `# Location: ${user?.location || 'Main Farm'}\n`;
      csv += `# Total Registered Goats: ${goats.length}\n`;
      csv += `# Total Revenue: Ksh ${sales.reduce((sum, s) => sum + s.price, 0).toLocaleString()}\n\n`;
    }

    if (format === 'all' || format === 'sales') {
      csv += `--- SALES & REVENUE TRANSACTIONS ---\n`;
      csv += ['Sale ID', 'Goat Tag ID', 'Price (Ksh)', 'Buyer Name', 'Sale Date'].map(escapeCsv).join(',') + '\n';
      if (sales.length === 0) {
        csv += ['No sales recorded', '', '', '', ''].map(escapeCsv).join(',') + '\n';
      } else {
        sales.forEach(s => {
          csv += [s.id, s.goat_id, s.price, s.buyer_name || '—', s.sale_date || '—'].map(escapeCsv).join(',') + '\n';
        });
      }
      csv += '\n';
    }

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

    if (format === 'all' || format === 'inventory') {
      csv += `--- HERD LIVESTOCK INVENTORY ---\n`;
      csv += ['Goat Tag ID', 'Breed', 'Gender', 'Date of Birth', 'Weight (kg)', 'Current Status', 'Registration Date'].map(escapeCsv).join(',') + '\n';
      if (goats.length === 0) {
        csv += ['No goats registered in herd', '', '', '', '', '', ''].map(escapeCsv).join(',') + '\n';
      } else {
        goats.forEach(g => {
          csv += [
            g.tag_number,
            g.breed,
            g.gender,
            g.dob,
            g.weight_kg != null ? g.weight_kg : '—',
            g.status || 'Active',
            g.created_at,
          ].map(escapeCsv).join(',') + '\n';
        });
      }
      csv += '\n';

      csv += `--- VETERINARY & HEALTH INTERVENTIONS ---\n`;
      csv += ['Health ID', 'Goat Tag ID', 'Checkup Date', 'Diagnosis/Condition', 'Treatment Administered', 'Checkup Type', 'Attending Vet'].map(escapeCsv).join(',') + '\n';
      if (health.length === 0) {
        csv += ['No health records registered', '', '', '', '', '', ''].map(escapeCsv).join(',') + '\n';
      } else {
        health.forEach(h => {
          csv += [
            h.id,
            h.goat_id,
            h.checkup_date,
            h.condition,
            h.treatment,
            h.checkup_type || 'Routine',
            h.vet_name || '—',
          ].map(escapeCsv).join(',') + '\n';
        });
      }
      csv += '\n';

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
    link.setAttribute('download', `${sanitizedFarm}_farm_report_${format}_${timestamp.slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowExportMenu(false);
    setDownloadSuccess(`Farm report exported to CSV successfully!`);
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

  // 3. AI Anomaly Detection (Statistical Outlier Model on sales)
  let anomalies: typeof sales = [];
  if (sales.length >= 3) {
    const prices = sales.map(s => s.price);
    const mean = prices.reduce((acc, p) => acc + p, 0) / prices.length;
    const stdDev = Math.sqrt(
      prices.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / prices.length
    );
    // Flag items > 1.3 std deviations away from mean (mimicking Isolation Forest 0.2 contamination)
    anomalies = sales.filter(s => Math.abs(s.price - mean) > 1.3 * (stdDev || 1));
  }

  // 4. ML: Predict Future Revenue (Linear Regression)
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

  // 5. AI Recommendations
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
        text: '🐐 High pregnancy rate (> 60%) — ensure sufficient maternity pen space, creep feed, and colostrum supplies.',
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
      text: `💰 Commercial revenue to date: Ksh ${totalSalesAmount.toLocaleString()}. Strong transaction velocity.`,
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
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-2">
            <BrainCircuit className="w-3.5 h-3.5" />
            Predictive Analytics Engine
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            {farmName} — AI Reports Dashboard
          </h2>
          <p className="text-stone-500 text-sm mt-1">
            Machine learning models, anomaly detection, gestation calendars, and linear regression revenue forecasts.
          </p>
        </div>

        {/* Download Report Actions */}
        <div className="relative shrink-0 flex items-center gap-2">
          <div className="relative inline-block text-left">
            <button
              id="btn-download-report-main"
              type="button"
              onClick={() => handleDownloadReport('all')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Report (CSV)</span>
            </button>
            <button
              id="btn-toggle-export-menu"
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="ml-1 px-2.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors border-l border-emerald-600/40"
              aria-label="Export options"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            {showExportMenu && (
              <div
                id="export-options-menu"
                className="absolute right-0 mt-2 w-64 bg-white border border-stone-200 rounded-2xl shadow-xl z-20 py-2 text-xs font-medium"
              >
                <div className="px-3 py-1.5 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  CSV Export Options
                </div>
                <button
                  type="button"
                  id="btn-export-all-csv"
                  onClick={() => handleDownloadReport('all')}
                  className="w-full px-4 py-2.5 text-left text-stone-700 hover:bg-stone-50 flex items-center gap-2.5"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-semibold text-stone-900">Complete Farm Dossier</div>
                    <div className="text-[11px] text-stone-500">All herd, sales, breeding & health data</div>
                  </div>
                </button>
                <button
                  type="button"
                  id="btn-export-sales-csv"
                  onClick={() => handleDownloadReport('sales')}
                  className="w-full px-4 py-2.5 text-left text-stone-700 hover:bg-stone-50 flex items-center gap-2.5 border-t border-stone-100"
                >
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
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
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-semibold text-stone-900">Breeding & Gestation Calendar</div>
                    <div className="text-[11px] text-stone-500">Sire, dam, mating & expected delivery</div>
                  </div>
                </button>
                <button
                  type="button"
                  id="btn-export-inventory-csv"
                  onClick={() => handleDownloadReport('inventory')}
                  className="w-full px-4 py-2.5 text-left text-stone-700 hover:bg-stone-50 flex items-center gap-2.5 border-t border-stone-100"
                >
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-semibold text-stone-900">Herd Inventory & Health</div>
                    <div className="text-[11px] text-stone-500">Goat tags, breeds, weights & checkups</div>
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
                  🏆 Top sale record: Ksh {topSale.price.toLocaleString()} for Goat {topSale.goat_id} ({topSale.buyer_name || 'Verified Buyer'})
                </span>
              </div>
            )}

            {topSales.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-stone-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50 text-xs font-semibold text-stone-600 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Rank</th>
                      <th className="px-5 py-3">Goat ID</th>
                      <th className="px-5 py-3">Price (Ksh)</th>
                      <th className="px-5 py-3">Buyer Name</th>
                      <th className="px-5 py-3">Sale Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {topSales.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-stone-50/50">
                        <td className="px-5 py-3 text-xs font-bold text-stone-400 font-mono">
                          #{idx + 1}
                        </td>
                        <td className="px-5 py-3 font-bold text-stone-900">{s.goat_id}</td>
                        <td className="px-5 py-3 font-semibold text-emerald-700">
                          Ksh {s.price.toLocaleString()}
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
              <h3 className="text-base font-bold text-stone-900">Predicted Birth Dates (AI Gestation Model)</h3>
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
              <div className="overflow-x-auto rounded-xl border border-stone-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50 text-xs font-semibold text-stone-600 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Female Tag</th>
                      <th className="px-5 py-3">Sire (Male Tag)</th>
                      <th className="px-5 py-3">Mating Date</th>
                      <th className="px-5 py-3">Predicted Birth</th>
                      <th className="px-5 py-3">Days Left</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
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

      {/* 3. AI ANOMALY DETECTION */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        <button
          onClick={() => setExpandAnomalyDetection(!expandAnomalyDetection)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🧠</span>
            <div>
              <h3 className="text-base font-bold text-stone-900">AI Anomaly Detection</h3>
              <p className="text-xs text-stone-500">Unsupervised statistical outlier detection for transaction pricing</p>
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

                <div className="overflow-x-auto rounded-xl border border-stone-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-rose-50/50 text-xs font-semibold text-rose-900 uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3">Goat ID</th>
                        <th className="px-5 py-3">Price (Ksh)</th>
                        <th className="px-5 py-3">Buyer Name</th>
                        <th className="px-5 py-3">Sale Date</th>
                        <th className="px-5 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {anomalies.map(a => (
                        <tr key={a.id} className="hover:bg-rose-50/20">
                          <td className="px-5 py-3 font-bold text-stone-900">{a.goat_id}</td>
                          <td className="px-5 py-3 font-bold text-rose-700">
                            Ksh {a.price.toLocaleString()}
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

      {/* 4. AI REVENUE FORECAST (LINEAR REGRESSION) */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        <button
          onClick={() => setExpandRevenueForecast(!expandRevenueForecast)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📈</span>
            <div>
              <h3 className="text-base font-bold text-stone-900">AI Revenue Forecast (Linear Regression)</h3>
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
                    <div key={i} className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                      <div className="text-xs text-stone-500 uppercase tracking-wider font-semibold">
                        {f.month}
                      </div>
                      <div className="text-xl font-extrabold text-stone-900 mt-1">
                        Ksh {f.predictedRevenue.toLocaleString()}
                      </div>
                      <div className="text-xs text-emerald-600 font-medium mt-1">
                        Predicted Yield
                      </div>
                    </div>
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
                        formatter={(val: any) => val ? [`Ksh ${Number(val).toLocaleString()}`, 'Revenue'] : ['—', '']}
                        contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e7e5e4' }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="ActualRevenue"
                        name="Actual Revenue (Ksh)"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="ForecastRevenue"
                        name="AI Forecast (Ksh)"
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

      {/* 5. AI RECOMMENDATIONS */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        <button
          onClick={() => setExpandAIRecommendations(!expandAIRecommendations)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">💡</span>
            <div>
              <h3 className="text-base font-bold text-stone-900">AI Recommendations & Farm Advisory</h3>
              <p className="text-xs text-stone-500">Heuristic rules for reproductive balance, biosecurity, and commercial scale</p>
            </div>
          </div>
          {expandAIRecommendations ? <ChevronUp className="w-5 h-5 text-stone-400" /> : <ChevronDown className="w-5 h-5 text-stone-400" />}
        </button>

        {expandAIRecommendations && (
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
          <div className="p-6 pt-2 border-t border-stone-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-xs font-semibold text-stone-500 uppercase">Total Goats</span>
                <div className="text-2xl font-bold text-stone-900 mt-1">{goats.length}</div>
              </div>
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-xs font-semibold text-stone-500 uppercase">Breeding Records</span>
                <div className="text-2xl font-bold text-stone-900 mt-1">{breeding.length}</div>
              </div>
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-xs font-semibold text-stone-500 uppercase">Sales</span>
                <div className="text-2xl font-bold text-stone-900 mt-1">{sales.length}</div>
              </div>
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-xs font-semibold text-stone-500 uppercase">Health Records</span>
                <div className="text-2xl font-bold text-stone-900 mt-1">{health.length}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
