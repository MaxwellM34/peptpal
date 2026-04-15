/**
 * Predict the user's next due dose from active protocols + recent injection
 * history. Simple heuristic: for each active protocol item, interval =
 * 7 days / doses_per_week. Next dose = last injection of that peptide +
 * interval. Returns the soonest upcoming dose across all items.
 */
import { getInjectionLogs } from '../db/injectionLog';
import { getActiveProtocolItems, type ProtocolItemRow } from '../db/protocols';

export interface NextDose {
  peptideName: string;
  peptideSlug: string;
  doseMcg: number;
  targetVolumeMl: number;
  dueAt: Date;
  /** true if the user is already past due. */
  overdue: boolean;
  protocolName: string;
}

export async function predictNextDose(): Promise<NextDose | null> {
  const [items, logs] = await Promise.all([
    getActiveProtocolItems(),
    getInjectionLogs({ limit: 200 }),
  ]);
  if (items.length === 0) return null;

  // Most recent injection per peptide name.
  const lastByPeptide = new Map<string, Date>();
  for (const log of logs) {
    const name = log.peptide_name;
    const t = new Date(log.injected_at);
    const prev = lastByPeptide.get(name);
    if (!prev || t > prev) lastByPeptide.set(name, t);
  }

  const now = new Date();
  let soonest: NextDose | null = null;
  for (const item of items) {
    const dosesPerWeek = Math.max(0.1, item.doses_per_week);
    const intervalMs = (7 * 86_400_000) / dosesPerWeek;
    const last = lastByPeptide.get(item.peptide_name);
    const dueAt = last ? new Date(last.getTime() + intervalMs) : now;
    const overdue = dueAt.getTime() < now.getTime();
    const candidate: NextDose = {
      peptideName: item.peptide_name,
      peptideSlug: item.peptide_slug ?? '',
      doseMcg: item.dose_mcg,
      targetVolumeMl: item.target_volume_ml,
      dueAt,
      overdue,
      protocolName: (item as ProtocolItemRow & { protocolName: string }).protocolName,
    };
    if (!soonest || dueAt < soonest.dueAt) {
      soonest = candidate;
    }
  }
  return soonest;
}

export function formatTimeUntil(due: Date): string {
  const diff = due.getTime() - Date.now();
  const absMin = Math.abs(diff) / 60_000;
  if (absMin < 60) return `${Math.round(absMin)} min${diff < 0 ? ' ago' : ''}`;
  const absHr = absMin / 60;
  if (absHr < 24) return `${Math.round(absHr)}h${diff < 0 ? ' ago' : ''}`;
  const absDay = absHr / 24;
  return `${Math.round(absDay)}d${diff < 0 ? ' ago' : ''}`;
}
