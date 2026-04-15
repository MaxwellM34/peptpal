/**
 * Protocol builder math.
 *
 * Users create multi-peptide personal protocols. The app solves for the
 * correct reconstitution (BAC water volume per vial size) so every injection
 * lands at the user's target volume (default 0.10 mL = 10 IU), giving
 * comfortable draw amounts regardless of how tiny the peptide dose is.
 *
 * Constraint flow:
 *   given dose_mcg and target_volume_ml, required concentration = dose / vol
 *   bac_water_ml = vial_size_mg * 1000 / required_concentration_mcg_ml
 * If the resulting BAC water amount exceeds what fits in a typical vial
 * (~5 mL), or the concentration becomes impractically dilute, we clamp
 * target volume upward and notify.
 */

export interface ProtocolItem {
  peptideSlug: string;
  peptideName: string;
  /** Per-dose dose in mcg. */
  doseMcg: number;
  /** Doses per week. */
  dosesPerWeek: number;
  /** Preferred injection volume in mL (e.g. 0.10 = 10 IU). */
  targetVolumeMl: number;
  /** Typical vial size the user buys, in mg. */
  vialSizeMg: number;
}

export interface ReconstitutionRecipe {
  peptideSlug: string;
  peptideName: string;
  vialSizeMg: number;
  /** BAC water to add (mL). Rounded to 0.05 mL. */
  bacWaterMl: number;
  /** Resulting concentration (mcg/mL). */
  concentrationMcgPerMl: number;
  /** Actual injection volume after rounding to practical BAC water amount. */
  actualVolumeMl: number;
  /** Insulin units (100 IU/mL scale). */
  actualUnits: number;
  /** Doses this vial will support. */
  dosesPerVial: number;
  /** Warnings from the solver. */
  warnings: string[];
}

/**
 * Insulin syringes scale at 100 units per mL. Most users have U-100 1 mL
 * syringes, a smaller set have 0.3 mL and 0.5 mL.
 */
export function mlToUnits(ml: number): number {
  return ml * 100;
}

/**
 * Solve the reconstitution recipe for a single protocol item.
 *
 * Algorithm:
 *   1. required_concentration = dose / target_volume
 *   2. bac_water = (vial_size_mg * 1000) / required_concentration
 *   3. Clamp bac_water to [0.5, 5] mL (practical range)
 *   4. Recompute actual concentration and actual volume
 *   5. Return warnings if clamped
 */
export function solveRecipe(item: ProtocolItem): ReconstitutionRecipe {
  const warnings: string[] = [];
  const target = item.targetVolumeMl;
  const totalMcg = item.vialSizeMg * 1000;
  const desiredConc = item.doseMcg / target;
  let bacWater = totalMcg / desiredConc;

  // Round to 0.05 mL for practical measurement on insulin syringes.
  bacWater = Math.round(bacWater * 20) / 20;

  // Clamp — can't meaningfully reconstitute <0.5 mL (measurement error)
  // or >5 mL (won't fit in a standard vial without risk of leakage).
  if (bacWater < 0.5) {
    warnings.push(
      `Dose ${item.doseMcg} mcg at ${target} mL would need only ${bacWater.toFixed(2)} mL BAC water — too concentrated to measure reliably. Clamped to 0.5 mL; actual injection volume will be larger.`,
    );
    bacWater = 0.5;
  } else if (bacWater > 5) {
    warnings.push(
      `Dose ${item.doseMcg} mcg at ${target} mL would need ${bacWater.toFixed(2)} mL BAC water — won't fit standard vial. Clamped to 5 mL; injection volume will be smaller. Consider splitting the vial.`,
    );
    bacWater = 5;
  }

  const actualConc = totalMcg / bacWater;
  const actualVolume = item.doseMcg / actualConc;
  const dosesPerVial = Math.floor(totalMcg / item.doseMcg);

  if (actualVolume > 0.3) {
    warnings.push(
      `Injection volume is ${actualVolume.toFixed(2)} mL — exceeds a 0.3 mL insulin syringe. Consider a 1 mL syringe or split doses.`,
    );
  }
  if (actualVolume < 0.05) {
    warnings.push(
      `Injection volume is ${actualVolume.toFixed(3)} mL — very small, measurement error can be >10%.`,
    );
  }

  return {
    peptideSlug: item.peptideSlug,
    peptideName: item.peptideName,
    vialSizeMg: item.vialSizeMg,
    bacWaterMl: bacWater,
    concentrationMcgPerMl: actualConc,
    actualVolumeMl: actualVolume,
    actualUnits: mlToUnits(actualVolume),
    dosesPerVial,
    warnings,
  };
}

export interface ProtocolConflict {
  peptideSlug: string;
  peptideName: string;
  /** 'duplicate' — peptide appears in multiple active protocols */
  /** 'volume' — total daily injection volume exceeds threshold */
  /** 'blend' — storage/syringe compatibility issue across peptides */
  kind: 'duplicate' | 'volume' | 'blend';
  message: string;
}

/**
 * Detect conflicts when activating a new protocol alongside existing active
 * protocols. Caller passes in all active protocol items (flattened across
 * protocols) and the new items. Returns an array of conflicts for the UI.
 */
export function detectProtocolConflicts(
  newItems: ProtocolItem[],
  existingActiveItems: Array<ProtocolItem & { protocolName: string }>,
): ProtocolConflict[] {
  const conflicts: ProtocolConflict[] = [];

  // Duplicate peptide detection.
  for (const n of newItems) {
    const existing = existingActiveItems.find((e) => e.peptideSlug === n.peptideSlug);
    if (existing) {
      conflicts.push({
        peptideSlug: n.peptideSlug,
        peptideName: n.peptideName,
        kind: 'duplicate',
        message: `${n.peptideName} is already in "${existing.protocolName}" (${existing.doseMcg} mcg × ${existing.dosesPerWeek}/wk). Combining would add ${n.doseMcg} mcg × ${n.dosesPerWeek}/wk on top.`,
      });
    }
  }

  // Total daily volume check.
  const totalDailyMl =
    [...newItems, ...existingActiveItems].reduce(
      (s, i) => s + (i.targetVolumeMl * i.dosesPerWeek) / 7,
      0,
    );
  if (totalDailyMl > 1.0) {
    conflicts.push({
      peptideSlug: '*',
      peptideName: 'All protocols combined',
      kind: 'volume',
      message: `Combined injection volume averages ${totalDailyMl.toFixed(2)} mL/day — heavy injection load. Consider concentrating some peptides further or spacing out cycles.`,
    });
  }

  return conflicts;
}
