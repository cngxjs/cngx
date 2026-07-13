import type { CngxBreadcrumbConfig, CngxBreadcrumbSkin } from './breadcrumb.config';
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
 * @since 0.1.0
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
 * @since 0.1.0
 */
export function withBreadcrumbDataKey(dataKey: string): CngxBreadcrumbConfigFeature {
  return { kind: 'router', payload: { dataKey } };
}

/**
 * Select the app-wide default visual skin for `CngxBreadcrumbBar`. Per-instance
 * `[skin]` still wins; this only moves the cascade default. Structure, slots,
 * and ARIA are identical across skins - only the `[data-skin]` host attribute
 * changes which `@scope` paint applies.
 *
 * ```ts
 * provideBreadcrumbConfig(withBreadcrumbSkin('pill'));
 * ```
 *
 * @category ui/breadcrumb
 * @since 0.1.0
 */
export function withBreadcrumbSkin(skin: CngxBreadcrumbSkin): CngxBreadcrumbConfigFeature {
  return { kind: 'skin', payload: { skin } };
}
