import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { EntryPointDoc, EntryPointStatus } from '../types/firestore';

const COLLECTION_NAME = 'entry_points';

// Default coastal inflow points for Visakhapatnam to bootstrap monitoring
export const SEED_ENTRY_POINTS: Partial<EntryPointDoc>[] = [
  {
    title: 'Meghadrigedda Tidal Creek Outfall',
    category: 'Canal',
    severity: 'CRITICAL',
    status: 'ASSIGNED',
    locationName: 'Inner Harbour Confluence / Industrial Canal',
    coastalZone: 'Estuary / Industrial Drain Basin',
    latitude: 17.692,
    longitude: 83.242,
    description:
      'Major canal outflow channel carrying stormwater and industrial surface runoff into the inner port basin. Requires trash boom interception barriers.',
    assignedOrganization: 'GVMC Coastal Sanitation Wing',
    photoUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: "Lawson's Bay Municipal Storm Nala",
    category: 'Open Drain',
    severity: 'HIGH',
    status: 'VERIFIED',
    locationName: "Lawson's Bay Intertidal Beach Head",
    coastalZone: 'Artisanal Fishing Cove',
    latitude: 17.732,
    longitude: 83.341,
    description:
      'Open masonry stormwater nala discharging directly across the sandy cove during heavy precipitation. High accumulation of single-use plastic bottles.',
    assignedOrganization: 'GVMC Coastal Sanitation Wing',
    photoUrl: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Tenneti Park Cliff Runoff Gully',
    category: 'Stormwater Outlet',
    severity: 'MODERATE',
    status: 'REPORTED',
    locationName: 'Tenneti Intertidal Escarpment',
    coastalZone: 'Rocky Intertidal Escarpment',
    latitude: 17.7475,
    longitude: 83.354,
    description:
      'Natural rocky gully and stormwater conduit channeling roadway runoff down the coastal bluff into intertidal tide pools.',
    assignedOrganization: 'Visakha Marine Eco Taskforce',
    photoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Fishing Harbour Wharf 3 Bilge & Waste Discharge',
    category: 'Wastewater Outlet',
    severity: 'CRITICAL',
    status: 'ASSIGNED',
    locationName: 'Trawler Berthing Jetty 3',
    coastalZone: 'Marine Port & Breakwater',
    latitude: 17.6982,
    longitude: 83.3045,
    description:
      'Localized vessel washdown discharge chute with chronic hydrocarbon oily sheen and abandoned nylon monofilament ropes.',
    assignedOrganization: 'Visakhapatnam Port Authority (VPA)',
    photoUrl: 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Sagar Nagar North Highway Dumping Point',
    category: 'Dumping Point',
    severity: 'HIGH',
    status: 'RESOLVED',
    locationName: 'Sagar Nagar Beach Access Road',
    coastalZone: 'North-Central Shoreline',
    latitude: 17.755,
    longitude: 83.356,
    description:
      'Unauthorized beach access road shoulder used for nocturnal commercial debris and plastic dumping. Cleaned by municipal sweepers, pending physical barricade inspection.',
    assignedOrganization: 'GVMC Coastal Sanitation Wing',
    photoUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
    resolvedAt: '2026-09-24T14:30:00Z',
    resolutionNotes: 'Trash removed by GVMC team. 420 kg waste cleared. Physical warning signboard erected.',
  },
  {
    title: 'Gosthani Estuary Confluence Drainage Canal',
    category: 'Canal',
    severity: 'MODERATE',
    status: 'VERIFIED_CLOSED',
    locationName: 'Bheemili Beach River Mouth',
    coastalZone: 'Gosthani Estuary Confluence',
    latitude: 17.892,
    longitude: 83.454,
    description:
      'River confluence drainage canal. Floating debris boom installed and confirmed operational by coastal inspection officer.',
    assignedOrganization: 'APPCB Environmental Wing',
    photoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    resolvedAt: '2026-09-18T10:00:00Z',
    verifiedClosedAt: '2026-09-20T16:00:00Z',
    closureNotes: 'Field officer verified: Interceptor boom securely anchored and flotsam caught before marine entry.',
  },
];

