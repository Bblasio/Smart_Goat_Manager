import * as XLSX from 'xlsx';
import {
  GoatRecord,
  BreedingRecord,
  HealthRecord,
  MilkRecord,
  SaleRecord,
  WorkerRecord,
  ExpenseRecord,
  KidGrowthRecord,
  FeedRecord,
  MedicationRecord,
} from '../types';

/**
 * Resolves goat tag number or name given an ID
 */
const resolveGoatIdentifier = (idOrTag?: string, goats?: GoatRecord[]): { tag: string; name: string } => {
  if (!idOrTag) return { tag: '—', name: '—' };
  if (!goats || goats.length === 0) return { tag: idOrTag, name: '—' };
  const found = goats.find(g => g.id === idOrTag || g.tag_number === idOrTag);
  if (found) {
    return {
      tag: found.tag_number || idOrTag,
      name: found.name || '—',
    };
  }
  return { tag: idOrTag, name: '—' };
};

/**
 * Format date nicely for spreadsheets (YYYY-MM-DD)
 */
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
};

/**
 * Calculates responsive column widths for an Excel worksheet
 */
const autoFitColumns = (jsonRows: Record<string, any>[]): { wch: number }[] => {
  if (!jsonRows || jsonRows.length === 0) return [];
  const keys = Object.keys(jsonRows[0]);
  return keys.map(key => {
    let maxLen = key.length;
    for (let i = 0; i < Math.min(jsonRows.length, 200); i++) {
      const val = jsonRows[i][key];
      const strLen = val !== null && val !== undefined ? String(val).length : 0;
      if (strLen > maxLen) maxLen = strLen;
    }
    return { wch: Math.min(Math.max(maxLen + 3, 12), 40) };
  });
};

/**
 * Transform Goats records into defined Excel rows
 */
export const formatGoatsForExcel = (goats: GoatRecord[]): Record<string, any>[] => {
  return goats.map(g => {
    return {
      'Ear Tag Number': g.tag_number || '—',
      'Animal Name': g.name || '—',
      'Breed': g.breed || '—',
      'Gender': g.gender === 'Female' ? 'Female (Doe)' : 'Male (Buck)',
      'Herd Status': g.status || 'Active',
      'Weight (kg)': g.weight_kg !== undefined && g.weight_kg !== null ? Number(g.weight_kg) : '—',
      'Date of Birth': formatDate(g.dob),
      'Dam Tag (Mother)': g.dam_tag || '—',
      'Sire Tag (Father)': g.sire_tag || '—',
      'Registration Date': formatDate(g.created_at),
    };
  });
};

/**
 * Transform Breeding records into defined Excel rows
 */
export const formatBreedingForExcel = (breeding: BreedingRecord[], allGoats?: GoatRecord[]): Record<string, any>[] => {
  return breeding.map(b => {
    const female = resolveGoatIdentifier(b.female_id, allGoats);
    const male = resolveGoatIdentifier(b.male_id, allGoats);
    return {
      'Doe Tag (Mother)': female.tag,
      'Doe Name': female.name,
      'Buck Tag (Father)': male.tag,
      'Buck Name': male.name,
      'Mating Date': formatDate(b.mating_date),
      'Expected Kidding Date': formatDate(b.expected_birth),
      'Gestation Days': b.gestation_days !== undefined ? b.gestation_days : 150,
      'Actual Kidding Date': formatDate(b.actual_birth_date),
      'Kids Born (Count)': b.kids_born !== undefined && b.kids_born !== null ? b.kids_born : '—',
      'Gestation Status': b.status || 'Active',
      'Notes & Observations': b.notes || '',
    };
  });
};

/**
 * Transform Health records into defined Excel rows
 */
