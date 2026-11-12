import { Directive, TemplateRef, inject } from '@angular/core';
import type { CngxPopoverPresentation } from '@cngx/common/popover';

import type { CngxSelectOptionDef, CngxSelectOptionGroupDef } from './option.model';

/**
 * Values the `*cngxSelectCheck` template receives on each option row.
 *
 * Discriminated on `variant`: radio has no `indeterminate`, so narrow on
 * `variant` before reading it. The seven flat composites pass it;
 * `CngxTreeSelect` and `CngxSelectShell` have no such slot. `variant` follows
 * `[selectionIndicatorVariant]`, then `withSelectionIndicatorVariant`, and
 * `'auto'` resolves to `'checkbox'` on the multi-value hosts and
 * `'checkmark'` on the single-value ones. Selection reaches assistive
 * technology through `aria-selected` on the row, and the template renders
 * inside the row without an `aria-hidden` wrapper, so text it renders joins
 * the option's accessible name.
 */
export type CngxSelectCheckContext<T = unknown> =
  CngxSelectCheckBoxContext<T> | CngxSelectCheckRadioContext<T>;

/**
 * Checkbox and checkmark branch of the `*cngxSelectCheck` context.
 *
 * Every host of the slot keeps a flat selection, so `indeterminate` is
 * always `false`; tree rows replace their checkbox through
 * `*cngxTreeSelectNode` instead. `position` mirrors the resolved
 * indicator position, and the template renders once per row on that side.
 */
export interface CngxSelectCheckBoxContext<T = unknown> {
  readonly $implicit: CngxSelectOptionDef<T>;
  readonly option: CngxSelectOptionDef<T>;
  readonly selected: boolean;
  /** Always `false`: every host of this slot keeps a flat selection. */
  readonly indeterminate: boolean;
  /** Resolved by the indicator cascade. */
  readonly variant: 'checkbox' | 'checkmark';
  readonly position: 'before' | 'after';
}

/**
 * Radio branch of the `*cngxSelectCheck` context.
 *
 * Hosts pass it only when the resolved indicator variant is `'radio'`, which
 * `'auto'` never picks, so it appears after an explicit
 * `[selectionIndicatorVariant]="'radio'"` or `withSelectionIndicatorVariant('radio')`.
 * It carries no `indeterminate` because a radio choice is exclusive.
 */
export interface CngxSelectCheckRadioContext<T = unknown> {
  readonly $implicit: CngxSelectOptionDef<T>;
  readonly option: CngxSelectOptionDef<T>;
  readonly selected: boolean;
  /** Discriminator. */
  readonly variant: 'radio';
  readonly position: 'before' | 'after';
}

/**
 * Values the `*cngxSelectCaret` template receives inside the trigger.
 *
 * All nine composites pass it while the caret shows, that is unless
 * `[hideCaret]` is set; `open` (also `$implicit`) mirrors the panel's open
 * state. Assistive technology reads that state from `aria-expanded` on the
 * trigger. `CngxSelectShell` wraps the template in an `aria-hidden` span,
 * the other eight render it bare, so mark a caret glyph `aria-hidden`
 * yourself there.
 */
export interface CngxSelectCaretContext {
  readonly $implicit: boolean;
  readonly open: boolean;
}

/**
 * Values the `*cngxSelectOptgroup` template receives for each option group.
 *
 * The seven flat composites pass it; `CngxSelectShell` renders projected
 * `<cngx-optgroup>` markup and `CngxTreeSelect` has no groups. The group
 * element carries `role="group"` and an `aria-label` from `group.label`, and
 * the default header is `aria-hidden`. A projected header renders without
 * that wrapper, so keep it `aria-hidden` or the label is read twice.
 */
export interface CngxSelectOptgroupContext<T = unknown> {
  readonly $implicit: CngxSelectOptionGroupDef<T>;
  readonly group: CngxSelectOptionGroupDef<T>;
}

/**
 * Values the `*cngxSelectPlaceholder` template receives while nothing is
 * selected.
 *
 * `CngxSelect`, `CngxMultiSelect`, `CngxReorderableMultiSelect`,
 * `CngxTreeSelect` and `CngxSelectShell` pass it. `placeholder` (also
 * `$implicit`) is the raw `[placeholder]` input, `''` by default; the
 * built-in text falls back to the field label, this value does not. The
 * template renders inside the trigger, so its text is what assistive
 * technology reads there while the selection is empty.
 */
export interface CngxSelectPlaceholderContext {
  readonly $implicit: string;
  readonly placeholder: string;
}

/**
 * Values the `*cngxSelectEmpty` template receives when the panel has no
 * option to show.
 *
 * All nine composites pass it. `searchTerm` is always `''` on `CngxSelect`,
 * `CngxMultiSelect`, `CngxReorderableMultiSelect` and `CngxTreeSelect`,
 * which have no search input, and `filtered` is `true` exactly when
 * `searchTerm` is not empty. `totalCount` is the unfiltered option count on
 * `CngxSelectShell` and always `0` on the other eight. The built-in empty
 * message is plain text with no live region, so a projected template
 * changes nothing for assistive technology.
 */
export interface CngxSelectEmptyContext {
  /** Live filter term; `''` for button-trigger variants. */
  readonly searchTerm: string;
  /** Distinguishes "no matches" from "no options at all". */
  readonly filtered: boolean;
  /** Unfiltered count for "no matches in N items" messaging. */
  readonly totalCount: number;
}

/**
 * Values the `*cngxSelectLoading` template receives during the first load.
 *
 * All nine composites pass it while `[state]` loads with no options yet, or
 * while `[loading]` is `true` without `[state]`. `retry` re-runs the load;
 * no host fills `progress`, it is always `undefined`. The template replaces
 * the `loadingVariant` indicator and leaves the panel's status region empty,
 * so it has to announce the load itself.
 */
