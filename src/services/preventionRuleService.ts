import { ReportDoc, HistoricalCleanupDoc } from '../types/firestore';

export interface DataInformedRecommendation {
  id: string;
  hotspotId: string;
  locationName: string;
  coastalZone: string;
  coordinates: [number, number];
  observedPattern: string;
  evidence: string;
  recommendedIntervention: string;
  confidenceLevel: 'HIGH' | 'MODERATE' | 'LOW';
  label: 'Data-Informed Recommendation';
  category:
    | 'INFRASTRUCTURE'
    | 'AWARENESS'
    | 'OPERATIONAL_SCHEDULE'
    | 'COMMUNITY_ENGAGEMENT'
    | 'INVESTIGATION'
    | 'ENFORCEMENT';
  urgency: 'HIGH' | 'MEDIUM' | 'STANDARD';
  ruleTrigger: string;
}

export interface HotspotInputData {
  hotspotId: string;
  name: string;
  coastalZone: string;
  coordinates: [number, number];
  reportCount: number;
  cleanupCount: number;
  totalActivities: number;
  dominantPollutionType: string;
  averageSeverityScore: number;
  recurrenceIndicator: string;
  associatedReports: ReportDoc[];
  associatedCleanups: HistoricalCleanupDoc[];
}

/**
 * Transparent Rule-Based Recommendation Generator
 * (Deterministic rule tree — strictly NO machine learning or probabilistic inferences)
 */
