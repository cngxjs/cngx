import type { CngxActiveLanguagePack } from '@cngx/core/i18n';
// The paginator entry adds the `paginator` section to the pack type.
import type {} from '@cngx/ui/paginator';

/** Which language file the examples app root installed, from `?pack=`. */
export type DemoPackParam = 'de' | 'partial' | null;

/**
 * Reads `?pack=de` / `?pack=partial` from the page URL (before the hash).
 * The app config installs the matching `provideCngxI18n(...)` at the root;
 * the pack stories read the same value for their readout.
 */
export function demoPackParam(): DemoPackParam {
  try {
    const value = new URLSearchParams(location.search).get('pack');
    return value === 'de' || value === 'partial' ? value : null;
  } catch {
    // location may be unavailable; no pack is installed then.
    return null;
  }
}

/**
 * The partial pack `?pack=partial` installs through `withPartialPack`: a
 * German locale and two paginator keys. Every key it leaves out reads
 * English, formatted for the German locale.
 */
export const DEMO_PARTIAL_PACK: CngxActiveLanguagePack = {
  locale: 'de',
  paginator: {
    range: '<b>{start}–{end}</b> von {total}',
    loadMore: 'Weitere laden',
  },
};
