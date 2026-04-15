/**
 * Evidence-backed starter protocol records for each peptide.
 *
 * Seeds the app's protocol recommendations before any community data exists.
 * As users post structured dose logs via the forum, the consensus engine
 * gradually supersedes these seeds with weighted-median community values.
 *
 * Every dose record carries:
 *  - trial cohort metadata (mean weight, BMI, N) so dose scaling works
 *  - source citations tiered A–F
 *  - a hard ceiling dose (never displayed above, regardless of input)
 *
 * Data sources are documented per-record. This file is the single place to
 * audit the app's "out of the box" recommendations.
 */

import type { DoseRecommendation } from './doseScaling';
import type { Source } from './trustTiers';

export interface ProtocolSeed {
  slug: string;
  name: string;
  /** Default starting dose recommendation, bound to a trial cohort. */
  startingDose: DoseRecommendation;
  /** Typical titration target for this protocol, if applicable. */
  targetDose?: DoseRecommendation;
  /** Hard per-dose ceiling — never display a recommendation above this. */
  hardCeilingMcg: number;
  /** Sources that back the starting/target recommendation. */
  sources: Source[];
  /** Known adverse-event threshold — above this, community AE rate spikes. */
  aeThresholdMcg?: number;
  /** Plain-English rationale shown to the user. */
  rationale: string;
  /** Weekly exposure ceiling (doseMcg × dosesPerWeek), if the AE signal is weekly. */
  weeklyHardCeilingMcg?: number;
}

