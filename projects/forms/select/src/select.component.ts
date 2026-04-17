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
 * Native-feeling single-select dropdown.
 *
 * Behaves like a `<select>`: click the trigger to open, click an option to
 * select and close, keyboard model identical to the OS dropdown (arrow keys,
 * Home / End, Enter, Space, Escape, typeahead). Position auto-flips when
 * there is no room below the trigger.
 *
 * For multi-select use `CngxMultiSelect`; for filter-as-you-type use
 * `CngxCombobox`; for free-text-plus-suggestions use `CngxAutocomplete`.
 *
 * ### Form-field integration
 *
 * Provides `CNGX_FORM_FIELD_CONTROL` directly — drop it inside
 * `<cngx-form-field>` with no bridge directive.
 *
 * ### Material / CDK equivalent
 *
 * - `mat-select` (single-select mode)
 * - `cdk-listbox` + manual popover wiring
 *
 * ### Why better than Material
 *
 * 1. Declarative ARIA — every attribute is `computed()`.
 * 2. Unified keyboard model with `CngxMenu` and `CngxCombobox` via `CngxActiveDescendant`.
 * 3. Two-way bindable via `model()` — `[(value)]` works without CVA.
 * 4. Form-field integration is built-in.
 * 5. Position auto-flips via native CSS `position-try-fallbacks`.
 *
 * @example Standalone
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
      [closeOnSelect]="true"
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
      placement="bottom"
      class="cngx-select__panel"
    >
      <div
        cngxListbox
        #lb="cngxListbox"
        [label]="label()"
        [compareWith]="listboxCompareWith()"
        [(value)]="value"
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
      /* Match trigger width by default; grow up to viewport. */
      min-width: anchor-size(width);
      /* Auto-flip to the opposite side when there is no room below. */
      position-try-fallbacks:
        flip-block,
        flip-inline,
        flip-block flip-inline;
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

  /** Placeholder shown on the trigger when no value is selected. */
  readonly placeholder = input<string>('');

  /** Whether the trigger is disabled. Also reflects `presenter.disabled()` inside a form-field. */
  readonly disabledInput = input<boolean>(false, { alias: 'disabled' });

  /** Equality function used to match the selected value to an option. Defaults to `Object.is`. */
  readonly compareWith = input<CompareFn<T>>(defaultCompare as CompareFn<T>);

  /** Two-way single-value binding. */
  readonly value = model<T | undefined>(undefined);

  // ── ViewChildren ───────────────────────────────────────────────────

  /** @internal — listbox ViewChild used for value-sync effects. */
  private readonly listboxRef = viewChild<CngxListbox>(CngxListbox);

  /** @internal — popover ViewChild used to hide after click-select. */
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

  /** @internal — listbox expects the wider-typed equality fn. */
  protected readonly listboxCompareWith = computed<(a: unknown, b: unknown) => boolean>(
    () => this.compareWith() as unknown as (a: unknown, b: unknown) => boolean,
  );

  // ── Trigger label ──────────────────────────────────────────────────

  /** Human-readable text displayed on the trigger. */
  protected readonly triggerLabel = computed<string>(() => {
    const fallback = this.placeholder() || this.label();
    const v = this.value();
    if (v === undefined || v === null) {
      return fallback;
    }
    const eq = this.compareWith();
    return this.options().find((o) => eq(o.value, v))?.label ?? fallback;
  });

  constructor() {
    // Bridge AD activations into popover-close. The listbox-trigger already
    // closes on keyboard Enter/Space, but mouse clicks on options go through
    // AD.activated without touching the trigger — we hook here to preserve
    // the "click-to-select-and-close" UX that native <select> users expect.
    effect((onCleanup) => {
      const lb = this.listboxRef();
      const pop = this.popoverRef();
      if (!lb || !pop) {
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

    // Field → Select sync: mirror bound field value into our model signal.
    effect(() => {
      const presenter = this.presenter;
      if (!presenter) {
        return;
      }
      const fieldRef: CngxFieldRef = presenter.fieldState();
      const fieldValue: unknown = fieldRef.value();
      const eq = this.compareWith() as CompareFn<unknown>;
      const current: unknown = untracked(() => this.value());
      if (!eq(current, fieldValue)) {
        this.value.set(fieldValue as T | undefined);
      }
    });

    // Select → Field sync: push selection back into bound field.
    effect(() => {
      const presenter = this.presenter;
      if (!presenter) {
        return;
      }
      const fieldRef = presenter.fieldState();
      const selectValue: unknown = this.value();
      const current: unknown = untracked(() => fieldRef.value());
      const eq = this.compareWith() as CompareFn<unknown>;
      if (eq(current, selectValue)) {
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
