import React, { useState, useEffect } from 'react';
import { AppRoute } from '../types/navigation';
import { AppLayout } from '../components/layout/AppLayout';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ReportPage } from '../pages/ReportPage';
import { VerifyPage } from '../pages/VerifyPage';
import { AssignmentsPage } from '../pages/AssignmentsPage';
import { AssignmentDetailPage } from '../pages/AssignmentDetailPage';
import { FieldPage } from '../pages/FieldPage';
import { DashboardPage } from '../pages/DashboardPage';
import { MapPage } from '../pages/MapPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { HotspotsPage } from '../pages/HotspotsPage';
import { EntryPointsPage } from '../pages/EntryPointsPage';
import { ProfilePage } from '../pages/ProfilePage';
import { AdminPage } from '../pages/AdminPage';
import { HistoricalDataImportPage } from '../pages/HistoricalDataImportPage';
import { PreventionPage } from '../pages/PreventionPage';
import { EmptyState } from '../components/ui/EmptyState';

const VALID_ROUTES: AppRoute[] = [
  '/',
  '/login',
  '/register',
  '/report',
  '/verify',
  '/assignments',
  '/field',
  '/dashboard',
  '/map',
  '/analytics',
  '/hotspots',
  '/prevention',
  '/entry-points',
  '/profile',
  '/admin',
  '/admin/historical-data',
];

const getNormalizedRoute = (): AppRoute => {
  // Support both standard pathname and hash fallback
  const hash = window.location.hash.replace(/^#/, '');
  if (hash) {
    if (VALID_ROUTES.includes(hash as AppRoute) || hash.startsWith('/assignments/')) {
      return hash as AppRoute;
    }
  }

  const pathname = window.location.pathname;
  if (VALID_ROUTES.includes(pathname as AppRoute) || pathname.startsWith('/assignments/')) {
    return pathname as AppRoute;
  }

  return '/';
};

export const Router: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => getNormalizedRoute());

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(getNormalizedRoute());
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const navigate = (route: AppRoute) => {
    if (route === currentRoute) return;
    try {
      window.history.pushState({}, '', route);
    } catch {
      // In sandbox environments where pushState might be restricted, fallback to hash
      window.location.hash = route;
    }
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentRoute) {
      case '/':
        return <HomePage onNavigate={navigate} />;
      case '/login':
        return <LoginPage onNavigate={navigate} />;
      case '/register':
        return <RegisterPage onNavigate={navigate} />;
      case '/report':
        return <ReportPage onNavigate={navigate} />;
      case '/verify':
        return <VerifyPage onNavigate={navigate} />;
      case '/assignments':
        return <AssignmentsPage onNavigate={navigate} />;
      case '/field':
        return <FieldPage onNavigate={navigate} />;
      case '/dashboard':
        return <DashboardPage onNavigate={navigate} />;
      case '/map':
        return <MapPage onNavigate={navigate} />;
      case '/analytics':
        return <AnalyticsPage onNavigate={navigate} />;
      case '/hotspots':
        return <HotspotsPage onNavigate={navigate} />;
      case '/prevention':
        return <PreventionPage onNavigate={navigate} />;
      case '/entry-points':
        return <EntryPointsPage onNavigate={navigate} />;
      case '/profile':
        return <ProfilePage onNavigate={navigate} />;
      case '/admin':
        return <AdminPage onNavigate={navigate} />;
      case '/admin/historical-data':
        return <HistoricalDataImportPage onNavigate={navigate} />;
      default:
        if (currentRoute.startsWith('/assignments/')) {
          const reportId = currentRoute.replace('/assignments/', '');
          return <AssignmentDetailPage reportId={reportId} onNavigate={navigate} />;
        }
        return (
          <EmptyState
            title="Page Not Found"
            description="The requested coastal route does not exist."
            actionLabel="Return to Overview"
            onAction={() => navigate('/')}
          />
        );
    }
  };

  return (
    <AppLayout currentRoute={currentRoute} onNavigate={navigate}>
      {renderPage()}
    </AppLayout>
  );
};
