import { describe, it, expect } from 'vitest';
import {
  BLENDS,
  expandBlendLogs,
  computePkSeries,
  type PkInjection,
} from '../src/pharmacokinetics';
import type { InjectionLog } from '../src/types';

const HOUR = 3_600_000;

function log(overrides: Partial<InjectionLog>): InjectionLog {
  return {
    id: 1,
    peptide_ref_id: 1,
    peptide_name: 'BPC-157',
    injected_at: new Date('2026-01-01T12:00:00Z').toISOString(),
    dose_mcg: 500,
    dose_ml: null,
    injection_site: null,
    notes: null,
    created_at: new Date('2026-01-01T12:00:00Z').toISOString(),
    deleted_at: null,
    ...overrides,
  };
}

describe('expandBlendLogs', () => {
  it('passes a single-peptide log through with matching half-life', () => {
    const logs = [log({ peptide_name: 'BPC-157', dose_mcg: 300 })];
    const result = expandBlendLogs(logs, { 'BPC-157': 4 });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      peptideName: 'BPC-157',
      doseMcg: 300,
      halfLifeHours: 4,
    });
  });

  it('drops logs with unknown half-life', () => {
    const logs = [log({ peptide_name: 'Unknown', dose_mcg: 100 })];
    expect(expandBlendLogs(logs, {})).toHaveLength(0);
  });

  it('ignores soft-deleted logs', () => {
    const logs = [log({ deleted_at: '2026-01-02T00:00:00Z' })];
    expect(expandBlendLogs(logs, { 'BPC-157': 4 })).toHaveLength(0);
  });

  it('decomposes Glow blend into 3 components by ratio', () => {
    const logs = [log({ peptide_name: 'Glow (GHK-Cu / TB-500 / BPC-157)', dose_mcg: 70 })];
    const result = expandBlendLogs(logs, {});
    expect(result).toHaveLength(3);
    const byName = Object.fromEntries(result.map((r) => [r.peptideName, r]));
    expect(byName['GHK-Cu']?.doseMcg).toBeCloseTo(50, 5);
    expect(byName['TB-500']?.doseMcg).toBeCloseTo(10, 5);
    expect(byName['BPC-157']?.doseMcg).toBeCloseTo(10, 5);
    expect(byName['GHK-Cu']?.halfLifeHours).toBe(0.5);
    expect(byName['TB-500']?.halfLifeHours).toBe(24);
    expect(byName['BPC-157']?.halfLifeHours).toBe(4);
  });

  it('preserves injection timestamps in blend decomposition', () => {
    const t = '2026-03-15T08:30:00Z';
    const logs = [log({ peptide_name: 'Glow Blend', dose_mcg: 140, injected_at: t })];
    const result = expandBlendLogs(logs, {});
    for (const r of result) {
      expect(r.injectedAt).toBe(new Date(t).getTime());
    }
  });
});

describe('computePkSeries', () => {
  const t0 = new Date('2026-01-01T12:00:00Z').getTime();

  it('returns one series per distinct peptide', () => {
    const injections: PkInjection[] = [
      { peptideName: 'A', injectedAt: t0, doseMcg: 100, halfLifeHours: 4 },
      { peptideName: 'B', injectedAt: t0, doseMcg: 100, halfLifeHours: 4 },
    ];
    const series = computePkSeries(injections, t0, t0 + 24 * HOUR, 24);
    expect(series).toHaveLength(2);
    expect(series.map((s) => s.peptideName).sort()).toEqual(['A', 'B']);
  });

  it('assigns distinct colors to distinct peptides', () => {
    const injections: PkInjection[] = [
      { peptideName: 'A', injectedAt: t0, doseMcg: 100, halfLifeHours: 4 },
      { peptideName: 'B', injectedAt: t0, doseMcg: 100, halfLifeHours: 4 },
    ];
    const series = computePkSeries(injections, t0, t0 + 4 * HOUR, 4);
    expect(series[0]!.color).not.toBe(series[1]!.color);
  });

  it('models exponential decay: concentration at one half-life equals half the dose', () => {
    const injections: PkInjection[] = [
      { peptideName: 'BPC-157', injectedAt: t0, doseMcg: 1000, halfLifeHours: 4 },
    ];
    const series = computePkSeries(injections, t0, t0 + 8 * HOUR, 8);
    const at4h = series[0]!.points.find((p) => Math.abs(p.t - (t0 + 4 * HOUR)) < 1);
    expect(at4h?.mcg).toBeCloseTo(500, 1);
    const at8h = series[0]!.points.find((p) => Math.abs(p.t - (t0 + 8 * HOUR)) < 1);
    expect(at8h?.mcg).toBeCloseTo(250, 1);
  });

  it('is zero before injection time', () => {
    const injections: PkInjection[] = [
      { peptideName: 'BPC-157', injectedAt: t0 + 12 * HOUR, doseMcg: 500, halfLifeHours: 4 },
    ];
    const series = computePkSeries(injections, t0, t0 + 24 * HOUR, 24);
    const beforeInjection = series[0]!.points.filter((p) => p.t < t0 + 12 * HOUR);
    for (const p of beforeInjection) expect(p.mcg).toBe(0);
  });

  it('superimposes multiple doses of the same peptide', () => {
    const injections: PkInjection[] = [
      { peptideName: 'BPC-157', injectedAt: t0, doseMcg: 1000, halfLifeHours: 4 },
      { peptideName: 'BPC-157', injectedAt: t0 + 4 * HOUR, doseMcg: 1000, halfLifeHours: 4 },
    ];
    const series = computePkSeries(injections, t0, t0 + 8 * HOUR, 8);
    const at4h = series[0]!.points.find((p) => Math.abs(p.t - (t0 + 4 * HOUR)) < 1);
    // At 4h: first dose has decayed to 500, second just injected = 1000. Total = 1500.
    expect(at4h?.mcg).toBeCloseTo(1500, 0);
  });

  it('covers the full time range with steps+1 points', () => {
    const injections: PkInjection[] = [
      { peptideName: 'BPC-157', injectedAt: t0, doseMcg: 500, halfLifeHours: 4 },
    ];
    const series = computePkSeries(injections, t0, t0 + 24 * HOUR, 60);
    expect(series[0]!.points).toHaveLength(61);
    expect(series[0]!.points[0]!.t).toBe(t0);
    expect(series[0]!.points.at(-1)!.t).toBe(t0 + 24 * HOUR);
  });

  it('returns empty array when no injections', () => {
    expect(computePkSeries([], t0, t0 + HOUR, 10)).toEqual([]);
  });
});

describe('BLENDS registry', () => {
  it('defines Glow with the 50:10:10 ratio', () => {
    const glow = BLENDS['glow'];
    expect(glow).toBeDefined();
    const byName = Object.fromEntries(glow!.map((c) => [c.name, c.ratio]));
    expect(byName['GHK-Cu']).toBe(50);
    expect(byName['TB-500']).toBe(10);
    expect(byName['BPC-157']).toBe(10);
  });
});
