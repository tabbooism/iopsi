/**
 * RFC 6585 DYNAMIC RATE-LIMITING DISPATCH QUEUE & WORKER (Features 39, 40, 41, 42, 43, 44)
 */

import { QueueTask, ScamProfile, WebhookConfig } from '../types';
import { Security } from './security';
import { toast } from './toast';
import { sound } from './audio';

type QueueListener = (tasks: QueueTask[], isProcessing: boolean) => void;

class DynamicDispatchQueue {
  private queue: QueueTask[] = [];
  private history: QueueTask[] = [];
  private isProcessing = false;
  private dryRun = false;
  private listeners: Set<QueueListener> = new Set();
  private embedConfig: WebhookConfig = {
    url: '',
    username: 'OSRS-OPS Threat Sentinel',
    avatarUrl: 'https://oldschool.runescape.wiki/images/Skull_%28status%29_icon.png',
    colorHex: '#dc2626',
    footerText: 'osrs-ops Defensive Cyber Intelligence'
  };

  subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    listener([...this.queue, ...this.history], this.isProcessing);
    return () => this.listeners.delete(listener);
  }

  setDryRun(enabled: boolean): void {
    this.dryRun = enabled;
  }

  isDryRun(): boolean {
    return this.dryRun;
  }

  updateEmbedConfig(config: Partial<WebhookConfig>): void {
    this.embedConfig = { ...this.embedConfig, ...config };
  }

  getEmbedConfig(): WebhookConfig {
    return { ...this.embedConfig };
  }

  enqueue(scamPayload: ScamProfile, webhookUrl?: string): void {
    const url = webhookUrl || this.embedConfig.url;
    if (!url && !this.dryRun) {
      toast.notify('Please specify a webhook URL or enable Dry-Run mode', 'warning');
      sound.playWarning();
      return;
    }

    const newTask: QueueTask = {
      id: 'task_' + Math.random().toString(36).substring(2, 9),
      scamPayload,
      webhookUrl: url || 'https://discord.com/api/webhooks/dryrun/simulation',
      attempts: 0,
      status: 'pending',
      log: 'Queued for dispatch',
      timestamp: new Date().toLocaleTimeString()
    };

    this.queue.push(newTask);
    toast.notify(`Enqueued payload: ${scamPayload.name}`, 'info');
    sound.playBlip();
    this.emit();

    if (!this.isProcessing) {
      this.processNext();
    }
  }

  clearQueue(): void {
    this.queue = [];
    this.emit();
    toast.notify('Queue cleared', 'info');
  }

  async healthCheck(webhookUrl: string): Promise<{ ok: boolean; message: string; channelName?: string }> {
    if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      return { ok: false, message: 'Invalid Discord webhook URL format' };
    }

    if (this.dryRun) {
      return { ok: true, message: '[Dry-Run] Simulated Webhook Ping Successful (Channel: #anti-scam-ops)' };
    }

    try {
      const response = await fetch(webhookUrl, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        return {
          ok: true,
          message: `Webhook active: ${data.name || 'Unnamed Bot'}`,
          channelName: data.channel_id ? `ID: ${data.channel_id}` : undefined
        };
      } else {
        return { ok: false, message: `Webhook check failed: HTTP ${response.status} (${response.statusText})` };
      }
    } catch (err: any) {
      return { ok: false, message: `Connection error: ${err?.message || 'Network unreachable'}` };
    }
  }

  private async processNext(): Promise<void> {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      this.emit();
      return;
    }

    this.isProcessing = true;
    const task = this.queue[0];
    task.status = 'processing';
    task.log = `Processing attempt ${task.attempts + 1}...`;
    this.emit();

    if (this.dryRun) {
      await new Promise(res => setTimeout(res, 600));
      task.status = 'success';
      task.log = `[DRY-RUN] Dispatched locally: ${task.scamPayload.name} (${task.scamPayload.type})`;
      this.history.unshift(this.queue.shift()!);
      toast.notify(`[DRY-RUN] Dispatched: ${task.scamPayload.name}`, 'success');
      sound.playSuccess();
      this.emit();
      setTimeout(() => this.processNext(), 300);
      return;
    }

    try {
      const colorInt = parseInt(this.embedConfig.colorHex.replace('#', ''), 16) || 0xc0392b;
      const embed = {
        title: `[OSRS-OPS THREAT ADVISORY] ${Security.escape(task.scamPayload.name)}`,
        description: Security.escape(task.scamPayload.narrative).slice(0, 2048),
        color: colorInt,
        fields: [
          { name: 'Attack Vector', value: Security.escape(task.scamPayload.type), inline: true },
          { name: 'Targeted Asset', value: Security.escape(task.scamPayload.targetAsset), inline: true },
          { name: 'Calculated Risk', value: `${task.scamPayload.calculatedRiskScore.toFixed(1)} / 100`, inline: true },
          { name: 'Difficulty', value: task.scamPayload.difficulty, inline: true },
          { name: 'Recorded Success', value: `${task.scamPayload.successRate}%`, inline: true },
          { name: 'Jagex Rules', value: task.scamPayload.jagexRules.join('\n') || 'None', inline: false },
          { name: 'MITRE ATT&CK', value: task.scamPayload.mitreTechniques.join(', ') || 'N/A', inline: false }
        ],
        footer: { text: this.embedConfig.footerText },
        timestamp: new Date().toISOString()
      };

      const payload = {
        username: this.embedConfig.username,
        avatar_url: this.embedConfig.avatarUrl,
        embeds: [embed]
      };

      const response = await fetch(task.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // RFC 6585 Rate-Limit Header Inspection (Feature 39)
      if (response.status === 429) {
        task.status = 'rate-limited';
        let backoffMs = 5000;
        try {
          const responseData = await response.json();
          backoffMs = (responseData.retry_after * 1000) || 5000;
        } catch {
          const retryHeader = response.headers.get('Retry-After');
          if (retryHeader) backoffMs = parseFloat(retryHeader) * 1000;
        }
        task.log = `Rate limited (HTTP 429). Pausing for ${(backoffMs / 1000).toFixed(1)}s`;
        toast.notify(`Rate limited. Waiting ${(backoffMs / 1000).toFixed(1)}s`, 'warning');
        sound.playWarning();
        this.emit();

        await new Promise(res => setTimeout(res, backoffMs));
        return this.processNext();
      }

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      task.status = 'success';
      task.log = `Dispatched successfully to webhook endpoint`;
      this.history.unshift(this.queue.shift()!);
      toast.notify(`Dispatched: ${task.scamPayload.name}`, 'success');
      sound.playSuccess();
      this.emit();

      const remaining = response.headers.get('X-RateLimit-Remaining');
      const delay = (remaining !== null && parseInt(remaining) === 0) ? 2000 : 400;
      setTimeout(() => this.processNext(), delay);

    } catch (error: any) {
      task.attempts++;
      // Feature 44: Exponential backoff (3s, 6s, 12s)
      const backoffSec = Math.pow(2, task.attempts) * 1.5;
      
      if (task.attempts >= 3) {
        task.status = 'failed';
        task.log = `Failed after 3 attempts: ${error?.message || 'Network error'}`;
        this.history.unshift(this.queue.shift()!);
        toast.notify(`Dropped: ${task.scamPayload.name} (Max retries exceeded)`, 'error');
        sound.playWarning();
        this.emit();
      } else {
        task.status = 'pending';
        task.log = `Attempt ${task.attempts} failed: ${error?.message}. Retrying in ${backoffSec.toFixed(0)}s...`;
        toast.notify(`Dispatch failed. Retrying in ${backoffSec.toFixed(0)}s...`, 'warning');
        sound.playWarning();
        this.emit();
        await new Promise(res => setTimeout(res, backoffSec * 1000));
      }

      this.processNext();
    }
  }

  private emit(): void {
    const all = [...this.queue, ...this.history];
    this.listeners.forEach(fn => fn(all, this.isProcessing));
  }
}

export const dispatchQueue = new DynamicDispatchQueue();
