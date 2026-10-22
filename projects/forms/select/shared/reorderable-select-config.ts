import {
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Provider,
  type Signal,
  type TemplateRef,
} from '@angular/core';

import type { CngxReorderModifier } from '@cngx/common/interactive';
import { coerceSignal } from '@cngx/core/utils';

import { injectSelectWord } from '../i18n/select-i18n';
import { CNGX_SELECT_LANGUAGE_EN } from '../i18n/select-language-section';

/**
 * App-wide config for reorder-aware select variants. Cascade:
 * per-instance input > `provideReorderableSelectConfigAt` >
 * `provideReorderableSelectConfig` > library default.
 *
 * @category forms/select/reorderable-multi-select
 */
export interface CngxReorderableSelectConfig {
  /** Forwarded to inner `CngxReorder`. Default `'alt'`. */
  readonly keyboardModifier?: CngxReorderModifier;
  /**
   * ARIA label on the chip-strip `role="group"`, value or `Signal`. Unset, it
   * reads `reorderHint` of the `select` language section (English
   * `'Reorder with Alt + arrow keys'`).
   */
  readonly ariaLabel?: string | Signal<string>;
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
  /**
   * Accessible name of the sortable list of selected values that the panel
   * shows under the touch floor, value or `Signal`. Unset, it reads
   * `reorderListLabel` of the `select` language section (English
   * `'Selected, in order'`).
   */
  readonly listLabel?: string | Signal<string>;
  /**
   * Accessible name of a sortable row's move-up button. Receives the row
   * label. Unset, it reads `reorderMoveUp` (English `'{label}: move up'`).
   */
  readonly moveUp?: CngxReorderMoveLabel | Signal<CngxReorderMoveLabel>;
  /**
   * Accessible name of a sortable row's move-down button. Receives the row
   * label. Unset, it reads `reorderMoveDown` (English `'{label}: move down'`).
   */
  readonly moveDown?: CngxReorderMoveLabel | Signal<CngxReorderMoveLabel>;
  /**
   * Why the first row's move-up button is unavailable, read through
   * `aria-describedby`. Unset, it reads `reorderAtStart` (English
   * `'Already first'`).
   */
  readonly atStart?: string | Signal<string>;
  /**
   * Why the last row's move-down button is unavailable, read through
   * `aria-describedby`. Unset, it reads `reorderAtEnd` (English
   * `'Already last'`).
   */
  readonly atEnd?: string | Signal<string>;
}

/**
 * Accessible name of a sortable row's move button, built from the row label.
 *
 * @category forms/select/reorderable-multi-select
 */
export type CngxReorderMoveLabel = (label: string) => string;

/** Copy keys of {@link CngxReorderableSelectConfig}; resolved to signals. */
type CopyKey = 'ariaLabel' | 'listLabel' | 'moveUp' | 'moveDown' | 'atStart' | 'atEnd';

/** Library defaults. Required-shape so resolution stays `??`-friendly. @internal */
export const CNGX_REORDERABLE_SELECT_DEFAULTS: Required<
  Omit<CngxReorderableSelectConfig, 'dragHandle' | CopyKey>
> & {
  readonly dragHandle: TemplateRef<void> | null;
  readonly ariaLabel: string;
  readonly listLabel: string;
  readonly atStart: string;
  readonly atEnd: string;
} = {
  keyboardModifier: 'alt',
  ariaLabel: CNGX_SELECT_LANGUAGE_EN.reorderHint,
  listLabel: CNGX_SELECT_LANGUAGE_EN.reorderListLabel,
  atStart: CNGX_SELECT_LANGUAGE_EN.reorderAtStart,
  atEnd: CNGX_SELECT_LANGUAGE_EN.reorderAtEnd,
  dragHandle: null,
  freezeStripOnCommit: true,
};

