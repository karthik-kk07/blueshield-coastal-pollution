import { localDataService, localEvents } from './localDataService';
import { CleanupRecordDoc, ReportDoc } from '../types/firestore';

export interface CreateCleanupInput {
  reportId: string;
  beforePhoto?: string;
  afterPhoto: string;
  wasteWeight?: number;
  wasteCount?: number;
  areaCleaned?: string;
  notes?: string;
  completedBy: string;
}

export async function createCleanupRecord(
  input: CreateCleanupInput
): Promise<CleanupRecordDoc> {
  const id = `clean-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const record: CleanupRecordDoc = {
    id,
    reportId: input.reportId,
    beforePhoto: input.beforePhoto || '',
    afterPhoto: input.afterPhoto,
    completedBy: input.completedBy,
    completedAt: now,
  };

  if (input.wasteWeight !== undefined && input.wasteWeight !== null && !isNaN(input.wasteWeight)) {
    record.wasteWeight = Number(input.wasteWeight);
    record.dryWeightKg = Number(input.wasteWeight);
  }
  if (input.wasteCount !== undefined && input.wasteCount !== null && !isNaN(input.wasteCount)) {
    record.wasteCount = Number(input.wasteCount);
  }
  if (input.areaCleaned && input.areaCleaned.trim()) {
    record.areaCleaned = input.areaCleaned.trim();
  }
  if (input.notes && input.notes.trim()) {
    record.notes = input.notes.trim();
  }

  // 1. Add cleanup record to local storage
  localDataService.addCleanupRecord(record);

  // 2. Update parent report status to CLEANED
  localDataService.updateReport(
    input.reportId,
    {
      status: 'CLEANED',
      afterPhotoUrl: input.afterPhoto,
      cleanedAt: now,
      cleanupRecordId: id,
      notes: input.notes,
      updatedAt: now,
    },
    { id: 'usr-crew-demo', name: input.completedBy, role: 'CLEANUP_TEAM' }
  );

  return record;
}

export async function getCleanupRecordForReport(
  reportId: string
): Promise<CleanupRecordDoc | null> {
  const records = localDataService.getCleanupRecords();
  return records.find((r) => r.reportId === reportId) || null;
}

export async function acceptFieldTask(
  reportId: string,
  acceptedBy: string
): Promise<void> {
  const now = new Date().toISOString();
  localDataService.updateReport(
    reportId,
    {
      status: 'ACCEPTED',
      acceptedBy,
      acceptedAt: now,
      updatedAt: now,
    },
    { id: 'usr-crew-demo', name: acceptedBy, role: 'CLEANUP_TEAM' }
  );
}

export async function startFieldCleanup(
  reportId: string
): Promise<void> {
  const now = new Date().toISOString();
  localDataService.updateReport(
    reportId,
    {
      status: 'IN_PROGRESS',
      startedAt: now,
      updatedAt: now,
    },
    { id: 'usr-crew-demo', name: 'Field Crew', role: 'CLEANUP_TEAM' }
  );
}

export async function verifyClosure(
  reportId: string,
  verifiedBy: string,
  notes?: string
): Promise<void> {
  const now = new Date().toISOString();
  localDataService.updateReport(
    reportId,
    {
      status: 'VERIFIED_CLOSED',
      verifiedBy,
      verifiedAt: now,
      closedAt: now,
      notes,
      updatedAt: now,
    },
    { id: 'usr-coord-demo', name: verifiedBy, role: 'COORDINATOR' }
  );
}

export function subscribeToFieldTasks(
  onTasks: (reports: ReportDoc[]) => void,
  _onError?: (err: unknown) => void
): () => void {
  const notify = () => {
    const all = localDataService.getReports();
    const fieldTasks = all.filter((r) =>
      ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'CLEANED', 'VERIFIED_CLOSED', 'action_dispatched'].includes(
        r.status
      )
    );
    onTasks(fieldTasks);
  };

  notify();

  const handler = () => notify();
  localEvents.addEventListener('reports_updated', handler);
  return () => {
    localEvents.removeEventListener('reports_updated', handler);
  };
}

export async function listCleanupRecords(): Promise<CleanupRecordDoc[]> {
  return localDataService.getCleanupRecords();
}

export function subscribeToCleanupRecords(
  onRecords: (records: CleanupRecordDoc[]) => void,
  _onError?: (err: unknown) => void
): () => void {
  const notify = () => {
    onRecords(localDataService.getCleanupRecords());
  };

  notify();

  const handler = () => notify();
  localEvents.addEventListener('cleanups_updated', handler);
  return () => {
    localEvents.removeEventListener('cleanups_updated', handler);
  };
}
