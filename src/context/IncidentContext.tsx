import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  PollutionReport, 
  Hotspot, 
  EntryPoint, 
  AuditLogItem, 
  VerificationStatus,
  WasteCategory,
  SeverityLevel
} from '../types/pollution';
import { 
  loadReports, 
  saveReports, 
  loadHotspots, 
  saveHotspots, 
  loadEntryPoints, 
  loadAuditLogs, 
  appendAuditLog 
} from '../services/storage';

interface IncidentContextType {
  reports: PollutionReport[];
  hotspots: Hotspot[];
  entryPoints: EntryPoint[];
  auditLogs: AuditLogItem[];
  selectedReportId: string | null;
  setSelectedReportId: (id: string | null) => void;
  submitReport: (newReport: Omit<PollutionReport, 'id' | 'trackingCode' | 'status' | 'verifications' | 'reportedAt' | 'priorityScore'>) => string;
  addDirectReport: (report: PollutionReport) => void;
  updateReportStatusDirect: (reportId: string, updates: Partial<PollutionReport>) => void;
  verifyReport: (reportId: string, notes: string, confirmed: boolean, estimatedVolume?: number, verifierName?: string, verifierRole?: string) => void;
  dispatchIncident: (reportId: string, crewNotes: string, officerName?: string) => void;
  resolveIncident: (reportId: string, resolutionNotes: string, officerName?: string) => void;
  filterStatus: VerificationStatus | 'all';
  setFilterStatus: (status: VerificationStatus | 'all') => void;
  filterCategory: WasteCategory | 'all';
  setFilterCategory: (category: WasteCategory | 'all') => void;
  filterSeverity: SeverityLevel | 'all';
  setFilterSeverity: (severity: SeverityLevel | 'all') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredReports: PollutionReport[];
  // Derived authentic statistics directly computed from real state
  metrics: {
    totalReports: number;
    pendingCount: number;
    verifiedCount: number;
    dispatchedCount: number;
    remediatedCount: number;
    criticalCount: number;
    activeHotspotsCount: number;
    monitoredEntryPointsCount: number;
  };
}

const IncidentContext = createContext<IncidentContextType | undefined>(undefined);

