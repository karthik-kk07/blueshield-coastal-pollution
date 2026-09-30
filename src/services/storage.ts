import { PollutionReport, Hotspot, EntryPoint, AuditLogItem } from '../types/pollution';

const REPORTS_KEY = 'blueshield_reports_vizag_v2';
const HOTSPOTS_KEY = 'blueshield_hotspots_vizag_v2';
const ENTRY_POINTS_KEY = 'blueshield_entry_points_vizag_v2';
const AUDIT_LOGS_KEY = 'blueshield_audit_logs_vizag_v2';

// Realistic baseline reports for Visakhapatnam Coastline (Bay of Bengal, Andhra Pradesh, India)
const INITIAL_REPORTS: PollutionReport[] = [
  {
    id: 'rep-vz-001',
    trackingCode: 'BS-2026-VZ01',
    title: 'Discarded Monofilament Trawl Net & Ghost Gear at Fishing Harbour Breakwater',
    description: 'Heavy 24-meter commercial monofilament trawl net snagged on granite armor tetrapods near the outer harbour navigation channel. Sea turtle (Olive Ridley) hazard detected near low-tide rocks.',
    wasteCategory: 'derelict_fishing_gear',
    severity: 'critical',
    status: 'action_dispatched',
    location: {
      latitude: 17.6982,
      longitude: 83.3045,
      coastalZoneName: 'Visakhapatnam Fishing Harbour Breakwater',
      nearestLandmark: 'Near Slipway Jetty #2 & Coast Guard Berth'
    },
    reportedByUserId: 'usr-vol-01',
    reportedByName: 'Karthik Varma',
    reportedAt: '2026-09-24T06:30:00Z',
    imageUrl: '',
    affectedShorelineLengthMeters: 55,
    entryPointSource: 'Trawler Fleet Return Channel',
    priorityScore: 94,
    verifications: [
      {
        id: 'ver-vz-01',
        verifiedByUserId: 'usr-off-01',
        verifiedByName: 'Capt. Rajesh Kakarla',
        verifiedByRole: 'field_officer',
        timestamp: '2026-09-24T07:45:00Z',
        notes: 'Confirmed entangled gear on tetrapod cluster. Contacted Visakhapatnam Port Authority marine salvage boat for winch recovery at slack tide.',
        groundTruthConfirmed: true,
        estimatedVolumeMetersCubed: 3.2
      }
    ]
  },
  {
    id: 'rep-vz-002',
    trackingCode: 'BS-2026-VZ02',
    title: 'Dense EPS Thermocol Pellets & Microplastic Drift Line at Rushikonda Beach',
    description: 'Strandline concentration of expanded polystyrene (thermocol) fragments and plastic nurdles washed ashore along 140m of the Blue Flag certified eco-beach boundary.',
    wasteCategory: 'micro_plastics',
    severity: 'high',
    status: 'field_verified',
    location: {
      latitude: 17.7820,
      longitude: 83.3850,
      coastalZoneName: 'Rushikonda Blue Flag Beach',
      nearestLandmark: 'North of AP Tourism Water Sports Complex'
    },
    reportedByUserId: 'usr-rep-02',
    reportedByName: 'Priya Sundaram',
    reportedAt: '2026-09-24T14:15:00Z',
    affectedShorelineLengthMeters: 140,
    entryPointSource: 'Yendada Storm Drain Outflow',
    priorityScore: 82,
    verifications: [
      {
        id: 'ver-vz-02',
        verifiedByUserId: 'usr-vol-02',
        verifiedByName: 'Dr. Ananya Sharma',
        verifiedByRole: 'verified_volunteer',
        timestamp: '2026-09-24T16:10:00Z',
        notes: 'Sieve core sampling conducted at 3 strandline points. Confirmed high-density EPS breakdown. Alerted Rushikonda Beach Management Committee for motorized beach cleaner deployment.',
        groundTruthConfirmed: true,
        estimatedVolumeMetersCubed: 1.4
      }
    ]
  },
  {
    id: 'rep-vz-003',
    trackingCode: 'BS-2026-VZ03',
    title: 'Petrochemical Sheen and Oily Bilge Residue near Coastal Battery Outfall',
    description: 'Iridescent diesel sheen extending 45 meters seaward from municipal storm nala outlet onto the surf zone near RK Beach. Noticeable hydrocarbon odor reported by morning walkers.',
    wasteCategory: 'hydrocarbon_oil',
    severity: 'critical',
    status: 'pending_verification',
    location: {
      latitude: 17.7088,
      longitude: 83.3190,
      coastalZoneName: 'Coastal Battery & South RK Beach',
      nearestLandmark: 'South of Sea Harrier Museum Promenade'
    },
    reportedByUserId: 'usr-rep-03',
    reportedByName: 'Suresh Naidu',
    reportedAt: '2026-09-25T07:10:00Z',
    affectedShorelineLengthMeters: 80,
    entryPointSource: 'Town Hall Main Storm Nala Outfall',
    priorityScore: 96,
    verifications: []
  },
  {
    id: 'rep-vz-004',
    trackingCode: 'BS-2026-VZ04',
    title: 'High-Volume Single-Use Plastic Waste Accumulation post-Festival at RK Beach',
    description: 'Extensive accumulation of single-use PET beverage bottles, multi-layer snack sachets, and synthetic floral packaging along the high-tide line facing the submarine museum.',
    wasteCategory: 'macro_plastics',
    severity: 'moderate',
    status: 'pending_verification',
    location: {
      latitude: 17.7160,
      longitude: 83.3305,
      coastalZoneName: 'Ramakrishna Beach (RK Beach)',
      nearestLandmark: 'Opposite INS Kursura Submarine Museum'
    },
    reportedByUserId: 'usr-rep-04',
    reportedByName: 'Lakshmi Narayana',
    reportedAt: '2026-09-25T09:30:00Z',
    affectedShorelineLengthMeters: 110,
    entryPointSource: 'Promenade Plaza Runoff & Beach Vendor Corridor',
    priorityScore: 56,
    verifications: []
  },
  {
    id: 'rep-vz-005',
    trackingCode: 'BS-2026-VZ05',
    title: 'Disposed Concrete Marine Debris with Sharp Rebar near Tenneti Park Rocks',
    description: 'Exposed structural construction debris with rusted iron rebar washed against the intertidal rock platform below Tenneti Park cliff, hazardous to tourists and local fishermen.',
    wasteCategory: 'bulk_construction',
    severity: 'moderate',
    status: 'remediated',
    location: {
      latitude: 17.7475,
      longitude: 83.3540,
      coastalZoneName: 'Tenneti Park Intertidal Rocks',
      nearestLandmark: 'Below Jodugullapalem Ghat Viewpoint'
    },
    reportedByUserId: 'usr-vol-01',
    reportedByName: 'Karthik Varma',
    reportedAt: '2026-09-21T11:00:00Z',
    affectedShorelineLengthMeters: 25,
    entryPointSource: 'Coastal Highway Slope Fill Runoff',
    priorityScore: 52,
    verifications: [
      {
        id: 'ver-vz-03',
        verifiedByUserId: 'usr-off-01',
        verifiedByName: 'Capt. Rajesh Kakarla',
        verifiedByRole: 'field_officer',
        timestamp: '2026-09-21T14:30:00Z',
        notes: 'GVMC Coastal Sanitation excavator mobilized during low tide. 4.1 tons of reinforced concrete slabs hauled to municipal dumping yard.',
        groundTruthConfirmed: true,
        estimatedVolumeMetersCubed: 3.8
      }
    ]
  },
  {
    id: 'rep-vz-006',
    trackingCode: 'BS-2026-VZ06',
    title: 'Riverine Plastic Siltation & Agricultural Runoff at Gosthani Estuary',
    description: 'Post-monsoon flood discharge carrying mass agricultural plastic sheeting and discarded irrigation tubing into the coastal surf at Bheemili.',
    wasteCategory: 'macro_plastics',
    severity: 'high',
    status: 'field_verified',
    location: {
      latitude: 17.8925,
      longitude: 83.4545,
      coastalZoneName: 'Bheemili Beach & Gosthani River Estuary',
      nearestLandmark: 'Old Dutch Cemetery Beach / River Mouth'
    },
    reportedByUserId: 'usr-rep-05',
    reportedByName: 'Officer Manoj Reddy',
    reportedAt: '2026-09-23T15:20:00Z',
    affectedShorelineLengthMeters: 180,
    entryPointSource: 'Gosthani River Confluence',
    priorityScore: 79,
    verifications: [
      {
        id: 'ver-vz-04',
        verifiedByUserId: 'usr-vol-02',
        verifiedByName: 'Dr. Ananya Sharma',
        verifiedByRole: 'verified_volunteer',
        timestamp: '2026-09-24T08:00:00Z',
        notes: 'Estuarine barrier sandbar breached by monsoon flows. Recommended floating trash boom installation across Gosthani mouth.',
        groundTruthConfirmed: true,
        estimatedVolumeMetersCubed: 4.5
      }
    ]
  }
];