export const formatHealthForExcel = (health: HealthRecord[], allGoats?: GoatRecord[]): Record<string, any>[] => {
  return health.map(h => {
    const goat = resolveGoatIdentifier(h.goat_id, allGoats);
    return {
      'Ear Tag': goat.tag,
      'Animal Name': goat.name,
      'Checkup / Treatment Date': formatDate(h.checkup_date),
      'Checkup Category': h.checkup_type || 'Routine',
      'Clinical Diagnosis / Condition': h.condition || '—',
      'Treatment & Medications': h.treatment || '—',
      'Attending Veterinarian / Staff': h.vet_name || '—',
      'Recovery Status': h.status || 'Healthy',
      'Pregnant Confirmed': h.is_pregnant ? 'Yes' : 'No',
    };
  });
};

/**
 * Transform Milk records into defined Excel rows
 */
export const formatMilkForExcel = (milk: MilkRecord[], allGoats?: GoatRecord[]): Record<string, any>[] => {
  return milk.map(m => {
    const goat = resolveGoatIdentifier(m.goat_id, allGoats);
    const morning = Number(m.morning_liters || 0);
    const evening = Number(m.evening_liters || 0);
    const total = Number(m.total_liters || morning + evening);
    return {
      'Ear Tag': goat.tag,
      'Animal Name': goat.name,
      'Harvest Date': formatDate(m.date),
      'Morning Harvest (L)': morning,
      'Evening Harvest (L)': evening,
      'Total Daily Yield (L)': total,
    };
  });
};

/**
 * Transform Sales records into defined Excel rows
 */
export const formatSalesForExcel = (sales: SaleRecord[], allGoats?: GoatRecord[]): Record<string, any>[] => {
  return sales.map(s => {
    const goat = resolveGoatIdentifier(s.goat_id, allGoats);
    return {
      'Ear Tag': goat.tag,
      'Animal Name': goat.name,
      'Sale Date': formatDate(s.sale_date),
      'Buyer Full Name': s.buyer_name || '—',
      'Sale Price (KES)': Number(s.price || 0),
    };
  });
};

/**
 * Transform Workers records into defined Excel rows
 */
export const formatWorkersForExcel = (workers: WorkerRecord[]): Record<string, any>[] => {
  return workers.map(w => ({
    'Full Name': w.full_name || '—',
    'Phone Contact': w.phone || '—',
    'Farm Station / Location': w.location || '—',
  }));
};

/**
 * Transform Expenses records into defined Excel rows
 */
export const formatExpensesForExcel = (expenses: ExpenseRecord[]): Record<string, any>[] => {
  return expenses.map(e => ({
    'Expense Date': formatDate(e.date),
    'Category': e.category || 'Other',
    'Expense Title / Description': e.title || '—',
    'Amount (KES)': Number(e.amount || 0),
    'Receipt Number': e.receipt_number || '—',
    'Notes / Remarks': e.notes || '',
  }));
};

/**
 * Export structured data as a native Excel (.xlsx) workbook with proper headings & column widths
 */
export const downloadExcelFile = (
  rows: Record<string, any>[],
  sheetName: string,
  baseFilename: string
) => {
  if (!rows || rows.length === 0) return false;

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = autoFitColumns(rows);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));

  const dateSuffix = new Date().toISOString().split('T')[0];
  const fullFileName = `${baseFilename}-${dateSuffix}.xlsx`;

  XLSX.writeFile(workbook, fullFileName);
  return true;
};

/**
 * Export structured data as CSV with UTF-8 BOM for seamless Microsoft Excel compatibility
 */
export const downloadCsvWithProperHeadings = (
  rows: Record<string, any>[],
  baseFilename: string
) => {
  if (!rows || rows.length === 0) return false;

  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map(row =>
      headers
        .map(h => {
          const val = row[h];
          if (val === null || val === undefined) return '""';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ];

  // \uFEFF Byte Order Mark ensures Microsoft Excel displays UTF-8 cleanly
  const csvContent = '\uFEFF' + csvLines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateSuffix = new Date().toISOString().split('T')[0];
  link.download = `${baseFilename}-${dateSuffix}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
};
