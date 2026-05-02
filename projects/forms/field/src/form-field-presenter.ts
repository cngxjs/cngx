import { computed, Directive, inject, input, type Signal, untracked } from '@angular/core';
import type { CngxFieldAccessor, CngxFieldRef } from './models';
import {
  CNGX_FORM_FIELD_CONFIG,
  CNGX_FORM_FIELD_REVEAL,
  type ConstraintMetadata,
} from './form-field.token';

// ── Constraint hint helper ─────────────────────────────────────────

/**
 * Builds a human-readable hint string from optional min/max bounds.
 *
 * @param min  Lower bound (`undefined` = not constrained).
 * @param max  Upper bound (`undefined` = not constrained).
 * @param both Formatter when both bounds exist.
 * @param low  Formatter when only the lower bound exists.
 * @param high Formatter when only the upper bound exists.
 * @returns The formatted string, or `undefined` when neither bound is set.
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

// ── Presenter ──────────────────────────────────────────────────────

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
export class CngxFormFieldPresenter {
  private readonly config = inject(CNGX_FORM_FIELD_CONFIG);
  private readonly fieldReveal = inject(CNGX_FORM_FIELD_REVEAL, { optional: true });

  /**
   * The Signal Forms field accessor — a callable that returns `FieldState`.
   * Accepts `Field<T>` from `@angular/forms/signals` directly.
   */
  readonly field = input.required<CngxFieldAccessor>({ alias: 'field' });

  // ── FieldState access ──────────────────────────────────────────────

  /** Resolved field state from the accessor. */
  readonly fieldState: Signal<CngxFieldRef> = computed(() => this.field()());

  // ── ID Registry (deterministic from field name) ────────────────────

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

  // ── State derivations from FieldState ──────────────────────────────

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
  readonly disabledReasons = computed(() => this.fieldState().disabledReasons());

  // ── Error gate ─────────────────────────────────────────────────────

  /**
   * `true` when errors should be visible.
   *
   * Default gate: invalid AND (touched OR ambient reveal-trigger). The
   * reveal-trigger is supplied via {@link CNGX_FORM_FIELD_REVEAL} —
   * `CngxErrorScopeFieldBridge` defaults it to the nearest `CngxErrorScope`,
   * but consumers may provide a router-driven, interceptor-driven, or
   * custom trigger without depending on the scope contract.
   *
   * **Tracked dependencies (intentional):** `invalid`, plus — only when a
   * strategy is configured — the snapshot fields `touched`, `dirty`, and
   * `fieldReveal.showErrors`. Each of these is a primary driver of the
   * gate; they cascade `showError` re-evaluation by design.
   *
   * **Why the `untracked()` wrap on the strategy call:** the `strategy`
   * callback is a consumer-authored function whose body may read ambient
   * signals (locale flags, tenant-scoped settings, time-of-day predicates,
   * test-harness mocks). Those reads are *secondary* — they must not
   * widen the presenter's dependency graph beyond the four declared
   * inputs. The wrap protects the flat-graph invariant from
   * `reference_signal_architecture` §3 against any consumer-side impurity.
   * Verified by the cascade-witness spec at
   * `form-field-presenter.spec.ts` ("untracked() wrap on strategy callback").
   * Strategies that *are* pure (the common case) pay no overhead.
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

  // ── Constraint metadata ────────────────────────────────────────────

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
}
