import React, { useState } from 'react';
import {
  Code2,
  Play,
  RotateCcw,
  Copy,
  ShieldCheck,
  FileCode,
  Sparkles,
  CheckCircle,
  Eye,
  Download,
  Palette,
  Layout,
  Maximize2,
  Columns,
  Sliders,
  Check,
} from 'lucide-react';
import { generateCode } from '../../services/api.js';

const UIUX_PRESETS = [
  {
    name: 'Glassmorphic Metric Card',
    category: 'UI/UX',
    description: 'Dark-mode glass card with gradient glow and live count animation',
    html: `<div class="glass-card">
  <div class="header">
    <span class="badge">ACTIVE OS</span>
    <span class="live-dot"></span>
  </div>
  <div class="metric">
    <span class="number" id="counter">94.8%</span>
    <span class="label">Autonomous Confidence</span>
  </div>
  <div class="progress-bar">
    <div class="progress-fill"></div>
  </div>
  <div class="actions">
    <button onclick="boostConfidence()">Simulate Sync</button>
  </div>
</div>`,
    css: `body {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: radial-gradient(circle at top right, #0f172a, #020617);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #f8fafc;
}
.glass-card {
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 20px;
  padding: 24px;
  width: 280px;
  box-shadow: 0 20px 40px -15px rgba(2, 6, 23, 0.7), 0 0 25px rgba(56, 189, 248, 0.15);
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.badge {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #38bdf8;
  background: rgba(2, 132, 199, 0.15);
  padding: 4px 8px;
  border-radius: 6px;
}
.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.9); }
}
.metric {
  margin-bottom: 16px;
}
.number {
  display: block;
  font-size: 32px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.02em;
}
.label {
  font-size: 12px;
  color: #94a3b8;
}
.progress-bar {
  height: 6px;
  background: #1e293b;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 20px;
}
.progress-fill {
  height: 100%;
  width: 94.8%;
  background: linear-gradient(90deg, #0284c7, #38bdf8);
  border-radius: 999px;
  transition: width 0.5s ease;
}
button {
  width: 100%;
  padding: 10px;
  background: #0284c7;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
button:hover {
  background: #0ea5e9;
  transform: translateY(-1px);
}`,
    js: `let count = 94.8;
function boostConfidence() {
  count = Math.min(99.9, +(count + 0.5).toFixed(1));
  document.getElementById('counter').innerText = count + '%';
  document.querySelector('.progress-fill').style.width = count + '%';
}`,
  },
  {
    name: 'Voice Wave Visualizer',
    category: 'Motion/Audio',
    description: 'Dynamic canvas audio visualizer with reactive gradient bars',
    html: `<div class="visualizer-container">
  <canvas id="waveCanvas" width="280" height="90"></canvas>
  <div class="meta">
    <span class="status">MICROPHONE LISTENING</span>
    <button onclick="toggleFrequency()">Toggle Bass</button>
  </div>
</div>`,
    css: `body {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #030712;
  font-family: monospace;
  color: #e5e7eb;
}
.visualizer-container {
  background: #0b0f19;
  border: 1px solid #1f2937;
  border-radius: 16px;
  padding: 18px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.8);
}
canvas {
  background: #030712;
  border-radius: 10px;
  margin-bottom: 12px;
}
.meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.status {
  font-size: 10px;
  color: #38bdf8;
  letter-spacing: 0.05em;
}
button {
  background: #1f2937;
  color: #e5e7eb;
  border: 1px solid #374151;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
}
button:hover { background: #374151; }`,
    js: `const canvas = document.getElementById('waveCanvas');
const ctx = canvas.getContext('2d');
let bassBoost = false;

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const bars = 28;
  const barWidth = 6;
  const gap = 4;
  const time = Date.now() * 0.005;

  for (let i = 0; i < bars; i++) {
    const freq = Math.sin(time + i * 0.3) * 0.5 + 0.5;
    const height = (freq * 55 + (bassBoost ? 25 : 10)) * (canvas.height / 100);
    const x = i * (barWidth + gap) + 6;
    const y = (canvas.height - height) / 2;

    const grad = ctx.createLinearGradient(0, y, 0, y + height);
    grad.addColorStop(0, '#38bdf8');
    grad.addColorStop(1, '#818cf8');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, barWidth, height);
  }
  requestAnimationFrame(draw);
}
draw();

function toggleFrequency() {
  bassBoost = !bassBoost;
}`,
  },
];