/**
 * Resolved configuration for `CngxReorderableMultiSelect` - the keyboard
 * reorder modifier, drag-handle template, selection-strip freeze-on-commit,
 * and ARIA label.
 *
 * Provide it through one of two entry points, never the token directly:
 *
 * - `provideReorderableSelectConfig(...)` returns `EnvironmentProviders` - app bootstrap or a route.
 * - `provideReorderableSelectConfigAt(...)` returns `Provider[]` - a component's `providers` / `viewProviders`.
 *
 * Compose from the `with*` features (`withReorderKeyboardModifier`,
 * `withReorderAriaLabel`, `withReorderListLabels`, `withDefaultDragHandle`,
 * `withReorderStripFreeze`).
 * Resolution is nearest-wins: a nested provider replaces an ancestor config for
 * its subtree, it does not deep-merge.
 *
 * @category forms/select/reorderable-multi-select
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/reorderable-select-config.ts
 * @since 0.1.0
 * @relatedTo provideReorderableSelectConfig, provideReorderableSelectConfigAt, injectReorderableSelectConfig, withReorderKeyboardModifier, withReorderAriaLabel, withReorderListLabels, withDefaultDragHandle, withReorderStripFreeze, CngxReorderableMultiSelect
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
 * Sets the chip-strip ARIA label. Pass a `Signal` to follow a runtime
 * language switch.
 *
 * @category forms/select/reorderable-multi-select
 */
export function withReorderAriaLabel(
  label: string | Signal<string>,
): CngxReorderableSelectConfigFeature {
  return feature({ ariaLabel: label });
}

/**
 * Sets the copy of the sortable selected-values list the panel shows under
 * the touch floor: the list name, the move-up / move-down button names and
 * the reasons the end buttons are unavailable. Each key takes a value or a
 * `Signal`, so a runtime language switch reaches it; unset keys keep the
 * `select` language section.
 *
 * @category forms/select/reorderable-multi-select
 */
export function withReorderListLabels(
  labels: Pick<CngxReorderableSelectConfig, 'listLabel' | 'moveUp' | 'moveDown' | 'atStart' | 'atEnd'>,
): CngxReorderableSelectConfigFeature {
  return feature(labels);
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
 * Every copy key is a `Signal`, read where the copy is rendered so a runtime
 * language switch reaches it.
 *
 * @internal
 */
export function resolveReorderableSelectConfig(): Required<
  Omit<CngxReorderableSelectConfig, 'dragHandle' | CopyKey>
> & {
  readonly dragHandle: TemplateRef<void> | null;
  readonly ariaLabel: Signal<string>;
  readonly listLabel: Signal<string>;
  readonly moveUp: Signal<CngxReorderMoveLabel>;
  readonly moveDown: Signal<CngxReorderMoveLabel>;
  readonly atStart: Signal<string>;
  readonly atEnd: Signal<string>;
} {
  const user = inject(CNGX_REORDERABLE_SELECT_CONFIG, { optional: true }) ?? {};
  return {
    keyboardModifier: user.keyboardModifier ?? CNGX_REORDERABLE_SELECT_DEFAULTS.keyboardModifier,
    ariaLabel: coerceSignal(user.ariaLabel ?? injectSelectWord('reorderHint')),
    listLabel: coerceSignal(user.listLabel ?? injectSelectWord('reorderListLabel')),
    moveUp: coerceSignal(user.moveUp ?? injectSelectWord('reorderMoveUp')),
    moveDown: coerceSignal(user.moveDown ?? injectSelectWord('reorderMoveDown')),
    atStart: coerceSignal(user.atStart ?? injectSelectWord('reorderAtStart')),
    atEnd: coerceSignal(user.atEnd ?? injectSelectWord('reorderAtEnd')),
    dragHandle:
      user.dragHandle === undefined ? CNGX_REORDERABLE_SELECT_DEFAULTS.dragHandle : user.dragHandle,
    freezeStripOnCommit:
      user.freezeStripOnCommit ?? CNGX_REORDERABLE_SELECT_DEFAULTS.freezeStripOnCommit,
  };
}
