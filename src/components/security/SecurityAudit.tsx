import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Download,
  Upload,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileJson,
} from 'lucide-react';
import { AuditLogItem, TaskItem, DaymateState } from '../../types.js';

interface SecurityAuditProps {
  auditLogs: AuditLogItem[];
  tasks: TaskItem[];
  onApproveTask: (taskId: string) => Promise<void>;
  onExportFullState: () => void;
  onImportState: (state: DaymateState) => Promise<void>;
}

export const SecurityAudit: React.FC<SecurityAuditProps> = ({
  auditLogs,
  tasks,
  onApproveTask,
  onExportFullState,
  onImportState,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const pendingApprovals = tasks.filter((t) => t.status === 'awaiting_approval');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        await onImportState(parsed);
        setImportStatus('Backup state imported successfully.');
      } catch {
        setImportStatus('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Security, Approvals & Quality Control
        </h2>
        <p className="text-[11px] text-slate-400">
          Confirmation gates, least-privilege boundary enforcement, and immutable audit logs.
        </p>
      </div>

      {importStatus && (
        <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-800 text-xs text-emerald-300">
          {importStatus}
        </div>
      )}

      {/* Pending Checkpoint Approval Gates */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Consequential Checkpoint Gates ({pendingApprovals.length})
          </h3>
          <span className="text-[10px] text-slate-400">Confirmation Required</span>
        </div>

        {pendingApprovals.length === 0 ? (
          <p className="text-[11px] text-slate-400">No tasks currently awaiting approval.</p>
        ) : (
          <div className="space-y-2">
            {pendingApprovals.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/60"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{task.title}</h4>
                  <p className="text-[10px] text-amber-300/80 mt-0.5">
                    Assigned: {task.assignedAgent} · Priority: {task.priority}
                  </p>
                </div>
                <button
                  onClick={() => onApproveTask(task.id)}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-md transition"
                >
                  Confirm & Run
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data Backup & Restore */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-3.5 space-y-2.5">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <FileJson className="w-4 h-4 text-cyan-400" />
          State Backup & Disaster Recovery
        </h3>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Export full DAYMATE OS state (memories, active tasks, project plans, routines) as an encrypted or portable JSON file.
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onExportFullState}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download Backup</span>
          </button>

          <label className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Restore Backup</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-3.5 space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            System Audit Trail ({auditLogs.length})
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">Immutable</span>
        </div>

        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] space-y-0.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 font-mono">{log.action}</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-slate-400 leading-snug">{log.details}</p>
              <div className="text-[10px] text-slate-500 flex items-center gap-2 pt-0.5">
                <span>By: {log.approvedBy}</span>
                <span>·</span>
                <span>Cat: {log.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
