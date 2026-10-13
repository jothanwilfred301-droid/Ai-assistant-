import React, { useState } from 'react';
import {
  Search,
  Globe,
  ExternalLink,
  Download,
  Copy,
  CheckCircle,
  AlertCircle,
  FileText,
  Sparkles,
  BookmarkPlus,
} from 'lucide-react';
import { performResearch } from '../../services/api.js';
import { ResearchReport } from '../../types.js';

interface ResearchStudioProps {
  onSaveAsMemory?: (title: string, content: string) => void;
  onAddTask?: (title: string, desc: string) => void;
}

export const ResearchStudio: React.FC<ResearchStudioProps> = ({
  onSaveAsMemory,
  onAddTask,
}) => {
  const [query, setQuery] = useState('');
  const [depth, setDepth] = useState<'standard' | 'deep'>('standard');
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const data = await performResearch(query.trim(), depth);
      setReport(data);
    } catch (err: any) {
      console.error('Research error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!report) return;
    const md = `# Web Intelligence Report: ${report.query}\n\nConducted on: ${new Date(
      report.conductedAt
    ).toLocaleString()}\n\n## Findings & Evidence\n\n${report.summary}\n\n## Sources\n${report.sources
      .map((s) => `- [${s.title}](${s.url})`)
      .join('\n')}`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCSV = () => {
    if (!report) return;
    const rows = [
      ['Query', 'Timestamp', 'Summary', 'Source URLs'],
      [
        `"${report.query.replace(/"/g, '""')}"`,
        `"${report.conductedAt}"`,
        `"${report.summary.replace(/"/g, '""')}"`,
        `"${report.sources.map((s) => s.url).join('; ')}"`,
      ],
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `research-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
          <Globe className="w-4 h-4 text-blue-400" />
          Research & Web Intelligence
        </h2>
        <p className="text-[11px] text-slate-400">
          Grounded live web research with citations, fact verification, and structured export.
        </p>
      </div>

      {/* Query Form */}
      <form onSubmit={handleSearch} className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search topic, competitive benchmarks, technical specs..."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition active:scale-95 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Researching...' : 'Search'}</span>
          </button>
        </div>

        <div className="flex items-center gap-3 px-1 text-[11px] text-slate-400">
          <span>Mode:</span>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              checked={depth === 'standard'}
              onChange={() => setDepth('standard')}
              className="text-blue-500"
            />
            <span>Standard Grounding</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              checked={depth === 'deep'}
              onChange={() => setDepth('deep')}
              className="text-blue-500"
            />
            <span>Deep Synthesis</span>
          </label>
        </div>
      </form>

      {/* Report Result */}
      {isLoading && (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-8 text-center space-y-2 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-blue-900/60 border border-blue-600 mx-auto flex items-center justify-center text-blue-400">
            <Globe className="w-4 h-4 animate-spin" />
          </div>
          <h4 className="text-xs font-bold text-slate-200">Grounded Search in Progress</h4>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            Querying Google Search index, cross-verifying citations, and structuring intelligence report...
          </p>
        </div>
      )}

      {report && !isLoading && (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3.5 shadow-md">
          {/* Action Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                Intelligence Report
              </span>
              <h3 className="text-xs font-bold text-white mt-0.5">{report.query}</h3>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyMarkdown}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                title="Copy as Markdown"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Copied' : 'MD'}</span>
              </button>
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                title="Export as CSV"
              >
                <Download className="w-3 h-3" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Report Body */}
          <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
            {report.summary}
          </div>

          {/* Sources Section */}
          {report.sources.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Grounded Citations ({report.sources.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {report.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-blue-500/50 text-[11px] text-slate-300 hover:text-blue-300 transition"
                  >
                    <span className="truncate pr-2">{src.title}</span>
                    <ExternalLink className="w-3 h-3 text-slate-500 flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions with findings */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
            {onSaveAsMemory && (
              <button
                onClick={() =>
                  onSaveAsMemory(
                    `Research: ${report.query}`,
                    report.summary.slice(0, 300) + '...'
                  )
                }
                className="flex items-center gap-1 text-[11px] font-semibold text-purple-400 hover:text-purple-300"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Save to Memory</span>
              </button>
            )}
            {onAddTask && (
              <button
                onClick={() =>
                  onAddTask(
                    `Action: ${report.query}`,
                    `Execute recommendations from research conducted on ${new Date().toLocaleDateString()}`
                  )
                }
                className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Create Follow-up Task</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
