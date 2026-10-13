import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'daymate-state.json');

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

export interface TaskItem {
  id: string;
  projectId?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'queued' | 'in_progress' | 'awaiting_approval' | 'paused' | 'completed' | 'failed';
  assignedAgent: string;
  progress: number;
  deadline?: string;
  dependencies: string[];
  stages: { id: string; name: string; completed: boolean }[];
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
  scheduledTime: string; // e.g., "08:00"
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

const DEFAULT_STATE: DaymateState = {
  memories: [
    {
      id: 'mem-1',
      category: 'preference',
      title: 'Mobile-First Briefings',
      content: 'Prefers concise, actionable summaries on mobile. Bullet points with key metrics first.',
      tags: ['ui', 'tone', 'mobile'],
      isSensitive: false,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'mem-2',
      category: 'goal',
      title: 'Launch DAYMATE AI Companion',
      content: 'Build and deploy DAYMATE AI as an Android-first PWA with multi-agent planning and motion video workflows.',
      tags: ['roadmap', 'android', 'daymate'],
      isSensitive: false,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'mem-3',
      category: 'instruction',
      title: 'Confirmation Gates for Code & Deployments',
      content: 'Always request user confirmation before running destructive actions, code generation rewrites, or external API calls.',
      tags: ['safety', 'approvals'],
      isSensitive: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'mem-4',
      category: 'workflow',
      title: 'Motion Production Standard Pipeline',
      content: 'Follow the 12-stage pipeline: Brief -> Research -> Script -> Storyboard -> Shot List -> Visual Dev -> Asset Gen -> Timeline -> Motion -> Audio -> QC -> Export.',
      tags: ['motion', 'video', 'creative'],
      isSensitive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  tasks: [
    {
      id: 'task-1',
      projectId: 'proj-1',
      title: 'Orchestrator System Verification',
      description: 'Validate multi-agent delegation, speech synthesis, and checkpoint gates across Android devices.',
      priority: 'high',
      status: 'in_progress',
      assignedAgent: 'Planner',
      progress: 65,
      deadline: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      dependencies: [],
      stages: [
        { id: 'stg-1', name: 'Initialize memory and persona context', completed: true },
        { id: 'stg-2', name: 'Verify Gemini 3.8 Flash orchestration', completed: true },
        { id: 'stg-3', name: 'Implement audio stream and TTS playback', completed: true },
        { id: 'stg-4', name: 'Run security approval audit gate', completed: false },
      ],
      requiresApproval: true,
      deliverable: 'DAYMATE AI Core Orchestration Architecture verified',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-2',
      projectId: 'proj-2',
      title: 'Sci-Fi Motion Teaser Script & Storyboard',
      description: 'Draft 30s teaser narrative, camera direction, and kinetic typography for DAYMATE showcase video.',
      priority: 'medium',
      status: 'queued',
      assignedAgent: 'Creative Director',
      progress: 20,
      deadline: new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 10),
      dependencies: ['task-1'],
      stages: [
        { id: 'stg-a', name: 'Creative brief & pacing', completed: true },
        { id: 'stg-b', name: 'Storyboard generation', completed: false },
        { id: 'stg-c', name: 'Voiceover script & timing', completed: false },
      ],
      requiresApproval: false,
      deliverable: 'Storyboard cards & synchronized audio transcript',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-3',
      projectId: 'proj-1',
      title: 'PWA Offline & Hardware Permission Audit',
      description: 'Ensure microphone, camera, and notification permissions handle prompt/denial states gracefully.',
      priority: 'urgent',
      status: 'completed',
      assignedAgent: 'Quality Controller',
      progress: 100,
      deadline: new Date().toISOString().slice(0, 10),
      dependencies: [],
      stages: [
        { id: 'pwa-1', name: 'Add Web App Manifest with safe-zone icons', completed: true },
        { id: 'pwa-2', name: 'Test offline status banners', completed: true },
        { id: 'pwa-3', name: 'Build device permission center', completed: true },
      ],
      requiresApproval: false,
      deliverable: 'PWA Install Hook + Device Permission Center verified',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'DAYMATE Mobile OS Launch',
      description: 'Flagship personal AI operating system for mobile and daily progress.',
      goal: 'Deliver complete personal assistant, planner, coder, and creative studio on Android.',
      deadline: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
      category: 'Product & System',
      status: 'active',
      progress: 75,
      deliverables: ['Responsive Android UI', 'Voice/Text Chat', 'Task Queue', 'Memory Manager'],
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 'proj-2',
      title: 'Cyberpunk Motion Studio Reel',
      description: 'Dynamic 30-second motion graphics video showcasing DAYMATE capabilities.',
      goal: 'Produce multi-layer kinetic typography and AI video prompts for social launch.',
      deadline: new Date(Date.now() + 86400000 * 14).toISOString().slice(0, 10),
      category: 'Creative Production',
      status: 'active',
      progress: 40,
      deliverables: ['12-Stage Video Brief', 'Shot List', 'Motion Canvas Render'],
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ],
  routines: [
    {
      id: 'rtn-1',
      type: 'morning_brief',
      title: 'Morning Intelligence Briefing',
      scheduledTime: '08:00',
      enabled: true,
      lastRun: new Date().toISOString().slice(0, 10) + ' 08:00:00',
      summaryPrompt: 'Summarize today top priorities, weather context, and active task progress.',
    },
    {
      id: 'rtn-2',
      type: 'daily_planning',
      title: 'Midday Milestone Calibration',
      scheduledTime: '13:00',
      enabled: true,
      lastRun: undefined,
      summaryPrompt: 'Review completed subtasks and calibrate upcoming deadlines.',
    },
    {
      id: 'rtn-3',
      type: 'evening_review',
      title: 'Evening Retrospective & Learning Capture',
      scheduledTime: '21:00',
      enabled: true,
      lastRun: undefined,
      summaryPrompt: 'Capture lessons learned, record durable corrections, and prepare tomorrow queue.',
    },
  ],
  auditLogs: [
    {
      id: 'aud-1',
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      action: 'SYSTEM_BOOT',
      category: 'Security',
      details: 'DAYMATE OS initialized with server-side Gemini 3.8 security boundary.',
      approvedBy: 'System',
      status: 'success',
    },
    {
      id: 'aud-2',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      action: 'MEMORY_STORED',
      category: 'Memory',
      details: 'Recorded durable rule: Confirmation gates for code & deployments.',
      approvedBy: 'User',
      status: 'success',
    },
    {
      id: 'aud-3',
      timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
      action: 'TASK_STAGE_COMPLETED',
      category: 'Task Queue',
      details: 'Stage "Verify Gemini 3.8 Flash orchestration" marked complete.',
      approvedBy: 'Planner Agent',
      status: 'success',
    },
  ],
  deliveryPackages: [
    {
      id: 'pkg-1',
      projectId: 'proj-2',
      taskId: 'task-2',
      title: 'DAYMATE Mobile Launch Reel — Master Delivery Bundle',
      category: 'video_production',
      createdAt: new Date().toISOString(),
      status: 'ready',
      items: [
        {
          id: 'item-1',
          name: 'Production Script & Voiceover Cue Sheet',
          type: 'script',
          status: 'finished',
          description: 'Synchronized dialogue transcript with estimated timing & word counts.',
          fileFormat: 'MARKDOWN (.md)',
          fileSize: '4.2 KB',
          downloadData: `# DAYMATE AI: Mobile Launch Reel Script\n\nScene 1 (0-6s): "Every morning begins with intention."\nScene 2 (6-16s): "Your goals decomposed into actionable milestones, without friction."\nScene 3 (16-24s): "From concept to finished production in minutes."\nScene 4 (24-30s): "DAYMATE AI. Your Personal AI. Your Projects. Your Progress."`,
        },
        {
          id: 'item-2',
          name: 'Visual Storyboard & Shot Prompts',
          type: 'document',
          status: 'finished',
          description: '4 Scene camera angles, framing specs, and Veo/SnapGen payload prompts.',
          fileFormat: 'JSON (.json)',
          fileSize: '8.6 KB',
          downloadData: JSON.stringify({
            aspectRatio: '16:9',
            framerate: 30,
            scenes: 4,
            style: 'Cinematic Sci-Fi',
          }, null, 2),
        },
        {
          id: 'item-3',
          name: 'Synchronized Captions (.SRT)',
          type: 'subtitles',
          status: 'finished',
          description: 'SubRip subtitle file with millisecond-accurate timestamps.',
          fileFormat: 'SRT (.srt)',
          fileSize: '1.8 KB',
          downloadData: `1\n00:00:00,500 --> 00:00:05,500\nEvery morning begins with intention.\n\n2\n00:00:06,000 --> 00:00:15,000\nYour goals decomposed into actionable milestones, without friction.\n\n3\n00:00:16,000 --> 00:00:23,500\nFrom concept to finished production in minutes.\n\n4\n00:00:24,000 --> 00:00:29,500\nDAYMATE AI. Your Personal AI. Your Projects. Your Progress.`,
        },
        {
          id: 'item-4',
          name: 'Master Video Composition (.WEBM)',
          type: 'video',
          status: 'finished',
          description: 'Rendered motion graphics canvas master cut (1080p, 30fps).',
          fileFormat: 'WEBM (.webm)',
          fileSize: '12.4 MB',
        },
        {
          id: 'item-5',
          name: 'Color Grade & Anamorphic Flare Check',
          type: 'archive',
          status: 'requires_attention',
          description: 'Review contrast curve on OLED mobile displays before social publish.',
          attentionNote: 'Pending user sign-off on mobile OLED black-level saturation.',
          fileFormat: 'PROFILE (.icc)',
          fileSize: '450 KB',
        },
      ],
    },
    {
      id: 'pkg-2',
      projectId: 'proj-1',
      taskId: 'task-1',
      title: 'Local On-Device AI Benchmarks — Intelligence Package',
      category: 'research_intelligence',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      status: 'ready',
      items: [
        {
          id: 'item-201',
          name: 'Executive Intelligence Report',
          type: 'document',
          status: 'finished',
          description: 'Verified empirical findings comparing on-device NPU inference vs cloud LLMs.',
          fileFormat: 'MARKDOWN (.md)',
          fileSize: '18.5 KB',
          downloadData: `# Local On-Device AI Benchmark Report\n\nConducted: 2026-10-12\n\n## Verified Findings\n- Snapdragon 8 Gen 4 / Tensor G5 deliver 45 tokens/sec on 3B quantized models.\n- Memory footprint reduced to 1.8GB with 4-bit AWQ quantization.\n- Hybrid cloud orchestrators provide 98% quality retention with zero offline loss.`,
        },
        {
          id: 'item-202',
          name: 'Empirical Benchmark Spreadsheet',
          type: 'data',
          status: 'finished',
          description: 'Raw latency, power draw, and throughput test matrix.',
          fileFormat: 'CSV (.csv)',
          fileSize: '6.2 KB',
          downloadData: `Device,Chipset,Model,TokensPerSec,PowerDrawWatts,LatencyMs\nPixel 9 Pro,Tensor G4,Gemini Nano 2,38.4,2.8,18ms\nGalaxy S25,8 Elite,Llama 3.2 3B,52.1,3.1,14ms\nDaymate PWA,WebAssembly,Transformer.js,22.0,1.9,32ms`,
        },
        {
          id: 'item-203',
          name: 'Grounded Citation Registry',
          type: 'document',
          status: 'finished',
          description: '12 Verified source URLs and academic benchmarks.',
          fileFormat: 'JSON (.json)',
          fileSize: '3.1 KB',
        },
        {
          id: 'item-204',
          name: 'Executive Pitch & Roadmap Recommendations',
          type: 'pitch',
          status: 'requires_attention',
          description: 'Actionable slide deck suggestions for native companion distribution.',
          attentionNote: 'Requires user decision on Capacitor vs native Kotlin Compose companion.',
          fileFormat: 'DECK (.md)',
          fileSize: '5.0 KB',
        },
      ],
    },
  ],
  autonomyConfig: {
    tier: 2, // 2: Guided Assistant
    maxAutomatedTasksPerHour: 10,
    autoApproveLowRisk: true,
    allowedCapabilities: {
      routineBriefings: true,
      researchDrafting: true,
      motionVisualScripting: true,
      memoryCapturing: true,
      codeAnalysis: true,
    },
    strictGates: {
      fileDeletion: true,
      externalDeployment: true,
      paidApiUsage: true,
      externalPublishing: true,
    },
  },
  autonomyActivities: [
    {
      id: 'act-1',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      agentRole: 'Planner',
      action: 'Auto-prioritized daily sprint backlog based on deadline proximity',
      riskLevel: 'low',
      status: 'executed',
      explanation: 'Routine optimization evaluated without side-effects.',
    },
    {
      id: 'act-2',
      timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
      agentRole: 'Creative Director',
      action: 'Generated 4-scene video script for Mobile Launch Reel',
      riskLevel: 'low',
      status: 'executed',
      explanation: 'Drafted production script within authorized studio workspace.',
    },
    {
      id: 'act-3',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      agentRole: 'Coder',
      action: 'Attempted external production file overwrite',
      riskLevel: 'high',
      status: 'gated_approval',
      explanation: 'Action blocked by Strict Approval Gate. Awaiting explicit user confirmation.',
    },
  ],
  visualCritiques: [
    {
      id: 'crit-1',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      sceneIndex: 1,
      feedbackText: 'The camera movement is too fast, the captions are covering the subject, and the title animation feels cheap. Fix those three things.',
      detectedIssues: ['camera_speed_fast', 'caption_overlap', 'title_style_cheap'],
      appliedChanges: [
        'Slowed camera pan speed by 40% (converted to Smooth 3D Orbital Dolly)',
        'Shifted caption offset Y from 270px to 330px to clear focal subject',
        'Upgraded motion typography to Kinetic Cyber Glow with cubic-bezier easing',
      ],
      savedDurableMemory: 'Caption placement must maintain 30px bottom margin on mobile frames to prevent subject occlusion.',
    },
  ],
};

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getState(): DaymateState {
  ensureDir();
  if (!fs.existsSync(DATA_FILE)) {
    saveState(DEFAULT_STATE);
    return DEFAULT_STATE;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    // Backfill any missing arrays from newer schema versions
    return {
      ...DEFAULT_STATE,
      ...parsed,
      deliveryPackages: parsed.deliveryPackages || DEFAULT_STATE.deliveryPackages,
      autonomyConfig: parsed.autonomyConfig || DEFAULT_STATE.autonomyConfig,
      autonomyActivities: parsed.autonomyActivities || DEFAULT_STATE.autonomyActivities,
      visualCritiques: parsed.visualCritiques || DEFAULT_STATE.visualCritiques,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: DaymateState): void {
  ensureDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
}
