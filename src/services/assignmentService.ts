import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { AssignmentDoc } from '../types/firestore';

const COLLECTION_NAME = 'assignments';

export async function createAssignment(data: Omit<AssignmentDoc, 'id' | 'assignedAt'>): Promise<string> {
  const id = `asg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = `${COLLECTION_NAME}/${id}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const assignment: AssignmentDoc = {
      ...data,
      id,
      assignedAt: new Date().toISOString(),
    };
    await setDoc(docRef, assignment);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function listAssignments(): Promise<AssignmentDoc[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('assignedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as AssignmentDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
  }
}

export async function updateAssignmentStatus(
  id: string,
  status: AssignmentDoc['status'],
  notes?: string
): Promise<void> {
  const path = `${COLLECTION_NAME}/${id}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      status,
      ...(notes ? { notes } : {}),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeToAssignments(
  onAssignments: (assignments: AssignmentDoc[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const q = query(collection(db, COLLECTION_NAME), orderBy('assignedAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      onAssignments(snapshot.docs.map((d) => d.data() as AssignmentDoc));
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
    }
  );
}
