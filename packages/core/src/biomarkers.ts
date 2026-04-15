/**
 * Biomarker panels and safe ranges per peptide category.
 *
 * For users running non-FDA-approved peptides the minimum-viable labs vary
 * by what they're on:
 *  - GH secretagogues → IGF-1, HbA1c, fasting insulin, HOMA-IR
 *  - GLP-1 agonists → HbA1c, lipase/amylase, eGFR, TSH
 *  - Healing peptides (angiogenics) → CBC, CMP, hs-CRP, age-appropriate
 *    cancer screening before starting
 *
 * Ranges are conservative — upper-quartile age-adjusted where applicable.
 */

export type BiomarkerKey =
  | 'igf_1'
  | 'igfbp_3'
  | 'hba1c'
  | 'fasting_glucose'
  | 'fasting_insulin'
  | 'homa_ir'
  | 'lipase'
  | 'amylase'
  | 'egfr'
  | 'tsh'
  | 'ft4'
  | 'alt'
  | 'ast'
  | 'hs_crp'
  | 'total_chol'
  | 'ldl'
  | 'hdl'
  | 'triglycerides'
  | 'psa'
  | 'wbc'
  | 'hgb'
  | 'platelets';

export type BiomarkerCategory = 'gh' | 'glp1' | 'healing' | 'general';

export interface BiomarkerDef {
  key: BiomarkerKey;
  label: string;
  unit: string;
  /** Lower bound of safe range. */
  low: number;
  /** Upper bound of safe range. */
  high: number;
  /** Optional age-specific notes. */
  notes?: string;
  /** Which peptide categories this biomarker is most relevant to. */
  categories: BiomarkerCategory[];
}

export const BIOMARKERS: Record<BiomarkerKey, BiomarkerDef> = {
  igf_1: {
    key: 'igf_1',
    label: 'IGF-1',
    unit: 'ng/mL',
    low: 80,
    high: 280,
    notes: 'Age-adjusted. Keep upper-quartile, not supraphysiologic. >400 is concerning.',
    categories: ['gh'],
  },
  igfbp_3: {
    key: 'igfbp_3',
    label: 'IGFBP-3',
    unit: 'μg/mL',
    low: 2.5,
    high: 7.5,
    categories: ['gh'],
  },
  hba1c: {
    key: 'hba1c',
    label: 'HbA1c',
    unit: '%',
    low: 4.5,
    high: 5.6,
    notes: 'GH secretagogues may raise this; GLP-1s lower it.',
    categories: ['gh', 'glp1', 'general'],
  },
  fasting_glucose: {
    key: 'fasting_glucose',
    label: 'Fasting glucose',
    unit: 'mg/dL',
    low: 70,
    high: 99,
    categories: ['gh', 'glp1', 'general'],
  },
  fasting_insulin: {
    key: 'fasting_insulin',
    label: 'Fasting insulin',
    unit: 'μU/mL',
    low: 2,
    high: 12,
    categories: ['gh', 'glp1'],
  },
  homa_ir: {
    key: 'homa_ir',
    label: 'HOMA-IR',
    unit: 'index',
    low: 0.5,
    high: 1.9,
    notes: 'Computed: (insulin × glucose) / 405. >2.9 = insulin resistance.',
    categories: ['gh', 'glp1'],
  },
  lipase: {
    key: 'lipase',
    label: 'Lipase',
    unit: 'U/L',
    low: 10,
    high: 60,
    notes: 'Pancreatitis surveillance for GLP-1 users. >3× upper = stop drug, seek care.',
    categories: ['glp1'],
  },
  amylase: {
    key: 'amylase',
    label: 'Amylase',
    unit: 'U/L',
    low: 30,
    high: 110,
    categories: ['glp1'],
  },
  egfr: {
    key: 'egfr',
    label: 'eGFR',
    unit: 'mL/min/1.73m²',
    low: 60,
    high: 120,
    notes: 'GLP-1 volume depletion can drop this. <60 = CKD territory.',
    categories: ['glp1', 'general'],
  },
  tsh: {
    key: 'tsh',
    label: 'TSH',
    unit: 'μIU/mL',
    low: 0.4,
    high: 4.0,
    notes: 'Black-box MTC warning on GLP-1s — watch this.',
    categories: ['glp1'],
  },
  ft4: { key: 'ft4', label: 'Free T4', unit: 'ng/dL', low: 0.8, high: 1.8, categories: ['glp1'] },
  alt: {
    key: 'alt',
    label: 'ALT',
    unit: 'U/L',
    low: 7,
    high: 40,
    categories: ['glp1', 'general'],
  },
  ast: {
    key: 'ast',
    label: 'AST',
    unit: 'U/L',
    low: 8,
    high: 40,
    categories: ['glp1', 'general'],
  },
  hs_crp: {
    key: 'hs_crp',
    label: 'hs-CRP',
    unit: 'mg/L',
    low: 0,
    high: 3,
    notes: 'Systemic inflammation marker — useful for healing peptide response.',
    categories: ['healing', 'general'],
  },
  total_chol: {
    key: 'total_chol',
    label: 'Total cholesterol',
    unit: 'mg/dL',
    low: 125,
    high: 200,
    categories: ['glp1', 'general'],
  },
  ldl: {
    key: 'ldl',
    label: 'LDL',
    unit: 'mg/dL',
    low: 0,
    high: 100,
    categories: ['glp1', 'general'],
  },
  hdl: {
    key: 'hdl',
    label: 'HDL',
    unit: 'mg/dL',
    low: 40,
    high: 90,
    categories: ['glp1', 'general'],
  },
  triglycerides: {
    key: 'triglycerides',
    label: 'Triglycerides',
    unit: 'mg/dL',
    low: 0,
    high: 150,
    categories: ['glp1', 'general'],
  },
  psa: {
    key: 'psa',
    label: 'PSA',
    unit: 'ng/mL',
    low: 0,
    high: 4,
    notes: 'Baseline before starting angiogenic healing peptides (BPC-157, TB-500).',
    categories: ['healing'],
  },
  wbc: {
    key: 'wbc',
    label: 'WBC',
    unit: '×10³/μL',
    low: 4,
    high: 11,
    categories: ['healing', 'general'],
  },
  hgb: { key: 'hgb', label: 'Hgb', unit: 'g/dL', low: 12, high: 17, categories: ['healing', 'general'] },
  platelets: {
    key: 'platelets',
    label: 'Platelets',
    unit: '×10³/μL',
    low: 150,
    high: 400,
    categories: ['healing', 'general'],
  },
};

