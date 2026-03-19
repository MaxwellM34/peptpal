import { describe, it, expect } from 'vitest';
import { detectSymptomPatterns } from '../src/patternDetection';

const peptideA = {
  peptideId: 'bpc-157',
  peptideName: 'BPC-157',
};

function hoursAfter(base: Date, hours: number): Date {
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

describe('detectSymptomPatterns', () => {
  it('detects a pattern when symptom appears 3+ times after injections', () => {
    const base = new Date('2024-01-01T08:00:00Z');
    const injections = [
      { ...peptideA, injectedAt: base },
      { ...peptideA, injectedAt: hoursAfter(base, 24) },
      { ...peptideA, injectedAt: hoursAfter(base, 48) },
    ];
    const symptoms = [
      { symptom: 'nausea', occurredAt: hoursAfter(base, 1) },
      { symptom: 'nausea', occurredAt: hoursAfter(base, 25) },
      { symptom: 'nausea', occurredAt: hoursAfter(base, 49) },
    ];
    const patterns = detectSymptomPatterns(injections, symptoms);
    expect(patterns).toHaveLength(1);
    expect(patterns[0]?.peptideName).toBe('BPC-157');
    expect(patterns[0]?.symptom).toBe('nausea');
    expect(patterns[0]?.occurrences).toBe(3);
  });

  it('does not flag a pattern with only 2 occurrences', () => {
    const base = new Date('2024-01-01T08:00:00Z');
    const injections = [
      { ...peptideA, injectedAt: base },
      { ...peptideA, injectedAt: hoursAfter(base, 24) },
    ];
    const symptoms = [
      { symptom: 'headache', occurredAt: hoursAfter(base, 1) },
      { symptom: 'headache', occurredAt: hoursAfter(base, 25) },
    ];
    const patterns = detectSymptomPatterns(injections, symptoms);
    expect(patterns).toHaveLength(0);
  });

  it('does not count symptoms outside the 48h window', () => {
    const base = new Date('2024-01-01T08:00:00Z');
    const injections = [{ ...peptideA, injectedAt: base }];
    const symptoms = [
      { symptom: 'fatigue', occurredAt: hoursAfter(base, 49) }, // outside window
      { symptom: 'fatigue', occurredAt: hoursAfter(base, 50) },
      { symptom: 'fatigue', occurredAt: hoursAfter(base, 51) },
    ];
    const patterns = detectSymptomPatterns(injections, symptoms);
    expect(patterns).toHaveLength(0);
  });

  it('handles empty arrays gracefully', () => {
    expect(detectSymptomPatterns([], [])).toEqual([]);
    expect(detectSymptomPatterns([{ ...peptideA, injectedAt: new Date() }], [])).toEqual([]);
  });

  it('does not count symptoms before the injection', () => {
    const base = new Date('2024-01-05T08:00:00Z');
    const injections = [
      { ...peptideA, injectedAt: base },
      { ...peptideA, injectedAt: hoursAfter(base, 24) },
      { ...peptideA, injectedAt: hoursAfter(base, 48) },
    ];
    const symptoms = [
      { symptom: 'rash', occurredAt: new Date('2024-01-04T08:00:00Z') }, // before all injections
      { symptom: 'rash', occurredAt: new Date('2024-01-03T08:00:00Z') },
      { symptom: 'rash', occurredAt: new Date('2024-01-02T08:00:00Z') },
    ];
    const patterns = detectSymptomPatterns(injections, symptoms);
    expect(patterns).toHaveLength(0);
  });
});
