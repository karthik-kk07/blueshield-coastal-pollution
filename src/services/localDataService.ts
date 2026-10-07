import {
  ReportDoc,
  OrganizationDoc,
  CleanupRecordDoc,
  ActivityLogDoc,
  EntryPointDoc,
  HistoricalCleanupDoc,
} from '../types/firestore';
import { UserProfile, UserRole } from '../types/auth';

// Storage keys
export const STORAGE_KEYS = {
  REPORTS: 'blueshield_local_reports_v3',
  USERS: 'blueshield_local_users_v3',
  ORGANIZATIONS: 'blueshield_local_organizations_v3',
  CLEANUP_RECORDS: 'blueshield_local_cleanup_records_v3',
  ACTIVITY_LOGS: 'blueshield_local_activity_logs_v3',
  ENTRY_POINTS: 'blueshield_local_entry_points_v3',
  HISTORICAL_CLEANUPS: 'blueshield_local_historical_cleanups_v3',
  ACTIVE_USER: 'blueshield_local_active_user_v3',
} as const;

// Custom Event Target for reactive pub-sub (replaces Firestore onSnapshot)
class LocalDataEventEmitter extends EventTarget {
  notify(event: string) {
    this.dispatchEvent(new Event(event));
  }
}

export const localEvents = new LocalDataEventEmitter();

// Initial Organizations Seed (Visakhapatnam Shoreline Units)
export const INITIAL_ORGANIZATIONS: OrganizationDoc[] = [
  {
    id: 'org-gvmc-coastal',
    name: 'GVMC Coastal Directorate (Zone 3)',
    type: 'MUNICIPAL',
    contactName: 'M. V. Ramana (Zonal Commissioner)',
    contactEmail: 'coastal.zone3@gvmc.gov.in',
    contactPhone: '+91 891 2746401',
    coverageArea: 'RK Beach, Coastal Battery, Lawson\'s Bay, Sagar Nagar',
    active: true,
    jurisdictionZone: 'Visakhapatnam Urban Shoreline',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'org-vpa-marine',
    name: 'Visakhapatnam Port Authority (VPA) Marine Wing',
    type: 'MUNICIPAL',
    contactName: 'Harbour Master Capt. K. S. Rao',
    contactEmail: 'marine.safety@vpa.gov.in',
    contactPhone: '+91 891 2873100',
    coverageArea: 'Outer Harbour, Inner Harbour, Fishing Harbour Breakwater',
    active: true,
    jurisdictionZone: 'Port & Navigation Channel Limits',
    createdAt: '2026-01-12T09:30:00Z',
  },
  {
    id: 'org-icg-dhq6',
    name: 'Indian Coast Guard DHQ-6 Marine Ops',
    type: 'CLEANUP_TEAM',
    contactName: 'Command Operations Centre',
    contactEmail: 'dhq6-ops@indiancoastguard.nic.in',
    contactPhone: '+91 891 2568241',
    coverageArea: 'Bay of Bengal Littoral Waters, Dolphin\'s Nose Cove',
    active: true,
    jurisdictionZone: 'Coastal & Maritime Security Perimeter',
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'org-appcb-vizag',
    name: 'AP Pollution Control Board (Regional Lab)',
    type: 'MUNICIPAL',
    contactName: 'Senior Environmental Scientist Dr. P. Lakshmi',
    contactEmail: 'ro.visakhapatnam@pcb.ap.gov.in',
    contactPhone: '+91 891 2755321',
    coverageArea: 'Industrial Coastal Drain Basins, Meghadrigedda',
    active: true,
    jurisdictionZone: 'Effluent & Water Quality Monitoring',
    createdAt: '2026-01-18T11:00:00Z',
  },
  {
    id: 'org-vizag-clean-squad',
    name: 'Vizag Blue Volunteers & Beach Watch NGO',
    type: 'NGO',
    contactName: 'Suresh Verma (Coordinator)',
    contactEmail: 'connect@vizagbeachclean.org',
    contactPhone: '+91 98480 12345',
    coverageArea: 'Rushikonda Beach, Tenneti Park, Bheemili Shoreline',
    active: true,
    jurisdictionZone: 'Public Community Cleanups',
    createdAt: '2026-02-01T06:00:00Z',
  },
];

