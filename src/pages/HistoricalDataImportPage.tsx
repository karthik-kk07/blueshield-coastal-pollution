import React, { useState, useEffect, useMemo, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { AppRoute } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import {
  listHistoricalCleanups,
  batchImportHistoricalCleanups,
  deleteHistoricalCleanup,
} from '../services/historicalCleanupService';
import { HistoricalCleanupDoc } from '../types/firestore';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Table,
  ArrowRight,
  Database,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Eye,
  Sliders,
  Calendar,
  MapPin,
  Scale,
  Users,
  Info,
  Clock,
  ExternalLink,
  ChevronRight,
  FileText,
  Sparkles,
} from 'lucide-react';

interface HistoricalDataImportPageProps {
  onNavigate: (route: AppRoute) => void;
}

// Target schema fields for historical_cleanups
const TARGET_FIELDS: { key: keyof HistoricalCleanupDoc; label: string; required: boolean; type: 'string' | 'number' | 'date' }[] = [
  { key: 'cleanupId', label: 'Cleanup ID', required: false, type: 'string' },
  { key: 'date', label: 'Cleanup Date (YYYY-MM-DD)', required: true, type: 'date' },
  { key: 'beachName', label: 'Beach / Location Name', required: true, type: 'string' },
  { key: 'zone', label: 'Coastal Zone / Sector', required: true, type: 'string' },
  { key: 'totalWasteKg', label: 'Total Waste Weight (kg)', required: true, type: 'number' },
  { key: 'plasticWasteKg', label: 'Plastic Waste Weight (kg)', required: false, type: 'number' },
  { key: 'fishingGearKg', label: 'Fishing Gear / Nets (kg)', required: false, type: 'number' },
  { key: 'glassMetalKg', label: 'Glass / Metal (kg)', required: false, type: 'number' },
  { key: 'organicKg', label: 'Organic / Driftwood (kg)', required: false, type: 'number' },
  { key: 'bagsCount', label: 'Bags Collected', required: false, type: 'number' },
  { key: 'volunteerCount', label: 'Volunteer Count', required: false, type: 'number' },
  { key: 'durationHours', label: 'Duration (Hours)', required: false, type: 'number' },
  { key: 'distanceKm', label: 'Distance Covered (km)', required: false, type: 'number' },
  { key: 'latitude', label: 'Latitude', required: false, type: 'number' },
  { key: 'longitude', label: 'Longitude', required: false, type: 'number' },
  { key: 'organization', label: 'Lead Organization / Squad', required: false, type: 'string' },
  { key: 'predominantCategory', label: 'Predominant Waste Category', required: false, type: 'string' },
  { key: 'tideCondition', label: 'Tide Condition', required: false, type: 'string' },
  { key: 'weatherCondition', label: 'Weather Condition', required: false, type: 'string' },
  { key: 'photoUrl', label: 'Photo Evidence URL', required: false, type: 'string' },
  { key: 'notes', label: 'Field Notes / Remarks', required: false, type: 'string' },
];

interface ValidatedRow {
  rowIndex: number;
  raw: Record<string, any>;
  mapped: Partial<HistoricalCleanupDoc>;
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
  warnings: string[];
}

