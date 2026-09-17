import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useFarm } from '../context/FarmContext';
import { GoatRecord, BreedingRecord, HealthRecord, MilkRecord } from '../types';
import {
  FileSpreadsheet,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  Loader2,
  HelpCircle,
  ArrowRight,
  Database
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: 'goats' | 'breeding' | 'health' | 'milk';
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'goats',
}) => {
  const { importBatchRecords } = useFarm();

  const [category, setCategory] = useState<'goats' | 'breeding' | 'health' | 'milk'>(defaultCategory);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [parsedData, setParsedData] = useState<{
    goats: Omit<GoatRecord, 'id' | 'created_at'>[];
    breeding: Omit<BreedingRecord, 'id'>[];
    health: Omit<HealthRecord, 'id'>[];
    milk: Omit<MilkRecord, 'id'>[];
  }>({ goats: [], breeding: [], health: [], milk: [] });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Helper to parse Excel dates (serial numbers or strings)
  const parseExcelDate = (val: any): string => {
    if (!val) return new Date().toISOString().split('T')[0];
    if (typeof val === 'number') {
      // Excel epoch begins 1900-01-01
      const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(jsDate.getTime())) {
        return jsDate.toISOString().split('T')[0];
      }
    }
    const str = String(val).trim();
    // Try standard date parsing
    const dateObj = new Date(str);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toISOString().split('T')[0];
    }
    // Handle DD/MM/YYYY or DD-MM-YYYY
    const parts = str.split(/[/.-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else if (parts[2].length === 4) {
        // DD/MM/YYYY
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return new Date().toISOString().split('T')[0];
  };

  // Helper to normalize column keys
  const cleanKey = (key: string): string => {
    return key.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  // Map rows based on selected category
  const mapRowsToRecords = (rows: any[], targetCat: 'goats' | 'breeding' | 'health' | 'milk') => {
    if (targetCat === 'goats') {
      const mappedGoats: Omit<GoatRecord, 'id' | 'created_at'>[] = [];
      rows.forEach((row, idx) => {
        const cleanedRow: Record<string, any> = {};
        Object.entries(row).forEach(([k, v]) => {
          cleanedRow[cleanKey(k)] = v;
        });

        // Find Tag Number
        const tag =
          cleanedRow['tag'] ||
          cleanedRow['tagnumber'] ||
          cleanedRow['tagno'] ||
          cleanedRow['goatid'] ||
          cleanedRow['id'] ||
          cleanedRow['eartag'] ||
          `GT-${String(idx + 1).padStart(3, '0')}`;

        // Find Breed
        const breed =
          cleanedRow['breed'] ||
          cleanedRow['breedtype'] ||
          cleanedRow['variety'] ||
          cleanedRow['type'] ||
          'Boer';

        // Find Gender
        const rawGender = String(cleanedRow['gender'] || cleanedRow['sex'] || 'Female').toLowerCase();
        let gender: 'Male' | 'Female' = 'Female';
        if (rawGender.startsWith('m') || rawGender.includes('buck') || rawGender.includes('billy') || rawGender.includes('ram')) {
          gender = 'Male';
        }

        // Find DOB
        const dob = parseExcelDate(
          cleanedRow['dob'] || cleanedRow['dateofbirth'] || cleanedRow['birthdate'] || cleanedRow['birth']
        );

        // Find Weight
        const rawWeight = Number(cleanedRow['weight'] || cleanedRow['weightkg'] || cleanedRow['weightinkg'] || 45);
        const weight_kg = !isNaN(rawWeight) && rawWeight > 0 ? rawWeight : 45;

        // Find Status
        const rawStatus = String(cleanedRow['status'] || 'Active');
        let status: 'Active' | 'Sold' | 'Quarantine' | 'Pregnant' = 'Active';
        if (rawStatus.toLowerCase().includes('sold')) status = 'Sold';
        else if (rawStatus.toLowerCase().includes('quarantine')) status = 'Quarantine';
        else if (rawStatus.toLowerCase().includes('pregnant')) status = 'Pregnant';

        mappedGoats.push({
          tag_number: String(tag).trim(),
          breed: String(breed).trim(),
          gender,
          dob,
          weight_kg,
          status,
        });
      });

      setParsedData(prev => ({ ...prev, goats: mappedGoats }));
    } else if (targetCat === 'breeding') {
      const mappedBreeding: Omit<BreedingRecord, 'id'>[] = [];
      rows.forEach((row, idx) => {
        const cleanedRow: Record<string, any> = {};
        Object.entries(row).forEach(([k, v]) => {
          cleanedRow[cleanKey(k)] = v;
        });

        const female_id = String(
          cleanedRow['femaleid'] ||
          cleanedRow['doe'] ||
          cleanedRow['dam'] ||
          cleanedRow['female'] ||
          cleanedRow['goatid'] ||
          `DOE-${idx + 1}`
        ).trim();

        const male_id = String(
          cleanedRow['maleid'] ||
          cleanedRow['buck'] ||
          cleanedRow['sire'] ||
          cleanedRow['male'] ||
          'BUCK-01'
        ).trim();

        const mating_date = parseExcelDate(cleanedRow['matingdate'] || cleanedRow['date'] || cleanedRow['serveddate']);
        const gestation_days = Number(cleanedRow['gestationdays'] || cleanedRow['gestation'] || 150) || 150;

        const matingDateObj = new Date(mating_date);
        matingDateObj.setDate(matingDateObj.getDate() + gestation_days);
        const expected_birth = matingDateObj.toISOString().split('T')[0];

        mappedBreeding.push({
          female_id,
          male_id,
          mating_date,
          expected_birth,
          gestation_days,
          status: 'Active',
          notes: String(cleanedRow['notes'] || cleanedRow['remarks'] || ''),
        });
      });

      setParsedData(prev => ({ ...prev, breeding: mappedBreeding }));
    } else if (targetCat === 'health') {
      const mappedHealth: Omit<HealthRecord, 'id'>[] = [];
      rows.forEach((row, idx) => {
        const cleanedRow: Record<string, any> = {};
        Object.entries(row).forEach(([k, v]) => {
          cleanedRow[cleanKey(k)] = v;
        });

        const goat_id = String(cleanedRow['goatid'] || cleanedRow['tag'] || cleanedRow['tagno'] || `GT-${idx + 1}`).trim();
        const condition = String(cleanedRow['condition'] || cleanedRow['diagnosis'] || cleanedRow['issue'] || 'Routine Checkup').trim();
        const treatment = String(cleanedRow['treatment'] || cleanedRow['medication'] || cleanedRow['action'] || 'Deworming & Vitamin Drench').trim();
        const checkup_date = parseExcelDate(cleanedRow['date'] || cleanedRow['checkupdate'] || cleanedRow['treatmentdate']);
        const checkup_type = 'Routine';

        mappedHealth.push({
          goat_id,
          condition,
          treatment,
          checkup_date,
          checkup_type,
          vet_name: String(cleanedRow['vet'] || cleanedRow['vetname'] || cleanedRow['officer'] || '').trim(),
        });
      });

      setParsedData(prev => ({ ...prev, health: mappedHealth }));
    } else if (targetCat === 'milk') {
      const mappedMilk: Omit<MilkRecord, 'id'>[] = [];
      rows.forEach((row, idx) => {
        const cleanedRow: Record<string, any> = {};
        Object.entries(row).forEach(([k, v]) => {
          cleanedRow[cleanKey(k)] = v;
        });

        const goat_id = String(cleanedRow['goatid'] || cleanedRow['tag'] || cleanedRow['tagno'] || `DOE-${idx + 1}`).trim();
        const date = parseExcelDate(cleanedRow['date'] || cleanedRow['milkdate']);
        const morning_liters = Number(cleanedRow['morningliters'] || cleanedRow['morning'] || cleanedRow['am'] || 1.8);
        const evening_liters = Number(cleanedRow['eveningliters'] || cleanedRow['evening'] || cleanedRow['pm'] || 1.4);
        const total_liters = Number((morning_liters + evening_liters).toFixed(2));

        mappedMilk.push({
          goat_id,
          date,
          morning_liters,
          evening_liters,
          total_liters,
        });
      });

      setParsedData(prev => ({ ...prev, milk: mappedMilk }));
    }
  };

  const processWorkbook = (file: File) => {
    setIsProcessing(true);
    setErrorMsg(null);
    setImportSuccessCount(null);

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'array' });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          setErrorMsg('The uploaded spreadsheet contains no sheets.');
          setIsProcessing(false);
          return;
        }

        setSheetNames(workbook.SheetNames);
        const firstSheetName = workbook.SheetNames[0];
        setActiveSheet(firstSheetName);

        const sheet = workbook.Sheets[firstSheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        if (rows.length === 0) {
          setErrorMsg(`Sheet "${firstSheetName}" has no data rows.`);
          setRawRows([]);
          setIsProcessing(false);
          return;
        }

        setRawRows(rows);

        // Auto-detect category from columns if possible
        const sampleKeys = Object.keys(rows[0] || {}).map(cleanKey);
        let detectedCategory: 'goats' | 'breeding' | 'health' | 'milk' = category;

        if (sampleKeys.some(k => k.includes('mating') || k.includes('buck') || k.includes('sire'))) {
          detectedCategory = 'breeding';
        } else if (sampleKeys.some(k => k.includes('condition') || k.includes('treatment') || k.includes('diagnosis'))) {
          detectedCategory = 'health';
        } else if (sampleKeys.some(k => k.includes('morning') || k.includes('liters') || k.includes('milk'))) {
          detectedCategory = 'milk';
        } else if (sampleKeys.some(k => k.includes('tag') || k.includes('breed') || k.includes('gender') || k.includes('sex'))) {
          detectedCategory = 'goats';
        }

        setCategory(detectedCategory);
        mapRowsToRecords(rows, detectedCategory);
        setIsProcessing(false);
      } catch (err: any) {
        console.error('Error parsing Excel file:', err);
        setErrorMsg('Failed to parse this document. Please ensure it is a valid .xlsx, .xls, or .csv document.');
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg('Failed to read the file.');
      setIsProcessing(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndProcess(files[0]);
    }
  };

  const validateAndProcess = (file: File) => {
    // Check file extension to strictly allow only document files
    const validExts = ['.xlsx', '.xls', '.csv'];
    const fileNameLower = file.name.toLowerCase();
    const isValidDoc = validExts.some(ext => fileNameLower.endsWith(ext));

    if (!isValidDoc) {
      setErrorMsg('Invalid file type. Only spreadsheet documents (.xlsx, .xls, .csv) are accepted.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    processWorkbook(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcess(e.dataTransfer.files[0]);
    }
  };

  // Switch sheet
  const handleSheetSelect = (sheetName: string) => {
    if (!selectedFile) return;
    setActiveSheet(sheetName);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);
        setRawRows(rows);
        mapRowsToRecords(rows, category);
        setIsProcessing(false);
      } catch {
        setErrorMsg(`Unable to load sheet "${sheetName}".`);
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  // Re-map when category changes
  const handleCategoryChange = (newCat: 'goats' | 'breeding' | 'health' | 'milk') => {
    setCategory(newCat);
    if (rawRows.length > 0) {
      mapRowsToRecords(rawRows, newCat);
    }
  };

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // 1. Goats sheet
    const goatsTemplate = [
      {
        'Tag Number': 'GT-101',
        'Breed': 'Boer',
        'Gender': 'Female',
        'Date of Birth': '2023-04-12',
        'Weight (kg)': 48,
        'Status': 'Active'
      },
      {
        'Tag Number': 'GT-102',
        'Breed': 'Kalahari Red',
        'Gender': 'Male',
        'Date of Birth': '2022-08-20',
        'Weight (kg)': 65,
        'Status': 'Active'
      },
      {
        'Tag Number': 'GT-103',
        'Breed': 'Saanen',
        'Gender': 'Female',
        'Date of Birth': '2023-02-15',
        'Weight (kg)': 52,
        'Status': 'Pregnant'
      }
    ];
    const wsGoats = XLSX.utils.json_to_sheet(goatsTemplate);
    XLSX.utils.book_append_sheet(wb, wsGoats, 'Goats Herd');

    // 2. Breeding sheet
    const breedingTemplate = [
      {
        'Female ID': 'GT-101',
        'Male ID': 'GT-102',
        'Mating Date': '2026-05-10',
        'Gestation Days': 150,
        'Notes': 'Natural mating in Pen 2'
      }
    ];
    const wsBreeding = XLSX.utils.json_to_sheet(breedingTemplate);
    XLSX.utils.book_append_sheet(wb, wsBreeding, 'Breeding');

    // 3. Health sheet
    const healthTemplate = [
      {
        'Goat ID': 'GT-101',
        'Condition': 'Routine Checkup',
        'Treatment': 'Multivitamin + Albendazole drench',
        'Checkup Date': '2026-08-01',
        'Vet Name': 'Dr. Kamau'
      }
    ];
    const wsHealth = XLSX.utils.json_to_sheet(healthTemplate);
    XLSX.utils.book_append_sheet(wb, wsHealth, 'Health');

    // 4. Milk sheet
    const milkTemplate = [
      {
        'Goat ID': 'GT-103',
        'Date': '2026-09-16',
        'Morning Liters': 2.4,
        'Evening Liters': 1.8
      }
    ];
    const wsMilk = XLSX.utils.json_to_sheet(milkTemplate);
    XLSX.utils.book_append_sheet(wb, wsMilk, 'Milk Yield');

    XLSX.writeFile(wb, 'Smart_Goat_Farm_Records_Template.xlsx');
  };

  // Perform Final Import
  const handleImportSubmit = async () => {
    setIsImporting(true);
    setErrorMsg(null);
    try {
      let payload: any = {};
      if (category === 'goats') payload.goats = parsedData.goats;
      if (category === 'breeding') payload.breeding = parsedData.breeding;
      if (category === 'health') payload.health = parsedData.health;
      if (category === 'milk') payload.milk = parsedData.milk;

      const result = await importBatchRecords(payload);
      setImportSuccessCount(result.totalImported);
    } catch (err: any) {
      console.error('Batch import failed:', err);
      setErrorMsg('Error importing records: ' + (err.message || 'Unknown error'));
    } finally {
      setIsImporting(false);
    }
  };

  const getRecordCount = () => {
    if (category === 'goats') return parsedData.goats.length;
    if (category === 'breeding') return parsedData.breeding.length;
    if (category === 'health') return parsedData.health.length;
    if (category === 'milk') return parsedData.milk.length;
    return 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <span>Upload Excel / Spreadsheet Document</span>
              </h3>
              <p className="text-xs text-stone-500">
                Transition your traditional farm books, paper records, and spreadsheets into digital records
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Success Banner */}
          {importSuccessCount !== null && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Successfully imported {importSuccessCount} records!</span>
              </div>
              <p className="text-xs text-emerald-800">
                Your herd records have been registered and synchronized. They are now live on your dashboard and records ledger.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                >
                  Done & View Records
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setRawRows([]);
                    setImportSuccessCount(null);
                  }}
                  className="px-3 py-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  Upload Another Sheet
                </button>
              </div>
            </div>
          )}

          {/* Template Download Option */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200">
            <div className="flex items-center gap-2.5">
              <Download className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <div className="text-xs font-bold text-stone-900">Need a pre-formatted spreadsheet?</div>
                <div className="text-[11px] text-stone-500">
                  Download our official sample Excel template to easily transcribe your pen-and-paper herd logbooks.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-lg text-xs font-semibold transition-colors shrink-0 shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Download Template (.xlsx)</span>
            </button>
          </div>

          {/* Target Category Selection */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">
              1. What records are in this spreadsheet?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'goats', label: '🐐 Goats Registry', hint: 'Tags, Breed, Gender, DOB' },
                { id: 'breeding', label: '🌱 Breeding Schedule', hint: 'Sire, Dam, Mating Date' },
                { id: 'health', label: '🩺 Health & Treatments', hint: 'Conditions, Vaccinations' },
                { id: 'milk', label: '🥛 Milk Production', hint: 'Daily AM/PM Liters' },
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id as any)}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    category === cat.id
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-1 ring-emerald-600'
                      : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-white'
                  }`}
                >
                  <div className="text-xs font-bold">{cat.label}</div>
                  <div className="text-[10px] text-stone-500 mt-0.5">{cat.hint}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Drag & Drop File Zone */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">
              2. Select or drag your spreadsheet document (.xlsx, .xls, .csv only)
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-50/60'
                  : 'border-stone-300 hover:border-emerald-500 bg-stone-50/50 hover:bg-stone-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-800">
                    {selectedFile ? selectedFile.name : 'Click to select document or drag & drop here'}
                  </span>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Supports Microsoft Excel (.xlsx, .xls) and CSV documents
                  </p>
                </div>
                {selectedFile && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-semibold">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Multiple Sheets Selector if present */}
          {sheetNames.length > 1 && (
            <div className="flex items-center gap-2 p-3 bg-stone-100 rounded-xl">
              <span className="text-xs font-semibold text-stone-700 shrink-0">Workbook Sheet:</span>
              <div className="flex flex-wrap gap-1.5">
                {sheetNames.map(name => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleSheetSelect(name)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      activeSheet === name
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-300'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isProcessing && (
            <div className="py-8 flex flex-col items-center justify-center text-stone-500 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-xs font-semibold">Reading spreadsheet columns and values...</span>
            </div>
          )}

          {/* Preview Table */}
          {!isProcessing && rawRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span>3. Document Preview ({getRecordCount()} valid rows mapped)</span>
                </span>
                <span className="text-[11px] text-stone-500">
                  Showing first 5 rows
                </span>
              </div>

              <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="overflow-x-auto max-h-56">
                  {category === 'goats' && (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 text-stone-600 uppercase font-mono text-[10px] tracking-wider border-b border-stone-200 sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Tag No</th>
                          <th className="px-3 py-2">Breed</th>
                          <th className="px-3 py-2">Gender</th>
                          <th className="px-3 py-2">Date of Birth</th>
                          <th className="px-3 py-2">Weight (kg)</th>
                          <th className="px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-stone-800">
                        {parsedData.goats.slice(0, 5).map((g, i) => (
                          <tr key={i} className="hover:bg-stone-50">
                            <td className="px-3 py-2 font-mono font-bold text-emerald-700">{g.tag_number}</td>
                            <td className="px-3 py-2">{g.breed}</td>
                            <td className="px-3 py-2">
                              <span
                                className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                                  g.gender === 'Female' ? 'bg-rose-50 text-rose-700' : 'bg-sky-50 text-sky-700'
                                }`}
                              >
                                {g.gender}
                              </span>
                            </td>
                            <td className="px-3 py-2">{g.dob}</td>
                            <td className="px-3 py-2">{g.weight_kg} kg</td>
                            <td className="px-3 py-2 font-medium">{g.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {category === 'breeding' && (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 text-stone-600 uppercase font-mono text-[10px] tracking-wider border-b border-stone-200 sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Female (Doe)</th>
                          <th className="px-3 py-2">Male (Buck)</th>
                          <th className="px-3 py-2">Mating Date</th>
                          <th className="px-3 py-2">Gestation</th>
                          <th className="px-3 py-2">Expected Kidding</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-stone-800">
                        {parsedData.breeding.slice(0, 5).map((b, i) => (
                          <tr key={i} className="hover:bg-stone-50">
                            <td className="px-3 py-2 font-bold text-emerald-700">{b.female_id}</td>
                            <td className="px-3 py-2">{b.male_id}</td>
                            <td className="px-3 py-2">{b.mating_date}</td>
                            <td className="px-3 py-2">{b.gestation_days} days</td>
                            <td className="px-3 py-2 font-semibold text-amber-700">{b.expected_birth}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {category === 'health' && (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 text-stone-600 uppercase font-mono text-[10px] tracking-wider border-b border-stone-200 sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Goat Tag</th>
                          <th className="px-3 py-2">Condition</th>
                          <th className="px-3 py-2">Treatment</th>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Vet</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-stone-800">
                        {parsedData.health.slice(0, 5).map((h, i) => (
                          <tr key={i} className="hover:bg-stone-50">
                            <td className="px-3 py-2 font-bold text-emerald-700">{h.goat_id}</td>
                            <td className="px-3 py-2 font-medium text-rose-700">{h.condition}</td>
                            <td className="px-3 py-2">{h.treatment}</td>
                            <td className="px-3 py-2">{h.checkup_date}</td>
                            <td className="px-3 py-2 text-stone-500">{h.vet_name || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {category === 'milk' && (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 text-stone-600 uppercase font-mono text-[10px] tracking-wider border-b border-stone-200 sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Doe Tag</th>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Morning (L)</th>
                          <th className="px-3 py-2">Evening (L)</th>
                          <th className="px-3 py-2">Total Liters</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-stone-800">
                        {parsedData.milk.slice(0, 5).map((m, i) => (
                          <tr key={i} className="hover:bg-stone-50">
                            <td className="px-3 py-2 font-bold text-emerald-700">{m.goat_id}</td>
                            <td className="px-3 py-2">{m.date}</td>
                            <td className="px-3 py-2">{m.morning_liters} L</td>
                            <td className="px-3 py-2">{m.evening_liters} L</td>
                            <td className="px-3 py-2 font-bold text-emerald-800">{m.total_liters} L</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 bg-stone-50/80">
          <div className="text-xs text-stone-500">
            {getRecordCount() > 0 ? (
              <span className="font-semibold text-emerald-700">
                Ready to import {getRecordCount()} {category} record(s)
              </span>
            ) : (
              <span>Upload a spreadsheet to preview and import</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2 border border-stone-300 hover:bg-stone-100 text-stone-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              id="btn-confirm-excel-import"
              onClick={handleImportSubmit}
              disabled={getRecordCount() === 0 || isImporting}
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <span>Import {getRecordCount()} Records</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
