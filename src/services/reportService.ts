import { localDataService, localEvents } from './localDataService';
import { ReportDoc } from '../types/firestore';

export async function createReport(data: Partial<ReportDoc>): Promise<ReportDoc> {
  const currentYear = new Date().getFullYear();
  const randomSeq = String(Math.floor(1 + Math.random() * 9999)).padStart(4, '0');
  const reportNumber = data.reportNumber || `BS-${currentYear}-${randomSeq}`;
  const id = data.id || `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const reportData: ReportDoc = {
    id,
    reportNumber,
    reportedBy: data.reportedBy || 'Citizen Observer',
    latitude: typeof data.latitude === 'number' ? data.latitude : 17.7155,
    longitude: typeof data.longitude === 'number' ? data.longitude : 83.3285,
    pollutionType: data.pollutionType || 'Plastic',
    severity: data.severity || 'MODERATE',
    description: data.description || '',
    photoUrl: data.photoUrl || '',
    status: data.status || 'REPORTED',
    createdAt: data.createdAt || new Date().toISOString(),
    trackingCode: data.trackingCode || reportNumber,
    title: data.title || `${data.pollutionType || 'Pollution'} Hazard`,
    coastalZone: data.coastalZone || 'Shoreline Intertidal',
    reporterId: data.reporterId || 'citizen-public',
    entryPointSource: data.entryPointSource || 'Coastal Intertidal',
  };

  localDataService.addReport(reportData);
  return reportData;
}

export async function getReport(id: string): Promise<ReportDoc | null> {
  return localDataService.getReportById(id);
}

export async function updateReportStatus(
  id: string,
  status: ReportDoc['status'],
  verifiedBy?: string,
  notes?: string
): Promise<void> {
  const updates: Partial<ReportDoc> = {
    status,
    updatedAt: new Date().toISOString(),
  };
  if (verifiedBy) {
    updates.verifiedBy = verifiedBy;
    updates.verifiedAt = new Date().toISOString();
  }
  if (notes) {
    updates.notes = notes;
  }
  localDataService.updateReport(id, updates);
}

export async function verifyOrUpdateReport(
  id: string,
  updates: {
    status: ReportDoc['status'];
    pollutionType?: string;
    severity?: ReportDoc['severity'];
    verifiedBy?: string;
    notes?: string;
  }
): Promise<void> {
  localDataService.updateReport(id, {
    status: updates.status,
    pollutionType: updates.pollutionType,
    severity: updates.severity,
    verifiedBy: updates.verifiedBy,
    verifiedAt: new Date().toISOString(),
    notes: updates.notes,
    updatedAt: new Date().toISOString(),
  });
}

export async function assignReport(
  id: string,
  organizationOrPayload: string | { assignedOrganization?: string; assignedTo?: string; notes?: string },
  assignedToName?: string,
  notes?: string
): Promise<void> {
  let orgName: string | undefined;
  let assignedTo: string | undefined;
  let finalNotes: string | undefined;

  if (typeof organizationOrPayload === 'string') {
    orgName = organizationOrPayload;
    assignedTo = assignedToName;
    finalNotes = notes;
  } else if (organizationOrPayload && typeof organizationOrPayload === 'object') {
    orgName = organizationOrPayload.assignedOrganization;
    assignedTo = organizationOrPayload.assignedTo;
    finalNotes = organizationOrPayload.notes;
  }

  localDataService.updateReport(id, {
    status: 'ASSIGNED',
    assignedOrganization: orgName,
    assignedTo,
    assignedAt: new Date().toISOString(),
    notes: finalNotes || undefined,
    updatedAt: new Date().toISOString(),
  });
}

// Subscriptions
function createReportSubscription(
  filterFn: (report: ReportDoc) => boolean,
  callback: (reports: ReportDoc[]) => void
): () => void {
  const notify = () => {
    const all = localDataService.getReports();
    callback(all.filter(filterFn));
  };

  // Immediate emission
  notify();

  const handler = () => notify();
  localEvents.addEventListener('reports_updated', handler);
  return () => {
    localEvents.removeEventListener('reports_updated', handler);
  };
}

export function subscribeToReports(
  callback: (reports: ReportDoc[]) => void,
  _onError?: (error: unknown) => void
): () => void {
  return createReportSubscription(() => true, callback);
}

export function subscribeToReportedReports(
  callback: (reports: ReportDoc[]) => void,
  _onError?: (error: unknown) => void
): () => void {
  return createReportSubscription((r) => r.status === 'REPORTED', callback);
}

export function subscribeToVerifiedReports(
  callback: (reports: ReportDoc[]) => void,
  _onError?: (error: unknown) => void
): () => void {
  return createReportSubscription((r) => r.status === 'VERIFIED', callback);
}

export function subscribeToAssignedReports(
  callback: (reports: ReportDoc[]) => void,
  _onError?: (error: unknown) => void
): () => void {
  return createReportSubscription((r) => r.status === 'ASSIGNED', callback);
}

export function subscribeToAcceptedReports(
  callback: (reports: ReportDoc[]) => void,
  _onError?: (error: unknown) => void
): () => void {
  return createReportSubscription((r) => r.status === 'ACCEPTED', callback);
}

export function subscribeToInProgressReports(
  callback: (reports: ReportDoc[]) => void,
  _onError?: (error: unknown) => void
): () => void {
  return createReportSubscription((r) => r.status === 'IN_PROGRESS', callback);
}

export function subscribeToCleanedReports(
  callback: (reports: ReportDoc[]) => void,
  _onError?: (error: unknown) => void
): () => void {
  return createReportSubscription((r) => r.status === 'CLEANED', callback);
}

export function subscribeToReport(
  id: string,
  callback: (report: ReportDoc | null) => void,
  _onError?: (error: unknown) => void
): () => void {
  const notify = () => {
    callback(localDataService.getReportById(id));
  };
  notify();

  const handler = () => notify();
  localEvents.addEventListener('reports_updated', handler);
  return () => {
    localEvents.removeEventListener('reports_updated', handler);
  };
}
