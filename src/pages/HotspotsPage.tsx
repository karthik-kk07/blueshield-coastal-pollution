import React, { useState, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import Papa from 'papaparse';
import { AppRoute } from '../types/navigation';
import { useIncidents } from '../context/IncidentContext';
import { subscribeToReports } from '../services/reportService';
import { listHistoricalCleanups } from '../services/historicalCleanupService';
import { ReportDoc, HistoricalCleanupDoc } from '../types/firestore';
import {
  Flame,
  MapPin,
  Compass,
  Search,
  Filter,
  Sliders,
  Calendar,
  Layers,
  ArrowUpDown,
  Download,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Clock,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Info,
  Scale,
  Sparkles,
  Lightbulb,
  ShieldCheck,
} from 'lucide-react';
import { generateHotspotRecommendations, DataInformedRecommendation } from '../services/preventionRuleService';

interface HotspotsPageProps {
  onNavigate: (route: AppRoute) => void;
}

// Visakhapatnam Coastal Geographic Anchor Centers for Rule-Based Clustering
interface CoastalAnchor {
  anchorId: string;
  name: string;
  coastalZone: string;
  coordinates: [number, number];
  description: string;
  primaryDrivers: string;
}

const VIZAG_ANCHORS: CoastalAnchor[] = [
  {
    anchorId: 'RK-BEACH',
    name: 'Ramakrishna (RK) Beach Promenade',
    coastalZone: 'Central Urban Shoreline',
    coordinates: [17.7155, 83.3285],
    description: 'Premier urban beachfront facing Kali temple ghats and INS Kursura Submarine Museum.',
    primaryDrivers: 'Massive civic tourism, festive gatherings, and urban stormwater outfalls.',
  },
  {
    anchorId: 'FISHING-HARBOUR',
    name: 'Visakhapatnam Fishing Harbour & Wharves',
    coastalZone: 'Marine Port & Breakwater',
    coordinates: [17.6982, 83.3045],
    description: 'Berthing basin for 800+ mechanized trawlers, traditional gillnetters, and ice docks.',
    primaryDrivers: 'Derelict fishing gear, discarded nylon monofilament, and bilge oil sheen.',
  },
  {
    anchorId: 'RUSHIKONDA',
    name: 'Rushikonda Blue Flag Beach',
    coastalZone: 'Northern Eco Zone',
    coordinates: [17.7818, 83.3855],
    description: 'Internationally certified Blue Flag eco-beach and water sports cove.',
    primaryDrivers: 'Weekend recreational flotsam, single-use food packaging, and seasonal onshore swell.',
  },
  {
    anchorId: 'LAWSONS-BAY',
    name: "Lawson's Bay & Mangamaripeta Cove",
    coastalZone: 'Artisanal Fishing Cove',
    coordinates: [17.732, 83.341],
    description: 'Natural rocky intertidal cove with traditional catamarans and shallow artisanal waters.',
    primaryDrivers: 'Entangled gillnets on rocky shelves and tidal eddy flotsam entrapment.',
  },
  {
    anchorId: 'TENNETI-PARK',
    name: 'Tenneti Park & Jodugullapalem Rocks',
    coastalZone: 'Rocky Intertidal Escarpment',
    coordinates: [17.7475, 83.354],
    description: 'Elevated scenic coastal bluffs with rocky ledges popular with tourists and walkers.',
    primaryDrivers: 'Beverage bottles, takeaway packaging, and intertidal ledge entrapment.',
  },
  {
    anchorId: 'SAGAR-NAGAR',
    name: 'Sagar Nagar Beach',
    coastalZone: 'North-Central Shoreline',
    coordinates: [17.755, 83.356],
    description: 'Expansive open sandy shoreline along the scenic Vizag-Bheemili beach road.',
    primaryDrivers: 'Macroplastic beverage bottles and post-monsoon coastal drift line deposition.',
  },
  {
    anchorId: 'YARADA-BEACH',
    name: "Yarada Beach & Dolphin's Nose Cove",
    coastalZone: 'South Headland Cove',
    coordinates: [17.6548, 83.2687],
    description: 'Enclosed cove framed by Dolphin’s Nose headland and high rocky promontory.',
    primaryDrivers: 'Longshore current flotsam drift and localized tourism waste.',
  },
  {
    anchorId: 'BHEEMILI-ESTUARY',
    name: 'Bheemili Beach & Gosthani River Estuary',
    coastalZone: 'Gosthani Estuary Confluence',
    coordinates: [17.892, 83.454],
    description: 'Northern confluence where the Gosthani River empties into the Bay of Bengal.',
    primaryDrivers: 'Upstream riverine runoff debris and estuarine plastic packaging accumulation.',
  },
  {
    anchorId: 'GANGAVARAM-PORT',
    name: 'Gangavaram Coastal Basin',
    coastalZone: 'South Industrial Coastal Basin',
    coordinates: [17.625, 83.238],
    description: 'Deep-water private port perimeter and adjacent rural fishing shoreline in South Vizag.',
    primaryDrivers: 'Industrial buffer flotsam, heavy plastic strapping, and vessel traffic residue.',
  },
  {
    anchorId: 'MEGHADRIGEDDA',
    name: 'Meghadrigedda Tidal Creek Outfall',
    coastalZone: 'Estuary / Industrial Drain Basin',
    coordinates: [17.692, 83.242],
    description: 'Major drainage and tidal creek passing industrial clusters into inner harbour waters.',
    primaryDrivers: 'Industrial canal effluent, micro-waste fragments, and monsoon overflow surges.',
  },
];

// Calculated Hotspot Item
export interface CalculatedHotspot {
  hotspotId: string;
  anchorId: string;
  name: string;
  coastalZone: string;
  coordinates: [number, number];
  reportCount: number;
  cleanupCount: number;
  totalActivities: number;
  dominantPollutionType: string;
  averageSeverityScore: number;
  averageSeverityLabel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  mostRecentActivityDate: string;
  mostRecentActivityRelative: string;
  recurrenceIndicator: 'CHRONIC / PERSISTENT' | 'FREQUENT / RECURRING' | 'EPISODIC / EMERGING' | 'ISOLATED';
  recurrenceColor: string;
  totalWasteCollectedKg: number;
  preventiveScore: number;
  associatedReports: ReportDoc[];
  associatedCleanups: HistoricalCleanupDoc[];
}

// Great-circle Haversine distance in meters (Deterministic spatial calculation)
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Format relative date string
function formatRelativeDate(isoDate: string): string {
  if (!isoDate) return 'No recorded activity';
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${(diffDays / 365).toFixed(1)} years ago`;
}

// Numerical severity weighting
const SEVERITY_WEIGHTS: Record<string, number> = {
  CRITICAL: 4.0,
  critical: 4.0,
  HIGH: 3.0,
  high: 3.0,
  MODERATE: 2.0,
  moderate: 2.0,
  LOW: 1.0,
  low: 1.0,
};

export const HotspotsPage: React.FC<HotspotsPageProps> = ({ onNavigate }) => {
  const { reports: contextReports } = useIncidents();

  // Raw data from Firestore
  const [firestoreReports, setFirestoreReports] = useState<ReportDoc[]>([]);
  const [historicalCleanups, setHistoricalCleanups] = useState<HistoricalCleanupDoc[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // CONFIGURABLE SPATIAL & TEMPORAL PARAMETERS
  // "Create a configurable radius such as 500 meters. Allow the radius to be changed later."
  const [radiusMeters, setRadiusMeters] = useState<number>(500);
  const [timeWindowDays, setTimeWindowDays] = useState<number>(0); // 0 = All Time

  // UI state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterRecurrence, setFilterRecurrence] = useState<string>('all');
  const [sortField, setSortField] = useState<'preventiveScore' | 'totalActivities' | 'reportCount' | 'cleanupCount' | 'averageSeverityScore'>('preventiveScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);

  // Leaflet map references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const hotspotsLayerRef = useRef<L.LayerGroup | null>(null);
  const radiusCirclesLayerRef = useRef<L.LayerGroup | null>(null);

  // 1. Fetch live reports and cleanups
  useEffect(() => {
    setIsLoading(true);
    const unsub = subscribeToReports(
      (data) => {
        setFirestoreReports(data);
        setIsLoading(false);
      },
      () => setIsLoading(false)
    );

    // Fetch historical cleanups
    listHistoricalCleanups(500, 'REAL_HISTORICAL')
      .then((records) => {
        if (records && records.length > 0) {
          setHistoricalCleanups(records);
        } else {
          // Fallback to fetch bundled CSV
          fetch('/historical_beach_cleanup_visakhapatnam.csv')
            .then((r) => r.text())
            .then((csv) => {
              Papa.parse(csv, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                  const parsed = (results.data as any[])
                    .filter((row) => row.date && row.latitude && row.longitude)
                    .map((row, idx) => ({
                      id: row.cleanup_id || `hist-${idx}`,
                      cleanupId: row.cleanup_id,
                      date: row.date,
                      beachName: row.beach_name,
                      zone: row.zone,
                      latitude: parseFloat(row.latitude),
                      longitude: parseFloat(row.longitude),
                      totalWasteKg: parseFloat(row.total_waste_kg || '0'),
                      predominantCategory: row.predominant_category || 'Plastic',
                      organization: row.organization,
                      dataSource: 'REAL_HISTORICAL' as const,
                    }));
                  setHistoricalCleanups(parsed);
                },
              });
            });
        }
      })
      .catch((err) => console.warn('Could not load historical cleanups:', err));

    return () => unsub();
  }, []);

  // Merge reports
  const allReports: ReportDoc[] = useMemo(() => {
    if (firestoreReports.length > 0) return firestoreReports;
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
      description: c.description,
    }));
  }, [firestoreReports, contextReports]);

  // 2. TRANSPARENT RULE-BASED HOTSPOT ANALYSIS ALGORITHM
  // (No Machine Learning — Deterministic Spatial Clustering & Recurrence Calculation)
  const calculatedHotspots: CalculatedHotspot[] = useMemo(() => {
    const now = Date.now();
    const cutoffTime = timeWindowDays > 0 ? now - timeWindowDays * 24 * 60 * 60 * 1000 : 0;

    // Filter reports by time window and valid coords
    const activeReports = allReports.filter((r) => {
      if (typeof r.latitude !== 'number' || typeof r.longitude !== 'number') return false;
      if (cutoffTime > 0 && r.createdAt) {
        if (new Date(r.createdAt).getTime() < cutoffTime) return false;
      }
      return true;
    });

    // Filter cleanups by time window and valid coords
    const activeCleanups = historicalCleanups.filter((c) => {
      if (typeof c.latitude !== 'number' || typeof c.longitude !== 'number') return false;
      if (cutoffTime > 0 && c.date) {
        if (new Date(c.date).getTime() < cutoffTime) return false;
      }
      return true;
    });

    // Spatial clustering around coastal anchors based on configured radius
    return VIZAG_ANCHORS.map((anchor, index) => {
      const [anchorLat, anchorLng] = anchor.coordinates;

      // Find all reports within radiusMeters
      const matchedReports = activeReports.filter((r) => {
        const dist = getDistanceMeters(anchorLat, anchorLng, r.latitude, r.longitude);
        return dist <= radiusMeters;
      });

      // Find all cleanups within radiusMeters
      const matchedCleanups = activeCleanups.filter((c) => {
        const dist = getDistanceMeters(anchorLat, anchorLng, c.latitude!, c.longitude!);
        return dist <= radiusMeters;
      });

      const reportCount = matchedReports.length;
      const cleanupCount = matchedCleanups.length;
      const totalActivities = reportCount + cleanupCount;

      // Dominant Pollution Type Calculation
      const typeFreq: Record<string, number> = {};
      matchedReports.forEach((r) => {
        const t = r.pollutionType || 'Plastic';
        typeFreq[t] = (typeFreq[t] || 0) + 1;
      });
      matchedCleanups.forEach((c) => {
        const t = c.predominantCategory || 'Plastic';
        typeFreq[t] = (typeFreq[t] || 0) + 1;
      });

      let dominantPollutionType = 'Plastic & Marine Debris';
      let maxCount = 0;
      Object.entries(typeFreq).forEach(([type, count]) => {
        if (count > maxCount) {
          maxCount = count;
          dominantPollutionType = type;
        }
      });

      // Average Severity Calculation (Scale 1.0 to 4.0)
      let severitySum = 0;
      let severityEvents = 0;
      matchedReports.forEach((r) => {
        const weight = SEVERITY_WEIGHTS[r.severity] || 2.0;
        severitySum += weight;
        severityEvents += 1;
      });
      // Cleanups default to average weight 2.5
      matchedCleanups.forEach(() => {
        severitySum += 2.5;
        severityEvents += 1;
      });

      const averageSeverityScore =
        severityEvents > 0 ? Math.round((severitySum / severityEvents) * 10) / 10 : 2.0;

      let averageSeverityLabel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' = 'MODERATE';
      if (averageSeverityScore >= 3.5) averageSeverityLabel = 'CRITICAL';
      else if (averageSeverityScore >= 2.8) averageSeverityLabel = 'HIGH';
      else if (averageSeverityScore >= 1.8) averageSeverityLabel = 'MODERATE';
      else averageSeverityLabel = 'LOW';

      // Most Recent Activity Date Calculation
      const timestamps: string[] = [];
      matchedReports.forEach((r) => {
        if (r.createdAt) timestamps.push(r.createdAt);
      });
      matchedCleanups.forEach((c) => {
        if (c.date) timestamps.push(c.date);
      });
      timestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      const mostRecentActivityDate = timestamps[0] || '';
      const mostRecentActivityRelative = formatRelativeDate(mostRecentActivityDate);

      // Recurrence Indicator (Rule-based classification)
      let recurrenceIndicator: 'CHRONIC / PERSISTENT' | 'FREQUENT / RECURRING' | 'EPISODIC / EMERGING' | 'ISOLATED' =
        'EPISODIC / EMERGING';
      let recurrenceColor = '#D97706'; // Amber

      if (totalActivities >= 7) {
        recurrenceIndicator = 'CHRONIC / PERSISTENT';
        recurrenceColor = '#DC2626'; // Red
      } else if (totalActivities >= 4) {
        recurrenceIndicator = 'FREQUENT / RECURRING';
        recurrenceColor = '#EA580C'; // Orange
      } else if (totalActivities >= 2) {
        recurrenceIndicator = 'EPISODIC / EMERGING';
        recurrenceColor = '#D97706'; // Amber
      } else {
        recurrenceIndicator = 'ISOLATED';
        recurrenceColor = '#64748B'; // Slate
      }

      // Total Waste Collected in Kg
      let totalWasteCollectedKg = 0;
      matchedCleanups.forEach((c) => {
        totalWasteCollectedKg += c.totalWasteKg || 0;
      });

      // Preventive Priority Score (Deterministic transparent weighting formula)
      // Score = (Reports * 2.5) + (Cleanups * 1.5) + (SeverityScore * 6) + RecurrenceWeight
      const recurrenceBonus =
        recurrenceIndicator === 'CHRONIC / PERSISTENT'
          ? 25
          : recurrenceIndicator === 'FREQUENT / RECURRING'
          ? 15
          : recurrenceIndicator === 'EPISODIC / EMERGING'
          ? 5
          : 0;

      const preventiveScore = Math.round(
        reportCount * 2.5 +
          cleanupCount * 1.5 +
          averageSeverityScore * 6 +
          recurrenceBonus
      );

      const hotspotId = `HSP-VIZAG-${String(index + 1).padStart(2, '0')}`;

      return {
        hotspotId,
        anchorId: anchor.anchorId,
        name: anchor.name,
        coastalZone: anchor.coastalZone,
        coordinates: anchor.coordinates,
        reportCount,
        cleanupCount,
        totalActivities,
        dominantPollutionType,
        averageSeverityScore,
        averageSeverityLabel,
        mostRecentActivityDate,
        mostRecentActivityRelative,
        recurrenceIndicator,
        recurrenceColor,
        totalWasteCollectedKg: Math.round(totalWasteCollectedKg),
        preventiveScore,
        associatedReports: matchedReports,
        associatedCleanups: matchedCleanups,
      };
    });
  }, [allReports, historicalCleanups, radiusMeters, timeWindowDays]);

  // Filtered and Sorted Hotspots
  const displayedHotspots = useMemo(() => {
    return calculatedHotspots
      .filter((hs) => {
        if (filterRecurrence !== 'all') {
          if (hs.recurrenceIndicator !== filterRecurrence) return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = hs.name.toLowerCase().includes(q);
          const matchZone = hs.coastalZone.toLowerCase().includes(q);
          const matchId = hs.hotspotId.toLowerCase().includes(q);
          const matchType = hs.dominantPollutionType.toLowerCase().includes(q);
          if (!matchName && !matchZone && !matchId && !matchType) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (sortOrder === 'desc') {
          return (valB as number) - (valA as number);
        }
        return (valA as number) - (valB as number);
      });
  }, [calculatedHotspots, filterRecurrence, searchQuery, sortField, sortOrder]);

  // 3. Leaflet Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [17.725, 83.33], // Visakhapatnam shoreline
      zoom: 12,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Recurring Pollution Hotspot Analysis',
    }).addTo(map);

    const radiusCirclesLayer = L.layerGroup().addTo(map);
    const hotspotsLayer = L.layerGroup().addTo(map);

    radiusCirclesLayerRef.current = radiusCirclesLayer;
    hotspotsLayerRef.current = hotspotsLayer;
    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 4. Update Leaflet Map Hotspot Markers & Configurable Radius Circles
  useEffect(() => {
    if (!mapInstanceRef.current || !hotspotsLayerRef.current || !radiusCirclesLayerRef.current)
      return;

    hotspotsLayerRef.current.clearLayers();
    radiusCirclesLayerRef.current.clearLayers();

    calculatedHotspots.forEach((hs) => {
      const [lat, lng] = hs.coordinates;
      const isSelected = selectedHotspotId === hs.hotspotId;

      // 1. Draw Configurable Geographic Radius Circle
      const circle = L.circle([lat, lng], {
        radius: radiusMeters,
        color: hs.recurrenceColor,
        fillColor: hs.recurrenceColor,
        fillOpacity: isSelected ? 0.35 : 0.18,
        weight: isSelected ? 2.5 : 1.5,
        dashArray: hs.recurrenceIndicator === 'CHRONIC / PERSISTENT' ? undefined : '4, 4',
      });

      // 2. Draw Center Marker Pin with Hotspot ID and Total Activities Badge
      const markerHtml = `
        <div style="position: relative; cursor: pointer; transform: ${
          isSelected ? 'scale(1.2)' : 'scale(1)'
        }; transition: transform 0.2s;">
          <div style="
            background-color: ${hs.recurrenceColor};
            color: #ffffff;
            padding: 3px 6px;
            border-radius: 6px;
            border: 2px solid #ffffff;
            box-shadow: 0 3px 8px rgba(0,0,0,0.4);
            font-size: 10px;
            font-family: ui-monospace, monospace;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
          ">
            <span>${hs.hotspotId}</span>
            <span style="background: rgba(255,255,255,0.25); padding: 1px 4px; border-radius: 4px;">
              ${hs.totalActivities}
            </span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'hotspot-custom-marker',
        html: markerHtml,
        iconSize: [85, 26],
        iconAnchor: [42, 13],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Detailed Interactive Leaflet Popup with all mandatory requirements
      const popupHtml = `
        <div style="padding: 12px; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; min-width: 250px; max-width: 300px;">
          <!-- Top Row: Hotspot ID & Recurrence Badge -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <span style="font-family: ui-monospace, monospace; font-weight: 800; font-size: 12px; color: #0F172A;">
              ${hs.hotspotId}
            </span>
            <span style="font-size: 9px; font-family: ui-monospace, monospace; font-weight: 800; padding: 2px 6px; border-radius: 9999px; background: ${hs.recurrenceColor}15; color: ${hs.recurrenceColor}; border: 1px solid ${hs.recurrenceColor}40;">
              ${hs.recurrenceIndicator}
            </span>
          </div>

          <!-- Location Name & Zone -->
          <div style="font-size: 13px; font-weight: 800; color: #0F172A; line-height: 1.3; margin-bottom: 2px;">
            ${hs.name}
          </div>
          <div style="font-size: 10px; color: #64748B; font-mono; margin-bottom: 8px;">
            📍 ${hs.coastalZone} (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)
          </div>

          <!-- Key Metrics Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: #F8FAFC; padding: 8px; border-radius: 8px; border: 1px solid #E2E8F0; margin-bottom: 8px; font-size: 11px;">
            <div>
              <span style="font-size: 9px; color: #64748B; text-transform: uppercase; display: block; font-weight: 600;">Reports</span>
              <strong style="color: #0F172A; font-size: 13px;">${hs.reportCount}</strong>
            </div>
            <div>
              <span style="font-size: 9px; color: #64748B; text-transform: uppercase; display: block; font-weight: 600;">Cleanups</span>
              <strong style="color: #0F172A; font-size: 13px;">${hs.cleanupCount}</strong>
            </div>
            <div>
              <span style="font-size: 9px; color: #64748B; text-transform: uppercase; display: block; font-weight: 600;">Dominant Type</span>
              <strong style="color: #0F172A; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">
                ${hs.dominantPollutionType}
              </strong>
            </div>
            <div>
              <span style="font-size: 9px; color: #64748B; text-transform: uppercase; display: block; font-weight: 600;">Avg Severity</span>
              <strong style="color: ${hs.recurrenceColor}; font-size: 11px;">
                ${hs.averageSeverityScore} / 4.0 (${hs.averageSeverityLabel})
              </strong>
            </div>
          </div>

          <!-- Most Recent Activity -->
          <div style="font-size: 10px; color: #475569; display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span>Most Recent Activity:</span>
            <span style="font-family: ui-monospace, monospace; font-weight: 700; color: #0F172A;">
              ${hs.mostRecentActivityDate ? `${hs.mostRecentActivityDate} (${hs.mostRecentActivityRelative})` : 'None'}
            </span>
          </div>

          <div style="font-size: 9px; color: #94A3B8; font-style: italic;">
            Configured Radius: ${radiusMeters}m spatial buffer
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        setSelectedHotspotId(hs.hotspotId);
      });

      radiusCirclesLayerRef.current?.addLayer(circle);
      hotspotsLayerRef.current?.addLayer(marker);
    });
  }, [calculatedHotspots, radiusMeters, selectedHotspotId]);

  // Center map on specific hotspot
  const handleFocusHotspot = (hs: CalculatedHotspot) => {
    setSelectedHotspotId(hs.hotspotId);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(hs.coordinates, 14, { duration: 1.0 });
    }
  };

  // Export ranked table to CSV
  const handleExportCSV = () => {
    const headers =
      'Hotspot_ID,Location_Name,Coastal_Zone,Latitude,Longitude,Number_Of_Reports,Number_Of_Cleanups,Total_Activities,Dominant_Pollution_Type,Average_Severity,Most_Recent_Activity,Recurrence_Indicator,Waste_Collected_Kg,Preventive_Score\n';

    const rows = displayedHotspots
      .map(
        (hs) =>
          `"${hs.hotspotId}","${hs.name}","${hs.coastalZone}",${hs.coordinates[0]},${hs.coordinates[1]},${hs.reportCount},${hs.cleanupCount},${hs.totalActivities},"${hs.dominantPollutionType}",${hs.averageSeverityScore},"${hs.mostRecentActivityDate}","${hs.recurrenceIndicator}",${hs.totalWasteCollectedKg},${hs.preventiveScore}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `recurring-pollution-hotspots-r${radiusMeters}m-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      
      {/* 1. MANDATORY BANNER & FEATURE NAME */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-900/80 text-amber-300 border border-amber-700 uppercase tracking-widest flex items-center gap-1.5">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>Deterministic Spatial Analysis</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Route: /hotspots
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Recurring Pollution Hotspot Analysis
            </h1>

            {/* Exact Required Scientific Explanation */}
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              This is a transparent, data-driven geographic analysis. A hotspot is an area where repeated pollution reports or cleanup activity occurs within a configurable geographic radius and time period.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('/prevention')}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Prevention Framework &rarr;</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Hotspots CSV</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/map')}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>View Full Coastal Map &rarr;</span>
            </button>
          </div>
        </div>

        {/* Algorithm Transparency & Anti-AI Disclaimer Box */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 text-[11px] text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <strong className="text-white">Rule-Based Spatial Methodology (Non-Black-Box):</strong>{' '}
            No machine learning or synthetic generative models are utilized. Every hotspot is calculated deterministically via Haversine great-circle distance equations from empirical ground truth records. Hotspot recurrence and priority reflect verifiable frequency, severity weighting (1.0–4.0 scale), and temporal recurrence.
          </div>
        </div>
      </div>

      {/* 2. CONFIGURABLE GEOGRAPHIC RADIUS & TIME WINDOW CONTROLS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-600" />
              <span>Configurable Hotspot Clustering Parameters</span>
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              Adjust spatial detection radius and temporal observation window to identify localized micro-coves versus regional beach corridors.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span>Buffer Radius:</span>
            <span className="text-teal-700 text-sm">{radiusMeters} Meters</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Configurable Radius Slider & Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span>Geographic Radius (Meters)</span>
              </label>
              <span className="font-mono text-slate-500 text-[11px]">
                Range: 100m – 2000m
              </span>
            </div>

            <input
              type="range"
              min="100"
              max="2000"
              step="50"
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(Number(e.target.value))}
              className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-mono text-slate-400">Presets:</span>
              {[250, 500, 750, 1000, 1500].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRadiusMeters(preset)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all cursor-pointer border ${
                    radiusMeters === preset
                      ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {preset}m {preset === 500 ? '(Default)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Configurable Time Period Window */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span>Observation Time Period</span>
              </label>
              <span className="font-mono text-slate-500 text-[11px]">
                {timeWindowDays === 0 ? 'Full Longitudinal Dataset' : `Last ${timeWindowDays} Days`}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {[
                { label: 'All Time', days: 0 },
                { label: '90 Days', days: 90 },
                { label: '180 Days', days: 180 },
                { label: '1 Year', days: 365 },
                { label: '3 Years', days: 1095 },
              ].map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setTimeWindowDays(opt.days)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer text-center border truncate ${
                    timeWindowDays === opt.days
                      ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Filters recurring activity within the specified chronological duration prior to current date.
            </p>
          </div>
        </div>
      </div>

      {/* 3. HOTSPOT MAP (Interactive Leaflet with Radius Overlay & 센터 Pins) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-0">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-teal-600" />
              <span>Hotspot Geographic Cartography (Radius: {radiusMeters}m)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Circular buffer zones visualize the {radiusMeters}m spatial capture area surrounding each shoreline accumulation anchor.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              <span>Chronic (&ge;7)</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-orange-50 text-orange-800 border border-orange-200 text-[10px] font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <span>Frequent (4–6)</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Episodic (2–3)</span>
            </span>
          </div>
        </div>

        {/* Map Canvas */}
        <div className="relative w-full h-[420px] bg-slate-100">
          <div ref={mapContainerRef} className="w-full h-full z-0 cursor-grab active:cursor-grabbing" />

          {/* Quick Floating Zoom Controls */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => mapInstanceRef.current?.zoomIn()}
              className="w-8 h-8 rounded-lg bg-white/95 hover:bg-slate-50 text-slate-800 flex items-center justify-center border border-slate-200 cursor-pointer shadow-xs transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => mapInstanceRef.current?.zoomOut()}
              className="w-8 h-8 rounded-lg bg-white/95 hover:bg-slate-50 text-slate-800 flex items-center justify-center border border-slate-200 cursor-pointer shadow-xs transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. RANKED TABLE CONTROLS & SEARCH */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-0">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-600" />
              <span>Ranked Recurring Hotspots Table ({displayedHotspots.length} Zones)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked deterministically by composite preventive priority score based on frequency, recurrence, and severity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by beach, ID or type..."
                className="w-full py-1.5 pl-8 pr-3 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
              />
            </div>

            {/* Recurrence Filter */}
            <select
              value={filterRecurrence}
              onChange={(e) => setFilterRecurrence(e.target.value)}
              className="py-1.5 px-2.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
            >
              <option value="all">All Recurrence Tiers</option>
              <option value="CHRONIC / PERSISTENT">Chronic / Persistent</option>
              <option value="FREQUENT / RECURRING">Frequent / Recurring</option>
              <option value="EPISODIC / EMERGING">Episodic / Emerging</option>
              <option value="ISOLATED">Isolated Activity</option>
            </select>
          </div>
        </div>

        {/* 5. MANDATORY RANKED HOTSPOT TABLE (All required fields displayed) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-mono text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th
                  onClick={() => handleSort('preventiveScore')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/80 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Rank &amp; ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                <th className="py-3 px-3 whitespace-nowrap">Location &amp; Coordinates</th>

                <th className="py-3 px-3 whitespace-nowrap">Recurrence Indicator</th>

                <th
                  onClick={() => handleSort('reportCount')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/80 transition-colors whitespace-nowrap text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Reports</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('cleanupCount')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/80 transition-colors whitespace-nowrap text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Cleanups</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                <th className="py-3 px-3 whitespace-nowrap">Dominant Pollution Type</th>

                <th
                  onClick={() => handleSort('averageSeverityScore')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/80 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Average Severity</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                <th className="py-3 px-3 whitespace-nowrap">Most Recent Activity</th>

                <th className="py-3 px-3 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayedHotspots.map((hs, rankIndex) => {
                const isSelected = selectedHotspotId === hs.hotspotId;

                return (
                  <tr
                    key={hs.hotspotId}
                    className={`transition-colors ${
                      isSelected ? 'bg-teal-50/70 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Rank & Hotspot ID */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 font-mono text-[10px] font-black flex items-center justify-center">
                          {rankIndex + 1}
                        </span>
                        <div>
                          <span className="font-mono font-black text-xs text-teal-900 block">
                            {hs.hotspotId}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">
                            Score: {hs.preventiveScore}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">
                          {hs.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {hs.coastalZone} · {hs.coordinates[0].toFixed(4)}°N, {hs.coordinates[1].toFixed(4)}°E
                        </span>
                      </div>
                    </td>

                    {/* Recurrence Indicator */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase border inline-flex items-center gap-1"
                        style={{
                          backgroundColor: `${hs.recurrenceColor}15`,
                          color: hs.recurrenceColor,
                          borderColor: `${hs.recurrenceColor}40`,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: hs.recurrenceColor }}
                        />
                        <span>{hs.recurrenceIndicator}</span>
                      </span>
                    </td>

                    {/* Number of Reports */}
                    <td className="py-3 px-3 font-mono font-bold text-center text-slate-900 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {hs.reportCount}
                      </span>
                    </td>

                    {/* Number of Cleanups */}
                    <td className="py-3 px-3 font-mono font-bold text-center text-slate-900 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800">
                        {hs.cleanupCount}
                      </span>
                    </td>

                    {/* Dominant Pollution Type */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 block text-xs truncate max-w-[170px]" title={hs.dominantPollutionType}>
                        {hs.dominantPollutionType}
                      </span>
                      {hs.totalWasteCollectedKg > 0 && (
                        <span className="text-[10px] font-mono text-slate-400">
                          {hs.totalWasteCollectedKg.toLocaleString()} kg cleared
                        </span>
                      )}
                    </td>

                    {/* Average Severity */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            hs.averageSeverityLabel === 'CRITICAL'
                              ? 'bg-rose-600'
                              : hs.averageSeverityLabel === 'HIGH'
                              ? 'bg-orange-500'
                              : hs.averageSeverityLabel === 'MODERATE'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <span className="font-mono font-bold text-slate-800">
                          {hs.averageSeverityScore}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({hs.averageSeverityLabel})
                        </span>
                      </div>
                    </td>

                    {/* Most Recent Activity */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                      {hs.mostRecentActivityDate ? (
                        <div>
                          <span className="text-slate-800 font-semibold block">
                            {hs.mostRecentActivityDate}
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            {hs.mostRecentActivityRelative}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No activity</span>
                      )}
                    </td>

                    {/* Action: Center on Map */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleFocusHotspot(hs)}
                        className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-bold transition-colors cursor-pointer border border-teal-200 flex items-center gap-1 ml-auto"
                      >
                        <MapPin className="w-3 h-3 text-teal-600" />
                        <span>Map Focus</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. INTEGRATED DATA-INFORMED PREVENTION RECOMMENDATIONS SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-widest flex items-center gap-1">
                <Lightbulb className="w-3 h-3 text-amber-700" />
                <span>Transparent Rule Engine</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Rule-Based Intervention Proposals
              </span>
            </div>

            <h2 className="text-lg font-black text-slate-900 mt-1">
              Data-Informed Prevention Recommendations for Recurring Hotspots
            </h2>

            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
              For recurring hotspots, rule-based recommendations link empirical observation patterns (e.g. repeated plastic flotsam, weekend footfall spikes, fishing gear entrapment, drainage runoff) to targeted preventive actions.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/prevention')}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs self-start md:self-auto shrink-0"
          >
            <span>Open Full Prevention Hub (/prevention) &rarr;</span>
          </button>
        </div>

        {/* Selected Hotspot Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-700">Filter Hotspot Recommendations:</span>
          <button
            type="button"
            onClick={() => setSelectedHotspotId(null)}
            className={`px-3 py-1 rounded-lg text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
              selectedHotspotId === null
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            All Hotspots ({calculatedHotspots.length})
          </button>

          {calculatedHotspots.slice(0, 6).map((hs) => (
            <button
              key={hs.hotspotId}
              type="button"
              onClick={() => setSelectedHotspotId(hs.hotspotId)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-colors cursor-pointer truncate max-w-[180px] ${
                selectedHotspotId === hs.hotspotId
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {hs.hotspotId}: {hs.name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Recommendations Cards Feed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {calculatedHotspots
            .filter((hs) => !selectedHotspotId || hs.hotspotId === selectedHotspotId)
            .flatMap((hs) => {
              const hotspotInput: any = {
                hotspotId: hs.hotspotId,
                name: hs.name,
                coastalZone: hs.coastalZone,
                coordinates: hs.coordinates,
                reportCount: hs.reportCount,
                cleanupCount: hs.cleanupCount,
                totalActivities: hs.totalActivities,
                dominantPollutionType: hs.dominantPollutionType,
                averageSeverityScore: hs.averageSeverityScore,
                recurrenceIndicator: hs.recurrenceIndicator,
                associatedReports: hs.associatedReports,
                associatedCleanups: hs.associatedCleanups,
              };
              return generateHotspotRecommendations(hotspotInput);
            })
            .map((rec) => (
              <div
                key={rec.id}
                className="bg-slate-50/70 rounded-xl border border-slate-200 p-4 space-y-3 hover:border-slate-300 transition-colors"
              >
                {/* Header */}
                <div className="flex items-center justify-between text-xs border-b border-slate-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-100 text-teal-900 border border-teal-300">
                      {rec.label}
                    </span>
                    <span className="font-bold text-slate-900 truncate max-w-[180px]">
                      {rec.locationName}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      rec.confidenceLevel === 'HIGH'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    Confidence: {rec.confidenceLevel}
                  </span>
                </div>

                {/* Structured 3 Fields */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                      Observed Pattern
                    </span>
                    <strong className="text-slate-900 font-bold block">
                      {rec.observedPattern}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                      Evidence
                    </span>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      {rec.evidence}
                    </p>
                  </div>

                  <div className="bg-teal-50/70 p-2.5 rounded-lg border border-teal-200/80">
                    <span className="text-[10px] font-mono font-bold text-teal-800 uppercase block">
                      Recommended Intervention
                    </span>
                    <p className="text-teal-950 font-bold text-xs mt-0.5 leading-relaxed">
                      {rec.recommendedIntervention}
                    </p>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 italic pt-1">
                  * Does not claim causation. Reflects empirical spatial recurrence.
                </div>
              </div>
            ))}
        </div>
      </div>

    </div>
  );
};
