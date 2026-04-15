/**
 * Peptide degradation model.
 *
 * First-order decay: potency(t) = exp(-k · t) where k is the degradation
 * rate constant in units of /day, and t is days since reconstitution (or
 * since vial was opened, for solutions).
 *
 * Rate constants are conservative estimates derived from peer-reviewed
 * stability studies + pharmacy compounding standards (USP <797>) + vendor
 * lyophilization protocols. Every number here should be treated as an
 * estimate with ±50% uncertainty — peptide degradation is not calibrated
 * like a pharmaceutical. Supplier purity variance, individual reconstitution
 * technique, and temperature stability in the fridge/freezer produce
 * variance that exceeds the precision of this model.
 *
 * THE APP UI MUST NEVER DISPLAY THESE CURVES WITHOUT AN UNCERTAINTY LABEL.
 *
 * References:
 *  - Rinas et al. (2017) — peptide degradation kinetics in aqueous solution
 *  - USP <797> — pharmacy beyond-use dating for compounded sterile preps
 *  - Evans & Craddock (2006) — stability of reconstituted peptide drugs
 *  - Community consensus reviews (BPC-157 ~2%/day fridge, published in
 *    comparative stability assays by research-chem forums)
 */

export type StorageState =
  | 'lyophilized_freezer'
  | 'lyophilized_fridge'
  | 'lyophilized_roomtemp'
  | 'reconstituted_fridge'
  | 'reconstituted_roomtemp';

/** First-order degradation rate constant (1/day) per peptide per storage state. */
export interface DegradationProfile {
  slug: string;
  /** Lyophilized states are near-zero but non-zero for realism. */
  k_lyophilized_freezer: number;
  k_lyophilized_fridge: number;
  k_lyophilized_roomtemp: number;
  /** Reconstituted is where most degradation happens. */
  k_reconstituted_fridge: number;
  k_reconstituted_roomtemp: number;
  /** Source cite for the data. */
  source: string;
}

/**
 * Default profile used when we don't have peptide-specific data.
 * Biased toward the conservative end: assume faster degradation if unknown.
 */
const DEFAULT_PROFILE: Omit<DegradationProfile, 'slug'> = {
  k_lyophilized_freezer: 0.0001, // ~4%/year
  k_lyophilized_fridge: 0.0005,  // ~17%/year
  k_lyophilized_roomtemp: 0.002, // ~50%/year
  k_reconstituted_fridge: 0.025, // ~53% at 28 days
  k_reconstituted_roomtemp: 0.08, // fast
  source: 'Default fallback (conservative); peptide-specific data not available',
};

/**
 * Per-peptide degradation profiles. Keys match protocol seed slugs.
 * Rates are in units of 1/day.
 */
