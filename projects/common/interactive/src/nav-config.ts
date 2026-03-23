import { InjectionToken } from '@angular/core';

/** Configuration options for the cngx nav system. */
export interface CngxNavConfig {
  /**
   * Indentation in px per depth level.
   * Applied via `--cngx-nav-indent` CSS custom property.
   * @default 12
   */
  indent?: number;

  /**
   * When `true`, only one `CngxNavGroup` can be open at a time within
   * the same provider scope. Opening one group closes the others.
   * @default false
   */
  singleAccordion?: boolean;

  /**
   * Default animation duration in ms for disclosure transitions.
   * Applied via `--cngx-nav-transition` CSS custom property.
   * @default 150
   */
  animationDuration?: number;
}

/** Default nav configuration values. */
export const CNGX_NAV_DEFAULTS: Readonly<Required<CngxNavConfig>> = {
  indent: 12,
  singleAccordion: false,
  animationDuration: 150,
};

/**
 * Injection token for nav system configuration.
 *
 * Provide at any level (root, component, or route) to configure
 * nav behavior for that scope.
 *
 * @usageNotes
 *
 * ### Single-accordion sidebar
 * ```typescript
 * @Component({
 *   providers: [
 *     { provide: CNGX_NAV_CONFIG, useValue: { singleAccordion: true } },
 *   ],
 * })
 * class SidebarComponent { }
 * ```
 *
 * ### Custom indent
 * ```typescript
 * providers: [
 *   { provide: CNGX_NAV_CONFIG, useValue: { indent: 16 } },
 * ]
 * ```
 */
export const CNGX_NAV_CONFIG = new InjectionToken<CngxNavConfig>('CNGX_NAV_CONFIG');

/**
 * Convenience provider function for nav configuration.
 *
 * ```typescript
 * providers: [provideNavConfig({ singleAccordion: true })]
 * ```
 */
export function provideNavConfig(config: CngxNavConfig) {
  return { provide: CNGX_NAV_CONFIG, useValue: config };
}
