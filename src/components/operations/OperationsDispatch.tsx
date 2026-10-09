import React, { useState, useEffect } from 'react';
import { ScamProfile, QueueTask, WebhookConfig } from '../../types';
import { dispatchQueue } from '../../lib/dispatchQueue';
import { 
  Radio, 
  Send, 
  ShieldCheck, 
  AlertTriangle, 
  Trash2, 
  Play, 
  CheckCircle, 
  Clock, 
  Palette, 
  Activity,
  Terminal,
  RefreshCw
} from 'lucide-react';
import { sound } from '../../lib/audio';
import { toast } from '../../lib/toast';

interface OperationsDispatchProps {
  scams: ScamProfile[];
}

export const OperationsDispatch: React.FC<OperationsDispatchProps> = ({ scams }) => {
  const [tasks, setTasks] = useState<QueueTask[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [dryRun, setDryRun] = useState<boolean>(dispatchQueue.isDryRun());

  // Embed Styler state (Feature 43)
  const [embedConfig, setEmbedConfig] = useState<WebhookConfig>(dispatchQueue.getEmbedConfig());
  const [selectedScamId, setSelectedScamId] = useState<string>(scams[0]?.id || '');
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [checkingHealth, setCheckingHealth] = useState<boolean>(false);

  useEffect(() => {
    return dispatchQueue.subscribe((updatedTasks, processing) => {
      setTasks(updatedTasks);
      setIsProcessing(processing);
    });
  }, []);

  const handleToggleDryRun = (enabled: boolean) => {
    sound.playClick();
    setDryRun(enabled);
    dispatchQueue.setDryRun(enabled);
    toast.notify(`Dry-Run Safe Simulation Mode ${enabled ? 'ENABLED' : 'DISABLED'}`, 'info');
  };

  const handleSaveEmbedConfig = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playSuccess();
    dispatchQueue.updateEmbedConfig(embedConfig);
    toast.notify('Webhook Embed Configuration saved!', 'success');
  };

  const handleHealthCheck = async () => {
    setCheckingHealth(true);
    setHealthStatus('Pinging endpoint...');
    sound.playBlip();

    const res = await dispatchQueue.healthCheck(embedConfig.url);
    setCheckingHealth(false);
    if (res.ok) {
      sound.playSuccess();
      setHealthStatus(`OK: ${res.message}`);
      toast.notify('Webhook verified and operational!', 'success');
    } else {
      sound.playWarning();
      setHealthStatus(`FAILED: ${res.message}`);
      toast.notify(`Health Check: ${res.message}`, 'error');
    }
  };

  const handleEnqueueSingle = () => {
    const scam = scams.find(s => s.id === selectedScamId);
    if (!scam) return;
    dispatchQueue.enqueue(scam);
  };

  const handleEnqueueAll = () => {
    sound.playClick();
    scams.forEach(s => dispatchQueue.enqueue(s));
    toast.notify(`Enqueued ${scams.length} threat payloads for sequential dispatch`, 'info');
  };

  const handleClearQueue = () => {
    sound.playClick();
    dispatchQueue.clearQueue();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">RFC 6585 Dispatch Queue & Webhook Operations</h2>
            <p className="text-xs text-slate-400">
              Decoupled queue worker with rate-limit backoff, health pinging, and dry-run simulation.
            </p>
          </div>
        </div>

        {/* Dry-Run Toggle (Feature 42) */}
        <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono">
          <span className="text-slate-400 font-medium">Safe Simulation Mode (Dry-Run):</span>
          <button
            onClick={() => handleToggleDryRun(!dryRun)}
            className={`px-2 py-0.5 rounded font-bold transition-colors ${
              dryRun
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {dryRun ? 'ACTIVE (NO HTTP)' : 'OFF (LIVE POST)'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Embed Styler & Health Check (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Custom Embed Styler (Feature 43) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-amber-400" />
                Custom Discord Embed Styler
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">Appearance</span>
            </div>

            <form onSubmit={handleSaveEmbedConfig} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Webhook URL Endpoint</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={embedConfig.url}
                    onChange={e => setEmbedConfig({ ...embedConfig, url: e.target.value })}
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-amber-400 font-mono text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={handleHealthCheck}
                    disabled={checkingHealth}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold text-[11px] transition-colors shrink-0"
                    title="Verify webhook endpoint validity"
                  >
                    Ping
                  </button>
                </div>
                {healthStatus && (
                  <div className={`mt-1.5 text-[11px] font-mono ${
                    healthStatus.includes('OK') ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {healthStatus}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Bot Username</label>
                  <input
                    type="text"
                    value={embedConfig.username}
                    onChange={e => setEmbedConfig({ ...embedConfig, username: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Embed Color (Hex)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={embedConfig.colorHex}
                      onChange={e => setEmbedConfig({ ...embedConfig, colorHex: e.target.value })}
                      className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={embedConfig.colorHex}
                      onChange={e => setEmbedConfig({ ...embedConfig, colorHex: e.target.value })}
                      className="flex-1 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Footer Branding</label>
                <input
                  type="text"
                  value={embedConfig.footerText}
                  onChange={e => setEmbedConfig({ ...embedConfig, footerText: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono text-[11px]"
                />
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded text-xs transition-colors shadow"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>

          {/* Quick Dispatch Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Send className="w-4 h-4 text-emerald-400" />
              Enqueue Threat Payloads
            </h3>

            <div className="space-y-2">
              <select
                value={selectedScamId}
                onChange={e => setSelectedScamId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-medium focus:outline-none"
              >
                {scams.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.type})
                  </option>
                ))}
              </select>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleEnqueueSingle}
                  className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  Enqueue Selected
                </button>
                <button
                  onClick={handleEnqueueAll}
                  className="flex-1 py-1.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1.5"
                >
                  Enqueue All ({scams.length})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Queue Terminal & Status (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-slate-200 font-mono">
                  Live Dispatch Worker Stream
                </span>
                {isProcessing && (
                  <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded font-mono animate-pulse">
                    PROCESSING...
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearQueue}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
              </div>
            </div>

            {/* Terminal Log Output */}
            <div className="p-4 space-y-2 min-h-[360px] max-h-[460px] overflow-y-auto bg-slate-950/70 font-mono text-xs">
              {tasks.length === 0 ? (
                <div className="text-center py-12 text-slate-600">
                  Worker idle. Enqueue a threat advisory payload to initiate batch operations.
                </div>
              ) : (
                tasks.map(task => {
                  let badge = 'text-slate-400';
                  let icon = Clock;
                  if (task.status === 'processing') {
                    badge = 'text-amber-400 animate-pulse';
                    icon = RefreshCw;
                  } else if (task.status === 'success') {
                    badge = 'text-emerald-400';
                    icon = CheckCircle;
                  } else if (task.status === 'rate-limited') {
                    badge = 'text-amber-500';
                    icon = AlertTriangle;
                  } else if (task.status === 'failed') {
                    badge = 'text-rose-400';
                    icon = AlertTriangle;
                  }

                  const IconComp = icon;

                  return (
                    <div
                      key={task.id}
                      className="p-3 rounded-lg border border-slate-800/80 bg-slate-900/60 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200 truncate pr-2">
                          {task.scamPayload.name}
                        </span>
                        <span className={`text-[11px] uppercase font-bold flex items-center gap-1 shrink-0 ${badge}`}>
                          <IconComp className="w-3 h-3" /> {task.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 leading-snug">
                        {task.log}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/40">
                        <span>Attempts: {task.attempts}/3</span>
                        <span>{task.timestamp}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
