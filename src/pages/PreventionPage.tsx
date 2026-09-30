import React, { useState, useEffect, useMemo } from 'react';
import { AppRoute } from '../types/navigation';
import { useIncidents } from '../context/IncidentContext';
import { subscribeToReports } from '../services/reportService';
import { listHistoricalCleanups } from '../services/historicalCleanupService';
import { ReportDoc, HistoricalCleanupDoc } from '../types/firestore';
import {
  generateHotspotRecommendations,
  DataInformedRecommendation,
  HotspotInputData,
} from '../services/preventionRuleService';
import {
  ShieldCheck,
  Filter,
  Download,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Trash2,
  Calendar,
  Anchor,
  Compass,
  ArrowRight,
  Eye,
  FileSpreadsheet,
  Info,
  MapPin,
  Clock,
  Send,
  Sliders,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface PreventionPageProps {
  onNavigate: (route: AppRoute) => void;
}

const VIZAG_ANCHORS = [
  { anchorId: 'RK-BEACH', name: 'Ramakrishna (RK) Beach Promenade', zone: 'Central Urban Shoreline', coords: [17.7155, 83.3285] as [number, number] },
  { anchorId: 'FISHING-HARBOUR', name: 'Visakhapatnam Fishing Harbour & Wharves', zone: 'Marine Port & Breakwater', coords: [17.6982, 83.3045] as [number, number] },
  { anchorId: 'RUSHIKONDA', name: 'Rushikonda Blue Flag Beach', zone: 'Northern Eco Zone', coords: [17.7818, 83.3855] as [number, number] },
  { anchorId: 'LAWSONS-BAY', name: "Lawson's Bay & Mangamaripeta Cove", zone: 'Artisanal Fishing Cove', coords: [17.732, 83.341] as [number, number] },
  { anchorId: 'TENNETI-PARK', name: 'Tenneti Park & Jodugullapalem Rocks', zone: 'Rocky Intertidal Escarpment', coords: [17.7475, 83.354] as [number, number] },
  { anchorId: 'SAGAR-NAGAR', name: 'Sagar Nagar Beach', zone: 'North-Central Shoreline', coords: [17.755, 83.356] as [number, number] },
  { anchorId: 'YARADA-BEACH', name: "Yarada Beach & Dolphin's Nose Cove", zone: 'South Headland Cove', coords: [17.6548, 83.2687] as [number, number] },
  { anchorId: 'BHEEMILI-ESTUARY', name: 'Bheemili Beach & Gosthani River Estuary', zone: 'Gosthani Estuary Confluence', coords: [17.892, 83.454] as [number, number] },
  { anchorId: 'GANGAVARAM-PORT', name: 'Gangavaram Coastal Basin', zone: 'South Industrial Coastal Basin', coords: [17.625, 83.238] as [number, number] },
  { anchorId: 'MEGHADRIGEDDA', name: 'Meghadrigedda Tidal Creek Outfall', zone: 'Estuary / Industrial Drain Basin', coords: [17.692, 83.242] as [number, number] },
];

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
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

export const PreventionPage: React.FC<PreventionPageProps> = ({ onNavigate }) => {
  const { reports: contextReports } = useIncidents();
  const [firestoreReports, setFirestoreReports] = useState<ReportDoc[]>([]);
  const [historicalCleanups, setHistoricalCleanups] = useState<HistoricalCleanupDoc[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [selectedHotspotFilter, setSelectedHotspotFilter] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedConfidence, setSelectedConfidence] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Radius for cluster analysis
  const [radiusMeters] = useState<number>(500);

  useEffect(() => {
    setIsLoading(true);
    const unsub = subscribeToReports(
      (data) => {
        setFirestoreReports(data);
        setIsLoading(false);
      },
      () => setIsLoading(false)
    );

    listHistoricalCleanups(500, 'REAL_HISTORICAL')
      .then((records) => {
        if (records) setHistoricalCleanups(records);
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

  // Generate recommendations across all hotspots
  const allRecommendations: DataInformedRecommendation[] = useMemo(() => {
    const list: DataInformedRecommendation[] = [];

    VIZAG_ANCHORS.forEach((anchor, idx) => {
      const [anchorLat, anchorLng] = anchor.coords;

      const matchedReports = allReports.filter((r) => {
        if (typeof r.latitude !== 'number' || typeof r.longitude !== 'number') return false;
        return getDistanceMeters(anchorLat, anchorLng, r.latitude, r.longitude) <= radiusMeters;
      });

      const matchedCleanups = historicalCleanups.filter((c) => {
        if (typeof c.latitude !== 'number' || typeof c.longitude !== 'number') return false;
        return getDistanceMeters(anchorLat, anchorLng, c.latitude!, c.longitude!) <= radiusMeters;
      });

      const totalActivities = matchedReports.length + matchedCleanups.length;
      if (totalActivities === 0) return;

      // Dominant type
      const typeFreq: Record<string, number> = {};
      matchedReports.forEach((r) => {
        const t = r.pollutionType || 'Plastic';
        typeFreq[t] = (typeFreq[t] || 0) + 1;
      });
      matchedCleanups.forEach((c) => {
        const t = c.predominantCategory || 'Plastic';
        typeFreq[t] = (typeFreq[t] || 0) + 1;
      });

      let dominantPollutionType = 'Plastic';
      let maxC = 0;
      Object.entries(typeFreq).forEach(([t, count]) => {
        if (count > maxC) {
          maxC = count;
          dominantPollutionType = t;
        }
      });

      // Avg severity
      let sSum = 0;
      matchedReports.forEach((r) => {
        sSum += r.severity === 'CRITICAL' ? 4 : r.severity === 'HIGH' ? 3 : 2;
      });
      matchedCleanups.forEach(() => {
        sSum += 2.5;
      });
      const avgSeverity = totalActivities > 0 ? sSum / totalActivities : 2.0;

      const hotspotData: HotspotInputData = {
        hotspotId: `HSP-VIZAG-${String(idx + 1).padStart(2, '0')}`,
        name: anchor.name,
        coastalZone: anchor.zone,
        coordinates: anchor.coords,
        reportCount: matchedReports.length,
        cleanupCount: matchedCleanups.length,
        totalActivities,
        dominantPollutionType,
        averageSeverityScore: Math.round(avgSeverity * 10) / 10,
        recurrenceIndicator: totalActivities >= 7 ? 'CHRONIC' : totalActivities >= 4 ? 'FREQUENT' : 'EPISODIC',
        associatedReports: matchedReports,
        associatedCleanups: matchedCleanups,
      };

      const recs = generateHotspotRecommendations(hotspotData);
      list.push(...recs);
    });

    return list;
  }, [allReports, historicalCleanups, radiusMeters]);

  // Filtered recommendations
  const filteredRecommendations = useMemo(() => {
    return allRecommendations.filter((rec) => {
      if (selectedHotspotFilter !== 'all' && rec.hotspotId !== selectedHotspotFilter) {
        return false;
      }
      if (selectedCategory !== 'all' && rec.category !== selectedCategory) {
        return false;
      }
      if (selectedConfidence !== 'all' && rec.confidenceLevel !== selectedConfidence) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchLoc = rec.locationName.toLowerCase().includes(q);
        const matchPattern = rec.observedPattern.toLowerCase().includes(q);
        const matchIntervention = rec.recommendedIntervention.toLowerCase().includes(q);
        const matchId = rec.hotspotId.toLowerCase().includes(q);
        if (!matchLoc && !matchPattern && !matchIntervention && !matchId) return false;
      }
      return true;
    });
  }, [allRecommendations, selectedHotspotFilter, selectedCategory, selectedConfidence, searchQuery]);

  // Export recommendations CSV
  const handleExportCSV = () => {
    const headers =
      'Hotspot_ID,Location,Category,Observed_Pattern,Evidence,Recommended_Intervention,Confidence_Level,Label\n';
    const rows = filteredRecommendations
      .map(
        (r) =>
          `"${r.hotspotId}","${r.locationName}","${r.category}","${r.observedPattern}","${r.evidence}","${r.recommendedIntervention}","${r.confidenceLevel}","${r.label}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `data-informed-prevention-recommendations-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      
      {/* 1. TOP BANNER */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-900 text-teal-300 border border-teal-700 uppercase tracking-widest">
                Preventive Coastal Action Framework
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Route: /prevention
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Data-Informed Prevention Interventions
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Transparent rule-based recommendations generated for recurring pollution hotspots. Every recommendation connects empirical observation patterns directly to targeted municipal and volunteer interventions.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Interventions CSV</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/hotspots')}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Hotspot Geographic Map &rarr;</span>
            </button>
          </div>
        </div>

        {/* Anti-Causation and Rule-Based Explanation */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 text-[11px] text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <strong className="text-white">Methodological Rule Tree (No Machine Learning):</strong>{' '}
            Recommendations are derived deterministically by evaluating recurrence frequency, waste stream composition, temporal weekend clustering, and geographic proximity to known hydrologic outfalls. These proposals reflect operational best practices and <strong>do not claim direct physical causation</strong>.
          </div>
        </div>
      </div>

      {/* 2. SUMMARY KPI ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">
            Total Active Proposals
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {allRecommendations.length}
          </span>
          <span className="text-[10px] font-mono text-teal-700 mt-0.5 block">
            Data-Informed Recommendations
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">
            High Confidence
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">
            {allRecommendations.filter((r) => r.confidenceLevel === 'HIGH').length}
          </span>
          <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
            High Empirical Evidence
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">
            Infrastructure / Bins
          </span>
          <span className="text-2xl font-black text-blue-700 mt-1 block">
            {allRecommendations.filter((r) => r.category === 'INFRASTRUCTURE').length}
          </span>
          <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
            Receptacle Placements
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">
            Targeted Hotspots
          </span>
          <span className="text-2xl font-black text-amber-700 mt-1 block">
            {new Set(allRecommendations.map((r) => r.hotspotId)).size}
          </span>
          <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
            Vizag Shoreline Coves
          </span>
        </div>
      </div>

      {/* 3. FILTER CONTROLS BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
            <Filter className="w-4 h-4 text-teal-600" />
            <span>Filter Recommendations</span>
          </div>

          <span className="text-[11px] font-mono text-slate-500">
            Showing <strong>{filteredRecommendations.length}</strong> of {allRecommendations.length} Proposals
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Search Query */}
          <div>
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
              Search Keywords
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search beach, pattern or action..."
              className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
            />
          </div>

          {/* Hotspot Dropdown */}
          <div>
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
              Target Hotspot
            </label>
            <select
              value={selectedHotspotFilter}
              onChange={(e) => setSelectedHotspotFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-600 truncate"
            >
              <option value="all">All Hotspot Zones</option>
              {VIZAG_ANCHORS.map((a, i) => (
                <option key={a.anchorId} value={`HSP-VIZAG-${String(i + 1).padStart(2, '0')}`}>
                  {`HSP-VIZAG-${String(i + 1).padStart(2, '0')}`} — {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Intervention Category Dropdown */}
          <div>
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
              Intervention Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
            >
              <option value="all">All Categories</option>
              <option value="INFRASTRUCTURE">Additional Waste Bins (Infrastructure)</option>
              <option value="AWARENESS">Signage &amp; Awareness (Targeted Outreach)</option>
              <option value="OPERATIONAL_SCHEDULE">Weekend Collection Frequency (Operations)</option>
              <option value="COMMUNITY_ENGAGEMENT">Fishing Community Engagement (Harbors)</option>
              <option value="INVESTIGATION">Drain / Entry Point Technical Audit</option>
              <option value="ENFORCEMENT">Enforcement &amp; Night Surveillance</option>
            </select>
          </div>

          {/* Confidence Level */}
          <div>
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
              Confidence Level
            </label>
            <select
              value={selectedConfidence}
              onChange={(e) => setSelectedConfidence(e.target.value)}
              className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
            >
              <option value="all">All Confidence Levels</option>
              <option value="HIGH">High Confidence (Strong Sample Size)</option>
              <option value="MODERATE">Moderate Confidence</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. RECOMMENDATIONS CARDS FEED */}
      <div className="space-y-4">
        {filteredRecommendations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
            <Lightbulb className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Recommendations Match Active Query</p>
            <p className="text-xs text-slate-400">
              Try adjusting the category filter, search query, or target hotspot selector.
            </p>
          </div>
        ) : (
          filteredRecommendations.map((rec) => {
            const isHighConfidence = rec.confidenceLevel === 'HIGH';

            return (
              <div
                key={rec.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-all space-y-4"
              >
                {/* Header Row: Label & Metadata */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Mandatory Label */}
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-100 text-teal-900 border border-teal-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-teal-600" />
                      <span>{rec.label}</span>
                    </span>

                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {rec.hotspotId}
                    </span>

                    <span className="text-xs font-bold text-slate-900">
                      {rec.locationName}
                    </span>

                    <span className="text-[10px] font-mono text-slate-400">
                      ({rec.coastalZone})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {/* Confidence Level Badge */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        isHighConfidence
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      Confidence: {rec.confidenceLevel}
                    </span>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold uppercase">
                      {rec.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Core 4-Box Structured Content */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                  
                  {/* Box 1: Observed Pattern */}
                  <div className="md:col-span-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                      1. Observed Pattern
                    </span>
                    <strong className="text-sm font-black text-slate-900 block leading-tight">
                      {rec.observedPattern}
                    </strong>
                    <span className="text-[10px] text-slate-400 font-mono block pt-1">
                      Trigger: {rec.ruleTrigger}
                    </span>
                  </div>

                  {/* Box 2: Evidence */}
                  <div className="md:col-span-4 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                      2. Empirical Evidence
                    </span>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      {rec.evidence}
                    </p>
                  </div>

                  {/* Box 3: Recommended Intervention */}
                  <div className="md:col-span-5 bg-teal-50/50 p-3.5 rounded-xl border border-teal-200 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-teal-800 uppercase tracking-wider block">
                      3. Recommended Intervention
                    </span>
                    <p className="text-xs text-teal-950 font-bold leading-relaxed">
                      {rec.recommendedIntervention}
                    </p>
                  </div>

                </div>

                {/* Footer: Non-Causation Disclaimer & Action Links */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-500">
                  <span className="italic text-slate-400">
                    * Data-informed proposal. Reflects observed debris recurrence without asserting direct physical causation.
                  </span>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => onNavigate('/hotspots')}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <MapPin className="w-3.5 h-3.5 text-teal-600" />
                      <span>Inspect Hotspot on Map</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigate('/assignments')}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Preventive Task</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
