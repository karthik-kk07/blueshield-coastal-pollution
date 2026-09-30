import React, { useState } from 'react';
import { AppRoute } from '../../types/navigation';
import { UserRole } from '../../types/auth';
import {
  Home,
  MapPin,
  PlusCircle,
  LayoutDashboard,
  Menu,
  X,
  ShieldAlert,
  BarChart3,
  Flame,
  GitFork,
  UserCheck,
  FileCheck2,
  Building2,
  HardHat,
  Lightbulb,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useIncidents } from '../../context/IncidentContext';
import { BlueShieldLogo } from '../ui/BlueShieldLogo';

interface MobileNavProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentRoute, onNavigate }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { hasRole, role, switchRole } = useAuth();
  const { metrics } = useIncidents();

  const handleNavClick = (route: AppRoute) => {
    onNavigate(route);
    setDrawerOpen(false);
  };

  const navItems = [
    { label: 'Home', route: '/' as AppRoute, icon: Home },
    { label: 'Map', route: '/map' as AppRoute, icon: MapPin },
    { label: 'Report', route: '/report' as AppRoute, icon: PlusCircle, isCta: true },
    { label: 'Ops', route: '/dashboard' as AppRoute, icon: LayoutDashboard, badge: metrics.pendingCount },
    { label: 'More', route: null, icon: Menu, isAction: true },
  ];

  return (
    <>
      {/* Fixed bottom navigation bar (height: 52px, well within 15% sticky cap) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 h-13 px-2 flex items-center justify-around shadow-lg">
        {navItems.map((item, idx) => {
          if (item.isAction) {
            return (
              <button
                key={idx}
                onClick={() => setDrawerOpen(!drawerOpen)}
                className="flex flex-col items-center justify-center w-12 py-1 text-slate-500 hover:text-slate-900"
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
              </button>
            );
          }

          const isActive = currentRoute === item.route;
          const Icon = item.icon;

          if (item.isCta) {
            return (
              <button
                key={idx}
                onClick={() => handleNavClick(item.route!)}
                className="flex flex-col items-center justify-center -mt-3.5 bg-teal-600 hover:bg-teal-500 text-white rounded-full w-11 h-11 shadow-md border-2 border-white"
              >
                <Icon className="w-5 h-5" />
                <span className="sr-only">Report Incident</span>
              </button>
            );
          }

          return (
            <button
              key={idx}
              onClick={() => handleNavClick(item.route!)}
              className={`relative flex flex-col items-center justify-center w-12 py-1 transition-colors ${
                isActive ? 'text-[#0B2545] font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-amber-500" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative ml-auto w-72 max-w-[85vw] bg-white h-full shadow-2xl p-5 flex flex-col justify-between z-10 overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <BlueShieldLogo size="sm" theme="light" subtext="Vizag Platform" />
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Navigation
                </span>
                <div className="space-y-1">
                  <button
                    onClick={() => handleNavClick('/')}
                    className="w-full text-left px-3 py-2 rounded text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                  >
                    <Home className="w-4 h-4 text-slate-400" />
                    <span>Home &amp; Overview</span>
                  </button>
                  {hasRole(['COORDINATOR', 'ADMIN']) && (
                    <button
                      onClick={() => handleNavClick('/verify')}
                      className="w-full text-left px-3 py-2 rounded text-xs font-semibold text-teal-800 bg-teal-50/60 hover:bg-teal-100 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4 text-teal-600" />
                        <span>Human Verify Queue</span>
                      </div>
                      {metrics.pendingCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-mono">
                          {metrics.pendingCount}
                        </span>
                      )}
                    </button>
                  )}
                  {hasRole(['COORDINATOR', 'ADMIN']) && (
                    <button
                      onClick={() => handleNavClick('/assignments')}
                      className="w-full text-left px-3 py-2 rounded text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                    >
                      <Building2 className="w-4 h-4 text-purple-600" />
                      <span>Assignments &amp; Dispatch</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleNavClick('/field')}
                    className="w-full text-left px-3 py-2 rounded text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                  >
                    <HardHat className="w-4 h-4 text-amber-500" />
                    <span>Field Worker Tasks</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('/dashboard')}
                    className="w-full text-left px-3 py-2 rounded text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-400" />
                    <span>Operations Dashboard</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('/map')}
                    className="w-full text-left px-3 py-2 rounded text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>Coastal Map</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('/hotspots')}
                    className="w-full text-left px-3 py-2.5 min-h-[44px] rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition-colors"
                  >
                    <Flame className="w-4 h-4 text-slate-400" />
                    <span>Pollution Hotspots</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('/prevention')}
                    className="w-full text-left px-3 py-2.5 min-h-[44px] rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition-colors"
                  >
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span>Prevention Framework</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('/entry-points')}
                    className="w-full text-left px-3 py-2.5 min-h-[44px] rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition-colors"
                  >
                    <GitFork className="w-4 h-4 text-slate-400" />
                    <span>Outfall Entry Points</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('/analytics')}
                    className="w-full text-left px-3 py-2 rounded text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4 text-slate-400" />
                    <span>Trends &amp; Analytics</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('/profile')}
                    className="w-full text-left px-3 py-2 rounded text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                  >
                    <UserCheck className="w-4 h-4 text-slate-400" />
                    <span>User Impact Profile</span>
                  </button>
                  {hasRole(['ADMIN']) && (
                    <button
                      onClick={() => handleNavClick('/admin')}
                      className="w-full text-left px-3 py-2 rounded text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                    >
                      <ShieldAlert className="w-4 h-4 text-slate-400" />
                      <span>Admin &amp; Protocol</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Active Role Selector in mobile drawer */}
              <div className="pt-3 border-t border-slate-200">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Active Role: {role}
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  {(['CITIZEN', 'VOLUNTEER', 'COORDINATOR', 'CLEANUP_TEAM', 'ADMIN', 'RESEARCHER'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => switchRole(r)}
                      className={`px-2 py-1.5 rounded border text-center font-medium truncate ${
                        role === r
                          ? 'border-teal-600 bg-teal-50 text-teal-800 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() => handleNavClick('/login')}
                className="w-full text-center py-2 text-xs font-medium bg-[#0B2545] text-white rounded"
              >
                Account Authentication
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
