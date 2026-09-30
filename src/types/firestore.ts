import { UserRole } from './auth';

export type TaskState =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'CLEANED'
  | 'VERIFIED_CLOSED';

export interface ReportDoc {
  id: string;
  reportNumber: string;
  reportedBy?: string;
  latitude: number;
  longitude: number;
  pollutionType: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'low' | 'medium' | 'high' | 'critical' | string;
  description: string;
  photoUrl?: string;
  status:
    | TaskState
    | 'REPORTED'
    | 'VERIFIED'
    | 'REJECTED'
    | 'DUPLICATE'
    | 'NEEDS_MORE_INFO'
    | 'pending_verification'
    | 'field_verified'
    | 'dispatched'
    | 'in_progress'
    | 'remediated'
    | 'rejected'
    | string;
  createdAt: string;
  // Legacy / optional attributes
  trackingCode?: string;
  title?: string;
  category?: string;
  coastalZone?: string;
  entryPointSource?: string;
  reporterId?: string;
  reporterName?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  assignedOrganization?: string;
  assignedTo?: string;
  assignedAt?: string;
  acceptedBy?: string;
  acceptedAt?: string;
  startedAt?: string;
  afterPhotoUrl?: string;
  cleanupRecordId?: string;
  cleanedAt?: string;
  closedAt?: string;
  notes?: string;
  updatedAt?: string;
}

export interface AssignmentDoc {
  id: string;
  reportId: string;
  assignedToOrganization: string;
  teamLead?: string;
  priority: 'standard' | 'urgent' | 'emergency';
  status: 'assigned' | 'acknowledged' | 'mobilized' | 'completed';
  assignedAt: string;
  dueAt?: string;
  notes?: string;
}

export interface CleanupRecordDoc {
  id: string;
  reportId: string;
  beforePhoto?: string;
  afterPhoto: string;
  wasteWeight?: number;
  wasteCount?: number;
  areaCleaned?: string;
  notes?: string;
  completedBy: string;
  completedAt: string;
  assignmentId?: string;
  teamId?: string;
  dryWeightKg?: number;
  volumeM3?: number;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  disposalMethod?: string;
  supervisorSignoff?: string;
}

export type OrganizationType =
  | 'MUNICIPAL'
  | 'NGO'
  | 'VOLUNTEER_GROUP'
  | 'CLEANUP_TEAM'
  | 'OTHER';

export interface OrganizationDoc {
  id: string;
  name: string;
  type: OrganizationType | string;
  contactName?: string;
  email?: string;
  phone?: string;
  coverageArea?: string;
  active: boolean;
  jurisdictionZone?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HistoricalCleanupDoc {
  id: string;
  cleanupId?: string;
  zone: string;
  beachName?: string;
  date: string;
  totalWasteKg: number;
  plasticWasteKg?: number;
  fishingGearKg?: number;
  glassMetalKg?: number;
  organicKg?: number;
  bagsCount?: number;
  volunteerCount?: number;
  durationHours?: number;
  distanceKm?: number;
  latitude?: number;
  longitude?: number;
  organization?: string;
  predominantCategory: string;
  tideCondition?: string;
  weatherCondition?: string;
  photoUrl?: string;
  notes?: string;
  dataSource: 'REAL_HISTORICAL' | 'DEMO';
  importedAt?: string;
  importedBy?: string;
  entryPointSource?: string;
  responseTimeHours?: number;
  rawRecord?: Record<string, unknown>;
}

export interface ActivityLogDoc {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole | string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  metadata?: string;
}

export type EntryPointCategory =
  | 'Open Drain'
  | 'Stormwater Outlet'
  | 'Canal'
  | 'Wastewater Outlet'
  | 'Dumping Point'
  | 'Other';

export type EntryPointStatus =
  | 'REPORTED'
  | 'VERIFIED'
  | 'ASSIGNED'
  | 'RESOLVED'
  | 'VERIFIED_CLOSED';

export type EntryPointSeverity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface EntryPointDoc {
  id: string;
  trackingCode: string;
  title: string;
  category: EntryPointCategory;
  severity: EntryPointSeverity;
  status: EntryPointStatus;
  locationName: string;
  coastalZone: string;
  latitude: number;
  longitude: number;
  description: string;
  photoUrl?: string;
  reportedBy?: string;
  reporterId?: string;
  reportedAt: string;
  verifiedBy?: string;
  verifiedAt?: string;
  assignedOrganization?: string;
  assignedTo?: string;
  assignedAt?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  verifiedClosedBy?: string;
  verifiedClosedAt?: string;
  closureNotes?: string;
  updatedAt?: string;
}
