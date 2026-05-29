import { InjectionToken, PLATFORM_ID, inject, type Provider } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Provides access to the browser `Window` object. Returns `null` in SSR.
 *
 * Always null-check the injected value — do not assert with `!`:
 * ```typescript
 * const win = injectWindow();
 * if (!win) return; // SSR — no window available
 * win.matchMedia('(min-width: 1024px)');
 * ```
 *
 * @category core/tokens
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/tokens/window.token.ts
 * @since 0.1.0
 */
export const WINDOW = new InjectionToken<Window | null>('NGX_CAE_WINDOW', {
  providedIn: 'root',
  factory: () => {
    const platformId = inject(PLATFORM_ID);
    return isPlatformBrowser(platformId) ? window : null;
  },
});

/**
 * Provides a custom `Window` reference (useful for testing or SSR).
 *
 * @category core/tokens
 */
export function provideWindow(win: Window | null): Provider {
  return { provide: WINDOW, useValue: win };
}

/**
 * Injects the `WINDOW` token. Returns `null` in SSR contexts.
 *
 * @category core/tokens
 */
export function injectWindow(): Window | null {
  return inject(WINDOW);
}
