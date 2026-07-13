/**
 * Selectable visual skin for `CngxBreadcrumbBar`. The skin is a pure thematic
 * concern - every value renders the same `nav` / list / crumb / separator DOM
 * with identical ARIA and collapse behaviour; only the `[data-skin]` host
 * attribute redirects which `@scope` paint block applies. `'classic'` is the
 * bare default (plain link + slash separator). Mirrors `CngxTabsSkin`.
 *
 * @category ui/breadcrumb
 * @since 0.1.0
 */
export type CngxBreadcrumbSkin =
  | 'classic'
  | 'plain'
  | 'contained'
  | 'pill'
  | 'ribbon'
  | 'editorial'
  | 'header'
  | 'metro'
  | 'toolbar'
  | 'chips'
  | 'path'
  | 'iconlabel';

/**
 * App-wide cascade for the breadcrumb family's ARIA labels, the router
 * `dataKey`, and the default visual `skin`.
 *
 * Resolution priority (high -> low):
 *   1. Per-instance Input binding (e.g. `[label]="'Trail'"`, `skin="pill"`).
 *   2. `provideBreadcrumbConfigAt(...)` in a parent component's
 *      `viewProviders` (component-scoped override).
 *   3. `provideBreadcrumbConfig(...)` at the application root.
 *   4. Library defaults (English; merged in via `CNGX_BREADCRUMB_DEFAULTS`).
 *
 * Every key is optional - partial overrides deep-merge with the library
 * defaults, so consumers declare only the keys they want to override.
 *
 * @category ui/breadcrumb
 * @since 0.1.0
 */
export interface CngxBreadcrumbConfig {
  /**
   * ARIA-string fallbacks for the bar landmark and the overflow/siblings
   * dropdown triggers and lists. Per-instance `[label]`/`[triggerLabel]`/
   * `[menuLabel]` bindings still win over these.
   */
  readonly ariaLabels?: {
    /** Accessible name of the `nav` landmark on `CngxBreadcrumbBar`. */
    readonly bar?: string;
    /** Accessible name of the overflow ellipsis trigger. */
    readonly overflowTrigger?: string;
    /** Accessible name of the collapsed-crumb menu. */
    readonly overflowMenu?: string;
    /** Accessible name of the siblings chevron trigger. */
    readonly siblingsTrigger?: string;
    /** Accessible name of the sibling list. */
    readonly siblingsMenu?: string;
  };

  /**
   * Router-sync defaults shared by the trail (`CngxBreadcrumbRouterSync`)
   * and siblings (`CngxBreadcrumbSiblingsRouterSync`) route directives.
   */
  readonly router?: {
    /** Route-data key the router-sync directives read crumbs/siblings from. */
    readonly dataKey?: string;
  };

  /**
   * App-wide default visual skin. Per-instance `[skin]` still wins; this only
   * moves the cascade default. Unset resolves to `'classic'` at the bar. A
   * flat top-level scalar (like `config.skin` in tabs), not a nested sub-tree.
   */
  readonly skin?: CngxBreadcrumbSkin;
}
