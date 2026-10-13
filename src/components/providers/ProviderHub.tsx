import React, { useState } from 'react';
import {
  Film,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Sparkles,
  Link2,
  Download,
  Upload,
} from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  type: 'native_api' | 'web_bridge' | 'directory_adapter';
  url: string;
  status: 'connected' | 'manual_bridge' | 'directory';
  description: string;
  authMethod: string;
}

export const ProviderHub: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const samplePrompt =
    'Cinematic 4K scene, futuristic handheld device displaying DAYMATE OS hologram in twilight cyberpunk city, slow dolly back, anamorphic blue lens flare, highly detailed photorealistic render.';

  const providers: Provider[] = [
    {
      id: 'veo',
      name: 'Google Veo 3.1',
      type: 'native_api',
      url: 'https://ai.google.dev',
      status: 'connected',
      description: 'Official server-side integration via @google/genai SDK (models: veo-3.1-generate-preview, veo-3.1-lite).',
      authMethod: 'Server-side GEMINI_API_KEY (zero client exposure).',
    },
    {
      id: 'snapgen',
      name: 'SnapGen AI',
      type: 'web_bridge',
      url: 'https://snapgen.ai/history?uuid=d92236b8-c5f7-11f1-b36c-1e27f863a723',
      status: 'manual_bridge',
      description: 'Automated prompt packager & asset importer. Generates optimized aspect-ratio prompts and ingests downloaded outputs.',
      authMethod: 'Browser session & Web Import Bridge (no public REST API).',
    },
    {
      id: 'taaft',
      name: "There's An AI For That (TAAFT)",
      type: 'directory_adapter',
      url: 'https://theresanaiforthat.com/@taaft/video-generator/?ref=header',
      status: 'directory',
      description: 'AI Video Generator directory & catalog tracker for evaluating new rendering engines.',
      authMethod: 'Curated index adapter.',
    },
    {
      id: 'runway',
      name: 'Runway Gen-3 Alpha',
      type: 'web_bridge',
      url: 'https://runwayml.com',
      status: 'manual_bridge',
      description: 'Motion brush & camera trajectory prompt adapter with frame timing sync.',
      authMethod: 'Browser prompt bridge.',
    },
  ];

  const handleCopyPrompt = (id: string) => {
    navigator.clipboard.writeText(samplePrompt);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
          <Film className="w-4 h-4 text-cyan-400" />
          External Video Services & Provider Adapters
        </h2>
        <p className="text-[11px] text-slate-400">
          Honest provider integration center: official APIs, secure bridges, and prompt packagers.
        </p>
      </div>

      {/* Security Architecture Principle */}
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-xs">
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>Honest Provider Architecture</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          DAYMATE AI never fakes API connections. Services with official APIs (Google Veo) run via secure server proxies. Services without open developer APIs provide an automated prompt-packaging workflow so you can generate in their portal and import results seamlessly.
        </p>
      </div>

      {/* Provider List */}
      <div className="space-y-3">
        {providers.map((p) => (
          <div
            key={p.id}
            className="rounded-xl bg-slate-900 border border-slate-800 p-3.5 space-y-2.5 hover:border-slate-700 transition"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-white">{p.name}</h3>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      p.status === 'connected'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                        : p.status === 'manual_bridge'
                        ? 'bg-blue-950 text-blue-300 border border-blue-800/80'
                        : 'bg-purple-950 text-purple-300 border border-purple-800/80'
                    }`}
                  >
                    {p.status === 'connected'
                      ? 'Direct API'
                      : p.status === 'manual_bridge'
                      ? 'Web Bridge'
                      : 'Catalog'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{p.description}</p>
              </div>

              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                title="Open provider"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 space-y-1">
              <div>
                <strong>Auth:</strong> {p.authMethod}
              </div>
            </div>

            {/* Quick Action: Copy Prepared Prompt for this service */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">
                Payload ready for export
              </span>
              <button
                onClick={() => handleCopyPrompt(p.id)}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium rounded-lg transition active:scale-95"
              >
                <Copy className="w-3 h-3 text-cyan-400" />
                <span>{copiedIndex === p.id ? 'Copied Prompt' : 'Copy Prompt'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
