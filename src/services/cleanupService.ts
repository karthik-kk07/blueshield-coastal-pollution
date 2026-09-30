import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { CleanupRecordDoc, ReportDoc, TaskState } from '../types/firestore';
import { logActivity } from './activityLogService';

const CLEANUP_COLLECTION = 'cleanup_records';
const REPORT_COLLECTION = 'reports';

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

/**
 * Creates a cleanup_records document in Firestore and marks the report as CLEANED
 */
export async function createCleanupRecord(
  input: CreateCleanupInput
): Promise<CleanupRecordDoc> {
  const id = `clean-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = `${CLEANUP_COLLECTION}/${id}`;
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

  try {
    // 1. Write cleanup_records document
    const recordRef = doc(db, CLEANUP_COLLECTION, id);
    await setDoc(recordRef, record);

    // 2. Update parent report status to CLEANED
    const reportRef = doc(db, REPORT_COLLECTION, input.reportId);
    const reportUpdates: Partial<ReportDoc> = {
      status: 'CLEANED',
      afterPhotoUrl: input.afterPhoto,
      cleanedAt: now,
      cleanupRecordId: id,
      updatedAt: now,
    };
    if (input.notes) {
      reportUpdates.notes = input.notes;
    }
    await updateDoc(reportRef, reportUpdates);

    return record;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

/**
 * Retrieves the cleanup record associated with a report
 */
export async function getCleanupRecordForReport(
  reportId: string
): Promise<CleanupRecordDoc | null> {
  try {
    const q = query(
      collection(db, CLEANUP_COLLECTION),
      where('reportId', '==', reportId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as CleanupRecordDoc;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, CLEANUP_COLLECTION);
    return null;
  }
}

/**
 * Task state transition: ACCEPT TASK -> status: ACCEPTED
 */
export async function acceptFieldTask(
  reportId: string,
  acceptedBy: string
): Promise<void> {
  const path = `${REPORT_COLLECTION}/${reportId}`;
  const now = new Date().toISOString();
  try {
    const reportRef = doc(db, REPORT_COLLECTION, reportId);
    await updateDoc(reportRef, {
      status: 'ACCEPTED',
      acceptedBy,
      acceptedAt: now,
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

/**
 * Task state transition: START CLEANUP -> status: IN_PROGRESS
 */
export async function startFieldCleanup(
  reportId: string
): Promise<void> {
  const path = `${REPORT_COLLECTION}/${reportId}`;
  const now = new Date().toISOString();
  try {
    const reportRef = doc(db, REPORT_COLLECTION, reportId);
    await updateDoc(reportRef, {
      status: 'IN_PROGRESS',
      startedAt: now,
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

/**
 * Closure verification: Only COORDINATOR or ADMIN can verify closure
 * Status transitions: CLEANED -> VERIFIED_CLOSED
 */
export async function verifyClosure(
  reportId: string,
  verifiedBy: string,
  notes?: string
): Promise<void> {
  const path = `${REPORT_COLLECTION}/${reportId}`;
  const now = new Date().toISOString();
  try {
    const reportRef = doc(db, REPORT_COLLECTION, reportId);
    const updates: Partial<ReportDoc> = {
      status: 'VERIFIED_CLOSED',
      verifiedBy,
      verifiedAt: now,
      closedAt: now,
      updatedAt: now,
    };
    if (notes) {
      updates.notes = notes;
    }
    await updateDoc(reportRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

/**
 * Subscribes to tasks assigned for field work
 * (status in ASSIGNED, ACCEPTED, IN_PROGRESS, CLEANED, VERIFIED_CLOSED)
 */
export function subscribeToFieldTasks(
  onTasks: (reports: ReportDoc[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const q = query(
    collection(db, REPORT_COLLECTION),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const allReports = snapshot.docs.map((d) => d.data() as ReportDoc);
      // Filter for reports in field worker lifecycle
      const fieldTasks = allReports.filter((r) =>
        ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'CLEANED', 'VERIFIED_CLOSED', 'action_dispatched'].includes(
          r.status
        )
      );
      onTasks(fieldTasks);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, REPORT_COLLECTION);
    }
  );
}

/**
 * Lists all cleanup records from Firestore
 */
export async function listCleanupRecords(): Promise<CleanupRecordDoc[]> {
  try {
    const q = query(
      collection(db, CLEANUP_COLLECTION),
      orderBy('completedAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as CleanupRecordDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, CLEANUP_COLLECTION);
    return [];
  }
}

/**
 * Real-time subscription to cleanup_records
 */
export function subscribeToCleanupRecords(
  onRecords: (records: CleanupRecordDoc[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const q = query(
    collection(db, CLEANUP_COLLECTION),
    orderBy('completedAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const records = snapshot.docs.map((d) => d.data() as CleanupRecordDoc);
      onRecords(records);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, CLEANUP_COLLECTION);
    }
  );
}

