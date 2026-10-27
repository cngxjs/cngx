import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { provideDirection } from '@cngx/core';
import { provideCngxI18n, withDocumentLanguage } from '@cngx/core/i18n';
import { provideLoadingConfig, withMinDwell, withShowDelay } from '@cngx/core/utils';

/**
 * Makes cngx deterministic under `TestBed`. Add it once to the testing
 * module's `providers`, first in the array:
 *
 * ```ts
 * TestBed.configureTestingModule({ providers: [provideCngxTesting()] });
 * ```
 *
 * What it pins:
 *
 * - **Loading timing.** Show delay and min dwell are `0`, so there is no
 *   delay to compute. Both are still timers, and the min-dwell timer is only
 *   scheduled when the indicator shows: after the state turns busy, advance a
 *   fake clock by `showDelay + minDwell + 1` (here `1`; with real timers, let
 *   two macrotasks pass). The indicator then shows with its dwell over and
 *   hides on the flush after the state settles. An advance of `0` runs the
 *   show timer only. The spinner-vs-skeleton cutoff keeps its default.
 * - **Language.** The English pack with the document language off: the locale
 *   is `en` and nothing is written to `<html lang>` or `<html dir>`, so one
 *   spec cannot leak a language into the next in a shared document. The
 *   pinned locale outranks `LOCALE_ID` at every level, a component-level
 *   `{ provide: LOCALE_ID, useValue: 'de-DE' }` included; a spec that tests
 *   another locale overrides it with `provideLocale` or a pack.
 * - **Direction.** `ltr`, independent of `<html dir>`.
 *
 * Nothing it provides writes to the DOM.
 *
 * Overriding one piece is composition, not an option: a later provider for
 * the same token in the same `providers` array wins.
 *
 * ```ts
 * providers: [
 *   provideCngxTesting(),
 *   provideLoadingConfig(withShowDelay(200)),
 *   provideCngxI18n(withPack(de), withDocumentLanguage('off')),
 * ]
 * ```
 *
 * Keep `withDocumentLanguage('off')` in a pack override. Without it,
 * `provideCngxI18n` writes the pack's language and direction to `<html>` and
 * reports the pack's direction instead of `ltr`.
 *
 * Motion is not pinned: no cngx runtime reads the motion preference token,
 * so pinning it would change nothing under jsdom. Browser-mode suites that
 * want reduced motion add `provideMotion('reduced')` themselves; it sets
 * `<html data-motion>` and leaves it in place when the test module is torn
 * down, so remove the attribute after the spec. Either way,
 * `onTransitionDone` keeps its fallback timer: the computed transition time
 * plus 50 ms, which is 50 ms under jsdom, where no stylesheet loads.
 *
 * @since 0.1.0
 * @relatedTo provideLoadingConfig, provideCngxI18n, provideDirection
 */
export function provideCngxTesting(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideLoadingConfig(withShowDelay(0), withMinDwell(0)),
    provideCngxI18n(withDocumentLanguage('off')),
    provideDirection('ltr'),
  ]);
}
