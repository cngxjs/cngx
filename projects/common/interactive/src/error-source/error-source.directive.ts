import {
  computed,
  DestroyRef,
  Directive,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import {
  CNGX_ERROR_AGGREGATOR,
  type CngxErrorAggregatorContract,
} from '../error-aggregator/error-aggregator.token';

/**
 * Registers a single error condition with the nearest
 * {@link CngxErrorAggregator} ancestor.
 *
 * Pure DI propagation — no DOM output. The directive is a no-op when no
 * aggregator is present (the optional injection returns `null`).
 * Useful for surfacing errors that live outside the form-field
 * presenter, e.g. server-side validation, async availability checks,
 * or business-rule conflicts.
 *
 * The `when` input takes a plain `boolean`. Consumers binding a signal
 * write `[when]="form.email().invalid()"` — the signal is invoked at the
 * binding site (canonical Angular pattern), mirroring `CngxErrorState`
 * discipline.
 *
 * @example
 * ```html
 * <fieldset cngxErrorAggregator>
 *   <span cngxErrorSource="email-format" [when]="email().invalid()"
 *         label="Email format invalid"></span>
 *   <span cngxErrorSource="email-taken" [when]="serverErr() === 'taken'"
 *         label="Email already in use"></span>
 * </fieldset>
 * ```
 *
 * @category directives
 */
@Directive({
  selector: '[cngxErrorSource]',
  standalone: true,
  exportAs: 'cngxErrorSource',
})
export class CngxErrorSource {
  /** Unique key within the parent aggregator. Required. */
  readonly cngxErrorSource = input.required<string>();

  /** Live error condition. Required (consumer invokes signals at the binding site). */
  readonly when = input.required<boolean>();

  /** Optional human-readable label included in aggregator announcements. */
  readonly label = input<string | null>(null);

  private readonly aggregator = inject<CngxErrorAggregatorContract | null>(
    CNGX_ERROR_AGGREGATOR,
    { optional: true },
  );

  private readonly destroyRef = inject(DestroyRef);

  /** @internal — mirror the input as a Signal<boolean> for the aggregator entry. */
  protected readonly conditionSignal = computed(() => this.when());

  constructor() {
    if (!this.aggregator) {
      return;
    }
    const aggregator = this.aggregator;
    effect((onCleanup) => {
      const key = this.cngxErrorSource();
      const label = this.label();
      untracked(() => {
        aggregator.addSource({
          key,
          condition: this.conditionSignal,
          label,
        });
      });
      onCleanup(() => {
        untracked(() => aggregator.removeSource(key));
      });
    });
    this.destroyRef.onDestroy(() => {
      untracked(() => aggregator.removeSource(this.cngxErrorSource()));
    });
  }
}