const INITIAL_HOTSPOTS: Hotspot[] = [
  {
    id: 'hot-vz-01',
    name: 'Visakhapatnam Fishing Harbour & Port Outer Channel',
    region: 'South Bay Sector (Port Marine Zone)',
    centerCoordinates: [17.6982, 83.3045],
    primaryVectors: ['Commercial Trawler Flotsam', 'Discarded Nylon Gillnets', 'Bilge Oil Discharge'],
    vulnerabilityIndex: 'severe',
    activeIncidentCount: 1,
    historicalIncidentCount: 38,
    lastAssessedAt: '2026-09-24T08:00:00Z',
    notes: 'Dense concentration of 800+ mechanized fishing boats and coastal cargo berths. Critical marine entrance point with heavy synthetic gear attrition.'
  },
  {
    id: 'hot-vz-02',
    name: 'Ramakrishna (RK) Beach & Coastal Battery Bight',
    region: 'Central Urban Coastline',
    centerCoordinates: [17.7155, 83.3285],
    primaryVectors: ['Promenade Tourist Debris', 'Municipal Storm Nala Outfalls', 'Cultural & Festival Offerings'],
    vulnerabilityIndex: 'severe',
    activeIncidentCount: 2,
    historicalIncidentCount: 64,
    lastAssessedAt: '2026-09-25T09:00:00Z',
    notes: 'Primary public beach receiving 30,000+ daily visitors on weekends. Direct storm drainage from Old City & Maharanipeta zones.'
  },
  {
    id: 'hot-vz-03',
    name: 'Rushikonda Blue Flag Beach & Bay Lagoon',
    region: 'North-East Tourism Corridor',
    centerCoordinates: [17.7818, 83.3855],
    primaryVectors: ['Beach Shack & Resort Plastics', 'Water Sports Gear', 'Yendada Catchment Wash'],
    vulnerabilityIndex: 'elevated',
    activeIncidentCount: 1,
    historicalIncidentCount: 19,
    lastAssessedAt: '2026-09-24T17:30:00Z',
    notes: 'Internationally certified Blue Flag eco-beach requiring zero-tolerance pollution standards. High wave energy traps nurdles on northern ridge.'
  },
  {
    id: 'hot-vz-04',
    name: 'Yarada Beach Cove (Dolphin\'s Nose South)',
    region: 'South Vizag Peninsula',
    centerCoordinates: [17.6548, 83.2687],
    primaryVectors: ['Ocean Current Drift Lines', 'Offshore Shipping Waste', 'Beachgoer Plastics'],
    vulnerabilityIndex: 'moderate',
    activeIncidentCount: 1,
    historicalIncidentCount: 15,
    lastAssessedAt: '2026-09-24T12:00:00Z',
    notes: 'Enclosed cove framed by Dolphin\'s Nose hills. Natural marine gyre deposits offshore flotsam after heavy sea states.'
  },
  {
    id: 'hot-vz-05',
    name: 'Bheemili Beach & Gosthani River Estuary',
    region: 'North District Shoreline',
    centerCoordinates: [17.8920, 83.4540],
    primaryVectors: ['Riverine Watershed Silt', 'Agricultural Plastic Residues', 'Tidal Estuarine Inflow'],
    vulnerabilityIndex: 'elevated',
    activeIncidentCount: 1,
    historicalIncidentCount: 27,
    lastAssessedAt: '2026-09-25T10:00:00Z',
    notes: 'Confluence where Gosthani River enters Bay of Bengal; discharges watershed plastics during seasonal monsoon surges.'
  }
];

