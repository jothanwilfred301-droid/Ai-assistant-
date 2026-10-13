import React, { useState, useRef, useEffect } from 'react';
import {
  Clapperboard,
  Play,
  Pause,
  Download,
  Sparkles,
  Layers,
  Film,
  Camera,
  Type,
  Music,
  CheckCircle2,
  Clock,
  Settings,
  ChevronRight,
  Maximize2,
  FileVideo,
  ShieldCheck,
  RotateCcw,
  Sliders,
  Eye,
  AlertTriangle,
  Lightbulb,
  Check,
  ArrowRight,
  FileCode,
} from 'lucide-react';
import { generateMotionScript, applyVisualFeedback } from '../../services/api.js';
import { MotionProject, MotionScene, VisualCritiqueRecord } from '../../types.js';

interface MotionStudioProps {
  onCritiqueSaved?: (critique: VisualCritiqueRecord) => void;
}

export const MotionStudio: React.FC<MotionStudioProps> = ({ onCritiqueSaved }) => {
  // Studio sub-mode
  const [studioMode, setStudioMode] = useState<'production' | 'advanced_motion' | 'visual_learning'>('production');

  // 12-stage workflow states
  const stages = [
    'Brief',
    'Research',
    'Script',
    'Storyboard',
    'Shot List',
    'Visual Dev',
    'Asset Gen',
    'Timeline',
    'Motion FX',
    'Audio Sync',
    'Quality Check',
    'Export',
  ];
  const [activeStageIndex, setActiveStageIndex] = useState(7); // Timeline

  // Video settings
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [framerate, setFramerate] = useState<24 | 30 | 60>(30);
  const [resolution, setResolution] = useState<'1080p' | '4K'>('1080p');
  const [motionStyle, setMotionStyle] = useState<'cyber' | 'kinetic' | 'minimal' | 'neon'>('cyber');
  const [easingCurve, setEasingCurve] = useState<'ease-in-out' | 'spring' | 'cubic-bezier' | 'linear'>('ease-in-out');

  // Advanced Keyframe Controls (Level B)
  const [keyframeScale, setKeyframeScale] = useState<number>(1.1);
  const [captionOffsetY, setCaptionOffsetY] = useState<number>(310); // px from top (safe zone)
  const [glowIntensity, setGlowIntensity] = useState<number>(16);

  // Project data
  const [project, setProject] = useState<MotionProject>({
    title: 'DAYMATE AI: Mobile Launch Reel',
    durationSeconds: 30,
    style: 'Cinematic Sci-Fi',
    scenes: [
      {
        sceneNumber: 1,
        title: 'Dawn Awakening',
        duration: 6,
        visualPrompt: 'Smartphone screen casting ambient cyan glow on minimalist wooden studio desk, sunrise bokeh in background.',
        cameraAngle: 'Macro close-up slowly dollying back',
        narration: 'Every morning begins with intention.',
        motionGraphic: 'Title Card: DAYMATE // OS BOOT',
      },
      {
        sceneNumber: 2,
        title: 'Orchestrator Nodes',
        duration: 10,
        visualPrompt: 'Futuristic glass holographic cards connecting multi-agent milestones in deep slate environment.',
        cameraAngle: 'Smooth 3D orbital pan around central energy node',
        narration: 'Your goals decomposed into actionable milestones, without friction.',
        motionGraphic: 'Kinetic Subtitle: 8 SPECIALIZED AGENTS',
      },
      {
        sceneNumber: 3,
        title: 'Creative Velocity',
        duration: 8,
        visualPrompt: 'Motion timeline tracks glowing neon purple with animated sound wave spectrum.',
        cameraAngle: 'Dynamic rack focus to finished deliverable preview',
        narration: 'From concept to finished production in minutes.',
        motionGraphic: 'Lower Third: MOTION STUDIO v1.0',
      },
      {
        sceneNumber: 4,
        title: 'Progress Locked',
        duration: 6,
        visualPrompt: 'Gleaming phone displaying DAYMATE OS badge against twilight cityscape.',
        cameraAngle: 'Cinematic wide lock-off with soft anamorphic flare',
        narration: 'DAYMATE AI. Your Personal AI. Your Projects. Your Progress.',
        motionGraphic: 'Center Pulse: PROGRESS LOCKED',
      },
    ],
  });

  const [briefInput, setBriefInput] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  // Playhead & Canvas Animation State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  // Visual Learning / Critique State
  const [critiqueInput, setCritiqueInput] = useState(
    'The camera movement is too fast, the captions are covering the subject, and the title animation feels cheap. Fix those three things.'
  );
  const [isApplyingCritique, setIsApplyingCritique] = useState(false);
  const [latestCritiqueResult, setLatestCritiqueResult] = useState<{
    detectedIssues: string[];
    appliedChanges: string[];
    durableMemoryRule: string;
  } | null>(null);
  const [showReferenceComparison, setShowReferenceComparison] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Calculate active scene
  let accumulatedTime = 0;
  let activeSceneIndex = 0;
  for (let i = 0; i < project.scenes.length; i++) {
    accumulatedTime += project.scenes[i].duration;
    if (currentTime <= accumulatedTime) {
      activeSceneIndex = i;
      break;
    }
  }
  const currentScene = project.scenes[activeSceneIndex] || project.scenes[0];

  // Playhead animation loop
  useEffect(() => {
    if (!isPlaying) return;

    const startTime = performance.now() - currentTime * 1000;

    const tick = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      if (elapsed >= project.durationSeconds) {
        setCurrentTime(0);
        setIsPlaying(false);
      } else {
        setCurrentTime(elapsed);
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, framerate, project.durationSeconds]);

  // Canvas Render Loop for Motion Graphics (Option C Engine)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background fill
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Dynamic progress within active scene
    const progressInScene = (currentTime % currentScene.duration) / currentScene.duration;

    // Easing multiplier
    let easedProgress = progressInScene;
    if (easingCurve === 'ease-in-out') {
      easedProgress =
        progressInScene < 0.5
          ? 2 * progressInScene * progressInScene
          : -1 + (4 - 2 * progressInScene) * progressInScene;
    } else if (easingCurve === 'spring') {
      easedProgress = 1 - Math.cos(progressInScene * Math.PI * 2.5) * Math.exp(-progressInScene * 3);
    }

    // Radial gradient glow
    const grad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      10,
      width / 2,
      height / 2,
      width / 1.4
    );
    if (motionStyle === 'cyber') {
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.28)');
      grad.addColorStop(1, 'rgba(9, 13, 22, 1)');
    } else if (motionStyle === 'neon') {
      grad.addColorStop(0, 'rgba(236, 72, 153, 0.28)');
      grad.addColorStop(1, 'rgba(9, 13, 22, 1)');
    } else {
      grad.addColorStop(0, 'rgba(59, 130, 246, 0.22)');
      grad.addColorStop(1, 'rgba(9, 13, 22, 1)');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Dynamic keyframed visual center subject
    const subjectScale = (0.9 + easedProgress * 0.2) * keyframeScale;
    ctx.save();
    ctx.translate(width / 2, height / 2 - 25);
    ctx.scale(subjectScale, subjectScale);

    // Subject Energy Halo / Rings
    ctx.strokeStyle = motionStyle === 'neon' ? 'rgba(236, 72, 153, 0.6)' : 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.stroke();

    // Central Monogram Hologram
    ctx.fillStyle = motionStyle === 'neon' ? '#ec4899' : '#38bdf8';
    ctx.shadowColor = motionStyle === 'neon' ? '#ec4899' : '#06b6d4';
    ctx.shadowBlur = glowIntensity;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Scene Title & Camera Direction
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `SCENE ${currentScene.sceneNumber}: ${currentScene.title.toUpperCase()} [${currentScene.cameraAngle.slice(0, 32)}...]`,
      width / 2,
      height / 2 - 80
    );

    // Animated Kinetic Typography / Motion Graphic Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.shadowColor = motionStyle === 'neon' ? '#ec4899' : '#06b6d4';
    ctx.shadowBlur = glowIntensity;
    ctx.fillText(currentScene.motionGraphic, width / 2, height / 2 + 35);
    ctx.shadowBlur = 0;

    // Subtitle Narration (Configurable Safe-Zone Y Offset to prevent occluding subject!)
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'italic 12px sans-serif';
    // Draw subtitle background pill for contrast
    const subText = `"${currentScene.narration}"`;
    const textWidth = ctx.measureText(subText).width;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(width / 2 - textWidth / 2 - 12, captionOffsetY - 14, textWidth + 24, 22);

    ctx.fillStyle = '#38bdf8';
    ctx.fillText(subText, width / 2, captionOffsetY);

    // Top Timecode Stamp
    ctx.fillStyle = '#38bdf8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    const totalFrames = Math.floor(currentTime * framerate);
    const mm = String(Math.floor(currentTime / 60)).padStart(2, '0');
    const ss = String(Math.floor(currentTime % 60)).padStart(2, '0');
    const ff = String(totalFrames % framerate).padStart(2, '0');
    ctx.fillText(`${mm}:${ss}:${ff} | ${framerate}fps`, 16, 24);

    // Right tags
    ctx.textAlign = 'right';
    ctx.fillText(`${aspectRatio} [${resolution}] · ${easingCurve}`, width - 16, 24);
  }, [
    currentTime,
    currentScene,
    motionStyle,
    framerate,
    aspectRatio,
    resolution,
    easingCurve,
    keyframeScale,
    captionOffsetY,
    glowIntensity,
  ]);

  // AI Script Generator
  const handleGenerateScript = async () => {
    if (!briefInput.trim()) return;
    setIsGeneratingScript(true);
    try {
      const result = await generateMotionScript(briefInput.trim(), project.durationSeconds, project.style);
      if (result && result.scenes) {
        setProject(result);
        setCurrentTime(0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Visual Learning / Critique Action Handler
  const handleApplyCritique = async () => {
    if (!critiqueInput.trim()) return;
    setIsApplyingCritique(true);

    try {
      const res = await applyVisualFeedback(critiqueInput.trim(), currentScene, activeSceneIndex);

      if (res.updatedScene) {
        // Update project scene
        const updatedScenes = [...project.scenes];
        updatedScenes[activeSceneIndex] = {
          ...updatedScenes[activeSceneIndex],
          ...res.updatedScene,
        };
        setProject((prev) => ({ ...prev, scenes: updatedScenes }));

        // Adjust parameters to fix reported issues:
        // 1. Camera speed too fast -> switch easing to spring/ease-in-out
        setEasingCurve('spring');
        // 2. Captions covering subject -> shift captionOffsetY down to 325px
        setCaptionOffsetY(325);
        // 3. Title animation cheap -> switch to cyber kinetic style with higher glow
        setMotionStyle('cyber');
        setGlowIntensity(22);

        setLatestCritiqueResult({
          detectedIssues: res.critiqueRecord.detectedIssues,
          appliedChanges: res.critiqueRecord.appliedChanges,
          durableMemoryRule: res.durableMemoryRule,
        });

        if (onCritiqueSaved && res.critiqueRecord) {
          onCritiqueSaved(res.critiqueRecord);
        }
      }
    } catch (err) {
      console.error('Failed to apply critique:', err);
    } finally {
      setIsApplyingCritique(false);
    }
  };

  // Canvas WebM Master Recorder
  const startCanvasRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const stream = canvas.captureStream(framerate);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setIsRecording(false);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setCurrentTime(0);
      setIsPlaying(true);
    } catch (err) {
      console.error('Recording failed:', err);
      setIsRecording(false);
    }
  };

  const stopCanvasRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsPlaying(false);
    }
  };

  // Generate and download .SRT Subtitles file
  const handleExportSRT = () => {
    let srt = '';
    let start = 0;
    project.scenes.forEach((sc, i) => {
      const end = start + sc.duration;
      const formatTime = (secs: number) => {
        const h = String(Math.floor(secs / 3600)).padStart(2, '0');
        const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
        const s = String(Math.floor(secs % 60)).padStart(2, '0');
        const ms = String(Math.floor((secs % 1) * 1000)).padStart(3, '0');
        return `${h}:${m}:${s},${ms}`;
      };
      srt += `${i + 1}\n${formatTime(start)} --> ${formatTime(end)}\n${sc.narration}\n\n`;
      start = end;
    });

    const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.srt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Studio Header & Studio Mode Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
            <Clapperboard className="w-4 h-4 text-pink-400" />
            DAYMATE Motion Studio (Creative Suite)
          </h2>
          <p className="text-[11px] text-slate-400">
            Professional video production, advanced motion graphics, and visual learning critique.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as any)}
            className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200"
          >
            <option value="16:9">16:9 (Landscape)</option>
            <option value="9:16">9:16 (Vertical)</option>
          </select>
          <select
            value={framerate}
            onChange={(e) => setFramerate(Number(e.target.value) as any)}
            className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200"
          >
            <option value="24">24 fps</option>
            <option value="30">30 fps</option>
            <option value="60">60 fps</option>
          </select>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
        <button
          onClick={() => setStudioMode('production')}
          className={`flex-1 py-1.5 rounded-lg transition font-medium flex items-center justify-center gap-1.5 ${
            studioMode === 'production'
              ? 'bg-pink-950 text-pink-300 font-bold border border-pink-800 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>A. Video Production</span>
        </button>
        <button
          onClick={() => setStudioMode('advanced_motion')}
          className={`flex-1 py-1.5 rounded-lg transition font-medium flex items-center justify-center gap-1.5 ${
            studioMode === 'advanced_motion'
              ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>B. Advanced Motion FX</span>
        </button>
        <button
          onClick={() => setStudioMode('visual_learning')}
          className={`flex-1 py-1.5 rounded-lg transition font-medium flex items-center justify-center gap-1.5 ${
            studioMode === 'visual_learning'
              ? 'bg-purple-950 text-purple-300 font-bold border border-purple-800 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Visual Learning</span>
        </button>
      </div>

      {/* Main Motion Canvas Viewport */}
      <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl space-y-2 p-2">
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            className="w-full h-full object-contain"
          />

          {/* Recording WebM indicator */}
          {isRecording && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/90 border border-rose-600 text-[10px] font-bold text-rose-300 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>REC MASTER WEBM</span>
            </div>
          )}

          {/* Side-by-side Reference Indicator if enabled */}
          {showReferenceComparison && (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-[10px] font-mono text-purple-300">
              Reference Comparison Active
            </div>
          )}
        </div>

        {/* Transport Bar */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-8 h-8 rounded-full bg-pink-600 hover:bg-pink-500 text-white flex items-center justify-center transition active:scale-95"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            </button>
            <button
              onClick={() => {
                setCurrentTime(0);
                setIsPlaying(false);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
              title="Reset scrubber"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs text-cyan-400 font-bold">
              {currentTime.toFixed(2)}s / {project.durationSeconds}s
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Export SRT captions */}
            <button
              onClick={handleExportSRT}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
              title="Export synchronized SubRip captions"
            >
              <FileCode className="w-3.5 h-3.5 text-purple-400" />
              <span>.SRT</span>
            </button>

            {/* Canvas WebM master record button */}
            {isRecording ? (
              <button
                onClick={stopCanvasRecording}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg animate-pulse"
              >
                Stop Render
              </button>
            ) : (
              <button
                onClick={startCanvasRecording}
                className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold rounded-lg transition"
              >
                <FileVideo className="w-3.5 h-3.5" />
                <span>Render Video</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrubber slider */}
        <div className="px-2">
          <input
            type="range"
            min={0}
            max={project.durationSeconds}
            step={0.05}
            value={currentTime}
            onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
            className="w-full accent-pink-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Render Ready Download Card */}
      {recordedVideoUrl && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-200">
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Render Master Ready: 1080p WebM master video generated!</span>
          </div>
          <a
            href={recordedVideoUrl}
            download={`daymate-master-${Date.now()}.webm`}
            className="flex items-center gap-1 px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-md transition"
          >
            <Download className="w-3 h-3" />
            <span>Download Master</span>
          </a>
        </div>
      )}

      {/* MODE 1: PRODUCTION OVERVIEW & SCRIPT (LEVEL A) */}
      {studioMode === 'production' && (
        <div className="space-y-3">
          {/* 12-Stage Pipeline Navigator */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs select-none">
            {stages.map((stg, i) => (
              <button
                key={stg}
                onClick={() => setActiveStageIndex(i)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg whitespace-nowrap transition text-xs font-medium ${
                  activeStageIndex === i
                    ? 'bg-pink-950 text-pink-300 border border-pink-800 font-bold'
                    : i < activeStageIndex
                    ? 'bg-slate-900 text-slate-300 border border-slate-800'
                    : 'bg-slate-950 text-slate-500 border border-slate-900'
                }`}
              >
                <span>{i + 1}.</span>
                <span>{stg}</span>
              </button>
            ))}
          </div>

          {/* AI Script & Storyboard Generator Card */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                Scriptwriting & Production Brief
              </span>
              <span className="text-[10px] text-slate-400">Pacing: 140 words/min</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={briefInput}
                onChange={(e) => setBriefInput(e.target.value)}
                placeholder="e.g., 30s cyber-noir teaser showcasing DAYMATE AI..."
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-pink-500"
              />
              <button
                onClick={handleGenerateScript}
                disabled={isGeneratingScript || !briefInput.trim()}
                className="px-3 py-1.5 bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white font-bold text-xs rounded-lg transition active:scale-95"
              >
                {isGeneratingScript ? 'Writing...' : 'Generate Plan'}
              </button>
            </div>
          </div>

          {/* Multi-Track Timeline */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-pink-400" />
                Multi-Track Timeline (4 Tracks)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Active Scene: {activeSceneIndex + 1}/{project.scenes.length}
              </span>
            </div>

            {/* Track 1: Visual Shots */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Film className="w-3 h-3 text-cyan-400" /> Track 1: Visual Shots & Prompts
              </span>
              <div className="grid grid-cols-4 gap-1">
                {project.scenes.map((sc, i) => (
                  <button
                    key={sc.sceneNumber}
                    onClick={() => {
                      let start = 0;
                      for (let j = 0; j < i; j++) start += project.scenes[j].duration;
                      setCurrentTime(start);
                    }}
                    className={`p-2 rounded-lg border text-left transition ${
                      activeSceneIndex === i
                        ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[10px] font-bold truncate">S{sc.sceneNumber}: {sc.title}</div>
                    <div className="text-[9px] text-slate-500 font-mono mt-0.5">{sc.duration}s</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Track 2: Kinetic Titles & Motion Graphics */}
            <div className="space-y-1 pt-1 border-t border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Type className="w-3 h-3 text-pink-400" /> Track 2: Motion Titles & Overlays
              </span>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-pink-300 font-mono truncate">
                {currentScene.motionGraphic}
              </div>
            </div>

            {/* Track 3: Voiceover Narration */}
            <div className="space-y-1 pt-1 border-t border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Music className="w-3 h-3 text-emerald-400" /> Track 3: Voiceover & Audio
              </span>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 italic truncate">
                "{currentScene.narration}"
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: ADVANCED MOTION DESIGN CONTROLS (LEVEL B) */}
      {studioMode === 'advanced_motion' && (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Advanced Motion Parameters & Keyframing (Level B)
            </h3>
            <span className="text-[10px] text-cyan-400 font-mono">Real-time canvas binding</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Easing Curve */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 block">
                Motion Curve & Easing
              </label>
              <select
                value={easingCurve}
                onChange={(e) => setEasingCurve(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
              >
                <option value="ease-in-out">Smooth Ease-in-out</option>
                <option value="spring">Dynamic Elastic Spring</option>
                <option value="cubic-bezier">Cinematic Cubic-Bezier (0.25, 0.1, 0.25, 1.0)</option>
                <option value="linear">Constant Velocity Linear</option>
              </select>
            </div>

            {/* Motion Typography Preset */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 block">
                Motion Graphic Aesthetic Style
              </label>
              <select
                value={motionStyle}
                onChange={(e) => setMotionStyle(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
              >
                <option value="cyber">Kinetic Cyber Glow (Cyan)</option>
                <option value="neon">Neon Horizon Pulse (Magenta)</option>
                <option value="kinetic">Kinetic Broadcast Punch (Blue)</option>
                <option value="minimal">Minimal Editorial Modern (White)</option>
              </select>
            </div>

            {/* Caption Y-Offset Slider (Direct fix for "captions covering subject"!) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-slate-300">
                <span>Caption Vertical Safe-Zone (Y-Offset):</span>
                <span className="font-mono text-cyan-400">{captionOffsetY}px</span>
              </div>
              <input
                type="range"
                min={220}
                max={340}
                value={captionOffsetY}
                onChange={(e) => setCaptionOffsetY(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block">
                Prevents captions from covering central subjects or faces.
              </span>
            </div>

            {/* Glow Intensity Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-slate-300">
                <span>Title Typography Glow Blur:</span>
                <span className="font-mono text-pink-400">{glowIntensity}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                value={glowIntensity}
                onChange={(e) => setGlowIntensity(Number(e.target.value))}
                className="w-full accent-pink-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: VISUAL LEARNING SYSTEM */}
      {studioMode === 'visual_learning' && (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-purple-400" />
              Visual Learning & Iterative Critique Engine
            </h3>
            <span className="text-[10px] text-purple-300 font-semibold">
              Translates critique into durable edits
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            Highlight mistakes in natural language. DAYMATE translates your feedback into specific timeline, camera, and typography mutations, then permanently records the learning in your memory core.
          </p>

          {/* Natural language critique prompt input */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-300 block">
              Explain What Needs to Change:
            </label>
            <textarea
              value={critiqueInput}
              onChange={(e) => setCritiqueInput(e.target.value)}
              rows={3}
              placeholder="e.g. The camera movement is too fast, the captions are covering the subject, and the title animation feels cheap. Fix those three things."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
            />

            {/* Quick critique preset pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                onClick={() =>
                  setCritiqueInput(
                    'The camera movement is too fast, the captions are covering the subject, and the title animation feels cheap. Fix those three things.'
                  )
                }
                className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-purple-300 hover:border-purple-800"
              >
                Camera too fast + captions covering subject + cheap titles
              </button>
              <button
                onClick={() =>
                  setCritiqueInput(
                    'Pacing is rushed in scene 2. Add 2 seconds to let the holographic cards settle and soften the glow.'
                  )
                }
                className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-purple-300 hover:border-purple-800"
              >
                Pacing rushed in scene 2 + soften glow
              </button>
            </div>

            <button
              onClick={handleApplyCritique}
              disabled={isApplyingCritique || !critiqueInput.trim()}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition active:scale-98 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isApplyingCritique ? 'Translating Critique & Recalibrating...' : 'Apply Visual Corrections & Remember'}</span>
            </button>
          </div>

          {/* Feedback Translation Output Card */}
          {latestCritiqueResult && (
            <div className="rounded-xl bg-purple-950/30 border border-purple-800/60 p-3.5 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Visual Learning Results Applied</span>
              </div>

              {/* Detected issues list */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Identified Mistakes
                </span>
                <div className="flex flex-wrap gap-1">
                  {latestCritiqueResult.detectedIssues.map((issue, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/60"
                    >
                      {issue}
                    </span>
                  ))}
                </div>
              </div>

              {/* Applied editing adjustments */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Timeline & Parameter Adjustments Made
                </span>
                <ul className="space-y-1 text-xs text-slate-200">
                  {latestCritiqueResult.appliedChanges.map((change, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <ArrowRight className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Durable Memory Learned Rule */}
              <div className="p-2.5 rounded-lg bg-slate-950 border border-purple-800/50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-purple-400 block">
                  Recorded in Personal Memory Core
                </span>
                <p className="text-xs text-slate-300 italic">
                  "{latestCritiqueResult.durableMemoryRule}"
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
