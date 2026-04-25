/**
 * Compiled external-consensus seed data per (peptide × persona).
 *
 * ⚠️  CITATION SAFETY NOTICE  ⚠️
 * The URL arrays passed to `sourcesFromUrls()` below were LLM-generated and
 * are NOT VERIFIED. At least one was confirmed by the user to point to
 * unrelated content. Until each URL is manually verified, `sourcesFromUrls()`
 * intentionally IGNORES the urls and returns a single "unverified" placeholder
 * Source so we never display fabricated citations to users.
 *
 * The DOSE RANGES, FREQUENCIES, and RATIONALES below are general community
 * knowledge and are kept — but they should be treated as informational
 * starting points only, never as cited evidence. The on-app trust-tier UI
 * will show the placeholder only.
 *
 * To restore real citations: verify each URL manually (visit, confirm topic
 * matches), then replace `sourcesFromUrls()` with the original mapping
 * function (preserved in git history). Do NOT regenerate URLs with an LLM.
 */

import type { ExternalProtocolMap } from './externalProtocols';
import { installExternalProtocols } from './externalProtocols';
import type { Source, SourceTier } from './trustTiers';

/**
 * Returns an "unverified" placeholder rather than mapping the URLs.
 * The `_urls` parameter is preserved so the data structure stays intact and
 * we can come back later, manually verify each, and re-enable mapping.
 */
function sourcesFromUrls(_urls: string[]): Source[] {
  return [
    {
      tier: 'C-' as SourceTier,
      title: 'Evidence pending manual verification',
      notes:
        'Citation links for this peptide × persona are being re-verified. Treat the dose range as a starting point, not as cited evidence.',
    },
  ];
}

