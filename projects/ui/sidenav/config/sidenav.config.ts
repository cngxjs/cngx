/**
 * App-wide cascade for the sidenav family's dimension defaults, the mini
 * expand-on-hover dwell, and the `responsive` / `shortcut` behaviour knobs.
 *
 * Resolution priority (high -> low):
 *   1. Per-instance Input binding (e.g. `[width]="'320px'"`, `[shortcut]="'mod+b'"`).
 *   2. `provideSidenavConfigAt(...)` in a parent component's `viewProviders`
 *      (component-scoped override).
 *   3. `provideSidenavConfig(...)` at the application root.
 *   4. Library defaults (merged in via `CNGX_SIDENAV_DEFAULTS`).
 *
 * Every key is optional - partial overrides deep-merge with the library
 * defaults, so consumers declare only the keys they want to override. The
 * `dimensions`, `hover`, and `routerSync` sub-trees are one level deep
 * (spread-merged per key); `responsive` and `shortcut` are flat top-level
 * scalars.
 *
 * The cascaded keys are the dimension inputs, the mini hover dwell, the
 * `responsive` and `shortcut` defaults, and the router-sync `param`.
 * `ariaLabel`, `position`, and `mode` stay per-instance only, since they
 * describe an individual rail rather than an app-wide default.
 *
 * @category ui/sidenav
 * @since 0.1.0
 */
export interface CngxSidenavConfig {
  /**
   * Panel dimensions. Per-instance `[width]` / `[miniWidth]` / `[minWidth]` /
   * `[maxWidth]` bindings still win; this only moves the cascade defaults. A
   * one-level nested sub-tree (spread-merged per key in the config reducer).
   */
  readonly dimensions?: {
    /** Width of the expanded panel. Seeds the two-way `[(width)]` model. */
    readonly width?: string;
    /** Width of the collapsed rail in `mini` mode. */
    readonly miniWidth?: string;
    /** Minimum width constraint during resize. */
    readonly minWidth?: string;
    /** Maximum width constraint during resize. */
    readonly maxWidth?: string;
  };

  /**
   * Mini expand-on-hover dwell, forwarded to the composed `CngxHoverIntent`
   * hostDirective. A one-level nested sub-tree. Wired via
   * `withSidenavHoverDwell(...)`.
   */
  readonly hover?: {
    /** Delay in ms before the mini rail expands on pointer enter. */
    readonly enterDelay?: number;
    /** Delay in ms before the mini rail collapses on pointer leave. */
    readonly leaveDelay?: number;
  };

  /**
   * URL query-param sync defaults for `[cngxSidenavRouterSync]`. A one-level
   * nested sub-tree (spread-merged per key in the config reducer). Wired via
   * `withSidenavRouterSync(...)`; the directive resolves `param` as
   * `[param] ?? routerSync.param ?? 'nav'`, so an un-configured consumer keeps
   * the `'nav'` literal.
   */
  readonly routerSync?: {
    /** Query-param key the sidenav's `opened` state syncs to. Defaults to `'nav'`. */
    readonly param?: string;
  };

  /**
   * Default CSS media-query string for responsive mode switching. Per-instance
   * `[responsive]` still wins. A flat top-level scalar, not a nested sub-tree.
   */
  readonly responsive?: string;

  /**
   * Default keyboard shortcut to toggle the sidenav (e.g. `'mod+b'`).
   * Per-instance `[shortcut]` still wins. A flat top-level scalar.
   */
  readonly shortcut?: string;
}
