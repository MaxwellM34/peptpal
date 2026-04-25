import { PeptideDetailSchema } from '@peptpal/core';
import { z } from 'zod';

const PeptideListResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.number(),
      slug: z.string(),
      name: z.string(),
      aliases: z.array(z.string()),
      storage_temp: z.enum(['fridge', 'freezer']),
      routes: z.array(z.enum(['subq', 'im', 'intranasal', 'topical'])),
      half_life_hours: z.number().nullable(),
    }),
  ),
  total: z.number(),
});

const BASE_URL = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:8000';

async function apiFetch<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`);
  }
  const json: unknown = await res.json();
  return schema.parse(json);
}

export async function fetchPeptideList() {
  return apiFetch('/api/peptides', PeptideListResponseSchema);
}

export async function fetchPeptideDetail(slug: string) {
  return apiFetch(`/api/peptides/${slug}`, PeptideDetailSchema);
}

export async function searchPeptides(q: string) {
  return apiFetch(`/api/peptides/search?q=${encodeURIComponent(q)}`, PeptideListResponseSchema);
}

export async function submitCommunityReport(payload: {
  peptide_id?: number | null;
  field_name: string;
  suggested_value: string;
  rationale: string;
  submitter_email?: string;
}) {
  const res = await fetch(`${BASE_URL}/api/community/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Submission failed: ${err}`);
  }
  return res.json();
}

// ─── Forum API ────────────────────────────────────────────────────────────────

export interface DoseLogPostOut {
  id: number;
  user_id: number;
  user_handle: string | null;
  peptide_slug: string;
  dose_mcg: number;
  doses_per_week: number;
  weeks_on: number | null;
  user_weight_kg: number;
  goal: string;
  outcome_score: number | null;
  side_effect_severity: number | null;
  bloodwork_attached: boolean;
  body_composition_attached: boolean;
  batch_info_attached: boolean;
  longitudinal: boolean;
  vendor_flagged: boolean;
  body: string | null;
  attachments: string[];
  upvotes: number;
  downvotes: number;
  created_at: string;
}

export interface ConsensusSnapshotOut {
  peptide_slug: string;
  goal: string;
  weight_bracket_kg_min: number;
  weight_bracket_kg_max: number;
  n_posts: number;
  median_mcg_per_kg_per_week: number;
  p25_mcg_per_kg_per_week: number;
  p75_mcg_per_kg_per_week: number;
  minority_protocols: Array<{
    label: string;
    median_mcg_per_kg_per_week: number;
    weight_share: number;
    n: number;
  }>;
  low_confidence: boolean;
  computed_at: string;
}

async function postJson<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function getJson<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function registerForumUser(client_uuid: string, handle?: string) {
  return postJson(`/api/forum/users`, { client_uuid, handle });
}

export async function listDoseLogPosts(peptide_slug: string, goal?: string): Promise<DoseLogPostOut[]> {
  const params = new URLSearchParams({ peptide_slug });
  if (goal) params.set('goal', goal);
  return getJson<DoseLogPostOut[]>(`/api/forum/posts?${params.toString()}`);
}

export async function createDoseLogPost(payload: {
  client_uuid: string;
  peptide_slug: string;
  dose_mcg: number;
  doses_per_week: number;
  weeks_on?: number;
  user_weight_kg: number;
  goal: string;
  outcome_score?: number;
  side_effect_severity?: number;
  bloodwork_attached?: boolean;
  body_composition_attached?: boolean;
  batch_info_attached?: boolean;
  longitudinal?: boolean;
  body?: string;
  attachments?: string[];
}): Promise<DoseLogPostOut> {
  return postJson<DoseLogPostOut>(`/api/forum/posts`, payload);
}

export async function voteOnPost(post_id: number, client_uuid: string, value: -1 | 0 | 1) {
  return postJson(`/api/forum/posts/${post_id}/vote`, { client_uuid, value });
}

export async function reportPost(post_id: number, client_uuid: string, reason: string, notes?: string) {
  return postJson(`/api/forum/posts/${post_id}/report`, { client_uuid, reason, notes });
}

export async function getConsensus(peptide_slug: string, weight_kg?: number, goal?: string): Promise<ConsensusSnapshotOut[]> {
  const params = new URLSearchParams({ peptide_slug });
  if (weight_kg != null) params.set('weight_kg', String(weight_kg));
  if (goal) params.set('goal', goal);
  return getJson<ConsensusSnapshotOut[]>(`/api/forum/consensus?${params.toString()}`);
}

// ─── Feedback API ─────────────────────────────────────────────────────────────

export type FeedbackCategory = 'bug' | 'feature' | 'general';

export interface FeedbackOut {
  id: number;
  category: string;
  body: string;
  email: string | null;
  client_uuid: string | null;
  app_version: string | null;
  platform: string | null;
  status: string;
  created_at: string;
}

export async function submitFeedback(payload: {
  category: FeedbackCategory;
  body: string;
  email?: string;
  client_uuid?: string;
  app_version?: string;
  platform?: string;
}): Promise<FeedbackOut> {
  return postJson<FeedbackOut>(`/api/feedback`, payload);
}