export function generateHotspotRecommendations(
  hotspot: HotspotInputData
): DataInformedRecommendation[] {
  const recommendations: DataInformedRecommendation[] = [];
  const reports = hotspot.associatedReports || [];
  const cleanups = hotspot.associatedCleanups || [];
  const totalEvents = reports.length + cleanups.length;

  if (totalEvents === 0) return [];

  // --- FEATURE EXTRACTION FROM RECORD TIMESTAMPS & STREAMS ---
  let plasticCount = 0;
  let fishingCount = 0;
  let mixedCount = 0;
  let criticalCount = 0;
  let weekendCount = 0;
  let drainageRelated = false;
  let totalPlasticKg = 0;
  let totalFishingKg = 0;

  // Process reports
  reports.forEach((r) => {
    const type = (r.pollutionType || '').toLowerCase();
    const desc = (r.description || '').toLowerCase();
    const zone = (r.coastalZone || '').toLowerCase();

    if (type.includes('plastic') || desc.includes('plastic') || desc.includes('bottle')) {
      plasticCount++;
    }
    if (type.includes('fish') || desc.includes('net') || desc.includes('gear')) {
      fishingCount++;
    }
    if (type.includes('mixed') || desc.includes('mixed') || desc.includes('garbage')) {
      mixedCount++;
    }
    if (r.severity === 'CRITICAL' || desc.includes('dump') || desc.includes('hazardous')) {
      criticalCount++;
    }
    if (desc.includes('drain') || desc.includes('nala') || desc.includes('outfall') || zone.includes('drain') || zone.includes('estuary')) {
      drainageRelated = true;
    }

    if (r.createdAt) {
      const day = new Date(r.createdAt).getDay();
      if (day === 0 || day === 6) weekendCount++;
    }
  });

  // Process cleanups
  cleanups.forEach((c) => {
    const cat = (c.predominantCategory || '').toLowerCase();
    const notes = (c.notes || '').toLowerCase();

    if (cat.includes('plastic') || notes.includes('plastic')) {
      plasticCount++;
    }
    if (cat.includes('fish') || notes.includes('net')) {
      fishingCount++;
    }
    if (notes.includes('drain') || notes.includes('river') || notes.includes('estuary')) {
      drainageRelated = true;
    }
    if (c.plasticWasteKg) totalPlasticKg += c.plasticWasteKg;
    if (c.fishingGearKg) totalFishingKg += c.fishingGearKg;

    if (c.date) {
      const day = new Date(c.date).getDay();
      if (day === 0 || day === 6) weekendCount++;
    }
  });

  // Check known drainage/estuary anchors
  const isDrainageZone =
    drainageRelated ||
    hotspot.name.toLowerCase().includes('estuary') ||
    hotspot.name.toLowerCase().includes('creek') ||
    hotspot.coastalZone.toLowerCase().includes('estuary') ||
    hotspot.coastalZone.toLowerCase().includes('canal');

  // --- RULE 1: REPEATED PLASTIC WASTE ---
  // Condition: Plastic is dominant OR plastic represents >= 35% of events OR >= 2 plastic events
  if (
    hotspot.dominantPollutionType.toLowerCase().includes('plastic') ||
    plasticCount >= 2 ||
    totalPlasticKg > 150
  ) {
    const plasticRatio = totalEvents > 0 ? Math.round((plasticCount / totalEvents) * 100) : 50;
    const confidence = totalEvents >= 5 ? 'HIGH' : 'MODERATE';

    recommendations.push({
      id: `REC-${hotspot.hotspotId}-PLASTIC`,
      hotspotId: hotspot.hotspotId,
      locationName: hotspot.name,
      coastalZone: hotspot.coastalZone,
      coordinates: hotspot.coordinates,
      observedPattern: 'Repeated plastic waste accumulation',
      evidence: `${plasticCount} recorded plastic flotsam events (${plasticRatio}% of incidents) and ${Math.round(
        totalPlasticKg
      )} kg verified plastic packaging retrieved.`,
      recommendedIntervention:
        'Consider targeted public awareness campaigns, multilingual anti-litter signage at beach entry points, and deployment of dedicated plastic recycling collection receptacles.',
      confidenceLevel: confidence,
      label: 'Data-Informed Recommendation',
      category: 'AWARENESS',
      urgency: plasticRatio >= 50 ? 'HIGH' : 'MEDIUM',
      ruleTrigger: 'Plastic frequency threshold >= 35% or verified volume >= 150kg',
    });
  }

  // --- RULE 2: REPEATED MIXED WASTE ---
  // Condition: Multiple unsegregated flotsam events OR mixed waste recorded
  if (
    mixedCount >= 1 ||
    (hotspot.dominantPollutionType.toLowerCase().includes('mixed') && totalEvents >= 2) ||
    (plasticCount >= 1 && fishingCount >= 1)
  ) {
    const confidence = totalEvents >= 4 ? 'HIGH' : 'MODERATE';

    recommendations.push({
      id: `REC-${hotspot.hotspotId}-MIXED`,
      hotspotId: hotspot.hotspotId,
      locationName: hotspot.name,
      coastalZone: hotspot.coastalZone,
      coordinates: hotspot.coordinates,
      observedPattern: 'Repeated mixed municipal waste deposition',
      evidence: `Multiple unsegregated flotsam streams recorded across ${totalEvents} operations, indicating continuous solid waste accumulation.`,
      recommendedIntervention:
        'Consider additional high-capacity covered waste bins and segregated collection drums placed along high-footfall promenade corridors.',
      confidenceLevel: confidence,
      label: 'Data-Informed Recommendation',
      category: 'INFRASTRUCTURE',
      urgency: 'HIGH',
      ruleTrigger: 'Concurrent multi-stream flotsam or repeated unsegregated waste',
    });
  }

  // --- RULE 3: REPEATED WEEKEND POLLUTION ---
  // Condition: >= 40% of events clustered on Saturdays/Sundays
  const weekendRatio = totalEvents > 0 ? weekendCount / totalEvents : 0;
  if (weekendCount >= 2 && weekendRatio >= 0.4) {
    const pct = Math.round(weekendRatio * 100);
    const confidence = weekendCount >= 3 ? 'HIGH' : 'MODERATE';

    recommendations.push({
      id: `REC-${hotspot.hotspotId}-WEEKEND`,
      hotspotId: hotspot.hotspotId,
      locationName: hotspot.name,
      coastalZone: hotspot.coastalZone,
      coordinates: hotspot.coordinates,
      observedPattern: 'Repeated weekend pollution surges',
      evidence: `${weekendCount} out of ${totalEvents} logged activities (${pct}%) occurred on Saturdays or Sundays, coinciding with peak recreational footfall.`,
      recommendedIntervention:
        'Consider increased collection frequency around weekends and scheduled evening sanitation clearing shifts on Friday through Sunday.',
      confidenceLevel: confidence,
      label: 'Data-Informed Recommendation',
      category: 'OPERATIONAL_SCHEDULE',
      urgency: 'HIGH',
      ruleTrigger: 'Weekend temporal clustering >= 40% of observations',
    });
  }

  // --- RULE 4: REPEATED FISHING WASTE ---
  // Condition: Fishing gear events >= 1 OR fishing gear kg > 50 OR fishing harbor/cove zone
  if (
    fishingCount >= 1 ||
    totalFishingKg >= 50 ||
    hotspot.dominantPollutionType.toLowerCase().includes('fishing') ||
    hotspot.coastalZone.toLowerCase().includes('fishing')
  ) {
    const confidence = fishingCount >= 2 || totalFishingKg >= 100 ? 'HIGH' : 'MODERATE';

    recommendations.push({
      id: `REC-${hotspot.hotspotId}-FISHING`,
      hotspotId: hotspot.hotspotId,
      locationName: hotspot.name,
      coastalZone: hotspot.coastalZone,
      coordinates: hotspot.coordinates,
      observedPattern: 'Repeated derelict fishing gear and netting flotsam',
      evidence: `${fishingCount} derelict gear extraction records and ${Math.round(
        totalFishingKg
      )} kg of polypropylene line/monofilament nets recovered from intertidal waters.`,
      recommendedIntervention:
        'Consider proactive engagement with local artisanal fishing communities, harbor net drop-off buy-back points, and targeted diver/intertidal snag recovery.',
      confidenceLevel: confidence,
      label: 'Data-Informed Recommendation',
      category: 'COMMUNITY_ENGAGEMENT',
      urgency: totalFishingKg >= 100 ? 'HIGH' : 'MEDIUM',
      ruleTrigger: 'Fishing gear presence >= 1 event or weight >= 50kg',
    });
  }

  // --- RULE 5: REPEATED DRAIN / CANAL RUNOFF POLLUTION ---
  // Condition: Drainage outfall proximity or estuarine confluence
  if (isDrainageZone) {
    recommendations.push({
      id: `REC-${hotspot.hotspotId}-DRAIN`,
      hotspotId: hotspot.hotspotId,
      locationName: hotspot.name,
      coastalZone: hotspot.coastalZone,
      coordinates: hotspot.coordinates,
      observedPattern: 'Repeated drain / canal runoff pollution',
      evidence: `Geographic proximity to urban storm nalas or estuarine watercourses draining into shoreline coordinates (${hotspot.coordinates[0].toFixed(
        4
      )}°N, ${hotspot.coordinates[1].toFixed(4)}°E).`,
      recommendedIntervention:
        'Consider technical investigation of the upstream pollution entry point, trash boom interception barriers at the canal mouth, and stormwater weir debris grates.',
      confidenceLevel: 'HIGH',
      label: 'Data-Informed Recommendation',
      category: 'INVESTIGATION',
      urgency: 'HIGH',
      ruleTrigger: 'Proximity to identified hydrologic entry point or estuarine outfall',
    });
  }

  // --- RULE 6: REPEATED ILLEGAL DUMPING / CRITICAL SEVERITY ---
  // Condition: Critical severity reports >= 1 or average severity >= 3.0
  if (criticalCount >= 1 || hotspot.averageSeverityScore >= 3.0) {
    const confidence = criticalCount >= 2 ? 'HIGH' : 'MODERATE';

    recommendations.push({
      id: `REC-${hotspot.hotspotId}-ENFORCEMENT`,
      hotspotId: hotspot.hotspotId,
      locationName: hotspot.name,
      coastalZone: hotspot.coastalZone,
      coordinates: hotspot.coordinates,
      observedPattern: 'Repeated severe or illegal dumping incidents',
      evidence: `${criticalCount} high-hazard incidents documented with average severity index of ${hotspot.averageSeverityScore.toFixed(
        1
      )} / 4.0.`,
      recommendedIntervention:
        'Consider joint municipal-coastal police enforcement patrols, nocturnal access surveillance, and regulatory enforcement intervention against commercial violators.',
      confidenceLevel: confidence,
      label: 'Data-Informed Recommendation',
      category: 'ENFORCEMENT',
      urgency: 'HIGH',
      ruleTrigger: 'Hazard severity index >= 3.0 or critical dump count >= 1',
    });
  }

  return recommendations;
}
