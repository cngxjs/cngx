import type { CngxTocConfig } from './toc.config';
import type { CngxTocConfigFeature } from './provide-toc-config';

/**
 * Override the toc's ARIA-string fallback - the accessible name of the `nav`
 * landmark that wraps the link list (default `'On this page'`).
 *
 * ```ts
 * provideTocConfig(withTocAriaLabels({ nav: 'Auf dieser Seite' }));
 * ```
 *
 * @category ui/toc
 * @since 0.1.0
 */
export function withTocAriaLabels(
  payload: NonNullable<CngxTocConfig['ariaLabels']>,
): CngxTocConfigFeature {
  return { kind: 'ariaLabels', payload };
}

/**
 * Set the app-wide default scroll behaviour used when a link is activated.
 * `'smooth'` by default; the organism still swaps to `'auto'` at runtime
 * whenever `prefers-reduced-motion: reduce` matches, so this only chooses the
 * motion-allowed behaviour.
 *
 * ```ts
 * provideTocConfig(withTocScrollBehavior('auto'));
 * ```
 *
 * @category ui/toc
 * @since 0.1.0
 */
export function withTocScrollBehavior(
  scrollBehavior: NonNullable<CngxTocConfig['scrollBehavior']>,
): CngxTocConfigFeature {
  return { kind: 'scrollBehavior', payload: { scrollBehavior } };
}

/**
 * Register a global default item template. Resolves after a per-instance
 * `*cngxTocItem` slot and before the built-in plain-label rendering, so every
 * un-slotted toc renders the same custom item markup.
 *
 * ```ts
 * @Component({
 *   viewProviders: [provideTocConfigAt(withTocTemplates({ item: myItemTpl }))],
 * })
 * ```
 *
 * @category ui/toc
 * @since 0.1.0
 */
export function withTocTemplates(
  payload: NonNullable<CngxTocConfig['templates']>,
): CngxTocConfigFeature {
  return { kind: 'templates', payload };
}
