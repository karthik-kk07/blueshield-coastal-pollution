import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { AppRoute } from '../types/navigation';
import { listHistoricalCleanups } from '../services/historicalCleanupService';
import { HistoricalCleanupDoc } from '../types/firestore';
import {
  BarChart2,
  Calendar,
  Filter,
  Download,
  MapPin,
  Scale,
  Users,
  Clock,
  Layers,
  Sparkles,
  Info,
  RefreshCw,
  SlidersHorizontal,
  X,
  FileSpreadsheet,
  AlertCircle,
  TrendingUp,
  Activity,
  ShieldCheck,
  Compass,
} from 'lucide-react';

interface AnalyticsPageProps {
  onNavigate: (route: AppRoute) => void;
}

// Chart color constants
const COLORS = {
  teal: '#0D9488',
  sky: '#0284C7',
  rose: '#E11D48',
  amber: '#D97706',
  emerald: '#10B981',
  indigo: '#4F46E5',
  slate: '#64748B',
};

const CATEGORY_COLORS = ['#0284C7', '#E11D48', '#D97706', '#10B981', '#64748B'];

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onNavigate }) => {
  // Raw records loaded from Firestore or verified CSV
  const [records, setRecords] = useState<HistoricalCleanupDoc[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadSource, setLoadSource] = useState<'FIRESTORE' | 'BUNDLED_DATASET'>('FIRESTORE');

  // Filters
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedWasteStream, setSelectedWasteStream] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // 1. Load actual historical dataset: try Firestore first, fallback to verified CSV
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Attempt to load from Firestore historical_cleanups collection
      const firestoreRecords = await listHistoricalCleanups(500, 'REAL_HISTORICAL');
      if (firestoreRecords && firestoreRecords.length > 0) {
        setRecords(firestoreRecords);
        setLoadSource('FIRESTORE');
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Could not query Firestore historical_cleanups, fetching bundled dataset:', err);
    }

    // Fallback: Fetch bundled authentic Visakhapatnam dataset directly
    try {
      const res = await fetch('/historical_beach_cleanup_visakhapatnam.csv');
      const csvText = await res.text();
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const validDocs: HistoricalCleanupDoc[] = (results.data as Record<string, any>[])
            .filter((row) => row.date && row.total_waste_kg && !isNaN(Number(row.total_waste_kg)))
            .map((row, idx) => ({
              id: row.cleanup_id || `hist-${idx}`,
              cleanupId: row.cleanup_id,
              date: row.date,
              beachName: row.beach_name || 'Visakhapatnam Shoreline',
              zone: row.zone || 'Central Urban Shoreline',
              totalWasteKg: parseFloat(row.total_waste_kg),
              plasticWasteKg: row.plastic_waste_kg ? parseFloat(row.plastic_waste_kg) : undefined,
              fishingGearKg: row.fishing_gear_kg ? parseFloat(row.fishing_gear_kg) : undefined,
              glassMetalKg: row.glass_metal_kg ? parseFloat(row.glass_metal_kg) : undefined,
              organicKg: row.organic_kg ? parseFloat(row.organic_kg) : undefined,
              bagsCount: row.bags_count ? parseInt(row.bags_count, 10) : undefined,
              volunteerCount: row.volunteer_count ? parseInt(row.volunteer_count, 10) : undefined,
              durationHours: row.duration_hours ? parseFloat(row.duration_hours) : undefined,
              distanceKm: row.distance_km ? parseFloat(row.distance_km) : undefined,
              latitude: row.latitude ? parseFloat(row.latitude) : undefined,
              longitude: row.longitude ? parseFloat(row.longitude) : undefined,
              organization: row.organization,
              predominantCategory: row.predominant_category || 'Plastic',
              tideCondition: row.tide_condition,
              weatherCondition: row.weather_condition,
              notes: row.notes,
              dataSource: 'REAL_HISTORICAL',
            }));
          setRecords(validDocs);
          setLoadSource('BUNDLED_DATASET');
          setIsLoading(false);
        },
      });
    } catch (csvErr) {
      console.error('Failed to load bundled historical dataset:', csvErr);
      setIsLoading(false);
    }
  };

  // Unique locations from data
  const locationsList = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.beachName) set.add(r.beachName);
      else if (r.zone) set.add(r.zone);
    });
    return Array.from(set).sort();
  }, [records]);

  // Unique years from data
  const yearsList = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.date) {
        const year = r.date.split('-')[0];
        if (year && year.length === 4) set.add(year);
      }
    });
    return Array.from(set).sort();
  }, [records]);

  // 2. Filtered Dataset
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Must be real historical data
      if (r.dataSource !== 'REAL_HISTORICAL') return false;

      // Filter: Year
      if (selectedYear !== 'all') {
        if (!r.date.startsWith(selectedYear)) return false;
      }

      // Filter: Location
      if (selectedLocation !== 'all') {
        const loc = r.beachName || r.zone;
        if (loc !== selectedLocation) return false;
      }

      // Filter: Waste Type Focus
      if (selectedWasteStream !== 'all') {
        if (selectedWasteStream === 'plastic' && (!r.plasticWasteKg || r.plasticWasteKg <= 0)) {
          return false;
        }
        if (selectedWasteStream === 'fishing' && (!r.fishingGearKg || r.fishingGearKg <= 0)) {
          return false;
        }
        if (selectedWasteStream === 'glass_metal' && (!r.glassMetalKg || r.glassMetalKg <= 0)) {
          return false;
        }
        if (selectedWasteStream === 'organic' && (!r.organicKg || r.organicKg <= 0)) {
          return false;
        }
      }

      // Filter: Custom Date Range
      if (startDate && r.date < startDate) return false;
      if (endDate && r.date > endDate) return false;

      return true;
    });
  }, [records, selectedYear, selectedLocation, selectedWasteStream, startDate, endDate]);

  // Determine active time period string for chart headers
  const timePeriodLabel = useMemo(() => {
    if (filteredRecords.length === 0) return 'No matching records';
    const dates = filteredRecords.map((r) => r.date).sort();
    const minD = dates[0];
    const maxD = dates[dates.length - 1];
    return `${minD} to ${maxD}`;
  }, [filteredRecords]);

  // 3. Supported Metric Calculations (Anti-Fabrication: strictly supported by dataset)
  const metrics = useMemo(() => {
    const totalActivities = filteredRecords.length;
    let totalWasteKg = 0;
    let totalVolunteers = 0;
    let totalPlasticKg = 0;
    let totalFishingGearKg = 0;
    let totalGlassMetalKg = 0;
    let totalOrganicKg = 0;
    let totalDistanceKm = 0;
    let totalHours = 0;

    filteredRecords.forEach((r) => {
      totalWasteKg += r.totalWasteKg || 0;
      if (r.volunteerCount) totalVolunteers += r.volunteerCount;
      if (r.plasticWasteKg) totalPlasticKg += r.plasticWasteKg;
      if (r.fishingGearKg) totalFishingGearKg += r.fishingGearKg;
      if (r.glassMetalKg) totalGlassMetalKg += r.glassMetalKg;
      if (r.organicKg) totalOrganicKg += r.organicKg;
      if (r.distanceKm) totalDistanceKm += r.distanceKm;
      if (r.durationHours) totalHours += r.durationHours;
    });

    const avgWastePerCleanup = totalActivities > 0 ? totalWasteKg / totalActivities : 0;
    const avgWastePerVolunteer = totalVolunteers > 0 ? totalWasteKg / totalVolunteers : 0;
    const avgVolunteersPerCleanup = totalActivities > 0 ? totalVolunteers / totalActivities : 0;

    return {
      totalActivities,
      totalWasteKg: Math.round(totalWasteKg * 10) / 10,
      totalWasteTonnes: Math.round((totalWasteKg / 1000) * 100) / 100,
      totalVolunteers,
      totalPlasticKg: Math.round(totalPlasticKg * 10) / 10,
      totalFishingGearKg: Math.round(totalFishingGearKg * 10) / 10,
      totalGlassMetalKg: Math.round(totalGlassMetalKg * 10) / 10,
      totalOrganicKg: Math.round(totalOrganicKg * 10) / 10,
      totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
      totalHours: Math.round(totalHours * 10) / 10,
      avgWastePerCleanup: Math.round(avgWastePerCleanup * 10) / 10,
      avgWastePerVolunteer: Math.round(avgWastePerVolunteer * 100) / 100,
      avgVolunteersPerCleanup: Math.round(avgVolunteersPerCleanup),
      uniqueLocations: new Set(filteredRecords.map((r) => r.beachName || r.zone)).size,
    };
  }, [filteredRecords]);

  // 4. Data for Line Chart: Activities & Waste Over Time
  const timelineData = useMemo(() => {
    const sorted = [...filteredRecords].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.map((r) => ({
      date: r.date,
      location: r.beachName || r.zone,
      wasteKg: r.totalWasteKg,
      volunteers: r.volunteerCount || 0,
      plasticKg: r.plasticWasteKg || 0,
    }));
  }, [filteredRecords]);

  // 5. Data for Yearly Trends Bar Chart
  const yearlyData = useMemo(() => {
    const map: Record<string, { year: string; totalWasteKg: number; activities: number; volunteers: number }> = {};
    filteredRecords.forEach((r) => {
      const yr = r.date.split('-')[0] || 'Unknown';
      if (!map[yr]) {
        map[yr] = { year: yr, totalWasteKg: 0, activities: 0, volunteers: 0 };
      }
      map[yr].totalWasteKg += r.totalWasteKg || 0;
      map[yr].activities += 1;
      map[yr].volunteers += r.volunteerCount || 0;
    });

    return Object.values(map)
      .sort((a, b) => a.year.localeCompare(b.year))
      .map((item) => ({
        ...item,
        totalWasteKg: Math.round(item.totalWasteKg),
      }));
  }, [filteredRecords]);

  // 6. Data for Monthly Trends Bar Chart
  const monthlyData = useMemo(() => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const buckets = months.map((m, idx) => ({
      monthIndex: idx + 1,
      month: m,
      wasteKg: 0,
      activities: 0,
    }));

    filteredRecords.forEach((r) => {
      const parts = r.date.split('-');
      if (parts.length >= 2) {
        const mIdx = parseInt(parts[1], 10) - 1;
        if (mIdx >= 0 && mIdx < 12) {
          buckets[mIdx].wasteKg += r.totalWasteKg || 0;
          buckets[mIdx].activities += 1;
        }
      }
    });

    return buckets.map((b) => ({
      ...b,
      wasteKg: Math.round(b.wasteKg),
    }));
  }, [filteredRecords]);

  // 7. Data for Seasonal Trends Bar Chart
  const seasonalData = useMemo(() => {
    const seasons = [
      { season: 'Winter / Pre-Summer (Q1: Jan-Mar)', wasteKg: 0, activities: 0, volunteers: 0 },
      { season: 'Summer (Q2: Apr-Jun)', wasteKg: 0, activities: 0, volunteers: 0 },
      { season: 'Monsoon / ICC (Q3: Jul-Sep)', wasteKg: 0, activities: 0, volunteers: 0 },
      { season: 'Post-Monsoon (Q4: Oct-Dec)', wasteKg: 0, activities: 0, volunteers: 0 },
    ];

    filteredRecords.forEach((r) => {
      const parts = r.date.split('-');
      if (parts.length >= 2) {
        const m = parseInt(parts[1], 10);
        let sIdx = 0;
        if (m >= 1 && m <= 3) sIdx = 0;
        else if (m >= 4 && m <= 6) sIdx = 1;
        else if (m >= 7 && m <= 9) sIdx = 2;
        else if (m >= 10 && m <= 12) sIdx = 3;

        seasons[sIdx].wasteKg += r.totalWasteKg || 0;
        seasons[sIdx].activities += 1;
        seasons[sIdx].volunteers += r.volunteerCount || 0;
      }
    });

    return seasons.map((s) => ({
      ...s,
      wasteKg: Math.round(s.wasteKg),
    }));
  }, [filteredRecords]);

  // 8. Data for Location Frequency & Total Waste (Location Chart)
  const locationData = useMemo(() => {
    const map: Record<string, { location: string; totalWasteKg: number; activities: number; volunteers: number }> = {};
    filteredRecords.forEach((r) => {
      const loc = r.beachName || r.zone || 'Unknown';
      if (!map[loc]) {
        map[loc] = { location: loc, totalWasteKg: 0, activities: 0, volunteers: 0 };
      }
      map[loc].totalWasteKg += r.totalWasteKg || 0;
      map[loc].activities += 1;
      map[loc].volunteers += r.volunteerCount || 0;
    });

    return Object.values(map)
      .sort((a, b) => b.totalWasteKg - a.totalWasteKg)
      .map((item) => ({
        ...item,
        totalWasteKg: Math.round(item.totalWasteKg),
        avgWastePerActivity: Math.round(item.totalWasteKg / (item.activities || 1)),
      }));
  }, [filteredRecords]);

  // 9. Data for Waste Category Breakdown (Pie & Bar)
  const categoryData = useMemo(() => {
    const catMap: Record<string, number> = {
      'Macro Plastics & Packaging': metrics.totalPlasticKg,
      'Derelict Fishing Gear & Nets': metrics.totalFishingGearKg,
      'Glass & Scrap Metal': metrics.totalGlassMetalKg,
      'Organic Flotsam & Driftwood': metrics.totalOrganicKg,
    };

    return Object.entries(catMap)
      .filter(([_, kg]) => kg > 0)
      .map(([name, value]) => ({
        name,
        value,
        percentage:
          metrics.totalWasteKg > 0 ? Math.round((value / metrics.totalWasteKg) * 100) : 0,
      }));
  }, [metrics]);

  // Export filtered historical dataset to CSV
  const handleExportCSV = () => {
    const headers =
      'Cleanup_ID,Date,Beach_Name,Zone,Total_Waste_Kg,Plastic_Kg,Fishing_Gear_Kg,Glass_Metal_Kg,Organic_Kg,Volunteers,Duration_Hours,Organization,Predominant_Category\n';
    const rows = filteredRecords
      .map(
        (r) =>
          `"${r.cleanupId || r.id}","${r.date}","${r.beachName || ''}","${r.zone || ''}",${r.totalWasteKg},${r.plasticWasteKg || 0},${r.fishingGearKg || 0},${r.glassMetalKg || 0},${r.organicKg || 0},${r.volunteerCount || 0},${r.durationHours || 0},"${r.organization || ''}","${r.predominantCategory || ''}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `historical-cleanup-intelligence-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setSelectedYear('all');
    setSelectedLocation('all');
    setSelectedWasteStream('all');
    setStartDate('');
    setEndDate('');
  };

  const isFiltered =
    selectedYear !== 'all' ||
    selectedLocation !== 'all' ||
    selectedWasteStream !== 'all' ||
    Boolean(startDate) ||
    Boolean(endDate);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      
      {/* 1. MANDATORY PAGE HEADER & REQUIRED STATEMENT */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-900 text-teal-300 border border-teal-700 uppercase tracking-widest">
                Longitudinal Intelligence Portal
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Data Source: {loadSource === 'FIRESTORE' ? 'Live Cloud Firestore' : 'Audited Coastal Registry'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Historical Cleanup Intelligence
            </h1>

            {/* Exact required explanation */}
            <p className="text-xs sm:text-sm text-teal-200/90 font-medium mt-1 max-w-3xl leading-relaxed">
              &ldquo;Historical cleanup records help identify recurring pollution patterns and areas requiring preventive attention.&rdquo;
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/admin/historical-data')}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ingestion Portal &rarr;</span>
            </button>
          </div>
        </div>

        {/* 2. SCIENTIFIC BOUNDARY / CAUSATION WARNING */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 text-[11px] text-slate-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <strong className="text-slate-100">Methodological Note on Interpretability:</strong>{' '}
            Metrics presented below reflect empirical shore sweeps and organized volunteer mobilization extractions. They do not claim ecological health improvement without biological telemetry, nor do they infer environmental causation. Debris yield correlates with seasonal weather surges, festival tourism, and oceanographic convergence.
          </div>
        </div>
      </div>

      {/* 3. MULTI-DIMENSIONAL FILTER CONTROLS BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
            <Filter className="w-4 h-4 text-teal-600" />
            <span>Dataset Query Filters</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500">
              Active Scope: <strong>{filteredRecords.length}</strong> of {records.length} Activities
            </span>
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer ml-2"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Filter 1: Year */}
          <div>
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
              Year Filter
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
            >
              <option value="all">All Years (2021–2024)</option>
              {yearsList.map((yr) => (
                <option key={yr} value={yr}>
                  Year {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 2: Shoreline Location */}
          <div>
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
              Shoreline Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-600 truncate"
            >
              <option value="all">All Vizag Locations ({locationsList.length})</option>
              {locationsList.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 3: Waste Type Focus */}
          <div>
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
              Waste Type Focus
            </label>
            <select
              value={selectedWasteStream}
              onChange={(e) => setSelectedWasteStream(e.target.value)}
              className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
            >
              <option value="all">All Waste Streams</option>
              <option value="plastic">Macro Plastics &amp; Bottles</option>
              <option value="fishing">Derelict Fishing Gear &amp; Nets</option>
              <option value="glass_metal">Glass &amp; Scrap Metal</option>
              <option value="organic">Organic / Flotsam Driftwood</option>
            </select>
          </div>

          {/* Filter 4: Start Date */}
          <div>
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full py-1.5 px-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
            />
          </div>

          {/* Filter 5: End Date */}
          <div>
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full py-1.5 px-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
            />
          </div>
        </div>
      </div>

      {/* 4. KPI CARDS (Only metrics supported by the real dataset) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Total Activities */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Cleanup Activities</span>
            <Activity className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {metrics.totalActivities}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">
            Audited Field Sweeps
          </div>
        </div>

        {/* KPI 2: Total Waste Collected */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Total Waste Mass</span>
            <Scale className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {metrics.totalWasteKg.toLocaleString()} <span className="text-xs text-slate-500 font-bold">kg</span>
          </div>
          <div className="text-[10px] font-mono text-teal-700 font-semibold mt-1">
            {metrics.totalWasteTonnes} Metric Tonnes
          </div>
        </div>

        {/* KPI 3: Volunteer Participation */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Volunteer Total</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {metrics.totalVolunteers.toLocaleString()}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">
            Avg {metrics.avgVolunteersPerCleanup} / Cleanup
          </div>
        </div>

        {/* KPI 4: Waste per Cleanup */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Waste / Cleanup</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {metrics.avgWastePerCleanup} <span className="text-xs text-slate-500 font-bold">kg</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">
            Per Operations Sweep
          </div>
        </div>

        {/* KPI 5: Waste per Volunteer */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Waste / Volunteer</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {metrics.avgWastePerVolunteer} <span className="text-xs text-slate-500 font-bold">kg</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">
            Participant Extraction Rate
          </div>
        </div>

        {/* KPI 6: Recurring Locations */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase">Target Beaches</span>
            <MapPin className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {metrics.uniqueLocations}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">
            Vizag Shoreline Coves
          </div>
        </div>
      </div>

      {/* 5. PRIMARY CHARTS: TRENDS OVER TIME */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CHART 1: Cleanup Activities & Waste Volume Over Time (Line / Area Chart) */}
        <div className="lg:col-span-12 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <span>Cleanup Activities &amp; Waste Volume Over Time</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Chronological sequence of shoreline debris volume (kg) extracted during field operations.
              </p>
            </div>

            {/* Mandatory Time Period Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono font-bold border border-slate-200 self-start sm:self-auto">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>Time Period: {timePeriodLabel}</span>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="wasteGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284C7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} angle={-25} textAnchor="end" />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748B' }} label={{ value: 'Waste (kg)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748B' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#64748B' }} label={{ value: 'Volunteers', angle: 90, position: 'insideRight', fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '11px',
                    border: 'none',
                  }}
                  formatter={(val: any, name: any) => [
                    name === 'wasteKg' ? `${val} kg` : val,
                    name === 'wasteKg' ? 'Waste Mass' : name === 'volunteers' ? 'Volunteers' : name,
                  ]}
                  labelFormatter={(lbl, items) => {
                    const row = items?.[0]?.payload;
                    return row ? `${lbl} — ${row.location}` : String(lbl);
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area yAxisId="left" type="monotone" dataKey="wasteKg" name="Total Waste (kg)" stroke="#0D9488" strokeWidth={2.5} fillOpacity={1} fill="url(#wasteGradient)" />
                <Line yAxisId="right" type="monotone" dataKey="volunteers" name="Volunteers Present" stroke="#0284C7" strokeWidth={2} dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Yearly Trends (Bar Chart) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                <span>Yearly Trends (2021–2024)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Aggregate annual waste tonnage and event count across the Vizag coastline.
              </p>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono font-bold border border-slate-200">
              <span>Time Period: Annual Comparison</span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '11px',
                    border: 'none',
                  }}
                  formatter={(val: any, name: any) => [
                    name === 'totalWasteKg' ? `${val.toLocaleString()} kg` : `${val} events`,
                    name === 'totalWasteKg' ? 'Total Waste' : 'Cleanup Activities',
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar yAxisId="left" dataKey="totalWasteKg" name="Total Waste (kg)" fill="#0284C7" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="left" dataKey="activities" name="Cleanup Activities" fill="#0D9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Seasonal & Monthly Cycles (Bar / Trend Chart) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Seasonal Cycles (Quarterly Profile)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Flotsam accumulation patterns aggregated by quarterly meteorological regimes.
              </p>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono font-bold border border-slate-200">
              <span>Time Period: Seasonal Aggregation</span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={seasonalData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="season" tick={{ fontSize: 9, fill: '#64748B' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '11px',
                    border: 'none',
                  }}
                  formatter={(val: any) => [`${val.toLocaleString()} kg`, 'Waste Yield']}
                />
                <Bar dataKey="wasteKg" name="Waste Yield (kg)" fill="#D97706" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 6. SPATIAL & CATEGORY INTELLIGENCE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* CHART 4: Recurring Cleanup Locations & Waste Yield (Horizontal Bar Chart) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-600" />
                <span>Recurring Cleanup Locations &amp; Waste Frequency</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Beach sites ranked by cumulative waste extracted and sweep occurrences.
              </p>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono font-bold border border-slate-200">
              <span>Time Period: {timePeriodLabel}</span>
            </div>
          </div>

          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={locationData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis
                  type="category"
                  dataKey="location"
                  width={140}
                  tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '11px',
                    border: 'none',
                  }}
                  formatter={(val: any, name: any) => [
                    name === 'totalWasteKg' ? `${val.toLocaleString()} kg` : `${val} cleanups`,
                    name === 'totalWasteKg' ? 'Cumulative Waste' : 'Activities Count',
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="totalWasteKg" name="Total Waste (kg)" fill="#E11D48" radius={[0, 6, 6, 0]} />
                <Bar dataKey="activities" name="Activities Count" fill="#0D9488" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 5: Waste Stream Category Composition (Pie + Legend) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Waste Categories</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Proportional share of verified debris streams collected on shore.
                </p>
              </div>

              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-bold border border-slate-200">
                <span>Time Period: Full Range</span>
              </div>
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '11px',
                      border: 'none',
                    }}
                    formatter={(val: any) => [`${Number(val).toLocaleString()} kg`, 'Measured Weight']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Metric Breakdown Table */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs font-mono">
            {categoryData.map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between py-1 px-2 rounded hover:bg-slate-50">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                  />
                  <span className="text-slate-700 font-semibold truncate max-w-[190px]">
                    {cat.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-900 font-bold">{cat.value.toLocaleString()} kg</span>
                  <span className="text-slate-400 text-[10px]">({cat.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 7. MONTHLY DRIFT INTENSITY CHART */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>Monthly Debris Deposition Profile (Jan–Dec Aggregate)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifies annual peak months (e.g. September ICC mobilization, January festive surges, and monsoon flotsam landfall).
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono font-bold border border-slate-200">
            <span>Time Period: Monthly Aggregate Profile</span>
          </div>
        </div>

        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontSize: '11px',
                  border: 'none',
                }}
                formatter={(val: any) => [`${val.toLocaleString()} kg`, 'Total Recorded Waste']}
              />
              <Bar dataKey="wasteKg" name="Recorded Waste (kg)" fill="#0D9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
