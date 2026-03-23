import { InjectionToken, PLATFORM_ID, inject, type Provider } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const WINDOW = new InjectionToken<Window | null>('NGX_CAE_WINDOW', {
  providedIn: 'root',
  factory: () => {
    const platformId = inject(PLATFORM_ID);
    return isPlatformBrowser(platformId) ? window : null;
  },
});

/** Provides a custom `Window` reference (useful for testing or SSR). */
export function provideWindow(win: Window | null): Provider {
  return { provide: WINDOW, useValue: win };
}

/** Injects the `WINDOW` token. Returns `null` in SSR contexts. */
export function injectWindow(): Window | null {
  return inject(WINDOW);
}
