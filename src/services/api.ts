import { DaymateState, MemoryItem, TaskItem, ProjectItem, RoutineItem, AuditLogItem } from '../types.js';

export async function fetchState(): Promise<DaymateState> {
  const res = await fetch('/api/state');
  if (!res.ok) throw new Error('Failed to fetch state');
  return res.json();
}

export async function fetchSystemStatus() {
  const res = await fetch('/api/system/status');
  if (!res.ok) throw new Error('Failed to fetch system status');
  return res.json();
}

export async function sendChatMessage(payload: {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  currentAgent?: string;
  attachments?: Array<{ name: string; mimeType: string; base64: string }>;
  grounding?: 'none' | 'search' | 'maps';
}) {
  const res = await fetch('/api/orchestrator/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.details || err.error || 'Failed to communicate with AI orchestrator');
  }
  return res.json();
}

export async function performResearch(query: string, depth = 'standard') {
  const res = await fetch('/api/research', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, depth }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.details || err.error || 'Research failed');
  }
  return res.json();
}

export async function generateTTS(text: string, voice = 'Kore') {
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice }),
  });
  if (!res.ok) throw new Error('TTS failed');
  return res.json();
}

export async function generateCode(prompt: string, currentCode = '', language = 'typescript') {
  const res = await fetch('/api/code/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, currentCode, language }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.details || err.error || 'Code generation failed');
  }
  return res.json();
}

export async function generateMotionScript(brief: string, duration = 30, style = 'Cinematic Sci-Fi') {
  const res = await fetch('/api/motion/generate-script', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brief, duration, style }),
  });
  if (!res.ok) throw new Error('Motion script generation failed');
  return res.json();
}

export async function saveMemory(memory: Partial<MemoryItem>) {
  const res = await fetch('/api/memories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(memory),
  });
  if (!res.ok) throw new Error('Failed to save memory');
  return res.json();
}

export async function deleteMemory(id: string) {
  const res = await fetch(`/api/memories/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete memory');
  return res.json();
}

export interface SemanticSearchMatch {
  id: string;
  score: number;
  reason?: string;
}

export interface SemanticSearchResponse {
  detectedIntent?: string;
  source: 'gemini' | 'heuristic';
  matches: SemanticSearchMatch[];
  totalConsidered?: number;
}

export async function semanticSearchMemories(
  query: string,
  memories?: MemoryItem[]
): Promise<SemanticSearchResponse> {
  const res = await fetch('/api/memories/semantic-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, memories }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.details || err.error || 'Failed to perform semantic memory search');
  }
  return res.json();
}

export async function saveTask(task: Partial<TaskItem>) {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error('Failed to save task');
  return res.json();
}

export async function deleteTask(id: string) {
  const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete task');
  return res.json();
}

export async function saveProject(project: Partial<ProjectItem>) {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  if (!res.ok) throw new Error('Failed to save project');
  return res.json();
}

export async function triggerRoutine(id: string) {
  const res = await fetch(`/api/routines/trigger/${id}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to trigger routine');
  return res.json();
}

export async function logAudit(action: string, category: string, details: string, approvedBy = 'User', status: 'success' | 'warning' | 'declined' = 'success') {
  const res = await fetch('/api/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, category, details, approvedBy, status }),
  });
  if (!res.ok) throw new Error('Failed to log audit');
  return res.json();
}

export async function importState(state: DaymateState) {
  const res = await fetch('/api/state/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  });
  if (!res.ok) throw new Error('Failed to import state');
  return res.json();
}

export async function applyVisualFeedback(feedbackText: string, scene: any, sceneIndex = 0) {
  const res = await fetch('/api/motion/apply-feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feedbackText, scene, sceneIndex }),
  });
  if (!res.ok) throw new Error('Failed to apply visual feedback');
  return res.json();
}

export async function updateAutonomyConfig(config: any) {
  const res = await fetch('/api/autonomy/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error('Failed to update autonomy config');
  return res.json();
}

export async function updateDeliveryItemStatus(packageId: string, itemId: string, newStatus: 'finished' | 'requires_attention') {
  const res = await fetch('/api/delivery/item-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ packageId, itemId, newStatus }),
  });
  if (!res.ok) throw new Error('Failed to update delivery item status');
  return res.json();
}

