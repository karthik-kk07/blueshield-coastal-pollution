import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { AppRoute } from '../../types/navigation';

interface AppLayoutProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  children: React.ReactNode;
  showSidebar?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentRoute,
  onNavigate,
  children,
  showSidebar = true,
}) => {
  // Routes where sidebar is hidden for immersion (e.g. landing page, login, register)
  const isFullWidthPage = currentRoute === '/' || currentRoute === '/login' || currentRoute === '/register';
  const shouldRenderSidebar = showSidebar && !isFullWidthPage;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      <Navbar currentRoute={currentRoute} onNavigate={onNavigate} />

      <div className="flex-1 flex w-full">
        {shouldRenderSidebar && (
          <Sidebar currentRoute={currentRoute} onNavigate={onNavigate} />
        )}

        <main className={`flex-1 flex flex-col min-w-0 pb-16 md:pb-6 ${isFullWidthPage ? '' : 'p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full'}`}>
          {children}
        </main>
      </div>

      <MobileNav currentRoute={currentRoute} onNavigate={onNavigate} />
    </div>
  );
};
