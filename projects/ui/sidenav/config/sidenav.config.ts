import type { Signal } from '@angular/core';

/**
 * App-wide cascade for the sidenav family's dimension defaults, the rail
 * peek hover dwell, and the `shortcut` behaviour knob.
 *
 * Resolution priority (high -> low):
 *   1. Per-instance Input binding (e.g. `[width]="'320px'"`, `[shortcut]="'mod+b'"`).
 *   2. `provideSidenavConfigAt(...)` in a parent component's `viewProviders`
 *      (component-scoped override).
 *   3. `provideSidenavConfig(...)` at the application root.
 *   4. Library defaults.
 *
 * Every key is optional, so consumers declare only the keys they want to
 * override. `dimensions`, `hover`, `routerSync` and `labels` merge per key
 * with the level above; `shortcut` and `persistence` replace it whole.
 *
 * The cascaded keys are the dimension inputs, the rail hover dwell, the
 * `shortcut` default, the router-sync `param`, the copy and the `collapsed`
 * persistence. `ariaLabel`, `position`,
 * and `mode` stay per-instance only, since they describe an individual rail
 * rather than an app-wide default. The docking threshold behind `mode="auto"`
 * is deliberately not here: it lives in `sidenav-layout.css` as a
 * `@container` rule, so a consumer moves it by overriding that rule.
 *
 * @since 0.3.0
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
    /** Width of the collapsed rail (`collapsed` with `collapsedAs="rail"`). */
    readonly miniWidth?: string;
    /** Minimum width constraint during resize. */
    readonly minWidth?: string;
    /** Maximum width constraint during resize. */
    readonly maxWidth?: string;
  };

  /**
   * Hover dwell of the collapsed rail's peek, forwarded to the `CngxHoverIntent`
   * of the composed `CngxSidebar`. A one-level nested sub-tree. Wired via
   * `withSidenavHoverDwell(...)`.
   */
  readonly hover?: {
    /** Delay in ms before the collapsed rail peeks on pointer enter. */
    readonly enterDelay?: number;
    /** Delay in ms before the peek ends on pointer leave. */
    readonly leaveDelay?: number;
  };

  /**
   * URL query-param sync defaults for `[cngxSidenavRouterSync]`. A one-level
   * nested sub-tree (spread-merged per key in the config reducer). Wired via
   * `withSidenavRouterSync(...)`; the directive resolves `param` as
   * `[param] ?? routerSync.param ?? 'nav'` (`'nav-end'` on a `position="end"`
   * rail), so an un-configured consumer keeps the literals. A param set here
   * applies to every rail; a two-rail layout binds `[param]` on one of them.
   */
  readonly routerSync?: {
    /** Query-param key the sidenav's `opened` state syncs to. Defaults to `'nav'`, `'nav-end'` on an end rail. */
    readonly param?: string;
  };

  /**
   * Persist each rail's `collapsed` under `storageKey` in
   * `CNGX_SIDENAV_STORAGE`. Unset: nothing is persisted. Set through
   * `withSidenavPersistence(...)`.
   */
  readonly persistence?: {
    /** Storage key prefix; the rail's `position` is appended. */
    readonly storageKey: string;
  };

  /**
   * Default keyboard shortcut to toggle the sidenav (e.g. `'mod+b'`).
   * Per-instance `[shortcut]` still wins. A flat top-level scalar.
   */
  readonly shortcut?: string;

  /**
   * App-wide sidenav copy overrides. Reactive from birth: pass a partial
   * bundle or a `Signal` of one; unset keys read the `sidenav` section of the
   * language pack (English without one). Override via `withSidenavLabels(...)`.
   * A later feature merges per key over the earlier one.
   */
  readonly labels?: Partial<CngxSidenavLabels> | Signal<Partial<CngxSidenavLabels>>;
}

/**
 * User-facing copy of the sidenav. The defaults come from the `sidenav` section
 * of the language pack (English without one).
 *
 * @since 0.3.0
 */
export interface CngxSidenavLabels {
  /**
   * Default accessible name of a `position="start"` rail while `[ariaLabel]`
   * is unbound.
   */
  readonly startRegion: string;
  /**
   * Default accessible name of a `position="end"` rail while `[ariaLabel]` is
   * unbound. Distinct from `startRegion` so two rails never share one name.
   */
  readonly endRegion: string;
  /**
   * Default of `[resizeLabel]`, the accessible name of the resize separator.
   */
  readonly resizeHandle: string;
  /**
   * `aria-valuetext` of the resize separator. Receives the separator position
   * as a rounded percent (0-100) of its min-max range and that value already
   * formatted as a percent in the app locale; the default returns the
   * formatted string. Same shape as the feedback `progressValueText`.
   */
  readonly resizeValueText: (percent: number, formatted: string) => string;
  /**
   * Spoken when the toggle hotkey hides the full nav: a hotkey has no focused
   * trigger whose `aria-expanded` would convey the change.
   */
  readonly collapsedAnnouncement: string;
  /** Spoken when the toggle hotkey shows the full nav. */
  readonly expandedAnnouncement: string;
  /** Description of the toggle shortcut in the hotkey help list. */
  readonly toggleShortcut: string;
}
