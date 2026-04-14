import type { InjectionLog } from './types';

export interface BlendComponent {
  slug: string;
  name: string;
  halfLifeHours: number;
  ratio: number;
}

export const BLENDS: Record<string, BlendComponent[]> = {
  glow: [
    { slug: 'ghk-cu-injectable', name: 'GHK-Cu', halfLifeHours: 0.5, ratio: 50 },
    { slug: 'tb-500', name: 'TB-500', halfLifeHours: 24, ratio: 10 },
    { slug: 'bpc-157', name: 'BPC-157', halfLifeHours: 4, ratio: 10 },
  ],
};

export interface PkInjection {
  peptideName: string;
  injectedAt: number;
  doseMcg: number;
  halfLifeHours: number;
}

export interface PkPoint {
  t: number;
  mcg: number;
}

export interface PkSeries {
  peptideName: string;
  color: string;
  halfLifeHours: number;
  points: PkPoint[];
}

export interface PkSeriesStats {
  peptideName: string;
  color: string;
  halfLifeHours: number;
  peakMcg: number;
  peakAt: number;
  currentMcg: number;
  lastInjectedAt: number | null;
  halfLivesSinceLastDose: number | null;
}

export function computeSeriesStats(series: PkSeries, injections: PkInjection[], now: number): PkSeriesStats {
  const mine = injections.filter((i) => i.peptideName === series.peptideName);
  const peak = series.points.reduce(
    (best, p) => (p.mcg > best.mcg ? p : best),
    series.points[0] ?? { t: now, mcg: 0 },
  );
  const current = series.points.reduce(
    (best, p) => (Math.abs(p.t - now) < Math.abs(best.t - now) ? p : best),
    series.points[0] ?? { t: now, mcg: 0 },
  );
  const lastInjectedAt = mine.length
    ? Math.max(...mine.map((i) => i.injectedAt))
    : null;
  const halfLivesSinceLastDose =
    lastInjectedAt != null
      ? (now - lastInjectedAt) / 3_600_000 / series.halfLifeHours
      : null;

  return {
    peptideName: series.peptideName,
    color: series.color,
    halfLifeHours: series.halfLifeHours,
    peakMcg: peak.mcg,
    peakAt: peak.t,
    currentMcg: current.mcg,
    lastInjectedAt,
    halfLivesSinceLastDose,
  };
}

const SERIES_COLORS = [
  '#3b82f6',
  '#f97316',
  '#10b981',
  '#ec4899',
  '#eab308',
  '#a855f7',
  '#ef4444',
  '#14b8a6',
  '#8b5cf6',
  '#06b6d4',
];

export function expandBlendLogs(
  logs: InjectionLog[],
  peptideHalfLives: Record<string, number | null>,
): PkInjection[] {
  const result: PkInjection[] = [];
  for (const log of logs) {
    if (log.deleted_at) continue;
    const slug = slugFromName(log.peptide_name);
    const injectedAt = new Date(log.injected_at).getTime();

    const blend = BLENDS[slug];
    if (blend) {
      const totalRatio = blend.reduce((s, c) => s + c.ratio, 0);
      for (const c of blend) {
        result.push({
          peptideName: c.name,
          injectedAt,
          doseMcg: (log.dose_mcg * c.ratio) / totalRatio,
          halfLifeHours: c.halfLifeHours,
        });
      }
      continue;
    }

    const hl = peptideHalfLives[log.peptide_name] ?? peptideHalfLives[slug];
    if (hl == null) continue;
    result.push({
      peptideName: log.peptide_name,
      injectedAt,
      doseMcg: log.dose_mcg,
      halfLifeHours: hl,
    });
  }
  return result;
}

function slugFromName(name: string): string {
  return name.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim().replace(/[^a-z0-9]+/g, '-');
}

export function computePkSeries(
  injections: PkInjection[],
  startMs: number,
  endMs: number,
  steps: number = 120,
): PkSeries[] {
  const byPeptide = new Map<string, PkInjection[]>();
  for (const inj of injections) {
    const list = byPeptide.get(inj.peptideName) ?? [];
    list.push(inj);
    byPeptide.set(inj.peptideName, list);
  }

  const series: PkSeries[] = [];
  const names = [...byPeptide.keys()].sort();
  const span = endMs - startMs;
  const dt = span / steps;

  names.forEach((name, idx) => {
    const injs = byPeptide.get(name)!;
    const points: PkPoint[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = startMs + i * dt;
      let total = 0;
      for (const inj of injs) {
        if (t < inj.injectedAt) continue;
        const elapsedHours = (t - inj.injectedAt) / 3_600_000;
        total += inj.doseMcg * Math.pow(0.5, elapsedHours / inj.halfLifeHours);
      }
      points.push({ t, mcg: total });
    }
    series.push({
      peptideName: name,
      color: SERIES_COLORS[idx % SERIES_COLORS.length]!,
      halfLifeHours: injs[0]!.halfLifeHours,
      points,
    });
  });

  return series;
}
