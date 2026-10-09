import React, { useState, useRef, useEffect } from 'react';
import { ScamProfile } from '../../types';
import { 
  BarChart3, 
  Printer, 
  Columns, 
  Activity, 
  ShieldCheck, 
  Cpu, 
  HelpCircle,
  FileText
} from 'lucide-react';
import { sound } from '../../lib/audio';
import { toast } from '../../lib/toast';

interface ThreatAnalyticsProps {
  scams: ScamProfile[];
}

export const ThreatAnalytics: React.FC<ThreatAnalyticsProps> = ({ scams }) => {
  // Side-by-side comparison state (Feature 36)
  const [compareIdA, setCompareIdA] = useState<string>(scams[0]?.id || '');
  const [compareIdB, setCompareIdB] = useState<string>(scams[1]?.id || scams[0]?.id || '');

  // Print Advisory target (Feature 37)
  const [advisoryScamId, setAdvisoryScamId] = useState<string>(scams[0]?.id || '');

  // Scatter plot canvas ref (Feature 33)
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const scamA = scams.find(s => s.id === compareIdA) || scams[0];
  const scamB = scams.find(s => s.id === compareIdB) || scams[1] || scams[0];
  const advisoryScam = scams.find(s => s.id === advisoryScamId) || scams[0];

  // 1. MITRE ATT&CK Matrix Heatmap Aggregation (Feature 31)
  const mitreFrequencies = React.useMemo(() => {
    const counts: Record<string, number> = {};
    scams.forEach(s => {
      s.mitreTechniques.forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [scams]);

  // 2. Target Asset Distribution Aggregation (Feature 34)
  const assetDistribution = React.useMemo(() => {
    const counts: Record<string, number> = {
      'GP': 0,
      'Accounts': 0,
      'Items': 0,
      'Discord Credentials': 0,
      '2FA Tokens': 0
    };
    scams.forEach(s => {
      if (counts[s.targetAsset] !== undefined) {
        counts[s.targetAsset]++;
      }
    });
    return counts;
  }, [scams]);

  // 3. Attack Vector Correlation Matrix (Feature 38)
  const vectorCombinations = React.useMemo(() => {
    const matrix: Record<string, Record<string, number>> = {};
    const categories = Array.from(new Set(scams.map(s => s.type)));

    categories.forEach(c1 => {
      matrix[c1] = {};
      categories.forEach(c2 => {
        matrix[c1][c2] = 0;
      });
    });

    scams.forEach(s => {
      s.tags.forEach(t1 => {
        s.tags.forEach(t2 => {
          if (matrix[t1] && matrix[t1][t2] !== undefined && t1 !== t2) {
            matrix[t1][t2]++;
          }
        });
      });
    });

    return { matrix, categories: categories.slice(0, 5) };
  }, [scams]);

  // Render Canvas Scatter Plot (Feature 33)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Axes
    const pad = 40;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, pad);
    ctx.lineTo(pad, h - pad);
    ctx.lineTo(w - pad, h - pad);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Difficulty Level (Novice → Expert)', w / 2, h - 12);

    ctx.save();
    ctx.translate(14, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Success Rate (%)', 0, 0);
    ctx.restore();

    // Grid ticks (Success 0% to 100%)
    ctx.textAlign = 'right';
    for (let pct = 0; pct <= 100; pct += 25) {
      const y = (h - pad) - (pct / 100) * (h - 2 * pad);
      ctx.fillText(`${pct}%`, pad - 6, y + 3);
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(w - pad, y);
      ctx.strokeStyle = '#1e293b';
      ctx.stroke();
    }

    // Difficulty mapped to X
    const diffMap: Record<string, number> = {
      'Novice': 0.15,
      'Intermediate': 0.4,
      'Hard': 0.65,
      'Expert': 0.9
    };

    // Plot Points
    scams.forEach(s => {
      const xPct = diffMap[s.difficulty] || 0.5;
      const x = pad + xPct * (w - 2 * pad);
      const y = (h - pad) - (s.successRate / 100) * (h - 2 * pad);

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = s.calculatedRiskScore > 70 ? '#ef4444' : s.calculatedRiskScore > 45 ? '#f59e0b' : '#10b981';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Tooltip name
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '9px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(s.name.slice(0, 12), x + 8, y + 3);
    });

  }, [scams]);

  const handlePrintAdvisory = () => {
    sound.playClick();
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Threat Modeling & Cyber Analytics</h2>
            <p className="text-xs text-slate-400">
              MITRE ATT&CK correlation, objective composite risk scoring, and security advisory generation.
            </p>
          </div>
        </div>

        <button
          onClick={handlePrintAdvisory}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
        >
          <Printer className="w-4 h-4 text-amber-400" />
          Print Security Advisory
        </button>
      </div>

      {/* Analytics Grid: Heatmap + Scatter Plot (Row 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* MITRE ATT&CK Matrix Heatmap (Feature 31 - 7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-amber-400" />
              MITRE ATT&CK Technique Frequency Heatmap
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Mapped Techniques</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {mitreFrequencies.slice(0, 8).map(([tech, count]) => {
              const maxCount = mitreFrequencies[0]?.[1] || 1;
              const intensity = count / maxCount;
              return (
                <div
                  key={tech}
                  className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono text-slate-300 font-medium truncate pr-2">{tech}</span>
                    <span className="font-mono font-bold text-amber-400 tabular-nums">{count}x</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 transition-all duration-300"
                      style={{ width: `${Math.max(15, intensity * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Success Rate vs Difficulty Scatter Plot (Feature 33 - 5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-sky-400" />
              Success Rate vs. Difficulty Scatter Plot
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">HTML5 Canvas</span>
          </div>

          <div className="w-full h-60 rounded-lg overflow-hidden border border-slate-800">
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>
        </div>
      </div>

      {/* Row 2: Asset Distribution & Formula Weighting */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Target Asset Distribution (Feature 34 - 6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-semibold text-white">Target Asset Distribution Breakdown</h3>
          <div className="space-y-2.5">
            {Object.entries(assetDistribution).map(([asset, count]) => {
              const total = scams.length || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={asset} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-medium">{asset}</span>
                    <span className="font-mono tabular-nums text-slate-400">{count} profiles ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Objective Composite Risk Score Formula (Feature 32 - 6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-semibold text-white">Composite Risk Score Model (Weighted)</h3>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-amber-300 leading-relaxed">
            Risk = (Success Rate × 0.4) + (Asset Value × 0.3) + (Technical Complexity × 0.3)
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Unlike arbitrary single-digit ratings, OSRS-OPS calculates risk using verified threat engineering parameters:
          </p>
          <ul className="space-y-1 text-xs text-slate-300 font-mono text-[11px]">
            <li>• <strong>40% Weight:</strong> Empirical Victim Success Rate (observed historical telemetry)</li>
            <li>• <strong>30% Weight:</strong> Irreversible Asset Value (GP, rare items, Jagex accounts)</li>
            <li>• <strong>30% Weight:</strong> Adversary Technical Complexity (game mechanics, trojans, bypasses)</li>
          </ul>
        </div>
      </div>

      {/* Row 3: Side-by-Side Comparison Tool (Feature 36) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
            <Columns className="w-4 h-4 text-amber-400" />
            Side-by-Side Threat Comparison Matrix
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">Contrast execution vectors & defenses</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Threat Selector */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <select
              value={compareIdA}
              onChange={e => setCompareIdA(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-medium focus:outline-none"
            >
              {scams.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {scamA && (
              <div className="space-y-2 text-xs">
                <div className="text-slate-400 font-mono">
                  Vector: <strong className="text-amber-400">{scamA.type}</strong> · Asset: <strong>{scamA.targetAsset}</strong>
                </div>
                <div className="text-slate-400 font-mono">
                  Risk Score: <strong className="text-rose-400">{scamA.calculatedRiskScore}</strong> · Success: <strong>{scamA.successRate}%</strong>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px] pt-1 border-t border-slate-800">
                  {scamA.narrative}
                </p>
                <div className="pt-1">
                  <div className="text-[11px] font-semibold text-slate-400">Avoidance Rule:</div>
                  <div className="text-[11px] text-slate-300 italic">{scamA.defenseTips[0]}</div>
                </div>
              </div>
            )}
          </div>

          {/* Right Threat Selector */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <select
              value={compareIdB}
              onChange={e => setCompareIdB(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-medium focus:outline-none"
            >
              {scams.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {scamB && (
              <div className="space-y-2 text-xs">
                <div className="text-slate-400 font-mono">
                  Vector: <strong className="text-amber-400">{scamB.type}</strong> · Asset: <strong>{scamB.targetAsset}</strong>
                </div>
                <div className="text-slate-400 font-mono">
                  Risk Score: <strong className="text-rose-400">{scamB.calculatedRiskScore}</strong> · Success: <strong>{scamB.successRate}%</strong>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px] pt-1 border-t border-slate-800">
                  {scamB.narrative}
                </p>
                <div className="pt-1">
                  <div className="text-[11px] font-semibold text-slate-400">Avoidance Rule:</div>
                  <div className="text-[11px] text-slate-300 italic">{scamB.defenseTips[0]}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print-Friendly Threat Advisory Preview (Feature 37) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-emerald-400" />
            Security Threat Advisory Generator (Print View)
          </h3>
          <select
            value={advisoryScamId}
            onChange={e => setAdvisoryScamId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200"
          >
            {scams.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Advisory Formatted Container */}
        <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-4 print-break-inside-avoid">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <div className="text-amber-400 font-bold text-sm tracking-wider uppercase">
                OSRS-OPS CYBER THREAT ADVISORY
              </div>
              <div className="text-[11px] text-slate-400">
                Advisory Ref: {advisoryScam.id.toUpperCase()} · Published: {new Date(advisoryScam.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded font-bold">
                RISK: {advisoryScam.calculatedRiskScore} / 100
              </span>
            </div>
          </div>

          <div>
            <div className="font-bold text-slate-200 text-sm">{advisoryScam.name}</div>
            <p className="text-slate-300 text-xs mt-1 leading-relaxed font-sans">
              {advisoryScam.narrative}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[11px]">
            <div>
              <span className="text-slate-500">Vector:</span> <span className="text-slate-200">{advisoryScam.type}</span>
            </div>
            <div>
              <span className="text-slate-500">Target Asset:</span> <span className="text-slate-200">{advisoryScam.targetAsset}</span>
            </div>
            <div>
              <span className="text-slate-500">Difficulty:</span> <span className="text-slate-200">{advisoryScam.difficulty}</span>
            </div>
            <div>
              <span className="text-slate-500">Success Rate:</span> <span className="text-slate-200">{advisoryScam.successRate}%</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <div className="font-bold text-slate-300 text-xs mb-1">MANDATORY COUNTERMEASURES:</div>
            <ul className="space-y-1 text-slate-300">
              {advisoryScam.defenseTips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400">✔</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
