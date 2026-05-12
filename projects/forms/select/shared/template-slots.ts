import { Directive, TemplateRef, inject } from '@angular/core';

import type { CngxSelectOptionDef, CngxSelectOptionGroupDef } from './option.model';

/**
 * Selection-indicator slot context. Discriminated on `variant` — radio
 * has no `indeterminate`; narrow on `variant` before reading.
 */
export type CngxSelectCheckContext<T = unknown> =
  | CngxSelectCheckBoxContext<T>
  | CngxSelectCheckRadioContext<T>;

/**
 * Box-style indicator branch. `indeterminate` carries tree /
 * select-all semantics.
 */
export interface CngxSelectCheckBoxContext<T = unknown> {
  readonly $implicit: CngxSelectOptionDef<T>;
  readonly option: CngxSelectOptionDef<T>;
  readonly selected: boolean;
  /** Always `false` for flat panels; real value for tree-select. */
  readonly indeterminate: boolean;
  /** Resolved by the indicator cascade. */
  readonly variant: 'checkbox' | 'checkmark';
  readonly position: 'before' | 'after';
}

/**
 * Radio-style indicator branch. No `indeterminate` — radio is exclusive.
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
 * Context for the trigger caret template.
 */
export interface CngxSelectCaretContext {
  readonly $implicit: boolean;
  readonly open: boolean;
}

/**
 * Context for the optgroup header template.
 */
export interface CngxSelectOptgroupContext<T = unknown> {
  readonly $implicit: CngxSelectOptionGroupDef<T>;
  readonly group: CngxSelectOptionGroupDef<T>;
}

/**
 * Context for the placeholder template (empty selection).
 */
export interface CngxSelectPlaceholderContext {
  readonly $implicit: string;
  readonly placeholder: string;
}

/**
 * Empty-state template context.
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
 * Loading-template context.
 */
export interface CngxSelectLoadingContext {
  /** 0–1 progress. Undefined unless consumer extends `CngxAsyncState`. */
  readonly progress?: number;
  readonly retry: () => void;
}

/**
 * Context for the trigger label template.
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
 * Context for the option label template (rich content inside each option).
 */
export interface CngxSelectOptionLabelContext<T = unknown> {
  readonly $implicit: CngxSelectOptionDef<T>;
  readonly option: CngxSelectOptionDef<T>;
  readonly selected: boolean;
  readonly highlighted: boolean;
}

/**
 * Context for the error panel template (shown when `state()?.isError()`).
 */
export interface CngxSelectErrorContext {
  readonly $implicit: unknown;
  readonly error: unknown;
  readonly retry: () => void;
}

/**
 * Retry-button slot context. Drives every retry surface (load /
 * refresh / commit). Routing handled by the panel-shell host.
 */
export interface CngxSelectRetryButtonContext {
  readonly $implicit: () => void;
  readonly retry: () => void;
  readonly error: unknown;
  /** `true` mid-retry — disable the override button. */
  readonly disabled: boolean;
  /** Library-default label per surface. */
  readonly label: string;
}

/**
 * Refreshing-indicator template context.
 */
export interface CngxSelectRefreshingContext {
  /** Count from the most recent successful load. */
  readonly previousCount: number;
}

/**
 * Commit-error template context. `retry` re-invokes the commit.
 */
export interface CngxSelectCommitErrorContext<T = unknown> {
  readonly $implicit: unknown;
  readonly error: unknown;
  readonly option: CngxSelectOptionDef<T> | null;
  readonly retry: () => void;
}

/**
 * Per-chip context for `CngxMultiSelect` and
 * `CngxReorderableMultiSelect`. `remove()` routes through the commit
 * flow when `[commitAction]` is bound. `index` is only set by the
 * reorderable variant.
 */
export interface CngxMultiSelectChipContext<T = unknown> {
  readonly $implicit: CngxSelectOptionDef<T>;
  readonly option: CngxSelectOptionDef<T>;
  readonly remove: () => void;
  readonly index?: number;
}

