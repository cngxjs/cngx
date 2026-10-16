import {
  ApplicationRef,
  createEnvironmentInjector,
  DestroyRef,
  DOCUMENT,
  EnvironmentInjector,
  inject,
  runInInjectionContext,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';

/** A demo-only stand-in for an application root. */
export interface IsolatedRoot {
  /** The detached document whose `<html>` the root reflectors stamp. */
  readonly document: Document;
  /** Runs `fn` in the isolated root's injection context. */
  run<T>(fn: () => T): T;
}

/**
 * Builds a child environment injector from `providers` so a story can show
 * root-level `EnvironmentProviders` (which a component cannot take in
 * `viewProviders`) without a second app. `DOCUMENT` points at a detached
 * document, so root reflectors such as `provideDensity()` stamp that
 * document's `<html>` instead of the live examples page, which already owns
 * the real root reflectors. It also stands in for `ApplicationRef.injector`,
 * so a root-only check sees a root. The injector is destroyed with the calling
 * component. Call it in an injection context (a field initializer).
 */
export function createIsolatedRoot(providers: (Provider | EnvironmentProviders)[]): IsolatedRoot {
  const document = inject(DOCUMENT).implementation.createHTMLDocument('isolated root');
  const appRef = inject(ApplicationRef);
  const injector = createEnvironmentInjector(
    [
      { provide: DOCUMENT, useValue: document },
      // Root-only checks (CNGX0005) compare against ApplicationRef.injector:
      // this stand-in root reports itself, everything else delegates.
      {
        provide: ApplicationRef,
        useFactory: (): ApplicationRef =>
          Object.create(appRef, { injector: { value: inject(EnvironmentInjector) } }),
      },
      ...providers,
    ],
    inject(EnvironmentInjector),
  );
  inject(DestroyRef).onDestroy(() => injector.destroy());
  return { document, run: (fn) => runInInjectionContext(injector, fn) };
}
