import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppRoute } from '../../types/navigation';
import { PlusCircle, User, ShieldCheck, ChevronDown, RotateCcw, Sparkles, Check } from 'lucide-react';
import { UserRole } from '../../types/auth';
import { BlueShieldLogo } from '../ui/BlueShieldLogo';
import { localDataService } from '../../services/localDataService';
import { ReportDoc } from '../../types/firestore';

interface NavbarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, onNavigate }) => {
  const { user, role, switchRole, isAuthenticated } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleResetDemo = () => {
    localDataService.loadDemoData();
    showToast('Demo data restored to initial Visakhapatnam baseline.');
  };

  const handleLoadDemoScenario = () => {
    // Generate a fresh interactive 7-stage demonstration scenario
    const now = new Date();
    const scenarioReport: ReportDoc = {
      id: `rep-demo-scenario-${Date.now()}`,
      reportNumber: `BS-2026-SCENARIO`,
      title: '[DEMO SCENARIO] Submerged Nylon Ghost Net & Plastic Ingestion Threat',
      reportedBy: 'Karthik Varma (Citizen Observer)',
      latitude: 17.718,
      longitude: 83.332,
      coastalZone: 'RK Beach North (Ghats Sector)',
      pollutionType: 'Fishing Waste',
      severity: 'HIGH',
      description: 'DEMO DATA: Complete demonstration incident illustrating full lifecycle from citizen submission, coordinator triage, and municipal dispatch to verified closure.',
      photoUrl: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=800&q=80',
      afterPhotoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      status: 'VERIFIED_CLOSED',
      createdAt: new Date(now.getTime() - 3600000 * 24).toISOString(),
      verifiedBy: 'Capt. Rajesh Kakarla (Coordinator)',
      verifiedAt: new Date(now.getTime() - 3600000 * 20).toISOString(),
      assignedOrganization: 'GVMC Coastal Directorate (Zone 3)',
      assignedTo: 'Ramesh Babu (Team Lead)',
      assignedAt: new Date(now.getTime() - 3600000 * 16).toISOString(),
      acceptedBy: 'Ramesh Babu',
      acceptedAt: new Date(now.getTime() - 3600000 * 12).toISOString(),
      startedAt: new Date(now.getTime() - 3600000 * 8).toISOString(),
      cleanedAt: new Date(now.getTime() - 3600000 * 4).toISOString(),
      closedAt: new Date(now.getTime() - 3600000 * 1).toISOString(),
      notes: 'DEMO DATA: 180 kg entangled marine gear extracted by manual winch and diverted to municipal solid waste facility.',
    };

    localDataService.addReport(scenarioReport);
    localDataService.addCleanupRecord({
      id: `cln-demo-scenario-${Date.now()}`,
      reportId: scenarioReport.id,
      afterPhoto: scenarioReport.afterPhotoUrl || '',
      afterPhotoUrl: scenarioReport.afterPhotoUrl,
      wasteWeight: 180,
      dryWeightKg: 180,
      areaCleaned: '120 meters of intertidal rocks',
      completedBy: 'Ramesh Babu (GVMC Zone 3)',
      completedAt: scenarioReport.cleanedAt || new Date().toISOString(),
      disposalMethod: 'GVMC Kapuluppada Recycling Facility',
      notes: 'DEMO DATA: Full end-to-end lifecycle test completed.',
    });

    showToast('Loaded complete 7-step Demo Scenario into Reports and Dashboard.');
    onNavigate('/dashboard');
  };

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
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center text-left focus-visible:outline-2 focus-visible:outline-teal-400 rounded transition-opacity hover:opacity-95"
            aria-label="BlueShield Home"
          >
            <BlueShieldLogo size="md" theme="dark" subtext="Visakhapatnam Marine Platform" />
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
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

        {/* Zone 3: Primary Actions, Reset Demo, and Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Controls */}
          <button
            onClick={handleResetDemo}
            className="hidden lg:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded transition-colors"
            title="Reset demonstration data to baseline"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span>Reset Demo</span>
          </button>

          <button
            onClick={handleLoadDemoScenario}
            className="hidden xl:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-teal-300 hover:text-teal-200 bg-teal-950/60 hover:bg-teal-900/60 border border-teal-600/50 rounded transition-colors"
            title="Load comprehensive 7-stage demo scenario"
          >
            <Sparkles className="w-3 h-3 text-teal-400" />
            <span>Load Scenario</span>
          </button>

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
            <span>Report</span>
          </button>

          {/* Role Preview Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
              title="Switch demo persona to test role permissions"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span className="font-mono">{roleShortLabels[role]}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {roleMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-64 rounded-md bg-white text-slate-900 border border-slate-200 shadow-xl py-1.5 z-50 text-xs"
                onClick={() => setRoleMenuOpen(false)}
              >
                <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold uppercase text-slate-500">
                  <span>Demo Personas</span>
                  <span className="text-[10px] text-teal-700 font-mono">Instant Switch</span>
                </div>
                {(['CITIZEN', 'VOLUNTEER', 'COORDINATOR', 'CLEANUP_TEAM', 'ADMIN', 'RESEARCHER'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => switchRole(r)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      role === r ? 'font-semibold text-[#0B2545] bg-teal-50/60' : 'text-slate-700'
                    }`}
                  >
                    <span>{roleLabels[r]}</span>
                    {role === r && <span className="text-teal-600 font-bold">✓</span>}
                  </button>
                ))}

                <div className="border-t border-slate-100 mt-1 pt-1 px-2 space-y-1">
                  <button
                    onClick={handleResetDemo}
                    className="w-full text-left px-2 py-1.5 text-[11px] text-amber-700 hover:bg-amber-50 rounded flex items-center gap-1.5 font-medium"
                  >
                    <RotateCcw className="w-3 h-3 text-amber-600" />
                    <span>Reset Demo to Baseline</span>
                  </button>
                  <button
                    onClick={handleLoadDemoScenario}
                    className="w-full text-left px-2 py-1.5 text-[11px] text-teal-700 hover:bg-teal-50 rounded flex items-center gap-1.5 font-medium"
                  >
                    <Sparkles className="w-3 h-3 text-teal-600" />
                    <span>Load 7-Stage Demo Scenario</span>
                  </button>
                </div>
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

      {/* Floating Demo Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white border border-teal-500/50 shadow-2xl px-4 py-2.5 rounded-lg text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </header>
  );
};