export const IncidentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reports, setReports] = useState<PollutionReport[]>(() => loadReports());
  const [hotspots, setHotspots] = useState<Hotspot[]>(() => loadHotspots());
  const [entryPoints] = useState<EntryPoint[]>(() => loadEntryPoints());
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => loadAuditLogs());
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<VerificationStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<WasteCategory | 'all'>('all');
  const [filterSeverity, setFilterSeverity] = useState<SeverityLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    saveReports(reports);
  }, [reports]);

  useEffect(() => {
    saveHotspots(hotspots);
  }, [hotspots]);

  const submitReport = (
    data: Omit<PollutionReport, 'id' | 'trackingCode' | 'status' | 'verifications' | 'reportedAt' | 'priorityScore'>
  ): string => {
    const id = `rep-${Date.now()}`;
    const trackingCode = `BS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Priority calculation based on severity & proximity to sensitive zones
    let basePriority = 40;
    if (data.severity === 'critical') basePriority = 90;
    else if (data.severity === 'high') basePriority = 75;
    else if (data.severity === 'moderate') basePriority = 50;

    const newReport: PollutionReport = {
      ...data,
      id,
      trackingCode,
      status: 'pending_verification',
      verifications: [],
      reportedAt: new Date().toISOString(),
      priorityScore: basePriority,
    };

    const updated = [newReport, ...reports];
    setReports(updated);

    appendAuditLog({
      action: 'SUBMIT_REPORT',
      actorName: data.reportedByName || 'Community Member',
      actorRole: 'public_reporter',
      targetId: id,
      timestamp: new Date().toISOString(),
      details: `Filed report "${data.title}" at ${data.location.coastalZoneName} (${data.severity.toUpperCase()} severity).`
    });
    setAuditLogs(loadAuditLogs());

    return id;
  };

  const addDirectReport = (report: PollutionReport) => {
    setReports((prev) => [report, ...prev]);
    setSelectedReportId(report.id);
    appendAuditLog({
      action: 'SUBMIT_REPORT',
      actorName: report.reportedByName || 'Citizen Observer',
      actorRole: 'public_reporter',
      targetId: report.id,
      timestamp: report.reportedAt || new Date().toISOString(),
      details: `Registered coastal hazard ${report.reportNumber || report.trackingCode} (${report.severity.toUpperCase()}).`
    });
    setAuditLogs(loadAuditLogs());
  };

  const updateReportStatusDirect = (reportId: string, updates: Partial<PollutionReport>) => {
    setReports((prev) =>
      prev.map((rep) => {
        if (rep.id !== reportId) return rep;
        return {
          ...rep,
          ...updates,
        };
      })
    );
  };

  const verifyReport = (
    reportId: string, 
    notes: string, 
    confirmed: boolean, 
    estimatedVolume?: number,
    verifierName = 'Field Inspector',
    verifierRole = 'verified_volunteer'
  ) => {
    setReports((prev) =>
      prev.map((rep) => {
        if (rep.id !== reportId) return rep;
        const newStatus: VerificationStatus = confirmed ? 'field_verified' : 'rejected';
        const verificationEntry = {
          id: `ver-${Date.now()}`,
          verifiedByUserId: 'current-user',
          verifiedByName: verifierName,
          verifiedByRole: verifierRole,
          timestamp: new Date().toISOString(),
          notes,
          groundTruthConfirmed: confirmed,
          estimatedVolumeMetersCubed: estimatedVolume,
        };
        return {
          ...rep,
          status: newStatus,
          verifications: [...rep.verifications, verificationEntry],
        };
      })
    );

    appendAuditLog({
      action: confirmed ? 'VERIFY_INCIDENT' : 'REJECT_REPORT',
      actorName: verifierName,
      actorRole: verifierRole,
      targetId: reportId,
      timestamp: new Date().toISOString(),
      details: confirmed 
        ? `Field-verified ground truth: ${notes}`
        : `Report rejected after inspection: ${notes}`
    });
    setAuditLogs(loadAuditLogs());
  };

  const dispatchIncident = (reportId: string, crewNotes: string, officerName = 'Field Officer') => {
    setReports((prev) =>
      prev.map((rep) => {
        if (rep.id !== reportId) return rep;
        return {
          ...rep,
          status: 'action_dispatched',
        };
      })
    );

    appendAuditLog({
      action: 'DISPATCH_REMEDIATION',
      actorName: officerName,
      actorRole: 'field_officer',
      targetId: reportId,
      timestamp: new Date().toISOString(),
      details: `Response action dispatched: ${crewNotes}`
    });
    setAuditLogs(loadAuditLogs());
  };

  const resolveIncident = (reportId: string, resolutionNotes: string, officerName = 'Field Officer') => {
    setReports((prev) =>
      prev.map((rep) => {
        if (rep.id !== reportId) return rep;
        return {
          ...rep,
          status: 'remediated',
        };
      })
    );

    appendAuditLog({
      action: 'REMEDIATION_COMPLETE',
      actorName: officerName,
      actorRole: 'field_officer',
      targetId: reportId,
      timestamp: new Date().toISOString(),
      details: `Hazard resolved and site remediated: ${resolutionNotes}`
    });
    setAuditLogs(loadAuditLogs());
  };

  // Filtered reports logic
  const filteredReports = reports.filter((rep) => {
    if (filterStatus !== 'all' && rep.status !== filterStatus) return false;
    if (filterCategory !== 'all' && rep.wasteCategory !== filterCategory) return false;
    if (filterSeverity !== 'all' && rep.severity !== filterSeverity) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = rep.title.toLowerCase().includes(q);
      const matchCode = rep.trackingCode.toLowerCase().includes(q);
      const matchZone = rep.location.coastalZoneName.toLowerCase().includes(q);
      const matchDesc = rep.description.toLowerCase().includes(q);
      if (!matchTitle && !matchCode && !matchZone && !matchDesc) return false;
    }
    return true;
  });

  // Authentic derived metrics
  const metrics = {
    totalReports: reports.length,
    pendingCount: reports.filter((r) => r.status === 'pending_verification').length,
    verifiedCount: reports.filter((r) => r.status === 'field_verified').length,
    dispatchedCount: reports.filter((r) => r.status === 'action_dispatched').length,
    remediatedCount: reports.filter((r) => r.status === 'remediated').length,
    criticalCount: reports.filter((r) => r.severity === 'critical').length,
    activeHotspotsCount: hotspots.length,
    monitoredEntryPointsCount: entryPoints.length,
  };

  return (
    <IncidentContext.Provider
      value={{
        reports,
        hotspots,
        entryPoints,
        auditLogs,
        selectedReportId,
        setSelectedReportId,
        submitReport,
        addDirectReport,
        updateReportStatusDirect,
        verifyReport,
        dispatchIncident,
        resolveIncident,
        filterStatus,
        setFilterStatus,
        filterCategory,
        setFilterCategory,
        filterSeverity,
        setFilterSeverity,
        searchQuery,
        setSearchQuery,
        filteredReports,
        metrics,
      }}
    >
      {children}
    </IncidentContext.Provider>
  );
};

export const useIncidents = (): IncidentContextType => {
  const context = useContext(IncidentContext);
  if (!context) {
    throw new Error('useIncidents must be used within an IncidentProvider');
  }
  return context;
};
