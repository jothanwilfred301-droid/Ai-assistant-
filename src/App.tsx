import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchState,
  sendChatMessage,
  saveMemory,
  deleteMemory,
  saveTask,
  deleteTask,
  saveProject,
  triggerRoutine,
  logAudit,
  importState,
  updateAutonomyConfig,
  updateDeliveryItemStatus,
} from './services/api.js';
import {
  ActiveTab,
  StudioSubTab,
  HubSubTab,
  AgentRole,
  DaymateState,
  ChatMessage,
  TaskItem,
  MemoryItem,
  AutonomyConfig,
} from './types.js';
import { Header } from './components/layout/Header.js';
import { BottomNav } from './components/layout/BottomNav.js';
import { HomeDashboard } from './components/home/HomeDashboard.js';
import { ChatAssistant } from './components/chat/ChatAssistant.js';
import { TaskManager } from './components/tasks/TaskManager.js';
import { MotionStudio } from './components/motion/MotionStudio.js';
import { CodingWorkshop } from './components/code/CodingWorkshop.js';
import { ResearchStudio } from './components/research/ResearchStudio.js';
import { BioscienceStudio } from './components/science/BioscienceStudio.js';
import { GoogleMapsExplorer } from './components/maps/GoogleMapsExplorer.js';
import { MemoryManager } from './components/memory/MemoryManager.js';
import { DeliveryPackages } from './components/delivery/DeliveryPackages.js';
import { AutonomyCenter } from './components/autonomy/AutonomyCenter.js';
import { DevicePermissions } from './components/device/DevicePermissions.js';
import { DailyRoutines } from './components/routines/DailyRoutines.js';
import { SecurityAudit } from './components/security/SecurityAudit.js';
import { ProviderHub } from './components/providers/ProviderHub.js';
import { useSpeech } from './hooks/useSpeech.js';
import {
  Clapperboard,
  Code2,
  Globe,
  BrainCircuit,
  ShieldCheck,
  Clock,
  Film,
  Layers,
  Mic,
  MicOff,
  Package,
  Shield,
  MapPin,
  Dna,
} from 'lucide-react';

import { auth, onAuthStateChanged, User } from './lib/firebase.js';
import { saveStateToFirestore, loadStateFromFirestore } from './lib/firestoreSync.js';

