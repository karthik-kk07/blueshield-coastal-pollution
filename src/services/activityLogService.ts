import { collection, doc, getDocs, setDoc, query, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ActivityLogDoc } from '../types/firestore';

const COLLECTION_NAME = 'activity_logs';

export async function logActivity(data: Omit<ActivityLogDoc, 'id' | 'timestamp'>): Promise<string> {
  const id = `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = `${COLLECTION_NAME}/${id}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const entry: ActivityLogDoc = {
      ...data,
      id,
      timestamp: new Date().toISOString(),
    };
    await setDoc(docRef, entry);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function listActivityLogs(maxItems = 50): Promise<ActivityLogDoc[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('timestamp', 'desc'), limit(maxItems));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as ActivityLogDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
  }
}