export async function createEntryPoint(
  data: Partial<EntryPointDoc>
): Promise<EntryPointDoc> {
  const currentYear = new Date().getFullYear();
  const randomSeq = String(Math.floor(1 + Math.random() * 9999)).padStart(4, '0');
  const trackingCode = data.trackingCode || `EP-${currentYear}-${randomSeq}`;
  const id = data.id || `ep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const entryPointData: EntryPointDoc = {
    id,
    trackingCode,
    title: data.title || `${data.category || 'Drainage'} Entry Point`,
    category: data.category || 'Open Drain',
    severity: data.severity || 'MODERATE',
    status: data.status || 'REPORTED',
    locationName: data.locationName || 'Visakhapatnam Coastline',
    coastalZone: data.coastalZone || 'Coastal Intertidal Zone',
    latitude: typeof data.latitude === 'number' ? data.latitude : 17.7155,
    longitude: typeof data.longitude === 'number' ? data.longitude : 83.3285,
    description: data.description || '',
    photoUrl: data.photoUrl || '',
    reportedBy: data.reportedBy || 'Coastal Observer',
    reporterId: data.reporterId || 'user-public',
    reportedAt: data.reportedAt || new Date().toISOString(),
    assignedOrganization: data.assignedOrganization || 'GVMC Coastal Sanitation Wing',
  };

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await setDoc(docRef, entryPointData);
    return entryPointData;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTION_NAME}/${id}`);
    throw err;
  }
}

export async function updateEntryPoint(
  id: string,
  data: Partial<EntryPointDoc>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    throw err;
  }
}

/**
 * Progress Entry Point through official workflow:
 * REPORTED -> VERIFIED -> ASSIGNED -> RESOLVED -> VERIFIED_CLOSED
 */
export async function advanceEntryPointStatus(
  id: string,
  nextStatus: EntryPointStatus,
  metadata?: {
    actorName?: string;
    organization?: string;
    notes?: string;
  }
): Promise<void> {
  const updatePayload: Partial<EntryPointDoc> = {
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  };

  const nowIso = new Date().toISOString();

  if (nextStatus === 'VERIFIED') {
    updatePayload.verifiedBy = metadata?.actorName || 'Field Verification Officer';
    updatePayload.verifiedAt = nowIso;
  } else if (nextStatus === 'ASSIGNED') {
    if (metadata?.organization) updatePayload.assignedOrganization = metadata.organization;
    updatePayload.assignedAt = nowIso;
  } else if (nextStatus === 'RESOLVED') {
    updatePayload.resolvedAt = nowIso;
    if (metadata?.notes) updatePayload.resolutionNotes = metadata.notes;
  } else if (nextStatus === 'VERIFIED_CLOSED') {
    updatePayload.verifiedClosedBy = metadata?.actorName || 'Sanitation Coordinator';
    updatePayload.verifiedClosedAt = nowIso;
    if (metadata?.notes) updatePayload.closureNotes = metadata.notes;
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updatePayload);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
    throw err;
  }
}

export function subscribeToEntryPoints(
  onUpdate: (entryPoints: EntryPointDoc[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, orderBy('reportedAt', 'desc'));

    return onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          // Auto-seed initial entry points if empty
          try {
            console.log('Seeding initial coastal entry points...');
            for (const item of SEED_ENTRY_POINTS) {
              await createEntryPoint(item);
            }
          } catch (seedErr) {
            console.warn('Initial seeding note:', seedErr);
          }
          return;
        }

        const items: EntryPointDoc[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        onUpdate(items);
      },
      (err) => {
        console.warn('Entry points snapshot warning:', err);
        if (onError) onError(err);
      }
    );
  } catch (err: any) {
    console.warn('Could not establish real-time entry points listener:', err);
    if (onError) onError(err);
    return () => {};
  }
}

export async function listEntryPoints(): Promise<EntryPointDoc[]> {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(colRef);
    const list: EntryPointDoc[] = [];
    snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
    return list;
  } catch (err) {
    console.warn('listEntryPoints fallback:', err);
    return [];
  }
}

export async function deleteEntryPoint(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
    throw err;
  }
}
