import React, { useState, useEffect, useMemo } from 'react';
import { AppRoute } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { subscribeToReports } from '../services/reportService';
import { subscribeToCleanupRecords } from '../services/cleanupService';
import { listOrganizations } from '../services/organizationService';
import { ReportDoc, CleanupRecordDoc, OrganizationDoc } from '../types/firestore';
import { StatusBadge, SeverityBadge } from '../components/ui/StatusBadge';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  Filter,
  Flame,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  TrendingUp,
  X,
  Building2,
  Calendar,
  ExternalLink,
  Loader2,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (route: AppRoute) => void;
}

// Chart color palettes
const STATUS_COLORS: Record<string, string> = {
  REPORTED: '#f59e0b', // Amber
  pending_verification: '#f59e0b',
  VERIFIED: '#10b981', // Emerald
  ASSIGNED: '#3b82f6', // Blue
  ACCEPTED: '#8b5cf6', // Violet
  IN_PROGRESS: '#06b6d4', // Cyan
  CLEANED: '#14b8a6', // Teal
  VERIFIED_CLOSED: '#059669', // Dark Emerald
  REJECTED: '#ef4444', // Red
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#e11d48', // Rose 600
  HIGH: '#f97316', // Orange 500
  MODERATE: '#eab308', // Yellow 500
  LOW: '#10b981', // Emerald 500
};

