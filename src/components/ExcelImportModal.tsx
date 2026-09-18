import React, { useState, useRef, useMemo } from 'react';
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
  Database,
  Columns,
  Layers,
  Sparkles,
  Baby,
  Stethoscope,
  Milk,
  Check,
  RefreshCw,
  Info,
  SlidersHorizontal
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: 'goats' | 'breeding' | 'health' | 'milk' | 'all';
}

interface ColumnMapping {
  field: string;
  label: string;
  matchedCol: string | null;
  confidence: number;
  category: 'goat' | 'breeding' | 'health' | 'milk';
}

interface GoatRowWithMeta extends Omit<GoatRecord, 'id' | 'created_at'> {
  rawStatusText: string;
  breedingPayload?: Omit<BreedingRecord, 'id'>;
  healthPayload?: Omit<HealthRecord, 'id'>;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'goats',
}) => {
  const { importBatchRecords } = useFarm();

  const [category, setCategory] = useState<'goats' | 'breeding' | 'health' | 'milk' | 'all'>(defaultCategory);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [previewTab, setPreviewTab] = useState<'goats' | 'breeding' | 'health' | 'mappings' | 'raw'>('goats');

  const [parsedData, setParsedData] = useState<{
    goats: GoatRowWithMeta[];
    breeding: Omit<BreedingRecord, 'id'>[];
    health: Omit<HealthRecord, 'id'>[];
    milk: Omit<MilkRecord, 'id'>[];
  }>({ goats: [], breeding: [], health: [], milk: [] });

  const [detectedMappings, setDetectedMappings] = useState<ColumnMapping[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    goats: number;
    breeding: number;
    health: number;
    milk: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute all unique column headers across all uploaded rows so no column is missed
  const allDetectedColumns = useMemo(() => {
    if (!rawRows || rawRows.length === 0) return [];
    const colSet = new Set<string>();
    rawRows.slice(0, 100).forEach(row => {
      Object.keys(row).forEach(k => {
        if (k && String(k).trim()) {
          colSet.add(String(k).trim());
        }
      });
    });
    return Array.from(colSet);
  }, [rawRows]);

  if (!isOpen) return null;

  // Helper to parse Excel dates (serial numbers, ISO, DD/MM/YYYY, MM/DD/YYYY)
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
    if (!str) return new Date().toISOString().split('T')[0];

    // Try standard JS date parsing
    const dateObj = new Date(str);
    if (!isNaN(dateObj.getTime()) && str.includes('-') && str.length >= 8) {
      return dateObj.toISOString().split('T')[0];
    }
    // Handle DD/MM/YYYY or MM/DD/YYYY
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

  // Find matching column header by aliases
  const findColumnMatch = (availableCols: string[], aliases: string[]): { col: string | null; confidence: number } => {
    for (const alias of aliases) {
      const cleanAlias = cleanKey(alias);
      // 1. Exact match on cleaned key
      const exact = availableCols.find(c => cleanKey(c) === cleanAlias);
      if (exact) return { col: exact, confidence: 100 };
    }
    for (const alias of aliases) {
      const cleanAlias = cleanKey(alias);
      // 2. Substring match
      const sub = availableCols.find(c => cleanKey(c).includes(cleanAlias) || cleanAlias.includes(cleanKey(c)));
      if (sub) return { col: sub, confidence: 80 };
    }
    return { col: null, confidence: 0 };
  };

  // Comprehensive Smart Column Inspector and Multi-Entity Extraction
  const inspectAndProcessRows = (rows: any[]) => {
    if (!rows || rows.length === 0) return;

    // 1. Collect all columns
    const cols = Array.from(
      new Set(
        rows.slice(0, 50).flatMap(r => Object.keys(r).map(k => String(k).trim()))
      )
    );

    // 2. Define field definitions and aliases
    const fieldDefinitions: {
      field: string;
      label: string;
      category: 'goat' | 'breeding' | 'health' | 'milk';
      aliases: string[];
    }[] = [
      {
        field: 'tag_number',
        label: 'Tag Number / ID',
        category: 'goat',
        aliases: ['tag', 'tagnumber', 'tagno', 'tag#', 'goatid', 'eartag', 'animalid', 'id', 'identification', 'animal', 'goattag'],
      },
      {
        field: 'name',
        label: 'Goat Name',
        category: 'goat',
        aliases: ['name', 'goatname', 'nickname', 'identifier', 'animalname', 'title'],
      },
      {
        field: 'breed',
        label: 'Breed',
        category: 'goat',
        aliases: ['breed', 'breedtype', 'variety', 'type', 'genetics'],
      },
      {
        field: 'gender',
        label: 'Gender / Sex',
        category: 'goat',
        aliases: ['gender', 'sex', 'g'],
      },
      {
        field: 'dob',
        label: 'Date of Birth',
        category: 'goat',
        aliases: ['dob', 'dateofbirth', 'birthdate', 'birth', 'born', 'age'],
      },
      {
        field: 'weight_kg',
        label: 'Live Weight (kg)',
        category: 'goat',
        aliases: ['weight', 'weightkg', 'weightinkg', 'wt', 'liveweight', 'currentweight'],
      },
      {
        field: 'status',
        label: 'Goat / Reproductive Status',
        category: 'goat',
        aliases: ['status', 'goatstatus', 'state', 'healthstatus', 'reproductivestatus', 'condition', 'stage', 'pregnancy'],
      },
      // Breeding fields
      {
        field: 'mating_date',
        label: 'Mating / Service Date',
        category: 'breeding',
        aliases: ['matingdate', 'datebred', 'servicedate', 'serveddate', 'breedingdate', 'inseminationdate', 'dateserved', 'matedate'],
      },
      {
        field: 'expected_birth',
        label: 'Expected Kidding Date',
        category: 'breeding',
        aliases: ['expectedbirth', 'expectedkidding', 'duedate', 'deliverydate', 'kiddingdate', 'expecteddelivery', 'kiddingdue', 'birthdue'],
      },
      {
        field: 'male_id',
        label: 'Sire / Buck ID',
        category: 'breeding',
        aliases: ['sire', 'buck', 'maleid', 'buckid', 'male', 'siretag', 'father'],
      },
      {
        field: 'gestation_days',
        label: 'Gestation Days',
        category: 'breeding',
        aliases: ['gestationdays', 'gestation', 'gestationperiod'],
      },
      // Health fields
      {
        field: 'health_condition',
        label: 'Health Condition / Diagnosis',
        category: 'health',
        aliases: ['condition', 'diagnosis', 'issue', 'sickness', 'illness', 'healthissue'],
      },
      {
        field: 'health_treatment',
        label: 'Treatment / Vaccine',
        category: 'health',
        aliases: ['treatment', 'medication', 'action', 'therapy', 'vaccine', 'vaccination', 'dewormer', 'deworming', 'drench'],
      },
      {
        field: 'health_date',
        label: 'Treatment / Checkup Date',
        category: 'health',
        aliases: ['treatmentdate', 'checkupdate', 'healthdate', 'vacdate', 'date'],
      },
      {
        field: 'health_vet',
        label: 'Veterinarian / Officer',
        category: 'health',
        aliases: ['vet', 'vetname', 'doctor', 'officer', 'practitioner'],
      },
      // Milk fields
      {
        field: 'morning_liters',
        label: 'Morning Liters',
        category: 'milk',
        aliases: ['morningliters', 'morning', 'am', 'morningmilk'],
      },
      {
        field: 'evening_liters',
        label: 'Evening Liters',
        category: 'milk',
        aliases: ['eveningliters', 'evening', 'pm', 'eveningmilk'],
      },
      {
        field: 'milk_date',
        label: 'Milk Date',
        category: 'milk',
        aliases: ['milkdate', 'productiondate'],
      },
    ];

    const computedMappings: ColumnMapping[] = fieldDefinitions.map(f => {
      const match = findColumnMatch(cols, f.aliases);
      return {
        field: f.field,
        label: f.label,
        matchedCol: match.col,
        confidence: match.confidence,
        category: f.category,
      };
    });

    setDetectedMappings(computedMappings);

    // Create a fast lookup map: fieldName -> colName
    const colFor = (fieldName: string): string | null => {
      const found = computedMappings.find(m => m.field === fieldName);
      return found?.matchedCol || null;
    };

    // 3. Inspect every row and map to Goats, Breeding, Health, and Milk
    const mappedGoats: GoatRowWithMeta[] = [];
    const mappedBreeding: Omit<BreedingRecord, 'id'>[] = [];
    const mappedHealth: Omit<HealthRecord, 'id'>[] = [];
    const mappedMilk: Omit<MilkRecord, 'id'>[] = [];

    // Helper to extract value from row
    const getVal = (row: any, fieldName: string) => {
      const col = colFor(fieldName);
      if (col && row[col] !== undefined && row[col] !== null) {
        return row[col];
      }
      return undefined;
    };

    rows.forEach((row, idx) => {
      // 1. Tag Number
      let rawTag = getVal(row, 'tag_number');
      if (!rawTag) {
        // Fallback: search for any column with "id" or "tag"
        for (const [k, v] of Object.entries(row)) {
          const ck = cleanKey(k);
          if ((ck.includes('tag') || ck.includes('id')) && v) {
            rawTag = v;
            break;
          }
        }
      }
      const tag_number = String(rawTag || `GT-${String(idx + 1).padStart(3, '0')}`).trim();

      // 2. Name
      const name = String(getVal(row, 'name') || '').trim();

      // 3. Breed
      const breed = String(getVal(row, 'breed') || 'Boer').trim();

      // 4. Gender
      const rawGender = String(getVal(row, 'gender') || 'Female').toLowerCase();
      let gender: 'Male' | 'Female' = 'Female';
      if (
        rawGender.startsWith('m') ||
        rawGender.includes('buck') ||
        rawGender.includes('billy') ||
        rawGender.includes('ram') ||
        rawGender.includes('sire')
      ) {
        gender = 'Male';
      }

      // 5. DOB
      const dob = parseExcelDate(getVal(row, 'dob'));

      // 6. Weight
      const rawWeight = Number(getVal(row, 'weight_kg') || 45);
      const weight_kg = !isNaN(rawWeight) && rawWeight > 0 ? rawWeight : 45;

      // 7. Status & Accurate Pregnancy Detection
      // The user explicitly noted: "the excel file may contain the one pregnant but it was uploaded as one, so it should know the exactly the record to be in place, then also on the status, it should show the accurate information from the record"
      const rawStatusVal = getVal(row, 'status');
      const rawStatusText = String(rawStatusVal !== undefined && rawStatusVal !== null ? rawStatusVal : 'Active').trim();
      const lowerStatus = rawStatusText.toLowerCase();

      // Check breeding columns in the row
      const rawMatingDate = getVal(row, 'mating_date');
      const rawExpectedBirth = getVal(row, 'expected_birth');
      const rawSire = getVal(row, 'male_id');

      // Check if pregnancy is indicated either by status string OR by breeding columns
      const isPregnantIndicated =
        lowerStatus.includes('pregnant') ||
        lowerStatus.includes('in-kid') ||
        lowerStatus.includes('in kid') ||
        lowerStatus.includes('expecting') ||
        lowerStatus.includes('gestat') ||
        lowerStatus.includes('bred') ||
        lowerStatus.includes('gravid') ||
        Boolean(rawMatingDate) ||
        Boolean(rawExpectedBirth);

      let status: 'Active' | 'Sold' | 'Quarantine' | 'Pregnant' = 'Active';

      if (isPregnantIndicated && gender === 'Female') {
        status = 'Pregnant';
      } else if (lowerStatus.includes('quarantine') || lowerStatus.includes('isolate') || lowerStatus.includes('sick')) {
        status = 'Quarantine';
      } else if (lowerStatus.includes('sold') || lowerStatus.includes('cull') || lowerStatus.includes('disposed')) {
        status = 'Sold';
      } else {
        status = 'Active';
      }

      // -------------------------------------------------------------
      // AUTOMATIC RECORD PLACEMENT 1: PREGNANT DOE -> BREEDING RECORD
      // -------------------------------------------------------------
      let attachedBreeding: Omit<BreedingRecord, 'id'> | undefined;

      if (status === 'Pregnant' && gender === 'Female') {
        // Determine Mating Date and Expected Kidding Date
        let mating_date: string;
        let expected_birth: string;
        const gestation_days = Number(getVal(row, 'gestation_days') || 150) || 150;

        if (rawMatingDate) {
          mating_date = parseExcelDate(rawMatingDate);
          const mDate = new Date(mating_date);
          mDate.setDate(mDate.getDate() + gestation_days);
          expected_birth = mDate.toISOString().split('T')[0];
        } else if (rawExpectedBirth) {
          expected_birth = parseExcelDate(rawExpectedBirth);
          const eDate = new Date(expected_birth);
          eDate.setDate(eDate.getDate() - gestation_days);
          mating_date = eDate.toISOString().split('T')[0];
        } else {
          // No date specified in file: estimate active mid-gestation (60 days ago)
          const todayDate = new Date();
          const estMating = new Date(todayDate);
          estMating.setDate(estMating.getDate() - 60);
          mating_date = estMating.toISOString().split('T')[0];

          const estDue = new Date(estMating);
          estDue.setDate(estDue.getDate() + gestation_days);
          expected_birth = estDue.toISOString().split('T')[0];
        }

        const male_id = String(rawSire || 'BUCK-01').trim();

        attachedBreeding = {
          female_id: tag_number,
          male_id,
          mating_date,
          expected_birth,
          gestation_days,
          status: 'Active',
          notes: `Auto-synchronized from imported herd master record (${rawStatusText})`,
        };

        mappedBreeding.push(attachedBreeding);
      }

      // -------------------------------------------------------------
      // AUTOMATIC RECORD PLACEMENT 2: HEALTH / TREATMENT DATA
      // -------------------------------------------------------------
      let attachedHealth: Omit<HealthRecord, 'id'> | undefined;
      const rawCondition = getVal(row, 'health_condition');
      const rawTreatment = getVal(row, 'health_treatment');
      const rawVet = getVal(row, 'health_vet');
      const rawHealthDate = getVal(row, 'health_date');

      if (rawCondition || rawTreatment) {
        const condition = String(rawCondition || (status === 'Quarantine' ? 'Isolated for Observation' : 'Routine Herd Inspection')).trim();
        const treatment = String(rawTreatment || 'Administered Routine Maintenance Care').trim();
        const checkup_date = parseExcelDate(rawHealthDate || row['date']);
        const vet_name = String(rawVet || 'Farm Veterinary Care').trim();

        let checkup_type: 'Vaccination' | 'Deworming' | 'Routine' = 'Routine';
        const treatLower = treatment.toLowerCase();
        if (treatLower.includes('vaccin') || treatLower.includes('cd/t') || treatLower.includes('ppr')) {
          checkup_type = 'Vaccination';
        } else if (treatLower.includes('deworm') || treatLower.includes('drench') || treatLower.includes('albendazole')) {
          checkup_type = 'Deworming';
        }

        attachedHealth = {
          goat_id: tag_number,
          condition,
          treatment,
          checkup_date,
          checkup_type,
          status: 'Healthy',
          vet_name,
        };

        mappedHealth.push(attachedHealth);
      }

      // -------------------------------------------------------------
      // AUTOMATIC RECORD PLACEMENT 3: MILK DATA
      // -------------------------------------------------------------
      const rawMorning = getVal(row, 'morning_liters');
      const rawEvening = getVal(row, 'evening_liters');
      if (rawMorning !== undefined || rawEvening !== undefined) {
        const morning_liters = Number(rawMorning || 0);
        const evening_liters = Number(rawEvening || 0);
        const total_liters = Number((morning_liters + evening_liters).toFixed(2));
        if (total_liters > 0) {
          mappedMilk.push({
            goat_id: tag_number,
            date: parseExcelDate(getVal(row, 'milk_date')),
            morning_liters,
            evening_liters,
            total_liters,
          });
        }
      }

      mappedGoats.push({
        tag_number,
        name: name || undefined,
        breed,
        gender,
        dob,
        weight_kg,
        status,
        rawStatusText,
        breedingPayload: attachedBreeding,
        healthPayload: attachedHealth,
      });
    });

    setParsedData({
      goats: mappedGoats,
      breeding: mappedBreeding,
      health: mappedHealth,
      milk: mappedMilk,
    });

    // Automatically set default view tab
    if (mappedBreeding.length > 0) {
      setPreviewTab('goats');
    }
  };

  // Process Workbook File
  const processWorkbook = (file: File) => {
    setIsProcessing(true);
    setErrorMsg(null);
    setImportSummary(null);

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
        inspectAndProcessRows(rows);
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
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      setErrorMsg('Unsupported file format. Please upload an Excel document (.xlsx, .xls) or a CSV file (.csv).');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('File size exceeds 20MB limit. Please upload a smaller sheet.');
      return;
    }

    setSelectedFile(file);
    processWorkbook(file);
  };

  // Drag and Drop
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
        inspectAndProcessRows(rows);
        setIsProcessing(false);
      } catch {
        setErrorMsg(`Unable to load sheet "${sheetName}".`);
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Master Herd Sheet (with pregnant doe and health info in one place!)
    const masterHerdTemplate = [
      {
        'Tag Number': 'GT-101',
        'Name': 'Bella',
        'Breed': 'Boer',
        'Gender': 'Female',
        'Date of Birth': '2023-04-12',
        'Weight (kg)': 48,
        'Status': 'Pregnant',
        'Date Bred': '2026-01-15',
        'Expected Kidding': '2026-06-14',
        'Sire (Buck)': 'BK-102',
        'Treatment': 'CD/T Vaccination',
        'Treatment Date': '2026-05-15'
      },
      {
        'Tag Number': 'BK-102',
        'Name': 'Thor',
        'Breed': 'Kalahari Red',
        'Gender': 'Male',
        'Date of Birth': '2022-08-20',
        'Weight (kg)': 72,
        'Status': 'Active',
        'Date Bred': '',
        'Expected Kidding': '',
        'Sire (Buck)': '',
        'Treatment': 'Albendazole Dewormer',
        'Treatment Date': '2026-07-01'
      },
      {
        'Tag Number': 'GT-103',
        'Name': 'Luna',
        'Breed': 'Saanen',
        'Gender': 'Female',
        'Date of Birth': '2024-01-10',
        'Weight (kg)': 42,
        'Status': 'Pregnant',
        'Date Bred': '2026-02-01',
        'Expected Kidding': '2026-07-01',
        'Sire (Buck)': 'BK-102',
        'Treatment': '',
        'Treatment Date': ''
      },
      {
        'Tag Number': 'GT-104',
        'Name': 'Daisy',
        'Breed': 'Anglo-Nubian',
        'Gender': 'Female',
        'Date of Birth': '2023-11-05',
        'Weight (kg)': 39,
        'Status': 'Quarantine',
        'Date Bred': '',
        'Expected Kidding': '',
        'Sire (Buck)': '',
        'Treatment': 'Oxytetracycline 200 LA for Foot Scald',
        'Treatment Date': '2026-09-10'
      }
    ];

    const wsMaster = XLSX.utils.json_to_sheet(masterHerdTemplate);
    XLSX.utils.book_append_sheet(wb, wsMaster, 'Herd Master (Auto-Route)');
    XLSX.writeFile(wb, 'Smart_Goat_Farm_Master_Records_Template.xlsx');
  };

  // Perform Complete Synchronized Import
  const handleImportSubmit = async () => {
    setIsImporting(true);
    setErrorMsg(null);
    try {
      // Build clean payload with accurate types
      const cleanGoats: Omit<GoatRecord, 'id' | 'created_at'>[] = parsedData.goats.map(g => ({
        tag_number: g.tag_number,
        name: g.name,
        breed: g.breed,
        gender: g.gender,
        dob: g.dob,
        weight_kg: g.weight_kg,
        status: g.status,
      }));

      const payload = {
        goats: cleanGoats.length > 0 ? cleanGoats : undefined,
        breeding: parsedData.breeding.length > 0 ? parsedData.breeding : undefined,
        health: parsedData.health.length > 0 ? parsedData.health : undefined,
        milk: parsedData.milk.length > 0 ? parsedData.milk : undefined,
      };

      const result = await importBatchRecords(payload);

      setImportSummary({
        total: result.totalImported,
        goats: cleanGoats.length,
        breeding: parsedData.breeding.length,
        health: parsedData.health.length,
        milk: parsedData.milk.length,
      });
    } catch (err: any) {
      console.error('Batch import failed:', err);
      setErrorMsg('Error importing records: ' + (err.message || 'Unknown error'));
    } finally {
      setIsImporting(false);
    }
  };

  const totalRecordsToImport =
    parsedData.goats.length +
    parsedData.breeding.length +
    parsedData.health.length +
    parsedData.milk.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <span>Smart Spreadsheet Inspector & Master Herd Uploader</span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  <Sparkles className="w-3 h-3" />
                  Auto-Routing Enabled
                </span>
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Inspects spreadsheet columns, matches fields accurately, and auto-routes pregnant does and health logs to their respective database registries.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Success Banner */}
          {importSummary !== null && (
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 space-y-3">
              <div className="flex items-center gap-2.5 font-extrabold text-base">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Successfully imported & placed {importSummary.total} total records!</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                <div className="p-2.5 bg-white/80 dark:bg-stone-900/80 rounded-xl border border-emerald-200 dark:border-emerald-800/80">
                  <span className="text-stone-500 dark:text-stone-400 block text-[11px]">Herd Goats:</span>
                  <strong className="text-sm text-stone-900 dark:text-white">🐐 {importSummary.goats} Goats</strong>
                </div>
                <div className="p-2.5 bg-white/80 dark:bg-stone-900/80 rounded-xl border border-emerald-200 dark:border-emerald-800/80">
                  <span className="text-stone-500 dark:text-stone-400 block text-[11px]">Breeding Registry:</span>
                  <strong className="text-sm text-purple-700 dark:text-purple-300">🤰 {importSummary.breeding} Pregnant Does</strong>
                </div>
                <div className="p-2.5 bg-white/80 dark:bg-stone-900/80 rounded-xl border border-emerald-200 dark:border-emerald-800/80">
                  <span className="text-stone-500 dark:text-stone-400 block text-[11px]">Health Ledger:</span>
                  <strong className="text-sm text-amber-700 dark:text-amber-300">🩺 {importSummary.health} Health Records</strong>
                </div>
                <div className="p-2.5 bg-white/80 dark:bg-stone-900/80 rounded-xl border border-emerald-200 dark:border-emerald-800/80">
                  <span className="text-stone-500 dark:text-stone-400 block text-[11px]">Milk Yield:</span>
                  <strong className="text-sm text-emerald-700 dark:text-emerald-300">🥛 {importSummary.milk} Milk Logs</strong>
                </div>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-200">
                All records have been written directly to your real-time database. You can now view them in the Herd Ledger, Breeding Estimator, and Pending Tasks.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  Done & View Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setRawRows([]);
                    setImportSummary(null);
                  }}
                  className="px-3 py-2 bg-white dark:bg-stone-800 hover:bg-emerald-100 dark:hover:bg-stone-700 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Upload Another Document
                </button>
              </div>
            </div>
          )}

          {/* Template Download Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700">
            <div className="flex items-center gap-2.5">
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-stone-900 dark:text-white">
                  Need an all-in-one spreadsheet template?
                </div>
                <div className="text-[11px] text-stone-500 dark:text-stone-400">
                  Download our official template supporting tags, accurate pregnancy statuses, breeding dates, and health records in a single sheet.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-300 dark:border-stone-600 rounded-lg text-xs font-semibold transition-colors shrink-0 shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Download Master Template (.xlsx)</span>
            </button>
          </div>

          {/* Drag & Drop File Zone */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
              Select or drag your spreadsheet document (.xlsx, .xls, .csv)
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40'
                  : 'border-stone-300 dark:border-stone-700 hover:border-emerald-500 bg-stone-50/50 dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800'
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
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    {selectedFile ? selectedFile.name : 'Click to select document or drag & drop here'}
                  </span>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                    Single master files with mixed statuses (Pregnant, Active, Quarantine) are inspected and automatically routed.
                  </p>
                </div>
                {selectedFile && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 text-xs font-semibold">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Multiple Sheets Selector if present */}
          {sheetNames.length > 1 && (
            <div className="flex items-center gap-2 p-3 bg-stone-100 dark:bg-stone-800 rounded-xl">
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 shrink-0">Workbook Sheet:</span>
              <div className="flex flex-wrap gap-1.5">
                {sheetNames.map(name => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleSheetSelect(name)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      activeSheet === name
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-600 border border-stone-300 dark:border-stone-600'
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
            <div className="py-8 flex flex-col items-center justify-center text-stone-500 dark:text-stone-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold">Inspecting columns, matching records, and verifying statuses...</span>
            </div>
          )}

          {/* Inspector & Synchronized Data Preview */}
          {!isProcessing && rawRows.length > 0 && (
            <div className="space-y-4">
              {/* 1. Intelligent Inspection Summary Banner */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="text-xs font-extrabold text-stone-900 dark:text-white uppercase tracking-wider">
                      File Inspection & Auto-Routing Summary
                    </h4>
                  </div>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full font-semibold">
                    {allDetectedColumns.length} Columns Detected &bull; {rawRows.length} Rows Processed
                  </span>
                </div>

                {/* Routing Breakdown Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-3 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                      <span>🐐</span>
                      <span>Herd Goats:</span>
                    </div>
                    <div className="text-lg font-black text-stone-900 dark:text-white mt-1">
                      {parsedData.goats.length}
                    </div>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400">
                      Registered in Goat Ledger
                    </span>
                  </div>

                  <div className="p-3 bg-purple-50/60 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800/60">
                    <div className="flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-300 font-bold">
                      <Baby className="w-3.5 h-3.5" />
                      <span>Pregnant Does:</span>
                    </div>
                    <div className="text-lg font-black text-purple-900 dark:text-purple-200 mt-1">
                      {parsedData.breeding.length}
                    </div>
                    <span className="text-[10px] text-purple-700 dark:text-purple-300">
                      Auto-placed in Breeding Estimator
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50/60 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60">
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 font-bold">
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>Health Logs:</span>
                    </div>
                    <div className="text-lg font-black text-amber-900 dark:text-amber-200 mt-1">
                      {parsedData.health.length}
                    </div>
                    <span className="text-[10px] text-amber-700 dark:text-amber-300">
                      Auto-placed in Veterinary Ledger
                    </span>
                  </div>

                  <div className="p-3 bg-teal-50/60 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800/60">
                    <div className="flex items-center gap-1.5 text-xs text-teal-700 dark:text-teal-300 font-bold">
                      <Milk className="w-3.5 h-3.5" />
                      <span>Milk Records:</span>
                    </div>
                    <div className="text-lg font-black text-teal-900 dark:text-teal-200 mt-1">
                      {parsedData.milk.length}
                    </div>
                    <span className="text-[10px] text-teal-700 dark:text-teal-300">
                      Auto-placed in Milk Yield
                    </span>
                  </div>
                </div>
              </div>

              {/* View Selector Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('goats')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      previewTab === 'goats'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                    }`}
                  >
                    <span>🐐 Herd Ledger ({parsedData.goats.length})</span>
                  </button>

                  {parsedData.breeding.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPreviewTab('breeding')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        previewTab === 'breeding'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-purple-700 dark:text-purple-300 hover:bg-purple-100/50'
                      }`}
                    >
                      <Baby className="w-3.5 h-3.5" />
                      <span>🤰 Pregnant Does ({parsedData.breeding.length})</span>
                    </button>
                  )}

                  {parsedData.health.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPreviewTab('health')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        previewTab === 'health'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-amber-700 dark:text-amber-300 hover:bg-amber-100/50'
                      }`}
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>🩺 Health Logs ({parsedData.health.length})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setPreviewTab('mappings')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      previewTab === 'mappings'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Column Mappings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewTab('raw')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      previewTab === 'raw'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                    }`}
                  >
                    <Columns className="w-3.5 h-3.5 text-stone-500" />
                    <span>Raw Columns ({allDetectedColumns.length})</span>
                  </button>
                </div>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">
                  Showing first {Math.min(rawRows.length, 10)} records
                </span>
              </div>

              {/* TAB 1: Herd Ledger Preview with Accurate Statuses */}
              {previewTab === 'goats' && (
                <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden bg-white dark:bg-stone-850 shadow-xs">
                  <div className="overflow-x-auto max-h-64">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 dark:bg-stone-900/60 text-stone-600 dark:text-stone-300 uppercase font-mono text-[10px] tracking-wider border-b border-stone-200 dark:border-stone-800 sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Tag No</th>
                          <th className="px-3 py-2">Name</th>
                          <th className="px-3 py-2">Breed</th>
                          <th className="px-3 py-2">Gender</th>
                          <th className="px-3 py-2">DOB</th>
                          <th className="px-3 py-2">Weight</th>
                          <th className="px-3 py-2">System Status</th>
                          <th className="px-3 py-2">Original Record Status</th>
                          <th className="px-3 py-2">Auto-Routing Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-800 dark:text-stone-200">
                        {parsedData.goats.slice(0, 10).map((g, i) => {
                          let statusBadge = (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                              Active
                            </span>
                          );
                          if (g.status === 'Pregnant') {
                            statusBadge = (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                                🤰 Pregnant
                              </span>
                            );
                          } else if (g.status === 'Quarantine') {
                            statusBadge = (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                                🟡 Quarantine
                              </span>
                            );
                          } else if (g.status === 'Sold') {
                            statusBadge = (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                                ⚪ Sold
                              </span>
                            );
                          }

                          return (
                            <tr key={i} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                              <td className="px-3 py-2 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                {g.tag_number}
                              </td>
                              <td className="px-3 py-2 font-medium">{g.name || '—'}</td>
                              <td className="px-3 py-2">{g.breed}</td>
                              <td className="px-3 py-2">
                                <span
                                  className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                                    g.gender === 'Female'
                                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                      : 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                                  }`}
                                >
                                  {g.gender}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-stone-600 dark:text-stone-400">{g.dob}</td>
                              <td className="px-3 py-2">{g.weight_kg} kg</td>
                              <td className="px-3 py-2">{statusBadge}</td>
                              <td className="px-3 py-2 text-stone-700 dark:text-stone-300 font-mono text-[11px]">
                                &ldquo;{g.rawStatusText}&rdquo;
                              </td>
                              <td className="px-3 py-2 text-[11px]">
                                {g.breedingPayload && (
                                  <span className="inline-flex items-center gap-1 text-purple-700 dark:text-purple-300 font-semibold bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md">
                                    <Baby className="w-3 h-3" />
                                    <span>Breeding (Due: {g.breedingPayload.expected_birth})</span>
                                  </span>
                                )}
                                {g.healthPayload && (
                                  <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md ml-1">
                                    <Stethoscope className="w-3 h-3" />
                                    <span>Health Log</span>
                                  </span>
                                )}
                                {!g.breedingPayload && !g.healthPayload && (
                                  <span className="text-stone-400 text-[10px]">Standard Herd Entry</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: Auto-Routed Pregnant Does */}
              {previewTab === 'breeding' && (
                <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden bg-white dark:bg-stone-850 shadow-xs">
                  <div className="p-3 bg-purple-50/70 dark:bg-purple-950/60 border-b border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 flex items-center gap-2">
                    <Baby className="w-4 h-4 text-purple-700 dark:text-purple-400 shrink-0" />
                    <span>
                      The following does were detected as Pregnant from your spreadsheet and will be automatically registered in your <strong>Breeding & Kidding Predictor</strong> with active countdowns!
                    </span>
                  </div>
                  <div className="overflow-x-auto max-h-64">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 dark:bg-stone-900/60 text-stone-600 dark:text-stone-300 uppercase font-mono text-[10px] tracking-wider border-b border-stone-200 dark:border-stone-800 sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Female Doe Tag</th>
                          <th className="px-3 py-2">Sire / Buck</th>
                          <th className="px-3 py-2">Mating / Service Date</th>
                          <th className="px-3 py-2">Gestation Period</th>
                          <th className="px-3 py-2">Expected Kidding Date</th>
                          <th className="px-3 py-2">Registry Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-800 dark:text-stone-200">
                        {parsedData.breeding.slice(0, 10).map((b, i) => (
                          <tr key={i} className="hover:bg-purple-50/30 dark:hover:bg-purple-950/30">
                            <td className="px-3 py-2 font-mono font-bold text-purple-700 dark:text-purple-300">
                              {b.female_id}
                            </td>
                            <td className="px-3 py-2 font-mono">{b.male_id}</td>
                            <td className="px-3 py-2">{b.mating_date}</td>
                            <td className="px-3 py-2">{b.gestation_days} days</td>
                            <td className="px-3 py-2 font-bold text-amber-600 dark:text-amber-400">
                              {b.expected_birth}
                            </td>
                            <td className="px-3 py-2 text-stone-500 dark:text-stone-400 text-[11px]">
                              {b.notes}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: Auto-Routed Health Logs */}
              {previewTab === 'health' && (
                <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden bg-white dark:bg-stone-850 shadow-xs">
                  <div className="p-3 bg-amber-50/70 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                    <span>
                      The following health treatments and vaccinations were detected and will be automatically registered in your <strong>Health & Veterinary Ledger</strong>!
                    </span>
                  </div>
                  <div className="overflow-x-auto max-h-64">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 dark:bg-stone-900/60 text-stone-600 dark:text-stone-300 uppercase font-mono text-[10px] tracking-wider border-b border-stone-200 dark:border-stone-800 sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Goat Tag</th>
                          <th className="px-3 py-2">Condition</th>
                          <th className="px-3 py-2">Treatment / Drug</th>
                          <th className="px-3 py-2">Checkup Date</th>
                          <th className="px-3 py-2">Checkup Type</th>
                          <th className="px-3 py-2">Veterinarian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-800 dark:text-stone-200">
                        {parsedData.health.slice(0, 10).map((h, i) => (
                          <tr key={i} className="hover:bg-amber-50/30 dark:hover:bg-amber-950/30">
                            <td className="px-3 py-2 font-mono font-bold text-amber-700 dark:text-amber-300">
                              {h.goat_id}
                            </td>
                            <td className="px-3 py-2 font-medium">{h.condition}</td>
                            <td className="px-3 py-2 font-semibold text-stone-900 dark:text-white">
                              {h.treatment}
                            </td>
                            <td className="px-3 py-2">{h.checkup_date}</td>
                            <td className="px-3 py-2">
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[10px] font-bold">
                                {h.checkup_type}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-stone-500 dark:text-stone-400">
                              {h.vet_name || 'Farm Care'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: Column Inspector & Mappings */}
              {previewTab === 'mappings' && (
                <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden bg-white dark:bg-stone-850 shadow-xs p-4 space-y-3">
                  <div className="text-xs text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-emerald-600" />
                    <span>
                      Our smart column inspector inspected your document headers and mapped them to database fields:
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {detectedMappings.map((mapItem, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                          mapItem.matchedCol
                            ? 'bg-stone-50 dark:bg-stone-800/80 border-emerald-300 dark:border-emerald-800'
                            : 'bg-stone-50/40 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 opacity-60'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-stone-900 dark:text-white">
                            {mapItem.label}
                          </div>
                          <div className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                            Field: {mapItem.field}
                          </div>
                        </div>

                        <div className="text-right">
                          {mapItem.matchedCol ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono text-[11px] font-bold">
                              <Check className="w-3 h-3" />
                              &ldquo;{mapItem.matchedCol}&rdquo;
                            </span>
                          ) : (
                            <span className="text-[11px] text-stone-400 italic">
                              (Not in file &bull; defaults used)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: Raw File Columns View */}
              {previewTab === 'raw' && (
                <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden bg-white dark:bg-stone-850 shadow-xs">
                  <div className="overflow-x-auto max-h-64">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-stone-100 dark:bg-stone-900/60 text-stone-700 dark:text-stone-300 uppercase font-mono text-[10px] tracking-wider border-b border-stone-200 dark:border-stone-800 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-stone-500 w-10 text-center">#</th>
                          {allDetectedColumns.map((col, idx) => (
                            <th key={idx} className="px-3 py-2 font-bold border-r border-stone-200/60 dark:border-stone-800 last:border-0">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-800 dark:text-stone-200 font-mono text-xs">
                        {rawRows.slice(0, 10).map((row, rowIdx) => (
                          <tr key={rowIdx} className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 transition-colors">
                            <td className="px-3 py-2 text-stone-500 text-center font-sans text-[11px] bg-stone-50/50 dark:bg-stone-900/40">
                              {rowIdx + 1}
                            </td>
                            {allDetectedColumns.map((col, colIdx) => (
                              <td
                                key={colIdx}
                                className="px-3 py-2 border-r border-stone-100 dark:border-stone-800 last:border-0"
                              >
                                {row[col] !== undefined && row[col] !== null && String(row[col]).trim() !== '' ? (
                                  <span>{String(row[col])}</span>
                                ) : (
                                  <span className="text-stone-300 dark:text-stone-600 italic">—</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/80 gap-3">
          <div className="text-xs text-stone-500 dark:text-stone-400">
            {totalRecordsToImport > 0 ? (
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                Ready to import: {parsedData.goats.length} Goats
                {parsedData.breeding.length > 0 && ` • ${parsedData.breeding.length} Pregnant Does`}
                {parsedData.health.length > 0 && ` • ${parsedData.health.length} Health Logs`}
              </span>
            ) : (
              <span>Upload a spreadsheet to inspect columns and preview records</span>
            )}
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2 border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              id="btn-confirm-excel-import"
              onClick={handleImportSubmit}
              disabled={totalRecordsToImport === 0 || isImporting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synchronizing Records...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Import All Synchronized Records ({totalRecordsToImport})</span>
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
