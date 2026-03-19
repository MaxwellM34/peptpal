/**
 * Reconstitution calculator for peptide vials.
 * All calculations are informational only — not medical advice.
 */

export interface ReconstitutionInput {
  /** Vial size in milligrams (e.g. 5 for a 5mg vial) */
  vialSizeMg: number;
  /** Desired concentration in mcg per mL */
  desiredConcentrationMcgPerMl: number;
}

export interface ReconstitutionResult {
  /** mL of BAC water to add */
  bacWaterMl: number;
  /** Total mcg in the reconstituted vial */
  totalMcg: number;
  /** Number of full doses at the given concentration */
  dosesPerVial: number;
  /** mL per single dose (at concentration) — useful for syringe calibration */
  mlPerDose: number;
  /** Warning if volume per dose would be impractically small */
  lowVolumeWarning: boolean;
}

export interface DoseVolumeInput {
  /** Desired dose in mcg */
  desiredDoseMcg: number;
  /** Desired injection volume in mL */
  desiredVolumeMl: number;
}

export type ReconstitutionInputByDose = {
  vialSizeMg: number;
} & DoseVolumeInput;

/** Minimum practical injection volume in mL (below this, accuracy degrades) */
const MIN_PRACTICAL_VOLUME_ML = 0.05;

/**
 * Calculate BAC water volume needed given a desired concentration.
 * Formula: bacWaterMl = vialSizeMg * 1000 / desiredConcentrationMcgPerMl
 */
export function reconstitutionCalc(input: ReconstitutionInput): ReconstitutionResult {
  const { vialSizeMg, desiredConcentrationMcgPerMl } = input;

  if (vialSizeMg <= 0) throw new Error('vialSizeMg must be positive');
  if (desiredConcentrationMcgPerMl <= 0)
    throw new Error('desiredConcentrationMcgPerMl must be positive');

  const totalMcg = vialSizeMg * 1000;
  const bacWaterMl = totalMcg / desiredConcentrationMcgPerMl;
  // dosesPerVial at concentration (1 dose = 1 mL at that concentration)
  // We report doses per vial based on total volume / 1mL per dose unit
  // More useful: how many 1-mL pulls can you get? = bacWaterMl
  const dosesPerVial = bacWaterMl; // 1 mL per dose at stated concentration
  const mlPerDose = 1; // by definition at the given concentration
  const lowVolumeWarning = mlPerDose < MIN_PRACTICAL_VOLUME_ML;

  return {
    bacWaterMl: round(bacWaterMl, 2),
    totalMcg,
    dosesPerVial: Math.floor(dosesPerVial),
    mlPerDose: round(mlPerDose, 3),
    lowVolumeWarning,
  };
}

/**
 * Calculate concentration and BAC water needed given a desired dose + volume per injection.
 * Derived concentration = desiredDoseMcg / desiredVolumeMl
 * Then apply reconstitutionCalc with that concentration.
 */
export function reconstitutionCalcByDose(input: ReconstitutionInputByDose): ReconstitutionResult & {
  concentrationMcgPerMl: number;
} {
  const { vialSizeMg, desiredDoseMcg, desiredVolumeMl } = input;

  if (desiredDoseMcg <= 0) throw new Error('desiredDoseMcg must be positive');
  if (desiredVolumeMl <= 0) throw new Error('desiredVolumeMl must be positive');

  const concentrationMcgPerMl = desiredDoseMcg / desiredVolumeMl;
  const totalMcg = vialSizeMg * 1000;
  const bacWaterMl = totalMcg / concentrationMcgPerMl;
  const dosesPerVial = Math.floor(totalMcg / desiredDoseMcg);
  const mlPerDose = desiredVolumeMl;
  const lowVolumeWarning = mlPerDose < MIN_PRACTICAL_VOLUME_ML;

  return {
    bacWaterMl: round(bacWaterMl, 2),
    totalMcg,
    concentrationMcgPerMl: round(concentrationMcgPerMl, 2),
    dosesPerVial,
    mlPerDose: round(mlPerDose, 3),
    lowVolumeWarning,
  };
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
