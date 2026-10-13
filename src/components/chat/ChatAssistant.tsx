import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Paperclip,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  User,
  Square,
  CheckCircle2,
  Image as ImageIcon,
  X,
  ChevronDown,
  Layers,
  Globe,
  MapPin,
  ExternalLink,
  Dna,
  Code2,
  Radio,
} from 'lucide-react';
import { AgentRole, ChatMessage } from '../../types.js';

interface ChatAssistantProps {
  activeAgent: AgentRole;
  onSelectAgent: (role: AgentRole) => void;
  messages: ChatMessage[];
  onSendMessage: (
    text: string,
    attachments?: Array<{ name: string; mimeType: string; base64: string }>,
    grounding?: 'none' | 'search' | 'maps'
  ) => Promise<void>;
  isLoading: boolean;
  isListening: boolean;
  transcript: string;
  onStartListening: () => void;
  onStopListening: () => void;
  isSpeaking: boolean;
  onInterrupt: () => void;
  onSpeak: (text: string, base64Audio?: string) => void;
  onAddTaskFromChat?: (title: string, desc: string, priority: 'low' | 'medium' | 'high' | 'urgent') => void;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  activeAgent,
  onSelectAgent,
  messages,
  onSendMessage,
  isLoading,
  isListening,
  transcript,
  onStartListening,
  onStopListening,
  isSpeaking,
  onInterrupt,
  onSpeak,
  onAddTaskFromChat,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<Array<{ name: string; mimeType: string; base64: string }>>([]);
  const [isAgentPickerOpen, setIsAgentPickerOpen] = useState(false);
  const [activeGrounding, setActiveGrounding] = useState<'none' | 'search' | 'maps'>('none');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const agentsList: AgentRole[] = [
    'Planner',
    'Research Analyst',
    'Bioscience Scout',
    'UI/UX Architect',
    'Coder',
    'Writer',
    'Creative Director',
    'Motion Designer',
    'Video Editor',
    'Quality Controller',
  ];

  const quickPrompts = [
    {
      label: 'Google Search data',
      icon: <Globe className="w-3 h-3 text-cyan-400" />,
      text: 'Search Google for the latest multimodal AI model benchmarks and breakthroughs.',
      grounding: 'search' as const,
    },
    {
      label: 'Google Maps pin',
      icon: <MapPin className="w-3 h-3 text-rose-400" />,
      text: 'Find production film stages and camera equipment rentals in London with addresses.',
      grounding: 'maps' as const,
    },
    {
      label: 'Bioscience analysis',
      icon: <Dna className="w-3 h-3 text-emerald-400" />,
      text: 'Retrieve AlphaFold prediction data and drug-likeness rules for tumor protein TP53.',
      grounding: 'none' as const,
    },
    {
      label: 'UI/UX & Code skills',
      icon: <Code2 className="w-3 h-3 text-purple-400" />,
      text: 'Architect a dark glassmorphic mobile card component with Tailwind and micro-interactions.',
      grounding: 'none' as const,
    },
  ];

