import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { AppRoute } from '../types/navigation';
import { useIncidents } from '../context/IncidentContext';
import { subscribeToReports } from '../services/reportService';
import { listOrganizations } from '../services/organizationService';
import { ReportDoc, OrganizationDoc } from '../types/firestore';
import { StatusBadge, SeverityBadge } from '../components/ui/StatusBadge';
import {
  MapPin,
  Filter,
  Navigation,
  Crosshair,
  Layers,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  X,
  ExternalLink,
  Calendar,
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Compass,
  CheckCircle2,
  Flame,
  Clock,
  Eye,
  PlusCircle,
} from 'lucide-react';

interface MapPageProps {
  onNavigate: (route: AppRoute) => void;
}

// Severity color palette & configuration
const SEVERITY_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; text: string }
> = {
  CRITICAL: {
    label: 'Critical',
    color: '#E11D48', // Rose 600
    bg: 'bg-rose-50',
    border: 'border-rose-300',
    text: 'text-rose-700',
  },
  HIGH: {
    label: 'High',
    color: '#F97316', // Orange 500
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    text: 'text-orange-700',
  },
  MODERATE: {
    label: 'Moderate',
    color: '#EAB308', // Yellow 500
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-700',
  },
  LOW: {
    label: 'Low',
    color: '#10B981', // Emerald 500
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-700',
  },
};

// Default center: Visakhapatnam Coastline
const VIZAG_DEFAULT_CENTER: [number, number] = [17.725, 83.33];
const VIZAG_DEFAULT_ZOOM = 12;

