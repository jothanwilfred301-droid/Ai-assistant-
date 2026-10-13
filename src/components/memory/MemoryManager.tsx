import React, { useState, useEffect, useRef } from 'react';
import {
  BrainCircuit,
  Search,
  Plus,
  Trash2,
  Edit2,
  Lock,
  Download,
  Lightbulb,
  Sparkles,
  Loader2,
  X,
  Target,
  SlidersHorizontal,
  ChevronRight,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { MemoryItem } from '../../types.js';
import { semanticSearchMemories, SemanticSearchMatch } from '../../services/api.js';

interface MemoryManagerProps {
  memories: MemoryItem[];
  onSaveMemory: (memory: Partial<MemoryItem>) => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
}

type SearchMode = 'semantic' | 'keyword';

interface TopicPrompt {
  label: string;
  query: string;
  icon: string;
}

const SUGGESTED_INTENTS: TopicPrompt[] = [
  { label: 'Safety & Gates', query: 'What are my rules about safety, destructive actions, and approval gates?', icon: '🛡️' },
  { label: 'Mobile Briefings', query: 'How do I prefer summaries and formatting on mobile devices?', icon: '📱' },
  { label: 'Video Production', query: 'What is my pipeline or standard workflow for producing motion videos?', icon: '🎬' },
  { label: 'Companion Roadmap', query: 'What are the main project goals and launch plans for DAYMATE?', icon: '🎯' },
  { label: 'Private & Sensitive', query: 'Which items are marked sensitive or require privacy precautions?', icon: '🔒' },
];

export const MemoryManager: React.FC<MemoryManagerProps> = ({
  memories,
  onSaveMemory,
  onDeleteMemory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('semantic');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<MemoryItem | null>(null);

  // Semantic search state
  const [isSearching, setIsSearching] = useState(false);
  const [semanticMatches, setSemanticMatches] = useState<SemanticSearchMatch[]>([]);
  const [detectedIntent, setDetectedIntent] = useState<string | null>(null);
  const [searchSource, setSearchSource] = useState<'gemini' | 'heuristic' | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<MemoryItem['category']>('preference');
  const [tagsStr, setTagsStr] = useState('');
  const [isSensitive, setIsSensitive] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'preference', label: 'Preferences' },
    { id: 'style', label: 'Communication' },
    { id: 'goal', label: 'Goals' },
    { id: 'project', label: 'Projects' },
    { id: 'instruction', label: 'Instructions' },
    { id: 'correction', label: 'Corrections & Learning' },
    { id: 'workflow', label: 'Workflows' },
    { id: 'decision', label: 'Decisions' },
  ];

  // Perform semantic search
  const runSemanticSearch = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) {
      setSemanticMatches([]);
      setDetectedIntent(null);
      setSearchSource(null);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const result = await semanticSearchMemories(trimmed, memories);
      setSemanticMatches(result.matches || []);
      setDetectedIntent(result.detectedIntent || null);
      setSearchSource(result.source);
    } catch (err: any) {
      console.error('Semantic search error:', err);
      setSearchError('AI search temporarily unavailable; filtering locally.');
      // Fallback: match by terms
      const queryLower = trimmed.toLowerCase();
      const localMatches = memories
        .filter(
          (m) =>
            m.title.toLowerCase().includes(queryLower) ||
            m.content.toLowerCase().includes(queryLower) ||
            m.tags.some((t) => t.toLowerCase().includes(queryLower)) ||
            m.category.toLowerCase().includes(queryLower)
        )
        .map((m) => ({ id: m.id, score: 0.7, reason: 'Matched terms in content or tags' }));
      setSemanticMatches(localMatches);
      setSearchSource('heuristic');
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced trigger when query or mode changes
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchMode === 'semantic') {
      if (!searchQuery.trim()) {
        setSemanticMatches([]);
        setDetectedIntent(null);
        setSearchSource(null);
        setIsSearching(false);
        return;
      }

      debounceTimerRef.current = setTimeout(() => {
        runSemanticSearch(searchQuery);
      }, 400);
    } else {
      setSemanticMatches([]);
      setDetectedIntent(null);
      setSearchSource(null);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, searchMode, memories.length]);

  // Filtered and sorted memories
  const getDisplayMemories = () => {
    // 1. Semantic Mode with an active query
    if (searchMode === 'semantic' && searchQuery.trim().length > 0) {
      const matchMap = new Map<string, SemanticSearchMatch>();
      semanticMatches.forEach((m) => matchMap.set(m.id, m));

      return memories
        .filter((mem) => {
          const isCategoryMatch = selectedCategory === 'all' || mem.category === selectedCategory;
          const isSemanticMatch = matchMap.has(mem.id);
          return isCategoryMatch && isSemanticMatch;
        })
        .sort((a, b) => {
          const scoreA = matchMap.get(a.id)?.score || 0;
          const scoreB = matchMap.get(b.id)?.score || 0;
          return scoreB - scoreA;
        })
        .map((mem) => ({
          ...mem,
          semanticScore: matchMap.get(mem.id)?.score,
          semanticReason: matchMap.get(mem.id)?.reason,
        }));
    }

    // 2. Keyword or empty query
    return memories
      .filter((m) => {
        const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
        const matchesSearch =
          searchQuery.trim() === '' ||
          m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
      })
      .map((mem) => ({
        ...mem,
        semanticScore: undefined,
        semanticReason: undefined,
      }));
  };

  const displayMemories = getDisplayMemories();
  const correctionsLearned = memories.filter((m) => m.category === 'correction');

  const openCreateModal = () => {
    setEditingMemory(null);
    setTitle('');
    setContent('');
    setCategory('preference');
    setTagsStr('');
    setIsSensitive(false);
    setIsModalOpen(true);
  };

  const openEditModal = (mem: MemoryItem) => {
    setEditingMemory(mem);
    setTitle(mem.title);
    setContent(mem.content);
    setCategory(mem.category);
    setTagsStr(mem.tags.join(', '));
    setIsSensitive(mem.isSensitive);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await onSaveMemory({
      id: editingMemory ? editingMemory.id : undefined,
      title: title.trim(),
      content: content.trim(),
      category,
      tags,
      isSensitive,
    });

    setIsModalOpen(false);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(memories, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `daymate-memories-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePromptClick = (promptQuery: string) => {
    setSearchQuery(promptQuery);
    setSearchMode('semantic');
    runSemanticSearch(promptQuery);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSemanticMatches([]);
    setDetectedIntent(null);
    setSearchSource(null);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
            <BrainCircuit className="w-4 h-4 text-purple-400" />
            Personal Memory Core
          </h2>
          <p className="text-[11px] text-slate-400">
            Persistent, structured context retrieved automatically by intent across all agent interactions.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportJSON}
            className="p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-xs"
            title="Export memories as JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-sm transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Memory</span>
          </button>
        </div>
      </div>

      {/* Durable Learning Highlight */}
      {correctionsLearned.length > 0 && (
        <div className="rounded-xl bg-purple-950/30 border border-purple-800/50 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
            <Lightbulb className="w-3.5 h-3.5 text-purple-400" />
            <span>Learnings & Durable Corrections ({correctionsLearned.length})</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            The agent retains confirmed user feedback across all sessions so you never need to repeat corrections.
          </p>
        </div>
      )}

      {/* Search Bar & AI Semantic Search Controls */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-500">
              {searchMode === 'semantic' ? (
                <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchMode === 'semantic') {
                  e.preventDefault();
                  runSemanticSearch(searchQuery);
                }
              }}
              placeholder={
                searchMode === 'semantic'
                  ? "Semantic intent search (e.g., 'rules for video editing', 'mobile UI guidelines')..."
                  : "Filter memories by title, content, or tags..."
              }
              className={`w-full pl-9 pr-9 py-2 bg-slate-900 border rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition ${
                searchMode === 'semantic'
                  ? 'border-purple-800/80 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30'
                  : 'border-slate-800 focus:border-purple-500'
              }`}
            />

            {/* Clear Button or Spinner */}
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {isSearching ? (
                <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
              ) : searchQuery ? (
                <button
                  onClick={clearSearch}
                  className="p-1 text-slate-400 hover:text-slate-200 transition rounded"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>
          </div>

          {/* Search Mode Toggle */}
          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-0.5 text-[11px] shrink-0">
            <button
              onClick={() => setSearchMode('semantic')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition font-medium ${
                searchMode === 'semantic'
                  ? 'bg-purple-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Search memories by natural language intent and topic using Gemini AI"
            >
              <Sparkles className="w-3 h-3" />
              <span>AI Semantic</span>
            </button>
            <button
              onClick={() => setSearchMode('keyword')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition font-medium ${
                searchMode === 'keyword'
                  ? 'bg-slate-800 text-slate-200 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Search memories by exact keywords in title or content"
            >
              <Search className="w-3 h-3" />
              <span>Keyword</span>
            </button>
          </div>
        </div>

        {/* Semantic Intent Chips / Suggested Prompts */}
        {searchMode === 'semantic' && !searchQuery && (
          <div className="pt-0.5">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1.5">
              <Zap className="w-3 h-3 text-purple-400" />
              <span>Filter by intent or topic:</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {SUGGESTED_INTENTS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePromptClick(item.query)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-900/80 hover:bg-purple-950/60 border border-slate-800 hover:border-purple-700/60 text-slate-300 hover:text-purple-200 rounded-lg whitespace-nowrap text-[11px] transition"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI Intent Result Banner */}
        {searchMode === 'semantic' && searchQuery.trim() && (
          <div className="rounded-xl bg-purple-950/30 border border-purple-800/40 p-2.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2 min-w-0">
              <Target className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-purple-200">
                    {isSearching ? 'Analyzing Intent...' : 'Detected Intent & Topic'}
                  </span>
                  {searchSource && !isSearching && (
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-purple-900/60 border border-purple-700/50 text-purple-300 font-mono">
                      {searchSource === 'gemini' ? 'Gemini 3.8 Flash' : 'Semantic Engine'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 truncate mt-0.5">
                  {isSearching
                    ? `Evaluating memories against "${searchQuery}"...`
                    : detectedIntent || `Semantic filtering for: "${searchQuery}"`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] text-purple-300 font-semibold bg-purple-900/50 px-2 py-0.5 rounded-md border border-purple-800/50">
                {displayMemories.length} {displayMemories.length === 1 ? 'match' : 'matches'}
              </span>
              <button
                onClick={() => runSemanticSearch(searchQuery)}
                disabled={isSearching}
                className="p-1 text-slate-400 hover:text-purple-300 transition"
                title="Re-run AI semantic evaluation"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {searchError && (
          <div className="text-[11px] text-amber-400 bg-amber-950/30 border border-amber-800/40 px-3 py-1.5 rounded-lg">
            {searchError}
          </div>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs no-scrollbar">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition font-medium ${
              selectedCategory === c.id
                ? 'bg-purple-950 text-purple-300 border border-purple-800/70 font-semibold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Memory Cards */}
      <div className="space-y-2.5">
        {displayMemories.length === 0 ? (
          <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-8 text-center text-slate-400 space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-800/80 mx-auto flex items-center justify-center text-slate-500">
              {searchMode === 'semantic' ? <Sparkles className="w-5 h-5 text-purple-400" /> : <Search className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-300">
                {searchMode === 'semantic' && searchQuery
                  ? `No memories matched the intent "${searchQuery}"`
                  : 'No memories found for current query.'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {searchMode === 'semantic' && searchQuery
                  ? 'Try rephrasing your topic or switch to Keyword mode to check for exact word substrings.'
                  : 'Try selecting a different category or clear the search query.'}
              </p>
            </div>
            {searchMode === 'semantic' && searchQuery && (
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => setSearchMode('keyword')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
                >
                  Switch to Keyword Search
                </button>
                <button
                  onClick={openCreateModal}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition"
                >
                  + Record Memory for this Intent
                </button>
              </div>
            )}
          </div>
        ) : (
          displayMemories.map((mem) => {
            const scorePercent =
              typeof mem.semanticScore === 'number' ? Math.round(mem.semanticScore * 100) : null;
            const hasSemanticMatch = scorePercent !== null;

            return (
              <div
                key={mem.id}
                className={`rounded-xl bg-slate-900 border p-3.5 transition space-y-2 ${
                  hasSemanticMatch
                    ? 'border-purple-800/60 shadow-sm shadow-purple-950/20 hover:border-purple-600/70'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/70 border border-purple-800/50 px-1.5 py-0.5 rounded">
                      {mem.category}
                    </span>
                    <h3 className="text-xs font-bold text-slate-200">{mem.title}</h3>

                    {/* Semantic Match Score Badge */}
                    {hasSemanticMatch && scorePercent !== null && (
                      <span
                        className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          scorePercent >= 85
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                            : scorePercent >= 60
                            ? 'bg-purple-950/80 text-purple-300 border-purple-700/60'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>{scorePercent}% Intent Match</span>
                      </span>
                    )}

                    {mem.isSensitive && (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-400" title="Sensitive Memory">
                        <Lock className="w-3 h-3" />
                        Sensitive
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(mem)}
                      className="p-1 text-slate-500 hover:text-purple-400 transition"
                      title="Edit memory"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteMemory(mem.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition"
                      title="Delete memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Semantic Match Reason Callout */}
                {mem.semanticReason && (
                  <div className="flex items-start gap-1.5 text-[11px] text-purple-300/90 bg-purple-950/40 border border-purple-800/30 px-2.5 py-1.5 rounded-lg">
                    <Sparkles className="w-3 h-3 text-purple-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">{mem.semanticReason}</span>
                  </div>
                )}

                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {mem.content}
                </p>

                {mem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {mem.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/80"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-white">
              {editingMemory ? 'Edit Memory' : 'Record New Memory'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                >
                  <option value="preference">User Preference</option>
                  <option value="style">Communication Style</option>
                  <option value="goal">Long-term Goal</option>
                  <option value="project">Current Project</option>
                  <option value="instruction">Working Instruction</option>
                  <option value="correction">Correction / Learning</option>
                  <option value="workflow">Reusable Workflow</option>
                  <option value="decision">Decision & Lessons Learned</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Code Review Guidelines"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Content / Rule
                </label>
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe the preference, durable rule, or decision..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  placeholder="e.g., android, security, tone"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                />
              </div>

              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block">Sensitive Information</span>
                  <span className="text-[10px] text-slate-400">
                    Require confirmation before including in external payloads
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isSensitive}
                  onChange={(e) => setIsSensitive(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-purple-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-500"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
