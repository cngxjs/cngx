import { Directive, TemplateRef, inject } from '@angular/core';

import type { CngxSelectOptionDef, CngxSelectOptionGroupDef } from './option.model';

/**
 * Context for the selection-indicator (checkmark) template.
 *
 * @category interactive
 */
export interface CngxSelectCheckContext<T = unknown> {
  readonly $implicit: CngxSelectOptionDef<T>;
  readonly option: CngxSelectOptionDef<T>;
  readonly selected: boolean;
}

/**
 * Context for the trigger caret template.
 *
 * @category interactive
 */
export interface CngxSelectCaretContext {
  readonly $implicit: boolean;
  readonly open: boolean;
}

/**
 * Context for the optgroup header template.
 *
 * @category interactive
 */
export interface CngxSelectOptgroupContext<T = unknown> {
  readonly $implicit: CngxSelectOptionGroupDef<T>;
  readonly group: CngxSelectOptionGroupDef<T>;
}

/**
 * Context for the placeholder template (empty selection).
 *
 * @category interactive
 */
export interface CngxSelectPlaceholderContext {
  readonly $implicit: string;
  readonly placeholder: string;
}

/**
 * Context for the empty-state template (no options).
 *
 * @category interactive
 */
export type CngxSelectEmptyContext = Record<string, never>;

/**
 * Context for the loading template.
 *
 * @category interactive
 */
export type CngxSelectLoadingContext = Record<string, never>;

/**
 * Context for the trigger label template.
 *
 * @category interactive
 */
export interface CngxSelectTriggerLabelContext<T = unknown> {
  readonly $implicit: CngxSelectOptionDef<T> | null;
  readonly selected: CngxSelectOptionDef<T> | null;
}

/**
 * Context for the option label template (rich content inside each option).
 *
 * @category interactive
 */
export interface CngxSelectOptionLabelContext<T = unknown> {
  readonly $implicit: CngxSelectOptionDef<T>;
  readonly option: CngxSelectOptionDef<T>;
  readonly selected: boolean;
  readonly highlighted: boolean;
}

/**
 * Context for the error panel template (shown when `state()?.isError()`).
 *
 * @category interactive
 */
export interface CngxSelectErrorContext {
  readonly $implicit: unknown;
  readonly error: unknown;
  readonly retry: () => void;
}

/**
 * Context for the refreshing-indicator template (subtle top-bar shown while
 * `state()?.isRefreshing()` — options remain visible in the panel).
 *
 * @category interactive
 */
export type CngxSelectRefreshingContext = Record<string, never>;

/**
 * Context for the commit-error template (shown when `[commitAction]`
 * transitions to error). Receives the error, the option the user was
 * trying to pick, and a `retry` callback that re-invokes the commit.
 *
 * @category interactive
 */
export interface CngxSelectCommitErrorContext<T = unknown> {
  readonly $implicit: unknown;
  readonly error: unknown;
  readonly option: CngxSelectOptionDef<T> | null;
  readonly retry: () => void;
}

/**
 * Context for the per-chip template in `CngxMultiSelect`. Receives the
 * option the chip represents and a `remove()` callback that removes the
 * value from the current selection (routed through the commit flow if
 * `[commitAction]` is bound).
 *
 * @category interactive
 */
export interface CngxMultiSelectChipContext<T = unknown> {
  readonly $implicit: CngxSelectOptionDef<T>;
  readonly option: CngxSelectOptionDef<T>;
  readonly remove: () => void;
}

/**
 * Context for the trigger-label template in `CngxMultiSelect`. Replaces
 * the default chip strip entirely, letting consumers render a text
 * summary ("3 ausgewählt"), a compact badge + first label, or any other
 * custom markup. Receives the fully-resolved option list, the raw
 * values, and the selection count so one template covers every style
 * (plain text, chip+overflow-count, icon group, …) without re-deriving
 * the same data in the consumer.
 *
 * @category interactive
 */
export interface CngxMultiSelectTriggerLabelContext<T = unknown> {
  readonly $implicit: readonly CngxSelectOptionDef<T>[];
  readonly selected: readonly CngxSelectOptionDef<T>[];
  readonly values: readonly T[];
  readonly count: number;
}

