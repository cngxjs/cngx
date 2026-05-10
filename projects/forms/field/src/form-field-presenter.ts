import { computed, Directive, inject, input, type Signal, untracked } from '@angular/core';
import {
  CNGX_FORM_FIELD_HOST,
  type CngxFormFieldHostContract,
} from '@cngx/core/tokens';
import type { CngxFieldAccessor, CngxFieldRef } from './models';
import {
  CNGX_FORM_FIELD_CONFIG,
  CNGX_FORM_FIELD_REVEAL,
  type ConstraintMetadata,
} from './form-field.token';

/**
 * Picks the matching formatter for a min/max pair and returns its output, or
 * `undefined` when neither bound is set.
 */
function buildHint(
  min: number | undefined,
  max: number | undefined,
  both: (a: number, b: number) => string,
  low: (a: number) => string,
  high: (a: number) => string,
): string | undefined {
  if (min !== undefined && max !== undefined) {
    return both(min, max);
  }
  if (min !== undefined) {
    return low(min);
  }
  if (max !== undefined) {
    return high(max);
  }
  return undefined;
}

/**
 * Core coordination directive for `cngx-form-field`.
 *
 * Reads a Signal Forms `Field<T>` accessor and derives all ARIA IDs, visibility states,
 * and constraint metadata as pure `computed()` signals. Applied as a `hostDirective`
 * on `CngxFormField` — not used directly in templates.
 *
 * @category directives
 */
@Directive({
  selector: '[cngxFormFieldPresenter]',
  standalone: true,
  providers: [
    { provide: CNGX_FORM_FIELD_HOST, useExisting: CngxFormFieldPresenter },
  ],
  host: {
    '[class.cngx-field--error]': 'showError()',
    '[class.cngx-field--touched]': 'touched()',
    '[class.cngx-field--dirty]': 'dirty()',
    '[class.cngx-field--disabled]': 'disabled()',
    '[class.cngx-field--required]': 'required()',
    '[class.cngx-field--pending]': 'pending()',
    '[class.cngx-field--readonly]': 'readonly()',
    '[class.cngx-field--hidden]': 'hidden()',
    '[class.cngx-field--valid]': 'valid()',
  },
})
export class CngxFormFieldPresenter implements CngxFormFieldHostContract {
  private readonly config = inject(CNGX_FORM_FIELD_CONFIG);
  private readonly fieldReveal = inject(CNGX_FORM_FIELD_REVEAL, { optional: true });

  /**
   * The Signal Forms field accessor — a callable that returns `FieldState`.
   * Accepts `Field<T>` from `@angular/forms/signals` directly.
   */
  readonly field = input.required<CngxFieldAccessor>({ alias: 'field' });

  /** Resolved field state from the accessor. */
  readonly fieldState: Signal<CngxFieldRef> = computed(() => this.field()());

  /** The field's name from Signal Forms (e.g. `'email'`, `'password'`). */
  readonly name = computed(() => this.fieldState().name());
  /** Deterministic input element ID: `cngx-{name}-input`. */
  readonly inputId = computed(() => `cngx-${this.name()}-input`);
  /** Deterministic label element ID: `cngx-{name}-label`. */
  readonly labelId = computed(() => `cngx-${this.name()}-label`);
  /** Deterministic hint element ID: `cngx-{name}-hint`. */
  readonly hintId = computed(() => `cngx-${this.name()}-hint`);
  /** Deterministic error element ID: `cngx-{name}-error`. */
  readonly errorId = computed(() => `cngx-${this.name()}-error`);

  /**
   * Always contains both hint and error IDs.
   * `aria-hidden` on the respective containers controls what the screen reader actually reads.
   */
  readonly describedBy = computed(() => `${this.hintId()} ${this.errorId()}`);