export interface CngxSelectLoadingContext {
  /** 0-1 progress. Always `undefined`: no composite passes a value. */
  readonly progress?: number;
  readonly retry: () => void;
}

/**
 * Values the `*cngxSelectTriggerLabel` template receives inside the trigger.
 *
 * `CngxSelect` and `CngxSelectShell` pass it. `CngxSelect` renders the
 * template only while a value is selected; `CngxSelectShell` also renders it
 * on an empty selection when no placeholder template is projected, and
 * `selected` (also `$implicit`) is then `null`. The template sits inside the
 * `role="combobox"` trigger, so its text is what assistive technology reads
 * as the current value; keep the option label in it.
 */
export interface CngxSelectTriggerLabelContext<T = unknown> {
  readonly $implicit: CngxSelectOptionDef<T> | null;
  readonly selected: CngxSelectOptionDef<T> | null;
  /** Mirrors the variant's `disabled()` signal. */
  readonly disabled: boolean;
  readonly panelOpen: boolean;
  readonly focused: boolean;
}

/**
 * Values the `*cngxSelectOptionLabel` template receives on each option row.
 *
 * The seven flat composites pass it; `CngxSelectShell` and `CngxTreeSelect`
 * have no such slot. `highlighted` is `true` on the keyboard-active row.
 * The template replaces the label text of the `role="option"` row, so its
 * text becomes the option's accessible name and the label typeahead matches
 * against stays `option.label`.
 */
export interface CngxSelectOptionLabelContext<T = unknown> {
  readonly $implicit: CngxSelectOptionDef<T>;
  readonly option: CngxSelectOptionDef<T>;
  readonly selected: boolean;
  readonly highlighted: boolean;
}

/**
 * Values the `*cngxSelectError` template receives when a load fails.
 *
 * All nine composites pass it, for the full-panel block after a failed first
 * load and for the inline block above the options after a failed refresh.
 * `retry` re-runs the load. The built-in blocks carry `role="alert"`; a
 * projected template renders without that wrapper, so give it its own
 * `role="alert"` if the failure should be announced.
 */
export interface CngxSelectErrorContext {
  readonly $implicit: unknown;
  readonly error: unknown;
  readonly retry: () => void;
}

/**
 * Values the `*cngxSelectRetryButton` template receives inside a built-in
 * error block.
 *
 * All nine composites pass it in three places: the load-error block, the
 * inline refresh-error block and the commit-error banner. It renders only
 * inside those built-in blocks, so a projected `*cngxSelectError` or
 * `*cngxSelectCommitError` template drops it. `retry` (also `$implicit`)
 * reruns the load or the commit of that block, and `label` is the
 * library's retry copy for that block. The built-in control is a native
 * `<button>` with that copy as its text, so a projected control has to be
 * keyboard-reachable and carry an accessible name itself.
 */
export interface CngxSelectRetryButtonContext {
  readonly $implicit: () => void;
  readonly retry: () => void;
  readonly error: unknown;
  /**
   * `true` while the retried commit is pending: the commit-error surface
   * passes the variant's `isCommitting()`, so an override button can turn
   * itself `aria-disabled` while the retry runs. The load and inline
   * refresh-error surfaces retry a load, not a commit, and always pass
   * `false`.
   */
  readonly disabled: boolean;
  /** Library-default label per surface. */
  readonly label: string;
}

/**
 * Values the `*cngxSelectRefreshing` template receives while a reload runs
 * over options already listed.
 *
 * `previousCount` is the number of options `CngxSelectShell` lists at that
 * moment; the other eight composites always pass `0`, so a template there
 * should not print it. The projected template replaces the
 * `refreshingVariant` indicator and leaves the panel's status region empty,
 * so it has to announce the refresh itself.
 */
export interface CngxSelectRefreshingContext {
  /** Options listed on `CngxSelectShell`; `0` on every other composite. */
  readonly previousCount: number;
}

/**
 * Values the `*cngxSelectCommitError` template receives when a commit fails.
 *
 * All nine composites pass it while `commitErrorDisplay` is `'banner'`.
 * `retry` replays the failed commit with the same intended value. `option`
 * is the option the failed commit concerned, `null` for a clear and always
 * `null` on `CngxTreeSelect`. The failure reaches assistive technology
 * through a hidden node the trigger references, independent of this
 * template, so the banner content stays visual.
 */
export interface CngxSelectCommitErrorContext<T = unknown> {
  readonly $implicit: unknown;
  readonly error: unknown;
  readonly option: CngxSelectOptionDef<T> | null;
  readonly retry: () => void;
}

/**
 * Values the `*cngxMultiSelectChip` template receives for each chip in the
 * trigger strip.
 *
 * `CngxMultiSelect`, `CngxReorderableMultiSelect` and
 * `CngxActionMultiSelect` pass it on a fine pointer while no trigger-label
 * template is projected; `index` is only set by the reorderable variant.
 * `remove()` routes through the commit flow when `[commitAction]` is bound
 * and does nothing while the control is disabled or readonly. The built-in
 * chip names its remove button from `chipRemoveAriaLabel`, so a projected
 * remove control needs its own accessible name.
 */
export interface CngxMultiSelectChipContext<T = unknown> {
  readonly $implicit: CngxSelectOptionDef<T>;
  readonly option: CngxSelectOptionDef<T>;
  readonly remove: () => void;
  readonly index?: number;
}

/**
 * Values the `*cngxMultiSelectMoveGlyph` template receives inside a move
 * button.
 *
 * Only `CngxReorderableMultiSelect` passes it, in the reorder list its panel
 * shows under the touch floor. The glyph is decorative (its wrapper is
 * `aria-hidden`; the move button keeps its `aria-label`), so the context only
 * says which button it renders in.
 */