/**
 * Clear-button context shared by single-clear and clear-all surfaces.
 */
export interface CngxSelectClearButtonContext {
  readonly $implicit: () => void;
  readonly clear: () => void;
  readonly disabled: boolean;
}

/**
 * Per-row pending-indicator context. Replaces
 * `.cngx-select__option-spinner`.
 */
export interface CngxSelectOptionPendingContext<T = unknown> {
  readonly $implicit: CngxSelectOptionDef<T>;
  readonly option: CngxSelectOptionDef<T>;
}

/**
 * Per-row commit-error glyph context for
 * `commitErrorDisplay === 'inline'`.
 */
export interface CngxSelectOptionErrorContext<T = unknown> {
  readonly $implicit: CngxSelectOptionDef<T>;
  readonly option: CngxSelectOptionDef<T>;
  readonly error: unknown;
}

/**
 * Trigger-label context for `CngxMultiSelect`. Replaces the chip strip
 * entirely.
 */
export interface CngxMultiSelectTriggerLabelContext<T = unknown> {
  readonly $implicit: readonly CngxSelectOptionDef<T>[];
  readonly selected: readonly CngxSelectOptionDef<T>[];
  readonly values: readonly T[];
  readonly count: number;
}

/**
 * Trigger-label context for `CngxCombobox`. Replaces only the chip strip;
 * the search `<input>` stays. Shape mirrors
 * {@link CngxMultiSelectTriggerLabelContext}.
 */
export interface CngxComboboxTriggerLabelContext<T = unknown> {
  readonly $implicit: readonly CngxSelectOptionDef<T>[];
  readonly selected: readonly CngxSelectOptionDef<T>[];
  readonly values: readonly T[];
  readonly count: number;
}

/**
 * Per-chip context for `CngxCombobox`. Mirrors
 * {@link CngxMultiSelectChipContext}.
 */
export interface CngxComboboxChipContext<T = unknown> {
  readonly $implicit: CngxSelectOptionDef<T>;
  readonly option: CngxSelectOptionDef<T>;
  readonly remove: () => void;
  readonly index: number;
}

/**
 * `*cngxSelectCheck` slot — overrides the default selection indicator.
 *
 * ```html
 * <cngx-select [options]="...">
 *   <ng-template cngxSelectCheck let-option let-selected="selected">
 *     @if (selected) { <my-icon name="tick" /> }
 *   </ng-template>
 * </cngx-select>
 * ```
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
 * `*cngxSelectCaret` slot — overrides the trigger caret.
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
 * `*cngxSelectOptgroup` slot — overrides the optgroup header.
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
 * `*cngxSelectPlaceholder` slot — overrides the trigger placeholder.
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
 * `*cngxSelectLoadingGlyph` slot — replaces the spinner/bar/dots inner
 * body. ARIA wiring stays on the parent span. Skeleton ignores this slot.
 *
 * ```html
 * <cngx-select [loading]="true">
 *   <ng-template cngxSelectLoadingGlyph>
 *     <my-spinner kind="dots" />
 *   </ng-template>
 * </cngx-select>
 * ```
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
 * `*cngxSelectRefreshing` slot — top-bar overlay during refresh.
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
 * <cngx-select [commitAction]="saveColor" [(value)]="color">
 *   <ng-template cngxSelectCommitError let-error let-option="option" let-retry="retry">
 *     <p>Save failed: {{ error?.message }}</p>
 *     <button (click)="retry()">Try again</button>
 *   </ng-template>
 * </cngx-select>
 * ```
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
 *
 * ```html
 * <cngx-multi-select [options]="tags" [(values)]="picked">
 *   <ng-template cngxMultiSelectChip let-opt let-remove="remove">
 *     <my-tag [color]="opt.meta?.color" (close)="remove()">{{ opt.label }}</my-tag>
 *   </ng-template>
 * </cngx-multi-select>
 * ```
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
 * `*cngxMultiSelectChipHandle` slot — reorderable chip drag-handle glyph.
 * Cascade: this slot > `[chipDragHandle]` Input > default `⋮⋮`. Handle
 * span stays `aria-hidden="true"` (AT reads `[reorderAriaLabel]` instead).
 *
 * ```html
 * <cngx-reorderable-multi-select [options]="tags" [(values)]="picked">
 *   <ng-template cngxMultiSelectChipHandle>
 *     <svg viewBox="0 0 8 12" width="8" height="12">…dots…</svg>
 *   </ng-template>
 * </cngx-reorderable-multi-select>
 * ```
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
 * `*cngxMultiSelectTriggerLabel` slot — replaces the entire chip strip.
 * Mutually exclusive with `*cngxMultiSelectChip`.
 *
 * ```html
 * <cngx-multi-select [options]="tags" [(values)]="picked">
 *   <ng-template cngxMultiSelectTriggerLabel let-count="count">
 *     @if (count === 0) { Pick topics }
 *     @else { {{ count }} topics selected }
 *   </ng-template>
 * </cngx-multi-select>
 * ```
 */
