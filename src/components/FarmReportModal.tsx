import React, { useState, useMemo, useRef } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  X,
  Calendar,
  Download,
  Printer,
  FileText,
  Milk,
  DollarSign,
  Stethoscope,
  Baby,
  Receipt,
  Mail,
  Phone,
  MapPin,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  FileCode,
  Tag
} from 'lucide-react';

export type ReportCategory = 'summary' | 'sales' | 'expenditure' | 'milk' | 'health' | 'breeding';
export type DurationPreset = 'today' | 'yesterday' | 'specific_day' | '2days' | 'week' | 'month' | 'custom';

interface FarmReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPreset?: DurationPreset;
  initialCategory?: ReportCategory;
}

export const FarmReportModal: React.FC<FarmReportModalProps> = ({
  isOpen,
  onClose,
  initialPreset = 'today',
  initialCategory = 'summary',
}) => {
  const { farmName, user, goats, breeding, sales, expenses, health, milk } = useFarm();

  const [preset, setPreset] = useState<DurationPreset>(initialPreset);
  const [reportCategory, setReportCategory] = useState<ReportCategory>(initialCategory);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Compute reference dates
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  const twoDaysAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    return d.toISOString().split('T')[0];
  }, []);

  const weekAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  }, []);

  const monthAgoStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  }, []);

  // Specific Day selection (allows picking any specific single date: yesterday, today, or past days)
  const [specificDay, setSpecificDay] = useState(todayStr);

  // Custom range
  const [customStartDate, setCustomStartDate] = useState(twoDaysAgoStr);
  const [customEndDate, setCustomEndDate] = useState(todayStr);

  const { startDate, endDate, durationLabel, durationDays } = useMemo(() => {
    let start = todayStr;
    let end = todayStr;
    let label = 'Today';
    let days = 1;

    if (preset === 'today') {
      start = todayStr;
      end = todayStr;
      label = 'Today';
      days = 1;
    } else if (preset === 'yesterday') {
      start = yesterdayStr;
      end = yesterdayStr;
      label = 'Yesterday';
      days = 1;
    } else if (preset === 'specific_day') {
      start = specificDay || todayStr;
      end = specificDay || todayStr;
      label = `Specific Day (${start})`;
      days = 1;
    } else if (preset === '2days') {
      start = twoDaysAgoStr;
      end = todayStr;
      label = 'Last 2 Days';
      days = 2;
    } else if (preset === 'week') {
      start = weekAgoStr;
      end = todayStr;
      label = 'Past 7 Days (1 Week)';
      days = 7;
    } else if (preset === 'month') {
      start = monthAgoStr;
      end = todayStr;
      label = 'Past 30 Days (1 Month)';
      days = 30;
    } else if (preset === 'custom') {
      start = customStartDate || todayStr;
      end = customEndDate || todayStr;
      const d1 = new Date(start);
      const d2 = new Date(end);
      const diffTime = Math.max(0, d2.getTime() - d1.getTime());
      days = Math.round(diffTime / (1000 * 3600 * 24)) + 1;
      label = `Custom (${days} Day${days === 1 ? '' : 's'})`;
    }

    return { startDate: start, endDate: end, durationLabel: label, durationDays: days };
  }, [preset, todayStr, yesterdayStr, specificDay, twoDaysAgoStr, weekAgoStr, monthAgoStr, customStartDate, customEndDate]);

  // Document Reference ID for audit trail
  const docRefId = useMemo(() => {
    return `SGM-AUD-${startDate.replace(/-/g, '')}-${endDate.replace(/-/g, '')}`;
  }, [startDate, endDate]);

  // Date checker (inclusive)
  const isWithinRange = (dateString?: string) => {
    if (!dateString) return false;
    const itemDate = dateString.split('T')[0];
    return itemDate >= startDate && itemDate <= endDate;
  };

  // Filtered records
  const filteredMilk = useMemo(() => milk.filter(m => isWithinRange(m.date)), [milk, startDate, endDate]);
  const filteredSales = useMemo(() => sales.filter(s => isWithinRange(s.sale_date)), [sales, startDate, endDate]);
  const filteredExpenses = useMemo(() => expenses.filter(e => isWithinRange(e.date)), [expenses, startDate, endDate]);
  const filteredHealth = useMemo(() => health.filter(h => isWithinRange(h.checkup_date)), [health, startDate, endDate]);
  const filteredBreeding = useMemo(
    () => breeding.filter(b => isWithinRange(b.mating_date) || isWithinRange(b.actual_birth_date)),
    [breeding, startDate, endDate]
  );

  // Aggregates
  const totalMilkLiters = useMemo(
    () => filteredMilk.reduce((sum, m) => sum + (Number(m.total_liters) || 0), 0),
    [filteredMilk]
  );

  const totalSalesRevenue = useMemo(
    () => filteredSales.reduce((sum, s) => sum + (Number(s.price) || 0), 0),
    [filteredSales]
  );

  const totalExpenditure = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [filteredExpenses]
  );

  const netOperatingProfit = totalSalesRevenue - totalExpenditure;

  // Expenses category totals
  const expensesByCategory = useMemo(() => {
    const acc: Record<string, number> = { Feed: 0, Vet: 0, Equipment: 0, Labor: 0, Other: 0 };
    filteredExpenses.forEach(e => {
      const cat = e.category || 'Other';
      acc[cat] = (acc[cat] || 0) + (Number(e.amount) || 0);
    });
    return acc;
  }, [filteredExpenses]);

  // Herd status counts (current snapshot)
  const statusCounts = useMemo(() => {
    return {
      active: goats.filter(g => (g.status || 'Active') === 'Active').length,
      pregnant: goats.filter(g => g.status === 'Pregnant').length,
      quarantine: goats.filter(g => g.status === 'Quarantine').length,
      sold: goats.filter(g => g.status === 'Sold').length,
      total: goats.length,
    };
  }, [goats]);

  // Goat lookup
  const goatMap = useMemo(() => new Map(goats.map(g => [g.tag_number.toUpperCase(), g])), [goats]);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  // Build printable HTML string for standalone rendering or iframe printing
  const generatePrintableHTML = () => {
    const activeFarmName = user?.farm_name || farmName || 'Smart Goat Farm';
    const activeEmail = user?.email || 'farm@smartgoatfarm.com';
    const activePhone = user?.phone || '—';
    const activeLocation = user?.location || '—';
    const logoImg = user?.logo_url ? `<img src="${user.logo_url}" alt="Logo" style="width:64px;height:64px;border-radius:12px;object-fit:cover;border:1px solid #ddd;" />` : `<div style="font-size:36px;width:64px;height:64px;line-height:64px;text-align:center;background:#e6f4ea;border-radius:12px;">🐐</div>`;

    let reportTitle = 'FARM OPERATIONS & PRODUCTION REPORT';
    if (reportCategory === 'sales') reportTitle = 'OFFICIAL GOAT SALES & COMMERCIAL REVENUE LEDGER';
    else if (reportCategory === 'expenditure') reportTitle = 'OFFICIAL FARM EXPENDITURE & OPERATING COST AUDIT';
    else if (reportCategory === 'milk') reportTitle = 'DAIRY PRODUCTION & MILK HARVEST REPORT';
    else if (reportCategory === 'health') reportTitle = 'VETERINARY CARE & CLINICAL INTERVENTIONS AUDIT';
    else if (reportCategory === 'breeding') reportTitle = 'BREEDING CYCLES & GESTATION REGISTRY';

    let contentHtml = '';

    // If Sales Report or Summary
    if (reportCategory === 'sales' || reportCategory === 'summary') {
      contentHtml += `
        <h3 style="font-size:14px;text-transform:uppercase;margin:20px 0 8px;border-bottom:2px solid #2e7d32;padding-bottom:4px;color:#1b5e20;">
          Goat Sales & Revenue Transactions (${filteredSales.length} Records - Total: KES ${totalSalesRevenue.toLocaleString()})
        </h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:15px;font-size:12px;">
          <thead>
            <tr style="background:#f1f8e9;text-align:left;border-bottom:1px solid #c5e1a5;">
              <th style="padding:6px 8px;">Date</th>
              <th style="padding:6px 8px;">Goat Tag</th>
              <th style="padding:6px 8px;">Goat Name & Breed</th>
              <th style="padding:6px 8px;">Buyer / Customer</th>
              <th style="padding:6px 8px;text-align:right;">Sale Price (KES)</th>
            </tr>
          </thead>
          <tbody>
            ${filteredSales.length === 0 ? `<tr><td colspan="5" style="padding:10px;text-align:center;color:#777;">No goat sales recorded in this duration.</td></tr>` :
              filteredSales.map(s => {
                const g = goatMap.get(s.goat_id.toUpperCase());
                return `
                  <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:6px 8px;font-family:monospace;">${s.sale_date}</td>
                    <td style="padding:6px 8px;font-weight:bold;font-family:monospace;">${s.goat_id}</td>
                    <td style="padding:6px 8px;">${g?.name ? `${g.name} (${g.breed})` : (g?.breed || 'Herd Goat')}</td>
                    <td style="padding:6px 8px;">${s.buyer_name || 'Commercial Buyer'}</td>
                    <td style="padding:6px 8px;text-align:right;font-weight:bold;color:#1b5e20;">KES ${Number(s.price).toLocaleString()}</td>
                  </tr>
                `;
              }).join('')
            }
          </tbody>
          <tfoot>
            <tr style="background:#f1f8e9;font-weight:bold;">
              <td colspan="4" style="padding:6px 8px;text-align:right;">Total Sales Revenue:</td>
              <td style="padding:6px 8px;text-align:right;color:#1b5e20;">KES ${totalSalesRevenue.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      `;
    }

    // If Expenditure Report or Summary
    if (reportCategory === 'expenditure' || reportCategory === 'summary') {
      contentHtml += `
        <h3 style="font-size:14px;text-transform:uppercase;margin:20px 0 8px;border-bottom:2px solid #c62828;padding-bottom:4px;color:#b71c1c;">
          Farm Expenditures & Operating Outflows (${filteredExpenses.length} Records - Total: KES ${totalExpenditure.toLocaleString()})
        </h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:15px;font-size:12px;">
          <thead>
            <tr style="background:#ffebee;text-align:left;border-bottom:1px solid #ffcdd2;">
              <th style="padding:6px 8px;">Date</th>
              <th style="padding:6px 8px;">Category</th>
              <th style="padding:6px 8px;">Description / Title</th>
              <th style="padding:6px 8px;">Receipt # / Ref</th>
              <th style="padding:6px 8px;text-align:right;">Cost (KES)</th>
            </tr>
          </thead>
          <tbody>
            ${filteredExpenses.length === 0 ? `<tr><td colspan="5" style="padding:10px;text-align:center;color:#777;">No expenditures recorded in this duration.</td></tr>` :
              filteredExpenses.map(e => `
                <tr style="border-bottom:1px solid #eee;">
                  <td style="padding:6px 8px;font-family:monospace;">${e.date}</td>
                  <td style="padding:6px 8px;font-weight:bold;">${e.category}</td>
                  <td style="padding:6px 8px;">${e.title}${e.notes ? ` <span style="color:#666;font-size:10px;">(${e.notes})</span>` : ''}</td>
                  <td style="padding:6px 8px;font-family:monospace;">${e.receipt_number || '—'}</td>
                  <td style="padding:6px 8px;text-align:right;font-weight:bold;color:#b71c1c;">KES ${Number(e.amount).toLocaleString()}</td>
                </tr>
              `).join('')
            }
          </tbody>
          <tfoot>
            <tr style="background:#ffebee;font-weight:bold;">
              <td colspan="4" style="padding:6px 8px;text-align:right;">Total Operating Costs:</td>
              <td style="padding:6px 8px;text-align:right;color:#b71c1c;">KES ${totalExpenditure.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      `;
    }

    // If Milk Report or Summary
    if (reportCategory === 'milk' || reportCategory === 'summary') {
      contentHtml += `
        <h3 style="font-size:14px;text-transform:uppercase;margin:20px 0 8px;border-bottom:2px solid #00695c;padding-bottom:4px;color:#004d40;">
          Milk Production & Dairy Yields (${filteredMilk.length} Sessions - Total: ${totalMilkLiters} L)
        </h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:15px;font-size:12px;">
          <thead>
            <tr style="background:#e0f2f1;text-align:left;border-bottom:1px solid #b2dfdb;">
              <th style="padding:6px 8px;">Date</th>
              <th style="padding:6px 8px;">Goat Tag</th>
              <th style="padding:6px 8px;">Morning (L)</th>
              <th style="padding:6px 8px;">Evening (L)</th>
              <th style="padding:6px 8px;text-align:right;">Daily Total (L)</th>
            </tr>
          </thead>
          <tbody>
            ${filteredMilk.length === 0 ? `<tr><td colspan="5" style="padding:10px;text-align:center;color:#777;">No milk harvest logged in this duration.</td></tr>` :
              filteredMilk.map(m => `
                <tr style="border-bottom:1px solid #eee;">
                  <td style="padding:6px 8px;font-family:monospace;">${m.date}</td>
                  <td style="padding:6px 8px;font-weight:bold;font-family:monospace;">${m.goat_id}</td>
                  <td style="padding:6px 8px;">${m.morning_liters} L</td>
                  <td style="padding:6px 8px;">${m.evening_liters} L</td>
                  <td style="padding:6px 8px;text-align:right;font-weight:bold;color:#004d40;">${m.total_liters} L</td>
                </tr>
              `).join('')
            }
          </tbody>
          <tfoot>
            <tr style="background:#e0f2f1;font-weight:bold;">
              <td colspan="4" style="padding:6px 8px;text-align:right;">Total Period Harvest:</td>
              <td style="padding:6px 8px;text-align:right;color:#004d40;">${totalMilkLiters} Liters</td>
            </tr>
          </tfoot>
        </table>
      `;
    }

    // If Health Report or Summary
    if (reportCategory === 'health' || reportCategory === 'summary') {
      contentHtml += `
        <h3 style="font-size:14px;text-transform:uppercase;margin:20px 0 8px;border-bottom:2px solid #1565c0;padding-bottom:4px;color:#0d47a1;">
          Veterinary & Health Interventions (${filteredHealth.length} Records)
        </h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:15px;font-size:12px;">
          <thead>
            <tr style="background:#e3f2fd;text-align:left;border-bottom:1px solid #bbdefb;">
              <th style="padding:6px 8px;">Date</th>
              <th style="padding:6px 8px;">Goat Tag</th>
              <th style="padding:6px 8px;">Condition Diagnosed</th>
              <th style="padding:6px 8px;">Treatment Given</th>
              <th style="padding:6px 8px;">Attending Vet</th>
              <th style="padding:6px 8px;">Clinical Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredHealth.length === 0 ? `<tr><td colspan="6" style="padding:10px;text-align:center;color:#777;">No medical records in this duration.</td></tr>` :
              filteredHealth.map(h => `
                <tr style="border-bottom:1px solid #eee;">
                  <td style="padding:6px 8px;font-family:monospace;">${h.checkup_date}</td>
                  <td style="padding:6px 8px;font-weight:bold;font-family:monospace;">${h.goat_id}</td>
                  <td style="padding:6px 8px;">${h.condition}</td>
                  <td style="padding:6px 8px;">${h.treatment}</td>
                  <td style="padding:6px 8px;">${h.vet_name || '—'}</td>
                  <td style="padding:6px 8px;font-weight:bold;">${h.status || 'Treated'}</td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>
      `;
    }

    // If Breeding Report or Summary
    if (reportCategory === 'breeding' || reportCategory === 'summary') {
      contentHtml += `
        <h3 style="font-size:14px;text-transform:uppercase;margin:20px 0 8px;border-bottom:2px solid #6a1b9a;padding-bottom:4px;color:#4a148c;">
          Breeding & Gestation Schedules (${filteredBreeding.length} Records)
        </h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:15px;font-size:12px;">
          <thead>
            <tr style="background:#f3e5f5;text-align:left;border-bottom:1px solid #e1bee7;">
              <th style="padding:6px 8px;">Mating Date</th>
              <th style="padding:6px 8px;">Dam (Female)</th>
              <th style="padding:6px 8px;">Sire (Male)</th>
              <th style="padding:6px 8px;">Expected Kidding</th>
              <th style="padding:6px 8px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredBreeding.length === 0 ? `<tr><td colspan="5" style="padding:10px;text-align:center;color:#777;">No breeding events in this duration.</td></tr>` :
              filteredBreeding.map(b => `
                <tr style="border-bottom:1px solid #eee;">
                  <td style="padding:6px 8px;font-family:monospace;">${b.mating_date}</td>
                  <td style="padding:6px 8px;font-weight:bold;font-family:monospace;color:#6a1b9a;">${b.female_id}</td>
                  <td style="padding:6px 8px;font-family:monospace;">${b.male_id}</td>
                  <td style="padding:6px 8px;font-family:monospace;">${b.expected_birth || '—'}</td>
                  <td style="padding:6px 8px;font-weight:bold;">${b.status || 'Active'}</td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>
      `;
    }

    const docRefId = `SGM-AUD-${startDate.replace(/-/g, '')}-${endDate.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${activeFarmName} - ${reportTitle}</title>
  <style>
    @page { size: A4; margin: 12mm 14mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1f2937;
      background: #fff;
      margin: 0;
      padding: 16px 20px;
      line-height: 1.45;
      font-size: 11.5px;
    }
    .print-btn-bar {
      margin-bottom: 20px;
      padding: 12px 16px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .header-box {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2.5px solid #059669;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .farm-brand { display: flex; align-items: center; gap: 14px; }
    .farm-title { font-size: 24px; font-weight: 900; margin: 0; color: #111827; letter-spacing: -0.5px; }
    .farm-email { font-size: 12.5px; font-weight: 600; color: #059669; margin-top: 3px; }
    .farm-meta { font-size: 11px; color: #6b7280; margin-top: 3px; }
    .doc-meta { text-align: right; font-size: 11px; color: #4b5563; }
    .doc-meta strong { color: #111827; }
    .report-badge {
      display: inline-block;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 3px 10px;
      border-radius: 9999px;
      font-weight: 800;
      font-size: 10px;
      letter-spacing: 0.5px;
      margin-top: 6px;
      text-transform: uppercase;
    }
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .kpi-card {
      border: 1px solid #e5e7eb;
      background: #f9fafb;
      border-radius: 10px;
      padding: 10px 14px;
      position: relative;
      overflow: hidden;
    }
    .kpi-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: #9ca3af;
    }
    .kpi-card.sales::before { background: #059669; }
    .kpi-card.expenses::before { background: #dc2626; }
    .kpi-card.balance::before { background: #2563eb; }
    .kpi-card.milk::before { background: #0d9488; }
    .kpi-title { font-size: 10px; text-transform: uppercase; color: #6b7280; font-weight: 700; margin-bottom: 4px; letter-spacing: 0.4px; }
    .kpi-val { font-size: 17px; font-weight: 800; color: #111827; }
    .kpi-sub { font-size: 10px; color: #6b7280; margin-top: 2px; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 11px;
      border: 1.5px solid #64748b;
    }
    th, td {
      border: 1px solid #94a3b8;
      padding: 8px 10px;
    }
    th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.3px;
      border-bottom: 2px solid #64748b;
    }
    tbody tr:nth-child(even) { background-color: #f8fafc; }
    tbody tr:hover { background-color: #f1f5f9; }
    tfoot td {
      border-top: 2px solid #64748b;
      font-weight: 700;
      padding: 8px 10px;
      background: #f1f5f9;
    }

    .report-footer {
      border-top: 2px solid #cbd5e1;
      margin-top: 36px;
      padding-top: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #64748b;
    }

    @media print {
      .print-btn-bar { display: none !important; }
      body { padding: 0 !important; }
      @page { margin: 12mm 14mm; }
    }
  </style>
</head>
<body>
  <div class="print-btn-bar">
    <div>
      <span style="font-weight:700;font-size:13px;color:#065f46;">
        Official Executive Farm Report Ready for Print & PDF
      </span>
      <div style="font-size:11px;color:#047857;margin-top:2px;">
        Formatted for Standard A4 Paper with high-contrast audit typography.
      </div>
    </div>
    <button onclick="window.print()" style="background:#059669;color:#fff;border:none;padding:8px 18px;border-radius:8px;font-weight:bold;cursor:pointer;font-size:12px;box-shadow:0 1px 2px rgba(0,0,0,0.1);">
      🖨️ Print Report / Save PDF
    </button>
  </div>

  <div class="header-box">
    <div class="farm-brand">
      ${logoImg}
      <div>
        <h1 class="farm-title">${activeFarmName}</h1>
        <div class="farm-email">✉️ ${activeEmail}</div>
        <div class="farm-meta">📍 ${activeLocation} | 📞 ${activePhone}</div>
      </div>
    </div>
    <div class="doc-meta">
      <div><strong>Document Type:</strong> ${reportTitle}</div>
      <div><strong>Document Ref:</strong> <span style="font-family:monospace;font-weight:bold;color:#111827;">${docRefId}</span></div>
      <div><strong>Reporting Window:</strong> ${durationLabel}</div>
      <div><strong>Dates:</strong> ${startDate} → ${endDate} (${durationDays} days)</div>
      <div><strong>Generated:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      <div><span class="report-badge">Verified Farm Operations Audit</span></div>
    </div>
  </div>

  <!-- Executive Highlights Bar -->
  <div class="kpi-row">
    <div class="kpi-card sales">
      <div class="kpi-title">Sales Revenue</div>
      <div class="kpi-val" style="color:#059669;">KES ${totalSalesRevenue.toLocaleString()}</div>
      <div class="kpi-sub">${filteredSales.length} livestock transactions</div>
    </div>
    <div class="kpi-card expenses">
      <div class="kpi-title">Expenditures</div>
      <div class="kpi-val" style="color:#dc2626;">KES ${totalExpenditure.toLocaleString()}</div>
      <div class="kpi-sub">${filteredExpenses.length} operating entries</div>
    </div>
    <div class="kpi-card balance">
      <div class="kpi-title">Net Operating Balance</div>
      <div class="kpi-val" style="color:${netOperatingProfit >= 0 ? '#059669' : '#dc2626'};">
        ${netOperatingProfit >= 0 ? '+' : ''}KES ${netOperatingProfit.toLocaleString()}
      </div>
      <div class="kpi-sub">Net Cash Flow Position</div>
    </div>
    <div class="kpi-card milk">
      <div class="kpi-title">Milk Production</div>
      <div class="kpi-val" style="color:#0d9488;">${totalMilkLiters} Liters</div>
      <div class="kpi-sub">${filteredMilk.length} dairy harvest logs</div>
    </div>
  </div>

  ${contentHtml}

  <!-- Report Footer -->
  <div class="report-footer">
    <div>© ${new Date().getFullYear()} <strong>${activeFarmName}</strong>. All rights reserved. • Generated on ${new Date().toLocaleDateString()}</div>
    <div>Document Ref: <strong style="font-family:monospace;">${docRefId}</strong> • Verified Operations Audit</div>
  </div>
</body>
</html>`;
  };

  // 1. Direct Print Function (Uses dedicated hidden iframe with native print fallback)
  const handlePrint = () => {
    try {
      showToast('Opening print dialog for ' + durationLabel + ' ' + reportCategory + ' report...');
      
      // Attempt iframe printing for isolated clean styling
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const htmlContent = generatePrintableHTML();
      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (e) {
            console.warn('Iframe print failed, falling back to window.print():', e);
            window.print();
          } finally {
            setTimeout(() => {
              try { document.body.removeChild(iframe); } catch {}
            }, 3000);
          }
        }, 500);
      } else {
        window.print();
      }
    } catch (err) {
      console.warn('Print error fallback:', err);
      window.print();
    }
  };

  // 2. Download Standalone Printable HTML Report
  const handleDownloadHTML = () => {
    const html = generatePrintableHTML();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Farm_Report_${reportCategory}_${(user?.farm_name || farmName).replace(/\s+/g, '_')}_${startDate}_to_${endDate}.html`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Printable HTML Report downloaded! You can open it in any browser and print.');
  };

  // 3. Download Specific CSV
  const handleExportCSV = () => {
    let csv = '';
    const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const activeFarmName = user?.farm_name || farmName;
    const activeEmail = user?.email || 'farm@smartgoatfarm.com';

    csv += `# SMART GOAT FARM - ${activeFarmName.toUpperCase()}\n`;
    csv += `# Farm Email: ${activeEmail}\n`;
    csv += `# Report Category: ${reportCategory.toUpperCase()}\n`;
    csv += `# Duration Window: ${durationLabel} (${startDate} to ${endDate})\n`;
    csv += `# Total Duration: ${durationDays} day(s)\n`;
    csv += `# Generated On: ${new Date().toLocaleString()}\n\n`;

    if (reportCategory === 'sales') {
      csv += `--- GOAT SALES LEDGER (${filteredSales.length} records, Total: KES ${totalSalesRevenue.toLocaleString()}) ---\n`;
      csv += ['Date', 'Goat Tag', 'Goat Name', 'Breed', 'Buyer Name', 'Sale Price (KES)'].map(escapeCsv).join(',') + '\n';
      filteredSales.forEach(s => {
        const g = goatMap.get(s.goat_id.toUpperCase());
        csv += [s.sale_date, s.goat_id, g?.name || '—', g?.breed || '—', s.buyer_name, s.price].map(escapeCsv).join(',') + '\n';
      });
    } else if (reportCategory === 'expenditure') {
      csv += `--- FARM EXPENDITURE & OPERATING EXPENSES (${filteredExpenses.length} records, Total: KES ${totalExpenditure.toLocaleString()}) ---\n`;
      csv += ['Date', 'Category', 'Expense Title', 'Receipt / Ref #', 'Notes', 'Amount (KES)'].map(escapeCsv).join(',') + '\n';
      filteredExpenses.forEach(e => {
        csv += [e.date, e.category, e.title, e.receipt_number || '—', e.notes || '—', e.amount].map(escapeCsv).join(',') + '\n';
      });
    } else if (reportCategory === 'milk') {
      csv += `--- MILK HARVEST LOGS (${filteredMilk.length} records, Total: ${totalMilkLiters} L) ---\n`;
      csv += ['Date', 'Goat Tag', 'Morning (L)', 'Evening (L)', 'Total (L)'].map(escapeCsv).join(',') + '\n';
      filteredMilk.forEach(m => {
        csv += [m.date, m.goat_id, m.morning_liters, m.evening_liters, m.total_liters].map(escapeCsv).join(',') + '\n';
      });
    } else if (reportCategory === 'health') {
      csv += `--- VETERINARY CARE & CLINICAL HEALTH (${filteredHealth.length} records) ---\n`;
      csv += ['Checkup Date', 'Goat Tag', 'Condition', 'Treatment', 'Attending Vet', 'Clinical Status'].map(escapeCsv).join(',') + '\n';
      filteredHealth.forEach(h => {
        csv += [h.checkup_date, h.goat_id, h.condition, h.treatment, h.vet_name || '—', h.status || '—'].map(escapeCsv).join(',') + '\n';
      });
    } else if (reportCategory === 'breeding') {
      csv += `--- BREEDING & GESTATION REGISTRY (${filteredBreeding.length} records) ---\n`;
      csv += ['Mating Date', 'Dam (Female)', 'Sire (Male)', 'Expected Kidding', 'Status'].map(escapeCsv).join(',') + '\n';
      filteredBreeding.forEach(b => {
        csv += [b.mating_date, b.female_id, b.male_id, b.expected_birth || '—', b.status || 'Active'].map(escapeCsv).join(',') + '\n';
      });
    } else {
      // Combined Summary
      csv += `--- FINANCIAL SUMMARY ---\n`;
      csv += `Total Sales Revenue: KES ${totalSalesRevenue.toLocaleString()}\n`;
      csv += `Total Expenditures: KES ${totalExpenditure.toLocaleString()}\n`;
      csv += `Net Operating Cash Flow: KES ${netOperatingProfit.toLocaleString()}\n\n`;

      csv += `--- SALES TRANSACTIONS (${filteredSales.length} records) ---\n`;
      csv += ['Date', 'Goat Tag', 'Buyer Name', 'Sale Price (KES)'].map(escapeCsv).join(',') + '\n';
      filteredSales.forEach(s => {
        csv += [s.sale_date, s.goat_id, s.buyer_name, s.price].map(escapeCsv).join(',') + '\n';
      });
      csv += '\n';

      csv += `--- EXPENSES (${filteredExpenses.length} records) ---\n`;
      csv += ['Date', 'Category', 'Expense Title', 'Amount (KES)'].map(escapeCsv).join(',') + '\n';
      filteredExpenses.forEach(e => {
        csv += [e.date, e.category, e.title, e.amount].map(escapeCsv).join(',') + '\n';
      });
      csv += '\n';

      csv += `--- MILK HARVESTS (${filteredMilk.length} records) ---\n`;
      csv += ['Date', 'Goat Tag', 'Total (L)'].map(escapeCsv).join(',') + '\n';
      filteredMilk.forEach(m => {
        csv += [m.date, m.goat_id, m.total_liters].map(escapeCsv).join(',') + '\n';
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Farm_Report_${reportCategory}_${(user?.farm_name || farmName).replace(/\s+/g, '_')}_${startDate}_to_${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${reportCategory.toUpperCase()} CSV successfully!`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-none print:w-full print:max-w-none">
        
        {/* Toast Alert Feedback */}
        {feedbackToast && (
          <div className="no-print bg-emerald-600 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between shadow-md">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {feedbackToast}
            </span>
            <button onClick={() => setFeedbackToast(null)} className="text-white/80 hover:text-white">✕</button>
          </div>
        )}

        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print px-6 py-4 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-stone-50/80 dark:bg-stone-800/60">
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Generate Specific Farm Report</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Filter by specific area (Sales, Expenditure, Milk, Health, Breeding, or Summary) and exact duration.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              id="btn-print-report"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              title="Print document directly or save as PDF via system print"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              id="btn-download-report-html"
              onClick={handleDownloadHTML}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              title="Download standalone printable HTML file"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Download Printable File</span>
            </button>

            <button
              type="button"
              id="btn-download-report-csv"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-xl text-xs font-semibold transition-colors"
              title="Export filtered data to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              id="btn-close-report-modal"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700"
              aria-label="Close Report Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dual Toolbar: Category Selector & Duration Selector (Hidden when printing) */}
        <div className="no-print px-6 py-3.5 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 space-y-3">
          
          {/* Specific Report Categories Selector */}
          <div className="flex flex-wrap items-center gap-1.5 pb-1">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300 mr-1 flex items-center gap-1">
              <span>Report Type:</span>
            </span>
            {[
              { id: 'summary', label: 'Summary', icon: FileText },
              { id: 'sales', label: 'Sales & Revenue', icon: DollarSign },
              { id: 'expenditure', label: 'Expenditure & Costs', icon: Receipt },
              { id: 'milk', label: 'Milk Yield', icon: Milk },
              { id: 'health', label: 'Health & Vet', icon: Stethoscope },
              { id: 'breeding', label: 'Breeding Schedule', icon: Baby },
            ].map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  id={`btn-report-cat-${cat.id}`}
                  type="button"
                  onClick={() => setReportCategory(cat.id as ReportCategory)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    reportCategory === cat.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Duration Presets Toolbar */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-100 dark:border-stone-800">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              Duration:
            </span>
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'specific_day', label: 'Specific Day' },
              { id: '2days', label: 'Last 2 Days' },
              { id: 'week', label: 'Past 7 Days' },
              { id: 'month', label: '1 Month' },
              { id: 'custom', label: 'Custom Range' },
            ].map(item => (
              <button
                key={item.id}
                id={`btn-preset-${item.id}`}
                type="button"
                onClick={() => setPreset(item.id as DurationPreset)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  preset === item.id
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Specific Single Day Selector */}
          {preset === 'specific_day' && (
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs bg-emerald-50/60 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
              <span className="font-semibold text-emerald-900 dark:text-emerald-300">
                Choose Specific Date to Audit:
              </span>
              <input
                id="input-report-specific-day"
                type="date"
                value={specificDay}
                onChange={e => setSpecificDay(e.target.value)}
                className="px-3 py-1 border border-stone-300 dark:border-stone-700 rounded-lg text-xs bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 font-mono"
              />
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                Filtering all records logged on {specificDay}
              </span>
            </div>
          )}

          {/* Custom Date Range Selector */}
          {preset === 'custom' && (
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-stone-600 dark:text-stone-400">From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="px-2.5 py-1 border border-stone-300 dark:border-stone-700 rounded-lg text-xs bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-stone-600 dark:text-stone-400">To:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="px-2.5 py-1 border border-stone-300 dark:border-stone-700 rounded-lg text-xs bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100"
                />
              </div>
              <span className="text-stone-500 dark:text-stone-400 italic">
                ({durationDays} day{durationDays === 1 ? '' : 's'} duration)
              </span>
            </div>
          )}
        </div>

        {/* Printable Report Document Sheet */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 bg-stone-50/50 dark:bg-stone-950/40 print:p-0 print:bg-white print:space-y-4">
          
          {/* Official Farm Header Template (Includes farm logo, farm name, and email address on top) */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs print:shadow-none print:border-b-2 print:border-stone-800 print:rounded-none">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
              
              {/* Left: Farm Identity (Logo, Name, Email) */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                  {user?.logo_url ? (
                    <img
                      src={user.logo_url}
                      alt={user.farm_name || farmName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">🐐</span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black text-stone-950 dark:text-white tracking-tight">
                      {user?.farm_name || farmName}
                    </h1>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 uppercase">
                      Official {reportCategory} Report
                    </span>
                  </div>

                  {/* Farm Email Address as explicitly required on top */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-stone-600 dark:text-stone-300">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 dark:text-emerald-300">
                      <Mail className="w-3.5 h-3.5 text-emerald-600" />
                      {user?.email || 'farm@smartgoatfarm.com'}
                    </span>
                    {user?.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        {user.phone}
                      </span>
                    )}
                    {user?.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        {user.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Report Metadata */}
              <div className="text-left sm:text-right text-xs text-stone-500 dark:text-stone-400 space-y-1">
                <div>
                  <span className="font-bold text-stone-800 dark:text-stone-200">Reporting Window: </span>
                  <span className="px-2 py-0.5 rounded-md font-bold bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700">
                    {durationLabel}
                  </span>
                </div>
                <div>
                  <span>Date Range: </span>
                  <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                    {startDate} → {endDate}
                  </span>
                </div>
                <div>
                  <span>Generated: </span>
                  <span className="font-mono">{new Date().toLocaleDateString()} at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="mt-4 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                  {reportCategory === 'sales' && 'Official Goat Sales & Commercial Revenue Ledger'}
                  {reportCategory === 'expenditure' && 'Official Farm Expenditure & Operating Cost Audit'}
                  {reportCategory === 'milk' && 'Dairy Production & Daily Milk Harvest Log'}
                  {reportCategory === 'health' && 'Veterinary Consultations & Clinical Health Interventions'}
                  {reportCategory === 'breeding' && 'Breeding Cycles, Mating & Gestation Schedule'}
                  {reportCategory === 'summary' && 'Comprehensive Herd Operations & Financial Summary'}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {reportCategory === 'sales' && 'Verified transaction records for animal sales, buyers, and revenue inflows.'}
                  {reportCategory === 'expenditure' && 'Comprehensive breakdown of operating outflows: feed, veterinary treatments, labor, and equipment.'}
                  {reportCategory === 'milk' && 'Morning and evening yield logs, daily harvest totals, and doe performance.'}
                  {reportCategory === 'health' && 'Diagnoses, medical treatments administered, attending veterinarians, and clinical outcomes.'}
                  {reportCategory === 'breeding' && 'Sire and dam schedules, estimated kidding dates, and breeding efficiency.'}
                  {reportCategory === 'summary' && 'Full executive summary of commercial performance, dairy yield, veterinary care, and herd census.'}
                </p>
              </div>
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
                Duration: {durationDays} Day{durationDays === 1 ? '' : 's'} Total
              </div>
            </div>
          </div>

          {/* Highlights KPI Grid tailored to category */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {reportCategory === 'sales' ? (
              <>
                <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                    <span>Total Sales Revenue</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                    KES {totalSalesRevenue.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">{filteredSales.length} sale transactions</div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                    <span>Average Price / Goat</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-stone-900 dark:text-stone-100">
                    KES {filteredSales.length > 0 ? Math.round(totalSalesRevenue / filteredSales.length).toLocaleString() : '0'}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">Per commercial transaction</div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                    <span>Animals Sold</span>
                    <Tag className="w-4 h-4 text-stone-500" />
                  </div>
                  <div className="text-2xl font-black text-stone-900 dark:text-stone-100">
                    {filteredSales.length} Goats
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">Status updated to Sold</div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                    <span>Total Herd Left</span>
                    <Tag className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-stone-900 dark:text-stone-100">
                    {statusCounts.active} Active
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">Available in herd inventory</div>
                </div>
              </>
            ) : reportCategory === 'expenditure' ? (
              <>
                <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                    <span>Total Expenditures</span>
                    <Receipt className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                    KES {totalExpenditure.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">{filteredExpenses.length} expense records</div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                    <span>Feed & Fodder</span>
                    <TrendingDown className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-black text-stone-900 dark:text-stone-100">
                    KES {(expensesByCategory['Feed'] || 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">Nutrition & grazing costs</div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                    <span>Veterinary & Meds</span>
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-black text-stone-900 dark:text-stone-100">
                    KES {(expensesByCategory['Vet'] || 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">Vaccines, vet visits & drugs</div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                    <span>Equipment & Labor</span>
                    <Receipt className="w-4 h-4 text-stone-500" />
                  </div>
                  <div className="text-2xl font-black text-stone-900 dark:text-stone-100">
                    KES {((expensesByCategory['Labor'] || 0) + (expensesByCategory['Equipment'] || 0)).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">Operational overhead</div>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                    <span>Sales Revenue</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                    KES {totalSalesRevenue.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">{filteredSales.length} transactions</div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                    <span>Expenditures</span>
                    <Receipt className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                    KES {totalExpenditure.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">{filteredExpenses.length} expense entries</div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                    <span>Milk Production</span>
                    <Milk className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-stone-900 dark:text-stone-100">
                    {totalMilkLiters} <span className="text-xs font-normal text-stone-500">Liters</span>
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">{filteredMilk.length} harvests</div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                    <span>Net Farm Balance</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className={`text-2xl font-black ${netOperatingProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {netOperatingProfit >= 0 ? '+' : ''}KES {netOperatingProfit.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-1">Revenue minus Expenses</div>
                </div>
              </>
            )}
          </div>

          {/* Section: SALES (Rendered if category is 'sales' or 'summary') */}
          {(reportCategory === 'sales' || reportCategory === 'summary') && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3 border-b border-stone-100 dark:border-stone-800 pb-2">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Goat Sales & Livestock Transactions ({filteredSales.length} Records)</span>
                </h3>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  Total: KES {totalSalesRevenue.toLocaleString()}
                </span>
              </div>

              {filteredSales.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs record-table-grid">
                    <thead className="bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-2.5">Date</th>
                        <th className="px-3 py-2.5">Goat Tag</th>
                        <th className="px-3 py-2.5">Goat Name & Details</th>
                        <th className="px-3 py-2.5">Buyer Name</th>
                        <th className="px-3 py-2.5 font-bold text-right">Sale Price (KES)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {filteredSales.map(s => {
                        const goat = goatMap.get(s.goat_id.toUpperCase());
                        return (
                          <tr key={s.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/50">
                            <td className="px-3 py-2.5 font-mono">{s.sale_date}</td>
                            <td className="px-3 py-2.5 font-mono font-bold text-stone-900 dark:text-stone-100">
                              <span className="bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded text-stone-800 dark:text-stone-200">
                                {s.goat_id}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-stone-700 dark:text-stone-300">
                              {goat?.name ? <strong>{goat.name}</strong> : 'Herd Stock'}
                              {goat?.breed && <span className="text-stone-500 text-[11px] ml-1">({goat.breed})</span>}
                            </td>
                            <td className="px-3 py-2.5 text-stone-800 dark:text-stone-200">{s.buyer_name}</td>
                            <td className="px-3 py-2.5 font-mono font-bold text-emerald-700 dark:text-emerald-400 text-right">
                              KES {Number(s.price).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-stone-50 dark:bg-stone-800/60 font-bold border-t border-stone-200 dark:border-stone-700">
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-right text-stone-600 dark:text-stone-300">
                          Total Period Sales:
                        </td>
                        <td className="px-3 py-2 text-right text-emerald-700 dark:text-emerald-400 font-mono text-sm">
                          KES {totalSalesRevenue.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-stone-500 italic py-2">
                  No goat sales recorded during this {durationLabel.toLowerCase()} period ({startDate} to {endDate}).
                </p>
              )}
            </div>
          )}

          {/* Section: EXPENDITURES (Rendered if category is 'expenditure' or 'summary') */}
          {(reportCategory === 'expenditure' || reportCategory === 'summary') && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3 border-b border-stone-100 dark:border-stone-800 pb-2">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-rose-600" />
                  <span>Farm Operating Expenditures & Costs ({filteredExpenses.length} Records)</span>
                </h3>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  Total: KES {totalExpenditure.toLocaleString()}
                </span>
              </div>

              {filteredExpenses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs record-table-grid">
                    <thead className="bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-2.5">Date</th>
                        <th className="px-3 py-2.5">Category</th>
                        <th className="px-3 py-2.5">Description / Title</th>
                        <th className="px-3 py-2.5">Receipt #</th>
                        <th className="px-3 py-2.5 font-bold text-right">Cost (KES)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {filteredExpenses.map(e => (
                        <tr key={e.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/50">
                          <td className="px-3 py-2.5 font-mono">{e.date}</td>
                          <td className="px-3 py-2.5">
                            <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                              {e.category}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-stone-800 dark:text-stone-200">
                            <strong>{e.title}</strong>
                            {e.notes && <div className="text-[11px] text-stone-500 mt-0.5">{e.notes}</div>}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-stone-600 dark:text-stone-400">
                            {e.receipt_number || '—'}
                          </td>
                          <td className="px-3 py-2.5 font-mono font-bold text-rose-600 dark:text-rose-400 text-right">
                            KES {Number(e.amount).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-stone-50 dark:bg-stone-800/60 font-bold border-t border-stone-200 dark:border-stone-700">
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-right text-stone-600 dark:text-stone-300">
                          Total Period Expenditures:
                        </td>
                        <td className="px-3 py-2 text-right text-rose-600 dark:text-rose-400 font-mono text-sm">
                          KES {totalExpenditure.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-stone-500 italic py-2">
                  No operating expenditures recorded during this {durationLabel.toLowerCase()} period ({startDate} to {endDate}).
                </p>
              )}
            </div>
          )}

          {/* Section: MILK PRODUCTION (Rendered if category is 'milk' or 'summary') */}
          {(reportCategory === 'milk' || reportCategory === 'summary') && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3 border-b border-stone-100 dark:border-stone-800 pb-2">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Milk className="w-4 h-4 text-emerald-600" />
                  <span>Milk Production Logs ({filteredMilk.length} Records)</span>
                </h3>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  Total Harvest: {totalMilkLiters} Liters
                </span>
              </div>

              {filteredMilk.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs record-table-grid">
                    <thead className="bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Goat Tag</th>
                        <th className="px-3 py-2">Goat Name</th>
                        <th className="px-3 py-2">Morning (L)</th>
                        <th className="px-3 py-2">Evening (L)</th>
                        <th className="px-3 py-2 font-bold text-right">Daily Total (L)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {filteredMilk.map(m => {
                        const goat = goatMap.get(m.goat_id.toUpperCase());
                        return (
                          <tr key={m.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/50">
                            <td className="px-3 py-2 font-mono">{m.date}</td>
                            <td className="px-3 py-2 font-mono font-bold text-stone-900 dark:text-stone-100">{m.goat_id}</td>
                            <td className="px-3 py-2 text-stone-700 dark:text-stone-300">{goat?.name || '—'}</td>
                            <td className="px-3 py-2 font-mono">{m.morning_liters} L</td>
                            <td className="px-3 py-2 font-mono">{m.evening_liters} L</td>
                            <td className="px-3 py-2 font-mono font-bold text-emerald-700 dark:text-emerald-400 text-right">
                              {m.total_liters} L
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-stone-500 italic py-2">
                  No milk production logged during this {durationLabel.toLowerCase()} period ({startDate} to {endDate}).
                </p>
              )}
            </div>
          )}

          {/* Section: HEALTH & VET (Rendered if category is 'health' or 'summary') */}
          {(reportCategory === 'health' || reportCategory === 'summary') && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3 border-b border-stone-100 dark:border-stone-800 pb-2">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                  <span>Veterinary Checkups & Clinical Interventions ({filteredHealth.length} Records)</span>
                </h3>
              </div>

              {filteredHealth.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs record-table-grid">
                    <thead className="bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Goat Tag</th>
                        <th className="px-3 py-2">Condition Diagnosed</th>
                        <th className="px-3 py-2">Treatment Administered</th>
                        <th className="px-3 py-2">Attending Vet</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {filteredHealth.map(h => (
                        <tr key={h.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/50">
                          <td className="px-3 py-2 font-mono">{h.checkup_date}</td>
                          <td className="px-3 py-2 font-mono font-bold text-stone-900 dark:text-stone-100">{h.goat_id}</td>
                          <td className="px-3 py-2 font-medium text-stone-800 dark:text-stone-200">{h.condition}</td>
                          <td className="px-3 py-2 text-stone-600 dark:text-stone-400">{h.treatment}</td>
                          <td className="px-3 py-2 text-stone-600 dark:text-stone-400">{h.vet_name || 'Dr. Gitau (DVM)'}</td>
                          <td className="px-3 py-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              {h.status || 'Treated'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-stone-500 italic py-2">
                  No medical interventions recorded during this {durationLabel.toLowerCase()} period ({startDate} to {endDate}).
                </p>
              )}
            </div>
          )}

          {/* Section: BREEDING (Rendered if category is 'breeding' or 'summary') */}
          {(reportCategory === 'breeding' || reportCategory === 'summary') && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3 border-b border-stone-100 dark:border-stone-800 pb-2">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Baby className="w-4 h-4 text-purple-600" />
                  <span>Breeding & Gestation Schedules ({filteredBreeding.length} Records)</span>
                </h3>
              </div>

              {filteredBreeding.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs record-table-grid">
                    <thead className="bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-2">Mating Date</th>
                        <th className="px-3 py-2">Dam (Female)</th>
                        <th className="px-3 py-2">Sire (Male)</th>
                        <th className="px-3 py-2">Expected Kidding</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {filteredBreeding.map(b => (
                        <tr key={b.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/50">
                          <td className="px-3 py-2 font-mono">{b.mating_date}</td>
                          <td className="px-3 py-2 font-mono font-bold text-purple-700 dark:text-purple-300">{b.female_id}</td>
                          <td className="px-3 py-2 font-mono text-stone-700 dark:text-stone-300">{b.male_id}</td>
                          <td className="px-3 py-2 font-mono text-stone-800 dark:text-stone-200">{b.expected_birth || '—'}</td>
                          <td className="px-3 py-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              {b.status || 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-stone-500 italic py-2">
                  No breeding cycles recorded during this {durationLabel.toLowerCase()} period ({startDate} to {endDate}).
                </p>
              )}
            </div>
          )}

          {/* Herd Classification Snapshot (Shown on summary) */}
          {reportCategory === 'summary' && (
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-3 border-b border-stone-100 dark:border-stone-800 pb-2">
                Herd Census & Current Classification
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                  <div className="text-lg font-black text-emerald-800 dark:text-emerald-300">{statusCounts.active}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Active Goats</div>
                </div>
                <div className="p-3 bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl">
                  <div className="text-lg font-black text-purple-800 dark:text-purple-300">{statusCounts.pregnant}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">Pregnant Does</div>
                </div>
                <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <div className="text-lg font-black text-amber-900 dark:text-amber-300">{statusCounts.quarantine}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Quarantined</div>
                </div>
                <div className="p-3 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl">
                  <div className="text-lg font-black text-stone-800 dark:text-stone-200">{statusCounts.sold}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">Sold / Transferred</div>
                </div>
                <div className="p-3 bg-stone-900 text-white rounded-xl col-span-2 sm:col-span-1">
                  <div className="text-lg font-black text-emerald-400">{statusCounts.total}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-stone-300">Total Registered</div>
                </div>
              </div>
            </div>
          )}

          {/* Report Footer */}
          <div className="pt-6 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
            <span>© {new Date().getFullYear()} <strong className="text-stone-800 dark:text-stone-200">{user?.farm_name || farmName}</strong>. All rights reserved. • Generated on {new Date().toLocaleDateString()}</span>
            <span className="font-mono text-[11px] bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded border border-stone-200 dark:border-stone-700">Verified Farm Report • Ref: {docRefId}</span>
          </div>

        </div>

        {/* Modal Footer Controls (Hidden when printing) */}
        <div className="no-print px-6 py-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-stone-500 dark:text-stone-400 text-center sm:text-left">
            Active: <strong className="text-stone-800 dark:text-stone-200 uppercase">{reportCategory}</strong> report for <strong className="text-stone-800 dark:text-stone-200">{durationLabel}</strong> ({startDate} to {endDate})
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs transition-colors"
            >
              Print Document
            </button>
            <button
              type="button"
              onClick={handleDownloadHTML}
              className="px-3.5 py-1.5 bg-stone-900 hover:bg-black text-white font-semibold rounded-xl transition-colors"
            >
              Download File
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-semibold rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
