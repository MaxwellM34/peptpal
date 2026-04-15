/**
 * Weight-normalized dose scaling.
 *
 * The central safety feature of PeptPal. Clinical trial protocols are run on
 * specific cohorts (retatrutide phase 2 mean weight 112.7 kg / 248 lb, BMI
 * 30–50). Forum users copy the flat dose without normalizing to their own
 * body weight — a lean 170 lb user on "12 mg/wk retatrutide" is actually at
 * ~1.45× the per-kg trial exposure, which is exactly where the 20.9%
 * dysesthesia signal came from.
 *
 * Every protocol recommendation in the app passes through this layer.
 */

export interface TrialCohort {
  /** Mean body weight of the trial participants, in kilograms. */
  meanWeightKg: number;
  /** Mean BMI (optional — some trials report only weight). */
  meanBmi?: number;
  /** Sample size of the trial. */
  n?: number;
  /** Short reference for the cohort. */
  citation: string;
}

export interface DoseRecommendation {
  /** Dose in micrograms per injection/dose event. */
  doseMcg: number;
  /** Frequency — descriptive string ("weekly", "daily", "2×/day"). */
  frequency: string;
  /** Optional doses-per-week used for weekly exposure calculations. */
  dosesPerWeek?: number;
  /** The trial cohort this dose was derived from. */
  cohort: TrialCohort;
  /** Whether this drug uses weight-dependent dosing (most peptides scale with body compartment). */
  scaleWithWeight?: boolean;
}

export interface ScaledDose {
  /** The starting (per-dose) dose scaled to the user's weight. */
  scaledDoseMcg: number;
  /** Scaled doses per week, if applicable. */
  scaledDosesPerWeek?: number;
  /** Ratio of user exposure to trial exposure at the original flat dose (per kg). */
  exposureRatio: number;
  /** Ratio descriptor: 'safe' (0.8–1.2×), 'elevated' (1.2–1.5×), 'dangerous' (>1.5×), 'subtherapeutic' (<0.7×). */
  safetyFlag: 'safe' | 'elevated' | 'dangerous' | 'subtherapeutic';
  /** Human-readable explanation for display. */
  explanation: string;
}

export interface UserProfile {
  /** User's body weight in kilograms. */
  weightKg: number;
  /** Optional BMI for additional context. */
  bmi?: number;
  /** Optional goal — e.g. 'injury_recovery', 'weight_loss'. */
  goal?: string;
}

/**
 * Scale a trial-derived dose to the user's body weight.
 *
 * For peptides where the dose is weight-dependent (most systemic peptides),
 * this returns the per-kg dose of the trial × user's weight.
 *
 * For peptides where the target is weight-independent (pituitary saturation,
 * e.g. Ipamorelin where a 100 mcg dose saturates receptors regardless of
 * body size), pass `scaleWithWeight: false` on the recommendation — we then
 * return the flat dose and only flag exposure-ratio issues if the user is
 * an extreme outlier.
 */
export function scaleDose(rec: DoseRecommendation, profile: UserProfile): ScaledDose {
  const perKgTrial = rec.doseMcg / rec.cohort.meanWeightKg;
  const scaleWithWeight = rec.scaleWithWeight !== false;

  let scaledDoseMcg: number;
  let exposureRatio: number;

  if (scaleWithWeight) {
    scaledDoseMcg = perKgTrial * profile.weightKg;
    // By definition, scaled dose gives exposure ratio of 1.0 per kg.
    // But we compute what the user *would* experience if they copied the flat dose:
    exposureRatio = (rec.doseMcg / profile.weightKg) / perKgTrial;
  } else {
    scaledDoseMcg = rec.doseMcg;
    exposureRatio = rec.cohort.meanWeightKg / profile.weightKg;
  }

  const scaledDosesPerWeek = rec.dosesPerWeek;

  let safetyFlag: ScaledDose['safetyFlag'];
  // Threshold chosen from research: retatrutide 20.9% dysesthesia signal
  // correlates with ~1.4× trial per-kg exposure.
  if (exposureRatio > 1.4) safetyFlag = 'dangerous';
  else if (exposureRatio > 1.2) safetyFlag = 'elevated';
  else if (exposureRatio < 0.7) safetyFlag = 'subtherapeutic';
  else safetyFlag = 'safe';

  const trialLbs = Math.round(rec.cohort.meanWeightKg * 2.2046);
  const userLbs = Math.round(profile.weightKg * 2.2046);

  const explanation = scaleWithWeight
    ? `Trial cohort averaged ${rec.cohort.meanWeightKg.toFixed(0)} kg (${trialLbs} lb). ` +
      `At your weight (${userLbs} lb), copying the flat ${rec.doseMcg} mcg dose would give ${exposureRatio.toFixed(2)}× trial exposure. ` +
      `Weight-matched dose: ${scaledDoseMcg.toFixed(0)} mcg.`
    : `This peptide is receptor-saturating — dose doesn't scale linearly with body weight. ` +
      `Flat dose of ${rec.doseMcg} mcg typical across body sizes. ` +
      (exposureRatio > 1.2 || exposureRatio < 0.8
        ? `You're an outlier vs trial cohort (${userLbs} vs ${trialLbs} lb) — watch for atypical response.`
        : '');

  return {
    scaledDoseMcg,
    scaledDosesPerWeek,
    exposureRatio,
    safetyFlag,
    explanation,
  };
}

/**
 * Enforce a hard maximum dose — never display a dose above this regardless
 * of what the scaling math says. Used as a safety ceiling.
 */
export function enforceHardCeiling(scaled: ScaledDose, ceilingMcg: number): ScaledDose {
  if (scaled.scaledDoseMcg <= ceilingMcg) return scaled;
  return {
    ...scaled,
    scaledDoseMcg: ceilingMcg,
    safetyFlag: 'dangerous',
    explanation: `${scaled.explanation} Capped at hard ceiling of ${ceilingMcg} mcg.`,
  };
}

export function lbsToKg(lbs: number): number {
  return lbs / 2.2046;
}

export function kgToLbs(kg: number): number {
  return kg * 2.2046;
}
