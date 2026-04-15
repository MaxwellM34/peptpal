/**
 * User personas for persona-tailored protocol recommendations.
 *
 * The app surfaces different dose ranges and framings depending on which
 * persona the user selects. A cautious beginner sees conservative starting
 * doses with warnings; a risk-tolerant experienced user sees the full dose
 * range the community reports (still enforced by the hard ceiling from
 * protocolSeeds.ts).
 *
 * Personas map to archetypes observed in community research (reddit top-
 * voted threads, peptide forums, Jay Campbell / NinjAthlete audience segments).
 */

export type PersonaKey =
  | 'health_optimizer'
  | 'bodybuilder'
  | 'cautious_beginner'
  | 'risk_tolerant';

export interface PersonaDefinition {
  key: PersonaKey;
  label: string;
  emoji: string;
  description: string;
  /** Philosophy shown on the protocol detail screen. */
  philosophy: string;
  /** Dose multiplier applied to community-median as a default starting point. */
  doseMultiplier: number;
  /** Whether to enforce the strict hard ceiling (true) or show a "pushing max" range. */
  enforceStrictCeiling: boolean;
}

export const PERSONAS: Record<PersonaKey, PersonaDefinition> = {
  health_optimizer: {
    key: 'health_optimizer',
    label: 'Health Optimizer',
    emoji: '🌿',
    description:
      'Longevity, recovery, sleep. Risk-averse. Minimum effective dose with regular cycling breaks.',
    philosophy:
      'You care about long-term wellbeing over short-term performance. Prefer evidence-backed doses, use bloodwork to confirm nothing is trending wrong, and take breaks as routine rather than after-the-fact.',
    doseMultiplier: 0.9,
    enforceStrictCeiling: true,
  },
  bodybuilder: {
    key: 'bodybuilder',
    label: 'Bodybuilder / Athlete',
    emoji: '💪',
    description:
      'Lean gains, recovery, GH stack optimization. Runs protocols alongside training. Tracks bloodwork.',
    philosophy:
      'You train hard and want peptides to support that. You read the research, tolerate higher per-kg exposures, and track IGF-1 / HbA1c. Stacks are normal.',
    doseMultiplier: 1.0,
    enforceStrictCeiling: true,
  },
  cautious_beginner: {
    key: 'cautious_beginner',
    label: 'Cautious Beginner',
    emoji: '🧪',
    description:
      'First-timer with peptides. Safest starting dose. Stops at any AE. Harm-reduction-heavy.',
    philosophy:
      'You are new to this and want the lowest dose that has any chance of working. You will titrate slowly, stop immediately if something feels off, and only escalate after confirming tolerance.',
    doseMultiplier: 0.5,
    enforceStrictCeiling: true,
  },
  risk_tolerant: {
    key: 'risk_tolerant',
    label: 'Risk Tolerant',
    emoji: '⚡',
    description:
      'Experienced, comfortable with research-chem territory, pushes doses to find personal max.',
    philosophy:
      'You know your body and have done this before. You want the full community dose range including the high end, with honest harm-reduction markers (BP, IGF-1, lipase). The hard ceiling still applies — we do not display doses above known AE thresholds.',
    doseMultiplier: 1.3,
    enforceStrictCeiling: true,
  },
};

/** Ordered list for rendering. */
export const PERSONA_ORDER: PersonaKey[] = [
  'cautious_beginner',
  'health_optimizer',
  'bodybuilder',
  'risk_tolerant',
];

export function getPersona(key: PersonaKey): PersonaDefinition {
  return PERSONAS[key];
}