export interface CngxMultiSelectMoveGlyphContext {
  readonly $implicit: 'up' | 'down';
  /** `'up'` in the move-up button, `'down'` in the move-down button. */
  readonly direction: 'up' | 'down';
}

/**
 * Values the `*cngxSelectSheetHandle` template receives in the mobile sheet
 * header.
 *
 * All nine composites pass it while their panel opens as a sheet or
 * fullscreen. The handle is decorative (always `aria-hidden`), so the
 * context carries visual state only.
 */
export interface CngxSelectSheetHandleContext {
  readonly $implicit: CngxPopoverPresentation;
  /** `'sheet'` or `'fullscreen'`; the header is hidden while anchored. */
  readonly presentation: CngxPopoverPresentation;
  /** A swipe on the header is in progress. */
  readonly dragging: boolean;
}

/**
 * Values the `*cngxSelectClearButton` template receives inside the trigger.
 *
 * All nine composites pass it; `clear` (also `$implicit`) clears the value
 * on the single-value hosts and every value on the multi-value hosts. The
 * template renders only while `[clearable]` is set, a value is selected and
 * the control is neither disabled nor readonly, so `disabled` is `false`
 * whenever it renders. Its wrapper stops click, Enter and Space from
 * reaching the trigger. The built-in button takes its `aria-label` from
 * `clearButtonAriaLabel`, so a projected button needs its own name.
 */
export interface CngxSelectClearButtonContext {
  readonly $implicit: () => void;
  readonly clear: () => void;
  readonly disabled: boolean;
}

/**
 * Values the `*cngxSelectOptionPending` template receives on the row whose
 * commit is in flight.
 *
 * The seven flat composites pass it in place of
 * `.cngx-select__option-spinner`; `CngxSelectShell` renders the template
 * inside the projected `<cngx-option>` with no context, and `CngxTreeSelect`
 * has no such slot. The template renders inside the `role="option"` row and
 * the built-in spinner is `aria-hidden`, so keep a projected indicator
 * `aria-hidden` too or its text joins the option's accessible name.
 */
export interface CngxSelectOptionPendingContext<T = unknown> {
  readonly $implicit: CngxSelectOptionDef<T>;
  readonly option: CngxSelectOptionDef<T>;
}

/**
 * Values the `*cngxSelectOptionError` template receives on a selected row
 * after a commit fails.
 *
 * The seven flat composites pass it while `commitErrorDisplay` is
 * `'inline'`, on every selected row; `CngxSelectShell` renders the template
 * inside the failed `<cngx-option>` with no context. The built-in `!` glyph
 * is `aria-hidden`, and the failure reaches assistive technology through a
 * hidden node the trigger references. Keep a projected glyph `aria-hidden`
 * so its text does not join the option's accessible name.
 */
export interface CngxSelectOptionErrorContext<T = unknown> {
  readonly $implicit: CngxSelectOptionDef<T>;
  readonly option: CngxSelectOptionDef<T>;
  readonly error: unknown;
}

/**
 * Values the `*cngxMultiSelectTriggerLabel` template receives in place of
 * the chip strip.
 *
 * `CngxMultiSelect` and `CngxReorderableMultiSelect` pass it while at least
 * one value is selected, so `count` is never `0`. The template replaces the
 * chip strip and the touch summary; the reorderable variant loses drag
 * reordering in the trigger with it. The per-chip remove buttons go too, so
 * values are then removed through the panel or the clear button.
 */
export interface CngxMultiSelectTriggerLabelContext<T = unknown> {
  readonly $implicit: readonly CngxSelectOptionDef<T>[];
  readonly selected: readonly CngxSelectOptionDef<T>[];
  readonly values: readonly T[];
  readonly count: number;
}

/**
 * Values the `*cngxComboboxTriggerLabel` template receives in place of the
 * chip strip.
 *
 * `CngxCombobox` and `CngxActionMultiSelect` pass it whenever the template
 * is projected, including with no selection (`count` is then `0`); the
 * search `<input>` stays. Shape mirrors
 * {@link CngxMultiSelectTriggerLabelContext}. The per-chip remove buttons go
 * with the strip, so values are then removed through the panel or the clear
 * button.
 */
export interface CngxComboboxTriggerLabelContext<T = unknown> {
  readonly $implicit: readonly CngxSelectOptionDef<T>[];
  readonly selected: readonly CngxSelectOptionDef<T>[];
  readonly values: readonly T[];
  readonly count: number;
}

/**
 * Values the `*cngxComboboxChip` template receives for each chip in the
 * combobox trigger.
 *
 * Only `CngxCombobox` passes it, on a fine pointer while no
 * `*cngxComboboxTriggerLabel` template is projected. Mirrors
 * {@link CngxMultiSelectChipContext}, with `index` always set to the chip's
 * position in the strip. The built-in chip names its remove button from
 * `chipRemoveAriaLabel`, so a projected remove control needs its own
 * accessible name.
 */
export interface CngxComboboxChipContext<T = unknown> {
  readonly $implicit: CngxSelectOptionDef<T>;
  readonly option: CngxSelectOptionDef<T>;
  readonly remove: () => void;
  readonly index: number;
}

/**
 * Values the `*cngxSelectChipOverflow` template receives in place of the
 * `+N` badge.
 *
 * `CngxMultiSelect`, `CngxCombobox` and `CngxActionMultiSelect` pass it
 * under `chipOverflow: 'truncate'` or `'fit'`, `CngxTreeSelect` once more
 * chips are selected than `maxVisibleChips`; all four also pass it for the
 * badge of their touch summary. `count` is the number of selected
 * options the strip hides, `label` the badge text the host would render (the
 * `chipOverflowBadge` copy of the active language pack, `+N` in English,
 * the number in the reading locale's digits), `hidden` the hidden selected
 * options themselves in selection order, e.g. for a tooltip listing them.
 * `hidden` keeps its identity while the hidden set is unchanged. The
 * built-in badge is `aria-hidden` because the control announces the
 * selection, so keep a projected badge `aria-hidden` as well.
 */