export default function App() {
  const [state, setState] = useState<DaymateState | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [studioSubTab, setStudioSubTab] = useState<StudioSubTab>('motion');
  const [hubSubTab, setHubSubTab] = useState<HubSubTab>('memory');
  const [activeAgent, setActiveAgent] = useState<AgentRole>('Planner');
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  // Chat message history
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Speech hook
  const {
    isListening,
    transcript,
    setTranscript,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    interrupt,
  } = useSpeech();

  // Load initial state
  const loadState = useCallback(async () => {
    try {
      const data = await fetchState();
      setState(data);
      if (auth.currentUser) {
        saveStateToFirestore(auth.currentUser.uid, data);
      }
    } catch (e) {
      console.error('Failed to load DAYMATE state:', e);
    }
  }, []);

  useEffect(() => {
    loadState();

    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const cloudState = await loadStateFromFirestore(user.uid);
        if (cloudState && Object.keys(cloudState).length > 0) {
          // Sync cloud state into local session
          await importState(cloudState);
          setState(cloudState);
        } else if (state) {
          // Initial backup to cloud
          saveStateToFirestore(user.uid, state);
        }
      }
    });

    return () => unsub();
  }, [loadState]);

  // Voice output wrapper respecting mute state
  const handleSpeak = (text: string, base64Audio?: string) => {
    if (!isVoiceMuted) {
      speak(text, base64Audio);
    }
  };

  // Send Chat message
  const handleSendMessage = async (
    text: string,
    attachments?: Array<{ name: string; mimeType: string; base64: string }>,
    grounding: 'none' | 'search' | 'maps' = 'none'
  ) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      attachments: attachments?.map((a) => ({ name: a.name, type: a.mimeType })),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await sendChatMessage({
        message: text,
        history: historyPayload,
        currentAgent: activeAgent,
        attachments,
        grounding,
      });

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: res.content,
        agentRole: (res.agentRole as AgentRole) || activeAgent,
        timestamp: res.timestamp || new Date().toISOString(),
        audioBase64: res.audioBase64,
        groundingUsed: res.groundingUsed,
        citations: res.citations,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If speech is enabled, read response aloud
      if (!isVoiceMuted) {
        handleSpeak(res.content, res.audioBase64);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${err.message || 'Failed to complete request with AI model.'}`,
        agentRole: activeAgent,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Memory operations
  const handleSaveMemory = async (mem: Partial<MemoryItem>) => {
    await saveMemory(mem);
    await loadState();
  };

  const handleDeleteMemory = async (id: string) => {
    await deleteMemory(id);
    await loadState();
  };

  // Task operations
  const handleSaveTask = async (task: Partial<TaskItem>) => {
    await saveTask(task);
    await loadState();
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id);
    await loadState();
  };

  const handleApproveTask = async (taskId: string) => {
    await saveTask({ id: taskId, status: 'in_progress', requiresApproval: false });
    await logAudit(
      'CHECKPOINT_APPROVED',
      'Security Gate',
      `User approved execution of task ${taskId}`,
      'User',
      'success'
    );
    await loadState();
  };

  const handleToggleTaskComplete = async (taskId: string) => {
    const task = state?.tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newStatus = task.status === 'completed' ? 'in_progress' : 'completed';
    const newProgress = newStatus === 'completed' ? 100 : 50;
    await saveTask({ id: taskId, status: newStatus, progress: newProgress });
    await loadState();
  };

  // Routine Trigger
  const handleTriggerRoutine = async (id: string) => {
    const res = await triggerRoutine(id);
    await loadState();
    return res.briefing;
  };

  // Full backup & export
  const handleExportFullState = () => {
    if (!state) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `daymate-os-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportState = async (newState: DaymateState) => {
    await importState(newState);
    await loadState();
  };

  const handleUpdateAutonomyConfig = async (cfg: Partial<AutonomyConfig>) => {
    await updateAutonomyConfig(cfg);
    await loadState();
  };

  const handleUpdateDeliveryItemStatus = async (
    packageId: string,
    itemId: string,
    status: 'finished' | 'requires_attention'
  ) => {
    await updateDeliveryItemStatus(packageId, itemId, status);
    await loadState();
  };

  if (!state) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black animate-pulse">
          D
        </div>
        <p className="text-xs font-mono tracking-wide text-slate-300">DAYMATE AI Booting...</p>
      </div>
    );
  }

  const pendingApprovalsCount = state.tasks.filter((t) => t.status === 'awaiting_approval').length;

  return (
    <div
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col ${
        isMobileFrame ? 'items-center justify-center py-6 px-2 sm:px-4' : ''
      }`}
    >
      {/* Shell Container */}
      <div
        className={`w-full flex flex-col bg-slate-950 transition-all ${
          isMobileFrame
            ? 'max-w-md min-h-[840px] h-[92vh] rounded-[36px] border-4 border-slate-800 shadow-2xl overflow-hidden relative ring-1 ring-slate-700/50'
            : 'max-w-4xl mx-auto min-h-screen'
        }`}
      >
        {/* Header with status bar and controls */}
        <Header
          activeAgent={activeAgent}
          isVoiceMuted={isVoiceMuted}
          onToggleVoiceMute={() => setIsVoiceMuted(!isVoiceMuted)}
          isMobileFrame={isMobileFrame}
          onToggleMobileFrame={() => setIsMobileFrame(!isMobileFrame)}
          activeTab={activeTab}
        />

        {/* Tab Content Body */}
        <main className="flex-1 overflow-y-auto px-3.5 pt-3">
          {/* TAB 1: HOME DASHBOARD */}
          {activeTab === 'home' && (
            <HomeDashboard
              tasks={state.tasks}
              projects={state.projects}
              routines={state.routines}
              memories={state.memories}
              deliveryPackagesCount={state.deliveryPackages?.length || 2}
              autonomyTier={state.autonomyConfig?.tier || 2}
              onSelectAgent={(role) => setActiveAgent(role)}
              onOpenChat={(prompt) => {
                setActiveTab('chat');
                if (prompt) setTranscript(prompt);
              }}
              onOpenPlanner={() => setActiveTab('planner')}
              onOpenStudio={(sub) => {
                setStudioSubTab(sub);
                setActiveTab('studio');
              }}
              onOpenHub={(sub) => {
                setHubSubTab(sub);
                setActiveTab('hub');
              }}
              onTriggerRoutine={handleTriggerRoutine}
              onSpeak={handleSpeak}
              isVoiceMuted={isVoiceMuted}
              onToggleTaskComplete={handleToggleTaskComplete}
            />
          )}

          {/* TAB 2: CHAT ASSISTANT */}
          {activeTab === 'chat' && (
            <ChatAssistant
              activeAgent={activeAgent}
              onSelectAgent={(role) => setActiveAgent(role)}
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isChatLoading}
              isListening={isListening}
              transcript={transcript}
              onStartListening={startListening}
              onStopListening={stopListening}
              isSpeaking={isSpeaking}
              onInterrupt={interrupt}
              onSpeak={handleSpeak}
            />
          )}

          {/* TAB 3: PLANNER & TASKS */}
          {activeTab === 'planner' && (
            <TaskManager
              tasks={state.tasks}
              onSaveTask={handleSaveTask}
              onDeleteTask={handleDeleteTask}
              onApproveTask={handleApproveTask}
            />
          )}

          {/* TAB 4: STUDIO (MOTION, CODE, MAPS, RESEARCH, SCIENCE) */}
          {activeTab === 'studio' && (
            <div className="space-y-3">
              {/* Studio Sub-Nav */}
              <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs overflow-x-auto">
                <button
                  onClick={() => setStudioSubTab('motion')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition font-medium ${
                    studioSubTab === 'motion'
                      ? 'bg-pink-950 text-pink-300 font-bold border border-pink-800/80 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Clapperboard className="w-3.5 h-3.5" />
                  <span>Motion Video</span>
                </button>
                <button
                  onClick={() => setStudioSubTab('code')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition font-medium ${
                    studioSubTab === 'code'
                      ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-800/80 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>UI/UX & Code</span>
                </button>
                <button
                  onClick={() => setStudioSubTab('maps')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition font-medium ${
                    studioSubTab === 'maps'
                      ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/80 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Google Maps</span>
                </button>
                <button
                  onClick={() => setStudioSubTab('research')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition font-medium ${
                    studioSubTab === 'research'
                      ? 'bg-blue-950 text-blue-300 font-bold border border-blue-800/80 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Google Search</span>
                </button>
                <button
                  onClick={() => setStudioSubTab('science')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition font-medium ${
                    studioSubTab === 'science'
                      ? 'bg-purple-950 text-purple-300 font-bold border border-purple-800/80 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Dna className="w-3.5 h-3.5" />
                  <span>Bioscience Lab</span>
                </button>
              </div>

              {/* Subtab View */}
              {studioSubTab === 'motion' && (
                <MotionStudio onCritiqueSaved={() => loadState()} />
              )}
              {studioSubTab === 'code' && <CodingWorkshop />}
              {studioSubTab === 'maps' && (
                <GoogleMapsExplorer
                  onSaveAsMemory={(t, c) =>
                    handleSaveMemory({ title: t, content: c, category: 'project', tags: ['location', 'maps'] })
                  }
                  onAddTask={(t, d) =>
                    handleSaveTask({
                      title: t,
                      description: d,
                      priority: 'medium',
                      assignedAgent: 'Planner',
                    })
                  }
                />
              )}
              {studioSubTab === 'research' && (
                <ResearchStudio
                  onSaveAsMemory={(t, c) =>
                    handleSaveMemory({ title: t, content: c, category: 'project', tags: ['research'] })
                  }
                  onAddTask={(t, d) =>
                    handleSaveTask({
                      title: t,
                      description: d,
                      priority: 'medium',
                      assignedAgent: 'Research Analyst',
                    })
                  }
                />
              )}
              {studioSubTab === 'science' && (
                <BioscienceStudio
                  onSaveAsMemory={(t, c) =>
                    handleSaveMemory({ title: t, content: c, category: 'project', tags: ['science', 'bioscience'] })
                  }
                  onAddTask={(t, d) =>
                    handleSaveTask({
                      title: t,
                      description: d,
                      priority: 'high',
                      assignedAgent: 'Bioscience Scout',
                    })
                  }
                />
              )}
            </div>
          )}

          {/* TAB 5: OS HUB (DELIVERY, AUTONOMY, MEMORY, PERMISSIONS, ROUTINES, SECURITY, PROVIDERS) */}
          {activeTab === 'hub' && (
            <div className="space-y-3">
              {/* Hub Sub-Nav */}
              <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs overflow-x-auto">
                <button
                  onClick={() => setHubSubTab('delivery')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg whitespace-nowrap transition font-medium ${
                    hubSubTab === 'delivery'
                      ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-800/80 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Delivery System</span>
                </button>
                <button
                  onClick={() => setHubSubTab('autonomy')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg whitespace-nowrap transition font-medium ${
                    hubSubTab === 'autonomy'
                      ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/80 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Autonomy & Limits</span>
                </button>
                <button
                  onClick={() => setHubSubTab('memory')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg whitespace-nowrap transition font-medium ${
                    hubSubTab === 'memory'
                      ? 'bg-purple-950 text-purple-300 font-bold border border-purple-800/80 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BrainCircuit className="w-3.5 h-3.5" />
                  <span>Personal Memory</span>
                </button>
                <button
                  onClick={() => setHubSubTab('permissions')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg whitespace-nowrap transition font-medium ${
                    hubSubTab === 'permissions'
                      ? 'bg-slate-800 text-slate-200 border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Permissions</span>
                </button>
                <button
                  onClick={() => setHubSubTab('routines')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg whitespace-nowrap transition font-medium ${
                    hubSubTab === 'routines'
                      ? 'bg-amber-950 text-amber-300 font-bold border border-amber-800/80 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Routines</span>
                </button>
                <button
                  onClick={() => setHubSubTab('providers')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg whitespace-nowrap transition font-medium ${
                    hubSubTab === 'providers'
                      ? 'bg-indigo-950 text-indigo-300 font-bold border border-indigo-800/80 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Providers</span>
                </button>
                <button
                  onClick={() => setHubSubTab('security')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg whitespace-nowrap transition font-medium ${
                    hubSubTab === 'security'
                      ? 'bg-slate-800 text-slate-200 border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Audit Trail</span>
                </button>
              </div>

              {/* Subtab View */}
              {hubSubTab === 'delivery' && (
                <DeliveryPackages
                  packages={state.deliveryPackages || []}
                  onUpdateItemStatus={handleUpdateDeliveryItemStatus}
                />
              )}
              {hubSubTab === 'autonomy' && (
                <AutonomyCenter
                  config={state.autonomyConfig}
                  activities={state.autonomyActivities || []}
                  onUpdateConfig={handleUpdateAutonomyConfig}
                />
              )}
              {hubSubTab === 'memory' && (
                <MemoryManager
                  memories={state.memories}
                  onSaveMemory={handleSaveMemory}
                  onDeleteMemory={handleDeleteMemory}
                />
              )}
              {hubSubTab === 'permissions' && <DevicePermissions />}
              {hubSubTab === 'routines' && (
                <DailyRoutines
                  routines={state.routines}
                  onTriggerRoutine={handleTriggerRoutine}
                  onSpeak={handleSpeak}
                  isVoiceMuted={isVoiceMuted}
                />
              )}
              {hubSubTab === 'providers' && <ProviderHub />}
              {hubSubTab === 'security' && (
                <SecurityAudit
                  auditLogs={state.auditLogs}
                  tasks={state.tasks}
                  onApproveTask={handleApproveTask}
                  onExportFullState={handleExportFullState}
                  onImportState={handleImportState}
                />
              )}
            </div>
          )}
        </main>


        {/* Floating Quick Voice Orb (When not in chat tab) */}
        {activeTab !== 'chat' && (
          <div className="fixed bottom-18 right-4 sm:right-6 z-40">
            <button
              onClick={() => {
                setActiveTab('chat');
                startListening();
              }}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-xl shadow-cyan-500/30 transition-transform active:scale-95"
              title="Voice Assistant Quick Trigger"
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Android Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={(tab) => setActiveTab(tab)}
          pendingApprovalsCount={pendingApprovalsCount}
        />
      </div>
    </div>
  );
}
