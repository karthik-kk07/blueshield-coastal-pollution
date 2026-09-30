import React, { useState, useEffect, useRef } from 'react';
import { AppRoute } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { useIncidents } from '../context/IncidentContext';
import { getReport, assignReport } from '../services/reportService';
import { listOrganizations } from '../services/organizationService';
import { logActivity } from '../services/activityLogService';
import {
  acceptFieldTask,
  startFieldCleanup,
  createCleanupRecord,
  verifyClosure,
  getCleanupRecordForReport,
} from '../services/cleanupService';
import { ReportDoc, OrganizationDoc, CleanupRecordDoc, TaskState } from '../types/firestore';
import { StatusBadge, SeverityBadge } from '../components/ui/StatusBadge';
import { ReportLocationMap } from '../components/map/ReportLocationMap';
import { SEVERITY_LEVELS } from './ReportPage';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  AlertTriangle,
  Loader2,
  FileText,
  ShieldCheck,
  Cpu,
  Phone,
  Mail,
  Users,
  Compass,
  ChevronRight,
  Eye,
  Camera,
  Upload,
  Check,
  PlayCircle,
  Sparkles,
  Layers,
  Send,
  Scale,
  Hash,
  Maximize2,
  Sliders,
} from 'lucide-react';

interface AssignmentDetailPageProps {
  reportId: string;
  onNavigate: (route: AppRoute) => void;
}

