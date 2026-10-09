import { ScamProfile } from '../types';

export function calculateCompositeRisk(successRate: number, assetValRating: number, techComplexity: number): number {
  // Formula: Risk = (Success Rate * 0.4) + (Asset Value * 0.3) + (Technical Complexity * 0.3)
  // Scaling assetVal (1-10) and techComplexity (1-10) to 100-point scale (* 10)
  const score = (successRate * 0.4) + (assetValRating * 10 * 0.3) + (techComplexity * 10 * 0.3);
  return Math.min(100, Math.max(0, Math.round(score * 10) / 10));
}

export const DEFAULT_SCAMS: ScamProfile[] = [
  {
    id: 'scam_ge_doubler',
    name: 'Grand Exchange "Doubling GP" & Accomplice Hypeman Ring',
    type: 'GE-Area',
    narrative: 'A bot accounts spams "Doubling money in 2 trades! Test me with 100k first!" Supported by 2 accomplice player accounts posing as grateful recipients saying "omg tyvm he doubled my 5M legit!" to induce social proof.',
    targetAsset: 'GP',
    successRate: 48,
    difficulty: 'Novice',
    assetValueRating: 6,
    technicalComplexity: 2,
    calculatedRiskScore: calculateCompositeRisk(48, 6, 2),
    mitreTechniques: [
      'T1566.002: Spearphishing Link / Social Engineering',
      'T1204.001: Malicious Link / User Execution',
      'T1534: Internal Spearphishing'
    ],
    jagexRules: [
      'Rule 1: Scamming',
      'Rule 7: Macroing and Third-Party Software',
      'Rule 14: Impersonation'
    ],
    cognitiveBiases: [
      'Social Proof (Accomplice endorsement)',
      'Commitment & Consistency (Micro-test first)',
      'Greed Bias'
    ],
    defenseTips: [
      'Never trade wealth expecting unsolicited returns. Nobody in Gielinor doubles currency for free.',
      'Chat hypemen claiming payouts are always alt accounts or syndicate accomplices.',
      'Ignore "test trade" bait—once larger sums are placed, the scammer teleports or hops worlds.'
    ],
    tags: ['GE-Area', 'Social Engineering', 'Trade Window Manipulation', 'Chat Exploitation'],
    createdAt: '2026-03-01T12:00:00Z',
    updatedAt: '2026-03-01T12:00:00Z',
    redFlags: [
      {
        id: 'rf_1',
        sentence: '"Doubling money 2 trades! Min 500k, max 20M legit! Look at my combat 126 gear!"',
        isRedFlag: true,
        biasType: 'Authority & Greed Bias',
        explanation: 'High combat level and expensive armor are rented or bought to establish false authority.'
      },
      {
        id: 'rf_2',
        sentence: '"Bro thank you so much! Just doubled my 10M, check his trade log!"',
        isRedFlag: true,
        biasType: 'Social Proof Manipulation',
        explanation: 'Accomplice hypeman fabricated to bypass the target\'s natural skepticism.'
      },
      {
        id: 'rf_3',
        sentence: '"You can just test me with 100k first to see I am real."',
        isRedFlag: true,
        biasType: 'Foot-in-the-Door Technique',
        explanation: 'Establishing micro-compliance before the high-value exit trade.'
      },
      {
        id: 'rf_4',
        sentence: 'Trade accepted on second screen.',
        isRedFlag: false,
        explanation: 'Standard in-game interface action.'
      }
    ],
    dialogueTree: [
      {
        id: 'node_start',
        speaker: 'scammer',
        speakerName: 'Doubler_Chad99',
        text: 'Doubling gp! Giving back to the community! 2 trades max, test me with 500k first!',
        suspicionImpact: 10,
        cognitiveBias: 'Greed Bias & Foot-in-the-Door',
        options: [
          {
            text: 'Offer 500k to see if he actually gives 1M back.',
            nextNodeId: 'node_test_success',
            riskImpact: 'risky',
            explanation: 'You fell for the micro-test trap! Scammers willingly sacrifice small sums to bait your main bank.'
          },
          {
            text: 'Question him: "If you have billions, why not drop it or give it directly?"',
            nextNodeId: 'node_question_evasion',
            riskImpact: 'safe',
            explanation: 'Direct questioning pressures the scammer to reveal inconsistent evasions.'
          },
          {
            text: 'Report for Rule 1 (Scamming) and ignore.',
            nextNodeId: 'node_safe_exit',
            riskImpact: 'safe',
            explanation: 'The optimal defensive play: report rule violation and terminate contact.'
          }
        ]
      },
      {
        id: 'node_question_evasion',
        speaker: 'scammer',
        speakerName: 'Doubler_Chad99',
        text: 'Bro I do it like this so bots don\'t steal it on the floor! Look at "PkGod_X", I just gave him 10M!',
        suspicionImpact: 25,
        evasionBranch: 'node_accomplice_interjection',
        cognitiveBias: 'Deflection & Social Proof',
        options: [
          {
            text: 'Notice PkGod_X is an accomplice and refuse.',
            nextNodeId: 'node_safe_exit',
            riskImpact: 'safe',
            explanation: 'Accurately recognized syndicate collusion.'
          },
          {
            text: 'Believe his explanation and trade 5M.',
            nextNodeId: 'node_loss_exit',
            riskImpact: 'fatal',
            explanation: 'The scammer logs out immediately after taking your 5M.'
          }
        ]
      },
      {
        id: 'node_accomplice_interjection',
        speaker: 'accomplice',
        speakerName: 'PkGod_X',
        text: 'VOUCH! He really gave me 10M guys, stop sleeping on this!',
        suspicionImpact: 20,
        cognitiveBias: 'Social Proof',
        options: [
          {
            text: 'Trade your full cash stack.',
            nextNodeId: 'node_loss_exit',
            riskImpact: 'fatal',
            explanation: 'Accomplice manipulation succeeded in blinding you.'
          },
          {
            text: 'Right-click report both accounts for Rule 1: Scamming.',
            nextNodeId: 'node_safe_exit',
            riskImpact: 'safe',
            explanation: 'Proper defense against syndicated Grand Exchange manipulation.'
          }
        ]
      },
      {
        id: 'node_test_success',
        speaker: 'scammer',
        speakerName: 'Doubler_Chad99',
        text: 'Boom! Here is your 1M back! Told you I am legit. Now let\'s do 20M!',
        suspicionImpact: -15,
        cognitiveBias: 'Reciprocation & Escalation of Commitment',
        options: [
          {
            text: 'Take the 1M and walk away.',
            nextNodeId: 'node_counter_profit',
            riskImpact: 'safe',
            explanation: 'You foiled his plan, though engaging with doubling bots is still risky.'
          },
          {
            text: 'Hand over 20M for the promised 40M.',
            nextNodeId: 'node_loss_exit',
            riskImpact: 'fatal',
            explanation: 'The scammer accepts 20M and immediately world-hops or ignores you.'
          }
        ]
      },
      {
        id: 'node_safe_exit',
        speaker: 'system',
        speakerName: 'System',
        text: 'Threat successfully neutralized. You reported the scammer and retained your assets.',
        suspicionImpact: 0,
        isTerminal: true,
        outcome: 'foiled',
        explanation: 'Zero wealth lost. Jagex abuse report recorded.'
      },
      {
        id: 'node_counter_profit',
        speaker: 'system',
        speakerName: 'System',
        text: 'You walked away after the micro-test. Scammer lost 500k bait.',
        suspicionImpact: 0,
        isTerminal: true,
        outcome: 'foiled',
        explanation: 'Avoid repeating this, as scam scripts adapt and may steal even the initial test sum.'
      },
      {
        id: 'node_loss_exit',
        speaker: 'system',
        speakerName: 'System',
        text: 'CRITICAL FAILURE: The scammer accepted your gold and instantly hopped to World 302.',
        suspicionImpact: 100,
        isTerminal: true,
        outcome: 'compromised',
        explanation: 'Victim lost major cash stack to elementary doubling bait.'
      }
    ]
  },
  {
    id: 'scam_runelite_plugin',
    name: 'Malicious External RuneLite Plugin / Discord Clan Trojan',
    type: 'Client-Side',
    narrative: 'A high-level clan recruit asks the player to join their Discord for Raids (CoX/ToA). To get verified, the server requires installing an unapproved .jar plugin file from an external GitHub or Discord attachment claiming to be a "Custom Gear Overlay". The plugin contains a remote session hijacker and keylogger.',
    targetAsset: 'Accounts',
    successRate: 72,
    difficulty: 'Expert',
    assetValueRating: 10,
    technicalComplexity: 9,
    calculatedRiskScore: calculateCompositeRisk(72, 10, 9),
    mitreTechniques: [
      'T1204.002: Malicious File Execution',
      'T1056.001: Keylogging',
      'T1539: Steal Web Session Cookie',
      'T1566.001: Spearphishing Attachment'
    ],
    jagexRules: [
      'Rule 7: Macroing and Third-Party Software',
      'Rule 11: Real-World Trading',
      'Rule 1: Scamming'
    ],
    cognitiveBiases: [
      'Authority Bias (Clan ranks)',
      'Fear of Missing Out (Raid team spot)',
      'Social Pressure / Belonging'
    ],
    defenseTips: [
      'NEVER install plugins outside the official in-client RuneLite Plugin Hub.',
      'Official plugins are open-source and audited by the RuneLite maintainers.',
      'Manual .jar or external repository downloads bypass sandboxing and execute arbitrary code on your OS.'
    ],
    tags: ['Client-Side', 'Discord Phishing', 'Social Engineering'],
    createdAt: '2026-03-02T10:00:00Z',
    updatedAt: '2026-03-02T10:00:00Z',
    redFlags: [
      {
        id: 'rf_p1',
        sentence: '"Join our Discord raid team: discord.gg/tombs-of-amascut-elite"',
        isRedFlag: false,
        explanation: 'Standard clan Discord invite, but warrants caution.'
      },
      {
        id: 'rf_p2',
        sentence: '"Download our team plugin .jar from #verification and drop it into your .runelite/plugins folder."',
        isRedFlag: true,
        biasType: 'Technical Exploit & False Authority',
        explanation: 'RuneLite plugins should NEVER be manually added as raw .jar files outside the Plugin Hub.'
      },
      {
        id: 'rf_p3',
        sentence: '"Everyone in the team uses it, it is mandatory to see our caller tiles."',
        isRedFlag: true,
        biasType: 'Social Conformity & Isolation',
        explanation: 'Pressuring target to compromise security under threat of exclusion.'
      }
    ],
    dialogueTree: [
      {
        id: 'node_start',
        speaker: 'scammer',
        speakerName: 'ToA_RaidLeader',
        text: 'Hey man! We need a +1 for 500 invo ToA. Hop into our Discord voice: discord.gg/toa-verified-speed',
        suspicionImpact: 5,
        cognitiveBias: 'FOMO (High-profit raid spot)',
        options: [
          {
            text: 'Ask: "Can I just join in-game? My gear is ready."',
            nextNodeId: 'node_push_external',
            riskImpact: 'safe',
            explanation: 'Keeping interaction strictly in-game avoids external payload vectors.'
          },
          {
            text: 'Join the Discord and navigate to #verification.',
            nextNodeId: 'node_discord_download',
            riskImpact: 'risky',
            explanation: 'Leaving the game ecosystem enters an unmoderated adversary-controlled space.'
          }
        ]
      },
      {
        id: 'node_push_external',
        speaker: 'scammer',
        speakerName: 'ToA_RaidLeader',
        text: 'No sorry, we use custom party tick counters and invocation overlays that aren\'t on official hub yet. It takes 10 seconds to install.',
        suspicionImpact: 45,
        cognitiveBias: 'False Technical Necessity',
        options: [
          {
            text: 'Refuse: "Official RuneLite warning explicitly says never to install external .jar plugins."',
            nextNodeId: 'node_safe_exit',
            riskImpact: 'safe',
            explanation: 'Knowledge of RuneLite security architecture neutralizes the attack.'
          },
          {
            text: 'Ask for the GitHub link to inspect it.',
            nextNodeId: 'node_discord_download',
            riskImpact: 'risky',
            explanation: 'Adversaries often host obfuscated bytecode with fake GitHub stars.'
          }
        ]
      },
      {
        id: 'node_discord_download',
        speaker: 'scammer',
        speakerName: 'ToA_RaidLeader',
        text: 'Download "ToA_Synchronizer_v2.4.jar" from pins and copy to your .runelite/plugins folder, then restart your client.',
        suspicionImpact: 80,
        cognitiveBias: 'Urgency & Peer Pressure',
        options: [
          {
            text: 'Run the .jar file to test it.',
            nextNodeId: 'node_loss_exit',
            riskImpact: 'fatal',
            explanation: 'Trojan executes, harvests session tokens and discord webhooks your bank.'
          },
          {
            text: 'Immediately close Discord, block the user, and report the server.',
            nextNodeId: 'node_safe_exit',
            riskImpact: 'safe',
            explanation: 'Recognized malicious executable delivery vector.'
          }
        ]
      },
      {
        id: 'node_safe_exit',
        speaker: 'system',
        speakerName: 'System',
        text: 'SUCCESS: You protected your account credentials and avoided malware infection.',
        suspicionImpact: 0,
        isTerminal: true,
        outcome: 'foiled',
        explanation: 'Only plugins audited and listed directly in the RuneLite Plugin Hub are safe.'
      },
      {
        id: 'node_loss_exit',
        speaker: 'system',
        speakerName: 'System',
        text: 'CATASTROPHIC COMPROMISE: Session tokens stolen. Client forcibly disconnected. Bank cleaned.',
        suspicionImpact: 100,
        isTerminal: true,
        outcome: 'compromised',
        explanation: 'Jagex launcher accounts and banked items compromised via client-side malware.'
      }
    ]
  },
  {
    id: 'scam_wildy_seed_pod',
    name: 'Wilderness Anti-Lure "Royal Seed Pod Delay" Trap',
    type: 'Wilderness Lure',
    narrative: 'A scammer approaches the victim posing as an informant: "Bro, this clan in World 365 is luring noobs to Mage Bank. If you bring your Twisted Bow, you can use the Royal Seed Pod to anti-scam them because seed pod teleports up to 30 wilderness!" In reality, Mage Bank / Deep Wilderness is level 50+ where Seed Pod fails, leaving victim frozen and teleblocked.',
    targetAsset: 'Items',
    successRate: 59,
    difficulty: 'Hard',
    assetValueRating: 10,
    technicalComplexity: 6,
    calculatedRiskScore: calculateCompositeRisk(59, 10, 6),
    mitreTechniques: [
      'T1566: Social Engineering / Pretexting',
      'T1204: User Execution (Cross Wilderness Ditch)',
      'T1078: Exploitation of Game Mechanics'
    ],
    jagexRules: [
      'Rule 1: Scamming',
      'Rule 14: Impersonation'
    ],
    cognitiveBiases: [
      'Anti-Scammer Hubris / Ego Trap',
      'Greed Bias',
      'False Sense of Security'
    ],
    defenseTips: [
      'THERE IS NO SUCH THING AS AN ANTI-LURE. The "anti-scam" is part of the lure script.',
      'Royal Seed Pod only teleports up to level 30 Wilderness.',
      'Never cross the Wilderness ditch with items you are not prepared to lose, regardless of what anyone claims.'
    ],
    tags: ['Wilderness Lure', 'Social Engineering'],
    createdAt: '2026-03-03T08:00:00Z',
    updatedAt: '2026-03-03T08:00:00Z',
    redFlags: [
      {
        id: 'rf_w1',
        sentence: '"Bro, I saw those scammers targeting you. Don\'t worry, I know how to anti-lure them for 500M."',
        isRedFlag: true,
        biasType: 'False Ally / Pretexting',
        explanation: 'Posing as a protector is the core deception tactic of advanced wilderness lures.'
      },
      {
        id: 'rf_w2',
        sentence: '"Just bring your T-Bow and spam click the Royal Seed Pod, it teleports instantly from any level."',
        isRedFlag: true,
        biasType: 'False Mechanic Exploitation',
        explanation: 'Blatant lie: Royal Seed Pod caps strictly at Wilderness Level 30.'
      }
    ],
    dialogueTree: [
      {
        id: 'node_start',
        speaker: 'scammer',
        speakerName: 'Anti_Scam_Bro',
        text: 'Hey bro, that guy over there is a known lurer. He is going to ask you to bring your gear to Annakarl. Let\'s anti-scam him together!',
        suspicionImpact: 15,
        cognitiveBias: 'Hero/Vigilante Syndrome & False Ally',
        options: [
          {
            text: 'Ask: "How do we anti-scam him?"',
            nextNodeId: 'node_explain_trap',
            riskImpact: 'risky',
            explanation: 'Entertaining an anti-lure conversation is the primary funnel.'
          },
          {
            text: 'Decline: "All anti-lures are lures. I am not entering the wilderness with gear."',
            nextNodeId: 'node_safe_exit',
            riskImpact: 'safe',
            explanation: 'Recognized the universal law: the anti-lure IS the lure.'
          }
        ]
      },
      {
        id: 'node_explain_trap',
        speaker: 'scammer',
        speakerName: 'Anti_Scam_Bro',
        text: 'He drops items past the ditch. You just bring your gear so he thinks you\'re stupid, grab his drop, and click Royal Seed Pod. It has zero delay!',
        suspicionImpact: 50,
        cognitiveBias: 'Hubris & Overconfidence',
        options: [
          {
            text: 'Challenge him on wilderness levels: "Seed Pod fails past level 30 Wildy."',
            nextNodeId: 'node_scammer_pivot',
            riskImpact: 'safe',
            explanation: 'Directly calling out game mechanics disrupts the scammer script.'
          },
          {
            text: 'Equip your best gear and follow him to the ditch.',
            nextNodeId: 'node_loss_exit',
            riskImpact: 'fatal',
            explanation: 'Stepping into the wilderness results in instant Teleblock, Ice Barrage, and smite.'
          }
        ]
      },
      {
        id: 'node_scammer_pivot',
        speaker: 'scammer',
        speakerName: 'Anti_Scam_Bro',
        text: 'Yeah obviously bro, that\'s why we stay at level 28! Trust me, I\'ve done this 20 times!',
        suspicionImpact: 75,
        cognitiveBias: 'Social Pressure & Guilt-tripping',
        options: [
          {
            text: 'Bank all items, put public chat to Friends, and leave.',
            nextNodeId: 'node_safe_exit',
            riskImpact: 'safe',
            explanation: 'Clean defensive detachment.'
          },
          {
            text: 'Take just a few hundred mil to test.',
            nextNodeId: 'node_loss_exit',
            riskImpact: 'fatal',
            explanation: 'Any gear brought will be targeted by ancient magic freeze and teleblock.'
          }
        ]
      },
      {
        id: 'node_safe_exit',
        speaker: 'system',
        speakerName: 'System',
        text: 'DEFENSE SUCCESSFUL: High-value assets saved. Never attempt to "anti-scam" a wilderness predator.',
        suspicionImpact: 0,
        isTerminal: true,
        outcome: 'foiled',
        explanation: 'Golden rule preserved: The anti-scam is always part of the lure architecture.'
      },
      {
        id: 'node_loss_exit',
        speaker: 'system',
        speakerName: 'System',
        text: 'CATASTROPHIC DEFEAT: Team of 5 pkers speared you past level 30 into multi-combat. T-Bow lost.',
        suspicionImpact: 100,
        isTerminal: true,
        outcome: 'compromised',
        explanation: 'Victim lured into Wilderness death trap.'
      }
    ]
  },
  {
    id: 'scam_trade_tokens',
    name: 'Platinum Token & Noted Junk Item Swap Deception',
    type: 'Trade Window Manipulation',
    narrative: 'Scammer agrees to buy an expensive item (e.g., Torva full helm for 450M). In trade window 1, they place 450,000 platinum tokens (worth 450M). While chatting, they quickly cancel and re-trade, replacing tokens with 45,000 tokens (45M) or noted Torag hammers, hitting accept rapidly.',
    targetAsset: 'GP',
    successRate: 38,
    difficulty: 'Intermediate',
    assetValueRating: 8,
    technicalComplexity: 3,
    calculatedRiskScore: calculateCompositeRisk(38, 8, 3),
    mitreTechniques: [
      'T1078: Exploitation of User Inattention',
      'T1566: Social Engineering / Fast Acceptance'
    ],
    jagexRules: [
      'Rule 1: Scamming'
    ],
    cognitiveBiases: [
      'Sensory Inattention Blindness',
      'Confirmation Bias',
      'Urgency Pressure'
    ],
    defenseTips: [
      'Always inspect the second trade confirmation screen carefully—every item and numeric quantity is highlighted in red if modified.',
      'Take 5 seconds before pressing the second Accept button.',
      'Verify platinum token values: 1 token = 1,000 GP (45,000 tokens is only 45M, NOT 450M).'
    ],
    tags: ['Trade Window Manipulation', 'GE-Area', 'Social Engineering'],
    createdAt: '2026-03-04T14:00:00Z',
    updatedAt: '2026-03-04T14:00:00Z',
    redFlags: [
      {
        id: 'rf_t1',
        sentence: '"Oops my inventory was full, trade me again quickly!"',
        isRedFlag: true,
        biasType: 'Cognitive Disruption / Reset Trick',
        explanation: 'Cancelling trade window to re-trade with reduced numbers exploits mental fatigue.'
      },
      {
        id: 'rf_t2',
        sentence: '"Accept fast, my girlfriend is waiting for me to eat dinner!"',
        isRedFlag: true,
        biasType: 'Artificial Urgency',
        explanation: 'Creating artificial urgency prevents the victim from scrutinizing the second trade screen.'
      }
    ],
    dialogueTree: [
      {
        id: 'node_start',
        speaker: 'scammer',
        speakerName: 'RichMerchant_OS',
        text: 'Buying your Torva Helm 460M in platinum tokens! (Overpaying by 10M!)',
        suspicionImpact: 10,
        cognitiveBias: 'Greed Bias (Overpaying offer)',
        options: [
          {
            text: 'Open trade and verify token count is exactly 460,000 tokens.',
            nextNodeId: 'node_trade_cancel',
            riskImpact: 'risky',
            explanation: 'Normal procedure, but watch for the re-trade switch.'
          },
          {
            text: 'Insist on coins: "Sell your tokens at the bank first, I only accept GP."',
            nextNodeId: 'node_safe_exit',
            riskImpact: 'safe',
            explanation: 'Forces the trade to standard, unmistakable coin denominations.'
          }
        ]
      },
      {
        id: 'node_trade_cancel',
        speaker: 'scammer',
        speakerName: 'RichMerchant_OS',
        text: '*Declines trade* "Wait sorry, misclicked! Re-trade me fast bro, dinner is getting cold!"',
        suspicionImpact: 40,
        cognitiveBias: 'Cognitive Overload & Artificial Rush',
        options: [
          {
            text: 'Rapidly spam-click Accept on both screens to help him hurry.',
            nextNodeId: 'node_loss_exit',
            riskImpact: 'fatal',
            explanation: 'He swapped 460,000 tokens for 46,000 tokens (46M instead of 460M).'
          },
          {
            text: 'Read the flashing red text on the second confirmation screen carefully.',
            nextNodeId: 'node_verify_red_screen',
            riskImpact: 'safe',
            explanation: 'The OSRS second trade screen flashes any modified trade variables in bright red text.'
          }
        ]
      },
      {
        id: 'node_verify_red_screen',
        speaker: 'target',
        speakerName: 'You',
        text: 'Wait, this second screen says 46,000 Platinum Tokens (46,000,000 gp). You missing a zero.',
        suspicionImpact: 85,
        options: [
          {
            text: 'Decline trade immediately and add to ignore list.',
            nextNodeId: 'node_safe_exit',
            riskImpact: 'safe',
            explanation: 'Caught red-handed trying to short 414M GP.'
          }
        ]
      },
      {
        id: 'node_safe_exit',
        speaker: 'system',
        speakerName: 'System',
        text: 'TRADE SECURED: You declined the fraudulent offer and retained your item.',
        suspicionImpact: 0,
        isTerminal: true,
        outcome: 'foiled',
        explanation: 'Always inspect the second trade window. The game explicitly alerts you to modified trades.'
      },
      {
        id: 'node_loss_exit',
        speaker: 'system',
        speakerName: 'System',
        text: 'SCAMMED: Torva Helm traded away for 46,000 tokens (46M). Lost 414,000,000 GP.',
        suspicionImpact: 100,
        isTerminal: true,
        outcome: 'compromised',
        explanation: 'Fell for classic inattention decimal shift scam.'
      }
    ]
  },
  {
    id: 'scam_discord_oauth',
    name: 'Clan Discord "AltDentifier / Verification" OAuth Token Grabber',
    type: 'Discord Phishing',
    narrative: 'A Discord server bot posing as "AltDentifier" or "Jagex Account Sync" sends an OAuth authorization link claiming to verify your total level and wealth for clan rank. The phishing page mimics the Jagex login portal to capture your 2FA token and email password.',
    targetAsset: '2FA Tokens',
    successRate: 64,
    difficulty: 'Hard',
    assetValueRating: 10,
    technicalComplexity: 8,
    calculatedRiskScore: calculateCompositeRisk(64, 10, 8),
    mitreTechniques: [
      'T1566.002: Spearphishing Link',
      'T1557: Adversary-in-the-Middle',
      'T1539: Steal Web Session Cookie',
      'T1078: Valid Accounts'
    ],
    jagexRules: [
      'Rule 1: Scamming',
      'Rule 7: Macroing and Third-Party Software',
      'Rule 11: Real-World Trading'
    ],
    cognitiveBiases: [
      'Authority Bias (Official-looking bot)',
      'Social Proof (Clan rank status)',
      'False Authenticity'
    ],
    defenseTips: [
      'Jagex never uses third-party Discord bots to authenticate RuneScape accounts.',
      'Inspect URLs meticulously: "jagex-account-verify.co" is NOT "account.jagex.com".',
      'Never input one-time 2FA codes into a webpage linked from Discord.'
    ],
    tags: ['Discord Phishing', 'Client-Side', 'Clan Infiltration'],
    createdAt: '2026-03-05T16:00:00Z',
    updatedAt: '2026-03-05T16:00:00Z',
    redFlags: [
      {
        id: 'rf_o1',
        sentence: '"To access our Discord drop parties, verify via JagexSync Bot: https://secure-jagex-auth.net"',
        isRedFlag: true,
        biasType: 'Domain Typosquatting / Credential Harvesting',
        explanation: 'Fake authorization domain intended to harvest Jagex Launcher credentials.'
      },
      {
        id: 'rf_o2',
        sentence: '"Please enter your 6-digit Authenticator code to finalize clan verification."',
        isRedFlag: true,
        biasType: 'Real-Time 2FA Interception',
        explanation: 'Adversary-in-the-Middle bot proxies the 2FA code instantly to the real Jagex server.'
      }
    ],
    dialogueTree: [
      {
        id: 'node_start',
        speaker: 'scammer',
        speakerName: 'Clan_Officer_Mod',
        text: 'Welcome to Oblivion Clan! Please click the #verify-osrs channel to sync your account rank.',
        suspicionImpact: 10,
        options: [
          {
            text: 'Click link to https://secure-jagex-auth.net/oauth/sync',
            nextNodeId: 'node_phish_form',
            riskImpact: 'risky',
            explanation: 'Visiting external domain mimics official portal.'
          },
          {
            text: 'Check the URL domain carefully in browser address bar.',
            nextNodeId: 'node_check_url',
            riskImpact: 'safe',
            explanation: 'Address bar inspection detects typosquatting instantly.'
          }
        ]
      },
      {
        id: 'node_check_url',
        speaker: 'target',
        speakerName: 'You',
        text: 'Wait, this URL is "secure-jagex-auth.net", not "jagex.com". Official Jagex SSL is registered to Jagex Limited.',
        suspicionImpact: 90,
        options: [
          {
            text: 'Leave Discord server and alert friends.',
            nextNodeId: 'node_safe_exit',
            riskImpact: 'safe',
            explanation: 'Phishing attack thwarted via domain verification.'
          }
        ]
      },
      {
        id: 'node_phish_form',
        speaker: 'scammer',
        speakerName: 'Phishing_Bot',
        text: 'Please enter your Jagex account email, master password, and current 6-digit Authenticator code.',
        suspicionImpact: 85,
        options: [
          {
            text: 'Submit the credentials and 2FA code.',
            nextNodeId: 'node_loss_exit',
            riskImpact: 'fatal',
            explanation: 'Adversary hijacks account immediately before 2FA token expires.'
          },
          {
            text: 'Close tab immediately and enable passkey protection on real account.jagex.com.',
            nextNodeId: 'node_safe_exit',
            riskImpact: 'safe',
            explanation: 'Averted total account loss.'
          }
        ]
      },
      {
        id: 'node_safe_exit',
        speaker: 'system',
        speakerName: 'System',
        text: 'CRITICAL THREAT DEFLECTED: 2FA credentials secured. Never give authentication tokens to Discord bots.',
        suspicionImpact: 0,
        isTerminal: true,
        outcome: 'foiled',
        explanation: 'Jagex Accounts never authenticate through Discord.'
      },
      {
        id: 'node_loss_exit',
        speaker: 'system',
        speakerName: 'System',
        text: 'FULL ACCOUNT TAKEOVER: Scammers logged in, changed recovery email, and transferred bank.',
        suspicionImpact: 100,
        isTerminal: true,
        outcome: 'compromised',
        explanation: 'OAuth credential harvesting scam.'
      }
    ]
  }
];