const INITIAL_ENTRY_POINTS: EntryPoint[] = [
  {
    id: 'entry-vz-01',
    name: 'Coastal Battery Main Storm Nala Outfall',
    type: 'storm_drain',
    coordinates: [17.7088, 83.3190],
    status: 'high_discharge',
    associatedZone: 'South RK Beach',
    lastInspectionDate: '2026-09-23',
    catchmentAreaKm2: 14.5,
    notes: 'Major concrete urban channel draining Maharanipeta, Jagadamba, and Old Town directly onto sandy intertidal zone.'
  },
  {
    id: 'entry-vz-02',
    name: 'Meghadrigedda Tidal Channel / Port Basin',
    type: 'canal_outfall',
    coordinates: [17.6920, 83.2420],
    status: 'active_monitor',
    associatedZone: 'Inner Harbour / Gangavaram Backwaters',
    lastInspectionDate: '2026-09-22',
    catchmentAreaKm2: 68.2,
    notes: 'Largest drainage catchment carrying municipal runoff, industrial cooling waters, and reservoir overflow.'
  },
  {
    id: 'entry-vz-03',
    name: 'Gosthani River Confluence Outflow (Bheemili)',
    type: 'river_mouth',
    coordinates: [17.8925, 83.4545],
    status: 'active_monitor',
    associatedZone: 'Bheemunipatnam Coast',
    lastInspectionDate: '2026-09-25',
    catchmentAreaKm2: 120.0,
    notes: 'Natural river carrying watershed flotsam and agricultural packaging from Vizianagaram district boundary.'
  },
  {
    id: 'entry-vz-04',
    name: 'Lawson\'s Bay Traditional Fishermen Slip Drain',
    type: 'storm_drain',
    coordinates: [17.7320, 83.3410],
    status: 'active_monitor',
    associatedZone: 'Lawson\'s Bay Colony',
    lastInspectionDate: '2026-09-20',
    catchmentAreaKm2: 6.8,
    notes: 'Drains residential sectors of MVP Colony and Waltair into calm fishing cove.'
  },
  {
    id: 'entry-vz-05',
    name: 'Gangavaram Industrial Jetty Discharge Channel',
    type: 'industrial_discharge',
    coordinates: [17.6250, 83.2380],
    status: 'active_monitor',
    associatedZone: 'Gangavaram Coastal Belt',
    lastInspectionDate: '2026-09-19',
    catchmentAreaKm2: 18.0,
    notes: 'Monitored by APPCB for industrial particulate runoff and coal dust suppression effluents.'
  }
];