const TYPE_COLORS = [
  '#0284c7', // Sky 600
  '#0d9488', // Teal 600
  '#7c3aed', // Violet 600
  '#ea580c', // Orange 600
  '#16a34a', // Green 600
  '#dc2626', // Red 600
  '#4f46e5', // Indigo 600
  '#ca8a04', // Yellow 600
];

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { role } = useAuth();

  // Firestore raw state
  const [reports, setReports] = useState<ReportDoc[]>([]);
  const [cleanupRecords, setCleanupRecords] = useState<CleanupRecordDoc[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationDoc[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Filter States
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('all'); // all | today | 7days | 30days
  const [filterOrg, setFilterOrg] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination for Recent Activity Table
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  // 1. Subscribe to real Firestore data
  useEffect(() => {
    setIsLoading(true);

    const unsubReports = subscribeToReports(
      (data) => {
        setReports(data);
        setLastSyncTime(new Date());
        setIsLoading(false);
        setFirestoreError(null);
      },
      (err) => {
        console.error('Error fetching Firestore reports:', err);
        setFirestoreError('Failed to synchronize live reports from Firestore.');
        setIsLoading(false);
      }
    );

    const unsubCleanups = subscribeToCleanupRecords(
      (data) => {
        setCleanupRecords(data);
      },
      (err) => {
        console.warn('Error fetching cleanup records:', err);
      }
    );

    listOrganizations()
      .then((orgs) => setOrganizations(orgs))
      .catch((err) => console.warn('Error fetching organizations:', err));

    return () => {
      unsubReports();
      unsubCleanups();
    };
  }, []);

  // 2. Compute KPI metrics strictly from real Firestore data (or 'N/A' if unavailable)
  const kpiData = useMemo(() => {
    if (isLoading && reports.length === 0) {
      return {
        totalReports: 'N/A',
        pendingVerification: 'N/A',
        activeTasks: 'N/A',
        resolvedReports: 'N/A',
        highCriticalReports: 'N/A',
        recurringHotspots: 'N/A',
      };
    }

    const total = reports.length;

    // Pending Verification: REPORTED or pending_verification
    const pending = reports.filter(
      (r) => r.status === 'REPORTED' || r.status === 'pending_verification'
    ).length;

    // Active Tasks: ASSIGNED, ACCEPTED, IN_PROGRESS, dispatched
    const active = reports.filter((r) =>
      ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'dispatched', 'in_progress', 'action_dispatched'].includes(
        r.status
      )
    ).length;

    // Resolved: CLEANED, VERIFIED_CLOSED, remediated
    const resolved = reports.filter((r) =>
      ['CLEANED', 'VERIFIED_CLOSED', 'remediated'].includes(r.status)
    ).length;

    // High/Critical
    const highCritical = reports.filter((r) => {
      const sev = (r.severity || '').toUpperCase();
      return sev === 'HIGH' || sev === 'CRITICAL';
    }).length;

    // Recurring Hotspots: Locations / coastal zones with >= 2 reports
    let recurringHotspots: string | number = 'N/A';
    if (reports.length > 0) {
      const zoneClusters: Record<string, number> = {};
      reports.forEach((r) => {
        const zone =
          r.coastalZone?.trim() ||
          (r.latitude && r.longitude
            ? `${r.latitude.toFixed(2)},${r.longitude.toFixed(2)}`
            : null);
        if (zone) {
          zoneClusters[zone] = (zoneClusters[zone] || 0) + 1;
        }
      });
      const hotspotCount = Object.values(zoneClusters).filter((c) => c >= 2).length;
      recurringHotspots = hotspotCount;
    }

    return {
      totalReports: total.toString(),
      pendingVerification: pending.toString(),
      activeTasks: active.toString(),
      resolvedReports: resolved.toString(),
      highCriticalReports: highCritical.toString(),
      recurringHotspots: recurringHotspots.toString(),
    };
  }, [reports, isLoading]);

  // 3. Filter reports for table and charts
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // Status Filter
      if (filterStatus !== 'all') {
        const statusMatch =
          filterStatus === 'PENDING'
            ? r.status === 'REPORTED' || r.status === 'pending_verification'
            : filterStatus === 'ACTIVE'
            ? ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'dispatched'].includes(r.status)
            : filterStatus === 'RESOLVED'
            ? ['CLEANED', 'VERIFIED_CLOSED', 'remediated'].includes(r.status)
            : r.status === filterStatus;
        if (!statusMatch) return false;
      }

      // Severity Filter
      if (filterSeverity !== 'all') {
        if ((r.severity || '').toUpperCase() !== filterSeverity.toUpperCase()) {
          return false;
        }
      }

      // Pollution Type Filter
      if (filterType !== 'all') {
        if (r.pollutionType?.toLowerCase() !== filterType.toLowerCase()) {
          return false;
        }
      }

      // Organization Filter
      if (filterOrg !== 'all') {
        if (filterOrg === '__unassigned__') {
          if (r.assignedOrganization && r.assignedOrganization.trim() !== '') return false;
        } else {
          if (r.assignedOrganization !== filterOrg) return false;
        }
      }

      // Date Range Filter
      if (filterDateRange !== 'all') {
        if (!r.createdAt) return false;
        const reportDate = new Date(r.createdAt).getTime();
        const now = Date.now();
        if (filterDateRange === 'today') {
          const startOfToday = new Date().setHours(0, 0, 0, 0);
          if (reportDate < startOfToday) return false;
        } else if (filterDateRange === '7days') {
          const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
          if (reportDate < sevenDaysAgo) return false;
        } else if (filterDateRange === '30days') {
          const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
          if (reportDate < thirtyDaysAgo) return false;
        }
      }

      // Text Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchNumber = r.reportNumber?.toLowerCase().includes(q);
        const matchType = r.pollutionType?.toLowerCase().includes(q);
        const matchZone = r.coastalZone?.toLowerCase().includes(q);
        const matchDesc = r.description?.toLowerCase().includes(q);
        const matchOrg = r.assignedOrganization?.toLowerCase().includes(q);
        if (!matchNumber && !matchType && !matchZone && !matchDesc && !matchOrg) {
          return false;
        }
      }

      return true;
    });
  }, [reports, filterStatus, filterSeverity, filterType, filterOrg, filterDateRange, searchQuery]);

  // Unique pollution types from real data for dropdown
  const uniquePollutionTypes = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      if (r.pollutionType) set.add(r.pollutionType);
    });
    return Array.from(set).sort();
  }, [reports]);

  // Unique organizations from real data & org registry
  const uniqueOrganizations = useMemo(() => {
    const set = new Set<string>();
    organizations.forEach((o) => set.add(o.name));
    reports.forEach((r) => {
      if (r.assignedOrganization) set.add(r.assignedOrganization);
    });
    return Array.from(set).sort();
  }, [organizations, reports]);

  // 4. CHART DATA BUILDERS (Strictly Real Data)

  // Chart A: Reports by Status
  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredReports.forEach((r) => {
      const s = r.status || 'UNKNOWN';
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      fill: STATUS_COLORS[name] || '#64748b',
    }));
  }, [filteredReports]);

  // Chart B: Reports by Pollution Type
  const pollutionTypeChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredReports.forEach((r) => {
      const t = r.pollutionType || 'Unspecified';
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredReports]);

  // Chart C: Reports by Severity
  const severityChartData = useMemo(() => {
    const counts: Record<string, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MODERATE: 0,
      LOW: 0,
    };
    filteredReports.forEach((r) => {
      const sev = (r.severity || '').toUpperCase();
      if (counts[sev] !== undefined) {
        counts[sev] += 1;
      } else {
        counts['MODERATE'] += 1;
      }
    });
    return [
      { name: 'CRITICAL', count: counts.CRITICAL, fill: SEVERITY_COLORS.CRITICAL },
      { name: 'HIGH', count: counts.HIGH, fill: SEVERITY_COLORS.HIGH },
      { name: 'MODERATE', count: counts.MODERATE, fill: SEVERITY_COLORS.MODERATE },
      { name: 'LOW', count: counts.LOW, fill: SEVERITY_COLORS.LOW },
    ].filter((d) => d.count > 0 || reports.length > 0);
  }, [filteredReports, reports.length]);

  // Chart D: Reports Over Time (Grouped by Date)
  const reportsOverTimeData = useMemo(() => {
    if (filteredReports.length === 0) return [];

    const dateMap: Record<string, number> = {};
    // Sort chronological
    const sorted = [...filteredReports].sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    sorted.forEach((r) => {
      if (!r.createdAt) return;
      const d = new Date(r.createdAt);
      // Format as DD/MM or Month Day
      const dateKey = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      dateMap[dateKey] = (dateMap[dateKey] || 0) + 1;
    });

    return Object.entries(dateMap).map(([date, reports]) => ({
      date,
      reports,
    }));
  }, [filteredReports]);

  // Chart E: Cleanup Activity (From real cleanup_records and cleaned reports)
  const cleanupActivityData = useMemo(() => {
    if (cleanupRecords.length === 0 && reports.length === 0) return [];

    const activityByDate: Record<string, { date: string; cleanups: number; wasteKg: number }> = {};

    // 1. Process cleanup_records
    cleanupRecords.forEach((cr) => {
      if (!cr.completedAt) return;
      const d = new Date(cr.completedAt);
      const dateKey = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!activityByDate[dateKey]) {
        activityByDate[dateKey] = { date: dateKey, cleanups: 0, wasteKg: 0 };
      }
      activityByDate[dateKey].cleanups += 1;
      const kg = Number(cr.wasteWeight ?? cr.dryWeightKg ?? 0);
      if (!isNaN(kg)) {
        activityByDate[dateKey].wasteKg += kg;
      }
    });

    // 2. If no cleanup_records, extract from cleaned reports
    if (cleanupRecords.length === 0) {
      filteredReports
        .filter((r) => r.status === 'CLEANED' || r.status === 'VERIFIED_CLOSED')
        .forEach((r) => {
          const timestamp = r.cleanedAt || r.updatedAt || r.createdAt;
          if (!timestamp) return;
          const d = new Date(timestamp);
          const dateKey = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          if (!activityByDate[dateKey]) {
            activityByDate[dateKey] = { date: dateKey, cleanups: 0, wasteKg: 0 };
          }
          activityByDate[dateKey].cleanups += 1;
        });
    }

    return Object.values(activityByDate);
  }, [cleanupRecords, filteredReports, reports.length]);

  // 5. Paginated Table Rows
  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredReports.slice(startIndex, startIndex + pageSize);
  }, [filteredReports, currentPage]);

  const totalPages = Math.ceil(filteredReports.length / pageSize) || 1;

  // Reset all filters
  const handleResetFilters = () => {
    setFilterStatus('all');
    setFilterSeverity('all');
    setFilterType('all');
    setFilterDateRange('all');
    setFilterOrg('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const isAnyFilterActive =
    filterStatus !== 'all' ||
    filterSeverity !== 'all' ||
    filterType !== 'all' ||
    filterDateRange !== 'all' ||
    filterOrg !== 'all' ||
    searchQuery.trim() !== '';

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-mono tracking-widest uppercase text-emerald-400 font-bold">
                Live Firestore Operations Center · Visakhapatnam Maritime Zone
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              BlueShield Operations &amp; Coastal Telemetry
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Real-time monitoring of coastal pollution incidents, municipal routing, field cleanup verification, and longitudinal marine debris trends along the Andhra Pradesh shoreline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto text-xs font-mono">
            <div className="px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700/80 text-slate-300 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>
                Synced:{' '}
                {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('/report')}
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>+ File Incident</span>
            </button>
          </div>
        </div>

        {firestoreError && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{firestoreError}</span>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* KPI 1: Total Reports */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Reports</span>
            <Activity className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {kpiData.totalReports}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Live Firestore Records
            </div>
          </div>
        </div>

        {/* KPI 2: Pending Verification */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Pending Verification</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
              {kpiData.pendingVerification}
            </div>
            <div className="text-[10px] text-amber-700/80 font-mono mt-0.5">
              Awaiting Coordinator Review
            </div>
          </div>
        </div>

        {/* KPI 3: Active Tasks */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Active Tasks</span>
            <Send className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight">
              {kpiData.activeTasks}
            </div>
            <div className="text-[10px] text-blue-700/80 font-mono mt-0.5">
              Dispatched or In-Progress
            </div>
          </div>
        </div>

        {/* KPI 4: Resolved Reports */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Resolved Reports</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
              {kpiData.resolvedReports}
            </div>
            <div className="text-[10px] text-emerald-700/80 font-mono mt-0.5">
              Cleaned &amp; Verified Closed
            </div>
          </div>
        </div>

        {/* KPI 5: High/Critical Reports */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">High / Critical</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">
              {kpiData.highCriticalReports}
            </div>
            <div className="text-[10px] text-rose-700/80 font-mono mt-0.5">
              Urgent Shoreline Risks
            </div>
          </div>
        </div>

        {/* KPI 6: Recurring Hotspots */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Recurring Hotspots</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-orange-600 tracking-tight">
              {kpiData.recurringHotspots}
            </div>
            <div className="text-[10px] text-orange-700/80 font-mono mt-0.5">
              Sites with ≥ 2 Incidents
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-teal-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Telemetry Filters &amp; Incident Query
            </h2>
            {isAnyFilterActive && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-teal-50 text-teal-700 border border-teal-200 font-bold">
                Filtered: {filteredReports.length} of {reports.length}
              </span>
            )}
          </div>

          {isAnyFilterActive && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search report #, type, zone, org..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-600 bg-slate-50/50"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-2.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending Verification</option>
              <option value="VERIFIED">Verified (Ready to Assign)</option>
              <option value="ACTIVE">Active (Dispatched/In Progress)</option>
              <option value="CLEANED">Cleaned (Pending Closure)</option>
              <option value="VERIFIED_CLOSED">Verified Closed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={filterSeverity}
              onChange={(e) => {
                setFilterSeverity(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-2.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
            >
              <option value="all">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MODERATE">Moderate</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Pollution Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-2.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-teal-600 truncate"
            >
              <option value="all">All Pollution Types</option>
              {uniquePollutionTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <select
              value={filterDateRange}
              onChange={(e) => {
                setFilterDateRange(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-2.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Second Row: Organization Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <span className="text-[11px] text-slate-500 font-medium shrink-0 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Assigned Organization:</span>
          </span>
          <select
            value={filterOrg}
            onChange={(e) => {
              setFilterOrg(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-80 py-1.5 px-2.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
          >
            <option value="all">All Organizations</option>
            <option value="__unassigned__">Unassigned / Pending Routing</option>
            {uniqueOrganizations.map((org) => (
              <option key={org} value={org}>
                {org}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Charts Section (Using Recharts) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Longitudinal Incident Analytics &amp; Debris Metrics
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Generated from {filteredReports.length} Active Records
          </span>
        </div>

        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-2">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="text-xs font-bold text-slate-800">No Analytics Data to Display</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              There are no reports matching the active filters. Adjust your filter selections or file a new incident to generate charts.
            </p>
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 text-xs text-teal-600 font-bold hover:underline"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Chart 1: Reports by Status */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800">
                  Reports by Lifecycle Status
                </span>
                <span className="text-[10px] font-mono text-slate-400">Total: {filteredReports.length}</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#1e293b',
                        borderRadius: '0.5rem',
                        fontSize: '11px',
                        color: '#f8fafc',
                      }}
                      itemStyle={{ color: '#38bdf8' }}
                    />
                    <Bar dataKey="count" name="Reports" radius={[4, 4, 0, 0]}>
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-status-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Reports by Severity */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800">
                  Reports by Hazard Severity Level
                </span>
                <span className="text-[10px] font-mono text-slate-400">4-Tier Risk Matrix</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={severityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#1e293b',
                        borderRadius: '0.5rem',
                        fontSize: '11px',
                        color: '#f8fafc',
                      }}
                    />
                    <Bar dataKey="count" name="Reports" radius={[4, 4, 0, 0]}>
                      {severityChartData.map((entry, index) => (
                        <Cell key={`cell-sev-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Reports by Pollution Type */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800">
                  Reports by Pollution Classification
                </span>
                <span className="text-[10px] font-mono text-slate-400">Category Breakdown</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={pollutionTypeChartData}
                    margin={{ top: 10, right: 20, left: 30, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 10, fill: '#334155' }}
                      width={90}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#1e293b',
                        borderRadius: '0.5rem',
                        fontSize: '11px',
                        color: '#f8fafc',
                      }}
                    />
                    <Bar dataKey="count" name="Incidents" radius={[0, 4, 4, 0]}>
                      {pollutionTypeChartData.map((entry, index) => (
                        <Cell key={`cell-type-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Reports Over Time */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800">
                  Reports Over Time (Temporal Trend)
                </span>
                <span className="text-[10px] font-mono text-slate-400">Timeline Influx</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reportsOverTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <defs>
                      <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#1e293b',
                        borderRadius: '0.5rem',
                        fontSize: '11px',
                        color: '#f8fafc',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="reports"
                      name="Reports"
                      stroke="#0d9488"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorReports)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 5: Cleanup Activity (Span full width) */}
            <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <span className="text-xs font-bold text-slate-800">
                    Cleanup Activity &amp; Physical Remediation Output
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Tracking field team completions and recovered waste tonnage across Visakhapatnam coves.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                  {cleanupActivityData.reduce((acc, curr) => acc + curr.cleanups, 0)} Completed Tasks
                </span>
              </div>
              <div className="h-64 w-full">
                {cleanupActivityData.length === 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 space-y-1">
                    <CheckCircle2 className="w-6 h-6 text-slate-300" />
                    <p className="text-xs font-medium">No cleanup completions logged in current selection</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cleanupActivityData} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#1e293b',
                          borderRadius: '0.5rem',
                          fontSize: '11px',
                          color: '#f8fafc',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Bar yAxisId="left" dataKey="cleanups" name="Completed Cleanups" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="wasteKg" name="Recovered Waste (kg)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-0">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-teal-600" />
              <span>Recent Incident Activity Feed</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Detailed records logged from citizen ground observers and coastal sensors.
            </p>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Showing{' '}
            <strong className="text-slate-800">
              {filteredReports.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-slate-800">
              {Math.min(currentPage * pageSize, filteredReports.length)}
            </strong>{' '}
            of <strong className="text-slate-800">{filteredReports.length}</strong> records
          </div>
        </div>

        {/* Empty State for Zero Records */}
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">No Incidents Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No reports matched your search filters or the database has zero records for this criteria.
              </p>
            </div>
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-2xs cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-bold">Report ID</th>
                  <th className="py-3 px-4 font-bold">Pollution Type</th>
                  <th className="py-3 px-4 font-bold">Severity</th>
                  <th className="py-3 px-4 font-bold">Location</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Created</th>
                  <th className="py-3 px-4 font-bold">Assigned Organization</th>
                  <th className="py-3 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedReports.map((rep) => {
                  const sev = (rep.severity || 'MODERATE').toUpperCase();
                  const sevColor =
                    sev === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : sev === 'HIGH'
                      ? 'bg-orange-100 text-orange-800 border-orange-200'
                      : sev === 'MODERATE'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200';

                  const statusClass =
                    rep.status === 'REPORTED' || rep.status === 'pending_verification'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : rep.status === 'VERIFIED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : rep.status === 'ASSIGNED' || rep.status === 'ACCEPTED'
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : rep.status === 'IN_PROGRESS'
                      ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                      : rep.status === 'CLEANED' || rep.status === 'VERIFIED_CLOSED'
                      ? 'bg-teal-50 text-teal-800 border-teal-200 font-bold'
                      : 'bg-slate-100 text-slate-800 border-slate-200';

                  return (
                    <tr
                      key={rep.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => onNavigate(`/assignments/${rep.id}` as AppRoute)}
                    >
                      {/* Report ID */}
                      <td className="py-3 px-4 font-mono font-bold text-teal-800 whitespace-nowrap">
                        {rep.reportNumber || rep.id.substring(0, 10)}
                      </td>

                      {/* Pollution Type */}
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {rep.pollutionType}
                      </td>

                      {/* Severity */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <SeverityBadge severity={rep.severity} size="sm" />
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 max-w-[180px] truncate" title={rep.coastalZone || `${rep.latitude}, ${rep.longitude}`}>
                        <div className="flex items-center gap-1 text-slate-700">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {rep.coastalZone || `${rep.latitude.toFixed(3)}°N, ${rep.longitude.toFixed(3)}°E`}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={rep.status} size="sm" />
                      </td>

                      {/* Created */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {rep.createdAt ? (
                          new Date(rep.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        ) : (
                          'N/A'
                        )}
                      </td>

                      {/* Assigned Organization */}
                      <td className="py-3 px-4 max-w-[200px] truncate whitespace-nowrap">
                        {rep.assignedOrganization ? (
                          <div className="flex items-center gap-1.5 text-slate-800 font-medium truncate">
                            <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span className="truncate">{rep.assignedOrganization}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px] italic">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate(`/assignments/${rep.id}` as AppRoute);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 font-bold text-[11px] transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Pagination */}
        {filteredReports.length > pageSize && (
          <div className="p-3 border-t border-slate-200 flex items-center justify-between bg-slate-50/50 text-xs">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 font-semibold disabled:opacity-40 hover:bg-white cursor-pointer"
            >
              Previous
            </button>
            <span className="text-slate-500 font-mono text-[11px]">
              Page <strong className="text-slate-900">{currentPage}</strong> of{' '}
              <strong className="text-slate-900">{totalPages}</strong>
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 font-semibold disabled:opacity-40 hover:bg-white cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
