import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
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

/**
 * The writing-direction axis cngx derives from the DOM. `ltr` and `rtl`
 * are the only two values the reactive graph reasons about; `dir="auto"`,
 * an unknown value, and an absent `dir` all normalise to `'ltr'` (native
 * CSS/bidi still honour `dir="auto"` in the DOM - the signal is a binary
 * axis for logic, not a mirror of the browser's per-content resolution).
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
 * *reports*, never the DOM.
 *
 * Resolution reads `documentElement.dir` (falling back to `document.dir`)
 * and normalises via `d === 'rtl' ? 'rtl' : 'ltr'`. On a browser platform
 * it installs a single `MutationObserver` on `documentElement`
 * (`attributeFilter: ['dir']`, no `subtree`) that re-reads on a root flip;
 * `inject(DestroyRef)` disconnects it. In SSR (`isPlatformBrowser` is
 * false) the signal seeds once and no observer is installed - the same
 * platform guard `window.token.ts` uses.
 *
 * @remarks
 * Two behaviours are registered debt (see the direction accepted-debt
 * register), not oversights:
 * - **Subtree / re-parenting is untracked.** The observer is scoped to
 *   `documentElement` `dir` only. A subtree that needs a forced direction
 *   uses {@link CngxDir} (CSS/bidi) or `provideDirection()` in
 *   `viewProviders` (the reported signal). The reader does not walk
 *   `closest('[dir]')` or observe the ancestor chain.
 * - **`dir="auto"` resolves to `'ltr'`.** The signal is a binary logic
 *   axis; reading the browser's per-content resolution would mean
 *   measuring rendered text.
 *
 * @internal
 */
function readDocumentDirection(): Signal<CngxDirection> {
  const doc = inject(DOCUMENT);
  const root = doc.documentElement;
  const normalise = (value: string | null | undefined): CngxDirection =>
    value === 'rtl' ? 'rtl' : 'ltr';
  const read = (): CngxDirection => normalise(root?.dir || doc.dir);

  const direction = signal<CngxDirection>(read());

  if (isPlatformBrowser(inject(PLATFORM_ID))) {
    const observer = new MutationObserver(() => direction.set(read()));
    observer.observe(root, { attributes: true, attributeFilter: ['dir'] });
    inject(DestroyRef).onDestroy(() => observer.disconnect());
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
 * owns, it never sets it.
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
 * fixed value, without touching `documentElement.dir`. Use it in tests, in
 * SSR with a known locale, or in a composite's `viewProviders` to force the
 * direction its keyboard-nav logic honours for that DI subtree. It installs
 * no observer and never writes the DOM - `dir` stays the app's to set.
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
