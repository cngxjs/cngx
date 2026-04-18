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
