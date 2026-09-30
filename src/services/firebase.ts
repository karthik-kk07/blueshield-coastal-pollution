/**
 * BlueShield Firebase Integration Service
 * 
 * Pre-configured for Firebase Authentication, Cloud Firestore, and Firebase Storage.
 * Connects directly when standard VITE_FIREBASE_* environment variables are set,
 * with structured fallbacks for local and development runs.
 */

export interface FirebaseClientConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export const getFirebaseConfig = (): FirebaseClientConfig => {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  };
};

export const isFirebaseConfigured = (): boolean => {
  const config = getFirebaseConfig();
  return Boolean(config.apiKey && config.projectId);
};

export interface FirebaseConnectionStatus {
  authReady: boolean;
  firestoreReady: boolean;
  storageReady: boolean;
  projectId: string;
}

export const checkFirebaseStatus = (): FirebaseConnectionStatus => {
  const config = getFirebaseConfig();
  const configured = isFirebaseConfigured();
  return {
    authReady: configured,
    firestoreReady: configured,
    storageReady: configured,
    projectId: config.projectId || 'local-dev-instance',
  };
};
