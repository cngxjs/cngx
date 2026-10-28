import type { CngxRadioSkin } from './radio.config';
import type { CngxRadioConfigFeature } from './provide-radio-config';

/**
 * Set the skin every `cngx-radio-indicator` in scope falls back to.
 * An instance or group `[skin]` binding still wins.
 *
 * ```ts
 * provideRadioConfig(withRadioSkin('check'));
 * ```
 */
export function withRadioSkin(skin: CngxRadioSkin): CngxRadioConfigFeature {
  return { kind: 'skin', payload: skin };
}