export interface CngxSelectChipOverflowContext<T = unknown> {
  readonly $implicit: number;
  readonly count: number;
  readonly label: string;
  readonly hidden: readonly CngxSelectOptionDef<T>[];
}

/**
 * `*cngxSelectCheck` slot - overrides the default selection indicator.
 *
 * ```html
 * <cngx-select [options]="...">
 *   <ng-template cngxSelectCheck let-option let-selected="selected">
 *     @if (selected) { <my-icon name="tick" /> }
 *   </ng-template>
 * </cngx-select>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, CngxMultiSelect, CngxCombobox, CngxSelectCaret, CngxSelectOptionLabel
 */
@Directive({
  selector: 'ng-template[cngxSelectCheck]',
  standalone: true,
  exportAs: 'cngxSelectCheck',
})
export class CngxSelectCheck<T = unknown> {
  readonly templateRef = inject<TemplateRef<CngxSelectCheckContext<T>>>(TemplateRef);
}

/**
 * `*cngxSelectCaret` slot - overrides the trigger caret.
 *
 * ```html
 * <cngx-select [options]="colors">
 *   <ng-template cngxSelectCaret let-open="open">
 *     <my-icon [name]="open ? 'chevron-up' : 'chevron-down'" />
 *   </ng-template>
 * </cngx-select>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, CngxMultiSelect, CngxCombobox, CngxSelectCheck, CngxSelectTriggerLabel
 */
@Directive({
  selector: 'ng-template[cngxSelectCaret]',
  standalone: true,
  exportAs: 'cngxSelectCaret',
})
export class CngxSelectCaret {
  readonly templateRef = inject<TemplateRef<CngxSelectCaretContext>>(TemplateRef);
}

/**
 * `*cngxSelectOptgroup` slot - overrides the optgroup header.
 *
 * ```html
 * <cngx-select [options]="grouped">
 *   <ng-template cngxSelectOptgroup let-group>
 *     <strong>{{ group.label }}</strong>
 *   </ng-template>
 * </cngx-select>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, CngxMultiSelect, CngxSelectOptionLabel, CngxSelectOptgroup
 */
@Directive({
  selector: 'ng-template[cngxSelectOptgroup]',
  standalone: true,
  exportAs: 'cngxSelectOptgroupTemplate',
})
export class CngxSelectOptgroupTemplate<T = unknown> {
  readonly templateRef = inject<TemplateRef<CngxSelectOptgroupContext<T>>>(TemplateRef);
}

/**
 * `*cngxSelectPlaceholder` slot - overrides the trigger placeholder.
 *
 * ```html
 * <cngx-select [options]="colors" placeholder="Pick a color…">
 *   <ng-template cngxSelectPlaceholder let-placeholder>
 *     <span class="muted">{{ placeholder }}</span>
 *   </ng-template>
 * </cngx-select>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, CngxMultiSelect, CngxCombobox, CngxSelectTriggerLabel
 */
@Directive({
  selector: 'ng-template[cngxSelectPlaceholder]',
  standalone: true,
  exportAs: 'cngxSelectPlaceholder',
})
export class CngxSelectPlaceholder {
  readonly templateRef = inject<TemplateRef<CngxSelectPlaceholderContext>>(TemplateRef);
}

/**
 * `*cngxSelectEmpty` slot.
 *
 * ```html
 * <cngx-select [options]="colors">
 *   <ng-template cngxSelectEmpty let-term="searchTerm">
 *     No matches for "{{ term }}"
 *   </ng-template>
 * </cngx-select>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, CngxMultiSelect, CngxCombobox, CngxSelectLoading, CngxSelectError
 */
@Directive({
  selector: 'ng-template[cngxSelectEmpty]',
  standalone: true,
  exportAs: 'cngxSelectEmpty',
})
export class CngxSelectEmpty {
  readonly templateRef = inject<TemplateRef<CngxSelectEmptyContext>>(TemplateRef);
}

/**
 * `*cngxSelectLoading` slot.
 *
 * ```html
 * <cngx-select [state]="colorsState">
 *   <ng-template cngxSelectLoading>
 *     <my-spinner /> Loading…
 *   </ng-template>
 * </cngx-select>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, CngxMultiSelect, CngxSelectLoadingGlyph, CngxSelectRefreshing, CngxSelectEmpty
 */
@Directive({
  selector: 'ng-template[cngxSelectLoading]',
  standalone: true,
  exportAs: 'cngxSelectLoading',
})
export class CngxSelectLoading {
  readonly templateRef = inject<TemplateRef<CngxSelectLoadingContext>>(TemplateRef);
}

/**
 * `*cngxSelectTriggerLabel` slot.
 *
 * ```html
 * <cngx-select [options]="colors">
 *   <ng-template cngxSelectTriggerLabel let-selected="selected">
 *     @if (selected) { {{ selected.label }} } @else { Choose… }
 *   </ng-template>
 * </cngx-select>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, CngxMultiSelectTriggerLabel, CngxComboboxTriggerLabel, CngxTreeSelectTriggerLabel
 */
@Directive({
  selector: 'ng-template[cngxSelectTriggerLabel]',
  standalone: true,
  exportAs: 'cngxSelectTriggerLabel',
})
export class CngxSelectTriggerLabel<T = unknown> {
  readonly templateRef = inject<TemplateRef<CngxSelectTriggerLabelContext<T>>>(TemplateRef);
}

