import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Clock,
  Lock,
  Unlock,
  Radio,
} from 'lucide-react';
import { AutonomyConfig, AutonomyActivity } from '../../types.js';

interface AutonomyCenterProps {
  config: AutonomyConfig;
  activities: AutonomyActivity[];
  onUpdateConfig: (config: Partial<AutonomyConfig>) => Promise<void>;
}

export const AutonomyCenter: React.FC<AutonomyCenterProps> = ({
  config,
  activities,
  onUpdateConfig,
}) => {
  const [selectedTier, setSelectedTier] = useState<1 | 2 | 3>(config.tier);
  const [tasksPerHour, setTasksPerHour] = useState<number>(config.maxAutomatedTasksPerHour);
  const [autoLowRisk, setAutoLowRisk] = useState<boolean>(config.autoApproveLowRisk);

  const [capabilities, setCapabilities] = useState({
    routineBriefings: config.allowedCapabilities.routineBriefings,
    researchDrafting: config.allowedCapabilities.researchDrafting,
    motionVisualScripting: config.allowedCapabilities.motionVisualScripting,
    memoryCapturing: config.allowedCapabilities.memoryCapturing,
    codeAnalysis: config.allowedCapabilities.codeAnalysis,
  });

  const [strictGates, setStrictGates] = useState({
    fileDeletion: config.strictGates.fileDeletion,
    externalDeployment: config.strictGates.externalDeployment,
    paidApiUsage: config.strictGates.paidApiUsage,
    externalPublishing: config.strictGates.externalPublishing,
  });

  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleSave = async (tierOverride?: 1 | 2 | 3) => {
    const tierToSave = tierOverride ?? selectedTier;
    await onUpdateConfig({
      tier: tierToSave,
      maxAutomatedTasksPerHour: tasksPerHour,
      autoApproveLowRisk: autoLowRisk,
      allowedCapabilities: capabilities,
      strictGates,
    });
    setSaveStatus('Autonomy boundaries successfully updated.');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const tiers = [
    {
      level: 1 as const,
      title: 'Tier 1: Strict Supervised',
      desc: 'Full human-in-the-loop. Every action, subtask, and external call requires manual approval before execution.',
      badge: 'Zero Autonomous Risk',
      color: 'border-slate-800 text-slate-300',
      activeColor: 'bg-slate-900 border-cyan-500 text-cyan-300 shadow-md',
    },
    {
      level: 2 as const,
      title: 'Tier 2: Guided Assistant (Recommended)',
      desc: 'Authorizes routine, low-risk tasks within defined limits while keeping strict approval requirements for sensitive actions.',
      badge: 'Balanced Autonomy',
      color: 'border-slate-800 text-slate-300',
      activeColor: 'bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow-md',
    },
    {
      level: 3 as const,
      title: 'Tier 3: Delegated Autonomy',
      desc: 'Agent executes multi-step sprints and daily maintenance proactively within hard hourly limits and security bounds.',
      badge: 'High Autonomy',
      color: 'border-slate-800 text-slate-300',
      activeColor: 'bg-indigo-950/40 border-indigo-500 text-indigo-300 shadow-md',
    },
  ];

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-emerald-400" />
          Trustworthy Autonomy & Delegation System
        </h2>
        <p className="text-[11px] text-slate-400">
          Authorize routine execution within defined guardrails while retaining absolute control over sensitive actions.
        </p>
      </div>

      {saveStatus && (
        <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-xs text-emerald-300">
          {saveStatus}
        </div>
      )}

      {/* Autonomy Tier Selection */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-1">
          Select Operating Autonomy Tier
        </span>
        <div className="grid grid-cols-1 gap-2.5">
          {tiers.map((t) => {
            const isCurrent = selectedTier === t.level;
            return (
              <div
                key={t.level}
                onClick={() => {
                  setSelectedTier(t.level);
                  handleSave(t.level);
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  isCurrent ? t.activeColor : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{t.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                      {t.badge}
                    </span>
                  </div>
                  {isCurrent ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-700" />
                  )}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{t.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delegation Limits & Guardrails */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            Bounded Delegation Guardrails
          </h3>
          <button
            onClick={() => handleSave()}
            className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300"
          >
            Save Guardrails
          </button>
        </div>

        {/* Hourly Task Quota Slider */}
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span>Execution Quota (Max automated actions / hour):</span>
            <span className="font-mono font-bold text-cyan-400">{tasksPerHour} tasks/hr</span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            value={tasksPerHour}
            onChange={(e) => setTasksPerHour(Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
        </div>

        {/* Low-Risk Auto Approval Toggle */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
          <div>
            <span className="font-semibold text-slate-200 block">Auto-Authorize Low-Risk Tasks</span>
            <span className="text-[10px] text-slate-400">
              Permit routine web research, timeline re-timing, and memory captures without prompting.
            </span>
          </div>
          <input
            type="checkbox"
            checked={autoLowRisk}
            onChange={(e) => setAutoLowRisk(e.target.checked)}
            className="rounded border-slate-700 bg-slate-800 text-emerald-500"
          />
        </div>

        {/* Strict Gates Checklist */}
        <div className="space-y-2 pt-1 border-t border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Mandatory Confirmation Gates (Never Run Autonomously)
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
              <input
                type="checkbox"
                checked={strictGates.fileDeletion}
                onChange={(e) => setStrictGates((prev) => ({ ...prev, fileDeletion: e.target.checked }))}
                className="rounded border-slate-700 bg-slate-800 text-rose-500"
              />
              <span>File/Data Deletion</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
              <input
                type="checkbox"
                checked={strictGates.paidApiUsage}
                onChange={(e) => setStrictGates((prev) => ({ ...prev, paidApiUsage: e.target.checked }))}
                className="rounded border-slate-700 bg-slate-800 text-rose-500"
              />
              <span>Paid Cloud Video API</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
              <input
                type="checkbox"
                checked={strictGates.externalDeployment}
                onChange={(e) => setStrictGates((prev) => ({ ...prev, externalDeployment: e.target.checked }))}
                className="rounded border-slate-700 bg-slate-800 text-rose-500"
              />
              <span>Code Deployments</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
              <input
                type="checkbox"
                checked={strictGates.externalPublishing}
                onChange={(e) => setStrictGates((prev) => ({ ...prev, externalPublishing: e.target.checked }))}
                className="rounded border-slate-700 bg-slate-800 text-rose-500"
              />
              <span>External Publishing</span>
            </label>
          </div>
        </div>
      </div>

      {/* Real-time Autonomous Activity Stream & Failure Explainer */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            Autonomous Activity & Reasoning Stream ({activities.length})
          </h3>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Audit
          </span>
        </div>

        <div className="space-y-2">
          {activities.map((act) => (
            <div
              key={act.id}
              className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                act.status === 'executed'
                  ? 'bg-slate-950 border-slate-800 text-slate-200'
                  : act.status === 'gated_approval'
                  ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                  : 'bg-rose-950/30 border-rose-800/60 text-rose-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-400">{act.agentRole}</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="font-semibold text-white">{act.action}</p>
              <p className="text-[11px] text-slate-300 leading-relaxed">{act.explanation}</p>
              {act.failureReason && (
                <div className="flex items-center gap-1.5 text-[10px] text-rose-300 pt-0.5">
                  <XCircle className="w-3 h-3 flex-shrink-0" />
                  <span>Failure Explanation: {act.failureReason}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Honest Capability Truth Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-3.5 space-y-2 text-xs">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>Honest Capability Truth Table</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          DAYMATE AI never pretends it has capabilities it doesn't.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] pt-1">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
            <span>Grounded Live Google Web Search</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
            <span>Real Canvas WebM Video Render Engine</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
            <span>Persistent Structured Personal Memory</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-400">
            <XCircle className="w-3 h-3 flex-shrink-0" />
            <span>No Unprompted Android System File Reads</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-400">
            <XCircle className="w-3 h-3 flex-shrink-0" />
            <span>No Fake Background Jobs When App Closed</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-400">
            <XCircle className="w-3 h-3 flex-shrink-0" />
            <span>No Fake External API Success Claims</span>
          </div>
        </div>
      </div>
    </div>
  );
};
