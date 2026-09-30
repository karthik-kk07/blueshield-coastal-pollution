import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppRoute } from '../../types/navigation';
import { PlusCircle, User, ShieldCheck, ChevronDown, MapPin } from 'lucide-react';
import { UserRole } from '../../types/auth';
import { BlueShieldLogo } from '../ui/BlueShieldLogo';

interface NavbarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, onNavigate }) => {
  const { user, role, switchRole, isAuthenticated } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  // Keep only the necessary primary sections at the top
  const mainLinks: { label: string; href: AppRoute }[] = [
    { label: 'Overview', href: '/' },
    { label: 'Coastal Map', href: '/map' },
    { label: 'Operations', href: '/dashboard' },
    ...(role === 'CLEANUP_TEAM' || role === 'VOLUNTEER' || role === 'COORDINATOR' || role === 'ADMIN'
      ? [{ label: 'Field Tasks', href: '/field' as AppRoute }]
      : []),
    ...(role === 'COORDINATOR' || role === 'ADMIN'
      ? [
          { label: 'Verify Queue', href: '/verify' as AppRoute },
          { label: 'Assignments', href: '/assignments' as AppRoute },
        ]
      : []),
  ];

  const roleLabels: Record<UserRole, string> = {
    CITIZEN: 'Citizen Observer',
    VOLUNTEER: 'Accredited Volunteer',
    COORDINATOR: 'Municipal Coordinator',
    CLEANUP_TEAM: 'Cleanup Response Team',
    ADMIN: 'Platform Admin (GVMC/APPCB)',
    RESEARCHER: 'Marine Science Researcher',
  };

  const roleShortLabels: Record<UserRole, string> = {
    CITIZEN: 'Citizen',
    VOLUNTEER: 'Volunteer',
    COORDINATOR: 'Coordinator',
    CLEANUP_TEAM: 'Cleanup Team',
    ADMIN: 'Admin',
    RESEARCHER: 'Researcher',
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#05192D] border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        
        {/* Zone 1: Brand Logo & Visakhapatnam Tagline */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center text-left focus-visible:outline-2 focus-visible:outline-teal-400 rounded transition-opacity hover:opacity-95"
            aria-label="BlueShield Home"
          >
            <BlueShieldLogo size="md" theme="dark" subtext="Visakhapatnam Marine Platform" />
          </button>
        </div>

        {/* Zone 2: 4-5 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
          {mainLinks.map((link) => {
            const isActive = currentRoute === link.href;
            return (
              <button
                key={link.href}
                onClick={() => onNavigate(link.href)}
                className={`py-1 transition-colors hover:text-white border-b-2 ${
                  isActive ? 'text-teal-400 border-teal-400 font-semibold' : 'border-transparent text-slate-300'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          {/* Quick Report CTA */}
          <button
            onClick={() => onNavigate('/report')}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              currentRoute === '/report'
                ? 'bg-teal-500 text-slate-950 font-semibold'
                : 'bg-teal-600 hover:bg-teal-500 text-white'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Report Pollution</span>
          </button>

          {/* Role Preview Switcher (Crucial for testing role-based access without tedious logouts) */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
              title="Switch demo persona to test role permissions"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden md:inline font-mono">{roleShortLabels[role]}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {roleMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-56 rounded-md bg-white text-slate-900 border border-slate-200 shadow-lg py-1.5 z-50 text-xs"
                onClick={() => setRoleMenuOpen(false)}
              >
                <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold uppercase text-slate-400">
                  Switch Active Role (Test)
                </div>
                {(['CITIZEN', 'VOLUNTEER', 'COORDINATOR', 'CLEANUP_TEAM', 'ADMIN', 'RESEARCHER'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => switchRole(r)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      role === r ? 'font-semibold text-[#0B2545] bg-slate-50' : 'text-slate-700'
                    }`}
                  >
                    <span>{roleLabels[r]}</span>
                    {role === r && <span className="text-teal-600 font-bold">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Profile / Auth link */}
          {isAuthenticated ? (
            <button
              onClick={() => onNavigate('/profile')}
              className={`p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors ${
                currentRoute === '/profile' ? 'text-teal-400' : ''
              }`}
              title={user?.displayName || 'User Profile'}
            >
              <User className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => onNavigate('/login')}
              className="text-xs font-medium text-slate-300 hover:text-white px-2 py-1"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
