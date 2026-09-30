import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, ExternalLink } from 'lucide-react';

interface ReportLocationMapProps {
  latitude: number;
  longitude: number;
  reportNumber: string;
  pollutionType: string;
  className?: string;
  heightClass?: string;
}

export const ReportLocationMap: React.FC<ReportLocationMapProps> = ({
  latitude,
  longitude,
  reportNumber,
  pollutionType,
  className = '',
  heightClass = 'h-52 sm:h-64',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      const pinIcon = L.divIcon({
        className: 'custom-static-pin',
        html: `
          <div style="
            position: relative;
            width: 34px;
            height: 34px;
            transform: translate(-50%, -100%);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 30px;
              height: 30px;
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
                width: 9px;
                height: 9px;
                background: #ffffff;
                border-radius: 50%;
                transform: rotate(45deg);
              "></div>
            </div>
            <div style="
              position: absolute;
              bottom: -3px;
              left: 50%;
              transform: translateX(-50%);
              width: 8px;
              height: 4px;
              background: rgba(0,0,0,0.3);
              border-radius: 50%;
            "></div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      });

      const marker = L.marker([latitude, longitude], { icon: pinIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-size: 12px; font-family: sans-serif; line-height: 1.4;">
          <strong>${reportNumber}</strong><br/>
          <span>${pollutionType}</span><br/>
          <span style="font-family: monospace; color: #475569;">${latitude.toFixed(5)}°N, ${longitude.toFixed(5)}°E</span>
        </div>
      `);

      mapInstanceRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    } else {
      mapInstanceRef.current.setView([latitude, longitude], 15);
    }

    return () => {
      // Map instance cleaned up on unmount
    };
  }, [latitude, longitude, reportNumber, pollutionType]);

  const openInOsm = () => {
    window.open(
      `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className={`relative w-full rounded-xl overflow-hidden border border-slate-300 shadow-xs bg-slate-100 ${className}`}>
      <div ref={mapContainerRef} className={`w-full ${heightClass} z-0`} />

      <div className="absolute top-2.5 right-2.5 z-10">
        <button
          type="button"
          onClick={openInOsm}
          title="Open in OpenStreetMap"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/95 hover:bg-white text-slate-800 text-[11px] font-semibold shadow-md border border-slate-200 transition-all cursor-pointer backdrop-blur-xs"
        >
          <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
          <span>Open OSM</span>
        </button>
      </div>

      <div className="absolute bottom-2 left-2 z-10 bg-slate-950/80 text-white backdrop-blur-xs px-2.5 py-1 rounded text-[11px] font-mono flex items-center gap-1.5 shadow-sm">
        <MapPin className="w-3 h-3 text-teal-400 shrink-0" />
        <span>
          {latitude.toFixed(5)}&deg; N, {longitude.toFixed(5)}&deg; E
        </span>
      </div>
    </div>
  );
};
