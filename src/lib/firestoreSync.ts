import { db, doc, setDoc, getDoc, onSnapshot } from './firebase.js';
import { DaymateState, MemoryItem, TaskItem, DeliveryPackage } from '../types.js';

export async function saveStateToFirestore(userId: string, state: DaymateState): Promise<void> {
  if (!userId) return;
  try {
    const userDocRef = doc(db, 'users', userId, 'data', 'state');
    await setDoc(
      userDocRef,
      {
        ...state,
        lastSyncedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Firestore sync failed (offline or permission):', err);
  }
}

export async function loadStateFromFirestore(userId: string): Promise<DaymateState | null> {
  if (!userId) return null;
  try {
    const userDocRef = doc(db, 'users', userId, 'data', 'state');
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as DaymateState;
    }
    return null;
  } catch (err) {
    console.warn('Firestore load failed:', err);
    return null;
  }
}

export function subscribeToCloudState(
  userId: string,
  onUpdate: (state: DaymateState) => void
): () => void {
  if (!userId) return () => {};
  const userDocRef = doc(db, 'users', userId, 'data', 'state');
  return onSnapshot(
    userDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as DaymateState);
      }
    },
    (err) => {
      console.warn('Firestore realtime sync listener error:', err);
    }
  );
}

export async function saveMemoryToFirestore(userId: string, memory: MemoryItem): Promise<void> {
  if (!userId || !memory.id) return;
  try {
    const memRef = doc(db, 'users', userId, 'memories', memory.id);
    await setDoc(memRef, memory, { merge: true });
  } catch (err) {
    console.warn('Firestore memory sync error:', err);
  }
}

export async function saveTaskToFirestore(userId: string, task: TaskItem): Promise<void> {
  if (!userId || !task.id) return;
  try {
    const taskRef = doc(db, 'users', userId, 'tasks', task.id);
    await setDoc(taskRef, task, { merge: true });
  } catch (err) {
    console.warn('Firestore task sync error:', err);
  }
}

export async function saveDeliveryToFirestore(
  userId: string,
  pkg: DeliveryPackage
): Promise<void> {
  if (!userId || !pkg.id) return;
  try {
    const pkgRef = doc(db, 'users', userId, 'deliveries', pkg.id);
    await setDoc(pkgRef, pkg, { merge: true });
  } catch (err) {
    console.warn('Firestore delivery sync error:', err);
  }
}
