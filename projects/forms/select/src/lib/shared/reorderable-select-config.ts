import {
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Provider,
  type TemplateRef,
} from '@angular/core';

import type { CngxReorderModifier } from '@cngx/common/interactive';

/**
 * App-wide configuration for reorder-aware select variants
 * (`CngxReorderableMultiSelect` today; future tag-input-with-reorder,
 * chip-strip toolbars). Mirrors the cascade rules of
 * `CngxSelectConfig` — per-instance input wins over component-scoped
 * `provideReorderableSelectConfigAt`, which wins over app-wide
 * `provideReorderableSelectConfig`, which falls back to the library
 * defaults below.
 *
 * @category interactive
 */
export interface CngxReorderableSelectConfig {
  /**
   * Default modifier key required for keyboard-driven reorder moves.
   * Forwarded to the inner `CngxReorder` directive. Defaults to
   * `'ctrl'`.
   */
  readonly keyboardModifier?: CngxReorderModifier;
  /**
   * Default ARIA label for the chip-strip `role="group"` region.
   * Announced when the user tabs into the strip so they understand
   * they're entering a reorderable widget. Defaults to the German
   * sentence `'Reihenfolge ändern mit Strg+Pfeiltasten'` — override
   * per-app for localisation.
   */
  readonly ariaLabel?: string;
  /**
   * Default drag-handle glyph. `null` keeps the built-in six-dot grip;
   * a projected `TemplateRef<void>` replaces it app-wide without
   * touching any consumer template. Per-instance `[chipDragHandle]`
   * still wins.
   */
  readonly dragHandle?: TemplateRef<void> | null;
  /**
   * Whether the whole chip strip is disabled while a commit is in
   * flight (`reorderDisabled = disabled || isCommitting`). `true`
   * (default) matches plan §2 locked decision — reorders are
   * sub-second and freeze is clearer than mid-gesture per-chip
   * spinners. Set `false` to allow consecutive reorders to supersede
   * an in-flight commit via the commit-controller's built-in race
   * handling.
   */
  readonly freezeStripOnCommit?: boolean;
}

/**
 * Library defaults for {@link CngxReorderableSelectConfig}. Kept as a
 * `Required<>` shape so `resolveReorderableSelectConfig` can
 * short-circuit the `??` chain in one place.
 *
 * @internal
 */
export const CNGX_REORDERABLE_SELECT_DEFAULTS: Required<
  Omit<CngxReorderableSelectConfig, 'dragHandle'>
> & { readonly dragHandle: TemplateRef<void> | null } = {
  keyboardModifier: 'ctrl',
  ariaLabel: 'Reihenfolge ändern mit Strg+Pfeiltasten',
  dragHandle: null,
  freezeStripOnCommit: true,
};

/**
 * Injection token carrying the resolved
 * {@link CngxReorderableSelectConfig} for the current injector scope.
 * Falls back to {@link CNGX_REORDERABLE_SELECT_DEFAULTS}.
 *
 * @category interactive
 */
export const CNGX_REORDERABLE_SELECT_CONFIG =
  new InjectionToken<CngxReorderableSelectConfig>('CngxReorderableSelectConfig');

/**
 * Feature returned by the `with*` helpers. Merged by
 * {@link provideReorderableSelectConfig}.
 *
 * @category interactive
 */
export interface CngxReorderableSelectConfigFeature {
  readonly config: Partial<CngxReorderableSelectConfig>;
  /** @internal — discriminator for `provideCngxSelect` dispatch. */
  readonly _target?: 'reorderable';
}

function feature(
  config: Partial<CngxReorderableSelectConfig>,
): CngxReorderableSelectConfigFeature {
  return { config, _target: 'reorderable' };
}

/**
 * Override the default keyboard modifier used to gate reorder moves.
 * Use `'alt'` when the app already uses `Ctrl` for browser
 * shortcuts / accessibility keys, or `'meta'` on macOS-first apps
 * where the Cmd key is the natural reorder modifier.
 *
 * @category interactive
 */
