/**
 * Inventory utility functions.
 * All calculations are informational only — not medical advice.
 */

import { addDays } from 'date-fns';

/** Peptide-specific expiry windows (days after reconstitution) */
const PEPTIDE_EXPIRY_DAYS: Record<string, { fridge: number; freezer: number }> = {
  'bpc-157': { fridge: 30, freezer: 180 },
  'tb-500': { fridge: 30, freezer: 180 },
  semaglutide: { fridge: 28, freezer: 90 },
  tirzepatide: { fridge: 28, freezer: 90 },
  'cjc-1295': { fridge: 21, freezer: 90 },
  ipamorelin: { fridge: 21, freezer: 90 },
  sermorelin: { fridge: 14, freezer: 90 },
  'mt-2': { fridge: 21, freezer: 90 },
  tesamorelin: { fridge: 21, freezer: 90 },
  retatrutide: { fridge: 28, freezer: 90 },
  semax: { fridge: 14, freezer: 90 },
  selank: { fridge: 14, freezer: 90 },
  'ghk-cu-injectable': { fridge: 21, freezer: 90 },
  'ghk-cu-topical': { fridge: 30, freezer: 90 },
  epithalon: { fridge: 21, freezer: 90 },
  'pt-141': { fridge: 21, freezer: 90 },
};

const DEFAULT_EXPIRY = { fridge: 30, freezer: 90 };

/**
 * Suggest an expiry date based on peptide type and reconstitution date.
 * Storage is assumed to be refrigerated unless otherwise specified.
 */
export function suggestExpiryDate(
  peptideSlug: string,
  reconstitutedAt: Date,
  storage: 'fridge' | 'freezer' = 'fridge',
): Date {
  const expiry = PEPTIDE_EXPIRY_DAYS[peptideSlug.toLowerCase()] ?? DEFAULT_EXPIRY;
  return addDays(reconstitutedAt, expiry[storage]);
}

/**
 * Estimate remaining doses in a vial.
 * @param concentrationMcgPerMl - Concentration after reconstitution
 * @param remainingVolumeMl - Estimated remaining volume in mL
 * @param scheduledDoseMcg - The dose size per injection
 */
export function estimateRemainingDoses(
  concentrationMcgPerMl: number,
  remainingVolumeMl: number,
  scheduledDoseMcg: number,
): number {
  if (concentrationMcgPerMl <= 0) throw new Error('concentrationMcgPerMl must be positive');
  if (remainingVolumeMl < 0) throw new Error('remainingVolumeMl must be >= 0');
  if (scheduledDoseMcg <= 0) throw new Error('scheduledDoseMcg must be positive');

  const remainingMcg = concentrationMcgPerMl * remainingVolumeMl;
  return Math.floor(remainingMcg / scheduledDoseMcg);
}

/**
 * Calculate the volume to draw for a given dose at a given concentration.
 */
export function calcDrawVolume(doseMcg: number, concentrationMcgPerMl: number): number {
  if (doseMcg <= 0) throw new Error('doseMcg must be positive');
  if (concentrationMcgPerMl <= 0) throw new Error('concentrationMcgPerMl must be positive');
  const ml = doseMcg / concentrationMcgPerMl;
  const factor = 1000;
  return Math.round(ml * factor) / factor;
}
