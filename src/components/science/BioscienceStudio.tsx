import React, { useState } from 'react';
import {
  Dna,
  Search,
  ExternalLink,
  Download,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  BookmarkPlus,
  Atom,
  FileText,
  Activity,
  Layers,
  Info,
} from 'lucide-react';

interface BioscienceStudioProps {
  onSaveAsMemory?: (title: string, content: string) => void;
  onAddTask?: (title: string, desc: string) => void;
}

export const BioscienceStudio: React.FC<BioscienceStudioProps> = ({
  onSaveAsMemory,
  onAddTask,
}) => {
  const [activeTab, setActiveTab] = useState<'alphafold' | 'pubchem' | 'synthesis'>('alphafold');

  // AlphaFold State
  const [uniprotQuery, setUniprotQuery] = useState('P04637'); // TP53
  const [afResult, setAfResult] = useState<any>(null);
  const [isAfLoading, setIsAfLoading] = useState(false);
  const [afError, setAfError] = useState<string | null>(null);

  // PubChem State
  const [compoundQuery, setCompoundQuery] = useState('Aspirin');
  const [pcResult, setPcResult] = useState<any>(null);
  const [isPcLoading, setIsPcLoading] = useState(false);
  const [pcError, setPcError] = useState<string | null>(null);

  // Science Synthesis State
  const [synthQuery, setSynthQuery] = useState('Targeting KRAS G12D with small molecule covalent inhibitors');
  const [synthResult, setSynthResult] = useState<string | null>(null);
  const [isSynthLoading, setIsSynthLoading] = useState(false);

  // Query AlphaFold DB
  const handleQueryAlphaFold = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!uniprotQuery.trim()) return;

    setIsAfLoading(true);
    setAfError(null);
    try {
      const res = await fetch('/api/science/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'alphafold', id: uniprotQuery.trim().toUpperCase() }),
      });
      if (!res.ok) throw new Error(`AlphaFold DB error (${res.status})`);
      const data = await res.json();
      if (Array.isArray(data.data) && data.data.length > 0) {
        setAfResult(data.data[0]);
      } else {
        setAfError('No AlphaFold DB structure model found for this UniProt ID.');
      }
    } catch (err: any) {
      setAfError(err.message || 'Failed to query AlphaFold DB');
    } finally {
      setIsAfLoading(false);
    }
  };

  // Query PubChem
  const handleQueryPubChem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!compoundQuery.trim()) return;

    setIsPcLoading(true);
    setPcError(null);
    try {
      const res = await fetch('/api/science/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'pubchem', id: compoundQuery.trim() }),
      });
      if (!res.ok) throw new Error(`PubChem error (${res.status})`);
      const data = await res.json();
      const props = data.data?.PropertyTable?.Properties?.[0];
      if (props) {
        setPcResult(props);
      } else {
        setPcError('No compound records found in PubChem.');
      }
    } catch (err: any) {
      setPcError(err.message || 'Failed to query PubChem');
    } finally {
      setIsPcLoading(false);
    }
  };

  // Run Science Synthesis
  const handleRunSynthesis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!synthQuery.trim()) return;

    setIsSynthLoading(true);
    try {
      const res = await fetch('/api/science/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'synthesis', prompt: synthQuery }),
      });
      const data = await res.json();
      setSynthResult(data.answer || 'Analysis complete.');
    } catch (err: any) {
      setSynthResult('Failed to run synthesis.');
    } finally {
      setIsSynthLoading(false);
    }
  };

  // Check Lipinski's Rule of 5 for PubChem
  const checkLipinski = (p: any) => {
    const violations = [];
    if (parseFloat(p.MolecularWeight) > 500) violations.push('MW > 500 Da');
    if (parseFloat(p.XLogP) > 5) violations.push('LogP > 5');
    if (parseInt(p.HBondDonorCount) > 5) violations.push('H-bond donors > 5');
    if (parseInt(p.HBondAcceptorCount) > 10) violations.push('H-bond acceptors > 10');
    return {
      passes: violations.length <= 1,
      violations,
    };
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Studio Header */}
      <div>
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
          <Dna className="w-4 h-4 text-emerald-400" />
          Bioscience Studio & Scout (DeepMind Science Suite)
        </h2>
        <p className="text-[11px] text-slate-400">
          Query AlphaFold DB 3D structures, PubChem small-molecule pharmacology, and DeepMind bio-intelligence.
        </p>
      </div>

      {/* Subtab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
        <button
          onClick={() => setActiveTab('alphafold')}
          className={`flex-1 py-1.5 rounded-lg transition font-medium flex items-center justify-center gap-1.5 ${
            activeTab === 'alphafold'
              ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-800 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Dna className="w-3.5 h-3.5" />
          <span>AlphaFold DB</span>
        </button>
        <button
          onClick={() => setActiveTab('pubchem')}
          className={`flex-1 py-1.5 rounded-lg transition font-medium flex items-center justify-center gap-1.5 ${
            activeTab === 'pubchem'
              ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Atom className="w-3.5 h-3.5" />
          <span>PubChem Compounds</span>
        </button>
        <button
          onClick={() => setActiveTab('synthesis')}
          className={`flex-1 py-1.5 rounded-lg transition font-medium flex items-center justify-center gap-1.5 ${
            activeTab === 'synthesis'
              ? 'bg-purple-950 text-purple-300 font-bold border border-purple-800 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Bio Synthesis</span>
        </button>
      </div>

      {/* TAB 1: ALPHAFOLD DB STRUCTURE EXPLORER */}
      {activeTab === 'alphafold' && (
        <div className="space-y-3">
          <form onSubmit={handleQueryAlphaFold} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={uniprotQuery}
                onChange={(e) => setUniprotQuery(e.target.value)}
                placeholder="Enter UniProt ID (e.g., P04637 for TP53, P00520 for ABL1)..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isAfLoading || !uniprotQuery.trim()}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl transition active:scale-95 flex items-center gap-1"
            >
              <span>{isAfLoading ? 'Searching...' : 'Fetch AFDB'}</span>
            </button>
          </form>

          {/* Quick preset UniProt IDs */}
          <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-400">
            <span className="text-[10px] uppercase font-bold text-slate-500">Presets:</span>
            <button
              onClick={() => {
                setUniprotQuery('P04637');
                setTimeout(() => handleQueryAlphaFold(), 50);
              }}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:text-emerald-300"
            >
              TP53 (Human)
            </button>
            <button
              onClick={() => {
                setUniprotQuery('P00520');
                setTimeout(() => handleQueryAlphaFold(), 50);
              }}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:text-emerald-300"
            >
              ABL1 (Kinase)
            </button>
            <button
              onClick={() => {
                setUniprotQuery('P01308');
                setTimeout(() => handleQueryAlphaFold(), 50);
              }}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:text-emerald-300"
            >
              Insulin
            </button>
          </div>

          {afError && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{afError}</span>
            </div>
          )}

          {afResult && (
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3.5 shadow-md">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {afResult.entryId || afResult.uniprotAccession}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                      Gene: {afResult.gene || 'N/A'}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white mt-1">
                    {afResult.uniprotDescription || afResult.uniprotId}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 italic">
                    Organism: {afResult.organismScientificName} (TaxID {afResult.taxId})
                  </p>
                </div>

                <a
                  href={`https://deepmind.google.com/science/alphagenome/atlas?q=${afResult.gene || afResult.uniprotAccession}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded-lg transition"
                >
                  <span>AlphaGenome</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* pLDDT Confidence Scale Legend */}
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-[10px]">
                <span className="font-bold text-slate-400 block uppercase tracking-wider">
                  AlphaFold Model Confidence (pLDDT Metric)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <div className="flex items-center gap-1.5 text-blue-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0053D6]" />
                    <span>Very High (&gt;90)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-cyan-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#65CBF3]" />
                    <span>Confident (70-90)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-yellow-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FFDB13]" />
                    <span>Low (50-70)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-orange-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF7D45]" />
                    <span>Very Low (IDPR &lt;50)</span>
                  </div>
                </div>
              </div>

              {/* Downloads & Links */}
              <div className="pt-1 border-t border-slate-800/80 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Structure Coordinate Assets (Official AFDB)
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {afResult.pdbUrl && (
                    <a
                      href={afResult.pdbUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-slate-200"
                    >
                      <Download className="w-3 h-3 text-emerald-400" />
                      <span>Download .PDB</span>
                    </a>
                  )}
                  {afResult.cifUrl && (
                    <a
                      href={afResult.cifUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-slate-200"
                    >
                      <Download className="w-3 h-3 text-cyan-400" />
                      <span>Download mmCIF</span>
                    </a>
                  )}
                  {afResult.paeDocUrl && (
                    <a
                      href={afResult.paeDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-slate-200"
                    >
                      <Layers className="w-3 h-3 text-purple-400" />
                      <span>PAE Matrix JSON</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                {onSaveAsMemory && (
                  <button
                    onClick={() =>
                      onSaveAsMemory(
                        `Protein Target: ${afResult.gene || afResult.uniprotAccession}`,
                        `AlphaFold structure verified for ${afResult.uniprotDescription}. Accession: ${afResult.uniprotAccession}, Organism: ${afResult.organismScientificName}.`
                      )
                    }
                    className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>Save Target to Memory</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PUBCHEM SMALL MOLECULE CHEMICAL SCOUT */}
      {activeTab === 'pubchem' && (
        <div className="space-y-3">
          <form onSubmit={handleQueryPubChem} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={compoundQuery}
                onChange={(e) => setCompoundQuery(e.target.value)}
                placeholder="Enter compound name (e.g. Aspirin, Imatinib, Dexamethasone)..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              type="submit"
              disabled={isPcLoading || !compoundQuery.trim()}
              className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl transition active:scale-95 flex items-center gap-1"
            >
              <span>{isPcLoading ? 'Searching...' : 'Fetch PubChem'}</span>
            </button>
          </form>

          {pcError && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{pcError}</span>
            </div>
          )}

          {pcResult && (
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3.5 shadow-md">
              <div className="flex items-start justify-between border-b border-slate-800 pb-2.5">
                <div>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    CID: {pcResult.CID}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-0.5">{compoundQuery}</h3>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Formula: {pcResult.MolecularFormula} · MW: {pcResult.MolecularWeight} g/mol
                  </p>
                </div>

                <a
                  href={`https://pubchem.ncbi.nlm.nih.gov/compound/${pcResult.CID}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* 2D Structure Rendering & Lipinski Rule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div className="bg-white p-3 rounded-xl flex items-center justify-center">
                  <img
                    src={`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${pcResult.CID}/PNG?image_size=large`}
                    alt={compoundQuery}
                    className="max-h-36 object-contain"
                  />
                </div>

                <div className="space-y-2 text-xs">
                  {/* Lipinski Rule of 5 evaluation */}
                  {(() => {
                    const l = checkLipinski(pcResult);
                    return (
                      <div
                        className={`p-2.5 rounded-lg border ${
                          l.passes
                            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                            : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold">
                          {l.passes ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          <span>Lipinski Rule of 5: {l.passes ? 'Passes' : 'Violations'}</span>
                        </div>
                        {l.violations.length > 0 && (
                          <span className="text-[10px] block mt-0.5 opacity-90">
                            {l.violations.join(', ')}
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300">
                    <div>
                      <span className="text-slate-500 block">XLogP:</span>
                      <strong className="font-mono">{pcResult.XLogP ?? 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">TPSA:</span>
                      <strong className="font-mono">{pcResult.TPSA} Å²</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">H-Donors:</span>
                      <strong className="font-mono">{pcResult.HBondDonorCount}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">H-Acceptors:</span>
                      <strong className="font-mono">{pcResult.HBondAcceptorCount}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* SMILES */}
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[10px] space-y-0.5">
                <span className="text-slate-500 font-bold uppercase tracking-wider block">
                  Canonical SMILES:
                </span>
                <span className="font-mono text-cyan-300 break-all select-all">
                  {pcResult.CanonicalSMILES}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DEEPMIND SCIENCE INTELLIGENCE SYNTHESIS */}
      {activeTab === 'synthesis' && (
        <div className="space-y-3">
          <form onSubmit={handleRunSynthesis} className="space-y-2">
            <textarea
              value={synthQuery}
              onChange={(e) => setSynthQuery(e.target.value)}
              rows={2}
              placeholder="Ask a molecular biology, target validation, or clinical question..."
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
            />
            <button
              type="submit"
              disabled={isSynthLoading || !synthQuery.trim()}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSynthLoading ? 'Synthesizing Biological Literature...' : 'Run Science Scout'}</span>
            </button>
          </form>

          {synthResult && (
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-purple-300">Biomedical Intelligence Synthesis</h4>
                <span className="text-[10px] text-slate-500 font-mono">DeepMind Science Guidelines</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {synthResult}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
