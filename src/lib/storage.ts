import { ScamProfile, AuditEntry, Badge, UserStats, AbuseReportSubmission } from '../types';
import { DEFAULT_SCAMS, DEFAULT_BADGES, calculateCompositeRisk } from '../data/defaultScams';
import { Mulberry32 } from './prng';

const STORAGE_KEYS = {
  SCAMS: 'osrs_ops_scams_v2',
  AUDIT: 'osrs_ops_audit_log_v2',
  STATS: 'osrs_ops_user_stats_v2',
  BADGES: 'osrs_ops_badges_v2',
  REPORTS: 'osrs_ops_abuse_reports_v2'
};

export const Storage = {
  getScams(): ScamProfile[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SCAMS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load scams from storage, using defaults', e);
    }
    return DEFAULT_SCAMS;
  },

  saveScams(scams: ScamProfile[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SCAMS, JSON.stringify(scams));
    } catch (e) {
      console.error('Storage write error', e);
    }
  },

  getAuditLog(): AuditEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT);
      if (data) return JSON.parse(data);
    } catch {}
    return [
      {
        id: 'audit_init',
        timestamp: new Date().toLocaleTimeString(),
        action: 'CREATE',
        details: 'Initial threat database loaded with 5 verified OSRS threat vectors.'
      }
    ];
  },

  addAudit(action: AuditEntry['action'], details: string, targetId?: string): void {
    const log = this.getAuditLog();
    const entry: AuditEntry = {
      id: 'audit_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      action,
      details,
      targetId
    };
    const updated = [entry, ...log].slice(0, 50); // retain last 50
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(updated));
    } catch {}
  },

  getUserStats(): UserStats {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATS);
      if (data) return JSON.parse(data);
    } catch {}
    return {
      resilienceScore: 680,
      tier: 'Vigilant Scaper',
      scenariosAttempted: 4,
      scenariosPassed: 3,
      redFlagsFound: 8,
      totalRedFlags: 11,
      reportsFiled: 2,
      currentStreak: 2,
      bestStreak: 3,
      history: [
        { date: '2026-03-01', score: 600, scenarioName: 'Grand Exchange Doubler', result: 'Passed' },
        { date: '2026-03-02', score: 580, scenarioName: 'Wilderness Seed Pod Lure', result: 'Compromised' },
        { date: '2026-03-03', score: 640, scenarioName: 'Token Deception', result: 'Passed' },
        { date: '2026-03-04', score: 680, scenarioName: 'OAuth Phishing Link', result: 'Passed' }
      ]
    };
  },

  saveUserStats(stats: UserStats): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch {}
  },

  getBadges(): Badge[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BADGES);
      if (data) return JSON.parse(data);
    } catch {}
    return DEFAULT_BADGES;
  },

  saveBadges(badges: Badge[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(badges));
    } catch {}
  },

  getReports(): AbuseReportSubmission[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  },

  saveReport(report: AbuseReportSubmission): void {
    const list = this.getReports();
    const updated = [report, ...list];
    try {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));
    } catch {}
  },

  /**
   * Deterministic Seeded PRNG Procedural Generation (Feature 28)
   * Generates or regenerates procedural threat profiles from a given numerical seed.
   */
  generateProceduralDatabase(seed = 1337): ScamProfile[] {
    const rng = new Mulberry32(seed);
    const prefixes = ['Deceptive', 'Syndicated', 'Automated', 'Coercive', 'Social', 'Adversarial'];
    const roots = ['Drop Party Teleport', 'Corp Cave Stall', 'Staking Duel Rule Swap', 'LMS Client Injection', 'Pharaoh Sceptre Charge Swap'];
    const categories: ScamProfile['type'][] = ['Social Engineering', 'GE-Area', 'Client-Side', 'Wilderness Lure', 'Discord Phishing', 'Trade Window Manipulation'];
    const assets: ScamProfile['targetAsset'][] = ['GP', 'Accounts', 'Items', 'Discord Credentials', '2FA Tokens'];
    const difficulties: ScamProfile['difficulty'][] = ['Novice', 'Intermediate', 'Hard', 'Expert'];

    const procedural: ScamProfile[] = [];
    for (let i = 0; i < 4; i++) {
      const name = `${rng.choice(prefixes)} ${rng.choice(roots)} (Seed #${seed + i})`;
      const success = rng.range(25, 85);
      const assetVal = rng.range(4, 10);
      const techComp = rng.range(2, 9);
      const cat = rng.choice(categories);
      const asset = rng.choice(assets);
      const diff = rng.choice(difficulties);

      procedural.push({
        id: `scam_seed_${seed}_${i}`,
        name,
        type: cat,
        narrative: `Procedurally modeled threat scenario #${i + 1} generated from Mulberry32 PRNG seed ${seed}. Exploits player inattention and deceptive game mechanics around ${cat}.`,
        targetAsset: asset,
        successRate: success,
        difficulty: diff,
        assetValueRating: assetVal,
        technicalComplexity: techComp,
        calculatedRiskScore: calculateCompositeRisk(success, assetVal, techComp),
        mitreTechniques: ['T1566: Social Engineering', 'T1078: Valid Accounts'],
        jagexRules: ['Rule 1: Scamming', 'Rule 7: Macroing'],
        cognitiveBiases: ['Greed Bias', 'Social Proof'],
        defenseTips: ['Always double check interface values before confirming.'],
        tags: [cat, 'Procedural', `Seed-${seed}`],
        redFlags: [
          {
            id: `rf_proc_${i}_1`,
            sentence: `"Trust me bro, this secret glitch doubles drops on World ${rng.range(300, 500)}!"`,
            isRedFlag: true,
            biasType: 'False Mechanic',
            explanation: 'Fabricated game mechanics to lure player into unsafe zone.'
          }
        ],
        dialogueTree: [
          {
            id: 'node_start',
            speaker: 'scammer',
            speakerName: `Player_${rng.range(100, 999)}`,
            text: `Follow me to show you a hidden money method!`,
            suspicionImpact: 20,
            options: [
              {
                text: 'Ignore and report player.',
                nextNodeId: 'node_safe_exit',
                riskImpact: 'safe',
                explanation: 'Averted procedural trap.'
              },
              {
                text: 'Follow into wilderness ditch.',
                nextNodeId: 'node_loss_exit',
                riskImpact: 'fatal',
                explanation: 'Lured into dangerous zone.'
              }
            ]
          },
          {
            id: 'node_safe_exit',
            speaker: 'system',
            speakerName: 'System',
            text: 'Procedural threat successfully repelled.',
            suspicionImpact: 0,
            isTerminal: true,
            outcome: 'foiled'
          },
          {
            id: 'node_loss_exit',
            speaker: 'system',
            speakerName: 'System',
            text: 'Threat materialized: assets compromised.',
            suspicionImpact: 100,
            isTerminal: true,
            outcome: 'compromised'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return procedural;
  }
};
