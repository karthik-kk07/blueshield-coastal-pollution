import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ReportDoc } from '../types/firestore';

const COLLECTION_NAME = 'reports';

export async function createReport(data: Partial<ReportDoc>): Promise<ReportDoc> {
  const currentYear = new Date().getFullYear();
  const randomSeq = String(Math.floor(1 + Math.random() * 9999)).padStart(4, '0');
  const reportNumber = data.reportNumber || `BS-${currentYear}-${randomSeq}`;
  const id = data.id || `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = `${COLLECTION_NAME}/${id}`;

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

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await setDoc(docRef, reportData);
    return reportData;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getReport(id: string): Promise<ReportDoc | null> {
  const path = `${COLLECTION_NAME}/${id}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as ReportDoc;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function updateReportStatus(
  id: string,
  status: ReportDoc['status'],
  verifiedBy?: string,
  notes?: string
): Promise<void> {
  const path = `${COLLECTION_NAME}/${id}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
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
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
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
  const path = `${COLLECTION_NAME}/${id}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const fieldsToUpdate: Partial<ReportDoc> = {
      status: updates.status,
      updatedAt: new Date().toISOString(),
    };
    if (updates.pollutionType) {
      fieldsToUpdate.pollutionType = updates.pollutionType;
      fieldsToUpdate.title = `${updates.pollutionType} Pollution Hazard`;
    }
    if (updates.severity) {
      fieldsToUpdate.severity = updates.severity;
    }
    if (updates.verifiedBy) {
      fieldsToUpdate.verifiedBy = updates.verifiedBy;
      fieldsToUpdate.verifiedAt = new Date().toISOString();
    }
    if (updates.notes) {
      fieldsToUpdate.notes = updates.notes;
    }
    await updateDoc(docRef, fieldsToUpdate);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function listReports(): Promise<ReportDoc[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as ReportDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return [];
  }
}

export function subscribeToReports(
  onReports: (reports: ReportDoc[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const reports = snapshot.docs.map((d) => d.data() as ReportDoc);
      onReports(reports);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
    }
  );
}

export async function assignReport(
  id: string,
  assignment: {
    assignedOrganization: string;
    assignedTo: string;
    notes?: string;
  }
): Promise<void> {
  const path = `${COLLECTION_NAME}/${id}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const fieldsToUpdate: Partial<ReportDoc> = {
      status: 'ASSIGNED',
      assignedOrganization: assignment.assignedOrganization,
      assignedTo: assignment.assignedTo,
      assignedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (assignment.notes) {
      fieldsToUpdate.notes = assignment.notes;
    }
    await updateDoc(docRef, fieldsToUpdate);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeToReportedReports(
  onReports: (reports: ReportDoc[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const allReports = snapshot.docs.map((d) => d.data() as ReportDoc);
      // Filter for reports awaiting verification (REPORTED or legacy pending_verification)
      const reportedOnly = allReports.filter(
        (r) => r.status === 'REPORTED' || r.status === 'pending_verification'
      );
      onReports(reportedOnly);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
    }
  );
}

export function subscribeToVerifiedReports(
  onReports: (reports: ReportDoc[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const allReports = snapshot.docs.map((d) => d.data() as ReportDoc);
      // Filter for reports that are VERIFIED (ready to assign) or ASSIGNED
      const relevant = allReports.filter(
        (r) => r.status === 'VERIFIED' || r.status === 'ASSIGNED' || r.status === 'field_verified' || r.status === 'dispatched'
      );
      onReports(relevant);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
    }
  );
}

