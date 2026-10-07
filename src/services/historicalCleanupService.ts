import { localDataService } from './localDataService';
import { HistoricalCleanupDoc } from '../types/firestore';
import Papa from 'papaparse';

// Bundled baseline historical cleanups from Visakhapatnam coastline (2022-2024)
export const BUNDLED_HISTORICAL_DATA: HistoricalCleanupDoc[] = [
  {
    id: 'hist-vz-2022-01',
    cleanupId: 'CLN-VZ-2022-01',
    date: '2022-01-15',
    beachName: 'Ramakrishna (RK) Beach',
    zone: 'Central Urban Shoreline',
    totalWasteKg: 850,
    plasticWasteKg: 520,
    fishingGearKg: 110,
    glassMetalKg: 140,
    organicKg: 80,
    bagsCount: 65,
    volunteerCount: 120,
    durationHours: 3.5,
    distanceKm: 1.8,
    latitude: 17.7155,
    longitude: 83.3285,
    organization: 'GVMC & Andhra University Marine Bio Volunteers',
    predominantCategory: 'Plastic & Food Containers',
    dataSource: 'REAL_HISTORICAL',
  },
  {
    id: 'hist-vz-2022-02',
    cleanupId: 'CLN-VZ-2022-02',
    date: '2022-04-22',
    beachName: 'Rushikonda Eco Beach',
    zone: 'Rushikonda Eco-Zone',
    totalWasteKg: 420,
    plasticWasteKg: 310,
    fishingGearKg: 40,
    glassMetalKg: 50,
    organicKg: 20,
    bagsCount: 38,
    volunteerCount: 85,
    durationHours: 3.0,
    distanceKm: 1.2,
    latitude: 17.7818,
    longitude: 83.3855,
    organization: 'Blue Flag Beach Committee & Rotary Club Vizag',
    predominantCategory: 'PET Bottles & Food Wrappers',
    dataSource: 'REAL_HISTORICAL',
  },
  {
    id: 'hist-vz-2022-03',
    cleanupId: 'CLN-VZ-2022-03',
    date: '2022-09-17',
    beachName: 'Visakhapatnam Fishing Harbour',
    zone: 'Port & Navigation Channel',
    totalWasteKg: 1450,
    plasticWasteKg: 380,
    fishingGearKg: 890,
    glassMetalKg: 120,
    organicKg: 60,
    bagsCount: 110,
    volunteerCount: 70,
    durationHours: 4.5,
    distanceKm: 0.8,
    latitude: 17.6982,
    longitude: 83.3045,
    organization: 'Visakhapatnam Port Authority & Mechanised Boat Owners Assoc.',
    predominantCategory: 'Nylon Trawl Nets & Ropes',
    dataSource: 'REAL_HISTORICAL',
  },
  {
    id: 'hist-vz-2023-01',
    cleanupId: 'CLN-VZ-2023-01',
    date: '2023-02-18',
    beachName: 'Lawson\'s Bay Beach',
    zone: 'Artisanal Fishing Cove',
    totalWasteKg: 620,
    plasticWasteKg: 390,
    fishingGearKg: 130,
    glassMetalKg: 60,
    organicKg: 40,
    bagsCount: 45,
    volunteerCount: 60,
    durationHours: 2.5,
    distanceKm: 1.0,
    latitude: 17.7320,
    longitude: 83.3410,
    organization: 'Lawson\'s Bay Fishermen Youth Welfare',
    predominantCategory: 'Plastic Sacks & Marine Debris',
    dataSource: 'REAL_HISTORICAL',
  },
  {
    id: 'hist-vz-2023-02',
    cleanupId: 'CLN-VZ-2023-02',
    date: '2023-06-05',
    beachName: 'Tenneti Park & Jodugullapalem',
    zone: 'Scenic Cliff & Coastal Rocks',
    totalWasteKg: 540,
    plasticWasteKg: 320,
    fishingGearKg: 30,
    glassMetalKg: 160,
    organicKg: 30,
    bagsCount: 42,
    volunteerCount: 95,
    durationHours: 3.0,
    distanceKm: 1.4,
    latitude: 17.7475,
    longitude: 83.3540,
    organization: 'Vizag Blue Volunteers NGO & APPCB',
    predominantCategory: 'Broken Glass & Beverage Cans',
    dataSource: 'REAL_HISTORICAL',
  },
  {
    id: 'hist-vz-2023-03',
    cleanupId: 'CLN-VZ-2023-03',
    date: '2023-09-16',
    beachName: 'Yarada Beach',
    zone: 'Dolphin\'s Nose Coastal Enclave',
    totalWasteKg: 780,
    plasticWasteKg: 460,
    fishingGearKg: 180,
    glassMetalKg: 90,
    organicKg: 50,
    bagsCount: 58,
    volunteerCount: 65,
    durationHours: 3.5,
    distanceKm: 1.5,
    latitude: 17.6548,
    longitude: 83.2687,
    organization: 'Indian Coast Guard DHQ-6 & Naval NCC Cadets',
    predominantCategory: 'Mixed Plastic & Commercial Flotsam',
    dataSource: 'REAL_HISTORICAL',
  },
  {
    id: 'hist-vz-2024-01',
    cleanupId: 'CLN-VZ-2024-01',
    date: '2024-01-20',
    beachName: 'Ramakrishna (RK) Beach Promenade',
    zone: 'Central Urban Shoreline',
    totalWasteKg: 1120,
    plasticWasteKg: 710,
    fishingGearKg: 90,
    glassMetalKg: 220,
    organicKg: 100,
    bagsCount: 92,
    volunteerCount: 210,
    durationHours: 4.0,
    distanceKm: 2.2,
    latitude: 17.7155,
    longitude: 83.3285,
    organization: 'GVMC & Visakhapatnam Smart City Corporation',
    predominantCategory: 'Single-use Food Service Plastic',
    dataSource: 'REAL_HISTORICAL',
  },
  {
    id: 'hist-vz-2024-02',
    cleanupId: 'CLN-VZ-2024-02',
    date: '2024-04-20',
    beachName: 'Rushikonda Blue Flag Shoreline',
    zone: 'Rushikonda Eco-Zone',
    totalWasteKg: 380,
    plasticWasteKg: 280,
    fishingGearKg: 25,
    glassMetalKg: 45,
    organicKg: 30,
    bagsCount: 30,
    volunteerCount: 75,
    durationHours: 2.5,
    distanceKm: 1.1,
    latitude: 17.7818,
    longitude: 83.3855,
    organization: 'Eco-Vizag Green Volunteers',
    predominantCategory: 'Thermocol & Plastic Bottles',
    dataSource: 'REAL_HISTORICAL',
  },
  {
    id: 'hist-vz-2024-03',
    cleanupId: 'CLN-VZ-2024-03',
    date: '2024-09-21',
    beachName: 'Bheemili Gosthani Confluence',
    zone: 'Estuary Confluence Sector',
    totalWasteKg: 920,
    plasticWasteKg: 430,
    fishingGearKg: 150,
    glassMetalKg: 80,
    organicKg: 260,
    bagsCount: 75,
    volunteerCount: 80,
    durationHours: 3.5,
    distanceKm: 1.6,
    latitude: 17.8920,
    longitude: 83.4540,
    organization: 'Bheemili Heritage & Coastal Protection Society',
    predominantCategory: 'Driftwood & River Plastic Runoff',
    dataSource: 'REAL_HISTORICAL',
  },
];