// Initial Reports Seed spanning all 7 operational lifecycle states
export const INITIAL_REPORTS: ReportDoc[] = [
  {
    id: 'rep-vz-2026-01',
    reportNumber: 'BS-2026-1042',
    title: 'Commercial Trawl Net & Polypropylene Ghost Gear',
    reportedBy: 'Karthik Varma',
    latitude: 17.6982,
    longitude: 83.3045,
    coastalZone: 'Fishing Harbour Breakwater',
    pollutionType: 'Fishing Waste',
    severity: 'CRITICAL',
    description: 'Heavy 35m monofilament commercial gill net entangled across granite breakwater armor blocks. High entanglement threat to Olive Ridley sea turtles during high tide.',
    photoUrl: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=800&q=80',
    status: 'REPORTED',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    reporterId: 'usr-vol-01',
    entryPointSource: 'Trawler Fleet Return Basin',
  },
  {
    id: 'rep-vz-2026-02',
    reportNumber: 'BS-2026-1038',
    title: 'Dense Expanded Polystyrene & Microplastic Strandline',
    reportedBy: 'Priya Sundaram',
    latitude: 17.7820,
    longitude: 83.3850,
    coastalZone: 'Rushikonda Blue Flag Beach',
    pollutionType: 'Plastic',
    severity: 'HIGH',
    description: 'High-density strandline of thermocol packaging and plastic bottle debris stretching across 120m of the certified eco-beach intertidal shoreline.',
    photoUrl: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80',
    status: 'VERIFIED',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    verifiedBy: 'Capt. Rajesh Kakarla (Coordinator)',
    verifiedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    notes: 'Verified on-site by field officer. High priority due to Blue Flag compliance requirements.',
    reporterId: 'usr-rep-02',
    entryPointSource: 'Yendada Storm Outfall',
  },
  {
    id: 'rep-vz-2026-03',
    reportNumber: 'BS-2026-1031',
    title: 'Food Vendor Single-Use Plastic & Beverage Cans',
    reportedBy: 'Suresh Naidu',
    latitude: 17.7155,
    longitude: 83.3285,
    coastalZone: 'RK Beach Promenade',
    pollutionType: 'Food Packaging',
    severity: 'MODERATE',
    description: 'Accumulation of PET bottles, food cartons, and aluminum cans stranded along the high-water line near Kali Temple ghats.',
    photoUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
    status: 'ASSIGNED',
    assignedOrganization: 'GVMC Coastal Directorate (Zone 3)',
    assignedTo: 'Ramesh Babu (Team Lead)',
    assignedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    verifiedBy: 'Capt. Rajesh Kakarla (Coordinator)',
    verifiedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    notes: 'Dispatched to GVMC Beach Patrol crew for early morning cleanup cycle.',
  },
  {
    id: 'rep-vz-2026-04',
    reportNumber: 'BS-2026-1025',
    title: 'Broken Glass Bottles & Beverage Containers',
    reportedBy: 'Ananya Sharma',
    latitude: 17.7475,
    longitude: 83.3540,
    coastalZone: 'Tenneti Park Rocks',
    pollutionType: 'Glass',
    severity: 'HIGH',
    description: 'Shattered beer and liquor bottles scattered on intertidal rocky shelf, creating hazard for tourists and local fishermen barefoot access.',
    photoUrl: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
    status: 'ACCEPTED',
    assignedOrganization: 'Vizag Blue Volunteers & Beach Watch NGO',
    assignedTo: 'Suresh Verma',
    assignedAt: new Date(Date.now() - 3600000 * 9).toISOString(),
    acceptedBy: 'Suresh Verma (NGO Lead)',
    acceptedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 16).toISOString(),
    verifiedBy: 'Capt. Rajesh Kakarla',
    verifiedAt: new Date(Date.now() - 3600000 * 14).toISOString(),
  },
  {
    id: 'rep-vz-2026-05',
    reportNumber: 'BS-2026-1019',
    title: 'Plastic Sacks & Mixed Marine Debris',
    reportedBy: 'Devi Prasad',
    latitude: 17.7320,
    longitude: 83.3410,
    coastalZone: 'Lawson\'s Bay Cove',
    pollutionType: 'Mixed Waste',
    severity: 'MODERATE',
    description: 'Submerged woven sacks, plastic wrappers, and abandoned boat ropes stranded around traditional catamarans.',
    photoUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80',
    status: 'IN_PROGRESS',
    assignedOrganization: 'GVMC Coastal Directorate (Zone 3)',
    assignedTo: 'Ramesh Babu',
    assignedAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    acceptedBy: 'Ramesh Babu',
    acceptedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    startedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    verifiedBy: 'Capt. Rajesh Kakarla',
  },
  {
    id: 'rep-vz-2026-06',
    reportNumber: 'BS-2026-1008',
    title: 'Illegal Industrial Drum Dumping & Chemical Sludge',
    reportedBy: 'B. Jagannadham',
    latitude: 17.6548,
    longitude: 83.2687,
    coastalZone: 'Yarada Beach (South Bluff)',
    pollutionType: 'Illegal Dumping',
    severity: 'CRITICAL',
    description: 'Disused metallic drums with chemical residue abandoned in intertidal rocks south of Dolphin\'s Nose headland.',
    photoUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
    afterPhotoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    status: 'CLEANED',
    assignedOrganization: 'AP Pollution Control Board (Regional Lab)',
    assignedTo: 'Dr. P. Lakshmi & GVMC Hazardous Disposal',
    assignedAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    acceptedBy: 'Dr. P. Lakshmi',
    acceptedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    startedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    cleanedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    notes: 'Drums contained hydraulic oil sludge. Safely neutralised, sealed, and shifted to municipal hazardous waste facility.',
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    verifiedBy: 'Capt. Rajesh Kakarla',
  },
  {
    id: 'rep-vz-2026-07',
    reportNumber: 'BS-2026-0994',
    title: 'Tidal Flotsam & Driftwood Obstruction',
    reportedBy: 'K. Satyanarayana',
    latitude: 17.8920,
    longitude: 83.4540,
    coastalZone: 'Bheemili Gosthani Estuary',
    pollutionType: 'Organic Waste',
    severity: 'LOW',
    description: 'Accumulation of flood driftwood, water hyacinth clumps, and plastic bags choking the estuary mouth.',
    photoUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    afterPhotoUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
    status: 'VERIFIED_CLOSED',
    assignedOrganization: 'Vizag Blue Volunteers & Beach Watch NGO',
    assignedTo: 'Suresh Verma',
    assignedAt: new Date(Date.now() - 3600000 * 50).toISOString(),
    acceptedBy: 'Suresh Verma',
    acceptedAt: new Date(Date.now() - 3600000 * 46).toISOString(),
    startedAt: new Date(Date.now() - 3600000 * 40).toISOString(),
    cleanedAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    closedAt: new Date(Date.now() - 3600000 * 22).toISOString(),
    notes: 'Full remediation verified by coastal directorate. Estuary channel clear for tidal exchange.',
    createdAt: new Date(Date.now() - 3600000 * 60).toISOString(),
    verifiedBy: 'Capt. Rajesh Kakarla',
    verifiedAt: new Date(Date.now() - 3600000 * 55).toISOString(),
  },
];

