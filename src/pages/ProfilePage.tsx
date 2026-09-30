import React, { useState } from 'react';
import { AppRoute } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { StatCard } from '../components/ui/StatCard';
import {
  User,
  ShieldCheck,
  Award,
  MapPin,
  Building,
  CheckCircle2,
  FileCheck2,
  AlertCircle,
  LogOut,
} from 'lucide-react';

interface ProfilePageProps {
  onNavigate: (route: AppRoute) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, role, switchRole, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'credentials' | 'settings'>('overview');

  const roleDisplayNames: Record<UserRole, string> = {
    CITIZEN: 'Citizen Observer',
    VOLUNTEER: 'Accredited Volunteer',
    COORDINATOR: 'Municipal Coordinator',
    CLEANUP_TEAM: 'Cleanup Response Team',
    ADMIN: 'Platform Administrator',
    RESEARCHER: 'Marine Science Researcher',
  };

  const handleLogout = async () => {
    await logout();
    onNavigate('/login');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Profile &amp; Coastal Impact Record"
        description="Manage your inspector credentials, active permissions, and track your ground-truth contribution to coastal protection."
        breadcrumbs={[
          { label: 'BlueShield', href: '/' },
          { label: 'Profile' },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={LogOut}
            onClick={handleLogout}
          >
            Sign Out
          </Button>
        }
      />

      {/* User Identity Hero Card */}
      <Card className="overflow-hidden">
        <div className="p-6 bg-linear-to-r from-[#05192D] to-[#0B2545] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-teal-600 border-2 border-white/40 flex items-center justify-center text-white text-xl font-bold font-mono">
              {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'BS'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">{user?.displayName || 'Coastal Volunteer'}</h2>
                {user?.verifiedIdentity && (
                  <span className="p-1 rounded-full bg-teal-400 text-[#05192D]" title="Identity Verified">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 rounded bg-white/10 text-teal-300 text-xs font-medium border border-teal-400/20">
                  {roleDisplayNames[role]}
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-300">{user?.badgeLevel}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-1 text-xs text-slate-300 font-mono">
            <span>Sector: {user?.assignedRegion || 'Central Shoreline'}</span>
            <span>Org: {user?.organization || 'Independent Observer'}</span>
          </div>
        </div>

        {/* Impact Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200">
          <div className="bg-white p-4">
            <span className="text-xs text-slate-500 block mb-1">Reports Logged</span>
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {user?.reportsSubmitted || 0}
            </span>
          </div>
          <div className="bg-white p-4">
            <span className="text-xs text-slate-500 block mb-1">Ground Truth Confirmed</span>
            <span className="text-2xl font-bold font-mono text-teal-800 tabular-nums">
              {user?.verificationsCompleted || 0}
            </span>
          </div>
          <div className="bg-white p-4">
            <span className="text-xs text-slate-500 block mb-1">Inspector Rating</span>
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              Level 3
            </span>
          </div>
          <div className="bg-white p-4">
            <span className="text-xs text-slate-500 block mb-1">Security Clearance</span>
            <span className="text-2xl font-bold font-mono text-emerald-800 tabular-nums">
              Active
            </span>
          </div>
        </div>
      </Card>

      {/* Role Demonstration Switcher Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Role-Based Permissions &amp; Persona Switcher</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            BlueShield implements strict role-based access control (RBAC). Switch between roles below to evaluate how views, verification actions, and dispatch authority adjust according to organizational permissions:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {(['CITIZEN', 'VOLUNTEER', 'COORDINATOR', 'CLEANUP_TEAM', 'ADMIN', 'RESEARCHER'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => switchRole(r)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  role === r
                    ? 'border-teal-600 bg-teal-50/60 shadow-xs ring-1 ring-teal-600'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">
                    {roleDisplayNames[r]}
                  </span>
                  {role === r && <span className="text-teal-600 font-bold">✓</span>}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {r === 'CITIZEN' && 'Public beachgoer incident reporting & real-time status tracking.'}
                  {r === 'VOLUNTEER' && 'Ground-truth shoreline inspections & sieve volume verification.'}
                  {r === 'COORDINATOR' && 'Municipal & maritime agency triage and dispatch assignment.'}
                  {r === 'CLEANUP_TEAM' && 'Field sanitation operations, closure evidence & weighed dry weight.'}
                  {r === 'ADMIN' && 'Full platform governance, security rules, and user role management.'}
                  {r === 'RESEARCHER' && 'Longitudinal data intelligence, watershed trends, and export.'}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Verification Protocol Oath */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-teal-600" />
            <span>Visakhapatnam Ground Truth Protocol Oath</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-slate-600 space-y-2">
          <p>
            As an accredited beach inspector on the BlueShield Visakhapatnam network, you pledge to:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-500 pl-1">
            <li>Record objective, unmanipulated photographic evidence of coastal pollution along the Bay of Bengal shoreline.</li>
            <li>Prioritize personal safety: avoid rocky tetrapods during high tide or rough sea states at Dolphin's Nose and Tenneti Park.</li>
            <li>Adhere to the 2-person verification rule for toxic industrial effluents and petrochemical slicks near harbour drains.</li>
            <li>Immediately alert the Forest Wildlife Division and Coast Guard if entangled Olive Ridley sea turtles or marine mammals are spotted.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
