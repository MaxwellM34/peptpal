import { describe, it, expect } from 'vitest';
import { estimateRemainingDoses, calcDrawVolume, suggestExpiryDate } from '../src/inventory';

describe('estimateRemainingDoses', () => {
  it('calculates remaining doses correctly', () => {
    // 500 mcg/mL × 2 mL = 1000 mcg remaining / 250 mcg per dose = 4 doses
    expect(estimateRemainingDoses(500, 2, 250)).toBe(4);
  });

  it('floors the result', () => {
    // 500 × 1.5 = 750 mcg / 250 = 3 (not 3.something)
    expect(estimateRemainingDoses(500, 1.5, 250)).toBe(3);
  });

  it('returns 0 when volume is 0', () => {
    expect(estimateRemainingDoses(500, 0, 250)).toBe(0);
  });

  it('throws for invalid inputs', () => {
    expect(() => estimateRemainingDoses(0, 2, 250)).toThrow();
    expect(() => estimateRemainingDoses(500, -1, 250)).toThrow();
    expect(() => estimateRemainingDoses(500, 2, 0)).toThrow();
  });
});

describe('calcDrawVolume', () => {
  it('calculates draw volume', () => {
    // 250 mcg / 500 mcg/mL = 0.5 mL
    expect(calcDrawVolume(250, 500)).toBe(0.5);
  });

  it('handles small volumes with precision', () => {
    // 100 mcg / 1000 mcg/mL = 0.1 mL
    expect(calcDrawVolume(100, 1000)).toBe(0.1);
  });

  it('throws for invalid inputs', () => {
    expect(() => calcDrawVolume(0, 500)).toThrow();
    expect(() => calcDrawVolume(250, 0)).toThrow();
  });
});

describe('suggestExpiryDate', () => {
  it('returns 30 days for bpc-157 in fridge', () => {
    const recon = new Date('2024-01-01');
    const expiry = suggestExpiryDate('bpc-157', recon, 'fridge');
    expect(expiry.toISOString().slice(0, 10)).toBe('2024-01-31');
  });

  it('returns 180 days for bpc-157 in freezer', () => {
    const recon = new Date('2024-01-01');
    const expiry = suggestExpiryDate('bpc-157', recon, 'freezer');
    expect(expiry.toISOString().slice(0, 10)).toBe('2024-06-28'); // 180 days
  });

  it('uses default 30 days for unknown peptides', () => {
    const recon = new Date('2024-01-01');
    const expiry = suggestExpiryDate('unknown-peptide', recon, 'fridge');
    expect(expiry.toISOString().slice(0, 10)).toBe('2024-01-31');
  });

  it('defaults to fridge storage', () => {
    const recon = new Date('2024-01-01');
    const expiry = suggestExpiryDate('bpc-157', recon);
    expect(expiry.toISOString().slice(0, 10)).toBe('2024-01-31');
  });
});
