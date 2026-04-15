/**
 * Pseudonymous client identifier for the community forum.
 * Generated once on first forum interaction, persisted in SecureStore.
 * No PII — just a UUID that ties your posts together so you can edit/delete them.
 */
import * as SecureStore from 'expo-secure-store';

const KEY = 'peptpal.forum.client_uuid';

function randomUuid(): string {
  // RFC4122 v4-ish; good enough for a pseudonymous id.
  const hex = (n: number) => Math.floor(Math.random() * 16 ** n).toString(16).padStart(n, '0');
  return `${hex(8)}-${hex(4)}-4${hex(3)}-a${hex(3)}-${hex(12)}`;
}

export async function getClientUuid(): Promise<string> {
  try {
    const existing = await SecureStore.getItemAsync(KEY);
    if (existing) return existing;
  } catch {
    // SecureStore unavailable — fall through.
  }
  const fresh = randomUuid();
  try {
    await SecureStore.setItemAsync(KEY, fresh);
  } catch {
    // Non-fatal. Next call will generate a new one — so the user just stays anonymous.
  }
  return fresh;
}
