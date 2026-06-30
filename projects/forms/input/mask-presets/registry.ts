import { type EnvironmentProviders, provideAppInitializer, signal } from '@angular/core';

/**
 * Built-in mask-preset table keys. `date` covers both the long and short date
 * tables (they ship in one module).
 *
 * @category forms/input
 */
export type MaskPresetKey = 'phone' | 'date' | 'iban' | 'zip';

/**
 * Lazily-loaded preset tables. Each field is populated on first use of a mask
 * that needs it; absent fields fall back to the directive's inline defaults.
 *
 * @category forms/input
 */
export interface MaskPresetTables {
  readonly phone?: Record<string, string>;
  readonly date?: Record<string, string>;
  readonly dateShort?: Record<string, string>;
  readonly iban?: Record<string, string>;
  readonly zip?: Record<string, string>;
}

const tables = signal<MaskPresetTables>({});

/**
 * Reactive view of the loaded preset tables. `CngxInputMask` reads it so the
 * masked value recomputes the moment a lazily-imported table arrives.
 * @internal
 */
export const maskPresetTables = tables.asReadonly();

const inflight = new Map<MaskPresetKey, Promise<void>>();

/**
 * Maps a mask preset name to the table key it needs, or `null` for table-less
 * presets (time / ip / mac / creditcard) and custom patterns.
 * @internal
 */
export function maskPresetKey(maskInput: string): MaskPresetKey | null {
  const name = maskInput.split(':')[0].toLowerCase();
  switch (name) {
    case 'phone':
      return 'phone';
    case 'date':
    case 'datetime':
      return 'date';
    case 'iban':
      return 'iban';
    case 'zip':
      return 'zip';
    default:
      return null;
  }
}

function loadTable(key: MaskPresetKey): Promise<Partial<MaskPresetTables>> {
  switch (key) {
    case 'phone':
      return import('./phone-patterns').then((m) => ({ phone: m.PHONE_PATTERNS }));
    case 'date':
      return import('./date-formats').then((m) => ({
        date: m.DATE_FORMATS,
        dateShort: m.DATE_SHORT_FORMATS,
      }));
    case 'iban':
      return import('./iban-patterns').then((m) => ({ iban: m.IBAN_PATTERNS }));
    case 'zip':
      return import('./zip-patterns').then((m) => ({ zip: m.ZIP_PATTERNS }));
  }
}

/**
 * Lazily imports a preset table and merges it into {@link maskPresetTables}.
 * Cached: a second call for the same key returns the in-flight/settled promise
 * without re-importing.
 * @internal
 */
export function ensureMaskPreset(key: MaskPresetKey): Promise<void> {
  if (key in tables() || inflight.has(key)) {
    return inflight.get(key) ?? Promise.resolve();
  }
  const load = loadTable(key).then((slice) => {
    tables.update((current) => ({ ...current, ...slice }));
  });
  inflight.set(key, load);
  return load;
}

const ALL_PRESET_KEYS: readonly MaskPresetKey[] = ['phone', 'date', 'iban', 'zip'];

/**
 * Eagerly loads every built-in preset table. Mainly a test/preload seam - the
 * directive loads tables on demand.
 * @internal
 */
export function loadAllMaskPresets(): Promise<void> {
  return Promise.all(ALL_PRESET_KEYS.map(ensureMaskPreset)).then(() => undefined);
}

/**
 * Eagerly loads the lazily code-split mask preset tables at application start,
 * instead of on first use. Reach for it when the on-demand `import()` is a
 * problem - chiefly **offline / PWA** apps that must have every mask pattern
 * cached before connectivity drops, or to avoid the one-frame generic-fallback
 * mask on first focus.
 *
 * Pass specific keys to warm only the tables you ship; omit them to load all
 * four. For strict offline-first apps, also list the emitted `mask-presets-*`
 * chunks in your service-worker precache so the eager fetch is cached.
 *
 * ```typescript
 * bootstrapApplication(App, {
 *   providers: [provideEagerMaskPresets()],            // all tables
 * });
 * // or: provideEagerMaskPresets('phone', 'date')      // only these
 * ```
 *
 * @category forms/input
 * @since 0.1.0
 * @relatedTo CngxInputMask, provideInputConfig
 */
export function provideEagerMaskPresets(...keys: MaskPresetKey[]): EnvironmentProviders {
  const targets = keys.length ? keys : ALL_PRESET_KEYS;
  return provideAppInitializer(() => Promise.all(targets.map(ensureMaskPreset)));
}
