/**
 * Local photo storage for inventory + batches.
 *
 * Flow:
 *  1. User picks/snaps a photo via expo-image-picker
 *  2. We copy it into ${documentDirectory}peptpal-photos/ with a unique name
 *  3. DB stores only the filename (relative) so backup/restore and device
 *     migration work without absolute paths
 *
 * Photos never leave the device. Excluded from API traffic.
 */
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

const PHOTOS_DIR = `${FileSystem.documentDirectory}peptpal-photos/`;

async function ensurePhotosDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }
}

function randomId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface PickedPhoto {
  /** Filename stored in the photos directory. */
  filename: string;
}

/** Ask permission + launch camera roll / camera. Returns null if cancelled. */
export async function pickFromLibrary(): Promise<PickedPhoto | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    allowsEditing: false,
  });
  if (res.canceled || !res.assets[0]) return null;
  return saveAsset(res.assets[0].uri);
}

export async function pickFromCamera(): Promise<PickedPhoto | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    allowsEditing: false,
  });
  if (res.canceled || !res.assets[0]) return null;
  return saveAsset(res.assets[0].uri);
}

async function saveAsset(sourceUri: string): Promise<PickedPhoto> {
  await ensurePhotosDir();
  // Preserve original extension if possible, else default to jpg.
  const ext = sourceUri.split('.').pop()?.split('?')[0]?.toLowerCase();
  const safeExt = ext && /^(jpg|jpeg|png|heic|webp)$/.test(ext) ? ext : 'jpg';
  const filename = `${randomId()}.${safeExt}`;
  const dest = PHOTOS_DIR + filename;
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return { filename };
}

export function resolvePhotoUri(filename: string): string {
  return PHOTOS_DIR + filename;
}

export async function deletePhoto(filename: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(PHOTOS_DIR + filename, { idempotent: true });
  } catch {
    // Non-fatal.
  }
}