/**
 * `*cngxSelectOptionLabel` slot.
 *
 * ```html
 * <cngx-select [options]="colors">
 *   <ng-template cngxSelectOptionLabel let-option>
 *     <my-swatch [color]="option.value" /> {{ option.label }}
 *   </ng-template>
 * </cngx-select>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, CngxMultiSelect, CngxCombobox, CngxSelectOptgroupTemplate, CngxSelectCheck
 */
@Directive({
  selector: 'ng-template[cngxSelectOptionLabel]',
  standalone: true,
  exportAs: 'cngxSelectOptionLabel',
})
export class CngxSelectOptionLabel<T = unknown> {
  readonly templateRef = inject<TemplateRef<CngxSelectOptionLabelContext<T>>>(TemplateRef);
}

/**
 * `*cngxSelectError` slot. `retry` invokes `[retryFn]` and emits `(retry)`.
 *
 * ```html
 * <cngx-select [state]="colorsState" [retryFn]="reload">
 *   <ng-template cngxSelectError let-error let-retry="retry">
 *     <p>Loading failed: {{ error }}</p>
 *     <button (click)="retry()">Try again</button>
 *   </ng-template>
 * </cngx-select>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, CngxMultiSelect, CngxSelectRetryButton, CngxSelectCommitError, CngxSelectEmpty
 */
@Directive({
  selector: 'ng-template[cngxSelectError]',
  standalone: true,
  exportAs: 'cngxSelectError',
})
export class CngxSelectError {
  readonly templateRef = inject<TemplateRef<CngxSelectErrorContext>>(TemplateRef);
}

/**
 * `*cngxSelectRetryButton` slot. Drives all three retry surfaces. Wiring
 * + disabled handling stay with the shell.
 *
 * ```html
 * <cngx-select [state]="colorsState" [retryFn]="reload">
 *   <ng-template cngxSelectRetryButton let-retry let-disabled="disabled" let-label="label">
 *     <my-button kind="ghost" [disabled]="disabled" (clicked)="retry()">{{ label }}</my-button>
 *   </ng-template>
 * </cngx-select>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, CngxMultiSelect, CngxSelectError, CngxSelectCommitError, CngxSelectClearButton
 */
@Directive({
  selector: 'ng-template[cngxSelectRetryButton]',
  standalone: true,
  exportAs: 'cngxSelectRetryButton',
})
export class CngxSelectRetryButton {
  readonly templateRef = inject<TemplateRef<CngxSelectRetryButtonContext>>(TemplateRef);
}

/**
 * `*cngxSelectLoadingGlyph` slot - replaces the spinner/bar/dots inner
 * body. ARIA wiring stays on the parent span. Skeleton ignores this slot.
 *
 * ```html
 * <cngx-select [loading]="true">
 *   <ng-template cngxSelectLoadingGlyph>
 *     <my-spinner kind="dots" />
 *   </ng-template>
 * </cngx-select>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, CngxMultiSelect, CngxSelectLoading, CngxSelectRefreshing
 */
@Directive({
  selector: 'ng-template[cngxSelectLoadingGlyph]',
  standalone: true,
  exportAs: 'cngxSelectLoadingGlyph',
})
export class CngxSelectLoadingGlyph {
  readonly templateRef = inject<TemplateRef<void>>(TemplateRef);
}

/**
 * `*cngxSelectRefreshing` slot - top-bar overlay during refresh.
 *
 * ```html
 * <cngx-select [state]="colorsState">
 *   <ng-template cngxSelectRefreshing let-count="previousCount">
 *     Refreshing {{ count }} items…
 *   </ng-template>
 * </cngx-select>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, CngxMultiSelect, CngxSelectLoading, CngxSelectLoadingGlyph
 */
@Directive({
  selector: 'ng-template[cngxSelectRefreshing]',
  standalone: true,
  exportAs: 'cngxSelectRefreshing',
})
export class CngxSelectRefreshing {
  readonly templateRef = inject<TemplateRef<CngxSelectRefreshingContext>>(TemplateRef);
}

/**
 * `*cngxSelectCommitError` slot. `retry` re-invokes the commit with the
 * same intended value.
 *
 * ```html
 * <cngx-select ...>
 *   <ng-template cngxSelectCommitError let-error let-option="option" let-retry="retry">
 *     <p>Save failed: {{ error?.message }}</p>
 *     <button (click)="retry()">Try again</button>
 *   </ng-template>
 * </cngx-select>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, CngxMultiSelect, CngxSelectError, CngxSelectRetryButton
 */
@Directive({
  selector: 'ng-template[cngxSelectCommitError]',
  standalone: true,
  exportAs: 'cngxSelectCommitError',
})
export class CngxSelectCommitError<T = unknown> {
  readonly templateRef = inject<TemplateRef<CngxSelectCommitErrorContext<T>>>(TemplateRef);
}

/**
 * `*cngxMultiSelectChip` slot. `remove` routes through the commit flow.
 * Fine pointer only: under the touch floor the trigger shows the summary
 * instead of chips, so this template is not rendered there.
 *
 * ```html
 * <cngx-multi-select ...>
 *   <ng-template cngxMultiSelectChip let-opt let-remove="remove">
 *     <my-tag [color]="opt.meta?.color" (close)="remove()">{{ opt.label }}</my-tag>
 *   </ng-template>
 * </cngx-multi-select>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxMultiSelect, CngxComboboxChip, CngxTreeSelectChip, CngxMultiSelectChipHandle
 */
