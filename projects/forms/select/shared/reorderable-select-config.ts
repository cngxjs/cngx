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
 * App-wide config for reorder-aware select variants. Cascade:
 * per-instance input > `provideReorderableSelectConfigAt` >
 * `provideReorderableSelectConfig` > library default.
 *
 * @category forms/select/reorderable-multi-select
 */
export interface CngxReorderableSelectConfig {
  /** Forwarded to inner `CngxReorder`. Default `'ctrl'`. */
  readonly keyboardModifier?: CngxReorderModifier;
  /** ARIA label on the chip-strip `role="group"`. Localisation hook. */
  readonly ariaLabel?: string;
  /**
   * Drag-handle glyph. `null` keeps the six-dot grip. Per-instance
   * `[chipDragHandle]` wins.
   */
  readonly dragHandle?: TemplateRef<void> | null;
  /**
   * Freezes the chip strip during an in-flight commit. Default `true` -
   * reorders are sub-second, freeze is clearer than per-chip spinners.
   */
  readonly freezeStripOnCommit?: boolean;
}

/** Library defaults. Required-shape so resolution stays `??`-friendly. @internal */
export const CNGX_REORDERABLE_SELECT_DEFAULTS: Required<
  Omit<CngxReorderableSelectConfig, 'dragHandle'>
> & { readonly dragHandle: TemplateRef<void> | null } = {
  keyboardModifier: 'alt',
  ariaLabel: 'Reorder with Alt + arrow keys',
  dragHandle: null,
  freezeStripOnCommit: true,
};

/**
 * Token carrying the resolved {@link CngxReorderableSelectConfig}.
 *
 * @category forms/select/reorderable-multi-select
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/reorderable-select-config.ts
 * @since 0.1.0
 */
export const CNGX_REORDERABLE_SELECT_CONFIG = new InjectionToken<CngxReorderableSelectConfig>(
  'CngxReorderableSelectConfig',
);

/**
 * Feature returned by the `with*` helpers. Merged by
 * {@link provideReorderableSelectConfig}.
 *
 * @category forms/select/reorderable-multi-select
 */
export interface CngxReorderableSelectConfigFeature {
  readonly config: Partial<CngxReorderableSelectConfig>;
  /** @internal Discriminator for `provideCngxSelect` dispatch. */
  readonly _target?: 'reorderable';
}

function feature(config: Partial<CngxReorderableSelectConfig>): CngxReorderableSelectConfigFeature {
  return { config, _target: 'reorderable' };
}

/**
 * Sets the keyboard modifier gating reorder moves.
 *
 * @category forms/select/reorderable-multi-select
 */
export function withReorderKeyboardModifier(
  modifier: CngxReorderModifier,
): CngxReorderableSelectConfigFeature {
  return feature({ keyboardModifier: modifier });
}

/**
 * Sets the chip-strip ARIA label.
 *
 * @category forms/select/reorderable-multi-select
 */
export function withReorderAriaLabel(label: string): CngxReorderableSelectConfigFeature {
  return feature({ ariaLabel: label });
}

/**
 * Sets the default drag-handle glyph app-wide via `TemplateRef<void>`.
 *
 * @category forms/select/reorderable-multi-select
 */
export function withDefaultDragHandle(
  template: TemplateRef<void> | null,
): CngxReorderableSelectConfigFeature {
  return feature({ dragHandle: template });
}

/**
 * Sets strip-freeze-on-commit. `false` lets reorders supersede in-flight
 * commits via the commit-controller's supersede semantics.
 *
 * @category forms/select/reorderable-multi-select
 */
export function withReorderStripFreeze(freeze: boolean): CngxReorderableSelectConfigFeature {
  return feature({ freezeStripOnCommit: freeze });
}

/**
 * App-wide defaults for reorder-aware select variants.
 * `provideReorderableSelectConfigAt` and per-instance inputs win.
 *
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
 * @category forms/select/reorderable-multi-select
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
  return makeEnvironmentProviders([{ provide: CNGX_REORDERABLE_SELECT_CONFIG, useValue: merged }]);
}

/**
 * Component-scoped reorderable-select config. Returns `Provider[]`
 * because `viewProviders` rejects `EnvironmentProviders`.
 *
 * @category forms/select/reorderable-multi-select
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
 * Effective config for the current injector. Injection context required.
 *
 * @internal
 */
export function resolveReorderableSelectConfig(): Required<
  Omit<CngxReorderableSelectConfig, 'dragHandle'>
> & { readonly dragHandle: TemplateRef<void> | null } {
  const user = inject(CNGX_REORDERABLE_SELECT_CONFIG, { optional: true }) ?? {};
  return {
    keyboardModifier: user.keyboardModifier ?? CNGX_REORDERABLE_SELECT_DEFAULTS.keyboardModifier,
    ariaLabel: user.ariaLabel ?? CNGX_REORDERABLE_SELECT_DEFAULTS.ariaLabel,
    dragHandle:
      user.dragHandle === undefined ? CNGX_REORDERABLE_SELECT_DEFAULTS.dragHandle : user.dragHandle,
    freezeStripOnCommit:
      user.freezeStripOnCommit ?? CNGX_REORDERABLE_SELECT_DEFAULTS.freezeStripOnCommit,
  };
}
