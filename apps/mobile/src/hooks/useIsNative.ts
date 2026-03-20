import { Platform } from 'react-native';

/** True when running on iOS or Android (native SQLite available). False on web. */
export function useIsNative(): boolean {
  return Platform.OS !== 'web';
}