@Directive({
  selector: 'ng-template[cngxMultiSelectChip]',
  standalone: true,
  exportAs: 'cngxMultiSelectChip',
})
export class CngxMultiSelectChip<T = unknown> {
  readonly templateRef = inject<TemplateRef<CngxMultiSelectChipContext<T>>>(TemplateRef);
}

/**
 * `*cngxMultiSelectChipHandle` slot - reorderable chip drag-handle glyph.
 * Cascade: this slot > `[chipDragHandle]` Input (app-wide default via
 * `withDefaultDragHandle`). With neither, no grip renders and the whole chip
 * is the drag surface. Handle span stays `aria-hidden="true"` (AT reads
 * `[reorderAriaLabel]` instead). Fine pointer only: under the touch floor the
 * chip strip is not rendered; the reorder list in the panel has its own
 * handle.
 *
 * ```html
 * <cngx-reorderable-multi-select ...>
 *   <ng-template cngxMultiSelectChipHandle>
 *     <svg viewBox="0 0 8 12" width="8" height="12">…dots…</svg>
 *   </ng-template>
 * </cngx-reorderable-multi-select>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxReorderableMultiSelect, CngxMultiSelectChip, CngxMultiSelectMoveGlyph, withDefaultDragHandle
 */
@Directive({
  selector: 'ng-template[cngxMultiSelectChipHandle]',
  standalone: true,
  exportAs: 'cngxMultiSelectChipHandle',
})
export class CngxMultiSelectChipHandle {
  readonly templateRef = inject<TemplateRef<void>>(TemplateRef);
}

/**
 * `*cngxMultiSelectMoveGlyph` slot - glyph of the move-up / move-down
 * buttons in the reorder list the panel shows under the touch floor.
 *
 * Cascade: this slot > `[moveGlyph]` Input (app-wide default via
 * `withDefaultMoveGlyph`) > the default triangles. The glyph renders inside
 * the move button in an `aria-hidden="true"` wrapper; the button keeps its
 * `aria-label`. `direction` (also `$implicit`) is `'up'` or `'down'`.
 *
 * Only rendered under the touch floor, where the reorder list shows; on a fine
 * pointer the chip strip reorders by drag and keyboard instead. Size the
 * default triangles and the wrapper with `--cngx-select-reorder-move-size`.
 *
 * ```html
 * <cngx-reorderable-multi-select ...>
 *   <ng-template cngxMultiSelectMoveGlyph let-direction>
 *     <my-arrow [direction]="direction" />
 *   </ng-template>
 * </cngx-reorderable-multi-select>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxReorderableMultiSelect, CngxMultiSelectChipHandle, withDefaultMoveGlyph
 */
@Directive({
  selector: 'ng-template[cngxMultiSelectMoveGlyph]',
  standalone: true,
  exportAs: 'cngxMultiSelectMoveGlyph',
})
export class CngxMultiSelectMoveGlyph {
  readonly templateRef = inject<TemplateRef<CngxMultiSelectMoveGlyphContext>>(TemplateRef);
}

/**
 * `*cngxSelectChipOverflow` slot - replaces the `+N` badge that follows the
 * visible chips when `chipOverflow` is `'truncate'` or `'fit'` and selected
 * options are hidden. Under `'fit'` the badge sits in a slot exactly
 * `--cngx-select-chip-fit-badge-reserve` wide and is clipped past it; raise
 * the token for a wider projected badge.
 *
 * Rendered by `CngxMultiSelect`, `CngxCombobox`,
 * `CngxActionMultiSelect` and `CngxTreeSelect`; `CngxReorderableMultiSelect`
 * does not render it (its touch summary keeps the built-in badge). The
 * chip-strip badge is fine pointer only. Under the touch floor the same slot
 * replaces the badge of the summary trigger. Not rendered while a trigger-label slot
 * replaces the chip strip.
 *
 * The default badge is `aria-hidden` because the
 * selection is announced through the control; keep a projected badge
 * `aria-hidden` unless it adds its own interaction.
 *
 * ```html
 * <cngx-multi-select [options]="..." ...>
 *   <ng-template cngxSelectChipOverflow let-count>
 *     <span class="my-badge" aria-hidden="true">and {{ count }} more</span>
 *   </ng-template>
 * </cngx-multi-select>
 * ```
 *
 * Directive-only: like the other chip-strip slots it has no
 * `CNGX_SELECT_CONFIG.templates` default.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxMultiSelect, CngxCombobox, CngxActionMultiSelect, CngxTreeSelect, CngxMultiSelectChip, CngxComboboxChip, withChipOverflow, withMaxVisibleChips
 */
@Directive({
  selector: 'ng-template[cngxSelectChipOverflow]',
  standalone: true,
  exportAs: 'cngxSelectChipOverflow',
})
export class CngxSelectChipOverflow<T = unknown> {
  readonly templateRef = inject<TemplateRef<CngxSelectChipOverflowContext<T>>>(TemplateRef);
}

/**
 * `*cngxMultiSelectTriggerLabel` slot - replaces the entire chip strip.
 * Mutually exclusive with `*cngxMultiSelectChip`.
 *
 * ```html
 * <cngx-multi-select ...>
 *   <ng-template cngxMultiSelectTriggerLabel let-count="count">
 *     @if (count === 0) { Pick topics }
 *     @else { {{ count }} topics selected }
 *   </ng-template>
 * </cngx-multi-select>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxMultiSelect, CngxSelectTriggerLabel, CngxComboboxTriggerLabel, CngxTreeSelectTriggerLabel
 */
@Directive({
  selector: 'ng-template[cngxMultiSelectTriggerLabel]',
  standalone: true,
  exportAs: 'cngxMultiSelectTriggerLabel',
})
export class CngxMultiSelectTriggerLabel<T = unknown> {
  readonly templateRef = inject<TemplateRef<CngxMultiSelectTriggerLabelContext<T>>>(TemplateRef);
}

