import { describe, it, expect } from 'vitest';
import { reconstitutionCalc, reconstitutionCalcByDose } from '../src/reconstitution';

describe('reconstitutionCalc', () => {
  it('calculates BAC water for a 5mg vial at 500 mcg/mL', () => {
    const result = reconstitutionCalc({ vialSizeMg: 5, desiredConcentrationMcgPerMl: 500 });
    expect(result.bacWaterMl).toBe(10); // 5000mcg / 500 = 10mL
    expect(result.totalMcg).toBe(5000);
    expect(result.dosesPerVial).toBe(10);
    expect(result.mlPerDose).toBe(1);
    expect(result.lowVolumeWarning).toBe(false);
  });

  it('calculates BAC water for a 2mg vial at 1000 mcg/mL', () => {
    const result = reconstitutionCalc({ vialSizeMg: 2, desiredConcentrationMcgPerMl: 1000 });
    expect(result.bacWaterMl).toBe(2); // 2000 / 1000 = 2mL
    expect(result.totalMcg).toBe(2000);
  });

  it('calculates for a 10mg vial at 200 mcg/mL', () => {
    const result = reconstitutionCalc({ vialSizeMg: 10, desiredConcentrationMcgPerMl: 200 });
    expect(result.bacWaterMl).toBe(50); // 10000 / 200 = 50mL
    expect(result.totalMcg).toBe(10000);
  });

  it('throws for zero vial size', () => {
    expect(() => reconstitutionCalc({ vialSizeMg: 0, desiredConcentrationMcgPerMl: 500 })).toThrow(
      'vialSizeMg must be positive',
    );
  });

  it('throws for zero concentration', () => {
    expect(() => reconstitutionCalc({ vialSizeMg: 5, desiredConcentrationMcgPerMl: 0 })).toThrow(
      'desiredConcentrationMcgPerMl must be positive',
    );
  });

  it('throws for negative values', () => {
    expect(() =>
      reconstitutionCalc({ vialSizeMg: -1, desiredConcentrationMcgPerMl: 500 }),
    ).toThrow();
  });
});

describe('reconstitutionCalcByDose', () => {
  it('calculates from desired dose and volume', () => {
    // 5mg vial, 250mcg per 0.5mL injection → concentration = 500 mcg/mL
    const result = reconstitutionCalcByDose({
      vialSizeMg: 5,
      desiredDoseMcg: 250,
      desiredVolumeMl: 0.5,
    });
    expect(result.concentrationMcgPerMl).toBe(500);
    expect(result.bacWaterMl).toBe(10); // 5000/500 = 10
    expect(result.dosesPerVial).toBe(20); // 5000/250 = 20
    expect(result.mlPerDose).toBe(0.5);
    expect(result.lowVolumeWarning).toBe(false);
  });

  it('warns when volume per dose is too small', () => {
    // 5mg vial, 5000mcg per 0.01mL → very concentrated
    const result = reconstitutionCalcByDose({
      vialSizeMg: 5,
      desiredDoseMcg: 500,
      desiredVolumeMl: 0.01, // 0.01mL < 0.05mL threshold
    });
    expect(result.lowVolumeWarning).toBe(true);
  });

  it('throws for zero dose', () => {
    expect(() =>
      reconstitutionCalcByDose({ vialSizeMg: 5, desiredDoseMcg: 0, desiredVolumeMl: 0.5 }),
    ).toThrow('desiredDoseMcg must be positive');
  });

  it('throws for zero volume', () => {
    expect(() =>
      reconstitutionCalcByDose({ vialSizeMg: 5, desiredDoseMcg: 250, desiredVolumeMl: 0 }),
    ).toThrow('desiredVolumeMl must be positive');
  });
});
