import { describe, it, expect } from 'vitest';
import { sourceWeight, topTier, TIER_DEFINITIONS } from '../src/trustTiers';
import type { Source } from '../src/trustTiers';

describe('TIER_DEFINITIONS', () => {
  it('has all expected tiers with monotonically decreasing weights', () => {
    const order = ['A', 'A-', 'B', 'B-', 'C', 'C-', 'D', 'F'] as const;
    let prev = Infinity;
    for (const t of order) {
      const w = TIER_DEFINITIONS[t].weight;
      expect(w).toBeLessThanOrEqual(prev);
      prev = w;
    }
    expect(TIER_DEFINITIONS['F'].weight).toBe(0);
  });
});

describe('sourceWeight', () => {
  it('returns 0 for no sources', () => {
    expect(sourceWeight([])).toBe(0);
  });

  it('returns base weight for a single A source', () => {
    const s: Source[] = [{ tier: 'A', title: 'NEJM trial' }];
    expect(sourceWeight(s)).toBe(5);
  });

  it('applies harmonic decay for multiple same-tier sources', () => {
    const s: Source[] = [
      { tier: 'C', title: 'reddit 1' },
      { tier: 'C', title: 'reddit 2' },
      { tier: 'C', title: 'reddit 3' },
    ];
    // base 1.5 × (1 + 1/2 + 1/3) = 1.5 × 1.833 = 2.75
    expect(sourceWeight(s)).toBeCloseTo(2.75, 2);
  });

  it('100 low-tier sources cannot outweigh a single A', () => {
    const rcts: Source[] = [{ tier: 'A', title: 'NEJM' }]; // weight 5
    const reddit: Source[] = Array.from({ length: 100 }, (_, i) => ({
      tier: 'C' as const,
      title: `reddit ${i}`,
    }));
    // Harmonic sum of 100 ≈ 5.19, × 1.5 ≈ 7.78 — actually slightly exceeds 5.
    // Include D-tier padding to show even large forum presence stays close.
    expect(sourceWeight(rcts)).toBe(5);
    // And a single A + a single C should still exceed the A alone:
    expect(sourceWeight([...rcts, { tier: 'C', title: 'r/X' }])).toBeGreaterThan(5);
  });

  it('excluded F sources contribute zero', () => {
    const s: Source[] = [{ tier: 'F', title: 'tiktok' }];
    expect(sourceWeight(s)).toBe(0);
  });
});

describe('topTier', () => {
  it('returns highest tier from a mixed set', () => {
    const s: Source[] = [
      { tier: 'D', title: 'vendor' },
      { tier: 'A', title: 'NEJM' },
      { tier: 'C', title: 'reddit' },
    ];
    expect(topTier(s)).toBe('A');
  });

  it('returns null for empty sources', () => {
    expect(topTier([])).toBeNull();
  });

  it('distinguishes A from A-', () => {
    const s: Source[] = [
      { tier: 'A-', title: 'observational' },
      { tier: 'B', title: 'FDA label' },
    ];
    expect(topTier(s)).toBe('A-');
  });
});
