/**
 * Dashboard alerts — surfaces things the user needs to act on without
 * hunting through tabs.
 *
 * Types:
 *  - degradation: reconstituted vials below the configured potency threshold
 *  - stale_labs: >N days since last biomarker reading while on an active
 *    protocol in a category that warrants surveillance
 *  - overdue_cycle: GH secretagogue / other cycling peptide past its
 *    recommended maxWeeksOn
 *  - counterfeit: inventory flagged as subpotent (counterfeit_flagged)
 */
import {
  remainingPotency,
  storageStateFromVial,
  getCycleMetadata,
  computeCycleStatus,
  PANELS,
  type BiomarkerCategory,
  type BiomarkerKey,
} from '@peptpal/core';
import type { InventoryItem } from '@peptpal/core';
import { getInventoryItems } from '../db/inventory';
import { getBiomarkerReadings } from '../db/biomarkers';
import { getActiveProtocolItems } from '../db/protocols';
import { getSchedules } from '../db/schedules';

export type DashboardAlertKind =
  | 'degradation'
  | 'stale_labs'
  | 'overdue_cycle'
  | 'counterfeit';

export interface DashboardAlert {
  kind: DashboardAlertKind;
  severity: 'warning' | 'danger';
  title: string;
  body: string;
  /** Optional deeplink for "tap to fix". */
  route?: string;
}

const DEGRADATION_WARN = 0.70;
const DEGRADATION_DANGER = 0.55;
const STALE_LAB_DAYS = 90;

function slugFromName(name: string): string {
  return name.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim().replace(/[^a-z0-9]+/g, '-');
}

function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return (Date.now() - new Date(iso).getTime()) / 86_400_000;
}

export async function computeDashboardAlerts(): Promise<DashboardAlert[]> {
  const [inventory, protocolItems, schedules] = await Promise.all([
    getInventoryItems(),
    getActiveProtocolItems(),
    getSchedules(),
  ]);

  const alerts: DashboardAlert[] = [];

  // Degradation alerts.
  for (const item of inventory) {
    if (item.deleted_at) continue;
    if (!item.reconstituted) continue;
    const daysRecon = daysSince(item.opened_at);
    if (daysRecon == null) continue;
    const slug = slugFromName(item.peptide_name);
    const state = storageStateFromVial(item);
    const potency = remainingPotency(slug, state, daysRecon);
    if (potency < DEGRADATION_DANGER) {
      alerts.push({
        kind: 'degradation',
        severity: 'danger',
        title: `${item.peptide_name} below 55% potency`,
        body: `Vial ${(item as InventoryItem & { label_number?: number | null }).label_number ? `#${(item as InventoryItem & { label_number?: number | null }).label_number}` : ''} is estimated at ${Math.round(potency * 100)}%. Reconstitute a fresher vial before your next dose.`,
        route: '/(tabs)/inventory',
      });
    } else if (potency < DEGRADATION_WARN) {
      alerts.push({
        kind: 'degradation',
        severity: 'warning',
        title: `${item.peptide_name} aging`,
        body: `Vial ${(item as InventoryItem & { label_number?: number | null }).label_number ? `#${(item as InventoryItem & { label_number?: number | null }).label_number}` : ''} at ~${Math.round(potency * 100)}% potency. Plan to swap within a week.`,
        route: '/(tabs)/inventory',
      });
    }

    if ((item as InventoryItem & { counterfeit_flagged?: number | boolean | null }).counterfeit_flagged) {
      alerts.push({
        kind: 'counterfeit',
        severity: 'danger',
        title: `${item.peptide_name} flagged as subpotent`,
        body: 'COA purity below 80%. Do not use this batch. Consider reporting to the vendor and disposing.',
        route: '/(tabs)/inventory',
      });
    }
  }

  // Overdue cycles (from schedules — protocol items feed into schedules via cycling planner).
  for (const s of schedules) {
    if (s.deleted_at) continue;
    const meta = getCycleMetadata(slugFromName(s.peptide_name));
    const status = computeCycleStatus(s.start_date, meta);
    if (status.status === 'overdue') {
      alerts.push({
        kind: 'overdue_cycle',
        severity: 'danger',
        title: `${s.peptide_name} overdue for break`,
        body: status.message,
        route: '/(tabs)/schedule/cycles',
      });
    } else if (status.status === 'warning') {
      alerts.push({
        kind: 'overdue_cycle',
        severity: 'warning',
        title: `${s.peptide_name} approaching break`,
        body: status.message,
        route: '/(tabs)/schedule/cycles',
      });
    }
  }

  // Stale labs — check the biomarker categories implied by active protocols.
  if (protocolItems.length > 0) {
    const categoriesOnProtocol = new Set<BiomarkerCategory>();
    for (const p of protocolItems) {
      const slug = p.peptide_slug ?? slugFromName(p.peptide_name);
      if (['cjc-1295', 'ipamorelin', 'hexarelin', 'tesamorelin'].includes(slug)) {
        categoriesOnProtocol.add('gh');
      } else if (['semaglutide', 'tirzepatide', 'retatrutide'].includes(slug)) {
        categoriesOnProtocol.add('glp1');
      } else if (['bpc-157', 'tb-500', 'ghk-cu-injectable', 'glow'].includes(slug)) {
        categoriesOnProtocol.add('healing');
      }
    }

    const readings = await getBiomarkerReadings();
    for (const cat of categoriesOnProtocol) {
      const panel = PANELS[cat];
      const relevantReadings = readings.filter((r) => panel.recommended.includes(r.biomarker_key as BiomarkerKey));
      const latestMs = relevantReadings.reduce((max, r) => Math.max(max, new Date(r.measured_at).getTime()), 0);
      const ageDays = latestMs > 0 ? (Date.now() - latestMs) / 86_400_000 : Infinity;
      if (ageDays > STALE_LAB_DAYS) {
        alerts.push({
          kind: 'stale_labs',
          severity: 'warning',
          title: `${panel.label}: labs stale`,
          body:
            ageDays === Infinity
              ? `You haven't logged ${panel.label.toLowerCase()} readings yet. Recommended: ${panel.cadence}`
              : `${Math.floor(ageDays)} days since last reading. Cadence: ${panel.cadence}`,
          route: '/(tabs)/biomarkers',
        });
      }
    }
  }

  // Sort by severity first, danger above warning.
  return alerts.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'danger' ? -1 : 1));
}
