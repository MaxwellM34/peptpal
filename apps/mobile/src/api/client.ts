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
