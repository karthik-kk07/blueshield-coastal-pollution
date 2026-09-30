import React, { useState } from 'react';
import { AppRoute } from '../types/navigation';
import { useIncidents } from '../context/IncidentContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { BlueShieldLogo } from '../components/ui/BlueShieldLogo';
import { Modal } from '../components/ui/Modal';
import {
  AlertTriangle,
  Compass,
  Play,
  CheckCircle2,
  ArrowRight,
  ArrowDown,
  Search,
  Waves,
  ShieldCheck,
  FileCheck2,
  Flame,
  GitFork,
  BarChart3,
  Bot,
  Building2,
  Trash2,
  Users,
  MapPin,
  TrendingUp,
  FileText,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (route: AppRoute) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { reports, metrics, verifyReport } = useIncidents();
  const [searchTrackingCode, setSearchTrackingCode] = useState('');
  const [searchedReport, setSearchedReport] = useState<typeof reports[0] | null>(null);
  const [searchSearched, setSearchSearched] = useState(false);

  // Interactive Verification Simulator Modal
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simStep, setSimStep] = useState<1 | 2 | 3>(1);
  const [simSieveVolume, setSimSieveVolume] = useState(1.8);
  const [simNotes, setSimNotes] = useState('Confirmed monofilament mesh entangled around tetrapods at Vizag outer harbour. No live turtle entangled; GPS within 15m of beach line.');
  const [simVerifiedSuccess, setSimVerifiedSuccess] = useState(false);

  // Active workflow step inspection state
  const [activeWorkflowIndex, setActiveWorkflowIndex] = useState<number>(0);

  const handleSearchCode = (code: string) => {
    setSearchTrackingCode(code);
    setSearchSearched(true);
    const found = reports.find(
      (r) => r.trackingCode.toLowerCase() === code.trim().toLowerCase()
    );
    setSearchedReport(found || null);
  };

  const handleSimulateVerify = () => {
    const target = reports.find((r) => r.status === 'pending_verification') || reports[0];
    if (target) {
      verifyReport(
        target.id,
        simNotes,
        true,
        simSieveVolume,
        'Dr. Ananya Sharma',
        'verified_volunteer'
      );
    }
    setSimVerifiedSuccess(true);
    setTimeout(() => {
      setSimVerifiedSuccess(false);
      setIsSimulatorOpen(false);
      setSimStep(1);
    }, 1800);
  };

  // 7 Core Workflow Stages
  const workflowStages = [
    {
      step: '01',
      title: 'REPORT',
      subtitle: 'Citizen & Sensor Ingestion',
      desc: 'Coastal visitors, fishermen, or surveillance patrols capture geotagged photos and select hazard categories on the shoreline.',
      color: 'border-teal-500 bg-teal-500/10 text-teal-300',
    },
    {
      step: '02',
      title: 'VERIFY',
      subtitle: 'Accredited Ground Truth',
      desc: 'Certified local volunteers and marine inspectors physically visit the site to validate GPS coordinates, hazard severity, and volume.',
      color: 'border-cyan-500 bg-cyan-500/10 text-cyan-300',
    },
    {
      step: '03',
      title: 'ASSIGN',
      subtitle: 'Jurisdictional Routing',
      desc: 'Platform automatically routes verified tickets to designated authorities: GVMC sanitation, Visakhapatnam Port, or Coast Guard DHQ-6.',
      color: 'border-blue-500 bg-blue-500/10 text-blue-300',
    },
    {
      step: '04',
      title: 'CLEAN',
      subtitle: 'Field Operations',
      desc: 'Specialized coastal sanitation crews and mechanized beach cleaners deploy to extract debris before tidal dispersion.',
      color: 'border-emerald-500 bg-emerald-500/10 text-emerald-300',
    },
    {
      step: '05',
      title: 'MEASURE',
      subtitle: 'Evidence & Metrics',
      desc: 'Before/after photographic evidence, weighed dry tonnage, and volumetric estimates (m³) are recorded for immutable closure audit.',
      color: 'border-amber-500 bg-amber-500/10 text-amber-300',
    },
    {
      step: '06',
      title: 'LEARN',
      subtitle: 'Data Intelligence',
      desc: 'Incident data clusters into longitudinal databases, identifying chronic vector pathways, seasonal surges, and repeat dumping spots.',
      color: 'border-indigo-500 bg-indigo-500/10 text-indigo-300',
    },
    {
      step: '07',
      title: 'PREVENT',
      subtitle: 'Source Mitigation',
      desc: 'Empowers municipal authorities to install storm-drain trash booms, tighten port regulations, and address the source before pollution reoccurs.',
      color: 'border-rose-500 bg-rose-500/10 text-rose-300',
    },
  ];

  // Six How It Works Steps
  const howItWorksSteps = [
    {
      number: '1',
      title: 'Report Pollution',
      role: 'Civic Beachgoers, Fishermen & Coastal Observers',
      summary: 'Capture photo evidence, automated GPS location, and preliminary hazard classification (plastic debris, ghost nets, chemical sheen, or sewage runoff).',
      detail: 'Reports generate a tamper-evident tracking code, allowing any citizen to monitor operational progress in real time.',
      icon: AlertTriangle,
      tag: 'Step 1: Input',
    },
    {
      number: '2',
      title: 'Human Verification',
      role: 'Accredited Coastal Volunteers & Marine Biologists',
      summary: 'Eliminate false alarms through an on-site physical inspection protocol within 4 hours of report ingestion.',
      detail: 'Inspectors perform GPS geofence validation, check tide tables, and conduct standardized sieve volume sampling (m³).',
      icon: ShieldCheck,
      tag: 'Step 2: Ground Truth',
    },
    {
      number: '3',
      title: 'Assignment',
      role: 'Municipal & Port Coordination Engine',
      summary: 'Direct jurisdictional dispatch based on incident location and waste characteristics.',
      detail: 'Intertidal municipal sands route to GVMC Sanitation; docks and shipping channels route to Visakhapatnam Port Authority; deep offshore hazards alert Coast Guard DHQ-6.',
      icon: Building2,
      tag: 'Step 3: Routing',
    },
    {
      number: '4',
      title: 'Cleanup',
      role: 'Sanitation Teams, Contractors & Beach Brigades',
      summary: 'Rapid containment and field remediation to prevent outgoing tides from carrying shoreline waste into pelagic waters.',
      detail: 'Field teams log dispatch acknowledgments and mobilize dedicated extraction equipment tailored to the contamination type.',
      icon: Trash2,
      tag: 'Step 4: Action',
    },
    {
      number: '5',
      title: 'Closure Evidence',
      role: 'Field Supervisors & Quality Auditors',
      summary: 'No ticket closes on verbal assertion. Verified audit requires before-and-after photographic documentation.',
      detail: 'Records physical disposal receipts, verified dry weight/volume metrics, and final sign-off by accredited inspectors.',
      icon: FileCheck2,
      tag: 'Step 5: Audit',
    },
    {
      number: '6',
      title: 'Data-Informed Prevention',
      role: 'Urban Planners, APPCB & Coastal Regulators',
      summary: 'Transform completed remediation records into long-term infrastructure and policy interventions.',
      detail: 'Identifies chronic nala discharge points, triggers trash-boom deployments, and informs municipal zoning along the coastline.',
      icon: TrendingUp,
      tag: 'Step 6: Closed-Loop',
    },
  ];

  // Coastal Entry Points
  const coastalEntryPoints = [
    {
      name: 'Open Drains (Nalas)',
      example: 'Meghadrigedda Channel & Town Hall Outfall',
      desc: 'Uncovered municipal drainage channels that convey urban stormwater and municipal runoff directly into intertidal zones during rainfall.',
      action: 'Track discharge frequency, map seasonal surges, and alert municipal engineers for catchment mesh installation.',
      icon: GitFork,
    },
    {
      name: 'Stormwater Outlets',
      example: 'Yendada & Lawson’s Bay Culverts',
      desc: 'Piped coastal storm infrastructure that discharges road runoff, street-level single-use plastics, and sediment directly onto public beach sands.',
      action: 'Coordinate barrier maintenance and dispatch rapid sanitation sweeps immediately following storm outflow events.',
      icon: Waves,
    },
    {
      name: 'Canals & Waterways',
      example: 'Old Port Tidal Inlets & Mudasarlova Overflow',
      desc: 'Tidal channels and inland drainage canals that accumulate slow-moving floating litter, oils, and organic waste heading towards the harbor mouth.',
      action: 'Log accumulation choke-points and coordinate floating barrier deployment with port marine authorities.',
      icon: Compass,
    },
    {
      name: 'Dumping Points',
      example: 'Tetrapod Groynes & Isolated Headlands',
      desc: 'Rocky riprap, isolated coastal roads, and fishing wharf edges where nocturnal commercial dumping or tourist littering chronically accumulates.',
      action: 'Target enforcement patrols, install civic warning signage, and monitor repeat contamination cycles.',
      icon: Trash2,
    },
    {
      name: 'Other Shoreline Pathways',
      example: 'Trawler Basin Outfalls & Tourism Corridors',
      desc: 'Fish landing slipways, tourist promenade margins, and boat repair berths where washouts and discarded gear enter the Bay of Bengal.',
      action: 'Engage local fishing cooperatives and tourism vendors in verified stewardship agreements.',
      icon: MapPin,
    },
  ];

  // Data Intelligence Patterns
  const intelligenceInsights = [
    {
      title: 'Recurring Hotspots',
      desc: 'Spatial cluster algorithms map locations with repeat incident filings, pinpointing chronically stressed shoreline sectors like the Fishing Harbour breakwater and RK Beach promenade.',
      icon: Flame,
    },
    {
      title: 'Pollution Categories',
      desc: 'Granular classification distinguishes ghost fishing nets, petrochemical slicks, and commercial packaging, directing appropriate municipal disposal rather than generic landfill dumping.',
      icon: BarChart3,
    },
    {
      title: 'Temporal Patterns',
      desc: 'Correlation analysis tracks seasonal drift during the Southwest Monsoon, spring high tides, weekend tourist surges, and annual fishing ban periods.',
      icon: RotateCcw,
    },
    {
      title: 'Cleanup Activity',
      desc: 'Audits municipal response velocity, tracking the duration between report filing, human volunteer verification, team dispatch, and final evidentiary ticket closure.',
      icon: FileText,
    },
    {
      title: 'Recurring Problem Areas',
      desc: 'Identifies systemic drain choke points and illegal dumping corridors, providing evidence for physical containment booms and regulatory APPCB intervention.',
      icon: GitFork,
    },
  ];

  // Future AI Roadmap Phases
  const futureAiPhases = [
    {
      phase: 'Phase 1',
      title: 'Human Verification',
      status: 'Current MVP',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      desc: 'Ground-truth inspection powered 100% by accredited community volunteers, marine researchers, and civic inspectors. No AI required for core platform MVP.',
    },
    {
      phase: 'Phase 2',
      title: 'Historical Data Intelligence',
      status: 'In Progress',
      badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      desc: 'Longitudinal statistical modeling of verified remediation logs to expose seasonal surges, recurring drainage outfall patterns, and municipal response bottlenecks.',
    },
    {
      phase: 'Phase 3',
      title: 'AI-Assisted Litter Classification',
      status: 'Future Planned',
      badgeClass: 'bg-slate-700/60 text-slate-300 border-slate-600',
      desc: 'Computer-vision assistance to pre-screen citizen photos, automatically categorizing polymer types, hazardous materials, and estimating sieve volume bounds.',
    },
    {
      phase: 'Phase 4',
      title: 'Predictive Hotspot Detection',
      status: 'Future Planned',
      badgeClass: 'bg-slate-700/60 text-slate-300 border-slate-600',
      desc: 'Integration of tidal drift models, meteorological forecasts, and historical drainage telemetry to predict shoreline debris landfall 24 hours in advance.',
    },
  ];

  return (
    <div className="space-y-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden rounded-2xl bg-linear-to-b from-[#05192D] via-[#0B2545] to-[#0A192F] text-white p-6 sm:p-10 lg:p-14 border border-slate-700 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-6">
          
          {/* Logo & Headline */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <BlueShieldLogo size="xl" theme="dark" showWordmark={false} />
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                Blue<span className="text-[#00A3E0]">Shield</span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl font-semibold text-teal-300 mt-1">
                Human-Verified Coastal Pollution Response &amp; Prevention Platform
              </p>
            </div>
          </div>

          {/* Official Tagline Quote */}
          <div className="border-l-4 border-teal-400 pl-4 py-1">
            <blockquote className="text-lg sm:text-xl font-medium text-slate-100 italic tracking-wide">
              &ldquo;Protecting our coastline through people, data and action.&rdquo;
            </blockquote>
          </div>

          <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
            A closed-loop operational network connecting citizen reports with accredited ground-truth volunteer verification,
            municipal dispatch across Visakhapatnam and the Bay of Bengal, evidentiary closure, and root-cause prevention.
          </p>

          {/* Primary & Secondary Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            {/* Primary Button */}
            <button
              onClick={() => onNavigate('/report')}
              className="inline-flex items-center justify-center font-bold text-sm px-6 py-3.5 gap-2.5 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-950 shadow-lg hover:shadow-teal-400/25 transition-all select-none cursor-pointer tracking-wider uppercase"
            >
              <AlertTriangle className="w-4 h-4 text-slate-950 shrink-0" />
              <span>REPORT POLLUTION</span>
            </button>

            {/* Secondary Button */}
            <button
              onClick={() => onNavigate('/map')}
              className="inline-flex items-center justify-center font-bold text-sm px-6 py-3.5 gap-2.5 rounded-lg bg-[#0F3460] hover:bg-[#134074] text-white border-2 border-teal-400 hover:border-teal-300 shadow-md hover:shadow-teal-400/20 transition-all select-none cursor-pointer tracking-wider uppercase"
            >
              <Compass className="w-4 h-4 text-teal-300 shrink-0" />
              <span>EXPLORE COASTAL DATA</span>
            </button>

            {/* Interactive Volunteer Simulator Modal Trigger */}
            <button
              onClick={() => setIsSimulatorOpen(true)}
              className="inline-flex items-center justify-center font-medium text-xs px-4 py-3 gap-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-600 hover:border-slate-500 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-teal-400" />
              <span>Simulate Verification Protocol</span>
            </button>
          </div>
        </div>

        {/* Quiet technical jurisdiction badge */}
        <div className="mt-10 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">Active Visakhapatnam Coastal Verification Grid · Bay of Bengal</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            Closed-Loop Protocol: GVMC · APPCB · Visakhapatnam Port Authority · ICG DHQ-6
          </span>
        </div>
      </section>

      {/* 2. CORE WORKFLOW SECTION */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 lg:p-10 shadow-xs">
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-semibold uppercase tracking-wider mb-2">
            Closed-Loop Operational Architecture
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            The BlueShield Closed-Loop Workflow
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Every coastal incident progresses through a verified, seven-stage accountability lifecycle.
            No incident ends with cleanup alone—every verified record feeds prevention.
          </p>
        </div>

        {/* Visual Workflow Pipeline (Visually Prominent) */}
        <div className="bg-[#081B33] rounded-xl p-5 sm:p-7 border border-slate-700 text-white shadow-inner">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2 font-mono text-xs text-teal-300">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              <span>7-STAGE VERIFICATION &amp; PREVENTION PIPELINE</span>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Click any stage to view protocol
            </span>
          </div>

          {/* Workflow Chain Nodes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
            {workflowStages.map((stage, idx) => {
              const isSelected = activeWorkflowIndex === idx;
              return (
                <div
                  key={stage.title}
                  onClick={() => setActiveWorkflowIndex(idx)}
                  className={`group relative flex flex-col justify-between p-3.5 rounded-lg border transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-teal-950/80 border-teal-400 shadow-md ring-1 ring-teal-400'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1.5">
                      <span>{stage.step}</span>
                      {idx < workflowStages.length - 1 && (
                        <span className="text-teal-400 font-bold hidden lg:inline">→</span>
                      )}
                      {idx < workflowStages.length - 1 && (
                        <span className="text-teal-400 font-bold lg:hidden">↓</span>
                      )}
                    </div>
                    <h3 className="text-sm font-black tracking-wide text-white group-hover:text-teal-300 transition-colors">
                      {stage.title}
                    </h3>
                    <p className="text-[11px] font-medium text-teal-300 mt-0.5 line-clamp-1">
                      {stage.subtitle}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Stage {idx + 1}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-teal-400' : 'bg-slate-600'}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Stage Detail Banner */}
          <div className="mt-5 p-4 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <span className="font-mono text-teal-400 font-semibold uppercase tracking-wider">
                Stage {workflowStages[activeWorkflowIndex].step}: {workflowStages[activeWorkflowIndex].title} — {workflowStages[activeWorkflowIndex].subtitle}
              </span>
              <p className="text-slate-300 leading-relaxed max-w-3xl">
                {workflowStages[activeWorkflowIndex].desc}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigate(activeWorkflowIndex === 0 ? '/report' : activeWorkflowIndex === 1 ? '/verify' : '/dashboard')}
              className="text-white border-slate-700 hover:bg-slate-800 shrink-0"
            >
              Open Stage Portal →
            </Button>
          </div>
        </div>
      </section>

      {/* 3. PROBLEM SECTION */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 lg:p-10 shadow-xs">
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono font-semibold uppercase tracking-wider mb-2">
            The Structural Challenge
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Coastal Pollution Is Not Only a Cleanup Problem
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Organizing periodic beach cleanups removes surface litter for a few days, but the tide inexorably returns new debris.
            Without an integrated, data-informed system that connects civic reporting to source prevention, coastal communities remain trapped in a reactive cycle.
          </p>
        </div>

        {/* The 7 System Requirements Cards (Strictly No Invented Statistics) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h3 className="text-base font-bold text-slate-900">Identify Pollution</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Capture timely, geo-referenced hazard reports directly at shoreline level before high tides wash contaminants into open waters.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h3 className="text-base font-bold text-slate-900">Verify Reports</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dispatch certified local volunteers to confirm GPS precision, eliminate duplicates, and validate contaminant volume through on-site audits.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h3 className="text-base font-bold text-slate-900">Route to Responsible Organizations</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automate handoffs between municipal sanitation (GVMC), port authorities, and maritime enforcement based on statutory jurisdiction.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              04
            </div>
            <h3 className="text-base font-bold text-slate-900">Track Cleanup Operations</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Provide transparent status visibility from incident acknowledgement through team mobilization to physical containment.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
              05
            </div>
            <h3 className="text-base font-bold text-slate-900">Record Closure Evidence</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mandate before/after photographic proof, weighed dry tonnage, and disposal receipts before an operational ticket can be closed.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-sm">
              06
            </div>
            <h3 className="text-base font-bold text-slate-900">Learn from Repeated Pollution</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Aggregate remediation histories to uncover repeat offenders, chronic drain outfalls, and seasonal marine debris trajectories.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-teal-50 border border-teal-300 md:col-span-2 lg:col-span-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
                07
              </div>
              <h3 className="text-base font-bold text-teal-950">Support Long-Term Prevention</h3>
            </div>
            <p className="text-xs text-teal-900 leading-relaxed">
              Deliver hard evidentiary records to environmental protection boards (APPCB) and municipal engineers, enabling structural catchment booms, improved storm-drain grills, and targeted regulatory enforcement at source.
            </p>
          </div>
        </div>
      </section>

      {/* 4. HOW BLUESHIELD WORKS (Six Steps) */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 lg:p-10 shadow-xs">
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-semibold uppercase tracking-wider mb-2">
            System Architecture
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            How BlueShield Works
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            A step-by-step accountability framework designed to coordinate citizens, volunteer inspectors, municipal bodies, and regulatory agencies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {howItWorksSteps.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.number} className="flex flex-col justify-between border-slate-200 hover:border-teal-400 transition-all shadow-xs">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-900">
                      {step.tag}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                      #{step.number}
                    </div>
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>{step.title}</span>
                  </CardTitle>
                  <p className="text-[11px] font-semibold text-teal-700 font-mono mt-1">
                    Actor: {step.role}
                  </p>
                </CardHeader>
                <CardContent className="text-xs text-slate-600 space-y-2 pt-0">
                  <p className="leading-relaxed">{step.summary}</p>
                  <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 leading-normal">
                    {step.detail}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 5. COASTAL ENTRY POINTS (Reporting & Coordination Feature) */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 lg:p-10 shadow-xs">
        <div className="max-w-3xl mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-900 text-xs font-mono font-semibold uppercase tracking-wider mb-2">
            Inlet Vector Surveillance
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Coastal Entry Points
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Most shoreline contamination originates inland. BlueShield monitors the critical conduits through which land-based debris and effluents reach the marine shoreline.
          </p>
        </div>

        {/* Clear Disclaimer Banner */}
        <div className="mb-8 p-4 rounded-xl bg-slate-50 border-l-4 border-teal-500 flex items-start gap-3 text-xs text-slate-700">
          <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Reporting &amp; Coordination Feature:</strong> BlueShield coordinates hazard reporting, verified surveillance, and dispatch between citizens and authorities.
            <em> BlueShield does not physically treat wastewater;</em> rather, it pinpoints contamination vectors to ensure responsible municipal utilities (GVMC &amp; APPCB) execute interceptor and filtration maintenance.
          </p>
        </div>

        {/* Entry Points Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {coastalEntryPoints.map((ep) => {
            const Icon = ep.icon;
            return (
              <div key={ep.name} className="p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-teal-100 text-teal-800">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{ep.name}</h3>
                    <span className="text-[10px] font-mono text-teal-700 block">Ex: {ep.example}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {ep.desc}
                </p>
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                  <strong className="text-slate-700">BlueShield Coordination:</strong> {ep.action}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-500 font-mono">
            Monitored shoreline conduits: Meghadrigedda Channel, Lawson’s Bay Culvert, Town Hall Nala
          </span>
          <Button
            size="sm"
            variant="teal"
            icon={Compass}
            onClick={() => onNavigate('/map')}
          >
            Inspect Outfalls on Coastal Map
          </Button>
        </div>
      </section>

      {/* 6. DATA INTELLIGENCE SECTION */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 lg:p-10 shadow-xs">
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-mono font-semibold uppercase tracking-wider mb-2">
            Longitudinal Analytics
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Data Intelligence
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Every verified incident and evidentiary closure strengthens our longitudinal database.
            Historical cleanup records reveal structural patterns that individual cleanups cannot expose:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {intelligenceInsights.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-800">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Live Operational Metrics Snapshot (From IncidentContext) */}
        <div className="mt-8 p-5 rounded-xl bg-[#0B2545] text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-400" />
                <span>Visakhapatnam Active Intelligence Registry</span>
              </h4>
              <p className="text-[11px] text-slate-300">Live operational ledger synced across Bay of Bengal coastal sectors</p>
            </div>
            <span className="text-[11px] font-mono text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-500/40">
              Live State
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block">Verified Incidents</span>
              <span className="text-2xl font-bold font-mono text-white">{metrics.verifiedCount}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Pending Verification</span>
              <span className="text-2xl font-bold font-mono text-amber-300">{metrics.pendingCount}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Active Hotspot Zones</span>
              <span className="text-2xl font-bold font-mono text-rose-300">{metrics.activeHotspotsCount}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Monitored Conduits</span>
              <span className="text-2xl font-bold font-mono text-teal-300">{metrics.monitoredEntryPointsCount}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FUTURE AI ASSISTANCE ROADMAP */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 lg:p-10 shadow-xs">
        <div className="max-w-3xl mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-50 border border-purple-200 text-purple-900 text-xs font-mono font-semibold uppercase tracking-wider mb-2">
            Technological Evolution
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Future AI Assistance
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Our multi-phase roadmap progressively incorporates machine intelligence to support, rather than replace, human field inspectors.
          </p>
        </div>

        {/* Clear MVP Scope Callout */}
        <div className="mb-6 p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>MVP Scope Clarification:</strong> AI is <em>not</em> required for the MVP. Current operations rely 100% on human ground truth, verified inspector protocol, and municipal handoffs. Future AI models will assist with automated sorting and drift modeling only after extensive training on verified datasets.
          </p>
        </div>

        {/* Four Phases Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {futureAiPhases.map((phase) => (
            <div
              key={phase.phase}
              className={`p-5 rounded-xl border flex flex-col justify-between space-y-3 ${
                phase.status === 'Current MVP'
                  ? 'bg-teal-50/50 border-teal-300 shadow-xs'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-slate-900">{phase.phase}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${phase.badgeClass}`}>
                    {phase.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{phase.title}</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-200/60">
                {phase.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. INTERACTIVE INCIDENT TRACKER */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="max-w-2xl">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-4 h-4 text-teal-600" />
            <span>Track Live Incident Verification &amp; Remediation Status</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Search any incident tracking code to view multi-party inspector verifications and municipal remediation milestones.
          </p>

          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <span className="text-[11px] text-slate-400 font-medium">Sample Codes:</span>
            {['BS-2026-VZ01', 'BS-2026-VZ02', 'BS-2026-VZ03', 'BS-2026-VZ04'].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => handleSearchCode(code)}
                className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-100 hover:bg-teal-50 hover:text-teal-800 border border-slate-300 text-slate-700 transition-colors cursor-pointer"
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSearchCode(searchTrackingCode); }} className="mt-4 flex flex-col sm:flex-row gap-2 max-w-xl">
          <input
            type="text"
            placeholder="e.g. BS-2026-VZ01"
            value={searchTrackingCode}
            onChange={(e) => setSearchTrackingCode(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-[#0B2545] font-mono"
            required
          />
          <Button type="submit" variant="primary" size="md" icon={Search}>
            Lookup Tracking
          </Button>
        </form>

        {searchSearched && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            {searchedReport ? (
              <div className="p-4 rounded-lg bg-teal-50/60 border border-teal-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-teal-900">{searchedReport.trackingCode}</span>
                  <Badge variant={searchedReport.status === 'remediated' ? 'success' : searchedReport.status === 'field_verified' ? 'teal' : 'warning'}>
                    {searchedReport.status.replace('_', ' ')}
                  </Badge>
                </div>
                <h4 className="font-bold text-slate-900">{searchedReport.title}</h4>
                <p className="text-slate-600">{searchedReport.description}</p>
                <div className="pt-2 border-t border-teal-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>📍 {searchedReport.location.coastalZoneName}</span>
                  <span className="font-mono text-teal-800">Source: {searchedReport.entryPointSource || 'Shoreline Intertidal'}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-rose-600">
                No record found matching code &ldquo;{searchTrackingCode}&rdquo;. Please verify your tracking ID.
              </p>
            )}
          </div>
        )}
      </section>

      {/* 9. FOOTER (Polished & Fully Responsive) */}
      <footer className="mt-16 pt-12 pb-10 border-t border-slate-200 bg-white -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <BlueShieldLogo size="md" theme="light" subtext="Visakhapatnam Marine Platform" />
            <p className="text-sm font-semibold text-slate-900 mt-1">
              BlueShield
            </p>
            <p className="text-xs text-slate-600 leading-relaxed max-w-md">
              Human-verified coastal pollution response and prevention.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 font-mono pt-1">
              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">APPCB Protocol</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">GVMC Coordination</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">ICG DHQ-6 Aligned</span>
            </div>
          </div>

          <div>
            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Platform Actions
            </h5>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <button onClick={() => onNavigate('/report')} className="hover:text-teal-600 transition-colors font-medium">
                  Report Shoreline Pollution
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/map')} className="hover:text-teal-600 transition-colors">
                  Coastal Map (Visakhapatnam)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/dashboard')} className="hover:text-teal-600 transition-colors">
                  Operations &amp; Triage Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/hotspots')} className="hover:text-teal-600 transition-colors">
                  Shoreline Hotspot Zones
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/prevention')} className="hover:text-teal-600 transition-colors font-medium text-amber-700">
                  Prevention Framework
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/entry-points')} className="hover:text-teal-600 transition-colors">
                  Coastal Entry Points
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Institutional Partners
            </h5>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>Visakhapatnam Port Authority (VPA)</li>
              <li>Greater Visakhapatnam Municipal Corp (GVMC)</li>
              <li>Andhra Pradesh Pollution Control Board (APPCB)</li>
              <li>Central Marine Fisheries Research Institute (CMFRI)</li>
              <li>Indian Coast Guard District HQ-6</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <span>&copy; {new Date().getFullYear()} BlueShield. Human-verified coastal pollution response and prevention.</span>
          <span className="font-mono">Visakhapatnam Shoreline Protocol · Bay of Bengal</span>
        </div>
      </footer>

      {/* Interactive Ground-Truth Verification Simulator Modal */}
      <Modal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        title="Simulate Volunteer Ground-Truth Inspection"
        description="Experience how an accredited coastal inspector verifies an incident along the Visakhapatnam shoreline."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (simStep > 1) setSimStep((prev) => (prev - 1) as 1 | 2);
                else setIsSimulatorOpen(false);
              }}
            >
              {simStep === 1 ? 'Cancel' : '← Previous Step'}
            </Button>
            {simStep < 3 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSimStep((prev) => (prev + 1) as 2 | 3)}
              >
                Next Step →
              </Button>
            ) : (
              <Button
                variant="teal"
                size="sm"
                icon={CheckCircle2}
                onClick={handleSimulateVerify}
              >
                Sign Off &amp; Confirm Ground Truth
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {simVerifiedSuccess ? (
            <div className="p-6 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-teal-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">Ground-Truth Verified!</h4>
              <p className="text-slate-600">
                Incident status updated to <strong>FIELD_VERIFIED</strong>. Dispatched to GVMC Coastal Sanitation crew.
              </p>
            </div>
          ) : (
            <>
              {/* Stepper Header */}
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                <span className={`font-semibold ${simStep === 1 ? 'text-teal-700' : 'text-slate-500'}`}>
                  1. Geofence &amp; Tide Check
                </span>
                <span className="text-slate-300">→</span>
                <span className={`font-semibold ${simStep === 2 ? 'text-teal-700' : 'text-slate-500'}`}>
                  2. Sieve Sampling
                </span>
                <span className="text-slate-300">→</span>
                <span className={`font-semibold ${simStep === 3 ? 'text-teal-700' : 'text-slate-500'}`}>
                  3. Field Sign-off
                </span>
              </div>

              {simStep === 1 && (
                <div className="space-y-3">
                  <div className="p-3 rounded bg-teal-50 border border-teal-200 text-teal-950">
                    <span className="font-semibold block mb-1">GPS Validation (Visakhapatnam Shoreline)</span>
                    <p className="leading-relaxed">
                      Coordinates: <code>17.6982&deg; N, 83.3045&deg; E</code> (Fishing Harbour Breakwater).
                      Geofence match verified within 12 meters of the intertidal high-water line.
                    </p>
                  </div>
                  <div className="p-3 rounded bg-slate-50 border border-slate-200">
                    <span className="font-semibold text-slate-800 block mb-1">Tidal State Verification</span>
                    <p className="text-slate-600">
                      Tide Table sync: Slack Ebb Tide (+0.35m). Debris is stranded above the surf line and accessible for safe manual retrieval.
                    </p>
                  </div>
                </div>
              )}

              {simStep === 2 && (
                <div className="space-y-3">
                  <label className="block font-semibold text-slate-800">
                    Volumetric Sieve / Debris Core Estimate (m&sup3;):
                  </label>
                  <input
                    type="range"
                    min="0.2"
                    max="5.0"
                    step="0.1"
                    value={simSieveVolume}
                    onChange={(e) => setSimSieveVolume(Number(e.target.value))}
                    className="w-full accent-teal-600"
                  />
                  <div className="flex justify-between font-mono text-slate-600">
                    <span>0.2 m&sup3; (Light)</span>
                    <span className="font-bold text-teal-800">{simSieveVolume} m&sup3;</span>
                    <span>5.0 m&sup3; (Massive)</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Estimated equivalent weight: ~{(simSieveVolume * 450).toFixed(0)} kg of wet synthetic gear and sediment.
                  </p>
                </div>
              )}

              {simStep === 3 && (
                <div className="space-y-3">
                  <label className="block font-semibold text-slate-800">
                    Field Inspector Notes (Dr. Ananya Sharma, CMFRI):
                  </label>
                  <textarea
                    rows={3}
                    value={simNotes}
                    onChange={(e) => setSimNotes(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#0B2545]"
                  />
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 text-[11px]">
                    &check; Protocol Check: Photographic evidence matches non-biodegradable monofilament. Ready for dispatch to GVMC Sanitation &amp; Port Marine rescue.
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
