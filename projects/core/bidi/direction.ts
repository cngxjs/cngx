import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  DestroyRef,
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  PLATFORM_ID,
  signal,
  type EnvironmentProviders,
  type Provider,
  type Signal,
} from '@angular/core';
import { cngxDevWarn } from '@cngx/utils';

/**
 * The writing-direction axis cngx derives from the DOM. `ltr` and `rtl`
 * are the only two values the reactive graph reasons about. A root
 * `dir="auto"` reports what the browser resolved for `<html>` (its
 * `:dir(rtl)` state); an absent `dir` reports `'ltr'`, and so does an
 * invalid value, with a dev-mode warning (CNGX0006).
 *
 * @category core/bidi
 * @since 0.1.0
 */
export type CngxDirection = 'ltr' | 'rtl';

/**
 * Reads the document-root writing direction into a signal and keeps it in
 * sync with root-level runtime `dir` flips.
 *
 * Unlike the app-owned {@link CNGX_MOTION} / {@link CNGX_CONTRAST}
 * preference tokens - which hold a `WritableSignal` the app sets and an
 * `effect` reflector writes onto `<html>` - `dir` is a platform attribute
 * the app / Angular i18n / the user already owns on `<html dir>`. cngx
 * **reads** it and must not fight it: the token holds a read-only
 * `Signal`, and {@link provideDirection} overrides only what the signal
 * *reports*, never the DOM. The one exception is `provideCngxI18n` from
 * `@cngx/core/i18n`: when it manages the document language, it writes
 * `<html dir>` from the active language pack and provides this token from
 * the same pack instead of reading the DOM.
 *
 * Resolution reads the root `dir` attribute (falling back to `document.dir`),
 * lowercased and untrimmed like the browser does: `rtl` is `'rtl'`; `ltr`,
 * empty or absent is `'ltr'`; `auto` is the root's `:dir(rtl)` match on a
 * browser and `'ltr'` on the server; anything else is `'ltr'` plus a
 * dev-mode CNGX0006 warning, once per distinct value. A root `dir="auto"` is
 * decided by the first strong character in tree order, so text in `<head>`
 * (a `<title>`) wins over the app. Without such text, a client-rendered app
 * has nothing to decide on when the token is first injected, so the value is
 * read once more after the first render. On
 * a browser platform it installs a single `MutationObserver` on
 * `documentElement` (`attributeFilter: ['dir']`, no `subtree`) that re-reads
 * on a root flip; `inject(DestroyRef)` disconnects it. In SSR
 * (`isPlatformBrowser` is false) the signal seeds once and no observer is
 * installed - the same platform guard `window.token.ts` uses.
 *
 * @remarks
 * Two behaviours are registered debt (see the direction accepted-debt
 * register), not oversights:
 * - **Subtree / re-parenting is untracked.** The observer is scoped to
 *   `documentElement` `dir` only. A subtree that needs a forced direction
 *   uses {@link CngxDir} (CSS/bidi) or {@link provideDirectionAt} in
 *   `viewProviders` (the reported signal). The reader does not walk
 *   `closest('[dir]')` or observe the ancestor chain.
 * - **`dir="auto"` is not re-resolved when content changes.** It is read at
 *   construction, after the first render and on every root `dir` mutation.
 *   Content that lands later (routed views, lazy routes, late data) does
 *   not re-read it; observing every text change would cost a permanent
 *   subtree observer. Set `dir` explicitly when the direction depends on
 *   such content.
 *
 * @internal
 */
function readDocumentDirection(): Signal<CngxDirection> {
  const doc = inject(DOCUMENT);
  const root = doc.documentElement;
  const browser = isPlatformBrowser(inject(PLATFORM_ID));
  // Enumerated attributes match ASCII-case-insensitively but are not trimmed,
  // so `" rtl"` is as invalid for the browser as it is here.
  const authoredDir = (): string => root?.getAttribute('dir') ?? doc.dir ?? '';
  const rawDir = (): string => authoredDir().toLowerCase();
  let lastWarned: string | null = null;

  const resolveAuto = (): CngxDirection => {
    if (!browser || !root) {
      return 'ltr';
    }
    try {
      return root.matches(':dir(rtl)') ? 'rtl' : 'ltr';
    } catch {
      // An engine without `:dir()` throws a SyntaxError on the selector.
      return 'ltr';
    }
  };

  const read = (): CngxDirection => {
    const authored = authoredDir();
    // Deduped on the lowercased value, the one the browser compares.
    const raw = authored.toLowerCase();
    if (raw === 'rtl' || raw === 'ltr' || raw === 'auto' || raw === '') {
      lastWarned = null;
      if (raw === 'rtl') {
        return 'rtl';
      }
      return raw === 'auto' ? resolveAuto() : 'ltr';
    }
    if (typeof ngDevMode !== 'undefined' && ngDevMode && raw !== lastWarned) {
      lastWarned = raw;
      cngxDevWarn(
        'CNGX0006',
        `injectDirection() ignores <html dir="${authored}">; only "ltr", "rtl" and "auto" are valid, so the direction reads 'ltr'.`,
      );
    }
    return 'ltr';
  };

  const direction = signal<CngxDirection>(read());

  if (browser) {
    const observer = new MutationObserver(() => direction.set(read()));
    observer.observe(root, { attributes: true, attributeFilter: ['dir'] });
    inject(DestroyRef).onDestroy(() => observer.disconnect());
    // Strong text in `<head>` already decided `dir="auto"`; without it the
    // decision waits for the app's own text, which lands with the first render.
    if (rawDir() === 'auto') {
      afterNextRender(() => direction.set(read()));
    }
  }

  return direction.asReadonly();
}

