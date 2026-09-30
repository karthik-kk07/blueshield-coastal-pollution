import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, UserRole } from '../types/auth';

const COLLECTION_NAME = 'users';

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const path = `${COLLECTION_NAME}/${userId}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data();
    return {
      id: snap.id,
      name: data.name || '',
      email: data.email || '',
      role: (data.role as UserRole) || 'CITIZEN',
      organization: data.organization || '',
      createdAt: data.createdAt || new Date().toISOString(),
      displayName: data.name || '',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createUserProfile(profile: UserProfile): Promise<void> {
  const path = `${COLLECTION_NAME}/${profile.id}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, profile.id);
    const data: Record<string, any> = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      organization: profile.organization || '',
      createdAt: profile.createdAt || new Date().toISOString(),
    };
    if (profile.displayName) data.displayName = profile.displayName;
    if (profile.badgeLevel) data.badgeLevel = profile.badgeLevel;
    await setDoc(docRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'name' | 'organization' | 'role'>>
): Promise<void> {
  const path = `${COLLECTION_NAME}/${userId}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, userId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function listAllUsers(maxResults = 50): Promise<UserProfile[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME), limit(maxResults));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name || '',
        email: data.email || '',
        role: (data.role as UserRole) || 'CITIZEN',
        organization: data.organization || '',
        createdAt: data.createdAt || '',
        displayName: data.name || '',
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
  }
}