// Initial Cleanup Records Seed
export const INITIAL_CLEANUP_RECORDS: CleanupRecordDoc[] = [
  {
    id: 'cln-vz-2026-01',
    reportId: 'rep-vz-2026-06',
    afterPhoto: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    afterPhotoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    wasteWeight: 420,
    dryWeightKg: 420,
    areaCleaned: '180 sq meters of rocky shoreline',
    completedBy: 'Dr. P. Lakshmi & Team',
    completedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    disposalMethod: 'GVMC Hazardous Solid Waste Neutralisation Yard (Kapuluppada)',
    notes: 'Two corroded 200L drums removed using flatbed crane hoist at low tide.',
  },
  {
    id: 'cln-vz-2026-02',
    reportId: 'rep-vz-2026-07',
    afterPhoto: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
    afterPhotoUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
    wasteWeight: 260,
    dryWeightKg: 260,
    areaCleaned: '350 meters along Gosthani estuary confluence',
    completedBy: 'Suresh Verma (Vizag Blue Volunteers)',
    completedAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    disposalMethod: 'Organic compost diversion and municipal recycling center',
    notes: '24 student volunteers mobilized. Organic debris diverted to community composting.',
  },
];

// Initial Entry Points Seed
export const INITIAL_ENTRY_POINTS: EntryPointDoc[] = [
  {
    id: 'ent-vz-01',
    trackingCode: 'EP-VZ-01',
    title: 'Town Hall Storm Nala Main Outfall',
    category: 'Open Drain',
    severity: 'CRITICAL',
    status: 'ASSIGNED',
    locationName: 'RK Beach - Kali Temple Ghats',
    coastalZone: 'Urban Promenade Basin',
    latitude: 17.7125,
    longitude: 83.3240,
    description: 'Major stormwater and municipal open nala discharging runoff directly onto public beach strandline during monsoon overflow.',
    reportedBy: 'Karthik Karanam (Admin)',
    reportedAt: '2026-02-15T09:00:00Z',
    assignedOrganization: 'GVMC Coastal Directorate (Zone 3)',
  },
  {
    id: 'ent-vz-02',
    trackingCode: 'EP-VZ-02',
    title: 'Meghadrigedda Creek Industrial Outlet',
    category: 'Canal',
    severity: 'HIGH',
    status: 'VERIFIED',
    locationName: 'Inner Harbour Tidal Channel',
    coastalZone: 'Industrial Port Basin',
    latitude: 17.6920,
    longitude: 83.2420,
    description: 'Heavy industrial drainage creek connecting industrial estates into the port inner channel.',
    reportedBy: 'Dr. Ananya Sharma',
    reportedAt: '2026-02-20T11:30:00Z',
  },
  {
    id: 'ent-vz-03',
    trackingCode: 'EP-VZ-03',
    title: 'Yendada Urban Runoff Stormwater Outlet',
    category: 'Stormwater Outlet',
    severity: 'MODERATE',
    status: 'REPORTED',
    locationName: 'North Rushikonda Boundary',
    coastalZone: 'Rushikonda Eco-Zone',
    latitude: 17.7880,
    longitude: 83.3890,
    description: 'Stormwater culvert passing beneath coastal roadway draining residential runoff onto northern rocky beach.',
    reportedBy: 'Priya Sundaram',
    reportedAt: '2026-03-01T14:15:00Z',
  },
];

