import { describe, it, expect } from 'vitest';
import {
  getDegradationProfile,
  remainingPotency,
  doseCompensationMultiplier,
  buildDegradationCurve,
  variabilityFraction,
} from '../src/degradation';

describe('getDegradationProfile', () => {
  it('returns known profile for BPC-157', () => {
    const p = getDegradationProfile('bpc-157');
    expect(p.slug).toBe('bpc-157');
    expect(p.k_reconstituted_fridge).toBeGreaterThan(0);
  });

  it('falls back to conservative default for unknown peptide', () => {
    const p = getDegradationProfile('never-heard-of-it');
    expect(p.k_reconstituted_fridge).toBeGreaterThan(0);
    expect(p.source).toContain('Default');
  });
});

describe('remainingPotency', () => {
  it('is 1.0 at t=0', () => {
    expect(remainingPotency('bpc-157', 'reconstituted_fridge', 0)).toBeCloseTo(1.0, 4);
  });

  it('decreases monotonically with time', () => {
    const a = remainingPotency('bpc-157', 'reconstituted_fridge', 7);
    const b = remainingPotency('bpc-157', 'reconstituted_fridge', 14);
    const c = remainingPotency('bpc-157', 'reconstituted_fridge', 28);
    expect(a).toBeGreaterThan(b);
    expect(b).toBeGreaterThan(c);
  });

  it('BPC-157 reconstituted fridge lands in expected ballpark at 28 days', () => {
    const p = remainingPotency('bpc-157', 'reconstituted_fridge', 28);
    // Community consensus: ~50% at 28 days. Our k=0.020 gives exp(-0.56)=0.57.
    expect(p).toBeGreaterThan(0.4);
    expect(p).toBeLessThan(0.8);
  });

  it('lyophilized freezer is much more stable than reconstituted fridge', () => {
    const freezer = remainingPotency('bpc-157', 'lyophilized_freezer', 365);
    const fridge = remainingPotency('bpc-157', 'reconstituted_fridge', 30);
    expect(freezer).toBeGreaterThan(fridge);
  });

  it('room temp reconstituted degrades fastest', () => {
    const rt = remainingPotency('bpc-157', 'reconstituted_roomtemp', 7);
    const fridge = remainingPotency('bpc-157', 'reconstituted_fridge', 7);
    expect(rt).toBeLessThan(fridge);
  });
});

describe('doseCompensationMultiplier', () => {
  it('returns 1.0 for full potency', () => {
    expect(doseCompensationMultiplier(1.0)).toBe(1.0);
  });

  it('returns 2.0 for 50% potency', () => {
    expect(doseCompensationMultiplier(0.5)).toBe(2.0);
  });

  it('returns Infinity for zero potency', () => {
    expect(doseCompensationMultiplier(0)).toBe(Infinity);
  });
});

describe('buildDegradationCurve', () => {
  it('returns steps+1 points from full to reduced potency', () => {
    const pts = buildDegradationCurve('bpc-157', 'reconstituted_fridge', 0, 28, 10);
    expect(pts).toHaveLength(11);
    expect(pts[0]!.potency).toBe(1);
    expect(pts[10]!.potency).toBeLessThan(1);
  });

  it('time axis is monotonic', () => {
    const pts = buildDegradationCurve('bpc-157', 'reconstituted_fridge', 1000, 14, 20);
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i]!.t).toBeGreaterThan(pts[i - 1]!.t);
    }
  });
});

describe('variabilityFraction', () => {
  it('starts at 30% at day 0', () => {
    expect(variabilityFraction(0)).toBeCloseTo(0.30, 3);
  });

  it('grows over time', () => {
    const d0 = variabilityFraction(0);
    const d14 = variabilityFraction(14);
    const d28 = variabilityFraction(28);
    expect(d14).toBeGreaterThan(d0);
    expect(d28).toBeGreaterThan(d14);
  });

  it('caps somewhere around 55% for long cycles', () => {
    expect(variabilityFraction(100)).toBeLessThanOrEqual(0.6);
  });
});
