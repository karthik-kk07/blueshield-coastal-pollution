import { UserProfile, UserRole } from '../types/auth';

const USERS_STORAGE_KEY = 'blueshield_local_users_v3';

function getStoredUsers(): Record<string, UserProfile> {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredUsers(users: Record<string, UserProfile>): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users locally:', err);
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const users = getStoredUsers();
  return users[userId] || null;
}

export async function createUserProfile(profile: UserProfile): Promise<void> {
  const users = getStoredUsers();
  users[profile.id] = {
    ...profile,
    createdAt: profile.createdAt || new Date().toISOString(),
  };
  saveStoredUsers(users);
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'name' | 'organization' | 'role' | 'badgeLevel'>>
): Promise<void> {
  const users = getStoredUsers();
  if (users[userId]) {
    users[userId] = {
      ...users[userId],
      ...updates,
    };
    saveStoredUsers(users);
  }
}

export async function listRecentUsers(limitCount = 20): Promise<UserProfile[]> {
  const users = getStoredUsers();
  return Object.values(users).slice(0, limitCount);
}

export const listAllUsers = listRecentUsers;