const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'aud-vz-01',
    action: 'DISPATCH_TEAM',
    actorName: 'Capt. Rajesh Kakarla',
    actorRole: 'field_officer',
    targetId: 'rep-vz-001',
    timestamp: '2026-09-24T07:45:00Z',
    details: 'Verified commercial gillnet report at Fishing Harbour and dispatched Visakhapatnam Port Authority marine retrieval crew.'
  },
  {
    id: 'aud-vz-02',
    action: 'VERIFY_INCIDENT',
    actorName: 'Dr. Ananya Sharma',
    actorRole: 'verified_volunteer',
    targetId: 'rep-vz-002',
    timestamp: '2026-09-24T16:10:00Z',
    details: 'Completed physical sieve test at Rushikonda Blue Flag Beach verifying EPS microplastic accumulation.'
  },
  {
    id: 'aud-vz-03',
    action: 'CLOSE_INCIDENT',
    actorName: 'Capt. Rajesh Kakarla',
    actorRole: 'field_officer',
    targetId: 'rep-vz-005',
    timestamp: '2026-09-21T15:00:00Z',
    details: 'Hazardous concrete debris and exposed rebar at Tenneti Park rocks cleared by GVMC Sanitation heavy equipment.'
  }
];

export const loadReports = (): PollutionReport[] => {
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    if (!raw) {
      localStorage.setItem(REPORTS_KEY, JSON.stringify(INITIAL_REPORTS));
      return INITIAL_REPORTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_REPORTS;
  }
};

export const saveReports = (reports: PollutionReport[]): void => {
  try {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  } catch (err) {
    console.error('Failed to save reports to storage', err);
  }
};

export const loadHotspots = (): Hotspot[] => {
  try {
    const raw = localStorage.getItem(HOTSPOTS_KEY);
    if (!raw) {
      localStorage.setItem(HOTSPOTS_KEY, JSON.stringify(INITIAL_HOTSPOTS));
      return INITIAL_HOTSPOTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_HOTSPOTS;
  }
};

export const saveHotspots = (hotspots: Hotspot[]): void => {
  try {
    localStorage.setItem(HOTSPOTS_KEY, JSON.stringify(hotspots));
  } catch (err) {
    console.error('Failed to save hotspots to storage', err);
  }
};

export const loadEntryPoints = (): EntryPoint[] => {
  try {
    const raw = localStorage.getItem(ENTRY_POINTS_KEY);
    if (!raw) {
      localStorage.setItem(ENTRY_POINTS_KEY, JSON.stringify(INITIAL_ENTRY_POINTS));
      return INITIAL_ENTRY_POINTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ENTRY_POINTS;
  }
};

export const loadAuditLogs = (): AuditLogItem[] => {
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    if (!raw) {
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_AUDIT_LOGS;
  }
};

export const appendAuditLog = (item: Omit<AuditLogItem, 'id'>): void => {
  try {
    const current = loadAuditLogs();
    const newItem: AuditLogItem = {
      ...item,
      id: `aud-${Date.now()}`
    };
    const updated = [newItem, ...current];
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to append audit log', err);
  }
};
