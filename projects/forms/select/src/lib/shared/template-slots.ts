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
  /** Whether the option is currently selected. */
  readonly selected: boolean;
  /**
   * Partial-selection state — `true` when the option represents a group
   * whose descendants are only partially selected. Always `false` for
   * flat (multi / combobox) panels today; future tree-select consumers
   * receive the real value without touching the template.
   */
  readonly indeterminate: boolean;
  /**
   * Concrete indicator variant resolved by the cascade (per-instance
   * input > `provideSelectConfig(withSelectionIndicatorVariant(...))` >
   * `'auto'` → `'checkbox'` in multi, `'checkmark'` in single).
   * Consumers overriding the slot mirror the surrounding panel's styling
   * by reading this flag.
   */
  readonly variant: 'checkbox' | 'checkmark';
  /**
   * Which slot the template is being rendered in — `'before'` or
   * `'after'` the label. A single `*cngxSelectCheck` template can
   * produce different markup per position by branching on this field.
   */
  readonly position: 'before' | 'after';
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
 * Context for the per-chip template in `CngxMultiSelect` and
 * `CngxReorderableMultiSelect`. Receives the option the chip represents
 * and a `remove()` callback that removes the value from the current
 * selection (routed through the commit flow if `[commitAction]` is bound).
 *
 * `index` is only populated by `CngxReorderableMultiSelect` — it mirrors
 * the chip's position in the trigger strip so consumer-authored chip
 * templates can render a drag-handle, position badge, or reorder
 * affordance without re-deriving the index from the iteration. Plain
 * `CngxMultiSelect` leaves it `undefined`; the addition is purely
 * additive (no breaking change to existing `*cngxMultiSelectChip`
 * overrides).
 *
 * @category interactive
 */
export interface CngxMultiSelectChipContext<T = unknown> {
  readonly $implicit: CngxSelectOptionDef<T>;
  readonly option: CngxSelectOptionDef<T>;
  readonly remove: () => void;
  readonly index?: number;
}

/**
 * Context for the clear-button template shared by `CngxSelect`
 * (`[clearable]="true"` single-clear) and `CngxMultiSelect`
 * (clear-all). Exposes the imperative `clear()` callback plus the
 * current disabled flag so a consumer-authored icon can honour the
 * disabled state without re-deriving it.
 *
 * @category interactive
 */
export interface CngxSelectClearButtonContext {
  readonly $implicit: () => void;
  readonly clear: () => void;
  readonly disabled: boolean;
}

/**
 * Context for the per-row pending-indicator template (shown while a
 * `[commitAction]` is in flight for THIS option). Consumer can render
 * anything — custom spinner glyph, text, a dots animation — instead of
 * the default `.cngx-select__option-spinner`.
 *
 * @category interactive
 */
export interface CngxSelectOptionPendingContext<T = unknown> {
  readonly $implicit: CngxSelectOptionDef<T>;
  readonly option: CngxSelectOptionDef<T>;
}

/**
 * Context for the per-row commit-error glyph (shown inline next to the
 * selected option when a commit fails and `commitErrorDisplay` is
 * `'inline'`). Consumer-authored icon can vary by error shape.
 *
 * @category interactive
 */
