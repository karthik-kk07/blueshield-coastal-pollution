import { localDataService, localEvents } from './localDataService';
import { EntryPointDoc, EntryPointStatus } from '../types/firestore';

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

  return localDataService.addEntryPoint(entryPointData);
}

export async function updateEntryPoint(
  id: string,
  data: Partial<EntryPointDoc>
): Promise<void> {
  localDataService.updateEntryPoint(id, data);
}

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

  localDataService.updateEntryPoint(id, updatePayload);
}

export function subscribeToEntryPoints(
  onUpdate: (entryPoints: EntryPointDoc[]) => void,
  _onError?: (error: Error) => void
): () => void {
  const notify = () => {
    onUpdate(localDataService.getEntryPoints());
  };
  notify();

  const handler = () => notify();
  localEvents.addEventListener('entrypoints_updated', handler);
  return () => {
    localEvents.removeEventListener('entrypoints_updated', handler);
  };
}

export async function listEntryPoints(): Promise<EntryPointDoc[]> {
  return localDataService.getEntryPoints();
}

export async function deleteEntryPoint(id: string): Promise<void> {
  const list = localDataService.getEntryPoints().filter((e) => e.id !== id);
  localDataService.saveEntryPoints(list);
}