/**
 * `*cngxSelectClearButton` slot - replaces the X clear button. Consumer owns
 * the element and invokes `clear()`. Keep the slot content within the
 * trigger's line height, or the row grows as soon as the slot appears.
 * The consumer also owns the tap target: the default button floors its hit
 * area to `--cngx-target-min` (44px under a coarse pointer, 0px otherwise)
 * on both axes and hands the extra block size back with a negative margin,
 * and slot content should do the same to stay a WCAG 2.5.5 target without
 * growing the row.
 *
 * ```html
 * <cngx-multi-select ...>
 *   <ng-template cngxSelectClearButton let-clear let-disabled="disabled">
 *     <my-icon-button icon="trash" [disabled]="disabled" (action)="clear()" />
 *   </ng-template>
 * </cngx-multi-select>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, CngxMultiSelect, CngxCombobox, CngxSelectCaret, CngxSelectRetryButton
 */
@Directive({
  selector: 'ng-template[cngxSelectClearButton]',
  standalone: true,
  exportAs: 'cngxSelectClearButton',
})
export class CngxSelectClearButton {
  readonly templateRef = inject<TemplateRef<CngxSelectClearButtonContext>>(TemplateRef);
}

/**
 * `*cngxSelectSheetHandle` slot - replaces the decorative drag handle at the
 * top of the mobile sheet. Rendered inside an `aria-hidden` wrapper: swipe is
 * a pointer gesture, screen-reader users close through X or Done.
 *
 * ```html
 * <cngx-select ...>
 *   <ng-template cngxSelectSheetHandle let-dragging="dragging">
 *     <span class="my-grip" [class.my-grip--active]="dragging"></span>
 *   </ng-template>
 * </cngx-select>
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-slots.ts
 * @since 0.1.0
 * @relatedTo withMobileSheet, CngxPopoverSheetHandle
 * <example-url>/#/forms/select/mobile-sheet/custom-handle</example-url>
 */
@Directive({
  selector: 'ng-template[cngxSelectSheetHandle]',
  standalone: true,
  exportAs: 'cngxSelectSheetHandle',
})
export class CngxSelectSheetHandle {
  readonly templateRef = inject<TemplateRef<CngxSelectSheetHandleContext>>(TemplateRef);
}

/**
 * Values the `*cngxSelectSheetCount` template receives after the mobile
 * sheet title.
 *
 * Only `CngxTreeSelect` passes it; the other composites report no count and
 * the header shows nothing there. `text` (also `$implicit`) is the built-in
 * `selectedCount` copy, and the template renders only while that text is not
 * empty. The count sits in the header outside any `aria-hidden` wrapper, so
 * assistive technology reads whatever the template renders.
 */
export interface CngxSelectSheetCountContext {
  /** The built-in count text (`selectedCount` copy, e.g. `'2 selected'`). */
  readonly $implicit: string;
  readonly text: string;
}

/**
 * `*cngxSelectSheetCount` slot - replaces the selected count after the title
 * of the mobile sheet header. Renders only on a variant that reports a count
 * (today `CngxTreeSelect`); the other variants pass none and the header shows
 * nothing there. A global default goes in
 * `CNGX_SELECT_CONFIG.templates.sheetCount`.
 *
 * ```html
 * <cngx-tree-select ...>
 *   <ng-template cngxSelectSheetCount let-text>
 *     <span class="my-sheet-count">{{ text }}</span>
 *   </ng-template>
 * </cngx-tree-select>
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxTreeSelect, CngxSelectSheetHandle
 */
@Directive({
  selector: 'ng-template[cngxSelectSheetCount]',
  standalone: true,
  exportAs: 'cngxSelectSheetCount',
})
export class CngxSelectSheetCount {
  readonly templateRef = inject<TemplateRef<CngxSelectSheetCountContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _dir: CngxSelectSheetCount,
    ctx: unknown,
  ): ctx is CngxSelectSheetCountContext {
    return true;
  }
}

/**
 * `*cngxSelectOptionPending` slot - replaces
 * `.cngx-select__option-spinner`.
 *
 * ```html
 * <cngx-multi-select ...>
 *   <ng-template cngxSelectOptionPending let-opt>
 *     <my-inline-spinner [label]="opt.label + ' saving'" />
 *   </ng-template>
 * </cngx-multi-select>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, CngxMultiSelect, CngxSelectOptionError, CngxSelectOptionLabel
 */
@Directive({
  selector: 'ng-template[cngxSelectOptionPending]',
  standalone: true,
  exportAs: 'cngxSelectOptionPending',
})
export class CngxSelectOptionPending<T = unknown> {
  readonly templateRef = inject<TemplateRef<CngxSelectOptionPendingContext<T>>>(TemplateRef);
}

/**
 * `*cngxSelectOptionError` slot - inline `!` badge for
 * `commitErrorDisplay === 'inline'`.
 *
 * ```html
 * <cngx-select ...>
 *   <ng-template cngxSelectOptionError let-opt let-error="error">
 *     <my-icon name="alert" [tooltip]="error.message" />
 *   </ng-template>
 * </cngx-select>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, CngxMultiSelect, CngxSelectOptionPending, CngxSelectOptionLabel
 */
@Directive({
  selector: 'ng-template[cngxSelectOptionError]',
  standalone: true,
  exportAs: 'cngxSelectOptionError',
})
export class CngxSelectOptionError<T = unknown> {
  readonly templateRef = inject<TemplateRef<CngxSelectOptionErrorContext<T>>>(TemplateRef);
}