export const AssignmentDetailPage: React.FC<AssignmentDetailPageProps> = ({
  reportId,
  onNavigate,
}) => {
  const { user, role, hasRole, switchRole } = useAuth();
  const { reports: contextReports, updateReportStatusDirect } = useIncidents();

  const [report, setReport] = useState<ReportDoc | null>(null);
  const [cleanupRecord, setCleanupRecord] = useState<CleanupRecordDoc | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationDoc[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Field worker evidence submission form
  const [afterPhotoPreview, setAfterPhotoPreview] = useState<string>('');
  const [wasteWeight, setWasteWeight] = useState<string>('');
  const [wasteCount, setWasteCount] = useState<string>('');
  const [areaCleaned, setAreaCleaned] = useState<string>('');
  const [cleanupNotes, setCleanupNotes] = useState<string>('');

  // Before/after comparison view toggle
  const [comparisonMode, setComparisonMode] = useState<'side_by_side' | 'toggle'>('side_by_side');
  const [activePhotoToggle, setActivePhotoToggle] = useState<'before' | 'after'>('after');

  // Assignment / Reassignment Form State
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [responsiblePerson, setResponsiblePerson] = useState<string>('');
  const [dispatchNotes, setDispatchNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // File input ref for camera / photo upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchData();
  }, [reportId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Report
      let repDoc = await getReport(reportId);
      if (!repDoc) {
        // Fallback to local incident context
        const localMatch = contextReports.find((r) => r.id === reportId);
        if (localMatch) {
          repDoc = {
            id: localMatch.id,
            reportNumber: localMatch.reportNumber || localMatch.trackingCode,
            reportedBy: localMatch.reportedByName,
            latitude: localMatch.location.latitude,
            longitude: localMatch.location.longitude,
            pollutionType: localMatch.pollutionType || 'Plastic',
            severity: (localMatch.severity.toUpperCase() as any) || 'MODERATE',
            description: localMatch.description,
            photoUrl: localMatch.photoUrl || localMatch.imageUrl,
            status: localMatch.status,
            createdAt: localMatch.reportedAt,
            title: localMatch.title,
            coastalZone: localMatch.location.coastalZoneName,
            assignedOrganization: localMatch.assignedOrganization,
            assignedTo: localMatch.assignedTo,
            assignedAt: localMatch.assignedAt,
          };
        }
      }

      setReport(repDoc);

      // 2. Fetch Cleanup Record if already cleaned or closed
      if (repDoc) {
        const cleanRec = await getCleanupRecordForReport(repDoc.id);
        if (cleanRec) {
          setCleanupRecord(cleanRec);
          if (cleanRec.afterPhoto) {
            setAfterPhotoPreview(cleanRec.afterPhoto);
          }
        } else if (repDoc.afterPhotoUrl) {
          setAfterPhotoPreview(repDoc.afterPhotoUrl);
        }
      }

      // 3. Fetch Organizations
      const orgList = await listOrganizations();
      const activeOrgs = orgList.filter((o) => o.active);
      setOrganizations(activeOrgs);

      if (activeOrgs.length > 0) {
        const currentOrg = activeOrgs.find((o) => o.name === repDoc?.assignedOrganization);
        if (currentOrg) {
          setSelectedOrgId(currentOrg.id);
        } else {
          setSelectedOrgId(activeOrgs[0].id);
        }
      }

      if (repDoc?.assignedTo) {
        setResponsiblePerson(repDoc.assignedTo);
      }
      if (repDoc?.notes) {
        setDispatchNotes(repDoc.notes);
      }
    } catch (err) {
      console.error('Error loading report or organizations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Task Action: ACCEPT TASK
  const handleAcceptTask = async () => {
    if (!report) return;
    const workerName = user?.displayName || user?.name || 'Field Response Team Lead';
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await acceptFieldTask(report.id, workerName);

      // Log activity
      await logActivity({
        actorId: user?.id || 'worker-uid',
        actorName: workerName,
        actorRole: role,
        action: 'ACCEPT_TASK',
        entityType: 'report',
        entityId: report.id,
        metadata: JSON.stringify({ reportNumber: report.reportNumber, status: 'ACCEPTED' }),
      });

      setReport((prev) =>
        prev
          ? {
              ...prev,
              status: 'ACCEPTED',
              acceptedBy: workerName,
              acceptedAt: new Date().toISOString(),
            }
          : null
      );
      updateReportStatusDirect(report.id, { status: 'ACCEPTED' as any });

      setFeedback({
        type: 'success',
        message: `Task ${report.reportNumber} accepted! Status transitioned to ACCEPTED. You can now mobilize to the shoreline.`,
      });
    } catch (err: unknown) {
      console.error('Failed to accept task:', err);
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Could not accept task.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Task Action: START CLEANUP
  const handleStartCleanup = async () => {
    if (!report) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await startFieldCleanup(report.id);

      const workerName = user?.displayName || user?.name || 'Field Response Team';
      await logActivity({
        actorId: user?.id || 'worker-uid',
        actorName: workerName,
        actorRole: role,
        action: 'START_CLEANUP',
        entityType: 'report',
        entityId: report.id,
        metadata: JSON.stringify({ reportNumber: report.reportNumber, status: 'IN_PROGRESS' }),
      });

      setReport((prev) =>
        prev
          ? {
              ...prev,
              status: 'IN_PROGRESS',
              startedAt: new Date().toISOString(),
            }
          : null
      );
      updateReportStatusDirect(report.id, { status: 'IN_PROGRESS' as any });

      setFeedback({
        type: 'success',
        message: `Cleanup in progress! Gather waste, take after-cleanup photos, and submit measurements.`,
      });
    } catch (err: unknown) {
      console.error('Failed to start cleanup:', err);
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Could not start cleanup.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Photo file upload handler
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Use FileReader for instant client-side base64 preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAfterPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 3. Task Action: MARK CLEANED (Submits cleanup evidence)
  const handleMarkCleaned = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report) return;

    if (!afterPhotoPreview) {
      setFeedback({
        type: 'error',
        message: 'After-cleanup photo evidence is required before marking this incident as cleaned.',
      });
      return;
    }

    const workerName = user?.displayName || user?.name || 'Coastal Response Officer';
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const createdRecord = await createCleanupRecord({
        reportId: report.id,
        beforePhoto: report.photoUrl || '',
        afterPhoto: afterPhotoPreview,
        wasteWeight: wasteWeight ? parseFloat(wasteWeight) : undefined,
        wasteCount: wasteCount ? parseInt(wasteCount, 10) : undefined,
        areaCleaned: areaCleaned || undefined,
        notes: cleanupNotes || undefined,
        completedBy: workerName,
      });

      setCleanupRecord(createdRecord);

      // Activity log
      await logActivity({
        actorId: user?.id || 'worker-uid',
        actorName: workerName,
        actorRole: role,
        action: 'MARK_CLEANED',
        entityType: 'report',
        entityId: report.id,
        metadata: JSON.stringify({
          reportNumber: report.reportNumber,
          wasteWeight: wasteWeight || null,
          wasteCount: wasteCount || null,
          status: 'CLEANED',
        }),
      });

      setReport((prev) =>
        prev
          ? {
              ...prev,
              status: 'CLEANED',
              afterPhotoUrl: afterPhotoPreview,
              cleanedAt: new Date().toISOString(),
              cleanupRecordId: createdRecord.id,
            }
          : null
      );
      updateReportStatusDirect(report.id, {
        status: 'CLEANED' as any,
        afterPhotoUrl: afterPhotoPreview,
      });

      setFeedback({
        type: 'success',
        message: `Remediation completed! Incident marked as CLEANED. Awaiting final coordinator verification closure.`,
      });
    } catch (err: unknown) {
      console.error('Failed to submit cleanup evidence:', err);
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Could not submit cleanup record.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Closure Action: VERIFY & CLOSE (Coordinator / Admin Only)
  const handleVerifyClosure = async () => {
    if (!report) return;
    const canClose = role === 'COORDINATOR' || role === 'ADMIN';
    if (!canClose) {
      setFeedback({
        type: 'error',
        message: 'Only a COORDINATOR or ADMIN can verify closure of this incident.',
      });
      return;
    }

    const verifierName = user?.displayName || user?.name || 'Chief Environmental Coordinator';
    setIsSubmitting(true);
    setFeedback(null);

    try {
      await verifyClosure(report.id, verifierName, 'Ground remediation inspected and verified clean.');

      // Activity log
      await logActivity({
        actorId: user?.id || 'coord-uid',
        actorName: verifierName,
        actorRole: role,
        action: 'VERIFY_CLOSED',
        entityType: 'report',
        entityId: report.id,
        metadata: JSON.stringify({
          reportNumber: report.reportNumber,
          verifiedBy: verifierName,
          status: 'VERIFIED_CLOSED',
        }),
      });

      const now = new Date().toISOString();
      setReport((prev) =>
        prev
          ? {
              ...prev,
              status: 'VERIFIED_CLOSED',
              verifiedBy: verifierName,
              verifiedAt: now,
              closedAt: now,
            }
          : null
      );
      updateReportStatusDirect(report.id, { status: 'VERIFIED_CLOSED' as any });

      setFeedback({
        type: 'success',
        message: `Incident ${report.reportNumber} has been verified and permanently CLOSED. Excellent coastal stewardship!`,
      });
    } catch (err: unknown) {
      console.error('Failed to verify closure:', err);
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Closure verification could not be completed.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Coordinator Reassignment Handler
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report) return;
    const chosenOrg = organizations.find((o) => o.id === selectedOrgId);
    if (!chosenOrg) return;

    const finalAssignedTo = responsiblePerson.trim() || chosenOrg.contactName || 'Duty Dispatch Team';
    const now = new Date().toISOString();
    setIsSubmitting(true);

    try {
      await assignReport(report.id, {
        assignedOrganization: chosenOrg.name,
        assignedTo: finalAssignedTo,
        notes: dispatchNotes.trim(),
      });

      setReport((prev) =>
        prev
          ? {
              ...prev,
              status: 'ASSIGNED',
              assignedOrganization: chosenOrg.name,
              assignedTo: finalAssignedTo,
              assignedAt: now,
              notes: dispatchNotes.trim(),
            }
          : null
      );
      updateReportStatusDirect(report.id, {
        status: 'ASSIGNED' as any,
        assignedOrganization: chosenOrg.name,
        assignedTo: finalAssignedTo,
      });

      setFeedback({
        type: 'success',
        message: `Incident assigned to ${chosenOrg.name} (${finalAssignedTo}).`,
      });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to assign incident.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading incident assignment studio...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">Incident Report Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested report ID ({reportId}) could not be located in the coastal database.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('/field')}
          className="px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-bold shadow-xs cursor-pointer"
        >
          Return to Field Portal
        </button>
      </div>
    );
  }

  const severityConfig = SEVERITY_LEVELS.find((s) => s.key === report.severity?.toUpperCase());
  const selectedOrg = organizations.find((o) => o.id === selectedOrgId);
  const isCleaned = report.status === 'CLEANED';
  const isClosed = report.status === 'VERIFIED_CLOSED';
  const isCoordinatorOrAdmin = role === 'COORDINATOR' || role === 'ADMIN';

  // Task stepper states
  const stages: { key: TaskState; label: string }[] = [
    { key: 'ASSIGNED', label: '1. Assigned' },
    { key: 'ACCEPTED', label: '2. Accepted' },
    { key: 'IN_PROGRESS', label: '3. In Progress' },
    { key: 'CLEANED', label: '4. Cleaned' },
    { key: 'VERIFIED_CLOSED', label: '5. Closed' },
  ];

  const currentStageIndex = stages.findIndex((s) => s.key === report.status);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
      {/* Top Breadcrumb & Mobile Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigate('/field')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Field Tasks</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            ID: <strong className="text-slate-700">{report.reportNumber}</strong>
          </span>
          <StatusBadge status={report.status} />
        </div>
      </div>

      {/* Action Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer font-bold ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Task Lifecycle Stepper */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-2xs">
        <div className="flex items-center justify-between overflow-x-auto gap-2 no-scrollbar text-xs font-bold">
          {stages.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex || isClosed;
            const isCurrent = idx === currentStageIndex && !isClosed;

            return (
              <div
                key={stage.key}
                className={`flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1.5 rounded-lg transition-colors ${
                  isCurrent
                    ? 'bg-teal-600 text-white shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-400 bg-slate-50'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-current shrink-0" />
                )}
                <span>{stage.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Task Screen Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: Report Details, Map & Evidence */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
            
            {/* Header info */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-900">
                  {report.reportNumber}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    severityConfig?.badgeClass || 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {report.severity} SEVERITY
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-1">
                {report.pollutionType} Marine Incident
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>{report.coastalZone || 'Visakhapatnam Shoreline Sector'}</span>
              </div>
            </div>

            {/* Assigned Organization & Team Badge */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">
                  Assigned Response Unit:
                </span>
                <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-semibold">
                  MUNICIPAL ROUTING
                </span>
              </div>
              <div className="font-bold text-slate-900 flex items-center gap-1.5 pt-0.5">
                <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{report.assignedOrganization || 'Unassigned Task'}</span>
              </div>
              {report.assignedTo && (
                <div className="text-[11px] text-slate-600 font-mono flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Lead Squad: {report.assignedTo}</span>
                </div>
              )}
            </div>

            {/* Photo Preview (Before Photo) */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-700 block">
                Initial Ground-Truth Photo (Before):
              </span>
              <div className="h-56 rounded-xl overflow-hidden bg-slate-950 border border-slate-200 relative group">
                {report.photoUrl ? (
                  <>
                    <img
                      src={report.photoUrl}
                      alt="Incident before cleanup"
                      className="w-full h-full object-cover"
                    />
                    <a
                      href={report.photoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-semibold flex items-center gap-1.5 backdrop-blur-xs shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Full Photo</span>
                    </a>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-mono">
                    No initial photo attached
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Leaflet Map */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-700 block">
                Shoreline Coordinates &amp; Navigation:
              </span>
              <ReportLocationMap
                latitude={report.latitude}
                longitude={report.longitude}
                reportNumber={report.reportNumber}
                pollutionType={report.pollutionType}
                heightClass="h-44"
              />
            </div>

            {/* Citizen Observations */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                Incident Description:
              </span>
              <p className="text-slate-700 leading-relaxed mt-0.5">
                {report.description || 'No detailed observations provided by reporter.'}
              </p>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Field Actions, Evidence Form & Closure Verification */}
        <div className="lg:col-span-6 space-y-4">

          {/* STEP 1: ACCEPT TASK (If status is ASSIGNED) */}
          {(report.status === 'ASSIGNED' || report.status === 'action_dispatched') && (
            <div className="bg-white rounded-2xl border-2 border-blue-300 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-blue-900">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-sm">Step 1: Acknowledge &amp; Accept Task</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Accepting this dispatch confirms your team has received the coordinates and is preparing to mobilize to the beach site.
              </p>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleAcceptTask}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none active:scale-98"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>ACCEPT TASK</span>
              </button>
            </div>
          )}

          {/* STEP 2: START CLEANUP (If status is ACCEPTED) */}
          {report.status === 'ACCEPTED' && (
            <div className="bg-white rounded-2xl border-2 border-amber-300 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-amber-900">
                <PlayCircle className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-sm">Step 2: Commence Shoreline Cleanup</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your team has accepted this task. When your squad arrives on site and begins physical debris extraction, tap <strong>START CLEANUP</strong> to record the initiation timestamp.
              </p>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleStartCleanup}
                className="w-full py-3.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-amber-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none active:scale-98"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <PlayCircle className="w-4 h-4" />
                )}
                <span>START CLEANUP</span>
              </button>
            </div>
          )}

          {/* STEP 3: UPLOAD AFTER PHOTO & MARK CLEANED (If status is IN_PROGRESS) */}
          {report.status === 'IN_PROGRESS' && (
            <div className="bg-white rounded-2xl border-2 border-teal-400 p-5 shadow-sm space-y-4">
              <div>
                <div className="flex items-center gap-2 text-teal-900">
                  <Sparkles className="w-5 h-5 text-teal-600" />
                  <h3 className="font-black text-sm">Step 3: Submit Cleanup Evidence</h3>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Upload an after-cleanup photo proving the site is remediated. Optional waste metrics help calculate environmental impact.
                </p>
              </div>

              <form onSubmit={handleMarkCleaned} className="space-y-4 text-xs">
                
                {/* Photo Upload Area */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1.5">
                    After-Cleanup Photo Evidence *
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={fileInputRef}
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />

                  {afterPhotoPreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-teal-300 h-48 bg-slate-950">
                      <img
                        src={afterPhotoPreview}
                        alt="After cleanup evidence preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-slate-900/85 hover:bg-slate-900 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer backdrop-blur-xs shadow-xs"
                      >
                        <Camera className="w-3.5 h-3.5 text-teal-400" />
                        <span>Retake / Change Photo</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-8 px-4 rounded-xl border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/50 hover:bg-teal-50 text-teal-900 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700">
                        <Camera className="w-6 h-6" />
                      </div>
                      <span className="font-black text-xs uppercase tracking-wider">
                        Take / Upload After Photo
                      </span>
                      <span className="text-[10px] text-teal-700">
                        Supports camera capture on mobile phones
                      </span>
                    </button>
                  )}
                </div>

                {/* Optional measurements */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Waste Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="e.g. 45.5"
                      value={wasteWeight}
                      onChange={(e) => setWasteWeight(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-600 font-mono"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Optional</span>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Waste Count (bags)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 8"
                      value={wasteCount}
                      onChange={(e) => setWasteCount(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-600 font-mono"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Optional</span>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Area Cleaned
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 120 m²"
                      value={areaCleaned}
                      onChange={(e) => setAreaCleaned(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-600 font-mono"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">Optional</span>
                  </div>
                </div>

                {/* Optional Notes */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Cleanup Notes &amp; Disposal Details
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Waste secured in GVMC municipal bins; transferred to recycling yard."
                    value={cleanupNotes}
                    onChange={(e) => setCleanupNotes(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-600"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">Optional</span>
                </div>

                {/* Mark Cleaned Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-teal-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none active:scale-98"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>MARK CLEANED</span>
                </button>
              </form>
            </div>
          )}

          {/* STEP 4 & 5: BEFORE / AFTER COMPARISON & CLOSURE VERIFICATION */}
          {(isCleaned || isClosed) && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Before &amp; After Remediation Proof</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Visual audit comparison between initial citizen report and post-cleanup inspection.
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setComparisonMode('side_by_side')}
                    className={`px-2 py-1 rounded cursor-pointer ${
                      comparisonMode === 'side_by_side'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Side-by-Side
                  </button>
                  <button
                    type="button"
                    onClick={() => setComparisonMode('toggle')}
                    className={`px-2 py-1 rounded cursor-pointer ${
                      comparisonMode === 'toggle'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Toggle
                  </button>
                </div>
              </div>

              {/* Before / After Visual Component */}
              {comparisonMode === 'side_by_side' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Before photo */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-block">
                      BEFORE CLEANUP
                    </span>
                    <div className="h-44 rounded-xl overflow-hidden bg-slate-950 border border-slate-200">
                      {report.photoUrl ? (
                        <img
                          src={report.photoUrl}
                          alt="Before cleanup"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-mono">
                          No initial photo
                        </div>
                      )}
                    </div>
                  </div>

                  {/* After photo */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 inline-block">
                      AFTER CLEANUP
                    </span>
                    <div className="h-44 rounded-xl overflow-hidden bg-slate-950 border border-slate-200">
                      {afterPhotoPreview || report.afterPhotoUrl ? (
                        <img
                          src={afterPhotoPreview || report.afterPhotoUrl}
                          alt="After cleanup"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-mono">
                          No after photo
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActivePhotoToggle('before')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        activePhotoToggle === 'before'
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      View BEFORE Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePhotoToggle('after')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        activePhotoToggle === 'after'
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      View AFTER Photo
                    </button>
                  </div>

                  <div className="h-60 rounded-xl overflow-hidden bg-slate-950 border border-slate-200 relative">
                    <img
                      src={
                        activePhotoToggle === 'before'
                          ? report.photoUrl || ''
                          : afterPhotoPreview || report.afterPhotoUrl || ''
                      }
                      alt="Toggle comparison"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded bg-slate-900/80 text-white font-mono text-[10px] font-bold">
                      {activePhotoToggle === 'before' ? 'BEFORE REMEDIATION' : 'AFTER REMEDIATION'}
                    </div>
                  </div>
                </div>
              )}

              {/* Cleanup Metrics Summary */}
              {cleanupRecord && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                    Recorded Remediation Metrics:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 font-mono text-[11px]">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Waste Weight:</span>
                      <strong className="text-slate-900">
                        {cleanupRecord.wasteWeight ?? cleanupRecord.dryWeightKg ?? 'N/A'} kg
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Waste Count:</span>
                      <strong className="text-slate-900">
                        {cleanupRecord.wasteCount ?? 'N/A'} bags/items
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Area Remediated:</span>
                      <strong className="text-slate-900">{cleanupRecord.areaCleaned || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Cleaned By:</span>
                      <strong className="text-slate-900 truncate block">
                        {cleanupRecord.completedBy}
                      </strong>
                    </div>
                  </div>
                  {cleanupRecord.notes && (
                    <p className="text-slate-600 text-[11px] pt-1 border-t border-slate-200/60 font-sans">
                      <strong>Notes:</strong> {cleanupRecord.notes}
                    </p>
                  )}
                </div>
              )}

              {/* CLOSURE GATE (Only COORDINATOR or ADMIN can verify closure) */}
              {isCleaned && !isClosed && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Municipal / Administrative Closure Verification Gate</span>
                  </div>

                  <p className="text-[11px] text-emerald-800 leading-snug">
                    Inspect the photographic evidence above. When verified satisfactory, a coordinator or admin can officially close this incident.
                  </p>

                  {isCoordinatorOrAdmin ? (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleVerifyClosure}
                      className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 select-none active:scale-98"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                      <span>VERIFY &amp; CLOSE INCIDENT (STATUS: VERIFIED_CLOSED)</span>
                    </button>
                  ) : (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Coordinator / Admin Verification Required</span>
                      </div>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Only an authorized COORDINATOR or ADMIN can change status to <strong>VERIFIED_CLOSED</strong>.
                      </p>
                      <button
                        type="button"
                        onClick={() => switchRole('COORDINATOR')}
                        className="mt-2 text-xs font-bold text-teal-700 hover:underline inline-block cursor-pointer"
                      >
                        Switch to COORDINATOR role to test closure &rarr;
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* CLOSED TICKET BANNER */}
              {isClosed && (
                <div className="p-3.5 rounded-xl bg-emerald-100/70 border border-emerald-300 text-emerald-950 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Incident Permanently Closed &amp; Remediated</span>
                  </div>
                  <div className="text-[11px] text-emerald-800 font-mono">
                    Verified By: <strong>{report.verifiedBy || 'Municipal Authority'}</strong>
                    {report.closedAt && (
                      <span className="block text-[10px] text-emerald-700">
                        Closed At:{' '}
                        {new Date(report.closedAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* COORDINATOR REASSIGNMENT ACCORDION (If user is coordinator/admin) */}
          {isCoordinatorOrAdmin && !isClosed && (
            <details className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs text-xs">
              <summary className="font-bold text-slate-700 cursor-pointer select-none flex items-center justify-between">
                <span>Administrative Dispatch &amp; Reassignment Console</span>
                <span className="text-[10px] text-teal-700 uppercase font-mono font-bold">Manage Dispatch</span>
              </summary>

              <form onSubmit={handleAssignSubmit} className="mt-4 pt-3 border-t border-slate-200 space-y-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Select Organization</label>
                  <select
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="w-full py-2 px-2.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        [{org.type}] {org.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Responsible Person / Team</label>
                  <input
                    type="text"
                    required
                    value={responsiblePerson}
                    onChange={(e) => setResponsiblePerson(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Dispatch Instructions</label>
                  <textarea
                    rows={2}
                    value={dispatchNotes}
                    onChange={(e) => setDispatchNotes(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                >
                  Update Organization Dispatch
                </button>
              </form>
            </details>
          )}

        </div>

      </div>
    </div>
  );
};
