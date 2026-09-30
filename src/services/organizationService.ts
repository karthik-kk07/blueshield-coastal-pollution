import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { OrganizationDoc, OrganizationType } from '../types/firestore';

const COLLECTION_NAME = 'organizations';

// Initial pre-configured organizations covering Visakhapatnam shoreline
export const DEFAULT_ORGANIZATIONS: Omit<OrganizationDoc, 'createdAt'>[] = [
  {
    id: 'org-gvmc-sanitation',
    name: 'GVMC Coastal Sanitation Wing',
    type: 'MUNICIPAL',
    contactName: 'E. Ramana Murthy (Zonal Commissioner)',
    email: 'gvmc.sanitation@visakhapatnam.gov.in',
    phone: '+91 891 2746401',
    coverageArea: 'Greater Visakhapatnam Coastal Line (RK Beach to Bheemunipatnam)',
    active: true,
  },
  {
    id: 'org-visakha-coast-trust',
    name: 'Visakha Coast Marine Conservation Trust',
    type: 'NGO',
    contactName: 'P. Sneha Latha (Director)',
    email: 'sneha@visakhacoast.org',
    phone: '+91 94401 23456',
    coverageArea: 'Rushikonda Blue Flag Beach & Tenneti Park Rocky Intertidal Cove',
    active: true,
  },
  {
    id: 'org-sea-shepherd-vizag',
    name: 'Coastal Volunteer Alliance Vizag',
    type: 'VOLUNTEER_GROUP',
    contactName: 'Vikram Aditya (Lead Volunteer)',
    email: 'brigade@vizagvolunteers.org',
    phone: '+91 98480 87654',
    coverageArea: 'Ramakrishna (RK) Beach & Submarine Museum Intertidal Sands',
    active: true,
  },
  {
    id: 'org-lawsons-cleanup-squad',
    name: "Lawson's Bay Intertidal Cleanup Squad",
    type: 'CLEANUP_TEAM',
    contactName: 'M. Appala Raju (Sanitation Lead)',
    email: 'squad.lawsons@gvmc-contractors.in',
    phone: '+91 891 2554321',
    coverageArea: "Lawson's Bay Artisanal Fishing Cove & Jalaripeta Coast",
    active: true,
  },
  {
    id: 'org-dolphin-nose-remediation',
    name: 'Dolphin’s Nose & Fishing Harbour Response Crew',
    type: 'OTHER',
    contactName: 'Capt. K. Srinivas (Harbour Ops)',
    email: 'dispatch@portmaritimeclean.in',
    phone: '+91 891 2871100',
    coverageArea: 'Visakhapatnam Fishing Harbour Breakwater & Yarada Northern Flank',
    active: true,
  },
];

export async function listOrganizations(): Promise<OrganizationDoc[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      // Seed default organizations if none exist yet
      await seedDefaultOrganizations();
      const reQuery = await getDocs(q);
      return reQuery.docs.map((d) => d.data() as OrganizationDoc);
    }
    return snapshot.docs.map((d) => d.data() as OrganizationDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return [];
  }
}

export function subscribeToOrganizations(
  onOrganizations: (orgs: OrganizationDoc[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'));
  return onSnapshot(
    q,
    async (snapshot) => {
      if (snapshot.empty) {
        // If collection empty, seed defaults
        try {
          await seedDefaultOrganizations();
        } catch {
          // Ignore if another instance already seeded
        }
        onOrganizations(
          DEFAULT_ORGANIZATIONS.map((org) => ({
            ...org,
            createdAt: new Date().toISOString(),
          }))
        );
        return;
      }
      const orgs = snapshot.docs.map((d) => d.data() as OrganizationDoc);
      onOrganizations(orgs);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
    }
  );
}

export async function seedDefaultOrganizations(): Promise<void> {
  for (const org of DEFAULT_ORGANIZATIONS) {
    const orgRef = doc(db, COLLECTION_NAME, org.id);
    const existing = await getDoc(orgRef);
    if (!existing.exists()) {
      await setDoc(orgRef, {
        ...org,
        createdAt: new Date().toISOString(),
      });
    }
  }
}

export async function createOrganization(
  orgData: Omit<OrganizationDoc, 'id' | 'createdAt'>
): Promise<OrganizationDoc> {
  const id = `org-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const path = `${COLLECTION_NAME}/${id}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const newOrg: OrganizationDoc = {
      ...orgData,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, newOrg);
    return newOrg;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

export async function updateOrganization(
  id: string,
  updates: Partial<Omit<OrganizationDoc, 'id' | 'createdAt'>>
): Promise<void> {
  const path = `${COLLECTION_NAME}/${id}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteOrganization(id: string): Promise<void> {
  const path = `${COLLECTION_NAME}/${id}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function toggleOrganizationActive(
  id: string,
  active: boolean
): Promise<void> {
  await updateOrganization(id, { active });
}
