import { describe, it, expect } from 'vitest';
import { computeConsensus, postWeight, weightedQuantile } from '../src/consensus';
import type { CommunityPost, PostEvidence } from '../src/consensus';

const baseEvidence: PostEvidence = {
  bloodwork: false,
  bodyComposition: false,
  batchInfo: false,
  longitudinal: false,
  verified: false,
  vendorFlagged: false,
};

function mkPost(overrides: Partial<CommunityPost>): CommunityPost {
  return {
    id: Math.random().toString(36),
    userId: 'u',
    peptideSlug: 'bpc-157',
    doseMcg: 250,
    dosesPerWeek: 7,
    weightKg: 75,
    goal: 'injury_recovery',
    evidence: baseEvidence,
    ...overrides,
  };
}

describe('postWeight', () => {
  it('returns 0 for vendor-flagged posts', () => {
    expect(postWeight(mkPost({ evidence: { ...baseEvidence, vendorFlagged: true } }))).toBe(0);
  });

  it('bloodwork post weighted 5× over anonymous text', () => {
    const bw = postWeight(mkPost({ evidence: { ...baseEvidence, bloodwork: true } }));
    const anon = postWeight(mkPost({}));
    expect(bw / anon).toBe(5);
  });

  it('longitudinal + batch + verified stacks multiplicatively', () => {
    const w = postWeight(
      mkPost({
        evidence: {
          ...baseEvidence,
          bloodwork: true,
          longitudinal: true,
          batchInfo: true,
          verified: true,
        },
      }),
    );
    // 5 × 2 × 2 × 2 = 40
    expect(w).toBe(40);
  });
});

describe('weightedQuantile', () => {
  it('returns median of equal-weight distribution', () => {
    const v = [1, 2, 3, 4, 5];
    const w = [1, 1, 1, 1, 1];
    expect(weightedQuantile(v, w, 0.5)).toBe(3);
  });

  it('returns 0 for empty', () => {
    expect(weightedQuantile([], [], 0.5)).toBe(0);
  });

  it('ignores zero-weight values', () => {
    const v = [1, 100, 3];
    const w = [1, 0, 1];
    // 100 filtered out; step-function quantile on [1,3] at q=0.5 returns the
    // first value whose cumulative weight reaches half the total.
    const result = weightedQuantile(v, w, 0.5);
    expect([1, 3]).toContain(result);
    // Critically: the outlier 100 never influences the result.
    expect(result).not.toBe(100);
  });
});

describe('computeConsensus', () => {
  it('computes median dose per kg per week from a small cohort', () => {
    const posts: CommunityPost[] = [
      mkPost({ doseMcg: 250, dosesPerWeek: 7, weightKg: 75 }), // 23.3 mcg/kg/wk
      mkPost({ doseMcg: 300, dosesPerWeek: 7, weightKg: 75 }), // 28.0
      mkPost({ doseMcg: 500, dosesPerWeek: 7, weightKg: 100 }), // 35.0
      mkPost({ doseMcg: 250, dosesPerWeek: 7, weightKg: 75 }),
      mkPost({ doseMcg: 250, dosesPerWeek: 7, weightKg: 75 }),
    ];
    const r = computeConsensus({ posts });
    expect(r.n).toBe(5);
    expect(r.medianMcgPerKgPerWeek).toBeGreaterThan(20);
    expect(r.medianMcgPerKgPerWeek).toBeLessThan(30);
    expect(r.lowConfidence).toBe(false);
  });

  it('flags low confidence for n<5', () => {
    const posts = [mkPost({}), mkPost({}), mkPost({})];
    const r = computeConsensus({ posts });
    expect(r.lowConfidence).toBe(true);
  });

  it('excludes vendor-flagged posts', () => {
    const posts = [
      mkPost({ doseMcg: 250 }),
      mkPost({ doseMcg: 5000, evidence: { ...baseEvidence, vendorFlagged: true } }),
      mkPost({ doseMcg: 250 }),
    ];
    const r = computeConsensus({ posts });
    expect(r.n).toBe(2);
    // Median should NOT reflect the 5000 mcg vendor post
    expect(r.medianMcgPerKgPerWeek).toBeLessThan(25);
  });

  it('filters by viewer weight bracket (±20%)', () => {
    const posts = [
      mkPost({ weightKg: 50, doseMcg: 100 }), // outside ±20% of 80kg
      mkPost({ weightKg: 80, doseMcg: 250 }),
      mkPost({ weightKg: 85, doseMcg: 250 }),
      mkPost({ weightKg: 75, doseMcg: 250 }),
      mkPost({ weightKg: 200, doseMcg: 800 }), // outside bracket
    ];
    const r = computeConsensus({ posts, viewerWeightKg: 80 });
    expect(r.n).toBe(3);
  });

  it('detects minority lower-dose protocol when cluster diverges ≥25%', () => {
    // Majority at ~30 mcg/kg/wk, minority at ~10 mcg/kg/wk
    const posts: CommunityPost[] = [];
    // 10 majority posts at ~30 mcg/kg/wk:
    for (let i = 0; i < 10; i++) {
      posts.push(mkPost({ doseMcg: 300, dosesPerWeek: 7, weightKg: 70 }));
    }
    // 3 minority at ~10 mcg/kg/wk:
    for (let i = 0; i < 3; i++) {
      posts.push(mkPost({ doseMcg: 100, dosesPerWeek: 7, weightKg: 70 }));
    }
    const r = computeConsensus({ posts });
    expect(r.minorityProtocols.length).toBeGreaterThanOrEqual(1);
    const lower = r.minorityProtocols.find((m) => m.label === 'lower-dose');
    expect(lower).toBeDefined();
    expect(lower!.weightShare).toBeGreaterThan(0.15);
  });
});
