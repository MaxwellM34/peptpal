/**
 * Simple symptom-injection pattern detection.
 * Flags potential correlations for user awareness — not diagnostic.
 */

export interface InjectionEvent {
  peptideId: string;
  peptideName: string;
  injectedAt: Date;
}

export interface SymptomEvent {
  symptom: string;
  occurredAt: Date;
}

export interface PatternMatch {
  peptideName: string;
  symptom: string;
  occurrences: number;
  message: string;
}

const PATTERN_WINDOW_HOURS = 48;
const PATTERN_MIN_OCCURRENCES = 3;

/**
 * Detect if a symptom appears repeatedly within the pattern window after injections
 * of a specific peptide.
 */
export function detectSymptomPatterns(
  injections: InjectionEvent[],
  symptoms: SymptomEvent[],
): PatternMatch[] {
  const patterns: Map<string, number> = new Map();
  const windowMs = PATTERN_WINDOW_HOURS * 60 * 60 * 1000;

  for (const symptom of symptoms) {
    // Collect which peptides had an injection within the window BEFORE this symptom
    const matchedPeptides = new Set<string>();
    for (const injection of injections) {
      const diff = symptom.occurredAt.getTime() - injection.injectedAt.getTime();
      if (diff >= 0 && diff <= windowMs) {
        matchedPeptides.add(injection.peptideId);
      }
    }
    // Count this symptom occurrence once per matched peptide (not once per injection)
    for (const peptideId of matchedPeptides) {
      const key = `${peptideId}::${symptom.symptom.toLowerCase()}`;
      patterns.set(key, (patterns.get(key) ?? 0) + 1);
    }
  }

  const results: PatternMatch[] = [];

  for (const [key, count] of patterns.entries()) {
    if (count >= PATTERN_MIN_OCCURRENCES) {
      const [peptideId, symptom = ''] = key.split('::');
      const peptideName =
        injections.find((i) => i.peptideId === peptideId)?.peptideName ?? peptideId ?? 'Unknown';
      results.push({
        peptideName,
        symptom,
        occurrences: count,
        message: `You may want to note a pattern between ${symptom} and ${peptideName}.`,
      });
    }
  }

  return results;
}