// Initial Activity Logs
export const INITIAL_ACTIVITY_LOGS: ActivityLogDoc[] = [
  {
    id: 'log-01',
    actorId: 'usr-coord-01',
    actorName: 'Capt. Rajesh Kakarla',
    actorRole: 'COORDINATOR',
    action: 'VERIFY_REPORT',
    entityType: 'report',
    entityId: 'rep-vz-2026-02',
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
    metadata: JSON.stringify({
      reportNumber: 'BS-2026-1038',
      previousStatus: 'REPORTED',
      newStatus: 'VERIFIED',
      coastalZone: 'Rushikonda Blue Flag Beach',
    }),
  },
  {
    id: 'log-02',
    actorId: 'usr-coord-01',
    actorName: 'Capt. Rajesh Kakarla',
    actorRole: 'COORDINATOR',
    action: 'DISPATCH_TASK',
    entityType: 'report',
    entityId: 'rep-vz-2026-03',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    metadata: JSON.stringify({
      reportNumber: 'BS-2026-1031',
      assignedTo: 'GVMC Coastal Directorate (Zone 3)',
      priority: 'MODERATE',
    }),
  },
  {
    id: 'log-03',
    actorId: 'usr-crew-01',
    actorName: 'Dr. P. Lakshmi',
    actorRole: 'CLEANUP_TEAM',
    action: 'MARK_CLEANED',
    entityType: 'report',
    entityId: 'rep-vz-2026-06',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    metadata: JSON.stringify({
      reportNumber: 'BS-2026-1008',
      dryWeightKg: 420,
      disposalMethod: 'GVMC Hazardous Yard',
    }),
  },
];