export const CodingWorkshop: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeFile, setActiveFile] = useState<'index.html' | 'styles.css' | 'script.js'>('index.html');
  const [viewMode, setViewMode] = useState<'split' | 'preview' | 'code'>('split');
  const [copied, setCopied] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const [files, setFiles] = useState<{
    'index.html': string;
    'styles.css': string;
    'script.js': string;
  }>({
    'index.html': UIUX_PRESETS[0].html,
    'styles.css': UIUX_PRESETS[0].css,
    'script.js': UIUX_PRESETS[0].js,
  });

  const handleApplyPreset = (preset: typeof UIUX_PRESETS[0]) => {
    setFiles({
      'index.html': preset.html,
      'styles.css': preset.css,
      'script.js': preset.js,
    });
    setPreviewKey((k) => k + 1);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      const enhancedPrompt = `Build high-craft UI/UX component for mobile web. Design rules: Dark theme (#090d16 / #0f172a), high WCAG AA contrast, smooth typography, micro-interactions with CSS transforms. User requested: ${prompt}`;
      const res = await generateCode(enhancedPrompt, files[activeFile], 'html');
      if (res.code) {
        setFiles((prev) => ({
          ...prev,
          [activeFile]: res.code,
        }));
      }
      setPreviewKey((k) => k + 1);
    } catch (err: any) {
      console.error('Code gen error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(files[activeFile]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadArtifact = () => {
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DAYMATE UI Artifact</title>
  <style>
    ${files['styles.css']}
  </style>
</head>
<body>
  ${files['index.html']}
  <script>
    ${files['script.js']}
  </script>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `daymate-ui-artifact-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const combinedSrcDoc = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>${files['styles.css']}</style>
  </head>
  <body>
    ${files['index.html']}
    <script>
      ${files['script.js']}
    </script>
  </body>
</html>`;

  return (
    <div className="space-y-4 pb-20">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  UI/UX & Code Design Studio
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                    Claude Artifacts Sandbox
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Design beautiful mobile web interfaces, inspect live code, and execute safely in an isolated sandbox.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded-lg border text-xs transition ${
                viewMode === 'split' ? 'bg-slate-800 text-white border-slate-700' : 'text-slate-400 border-transparent hover:text-white'
              }`}
              title="Split View (Code & Live Preview)"
            >
              <Columns className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`p-1.5 rounded-lg border text-xs transition ${
                viewMode === 'preview' ? 'bg-slate-800 text-cyan-300 border-slate-700' : 'text-slate-400 border-transparent hover:text-white'
              }`}
              title="Full Artifact Preview"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`p-1.5 rounded-lg border text-xs transition ${
                viewMode === 'code' ? 'bg-slate-800 text-emerald-300 border-slate-700' : 'text-slate-400 border-transparent hover:text-white'
              }`}
              title="Full Code View"
            >
              <FileCode className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* UI/UX Quick Presets */}
        <div className="mt-3.5 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0">Presets:</span>
          {UIUX_PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => handleApplyPreset(p)}
              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs whitespace-nowrap transition"
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* AI Prompt Generator */}
        <form onSubmit={handleGenerate} className="mt-3 flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Prompt UI/UX architect (e.g. 'Create a dark glassmorphic crypto ticker with animated chart')..."
            className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition"
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Generating...' : 'Design & Code'}</span>
          </button>
        </form>
      </div>

      {/* Editor & Artifact Workspace */}
      <div className={`grid gap-3.5 ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Code Editor Panel */}
        {(viewMode === 'split' || viewMode === 'code') && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-1">
                {(['index.html', 'styles.css', 'script.js'] as const).map((filename) => (
                  <button
                    key={filename}
                    onClick={() => setActiveFile(filename)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition ${
                      activeFile === filename
                        ? 'bg-slate-800 text-emerald-300 border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileCode className="w-3 h-3" />
                    <span>{filename}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                  title="Copy Code"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={handleDownloadArtifact}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                  title="Download HTML Artifact"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPreviewKey((k) => k + 1)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>Run</span>
                </button>
              </div>
            </div>

            <textarea
              value={files[activeFile]}
              onChange={(e) =>
                setFiles((prev) => ({
                  ...prev,
                  [activeFile]: e.target.value,
                }))
              }
              rows={14}
              className="w-full p-3.5 bg-slate-950 text-xs font-mono text-slate-200 focus:outline-hidden resize-none leading-relaxed flex-1 min-h-[300px]"
              spellCheck={false}
            />
          </div>
        )}

        {/* Live Artifact Sandbox Preview Panel */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-slate-800">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
                <Eye className="w-3.5 h-3.5" />
                Live Claude Artifact Preview
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Isolated Sandbox (No DOM leak)
              </span>
            </div>

            <div className="h-[360px] sm:h-[420px] bg-slate-950 w-full flex-1">
              <iframe
                key={previewKey}
                srcDoc={combinedSrcDoc}
                title="Artifact Sandbox Runner"
                sandbox="allow-scripts"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
