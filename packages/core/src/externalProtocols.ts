/**
 * External ("Wider Internet") protocol consensus per (peptide × persona).
 *
 * Distinct from protocolSeeds.ts which is the trial-derived starting dose.
 * This module holds what the broader community reports — aggregated from
 * reddit (r/Peptides, r/PeptideSciences, r/Retatrutide, r/tirzepatidecompound),
 * forum archives, and informed long-form sources (Jay Campbell, NinjAthlete).
 *
 * Vendor sources are explicitly downweighted. See trustTiers.ts for the
 * trust hierarchy that powers the consensus math.
 *
 * The app UI shows this data in the "Wider Internet" tab of the Community
 * screen. When enough PeptPal-internal dose logs exist, the ConsensusSnapshot
 * from the backend supersedes this seed — but this remains the cold-start.
 */

import type { PersonaKey } from './personas';
import type { Source } from './trustTiers';

export interface ExternalProtocol {
  /** Starting dose in mcg per injection. */
  doseMcgLow: number | null;
  /** Typical ceiling for this persona in mcg per injection. */
  doseMcgHigh: number | null;
  /** Doses per week. */
  dosesPerWeek: number | null;
  /** Typical cycle length in weeks. */
  cycleWeeks: number | null;
  /** Why this persona uses this range. */
  rationale: string;
  /** Sources cited. */
  sources: Source[];
  /** Set if this persona should avoid this peptide entirely. */
  avoidReason?: string;
}

export type ExternalProtocolMap = Record<PersonaKey, ExternalProtocol>;

/**
 * Holds the compiled external-consensus data keyed by peptide slug.
 * Populated from the research agent output — see data/externalProtocols.json.
 */
export const EXTERNAL_PROTOCOLS: Record<string, ExternalProtocolMap> = {};

export function getExternalProtocol(
  peptideSlug: string,
  persona: PersonaKey,
): ExternalProtocol | undefined {
  return EXTERNAL_PROTOCOLS[peptideSlug]?.[persona];
}

/**
 * Install compiled external protocol data. Called once at startup by the
 * data loader, or in tests with test fixtures.
 */
export function installExternalProtocols(
  data: Record<string, ExternalProtocolMap>,
): void {
  for (const [slug, map] of Object.entries(data)) {
    EXTERNAL_PROTOCOLS[slug] = map;
  }
}