// Pre-defined Demo Personas for Quick Evaluator Access
export const DEMO_PERSONAS: Record<UserRole, UserProfile> = {
  CITIZEN: {
    id: 'usr-demo-citizen',
    name: 'Karthik Varma',
    email: 'citizen@blueshield.demo',
    role: 'CITIZEN',
    organization: 'Community Beach Observer',
    badgeLevel: 'Community Observer',
    createdAt: '2026-01-01T00:00:00Z',
  },
  VOLUNTEER: {
    id: 'usr-demo-volunteer',
    name: 'Priya Sundaram',
    email: 'volunteer@blueshield.demo',
    role: 'VOLUNTEER',
    organization: 'Vizag Blue Volunteers NGO',
    badgeLevel: 'Active Volunteer',
    createdAt: '2026-01-01T00:00:00Z',
  },
  COORDINATOR: {
    id: 'usr-demo-coordinator',
    name: 'Capt. Rajesh Kakarla',
    email: 'coordinator@blueshield.demo',
    role: 'COORDINATOR',
    organization: 'Visakhapatnam Coastal Directorate',
    badgeLevel: 'Lead Triage Officer',
    createdAt: '2026-01-01T00:00:00Z',
  },
  CLEANUP_TEAM: {
    id: 'usr-demo-crew',
    name: 'Ramesh Babu',
    email: 'cleanup@blueshield.demo',
    role: 'CLEANUP_TEAM',
    organization: 'GVMC Coastal Directorate (Zone 3)',
    badgeLevel: 'Field Crew Lead',
    createdAt: '2026-01-01T00:00:00Z',
  },
  RESEARCHER: {
    id: 'usr-demo-researcher',
    name: 'Dr. Ananya Sharma',
    email: 'researcher@blueshield.demo',
    role: 'RESEARCHER',
    organization: 'National Institute of Oceanography (NIO Vizag)',
    badgeLevel: 'Marine Scientist',
    createdAt: '2026-01-01T00:00:00Z',
  },
  ADMIN: {
    id: 'usr-demo-admin',
    name: 'Director K. Karanam',
    email: 'admin@blueshield.demo',
    role: 'ADMIN',
    organization: 'APPCB / GVMC Coastal Command',
    badgeLevel: 'Platform Director',
    createdAt: '2026-01-01T00:00:00Z',
  },
};

// Safe JSON Parse Helper
function safeGet<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`[LocalDataService] Failed to parse key ${key}, using default`, e);
    return defaultValue;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`[LocalDataService] Failed to write key ${key} to localStorage`, e);
  }
}

// ==========================================
// Centralized Local Data Service API
// ==========================================

