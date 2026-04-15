/**
 * Community consensus math.
 *
 * Users post structured dose logs with outcomes. The consensus engine
 * aggregates them using post-level trust weights (bloodwork attached → ×5,
 * anonymous text only → ×1) and returns a weighted median with IQR bands,
 * plus minority-protocol detection when a significant cluster diverges.
 *
 * Philosophy: surface dissent, don't hide it. If 20% of users cluster at a
 * lower dose with better outcomes, that's the "minority protocol" and it
 * deserves its own row on the UI.
 */

export interface PostEvidence {
  /** Bloodwork attached — labs covering the relevant biomarker panel. */
  bloodwork: boolean;
  /** Body composition measurement attached (DEXA, BodPod, calipers). */
  bodyComposition: boolean;
  /** Batch or COA info attached. */
  batchInfo: boolean;
  /** Post covers 60+ days of consistent logging. */
  longitudinal: boolean;
  /** Optional identity verification level. */
  verified: boolean;
  /** Post flagged as affiliate or vendor content. */
  vendorFlagged: boolean;
}

export interface CommunityPost {
  id: string;
  userId: string;
  peptideSlug: string;
  /** Dose per injection in mcg. */
  doseMcg: number;
  /** Doses per week (for weekly-exposure math). */
  dosesPerWeek: number;
  /** Cycle length in weeks (null = ongoing/unspecified). */
  weeksOn?: number | null;
  /** User's weight in kg at the time of the protocol. */
  weightKg: number;
  /** Goal category — e.g. 'injury_recovery'. */
  goal: string;
  /** Self-reported outcome score: -2 = worse, 0 = no change, 2 = strong improvement. */
  outcomeScore?: number;
  /** Reported side effect severity 0–10. */
  sideEffectSeverity?: number;
  evidence: PostEvidence;
}

export interface ConsensusInput {
  posts: CommunityPost[];
  /** Viewer's weight bracket for filtering — ±20% is applied. */
  viewerWeightKg?: number;
  /** Viewer's goal for filtering. */
  goal?: string;
}

export interface ConsensusResult {
  /** Number of posts used after filtering. */
  n: number;
  /** Weighted median dose in mcg/kg/week (for cross-weight comparability). */
  medianMcgPerKgPerWeek: number;
  /** P25 and P75 of the weighted distribution. */
  p25McgPerKgPerWeek: number;
  p75McgPerKgPerWeek: number;
  /** Scaled median dose for the viewer's weight. */
  scaledDoseMcg?: number;
  /** Minority protocols — secondary clusters with ≥15% weight share. */
  minorityProtocols: Array<{
    /** Cluster label: 'lower-dose' | 'higher-dose'. */
    label: string;
    medianMcgPerKgPerWeek: number;
    weightShare: number;
    n: number;
  }>;
  /** Warning if n is too small for reliable consensus. */
  lowConfidence: boolean;
}

export function postWeight(post: CommunityPost): number {
  if (post.evidence.vendorFlagged) return 0;
  let w = 1;
  if (post.evidence.bloodwork) w *= 5;
  else if (post.evidence.bodyComposition) w *= 3;
  if (post.evidence.batchInfo) w *= 2;
  if (post.evidence.longitudinal) w *= 2;
  if (post.evidence.verified) w *= 2;
  return w;
}

/**
 * Weighted median — linear interpolation between sorted weighted points.
 */
export function weightedQuantile(
  values: number[],
  weights: number[],
  q: number,
): number {
  if (values.length === 0) return 0;
  const sorted = values
    .map((v, i) => ({ v, w: weights[i] ?? 0 }))
    .filter((p) => p.w > 0)
    .sort((a, b) => a.v - b.v);
  if (sorted.length === 0) return 0;
  const total = sorted.reduce((s, p) => s + p.w, 0);
  if (total === 0) return sorted[Math.floor(sorted.length / 2)]!.v;
  const target = total * q;
  let cum = 0;
  for (let i = 0; i < sorted.length; i++) {
    cum += sorted[i]!.w;
    if (cum >= target) return sorted[i]!.v;
  }
  return sorted[sorted.length - 1]!.v;
}

/**
 * Compute weighted-median consensus from a set of community posts.
 *
 * Filtering:
 *   - Drops vendor-flagged posts (weight 0)
 *   - If viewerWeightKg given, filters to posts within ±20% weight
 *   - If goal given, filters to matching goal
 *
 * Returns dose normalized to mcg/kg/week for cross-weight comparability,
 * plus a scaled dose for the viewer.
 */
export function computeConsensus(input: ConsensusInput): ConsensusResult {
  let relevant = input.posts.filter((p) => !p.evidence.vendorFlagged);
  if (input.goal) relevant = relevant.filter((p) => p.goal === input.goal);
  if (input.viewerWeightKg != null) {
    const lo = input.viewerWeightKg * 0.8;
    const hi = input.viewerWeightKg * 1.2;
    relevant = relevant.filter((p) => p.weightKg >= lo && p.weightKg <= hi);
  }

  const perKgPerWeek = relevant.map(
    (p) => (p.doseMcg * p.dosesPerWeek) / p.weightKg,
  );
  const weights = relevant.map(postWeight);

  const median = weightedQuantile(perKgPerWeek, weights, 0.5);
  const p25 = weightedQuantile(perKgPerWeek, weights, 0.25);
  const p75 = weightedQuantile(perKgPerWeek, weights, 0.75);

  // Detect minority clusters: split posts into above-median and below-median,
  // report if either side has ≥15% of total weight AND its own median is
  // ≥25% different from the overall.
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  const minorityProtocols: ConsensusResult['minorityProtocols'] = [];

  if (totalWeight > 0) {
    for (const side of ['lower', 'higher'] as const) {
      const subset = relevant
        .map((p, i) => ({ p, w: weights[i] ?? 0, v: perKgPerWeek[i] ?? 0 }))
        .filter((r) => (side === 'lower' ? r.v < median : r.v > median));
      const subW = subset.reduce((s, r) => s + r.w, 0);
      if (subW / totalWeight < 0.15) continue;
      const subMed = weightedQuantile(
        subset.map((r) => r.v),
        subset.map((r) => r.w),
        0.5,
      );
      if (Math.abs(subMed - median) / (median || 1) < 0.25) continue;
      minorityProtocols.push({
        label: side === 'lower' ? 'lower-dose' : 'higher-dose',
        medianMcgPerKgPerWeek: subMed,
        weightShare: subW / totalWeight,
        n: subset.length,
      });
    }
  }

  const scaledDoseMcg =
    input.viewerWeightKg != null
      ? (median * input.viewerWeightKg) / Math.max(1, relevant[0]?.dosesPerWeek ?? 1)
      : undefined;

  return {
    n: relevant.length,
    medianMcgPerKgPerWeek: median,
    p25McgPerKgPerWeek: p25,
    p75McgPerKgPerWeek: p75,
    scaledDoseMcg,
    minorityProtocols,
    lowConfidence: relevant.length < 5,
  };
}
