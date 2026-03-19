import { z } from 'zod';

// ─── Peptide Reference (from API) ─────────────────────────────────────────────

export const PeptideRouteSchema = z.enum(['subq', 'im', 'intranasal', 'topical']);
export type PeptideRoute = z.infer<typeof PeptideRouteSchema>;

export const StorageTempSchema = z.enum(['fridge', 'freezer']);
export type StorageTemp = z.infer<typeof StorageTempSchema>;

export const CommonProtocolSchema = z.object({
  name: z.string(),
  description: z.string(),
});
export type CommonProtocol = z.infer<typeof CommonProtocolSchema>;

export const PeptideSummarySchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  aliases: z.array(z.string()),
  storage_temp: StorageTempSchema,
  routes: z.array(PeptideRouteSchema),
  half_life_hours: z.number().nullable(),
});
export type PeptideSummary = z.infer<typeof PeptideSummarySchema>;

export const PeptideDetailSchema = PeptideSummarySchema.extend({
  description: z.string(),
  disclaimer: z.string(),
  recommended_dose_mcg_min: z.number().nullable(),
  recommended_dose_mcg_max: z.number().nullable(),
  max_dose_mcg: z.number().nullable(),
  frequency_notes: z.string().nullable(),
  common_protocols: z.array(CommonProtocolSchema),
  side_effects: z.array(z.string()),
  synergies: z.array(z.string()),
});
export type PeptideDetail = z.infer<typeof PeptideDetailSchema>;

// ─── Local DB types ────────────────────────────────────────────────────────────

export const InjectionSiteSchema = z.enum([
  'abdomen_left',
  'abdomen_right',
  'thigh_left',
  'thigh_right',
  'glute_left',
  'glute_right',
  'deltoid_left',
  'deltoid_right',
]);
export type InjectionSite = z.infer<typeof InjectionSiteSchema>;

export const InjectionLogSchema = z.object({
  id: z.number(),
  peptide_ref_id: z.number(),
  peptide_name: z.string(),
  injected_at: z.string(), // ISO string
  dose_mcg: z.number(),
  dose_ml: z.number().nullable(),
  injection_site: InjectionSiteSchema.nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  deleted_at: z.string().nullable(),
});
export type InjectionLog = z.infer<typeof InjectionLogSchema>;

export const SymptomLogSchema = z.object({
  id: z.number(),
  peptide_log_id: z.number().nullable(),
  symptom: z.string(),
  severity: z.number().min(1).max(10),
  occurred_at: z.string(),
  notes: z.string().nullable(),
  created_at: z.string(),
  deleted_at: z.string().nullable(),
});
export type SymptomLog = z.infer<typeof SymptomLogSchema>;

export const InventoryItemSchema = z.object({
  id: z.number(),
  peptide_ref_id: z.number(),
  peptide_name: z.string(),
  vial_count: z.number(),
  vial_size_mg: z.number(),
  reconstituted: z.boolean(),
  bac_water_added_ml: z.number().nullable(),
  concentration_mcg_per_ml: z.number().nullable(),
  opened_at: z.string().nullable(),
  expiry_at: z.string().nullable(),
  storage_location: StorageTempSchema,
  notes: z.string().nullable(),
  created_at: z.string(),
  deleted_at: z.string().nullable(),
});
export type InventoryItem = z.infer<typeof InventoryItemSchema>;

export const ScheduleSchema = z.object({
  id: z.number(),
  peptide_ref_id: z.number(),
  peptide_name: z.string(),
  frequency_hours: z.number().nullable(),
  dose_mcg: z.number(),
  start_date: z.string(),
  end_date: z.string().nullable(),
  reminder_enabled: z.boolean(),
  created_at: z.string(),
  deleted_at: z.string().nullable(),
});
export type Schedule = z.infer<typeof ScheduleSchema>;

// ─── API response wrappers ─────────────────────────────────────────────────────

export const ApiListResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
  });

export const CommunitySubmissionSchema = z.object({
  peptide_id: z.number().nullable().optional(),
  field_name: z.string().min(1),
  suggested_value: z.string().min(1),
  rationale: z.string().min(10),
  submitter_email: z.string().email().optional().or(z.literal('')),
});
export type CommunitySubmission = z.infer<typeof CommunitySubmissionSchema>;
