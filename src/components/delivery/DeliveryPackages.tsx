import React, { useState } from 'react';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileText,
  Video,
  Database,
  FileCode,
  Layers,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Check,
} from 'lucide-react';
import { DeliveryPackage, DeliveryItem } from '../../types.js';

interface DeliveryPackagesProps {
  packages: DeliveryPackage[];
  onUpdateItemStatus: (packageId: string, itemId: string, status: 'finished' | 'requires_attention') => Promise<void>;
}

export const DeliveryPackages: React.FC<DeliveryPackagesProps> = ({
  packages,
  onUpdateItemStatus,
}) => {
  const [selectedPkgId, setSelectedPkgId] = useState<string>(packages[0]?.id || '');
  const [notice, setNotice] = useState<string | null>(null);

  const activePackage = packages.find((p) => p.id === selectedPkgId) || packages[0];

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleDownloadItem = (item: DeliveryItem) => {
    if (!item.downloadData) {
      showNotice(`Asset "${item.name}" is queued or can be exported from the Studio canvas.`);
      return;
    }
    const blob = new Blob([item.downloadData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const ext = item.fileFormat.toLowerCase().includes('srt')
      ? 'srt'
      : item.fileFormat.toLowerCase().includes('csv')
      ? 'csv'
      : item.fileFormat.toLowerCase().includes('json')
      ? 'json'
      : 'md';
    link.download = `${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${ext}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleDownloadAllFinished = () => {
    if (!activePackage) return;
    const finishedItemsWithData = activePackage.items.filter((i) => i.status === 'finished' && i.downloadData);
    if (finishedItemsWithData.length === 0) {
      showNotice('No text assets available for batch download in this package.');
      return;
    }
    finishedItemsWithData.forEach((item, index) => {
      setTimeout(() => {
        handleDownloadItem(item);
      }, index * 200);
    });
  };

  const getItemIcon = (type: DeliveryItem['type']) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4 text-pink-400" />;
      case 'script':
      case 'document':
      case 'pitch':
        return <FileText className="w-4 h-4 text-cyan-400" />;
      case 'data':
        return <Database className="w-4 h-4 text-emerald-400" />;
      case 'subtitles':
        return <FileCode className="w-4 h-4 text-purple-400" />;
      default:
        return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
          <Package className="w-4 h-4 text-emerald-400" />
          Assignment Delivery System
        </h2>
        <p className="text-[11px] text-slate-400">
          Structured deliverable bundles with clear distinction between finished outputs and items requiring your review.
        </p>
      </div>

      {/* Package Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {packages.map((pkg) => {
          const finishedCount = pkg.items.filter((i) => i.status === 'finished').length;
          const isSelected = pkg.id === selectedPkgId;
          return (
            <button
              key={pkg.id}
              onClick={() => setSelectedPkgId(pkg.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap transition border text-xs font-semibold ${
                isSelected
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80 shadow-xs'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
            >
              <span>{pkg.title.slice(0, 30)}...</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                {finishedCount}/{pkg.items.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Package Card */}
      {activePackage && (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-4 shadow-lg">
          {/* Package Overview Banner */}
          <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/70 border border-emerald-800/50 px-2 py-0.5 rounded">
                  {activePackage.category.replace('_', ' ')}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {new Date(activePackage.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-1.5">{activePackage.title}</h3>
            </div>

            <button
              onClick={handleDownloadAllFinished}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg transition active:scale-95 shadow-sm"
              title="Download all completed files"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Batch Download</span>
            </button>
          </div>

          {/* Deliverables Breakdown */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>Deliverables Checklist ({activePackage.items.length})</span>
              <div className="flex items-center gap-3 text-[10px] font-normal">
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  {activePackage.items.filter((i) => i.status === 'finished').length} Finished
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <AlertTriangle className="w-3 h-3" />
                  {activePackage.items.filter((i) => i.status === 'requires_attention').length} Needs Attention
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {activePackage.items.map((item) => {
                const isFinished = item.status === 'finished';
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition space-y-2 ${
                      isFinished
                        ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        : 'bg-amber-950/20 border-amber-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 mt-0.5">
                          {getItemIcon(item.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-200">{item.name}</h4>
                            <span className="text-[10px] font-mono text-slate-400">{item.fileFormat}</span>
                            {item.fileSize && (
                              <span className="text-[10px] font-mono text-slate-500">· {item.fileSize}</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{item.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {item.downloadData && (
                          <button
                            onClick={() => handleDownloadItem(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title="Download file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() =>
                            onUpdateItemStatus(
                              activePackage.id,
                              item.id,
                              isFinished ? 'requires_attention' : 'finished'
                            )
                          }
                          className={`p-1.5 rounded-lg border transition ${
                            isFinished
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                              : 'bg-amber-950/80 text-amber-300 border-amber-800 hover:bg-emerald-950 hover:text-emerald-300'
                          }`}
                          title={isFinished ? 'Mark as needs attention' : 'Mark finished'}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Needs Attention Warning Note */}
                    {!isFinished && item.attentionNote && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-950/40 border border-amber-800/50 text-[11px] text-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                        <span>{item.attentionNote}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