  /** Whether the field has a `required` validator. */
  readonly required = computed(() => this.fieldState().required());
  /** Whether the field is currently disabled. */
  readonly disabled = computed(() => this.fieldState().disabled());
  /** Whether the field has validation errors (regardless of pending validators). */
  readonly invalid = computed(() => this.fieldState().invalid());
  /** Whether the field is valid (no errors AND no pending validators). */
  readonly valid = computed(() => this.fieldState().valid());
  /** Whether the user has triggered a blur on the field. */
  readonly touched = computed(() => this.fieldState().touched());
  /** Whether the user has changed the field value. */
  readonly dirty = computed(() => this.fieldState().dirty());
  /** Whether async validators are currently running. */
  readonly pending = computed(() => this.fieldState().pending());
  /** Whether the field is hidden (excluded from parent state aggregation). */
  readonly hidden = computed(() => this.fieldState().hidden());
  /** Whether the field is readonly. */
  readonly readonly = computed(() => this.fieldState().readonly());
  /** Whether a form submission is in progress. */
  readonly submitting = computed(() => this.fieldState().submitting());
  /** Current validation errors for this field. */
  readonly errors = computed(() => this.fieldState().errors());
  /** Validation errors for this field and all descendants. */
  readonly errorSummary = computed(() => this.fieldState().errorSummary());
  /**
   * Reasons why the field is disabled.
   * Each entry may include a human-readable `message`.
   */
  /**
   * `true` when errors should be visible.
   *
   * Default gate: `invalid AND (touched OR fieldReveal.showErrors)`. The
   * reveal-trigger is supplied via {@link CNGX_FORM_FIELD_REVEAL} —
   * `CngxErrorScopeFieldBridge` defaults it to the nearest `CngxErrorScope`;
   * router-driven, interceptor-driven, or test-harness triggers can provide
   * their own without depending on the scope contract.
   *
   * Tracked dependencies are `invalid`, and — when a strategy is configured
   * — `touched`, `dirty`, and `fieldReveal.showErrors`. The strategy
   * callback runs inside `untracked()` so any ambient signal reads in
   * consumer code (locale flags, tenant settings, test mocks) cannot
   * widen the presenter's dependency graph beyond the declared four.
   * Flat-graph invariant per `reference_signal_architecture` §3; verified
   * by the cascade-witness spec in `form-field-presenter.spec.ts`.
   */
  readonly showError = computed(() => {
    if (!this.invalid()) {
      return false;
    }

    const strategy = this.config.errorStrategy;
    if (strategy) {
      const touched = this.touched();
      const dirty = this.dirty();
      const submitted = this.fieldReveal?.showErrors() === true;
      return untracked(() =>
        strategy({ touched, dirty, submitted, invalid: true }),
      );
    }

    return this.touched() || this.fieldReveal?.showErrors() === true;
  });

  /** Minimum string length from `minLength()` validator, or `undefined`. */
  readonly minLength = computed(() => this.fieldState().minLength?.());
  /** Maximum string length from `maxLength()` validator, or `undefined`. */
  readonly maxLength = computed(() => this.fieldState().maxLength?.());
  /** Minimum numeric value from `min()` validator, or `undefined`. */
  readonly min = computed(() => this.fieldState().min?.());
  /** Maximum numeric value from `max()` validator, or `undefined`. */
  readonly max = computed(() => this.fieldState().max?.());
  /** Regex patterns from `pattern()` validators. */
  readonly pattern = computed(() => this.fieldState().pattern());

  /**
   * Auto-generated human-readable constraint hints (e.g. "8–64 characters").
   *
   * Only populated when `withConstraintHints()` is active in `provideFormField()`.
   * Custom i18n formatters override the English defaults via `withConstraintHints({ ... })`.
   *
   * Returns an array of hint strings derived from `minLength`/`maxLength` and `min`/`max`.
   */
  readonly constraintHints = computed<string[]>(() => {
    const fmt = this.config.constraintHints;
    if (!fmt) {
      return [];
    }

    const meta: ConstraintMetadata = {
      minLength: this.minLength(),
      maxLength: this.maxLength(),
      min: this.min(),
      max: this.max(),
      patterns: this.pattern(),
      required: this.required(),
    };

    return [
      buildHint(meta.minLength, meta.maxLength, fmt.lengthRange, fmt.minLength, fmt.maxLength),
      buildHint(meta.min, meta.max, fmt.valueRange, fmt.minValue, fmt.maxValue),
      ...fmt.extra(meta),
    ].filter((h): h is string => h !== undefined && h !== '');
  });

  /**
   * Forwards `markAsTouched` into the bound field's state. Atoms inject
   * `CNGX_FORM_FIELD_HOST` and call this from their focus-out path without
   * importing the concrete presenter class.
   */
  markAsTouched(): void {
    this.fieldState().markAsTouched();
  }
}
