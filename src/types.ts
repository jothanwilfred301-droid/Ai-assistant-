export type AgentRole =
  | 'Planner'
  | 'Research Analyst'
  | 'Writer'
  | 'Coder'
  | 'UI/UX Architect'
  | 'Creative Director'
  | 'Motion Designer'
  | 'Video Editor'
  | 'Quality Controller'
  | 'Bioscience Scout';

export interface MemoryItem {
  id: string;
  category: 'preference' | 'style' | 'goal' | 'project' | 'instruction' | 'correction' | 'workflow' | 'decision';
  title: string;
  content: string;
  tags: string[];
  isSensitive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStage {
  id: string;
  name: string;
  completed: boolean;
}

export interface TaskItem {
  id: string;
  projectId?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'queued' | 'in_progress' | 'awaiting_approval' | 'paused' | 'completed' | 'failed';
  assignedAgent: AgentRole | string;
  progress: number;
  deadline?: string;
  dependencies: string[];
  stages: TaskStage[];
  requiresApproval: boolean;
  deliverable?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  goal: string;
  deadline: string;
  category: string;
  status: 'active' | 'planning' | 'completed' | 'on_hold';
  progress: number;
  deliverables: string[];
  createdAt: string;
}

export interface RoutineItem {
  id: string;
  type: 'morning_brief' | 'daily_planning' | 'progress_checkin' | 'evening_review' | 'custom';
  title: string;
  scheduledTime: string;
  enabled: boolean;
  lastRun?: string;
  summaryPrompt: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  action: string;
  category: string;
  details: string;
  approvedBy: string;
  status: 'success' | 'warning' | 'declined';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentRole?: AgentRole;
  timestamp: string;
  audioBase64?: string;
  groundingUsed?: 'none' | 'search' | 'maps';
  citations?: Array<{ title: string; url: string }>;
  attachments?: Array<{ name: string; type: string; url?: string }>;
}

export interface ResearchReport {
  query: string;
  summary: string;
  sources: Array<{ title: string; url: string }>;
  conductedAt: string;
}

export interface MotionScene {
  sceneNumber: number;
  title: string;
  duration: number;
  visualPrompt: string;
  cameraAngle: string;
  narration: string;
  motionGraphic: string;
}

export interface MotionProject {
  title: string;
  durationSeconds: number;
  style: string;
  scenes: MotionScene[];
}

export type ActiveTab = 'home' | 'chat' | 'planner' | 'studio' | 'hub';
export type StudioSubTab = 'motion' | 'code' | 'research' | 'science' | 'maps';
export type HubSubTab = 'memory' | 'delivery' | 'autonomy' | 'permissions' | 'routines' | 'security' | 'providers';

export interface DeliveryItem {
  id: string;
  name: string;
  type: 'document' | 'video' | 'script' | 'data' | 'subtitles' | 'archive' | 'pitch';
  status: 'finished' | 'requires_attention';
  description: string;
  attentionNote?: string;
  fileFormat: string;
  downloadData?: string;
  fileSize?: string;
}

export interface DeliveryPackage {
  id: string;
  projectId?: string;
  taskId?: string;
  title: string;
  category: 'video_production' | 'research_intelligence' | 'code_application' | 'strategic_planning';
  createdAt: string;
  status: 'ready' | 'pending_attention';
  items: DeliveryItem[];
}

export interface AutonomyConfig {
  tier: 1 | 2 | 3;
  maxAutomatedTasksPerHour: number;
  autoApproveLowRisk: boolean;
  allowedCapabilities: {
    routineBriefings: boolean;
    researchDrafting: boolean;
    motionVisualScripting: boolean;
    memoryCapturing: boolean;
    codeAnalysis: boolean;
  };
  strictGates: {
    fileDeletion: boolean;
    externalDeployment: boolean;
    paidApiUsage: boolean;
    externalPublishing: boolean;
  };
}

export interface AutonomyActivity {
  id: string;
  timestamp: string;
  agentRole: string;
  action: string;
  riskLevel: 'low' | 'moderate' | 'high';
  status: 'executed' | 'gated_approval' | 'failed' | 'in_progress';
  explanation: string;
  failureReason?: string;
}

export interface VisualCritiqueRecord {
  id: string;
  timestamp: string;
  sceneIndex: number;
  feedbackText: string;
  detectedIssues: string[];
  appliedChanges: string[];
  savedDurableMemory: string;
}

export interface DaymateState {
  memories: MemoryItem[];
  tasks: TaskItem[];
  projects: ProjectItem[];
  routines: RoutineItem[];
  auditLogs: AuditLogItem[];
  deliveryPackages: DeliveryPackage[];
  autonomyConfig: AutonomyConfig;
  autonomyActivities: AutonomyActivity[];
  visualCritiques: VisualCritiqueRecord[];
}