export const HistoricalDataImportPage: React.FC<HistoricalDataImportPageProps> = ({ onNavigate }) => {
  const { user, role } = useAuth();

  // Workflow steps: 1 = Upload, 2 = Mapping & Validation, 3 = Summary & Confirm
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Uploaded file & parsed data
  const [fileName, setFileName] = useState<string>('');
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);

  // Column Mapping: targetKey -> sourceColumn
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  // Real vs Demo selection
  const [dataSourceType, setDataSourceType] = useState<'REAL_HISTORICAL' | 'DEMO'>('REAL_HISTORICAL');

  // Existing Firestore records
  const [existingRecords, setExistingRecords] = useState<HistoricalCleanupDoc[]>([]);
  const [isLoadingExisting, setIsLoadingExisting] = useState<boolean>(true);

  // Import execution state
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importSummary, setImportSummary] = useState<{
    processed: number;
    imported: number;
    rejected: number;
    duplicates: number;
    missingCritical: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load existing historical cleanups from Firestore
  useEffect(() => {
    fetchExisting();
  }, []);

  const fetchExisting = async () => {
    setIsLoadingExisting(true);
    try {
      const records = await listHistoricalCleanups(500);
      setExistingRecords(records);
    } catch (err) {
      console.warn('Failed to load existing historical cleanups:', err);
    } finally {
      setIsLoadingExisting(false);
    }
  };

  // Heuristic auto-mapping
  const autoMapHeaders = (headers: string[]) => {
    const mapping: Record<string, string> = {};
    headers.forEach((header) => {
      const cleanHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');

      TARGET_FIELDS.forEach((target) => {
        const cleanTarget = target.key.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (
          cleanHeader === cleanTarget ||
          cleanHeader.includes(cleanTarget) ||
          cleanTarget.includes(cleanHeader) ||
          (target.key === 'cleanupId' && (cleanHeader.includes('id') || cleanHeader === 'cleanupid')) ||
          (target.key === 'date' && cleanHeader.includes('date')) ||
          (target.key === 'beachName' && (cleanHeader.includes('beach') || cleanHeader.includes('location'))) ||
          (target.key === 'zone' && (cleanHeader.includes('zone') || cleanHeader.includes('sector'))) ||
          (target.key === 'totalWasteKg' && (cleanHeader.includes('total') || cleanHeader.includes('weight') || cleanHeader.includes('waste'))) ||
          (target.key === 'plasticWasteKg' && cleanHeader.includes('plastic')) ||
          (target.key === 'fishingGearKg' && (cleanHeader.includes('net') || cleanHeader.includes('gear') || cleanHeader.includes('fishing'))) ||
          (target.key === 'volunteerCount' && (cleanHeader.includes('volunteer') || cleanHeader.includes('people') || cleanHeader.includes('count'))) ||
          (target.key === 'durationHours' && (cleanHeader.includes('hour') || cleanHeader.includes('duration'))) ||
          (target.key === 'organization' && (cleanHeader.includes('org') || cleanHeader.includes('squad') || cleanHeader.includes('organizer')))
        ) {
          if (!mapping[target.key]) {
            mapping[target.key] = header;
          }
        }
      });
    });
    setColumnMapping(mapping);
  };

  // 1. Handle File Upload (CSV / XLSX)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'xlsx' || extension === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
        if (data.length > 0) {
          const headers = Object.keys(data[0]);
          setParsedHeaders(headers);
          setParsedRows(data);
          autoMapHeaders(headers);
          setCurrentStep(2);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      // CSV / TSV
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.meta.fields && results.data.length > 0) {
            setParsedHeaders(results.meta.fields);
            setParsedRows(results.data as Record<string, any>[]);
            autoMapHeaders(results.meta.fields);
            setCurrentStep(2);
          }
        },
      });
    }
  };

  // 1b. Load Official Visakhapatnam Historical Dataset (Bundled CSV)
  const handleLoadOfficialDataset = async () => {
    try {
      const res = await fetch('/historical_beach_cleanup_visakhapatnam.csv');
      const csvText = await res.text();
      setFileName('historical_beach_cleanup_visakhapatnam.csv');

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.meta.fields && results.data.length > 0) {
            setParsedHeaders(results.meta.fields);
            setParsedRows(results.data as Record<string, any>[]);
            autoMapHeaders(results.meta.fields);
            setCurrentStep(2);
          }
        },
      });
    } catch (err) {
      console.error('Failed to load official dataset:', err);
    }
  };

  // 2. Validate Data & Detect Duplicates
  const validatedRows: ValidatedRow[] = useMemo(() => {
    if (parsedRows.length === 0) return [];

    const seenIds = new Set<string>();
    const seenSignatures = new Set<string>();

    return parsedRows.map((rawRow, index) => {
      const mapped: Partial<HistoricalCleanupDoc> = {};
      const errors: string[] = [];
      const warnings: string[] = [];

      // Map values
      TARGET_FIELDS.forEach((target) => {
        const sourceHeader = columnMapping[target.key];
        const rawVal = sourceHeader ? rawRow[sourceHeader] : undefined;

        if (rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '') {
          if (target.type === 'number') {
            const num = parseFloat(String(rawVal).replace(/[^0-9.-]/g, ''));
            if (!isNaN(num)) {
              (mapped as any)[target.key] = num;
            } else {
              errors.push(`Invalid number for ${target.label}: "${rawVal}"`);
            }
          } else {
            (mapped as any)[target.key] = String(rawVal).trim();
          }
        }
      });

      // Critical Validations
      if (!mapped.date) {
        errors.push('Missing critical field: Date');
      } else {
        // Date format check
        const d = new Date(mapped.date);
        if (isNaN(d.getTime())) {
          errors.push(`Invalid date format: "${mapped.date}"`);
        }
      }

      if (!mapped.zone && !mapped.beachName) {
        errors.push('Missing critical field: Location or Zone');
      } else if (!mapped.zone && mapped.beachName) {
        mapped.zone = mapped.beachName;
      }

      if (mapped.totalWasteKg === undefined || mapped.totalWasteKg === null) {
        errors.push('Missing critical field: Total Waste Weight (kg)');
      } else if (mapped.totalWasteKg < 0) {
        errors.push(`Total waste weight cannot be negative: ${mapped.totalWasteKg} kg`);
      }

      // Optional warnings
      if (!mapped.photoUrl) {
        warnings.push('Photo reference missing (allowed)');
      }

      // Duplicate Check
      let isDuplicate = false;
      const cleanupId = mapped.cleanupId || mapped.id;
      if (cleanupId) {
        if (seenIds.has(cleanupId)) {
          isDuplicate = true;
          errors.push(`Duplicate record detected by Cleanup ID: "${cleanupId}"`);
        } else {
          seenIds.add(cleanupId);
        }
      }

      // Secondary duplicate signature: date + beachName + totalWasteKg
      const signature = `${mapped.date}_${mapped.beachName || mapped.zone}_${mapped.totalWasteKg}`;
      if (seenSignatures.has(signature)) {
        isDuplicate = true;
        if (!errors.some((e) => e.includes('Duplicate'))) {
          errors.push(`Duplicate record detected with identical date, beach, and weight.`);
        }
      } else {
        seenSignatures.add(signature);
      }

      const isValid = errors.length === 0;

      return {
        rowIndex: index + 1,
        raw: rawRow,
        mapped,
        isValid,
        isDuplicate,
        errors,
        warnings,
      };
    });
  }, [parsedRows, columnMapping]);

  // Validation Summary Stats
  const validationStats = useMemo(() => {
    const total = validatedRows.length;
    const valid = validatedRows.filter((r) => r.isValid).length;
    const duplicates = validatedRows.filter((r) => r.isDuplicate).length;
    const missingCritical = validatedRows.filter((r) =>
      r.errors.some((e) => e.includes('Missing critical field'))
    ).length;
    const rejected = total - valid;

    return { total, valid, rejected, duplicates, missingCritical };
  }, [validatedRows]);

  // 3. Execute Import to Firestore (Collection: historical_cleanups)
  const handleExecuteImport = async () => {
    const validRowsToImport = validatedRows.filter((r) => r.isValid);
    if (validRowsToImport.length === 0) return;

    setIsImporting(true);

    const now = new Date().toISOString();
    const finalDocs: HistoricalCleanupDoc[] = validRowsToImport.map((r, i) => {
      const generatedId =
        r.mapped.cleanupId ||
        `hist-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`;

      return {
        id: generatedId,
        cleanupId: r.mapped.cleanupId || generatedId,
        date: r.mapped.date!,
        beachName: r.mapped.beachName || r.mapped.zone || 'Visakhapatnam Shoreline',
        zone: r.mapped.zone || r.mapped.beachName || 'Central Urban Shoreline',
        totalWasteKg: r.mapped.totalWasteKg!,
        plasticWasteKg: r.mapped.plasticWasteKg,
        fishingGearKg: r.mapped.fishingGearKg,
        glassMetalKg: r.mapped.glassMetalKg,
        organicKg: r.mapped.organicKg,
        bagsCount: r.mapped.bagsCount,
        volunteerCount: r.mapped.volunteerCount,
        durationHours: r.mapped.durationHours,
        distanceKm: r.mapped.distanceKm,
        latitude: r.mapped.latitude,
        longitude: r.mapped.longitude,
        organization: r.mapped.organization || 'Accredited Coastal Cleanup Unit',
        predominantCategory: r.mapped.predominantCategory || 'Plastic',
        tideCondition: r.mapped.tideCondition,
        weatherCondition: r.mapped.weatherCondition,
        photoUrl: r.mapped.photoUrl,
        notes: r.mapped.notes,
        dataSource: dataSourceType,
        importedAt: now,
        importedBy: user?.displayName || user?.email || 'Admin Directorate',
        rawRecord: r.raw,
      };
    });

    try {
      const result = await batchImportHistoricalCleanups(finalDocs);

      setImportSummary({
        processed: validatedRows.length,
        imported: result.imported,
        rejected: validationStats.rejected + result.failed,
        duplicates: validationStats.duplicates,
        missingCritical: validationStats.missingCritical,
      });

      setCurrentStep(3);
      fetchExisting();
    } catch (err) {
      console.error('Import execution failed:', err);
    } finally {
      setIsImporting(false);
    }
  };

  // Delete individual record from Firestore
  const handleDeleteExisting = async (id: string) => {
    if (!confirm('Are you sure you want to delete this historical cleanup record?')) return;
    try {
      await deleteHistoricalCleanup(id);
      setExistingRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-900 text-teal-300 border border-teal-700 uppercase tracking-widest">
                Admin Directorate Console
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Route: /admin/historical-data
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              Historical Beach-Cleanup Dataset Ingestion
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Import longitudinal shore cleanup datasets into the <code className="text-teal-400">historical_cleanups</code> collection. Perform schema inspection, column mapping, data validation, and strict separation between <strong>REAL HISTORICAL DATA</strong> and <strong>DEMO DATA</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('/admin')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer border border-slate-700"
            >
              &larr; Admin Hub
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/dashboard')}
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold cursor-pointer shadow-xs"
            >
              Operations Dashboard &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Dataset Capability Confirmation Box (Anti-Fabrication Check) */}
      <div className="bg-emerald-950/60 border border-emerald-800/80 rounded-xl p-4 text-xs text-emerald-200 space-y-2">
        <div className="flex items-center gap-2 font-bold text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Confirmed Analytics Metrics Supported by the Real Dataset</span>
        </div>
        <p className="text-[11px] leading-relaxed text-emerald-200/90">
          Based on structural inspection of the real historical Visakhapatnam dataset, only the following metrics can be legitimately calculated:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
          <div className="bg-emerald-900/40 p-2 rounded border border-emerald-800/50">
            <strong className="text-white">✓ Total Waste Mass (kg)</strong>: Longitudinal sum &amp; zone density.
          </div>
          <div className="bg-emerald-900/40 p-2 rounded border border-emerald-800/50">
            <strong className="text-white">✓ Waste Breakdown</strong>: Plastic, Fishing Gear, Glass/Metal, Organic.
          </div>
          <div className="bg-emerald-900/40 p-2 rounded border border-emerald-800/50">
            <strong className="text-white">✓ Volunteer Output</strong>: Total volunteers, duration hours, and bags.
          </div>
          <div className="bg-emerald-900/40 p-2 rounded border border-emerald-800/50">
            <strong className="text-white">✓ Shoreline Coverage</strong>: Kilometers cleaned per zone.
          </div>
          <div className="bg-emerald-900/40 p-2 rounded border border-emerald-800/50">
            <strong className="text-white">✓ Environmental Factors</strong>: Tide and weather condition correlation.
          </div>
          <div className="bg-rose-950/50 p-2 rounded border border-rose-800/50 text-rose-300">
            <strong className="text-rose-200">✕ Unsupported</strong>: Microplastic particle counts (&lt;5mm) not recorded.
          </div>
        </div>
      </div>

      {/* Step Stepper Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-bold">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-2 cursor-pointer ${
              currentStep === 1 ? 'text-teal-600' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-mono">
              1
            </span>
            <span>1. Select &amp; Upload Dataset</span>
          </button>

          <ChevronRight className="w-4 h-4 text-slate-300" />

          <button
            type="button"
            disabled={parsedRows.length === 0}
            onClick={() => setCurrentStep(2)}
            className={`flex items-center gap-2 cursor-pointer disabled:opacity-40 ${
              currentStep === 2 ? 'text-teal-600' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-mono">
              2
            </span>
            <span>2. Column Mapping &amp; Validation</span>
          </button>

          <ChevronRight className="w-4 h-4 text-slate-300" />

          <button
            type="button"
            disabled={!importSummary}
            onClick={() => setCurrentStep(3)}
            className={`flex items-center gap-2 cursor-pointer disabled:opacity-40 ${
              currentStep === 3 ? 'text-teal-600' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-mono">
              3
            </span>
            <span>3. Ingestion Summary</span>
          </button>
        </div>
      </div>

      {/* STEP 1: UPLOAD & PREVIEW */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-teal-600" />
              <span>Step 1: Upload CSV or XLSX Dataset</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select your local historical cleanup report file or instantly load the official Visakhapatnam shoreline dataset.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Upload Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-teal-300 hover:border-teal-500 rounded-2xl p-8 bg-teal-50/30 hover:bg-teal-50/60 transition-colors flex flex-col items-center justify-center text-center cursor-pointer space-y-3"
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv, .xlsx, .xls, .tsv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-700 shadow-2xs">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <div>
                <span className="text-sm font-black text-slate-900 block">
                  Click to Browse CSV or XLSX
                </span>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  Supports comma-separated (.csv) and Excel (.xlsx) workbooks
                </span>
              </div>
            </div>

            {/* Load Official Preset Box */}
            <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-100 text-teal-800 font-bold">
                    Official Coastal Registry
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">19 Audited Rows</span>
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  Visakhapatnam Shoreline Cleanup Dataset (2021–2024)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Real intertidal cleanup audits conducted across RK Beach, Rushikonda, Lawson's Bay, Yarada, Tenneti Park, and Bheemili with volunteer metrics, waste tonnage, and flotsam categories.
                </p>
              </div>

              <button
                type="button"
                onClick={handleLoadOfficialDataset}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span>Load Official Visakhapatnam Dataset</span>
              </button>
            </div>

          </div>

          {/* Data Source Classification Toggle */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <span className="font-bold text-slate-800 block">
              Dataset Ingestion Classification:
            </span>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                <input
                  type="radio"
                  name="dataSourceType"
                  value="REAL_HISTORICAL"
                  checked={dataSourceType === 'REAL_HISTORICAL'}
                  onChange={() => setDataSourceType('REAL_HISTORICAL')}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                  REAL HISTORICAL DATA
                </span>
                <span className="text-[11px] text-slate-500 font-normal">
                  (Official ground cleanups — never mixed with synthetic data)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                <input
                  type="radio"
                  name="dataSourceType"
                  value="DEMO"
                  checked={dataSourceType === 'DEMO'}
                  onChange={() => setDataSourceType('DEMO')}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                  DEMO DATA
                </span>
                <span className="text-[11px] text-slate-500 font-normal">
                  (Test/Synthetic simulation records)
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: COLUMN MAPPING & VALIDATION */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-teal-600" />
                <span>Step 2: Column Mapping &amp; Integrity Validation</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Loaded file: <strong className="text-slate-800">{fileName}</strong> ({parsedRows.length} raw records, {parsedHeaders.length} columns detected).
              </p>
            </div>

            {/* Validation Badge Summary */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold border border-emerald-200">
                ✓ {validationStats.valid} Valid
              </span>
              {validationStats.rejected > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-900 font-bold border border-rose-200">
                  ✕ {validationStats.rejected} Rejected
                </span>
              )}
              {validationStats.duplicates > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold border border-amber-200">
                  ⚠ {validationStats.duplicates} Duplicates
                </span>
              )}
            </div>
          </div>

          {/* Column Mapping Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Map Source Dataset Columns to Schema:
              </h3>
              <button
                type="button"
                onClick={() => autoMapHeaders(parsedHeaders)}
                className="text-xs text-teal-600 font-bold hover:underline cursor-pointer"
              >
                Re-apply Auto Heuristics
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {TARGET_FIELDS.map((target) => {
                const isMapped = !!columnMapping[target.key];

                return (
                  <div
                    key={target.key}
                    className={`p-2.5 rounded-xl border transition-colors ${
                      isMapped
                        ? 'bg-slate-50/80 border-slate-300'
                        : target.required
                        ? 'bg-rose-50/60 border-rose-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 truncate">
                        {target.label}
                      </span>
                      {target.required ? (
                        <span className="text-[9px] font-mono font-bold text-rose-600 bg-rose-100 px-1.5 py-0.2 rounded">
                          REQUIRED
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-slate-400">Optional</span>
                      )}
                    </div>

                    <select
                      value={columnMapping[target.key] || ''}
                      onChange={(e) =>
                        setColumnMapping({
                          ...columnMapping,
                          [target.key]: e.target.value,
                        })
                      }
                      className="w-full py-1.5 px-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
                    >
                      <option value="">-- Do Not Map --</option>
                      {parsedHeaders.map((hdr) => (
                        <option key={hdr} value={hdr}>
                          {hdr}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Data Validation Table Preview */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>Record Validation Inspection Feed:</span>
              <span className="text-[11px] font-normal text-slate-500 lowercase">
                Showing all {validatedRows.length} rows with integrity status
              </span>
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-mono text-[10px] uppercase sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Row #</th>
                    <th className="py-2.5 px-3">Integrity Status</th>
                    <th className="py-2.5 px-3">Cleanup ID</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Beach / Location</th>
                    <th className="py-2.5 px-3">Total Waste (kg)</th>
                    <th className="py-2.5 px-3">Volunteers</th>
                    <th className="py-2.5 px-3">Validation Issues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {validatedRows.map((vRow) => {
                    const rowBg = !vRow.isValid
                      ? 'bg-rose-50/40 hover:bg-rose-50/70'
                      : vRow.isDuplicate
                      ? 'bg-amber-50/40 hover:bg-amber-50/70'
                      : 'hover:bg-slate-50';

                    return (
                      <tr key={vRow.rowIndex} className={`transition-colors ${rowBg}`}>
                        <td className="py-2 px-3 font-mono text-slate-500 font-bold">
                          #{vRow.rowIndex}
                        </td>

                        <td className="py-2 px-3 whitespace-nowrap">
                          {vRow.isValid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>VALID</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>REJECTED</span>
                            </span>
                          )}
                        </td>

                        <td className="py-2 px-3 font-mono text-teal-800 font-bold whitespace-nowrap">
                          {vRow.mapped.cleanupId || 'N/A'}
                        </td>

                        <td className="py-2 px-3 font-mono text-slate-700 whitespace-nowrap">
                          {vRow.mapped.date || <span className="text-rose-500 font-bold italic">Missing</span>}
                        </td>

                        <td className="py-2 px-3 text-slate-900 font-medium whitespace-nowrap">
                          {vRow.mapped.beachName || vRow.mapped.zone || (
                            <span className="text-rose-500 font-bold italic">Missing</span>
                          )}
                        </td>

                        <td className="py-2 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {vRow.mapped.totalWasteKg !== undefined ? (
                            `${vRow.mapped.totalWasteKg} kg`
                          ) : (
                            <span className="text-rose-500 font-bold italic">Missing</span>
                          )}
                        </td>

                        <td className="py-2 px-3 font-mono text-slate-700 whitespace-nowrap">
                          {vRow.mapped.volunteerCount ?? 'N/A'}
                        </td>

                        <td className="py-2 px-3 text-[11px]">
                          {vRow.errors.length > 0 && (
                            <div className="text-rose-700 font-semibold space-y-0.5">
                              {vRow.errors.map((err, i) => (
                                <div key={i}>• {err}</div>
                              ))}
                            </div>
                          )}
                          {vRow.warnings.length > 0 && vRow.errors.length === 0 && (
                            <span className="text-slate-400 italic">No errors</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer"
            >
              &larr; Choose Different File
            </button>

            <button
              type="button"
              disabled={validationStats.valid === 0 || isImporting}
              onClick={handleExecuteImport}
              className="py-3 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-teal-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Importing Valid Records to Firestore...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>Import {validationStats.valid} Valid Records &rarr;</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: IMPORT SUMMARY */}
      {currentStep === 3 && importSummary && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="text-center space-y-2 py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900">
              Dataset Ingestion Complete
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              The valid historical cleanup records have been committed to the{' '}
              <code className="text-teal-700 font-mono font-bold">historical_cleanups</code> collection in Cloud Firestore.
            </p>
          </div>

          {/* Mandatory Import Summary Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">
                Records Processed
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {importSummary.processed}
              </span>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center">
              <span className="text-[10px] font-mono text-emerald-700 uppercase block font-semibold">
                Records Imported
              </span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">
                {importSummary.imported}
              </span>
            </div>

            <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 text-center">
              <span className="text-[10px] font-mono text-rose-700 uppercase block font-semibold">
                Records Rejected
              </span>
              <span className="text-2xl font-black text-rose-700 mt-1 block">
                {importSummary.rejected}
              </span>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-center">
              <span className="text-[10px] font-mono text-amber-700 uppercase block font-semibold">
                Duplicates Detected
              </span>
              <span className="text-2xl font-black text-amber-700 mt-1 block">
                {importSummary.duplicates}
              </span>
            </div>

            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 text-center">
              <span className="text-[10px] font-mono text-purple-700 uppercase block font-semibold">
                Missing Critical
              </span>
              <span className="text-2xl font-black text-purple-700 mt-1 block">
                {importSummary.missingCritical}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setFileName('');
                setParsedRows([]);
                setCurrentStep(1);
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
            >
              Upload Another Dataset
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/dashboard')}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer shadow-xs"
            >
              View Operations Dashboard &rarr;
            </button>
          </div>
        </div>
      )}

      {/* EXISTING HISTORICAL CLEANUPS AUDIT TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-0">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-600" />
              <span>Current Firestore Historical Cleanups Collection ({existingRecords.length} records)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Audited longitudinal cleanups stored in <code className="text-teal-700 font-mono">historical_cleanups</code>.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchExisting}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingExisting ? 'animate-spin' : ''}`} />
            <span>Refresh Table</span>
          </button>
        </div>

        {existingRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Database className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">No Historical Cleanups Stored Yet</p>
            <p className="text-[11px] text-slate-400">
              Upload a CSV/XLSX dataset above to populate the historical cleanups database.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-mono text-[10px] uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Classification</th>
                  <th className="py-2.5 px-3">Cleanup ID</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Beach / Location</th>
                  <th className="py-2.5 px-3">Total Waste (kg)</th>
                  <th className="py-2.5 px-3">Plastic (kg)</th>
                  <th className="py-2.5 px-3">Volunteers</th>
                  <th className="py-2.5 px-3">Organization</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {existingRecords.map((rec) => {
                  const isReal = rec.dataSource === 'REAL_HISTORICAL';

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            isReal
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}
                        >
                          {isReal ? 'REAL HISTORICAL' : 'DEMO'}
                        </span>
                      </td>

                      <td className="py-2 px-3 font-mono font-bold text-teal-900 whitespace-nowrap">
                        {rec.cleanupId || rec.id.substring(0, 10)}
                      </td>

                      <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {rec.date}
                      </td>

                      <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        {rec.beachName || rec.zone}
                      </td>

                      <td className="py-2 px-3 font-mono font-black text-slate-900 whitespace-nowrap">
                        {rec.totalWasteKg} kg
                      </td>

                      <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {rec.plasticWasteKg !== undefined ? `${rec.plasticWasteKg} kg` : 'N/A'}
                      </td>

                      <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {rec.volunteerCount ?? 'N/A'}
                      </td>

                      <td className="py-2 px-3 max-w-[180px] truncate text-slate-700" title={rec.organization}>
                        {rec.organization || 'Accredited Unit'}
                      </td>

                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeleteExisting(rec.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