export const MapPage: React.FC<MapPageProps> = ({ onNavigate }) => {
  const { reports: contextReports } = useIncidents();

  // Firestore raw states
  const [firestoreReports, setFirestoreReports] = useState<ReportDoc[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationDoc[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Selected report for bottom drawer & popup
  const [selectedReport, setSelectedReport] = useState<ReportDoc | null>(null);

  // Mobile filter drawer expansion
  const [filtersExpanded, setFiltersExpanded] = useState<boolean>(false);

  // Geolocation state
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);

  // Filter values
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('all'); // all | today | 7days | 30days
  const [filterOrg, setFilterOrg] = useState<string>('all');

  // Leaflet references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userLocationLayerRef = useRef<L.LayerGroup | null>(null);

  // Expose navigation to window for Leaflet popup click callbacks
  useEffect(() => {
    (window as any).__openBlueShieldReport = (repId: string) => {
      onNavigate(`/assignments/${repId}` as AppRoute);
    };
    return () => {
      delete (window as any).__openBlueShieldReport;
    };
  }, [onNavigate]);

  // 1. Subscribe to Firestore reports
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToReports(
      (data) => {
        setFirestoreReports(data);
        setIsLoading(false);
      },
      (err) => {
        console.warn('Could not subscribe to Firestore reports, falling back to context:', err);
        setIsLoading(false);
      }
    );

    listOrganizations()
      .then((orgs) => setOrganizations(orgs.filter((o) => o.active)))
      .catch((err) => console.warn('Could not fetch organizations:', err));

    return () => unsubscribe();
  }, []);

  // Merge reports: Firestore live reports preferred, fallback to context
  const allReports: ReportDoc[] = useMemo(() => {
    if (firestoreReports.length > 0) return firestoreReports;
    // Map contextReports to ReportDoc structure
    return contextReports.map((c) => ({
      id: c.id,
      reportNumber: c.reportNumber || c.trackingCode,
      pollutionType: c.pollutionType || c.wasteCategory.replace(/_/g, ' '),
      severity: c.severity.toUpperCase() as any,
      status: c.status,
      latitude: c.location.latitude,
      longitude: c.location.longitude,
      coastalZone: c.location.coastalZoneName,
      createdAt: c.reportedAt,
      assignedOrganization: c.assignedOrganization,
      assignedTo: c.assignedTo,
      description: c.description,
      photoUrl: c.photoUrl || c.imageUrl,
    }));
  }, [firestoreReports, contextReports]);

  // Unique pollution types from reports
  const uniqueTypes = useMemo(() => {
    const set = new Set<string>();
    allReports.forEach((r) => {
      if (r.pollutionType) set.add(r.pollutionType);
    });
    return Array.from(set).sort();
  }, [allReports]);

  // Unique organizations from registry & reports
  const uniqueOrgs = useMemo(() => {
    const set = new Set<string>();
    organizations.forEach((o) => set.add(o.name));
    allReports.forEach((r) => {
      if (r.assignedOrganization) set.add(r.assignedOrganization);
    });
    return Array.from(set).sort();
  }, [organizations, allReports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return allReports.filter((rep) => {
      // Must have valid coordinates
      if (typeof rep.latitude !== 'number' || typeof rep.longitude !== 'number') {
        return false;
      }

      // Filter: Pollution Type
      if (filterType !== 'all') {
        if (rep.pollutionType?.toLowerCase() !== filterType.toLowerCase()) {
          return false;
        }
      }

      // Filter: Severity
      if (filterSeverity !== 'all') {
        const sev = (rep.severity || 'MODERATE').toUpperCase();
        if (sev !== filterSeverity.toUpperCase()) {
          return false;
        }
      }

      // Filter: Status
      if (filterStatus !== 'all') {
        if (filterStatus === 'PENDING') {
          if (rep.status !== 'REPORTED' && rep.status !== 'pending_verification') return false;
        } else if (filterStatus === 'ACTIVE') {
          if (!['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'dispatched'].includes(rep.status)) return false;
        } else if (filterStatus === 'RESOLVED') {
          if (!['CLEANED', 'VERIFIED_CLOSED', 'remediated'].includes(rep.status)) return false;
        } else if (rep.status !== filterStatus) {
          return false;
        }
      }

      // Filter: Organization
      if (filterOrg !== 'all') {
        if (filterOrg === '__unassigned__') {
          if (rep.assignedOrganization && rep.assignedOrganization.trim() !== '') return false;
        } else if (rep.assignedOrganization !== filterOrg) {
          return false;
        }
      }

      // Filter: Date Range
      if (filterDateRange !== 'all') {
        if (!rep.createdAt) return false;
        const time = new Date(rep.createdAt).getTime();
        const now = Date.now();
        if (filterDateRange === 'today') {
          const startOfToday = new Date().setHours(0, 0, 0, 0);
          if (time < startOfToday) return false;
        } else if (filterDateRange === '7days') {
          if (time < now - 7 * 86400000) return false;
        } else if (filterDateRange === '30days') {
          if (time < now - 30 * 86400000) return false;
        }
      }

      return true;
    });
  }, [allReports, filterType, filterSeverity, filterStatus, filterOrg, filterDateRange]);

  // Counts by severity for legend
  const legendCounts = useMemo(() => {
    const counts = { LOW: 0, MODERATE: 0, HIGH: 0, CRITICAL: 0 };
    filteredReports.forEach((r) => {
      const sev = (r.severity || 'MODERATE').toUpperCase();
      if (counts[sev as keyof typeof counts] !== undefined) {
        counts[sev as keyof typeof counts]++;
      }
    });
    return counts;
  }, [filteredReports]);

  // 2. Initialize Leaflet Map (NO GPS REQUIRED TO INITIALIZE)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: VIZAG_DEFAULT_CENTER,
      zoom: VIZAG_DEFAULT_ZOOM,
      zoomControl: false,
    });

    // Standard OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors | BlueShield Coastal GIS',
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    const userLocationLayer = L.layerGroup().addTo(map);

    markersLayerRef.current = markersLayer;
    userLocationLayerRef.current = userLocationLayer;
    mapInstanceRef.current = map;

    // Deselect report on background map click
    map.on('click', () => {
      setSelectedReport(null);
    });

    // Handle responsive container resize
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 3. Render Leaflet Markers when filteredReports change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    filteredReports.forEach((rep) => {
      const sevKey = (rep.severity || 'MODERATE').toUpperCase();
      const config = SEVERITY_CONFIG[sevKey] || SEVERITY_CONFIG.MODERATE;
      const isSelected = selectedReport?.id === rep.id;

      // Custom high-DPI HTML icon classified by severity
      const isCritical = sevKey === 'CRITICAL';
      const markerSize = isSelected ? 36 : isCritical ? 30 : 26;
      const iconAnchor = markerSize / 2;

      const markerHtml = `
        <div style="position: relative; width: ${markerSize}px; height: ${markerSize}px; cursor: pointer;">
          ${
            isCritical
              ? `<span style="position: absolute; inset: -4px; border-radius: 9999px; background-color: ${config.color}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>`
              : ''
          }
          <div style="
            position: relative;
            width: 100%;
            height: 100%;
            background-color: ${config.color};
            border: ${isSelected ? '3px solid #0F172A' : '2.5px solid #FFFFFF'};
            border-radius: 9999px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.35);
            color: #FFFFFF;
            font-weight: 800;
            font-size: ${isSelected ? '13px' : '11px'};
            font-family: ui-monospace, monospace;
            transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
            transition: transform 0.15s ease-in-out;
          ">
            ${isCritical ? '!' : sevKey.charAt(0)}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'blueshield-incident-marker',
        html: markerHtml,
        iconSize: [markerSize, markerSize],
        iconAnchor: [iconAnchor, iconAnchor],
        popupAnchor: [0, -iconAnchor - 4],
      });

      const marker = L.marker([rep.latitude, rep.longitude], { icon: customIcon });

      // Clean HTML popup formatted strictly with all required specifications:
      // Report number, Pollution type, Severity, Status, Location, Date, Open Report
      const createdFormatted = rep.createdAt
        ? new Date(rep.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'N/A';

      const locFormatted =
        rep.coastalZone || `${rep.latitude.toFixed(4)}°N, ${rep.longitude.toFixed(4)}°E`;

      const popupHtml = `
        <div style="padding: 12px; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; min-width: 230px; max-width: 280px;">
          <!-- Top Row: Report number & Status -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <span style="font-family: ui-monospace, monospace; font-weight: 800; font-size: 11px; color: #0f172a;">
              ${rep.reportNumber || rep.id.substring(0, 8)}
            </span>
            <span style="font-size: 9px; font-family: ui-monospace, monospace; font-weight: 700; padding: 2px 6px; border-radius: 9999px; background: #F1F5F9; color: #334155; border: 1px solid #CBD5E1;">
              ${rep.status}
            </span>
          </div>

          <!-- Pollution Type -->
          <div style="font-size: 14px; font-weight: 800; color: #0f172a; line-height: 1.25; margin-bottom: 6px;">
            ${rep.pollutionType}
          </div>

          <!-- Severity & Location Details -->
          <div style="font-size: 11px; color: #475569; display: flex; flex-direction: column; gap: 3px; margin-bottom: 10px;">
            <div style="display: flex; align-items: center; gap: 5px;">
              <span style="font-weight: 600; color: #64748B;">Severity:</span>
              <span style="font-weight: 800; color: ${config.color}; text-transform: uppercase;">
                ${sevKey}
              </span>
            </div>
            <div style="display: flex; align-items: flex-start; gap: 4px;">
              <span style="font-weight: 600; color: #64748B;">Location:</span>
              <span style="color: #1E293B; font-weight: 500;">${locFormatted}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 4px; font-family: ui-monospace, monospace; font-size: 10px; color: #64748B; margin-top: 2px;">
              <span>📅 ${createdFormatted}</span>
            </div>
          </div>

          <!-- Open Report Button -->
          <button
            type="button"
            onclick="window.__openBlueShieldReport('${rep.id}')"
            style="
              width: 100%;
              padding: 7px 10px;
              background-color: #0D9488;
              color: #FFFFFF;
              border: none;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 4px;
              box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            "
          >
            <span>Open Report</span>
            <span style="font-size: 12px;">&rarr;</span>
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      // On marker click: select report for side/bottom details card as well
      marker.on('click', () => {
        setSelectedReport(rep);
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [filteredReports, selectedReport]);

  // 4. Geolocation handler ("Current location" when browser permission is available)
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setGeoNotice('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGeoNotice(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        setUserCoords([latitude, longitude]);

        if (mapInstanceRef.current && userLocationLayerRef.current) {
          userLocationLayerRef.current.clearLayers();

          // User GPS marker with accuracy aura
          const userIcon = L.divIcon({
            className: 'user-current-gps-icon',
            html: `
              <div style="position: relative; width: 22px; height: 22px;">
                <span style="position: absolute; inset: -4px; border-radius: 9999px; background-color: #0284c7; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
                <div style="width: 22px; height: 22px; border-radius: 9999px; background-color: #0284c7; border: 3px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.35);"></div>
              </div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          const userMarker = L.marker([latitude, longitude], { icon: userIcon });
          userMarker.bindPopup(`
            <div style="padding: 8px; font-size: 11px; font-weight: 700; color: #0284c7;">
              📍 Your Current Location
              <div style="font-family: monospace; font-size: 10px; color: #64748b; font-weight: normal; margin-top: 2px;">
                ${latitude.toFixed(5)}°N, ${longitude.toFixed(5)}°E
              </div>
            </div>
          `);

          // Accuracy radius
          const circle = L.circle([latitude, longitude], {
            radius: Math.min(position.coords.accuracy || 200, 500),
            color: '#0284c7',
            fillColor: '#38bdf8',
            fillOpacity: 0.15,
            weight: 1,
          });

          userLocationLayerRef.current.addLayer(circle);
          userLocationLayerRef.current.addLayer(userMarker);

          // Fly map smoothly to location
          mapInstanceRef.current.flyTo([latitude, longitude], 14, { duration: 1.2 });
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoNotice('Location permission was denied. You can continue exploring the map manually.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGeoNotice('Current position is unavailable. Check your network or device settings.');
        } else {
          setGeoNotice('Unable to acquire location timeout.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Reset to default Visakhapatnam center
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(VIZAG_DEFAULT_CENTER, VIZAG_DEFAULT_ZOOM, { duration: 1 });
    }
  };

  // Clear all filters
  const handleResetFilters = () => {
    setFilterType('all');
    setFilterSeverity('all');
    setFilterStatus('all');
    setFilterDateRange('all');
    setFilterOrg('all');
  };

  const isAnyFilterActive =
    filterType !== 'all' ||
    filterSeverity !== 'all' ||
    filterStatus !== 'all' ||
    filterDateRange !== 'all' ||
    filterOrg !== 'all';

  return (
    <div className="relative flex flex-col h-[calc(100vh-64px)] sm:h-[calc(100vh-76px)] overflow-hidden bg-slate-900">
      
      {/* 1. TOP CONTROL BAR / FILTERS (Responsive & Non-Blocking) */}
      <div className="z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-3 py-2 sm:px-4 sm:py-2.5 transition-all">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Title & Quick Incident Count */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Compass className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                Visakhapatnam Coastal Map
              </h1>
              <span className="text-[10px] font-mono text-slate-500 block truncate">
                {filteredReports.length} of {allReports.length} incidents visible
              </span>
            </div>
          </div>

          {/* Right: Actions & Filter Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Locate Me (Current Location) Button */}
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocating}
              title="Locate my position (Optional)"
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs border border-slate-200 disabled:opacity-50"
            >
              <Crosshair className={`w-3.5 h-3.5 text-blue-600 ${isLocating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isLocating ? 'Locating...' : 'Current Location'}
              </span>
            </button>

            {/* Reset View Button */}
            <button
              type="button"
              onClick={handleResetView}
              title="Reset to Vizag Shoreline"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer border border-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset View</span>
            </button>

            {/* File Report Shortcut */}
            <button
              type="button"
              onClick={() => onNavigate('/report')}
              className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Report Incident</span>
            </button>

            {/* Mobile Filter Toggle */}
            <button
              type="button"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                filtersExpanded || isAnyFilterActive
                  ? 'bg-teal-50 border-teal-500 text-teal-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden xs:inline">Filters</span>
              {isAnyFilterActive && (
                <span className="w-2 h-2 rounded-full bg-teal-600" />
              )}
              {filtersExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible / Expandable Filter Row */}
        {filtersExpanded && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-200 space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
              {/* Filter 1: Pollution Type */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                  Pollution Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full py-1.5 px-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-600 truncate"
                >
                  <option value="all">All Types</option>
                  {uniqueTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 2: Severity */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                  Severity Level
                </label>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="w-full py-1.5 px-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
                >
                  <option value="all">All Severities</option>
                  <option value="CRITICAL">Critical (Spill / Net)</option>
                  <option value="HIGH">High Severity</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              {/* Filter 3: Status */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                  Report Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full py-1.5 px-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
                >
                  <option value="all">All Statuses</option>
                  <option value="PENDING">Pending Verification</option>
                  <option value="VERIFIED">Verified (Ready to Assign)</option>
                  <option value="ACTIVE">Active Remediation</option>
                  <option value="CLEANED">Cleaned</option>
                  <option value="VERIFIED_CLOSED">Verified Closed</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              {/* Filter 4: Date Range */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                  Date Range
                </label>
                <select
                  value={filterDateRange}
                  onChange={(e) => setFilterDateRange(e.target.value)}
                  className="w-full py-1.5 px-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="7days">Past 7 Days</option>
                  <option value="30days">Past 30 Days</option>
                </select>
              </div>

              {/* Filter 5: Organization */}
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                  Assigned Organization
                </label>
                <select
                  value={filterOrg}
                  onChange={(e) => setFilterOrg(e.target.value)}
                  className="w-full py-1.5 px-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-600 truncate"
                >
                  <option value="all">All Organizations</option>
                  <option value="__unassigned__">Unassigned / Pending</option>
                  {uniqueOrgs.map((org) => (
                    <option key={org} value={org}>
                      {org}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Reset Button */}
            {isAnyFilterActive && (
              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Geolocation Non-Blocking Notice */}
      {geoNotice && (
        <div className="z-20 bg-amber-50 border-b border-amber-200 px-3 py-1.5 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{geoNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setGeoNotice(null)}
            className="text-amber-800 hover:text-amber-950 font-bold cursor-pointer ml-2 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. MAIN MAP CANVAS (LEAFLET + OPENSTREETMAP) */}
      <div className="relative flex-1 w-full h-full">
        {/* Leaflet Mount Target */}
        <div
          ref={mapContainerRef}
          className="w-full h-full z-0 cursor-grab active:cursor-grabbing"
          style={{ minHeight: '380px' }}
        />

        {/* 3. MAP LEGEND (High Contrast, Floating Bottom-Left or Top-Left) */}
        <div className="absolute bottom-6 left-3 sm:left-4 z-10 bg-white/95 backdrop-blur-md p-2.5 sm:p-3 rounded-xl border border-slate-200 shadow-lg text-xs max-w-[210px] select-none">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
            <span className="font-bold text-[11px] text-slate-900 uppercase tracking-wider">
              Hazard Legend
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {filteredReports.length} Pins
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            {/* Critical */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-600 shadow-2xs border border-white flex items-center justify-center text-[8px] text-white font-black">
                  !
                </span>
                <span className="font-semibold text-slate-800">Critical</span>
              </div>
              <span className="font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded text-[10px]">
                {legendCounts.CRITICAL}
              </span>
            </div>

            {/* High */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500 shadow-2xs border border-white" />
                <span className="font-medium text-slate-700">High</span>
              </div>
              <span className="font-mono font-bold text-orange-700 bg-orange-50 px-1.5 py-0.2 rounded text-[10px]">
                {legendCounts.HIGH}
              </span>
            </div>

            {/* Moderate */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 shadow-2xs border border-white" />
                <span className="font-medium text-slate-700">Moderate</span>
              </div>
              <span className="font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded text-[10px]">
                {legendCounts.MODERATE}
              </span>
            </div>

            {/* Low */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-2xs border border-white" />
                <span className="font-medium text-slate-700">Low</span>
              </div>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded text-[10px]">
                {legendCounts.LOW}
              </span>
            </div>
          </div>
        </div>

        {/* 4. ZOOM CONTROLS (Floating Bottom-Right) */}
        <div className="absolute bottom-6 right-3 sm:right-4 z-10 flex flex-col gap-1.5 shadow-md">
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            title="Zoom In"
            className="w-8 h-8 rounded-lg bg-white/95 hover:bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200 cursor-pointer shadow-xs transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            title="Zoom Out"
            className="w-8 h-8 rounded-lg bg-white/95 hover:bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200 cursor-pointer shadow-xs transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* 5. MOBILE & DESKTOP ACTIVE REPORT DETAIL CARD (Shows when marker clicked) */}
        {selectedReport && (
          <div className="absolute top-3 left-3 right-3 sm:left-auto sm:right-4 sm:top-4 sm:w-88 z-30 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 sm:slide-in-from-top-2 duration-150">
            {/* Card Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-xs text-teal-800">
                    {selectedReport.reportNumber || selectedReport.id.substring(0, 8)}
                  </span>
                  <StatusBadge status={selectedReport.status} size="sm" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  {selectedReport.pollutionType}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Severity Badge & Zone */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <SeverityBadge severity={selectedReport.severity} size="sm" />

              <div className="flex items-center gap-1 text-slate-600 text-xs truncate">
                <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="truncate">
                  {selectedReport.coastalZone ||
                    `${selectedReport.latitude.toFixed(3)}°N, ${selectedReport.longitude.toFixed(3)}°E`}
                </span>
              </div>
            </div>

            {/* Description snippet */}
            {selectedReport.description && (
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                {selectedReport.description}
              </p>
            )}

            {/* Created Timestamp & Org */}
            <div className="text-[11px] text-slate-500 font-mono space-y-1 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span>Created:</span>
                <span className="font-semibold text-slate-700">
                  {selectedReport.createdAt
                    ? new Date(selectedReport.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'N/A'}
                </span>
              </div>
              {selectedReport.assignedOrganization && (
                <div className="flex items-center justify-between">
                  <span>Assigned:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                    {selectedReport.assignedOrganization}
                  </span>
                </div>
              )}
            </div>

            {/* Open Report Button */}
            <button
              type="button"
              onClick={() => onNavigate(`/assignments/${selectedReport.id}` as AppRoute)}
              className="w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Open Report</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
