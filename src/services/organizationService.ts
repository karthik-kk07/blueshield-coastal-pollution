import { localDataService, localEvents, INITIAL_ORGANIZATIONS } from './localDataService';
import { OrganizationDoc } from '../types/firestore';

export async function listOrganizations(): Promise<OrganizationDoc[]> {
  return localDataService.getOrganizations();
}

export function subscribeToOrganizations(
  onOrganizations: (orgs: OrganizationDoc[]) => void,
  _onError?: (err: unknown) => void
): () => void {
  const notify = () => {
    onOrganizations(localDataService.getOrganizations());
  };
  notify();

  const handler = () => notify();
  localEvents.addEventListener('orgs_updated', handler);
  return () => {
    localEvents.removeEventListener('orgs_updated', handler);
  };
}

export async function getOrganization(id: string): Promise<OrganizationDoc | null> {
  const orgs = localDataService.getOrganizations();
  return orgs.find((o) => o.id === id) || null;
}

export async function createOrganization(data: Omit<OrganizationDoc, 'id' | 'createdAt'>): Promise<OrganizationDoc> {
  const id = `org-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const org: OrganizationDoc = {
    ...data,
    id,
    createdAt: new Date().toISOString(),
  };
  const list = localDataService.getOrganizations();
  localDataService.saveOrganizations([...list, org]);
  return org;
}

export async function updateOrganization(id: string, updates: Partial<OrganizationDoc>): Promise<void> {
  const list = localDataService.getOrganizations();
  const index = list.findIndex((o) => o.id === id);
  if (index !== -1) {
    list[index] = { ...list[index], ...updates, updatedAt: new Date().toISOString() };
    localDataService.saveOrganizations(list);
  }
}

export async function toggleOrganizationActive(id: string, currentActive: boolean): Promise<void> {
  await updateOrganization(id, { active: !currentActive });
}

export async function deleteOrganization(id: string): Promise<void> {
  const list = localDataService.getOrganizations();
  localDataService.saveOrganizations(list.filter((o) => o.id !== id));
}

export async function seedDefaultOrganizations(): Promise<void> {
  localDataService.saveOrganizations(INITIAL_ORGANIZATIONS || []);
}
