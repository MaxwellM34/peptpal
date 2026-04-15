import { describe, it, expect } from 'vitest';
import { solveRecipe, detectProtocolConflicts, mlToUnits } from '../src/protocolBuilder';

describe('mlToUnits', () => {
  it('converts mL to insulin units on U-100 scale', () => {
    expect(mlToUnits(0.1)).toBe(10);
    expect(mlToUnits(0.3)).toBe(30);
    expect(mlToUnits(1.0)).toBe(100);
  });
});

describe('solveRecipe', () => {
  it('solves BPC-157 250 mcg at 0.10 mL target on a 5 mg vial', () => {
    const r = solveRecipe({
      peptideSlug: 'bpc-157',
      peptideName: 'BPC-157',
      doseMcg: 250,
      dosesPerWeek: 7,
      targetVolumeMl: 0.10,
      vialSizeMg: 5,
    });
    // 5000 mcg total / (250 mcg / 0.10 mL = 2500 mcg/mL) = 2.0 mL BAC water
    expect(r.bacWaterMl).toBeCloseTo(2.0, 1);
    expect(r.concentrationMcgPerMl).toBeCloseTo(2500, 0);
    expect(r.actualVolumeMl).toBeCloseTo(0.10, 2);
    expect(r.actualUnits).toBeCloseTo(10, 0);
    expect(r.warnings).toHaveLength(0);
  });

  it('clamps BAC water upward when needed (retatrutide tiny dose)', () => {
    // Retatrutide 500 mcg, 10 mg vial, target 0.10 mL → would need 2 mL BAC water
    const r = solveRecipe({
      peptideSlug: 'retatrutide',
      peptideName: 'Retatrutide',
      doseMcg: 500,
      dosesPerWeek: 1,
      targetVolumeMl: 0.10,
      vialSizeMg: 10,
    });
    expect(r.bacWaterMl).toBeCloseTo(2.0, 1);
    expect(r.actualVolumeMl).toBeCloseTo(0.10, 2);
  });

  it('warns and clamps when target volume too tiny to measure', () => {
    // Huge dose with tiny target → requires <0.5 mL BAC water which is clamped
    const r = solveRecipe({
      peptideSlug: 'bpc-157',
      peptideName: 'BPC-157',
      doseMcg: 5000, // 5 mg dose
      dosesPerWeek: 1,
      targetVolumeMl: 0.05, // ridiculous
      vialSizeMg: 5,
    });
    // 5000 / 0.05 = 100000 mcg/mL required conc. 5000/100000 = 0.05 mL BAC — clamped to 0.5
    expect(r.bacWaterMl).toBe(0.5);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('warns when BAC water would exceed 5 mL', () => {
    const r = solveRecipe({
      peptideSlug: 'bpc-157',
      peptideName: 'BPC-157',
      doseMcg: 50, // very small dose
      dosesPerWeek: 7,
      targetVolumeMl: 1.0, // huge target volume
      vialSizeMg: 5,
    });
    // 5000/50 = 100 mcg/mL; 5000/100 = 50 mL BAC water. Clamp to 5.
    expect(r.bacWaterMl).toBe(5);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('computes dosesPerVial correctly', () => {
    const r = solveRecipe({
      peptideSlug: 'bpc-157',
      peptideName: 'BPC-157',
      doseMcg: 250,
      dosesPerWeek: 7,
      targetVolumeMl: 0.10,
      vialSizeMg: 5,
    });
    // 5000 mcg / 250 = 20 doses
    expect(r.dosesPerVial).toBe(20);
  });
});

describe('detectProtocolConflicts', () => {
  const existing = [
    {
      peptideSlug: 'bpc-157',
      peptideName: 'BPC-157',
      doseMcg: 250,
      dosesPerWeek: 7,
      targetVolumeMl: 0.10,
      vialSizeMg: 5,
      protocolName: 'Healing Stack',
    },
  ];

  it('flags duplicate peptide', () => {
    const conflicts = detectProtocolConflicts(
      [
        {
          peptideSlug: 'bpc-157',
          peptideName: 'BPC-157',
          doseMcg: 300,
          dosesPerWeek: 7,
          targetVolumeMl: 0.10,
          vialSizeMg: 5,
        },
      ],
      existing,
    );
    expect(conflicts.some((c) => c.kind === 'duplicate')).toBe(true);
  });

  it('flags heavy injection volume when combined >1 mL/day', () => {
    // Each item is 0.5 mL × 7/wk ≈ 0.5 mL/day; two items = 1.0 mL/day (at threshold, no flag)
    // Push over with a third
    const conflicts = detectProtocolConflicts(
      [
        {
          peptideSlug: 'ipa',
          peptideName: 'Ipa',
          doseMcg: 200,
          dosesPerWeek: 14,
          targetVolumeMl: 0.3,
          vialSizeMg: 5,
        },
      ],
      [
        {
          peptideSlug: 'cjc',
          peptideName: 'CJC',
          doseMcg: 100,
          dosesPerWeek: 14,
          targetVolumeMl: 0.3,
          vialSizeMg: 5,
          protocolName: 'Growth',
        },
        {
          peptideSlug: 'tb500',
          peptideName: 'TB-500',
          doseMcg: 2500,
          dosesPerWeek: 2,
          targetVolumeMl: 1.0,
          vialSizeMg: 10,
          protocolName: 'Healing',
        },
      ],
    );
    expect(conflicts.some((c) => c.kind === 'volume')).toBe(true);
  });

  it('returns no conflicts for compatible protocols', () => {
    const conflicts = detectProtocolConflicts(
      [
        {
          peptideSlug: 'selank',
          peptideName: 'Selank',
          doseMcg: 300,
          dosesPerWeek: 7,
          targetVolumeMl: 0.10,
          vialSizeMg: 5,
        },
      ],
      existing,
    );
    expect(conflicts).toHaveLength(0);
  });
});
