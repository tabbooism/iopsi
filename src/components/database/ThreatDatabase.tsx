import React, { useState, useMemo } from 'react';
import { ScamProfile, ScamCategory, DifficultyLevel, TargetAssetType } from '../../types';
import { 
  Database, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  Download, 
  Upload, 
  Sparkles, 
  History, 
  Tag, 
  Filter, 
  CheckSquare, 
  Square,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { sound } from '../../lib/audio';
import { toast } from '../../lib/toast';
import { Storage } from '../../lib/storage';
import { Security } from '../../lib/security';
import { ScamEditModal } from './ScamEditModal';
import { AuditLogModal } from './AuditLogModal';

interface ThreatDatabaseProps {
  scams: ScamProfile[];
  onUpdateScams: (scams: ScamProfile[]) => void;
  onSelectScamForTraining: (scam: ScamProfile) => void;
}

export const ThreatDatabase: React.FC<ThreatDatabaseProps> = ({
  scams,
  onUpdateScams,
  onSelectScamForTraining
}) => {
  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Selection & Batch Tagging (Feature 30)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchTagInput, setBatchTagInput] = useState('');
  const [batchDifficulty, setBatchDifficulty] = useState<DifficultyLevel | ''>('');

  // Modals & Seed Generator
  const [editingScam, setEditingScam] = useState<ScamProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [seedInput, setSeedInput] = useState('1337');

  // Conflict Resolution Modal state (Feature 27)
  const [conflictItem, setConflictItem] = useState<{ existing: ScamProfile; incoming: ScamProfile } | null>(null);

  // Available unique tags for multi-select taxonomy (Feature 24)
  const allTags = useMemo(() => {
    const set = new Set<string>();
    scams.forEach(s => s.tags?.forEach(t => set.add(t)));
    return Array.from(set);
  }, [scams]);

  // Fuzzy search & Multi-tag filter algorithm (Features 23 & 24)
  const filteredScams = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return scams.filter(s => {
      // Category filter
      if (selectedCategory !== 'All' && s.type !== selectedCategory) {
        return false;
      }

      // Multi-tag taxonomy filter (intersection)
      if (selectedTags.length > 0) {
        const hasAllTags = selectedTags.every(tag => s.tags.includes(tag));
        if (!hasAllTags) return false;
      }

      // Fuzzy / substring search across title, narrative, MITRE
      if (q) {
        const inName = s.name.toLowerCase().includes(q);
        const inNarrative = s.narrative.toLowerCase().includes(q);
        const inMitre = s.mitreTechniques.some(m => m.toLowerCase().includes(q));
        const inRules = s.jagexRules.some(r => r.toLowerCase().includes(q));
        if (!inName && !inNarrative && !inMitre && !inRules) {
          return false;
        }
      }

      return true;
    });
  }, [scams, searchQuery, selectedCategory, selectedTags]);

  // Toggle tag in filter
  const toggleTagFilter = (tag: string) => {
    sound.playClick();
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Checkbox selection
  const toggleSelect = (id: string) => {
    sound.playClick();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    sound.playClick();
    if (selectedIds.size === filteredScams.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredScams.map(s => s.id)));
    }
  };

  // CRUD: Create/Edit
  const handleSaveScam = (saved: ScamProfile) => {
    const exists = scams.some(s => s.id === saved.id);
    let updated: ScamProfile[];
    if (exists) {
      updated = scams.map(s => s.id === saved.id ? saved : s);
      Storage.addAudit('UPDATE', `Updated threat profile: ${saved.name}`, saved.id);
    } else {
      updated = [saved, ...scams];
      Storage.addAudit('CREATE', `Created new threat profile: ${saved.name}`, saved.id);
    }
    onUpdateScams(updated);
    toast.notify(`Saved threat: "${saved.name}"`, 'success');
  };

  // CRUD: Clone
  const handleClone = (scam: ScamProfile) => {
    sound.playClick();
    const cloned: ScamProfile = {
      ...scam,
      id: 'scam_' + Math.random().toString(36).substring(2, 9),
      name: `${scam.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [cloned, ...scams];
    onUpdateScams(updated);
    Storage.addAudit('CREATE', `Cloned threat profile: ${scam.name}`, cloned.id);
    toast.notify(`Cloned: ${cloned.name}`, 'info');
  };

  // CRUD: Delete
  const handleDelete = (id: string, name: string) => {
    sound.playWarning();
    const updated = scams.filter(s => s.id !== id);
    onUpdateScams(updated);
    Storage.addAudit('DELETE', `Deleted threat profile: ${name}`, id);
    toast.notify(`Deleted threat: ${name}`, 'warning');
    if (selectedIds.has(id)) {
      selectedIds.delete(id);
      setSelectedIds(new Set(selectedIds));
    }
  };

  // Batch Tagging & Difficulty Tool (Feature 30)
  const handleApplyBatchChanges = () => {
    if (selectedIds.size === 0) {
      toast.notify('No profiles selected for batch modification', 'warning');
      return;
    }

    sound.playSuccess();
    const newTag = batchTagInput.trim();
    const updated = scams.map(s => {
      if (!selectedIds.has(s.id)) return s;
      const tags = [...s.tags];
      if (newTag && !tags.includes(newTag)) tags.push(newTag);
      return {
        ...s,
        tags,
        difficulty: batchDifficulty ? batchDifficulty : s.difficulty,
        updatedAt: new Date().toISOString()
      };
    });

    onUpdateScams(updated);
    Storage.addAudit('BATCH_TAG', `Modified ${selectedIds.size} records with tag: "${newTag || 'None'}", diff: "${batchDifficulty || 'Unchanged'}"`);
    toast.notify(`Batch updated ${selectedIds.size} profiles!`, 'success');
    setSelectedIds(new Set());
    setBatchTagInput('');
    setBatchDifficulty('');
  };

  // Deterministic Seeded PRNG Generator (Feature 28)
  const handleRunSeededPRNG = () => {
    sound.playSuccess();
    const seedNum = parseInt(seedInput) || 1337;
    const procedural = Storage.generateProceduralDatabase(seedNum);
    const merged = [...procedural, ...scams];
    onUpdateScams(merged);
    Storage.addAudit('SEED_GENERATE', `Generated 4 deterministic threat profiles with Mulberry32 (Seed: ${seedNum})`);
    toast.notify(`Deterministic database generated with Seed #${seedNum}!`, 'success');
  };

  // JSON Import & Schema Validation (Features 25 & 27)
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const incomingList = Array.isArray(parsed) ? parsed : [parsed];

        let addedCount = 0;
        let conflictDetected = false;
        const currentScams = [...scams];

        incomingList.forEach(item => {
          // Validate schema
          const validation = Security.validateScamPayload(item);
          if (!validation.valid) {
            toast.notify(`Import warning: ${validation.errors[0]}`, 'warning');
            return;
          }

          // Conflict resolution check
          const existing = currentScams.find(s => s.id === item.id);
          if (existing) {
            conflictDetected = true;
            setConflictItem({ existing, incoming: item });
          } else {
            currentScams.unshift(item);
            addedCount++;
          }
        });

        if (!conflictDetected && addedCount > 0) {
          onUpdateScams(currentScams);
          Storage.addAudit('MERGE', `Imported ${addedCount} threat profiles via JSON`);
          toast.notify(`Successfully imported ${addedCount} valid threat profiles!`, 'success');
          sound.playSuccess();
        }
      } catch (err: any) {
        toast.notify(`JSON parse error: ${err.message}`, 'error');
        sound.playWarning();
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // JSON Export (Feature 26)
  const handleExportJSON = () => {
    sound.playClick();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(scams, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `osrs_ops_threat_database_${Date.now()}.json`;
    a.click();
    toast.notify('Exported JSON database', 'success');
  };

  // CSV / TSV Export (Feature 26)
  const handleExportCSV = () => {
    sound.playClick();
    const headers = ['ID', 'Name', 'Category', 'TargetAsset', 'SuccessRate', 'Difficulty', 'RiskScore', 'MITRE'];
    const rows = scams.map(s => [
      `"${s.id}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.type}"`,
      `"${s.targetAsset}"`,
      s.successRate,
      `"${s.difficulty}"`,
      s.calculatedRiskScore,
      `"${s.mitreTechniques.join('; ')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osrs_ops_threat_data_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.notify('Exported spreadsheet CSV', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Threat Profile Repository & Taxonomy</h2>
            <p className="text-xs text-slate-400">
              Persistent storage, fuzzy search, MITRE taxonomy, and bulk operations.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Seeded PRNG Input & Trigger (Feature 28) */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg text-xs font-mono">
            <span className="text-slate-400">Seed:</span>
            <input
              type="text"
              value={seedInput}
              onChange={e => setSeedInput(e.target.value)}
              className="w-14 bg-transparent text-amber-300 focus:outline-none"
              title="Mulberry32 PRNG seed"
            />
            <button
              onClick={handleRunSeededPRNG}
              className="text-amber-400 hover:text-amber-300 font-bold transition-colors ml-1"
              title="Generate procedural dataset with seed"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Audit Log (Feature 29) */}
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
          >
            <History className="w-3.5 h-3.5" /> Audit Log
          </button>

          {/* JSON/CSV Imports & Exports (Feature 26) */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" /> Import JSON
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> JSON
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>

          {/* Create Button (Feature 22) */}
          <button
            onClick={() => {
              sound.playClick();
              setEditingScam(null);
              setIsEditModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs rounded-lg shadow transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Profile
          </button>
        </div>
      </div>

      {/* Filter and Search Bar (Features 23 & 24) */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Fuzzy search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title, narrative, MITRE technique, or Jagex rule..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Category Dropdown */}
          <div className="w-full sm:w-56 shrink-0">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-medium"
            >
              <option value="All">All Categories</option>
              <option value="Social Engineering">Social Engineering</option>
              <option value="GE-Area">GE-Area</option>
              <option value="Client-Side">Client-Side</option>
              <option value="Wilderness Lure">Wilderness Lure</option>
              <option value="Discord Phishing">Discord Phishing</option>
              <option value="Trade Window Manipulation">Trade Window Manipulation</option>
              <option value="Clan Infiltration">Clan Infiltration</option>
            </select>
          </div>
        </div>

        {/* Multi-Tag Taxonomy Filter Bar (Feature 24) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-500 flex items-center gap-1 mr-1">
            <Tag className="w-3 h-3" /> Filter Tags:
          </span>
          {allTags.slice(0, 10).map(tag => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTagFilter(tag)}
                className={`text-[11px] px-2 py-0.5 rounded transition-all font-mono ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {tag}
              </button>
            );
          })}
          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              className="text-[10px] text-rose-400 hover:underline ml-2"
            >
              Clear tags
            </button>
          )}
        </div>
      </div>

      {/* Batch Tagging Bar when items are selected (Feature 30) */}
      {selectedIds.size > 0 && (
        <div className="p-3 bg-amber-950/20 border border-amber-700/60 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-200 font-medium">
            <CheckSquare className="w-4 h-4 text-amber-400" />
            <span>{selectedIds.size} Profiles Selected for Batch Operations</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Tag to append..."
              value={batchTagInput}
              onChange={e => setBatchTagInput(e.target.value)}
              className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none"
            />

            <select
              value={batchDifficulty}
              onChange={e => setBatchDifficulty(e.target.value as DifficultyLevel)}
              className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none"
            >
              <option value="">Difficulty (Unchanged)</option>
              <option value="Novice">Novice</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Hard">Hard</option>
              <option value="Expert">Expert</option>
            </select>

            <button
              onClick={handleApplyBatchChanges}
              className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded shadow transition-colors"
            >
              Apply Batch
            </button>
          </div>
        </div>
      )}

      {/* Table of Scam Profiles */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800 text-[11px]">
              <tr>
                <th className="p-3 w-8">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-white">
                    {selectedIds.size === filteredScams.length && filteredScams.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3">Threat Profile</th>
                <th className="p-3">Vector</th>
                <th className="p-3">Target Asset</th>
                <th className="p-3">Difficulty</th>
                <th className="p-3">Success Rate</th>
                <th className="p-3">Risk Score</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredScams.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No threat profiles matching current query and filters.
                  </td>
                </tr>
              ) : (
                filteredScams.map(scam => {
                  const isChecked = selectedIds.has(scam.id);
                  return (
                    <tr
                      key={scam.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isChecked ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="p-3">
                        <button
                          onClick={() => toggleSelect(scam.id)}
                          className="text-slate-400 hover:text-white"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-200 hover:text-amber-400 cursor-pointer" onClick={() => onSelectScamForTraining(scam)}>
                          {scam.name}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {scam.narrative}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-slate-400">
                        {scam.type}
                      </td>
                      <td className="p-3 font-medium text-slate-300">
                        {scam.targetAsset}
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-slate-300">
                          {scam.difficulty}
                        </span>
                      </td>
                      <td className="p-3 font-mono tabular-nums text-slate-200">
                        {scam.successRate}%
                      </td>
                      <td className="p-3 font-mono tabular-nums font-bold text-rose-400">
                        {scam.calculatedRiskScore}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectScamForTraining(scam)}
                            className="p-1 text-slate-400 hover:text-amber-400 rounded"
                            title="Launch in Defense Simulator"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleClone(scam)}
                            className="p-1 text-slate-400 hover:text-sky-400 rounded"
                            title="Clone Profile"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              sound.playClick();
                              setEditingScam(scam);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-400 rounded"
                            title="Edit Profile"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(scam.id, scam.name)}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded"
                            title="Delete Profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD Edit / Create Modal */}
      <ScamEditModal
        scam={editingScam}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveScam}
      />

      {/* Audit Log Modal */}
      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        logs={Storage.getAuditLog()}
      />

      {/* Conflict Resolution Modal (Feature 27) */}
      {conflictItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-amber-400 font-semibold text-sm">
              <AlertTriangle className="w-5 h-5" />
              Duplicate Threat ID Conflict
            </div>
            <p className="text-xs text-slate-300">
              A threat profile with ID <strong>{conflictItem.existing.id}</strong> already exists in the repository ({conflictItem.existing.name}).
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  // Auto-increment ID
                  const autoInc: ScamProfile = {
                    ...conflictItem.incoming,
                    id: conflictItem.incoming.id + '_auto_' + Math.random().toString(36).substring(2, 6)
                  };
                  onUpdateScams([autoInc, ...scams]);
                  setConflictItem(null);
                  toast.notify('Imported with auto-incremented ID', 'info');
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded"
              >
                Auto-Increment ID
              </button>
              <button
                onClick={() => {
                  // Overwrite
                  const updated = scams.map(s => s.id === conflictItem.incoming.id ? conflictItem.incoming : s);
                  onUpdateScams(updated);
                  setConflictItem(null);
                  toast.notify('Overwritten existing profile', 'warning');
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white rounded"
              >
                Overwrite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