  // Auto-fill input if voice transcript arrives
  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent, overrideGrounding?: 'none' | 'search' | 'maps') => {
    if (e) e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend && attachments.length === 0) return;

    setInputText('');
    const currentAttachments = [...attachments];
    setAttachments([]);

    await onSendMessage(textToSend, currentAttachments, overrideGrounding || activeGrounding);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            base64: reader.result as string,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px] max-h-[820px] bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden shadow-lg">
      {/* Chat Agent Bar & Grounding Selectors */}
      <div className="p-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-20">
        <div className="relative">
          <button
            onClick={() => setIsAgentPickerOpen(!isAgentPickerOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-white transition"
          >
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span>Agent: {activeAgent}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Agent Dropdown */}
          {isAgentPickerOpen && (
            <div className="absolute left-0 mt-1.5 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-30">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800">
                Select Specialized Agent
              </div>
              {agentsList.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    onSelectAgent(role);
                    setIsAgentPickerOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs transition flex items-center justify-between ${
                    activeAgent === role
                      ? 'bg-cyan-950 text-cyan-300 font-bold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span>{role}</span>
                  {activeAgent === role && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Live Grounding Toggle Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveGrounding(activeGrounding === 'search' ? 'none' : 'search')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition ${
              activeGrounding === 'search'
                ? 'bg-blue-950 text-blue-300 border-blue-700 shadow-xs'
                : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle Google Search data grounding"
          >
            <Globe className="w-3 h-3 text-blue-400" />
            <span className="hidden sm:inline">Google Search</span>
          </button>

          <button
            onClick={() => setActiveGrounding(activeGrounding === 'maps' ? 'none' : 'maps')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition ${
              activeGrounding === 'maps'
                ? 'bg-rose-950 text-rose-300 border-rose-700 shadow-xs'
                : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle Google Maps data grounding"
          >
            <MapPin className="w-3 h-3 text-rose-400" />
            <span className="hidden sm:inline">Google Maps</span>
          </button>
        </div>
      </div>

      {/* Voice Status Waves Indicator (when speaking or listening) */}
      {(isSpeaking || isListening) && (
        <div className="bg-gradient-to-r from-cyan-950/90 via-blue-950/90 to-purple-950/90 border-b border-cyan-800/60 px-4 py-2 flex items-center justify-between text-xs text-cyan-300 animate-pulse">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-spin" />
            <span className="font-semibold">
              {isListening ? 'Voice Input Active: Speak now...' : 'Spoken Voice Response: Speaking aloud...'}
            </span>
          </div>
          <button
            onClick={isListening ? onStopListening : onInterrupt}
            className="px-2 py-0.5 rounded-md bg-rose-950 border border-rose-800 text-rose-300 text-[10px] font-bold hover:bg-rose-900"
          >
            Stop
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">DAYMATE AI Orchestrator</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Your personal AI operating system. Speak or type to delegate tasks, ground in Google Search & Maps, or build deliverables.
              </p>
            </div>

            {/* Quick Action Prompt Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md pt-2">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputText(qp.text);
                    setActiveGrounding(qp.grounding);
                  }}
                  className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-left transition text-xs"
                >
                  <span className="p-1 rounded-md bg-slate-950 border border-slate-800 shrink-0">
                    {qp.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-200 truncate">{qp.label}</p>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{qp.text}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}>
                <div className="flex items-center gap-1.5 px-1 text-[10px] text-slate-500 font-mono">
                  {isUser ? (
                    <>
                      <span>You</span>
                      <User className="w-3 h-3 text-slate-400" />
                    </>
                  ) : (
                    <>
                      <Bot className="w-3 h-3 text-cyan-400" />
                      <span className="text-cyan-400 font-semibold">{msg.agentRole || activeAgent}</span>
                      {msg.groundingUsed && msg.groundingUsed !== 'none' && (
                        <span className="px-1.5 py-0.2 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                          {msg.groundingUsed === 'search' ? 'Google Search Grounded' : 'Google Maps Grounded'}
                        </span>
                      )}
                    </>
                  )}
                  <span>• {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-cyan-600 text-white rounded-tr-xs shadow-md shadow-cyan-600/10'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-xs shadow-md'
                  }`}
                >
                  {/* Attachments if any */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {msg.attachments.map((att, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/20 text-[10px] font-mono"
                        >
                          <ImageIcon className="w-3 h-3" />
                          <span>{att.name}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Google Grounding Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Globe className="w-3 h-3 text-cyan-400" />
                        Google Search Sources
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((c, i) => (
                          <a
                            key={i}
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 hover:border-slate-700 text-cyan-300 hover:text-white text-[10px] transition"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[140px]">{c.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Spoken Audio Replay */}
                  {!isUser && (
                    <div className="mt-2 pt-1 flex items-center justify-between text-[10px] text-slate-500">
                      <button
                        onClick={() => onSpeak(msg.content, msg.audioBase64)}
                        className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Listen Aloud</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 pl-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-mono">{activeAgent} is synthesizing response...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Tray */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
          {attachments.map((att, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 shrink-0"
            >
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span className="max-w-[120px] truncate">{att.name}</span>
              <button onClick={() => removeAttachment(i)} className="text-slate-500 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Box and Action Controls */}
      <form onSubmit={(e) => handleSend(e)} className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
          accept="image/*,.pdf,.txt"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
          title="Attach document or reference image"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Voice Dictation Button */}
        <button
          type="button"
          onClick={isListening ? onStopListening : onStartListening}
          className={`p-2 rounded-xl border transition ${
            isListening
              ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
              : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border-slate-800'
          }`}
          title={isListening ? 'Stop listening' : 'Start voice input (Speech to Text)'}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            activeGrounding === 'search'
              ? 'Ask with Google Search data...'
              : activeGrounding === 'maps'
              ? 'Ask with Google Maps data...'
              : `Message ${activeAgent}...`
          }
          className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 transition"
        />

        <button
          type="submit"
          disabled={isLoading || (!inputText.trim() && attachments.length === 0)}
          className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-semibold transition active:scale-95 shadow-sm shadow-cyan-600/30"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
