export type UserRole =
  | 'CITIZEN'
  | 'VOLUNTEER'
  | 'COORDINATOR'
  | 'CLEANUP_TEAM'
  | 'ADMIN'
  | 'RESEARCHER';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization?: string;
  createdAt: string;
  // UI helper attributes
  displayName?: string;
  badgeLevel?: string;
  verifiedIdentity?: boolean;
  assignedRegion?: string;
  reportsSubmitted?: number;
  verificationsCompleted?: number;
}

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}
