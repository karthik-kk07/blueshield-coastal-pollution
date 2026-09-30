/**
 * BlueShield — Human-Verified Coastal Pollution Response & Prevention Platform
 * Tagline: Protecting our coastline through people, data and action.
 */

import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { IncidentProvider } from './context/IncidentContext';
import { Router } from './router/Router';

export default function App() {
  return (
    <AuthProvider>
      <IncidentProvider>
        <Router />
      </IncidentProvider>
    </AuthProvider>
  );
}

