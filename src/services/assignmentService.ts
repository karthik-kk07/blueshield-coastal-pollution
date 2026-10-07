import { AssignmentDoc } from '../types/firestore';
import { localEvents } from './localDataService';

const ASSIGNMENTS_KEY = 'blueshield_local_assignments_v3';

function getLocalAssignments(): AssignmentDoc[] {
  try {
    const raw = localStorage.getItem(ASSIGNMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAssignments(assignments: AssignmentDoc[]): void {
  try {
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
    localEvents.notify('assignments_updated');
  } catch (err) {
    console.error('Failed to save assignments:', err);
  }
}

export async function createAssignment(data: Omit<AssignmentDoc, 'id' | 'assignedAt'>): Promise<string> {
  const id = `asg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const assignment: AssignmentDoc = {
    ...data,
    id,
    assignedAt: new Date().toISOString(),
  };
  const list = getLocalAssignments();
  saveLocalAssignments([assignment, ...list]);
  return id;
}

export async function listAssignments(): Promise<AssignmentDoc[]> {
  return getLocalAssignments();
}

export async function updateAssignmentStatus(
  id: string,
  status: AssignmentDoc['status'],
  notes?: string
): Promise<void> {
  const list = getLocalAssignments();
  const index = list.findIndex((a) => a.id === id);
  if (index !== -1) {
    list[index] = {
      ...list[index],
      status,
      ...(notes ? { notes } : {}),
    };
    saveLocalAssignments(list);
  }
}

export function subscribeToAssignments(
  onAssignments: (assignments: AssignmentDoc[]) => void,
  _onError?: (err: unknown) => void
): () => void {
  const notify = () => {
    onAssignments(getLocalAssignments());
  };
  notify();

  const handler = () => notify();
  localEvents.addEventListener('assignments_updated', handler);
  return () => {
    localEvents.removeEventListener('assignments_updated', handler);
  };
}
