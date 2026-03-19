/**
 * Dose safety checker for peptide injections.
 * All outputs are informational only — not medical advice.
 */

export interface DoseSafetyResult {
  safe: boolean;
  percentOfMax: number;
  /** Level: 'ok' | 'caution' (>75%) | 'warning' (>90%) | 'exceeded' (>100%) */
  level: 'ok' | 'caution' | 'warning' | 'exceeded';
  message: string;
}

/**
 * Check whether a dose is within documented reference limits.
 * @param doseMcg - The dose to be administered in micrograms
 * @param peptideMaxDoseMcg - The maximum reference dose for this peptide in micrograms
 */
export function checkDoseSafety(doseMcg: number, peptideMaxDoseMcg: number): DoseSafetyResult {
  if (doseMcg <= 0) throw new Error('doseMcg must be positive');
  if (peptideMaxDoseMcg <= 0) throw new Error('peptideMaxDoseMcg must be positive');

  const percentOfMax = (doseMcg / peptideMaxDoseMcg) * 100;

  if (percentOfMax > 100) {
    return {
      safe: false,
      percentOfMax: round(percentOfMax, 1),
      level: 'exceeded',
      message: `Dose exceeds the documented maximum by ${round(percentOfMax - 100, 1)}%. This is outside reference guidelines.`,
    };
  }

  if (percentOfMax > 90) {
    return {
      safe: true,
      percentOfMax: round(percentOfMax, 1),
      level: 'warning',
      message: `Dose is at ${round(percentOfMax, 1)}% of the documented maximum. Proceed with caution.`,
    };
  }

  if (percentOfMax > 75) {
    return {
      safe: true,
      percentOfMax: round(percentOfMax, 1),
      level: 'caution',
      message: `Dose is at ${round(percentOfMax, 1)}% of the documented maximum.`,
    };
  }

  return {
    safe: true,
    percentOfMax: round(percentOfMax, 1),
    level: 'ok',
    message: `Dose is within reference guidelines (${round(percentOfMax, 1)}% of max).`,
  };
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
