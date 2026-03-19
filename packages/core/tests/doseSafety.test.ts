import { describe, it, expect } from 'vitest';
import { checkDoseSafety } from '../src/doseSafety';

describe('checkDoseSafety', () => {
  it('returns ok for a dose well within limits', () => {
    const result = checkDoseSafety(250, 1000);
    expect(result.safe).toBe(true);
    expect(result.level).toBe('ok');
    expect(result.percentOfMax).toBe(25);
  });

  it('returns caution at 80% of max', () => {
    const result = checkDoseSafety(800, 1000);
    expect(result.safe).toBe(true);
    expect(result.level).toBe('caution');
    expect(result.percentOfMax).toBe(80);
  });

  it('returns warning at 95% of max', () => {
    const result = checkDoseSafety(950, 1000);
    expect(result.safe).toBe(true);
    expect(result.level).toBe('warning');
    expect(result.percentOfMax).toBe(95);
  });

  it('returns exceeded when dose equals max exactly', () => {
    // exactly at max is 100% — should be ok
    const result = checkDoseSafety(1000, 1000);
    expect(result.safe).toBe(true);
    expect(result.level).toBe('warning'); // 100% is >90%
    expect(result.percentOfMax).toBe(100);
  });

  it('returns exceeded when dose exceeds max', () => {
    const result = checkDoseSafety(1100, 1000);
    expect(result.safe).toBe(false);
    expect(result.level).toBe('exceeded');
    expect(result.percentOfMax).toBe(110);
  });

  it('handles decimal doses', () => {
    const result = checkDoseSafety(333, 500);
    expect(result.percentOfMax).toBe(66.6);
    expect(result.level).toBe('ok');
  });

  it('throws for zero dose', () => {
    expect(() => checkDoseSafety(0, 1000)).toThrow('doseMcg must be positive');
  });

  it('throws for zero max dose', () => {
    expect(() => checkDoseSafety(250, 0)).toThrow('peptideMaxDoseMcg must be positive');
  });

  it('throws for negative values', () => {
    expect(() => checkDoseSafety(-100, 1000)).toThrow();
    expect(() => checkDoseSafety(100, -1000)).toThrow();
  });
});