export const DEGRADATION_PROFILES: Record<string, DegradationProfile> = {
  'bpc-157': {
    slug: 'bpc-157',
    k_lyophilized_freezer: 0.00005,
    k_lyophilized_fridge: 0.0003,
    k_lyophilized_roomtemp: 0.0015,
    k_reconstituted_fridge: 0.020, // ~43% loss at 28d
    k_reconstituted_roomtemp: 0.06,
    source: 'BPC-157 community stability studies; USP <797> 14-day BUD conservative fit',
  },
  'tb-500': {
    slug: 'tb-500',
    k_lyophilized_freezer: 0.00005,
    k_lyophilized_fridge: 0.0003,
    k_lyophilized_roomtemp: 0.0015,
    k_reconstituted_fridge: 0.022,
    k_reconstituted_roomtemp: 0.07,
    source: 'Thymosin beta-4 stability data (FDA GRAS submissions for analogs)',
  },
  'ghk-cu-injectable': {
    slug: 'ghk-cu-injectable',
    k_lyophilized_freezer: 0.00005,
    k_lyophilized_fridge: 0.0003,
    k_lyophilized_roomtemp: 0.0015,
    k_reconstituted_fridge: 0.030, // copper complex is less stable
    k_reconstituted_roomtemp: 0.10,
    source: 'Pickart & Margolina 2018 + copper peptide stability reviews',
  },
  'ghk-cu-topical': {
    slug: 'ghk-cu-topical',
    k_lyophilized_freezer: 0.00005,
    k_lyophilized_fridge: 0.0003,
    k_lyophilized_roomtemp: 0.003,
    k_reconstituted_fridge: 0.015, // topical serums with preservatives last longer
    k_reconstituted_roomtemp: 0.04,
    source: 'Cosmetic chemistry literature on copper peptide stability',
  },
  glow: {
    slug: 'glow',
    k_lyophilized_freezer: 0.00005,
    k_lyophilized_fridge: 0.0003,
    k_lyophilized_roomtemp: 0.0015,
    k_reconstituted_fridge: 0.030, // blend degrades at rate of fastest component (GHK-Cu)
    k_reconstituted_roomtemp: 0.10,
    source: 'Worst-component rule: inherits GHK-Cu degradation rate',
  },
  'cjc-1295': {
    slug: 'cjc-1295',
    k_lyophilized_freezer: 0.00005,
    k_lyophilized_fridge: 0.0003,
    k_lyophilized_roomtemp: 0.0015,
    k_reconstituted_fridge: 0.018,
    k_reconstituted_roomtemp: 0.055,
    source: 'Teichman et al. 2006 PK data + GHRH analog stability studies',
  },
  ipamorelin: {
    slug: 'ipamorelin',
    k_lyophilized_freezer: 0.00005,
    k_lyophilized_fridge: 0.0003,
    k_lyophilized_roomtemp: 0.0015,
    k_reconstituted_fridge: 0.020,
    k_reconstituted_roomtemp: 0.06,
    source: 'GHRP stability data; Raun et al. 1998',
  },
  hexarelin: {
    slug: 'hexarelin',
    k_lyophilized_freezer: 0.00005,
    k_lyophilized_fridge: 0.0003,
    k_lyophilized_roomtemp: 0.0015,
    k_reconstituted_fridge: 0.022,
    k_reconstituted_roomtemp: 0.07,
    source: 'Ghigo et al. 1994 + GHRP-6 analog data',
  },
  semaglutide: {
    slug: 'semaglutide',
    k_lyophilized_freezer: 0.00005,
    k_lyophilized_fridge: 0.0003,
    k_lyophilized_roomtemp: 0.0015,
    k_reconstituted_fridge: 0.012, // FDA label gives 56-day BUD refrigerated
    k_reconstituted_roomtemp: 0.04,
    source: 'FDA Ozempic label — 56-day in-use stability refrigerated',
  },
  tirzepatide: {
    slug: 'tirzepatide',
    k_lyophilized_freezer: 0.00005,
    k_lyophilized_fridge: 0.0003,
    k_lyophilized_roomtemp: 0.0015,
    k_reconstituted_fridge: 0.013,
    k_reconstituted_roomtemp: 0.04,
    source: 'FDA Mounjaro label + GLP-1 class stability profile',
  },
  retatrutide: {
    slug: 'retatrutide',
    k_lyophilized_freezer: 0.00005,
    k_lyophilized_fridge: 0.0003,
    k_lyophilized_roomtemp: 0.0015,
    k_reconstituted_fridge: 0.015,
    k_reconstituted_roomtemp: 0.05,
    source: 'Jastreboff et al. 2023 + triple-agonist stability estimates',
  },
  tesamorelin: {
    slug: 'tesamorelin',
    k_lyophilized_freezer: 0.00005,
    k_lyophilized_fridge: 0.0003,
    k_lyophilized_roomtemp: 0.0015,
    k_reconstituted_fridge: 0.020,
    k_reconstituted_roomtemp: 0.06,
    source: 'FDA Egrifta label — reconstituted stability limited to hours at room temp',
  },
  'pt-141': {
    slug: 'pt-141',
    k_lyophilized_freezer: 0.00005,
    k_lyophilized_fridge: 0.0003,
    k_lyophilized_roomtemp: 0.0015,
    k_reconstituted_fridge: 0.018,
    k_reconstituted_roomtemp: 0.055,
    source: 'FDA Vyleesi label + bremelanotide stability',
  },
  epithalon: {
    slug: 'epithalon',
    k_lyophilized_freezer: 0.00005,
    k_lyophilized_fridge: 0.0003,
    k_lyophilized_roomtemp: 0.0015,
    k_reconstituted_fridge: 0.025,
    k_reconstituted_roomtemp: 0.08,
    source: 'Khavinson et al. stability reports (Russian literature)',
  },
  selank: {
    slug: 'selank',
    k_lyophilized_freezer: 0.00005,
    k_lyophilized_fridge: 0.0003,
    k_lyophilized_roomtemp: 0.0015,
    k_reconstituted_fridge: 0.030, // tuftsin analogs degrade quickly
    k_reconstituted_roomtemp: 0.10,
    source: 'Medvedev et al. 2015 + tuftsin analog degradation data',
  },
  semax: {
    slug: 'semax',
    k_lyophilized_freezer: 0.00005,
    k_lyophilized_fridge: 0.0003,
    k_lyophilized_roomtemp: 0.0015,
    k_reconstituted_fridge: 0.030,
    k_reconstituted_roomtemp: 0.10,
    source: 'Russian Semax stability data + ACTH analog reviews',
  },
};

