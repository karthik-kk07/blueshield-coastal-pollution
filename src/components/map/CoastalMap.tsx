import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { PollutionReport, Hotspot, EntryPoint } from '../../types/pollution';
import { Layers, Crosshair, ZoomIn, ZoomOut, RefreshCw, Compass, MapPin } from 'lucide-react';

// Prominent Visakhapatnam Coastal Landmarks
export interface VizagLandmark {
  name: string;
  category: 'Popular Beach' | 'Eco Beach (Blue Flag)' | 'Marine Port & Harbour' | 'Scenic Cliff / Rocks' | 'Estuary / Confluence';
  coordinates: [number, number];
  description: string;
}

export const VIZAG_LANDMARKS: VizagLandmark[] = [
  {
    name: 'Ramakrishna (RK) Beach & Submarine Museum',
    category: 'Popular Beach',
    coordinates: [17.7155, 83.3285],
    description: 'Premier civic beach promenade facing INS Kursura Submarine Museum and Kali Temple ghats.',
  },
  {
    name: 'Rushikonda Blue Flag Beach',
    category: 'Eco Beach (Blue Flag)',
    coordinates: [17.7818, 83.3855],
    description: 'Internationally certified Blue Flag eco-beach & water sports hub nestled between green hills.',
  },
  {
    name: 'Visakhapatnam Fishing Harbour & Wharves',
    category: 'Marine Port & Harbour',
    coordinates: [17.6982, 83.3045],
    description: 'Active hub for 800+ mechanized trawlers, traditional crafts, and port breakwaters.',
  },
  {
    name: 'Yarada Beach & Dolphin\'s Nose Headland',
    category: 'Popular Beach',
    coordinates: [17.6548, 83.2687],
    description: 'Pristine cove framed by Dolphin\'s Nose lighthouse hills with natural intertidal rock barriers.',
  },
  {
    name: 'Lawson\'s Bay Beach & Mangamaripeta',
    category: 'Popular Beach',
    coordinates: [17.7320, 83.3410],
    description: 'Traditional artisanal fishing cove with calm shallow waters and catamarans.',
  },
  {
    name: 'Tenneti Park & Coastal Rocks',
    category: 'Scenic Cliff / Rocks',
    coordinates: [17.7475, 83.3540],
    description: 'Elevated scenic park and rugged rocky shoreline popular with tourists and morning walkers.',
  },
  {
    name: 'Sagar Nagar Beach',
    category: 'Popular Beach',
    coordinates: [17.7550, 83.3560],
    description: 'Long sandy beach along the Vizag-Bheemili coastal road.',
  },
  {
    name: 'Bheemili Beach & Gosthani River Estuary',
    category: 'Estuary / Confluence',
    coordinates: [17.8920, 83.4540],
    description: 'Historical Dutch settlement shoreline where the Gosthani River empties into the Bay of Bengal.',
  },
  {
    name: 'Gangavaram Port & Beach',
    category: 'Marine Port & Harbour',
    coordinates: [17.6250, 83.2380],
    description: 'Deep-water private port facility and adjacent rural fishing shoreline in South Vizag.',
  },
  {
    name: 'Meghadrigedda Creek / Industrial Basin',
    category: 'Estuary / Confluence',
    coordinates: [17.6920, 83.2420],
    description: 'Major drainage and tidal creek passing industrial clusters into inner harbour waters.',
  },
];

interface CoastalMapProps {
  reports?: PollutionReport[];
  hotspots?: Hotspot[];
  entryPoints?: EntryPoint[];
  selectedReportId?: string | null;
  onSelectReport?: (report: PollutionReport) => void;
  onPickCoordinates?: (lat: number, lng: number) => void;
  pickMode?: boolean;
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
  showQuickJumps?: boolean;
}