@Directive({
  selector: 'ng-template[cngxMultiSelectTriggerLabel]',
  standalone: true,
  exportAs: 'cngxMultiSelectTriggerLabel',
})
export class CngxMultiSelectTriggerLabel<T = unknown> {
  readonly templateRef =
    inject<TemplateRef<CngxMultiSelectTriggerLabelContext<T>>>(TemplateRef);
}

/**
 * `*cngxSelectClearButton` slot — replaces the `✕` button. Consumer owns
 * the element and invokes `clear()`.
 *
 * ```html
 * <cngx-multi-select [clearable]="true" [(values)]="picked">
 *   <ng-template cngxSelectClearButton let-clear let-disabled="disabled">
 *     <my-icon-button icon="trash" [disabled]="disabled" (action)="clear()" />
 *   </ng-template>
 * </cngx-multi-select>
 * ```
 */
@Directive({
  selector: 'ng-template[cngxSelectClearButton]',
  standalone: true,
  exportAs: 'cngxSelectClearButton',
})
export class CngxSelectClearButton {
  readonly templateRef =
    inject<TemplateRef<CngxSelectClearButtonContext>>(TemplateRef);
}

/**
 * `*cngxSelectOptionPending` slot — replaces
 * `.cngx-select__option-spinner`.
 *
 * ```html
 * <cngx-multi-select [commitAction]="saveTag" [(values)]="tags">
 *   <ng-template cngxSelectOptionPending let-opt>
 *     <my-inline-spinner [label]="opt.label + ' wird gespeichert'" />
 *   </ng-template>
 * </cngx-multi-select>
 * ```
 */
@Directive({
  selector: 'ng-template[cngxSelectOptionPending]',
  standalone: true,
  exportAs: 'cngxSelectOptionPending',
})
export class CngxSelectOptionPending<T = unknown> {
  readonly templateRef =
    inject<TemplateRef<CngxSelectOptionPendingContext<T>>>(TemplateRef);
}

/**
 * `*cngxSelectOptionError` slot — inline `!` badge for
 * `commitErrorDisplay === 'inline'`.
 *
 * ```html
 * <cngx-select [commitAction]="saveColor" commitErrorDisplay="inline">
 *   <ng-template cngxSelectOptionError let-opt let-error="error">
 *     <my-icon name="alert" [tooltip]="error.message" />
 *   </ng-template>
 * </cngx-select>
 * ```
 */
@Directive({
  selector: 'ng-template[cngxSelectOptionError]',
  standalone: true,
  exportAs: 'cngxSelectOptionError',
})
export class CngxSelectOptionError<T = unknown> {
  readonly templateRef =
    inject<TemplateRef<CngxSelectOptionErrorContext<T>>>(TemplateRef);
}

