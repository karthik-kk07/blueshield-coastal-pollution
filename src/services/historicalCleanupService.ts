import {
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
  query,
  orderBy,
  limit,
  where,
  deleteDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { HistoricalCleanupDoc } from '../types/firestore';

const COLLECTION_NAME = 'historical_cleanups';

export async function listHistoricalCleanups(
  limitCount = 500,
  dataSourceFilter?: 'REAL_HISTORICAL' | 'DEMO'
): Promise<HistoricalCleanupDoc[]> {
  try {
    let q = query(collection(db, COLLECTION_NAME), orderBy('date', 'desc'), limit(limitCount));
    if (dataSourceFilter) {
      q = query(
        collection(db, COLLECTION_NAME),
        where('dataSource', '==', dataSourceFilter),
        orderBy('date', 'desc'),
        limit(limitCount)
      );
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as HistoricalCleanupDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return [];
  }
}

export async function seedHistoricalCleanup(record: HistoricalCleanupDoc): Promise<void> {
  const path = `${COLLECTION_NAME}/${record.id}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, record.id);
    await setDoc(docRef, record);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Batch import historical cleanups into Firestore
 */
export async function batchImportHistoricalCleanups(
  records: HistoricalCleanupDoc[]
): Promise<{ imported: number; failed: number }> {
  let imported = 0;
  let failed = 0;

  // Firestore batches max 500 operations
  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const chunk = records.slice(i, i + batchSize);
    const batch = writeBatch(db);

    chunk.forEach((rec) => {
      const docRef = doc(db, COLLECTION_NAME, rec.id);
      batch.set(docRef, rec);
    });

    try {
      await batch.commit();
      imported += chunk.length;
    } catch (err) {
      console.error('Batch commit failed for chunk:', err);
      // Fallback to individual writes if batch fails
      for (const rec of chunk) {
        try {
          const docRef = doc(db, COLLECTION_NAME, rec.id);
          await setDoc(docRef, rec);
          imported++;
        } catch {
          failed++;
        }
      }
    }
  }

  return { imported, failed };
}

/**
 * Delete a specific record
 */
export async function deleteHistoricalCleanup(id: string): Promise<void> {
  const path = `${COLLECTION_NAME}/${id}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