/**
 * `*cngxComboboxTriggerLabel` slot - replaces the chip-strip loop;
 * search input stays in place.
 *
 * ```html
 * <cngx-combobox ...>
 *   <ng-template cngxComboboxTriggerLabel let-count="count">
 *     @if (count > 0) { <span class="count-badge">{{ count }}</span> }
 *   </ng-template>
 * </cngx-combobox>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxCombobox, CngxSelectTriggerLabel, CngxMultiSelectTriggerLabel, CngxTreeSelectTriggerLabel
 */
@Directive({
  selector: 'ng-template[cngxComboboxTriggerLabel]',
  standalone: true,
  exportAs: 'cngxComboboxTriggerLabel',
})
export class CngxComboboxTriggerLabel<T = unknown> {
  readonly templateRef = inject<TemplateRef<CngxComboboxTriggerLabelContext<T>>>(TemplateRef);
}

/**
 * `*cngxComboboxChip` slot. Mirrors `CngxMultiSelectChip` so a chip
 * template can target either variant unchanged. Fine pointer only: under the
 * touch floor the trigger shows the summary instead of chips.
 *
 * ```html
 * <cngx-combobox ...>
 *   <ng-template cngxComboboxChip let-opt let-remove="remove">
 *     <my-tag [color]="opt.meta?.color" (close)="remove()">{{ opt.label }}</my-tag>
 *   </ng-template>
 * </cngx-combobox>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxCombobox, CngxMultiSelectChip, CngxTreeSelectChip
 */
@Directive({
  selector: 'ng-template[cngxComboboxChip]',
  standalone: true,
  exportAs: 'cngxComboboxChip',
})
export class CngxComboboxChip<T = unknown> {
  readonly templateRef = inject<TemplateRef<CngxComboboxChipContext<T>>>(TemplateRef);
}

/**
 * Inline action-slot context for `*cngxSelectAction`. `commit()`
 * defaults `draft` to `{ label: searchTerm }`. `setDirty` and `dirty`
 * drive the dismiss-guard. `isPending`/`error`/`hasError` mirror the
 * commit controller. `value` is type-erased - single forwards
 * `value()`, multi forwards `values()`.
 */
export interface CngxSelectActionContext {
  readonly $implicit: string;
  readonly searchTerm: string;
  readonly close: () => void;
  readonly commit: (draft?: { label: string }) => void;
  readonly isPending: boolean;
  readonly setDirty: (value: boolean) => void;
  readonly dirty: boolean;
  /** No-op for the 5 flat variants. */
  readonly retry: () => void;
  readonly error: unknown;
  readonly hasError: boolean;
  readonly value: unknown;
}

/**
 * Values the `*cngxSelectInputPrefix` and `*cngxSelectInputSuffix`
 * templates receive next to the trigger `<input>`.
 *
 * `CngxTypeahead`, `CngxCombobox`, `CngxActionSelect` and
 * `CngxActionMultiSelect` pass it; the flags mirror the control's disabled,
 * focus and panel state. The wrapper stops a click inside it from reaching
 * the trigger. The content stays in the accessibility tree but outside the
 * `<input>`, so it does not name the input; mark a decorative icon
 * `aria-hidden`.
 */
export interface CngxSelectInputSlotContext {
  readonly disabled: boolean;
  readonly focused: boolean;
  readonly panelOpen: boolean;
}

/**
 * `*cngxSelectInputPrefix` slot - projected before the trigger `<input>`.
 * `CngxTypeahead` / `CngxCombobox` only.
 *
 * ```html
 * <cngx-typeahead ...>
 *   <ng-template cngxSelectInputPrefix let-focused="focused">
 *     <svg class="magnifier" [class.active]="focused" />
 *   </ng-template>
 * </cngx-typeahead>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxCombobox, CngxTypeahead, CngxSelectInputSuffix
 */
@Directive({
  selector: 'ng-template[cngxSelectInputPrefix]',
  standalone: true,
  exportAs: 'cngxSelectInputPrefix',
})
export class CngxSelectInputPrefix {
  readonly templateRef = inject<TemplateRef<CngxSelectInputSlotContext>>(TemplateRef);
}

/**
 * `*cngxSelectInputSuffix` slot - projected after the trigger `<input>`,
 * before clear/caret. Same context as {@link CngxSelectInputPrefix}.
 *
 * ```html
 * <cngx-typeahead [options]="colors">
 *   <ng-template cngxSelectInputSuffix let-focused="focused">
 *     <kbd [class.active]="focused">⏎</kbd>
 *   </ng-template>
 * </cngx-typeahead>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxCombobox, CngxTypeahead, CngxSelectInputPrefix
 */
@Directive({
  selector: 'ng-template[cngxSelectInputSuffix]',
  standalone: true,
  exportAs: 'cngxSelectInputSuffix',
})
export class CngxSelectInputSuffix {
  readonly templateRef = inject<TemplateRef<CngxSelectInputSlotContext>>(TemplateRef);
}

/**
 * `*cngxSelectAction` slot - inline workflow projected per
 * `actionPosition` (`top` / `bottom` / `both`). Zero visual default;
 * the consumer template renders verbatim.
 *
 * ```html
 * <cngx-action-select ...>
 *   <ng-template cngxSelectAction let-term let-commit="commit"
 *                let-pending="isPending">
 *     <button (click)="commit()" [disabled]="pending || !term">
 *       + Create "{{ term }}"
 *     </button>
 *   </ng-template>
 * </cngx-action-select>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-slots.ts
 * @since 0.1.0
 * @relatedTo CngxActionSelect, CngxActionMultiSelect, CngxSelectCommitError
 */
@Directive({
  selector: 'ng-template[cngxSelectAction]',
  standalone: true,
  exportAs: 'cngxSelectAction',
})
export class CngxSelectAction {
  readonly templateRef = inject<TemplateRef<CngxSelectActionContext>>(TemplateRef);
}
