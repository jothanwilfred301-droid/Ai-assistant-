import React, { useState } from 'react';
import {
  CheckSquare,
  Clock,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  Filter,
  ShieldAlert,
  ArrowRight,
  ListTodo,
} from 'lucide-react';
import { TaskItem, TaskStage, AgentRole } from '../../types.js';

interface TaskManagerProps {
  tasks: TaskItem[];
  onSaveTask: (task: Partial<TaskItem>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onApproveTask: (taskId: string) => Promise<void>;
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  onSaveTask,
  onDeleteTask,
  onApproveTask,
}) => {
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'awaiting_approval' | 'queued' | 'completed'>('all');
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newAgent, setNewAgent] = useState<AgentRole>('Planner');
  const [newDeadline, setNewDeadline] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
  );
  const [newRequiresApproval, setNewRequiresApproval] = useState(false);
  const [stageInputs, setStageInputs] = useState<string[]>(['Analyze objectives', 'Execute steps', 'Review output']);

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const handleToggleStage = async (task: TaskItem, stageId: string) => {
    const updatedStages = task.stages.map((stg) =>
      stg.id === stageId ? { ...stg, completed: !stg.completed } : stg
    );
    const completedCount = updatedStages.filter((s) => s.completed).length;
    const newProgress = Math.round((completedCount / updatedStages.length) * 100);
    const newStatus =
      newProgress === 100 ? 'completed' : task.status === 'completed' ? 'in_progress' : task.status;

    await onSaveTask({
      id: task.id,
      stages: updatedStages,
      progress: newProgress,
      status: newStatus,
    });
  };

  const handleUpdateStatus = async (taskId: string, newStatus: TaskItem['status']) => {
    await onSaveTask({ id: taskId, status: newStatus });
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const stages: TaskStage[] = stageInputs
      .filter((s) => s.trim().length > 0)
      .map((name, i) => ({
        id: `stg-${Date.now()}-${i}`,
        name: name.trim(),
        completed: false,
      }));

    await onSaveTask({
      title: newTitle.trim(),
      description: newDesc.trim(),
      priority: newPriority,
      assignedAgent: newAgent,
      deadline: newDeadline,
      requiresApproval: newRequiresApproval,
      status: newRequiresApproval ? 'awaiting_approval' : 'in_progress',
      progress: 0,
      stages: stages.length > 0 ? stages : [{ id: `stg-${Date.now()}`, name: 'Execute', completed: false }],
    });

    setIsNewTaskModalOpen(false);
    setNewTitle('');
    setNewDesc('');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
            <ListTodo className="w-4 h-4 text-cyan-400" />
            Execution Queue & Planner
          </h2>
          <p className="text-[11px] text-slate-400">
            Persistent task manager with checkpoint gates and dependency tracking.
          </p>
        </div>

        <button
          onClick={() => setIsNewTaskModalOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow-sm transition active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto text-xs">
        {(['all', 'in_progress', 'awaiting_approval', 'queued', 'completed'] as const).map((tab) => {
          const count = tasks.filter((t) => (tab === 'all' ? true : t.status === tab)).length;
          const labels: Record<string, string> = {
            all: 'All',
            in_progress: 'In Progress',
            awaiting_approval: 'Awaiting Gate',
            queued: 'Queued',
            completed: 'Completed',
          };
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap text-xs transition font-medium ${
                filter === tab
                  ? 'bg-slate-800 text-cyan-300 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {labels[tab]} ({count})
            </button>
          );
        })}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-8 text-center text-slate-400">
            <p className="text-xs">No tasks found matching filter.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`rounded-xl border p-3.5 transition space-y-3 ${
                task.status === 'awaiting_approval'
                  ? 'bg-amber-950/20 border-amber-800/60'
                  : task.status === 'completed'
                  ? 'bg-slate-900/50 border-slate-800/60 opacity-80'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Task Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-100">{task.title}</h3>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        task.priority === 'urgent'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                          : task.priority === 'high'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Consequential Checkpoint Approval Gate Banner */}
              {task.status === 'awaiting_approval' && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-200">
                  <div className="flex items-center gap-2 text-xs">
                    <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Consequential action gate: requires user approval before execution.</span>
                  </div>
                  <button
                    onClick={() => onApproveTask(task.id)}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-md transition"
                  >
                    Approve
                  </button>
                </div>
              )}

              {/* Subtask Stages Breakdown */}
              <div className="space-y-1.5 pt-1 border-t border-slate-800/60">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Stages & Checkpoints ({task.stages.filter((s) => s.completed).length}/
                  {task.stages.length})
                </span>

                <div className="space-y-1">
                  {task.stages.map((stage) => (
                    <label
                      key={stage.id}
                      className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none group"
                    >
                      <input
                        type="checkbox"
                        checked={stage.completed}
                        onChange={() => handleToggleStage(task, stage.id)}
                        className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0"
                      />
                      <span className={stage.completed ? 'line-through text-slate-500' : ''}>
                        {stage.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Progress Bar & Metadata */}
              <div className="pt-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>Assigned: <strong className="text-cyan-400">{task.assignedAgent}</strong></span>
                  <span className="font-mono">{task.progress}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      task.status === 'completed'
                        ? 'bg-emerald-500'
                        : task.status === 'awaiting_approval'
                        ? 'bg-amber-500'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                    }`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  {task.deadline && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {task.deadline}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {task.status === 'in_progress' ? (
                    <button
                      onClick={() => handleUpdateStatus(task.id, 'paused')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] font-medium"
                    >
                      <Pause className="w-3 h-3" />
                      <span>Pause</span>
                    </button>
                  ) : task.status === 'paused' ? (
                    <button
                      onClick={() => handleUpdateStatus(task.id, 'in_progress')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/80 text-[11px] font-medium"
                    >
                      <Play className="w-3 h-3" />
                      <span>Resume</span>
                    </button>
                  ) : null}

                  {task.status !== 'completed' && (
                    <button
                      onClick={() => handleUpdateStatus(task.id, 'completed')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/80 text-[11px] font-medium"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Mark Done</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Task Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-white">Create New Orchestrated Task</h3>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Generate Motion Reel for Launch"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Provide context, constraints and requirements..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Assigned Agent
                  </label>
                  <select
                    value={newAgent}
                    onChange={(e) => setNewAgent(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                  >
                    <option value="Planner">Planner</option>
                    <option value="Research Analyst">Research Analyst</option>
                    <option value="Writer">Writer</option>
                    <option value="Coder">Coder</option>
                    <option value="Creative Director">Creative Director</option>
                    <option value="Motion Designer">Motion Designer</option>
                    <option value="Video Editor">Video Editor</option>
                    <option value="Quality Controller">Quality Controller</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Target Deadline
                </label>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                />
              </div>

              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block">Require Approval Gate</span>
                  <span className="text-[10px] text-slate-400">
                    Pause before consequential action until confirmed
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={newRequiresApproval}
                  onChange={(e) => setNewRequiresApproval(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-cyan-600 text-white font-bold hover:bg-cyan-500"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