export function withReorderKeyboardModifier(
  modifier: CngxReorderModifier,
): CngxReorderableSelectConfigFeature {
  return feature({ keyboardModifier: modifier });
}

/**
 * Override the default chip-strip ARIA label (localisation hook).
 *
 * @category interactive
 */
export function withReorderAriaLabel(
  label: string,
): CngxReorderableSelectConfigFeature {
  return feature({ ariaLabel: label });
}

/**
 * Override the default drag-handle glyph app-wide. Pass a
 * `TemplateRef<void>` from a bootstrap component holding an
 * `<ng-template #grip>…</ng-template>` to swap the built-in six-dot
 * grip without touching any consumer template.
 *
 * @category interactive
 */
export function withDefaultDragHandle(
  template: TemplateRef<void> | null,
): CngxReorderableSelectConfigFeature {
  return feature({ dragHandle: template });
}

/**
 * Toggle the strip-freeze-on-commit behaviour. `true` (default) freezes
 * the whole chip strip while a commit is in flight. `false` keeps the
 * strip live — consecutive reorders supersede any in-flight commit via
 * the commit-controller's built-in race handling.
 *
 * @category interactive
 */
export function withReorderStripFreeze(
  freeze: boolean,
): CngxReorderableSelectConfigFeature {
  return feature({ freezeStripOnCommit: freeze });
}

/**
 * App-wide defaults for all reorder-aware select variants. Composable
 * via the `with*` helpers. Component-scoped overrides
 * (`provideReorderableSelectConfigAt`) win; per-instance inputs win
 * over that.
 *
 * @example
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [
 *     provideReorderableSelectConfig(
 *       withReorderKeyboardModifier('alt'),
 *       withReorderAriaLabel('Reorder with Alt + arrow keys'),
 *       withReorderStripFreeze(false),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category interactive
 */
export function provideReorderableSelectConfig(
  ...features: CngxReorderableSelectConfigFeature[]
): EnvironmentProviders {
  const merged: {
    -readonly [K in keyof CngxReorderableSelectConfig]?: CngxReorderableSelectConfig[K];
  } = {};
  for (const f of features) {
    Object.assign(merged, f.config);
  }
  return makeEnvironmentProviders([
    { provide: CNGX_REORDERABLE_SELECT_CONFIG, useValue: merged },
  ]);
}

/**
 * Component-scoped override for the reorderable-select config. Goes
 * into `providers` / `viewProviders` via spread syntax; the return
 * type is `Provider[]` (not `EnvironmentProviders`) because
 * `viewProviders` rejects environment providers.
 *
 * @category interactive
 */
export function provideReorderableSelectConfigAt(
  ...features: CngxReorderableSelectConfigFeature[]
): Provider[] {
  const merged: {
    -readonly [K in keyof CngxReorderableSelectConfig]?: CngxReorderableSelectConfig[K];
  } = {};
  for (const f of features) {
    Object.assign(merged, f.config);
  }
  return [{ provide: CNGX_REORDERABLE_SELECT_CONFIG, useValue: merged }];
}

/**
 * Resolve the effective config for the current injector. Must run in
 * an injection context.
 *
 * @internal
 */
export function resolveReorderableSelectConfig(): Required<
  Omit<CngxReorderableSelectConfig, 'dragHandle'>
> & { readonly dragHandle: TemplateRef<void> | null } {
  const user = inject(CNGX_REORDERABLE_SELECT_CONFIG, { optional: true }) ?? {};
  return {
    keyboardModifier:
      user.keyboardModifier ?? CNGX_REORDERABLE_SELECT_DEFAULTS.keyboardModifier,
    ariaLabel: user.ariaLabel ?? CNGX_REORDERABLE_SELECT_DEFAULTS.ariaLabel,
    dragHandle:
      user.dragHandle === undefined
        ? CNGX_REORDERABLE_SELECT_DEFAULTS.dragHandle
        : user.dragHandle,
    freezeStripOnCommit:
      user.freezeStripOnCommit ??
      CNGX_REORDERABLE_SELECT_DEFAULTS.freezeStripOnCommit,
  };
}
