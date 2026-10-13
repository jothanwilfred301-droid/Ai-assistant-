import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  CheckCircle2,
  Clock,
  ArrowRight,
  Mic,
  Clapperboard,
  Code2,
  Search,
  Plus,
  Volume2,
  VolumeX,
  ShieldCheck,
  BrainCircuit,
  TrendingUp,
  Package,
  Shield,
} from 'lucide-react';
import { TaskItem, ProjectItem, RoutineItem, AgentRole, MemoryItem, HubSubTab } from '../../types.js';

interface HomeDashboardProps {
  tasks: TaskItem[];
  projects: ProjectItem[];
  routines: RoutineItem[];
  memories: MemoryItem[];
  deliveryPackagesCount?: number;
  autonomyTier?: number;
  onSelectAgent: (role: AgentRole) => void;
  onOpenChat: (initialPrompt?: string) => void;
  onOpenPlanner: () => void;
  onOpenStudio: (tab: 'motion' | 'code' | 'research') => void;
  onOpenHub: (tab: HubSubTab) => void;
  onTriggerRoutine: (routineId: string) => Promise<string>;
  onSpeak: (text: string) => void;
  isVoiceMuted: boolean;
  onToggleTaskComplete: (taskId: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  tasks,
  projects,
  routines,
  memories,
  deliveryPackagesCount = 2,
  autonomyTier = 2,
  onSelectAgent,
  onOpenChat,
  onOpenPlanner,
  onOpenStudio,
  onOpenHub,
  onTriggerRoutine,
  onSpeak,
  isVoiceMuted,
  onToggleTaskComplete,
}) => {
  const [briefingText, setBriefingText] = useState<string | null>(null);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);

  // Time-of-day greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Urgent and active tasks
  const activeTasks = tasks.filter((t) => t.status === 'in_progress' || t.status === 'queued').slice(0, 3);
  const currentProject = projects[0];

  const agentSquad: Array<{ role: AgentRole; desc: string; color: string }> = [
    { role: 'Planner', desc: 'Decomposes goals & milestones', color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40' },
    { role: 'Research Analyst', desc: 'Search grounding & verification', color: 'text-blue-400 bg-blue-950/40 border-blue-800/40' },
    { role: 'Bioscience Scout', desc: 'AlphaFold & molecular biology', color: 'text-purple-400 bg-purple-950/40 border-purple-800/40' },
    { role: 'UI/UX Architect', desc: 'Design systems & Claude web code', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40' },
    { role: 'Coder', desc: 'Apps, logic & security sandboxing', color: 'text-green-400 bg-green-950/40 border-green-800/40' },
    { role: 'Writer', desc: 'Scripts, copy & briefing synthesis', color: 'text-amber-400 bg-amber-950/40 border-amber-800/40' },
    { role: 'Creative Director', desc: 'Aesthetic direction & concepts', color: 'text-indigo-400 bg-indigo-950/40 border-indigo-800/40' },
    { role: 'Motion Designer', desc: 'Kinetic typography & curves', color: 'text-pink-400 bg-pink-950/40 border-pink-800/40' },
    { role: 'Video Editor', desc: '12-stage timeline & audio sync', color: 'text-rose-400 bg-rose-950/40 border-rose-800/40' },
    { role: 'Quality Controller', desc: 'Auditing, security & sanity checks', color: 'text-teal-400 bg-teal-950/40 border-teal-800/40' },
  ];

  const handleRunBriefing = async () => {
    const routine = routines.find((r) => r.type === 'morning_brief') || routines[0];
    if (!routine) return;
    setIsGeneratingBriefing(true);
    try {
      const summary = await onTriggerRoutine(routine.id);
      setBriefingText(summary);
      if (!isVoiceMuted) {
        onSpeak(summary);
      }
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Welcome Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-4 sm:p-5 shadow-lg">
        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Daymate AI OS
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {greeting}, Creator.
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
            Your Personal AI. Your Projects. Your Progress. What milestone are we advancing today?
          </p>

          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => onOpenChat()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition active:scale-[0.98]"
            >
              <Mic className="w-3.5 h-3.5" />
              Talk with Daymate
            </button>
            <button
              onClick={handleRunBriefing}
              disabled={isGeneratingBriefing}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <Play className="w-3 h-3 text-cyan-400 fill-cyan-400" />
              <span>{isGeneratingBriefing ? 'Synthesizing...' : 'Daily Brief'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Routine Briefing Result Banner */}
      {briefingText && (
        <div className="rounded-xl bg-slate-900 border border-cyan-500/30 p-3.5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
              <BrainCircuit className="w-4 h-4" />
              <span>Morning Intelligence Briefing</span>
            </div>
            <button
              onClick={() => onSpeak(briefingText)}
              className="p-1 text-slate-400 hover:text-cyan-300 transition"
              title="Read aloud"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
            {briefingText}
          </p>
        </div>
      )}

      {/* Quick Action Matrix */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
          Quick Launch Workspaces
        </h3>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => onOpenChat()}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 transition group active:scale-95"
          >
            <div className="w-9 h-9 rounded-lg bg-cyan-950/70 text-cyan-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
              <Mic className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-200 text-center">Voice Chat</span>
          </button>

          <button
            onClick={() => onOpenStudio('motion')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-pink-500/50 hover:bg-slate-800/80 transition group active:scale-95"
          >
            <div className="w-9 h-9 rounded-lg bg-pink-950/70 text-pink-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
              <Clapperboard className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-200 text-center">Motion Studio</span>
          </button>

          <button
            onClick={() => onOpenStudio('code')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 transition group active:scale-95"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-950/70 text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
              <Code2 className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-200 text-center">Coder</span>
          </button>

          <button
            onClick={() => onOpenStudio('research')}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/80 transition group active:scale-95"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-950/70 text-blue-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
              <Search className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-200 text-center">Research</span>
          </button>
        </div>
      </div>

      {/* Current Project Snapshot */}
      {currentProject && (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              Active Project: {currentProject.title}
            </span>
            <span className="text-[11px] font-mono text-cyan-400">{currentProject.progress}%</span>
          </div>

          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${currentProject.progress}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-400 line-clamp-1">{currentProject.goal}</p>
        </div>
      )}

      {/* Priority Capabilities: Delivery & Autonomy Overview Cards */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onOpenHub('delivery')}
          className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 text-left transition group active:scale-98"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-950/70 text-emerald-400 flex items-center justify-center">
              <Package className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              {deliveryPackagesCount || 2} Ready
            </span>
          </div>
          <span className="text-xs font-bold text-slate-200 block">Delivery Packages</span>
          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
            Finished scripts, data, and video masters.
          </p>
        </button>

        <button
          onClick={() => onOpenHub('autonomy')}
          className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 text-left transition group active:scale-98"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-950/70 text-cyan-400 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-mono text-cyan-400 font-bold">
              Tier {autonomyTier || 2}
            </span>
          </div>
          <span className="text-xs font-bold text-slate-200 block">Trustworthy Autonomy</span>
          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
            Guided boundaries & strict safety gates.
          </p>
        </button>
      </div>

      {/* Active Tasks Queue */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Priority Tasks ({activeTasks.length})
          </h3>
          <button
            onClick={onOpenPlanner}
            className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
          >
            View Planner <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {activeTasks.length === 0 ? (
          <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-4 text-center">
            <p className="text-xs text-slate-400">All planned tasks completed!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
              >
                <div className="flex items-start gap-2.5 min-w-0 pr-2">
                  <button
                    onClick={() => onToggleTaskComplete(task.id)}
                    className="mt-0.5 text-slate-500 hover:text-emerald-400 transition"
                  >
                    <CheckCircle2
                      className={`w-4 h-4 ${
                        task.status === 'completed' ? 'text-emerald-400 fill-emerald-950' : ''
                      }`}
                    />
                  </button>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="font-medium text-cyan-400">{task.assignedAgent}</span>
                      <span>·</span>
                      <span
                        className={`capitalize font-semibold ${
                          task.priority === 'urgent'
                            ? 'text-rose-400'
                            : task.priority === 'high'
                            ? 'text-amber-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {task.priority}
                      </span>
                      {task.deadline && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {task.deadline}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {task.progress}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 10 Specialized Agents Squad */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Specialized Agent Squad (10)
          </h3>
          <span className="text-[10px] text-slate-400">Orchestrator ready</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {agentSquad.map((agent) => (
            <button
              key={agent.role}
              onClick={() => {
                onSelectAgent(agent.role);
                onOpenChat(`Delegate to ${agent.role}: `);
              }}
              className={`p-2.5 rounded-xl border text-left transition hover:scale-[1.02] active:scale-95 ${agent.color}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold leading-tight">{agent.role}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[10px] text-slate-300 leading-tight line-clamp-2">{agent.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Memory Highlights Card */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
            Personalized Memory Core ({memories.length})
          </span>
          <button
            onClick={() => onOpenHub('memory')}
            className="text-[10px] font-semibold text-purple-400 hover:text-purple-300"
          >
            Manage Memory
          </button>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {memories[0]?.title}: "{memories[0]?.content}"
        </p>
      </div>
    </div>
  );
};
