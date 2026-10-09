export type TargetAssetType = 'GP' | 'Accounts' | 'Items' | 'Discord Credentials' | '2FA Tokens';
export type DifficultyLevel = 'Novice' | 'Intermediate' | 'Hard' | 'Expert';
export type ScamCategory = 
  | 'Social Engineering'
  | 'GE-Area'
  | 'Client-Side'
  | 'Wilderness Lure'
  | 'Discord Phishing'
  | 'Trade Window Manipulation'
  | 'Clan Infiltration';

export interface DialogueOption {
  text: string;
  nextNodeId: string;
  riskImpact: 'safe' | 'risky' | 'fatal';
  explanation: string;
}

export interface DialogueNode {
  id: string;
  speaker: 'scammer' | 'target' | 'accomplice' | 'system';
  speakerName: string;
  text: string;
  suspicionImpact: number; // change to target's suspicion meter (-30 to +40)
  evasionBranch?: string; // node ID if target pushes back
  cognitiveBias?: string;
  options?: DialogueOption[];
  isTerminal?: boolean;
  outcome?: 'foiled' | 'compromised' | 'escaped';
  explanation?: string;
}

export interface RedFlagTarget {
  id: string;
  sentence: string;
  isRedFlag: boolean;
  biasType?: string;
  explanation: string;
}

export interface ScamProfile {
  id: string;
  name: string;
  type: ScamCategory;
  narrative: string;
  targetAsset: TargetAssetType;
  successRate: number; // 0-100%
  difficulty: DifficultyLevel;
  assetValueRating: number; // 1-10
  technicalComplexity: number; // 1-10
  calculatedRiskScore: number; // computed formula
  mitreTechniques: string[];
  jagexRules: string[];
  cognitiveBiases: string[];
  defenseTips: string[];
  tags: string[];
  redFlags: RedFlagTarget[];
  dialogueTree: DialogueNode[];
  createdAt: string;
  updatedAt: string;
}

export interface VictimArchetype {
  id: 'novice' | 'veteran' | 'greedy' | 'skiller';
  name: string;
  description: string;
  suspicionMultiplier: number; // scales suspicion gain
  patience: number; // base threshold
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: 'streak' | 'accuracy' | 'mastery' | 'reporting';
  unlocked: boolean;
  unlockedAt?: string;
}

export interface AbuseReportSubmission {
  id: string;
  ruleCategory: string;
  perpetratorName: string;
  evidenceSnippet: string;
  scamId: string;
  submittedAt: string;
  status: 'Accepted' | 'Investigating';
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'MERGE' | 'BATCH_TAG' | 'SEED_GENERATE';
  details: string;
  targetId?: string;
}

export interface WebhookConfig {
  url: string;
  username: string;
  avatarUrl: string;
  colorHex: string;
  footerText: string;
}

export interface QueueTask {
  id: string;
  scamPayload: ScamProfile;
  webhookUrl: string;
  attempts: number;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'rate-limited';
  log: string;
  timestamp: string;
}

export interface UserStats {
  resilienceScore: number; // Dynamic Resilience Score (DRS)
  tier: 'Novice Target' | 'Vigilant Scaper' | 'Hardened Defender' | 'Anti-Scam Vanguard';
  scenariosAttempted: number;
  scenariosPassed: number;
  redFlagsFound: number;
  totalRedFlags: number;
  reportsFiled: number;
  currentStreak: number;
  bestStreak: number;
  history: Array<{
    date: string;
    score: number;
    scenarioName: string;
    result: 'Passed' | 'Compromised';
  }>;
}
