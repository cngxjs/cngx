import { clamp } from '@cngx/utils';

/**
 * Loaded and total bytes as an integer percent from 0 to 100, or `undefined`
 * without a positive total (indeterminate progress).
 *
 * @internal
 */
export function progressPercent(loaded: number, total: number | null | undefined): number | undefined {
  if (total == null || total <= 0) {
    return undefined;
  }
  return clamp(Math.round((100 * loaded) / total), 0, 100);
}