/**
 * `*cngxComboboxTriggerLabel` slot — replaces the chip-strip loop;
 * search input stays in place.
 *
 * ```html
 * <cngx-combobox [options]="tags" [(values)]="picked">
 *   <ng-template cngxComboboxTriggerLabel let-count="count">
 *     @if (count > 0) { <span class="count-badge">{{ count }}</span> }
 *   </ng-template>
 * </cngx-combobox>
 * ```
 */
@Directive({
  selector: 'ng-template[cngxComboboxTriggerLabel]',
  standalone: true,
  exportAs: 'cngxComboboxTriggerLabel',
})
export class CngxComboboxTriggerLabel<T = unknown> {
  readonly templateRef =
    inject<TemplateRef<CngxComboboxTriggerLabelContext<T>>>(TemplateRef);
}

/**
 * `*cngxComboboxChip` slot. Mirrors `CngxMultiSelectChip` so a chip
 * template can target either variant unchanged.
 *
 * ```html
 * <cngx-combobox [options]="tags" [(values)]="picked">
 *   <ng-template cngxComboboxChip let-opt let-remove="remove">
 *     <my-tag [color]="opt.meta?.color" (close)="remove()">{{ opt.label }}</my-tag>
 *   </ng-template>
 * </cngx-combobox>
 * ```
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
 * defaults `draft` to `{ label: searchTerm }`. `setDirty`+`dirty`
 * drive the dismiss-guard. `isPending`/`error`/`hasError` mirror the
 * commit controller. `value` is type-erased — single forwards
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
 * Context for input-prefix / input-suffix slots.
 */
export interface CngxSelectInputSlotContext {
  readonly disabled: boolean;
  readonly focused: boolean;
  readonly panelOpen: boolean;
}

/**
 * `*cngxSelectInputPrefix` slot — projected before the trigger `<input>`.
 * `CngxTypeahead` / `CngxCombobox` only.
 *
 * ```html
 * <cngx-typeahead [options]="users">
 *   <ng-template cngxSelectInputPrefix let-focused="focused">
 *     <svg class="lupe" [class.active]="focused" />
 *   </ng-template>
 * </cngx-typeahead>
 * ```
 */
@Directive({
  selector: 'ng-template[cngxSelectInputPrefix]',
  standalone: true,
  exportAs: 'cngxSelectInputPrefix',
})
export class CngxSelectInputPrefix {
  readonly templateRef =
    inject<TemplateRef<CngxSelectInputSlotContext>>(TemplateRef);
}

/**
 * `*cngxSelectInputSuffix` slot — projected after the trigger `<input>`,
 * before clear/caret. Same context as {@link CngxSelectInputPrefix}.
 */
@Directive({
  selector: 'ng-template[cngxSelectInputSuffix]',
  standalone: true,
  exportAs: 'cngxSelectInputSuffix',
})
export class CngxSelectInputSuffix {
  readonly templateRef =
    inject<TemplateRef<CngxSelectInputSlotContext>>(TemplateRef);
}

/**
 * `*cngxSelectAction` slot — inline workflow projected per
 * `actionPosition` (`top` / `bottom` / `both`). Zero visual default;
 * the consumer template renders verbatim.
 *
 * ```html
 * <cngx-action-select [options]="tags" [(value)]="current"
 *                     [quickCreateAction]="createTag">
 *   <ng-template cngxSelectAction let-term let-commit="commit"
 *                let-pending="isPending">
 *     <button (click)="commit()" [disabled]="pending || !term">
 *       + „{{ term }}" anlegen
 *     </button>
 *   </ng-template>
 * </cngx-action-select>
 * ```
 */
@Directive({
  selector: 'ng-template[cngxSelectAction]',
  standalone: true,
  exportAs: 'cngxSelectAction',
})
export class CngxSelectAction {
  readonly templateRef = inject<TemplateRef<CngxSelectActionContext>>(TemplateRef);
}