export const EXTERNAL_PROTOCOL_DATA: Record<string, ExternalProtocolMap> = {
  'bpc-157': {
    health_optimizer: {
      doseMcgLow: 200, doseMcgHigh: 400, dosesPerWeek: 7, cycleWeeks: 6,
      rationale: 'Low daily subQ dose near injury site for tendon/gut healing; health optimizers cycle 4–6 weeks on, 2–4 off to avoid receptor/unknown long-term issues.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/11xqk7v/bpc157_dosing_protocol/',
        'https://www.reddit.com/r/PeptideSciences/comments/13c2mzk/bpc_157_for_longevity/',
        'https://examine.com/supplements/bpc-157/',
      ]),
    },
    bodybuilder: {
      doseMcgLow: 250, doseMcgHigh: 500, dosesPerWeek: 14, cycleWeeks: 8,
      rationale: 'Split AM/PM dosing (often stacked with TB-500) for tendon resilience during heavy training blocks; localized injections near injury sites.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/y8e6p4/bpc_tb500_stack_dosing/',
        'https://www.reddit.com/r/steroids/comments/10q3lo7/bpc157_experience/',
      ]),
    },
    cautious_beginner: {
      doseMcgLow: 100, doseMcgHigh: 250, dosesPerWeek: 7, cycleWeeks: 4,
      rationale: 'Start at half the typical dose to monitor tolerance; BPC-157 has a strong safety profile in rat studies but human data is limited, so conservative titration is warranted.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/1aftaqx/first_time_bpc157_dosing/',
        'https://peptides.org/bpc-157/',
      ]),
    },
    risk_tolerant: {
      doseMcgLow: 500, doseMcgHigh: 1000, dosesPerWeek: 14, cycleWeeks: 8,
      rationale: 'Experienced users sometimes push to 1 mg/day split dosing for severe injury recovery; watch for rare reports of elevated BP and unusual skin tag growth.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/18z7n3q/high_dose_bpc_experience/',
        'https://www.reddit.com/r/PeptideSciences/comments/14nqrx2/1mg_bpc_daily/',
      ]),
    },
  },

  'tb-500': {
    health_optimizer: {
      doseMcgLow: 2000, doseMcgHigh: 5000, dosesPerWeek: 2, cycleWeeks: 6,
      rationale: 'Lower weekly loading (2–5 mg) for soft tissue maintenance; health optimizers rarely run beyond 6 weeks given long half-life and scant human safety data.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/v9a6kn/tb500_protocol_for_recovery/',
        'https://examine.com/supplements/tb-500/',
      ]),
    },
    bodybuilder: {
      doseMcgLow: 5000, doseMcgHigh: 10000, dosesPerWeek: 2, cycleWeeks: 8,
      rationale: 'Classic 5–10 mg/week loading phase for 4–6 weeks, then maintenance; often co-run with BPC-157 for systemic recovery during high-volume training.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/steroids/comments/wzu9ne/tb500_loading_protocol/',
        'https://www.reddit.com/r/Peptides/comments/12rz7j8/tb500_bodybuilder_dose/',
      ]),
    },
    cautious_beginner: {
      doseMcgLow: 1000, doseMcgHigh: 2500, dosesPerWeek: 2, cycleWeeks: 4,
      rationale: 'Lower trial dose due to theoretical concerns about angiogenesis and cancer risk; beginners should evaluate response before committing to full loading.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/1b7q9nx/tb500_beginner_concerns/',
        'https://peptides.org/tb-500/',
      ]),
    },
    risk_tolerant: {
      doseMcgLow: 10000, doseMcgHigh: 20000, dosesPerWeek: 2, cycleWeeks: 8,
      rationale: 'Some experienced users run 10–20 mg/week during aggressive recovery blocks; flag theoretical tumor-growth risk and avoid if any personal/family cancer history.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/19s3qxm/high_dose_tb500/',
        'https://www.reddit.com/r/steroids/comments/1ap8vu4/tb500_20mg_week/',
      ]),
    },
  },

  'ghk-cu-injectable': {
    health_optimizer: {
      doseMcgLow: 1000, doseMcgHigh: 2000, dosesPerWeek: 5, cycleWeeks: 6,
      rationale: 'Subcutaneous 1–2 mg/day for skin, hair and connective tissue; health optimizers prefer copper peptide cycles with breaks to manage copper accumulation.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/13l9nva/ghk_cu_inj_dosing/',
        'https://examine.com/supplements/ghk-cu/',
      ]),
    },
    bodybuilder: {
      doseMcgLow: 1500, doseMcgHigh: 3000, dosesPerWeek: 5, cycleWeeks: 8,
      rationale: 'Used primarily for skin elasticity during cuts and tendon repair; most lifters cap at 2–3 mg/day to avoid copper-driven GI or mood effects.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/steroids/comments/102r8vc/ghkcu_for_skin/',
        'https://www.reddit.com/r/Peptides/comments/14hm3ox/ghkcu_bodybuilder/',
      ]),
    },
    cautious_beginner: {
      doseMcgLow: 500, doseMcgHigh: 1000, dosesPerWeek: 3, cycleWeeks: 4,
      rationale: 'Start at 0.5–1 mg 3×/week to assess injection-site reactions and copper tolerance; copper toxicity is a real consideration at higher chronic doses.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/19kz7rh/ghkcu_beginner/',
        'https://peptides.org/ghk-cu/',
      ]),
    },
    risk_tolerant: {
      doseMcgLow: 2000, doseMcgHigh: 4000, dosesPerWeek: 7, cycleWeeks: 8,
      rationale: 'Daily 3–4 mg pushes the upper anecdotal range; monitor ceruloplasmin/serum copper if running >6 weeks continuously.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/1bm2q9x/high_dose_ghkcu/',
        'https://www.reddit.com/r/PeptideSciences/comments/1cg7vsr/ghkcu_4mg/',
      ]),
    },
  },

  'ghk-cu-topical': {
    health_optimizer: {
      doseMcgLow: 2000, doseMcgHigh: 5000, dosesPerWeek: 7, cycleWeeks: 12,
      rationale: 'Topical 0.05–0.2% serum daily; skin/hair benefits well documented in cosmetic literature, very low systemic absorption makes long cycles reasonable.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/SkincareAddiction/comments/v8pqrz/ghk_cu_serum/',
        'https://pubmed.ncbi.nlm.nih.gov/26075170/',
      ]),
    },
    bodybuilder: {
      doseMcgLow: 2000, doseMcgHigh: 5000, dosesPerWeek: 7, cycleWeeks: 12,
      rationale: 'Used primarily for scar/stretch-mark minimization during bulks and post-comp skin recovery; minimal interaction with training stack.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/steroids/comments/11ta9zk/ghkcu_topical_stretch/',
        'https://www.reddit.com/r/Peptides/comments/15fp2kx/ghkcu_topical_bb/',
      ]),
    },
    cautious_beginner: {
      doseMcgLow: 1000, doseMcgHigh: 3000, dosesPerWeek: 5, cycleWeeks: 8,
      rationale: 'Topical is the safest entry point to copper peptides; spot-test for contact sensitivity before full-face/scalp use.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/SkincareAddiction/comments/182tk3p/ghkcu_beginner/',
        'https://peptides.org/ghk-cu-topical/',
      ]),
    },
    risk_tolerant: {
      doseMcgLow: 5000, doseMcgHigh: 10000, dosesPerWeek: 7, cycleWeeks: 16,
      rationale: 'High-concentration compounded serums (up to 1%) used daily; main risk is local irritation and staining rather than systemic copper.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/HaircareScience/comments/1b72kmx/ghkcu_1pct/',
        'https://www.reddit.com/r/tressless/comments/18a32ir/ghkcu_scalp/',
      ]),
    },
  },

  glow: {
    health_optimizer: {
      doseMcgLow: 200, doseMcgHigh: 350, dosesPerWeek: 5, cycleWeeks: 6,
      rationale: 'Glow blend (GHK-Cu 50 / BPC-157 10 / TB-500 10 per 200 mcg unit dose) run 5×/week for skin/recovery; cycle off to mitigate TB-500 concerns.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/17qd9rs/glow_blend_dosing/',
        'https://peptides.org/glow-blend/',
      ]),
    },
    bodybuilder: {
      doseMcgLow: 300, doseMcgHigh: 500, dosesPerWeek: 7, cycleWeeks: 8,
      rationale: 'Daily small injection for skin quality during cuts; limited by TB-500 component so most stay under 8 weeks continuous.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/steroids/comments/1a7q2rv/glow_peptide_cut/',
        'https://www.reddit.com/r/Peptides/comments/198m3qx/glow_bb_dose/',
      ]),
    },
    cautious_beginner: {
      doseMcgLow: 150, doseMcgHigh: 250, dosesPerWeek: 3, cycleWeeks: 4,
      rationale: 'Blends are harder to titrate; start low and 3×/week while evaluating each component\'s tolerance individually first is ideal.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/1b8r7qx/glow_beginner/',
        'https://peptides.org/glow-blend/',
      ]),
    },
    risk_tolerant: {
      doseMcgLow: 500, doseMcgHigh: 800, dosesPerWeek: 7, cycleWeeks: 8,
      rationale: 'Upper anecdotal ceiling around 600–800 mcg/day; further increases typically better served by dosing components separately for precision.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/1c1r9mx/high_dose_glow/',
        'https://www.reddit.com/r/PeptideSciences/comments/1d2p3qr/glow_800mcg/',
      ]),
    },
  },

  'cjc-1295': {
    health_optimizer: {
      doseMcgLow: 100, doseMcgHigh: 200, dosesPerWeek: 7, cycleWeeks: 12,
      rationale: 'CJC-1295 no-DAC 100–200 mcg pre-bed (often with ipamorelin) preserves pulsatile GH; gentle anti-aging use with periodic breaks.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/12aq3rx/cjc_no_dac_longevity/',
        'https://examine.com/supplements/cjc-1295/',
      ]),
    },
    bodybuilder: {
      doseMcgLow: 200, doseMcgHigh: 300, dosesPerWeek: 14, cycleWeeks: 16,
      rationale: 'Bodybuilders typically pulse 200–300 mcg 2–3×/day with ipamorelin/hexarelin for IGF-1 elevation; bloodwork to track IGF-1 and fasting glucose.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/steroids/comments/11k3q7x/cjc_ipa_bb_protocol/',
        'https://www.reddit.com/r/Peptides/comments/14t9rnm/cjc_3xday/',
      ]),
    },
    cautious_beginner: {
      doseMcgLow: 100, doseMcgHigh: 150, dosesPerWeek: 5, cycleWeeks: 8,
      rationale: 'Start 100 mcg pre-bed only to assess flush, head-rush and water retention; avoid DAC variants initially.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/19rt2nx/cjc_beginner_dose/',
        'https://peptides.org/cjc-1295/',
      ]),
    },
    risk_tolerant: {
      doseMcgLow: 300, doseMcgHigh: 500, dosesPerWeek: 21, cycleWeeks: 16,
      rationale: '3×/day 300–500 mcg pushes the saturation dose; watch fasting glucose and numbness as early signs of overuse.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/1bd8qpr/cjc_max_dose/',
        'https://www.reddit.com/r/steroids/comments/1a3r7qx/cjc_500mcg/',
      ]),
    },
  },

  ipamorelin: {
    health_optimizer: {
      doseMcgLow: 100, doseMcgHigh: 200, dosesPerWeek: 7, cycleWeeks: 12,
      rationale: 'Cleanest ghrelin mimetic; 100–200 mcg pre-bed improves sleep and GH pulse without prolactin/cortisol issues.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/15r2qmx/ipamorelin_sleep/',
        'https://examine.com/supplements/ipamorelin/',
      ]),
    },
    bodybuilder: {
      doseMcgLow: 200, doseMcgHigh: 300, dosesPerWeek: 14, cycleWeeks: 16,
      rationale: 'Paired with CJC-1295 at 200–300 mcg 2–3×/day; saturation dose commonly cited around 300 mcg per injection.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/steroids/comments/13qr8nx/ipa_saturation_dose/',
        'https://www.reddit.com/r/Peptides/comments/16m3p2x/ipa_bb/',
      ]),
    },
    cautious_beginner: {
      doseMcgLow: 100, doseMcgHigh: 150, dosesPerWeek: 5, cycleWeeks: 8,
      rationale: 'Ipamorelin is the first GHS most beginners try; start at 100 mcg pre-bed and assess water retention and appetite.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/1aftq7x/ipamorelin_first/',
        'https://peptides.org/ipamorelin/',
      ]),
    },
    risk_tolerant: {
      doseMcgLow: 300, doseMcgHigh: 500, dosesPerWeek: 21, cycleWeeks: 16,
      rationale: 'Beyond ~300 mcg receptor saturation makes gains marginal; upper users still push 500 mcg 3×/day with CJC for max GH AUC.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/1b3q9nr/ipa_500mcg/',
        'https://www.reddit.com/r/steroids/comments/19m2rpx/ipa_ceiling/',
      ]),
    },
  },

  hexarelin: {
    health_optimizer: {
      doseMcgLow: 100, doseMcgHigh: 200, dosesPerWeek: 5, cycleWeeks: 4,
      rationale: 'Hexarelin strongly desensitizes the GHS receptor; health optimizers prefer short 4-week cycles at modest doses, if they use it at all.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/14q8r2x/hexarelin_desensitization/',
        'https://examine.com/supplements/hexarelin/',
      ]),
    },
    bodybuilder: {
      doseMcgLow: 200, doseMcgHigh: 400, dosesPerWeek: 14, cycleWeeks: 4,
      rationale: '2×/day 200–400 mcg for a short blast; prolactin/cortisol elevation and rapid desensitization cap most users at 4 weeks.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/steroids/comments/12h8r2x/hexarelin_blast/',
        'https://www.reddit.com/r/Peptides/comments/15n3qmx/hex_bb/',
      ]),
    },
    cautious_beginner: {
      doseMcgLow: null, doseMcgHigh: null, dosesPerWeek: null, cycleWeeks: null,
      rationale: 'Not recommended for first-timers.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/1ap7q2x/hex_beginner_warning/',
      ]),
      avoidReason: 'Hexarelin raises prolactin and cortisol and desensitizes GHS receptors quickly; safer to start with ipamorelin or sermorelin.',
    },
    risk_tolerant: {
      doseMcgLow: 400, doseMcgHigh: 600, dosesPerWeek: 14, cycleWeeks: 4,
      rationale: '2×/day 400–600 mcg is the aggressive ceiling; monitor prolactin and consider cabergoline if running concurrent with 19-nors.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/1c7p3nx/hex_high_dose/',
        'https://www.reddit.com/r/steroids/comments/1b9m2rq/hex_600mcg/',
      ]),
    },
  },

  semaglutide: {
    health_optimizer: {
      doseMcgLow: 250, doseMcgHigh: 1000, dosesPerWeek: 1, cycleWeeks: 24,
      rationale: 'Low-dose semaglutide (0.25–1 mg/week) for metabolic/longevity benefits without aggressive weight loss; GI tolerance dictates titration.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Semaglutide/comments/17r2qmx/low_dose_longevity/',
        'https://pubmed.ncbi.nlm.nih.gov/34496367/',
      ]),
    },
    bodybuilder: {
      doseMcgLow: 250, doseMcgHigh: 1000, dosesPerWeek: 1, cycleWeeks: 12,
      rationale: 'Used in prep/cut phases at 0.25–1 mg/week to blunt appetite without destroying training output; higher doses cause lethargy.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/steroids/comments/18m2rqx/sema_cut_prep/',
        'https://www.reddit.com/r/Peptides/comments/1ab3pqx/sema_bb/',
      ]),
    },
    cautious_beginner: {
      doseMcgLow: 125, doseMcgHigh: 500, dosesPerWeek: 1, cycleWeeks: 16,
      rationale: 'Start at 0.125 mg (half the label starting dose) given research-chem potency variability; slow titration every 4 weeks.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Semaglutide/comments/19k7rnx/0125_starting/',
        'https://peptides.org/semaglutide/',
      ]),
    },
    risk_tolerant: {
      doseMcgLow: 1000, doseMcgHigh: 2400, dosesPerWeek: 1, cycleWeeks: 52,
      rationale: 'Up to label max of 2.4 mg/week for obesity indication; watch gallbladder, pancreatitis signs, and muscle mass loss.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Semaglutide/comments/1b8m3qx/24mg_max/',
        'https://www.reddit.com/r/tirzepatidecompound/comments/1d3pqrx/sema_ceiling/',
      ]),
    },
  },

  tirzepatide: {
    health_optimizer: {
      doseMcgLow: 1250, doseMcgHigh: 5000, dosesPerWeek: 1, cycleWeeks: 24,
      rationale: 'Low-dose tirz (1.25–5 mg/week) for metabolic health and modest fat loss; dual GIP/GLP-1 tends to be better tolerated than sema at matched potency.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/tirzepatidecompound/comments/18m3r2x/low_dose_optimizer/',
        'https://pubmed.ncbi.nlm.nih.gov/35658024/',
      ]),
    },
    bodybuilder: {
      doseMcgLow: 2500, doseMcgHigh: 7500, dosesPerWeek: 1, cycleWeeks: 16,
      rationale: '2.5–7.5 mg/week during contest prep; protein intake and resistance training critical to preserve LBM.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/steroids/comments/1b7q2mx/tirz_prep/',
        'https://www.reddit.com/r/tirzepatidecompound/comments/1c3p2rn/tirz_bb/',
      ]),
    },
    cautious_beginner: {
      doseMcgLow: 1250, doseMcgHigh: 2500, dosesPerWeek: 1, cycleWeeks: 16,
      rationale: 'Follow on-label 2.5 mg start with optional 1.25 micro-start; stop at severe nausea/vomiting and re-evaluate.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/tirzepatidecompound/comments/19m7rqx/beginner_125/',
        'https://peptides.org/tirzepatide/',
      ]),
    },
    risk_tolerant: {
      doseMcgLow: 7500, doseMcgHigh: 15000, dosesPerWeek: 1, cycleWeeks: 52,
      rationale: 'Label max is 15 mg/week; pushing there requires bloodwork (lipase, HbA1c) and watch for gallbladder/pancreatic events.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/tirzepatidecompound/comments/1b2r7qx/15mg_max/',
        'https://www.reddit.com/r/Mounjaro/comments/1d7q3rx/15mg_experience/',
      ]),
    },
  },

  retatrutide: {
    health_optimizer: {
      doseMcgLow: 500, doseMcgHigh: 2000, dosesPerWeek: 1, cycleWeeks: 16,
      rationale: 'Phase 2 data suggests powerful weight loss; health optimizers keep doses low (0.5–2 mg/wk) and limit cycle length given research-only status.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Retatrutide/comments/17p3q2x/low_dose_optimizer/',
        'https://pubmed.ncbi.nlm.nih.gov/37358844/',
      ]),
    },
    bodybuilder: {
      doseMcgLow: 2000, doseMcgHigh: 6000, dosesPerWeek: 1, cycleWeeks: 12,
      rationale: '2–6 mg/week during aggressive cuts; triple-agonist energy expenditure helps recomp but increases HR — monitor resting pulse.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Retatrutide/comments/1b8m2rx/bb_prep/',
        'https://www.reddit.com/r/steroids/comments/1c2q7pr/reta_cut/',
      ]),
    },
    cautious_beginner: {
      doseMcgLow: null, doseMcgHigh: null, dosesPerWeek: null, cycleWeeks: null,
      rationale: 'Not recommended for first-time peptide users.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Retatrutide/comments/1ap7q2x/beginner_warning/',
      ]),
      avoidReason: 'Retatrutide is a research chemical still in Phase 3 trials; first-timers should start with on-label semaglutide or tirzepatide under medical supervision.',
    },
    risk_tolerant: {
      doseMcgLow: 6000, doseMcgHigh: 12000, dosesPerWeek: 1, cycleWeeks: 24,
      rationale: 'Phase 2 explored up to 12 mg/wk; side-effect rate (nausea, HR increase) climbs steeply — requires ECG awareness and bloodwork.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Retatrutide/comments/1b3p2qx/12mg_max/',
        'https://pubmed.ncbi.nlm.nih.gov/37358844/',
      ]),
    },
  },

  tesamorelin: {
    health_optimizer: {
      doseMcgLow: 1000, doseMcgHigh: 2000, dosesPerWeek: 5, cycleWeeks: 12,
      rationale: '1–2 mg/day for visceral fat reduction; strong evidence base in HIV-lipodystrophy literature, health optimizers use cyclically for body comp.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/15m2r7x/tesa_visceral/',
        'https://pubmed.ncbi.nlm.nih.gov/20660346/',
      ]),
    },
    bodybuilder: {
      doseMcgLow: 2000, doseMcgHigh: 4000, dosesPerWeek: 7, cycleWeeks: 16,
      rationale: '2–4 mg pre-bed for stubborn belly fat and IGF-1 bump; watch fasting glucose and carpal-tunnel symptoms at upper end.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/steroids/comments/13q2rnx/tesa_bb/',
        'https://www.reddit.com/r/Peptides/comments/1a7p3qr/tesa_4mg/',
      ]),
    },
    cautious_beginner: {
      doseMcgLow: 500, doseMcgHigh: 1000, dosesPerWeek: 5, cycleWeeks: 8,
      rationale: 'Start at half the label dose (0.5–1 mg) to assess water retention and glucose impact; get fasting glucose before/after.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/19k7q2x/tesa_beginner/',
        'https://peptides.org/tesamorelin/',
      ]),
    },
    risk_tolerant: {
      doseMcgLow: 4000, doseMcgHigh: 6000, dosesPerWeek: 7, cycleWeeks: 16,
      rationale: 'Some push to 4–6 mg/day for GH-like effects; insulin resistance and water retention become limiting factors.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/1c2p7rx/tesa_6mg/',
        'https://www.reddit.com/r/steroids/comments/1b8m3qr/tesa_high/',
      ]),
    },
  },

  'pt-141': {
    health_optimizer: {
      doseMcgLow: 500, doseMcgHigh: 1250, dosesPerWeek: 2, cycleWeeks: 4,
      rationale: 'Used as-needed (PRN) for libido; health optimizers keep it infrequent due to BP elevation and nausea at higher doses.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/17qm3r2/pt141_prn/',
        'https://examine.com/supplements/bremelanotide/',
      ]),
    },
    bodybuilder: {
      doseMcgLow: 1000, doseMcgHigh: 1750, dosesPerWeek: 2, cycleWeeks: 8,
      rationale: '1–1.75 mg PRN; sometimes used to counter AAS-related libido dips, but BP/HR response can stack dangerously with stimulants.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/steroids/comments/14p3q2x/pt141_aas/',
        'https://www.reddit.com/r/Peptides/comments/1b7m2rn/pt141_bb/',
      ]),
    },
    cautious_beginner: {
      doseMcgLow: 250, doseMcgHigh: 500, dosesPerWeek: 1, cycleWeeks: 4,
      rationale: 'Microdose 0.25 mg first to gauge nausea/flushing; full 1.75 mg label dose causes vomiting in a meaningful minority.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/19p7q2x/pt141_microdose/',
        'https://peptides.org/pt-141/',
      ]),
    },
    risk_tolerant: {
      doseMcgLow: 1750, doseMcgHigh: 2500, dosesPerWeek: 2, cycleWeeks: 8,
      rationale: 'Label dose 1.75 mg up to anecdotal 2.5 mg; check baseline BP — this peptide reliably bumps SBP 8–10 mmHg for hours.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/1c3p7qr/pt141_25mg/',
        'https://www.reddit.com/r/steroids/comments/1b9m2rx/pt141_high/',
      ]),
    },
  },

  epithalon: {
    health_optimizer: {
      doseMcgLow: 5000, doseMcgHigh: 10000, dosesPerWeek: 7, cycleWeeks: 3,
      rationale: 'Classic Khavinson protocol: 5–10 mg/day for 10–20 days, 1–2×/year; primary driver is telomerase/longevity hypothesis.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/15p7q2x/epithalon_khavinson/',
        'https://pubmed.ncbi.nlm.nih.gov/12937538/',
      ]),
    },
    bodybuilder: {
      doseMcgLow: 5000, doseMcgHigh: 10000, dosesPerWeek: 7, cycleWeeks: 3,
      rationale: 'Used annually for recovery/sleep more than performance; doesn\'t meaningfully affect lifts so stays at standard protocol.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/steroids/comments/14m2r7x/epi_annual/',
        'https://www.reddit.com/r/Peptides/comments/1a7p3rn/epi_bb/',
      ]),
    },
    cautious_beginner: {
      doseMcgLow: 2500, doseMcgHigh: 5000, dosesPerWeek: 5, cycleWeeks: 2,
      rationale: 'Short 10–14 day cycle at half-dose to evaluate sleep changes; evidence base is thin outside Russian literature.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/19k3q7x/epi_beginner/',
        'https://peptides.org/epithalon/',
      ]),
    },
    risk_tolerant: {
      doseMcgLow: 10000, doseMcgHigh: 20000, dosesPerWeek: 7, cycleWeeks: 4,
      rationale: 'Some experimenters push 10–20 mg/day for 3–4 weeks; no documented dose-limiting toxicity but also no long-term human safety data.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Peptides/comments/1c8m3qr/epi_20mg/',
        'https://www.reddit.com/r/longevity/comments/1d2r9nx/epi_ceiling/',
      ]),
    },
  },

  selank: {
    health_optimizer: {
      doseMcgLow: 250, doseMcgHigh: 750, dosesPerWeek: 7, cycleWeeks: 4,
      rationale: 'Intranasal 250–750 mcg/day for anxiolysis and focus; health optimizers cycle 2–4 weeks on/off due to limited long-term data.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Nootropics/comments/15p7q2x/selank_anxiety/',
        'https://pubmed.ncbi.nlm.nih.gov/19240761/',
      ]),
    },
    bodybuilder: {
      doseMcgLow: 500, doseMcgHigh: 1000, dosesPerWeek: 7, cycleWeeks: 6,
      rationale: 'Used for pre-comp anxiety and cut-phase mood; doesn\'t interact meaningfully with AAS stacks.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/steroids/comments/14q2r7x/selank_prep/',
        'https://www.reddit.com/r/Peptides/comments/1a7p3qr/selank_bb/',
      ]),
    },
    cautious_beginner: {
      doseMcgLow: 150, doseMcgHigh: 300, dosesPerWeek: 5, cycleWeeks: 3,
      rationale: 'Start 150 mcg intranasally once daily; most users notice subtle anxiolysis within days without significant AEs.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Nootropics/comments/19k7q2x/selank_beginner/',
        'https://peptides.org/selank/',
      ]),
    },
    risk_tolerant: {
      doseMcgLow: 1000, doseMcgHigh: 1500, dosesPerWeek: 7, cycleWeeks: 8,
      rationale: 'Upper end ~1.5 mg/day split intranasally; diminishing returns past this and no reliable toxicity ceiling in humans.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Nootropics/comments/1c3p7qx/selank_high/',
        'https://www.reddit.com/r/Peptides/comments/1b9m2rn/selank_15mg/',
      ]),
    },
  },

  semax: {
    health_optimizer: {
      doseMcgLow: 300, doseMcgHigh: 600, dosesPerWeek: 5, cycleWeeks: 4,
      rationale: 'Intranasal 300–600 mcg/day for cognition/focus; Russian stroke-recovery data supports neuroprotection at these doses.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Nootropics/comments/15m3q2x/semax_focus/',
        'https://pubmed.ncbi.nlm.nih.gov/21744267/',
      ]),
    },
    bodybuilder: {
      doseMcgLow: 600, doseMcgHigh: 1000, dosesPerWeek: 7, cycleWeeks: 6,
      rationale: 'Used pre-training for focus and as a mild BDNF-raiser; minimal systemic interaction with lifting stacks.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/steroids/comments/14p3q2x/semax_training/',
        'https://www.reddit.com/r/Peptides/comments/1a9m3rn/semax_bb/',
      ]),
    },
    cautious_beginner: {
      doseMcgLow: 150, doseMcgHigh: 300, dosesPerWeek: 5, cycleWeeks: 3,
      rationale: 'Start at 150 mcg intranasally AM only; assess overstimulation and irritability before increasing.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Nootropics/comments/19p3q7x/semax_beginner/',
        'https://peptides.org/semax/',
      ]),
    },
    risk_tolerant: {
      doseMcgLow: 1000, doseMcgHigh: 2000, dosesPerWeek: 7, cycleWeeks: 8,
      rationale: 'Up to 2 mg/day split intranasally; main limiters are irritability, insomnia and anecdotal BP bumps at the top end.',
      sources: sourcesFromUrls([
        'https://www.reddit.com/r/Nootropics/comments/1c7m3qx/semax_2mg/',
        'https://www.reddit.com/r/Peptides/comments/1b3p7rn/semax_high/',
      ]),
    },
  },
};

// Install at module load so consumers can call getExternalProtocol immediately.
installExternalProtocols(EXTERNAL_PROTOCOL_DATA);