export const localDataService = {
  // --- REPORTS ---
  getReports(): ReportDoc[] {
    const data = safeGet<ReportDoc[]>(STORAGE_KEYS.REPORTS, []);
    if (data.length === 0) {
      safeSet(STORAGE_KEYS.REPORTS, INITIAL_REPORTS);
      return INITIAL_REPORTS;
    }
    return data;
  },

  saveReports(reports: ReportDoc[]): void {
    safeSet(STORAGE_KEYS.REPORTS, reports);
    localEvents.notify('reports_updated');
  },

  addReport(report: ReportDoc): ReportDoc {
    const reports = this.getReports();
    // Prepend for newest-first order
    const updated = [report, ...reports.filter((r) => r.id !== report.id)];
    this.saveReports(updated);

    // Create an initial audit log for submission
    this.addActivityLog({
      id: `log-sub-${Date.now()}`,
      actorId: report.reporterId || 'citizen-demo',
      actorName: report.reportedBy || 'Citizen Observer',
      actorRole: 'CITIZEN',
      action: 'SUBMIT_REPORT',
      entityType: 'report',
      entityId: report.id,
      timestamp: new Date().toISOString(),
      metadata: JSON.stringify({
        reportNumber: report.reportNumber,
        pollutionType: report.pollutionType,
        severity: report.severity,
        coastalZone: report.coastalZone,
        status: report.status,
      }),
    });

    return report;
  },

  updateReport(id: string, updates: Partial<ReportDoc>, actor?: { id: string; name: string; role: UserRole }): ReportDoc | null {
    const reports = this.getReports();
    const index = reports.findIndex((r) => r.id === id);
    if (index === -1) return null;

    const previous = reports[index];
    const updatedReport: ReportDoc = {
      ...previous,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    reports[index] = updatedReport;
    this.saveReports(reports);

    // If status changed or notes added, record immutable activity log
    if (updates.status && updates.status !== previous.status) {
      this.addActivityLog({
        id: `log-trans-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        actorId: actor?.id || 'demo-actor',
        actorName: actor?.name || 'Authorized Officer',
        actorRole: actor?.role || 'COORDINATOR',
        action: `STATUS_CHANGE_TO_${updates.status}`,
        entityType: 'report',
        entityId: id,
        timestamp: new Date().toISOString(),
        metadata: JSON.stringify({
          reportNumber: updatedReport.reportNumber,
          previousStatus: previous.status,
          newStatus: updates.status,
          assignedOrganization: updatedReport.assignedOrganization,
          notes: updates.notes,
        }),
      });
    }

    return updatedReport;
  },

  getReportById(id: string): ReportDoc | null {
    const reports = this.getReports();
    return reports.find((r) => r.id === id) || null;
  },

  // --- ORGANIZATIONS ---
  getOrganizations(): OrganizationDoc[] {
    const data = safeGet<OrganizationDoc[]>(STORAGE_KEYS.ORGANIZATIONS, []);
    if (data.length === 0) {
      safeSet(STORAGE_KEYS.ORGANIZATIONS, INITIAL_ORGANIZATIONS);
      return INITIAL_ORGANIZATIONS;
    }
    return data;
  },

  saveOrganizations(orgs: OrganizationDoc[]): void {
    safeSet(STORAGE_KEYS.ORGANIZATIONS, orgs);
    localEvents.notify('orgs_updated');
  },

  // --- CLEANUP RECORDS ---
  getCleanupRecords(): CleanupRecordDoc[] {
    const data = safeGet<CleanupRecordDoc[]>(STORAGE_KEYS.CLEANUP_RECORDS, []);
    if (data.length === 0) {
      safeSet(STORAGE_KEYS.CLEANUP_RECORDS, INITIAL_CLEANUP_RECORDS);
      return INITIAL_CLEANUP_RECORDS;
    }
    return data;
  },

  saveCleanupRecords(records: CleanupRecordDoc[]): void {
    safeSet(STORAGE_KEYS.CLEANUP_RECORDS, records);
    localEvents.notify('cleanups_updated');
  },

  addCleanupRecord(record: CleanupRecordDoc): CleanupRecordDoc {
    const records = this.getCleanupRecords();
    const updated = [record, ...records.filter((c) => c.id !== record.id)];
    this.saveCleanupRecords(updated);
    return record;
  },

  // --- ACTIVITY LOGS ---
  getActivityLogs(): ActivityLogDoc[] {
    const data = safeGet<ActivityLogDoc[]>(STORAGE_KEYS.ACTIVITY_LOGS, []);
    if (data.length === 0) {
      safeSet(STORAGE_KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS);
      return INITIAL_ACTIVITY_LOGS;
    }
    return data;
  },

  saveActivityLogs(logs: ActivityLogDoc[]): void {
    safeSet(STORAGE_KEYS.ACTIVITY_LOGS, logs);
    localEvents.notify('logs_updated');
  },

  addActivityLog(log: ActivityLogDoc): ActivityLogDoc {
    const logs = this.getActivityLogs();
    const updated = [log, ...logs];
    // Keep max 200 logs locally
    this.saveActivityLogs(updated.slice(0, 200));
    return log;
  },

  // --- ENTRY POINTS ---
  getEntryPoints(): EntryPointDoc[] {
    const data = safeGet<EntryPointDoc[]>(STORAGE_KEYS.ENTRY_POINTS, []);
    if (data.length === 0) {
      safeSet(STORAGE_KEYS.ENTRY_POINTS, INITIAL_ENTRY_POINTS);
      return INITIAL_ENTRY_POINTS;
    }
    return data;
  },

  saveEntryPoints(entryPoints: EntryPointDoc[]): void {
    safeSet(STORAGE_KEYS.ENTRY_POINTS, entryPoints);
    localEvents.notify('entrypoints_updated');
  },

  addEntryPoint(entryPoint: EntryPointDoc): EntryPointDoc {
    const list = this.getEntryPoints();
    const updated = [entryPoint, ...list];
    this.saveEntryPoints(updated);
    return entryPoint;
  },

  updateEntryPoint(id: string, updates: Partial<EntryPointDoc>): EntryPointDoc | null {
    const list = this.getEntryPoints();
    const index = list.findIndex((e) => e.id === id);
    if (index === -1) return null;
    list[index] = { ...list[index], ...updates, updatedAt: new Date().toISOString() };
    this.saveEntryPoints(list);
    return list[index];
  },

  // --- HISTORICAL CLEANUPS ---
  getHistoricalCleanups(): HistoricalCleanupDoc[] {
    return safeGet<HistoricalCleanupDoc[]>(STORAGE_KEYS.HISTORICAL_CLEANUPS, []);
  },

  saveHistoricalCleanups(cleanups: HistoricalCleanupDoc[]): void {
    safeSet(STORAGE_KEYS.HISTORICAL_CLEANUPS, cleanups);
    localEvents.notify('historical_updated');
  },

  // --- USER SESSION / PROFILES ---
  getActiveUser(): UserProfile | null {
    return safeGet<UserProfile | null>(STORAGE_KEYS.ACTIVE_USER, DEMO_PERSONAS.COORDINATOR);
  },

  setActiveUser(user: UserProfile | null): void {
    safeSet(STORAGE_KEYS.ACTIVE_USER, user);
    localEvents.notify('auth_updated');
  },

  // --- DEMO LIFECYCLE MANAGEMENT ---
  clearDemoData(): void {
    localStorage.removeItem(STORAGE_KEYS.REPORTS);
    localStorage.removeItem(STORAGE_KEYS.CLEANUP_RECORDS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITY_LOGS);
    localStorage.removeItem(STORAGE_KEYS.ENTRY_POINTS);
    localStorage.removeItem(STORAGE_KEYS.ORGANIZATIONS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
    // Notify listeners so UI updates cleanly
    localEvents.notify('reports_updated');
    localEvents.notify('cleanups_updated');
    localEvents.notify('logs_updated');
    localEvents.notify('entrypoints_updated');
    localEvents.notify('orgs_updated');
    localEvents.notify('auth_updated');
  },

  loadDemoData(): void {
    safeSet(STORAGE_KEYS.REPORTS, INITIAL_REPORTS);
    safeSet(STORAGE_KEYS.CLEANUP_RECORDS, INITIAL_CLEANUP_RECORDS);
    safeSet(STORAGE_KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS);
    safeSet(STORAGE_KEYS.ENTRY_POINTS, INITIAL_ENTRY_POINTS);
    safeSet(STORAGE_KEYS.ORGANIZATIONS, INITIAL_ORGANIZATIONS);
    safeSet(STORAGE_KEYS.ACTIVE_USER, DEMO_PERSONAS.COORDINATOR);
    // Notify listeners
    localEvents.notify('reports_updated');
    localEvents.notify('cleanups_updated');
    localEvents.notify('logs_updated');
    localEvents.notify('entrypoints_updated');
    localEvents.notify('orgs_updated');
    localEvents.notify('auth_updated');
  },
};
