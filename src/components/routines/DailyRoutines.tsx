import React, { useState } from 'react';
import {
  Clock,
  Play,
  Moon,
  Sun,
  Calendar,
  CheckCircle2,
  Bell,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { RoutineItem } from '../../types.js';

interface DailyRoutinesProps {
  routines: RoutineItem[];
  onTriggerRoutine: (id: string) => Promise<string>;
  onSpeak: (text: string) => void;
  isVoiceMuted: boolean;
}

export const DailyRoutines: React.FC<DailyRoutinesProps> = ({
  routines,
  onTriggerRoutine,
  onSpeak,
  isVoiceMuted,
}) => {
  const [runningId, setRunningId] = useState<string | null>(null);
  const [activeOutput, setActiveOutput] = useState<{ id: string; text: string } | null>(null);

  // Quiet hours settings state
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('07:00');

  const handleRun = async (id: string) => {
    setRunningId(id);
    try {
      const summary = await onTriggerRoutine(id);
      setActiveOutput({ id, text: summary });
      if (!isVoiceMuted) {
        onSpeak(summary);
      }
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-cyan-400" />
          Daily Routines & Automation
        </h2>
        <p className="text-[11px] text-slate-400">
          Automated intelligence briefings, progress check-ins, and evening learning captures.
        </p>
      </div>

      {/* Routine Cards */}
      <div className="space-y-3">
        {routines.map((r) => {
          const isMorning = r.type === 'morning_brief';
          const isEvening = r.type === 'evening_review';
          return (
            <div
              key={r.id}
              className="rounded-xl bg-slate-900 border border-slate-800 p-3.5 space-y-2.5 hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-2 rounded-lg border ${
                      isMorning
                        ? 'bg-amber-950/60 border-amber-800/80 text-amber-400'
                        : isEvening
                        ? 'bg-indigo-950/60 border-indigo-800/80 text-indigo-400'
                        : 'bg-cyan-950/60 border-cyan-800/80 text-cyan-400'
                    }`}
                  >
                    {isMorning ? <Sun className="w-4 h-4" /> : isEvening ? <Moon className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">{r.title}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="font-mono text-cyan-400">{r.scheduledTime} Daily</span>
                      {r.lastRun && (
                        <>
                          <span>·</span>
                          <span>Last run: {new Date(r.lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRun(r.id)}
                  disabled={runningId === r.id}
                  className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition active:scale-95"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>{runningId === r.id ? 'Running...' : 'Run Now'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                {r.summaryPrompt}
              </p>

              {/* Output Display */}
              {activeOutput && activeOutput.id === r.id && (
                <div className="p-3 rounded-lg bg-slate-950 border border-cyan-500/40 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      Generated Briefing
                    </span>
                    <button
                      onClick={() => onSpeak(activeOutput.text)}
                      className="p-1 hover:text-white"
                      title="Read aloud"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {activeOutput.text}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quiet Hours Settings */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-400" />
            <div>
              <h3 className="text-xs font-bold text-white">Quiet Hours & Do-Not-Disturb</h3>
              <p className="text-[10px] text-slate-400">Suppress audio synthesis & notifications overnight.</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={quietHoursEnabled}
            onChange={(e) => setQuietHoursEnabled(e.target.checked)}
            className="rounded border-slate-700 bg-slate-800 text-indigo-500"
          />
        </div>

        {quietHoursEnabled && (
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                Quiet Starts
              </label>
              <input
                type="time"
                value={quietStart}
                onChange={(e) => setQuietStart(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                Quiet Ends
              </label>
              <input
                type="time"
                value={quietEnd}
                onChange={(e) => setQuietEnd(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
