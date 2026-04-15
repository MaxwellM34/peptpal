/**
 * Peptide blend compatibility reference.
 * Governs what can be safely mixed in a syringe immediately before injection
 * vs what should only be drawn separately.
 *
 * Rules of thumb:
 *  - Most peptides can share a syringe for IMMEDIATE injection (draw & inject within minutes)
 *  - Few peptides should be pre-mixed and stored together (stability loss, pH conflicts)
 *  - Always draw from each vial with a fresh needle; use a separate injection needle
 */

export type CompatLevel = 'safe' | 'caution' | 'avoid';

export interface BlendCompatEntry {
  slugA: string;
  nameA: string;
  slugB: string;
  nameB: string;
  /** Can be mixed in same syringe and injected immediately (within ~5 min) */
  syringeSafe: CompatLevel;
  /** Can be stored pre-mixed in a vial */
  storageSafe: CompatLevel;
  /** Pharmacological synergy */
  synergy: 'high' | 'moderate' | 'none';
  /** Which to draw first (lower peptide count = draw first) */
  drawOrder: [string, string];
  notes: string;
}

export const BLEND_COMPAT: BlendCompatEntry[] = [
  {
    slugA: 'bpc-157',
    nameA: 'BPC-157',
    slugB: 'tb-500',
    nameB: 'TB-500',
    syringeSafe: 'safe',
    storageSafe: 'caution',
    synergy: 'high',
    drawOrder: ['BPC-157', 'TB-500'],
    notes:
      'Classic healing stack. Safe to mix in syringe immediately before injection. Avoid pre-mixing in vial — each degrades faster when mixed. Draw BPC-157 first.',
  },
  {
    slugA: 'bpc-157',
    nameA: 'BPC-157',
    slugB: 'ghk-cu-injectable',
    nameB: 'GHK-Cu',
    syringeSafe: 'safe',
    storageSafe: 'caution',
    synergy: 'high',
    drawOrder: ['GHK-Cu', 'BPC-157'],
    notes:
      'Both are healing peptides with complementary mechanisms. Safe same-syringe injection. Do not pre-mix and store — copper ions can interact with BPC-157 over time.',
  },
  {
    slugA: 'tb-500',
    nameA: 'TB-500',
    slugB: 'ghk-cu-injectable',
    nameB: 'GHK-Cu',
    syringeSafe: 'safe',
    storageSafe: 'caution',
    synergy: 'high',
    drawOrder: ['GHK-Cu', 'TB-500'],
    notes:
      'Strong anti-inflammatory + tissue repair synergy. Mix in syringe immediately before injecting. Avoid vial storage — copper content reduces TB-500 stability.',
  },
  {
    slugA: 'cjc-1295',
    nameA: 'CJC-1295',
    slugB: 'ipamorelin',
    nameB: 'Ipamorelin',
    syringeSafe: 'safe',
    storageSafe: 'safe',
    synergy: 'high',
    drawOrder: ['Ipamorelin', 'CJC-1295'],
    notes:
      'Most popular GH secretagogue stack. These two are stable together and can be stored pre-mixed for convenience. Synergistic: GHRH + GHRP together produce GH pulses significantly larger than either alone.',
  },
  {
    slugA: 'bpc-157',
    nameA: 'BPC-157',
    slugB: 'cjc-1295',
    nameB: 'CJC-1295',
    syringeSafe: 'caution',
    storageSafe: 'avoid',
    synergy: 'none',
    drawOrder: ['BPC-157', 'CJC-1295'],
    notes:
      'No pharmacological synergy — different goals. Can be drawn into same syringe if needed, but timing may conflict (CJC-1295 best fasted; BPC-157 timing-independent). Prefer separate injections.',
  },
  {
    slugA: 'bpc-157',
    nameA: 'BPC-157',
    slugB: 'semaglutide',
    nameB: 'Semaglutide',
    syringeSafe: 'caution',
    storageSafe: 'avoid',
    synergy: 'moderate',
    drawOrder: ['BPC-157', 'Semaglutide'],
    notes:
      'BPC-157 may reduce GI side effects of semaglutide. However, they have very different reconstitution concentrations and dosing schedules. Keep in separate vials; inject separately.',
  },
  {
    slugA: 'pt-141',
    nameA: 'PT-141',
    slugB: 'bpc-157',
    nameB: 'BPC-157',
    syringeSafe: 'avoid',
    storageSafe: 'avoid',
    synergy: 'none',
    drawOrder: ['BPC-157', 'PT-141'],
    notes:
      'No reason to combine these. PT-141 is as-needed; BPC-157 is chronic. Mixing increases contamination risk with no benefit. Use separately.',
  },
  {
    slugA: 'cjc-1295',
    nameA: 'CJC-1295',
    slugB: 'semaglutide',
    nameB: 'Semaglutide',
    syringeSafe: 'avoid',
    storageSafe: 'avoid',
    synergy: 'none',
    drawOrder: ['CJC-1295', 'Semaglutide'],
    notes:
      'Completely different goals and schedules. CJC-1295 stimulates GH (daily or 2×/day); semaglutide is once weekly. GH can impair insulin sensitivity while semaglutide improves it — potential conflict. Do not mix.',
  },
];

export type DrawStep = { action: 'air' | 'draw' | 'note'; text: string };

/**
 * Generate step-by-step syringe draw instructions for a list of peptides.
 * General rules:
 *  1. Draw air into syringe equal to volume you'll draw from each vial
 *  2. Inject air into each vial before drawing (pressure equalisation)
 *  3. Draw peptides in order from lowest-volume to highest
 *  4. Swap to fresh injection needle before injecting
 */
export function buildDrawGuide(
  peptides: { name: string; volumeMl: number }[],
): DrawStep[] {
  if (peptides.length === 0) return [];

  const sorted = [...peptides].sort((a, b) => a.volumeMl - b.volumeMl);
  const totalMl = peptides.reduce((s, p) => s + p.volumeMl, 0);
  const steps: DrawStep[] = [];

  steps.push({
    action: 'air',
    text: `Draw ${totalMl.toFixed(2)} mL of air into the syringe (total volume for all peptides).`,
  });

  for (const p of sorted) {
    steps.push({
      action: 'air',
      text: `Inject ${p.volumeMl.toFixed(2)} mL of air into the ${p.name} vial (pressure equalisation).`,
    });
  }

  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i]!;
    steps.push({
      action: 'draw',
      text: `Draw ${p.volumeMl.toFixed(2)} mL from ${p.name} vial${i < sorted.length - 1 ? ' (do not re-enter other vials)' : ''}.`,
    });
  }

  steps.push({
    action: 'note',
    text: 'Swap to a fresh injection needle. Inject within 5 minutes of drawing.',
  });

  return steps;
}

/**
 * Look up compatibility between two peptides.
 * Returns undefined if no specific entry exists (assume caution).
 */
export function getPairCompat(
  slugA: string,
  slugB: string,
): BlendCompatEntry | undefined {
  return BLEND_COMPAT.find(
    (e) =>
      (e.slugA === slugA && e.slugB === slugB) ||
      (e.slugA === slugB && e.slugB === slugA),
  );
}
