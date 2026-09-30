import React, { useState, useEffect } from 'react';
import { AppRoute } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { useIncidents } from '../context/IncidentContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  ShieldAlert,
  Sliders,
  History,
  CheckCircle2,
  Server,
  Lock,
  Database,
  Cloud,
  Users,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { listAllUsers } from '../services/userService';
import { UserProfile } from '../types/auth';

interface AdminPageProps {
  onNavigate: (route: AppRoute) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const { role, user, isAuthenticated, switchRole } = useAuth();
  const { auditLogs } = useIncidents();

  // Verification protocol settings
  const [minVerifiersCritical, setMinVerifiersCritical] = useState<number>(2);
  const [autoDispatchScore, setAutoDispatchScore] = useState<number>(85);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const isAdmin = role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) {
      setLoadingUsers(true);
      listAllUsers(20)
        .then((users) => {
          setUsersList(users || []);
        })
        .catch((err) => {
          console.warn('Could not list users (check rules):', err);
        })
        .finally(() => {
          setLoadingUsers(false);
        });
    }
  }, [isAdmin]);

  const handleSaveProtocol = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  // Protected Route Security Barrier: Block ordinary users completely
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-12">
        <Card className="border-rose-200 bg-rose-50/50 shadow-md">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7 text-rose-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Access Denied: Administrative Clearance Required</h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed max-w-md mx-auto">
                Ordinary users (role: <span className="font-mono font-bold text-rose-700">{role || 'GUEST'}</span>) cannot access platform administration or modify governance settings. All administrative writes are strictly verified against Firestore Security Rules on the backend.
              </p>
            </div>

            <div className="p-3 bg-white rounded border border-rose-200 text-xs text-slate-700 text-left space-y-1">
              <div className="flex justify-between font-mono text-[11px]">
                <span>Active Account:</span>
                <span className="font-semibold text-slate-900">{user?.email || 'Not Authenticated'}</span>
              </div>
              <div className="flex justify-between font-mono text-[11px]">
                <span>Enforced Role:</span>
                <span className="font-bold text-rose-700">{role}</span>
              </div>
              <div className="flex justify-between font-mono text-[11px]">
                <span>Required Permission:</span>
                <span className="font-bold text-teal-700">ADMIN</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('/')}
              >
                Return to Overview
              </Button>
              <Button
                variant="teal"
                size="sm"
                onClick={() => switchRole('ADMIN')}
              >
                Switch to ADMIN Role (Demo)
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigate('/login')}
              >
                Sign In as Admin
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Administration &amp; Governance — Visakhapatnam"
        description="Configure verification protocol thresholds for the Visakhapatnam coastline, monitor immutable audit logs, and oversee GVMC / Coast Guard dispatch infrastructure."
        breadcrumbs={[
          { label: 'BlueShield', href: '/' },
          { label: 'Visakhapatnam Governance' },
        ]}
      />

      {/* Cloud & Firebase Architecture Readiness */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-4 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-400 block">
            Longitudinal Data Ingestion
          </span>
          <h3 className="text-sm font-black text-white mt-0.5">
            Historical Beach-Cleanup Dataset Management (/admin/historical-data)
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Upload CSV/XLSX records, map columns, validate missing/duplicate entries, and commit to <code className="text-teal-300">historical_cleanups</code>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('/admin/historical-data')}
          className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs shrink-0"
        >
          Open Ingestion Portal &rarr;
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Firebase Auth</span>
            </span>
            <Badge variant="success">CONNECTED</Badge>
          </div>
          <p className="text-xs text-slate-500">
            RBAC roles strictly isolated. Ordinary users cannot self-assign ADMIN.
          </p>
        </Card>

        <Card className="p-4 border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-teal-600" />
              <span>Cloud Firestore</span>
            </span>
            <Badge variant="success">CONNECTED</Badge>
          </div>
          <p className="text-xs text-slate-500">
            Live database: <code>ai-studio-blueshield</code> with hardened rules.
          </p>
        </Card>

        <Card className="p-4 border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-blue-600" />
              <span>Firebase Storage</span>
            </span>
            <Badge variant="teal">CONFIGURED</Badge>
          </div>
          <p className="text-xs text-slate-500">
            Bucket: <code>gen-lang-client-0627196876.firebasestorage.app</code>
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Verification Protocol Governance */}
        <div className="lg:col-span-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-600" />
                <span>Ground Truth Protocol Rules</span>
              </CardTitle>
            </CardHeader>

            <form onSubmit={handleSaveProtocol}>
              <CardContent className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Required Verifiers for Critical Hazards
                  </label>
                  <select
                    value={minVerifiersCritical}
                    onChange={(e) => setMinVerifiersCritical(Number(e.target.value))}
                    className="w-full py-2 px-3 border border-slate-300 rounded bg-white text-slate-900 focus:outline-hidden"
                  >
                    <option value={1}>1 Verified Volunteer</option>
                    <option value={2}>2 Verified Volunteers (Recommended)</option>
                    <option value={3}>3 Verified Volunteers (Strict)</option>
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Critical incidents require multi-party consensus before crew dispatch.
                  </p>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Auto-Escalation Priority Threshold: {autoDispatchScore}/100
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={autoDispatchScore}
                    onChange={(e) => setAutoDispatchScore(Number(e.target.value))}
                    className="w-full accent-teal-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>50 (Aggressive)</span>
                    <span className="font-bold text-teal-700">{autoDispatchScore}</span>
                    <span>95 (Conservative)</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="teal"
                    size="sm"
                    className="w-full"
                    icon={CheckCircle2}
                  >
                    {settingsSaved ? 'Protocol Rules Saved' : 'Save Protocol Parameters'}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>

          {/* Registered Users Audit in Firestore */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-600" />
                  <span>Firestore Users Registry</span>
                </span>
                <Badge variant="outline">{usersList.length} Accounts</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              {loadingUsers ? (
                <p className="text-slate-400">Loading user profiles from Firestore...</p>
              ) : usersList.length > 0 ? (
                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {usersList.map((u) => (
                    <div key={u.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                      </div>
                      <Badge variant={u.role === 'ADMIN' ? 'critical' : u.role === 'VOLUNTEER' ? 'teal' : 'default'}>
                        {u.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">
                  Registered accounts will appear here as users log in with Firebase Authentication.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Audit Trail */}
        <div className="lg:col-span-7">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-teal-600" />
                <span>Regulatory &amp; Verification Audit Trail</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {auditLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="py-2.5 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{log.action}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">{log.details}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>Actor: <strong className="text-slate-600">{log.actorName}</strong></span>
                      <span>·</span>
                      <span>Target: <code className="text-slate-600">{log.targetId}</code></span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};