export interface BiomarkerPanel {
  key: BiomarkerCategory;
  label: string;
  description: string;
  recommended: BiomarkerKey[];
  cadence: string;
}

export const PANELS: Record<BiomarkerCategory, BiomarkerPanel> = {
  gh: {
    key: 'gh',
    label: 'GH Secretagogue Panel',
    description: 'CJC-1295, Ipamorelin, Hexarelin, Tesamorelin — monitor IGF-1 axis and insulin sensitivity.',
    recommended: ['igf_1', 'igfbp_3', 'hba1c', 'fasting_glucose', 'fasting_insulin', 'homa_ir'],
    cadence: 'Baseline + 8 weeks + quarterly.',
  },
  glp1: {
    key: 'glp1',
    label: 'GLP-1 Agonist Panel',
    description: 'Semaglutide, Tirzepatide, Retatrutide — pancreatitis surveillance, thyroid monitoring, renal function.',
    recommended: ['hba1c', 'fasting_glucose', 'lipase', 'amylase', 'egfr', 'tsh', 'alt', 'ast', 'total_chol', 'ldl', 'hdl', 'triglycerides'],
    cadence: 'Baseline + 12 weeks + biannual.',
  },
  healing: {
    key: 'healing',
    label: 'Healing Peptide Panel',
    description: 'BPC-157, TB-500, GHK-Cu — systemic inflammation, angiogenesis safety, pre-start cancer screening.',
    recommended: ['wbc', 'hgb', 'platelets', 'alt', 'ast', 'hs_crp', 'psa'],
    cadence: 'Baseline + 12 weeks. Age-appropriate cancer screening BEFORE starting.',
  },
  general: {
    key: 'general',
    label: 'General Health',
    description: 'Baseline markers any peptide user should trend.',
    recommended: ['hba1c', 'fasting_glucose', 'alt', 'ast', 'hs_crp', 'wbc', 'hgb'],
    cadence: 'Annual.',
  },
};

export type BiomarkerStatus = 'low' | 'in_range' | 'high' | 'critical';

export interface BiomarkerReading {
  key: BiomarkerKey;
  value: number;
  measuredAt: string;
}

export function biomarkerStatus(reading: BiomarkerReading): BiomarkerStatus {
  const def = BIOMARKERS[reading.key];
  const criticalFactor = 1.5;
  if (reading.value < def.low * 0.5) return 'critical';
  if (reading.value > def.high * criticalFactor) return 'critical';
  if (reading.value < def.low) return 'low';
  if (reading.value > def.high) return 'high';
  return 'in_range';
}

/**
 * Compute HOMA-IR from fasting insulin and fasting glucose.
 * Formula: (insulin μU/mL × glucose mg/dL) / 405
 */
export function computeHomaIr(fastingInsulinUUmL: number, fastingGlucoseMgDl: number): number {
  return (fastingInsulinUUmL * fastingGlucoseMgDl) / 405;
}
