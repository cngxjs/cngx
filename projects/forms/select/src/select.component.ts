import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild,
} from '@angular/core';

import {
  CngxListbox,
  CngxListboxTrigger,
  CngxOption,
} from '@cngx/common/interactive';
import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';

import {
  CNGX_FORM_FIELD_CONTROL,
  CngxFormFieldPresenter,
  type CngxFieldRef,
  type CngxFormFieldControl,
} from '@cngx/forms/field';

/**
 * Option descriptor for `CngxSelect`.
 *
 * @category interactive
 */
export interface CngxSelectOption<T = unknown> {
  readonly value: T;
  readonly label: string;
  readonly disabled?: boolean;
}

type CompareFn<T> = (a: T | undefined, b: T | undefined) => boolean;
const defaultCompare: CompareFn<unknown> = (a, b) => Object.is(a, b);

/**
 * Dropdown composite built from `CngxListboxTrigger` + `CngxPopover` +
 * `CngxListbox`. Provides `CNGX_FORM_FIELD_CONTROL` directly — drop it into
 * `<cngx-form-field>` without attaching any bridge directive.
 *
 * Supports single (`[(value)]`) and multi (`[multiple]=true`, `[(value)]` as
 * array) selection. Equality controlled by `[compareWith]`.
 *
 * ### Material / CDK equivalent
 *
 * - `mat-select` (Material composite)
 * - `cdk-listbox` + manual popover wiring (CDK primitives)
 *
 * ### Why better than Material
 *
 * 1. Declarative ARIA — every attribute is `computed()`.
 * 2. Unified keyboard model with `CngxMenu` and combobox via `CngxActiveDescendant`.
 * 3. Two-way bindable via `model()` — `[(value)]` works without CVA.
 * 4. Form-field integration is built-in — no sibling bridge directive needed.
 *
 * @example Standalone (no form-field)
 * ```html
 * <cngx-select
 *   [label]="'Priority'"
 *   [options]="priorities"
 *   [(value)]="selected"
 *   placeholder="Choose one…"
 * />
 * ```
 *
 * @example Inside `<cngx-form-field>` (Signal Forms)
 * ```html
 * <cngx-form-field [field]="f.priority">
 *   <label cngxLabel>Priority</label>
 *   <cngx-select [label]="'Priority'" [options]="priorities" />
 *   <cngx-field-errors />
 * </cngx-form-field>
 * ```
 *
 * @example Inside `<cngx-form-field>` (Reactive Forms via `adaptFormControl`)
 * ```html
 * <cngx-form-field [field]="priorityField">
 *   <label cngxLabel>Priority</label>
 *   <cngx-select [label]="'Priority'" [options]="priorities" [(value)]="rfValue()" />
 *   <cngx-field-errors />
 * </cngx-form-field>
 * ```
 *
 * @category interactive
 */
