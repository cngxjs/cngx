import type { CngxBreadcrumbConfig } from './breadcrumb.config';
import type { CngxBreadcrumbConfigFeature } from './provide-breadcrumb-config';

/**
 * Override the breadcrumb family's ARIA-string fallbacks - the bar landmark
 * name and the overflow/siblings trigger + list labels. Per-instance
 * `[label]` / `[triggerLabel]` / `[menuLabel]` bindings still win over the
 * cascade; this only sets the fallback.
 *
 * ```ts
 * provideBreadcrumbConfig(
 *   withBreadcrumbAriaLabels({ bar: 'Navigation trail' }),
 * );
 * ```
 *
 * @category ui/breadcrumb
 */
export function withBreadcrumbAriaLabels(
  payload: NonNullable<CngxBreadcrumbConfig['ariaLabels']>,
): CngxBreadcrumbConfigFeature {
  return { kind: 'ariaLabels', payload };
}

/**
 * Override the route-data key the breadcrumb router-sync directives
 * (`CngxBreadcrumbRouterSync`, `CngxBreadcrumbSiblingsRouterSync`) read
 * crumbs and siblings from. Per-instance `[dataKey]` still wins.
 *
 * ```ts
 * provideBreadcrumbConfig(withBreadcrumbDataKey('crumb'));
 * ```
 *
 * @category ui/breadcrumb
 */
export function withBreadcrumbDataKey(dataKey: string): CngxBreadcrumbConfigFeature {
  return { kind: 'router', payload: { dataKey } };
}
