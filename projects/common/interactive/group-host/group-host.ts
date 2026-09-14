import { computed, inject, signal, type Signal } from '@angular/core';
import { CNGX_FORM_FIELD_HOST } from '@cngx/core/tokens';
import { CNGX_STATEFUL, nextUid, type CngxAsyncState } from '@cngx/core/utils';

import { CNGX_ERROR_AGGREGATOR } from '../error-aggregator/error-aggregator.token';

/**
 * Options for {@link injectInteractiveGroupHost}.
 *
 * @category common/interactive
 */
export interface CngxInteractiveGroupHostOptions {
  /**
   * Prefix handed to `nextUid()` for the stable host id, e.g.
   * `'cngx-checkbox-group-'`.
   */
  readonly uidPrefix: string;
  /**
   * The host's `invalid` model. `ariaInvalid` ORs it with the resolved
   * `errorState` so bridge-driven validity and the field-host/aggregator
   * cascade share one derivation.
   */
  readonly invalid: Signal<boolean>;
  /**
   * Optional explicit `[state]` input of the host. When it holds a value,
   * it wins over a discovered ancestor `CNGX_STATEFUL`; when absent or
   * `undefined`, the discovered fallback applies.
   */
  readonly state?: Signal<CngxAsyncState<unknown> | undefined>;
  /**
   * Optional explicit accessible-name input of the host (emitted as
   * `aria-label`). While it holds a non-empty value,
   * {@link CngxInteractiveGroupHost.ariaLabelledBy} yields `null` so the
   * explicit name is not overridden - `aria-labelledby` beats
   * `aria-label` in accname precedence.
   */
  readonly label?: Signal<string | undefined>;
}

/**
 * The scaffolding bundle {@link injectInteractiveGroupHost} returns. Hosts
 * re-export the fields they surface publicly (`id`, `focused`,
 * `errorState`) and delegate their `focusin`/`focusout` host listeners to
 * the handler pair.
 *
 * @category common/interactive
 */
export interface CngxInteractiveGroupHost {
  /** Stable unique host id, prefixed per {@link CngxInteractiveGroupHostOptions.uidPrefix}. */
  readonly id: Signal<string>;
  /** `true` while focus is inside the host subtree. */
  readonly focused: Signal<boolean>;
  /**
   * Field-host to aggregator cascade. Inside `<cngx-form-field>` the
   * form-field's `showError()` decides; outside a form-field but inside
   * an `CngxErrorAggregator` the aggregator's `shouldShow()` decides;
   * standalone it stays `false`.
   */
  readonly errorState: Signal<boolean>;
  /** `invalid() || errorState()` - the shared `aria-invalid` gate. */
  readonly ariaInvalid: Signal<boolean>;
  /**
   * `aria-labelledby` reference to the surrounding field's label. Set
   * only inside a `cngx-form-field` whose host exposes `labelId` and
   * while the explicit `label` option is empty. Group roles take no name
   * from content - this channel names them inside a field.
   */
  readonly ariaLabelledBy: Signal<string | null>;
  /**
   * Effective async state: the explicit `state` option wins over a
   * discovered ancestor `CNGX_STATEFUL`.
   */
  readonly resolvedState: Signal<CngxAsyncState<unknown> | undefined>;
  /** `true` while the resolved state reports `status() === 'loading'`. */
  readonly ariaBusy: Signal<boolean>;
  /** Bind to the host's `(focusin)` listener. */
  handleFocusIn(): void;
  /** Bind to the host's `(focusout)` listener; marks the surrounding field as touched. */
  handleFocusOut(): void;
}

/**
 * Shared scaffolding for the interactive form-control hosts (toggle,
 * checkbox, the standalone interactive chip, and the value groups):
 * stable uid, focus tracking, the
 * field-host/aggregator error cascade, the `aria-invalid` gate, and
 * `[state]`-wins-over-`CNGX_STATEFUL` async-state resolution for
 * `aria-busy`.
 *
 * Call from a field initializer (injection context required - the factory
 * injects `CNGX_FORM_FIELD_HOST`, `CNGX_ERROR_AGGREGATOR`, and
 * `CNGX_STATEFUL`, each optional). Declare the `invalid` model and the
 * `state` input above the call site so the option signals exist when the
 * initializer runs.
 *
 * The factory is wiring, not a swap point: it deliberately has no DI
 * factory token. Consumers authoring their own form-control atoms get the
 * same field-host, aggregator, and stateful integration by calling it
 * directly.
 *
 * All host communication stays reactive (Pillar 2): `errorState`,
 * `ariaInvalid`, and `ariaBusy` are `computed()` members of the returned
 * bundle. `resolvedState` forwards a stable reference (the bound input
 * value or the provider's `state` field, never a fresh literal), so
 * `Object.is` dedupes without an `equal` fn.
 *
 * ```ts
 * private readonly groupHost = injectInteractiveGroupHost({
 *   uidPrefix: 'cngx-checkbox-group-',
 *   invalid: this.invalid,
 *   state: this.state,
 * });
 * readonly id = this.groupHost.id;
 * readonly focused = this.groupHost.focused;
 * readonly errorState = this.groupHost.errorState;
 * protected readonly ariaBusy = this.groupHost.ariaBusy;
 * ```
 *
 * @category common/interactive
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/group-host/group-host.ts
 * @since 0.1.0
 * @relatedTo CngxToggle, CngxCheckbox, CngxChipInteraction, CngxCheckboxGroup, CngxRadioGroup, CngxButtonToggleGroup, CngxButtonMultiToggleGroup, CngxChipGroup, CngxMultiChipGroup
 */
export function injectInteractiveGroupHost(
  options: CngxInteractiveGroupHostOptions,
): CngxInteractiveGroupHost {
  const fieldHost = inject(CNGX_FORM_FIELD_HOST, { optional: true });
  const aggregator = inject(CNGX_ERROR_AGGREGATOR, { optional: true, skipSelf: true });
  const statefulFallback = inject(CNGX_STATEFUL, { optional: true });

  const focusedState = signal(false);

  const errorState = computed<boolean>(
    () => fieldHost?.showError() ?? aggregator?.shouldShow() ?? false,
  );
  const ariaLabelledBy = computed<string | null>(() =>
    options.label?.() ? null : (fieldHost?.labelId?.() ?? null),
  );
  const resolvedState = computed(() => options.state?.() ?? statefulFallback?.state);

  return {
    id: signal(nextUid(options.uidPrefix)).asReadonly(),
    focused: focusedState.asReadonly(),
    errorState,
    ariaInvalid: computed(() => options.invalid() || errorState()),
    ariaLabelledBy,
    resolvedState,
    ariaBusy: computed(() => resolvedState()?.status() === 'loading'),
    handleFocusIn(): void {
      focusedState.set(true);
    },
    handleFocusOut(): void {
      focusedState.set(false);
      fieldHost?.markAsTouched();
    },
  };
}
