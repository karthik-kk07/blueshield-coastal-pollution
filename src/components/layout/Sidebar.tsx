import React from 'react';
import { AppRoute } from '../../types/navigation';
import { useAuth } from '../../context/AuthContext';
import { useIncidents } from '../../context/IncidentContext';
import {
  LayoutDashboard,
  MapPin,
  AlertCircle,
  BarChart3,
  Flame,
  GitFork,
  UserCheck,
  ShieldAlert,
  Home,
  FileCheck2,
  Building2,
  HardHat,
  Lightbulb,
} from 'lucide-react';

interface SidebarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRoute, onNavigate }) => {
  const { role, hasRole } = useAuth();
  const { metrics } = useIncidents();

  const navigationSections = [
    {
      title: 'Civic Platform',
      items: [
        { label: 'Overview', href: '/' as AppRoute, icon: Home },
        { label: 'File Report', href: '/report' as AppRoute, icon: AlertCircle },
        { label: 'Coastal Map', href: '/map' as AppRoute, icon: MapPin },
      ],
    },
    {
      title: 'Operations & Field',
      items: [
        ...(hasRole(['COORDINATOR', 'ADMIN'])
          ? [
              {
                label: 'Verify Queue',
                href: '/verify' as AppRoute,
                icon: FileCheck2,
                badge: metrics.pendingCount > 0 ? `${metrics.pendingCount} new` : undefined,
                badgeVariant: 'warning' as const,
              },
              {
                label: 'Assignments & Dispatch',
                href: '/assignments' as AppRoute,
                icon: Building2,
              },
            ]
          : []),
        {
          label: 'Field Tasks',
          href: '/field' as AppRoute,
          icon: HardHat,
        },
        {
          label: 'Dashboard',
          href: '/dashboard' as AppRoute,
          icon: LayoutDashboard,
          badge: metrics.pendingCount > 0 ? `${metrics.pendingCount} pending` : undefined,
          badgeVariant: 'warning',
        },
        {
          label: 'Hotspot Zones',
          href: '/hotspots' as AppRoute,
          icon: Flame,
          badge: metrics.activeHotspotsCount > 0 ? `${metrics.activeHotspotsCount}` : undefined,
        },
        {
          label: 'Prevention Framework',
          href: '/prevention' as AppRoute,
          icon: Lightbulb,
        },
        {
          label: 'Entry Points',
          href: '/entry-points' as AppRoute,
          icon: GitFork,
          badge: `${metrics.monitoredEntryPointsCount}`,
        },
        {
          label: 'Analytics',
          href: '/analytics' as AppRoute,
          icon: BarChart3,
        },
      ],
    },
    {
      title: 'Account & Governance',
      items: [
        { label: 'My Impact Profile', href: '/profile' as AppRoute, icon: UserCheck },
        ...(hasRole(['ADMIN'])
          ? [{ label: 'Admin & Protocol', href: '/admin' as AppRoute, icon: ShieldAlert }]
          : []),
      ],
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 min-h-[calc(100vh-3.5rem)] flex flex-col justify-between p-4 shrink-0 hidden md:flex">
      <div className="space-y-6">
        {navigationSections.map((section, sIdx) => (
          <div key={sIdx}>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block px-2 mb-1.5">
              {section.title}
            </span>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = currentRoute === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <button
                      onClick={() => onNavigate(item.href)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded transition-colors text-left ${
                        isActive
                          ? 'bg-[#0B2545] text-white font-semibold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-300' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : item.badgeVariant === 'warning'
                              ? 'bg-amber-100 text-amber-900 font-semibold'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Coastal verification quick status card */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#0B2545]">
          <FileCheck2 className="w-4 h-4 text-teal-600" />
          <span>Verification Engine</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
          Multi-party human ground truth protocol active.
        </p>
        <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600 font-mono">
          <span>Active Role:</span>
          <span className="font-semibold text-slate-800 capitalize">{role.replace('_', ' ')}</span>
        </div>
      </div>
    </aside>
  );
};
