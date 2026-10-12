import type { CngxActiveLanguagePack } from '@cngx/core/i18n';
// The paginator entry adds the `paginator` section to the pack type.
import type {} from '@cngx/ui/paginator';

/** Which language file the examples app root installed, from `?pack=`. */
export type DemoPackParam = 'de' | 'partial' | null;

function readPackParam(): DemoPackParam {
  try {
    const value = new URLSearchParams(location.search).get('pack');
    return value === 'de' || value === 'partial' ? value : null;
  } catch {
    // location may be unavailable; no pack is installed then.
    return null;
  }
}

// Captured once at module load: app.config imports this file before
// bootstrap, and the hash router's first navigation rewrites the URL without
// the query string, so a later location.search read would always be empty.
const INITIAL_PACK_PARAM = readPackParam();

/**
 * The `?pack=de` / `?pack=partial` value the page was loaded with (before the
 * hash). The app config installs the matching `provideCngxI18n(...)` at the
 * root; the pack stories read the same value for their readout.
 */
export function demoPackParam(): DemoPackParam {
  return INITIAL_PACK_PARAM;
}

/**
 * Reloads the page with `?pack=<pack>` (or without the parameter for `null`),
 * keeping the current hash route. A plain link cannot do this: once the router
 * dropped the query string, a link back to the bare URL is a same-document
 * hash change and never reloads.
 */
export function reloadWithPack(pack: DemoPackParam): void {
  const url = location.pathname + (pack ? `?pack=${pack}` : '') + location.hash;
  if (url === location.pathname + location.search + location.hash) {
    location.reload();
    return;
  }
  location.assign(url);
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