/**
 * Structural-directive wrapper around a `<ng-template>` that supplies the
 * selection-indicator visual for an option. Attach to a template inside a
 * select component to override the default checkmark.
 *
 * @example
 * ```html
 * <cngx-select [options]="...">
 *   <ng-template cngxSelectCheck let-option let-selected="selected">
 *     @if (selected) { <my-icon name="tick" /> }
 *   </ng-template>
 * </cngx-select>
 * ```
 *
 * @category interactive
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
 * Override template for the trigger's dropdown caret.
 *
 * @category interactive
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
 * Override template for the optgroup header.
 *
 * @category interactive
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
 * Override template for the trigger's empty-state placeholder.
 *
 * @category interactive
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
 * Override template for the "no options" panel fallback.
 *
 * @category interactive
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
 * Override template for the loading panel (shown while `[loading]="true"`).
 *
 * @category interactive
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
 * Override template for the trigger label (content displayed when a value
 * is selected). Receives the resolved option.
 *
 * @category interactive
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
 * Override template for an individual option's label rendering.
 *
 * @category interactive
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
 * Override template for the panel's error state (shown when the bound
 * `[state]`'s status is `'error'`). Receives the error value and a `retry`
 * callback that invokes `[retryFn]` and emits `(retry)`.
 *
 * @example
 * ```html
 * <cngx-select [state]="colorsState" [retryFn]="reload">
 *   <ng-template cngxSelectError let-error let-retry="retry">
 *     <p>Laden fehlgeschlagen: {{ error }}</p>
 *     <button (click)="retry()">Nochmal versuchen</button>
 *   </ng-template>
 * </cngx-select>
 * ```
 *
 * @category interactive
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
 * Override template for the panel's refreshing indicator (subtle top-bar
 * shown while the bound `[state]`'s status is `'refreshing'` — options stay
 * visible below it).
 *
 * @category interactive
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
 * Override template for the commit-error surface shown when `[commitAction]`
 * transitions to error. Context exposes the failing option + a retry
 * callback that re-invokes the commit with the same intended value.
 *
 * @example
 * ```html
 * <cngx-select [commitAction]="saveColor" [(value)]="color">
 *   <ng-template cngxSelectCommitError let-error let-option="option" let-retry="retry">
 *     <p>Speichern fehlgeschlagen: {{ error?.message }}</p>
 *     <button (click)="retry()">Nochmal versuchen</button>
 *   </ng-template>
 * </cngx-select>
 * ```
 *
 * @category interactive
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
 * Override template for a per-chip rendering inside `CngxMultiSelect`'s
 * trigger. Replaces the built-in pill + ✕ button with a consumer-authored
 * chip. The `remove` callback in the context routes through the commit
 * flow just like the built-in chip's ✕ does.
 *
 * @example
 * ```html
 * <cngx-multi-select [options]="tags" [(values)]="picked">
 *   <ng-template cngxMultiSelectChip let-opt let-remove="remove">
 *     <my-tag [color]="opt.meta?.color" (close)="remove()">{{ opt.label }}</my-tag>
 *   </ng-template>
 * </cngx-multi-select>
 * ```
 *
 * @category interactive
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
 * Override template for the whole trigger label in `CngxMultiSelect`.
 * When projected, the default chip strip is suppressed and the consumer
 * owns the trigger's rendering — use this for "3 Themen ausgewählt"
 * text summaries, for a single pill showing the first value + "+N"
 * counter, or for any other shape that isn't a chip strip.
 *
 * Mutually exclusive with `*cngxMultiSelectChip`: project this slot and
 * you render the whole trigger; project only the chip slot to tweak
 * the individual pill while keeping the flex-wrap strip layout.
 *
 * @example
 * ```html
 * <cngx-multi-select [options]="tags" [(values)]="picked">
 *   <ng-template cngxMultiSelectTriggerLabel let-count="count">
 *     @if (count === 0) { Wähle Themen }
 *     @else { {{ count }} Themen ausgewählt }
 *   </ng-template>
 * </cngx-multi-select>
 * ```
 *
 * @category interactive
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
