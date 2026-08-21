import type { TemplateRef } from '@angular/core';

import type { CngxTocItemContext } from '../toc.types';

/**
 * App-wide cascade for the table-of-contents organism's ARIA label, its
 * scroll behaviour, the `CngxScrollSpy` defaults it forwards, and the default
 * item template.
 *
 * Resolution priority (high -> low):
 *   1. Per-instance Input binding (e.g. `[contentRoot]`, `*cngxTocItem`).
 *   2. `provideTocConfigAt(...)` in a parent component's `viewProviders`
 *      (component-scoped override).
 *   3. `provideTocConfig(...)` at the application root.
 *   4. Library defaults (English; merged in via `CNGX_TOC_DEFAULTS`).
 *
 * Every key is optional - partial overrides deep-merge with the library
 * defaults, so consumers declare only the keys they want to override.
 *
 * @category ui/toc
 * @since 0.1.0
 */
export interface CngxTocConfig {
  /**
   * ARIA-string fallback for the `nav` landmark. A per-instance
   * `[navLabel]`-equivalent binding is not exposed; the landmark name always
   * comes from this cascade, English by default.
   */
  readonly ariaLabels?: {
    /** Accessible name of the `nav` landmark that wraps the link list. */
    readonly nav?: string;
  };

  /**
   * Scroll behaviour used when a link is activated and the section is
   * brought into view. `'smooth'` by default; swapped to `'auto'` (instant)
   * at runtime whenever `prefers-reduced-motion: reduce` matches, regardless
   * of this value.
   */
  readonly scrollBehavior?: 'auto' | 'smooth';

  /**
   * Defaults forwarded to the internal `CngxScrollSpy`. Per-instance
   * `[rootMargin]` / `[threshold]` inputs still win; this only moves the
   * cascade default. `contentRoot` has no cascade default - it is viewport
   * (`null`) unless bound per instance.
   */
  readonly spy?: {
    /** Root margin passed to the spy's `IntersectionObserver`. */
    readonly rootMargin?: string;
    /** Minimum visibility ratio for a section to become active. */
    readonly threshold?: number;
  };

  /**
   * Global default template slots. The item slot resolves three-stage:
   * per-instance `*cngxTocItem` -> this `templates.item` -> the built-in
   * plain-label rendering. Set it to give every un-slotted toc the same
   * custom item markup.
   */
  readonly templates?: {
    /** Default per-item template; overridden per instance by `*cngxTocItem`. */
    readonly item?: TemplateRef<CngxTocItemContext>;
  };
}
