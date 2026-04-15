import { describe, it, expect } from 'vitest';
import {
  BIOMARKERS,
  PANELS,
  biomarkerStatus,
  computeHomaIr,
} from '../src/biomarkers';

describe('BIOMARKERS catalog', () => {
  it('every biomarker has at least one category', () => {
    for (const def of Object.values(BIOMARKERS)) {
      expect(def.categories.length).toBeGreaterThan(0);
    }
  });

  it('every biomarker has low < high', () => {
    for (const def of Object.values(BIOMARKERS)) {
      expect(def.low).toBeLessThan(def.high);
    }
  });
});

describe('PANELS', () => {
  it('each panel lists only known biomarker keys', () => {
    for (const panel of Object.values(PANELS)) {
      for (const k of panel.recommended) {
        expect(BIOMARKERS[k]).toBeDefined();
      }
    }
  });

  it('GLP-1 panel includes lipase (pancreatitis surveillance)', () => {
    expect(PANELS.glp1.recommended).toContain('lipase');
  });

  it('GH panel includes IGF-1', () => {
    expect(PANELS.gh.recommended).toContain('igf_1');
  });

  it('Healing panel includes PSA for angiogenesis safety', () => {
    expect(PANELS.healing.recommended).toContain('psa');
  });
});

describe('biomarkerStatus', () => {
  it('returns in_range for mid-range IGF-1', () => {
    expect(biomarkerStatus({ key: 'igf_1', value: 180, measuredAt: '' })).toBe('in_range');
  });

  it('returns high for above-range IGF-1', () => {
    expect(biomarkerStatus({ key: 'igf_1', value: 300, measuredAt: '' })).toBe('high');
  });

  it('returns critical for IGF-1 > 1.5× upper bound', () => {
    expect(biomarkerStatus({ key: 'igf_1', value: 500, measuredAt: '' })).toBe('critical');
  });

  it('returns low for below-range', () => {
    expect(biomarkerStatus({ key: 'hba1c', value: 3.5, measuredAt: '' })).toBe('low');
  });
});

describe('computeHomaIr', () => {
  it('normal insulin and glucose give HOMA-IR < 2', () => {
    // Insulin 5, glucose 85 → (5*85)/405 = 1.05
    expect(computeHomaIr(5, 85)).toBeCloseTo(1.05, 2);
  });

  it('high insulin reflects insulin resistance', () => {
    // Insulin 20, glucose 100 → (20*100)/405 = 4.94
    const homa = computeHomaIr(20, 100);
    expect(homa).toBeGreaterThan(2.9); // IR threshold
  });
});