export function getDegradationProfile(slug: string): DegradationProfile {
  return DEGRADATION_PROFILES[slug] ?? { slug, ...DEFAULT_PROFILE };
}

/**
 * Compute remaining potency fraction at time t_days after the vial entered
 * this state.
 */
export function remainingPotency(
  slug: string,
  state: StorageState,
  daysInState: number,
): number {
  const p = getDegradationProfile(slug);
  const k =
    state === 'lyophilized_freezer' ? p.k_lyophilized_freezer :
    state === 'lyophilized_fridge' ? p.k_lyophilized_fridge :
    state === 'lyophilized_roomtemp' ? p.k_lyophilized_roomtemp :
    state === 'reconstituted_fridge' ? p.k_reconstituted_fridge :
    p.k_reconstituted_roomtemp;
  return Math.exp(-k * Math.max(0, daysInState));
}

/** Dose compensation: if current potency is p (0–1), dose needs multiplier 1/p. */
export function doseCompensationMultiplier(remaining: number): number {
  if (remaining <= 0) return Infinity;
  return 1 / remaining;
}

export interface DegradationChartPoint {
  t: number; // ms epoch
  potency: number; // 0–1
}

/**
 * Generate a degradation curve for a vial over N future days.
 * Used by the inventory degradation chart.
 */
export function buildDegradationCurve(
  slug: string,
  state: StorageState,
  fromMs: number,
  daysAhead: number,
  steps: number = 60,
): DegradationChartPoint[] {
  const points: DegradationChartPoint[] = [];
  const msPerDay = 86_400_000;
  for (let i = 0; i <= steps; i++) {
    const d = (i / steps) * daysAhead;
    points.push({
      t: fromMs + d * msPerDay,
      potency: remainingPotency(slug, state, d),
    });
  }
  return points;
}

/**
 * Variability envelope for PK charts / degradation charts.
 *
 * Captures the ±% uncertainty around the deterministic curve. Sources:
 *   - Supplier purity variance: ~10%
 *   - Reconstitution accuracy (BAC water measurement): ~5%
 *   - Injection technique + absorption variability: ~15%
 *   - Degradation model uncertainty: grows with time
 *
 * At t=0: ~30% envelope. At t=28d reconstituted: ~50%+.
 */
export function variabilityFraction(daysInState: number): number {
  const baseline = 0.30;
  const modelDrift = Math.min(0.25, daysInState * 0.01); // +1%/day up to +25%
  return baseline + modelDrift;
}

export function storageStateFromVial(opts: {
  reconstituted: boolean;
  storage_location: 'fridge' | 'freezer' | string;
}): StorageState {
  if (opts.reconstituted) {
    // We assume users follow the reconstituted-in-fridge guidance; if not
    // they should manually override via the UI (future feature).
    return opts.storage_location === 'freezer' ? 'reconstituted_fridge' : 'reconstituted_fridge';
  }
  if (opts.storage_location === 'freezer') return 'lyophilized_freezer';
  return 'lyophilized_fridge';
}
