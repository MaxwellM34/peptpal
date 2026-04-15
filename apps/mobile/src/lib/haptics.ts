/**
 * Tiny wrapper around expo-haptics so the caller doesn't need a try/catch
 * on every fire. Haptics are best-effort UX — never throw.
 */
import * as Haptics from 'expo-haptics';

export async function hapticTap(): Promise<void> {
  try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch { /* noop */ }
}

export async function hapticSuccess(): Promise<void> {
  try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch { /* noop */ }
}

export async function hapticWarn(): Promise<void> {
  try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch { /* noop */ }
}

export async function hapticError(): Promise<void> {
  try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch { /* noop */ }
}
