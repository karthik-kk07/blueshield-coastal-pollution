export type WasteCategory =
  | 'macro_plastics'
  | 'micro_plastics'
  | 'chemical_industrial'
  | 'derelict_fishing_gear'
  | 'wastewater_sewage'
  | 'hydrocarbon_oil'
  | 'bulk_construction';

export type SeverityLevel = 'low' | 'moderate' | 'high' | 'critical';

export type VerificationStatus =
  | 'REPORTED'
  | 'VERIFIED'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'CLEANED'
  | 'VERIFIED_CLOSED'
  | 'REJECTED'
  | 'DUPLICATE'
  | 'NEEDS_MORE_INFO'
  | 'pending_verification'
  | 'field_verified'
  | 'action_dispatched'
  | 'remediated'
  | 'rejected';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  coastalZoneName: string;
  nearestLandmark?: string;
}

export interface VerificationLog {
  id: string;
  verifiedByUserId: string;
  verifiedByName: string;
  verifiedByRole: string;
  timestamp: string;
  notes: string;
  groundTruthConfirmed: boolean;
  estimatedVolumeMetersCubed?: number;
}

export interface PollutionReport {
  id: string;
  trackingCode: string;
  reportNumber?: string;
  title: string;
  description: string;
  wasteCategory: WasteCategory;
  pollutionType?: string;
  severity: SeverityLevel;
  status: VerificationStatus;
  location: GeoLocation;
  reportedByUserId: string;
  reportedByName: string;
  reportedAt: string;
  imageUrl?: string;
  photoUrl?: string;
  affectedShorelineLengthMeters?: number;
  entryPointSource?: string;
  assignedOrganization?: string;
  assignedTo?: string;
  assignedAt?: string;
  afterPhotoUrl?: string;
  cleanedAt?: string;
  closedAt?: string;
  verifications: VerificationLog[];
  priorityScore: number;
}

export interface Hotspot {
  id: string;
  name: string;
  region: string;
  centerCoordinates: [number, number];
  primaryVectors: string[];
  vulnerabilityIndex: 'moderate' | 'elevated' | 'severe';
  activeIncidentCount: number;
  historicalIncidentCount: number;
  lastAssessedAt: string;
  notes: string;
}

export interface EntryPoint {
  id: string;
  name: string;
  type: 'storm_drain' | 'river_mouth' | 'canal_outfall' | 'industrial_discharge' | 'port_facility';
  coordinates: [number, number];
  status: 'active_monitor' | 'high_discharge' | 'sealed_diverted';
  associatedZone: string;
  lastInspectionDate: string;
  catchmentAreaKm2?: number;
  notes: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  actorName: string;
  actorRole: string;
  targetId: string;
  timestamp: string;
  details: string;
}