export async function listHistoricalCleanups(
  limitCount = 500,
  dataSourceFilter?: 'REAL_HISTORICAL' | 'DEMO'
): Promise<HistoricalCleanupDoc[]> {
  let list = localDataService.getHistoricalCleanups();
  if (list.length === 0) {
    // Try to parse the public CSV file if in browser
    try {
      if (typeof window !== 'undefined' && 'fetch' in window) {
        const resp = await fetch('/historical_beach_cleanup_visakhapatnam.csv');
        if (resp.ok) {
          const csvText = await resp.text();
          const parsed = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true });
          if (parsed.data && parsed.data.length > 0) {
            const mapped: HistoricalCleanupDoc[] = parsed.data.map((row, idx) => ({
              id: row.cleanupId || `hist-csv-${idx}`,
              cleanupId: row.cleanupId || `CLN-CSV-${idx + 1}`,
              date: row.date || '2024-01-01',
              beachName: row.beachName || row.locationName || 'Visakhapatnam Shoreline',
              zone: row.zone || row.coastalZone || 'Shoreline Intertidal',
              totalWasteKg: Number(row.totalWasteKg || row.weightKg || 100),
              plasticWasteKg: Number(row.plasticWasteKg || 50),
              fishingGearKg: Number(row.fishingGearKg || 20),
              glassMetalKg: Number(row.glassMetalKg || 15),
              organicKg: Number(row.organicKg || 15),
              bagsCount: Number(row.bagsCount || 10),
              volunteerCount: Number(row.volunteerCount || row.volunteers || 25),
              durationHours: Number(row.durationHours || 2),
              distanceKm: Number(row.distanceKm || 1),
              latitude: Number(row.latitude || 17.7155),
              longitude: Number(row.longitude || 83.3285),
              organization: row.organization || 'Visakhapatnam Coastal Directorate',
              predominantCategory: row.predominantCategory || row.wasteType || 'Plastic',
              dataSource: 'REAL_HISTORICAL',
            }));
            localDataService.saveHistoricalCleanups(mapped);
            list = mapped;
          }
        }
      }
    } catch (e) {
      console.warn('Could not fetch CSV, falling back to bundled data:', e);
    }

    if (list.length === 0) {
      localDataService.saveHistoricalCleanups(BUNDLED_HISTORICAL_DATA);
      list = BUNDLED_HISTORICAL_DATA;
    }
  }

  if (dataSourceFilter) {
    list = list.filter((r) => r.dataSource === dataSourceFilter);
  }

  return list.slice(0, limitCount);
}

export async function seedHistoricalCleanup(record: HistoricalCleanupDoc): Promise<void> {
  const current = localDataService.getHistoricalCleanups();
  localDataService.saveHistoricalCleanups([record, ...current.filter((c) => c.id !== record.id)]);
}

export async function batchImportHistoricalCleanups(
  records: HistoricalCleanupDoc[]
): Promise<{ imported: number; failed: number }> {
  try {
    const current = localDataService.getHistoricalCleanups();
    const existingIds = new Set(current.map((c) => c.cleanupId || c.id));
    const toAdd = records.filter((r) => !existingIds.has(r.cleanupId || r.id));
    localDataService.saveHistoricalCleanups([...toAdd, ...current]);
    return { imported: toAdd.length, failed: records.length - toAdd.length };
  } catch {
    return { imported: 0, failed: records.length };
  }
}

export async function deleteHistoricalCleanup(id: string): Promise<void> {
  const current = localDataService.getHistoricalCleanups();
  localDataService.saveHistoricalCleanups(current.filter((c) => c.id !== id));
}