export const CoastalMap: React.FC<CoastalMapProps> = ({
  reports = [],
  hotspots = [],
  entryPoints = [],
  selectedReportId,
  onSelectReport,
  onPickCoordinates,
  pickMode = false,
  center = [17.7250, 83.3300], // Visakhapatnam Coast default
  zoom = 12,
  height = '520px',
  className = '',
  showQuickJumps = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const hotspotsLayerRef = useRef<L.LayerGroup | null>(null);
  const entryPointsLayerRef = useRef<L.LayerGroup | null>(null);
  const landmarksLayerRef = useRef<L.LayerGroup | null>(null);
  const pickedMarkerRef = useRef<L.Marker | null>(null);

  const [activeLayers, setActiveLayers] = useState({
    incidents: true,
    hotspots: true,
    entryPoints: true,
    landmarks: true,
  });

  const [pickedCoord, setPickedCoord] = useState<{ lat: number; lng: number } | null>(null);

  // Initialize Map with Visakhapatnam as default center
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: false,
    });

    // Standard OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors | Visakhapatnam Coastal Cartography',
    }).addTo(map);

    const landmarksLayer = L.layerGroup().addTo(map);
    const markersLayer = L.layerGroup().addTo(map);
    const hotspotsLayer = L.layerGroup().addTo(map);
    const entryPointsLayer = L.layerGroup().addTo(map);

    landmarksLayerRef.current = landmarksLayer;
    markersLayerRef.current = markersLayer;
    hotspotsLayerRef.current = hotspotsLayer;
    entryPointsLayerRef.current = entryPointsLayer;
    mapInstanceRef.current = map;

    // Handle coordinate pick clicks
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setPickedCoord({ lat, lng });

      if (pickedMarkerRef.current) {
        pickedMarkerRef.current.setLatLng([lat, lng]);
      } else {
        const pinIcon = L.divIcon({
          className: 'custom-pin-icon',
          html: `
            <div style="background-color: #0B2545; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.4); border: 2px solid #14B8A6;">
              <span style="font-size: 14px; font-weight: bold;">+</span>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        const marker = L.marker([lat, lng], { icon: pinIcon }).addTo(map);
        pickedMarkerRef.current = marker;
      }

      if (onPickCoordinates) {
        onPickCoordinates(Number(lat.toFixed(5)), Number(lng.toFixed(5)));
      }
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Visakhapatnam Landmarks Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !landmarksLayerRef.current) return;
    landmarksLayerRef.current.clearLayers();

    if (!activeLayers.landmarks) return;

    VIZAG_LANDMARKS.forEach((lm) => {
      const isBlueFlag = lm.category.includes('Blue Flag');
      const isPort = lm.category.includes('Port');
      const isEstuary = lm.category.includes('Estuary');

      const badgeColor = isBlueFlag ? '#0284C7' : isPort ? '#475569' : isEstuary ? '#0D9488' : '#0B2545';
      const symbol = isBlueFlag ? '★' : isPort ? '⚓' : isEstuary ? '〰' : '🏖';

      const iconHtml = `
        <div style="
          background-color: ${badgeColor}; 
          color: white; 
          padding: 3px 6px; 
          border-radius: 4px; 
          display: inline-flex; 
          align-items: center; 
          gap: 4px; 
          border: 1.5px solid white; 
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          font-size: 10px;
          font-weight: 600;
          white-space: nowrap;
          font-family: system-ui, -apple-system, sans-serif;
        ">
          <span>${symbol}</span>
          <span>${lm.name.split('&')[0].trim()}</span>
        </div>
      `;

      const landmarkIcon = L.divIcon({
        className: 'vizag-landmark-tag',
        html: iconHtml,
        iconSize: [120, 22],
        iconAnchor: [60, 11],
      });

      const marker = L.marker(lm.coordinates, { icon: landmarkIcon });

      const popupContent = `
        <div style="padding: 10px; font-family: 'Plus Jakarta Sans', sans-serif; max-width: 240px;">
          <div style="font-size: 10px; font-weight: 700; color: #0D9488; text-transform: uppercase; margin-bottom: 2px;">
            ${lm.category} · Visakhapatnam
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #0F172A; margin-bottom: 4px;">
            ${lm.name}
          </div>
          <p style="font-size: 11px; color: #475569; margin: 0; line-height: 1.35;">
            ${lm.description}
          </p>
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #E2E8F0; font-size: 10px; font-family: monospace; color: #64748B;">
            Coordinates: ${lm.coordinates[0].toFixed(4)}° N, ${lm.coordinates[1].toFixed(4)}° E
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      landmarksLayerRef.current?.addLayer(marker);
    });
  }, [activeLayers.landmarks]);

  // Update Incident Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    if (!activeLayers.incidents) return;

    reports.forEach((rep) => {
      const isSelected = selectedReportId === rep.id;
      const severityColor =
        rep.severity === 'critical'
          ? '#DC2626'
          : rep.severity === 'high'
          ? '#D97706'
          : rep.status === 'remediated'
          ? '#16A34A'
          : '#0D9488';

      const iconHtml = `
        <div style="
          background-color: ${severityColor}; 
          color: white; 
          width: ${isSelected ? '32px' : '24px'}; 
          height: ${isSelected ? '32px' : '24px'}; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          border: 2px solid white; 
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          font-size: ${isSelected ? '12px' : '10px'};
          font-weight: 700;
          transition: transform 0.15s ease;
        ">
          ${rep.severity === 'critical' ? '!' : '●'}
        </div>
      `;

      const markerIcon = L.divIcon({
        className: 'incident-marker-icon',
        html: iconHtml,
        iconSize: isSelected ? [32, 32] : [24, 24],
        iconAnchor: isSelected ? [16, 16] : [12, 12],
      });

      const marker = L.marker([rep.location.latitude, rep.location.longitude], {
        icon: markerIcon,
      });

      const popupHtml = `
        <div style="padding: 12px; font-family: 'Plus Jakarta Sans', sans-serif; min-width: 220px;">
          <div style="font-size: 10px; font-family: monospace; color: #0284C7; margin-bottom: 2px; font-weight: 600;">
            ${rep.trackingCode} · ${rep.wasteCategory.replace('_', ' ').toUpperCase()}
          </div>
          <div style="font-size: 13px; font-weight: 600; color: #0F172A; line-height: 1.3; margin-bottom: 6px;">
            ${rep.title}
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 8px;">
            📍 ${rep.location.coastalZoneName}
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #E2E8F0; padding-top: 6px; font-size: 11px;">
            <span style="font-weight: 600; color: ${severityColor}; text-transform: uppercase;">
              ${rep.severity}
            </span>
            <span style="color: #64748B;">
              ${rep.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        if (onSelectReport) onSelectReport(rep);
      });

      markersLayerRef.current?.addLayer(marker);
    });
  }, [reports, selectedReportId, activeLayers.incidents, onSelectReport]);

  // Update Hotspot Circles (Visakhapatnam Coastline)
  useEffect(() => {
    if (!mapInstanceRef.current || !hotspotsLayerRef.current) return;
    hotspotsLayerRef.current.clearLayers();

    if (!activeLayers.hotspots) return;

    hotspots.forEach((hs) => {
      const circle = L.circle(hs.centerCoordinates, {
        color: hs.vulnerabilityIndex === 'severe' ? '#DC2626' : '#D97706',
        fillColor: hs.vulnerabilityIndex === 'severe' ? '#DC2626' : '#D97706',
        fillOpacity: 0.16,
        radius: 900, // 900m coastal impact zone
        weight: 1.5,
      });

      circle.bindTooltip(`<strong>Vizag Hotspot:</strong> ${hs.name} (${hs.vulnerabilityIndex.toUpperCase()} vulnerability)`, {
        permanent: false,
        direction: 'top',
      });

      hotspotsLayerRef.current?.addLayer(circle);
    });
  }, [hotspots, activeLayers.hotspots]);

  // Update Entry Points
  useEffect(() => {
    if (!mapInstanceRef.current || !entryPointsLayerRef.current) return;
    entryPointsLayerRef.current.clearLayers();

    if (!activeLayers.entryPoints) return;

    entryPoints.forEach((ep) => {
      const epIcon = L.divIcon({
        className: 'entry-point-icon',
        html: `
          <div style="background-color: #0369A1; color: white; width: 20px; height: 20px; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; border: 1.5px solid white;">
            ▼
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker(ep.coordinates, { icon: epIcon });
      marker.bindTooltip(`<strong>Outfall Drainage:</strong> ${ep.name}`, { direction: 'top' });
      entryPointsLayerRef.current?.addLayer(marker);
    });
  }, [entryPoints, activeLayers.entryPoints]);

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetView = () => mapInstanceRef.current?.setView([17.7250, 83.3300], 12);

  const flyToLocation = (coords: [number, number], zoomLevel = 14) => {
    mapInstanceRef.current?.flyTo(coords, zoomLevel, { duration: 1.2 });
  };

  return (
    <div className={`relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 ${className}`}>
      {/* Quick Fly-To Visakhapatnam Coastal Zones Header */}
      {showQuickJumps && (
        <div className="bg-[#05192D] text-white px-3 py-2 flex items-center justify-between gap-2 overflow-x-auto text-xs border-b border-slate-800">
          <div className="flex items-center gap-1.5 shrink-0 text-teal-400 font-semibold text-[11px] uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            <span>Vizag Coastal Sectors:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
            <button
              onClick={() => flyToLocation([17.7155, 83.3285], 15)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-teal-700 text-white font-medium text-[11px] whitespace-nowrap transition-colors"
            >
              RK Beach
            </button>
            <button
              onClick={() => flyToLocation([17.7818, 83.3855], 15)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-teal-700 text-white font-medium text-[11px] whitespace-nowrap transition-colors"
            >
              Rushikonda (Blue Flag)
            </button>
            <button
              onClick={() => flyToLocation([17.6982, 83.3045], 15)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-teal-700 text-white font-medium text-[11px] whitespace-nowrap transition-colors"
            >
              Fishing Harbour
            </button>
            <button
              onClick={() => flyToLocation([17.6548, 83.2687], 14)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-teal-700 text-white font-medium text-[11px] whitespace-nowrap transition-colors"
            >
              Yarada Beach
            </button>
            <button
              onClick={() => flyToLocation([17.7475, 83.3540], 15)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-teal-700 text-white font-medium text-[11px] whitespace-nowrap transition-colors"
            >
              Tenneti Park
            </button>
            <button
              onClick={() => flyToLocation([17.8920, 83.4540], 14)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-teal-700 text-white font-medium text-[11px] whitespace-nowrap transition-colors"
            >
              Bheemili &amp; Gosthani
            </button>
            <button
              onClick={handleResetView}
              className="px-2 py-0.5 rounded bg-teal-600 hover:bg-teal-500 text-white font-semibold text-[11px] whitespace-nowrap transition-colors"
            >
              Full Vizag Coast
            </button>
          </div>
        </div>
      )}

      {/* Map DOM target */}
      <div ref={mapContainerRef} style={{ height, width: '100%' }} className="z-0" />

      {/* Floating Map Controls */}
      <div className="absolute top-12 sm:top-14 right-3 z-10 flex flex-col gap-1.5 shadow-sm">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-md border border-slate-200 transition-colors shadow-xs"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-md border border-slate-200 transition-colors shadow-xs"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          className="p-2 bg-white hover:bg-slate-50 text-slate-700 rounded-md border border-slate-200 transition-colors shadow-xs"
          title="Reset to Visakhapatnam Center"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Layer Toggles */}
      <div className="absolute top-12 sm:top-14 left-3 z-10 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-md p-2.5 shadow-md text-xs max-w-xs">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800 pb-1.5 border-b border-slate-100 mb-1.5">
          <Layers className="w-3.5 h-3.5 text-teal-600" />
          <span>Visakhapatnam Layers</span>
        </div>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={activeLayers.landmarks}
              onChange={(e) => setActiveLayers({ ...activeLayers, landmarks: e.target.checked })}
              className="rounded text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
            />
            <span className="font-medium text-slate-900">Vizag Landmarks ({VIZAG_LANDMARKS.length})</span>
          </label>
          <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={activeLayers.incidents}
              onChange={(e) => setActiveLayers({ ...activeLayers, incidents: e.target.checked })}
              className="rounded text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
            />
            <span>Pollution Reports ({reports.length})</span>
          </label>
          <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={activeLayers.hotspots}
              onChange={(e) => setActiveLayers({ ...activeLayers, hotspots: e.target.checked })}
              className="rounded text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
            />
            <span>Hotspots ({hotspots.length})</span>
          </label>
          <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={activeLayers.entryPoints}
              onChange={(e) => setActiveLayers({ ...activeLayers, entryPoints: e.target.checked })}
              className="rounded text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
            />
            <span>Outfall Drains ({entryPoints.length})</span>
          </label>
        </div>
      </div>

      {/* Pick Mode Coordinates Notice */}
      {pickMode && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-10 bg-[#0B2545] text-white px-3 py-2 rounded-md shadow-md text-xs flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-teal-400 shrink-0" />
          <span>
            {pickedCoord ? (
              <span className="font-mono">
                Pin: {pickedCoord.lat.toFixed(5)}° N, {pickedCoord.lng.toFixed(5)}° E (Vizag Coast)
              </span>
            ) : (
              <span>Click along the Visakhapatnam shoreline to pin exact incident coordinates</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
};
