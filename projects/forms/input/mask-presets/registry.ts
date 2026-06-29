import { signal } from '@angular/core';

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

/**
 * Eagerly loads every built-in preset table. Mainly a test/preload seam - the
 * directive loads tables on demand.
 * @internal
 */
export function loadAllMaskPresets(): Promise<void> {
  return Promise.all([
    ensureMaskPreset('phone'),
    ensureMaskPreset('date'),
    ensureMaskPreset('iban'),
    ensureMaskPreset('zip'),
  ]).then(() => undefined);
}
