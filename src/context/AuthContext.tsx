import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/auth';
import { DEMO_PERSONAS, localDataService, localEvents } from '../services/localDataService';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  providerNotice: string | null;
  isDemoMode: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password?: string,
    role?: UserRole,
    organization?: string
  ) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (allowedRoles: UserRole[]) => boolean;
  clearError: () => void;
  switchRole: (newRole: UserRole) => void;
  enterDemoMode: (role?: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    return localDataService.getActiveUser();
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [providerNotice] = useState<string | null>(
    'Demonstration Mode Active — Role switching simulates field & command roles with local browser persistence.'
  );

  // Sync state with local events
  useEffect(() => {
    const handleAuthChange = () => {
      setUser(localDataService.getActiveUser());
    };
    localEvents.addEventListener('auth_updated', handleAuthChange);
    return () => localEvents.removeEventListener('auth_updated', handleAuthChange);
  }, []);

  const switchRole = (newRole: UserRole) => {
    const persona = DEMO_PERSONAS[newRole] || DEMO_PERSONAS.CITIZEN;
    localDataService.setActiveUser(persona);
    setUser(persona);
  };

  const enterDemoMode = (role: UserRole = 'COORDINATOR') => {
    switchRole(role);
  };

  const login = async (email: string, _password?: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    const cleanEmail = email.trim().toLowerCase();

    // Map common demo patterns or create demo persona
    let role: UserRole = 'CITIZEN';
    if (cleanEmail.includes('coord')) role = 'COORDINATOR';
    else if (cleanEmail.includes('admin')) role = 'ADMIN';
    else if (cleanEmail.includes('clean') || cleanEmail.includes('crew')) role = 'CLEANUP_TEAM';
    else if (cleanEmail.includes('volun')) role = 'VOLUNTEER';
    else if (cleanEmail.includes('research')) role = 'RESEARCHER';

    const customUser: UserProfile = {
      id: `usr-demo-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      name: email.split('@')[0].replace(/[._]/g, ' ') || 'Demo Observer',
      email: cleanEmail,
      role,
      organization: role === 'ADMIN' ? 'APPCB / GVMC Coastal Command' : 'Visakhapatnam Coastal Observer',
      badgeLevel: role === 'ADMIN' ? 'Platform Director' : 'Community Observer',
      createdAt: new Date().toISOString(),
    };

    localDataService.setActiveUser(customUser);
    setUser(customUser);
    setIsLoading(false);
  };

  const register = async (
    name: string,
    email: string,
    _password?: string,
    role: UserRole = 'CITIZEN',
    organization?: string
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name,
      email: email.trim().toLowerCase(),
      role,
      organization: organization || 'Visakhapatnam Coastal Network',
      badgeLevel: role === 'ADMIN' ? 'Platform Director' : 'Observer',
      createdAt: new Date().toISOString(),
    };

    localDataService.setActiveUser(newUser);
    setUser(newUser);
    setIsLoading(false);
  };

  const loginWithGoogle = async (): Promise<void> => {
    // Demo Google login creates an active evaluator session
    enterDemoMode('COORDINATOR');
  };

  const logout = async (): Promise<void> => {
    localDataService.setActiveUser(null);
    setUser(null);
  };

  const hasRole = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return allowedRoles.includes(user.role);
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    role: user?.role || 'CITIZEN',
    isAuthenticated: !!user,
    isLoading,
    error,
    providerNotice,
    isDemoMode: true,
    login,
    register,
    loginWithGoogle,
    logout,
    hasRole,
    clearError,
    switchRole,
    enterDemoMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