export interface CngxSelectOptionErrorContext<T = unknown> {
  readonly $implicit: CngxSelectOptionDef<T>;
  readonly option: CngxSelectOptionDef<T>;
  readonly error: unknown;
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
 * Context for the trigger-label template in `CngxCombobox`. Replaces
 * only the chip strip — the search `<input>` stays visible next to it —
 * so consumers can render a compact text summary ("3 Themen ausgewählt")
 * while keeping type-to-filter interaction. Context shape mirrors
 * {@link CngxMultiSelectTriggerLabelContext} so a single consumer
 * template can cover both components when shared.
 *
 * @category interactive
 */
export interface CngxComboboxTriggerLabelContext<T = unknown> {
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
 * Override template for the drag-handle glyph rendered inside each
 * reorderable chip. The directive form is the highest-precedence cascade
 * step in the `CngxReorderableMultiSelect` chip-handle resolution:
 *
 *   1. `*cngxMultiSelectChipHandle` directive (this slot) — wins when projected.
 *   2. `[chipDragHandle]` Input — `TemplateRef<void>` set imperatively.
 *   3. Default `⋮⋮` glyph from the internal `CNGX_SELECT_GLYPHS.dragHandle`.
 *
 * The handle span carrying the rendered template stays
 * `aria-hidden="true"` — the drag affordance is exposed to AT via the
 * chip's `[reorderAriaLabel]` instructions, not the glyph itself.
 *
 * @example
 * ```html
 * <cngx-reorderable-multi-select [options]="tags" [(values)]="picked">
 *   <ng-template cngxMultiSelectChipHandle>
 *     <svg viewBox="0 0 8 12" width="8" height="12">…dots…</svg>
 *   </ng-template>
 * </cngx-reorderable-multi-select>
 * ```
 *
 * @category interactive
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

/**
 * Override template for the clear button on `CngxSelect` (single) and
 * the clear-all button on `CngxMultiSelect`. When projected, replaces
 * the default `✕` button entirely — the consumer template owns the
 * element(s) and invokes the `clear()` callback from the context.
 *
 * @example
 * ```html
 * <cngx-multi-select [clearable]="true" [(values)]="picked">
 *   <ng-template cngxSelectClearButton let-clear let-disabled="disabled">
 *     <my-icon-button icon="trash" [disabled]="disabled" (action)="clear()" />
 *   </ng-template>
 * </cngx-multi-select>
 * ```
 *
 * @category interactive
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
 * Override template for the per-row pending indicator shown while a
 * `[commitAction]` commit is in flight for the option. Replaces the
 * default `.cngx-select__option-spinner` glyph.
 *
 * @example
 * ```html
 * <cngx-multi-select [commitAction]="saveTag" [(values)]="tags">
 *   <ng-template cngxSelectOptionPending let-opt>
 *     <my-inline-spinner [label]="opt.label + ' wird gespeichert'" />
 *   </ng-template>
 * </cngx-multi-select>
 * ```
 *
 * @category interactive
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
 * Override template for the per-row commit-error glyph shown inline
 * next to the selected option when a `[commitAction]` transitions to
 * error and `commitErrorDisplay` is `'inline'`. Replaces the default
 * `.cngx-select__option-error` `!` badge.
 *
 * @example
 * ```html
 * <cngx-select [commitAction]="saveColor" commitErrorDisplay="inline">
 *   <ng-template cngxSelectOptionError let-opt let-error="error">
 *     <my-icon name="alert" [tooltip]="error.message" />
 *   </ng-template>
 * </cngx-select>
 * ```
 *
 * @category interactive
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
 * Override template for the chip strip portion of `CngxCombobox`'s
 * trigger. When projected, the default per-chip loop is replaced; the
 * search `<input>` stays in place next to it, so typeahead-filtering
 * still works with a consumer-authored summary.
 *
 * @example
 * ```html
 * <cngx-combobox [options]="tags" [(values)]="picked">
 *   <ng-template cngxComboboxTriggerLabel let-count="count">
 *     @if (count > 0) { <span class="count-badge">{{ count }}</span> }
 *   </ng-template>
 * </cngx-combobox>
 * ```
 *
 * @category interactive
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
 * Context for the inline-action slot projected into the panel by
 * `*cngxSelectAction`. Used by `CngxActionSelect` / `CngxActionMultiSelect`
 * and opt-in on every other select-family variant — consumer authors
 * an inline "create", "filter", "manage tags" workflow that runs
 * without closing the panel.
 *
 * `$implicit` is the live search term so a minimal template can read
 * `let-term`; the named `searchTerm` alias lets templates that also
 * need other context fields stay self-documenting. `close()` shuts the
 * panel (honours the variant's existing restore-focus behaviour).
 * `commit()` fires the bound `quickCreateAction` with an optional draft
 * label — omitted, it defaults to `{ label: searchTerm }`. `setDirty`
 * plus the `dirty` flag drive the panel's dismiss-guard protocol: a
 * dirty action intercepts Escape and click-outside so in-progress
 * workflows aren't lost. `isPending` mirrors the commit controller's
 * live state so a custom button can show a spinner without re-injecting
 * the controller.
 *
 * @category interactive
 */
export interface CngxSelectActionContext {
  readonly $implicit: string;
  readonly searchTerm: string;
  readonly close: () => void;
  readonly commit: (draft?: { label: string }) => void;
  readonly isPending: boolean;
  readonly setDirty: (value: boolean) => void;
  readonly dirty: boolean;
  /**
   * Re-dispatch the most recent quick-create with the last captured
   * draft + search term + previous-value snapshot. No-op when the
   * component never dispatched a create, or when the action workflow
   * doesn't own a create lifecycle (the 5 flat variants). Lets an
   * action-slot template render a "Retry" button wired to the same
   * supersede-safe path the initial commit ran through, without the
   * consumer having to re-source the draft from its own form state.
   */
  readonly retry: () => void;
  /**
   * Live commit-error surface. Mirrors the variant's commit-controller
   * error signal — `null` when no error is latched (idle, pending,
   * success). Consumers read `error` to render a custom inline error
   * message in the slot alongside the retry affordance.
   */
  readonly error: unknown;
  /**
   * `true` when `error !== null`. Convenience flag so templates can
   * gate a UI branch without repeating the null-check — mirrors the
   * shell's `host.showCommitError()` derivation but scoped to the
   * inline action workflow.
   */
  readonly hasError: boolean;
  /**
   * The variant's current primary value, type-erased to `unknown`.
   * Single-value variants (`CngxActionSelect`) forward `value()`;
   * multi-value variants (`CngxActionMultiSelect`) forward `values()`.
   * Lets an action-slot template read the live selection without
   * re-injecting the component — useful for "add to selected" hints,
   * draft labels that reference the current selection, or in-panel
   * mini-forms that pre-populate fields from `value`.
   */
  readonly value: unknown;
}

/**
 * Context provided to the input-prefix / input-suffix slot templates.
 * Reflects the live reactive state so a consumer-authored icon can
 * dim / rotate / swap based on focus + panel visibility without
 * re-deriving those flags from the component's protected surface.
 *
 * @category interactive
 */
export interface CngxSelectInputSlotContext {
  readonly disabled: boolean;
  readonly focused: boolean;
  readonly panelOpen: boolean;
}

/**
 * Slot projected *before* the focusable `<input>` inside the trigger —
 * used for leading icons (search glyph, currency prefix, loading
 * spinner). Renders on `CngxTypeahead` and `CngxCombobox` only; the
 * button-triggered variants (`CngxSelect`, `CngxMultiSelect`) have no
 * input slot to attach to.
 *
 * @example
 * ```html
 * <cngx-typeahead [options]="users">
 *   <ng-template cngxSelectInputPrefix let-focused="focused">
 *     <svg class="lupe" [class.active]="focused" />
 *   </ng-template>
 * </cngx-typeahead>
 * ```
 *
 * @category interactive
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
 * Slot projected *after* the focusable `<input>`, before the clear
 * button and caret. Typical consumers: trailing loading-spinner, unit
 * suffix label, chevron adornment. Context matches
 * {@link CngxSelectInputPrefix}.
 *
 * @category interactive
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
 * Slot projected inside the panel to host an inline workflow — "create
 * a new tag from the current search term", "manage recipients", "pick
 * a colour". Rendered in `top`, `bottom`, or `both` positions via the
 * variant's `actionPosition` input. Context carries the live
 * `searchTerm`, a `close()` callback, a `commit()` wrapper that fires
 * the bound `quickCreateAction`, plus `dirty` / `setDirty` for the
 * panel's dismiss-guard protocol.
 *
 * Zero visual default — the panel renders the consumer template
 * verbatim, letting the action strip look native to the surrounding
 * design (compact link, full button, split menu, mini-form).
 *
 * @example
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
 *
 * @category interactive
 */
@Directive({
  selector: 'ng-template[cngxSelectAction]',
  standalone: true,
  exportAs: 'cngxSelectAction',
})
export class CngxSelectAction {
  readonly templateRef = inject<TemplateRef<CngxSelectActionContext>>(TemplateRef);
}
