import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Crosshair } from 'lucide-react';

interface LocationPickerMapProps {
  latitude: number;
  longitude: number;
  onChangeLocation: (lat: number, lng: number) => void;
  gpsStatus: 'idle' | 'requesting' | 'detected' | 'failed';
  onRequestGps: () => void;
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  latitude,
  longitude,
  onChangeLocation,
  gpsStatus,
  onRequestGps,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: 14,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Custom high-contrast hazard pin
      const pinIcon = L.divIcon({
        className: 'custom-hazard-pin',
        html: `
          <div style="
            position: relative;
            width: 36px;
            height: 36px;
            transform: translate(-50%, -100%);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 32px;
              height: 32px;
              background: #0D9488;
              border: 3px solid #ffffff;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 4px 10px rgba(0,0,0,0.35);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                width: 10px;
                height: 10px;
                background: #ffffff;
                border-radius: 50%;
                transform: rotate(45deg);
              "></div>
            </div>
            <div style="
              position: absolute;
              bottom: -4px;
              left: 50%;
              transform: translateX(-50%);
              width: 8px;
              height: 4px;
              background: rgba(0,0,0,0.3);
              border-radius: 50%;
            "></div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      const marker = L.marker([latitude, longitude], {
        icon: pinIcon,
        draggable: true,
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChangeLocation(Number(pos.lat.toFixed(5)), Number(pos.lng.toFixed(5)));
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        const newLat = Number(lat.toFixed(5));
        const newLng = Number(lng.toFixed(5));
        marker.setLatLng([newLat, newLng]);
        onChangeLocation(newLat, newLng);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Force render resize after container setup
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }

    return () => {
      // Keep map reference across re-renders
    };
  }, []);

  // Update marker position when coordinates prop changes externally (e.g. from GPS)
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (
        Math.abs(currentPos.lat - latitude) > 0.0001 ||
        Math.abs(currentPos.lng - longitude) > 0.0001
      ) {
        markerRef.current.setLatLng([latitude, longitude]);
        mapInstanceRef.current.panTo([latitude, longitude], { animate: true });
      }
    }
  }, [latitude, longitude]);

  const handleCenterOnMarker = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([latitude, longitude], 15, { animate: true });
    }
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-300 shadow-xs bg-slate-100">
      {/* Map canvas container with mobile-friendly touch height */}
      <div ref={mapContainerRef} className="w-full h-56 sm:h-64 z-0" />

      {/* Floating control buttons */}
      <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={onRequestGps}
          disabled={gpsStatus === 'requesting'}
          title="Detect Current GPS Location"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 hover:bg-white text-slate-800 text-xs font-semibold shadow-md border border-slate-200 transition-all cursor-pointer backdrop-blur-xs active:scale-95 disabled:opacity-60"
        >
          <Navigation className={`w-3.5 h-3.5 text-teal-600 ${gpsStatus === 'requesting' ? 'animate-spin' : ''}`} />
          <span>{gpsStatus === 'requesting' ? 'Locating...' : 'My Location'}</span>
        </button>

        <button
          type="button"
          onClick={handleCenterOnMarker}
          title="Re-center on selected pin"
          className="p-2 rounded-lg bg-white/95 hover:bg-white text-slate-700 shadow-md border border-slate-200 transition-all cursor-pointer active:scale-95"
        >
          <Crosshair className="w-3.5 h-3.5 text-slate-700" />
        </button>
      </div>

      {/* Bottom coordinate badge info */}
      <div className="absolute bottom-2 left-2 z-10 bg-slate-950/80 text-white backdrop-blur-xs px-2.5 py-1 rounded text-[11px] font-mono flex items-center gap-1.5 shadow-sm">
        <MapPin className="w-3 h-3 text-teal-400 shrink-0" />
        <span>
          {latitude.toFixed(5)}&deg; N, {longitude.toFixed(5)}&deg; E
        </span>
      </div>
    </div>
  );
};
