import React, { useState, useEffect } from 'react';
import { AppRoute } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { useIncidents } from '../context/IncidentContext';
import {
  subscribeToReportedReports,
  verifyOrUpdateReport,
} from '../services/reportService';
import { logActivity } from '../services/activityLogService';
import { ReportDoc } from '../types/firestore';
import { SeverityBadge, StatusBadge } from '../components/ui/StatusBadge';
import { POLLUTION_TYPES, SEVERITY_LEVELS } from './ReportPage';
import { ReportLocationMap } from '../components/map/ReportLocationMap';
import {
  CheckCircle2,
  XCircle,
  Copy,
  HelpCircle,
  AlertTriangle,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  ShieldAlert,
  Edit3,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Eye,
  Check,
  Info,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';

interface VerifyPageProps {
  onNavigate: (route: AppRoute) => void;
}

export const VerifyPage: React.FC<VerifyPageProps> = ({ onNavigate }) => {
  const { role, user, isAuthenticated, switchRole } = useAuth();
  const { reports: contextReports, updateReportStatusDirect } = useIncidents();

  // Verification Queue State
  const [reports, setReports] = useState<ReportDoc[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Edit / Form state for selected report
  const [editedPollutionType, setEditedPollutionType] = useState<string>('');
  const [editedSeverity, setEditedSeverity] = useState<string>('');
  const [verificationNotes, setVerificationNotes] = useState<string>('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    reportId?: string;
    actionType?: string;
  } | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // RBAC Access Gate: Accessible ONLY to COORDINATOR and ADMIN
  const isAuthorized = role === 'COORDINATOR' || role === 'ADMIN';

  // Real-time Firestore subscription to REPORTED reports
  useEffect(() => {
    if (!isAuthorized) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToReportedReports(
      (reportedDocs) => {
        setReports(reportedDocs);
        setIsLoading(false);

        // Keep or select first report
        setSelectedReportId((currentSelected) => {
          if (currentSelected && reportedDocs.some((r) => r.id === currentSelected)) {
            return currentSelected;
          }
          return reportedDocs.length > 0 ? reportedDocs[0].id : null;
        });
      },
      (err) => {
        console.warn('Subscription error, checking fallback from context:', err);
        // Fallback to local incident context if firestore listener is interrupted
        const fallbackDocs: ReportDoc[] = contextReports
          .filter((r) => r.status === 'REPORTED' || r.status === 'pending_verification')
          .map((r) => ({
            id: r.id,
            reportNumber: r.reportNumber || r.trackingCode,
            reportedBy: r.reportedByName,
            latitude: r.location.latitude,
            longitude: r.location.longitude,
            pollutionType: r.pollutionType || 'Plastic',
            severity: (r.severity.toUpperCase() as any) || 'MODERATE',
            description: r.description,
            photoUrl: r.photoUrl || r.imageUrl,
            status: r.status,
            createdAt: r.reportedAt,
            title: r.title,
            coastalZone: r.location.coastalZoneName,
          }));
        setReports(fallbackDocs);
        setIsLoading(false);
        if (fallbackDocs.length > 0 && !selectedReportId) {
          setSelectedReportId(fallbackDocs[0].id);
        }
      }
    );

    return () => unsubscribe();
  }, [isAuthorized, contextReports]);

  // Update editor inputs when selected report changes
  const activeReport = reports.find((r) => r.id === selectedReportId) || null;

  useEffect(() => {
    if (activeReport) {
      setEditedPollutionType(activeReport.pollutionType);
      setEditedSeverity(activeReport.severity);
      setVerificationNotes('');
      setActionFeedback(null);
    }
  }, [activeReport?.id]);

  // Filtered reports
  const filteredReports = reports.filter((rep) => {
    const matchesSearch =
      rep.reportNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.reportedBy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.pollutionType?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || rep.pollutionType === filterType;
    return matchesSearch && matchesType;
  });

  // Action Handler: VERIFY, REJECT, DUPLICATE, NEEDS_MORE_INFO
  const handleExecuteAction = async (
    actionType: 'VERIFY' | 'REJECT' | 'DUPLICATE' | 'NEEDS_MORE_INFO'
  ) => {
    if (!activeReport) return;

    setActionInProgress(actionType);
    setActionFeedback(null);

    const coordinatorName =
      user?.name || user?.displayName || (user?.email ? user.email.split('@')[0] : 'Municipal Coordinator');
    const coordinatorId = user?.id || 'coord-active';

    let targetStatus: ReportDoc['status'] = 'VERIFIED';
    let activityAction = 'VERIFY_REPORT';
    let defaultLogText = '';

    switch (actionType) {
      case 'VERIFY':
        targetStatus = 'VERIFIED';
        activityAction = 'VERIFY_REPORT';
        defaultLogText = `Coordinator verified report as authentic ground-truth incident. Type: ${editedPollutionType}, Severity: ${editedSeverity}.`;
        break;
      case 'REJECT':
        targetStatus = 'REJECTED';
        activityAction = 'REJECT_REPORT';
        defaultLogText = `Coordinator rejected report as non-hazardous, out of scope, or invalid photographic evidence.`;
        break;
      case 'DUPLICATE':
        targetStatus = 'DUPLICATE';
        activityAction = 'MARK_DUPLICATE';
        defaultLogText = `Report marked as duplicate of an existing active coastal incident ticket.`;
        break;
      case 'NEEDS_MORE_INFO':
        targetStatus = 'NEEDS_MORE_INFO';
        activityAction = 'REQUEST_MORE_INFO';
        defaultLogText = `Coordinator requested further photographic clarity or updated shoreline tide coordinates from reporter.`;
        break;
    }

    const finalNotes = verificationNotes.trim() || defaultLogText;

    try {
      // 1. Update Cloud Firestore
      await verifyOrUpdateReport(activeReport.id, {
        status: targetStatus,
        pollutionType: editedPollutionType,
        severity: editedSeverity,
        verifiedBy: coordinatorName,
        notes: finalNotes,
      });

      // 2. Create Audit Activity Log in Firestore
      try {
        await logActivity({
          actorId: coordinatorId,
          actorName: coordinatorName,
          actorRole: role,
          action: activityAction,
          entityType: 'report',
          entityId: activeReport.id,
          metadata: JSON.stringify({
            reportNumber: activeReport.reportNumber,
            pollutionType: editedPollutionType,
            severity: editedSeverity,
            previousStatus: activeReport.status,
            newStatus: targetStatus,
            notes: finalNotes,
            humanVerifier: coordinatorName,
          }),
        });
      } catch (logErr) {
        console.warn('Activity log write error (continuing):', logErr);
      }

      // 3. Update Incident Context for synchronized global state
      updateReportStatusDirect(activeReport.id, {
        status: targetStatus as any,
        pollutionType: editedPollutionType,
        severity: editedSeverity.toLowerCase() as any,
      });

      // 4. Update local list state
      setReports((prev) => prev.filter((r) => r.id !== activeReport.id));

      setActionFeedback({
        type: 'success',
        message: `Report ${activeReport.reportNumber} status set to ${targetStatus}.`,
        reportId: activeReport.id,
        actionType,
      });

      // Select next report in queue
      const remaining = reports.filter((r) => r.id !== activeReport.id);
      if (remaining.length > 0) {
        setSelectedReportId(remaining[0].id);
      } else {
        setSelectedReportId(null);
      }
    } catch (err: unknown) {
      console.error('Verification action failed:', err);
      const msg = err instanceof Error ? err.message : 'Action could not be completed.';
      setActionFeedback({
        type: 'error',
        message: msg,
      });
    } finally {
      setActionInProgress(null);
    }
  };

  // RESTRICTED ACCESS SCREEN: If user is not COORDINATOR or ADMIN
  if (!isAuthenticated || !isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-rose-200 shadow-md p-6 sm:p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Human Verification Gate: Restricted Access
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed max-w-md mx-auto">
              The <strong>/verify</strong> workflow is restricted exclusively to authorized{' '}
              <strong className="text-teal-700">COORDINATOR</strong> and{' '}
              <strong className="text-teal-700">ADMIN</strong> personnel. Public citizen reporters cannot verify or modify reports.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-2 max-w-md mx-auto font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Current Role:</span>
              <span className="font-bold text-rose-700">{role || 'GUEST'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Authorized Roles:</span>
              <span className="font-bold text-teal-700">COORDINATOR, ADMIN</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Active Account:</span>
              <span className="text-slate-800 truncate max-w-[200px]">{user?.email || 'None'}</span>
            </div>
          </div>

          {/* Quick Persona Switcher for Preview / Testing */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-700 block mb-2">
              Switch to an authorized role to test this page:
            </span>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => switchRole('COORDINATOR')}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                Switch to COORDINATOR
              </button>
              <button
                type="button"
                onClick={() => switchRole('ADMIN')}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                Switch to ADMIN
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-mono font-semibold uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Human Verification Workflow · Visakhapatnam Coastal Directorate</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Verification Queue (Status: REPORTED)
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Exclusively human verification. Assess uploaded photographs, confirm coordinates, and authorize or triage reports.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono font-bold flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{reports.length} Awaiting Review</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/dashboard')}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer shadow-2xs"
          >
            Operations Dashboard
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionFeedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{actionFeedback.message}</span>
            {actionFeedback.actionType === 'VERIFY' && actionFeedback.reportId && (
              <button
                type="button"
                onClick={() => onNavigate(`/assignments/${actionFeedback.reportId}` as AppRoute)}
                className="ml-2 px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] shadow-2xs transition-all cursor-pointer"
              >
                Assign to Organization &rarr;
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Efficient Desktop & Tablet Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: Queue List & Filters (4 Cols on Desktop) */}
        <div className="lg:col-span-4 xl:col-span-4 space-y-3">
          
          {/* Search & Filter Bar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search report #, description, user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full py-1 px-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-hidden"
              >
                <option value="all">All Pollution Types</option>
                {POLLUTION_TYPES.map((pt) => (
                  <option key={pt} value={pt}>
                    {pt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Queue List Container */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>Pending Verification Queue</span>
              </span>
              <span className="font-mono text-[11px] bg-slate-200 px-2 py-0.5 rounded-full text-slate-700">
                {filteredReports.length}
              </span>
            </div>

            {isLoading ? (
              <div className="p-8 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600 mx-auto" />
                <p className="text-xs text-slate-500">Loading incoming reports...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-800">Queue is Clear</p>
                <p className="text-[11px] text-slate-500">
                  No reports currently in REPORTED status. All submissions have been triaged by human verifiers.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('/report')}
                  className="mt-2 text-xs text-teal-700 font-semibold hover:underline"
                >
                  Submit a test report &rarr;
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[calc(100vh-280px)] overflow-y-auto">
                {filteredReports.map((report) => {
                  const isSelected = report.id === selectedReportId;
                  const severityConfig = SEVERITY_LEVELS.find((s) => s.key === report.severity.toUpperCase());

                  return (
                    <button
                      key={report.id}
                      type="button"
                      onClick={() => setSelectedReportId(report.id)}
                      className={`w-full text-left p-3 transition-colors cursor-pointer flex gap-3 ${
                        isSelected
                          ? 'bg-teal-50/70 border-l-4 border-l-teal-600 shadow-2xs'
                          : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                      }`}
                    >
                      {/* Photo Thumbnail */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                        {report.photoUrl ? (
                          <img
                            src={report.photoUrl}
                            alt="Incident thumb"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px] text-center p-1 font-mono">
                            No Photo
                          </div>
                        )}
                      </div>

                      {/* Content summary */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-900 truncate">
                            {report.reportNumber}
                          </span>
                          <SeverityBadge severity={report.severity} size="sm" />
                        </div>

                        <div className="text-xs font-semibold text-slate-700 truncate">
                          {report.pollutionType}
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>
                            {new Date(report.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Inspection & Decision Studio (8 Cols on Desktop) */}
        <div className="lg:col-span-8 xl:col-span-8">
          {activeReport ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-5">
              
              {/* Header with Report # and Human Verification Notice */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-black text-slate-900">
                      {activeReport.reportNumber}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      {activeReport.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Reported by <strong className="text-slate-700">{activeReport.reportedBy || 'Citizen Observer'}</strong> on{' '}
                    {new Date(activeReport.createdAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>

                <div className="p-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-[11px] flex items-center gap-2 max-w-xs">
                  <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                  <span className="leading-tight">
                    <strong>Human Verification Protocol:</strong> Verified by accredited municipal coordinator.
                  </span>
                </div>
              </div>

              {/* Evidence Photo & Map Inspection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Photo Evidence Display */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Photographic Evidence</span>
                    {activeReport.photoUrl && (
                      <a
                        href={activeReport.photoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-teal-700 font-semibold hover:underline flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Full Size</span>
                      </a>
                    )}
                  </span>

                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 h-56 sm:h-64 flex items-center justify-center relative">
                    {activeReport.photoUrl ? (
                      <img
                        src={activeReport.photoUrl}
                        alt="Evidence for verification"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-center p-4 text-slate-400 text-xs">
                        <AlertTriangle className="w-8 h-8 text-slate-500 mx-auto mb-1" />
                        <span>No photograph attached with this report.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Map Location Display */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Geotagged Shoreline Location</span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {activeReport.latitude.toFixed(4)}&deg; N, {activeReport.longitude.toFixed(4)}&deg; E
                    </span>
                  </span>

                  <ReportLocationMap
                    latitude={activeReport.latitude}
                    longitude={activeReport.longitude}
                    reportNumber={activeReport.reportNumber}
                    pollutionType={activeReport.pollutionType}
                    heightClass="h-56 sm:h-64"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                  Citizen Description:
                </span>
                <p className="text-slate-800 leading-relaxed">
                  {activeReport.description || 'No detailed description provided.'}
                </p>
              </div>

              {/* Coordinator Modification Controls */}
              <div className="bg-teal-50/40 p-4 rounded-xl border border-teal-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-teal-600" />
                    <span>Coordinator Classification Review</span>
                  </span>
                  <span className="text-[11px] text-teal-800 font-mono">
                    Adjust classification prior to approval
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Pollution Type Picker */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Pollution Type
                    </label>
                    <select
                      value={editedPollutionType}
                      onChange={(e) => setEditedPollutionType(e.target.value)}
                      className="w-full py-2 px-3 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
                    >
                      {POLLUTION_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Severity Level Picker */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Assessed Severity Level
                    </label>
                    <select
                      value={editedSeverity}
                      onChange={(e) => setEditedSeverity(e.target.value)}
                      className="w-full py-2 px-3 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
                    >
                      {SEVERITY_LEVELS.map((lvl) => (
                        <option key={lvl.key} value={lvl.key}>
                          {lvl.label} — {lvl.desc}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Coordinator Verification Notes */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Coordinator Assessment Notes (Stored in Audit Trail)
                  </label>
                  <input
                    type="text"
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="e.g. Confirmed high-tide plastic drift choking storm outfall; escalated to GVMC rapid sanitation crew."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              </div>

              {/* Action Buttons: 4 Required Actions */}
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2.5">
                  Execute Human Verification Action:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  
                  {/* 1. VERIFY (Sets status = VERIFIED, stores verifiedBy & verifiedAt) */}
                  <button
                    type="button"
                    disabled={Boolean(actionInProgress)}
                    onClick={() => handleExecuteAction('VERIFY')}
                    className="py-3 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs shadow-md transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50 select-none active:scale-98"
                  >
                    {actionInProgress === 'VERIFY' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>VERIFY REPORT</span>
                    <span className="text-[10px] font-normal opacity-90">status = VERIFIED</span>
                  </button>

                  {/* 2. REJECT (Sets status = REJECTED) */}
                  <button
                    type="button"
                    disabled={Boolean(actionInProgress)}
                    onClick={() => handleExecuteAction('REJECT')}
                    className="py-3 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs shadow-md transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50 select-none active:scale-98"
                  >
                    {actionInProgress === 'REJECT' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    <span>REJECT REPORT</span>
                    <span className="text-[10px] font-normal opacity-90">status = REJECTED</span>
                  </button>

                  {/* 3. MARK DUPLICATE (Sets status = DUPLICATE) */}
                  <button
                    type="button"
                    disabled={Boolean(actionInProgress)}
                    onClick={() => handleExecuteAction('DUPLICATE')}
                    className="py-3 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs shadow-md transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50 select-none active:scale-98"
                  >
                    {actionInProgress === 'DUPLICATE' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span>MARK DUPLICATE</span>
                    <span className="text-[10px] font-normal opacity-90">status = DUPLICATE</span>
                  </button>

                  {/* 4. REQUEST MORE INFORMATION (Sets status = NEEDS_MORE_INFO) */}
                  <button
                    type="button"
                    disabled={Boolean(actionInProgress)}
                    onClick={() => handleExecuteAction('NEEDS_MORE_INFO')}
                    className="py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-md transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50 select-none active:scale-98"
                  >
                    {actionInProgress === 'NEEDS_MORE_INFO' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <HelpCircle className="w-4 h-4" />
                    )}
                    <span>MORE INFO REQ</span>
                    <span className="text-[10px] font-normal opacity-90">status = NEEDS_MORE_INFO</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-teal-600 mx-auto" />
              <h2 className="text-base font-bold text-slate-800">
                No Report Selected
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select an incoming report from the pending queue on the left to begin human photographic inspection.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