export const VICTIM_ARCHETYPES = [
  {
    id: 'novice' as const,
    name: 'Over-Trusting Novice',
    description: 'New to Gielinor, low skepticism (+10% suspicion gain), prone to FOMO and testing small trades.',
    suspicionMultiplier: 0.8,
    patience: 80
  },
  {
    id: 'greedy' as const,
    name: 'Greedy Flipper',
    description: 'Chases high-margin arbitrage and high-risk anti-lures; easily blinded by huge promised payouts.',
    suspicionMultiplier: 0.6,
    patience: 95
  },
  {
    id: 'skiller' as const,
    name: 'Casual Skiller',
    description: 'Avoids deep PvP knowledge; susceptible to client plugins and clan discord invitations.',
    suspicionMultiplier: 1.0,
    patience: 60
  },
  {
    id: 'veteran' as const,
    name: 'Skeptical Veteran',
    description: 'Hardened ironman/veteran; highly sensitive to red flags (+40% suspicion gain); terminates immediately.',
    suspicionMultiplier: 1.7,
    patience: 40
  }
];

export const DEFAULT_BADGES = [
  {
    id: 'badge_first_defense',
    name: 'Vigilant Guard',
    description: 'Successfully complete your first multi-stage defense scenario.',
    category: 'accuracy' as const,
    unlocked: true,
    unlockedAt: '2026-03-01'
  },
  {
    id: 'badge_zero_loss_streak_3',
    name: 'Iron Will',
    description: 'Maintain a 3-scenario streak without suffering any wealth loss.',
    category: 'streak' as const,
    unlocked: false
  },
  {
    id: 'badge_red_flag_master',
    name: 'Forensic Eagle',
    description: 'Accurately identify all deceptive sentences in a "Spot the Red Flag" review.',
    category: 'accuracy' as const,
    unlocked: false
  },
  {
    id: 'badge_rule_reporter',
    name: 'Jagex Arbiter',
    description: 'File a perfectly categorized Abuse Report matching official Jagex rules.',
    category: 'reporting' as const,
    unlocked: false
  },
  {
    id: 'badge_hardened_tier',
    name: 'Anti-Scam Vanguard',
    description: 'Attain a Dynamic Resilience Score (DRS) above 850 points.',
    category: 'mastery' as const,
    unlocked: false
  }
];
