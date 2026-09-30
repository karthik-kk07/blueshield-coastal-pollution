import React, { useState, useEffect } from 'react';
import { AppRoute } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { subscribeToFieldTasks } from '../services/cleanupService';
import { ReportDoc, TaskState } from '../types/firestore';
import { StatusBadge, SeverityBadge } from '../components/ui/StatusBadge';
import { SEVERITY_LEVELS } from './ReportPage';
import {
  CheckCircle2,
  Clock,
  Compass,
  FileCheck2,
  HardHat,
  MapPin,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Truck,
  Users,
  ChevronRight,
  Camera,
  Layers,
  Building2,
  PlayCircle,
  AlertTriangle,
} from 'lucide-react';

interface FieldPageProps {
  onNavigate: (route: AppRoute) => void;
}

export const FieldPage: React.FC<FieldPageProps> = ({ onNavigate }) => {
  const { user, role, switchRole } = useAuth();
  const [tasks, setTasks] = useState<ReportDoc[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in_progress' | 'cleaned'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToFieldTasks(
      (loadedTasks) => {
        setTasks(loadedTasks);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching field tasks:', err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredTasks = tasks.filter((t) => {
    // Tab filter
    if (activeTab === 'pending') {
      if (t.status !== 'ASSIGNED' && t.status !== 'action_dispatched') return false;
    } else if (activeTab === 'in_progress') {
      if (t.status !== 'ACCEPTED' && t.status !== 'IN_PROGRESS') return false;
    } else if (activeTab === 'cleaned') {
      if (t.status !== 'CLEANED' && t.status !== 'VERIFIED_CLOSED') return false;
    }

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchNum = t.reportNumber?.toLowerCase().includes(q);
      const matchType = t.pollutionType?.toLowerCase().includes(q);
      const matchZone = t.coastalZone?.toLowerCase().includes(q);
      const matchOrg = t.assignedOrganization?.toLowerCase().includes(q);
      const matchTeam = t.assignedTo?.toLowerCase().includes(q);
      if (!matchNum && !matchType && !matchZone && !matchOrg && !matchTeam) {
        return false;
      }
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ASSIGNED':
      case 'action_dispatched':
        return {
          label: 'ASSIGNED',
          bg: 'bg-blue-100 text-blue-900 border-blue-200',
          dot: 'bg-blue-600',
        };
      case 'ACCEPTED':
        return {
          label: 'ACCEPTED',
          bg: 'bg-purple-100 text-purple-900 border-purple-200',
          dot: 'bg-purple-600',
        };
      case 'IN_PROGRESS':
        return {
          label: 'IN PROGRESS',
          bg: 'bg-amber-100 text-amber-900 border-amber-200',
          dot: 'bg-amber-600 animate-pulse',
        };
      case 'CLEANED':
        return {
          label: 'CLEANED (AWAITING VERIFICATION)',
          bg: 'bg-teal-100 text-teal-900 border-teal-200 font-bold',
          dot: 'bg-teal-600',
        };
      case 'VERIFIED_CLOSED':
        return {
          label: 'VERIFIED & CLOSED',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
          dot: 'bg-emerald-600',
        };
      default:
        return {
          label: status,
          bg: 'bg-slate-100 text-slate-800 border-slate-200',
          dot: 'bg-slate-500',
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-4">
      {/* Mobile-First Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <HardHat className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                Field Worker &amp; Volunteer Response Portal
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Assigned Coastal Cleanup Tasks
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
              Accept dispatches, initiate intertidal remediation, upload photographic evidence, and submit waste metrics directly from the field.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-2 px-3 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300">
                {tasks.length} Total Task{tasks.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>

        {/* Current user badge & role switcher reminder */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span>Operating as:</span>
            <strong className="text-white font-mono">{user?.displayName || user?.name || 'Field Officer'}</strong>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-900/60 text-teal-300 border border-teal-700/60 font-semibold">
              {role}
            </span>
          </div>

          {role !== 'CLEANUP_TEAM' && role !== 'VOLUNTEER' && (
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-slate-500">Quick Test:</span>
              <button
                type="button"
                onClick={() => switchRole('CLEANUP_TEAM')}
                className="text-amber-400 hover:underline font-semibold cursor-pointer"
              >
                Cleanup Team Role
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={() => switchRole('VOLUNTEER')}
                className="text-teal-400 hover:underline font-semibold cursor-pointer"
              >
                Volunteer Role
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search tasks by report #, beach zone, pollution type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-600 bg-slate-50/50"
          />
        </div>

        {/* Mobile Horizontal Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-2 rounded-lg whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>All Tasks</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 text-white font-mono">
              {tasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-2 rounded-lg whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            <span>Assigned</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-200 text-blue-900 font-mono">
              {tasks.filter((t) => t.status === 'ASSIGNED' || t.status === 'action_dispatched').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('in_progress')}
            className={`px-3 py-2 rounded-lg whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'in_progress'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <span>Accepted / In Progress</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900 font-mono">
              {tasks.filter((t) => t.status === 'ACCEPTED' || t.status === 'IN_PROGRESS').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cleaned')}
            className={`px-3 py-2 rounded-lg whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'cleaned'
                ? 'bg-teal-600 text-white'
                : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
            }`}
          >
            <span>Cleaned / Closed</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-200 text-teal-900 font-mono">
              {tasks.filter((t) => t.status === 'CLEANED' || t.status === 'VERIFIED_CLOSED').length}
            </span>
          </button>
        </div>
      </div>

      {/* Task List Cards (Extremely Mobile-Friendly) */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Synchronizing field tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Tasks in This Category</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === 'all'
              ? 'No cleanup tasks are currently dispatched to teams in Visakhapatnam.'
              : 'There are currently no tasks matching the selected filter state.'}
          </p>
          <button
            type="button"
            onClick={() => onNavigate('/assignments')}
            className="mt-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Building2 className="w-4 h-4" />
            <span>View Dispatch Queue &rarr;</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const statusConfig = getStatusBadge(task.status);
            const sevConfig = SEVERITY_LEVELS.find((s) => s.key === task.severity?.toUpperCase());

            return (
              <div
                key={task.id}
                onClick={() => onNavigate(`/assignments/${task.id}` as AppRoute)}
                className="bg-white rounded-2xl border border-slate-200 hover:border-teal-400 p-4 sm:p-5 shadow-2xs transition-all cursor-pointer group active:scale-[0.99] space-y-3"
              >
                {/* Top Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-slate-900">
                        {task.reportNumber}
                      </span>
                      <StatusBadge status={task.status} size="sm" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1 group-hover:text-teal-700 transition-colors">
                      {task.pollutionType} Marine Hazard
                    </h3>
                  </div>

                  <SeverityBadge severity={task.severity} size="sm" />
                </div>

                {/* Evidence Thumbnail & Details Row */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  {/* Photo thumbnail */}
                  <div className="sm:col-span-4 h-32 rounded-xl overflow-hidden bg-slate-950 border border-slate-200 relative">
                    {task.photoUrl ? (
                      <img
                        src={task.photoUrl}
                        alt="Pollution report"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-mono">
                        No photo attached
                      </div>
                    )}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-white font-mono text-[9px] backdrop-blur-xs">
                      BEFORE PHOTO
                    </div>
                  </div>

                  {/* Details column */}
                  <div className="sm:col-span-8 space-y-2 text-xs text-slate-600">
                    <p className="line-clamp-2 leading-relaxed">
                      {task.description || 'No detailed citizen description provided.'}
                    </p>

                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span className="truncate">
                        {task.coastalZone || `${task.latitude.toFixed(4)}°N, ${task.longitude.toFixed(4)}°E`}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 font-mono text-[11px] pt-1">
                      {task.assignedOrganization && (
                        <div className="flex items-center gap-1 text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{task.assignedOrganization}</span>
                        </div>
                      )}
                      {task.assignedTo && (
                        <div className="flex items-center gap-1 text-slate-700">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>Lead: {task.assignedTo}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Tap to open full mobile task console
                  </span>

                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-teal-600 group-hover:bg-teal-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Open Task Screen</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
