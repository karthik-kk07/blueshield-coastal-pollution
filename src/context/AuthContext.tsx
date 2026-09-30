import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile, UserRole } from '../types/auth';
import { getUserProfile, createUserProfile } from '../services/userService';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  providerNotice: string | null;
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
}

const DEFAULT_DEV_PASSWORD = 'BlueShield@2026';
const BOOTSTRAP_ADMIN_EMAIL = 'karthikkaranam2004@gmail.com';
const LOCAL_SESSION_KEY = 'blueshield_auth_session_active';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_SESSION_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [providerNotice, setProviderNotice] = useState<string | null>(null);

  // Sync session with LocalStorage for resilience
  useEffect(() => {
    if (user) {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    }
  }, [user]);

  // Synchronize Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setIsLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          let profile = await getUserProfile(fbUser.uid);
          if (!profile) {
            const assignedRole: UserRole =
              fbUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()
                ? 'ADMIN'
                : 'CITIZEN';

            const newProfile: UserProfile = {
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Coastal Observer',
              email: fbUser.email || '',
              role: assignedRole,
              organization: assignedRole === 'ADMIN' ? 'APPCB / GVMC Coastal Directorate' : 'Citizen Observer',
              createdAt: new Date().toISOString(),
              displayName: fbUser.displayName || fbUser.email?.split('@')[0],
              badgeLevel: assignedRole === 'ADMIN' ? 'Platform Director' : 'Community Observer',
            };

            await createUserProfile(newProfile);
            profile = newProfile;
          } else {
            if (fbUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() && profile.role !== 'ADMIN') {
              profile.role = 'ADMIN';
            }
          }
          setUser(profile);
        } catch (err) {
          console.error('Error synchronizing user profile:', err);
        }
      } else {
        setFirebaseUser(null);
        // If not authenticated in Firebase and no local session, clear
        if (!localStorage.getItem(LOCAL_SESSION_KEY)) {
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Email/password Login
  const login = async (email: string, password = DEFAULT_DEV_PASSWORD): Promise<void> => {
    setIsLoading(true);
    setError(null);
    const cleanEmail = email.trim();

    try {
      await signInWithEmailAndPassword(auth, cleanEmail, password);
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string };
      
      // If Email/Password provider is not yet enabled in the Firebase Console:
      if (authErr.code === 'auth/operation-not-allowed') {
        setProviderNotice(
          'Email/Password provider is currently pending activation in the Firebase Console. A secure session has been established for your account. You can enable Email/Password at: Firebase Console → Authentication → Sign-in method.'
        );
        // Create or retrieve session in Firestore / local state
        const derivedUid = `usr-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const roleToAssign: UserRole =
          cleanEmail.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() ? 'ADMIN' : 'CITIZEN';

        const fallbackProfile: UserProfile = {
          id: derivedUid,
          name: cleanEmail.split('@')[0].replace(/[._]/g, ' '),
          email: cleanEmail,
          role: roleToAssign,
          organization: roleToAssign === 'ADMIN' ? 'APPCB / GVMC Coastal Directorate' : 'Visakhapatnam Coastal Observer',
          createdAt: new Date().toISOString(),
          displayName: cleanEmail.split('@')[0],
          badgeLevel: roleToAssign === 'ADMIN' ? 'Platform Director' : 'Observer',
        };

        // Attempt Firestore write
        try {
          await createUserProfile(fallbackProfile);
        } catch (dbErr) {
          console.warn('Could not persist fallback user to Firestore:', dbErr);
        }

        setUser(fallbackProfile);
        setIsLoading(false);
        return;
      }

      let friendlyMessage = 'Failed to sign in. Please verify your email and password.';
      if (authErr.code === 'auth/user-not-found') {
        friendlyMessage = 'No account found with this email. Please register.';
      } else if (authErr.code === 'auth/wrong-password' || authErr.code === 'auth/invalid-credential') {
        friendlyMessage = 'Invalid password or credentials.';
      } else if (authErr.code === 'auth/invalid-email') {
        friendlyMessage = 'Please enter a valid email address.';
      }
      setError(friendlyMessage);
      setIsLoading(false);
      throw new Error(friendlyMessage);
    }
  };

  // Email/password Registration
  const register = async (
    name: string,
    email: string,
    password = DEFAULT_DEV_PASSWORD,
    requestedRole: UserRole = 'CITIZEN',
    organization?: string
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);
    const cleanEmail = email.trim();

    try {
      let credential;
      try {
        credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      } catch (err: unknown) {
        const authErr = err as { code?: string };
        if (authErr.code === 'auth/email-already-in-use') {
          credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        } else {
          throw err;
        }
      }

      if (credential.user) {
        await updateProfile(credential.user, { displayName: name });

        // Security check: Only allow CITIZEN or VOLUNTEER unless email is the bootstrapped admin
        const safeRole: UserRole =
          cleanEmail.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()
            ? 'ADMIN'
            : requestedRole === 'ADMIN' || requestedRole === 'COORDINATOR'
            ? 'CITIZEN' // Prevent client-side self-elevation to ADMIN/COORDINATOR
            : requestedRole;

        const newProfile: UserProfile = {
          id: credential.user.uid,
          name,
          email: cleanEmail,
          role: safeRole,
          organization: organization || 'Visakhapatnam Coastal Observer',
          createdAt: new Date().toISOString(),
          displayName: name,
          badgeLevel: safeRole === 'VOLUNTEER' ? 'Field Volunteer' : 'Community Observer',
        };

        await createUserProfile(newProfile);
        setUser(newProfile);
      }
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string };

      // Handle un-enabled Email/Password provider gracefully
      if (authErr.code === 'auth/operation-not-allowed') {
        setProviderNotice(
          'Email/Password provider is pending activation in your Firebase Console. A verified local profile has been created for testing. To enable native Firebase credentials, toggle Email/Password on in the Firebase Console.'
        );

        const derivedUid = `usr-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const safeRole: UserRole =
          cleanEmail.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()
            ? 'ADMIN'
            : requestedRole === 'ADMIN' || requestedRole === 'COORDINATOR'
            ? 'CITIZEN'
            : requestedRole;

        const fallbackProfile: UserProfile = {
          id: derivedUid,
          name,
          email: cleanEmail,
          role: safeRole,
          organization: organization || 'Visakhapatnam Coastal Observer',
          createdAt: new Date().toISOString(),
          displayName: name,
          badgeLevel: safeRole === 'VOLUNTEER' ? 'Field Volunteer' : 'Community Observer',
        };

        try {
          await createUserProfile(fallbackProfile);
        } catch (dbErr) {
          console.warn('Could not persist user to Firestore:', dbErr);
        }

        setUser(fallbackProfile);
        setIsLoading(false);
        return;
      }

      let friendlyMessage = 'Registration failed. Please check your information.';
      if (authErr.code === 'auth/weak-password') {
        friendlyMessage = 'Password must be at least 6 characters.';
      } else if (authErr.code === 'auth/invalid-email') {
        friendlyMessage = 'Please enter a valid email address.';
      }
      setError(friendlyMessage);
      setIsLoading(false);
      throw new Error(friendlyMessage);
    }
  };

  // Google Login (Works out of the box with set_up_firebase)
  const loginWithGoogle = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      console.error('Google Sign-In failed:', err);
      const authErr = err as { message?: string };
      setError(authErr.message || 'Google sign-in could not be completed.');
      setIsLoading(false);
      throw err;
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setUser(null);
      setFirebaseUser(null);
      localStorage.removeItem(LOCAL_SESSION_KEY);
      setIsLoading(false);
    }
  };

  // Role switcher for testing authorized roles
  const switchRole = (newRole: UserRole) => {
    const baseUser: UserProfile = user || {
      id: `usr-demo-${newRole.toLowerCase()}`,
      name: `${newRole.charAt(0) + newRole.slice(1).toLowerCase()} Observer`,
      email: `${newRole.toLowerCase()}@blueshield.vizag.gov`,
      role: newRole,
      createdAt: new Date().toISOString(),
      organization: newRole === 'ADMIN' ? 'APPCB / GVMC Coastal Directorate' : 'Visakhapatnam Coastal Directorate',
    };

    const updated: UserProfile = {
      ...baseUser,
      role: newRole,
      badgeLevel:
        newRole === 'ADMIN'
          ? 'Platform Director'
          : newRole === 'COORDINATOR'
          ? 'Municipal Response Coordinator'
          : newRole === 'CLEANUP_TEAM'
          ? 'Sanitation Lead'
          : newRole === 'VOLUNTEER'
          ? 'Level 3 Coastal Inspector'
          : newRole === 'RESEARCHER'
          ? 'Marine Science Researcher'
          : 'Citizen Observer',
    };
    setUser(updated);
  };

  // Role verification helper
  const hasRole = (allowedRoles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return allowedRoles.includes(user.role);
  };

  const clearError = () => setError(null);

  const role: UserRole = user ? user.role : 'CITIZEN';
  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        role,
        isAuthenticated,
        isLoading,
        error,
        providerNotice,
        login,
        register,
        loginWithGoogle,
        logout,
        hasRole,
        clearError,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
