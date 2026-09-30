import React, { useState, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { AppRoute } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import {
  EntryPointDoc,
  EntryPointCategory,
  EntryPointSeverity,
  EntryPointStatus,
} from '../types/firestore';
import {
  subscribeToEntryPoints,
  createEntryPoint,
  advanceEntryPointStatus,
  deleteEntryPoint,
} from '../services/entryPointService';
import {
  GitFork,
  MapPin,
  AlertTriangle,
  Compass,
  CheckCircle2,
  Filter,
  PlusCircle,
  Search,
  Camera,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building2,
  Clock,
  X,
  FileCheck2,
  Info,
  Maximize2,
  Send,
  Droplets,
  AlertOctagon,
  Trash2,
  ExternalLink,
} from 'lucide-react';

interface EntryPointsPageProps {
  onNavigate: (route: AppRoute) => void;
}

const CATEGORIES: EntryPointCategory[] = [
  'Open Drain',
  'Stormwater Outlet',
  'Canal',
  'Wastewater Outlet',
  'Dumping Point',
  'Other',
];

const SEVERITIES: EntryPointSeverity[] = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];

const STATUSES: { key: EntryPointStatus; label: string; step: number }[] = [
  { key: 'REPORTED', label: '1. Report', step: 1 },
  { key: 'VERIFIED', label: '2. Verify', step: 2 },
  { key: 'ASSIGNED', label: '3. Assign', step: 3 },
  { key: 'RESOLVED', label: '4. Resolve', step: 4 },
  { key: 'VERIFIED_CLOSED', label: '5. Verify Closed', step: 5 },
];