export const PROTOCOL_SEEDS: Record<string, ProtocolSeed> = {
  'bpc-157': {
    slug: 'bpc-157',
    name: 'BPC-157',
    startingDose: {
      doseMcg: 250,
      frequency: 'daily',
      dosesPerWeek: 7,
      scaleWithWeight: true,
      cohort: {
        meanWeightKg: 80,
        citation:
          'Composite from r/Peptides dosing threads (2020–2025) + Sikiric review dose ranges. No human RCT published.',
      },
    },
    targetDose: {
      doseMcg: 500,
      frequency: 'daily',
      dosesPerWeek: 7,
      scaleWithWeight: true,
      cohort: { meanWeightKg: 80, citation: 'Community median for acute injury protocols.' },
    },
    hardCeilingMcg: 750,
    weeklyHardCeilingMcg: 5250,
    aeThresholdMcg: 1000,
    sources: [
      {
        tier: 'A-',
        title: 'Sikiric et al., BPC-157 review (rodent mechanism + safety)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12446177/',
        year: 2024,
        notes:
          'Publication-bias concern: nearly all evidence from one research group. No long-term human data.',
      },
      { tier: 'C', title: 'r/Peptides top dosing threads', year: 2024 },
      { tier: 'B-', title: 'Jay Campbell — BPC-157 protocol', notes: 'Commercially conflicted.' },
    ],
    rationale:
      '250 mcg daily SubQ near injury site is the community-consensus starting point. No human RCT exists — this is a harm-reduction estimate, not a validated dose. Angiogenic mechanism warrants pre-start cancer screening.',
  },

  'tb-500': {
    slug: 'tb-500',
    name: 'TB-500',
    startingDose: {
      doseMcg: 2500,
      frequency: '2×/week loading',
      dosesPerWeek: 2,
      scaleWithWeight: true,
      cohort: {
        meanWeightKg: 80,
        citation: 'Community loading protocol; no human RCT for TB-500 itself (Tβ4 has some).',
      },
    },
    targetDose: {
      doseMcg: 2000,
      frequency: 'every 2 weeks (maintenance)',
      dosesPerWeek: 0.5,
      scaleWithWeight: true,
      cohort: { meanWeightKg: 80, citation: 'Community maintenance protocol.' },
    },
    hardCeilingMcg: 5000,
    weeklyHardCeilingMcg: 10000,
    sources: [
      {
        tier: 'A-',
        title: 'Thymosin beta-4 clinical trials (related molecule)',
        url: 'https://pubmed.ncbi.nlm.nih.gov/?term=thymosin+beta-4',
        year: 2022,
      },
      { tier: 'C', title: 'r/Peptides TB-500 dosing consensus', year: 2024 },
    ],
    rationale:
      '4–6 week loading at 2,500 mcg twice weekly, then maintenance. Systemic injection — abdomen or thigh. Angiogenic → pre-start cancer screening.',
  },

  'ghk-cu-injectable': {
    slug: 'ghk-cu-injectable',
    name: 'GHK-Cu (Injectable)',
    startingDose: {
      doseMcg: 200,
      frequency: 'daily',
      dosesPerWeek: 7,
      scaleWithWeight: true,
      cohort: {
        meanWeightKg: 75,
        citation:
          'Derived from topical GHK-Cu studies + community injectable protocols.',
      },
    },
    hardCeilingMcg: 500,
    weeklyHardCeilingMcg: 3500,
    sources: [
      {
        tier: 'A-',
        title: 'Pickart & Margolina — GHK-Cu review',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5115770/',
        year: 2018,
      },
      { tier: 'C', title: 'r/Peptides GHK-Cu threads', year: 2024 },
    ],
    rationale:
      '200 mcg daily SubQ for systemic anti-aging and collagen support. Copper content can cause transient skin discoloration.',
  },

  'cjc-1295': {
    slug: 'cjc-1295',
    name: 'CJC-1295',
    startingDose: {
      doseMcg: 100,
      frequency: 'daily before sleep',
      dosesPerWeek: 7,
      scaleWithWeight: false, // pituitary saturation ~ weight-independent
      cohort: {
        meanWeightKg: 75,
        n: 56,
        citation: 'Teichman et al. 2006 CJC-1295 PK/PD study (healthy adults).',
      },
    },
    hardCeilingMcg: 300,
    weeklyHardCeilingMcg: 2100,
    sources: [
      {
        tier: 'A',
        title: 'Teichman et al. — CJC-1295 prolongs GH/IGF-1 pulses',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2787983/',
        year: 2006,
      },
      { tier: 'C', title: 'r/Peptides GH stack protocols', year: 2024 },
    ],
    rationale:
      '100 mcg SubQ 30 min pre-sleep, paired with Ipamorelin, on an empty stomach. Pituitary desensitises after 8–12 weeks — mandatory 4-week break.',
  },

  ipamorelin: {
    slug: 'ipamorelin',
    name: 'Ipamorelin',
    startingDose: {
      doseMcg: 200,
      frequency: 'daily before sleep',
      dosesPerWeek: 7,
      scaleWithWeight: false,
      cohort: {
        meanWeightKg: 75,
        n: 24,
        citation: 'Raun et al. 1998 — Ipamorelin receptor selectivity study.',
      },
    },
    hardCeilingMcg: 500,
    weeklyHardCeilingMcg: 3500,
    sources: [
      {
        tier: 'A',
        title: 'Raun et al. — Ipamorelin GHRP-receptor selectivity',
        year: 1998,
      },
      { tier: 'C', title: 'r/Peptides GH stack consensus', year: 2024 },
    ],
    rationale:
      '200 mcg SubQ pre-sleep with CJC-1295. Clean GH pulse without cortisol/prolactin spike (unlike GHRP-6).',
  },

  semaglutide: {
    slug: 'semaglutide',
    name: 'Semaglutide',
    startingDose: {
      doseMcg: 250,
      frequency: 'weekly',
      dosesPerWeek: 1,
      scaleWithWeight: true,
      cohort: {
        meanWeightKg: 105,
        meanBmi: 37.8,
        n: 1961,
        citation: 'STEP 1 trial — Wilding et al. NEJM 2021.',
      },
    },
    targetDose: {
      doseMcg: 2400,
      frequency: 'weekly',
      dosesPerWeek: 1,
      scaleWithWeight: true,
      cohort: {
        meanWeightKg: 105,
        meanBmi: 37.8,
        n: 1961,
        citation: 'STEP 1 target maintenance dose.',
      },
    },
    hardCeilingMcg: 2400,
    weeklyHardCeilingMcg: 2400,
    aeThresholdMcg: 1000,
    sources: [
      {
        tier: 'A',
        title: 'Wilding et al. — STEP 1 Trial NEJM',
        url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa2032183',
        year: 2021,
      },
      {
        tier: 'B',
        title: 'FDA Ozempic label',
        url: 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/209637s011lbl.pdf',
      },
      { tier: 'B-', title: 'r/tirzepatidecompound semaglutide titration threads' },
    ],
    rationale:
      'Trial cohort averaged 105 kg (231 lb). Titrate slowly: 0.25 mg/wk → 0.5 → 1.0 → 2.0 → 2.4. Most GI adverse events come from skipping steps. Lean users (<80 kg) at the 2.4 mg dose are at elevated exposure.',
  },

  tirzepatide: {
    slug: 'tirzepatide',
    name: 'Tirzepatide',
    startingDose: {
      doseMcg: 2500,
      frequency: 'weekly',
      dosesPerWeek: 1,
      scaleWithWeight: true,
      cohort: {
        meanWeightKg: 104.8,
        meanBmi: 38,
        n: 2539,
        citation: 'SURMOUNT-1 — Jastreboff et al. NEJM 2022.',
      },
    },
    targetDose: {
      doseMcg: 15000,
      frequency: 'weekly',
      dosesPerWeek: 1,
      scaleWithWeight: true,
      cohort: {
        meanWeightKg: 104.8,
        meanBmi: 38,
        n: 2539,
        citation: 'SURMOUNT-1 target dose.',
      },
    },
    hardCeilingMcg: 15000,
    weeklyHardCeilingMcg: 15000,
    sources: [
      {
        tier: 'A',
        title: 'Jastreboff et al. — SURMOUNT-1 NEJM',
        url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa2206038',
        year: 2022,
      },
      {
        tier: 'A-',
        title: 'Frontiers — Tirzepatide GI/pancreatitis meta-analysis',
        url: 'https://www.frontiersin.org/journals/endocrinology/articles/10.3389/fendo.2023.1214334/full',
        year: 2023,
      },
    ],
    rationale:
      'GI adverse events ~2× semaglutide (RR 2.94 vs 1.68). Pancreatitis surveillance with lipase. Trial cohort was 105 kg — a 70 kg user on 15 mg is at ~1.5× trial exposure.',
  },

  retatrutide: {
    slug: 'retatrutide',
    name: 'Retatrutide',
    startingDose: {
      doseMcg: 2000,
      frequency: 'weekly',
      dosesPerWeek: 1,
      scaleWithWeight: true,
      cohort: {
        meanWeightKg: 112.7,
        meanBmi: 37.3,
        n: 338,
        citation: 'NEJM Retatrutide Phase 2 — Jastreboff et al. 2023.',
      },
    },
    targetDose: {
      doseMcg: 12000,
      frequency: 'weekly',
      dosesPerWeek: 1,
      scaleWithWeight: true,
      cohort: {
        meanWeightKg: 112.7,
        meanBmi: 37.3,
        n: 338,
        citation: 'Retatrutide phase 2 high-dose arm.',
      },
    },
    hardCeilingMcg: 12000,
    weeklyHardCeilingMcg: 12000,
    aeThresholdMcg: 8000,
    sources: [
      {
        tier: 'A',
        title: 'Jastreboff et al. — Retatrutide Phase 2',
        url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa2301972',
        year: 2023,
        notes: 'Mean baseline weight 112.7 kg, BMI 37.3. Lean users should NOT copy flat dosing.',
      },
      {
        tier: 'B-',
        title: 'NinjAthlete — Why retatrutide microdosing fails',
        url: 'https://ninjathlete.com/blogs/article/retatrutide-explained-why-microdosing-fails-the-real-science-behind-weekly-dosing',
      },
    ],
    rationale:
      'CRITICAL weight-scaling case: 12 mg trial dose came from a 248 lb avg cohort. A 170 lb user copying 12 mg is at ~1.45× trial per-kg exposure — directly correlates with the 20.9% dysesthesia signal. Scale to your weight, titrate slowly (2 mg → 4 → 8).',
  },

  tesamorelin: {
    slug: 'tesamorelin',
    name: 'Tesamorelin',
    startingDose: {
      doseMcg: 2000,
      frequency: 'daily',
      dosesPerWeek: 7,
      scaleWithWeight: true,
      cohort: {
        meanWeightKg: 89,
        n: 273,
        citation: 'Egrifta HIV-lipodystrophy trial (Falutz et al. NEJM 2007).',
      },
    },
    hardCeilingMcg: 2000,
    weeklyHardCeilingMcg: 14000,
    sources: [
      {
        tier: 'A',
        title: 'Falutz et al. — Tesamorelin HIV lipodystrophy',
        url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa072375',
        year: 2007,
      },
      { tier: 'B', title: 'FDA Egrifta label' },
    ],
    rationale:
      '2 mg daily SubQ. Original cohort was HIV-lipodystrophy patients. Bodybuilding forum use on lean 180 lb users without dose adjustment — watch for tachycardia and peripheral edema.',
  },

  'pt-141': {
    slug: 'pt-141',
    name: 'PT-141',
    startingDose: {
      doseMcg: 500,
      frequency: 'as needed (max 1×/24h)',
      dosesPerWeek: 2,
      scaleWithWeight: false, // CNS melanocortin saturation
      cohort: {
        meanWeightKg: 70,
        n: 397,
        citation: 'Vyleesi RECONNECT trials — Kingsberg et al.',
      },
    },
    hardCeilingMcg: 1750,
    sources: [
      {
        tier: 'A',
        title: 'Kingsberg et al. — Vyleesi RECONNECT',
        year: 2019,
      },
      { tier: 'B', title: 'FDA Vyleesi label' },
    ],
    rationale:
      'As-needed for HSDD. Start at 500–750 mcg to assess tolerance. Transient BP elevation — avoid if hypertensive. Frequent use → hyperpigmentation.',
  },

  epithalon: {
    slug: 'epithalon',
    name: 'Epithalon',
    startingDose: {
      doseMcg: 5000,
      frequency: 'daily (10-day course)',
      dosesPerWeek: 7,
      scaleWithWeight: true,
      cohort: {
        meanWeightKg: 75,
        n: 266,
        citation: 'Khavinson et al. — pineal peptide elderly trials.',
      },
    },
    hardCeilingMcg: 10000,
    weeklyHardCeilingMcg: 70000,
    sources: [
      {
        tier: 'A-',
        title: 'Khavinson et al. — Epithalon elderly mortality outcomes',
        year: 2003,
      },
      { tier: 'C', title: 'r/Peptides longevity threads' },
    ],
    rationale:
      '5–10 mg daily SubQ for 10-day courses, 1–2× per year. Long-term human safety largely unknown outside Russian trials.',
  },

  hexarelin: {
    slug: 'hexarelin',
    name: 'Hexarelin',
    startingDose: {
      doseMcg: 100,
      frequency: '2×/day',
      dosesPerWeek: 14,
      scaleWithWeight: false,
      cohort: {
        meanWeightKg: 75,
        n: 24,
        citation: 'Ghigo et al. — Hexarelin GH-releasing activity.',
      },
    },
    hardCeilingMcg: 300,
    weeklyHardCeilingMcg: 4200,
    sources: [
      {
        tier: 'A',
        title: 'Ghigo et al. — Hexarelin GH-releasing activity',
        year: 1994,
      },
      { tier: 'C', title: 'r/Peptides GHRP threads' },
    ],
    rationale:
      'Potent GHRP — desensitises faster than Ipamorelin (6–8 weeks). Cortisol and prolactin elevation at higher doses.',
  },

  'ghk-cu-topical': {
    slug: 'ghk-cu-topical',
    name: 'GHK-Cu (Topical)',
    startingDose: {
      doseMcg: 10000,
      frequency: '1–2% serum applied 1–2× daily',
      scaleWithWeight: false,
      cohort: {
        meanWeightKg: 70,
        n: 120,
        citation: 'Pickart — topical GHK-Cu cosmetic studies.',
      },
    },
    hardCeilingMcg: 20000,
    sources: [
      {
        tier: 'A-',
        title: 'Pickart & Margolina — GHK-Cu review',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5115770/',
        year: 2018,
      },
    ],
    rationale:
      'Topical 1–2% serum. Patch-test before full application. Safest entry point for GHK-Cu.',
  },

  glow: {
    slug: 'glow',
    name: 'Glow Blend',
    startingDose: {
      doseMcg: 70,
      frequency: 'daily',
      dosesPerWeek: 7,
      scaleWithWeight: true,
      cohort: {
        meanWeightKg: 75,
        citation: 'Vendor-sold blend (50:10:10 GHK-Cu:TB-500:BPC-157). No trial data.',
      },
    },
    hardCeilingMcg: 140,
    weeklyHardCeilingMcg: 980,
    sources: [
      { tier: 'D', title: 'Vendor blend product pages', notes: 'No independent validation.' },
      { tier: 'C', title: 'r/Peptides Glow user reports' },
    ],
    rationale:
      'Convenience blend. Dosing math depends entirely on vendor ratio accuracy — verify via COA. No trial cohort exists.',
  },

  selank: {
    slug: 'selank',
    name: 'Selank',
    startingDose: {
      doseMcg: 300,
      frequency: 'daily (intranasal)',
      dosesPerWeek: 7,
      scaleWithWeight: false,
      cohort: {
        meanWeightKg: 75,
        n: 60,
        citation: 'Russian anxiolytic trials.',
      },
    },
    hardCeilingMcg: 900,
    sources: [
      { tier: 'A-', title: 'Medvedev et al. — Selank anxiolytic trial', year: 2015 },
      { tier: 'C', title: 'r/Nootropics Selank threads' },
    ],
    rationale:
      'Intranasal anxiolytic. Mostly Russian-language literature. Low adverse event profile at typical doses.',
  },

  semax: {
    slug: 'semax',
    name: 'Semax',
    startingDose: {
      doseMcg: 300,
      frequency: 'daily (intranasal)',
      dosesPerWeek: 7,
      scaleWithWeight: false,
      cohort: {
        meanWeightKg: 75,
        n: 110,
        citation: 'Russian neuroprotection trials.',
      },
    },
    hardCeilingMcg: 900,
    sources: [
      { tier: 'A-', title: 'Russian Semax stroke recovery trials' },
      { tier: 'C', title: 'r/Nootropics Semax threads' },
    ],
    rationale:
      'Intranasal nootropic and neuroprotective. Used off-label in post-stroke recovery in Russia.',
  },
};

export function getProtocolSeed(slug: string): ProtocolSeed | undefined {
  return PROTOCOL_SEEDS[slug];
}

export function listProtocolSeeds(): ProtocolSeed[] {
  return Object.values(PROTOCOL_SEEDS);
}
