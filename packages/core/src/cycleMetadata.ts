/**
 * Cycling protocol metadata per peptide.
 * Healing peptides (BPC-157, TB-500) don't cause receptor desensitisation
 * and are used in finite blocks. GH secretagogues do desensitise and require
 * structured on/off cycles.
 */

export type PeptideCategory =
  | 'healing'        // BPC-157, TB-500, GHK-Cu — no receptor downregulation
  | 'gh_secretagogue' // CJC-1295, Ipamorelin, GHRP-6 — desensitise after 8-12 wk
  | 'glp1'           // Semaglutide, Tirzepatide — titrate up; typically long-term
  | 'longevity'      // Epithalon, Selank — periodic courses
  | 'other';         // PT-141, Melanotan — as-needed

export interface CycleMetadata {
  slug: string;
  category: PeptideCategory;
  requiresCycling: boolean;
  /** Maximum recommended weeks on before a break */
  maxWeeksOn: number | null;
  /** Recommended weeks off between cycles */
  recommendedOffWeeks: number | null;
  /** Human-readable cycle note shown in the planner */
  cycleNote: string;
  /** Whether GH secretagogues show a 5/2 pulsing option */
  pulsingOption?: boolean;
}

export const CYCLE_METADATA: Record<string, CycleMetadata> = {
  'bpc-157': {
    slug: 'bpc-157',
    category: 'healing',
    requiresCycling: false,
    maxWeeksOn: 8,
    recommendedOffWeeks: 4,
    cycleNote:
      'No receptor desensitisation. Run 4–8 week blocks for acute injury; extend up to 12 wk for chronic conditions. Optional 4-week break between blocks.',
  },
  'tb-500': {
    slug: 'tb-500',
    category: 'healing',
    requiresCycling: false,
    maxWeeksOn: 8,
    recommendedOffWeeks: 4,
    cycleNote:
      'No receptor desensitisation. Loading phase 4–6 wk (2× weekly), then maintenance 1× every 2 weeks. Breaks are optional.',
  },
  'ghk-cu-injectable': {
    slug: 'ghk-cu-injectable',
    category: 'healing',
    requiresCycling: false,
    maxWeeksOn: 8,
    recommendedOffWeeks: 4,
    cycleNote:
      'No receptor desensitisation. Typical 4–8 week courses; pause between cycles if desired.',
  },
  glow: {
    slug: 'glow',
    category: 'healing',
    requiresCycling: false,
    maxWeeksOn: 8,
    recommendedOffWeeks: 4,
    cycleNote:
      'Blend of healing peptides — no desensitisation expected. 4–8 week cycles with optional rest.',
  },
  'cjc-1295': {
    slug: 'cjc-1295',
    category: 'gh_secretagogue',
    requiresCycling: true,
    maxWeeksOn: 12,
    recommendedOffWeeks: 4,
    cycleNote:
      'GH secretagogue — pituitary desensitises after 8–12 weeks of continuous use. Take 4+ weeks fully off to restore receptor sensitivity.',
    pulsingOption: true,
  },
  ipamorelin: {
    slug: 'ipamorelin',
    category: 'gh_secretagogue',
    requiresCycling: true,
    maxWeeksOn: 12,
    recommendedOffWeeks: 4,
    cycleNote:
      'GH secretagogue. Typically paired with CJC-1295. Desensitises after 8–12 weeks; 4-week off period restores sensitivity.',
    pulsingOption: true,
  },
  hexarelin: {
    slug: 'hexarelin',
    category: 'gh_secretagogue',
    requiresCycling: true,
    maxWeeksOn: 8,
    recommendedOffWeeks: 4,
    cycleNote:
      'Potent GHRP — desensitises faster than Ipamorelin (6–8 weeks). 4-week off recommended. Some use 5-on/2-off pulsing.',
    pulsingOption: true,
  },
  semaglutide: {
    slug: 'semaglutide',
    category: 'glp1',
    requiresCycling: false,
    maxWeeksOn: null,
    recommendedOffWeeks: null,
    cycleNote:
      'Long-term maintenance medication. Titrate up slowly (0.25 mg/wk → 0.5 → 1.0 → 2.0 mg). Do not stop abruptly — discuss with provider.',
  },
  epithalon: {
    slug: 'epithalon',
    category: 'longevity',
    requiresCycling: false,
    maxWeeksOn: 2,
    recommendedOffWeeks: 24,
    cycleNote:
      'Short periodic courses (10 days, 1–2× per year). No evidence of desensitisation but community convention is to limit use to annual or biannual courses.',
  },
  'pt-141': {
    slug: 'pt-141',
    category: 'other',
    requiresCycling: false,
    maxWeeksOn: null,
    recommendedOffWeeks: null,
    cycleNote:
      'As-needed (max 1× per 24 hours). Long-term hyperpigmentation risk with frequent use — limit to occasional use and monitor skin.',
  },
};

export function getCycleMetadata(slug: string): CycleMetadata {
  return (
    CYCLE_METADATA[slug] ?? {
      slug,
      category: 'other',
      requiresCycling: false,
      maxWeeksOn: null,
      recommendedOffWeeks: null,
      cycleNote: 'No specific cycling data. Follow protocol guidelines for this peptide.',
    }
  );
}

export interface CycleStatus {
  weeksOn: number;
  daysOn: number;
  status: 'ok' | 'warning' | 'overdue';
  message: string;
}

export function computeCycleStatus(
  startDate: string,
  meta: CycleMetadata,
  now: Date = new Date(),
): CycleStatus {
  const start = new Date(startDate);
  const daysOn = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  const weeksOn = daysOn / 7;

  if (meta.maxWeeksOn == null) {
    return { weeksOn, daysOn, status: 'ok', message: 'No cycle limit for this peptide.' };
  }

  const warnAt = meta.maxWeeksOn * 0.75;
  if (weeksOn >= meta.maxWeeksOn) {
    return {
      weeksOn,
      daysOn,
      status: 'overdue',
      message: meta.recommendedOffWeeks
        ? `${Math.round(weeksOn)} weeks on — take ${meta.recommendedOffWeeks} weeks off now to restore receptor sensitivity.`
        : `${Math.round(weeksOn)} weeks on — consider a break.`,
    };
  }
  if (weeksOn >= warnAt) {
    const remaining = Math.ceil(meta.maxWeeksOn - weeksOn);
    return {
      weeksOn,
      daysOn,
      status: 'warning',
      message: `~${remaining} week${remaining === 1 ? '' : 's'} until recommended cycle break.`,
    };
  }
  return {
    weeksOn,
    daysOn,
    status: 'ok',
    message: `Week ${Math.ceil(weeksOn)} of ${meta.maxWeeksOn}`,
  };
}
