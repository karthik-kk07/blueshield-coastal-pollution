import React, { useState, useEffect } from 'react';
import { AppRoute } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { useIncidents } from '../context/IncidentContext';
import { subscribeToVerifiedReports } from '../services/reportService';
import { listOrganizations } from '../services/organizationService';
import { ReportDoc, OrganizationDoc } from '../types/firestore';
import { OrganizationManager } from '../components/organization/OrganizationManager';
import { SeverityBadge, StatusBadge } from '../components/ui/StatusBadge';
import { SEVERITY_LEVELS } from './ReportPage';
import {
  Building2,
  Send,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  AlertTriangle,
  Loader2,
  FileCheck2,
  Cpu,
  Layers,
  ChevronRight,
  Search,
  SlidersHorizontal,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Users,
} from 'lucide-react';

interface AssignmentsPageProps {
  onNavigate: (route: AppRoute) => void;
}

export const AssignmentsPage: React.FC<AssignmentsPageProps> = ({ onNavigate }) => {
  const { role, user, isAuthenticated, switchRole, hasRole } = useAuth();
  const { reports: contextReports } = useIncidents();

  const [reports, setReports] = useState<ReportDoc[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationDoc[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active Tab: 'verified' (Ready to Assign) | 'assigned' (Active Dispatches) | 'organizations' (Admin Registry)
  const [activeTab, setActiveTab] = useState<'verified' | 'assigned' | 'organizations'>('verified');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const isAuthorized = role === 'COORDINATOR' || role === 'ADMIN';
  const isAdmin = role === 'ADMIN';

  useEffect(() => {
    if (!isAuthorized) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // 1. Fetch Organizations
    listOrganizations()
      .then((orgs) => setOrganizations(orgs))
      .catch((err) => console.error('Failed to load organizations:', err));

    // 2. Real-time subscription to verified and assigned reports
    const unsubscribe = subscribeToVerifiedReports(
      (repDocs) => {
        setReports(repDocs);
        setIsLoading(false);
      },
      (err) => {
        console.warn('Subscription error, using fallback from context:', err);
        const fallback = contextReports
          .filter((r) => r.status === 'VERIFIED' || r.status === 'ASSIGNED' || r.status === 'field_verified' || r.status === 'action_dispatched')
          .map((r) => ({
            id: r.id,
            reportNumber: r.reportNumber || r.trackingCode,
            reportedBy: r.reportedByName,
            latitude: r.location.latitude,
            longitude: r.location.longitude,
            pollutionType: r.pollutionType || 'Plastic',
            severity: (r.severity.toUpperCase() as any) || 'MODERATE',
            description: r.description,
            photoUrl: r.photoUrl || r.imageUrl,
            status: r.status,
            createdAt: r.reportedAt,
            title: r.title,
            coastalZone: r.location.coastalZoneName,
            assignedOrganization: r.assignedOrganization,
            assignedTo: r.assignedTo,
            assignedAt: r.assignedAt,
          }));
        setReports(fallback);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthorized, contextReports]);

  // Split into verified (ready to assign) vs assigned (dispatched)
  const readyToAssignList = reports.filter(
    (r) => r.status === 'VERIFIED' || r.status === 'field_verified'
  );
  const activeDispatchedList = reports.filter(
    (r) => r.status === 'ASSIGNED' || r.status === 'action_dispatched'
  );

  const currentTabList = activeTab === 'verified' ? readyToAssignList : activeDispatchedList;

  const filteredReports = currentTabList.filter((r) => {
    const matchesSearch =
      r.reportNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.pollutionType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.assignedOrganization && r.assignedOrganization.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.assignedTo && r.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSeverity = severityFilter === 'all' || r.severity?.toUpperCase() === severityFilter.toUpperCase();
    return matchesSearch && matchesSeverity;
  });

  // RESTRICTED ACCESS SCREEN
  if (!isAuthenticated || !isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-rose-200 shadow-md p-6 sm:p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Assignments &amp; Dispatch Console: Restricted Access
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed max-w-md mx-auto">
              Incident assignment and organization routing are restricted to authorized{' '}
              <strong className="text-teal-700">COORDINATOR</strong> and{' '}
              <strong className="text-teal-700">ADMIN</strong> personnel.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-2 max-w-md mx-auto font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Current Role:</span>
              <span className="font-bold text-rose-700">{role || 'GUEST'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Authorized Roles:</span>
              <span className="font-bold text-teal-700">COORDINATOR, ADMIN</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-700 block mb-2">
              Switch role to test the assignments workflow:
            </span>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => switchRole('COORDINATOR')}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Switch to COORDINATOR
              </button>
              <button
                type="button"
                onClick={() => switchRole('ADMIN')}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Switch to ADMIN
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-mono font-semibold uppercase">
            <Cpu className="w-3.5 h-3.5 text-teal-600" />
            <span>Internal Organization Routing System · GVMC Gateway Ready</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Dispatch &amp; Incident Assignments
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Assign verified coastal hazards to municipal sanitation departments, accredited NGOs, and coastal cleanup squads.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onNavigate('/verify')}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer shadow-2xs flex items-center gap-1.5"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-teal-600" />
            <span>Verify Queue</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/dashboard')}
            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer shadow-xs"
          >
            Operations Dashboard
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
              Ready to Assign
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-0.5">
              {readyToAssignList.length}
            </div>
            <span className="text-[10px] text-slate-500">Status: VERIFIED</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
              Active Dispatches
            </span>
            <div className="text-2xl font-black text-blue-700 mt-0.5">
              {activeDispatchedList.length}
            </div>
            <span className="text-[10px] text-slate-500">Status: ASSIGNED</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Send className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
              Response Organizations
            </span>
            <div className="text-2xl font-black text-slate-800 mt-0.5">
              {organizations.filter((o) => o.active).length}
            </div>
            <span className="text-[10px] text-slate-500">Municipal, NGO &amp; Volunteer</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('verified')}
          className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'verified'
              ? 'border-teal-600 text-teal-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Ready to Assign</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-900 font-mono">
            {readyToAssignList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assigned')}
          className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'assigned'
              ? 'border-teal-600 text-teal-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Dispatched Incidents</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-900 font-mono">
            {activeDispatchedList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('organizations')}
          className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'organizations'
              ? 'border-teal-600 text-teal-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Organization Registry {isAdmin ? '(Admin)' : ''}</span>
        </button>
      </div>

      {/* TAB 1 & 2: Reports List (Verified or Assigned) */}
      {activeTab !== 'organizations' && (
        <div className="space-y-4">
          
          {/* Search & Filter Bar */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-2.5 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search report #, organization, team..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="py-1.5 px-2.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-hidden"
              >
                <option value="all">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MODERATE">Moderate</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          {/* Incidents Grid */}
          {isLoading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600 mx-auto" />
              <p className="text-xs text-slate-500">Loading incidents queue...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-xs font-bold text-slate-800">
                {activeTab === 'verified'
                  ? 'No Verified Reports Awaiting Assignment'
                  : 'No Currently Dispatched Reports'}
              </p>
              <p className="text-[11px] text-slate-500">
                {activeTab === 'verified'
                  ? 'Reports verified by coordinators will appear here for organizational routing.'
                  : 'Assigned tickets will display here once routed to cleanup squads.'}
              </p>
              {activeTab === 'verified' && (
                <button
                  type="button"
                  onClick={() => onNavigate('/verify')}
                  className="mt-2 text-xs text-teal-700 font-semibold hover:underline inline-block"
                >
                  Go to Human Verification Queue &rarr;
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReports.map((rep) => {
                const severityConfig = SEVERITY_LEVELS.find(
                  (s) => s.key === rep.severity?.toUpperCase()
                );
                const isAssigned = rep.status === 'ASSIGNED';

                return (
                  <div
                    key={rep.id}
                    className="bg-white rounded-xl border border-slate-200 hover:border-teal-300 shadow-2xs p-4 flex flex-col justify-between gap-3.5 transition-all"
                  >
                    <div className="space-y-3">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-xs font-bold text-slate-900 block">
                            {rep.reportNumber}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-700">
                            {rep.pollutionType}
                          </span>
                        </div>
                        <SeverityBadge severity={rep.severity} size="sm" />
                      </div>

                      {/* Photo Thumbnail */}
                      <div className="w-full h-36 rounded-lg overflow-hidden bg-slate-950 border border-slate-200 relative">
                        {rep.photoUrl ? (
                          <img
                            src={rep.photoUrl}
                            alt="Pollution incident"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-mono">
                            No photo attached
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-white font-mono text-[10px] backdrop-blur-xs flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-teal-400 shrink-0" />
                          <span>{rep.coastalZone || `${rep.latitude.toFixed(4)}°N, ${rep.longitude.toFixed(4)}°E`}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-snug">
                        {rep.description || 'No description provided.'}
                      </p>

                      {/* Assignment details (If assigned) */}
                      {isAssigned && (
                        <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-blue-900 text-[11px]">
                            <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="truncate">{rep.assignedOrganization}</span>
                          </div>
                          {rep.assignedTo && (
                            <div className="flex items-center gap-1.5 text-slate-600 text-[10px] font-mono">
                              <Users className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>Lead: {rep.assignedTo}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Verification badge */}
                      {rep.verifiedBy && !isAssigned && (
                        <div className="text-[11px] text-teal-800 flex items-center gap-1 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>Verified by {rep.verifiedBy}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => onNavigate(`/assignments/${rep.id}` as AppRoute)}
                        className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-98 ${
                          isAssigned
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                            : 'bg-teal-600 hover:bg-teal-700 text-white'
                        }`}
                      >
                        <span>{isAssigned ? 'Manage / Reassign Dispatch' : 'Assign to Organization'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Organization Directory & Admin Management */}
      {activeTab === 'organizations' && (
        <OrganizationManager isAdmin={isAdmin} />
      )}
    </div>
  );
};
