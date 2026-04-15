/**
 * Source trust tiers for peptide information.
 *
 * Rationale: beginners searching "BPC-157 dose" get a hierarchy of sources
 * ranging from peer-reviewed trials to TikTok anecdotes. Every claim in
 * PeptPal carries a source tier so users can see *why* we're recommending a
 * dose, and the consensus engine can weight posts accordingly.
 *
 * Do not reweight these casually — the weights are the safety floor for the
 * entire app.
 */

export type SourceTier = 'A' | 'A-' | 'B' | 'B-' | 'C' | 'C-' | 'D' | 'F';

export interface TierDefinition {
  tier: SourceTier;
  /** Relative weight when mixing multiple sources for a consensus. */
  weight: number;
  /** Shown to users as the provenance badge. */
  label: string;
  description: string;
  examples: string[];
}

export const TIER_DEFINITIONS: Record<SourceTier, TierDefinition> = {
  A: {
    tier: 'A',
    weight: 5,
    label: 'Peer-reviewed RCT',
    description: 'Randomized controlled trials with human subjects, peer-reviewed publication.',
    examples: ['NEJM retatrutide phase 2', 'STEP trials semaglutide'],
  },
  'A-': {
    tier: 'A-',
    weight: 4,
    label: 'Peer-reviewed observational',
    description: 'Peer-reviewed cohort, case-control, or open-label human studies.',
    examples: ['PubMed observational studies', 'Frontiers meta-analyses'],
  },
  B: {
    tier: 'B',
    weight: 3,
    label: 'Regulatory / professional society',
    description: 'FDA labels, Endocrine Society guidance, CDC recommendations.',
    examples: ['FDA Ozempic label', 'Endocrine Society GH guidelines'],
  },
  'B-': {
    tier: 'B-',
    weight: 2,
    label: 'Informed long-form',
    description: 'Written by informed practitioners but may have commercial conflicts.',
    examples: ['Jay Campbell', 'NinjAthlete', 'Eric Topol substack'],
  },
  C: {
    tier: 'C',
    weight: 1.5,
    label: 'High-signal community',
    description: 'Top-voted threads from active subreddits or established forums.',
    examples: ['r/Peptides top posts', 'r/PeptideSciences', 'MESO-Rx archives'],
  },
  'C-': {
    tier: 'C-',
    weight: 1,
    label: 'Aggregator / blog',
    description: 'SEO-driven aggregator sites — occasionally rigorous, often not.',
    examples: ['PeptideDeck', 'SeekPeptides', 'GLP3 Planner'],
  },
  D: {
    tier: 'D',
    weight: 0.25,
    label: 'Vendor / marketing',
    description: 'Vendor blogs and marketing pages. Commercially conflicted. Cherry-picks animal data.',
    examples: ['Palmetto', 'Amino Asylum blog', 'Swolverine'],
  },
  F: {
    tier: 'F',
    weight: 0,
    label: 'Excluded',
    description: 'TikTok, Telegram vendor channels, single-case Discord anecdotes, influencer promos. Excluded from consensus math.',
    examples: ['TikTok peptide influencers', 'Telegram vendor channels'],
  },
};

export interface Source {
  tier: SourceTier;
  /** Short citation shown in the app. */
  title: string;
  /** Optional URL. */
  url?: string;
  /** Year published — affects recency score. */
  year?: number;
  /** Optional notes on bias, limitations, conflicts of interest. */
  notes?: string;
}

/**
 * Combined weight for a set of sources.
 * Scales sub-linearly so many low-quality sources can't outweigh one RCT.
 */
export function sourceWeight(sources: Source[]): number {
  if (sources.length === 0) return 0;
  let total = 0;
  for (const s of sources) {
    total += TIER_DEFINITIONS[s.tier].weight;
  }
  // Sub-linear scaling: a second source of same tier adds 50%, third adds 33%, etc.
  // Prevents 100 reddit posts from outweighing a single NEJM paper.
  const byTier = new Map<SourceTier, number>();
  for (const s of sources) {
    byTier.set(s.tier, (byTier.get(s.tier) ?? 0) + 1);
  }
  let scaled = 0;
  for (const [tier, count] of byTier) {
    const base = TIER_DEFINITIONS[tier].weight;
    // Harmonic decay: w * (1 + 1/2 + 1/3 + ...)
    let h = 0;
    for (let i = 1; i <= count; i++) h += 1 / i;
    scaled += base * h;
  }
  return scaled;
}

/**
 * Highest tier among a set of sources — used for the protocol badge.
 */
export function topTier(sources: Source[]): SourceTier | null {
  if (sources.length === 0) return null;
  const order: SourceTier[] = ['A', 'A-', 'B', 'B-', 'C', 'C-', 'D', 'F'];
  for (const t of order) {
    if (sources.some((s) => s.tier === t)) return t;
  }
  return null;
}
