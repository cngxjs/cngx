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
import type { CngxMultiSelectMoveGlyphContext } from './template-slots';

/**
 * App-wide config for reorder-aware select variants. Cascade:
 * per-instance input > `provideReorderableSelectConfigAt` >
 * `provideReorderableSelectConfig` > library default.
 */
export interface CngxReorderableSelectConfig {
  /** Forwarded to inner `CngxReorder`. Default `'alt'`. */
  readonly keyboardModifier?: CngxReorderModifier;
  /**
   * ARIA label on the chip-strip `role="group"`, value or `Signal`. Unset, it
   * reads `reorderHint` of the `select` language section named for the active
   * `keyboardModifier` (English `'Reorder with Alt + arrow keys'`).
   */
  readonly ariaLabel?: string | Signal<string>;
  /**
   * Drag-handle glyph. `null` (default) renders no grip and the whole chip
   * stays the drag surface. Per-instance `[chipDragHandle]` wins.
   */
  readonly dragHandle?: TemplateRef<void> | null;
  /**
   * Glyph of the move-up / move-down buttons in the reorder list the panel
   * shows under the touch floor. `null` keeps the default triangles.
   * Per-instance `[moveGlyph]` wins.
   */
  readonly moveGlyph?: TemplateRef<CngxMultiSelectMoveGlyphContext> | null;
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
 */
export type CngxReorderMoveLabel = (label: string) => string;

/** Copy keys of {@link CngxReorderableSelectConfig}; resolved to signals. */
type CopyKey = 'ariaLabel' | 'listLabel' | 'moveUp' | 'moveDown' | 'atStart' | 'atEnd';

/** Library defaults. Required-shape so resolution stays `??`-friendly. @internal */
export const CNGX_REORDERABLE_SELECT_DEFAULTS: Required<
  Omit<CngxReorderableSelectConfig, 'dragHandle' | 'moveGlyph' | CopyKey>
> & {
  readonly dragHandle: TemplateRef<void> | null;
  readonly moveGlyph: TemplateRef<CngxMultiSelectMoveGlyphContext> | null;
} = {
  keyboardModifier: 'alt',
  dragHandle: null,
  moveGlyph: null,
  freezeStripOnCommit: true,
};

/**
 * Resolved configuration for `CngxReorderableMultiSelect` - the keyboard
 * reorder modifier, drag-handle template, move-button glyph template,
 * selection-strip freeze-on-commit, and ARIA label.
 *
 * Provide it through one of two entry points, never the token directly:
 *
 * - `provideReorderableSelectConfig(...)` returns `EnvironmentProviders` - app bootstrap or a route.
 * - `provideReorderableSelectConfigAt(...)` returns `Provider[]` - a component's `providers` / `viewProviders`.
 *
 * Compose from the `with*` features (`withReorderKeyboardModifier`,
 * `withReorderAriaLabel`, `withReorderListLabels`, `withDefaultDragHandle`,
 * `withDefaultMoveGlyph`, `withReorderStripFreeze`).
 * `provideReorderableSelectConfig` at the root replaces the whole config;
 * `provideReorderableSelectConfigAt` merges over the parent scope, key by key -
 * the keys it sets win, unset keys inherit.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/reorderable-select-config.ts
 * @since 0.1.0
 * @relatedTo provideReorderableSelectConfig, provideReorderableSelectConfigAt, injectReorderableSelectConfig, withReorderKeyboardModifier, withReorderAriaLabel, withReorderListLabels, withDefaultDragHandle, withDefaultMoveGlyph, withReorderStripFreeze, CngxReorderableMultiSelect
 */
export const CNGX_REORDERABLE_SELECT_CONFIG = new InjectionToken<CngxReorderableSelectConfig>(
  'CngxReorderableSelectConfig',
);

/**
 * One config slice returned by a reorderable-select `with*` helper.
 *
 * Pass them to `provideReorderableSelectConfig`,
 * `provideReorderableSelectConfigAt` or `provideCngxSelect`. A later feature
 * replaces the keys an earlier one set.
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
 * Sets the modifier key that turns an arrow key on a focused chip into a
 * move.
 *
 * `'alt'` (default), `'ctrl'` or `'meta'`. The default accessible name of the
 * chip strip names the active modifier, so screen-reader users hear the
 * gesture when they enter the strip. A per-instance
 * `[reorderKeyboardModifier]` wins.
 */
export function withReorderKeyboardModifier(
  modifier: CngxReorderModifier,
): CngxReorderableSelectConfigFeature {
  return feature({ keyboardModifier: modifier });
}

/**
 * Sets the accessible name of the reorderable chip strip.
 *
 * Unset, the name reads `reorderHint` of the `select` language section, built
 * for the active keyboard modifier (English `'Reorder with Alt + arrow
 * keys'`). A fixed string does not follow a modifier change, so name the
 * gesture in it. Pass a `Signal` to follow a runtime language switch. A
 * per-instance `[reorderAriaLabel]` wins.
 *
 * @example
 * ```ts
 * provideReorderableSelectConfig(withReorderAriaLabel('Sort with Alt and the arrow keys'));
 * ```
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
 */
export function withReorderListLabels(
  labels: Pick<
    CngxReorderableSelectConfig,
    'listLabel' | 'moveUp' | 'moveDown' | 'atStart' | 'atEnd'
  >,
): CngxReorderableSelectConfigFeature {
  return feature(labels);
}

/**
 * Sets the drag-handle glyph rendered before each chip of
 * `CngxReorderableMultiSelect`.
 *
 * `null` (default) renders no grip and the whole chip stays the drag surface.
 * The glyph sits in an `aria-hidden` span; the keyboard move belongs to the
 * chip itself. A per-instance `[chipDragHandle]` or a projected
 * `*cngxMultiSelectChipHandle` wins. A `TemplateRef` needs a live view, so
 * build this config in a `useFactory`, as `withTemplates` describes.
 */
export function withDefaultDragHandle(
  template: TemplateRef<void> | null,
): CngxReorderableSelectConfigFeature {
  return feature({ dragHandle: template });
}

/**
 * Sets the default move-up / move-down glyph of the touch reorder list
 * app-wide via `TemplateRef<CngxMultiSelectMoveGlyphContext>`; the context
 * carries the `direction`. `null` keeps the default triangles.
 */
export function withDefaultMoveGlyph(
  template: TemplateRef<CngxMultiSelectMoveGlyphContext> | null,
): CngxReorderableSelectConfigFeature {
  return feature({ moveGlyph: template });
}

/**
 * Sets whether reordering pauses while a commit is in flight.
 *
 * Default `true`: the chip strip and the touch reorder list stop accepting
 * moves until the commit settles, and the list reports `aria-busy`. `false`
 * keeps them live, and a new reorder supersedes the pending commit through
 * the commit controller. There is no per-instance input.
 *
 * @example
 * ```ts
 * provideReorderableSelectConfig(withReorderStripFreeze(false));
 * ```
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
 * because `viewProviders` rejects `EnvironmentProviders`. Merges over the
 * config of the parent injector: the keys set here win, unset keys inherit.
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
  return [
    {
      provide: CNGX_REORDERABLE_SELECT_CONFIG,
      useFactory: (): CngxReorderableSelectConfig => ({
        ...inject(CNGX_REORDERABLE_SELECT_CONFIG, { skipSelf: true, optional: true }),
        ...merged,
      }),
    },
  ];
}

/**
 * Effective config for the current injector. Injection context required.
 * Every copy key is a `Signal`, read where the copy is rendered so a runtime
 * language switch reaches it.
 *
 * @internal
 */
export function resolveReorderableSelectConfig(): Required<
  Omit<CngxReorderableSelectConfig, 'dragHandle' | 'moveGlyph' | CopyKey>
> & {
  readonly dragHandle: TemplateRef<void> | null;
  readonly moveGlyph: TemplateRef<CngxMultiSelectMoveGlyphContext> | null;
  /** A custom chip-strip label, or a signal of `undefined` to let `reorderHint` name the modifier. */
  readonly ariaLabel: Signal<string | undefined>;
  /** Formats the default chip-strip hint for a keyboard modifier. */
  readonly reorderHint: Signal<(modifier: CngxReorderModifier) => string>;
  readonly listLabel: Signal<string>;
  readonly moveUp: Signal<CngxReorderMoveLabel>;
  readonly moveDown: Signal<CngxReorderMoveLabel>;
  readonly atStart: Signal<string>;
  readonly atEnd: Signal<string>;
} {
  const user = inject(CNGX_REORDERABLE_SELECT_CONFIG, { optional: true }) ?? {};
  return {
    keyboardModifier: user.keyboardModifier ?? CNGX_REORDERABLE_SELECT_DEFAULTS.keyboardModifier,
    ariaLabel: coerceSignal(user.ariaLabel),
    reorderHint: injectSelectWord('reorderHint'),
    listLabel: coerceSignal(user.listLabel ?? injectSelectWord('reorderListLabel')),
    moveUp: coerceSignal(user.moveUp ?? injectSelectWord('reorderMoveUp')),
    moveDown: coerceSignal(user.moveDown ?? injectSelectWord('reorderMoveDown')),
    atStart: coerceSignal(user.atStart ?? injectSelectWord('reorderAtStart')),
    atEnd: coerceSignal(user.atEnd ?? injectSelectWord('reorderAtEnd')),
    dragHandle:
      user.dragHandle === undefined ? CNGX_REORDERABLE_SELECT_DEFAULTS.dragHandle : user.dragHandle,
    moveGlyph:
      user.moveGlyph === undefined ? CNGX_REORDERABLE_SELECT_DEFAULTS.moveGlyph : user.moveGlyph,
    freezeStripOnCommit:
      user.freezeStripOnCommit ?? CNGX_REORDERABLE_SELECT_DEFAULTS.freezeStripOnCommit,
  };
}