export const EntryPointsPage: React.FC<EntryPointsPageProps> = ({ onNavigate }) => {
  const { user, role, isAuthenticated } = useAuth();

  // Live state from Firestore entry_points collection
  const [entryPoints, setEntryPoints] = useState<EntryPointDoc[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // UI view state
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map');
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [selectedEntryPoint, setSelectedEntryPoint] = useState<EntryPointDoc | null>(null);
  const [statusModalItem, setStatusModalItem] = useState<{
    item: EntryPointDoc;
    nextStatus: EntryPointStatus;
  } | null>(null);
  const [transitionNotes, setTransitionNotes] = useState<string>('');
  const [assignedOrg, setAssignedOrg] = useState<string>('GVMC Coastal Sanitation Wing');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // New Entry Point Form State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<EntryPointCategory>('Open Drain');
  const [newSeverity, setNewSeverity] = useState<EntryPointSeverity>('MODERATE');
  const [newLocationName, setNewLocationName] = useState<string>('');
  const [newCoastalZone, setNewCoastalZone] = useState<string>('Central Urban Shoreline');
  const [newLat, setNewLat] = useState<number>(17.72);
  const [newLng, setNewLng] = useState<number>(83.33);
  const [newDescription, setNewDescription] = useState<string>('');
  const [newPhotoUrl, setNewPhotoUrl] = useState<string>('');
  const [isCapturingGps, setIsCapturingGps] = useState<boolean>(false);

  // Map references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // 1. Subscribe to Firestore entry_points
  useEffect(() => {
    setIsLoading(true);
    const unsub = subscribeToEntryPoints(
      (data) => {
        setEntryPoints(data);
        setIsLoading(false);
      },
      (err) => {
        console.warn('Entry points listener err:', err);
        setIsLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // 2. Filtered list
  const filteredEntryPoints = useMemo(() => {
    return entryPoints.filter((ep) => {
      if (selectedCategory !== 'all' && ep.category !== selectedCategory) return false;
      if (selectedSeverity !== 'all' && ep.severity !== selectedSeverity) return false;
      if (selectedStatus !== 'all' && ep.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (ep.title || '').toLowerCase().includes(q);
        const matchLoc = (ep.locationName || '').toLowerCase().includes(q);
        const matchDesc = (ep.description || '').toLowerCase().includes(q);
        const matchCode = (ep.trackingCode || '').toLowerCase().includes(q);
        if (!matchTitle && !matchLoc && !matchDesc && !matchCode) return false;
      }
      return true;
    });
  }, [entryPoints, selectedCategory, selectedSeverity, selectedStatus, searchQuery]);

  // 3. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [17.725, 83.32],
      zoom: 12,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | BlueShield Coastal Inflow Monitoring',
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 4. Update Leaflet Markers when filtered entry points change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    filteredEntryPoints.forEach((ep) => {
      const lat = ep.latitude;
      const lng = ep.longitude;
      if (typeof lat !== 'number' || typeof lng !== 'number') return;

      const isSelected = selectedEntryPoint?.id === ep.id;

      // Color by severity
      const color =
        ep.severity === 'CRITICAL'
          ? '#DC2626'
          : ep.severity === 'HIGH'
          ? '#EA580C'
          : ep.severity === 'MODERATE'
          ? '#D97706'
          : '#10B981';

      const iconHtml = `
        <div style="position: relative; cursor: pointer; transform: ${
          isSelected ? 'scale(1.2)' : 'scale(1)'
        }; transition: transform 0.2s;">
          <div style="
            background-color: ${color};
            color: #ffffff;
            padding: 3px 6px;
            border-radius: 6px;
            border: 2px solid #ffffff;
            box-shadow: 0 3px 8px rgba(0,0,0,0.35);
            font-size: 10px;
            font-family: ui-monospace, monospace;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
          ">
            <span>${ep.trackingCode || 'EP'}</span>
            <span style="background: rgba(255,255,255,0.25); padding: 1px 4px; border-radius: 4px; font-size: 8px;">
              ${ep.category}
            </span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'entry-point-marker',
        html: iconHtml,
        iconSize: [90, 26],
        iconAnchor: [45, 13],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      const popupHtml = `
        <div style="padding: 10px; font-family: system-ui, sans-serif; min-width: 240px; max-width: 280px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-family: monospace; font-size: 11px; font-weight: 800; color: #0F172A;">${ep.trackingCode}</span>
            <span style="font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 9999px; background: ${color}15; color: ${color}; border: 1px solid ${color}40;">
              ${ep.severity}
            </span>
          </div>
          <div style="font-weight: 800; font-size: 13px; color: #0F172A; margin-bottom: 2px;">
            ${ep.title}
          </div>
          <div style="font-size: 10px; color: #64748B; margin-bottom: 6px;">
            📍 ${ep.locationName} (${ep.category})
          </div>
          ${
            ep.photoUrl
              ? `<div style="margin-bottom: 6px; border-radius: 6px; overflow: hidden; height: 100px; background: #eee;">
                  <img src="${ep.photoUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="Entry Point Photo" />
                 </div>`
              : ''
          }
          <div style="font-size: 11px; color: #334155; margin-bottom: 8px; line-height: 1.3;">
            ${ep.description || 'No additional description provided.'}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 6px; border-top: 1px solid #E2E8F0; font-size: 10px; font-family: monospace;">
            <span style="color: #64748B;">Status:</span>
            <strong style="color: #0D9488;">${ep.status.replace(/_/g, ' ')}</strong>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        setSelectedEntryPoint(ep);
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [filteredEntryPoints, selectedEntryPoint]);

  // Center map on specific entry point
  const handleFocusEntryPoint = (ep: EntryPointDoc) => {
    setSelectedEntryPoint(ep);
    setActiveTab('map');
    if (mapInstanceRef.current && typeof ep.latitude === 'number' && typeof ep.longitude === 'number') {
      mapInstanceRef.current.flyTo([ep.latitude, ep.longitude], 15, { duration: 1.0 });
    }
  };

  // Capture GPS coordinates from browser
  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsCapturingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewLat(parseFloat(pos.coords.latitude.toFixed(5)));
        setNewLng(parseFloat(pos.coords.longitude.toFixed(5)));
        setIsCapturingGps(false);
      },
      (err) => {
        console.warn('Geolocation capture failed:', err);
        setIsCapturingGps(false);
        // Fallback to default Vizag shore
        setNewLat(17.7215);
        setNewLng(83.332);
      }
    );
  };

  // Submit New Entry Point
  const handleCreateEntryPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newLocationName.trim()) {
      alert('Please fill in title and location name.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createEntryPoint({
        title: newTitle.trim(),
        category: newCategory,
        severity: newSeverity,
        status: 'REPORTED',
        locationName: newLocationName.trim(),
        coastalZone: newCoastalZone,
        latitude: newLat,
        longitude: newLng,
        description: newDescription.trim(),
        photoUrl: newPhotoUrl.trim() || undefined,
        reportedBy: user?.displayName || user?.email || 'Field Observer',
        reporterId: user?.id || 'citizen-public',
      });

      setIsReportModalOpen(false);
      // Reset form
      setNewTitle('');
      setNewLocationName('');
      setNewDescription('');
      setNewPhotoUrl('');
    } catch (err) {
      console.error('Failed to create entry point:', err);
      alert('Failed to submit entry point. Please check connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Advance Status Workflow: REPORTED -> VERIFIED -> ASSIGNED -> RESOLVED -> VERIFIED_CLOSED
  const getNextStatus = (current: EntryPointStatus): EntryPointStatus | null => {
    if (current === 'REPORTED') return 'VERIFIED';
    if (current === 'VERIFIED') return 'ASSIGNED';
    if (current === 'ASSIGNED') return 'RESOLVED';
    if (current === 'RESOLVED') return 'VERIFIED_CLOSED';
    return null;
  };

  const handleOpenStatusModal = (ep: EntryPointDoc) => {
    const next = getNextStatus(ep.status);
    if (!next) return;
    setStatusModalItem({ item: ep, nextStatus: next });
    setTransitionNotes('');
    setAssignedOrg(ep.assignedOrganization || 'GVMC Coastal Sanitation Wing');
  };

  const handleConfirmStatusAdvance = async () => {
    if (!statusModalItem) return;
    setIsSubmitting(true);
    try {
      await advanceEntryPointStatus(statusModalItem.item.id, statusModalItem.nextStatus, {
        actorName: user?.displayName || user?.email || 'Coastal Officer',
        organization: assignedOrg,
        notes: transitionNotes.trim() || undefined,
      });
      setStatusModalItem(null);
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Could not update status. Please verify permissions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      
      {/* 1. MANDATORY PLATFORM SCOPE & ANTI-TREATMENT DISCLAIMER BANNER */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-900 text-teal-300 border border-teal-700 uppercase tracking-widest flex items-center gap-1.5">
                <GitFork className="w-3 h-3 text-teal-400" />
                <span>Hydrological Inflow &amp; Point-Source Monitoring</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Collection: entry_points
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Coastal Pollution Entry Points
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Dedicated tracking module for land-based pollution entry points (open drains, storm canals, outfalls, and illegal dumping points) across the Visakhapatnam shoreline.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Entry Point</span>
            </button>
          </div>
        </div>

        {/* MANDATORY PLATFORM ROLE & NON-TREATMENT BOUNDARY NOTICE */}
        <div className="bg-slate-800/90 border border-amber-500/40 rounded-xl p-3.5 text-xs text-amber-200/95 flex items-start gap-3 shadow-xs">
          <AlertOctagon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <strong className="text-white font-bold block">
              Platform Mandate &amp; Boundary Notice:
            </strong>
            <p className="text-slate-300 text-[11px]">
              BlueShield is a <strong>reporting, coordination, and intelligence platform</strong>. It does <span className="text-amber-300 font-bold underline">NOT</span> physically treat sewage or wastewater, nor does it operate physical water treatment plants or drainage infrastructure. Its purpose is to catalog point sources, facilitate inter-agency verification, coordinate barrier deployment, and track municipal remediation accountability.
            </p>
          </div>
        </div>
      </div>

      {/* 2. STATS & WORKFLOW OVERVIEW COUNTERS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        {STATUSES.map((st) => {
          const count = entryPoints.filter((e) => e.status === st.key).length;
          return (
            <div
              key={st.key}
              onClick={() => setSelectedStatus(selectedStatus === st.key ? 'all' : st.key)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                selectedStatus === st.key
                  ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[10px] font-mono font-bold uppercase">{st.label}</span>
                <span className="text-[10px] font-mono text-slate-400">Step {st.step}</span>
              </div>
              <div className="text-xl font-black text-slate-900">{count}</div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                {st.key === 'REPORTED'
                  ? 'Pending Officer Audit'
                  : st.key === 'VERIFIED'
                  ? 'Ready for Dispatch'
                  : st.key === 'ASSIGNED'
                  ? 'Agency Task Active'
                  : st.key === 'RESOLVED'
                  ? 'Barrier/Cleaned'
                  : 'Verified Closed'}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. MULTI-FILTER CONTROLS BAR & VIEW SWITCHER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
            <Filter className="w-4 h-4 text-teal-600" />
            <span>Filter Mapped Entry Points</span>
          </div>

          {/* Map vs List View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('map')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'map'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Map Cartography</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Workflow Directory ({filteredEntryPoints.length})</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search Query */}
          <div>
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
              Search Points
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search outfall, beach, code..."
                className="w-full py-1.5 pl-8 pr-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
              />
            </div>
          </div>

          {/* Filter 1: Category */}
          <div>
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
            >
              <option value="all">All Categories ({CATEGORIES.length})</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 2: Severity */}
          <div>
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
              Severity
            </label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
            >
              <option value="all">All Severities</option>
              {SEVERITIES.map((sev) => (
                <option key={sev} value={sev}>
                  {sev}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 3: Status */}
          <div>
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
              Workflow Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
            >
              <option value="all">All Workflow Stages</option>
              {STATUSES.map((st) => (
                <option key={st.key} value={st.key}>
                  {st.label} ({st.key.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. MAP VIEW */}
      {activeTab === 'map' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-0">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-teal-600" />
                <span>Geographic Inflow Cartography ({filteredEntryPoints.length} Mapped)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Displays exact GPS coordinates, outflow conduits, and intertidal entry points along Visakhapatnam.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                <span>Critical</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-orange-50 text-orange-800 border border-orange-200 text-[10px] font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span>High</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Moderate</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Low</span>
              </span>
            </div>
          </div>

          <div className="relative w-full h-[460px] bg-slate-100">
            <div ref={mapContainerRef} className="w-full h-full z-0 cursor-grab active:cursor-grabbing" />
          </div>
        </div>
      )}

      {/* 5. DIRECTORY & WORKFLOW FEED (Visible in List Tab or Below Map) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600" />
            <span>Tracked Entry Points ({filteredEntryPoints.length})</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            Workflow: REPORT &rarr; VERIFY &rarr; ASSIGN &rarr; RESOLVE &rarr; VERIFY CLOSED
          </span>
        </div>

        {filteredEntryPoints.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
            <GitFork className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Entry Points Match Filters</p>
            <p className="text-xs text-slate-400">
              Try adjusting the category, severity, or status dropdown above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEntryPoints.map((ep) => {
              const currentStepObj = STATUSES.find((s) => s.key === ep.status) || STATUSES[0];
              const nextStatus = getNextStatus(ep.status);

              const sevColor =
                ep.severity === 'CRITICAL'
                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                  : ep.severity === 'HIGH'
                  ? 'bg-orange-50 text-orange-800 border-orange-300'
                  : ep.severity === 'MODERATE'
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300';

              return (
                <div
                  key={ep.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header Row: Tracking Code, Category, Severity */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-white">
                          {ep.trackingCode}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {ep.category}
                        </span>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${sevColor}`}>
                        {ep.severity} SEVERITY
                      </span>
                    </div>

                    {/* Title & Photo */}
                    <div className="flex gap-3">
                      {ep.photoUrl ? (
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          <img
                            src={ep.photoUrl}
                            alt={ep.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-400 shrink-0 border border-slate-200 text-[10px]">
                          <Camera className="w-5 h-5 mb-0.5" />
                          <span>No Photo</span>
                        </div>
                      )}

                      <div className="space-y-1 min-w-0 flex-1">
                        <h3 className="text-sm font-black text-slate-900 leading-snug">
                          {ep.title}
                        </h3>
                        <div className="text-[11px] text-slate-600 font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                          <span className="truncate">{ep.locationName}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          GPS: {ep.latitude.toFixed(4)}°N, {ep.longitude.toFixed(4)}°E
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      {ep.description || 'No detailed technical notes entered for this outfall.'}
                    </p>

                    {/* 5-Step Workflow Progress Stepper */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 font-bold">
                        <span>Workflow Stage: {currentStepObj.label}</span>
                        <span>Step {currentStepObj.step} of 5</span>
                      </div>

                      {/* Stepper Bar */}
                      <div className="grid grid-cols-5 gap-1">
                        {STATUSES.map((st) => {
                          const isDone = st.step <= currentStepObj.step;
                          const isCurrent = st.step === currentStepObj.step;
                          return (
                            <div
                              key={st.key}
                              className={`h-1.5 rounded-full transition-all ${
                                isCurrent
                                  ? 'bg-teal-600 ring-2 ring-teal-200'
                                  : isDone
                                  ? 'bg-teal-500'
                                  : 'bg-slate-200'
                              }`}
                              title={st.label}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Assignment / Resolution Notes if present */}
                    {ep.assignedOrganization && (
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                        <span className="flex items-center gap-1 text-slate-600">
                          <Building2 className="w-3 h-3 text-blue-600" />
                          <span>Assigned Agency:</span>
                        </span>
                        <span className="font-bold text-slate-800">{ep.assignedOrganization}</span>
                      </div>
                    )}

                    {ep.resolutionNotes && (
                      <div className="text-[10px] text-teal-900 bg-teal-50/80 p-2 rounded-lg border border-teal-200 leading-relaxed">
                        <strong>Resolution Action:</strong> {ep.resolutionNotes}
                      </div>
                    )}
                  </div>

                  {/* Card Action Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleFocusEntryPoint(ep)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <MapPin className="w-3.5 h-3.5 text-teal-600" />
                      <span>Map Center</span>
                    </button>

                    {/* Workflow Advance Button */}
                    {nextStatus ? (
                      <button
                        type="button"
                        onClick={() => handleOpenStatusModal(ep)}
                        className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1 ml-auto"
                      >
                        <span>Advance to {nextStatus.replace(/_/g, ' ')}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold font-mono border border-emerald-200 flex items-center gap-1 ml-auto">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Workflow Complete</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. MODAL: REPORT NEW ENTRY POINT */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-teal-600" />
                  <span>Report Coastal Inflow Entry Point</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Document an outfall, drain, canal, or illegal dumping point along the Vizag coast.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEntryPoint} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-700 uppercase block mb-1">
                  Entry Point Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. RK Beach Stormwater Culvert 4"
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-700 uppercase block mb-1">
                    Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as EntryPointCategory)}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-slate-700 uppercase block mb-1">
                    Initial Severity *
                  </label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as EntryPointSeverity)}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
                  >
                    {SEVERITIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-slate-700 uppercase block mb-1">
                  Location Name / Landmark *
                </label>
                <input
                  type="text"
                  required
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="e.g. Opp. Kali Temple Promenade, Ramakrishna Beach"
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
                />
              </div>

              {/* GPS Coordinates & Capture Button */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-700 uppercase">
                    GPS Coordinates (Lat / Lng) *
                  </span>
                  <button
                    type="button"
                    onClick={handleCaptureGps}
                    disabled={isCapturingGps}
                    className="text-[10px] font-mono font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Compass className="w-3 h-3" />
                    <span>{isCapturingGps ? 'Locating...' : 'Use Device GPS'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newLat}
                    onChange={(e) => setNewLat(parseFloat(e.target.value))}
                    placeholder="Latitude"
                    className="py-1.5 px-2.5 border border-slate-300 rounded bg-white text-slate-800 font-mono text-xs"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newLng}
                    onChange={(e) => setNewLng(parseFloat(e.target.value))}
                    placeholder="Longitude"
                    className="py-1.5 px-2.5 border border-slate-300 rounded bg-white text-slate-800 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Photo URL */}
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-700 uppercase block mb-1">
                  Photo URL (Optional Ground Evidence)
                </label>
                <div className="relative">
                  <Camera className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="https://example.com/outfall-photo.jpg"
                    className="w-full py-2 pl-8 pr-3 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              </div>

              {/* Technical Description */}
              <div>
                <label className="text-[10px] font-mono font-bold text-slate-700 uppercase block mb-1">
                  Technical Description &amp; Visual Indicators
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe outfall dimensions, observed effluent characteristics, plastic flotsam density, or flow state..."
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Registering...' : 'Register Entry Point'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: WORKFLOW STATUS ADVANCE */}
      {statusModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Advance Workflow Status
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Point: <span className="font-mono font-bold text-slate-800">{statusModalItem.item.trackingCode}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between font-mono">
                <span className="text-slate-500">Current Status:</span>
                <span className="font-bold text-slate-800">{statusModalItem.item.status}</span>
              </div>
              <div className="flex justify-between font-mono text-teal-800 font-bold">
                <span>Next Stage:</span>
                <span>{statusModalItem.nextStatus}</span>
              </div>
            </div>

            {/* Special field for ASSIGNED stage: Organization */}
            {statusModalItem.nextStatus === 'ASSIGNED' && (
              <div className="space-y-1 text-xs">
                <label className="font-mono font-bold text-slate-700 uppercase block">
                  Assign Agency / Remediation Team
                </label>
                <select
                  value={assignedOrg}
                  onChange={(e) => setAssignedOrg(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg text-slate-900 font-medium"
                >
                  <option value="GVMC Coastal Sanitation Wing">GVMC Coastal Sanitation Wing</option>
                  <option value="Visakhapatnam Port Authority (VPA)">Visakhapatnam Port Authority (VPA)</option>
                  <option value="APPCB Environmental Wing">APPCB Environmental Wing</option>
                  <option value="Indian Coast Guard Marine Safety">Indian Coast Guard Marine Safety</option>
                  <option value="Visakha Marine Eco Taskforce">Visakha Marine Eco Taskforce</option>
                </select>
              </div>
            )}

            {/* Verification / Resolution Notes */}
            <div className="space-y-1 text-xs">
              <label className="font-mono font-bold text-slate-700 uppercase block">
                {statusModalItem.nextStatus === 'VERIFIED'
                  ? 'Field Verification Notes'
                  : statusModalItem.nextStatus === 'RESOLVED'
                  ? 'Remediation / Barrier Deployment Notes'
                  : statusModalItem.nextStatus === 'VERIFIED_CLOSED'
                  ? 'Final Officer Closure Audit Notes'
                  : 'Dispatch Directives'}
              </label>
              <textarea
                rows={3}
                value={transitionNotes}
                onChange={(e) => setTransitionNotes(e.target.value)}
                placeholder="Enter technical audit notes, barrier anchor details, or inspection confirmation..."
                className="w-full py-2 px-3 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setStatusModalItem(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmStatusAdvance}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Updating...' : `Confirm ${statusModalItem.nextStatus}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
