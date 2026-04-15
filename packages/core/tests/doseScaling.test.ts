import { describe, it, expect } from 'vitest';
import { scaleDose, enforceHardCeiling, lbsToKg, kgToLbs } from '../src/doseScaling';
import type { DoseRecommendation, UserProfile } from '../src/doseScaling';

const retatrutideTrial: DoseRecommendation = {
  doseMcg: 12000,
  frequency: 'weekly',
  dosesPerWeek: 1,
  scaleWithWeight: true,
  cohort: { meanWeightKg: 112.7, meanBmi: 37.3, n: 338, citation: 'NEJM 2023' },
};

describe('scaleDose — weight-dependent peptides', () => {
  it('flags lean user copying retatrutide flat dose as dangerous', () => {
    const lean: UserProfile = { weightKg: lbsToKg(170) };
    const s = scaleDose(retatrutideTrial, lean);
    // 170 lb = 77.1 kg. Per-kg trial dose = 12000/112.7 = 106.5 mcg/kg.
    // Copying flat 12000 mcg → 12000/77.1 = 155.6 mcg/kg. Ratio = 1.46.
    expect(s.exposureRatio).toBeGreaterThan(1.4);
    expect(s.safetyFlag).toBe('dangerous');
  });

  it('scales the dose down for lean user', () => {
    const lean: UserProfile = { weightKg: lbsToKg(170) };
    const s = scaleDose(retatrutideTrial, lean);
    // Scaled should be ~12000 * (77.1/112.7) = ~8208 mcg
    expect(s.scaledDoseMcg).toBeGreaterThan(7800);
    expect(s.scaledDoseMcg).toBeLessThan(8400);
  });

  it('returns safe flag for user near trial cohort weight', () => {
    const s = scaleDose(retatrutideTrial, { weightKg: 112.7 });
    expect(s.safetyFlag).toBe('safe');
    expect(s.exposureRatio).toBeCloseTo(1.0, 2);
  });

  it('flags subtherapeutic for very heavy user at flat dose', () => {
    const heavy: UserProfile = { weightKg: 200 };
    const s = scaleDose(retatrutideTrial, heavy);
    expect(s.safetyFlag).toBe('subtherapeutic');
    // Scaled up for heavier user:
    expect(s.scaledDoseMcg).toBeGreaterThan(12000);
  });

  it('semaglutide: 70 kg user on 2.4 mg is elevated exposure', () => {
    const sema: DoseRecommendation = {
      doseMcg: 2400,
      frequency: 'weekly',
      dosesPerWeek: 1,
      scaleWithWeight: true,
      cohort: { meanWeightKg: 105, citation: 'STEP 1' },
    };
    const s = scaleDose(sema, { weightKg: 70 });
    expect(s.exposureRatio).toBeGreaterThan(1.2);
    // Scaled dose should be 2400 * (70/105) = 1600
    expect(s.scaledDoseMcg).toBeCloseTo(1600, 0);
  });
});

describe('scaleDose — weight-independent peptides', () => {
  const cjc: DoseRecommendation = {
    doseMcg: 100,
    frequency: 'daily',
    dosesPerWeek: 7,
    scaleWithWeight: false,
    cohort: { meanWeightKg: 75, citation: 'Teichman 2006' },
  };

  it('keeps flat dose regardless of weight', () => {
    const s = scaleDose(cjc, { weightKg: 60 });
    expect(s.scaledDoseMcg).toBe(100);
  });

  it('flags outlier weight with explanation mentioning receptor saturation', () => {
    const s = scaleDose(cjc, { weightKg: 120 });
    expect(s.explanation).toContain('receptor-saturating');
  });
});

describe('enforceHardCeiling', () => {
  it('caps scaled dose at the hard ceiling', () => {
    const heavy = scaleDose(retatrutideTrial, { weightKg: 200 });
    const capped = enforceHardCeiling(heavy, 12000);
    expect(capped.scaledDoseMcg).toBe(12000);
    expect(capped.safetyFlag).toBe('dangerous');
  });

  it('leaves dose untouched if already below ceiling', () => {
    const normal = scaleDose(retatrutideTrial, { weightKg: 80 });
    const capped = enforceHardCeiling(normal, 12000);
    expect(capped.scaledDoseMcg).toBe(normal.scaledDoseMcg);
  });
});

describe('unit conversion', () => {
  it('lbs<->kg round trip', () => {
    expect(kgToLbs(lbsToKg(180))).toBeCloseTo(180, 3);
  });
});
