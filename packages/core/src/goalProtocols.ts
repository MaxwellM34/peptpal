/**
 * Goal-based peptide protocol selector.
 * Maps user goals to recommended peptide stacks with evidence-based rationale.
 */

export type GoalKey =
  | 'injury_recovery'
  | 'anti_aging'
  | 'body_composition'
  | 'gi_repair'
  | 'sleep_recovery'
  | 'skin_hair'
  | 'weight_loss'
  | 'sexual_health';

export type PeptideRole = 'primary' | 'synergy' | 'optional';

export interface ProtocolPeptide {
  slug: string;
  name: string;
  role: PeptideRole;
  rationale: string;
  typicalDose: string;
}

export interface GoalProtocol {
  key: GoalKey;
  label: string;
  emoji: string;
  description: string;
  peptides: ProtocolPeptide[];
  stackNote: string;
  cycleProtocol: string;
  expectedTimeline: string;
  warnings: string[];
}

export const GOAL_PROTOCOLS: GoalProtocol[] = [
  {
    key: 'injury_recovery',
    label: 'Injury Recovery',
    emoji: '🩹',
    description: 'Tendons, ligaments, muscle tears, joint pain, post-surgery healing',
    peptides: [
      {
        slug: 'bpc-157',
        name: 'BPC-157',
        role: 'primary',
        rationale:
          'Promotes angiogenesis (new blood vessel growth) to injured tissue, upregulates GH receptors, accelerates tendon and ligament healing.',
        typicalDose: '250–500 mcg daily subQ near injury site',
      },
      {
        slug: 'tb-500',
        name: 'TB-500',
        role: 'primary',
        rationale:
          'Actin-binding peptide that enhances cell migration into injury sites and reduces inflammation. Systemic effect — inject abdomen.',
        typicalDose: '2,500 mcg 2× weekly (loading), then 2,000 mcg every 2 weeks',
      },
      {
        slug: 'ghk-cu-injectable',
        name: 'GHK-Cu',
        role: 'synergy',
        rationale:
          'Stimulates collagen synthesis and has anti-inflammatory effects. Combines well with BPC-157 and TB-500 for connective tissue.',
        typicalDose: '200–300 mcg daily subQ',
      },
    ],
    stackNote:
      'BPC-157 + TB-500 is the most evidence-supported healing combination in the community. They can be drawn into the same syringe for immediate injection. GHK-Cu adds collagen support.',
    cycleProtocol: '6–8 weeks on (acute injury) or up to 12 weeks (chronic). Optional 4-week break between cycles.',
    expectedTimeline: 'First signs of relief typically 2–3 weeks. Structural healing continues 6–12 weeks.',
    warnings: [
      'BPC-157 is not FDA-approved. Use only under harm-reduction principles.',
      'Inject BPC-157 near the injury site subcutaneously for local effect.',
      'TB-500 is systemic — abdomen or thigh injection fine.',
    ],
  },
  {
    key: 'anti_aging',
    label: 'Anti-Aging / Longevity',
    emoji: '⏳',
    description: 'Telomere support, GH restoration, cognitive clarity, cellular regeneration',
    peptides: [
      {
        slug: 'epithalon',
        name: 'Epithalon',
        role: 'primary',
        rationale:
          'Tetrapeptide derived from the pineal gland. Animal and limited human data suggest telomere elongation and regulation of melatonin/cortisol.',
        typicalDose: '5–10 mg daily subQ for 10-day courses',
      },
      {
        slug: 'cjc-1295',
        name: 'CJC-1295',
        role: 'primary',
        rationale:
          'GHRH analogue that increases GH and IGF-1 pulsatility. Restores youthful GH secretion patterns that decline with age.',
        typicalDose: '100 mcg subQ, 2× per day (AM + before sleep)',
      },
      {
        slug: 'ghk-cu-injectable',
        name: 'GHK-Cu',
        role: 'synergy',
        rationale:
          'Declines sharply with age. Stimulates collagen, reduces oxidative stress, and has demonstrated neuroprotective activity.',
        typicalDose: '200 mcg daily subQ',
      },
    ],
    stackNote:
      'Epithalon is typically run as a 10-day course 1–2× per year, not continuously. CJC-1295 is cycled separately on a 12-weeks-on / 4-weeks-off schedule.',
    cycleProtocol: 'Epithalon: 10 days on, then 6+ months off. CJC-1295: 12 wk on, 4 wk off.',
    expectedTimeline: 'CJC-1295 GH effects within 2–4 weeks. Epithalon effects are long-term and subtle.',
    warnings: [
      'CJC-1295 requires strict cycling to prevent pituitary desensitisation.',
      'Monitor IGF-1 levels if running GH secretagogues long-term.',
    ],
  },
  {
    key: 'body_composition',
    label: 'Body Composition',
    emoji: '💪',
    description: 'Lean mass gain, fat loss, improved recovery between training sessions',
    peptides: [
      {
        slug: 'cjc-1295',
        name: 'CJC-1295',
        role: 'primary',
        rationale:
          'Extends the half-life of endogenous GHRH pulses. Pairing with a GHRP creates a synergistic GH release significantly greater than either alone.',
        typicalDose: '100 mcg subQ before sleep (or 2× daily)',
      },
      {
        slug: 'ipamorelin',
        name: 'Ipamorelin',
        role: 'primary',
        rationale:
          'Selective GH secretagogue (no cortisol/prolactin spike unlike GHRP-6). Triggers strong, clean GH pulse when combined with CJC-1295.',
        typicalDose: '200–300 mcg subQ before sleep (or 2× daily)',
      },
      {
        slug: 'bpc-157',
        name: 'BPC-157',
        role: 'synergy',
        rationale:
          'Accelerates recovery from training-related tissue stress. Commonly added to GH stacks to improve training frequency.',
        typicalDose: '250 mcg subQ daily',
      },
    ],
    stackNote:
      'CJC-1295 + Ipamorelin is the most popular body composition stack. Inject together 30 min before sleep (GH peaks during deep sleep). Fast for 2 hours before injection for best GH release.',
    cycleProtocol: '12 weeks on, minimum 4 weeks off. Some run 5 days on / 2 days off to reduce desensitisation.',
    expectedTimeline: 'Improved sleep quality within 1–2 weeks. Body recomposition takes 8–12 weeks.',
    warnings: [
      'Fast for 2 hours before injecting GH secretagogues — insulin blunts GH release.',
      'CJC-1295 + Ipamorelin requires cycling to prevent desensitisation.',
      'Elevated IGF-1 may increase insulin resistance — monitor blood glucose.',
    ],
  },
  {
    key: 'gi_repair',
    label: 'GI Repair',
    emoji: '🫁',
    description: 'IBS, leaky gut, SIBO, ulcers, IBD, gut motility issues',
    peptides: [
      {
        slug: 'bpc-157',
        name: 'BPC-157',
        role: 'primary',
        rationale:
          'Originally isolated from gastric juice. Protects GI mucosa, promotes healing of ulcers and fistulas, modulates the gut-brain axis. Can be taken orally (dissolved in water) for GI-specific effects.',
        typicalDose: '250–500 mcg subQ daily, or 500 mcg dissolved in water taken orally',
      },
    ],
    stackNote:
      'For GI applications, oral BPC-157 (dissolved in water, taken on empty stomach) is preferred over injection as it delivers to GI tissue directly. Sublingual administration is also reported.',
    cycleProtocol: '4–8 weeks. No mandatory off-period but typical community practice is to cycle 8 on, 4 off.',
    expectedTimeline: 'Symptom improvement typically within 2–4 weeks for acute issues.',
    warnings: [
      'BPC-157 is not FDA-approved. This is for harm-reduction only.',
      'Oral/sublingual BPC-157 must be the correct form — not all formulations are suitable.',
      'Consult a gastroenterologist for serious GI conditions.',
    ],
  },
  {
    key: 'sleep_recovery',
    label: 'Sleep & Recovery',
    emoji: '😴',
    description: 'Improving sleep quality, deep sleep duration, overnight recovery and HGH release',
    peptides: [
      {
        slug: 'cjc-1295',
        name: 'CJC-1295',
        role: 'primary',
        rationale:
          'Amplifies the natural GH surge that occurs during deep sleep (slow-wave sleep). Taken before bed, it extends and enhances this overnight GH pulse.',
        typicalDose: '100 mcg subQ 30 min before sleep',
      },
      {
        slug: 'ipamorelin',
        name: 'Ipamorelin',
        role: 'primary',
        rationale:
          'Triggers a selective, clean GH pulse without cortisol elevation. Combined with CJC-1295 before bed, creates a potent nighttime GH surge.',
        typicalDose: '200 mcg subQ 30 min before sleep',
      },
    ],
    stackNote:
      'Bedtime injection is critical — GH naturally spikes during the first 1–2 hours of sleep. Fast 2 hours before injection. Most users notice sleep quality improvement within the first 1–2 weeks.',
    cycleProtocol: '12 weeks on, 4 weeks off minimum. Optional 5 on / 2 off pulsing pattern.',
    expectedTimeline: 'Deeper sleep and more vivid dreams within 1–2 weeks. Recovery and body composition effects in 6–12 weeks.',
    warnings: [
      'Must be injected in a fasted state (2h+ post-meal) for maximal GH release.',
      'Do not eat for 30–60 min post-injection.',
    ],
  },
  {
    key: 'skin_hair',
    label: 'Skin & Hair',
    emoji: '✨',
    description: 'Collagen production, skin thickness, wound healing, hair regrowth, anti-aging skin',
    peptides: [
      {
        slug: 'ghk-cu-topical',
        name: 'GHK-Cu (Topical)',
        role: 'primary',
        rationale:
          'Directly stimulates dermal fibroblasts to produce collagen and elastin. Evidence for wound healing, scar reduction, and skin quality improvement.',
        typicalDose: '1–2% serum applied 1–2× daily to target area',
      },
      {
        slug: 'ghk-cu-injectable',
        name: 'GHK-Cu (Injectable)',
        role: 'synergy',
        rationale:
          'Systemic GHK-Cu for broader anti-aging effects beyond topical reach.',
        typicalDose: '200 mcg subQ daily',
      },
      {
        slug: 'glow',
        name: 'Glow Blend',
        role: 'optional',
        rationale:
          'Pre-mixed GHK-Cu / TB-500 / BPC-157 blend. Combines skin, healing, and anti-inflammatory effects in a single injection.',
        typicalDose: '70 mcg subQ daily (contains 50 mcg GHK-Cu + 10 mcg TB-500 + 10 mcg BPC-157)',
      },
    ],
    stackNote:
      'Topical GHK-Cu is the safest entry point — apply serum post-cleansing. Injectable adds systemic effects. The Glow blend is an all-in-one option.',
    cycleProtocol: 'Topical: continuous use fine. Injectable: 4–8 week cycles with optional breaks.',
    expectedTimeline: 'Topical improvements visible in 4–8 weeks. Injectable systemic effects take 6–12 weeks.',
    warnings: [
      'Patch-test topical GHK-Cu before full application.',
      'Copper can cause temporary skin darkening or greenish tint — normal and reversible.',
    ],
  },
  {
    key: 'weight_loss',
    label: 'Weight Loss',
    emoji: '⚖️',
    description: 'Appetite suppression, metabolic support, GLP-1 pathway activation',
    peptides: [
      {
        slug: 'semaglutide',
        name: 'Semaglutide',
        role: 'primary',
        rationale:
          'GLP-1 receptor agonist. Slows gastric emptying, suppresses appetite centrally, improves glycaemic control. Most studied and effective peptide for weight loss.',
        typicalDose: 'Start 0.25 mg/wk, titrate up by 0.25 mg every 4 weeks to 1–2.4 mg/wk',
      },
      {
        slug: 'bpc-157',
        name: 'BPC-157',
        role: 'synergy',
        rationale:
          'Used alongside GLP-1 agents to mitigate GI side effects (nausea, gastroparesis). GI-protective properties complement semaglutide use.',
        typicalDose: '250 mcg subQ daily or oral 500 mcg',
      },
    ],
    stackNote:
      'Titrate semaglutide SLOWLY. The most common mistake is escalating dose too fast, which causes severe nausea/vomiting. Spend at least 4 weeks at each dose level. BPC-157 can help manage GI side effects.',
    cycleProtocol: 'Semaglutide is a long-term medication — no cycling needed. Discontinuation typically results in weight regain.',
    expectedTimeline: '0.5–1% body weight loss per week at therapeutic dose (1+ mg/wk). Noticeable appetite change within 2–4 weeks.',
    warnings: [
      'Semaglutide carries a black-box warning for thyroid C-cell tumours in rodent models.',
      'Contraindicated in personal/family history of medullary thyroid carcinoma or MEN2.',
      'Pancreatitis risk — seek immediate care for severe abdominal pain.',
      'Not for use without discussing with a healthcare provider.',
    ],
  },
  {
    key: 'sexual_health',
    label: 'Sexual Health',
    emoji: '❤️',
    description: 'Libido enhancement, erectile function (men), desire (women)',
    peptides: [
      {
        slug: 'pt-141',
        name: 'PT-141',
        role: 'primary',
        rationale:
          'FDA-approved (as Vyleesi) for HSDD in premenopausal women. Acts centrally on melanocortin receptors to increase sexual desire. Works via the brain, not blood flow — complements PDE5 inhibitors.',
        typicalDose: '500–1,750 mcg subQ or intranasal 45–60 min before activity',
      },
    ],
    stackNote:
      'PT-141 starts working in 30–45 min. Start low (500–750 mcg) to assess tolerance before using the full 1,750 mcg dose. Nausea is the most common side effect — take with a light meal if needed.',
    cycleProtocol: 'As-needed (max 1× per 24h). Limit use to avoid hyperpigmentation risk from long-term melanocortin activation.',
    expectedTimeline: 'Acute effects within 30–45 min. Should be felt same-day.',
    warnings: [
      'Transient blood pressure increase possible — avoid if hypertensive.',
      'Frequent use may cause hyperpigmentation (skin darkening) — use only as needed.',
      'FDA-approved specifically for HSDD in women; off-label in men.',
    ],
  },
];

export function getGoalProtocol(key: GoalKey): GoalProtocol | undefined {
  return GOAL_PROTOCOLS.find((g) => g.key === key);
}