@Component({
  selector: 'cngx-select',
  exportAs: 'cngxSelect',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxListbox, CngxListboxTrigger, CngxOption, CngxPopover, CngxPopoverTrigger],
  providers: [{ provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxSelect }],
  host: {
    '[id]': 'id()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-errormessage]': 'ariaErrorMessage()',
    '[attr.aria-readonly]': 'ariaReadonly()',
  },
  template: `
    <button
      type="button"
      class="cngx-select__trigger"
      [cngxPopoverTrigger]="pop"
      [haspopup]="'listbox'"
      [cngxListboxTrigger]="lb"
      [popover]="pop"
      [closeOnSelect]="!multiple()"
      [disabled]="disabled()"
      [attr.aria-labelledby]="labelledBy()"
      [attr.aria-invalid]="ariaInvalid()"
      [attr.aria-required]="ariaRequired()"
      [attr.aria-busy]="ariaBusy()"
      (click)="pop.toggle()"
      (focus)="handleFocus()"
      (blur)="handleBlur()"
    >
      <span class="cngx-select__label">{{ triggerLabel() }}</span>
      <span aria-hidden="true" class="cngx-select__caret">&#9662;</span>
    </button>
    <div
      cngxPopover
      #pop="cngxPopover"
      placement="bottom-start"
      class="cngx-select__panel"
    >
      <div
        cngxListbox
        #lb="cngxListbox"
        [label]="label()"
        [multiple]="multiple()"
        [compareWith]="listboxCompareWith()"
        [(value)]="value"
        [(selectedValues)]="selectedValues"
      >
        @for (opt of options(); track opt.value) {
          <div cngxOption [value]="opt.value" [disabled]="!!opt.disabled">
            {{ opt.label }}
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: inline-block;
      position: relative;
      font: inherit;
    }
    .cngx-select__trigger {
      display: inline-flex;
      align-items: center;
      gap: var(--cngx-select-gap, 0.5rem);
      min-width: var(--cngx-select-min-width, 10rem);
      padding: var(--cngx-select-padding, 0.5rem 0.75rem);
      border: var(--cngx-select-border, 1px solid var(--cngx-border, #c4c4c4));
      border-radius: var(--cngx-select-radius, 0.25rem);
      background: var(--cngx-select-bg, transparent);
      color: var(--cngx-select-color, inherit);
      font: inherit;
      cursor: pointer;
      text-align: start;
      justify-content: space-between;
      width: 100%;
    }
    .cngx-select__trigger:focus-visible {
      outline: var(--cngx-select-focus-outline, 2px solid var(--cngx-focus-ring, #1976d2));
      outline-offset: var(--cngx-select-focus-offset, 2px);
    }
    .cngx-select__trigger[disabled] {
      opacity: var(--cngx-select-disabled-opacity, 0.5);
      cursor: not-allowed;
    }
    .cngx-select__label {
      flex: 1 1 auto;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .cngx-select__caret {
      flex: 0 0 auto;
      opacity: 0.7;
    }
    .cngx-select__panel {
      border: var(--cngx-select-panel-border, 1px solid var(--cngx-border, #c4c4c4));
      border-radius: var(--cngx-select-panel-radius, 0.25rem);
      background: var(--cngx-select-panel-bg, var(--cngx-surface, #fff));
      box-shadow: var(--cngx-select-panel-shadow, 0 4px 12px rgba(0, 0, 0, 0.12));
      padding: var(--cngx-select-panel-padding, 0.25rem);
      margin: 0;
      min-width: var(--cngx-select-panel-min-width, 10rem);
    }
  `,
})
export class CngxSelect<T = unknown> implements CngxFormFieldControl {
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });

  // ── Inputs ─────────────────────────────────────────────────────────

  /** Accessible label for the listbox region (also used for the trigger button fallback). */
  readonly label = input.required<string>();

  /** Options to render inside the dropdown. */
  readonly options = input.required<readonly CngxSelectOption<T>[]>();

  /** Whether multi-select is enabled. Defaults to `false`. */
  readonly multiple = input<boolean>(false);

  /** Placeholder shown on the trigger when the selection is empty. */
  readonly placeholder = input<string>('');

  /** Whether the trigger is disabled. Also reflects presenter.disabled() if inside a form-field. */
  readonly disabledInput = input<boolean>(false, { alias: 'disabled' });

  /** Equality function used to match selected values to options. Defaults to `Object.is`. */
  readonly compareWith = input<CompareFn<T>>(defaultCompare as CompareFn<T>);

  /** @internal — listbox wants the unknown-typed equality fn. */
  protected readonly listboxCompareWith = computed<(a: unknown, b: unknown) => boolean>(
    () => this.compareWith() as unknown as (a: unknown, b: unknown) => boolean,
  );

  /** Two-way single-value binding (used when `multiple=false`). */
  readonly value = model<T | undefined>(undefined);

  /** Two-way multi-value binding (used when `multiple=true`). */
  readonly selectedValues = model<T[]>([]);

  // ── ViewChildren ───────────────────────────────────────────────────

  /** @internal — listbox ViewChild used for value-sync effects. */
  private readonly listboxRef = viewChild<CngxListbox>(CngxListbox);

  /** @internal — popover ViewChild used to hide after click-select in single mode. */
  private readonly popoverRef = viewChild<CngxPopover>(CngxPopover);

  // ── CngxFormFieldControl ───────────────────────────────────────────

  readonly id = computed<string>(() => this.presenter?.inputId() ?? '');

  readonly disabled = computed<boolean>(
    () => this.disabledInput() || (this.presenter?.disabled() ?? false),
  );

  readonly errorState = computed<boolean>(() => this.presenter?.showError() ?? false);

  private readonly focusedState = signal(false);
  readonly focused = this.focusedState.asReadonly();

  readonly empty = computed<boolean>(() => {
    if (this.multiple()) {
      return this.selectedValues().length === 0;
    }
    const v = this.value();
    return v === undefined || v === null;
  });

  // ── Host ARIA projection ───────────────────────────────────────────

  /** @internal */
  protected readonly describedBy = computed(() => this.presenter?.describedBy() ?? null);
  /** @internal */
  protected readonly labelledBy = computed(() => this.presenter?.labelId() ?? null);
  /** @internal */
  protected readonly ariaInvalid = computed(() => (this.errorState() ? true : null));
  /** @internal */
  protected readonly ariaRequired = computed(() => (this.presenter?.required() ? true : null));
  /** @internal */
  protected readonly ariaBusy = computed(() => (this.presenter?.pending() ? true : null));
  /** @internal */
  protected readonly ariaReadonly = computed(() => (this.presenter?.readonly() ? true : null));
  /** @internal */
  protected readonly ariaErrorMessage = computed(() =>
    this.errorState() ? (this.presenter?.errorId() ?? null) : null,
  );

  // ── Trigger label ──────────────────────────────────────────────────

  /** Human-readable text displayed on the trigger. */
  protected readonly triggerLabel = computed<string>(() => {
    const opts = this.options();
    const eq = this.compareWith();
    const fallback = this.placeholder() || this.label();
    if (this.multiple()) {
      const sel = this.selectedValues();
      if (sel.length === 0) {
        return fallback;
      }
      const labels = sel
        .map((v) => opts.find((o) => eq(o.value, v))?.label ?? '')
        .filter((l) => l.length > 0);
      return labels.length > 0 ? labels.join(', ') : fallback;
    }
    const v = this.value();
    if (v === undefined || v === null) {
      return fallback;
    }
    return opts.find((o) => eq(o.value, v))?.label ?? fallback;
  });

  constructor() {
    // Bridge AD activations into popover-close for single-select mode. The
    // listbox-trigger already closes on keyboard Enter/Space, but mouse clicks
    // on options go through AD.activated without touching the trigger — so we
    // hook in here to preserve the "click-to-select-and-close" UX that
    // mat-select / native <select> users expect.
    effect((onCleanup) => {
      const lb = this.listboxRef();
      const pop = this.popoverRef();
      if (!lb || !pop) {
        return;
      }
      if (this.multiple()) {
        return;
      }
      const sub = lb.ad.activated.subscribe(() => {
        untracked(() => {
          if (pop.isVisible()) {
            pop.hide();
          }
        });
      });
      onCleanup(() => sub.unsubscribe());
    });

    // Field → Select sync: when inside a cngx-form-field, mirror the bound
    // field value into our model signals. Guarded with equality checks so an
    // inverse sync doesn't bounce back.
    effect(() => {
      const presenter = this.presenter;
      if (!presenter) {
        return;
      }
      const fieldRef: CngxFieldRef = presenter.fieldState();
      const fieldValue: unknown = fieldRef.value();
      const eq = this.compareWith() as CompareFn<unknown>;
      if (this.multiple()) {
        const current = untracked(() => this.selectedValues()) as unknown as unknown[];
        const next = Array.isArray(fieldValue) ? [...(fieldValue as unknown[])] : [];
        if (!arrayEq(current, next, eq)) {
          this.selectedValues.set(next as T[]);
        }
      } else {
        const current: unknown = untracked(() => this.value());
        if (!eq(current, fieldValue)) {
          this.value.set(fieldValue as T | undefined);
        }
      }
    });

    // Select → Field sync: when the user selects an option, push the new
    // value into the bound field's writable value signal.
    effect(() => {
      const presenter = this.presenter;
      if (!presenter) {
        return;
      }
      const fieldRef = presenter.fieldState();
      const selectValue: unknown = this.multiple()
        ? [...this.selectedValues()]
        : this.value();
      const current: unknown = untracked(() => fieldRef.value());
      const eq = this.compareWith() as CompareFn<unknown>;
      if (eq(current, selectValue)) {
        return;
      }
      if (
        this.multiple() &&
        Array.isArray(current) &&
        Array.isArray(selectValue) &&
        arrayEq(current as readonly unknown[], selectValue as readonly unknown[], eq)
      ) {
        return;
      }
      writeFieldValue(fieldRef, selectValue);
    });
  }

  // ── Focus handling ─────────────────────────────────────────────────

  /** @internal */
  protected handleFocus(): void {
    this.focusedState.set(true);
  }

  /** @internal */
  protected handleBlur(): void {
    this.focusedState.set(false);
    this.presenter?.fieldState().markAsTouched();
  }
}

function arrayEq(
  a: readonly unknown[],
  b: readonly unknown[],
  eq: CompareFn<unknown>,
): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (!eq(a[i], b[i])) {
      return false;
    }
  }
  return true;
}

/**
 * Writes `value` into `fieldRef.value` when it exposes a `WritableSignal`.
 * Both the mock-field helper (tests) and the real Signal Forms `FieldState`
 * satisfy this at runtime; `CngxFieldRef` hides the writability for API
 * stability, so we branch by capability check.
 */
function writeFieldValue(fieldRef: CngxFieldRef, value: unknown): void {
  const signalLike = fieldRef.value as unknown;
  if (
    typeof signalLike === 'function' &&
    'set' in signalLike &&
    typeof (signalLike as { set: unknown }).set === 'function'
  ) {
    (signalLike as { set: (v: unknown) => void }).set(value);
  }
}