/**
 * Holds the document writing direction as a **read-only** `Signal`. Read
 * it through {@link injectDirection}; override what it reports (tests, SSR
 * with a known locale, a composite DI-scope) with {@link provideDirection}.
 * Defaults to a live DOM reader when no `provideDirection()` is present, so
 * an injected signal is always available.
 *
 * @category core/bidi
 * @relatedTo injectDirection
 * @relatedTo provideDirection
 * @since 0.1.0
 */
export const CNGX_DIRECTION = new InjectionToken<Signal<CngxDirection>>('CNGX_DIRECTION', {
  providedIn: 'root',
  factory: readDocumentDirection,
});

/**
 * Read the document writing-direction signal in an injection context.
 * Returns `'rtl'` under `<html dir="rtl">` and re-signals on a runtime
 * root flip. The signal is read-only: cngx reports the direction the DOM
 * owns and never sets it, unless `provideCngxI18n` manages the document
 * language - then the signal is the active language pack's direction and
 * flips in the same pass as the copy.
 *
 * @category core/bidi
 * @relatedTo CNGX_DIRECTION
 * @relatedTo provideDirection
 * @since 0.1.0
 */
export function injectDirection(): Signal<CngxDirection> {
  return inject(CNGX_DIRECTION);
}

/**
 * Override the direction the {@link CNGX_DIRECTION} signal *reports* with a
 * fixed value, without touching `documentElement.dir`. This is the
 * **environment-scoped** entry - bootstrap `providers` or route `providers`.
 * Use it in tests or in SSR with a known locale. It installs no observer and
 * never writes the DOM - `dir` stays the app's to set. For a per-subtree
 * override in a component's `viewProviders`, use {@link provideDirectionAt}
 * (element injectors reject the `EnvironmentProviders` this returns).
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [provideDirection('rtl')],
 * });
 * ```
 *
 * This overload takes a fixed value. To drive the reported direction from a
 * *reactive* source (a router-derived locale signal, a settings store),
 * override {@link CNGX_DIRECTION} directly with a `useFactory` returning your
 * own `Signal<CngxDirection>`:
 * `{ provide: CNGX_DIRECTION, useFactory: () => myLocaleDirection }`.
 *
 * @category core/bidi
 * @relatedTo CNGX_DIRECTION
 * @relatedTo provideDirectionAt
 * @relatedTo injectDirection
 * @since 0.1.0
 */
export function provideDirection(value: CngxDirection): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: CNGX_DIRECTION, useFactory: () => signal<CngxDirection>(value).asReadonly() },
  ]);
}

/**
 * Element-injector twin of {@link provideDirection}. Returns `Provider[]`
 * so it can go in a component's `viewProviders` (or `providers`) array,
 * forcing the direction {@link injectDirection} reports for that DI subtree
 * without touching `documentElement.dir`. Reach for it when a composite's
 * keyboard-nav logic must honour a forced subtree direction; the
 * environment-scoped {@link provideDirection} returns `EnvironmentProviders`,
 * which an element injector rejects.
 *
 * ```ts
 * @Component({
 *   selector: 'rtl-panel',
 *   viewProviders: [provideDirectionAt('rtl')],
 *   // ...
 * })
 * export class RtlPanel {}
 * ```
 *
 * @category core/bidi
 * @relatedTo CNGX_DIRECTION
 * @relatedTo provideDirection
 * @relatedTo injectDirection
 * @since 0.1.0
 */
export function provideDirectionAt(value: CngxDirection): Provider[] {
  return [{ provide: CNGX_DIRECTION, useFactory: () => signal<CngxDirection>(value).asReadonly() }];
}
