import {
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';

/**
 * Policy for when `CngxFocusTrap` activates on the shared panel
 * shell while an inline `*cngxSelectAction` workflow is in flight:
 *
 * - `'dirty'` (default) — trap engages only while `actionDirty()`
 *   is `true`. Matches the plan's dismiss-guard semantics: once the
 *   user interacts with the action template, keyboard focus is
 *   fenced inside the panel until the workflow commits or cancels.
 * - `'always'` — trap is on whenever the panel is open, even before
 *   the user touches the action. Useful for high-stakes workflows
 *   (confirm-to-create, destructive flows) where the consumer
 *   doesn't want Tab to escape the panel at all.
 * - `'never'` — trap is never enabled by the shell. Consumer owns
 *   every keyboard-focus decision. Escape-hatch for apps with an
 *   unusual focus-management strategy.
 *
 * @category interactive
 */
export type CngxActionFocusTrapBehavior = 'always' | 'dirty' | 'never';

/**
 * Where the `*cngxSelectAction` slot renders inside the shared panel
 * frame. `'bottom'` is the library-wide default; the organisms
 * forward this value straight into the panel shell's
 * `actionPosition` input.
 *
 * @category interactive
 */
export type CngxActionPosition = 'top' | 'bottom' | 'both' | 'none';

/**
 * App-wide configuration for the action-select organisms
 * (`CngxActionSelect`, `CngxActionMultiSelect`) and the cross-
 * variant action-slot plumbing. Mirrors the cascade rules of
 * {@link /projects/forms/select/src/lib/shared/config.ts CngxSelectConfig}:
 * per-instance input wins over component-scoped
 * `provideActionSelectConfigAt`, which wins over app-wide
 * `provideActionSelectConfig`, which falls back to the defaults
 * below.
 *
 * @category interactive
 */
export interface CngxActionSelectConfig {
  /**
   * When the shared panel shell's embedded `CngxFocusTrap` activates.
   * Defaults to `'dirty'` — focus is only fenced once the user has
   * touched the action template.
   */
  readonly focusTrapBehavior?: CngxActionFocusTrapBehavior;
  /**
   * Default ARIA label announced on the action-slot wrapper. Consumers
   * localise or override via the app-wide config. Defaults to a
   * neutral German label.
   */
  readonly ariaLabel?: string;
  /**
   * Forces the `closeOnCreate` default across every action organism
   * when set. When `null` (default), each organism applies its own
   * variant-specific baseline — `CngxActionSelect` closes after a
   * successful create (confirm-to-create UX), `CngxActionMultiSelect`
   * keeps the panel open (tag-input UX). An explicit `true` or
   * `false` here overrides both organisms' built-in defaults.
   */
  readonly closeOnCreate?: boolean | null;
  /**
   * Default position of the `*cngxSelectAction` slot inside the
   * panel frame. Identical to the per-instance `[actionPosition]`
   * input but applied library-wide. Defaults to `'bottom'`.
   */
  readonly actionPosition?: CngxActionPosition;
  /**
   * Whether the organisms fall back to the raw `<input>` value when
   * the debounced `searchTerm` signal hasn't caught up yet. Fast
   * clicks inside the debounce window would otherwise silent-drop
   * the create (the bound term is still empty). Defaults to `true` —
   * the library's committed UX since day one. Apps with a custom
   * search pipeline that owns its own debouncing can disable this to
   * keep the behaviour predictable.
   */
  readonly liveInputFallback?: boolean;
}

/**
 * Library defaults for {@link CngxActionSelectConfig}. `closeOnCreate`
 * intentionally defaults to `null` so each organism applies its own
 * variant-specific default (single `true`, multi `false`) rather than
 * a global value that would be wrong for one of the two variants.
 *
 * @internal
 */
export const CNGX_ACTION_SELECT_DEFAULTS: Required<CngxActionSelectConfig> = {
  focusTrapBehavior: 'dirty',
  ariaLabel: 'Inline-Aktion',
  closeOnCreate: null,
  actionPosition: 'bottom',
  liveInputFallback: true,
};

/**
 * Injection token carrying the resolved {@link CngxActionSelectConfig}.
 * Falls back to {@link CNGX_ACTION_SELECT_DEFAULTS}.
 *
 * @category interactive
 */
export const CNGX_ACTION_SELECT_CONFIG = new InjectionToken<CngxActionSelectConfig>(
  'CngxActionSelectConfig',
);

/**
 * Feature returned by the `with*` helpers. Merged by
 * {@link provideActionSelectConfig}.
 *
 * @category interactive
 */
export interface CngxActionSelectConfigFeature {
  readonly config: Partial<CngxActionSelectConfig>;
}

function feature(
  config: Partial<CngxActionSelectConfig>,
): CngxActionSelectConfigFeature {
  return { config };
}

/**
 * Override when the panel-shell's embedded focus trap activates. See
 * {@link CngxActionFocusTrapBehavior} for the three options.
 *
 * @category interactive
 */
export function withFocusTrapBehavior(
  behavior: CngxActionFocusTrapBehavior,
): CngxActionSelectConfigFeature {
  return feature({ focusTrapBehavior: behavior });
}

/**
 * Override the default ARIA label announced on the action-slot
 * wrapper — localisation hook.
 *
 * @category interactive
 */
export function withActionAriaLabel(label: string): CngxActionSelectConfigFeature {
  return feature({ ariaLabel: label });
}

/**
 * Force the `closeOnCreate` default across every action organism.
 * Overrides the per-variant baselines (single closes, multi keeps
 * open). Pass `null` to restore the variant-specific defaults after
 * an earlier `withCloseOnCreate(true|false)` call in the same config
 * composition chain.
 *
 * @category interactive
 */
export function withCloseOnCreate(
  closeOnCreate: boolean | null,
): CngxActionSelectConfigFeature {
  return feature({ closeOnCreate });
}

/**
 * Override the default position of the `*cngxSelectAction` slot
 * inside the shared panel frame.
 *
 * @category interactive
 */
export function withActionPosition(
  position: CngxActionPosition,
): CngxActionSelectConfigFeature {
  return feature({ actionPosition: position });
}

/**
 * Override whether the organisms fall back to the raw `<input>`
 * value when the debounced `searchTerm` hasn't caught up. Disable
 * this when your app owns the debouncing pipeline and wants the
 * create payload to derive strictly from the bound term.
 *
 * @category interactive
 */
export function withLiveInputFallback(
  enabled: boolean,
): CngxActionSelectConfigFeature {
  return feature({ liveInputFallback: enabled });
}

/**
 * App-wide defaults for the action-select plumbing. Composable via
 * the `with*` helpers. Component-scoped overrides
 * (`provideActionSelectConfigAt`) win.
 *
 * @example
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [
 *     provideActionSelectConfig(
 *       withFocusTrapBehavior('always'),
 *       withActionAriaLabel('Quick action'),
 *       withCloseOnCreate(true),
 *       withActionPosition('top'),
 *       withLiveInputFallback(false),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category interactive
 */
export function provideActionSelectConfig(
  ...features: CngxActionSelectConfigFeature[]
): EnvironmentProviders {
  const merged: {
    -readonly [K in keyof CngxActionSelectConfig]?: CngxActionSelectConfig[K];
  } = {};
  for (const f of features) {
    Object.assign(merged, f.config);
  }
  return makeEnvironmentProviders([
    { provide: CNGX_ACTION_SELECT_CONFIG, useValue: merged },
  ]);
}

/**
 * Component-scoped override for the action-select config. Goes into
 * `providers` / `viewProviders` via spread syntax; return type is
 * `Provider[]` (not `EnvironmentProviders`) because `viewProviders`
 * rejects environment providers.
 *
 * @category interactive
 */
export function provideActionSelectConfigAt(
  ...features: CngxActionSelectConfigFeature[]
): Provider[] {
  const merged: {
    -readonly [K in keyof CngxActionSelectConfig]?: CngxActionSelectConfig[K];
  } = {};
  for (const f of features) {
    Object.assign(merged, f.config);
  }
  return [{ provide: CNGX_ACTION_SELECT_CONFIG, useValue: merged }];
}

/**
 * Resolve the effective config for the current injector. Must run in
 * an injection context.
 *
 * @internal
 */
export function resolveActionSelectConfig(): Required<CngxActionSelectConfig> {
  const user = inject(CNGX_ACTION_SELECT_CONFIG, { optional: true }) ?? {};
  return {
    focusTrapBehavior:
      user.focusTrapBehavior ?? CNGX_ACTION_SELECT_DEFAULTS.focusTrapBehavior,
    ariaLabel: user.ariaLabel ?? CNGX_ACTION_SELECT_DEFAULTS.ariaLabel,
    closeOnCreate:
      user.closeOnCreate === undefined
        ? CNGX_ACTION_SELECT_DEFAULTS.closeOnCreate
        : user.closeOnCreate,
    actionPosition: user.actionPosition ?? CNGX_ACTION_SELECT_DEFAULTS.actionPosition,
    liveInputFallback:
      user.liveInputFallback ?? CNGX_ACTION_SELECT_DEFAULTS.liveInputFallback,
  };
}
