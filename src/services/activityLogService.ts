import { localDataService } from './localDataService';
import { ActivityLogDoc } from '../types/firestore';

export async function logActivity(data: Omit<ActivityLogDoc, 'id' | 'timestamp'>): Promise<string> {
  const id = `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const entry: ActivityLogDoc = {
    ...data,
    id,
    timestamp: new Date().toISOString(),
  };
  localDataService.addActivityLog(entry);
  return id;
}

export async function listActivityLogs(maxItems = 50): Promise<ActivityLogDoc[]> {
  const logs = localDataService.getActivityLogs();
  return logs.slice(0, maxItems);
}
