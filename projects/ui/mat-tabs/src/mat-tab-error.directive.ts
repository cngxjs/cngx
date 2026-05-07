import {
  computed,
  DestroyRef,
  Directive,
  effect,
  inject,
  input,
  isSignal,
  type Signal,
  untracked,
} from '@angular/core';
import { MatTab } from '@angular/material/tabs';

import { CNGX_TAB_GROUP_HOST } from '@cngx/common/tabs';
import type { CngxErrorAggregatorContract } from '@cngx/common/interactive';

import { CngxMatTabs } from './mat-tabs.directive';

/**
 * Accepted shapes for the `[cngxMatTabError]` input. A plain
 * contract value is wrapped in identity at read time; a signal of a
 * contract value is unwrapped reactively so consumers using
 * `injectErrorAggregator()` (which returns a signal-bearing object)
 * AND consumers passing a plain contract reference share the same
 * binding shape.
 *
 * @category material-bridge
 */
export type CngxMatTabErrorInput =
  | CngxErrorAggregatorContract
  | Signal<CngxErrorAggregatorContract | undefined>
  | undefined;

/**
 * Per-tab error-aggregator binding for the `[cngxMatTabs]`
 * instrumentation surface. Attach to a `<mat-tab>` and the bound
 * aggregator's `shouldShow()` state projects onto the matching
 * Material tab button (badge + descriptor span) via the second
 * Renderer2 effect inside {@link CngxMatTabs}.
 *
 * Mirrors the cngx-native `[cngxTab] [errorAggregator]` shape — the
 * only difference is the binding co-location: cngx-native uses a
 * dedicated `[cngxTab]` directive whose `errorAggregator` is a plain
 * Input; the Material variant cannot host a child directive on
 * `<mat-tab>` (Material owns the tab declaration), so a sibling
 * attribute directive carries the binding instead.
 *
 * Locates its target via {@link CngxMatTabs.getHandleSetup} —
 * `setupsByTab` registry keyed by `MatTab` instance, populated by
 * the parent directive's `contentChildren(MatTab)` query. The
 * directive tracks `presenter.tabs()` in its effect so a same-
 * microtask race (directive injected before parent's sync runs)
 * recovers automatically on the next presenter emission.
 *
 * `destroyRef.onDestroy` resets the slot to `undefined` so a tab
 * whose `[cngxMatTabError]` is removed (e.g. `*ngIf` toggle on the
 * directive) returns to the no-aggregator default — the badge
 * effect drops the visual state on the next tick.
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxMatTabError]',
  exportAs: 'cngxMatTabError',
  standalone: true,
})
export class CngxMatTabError {
  private readonly matTab = inject(MatTab, { self: true });
  private readonly matTabs = inject(CngxMatTabs);
  private readonly presenter = inject(CNGX_TAB_GROUP_HOST);
  private readonly destroyRef = inject(DestroyRef);

  readonly aggregator = input<CngxMatTabErrorInput>(undefined, {
    alias: 'cngxMatTabError',
  });

  // Resolves the input union to a plain `CngxErrorAggregatorContract |
  // undefined`. `Object.is` is the correct equality predicate — the
  // contract is a consumer-owned reference; identity-equality matches
  // the "did the consumer give me a different aggregator?" semantic
  // (Pillar 1: derive once, fire only on meaningful change).
  private readonly resolvedAggregator = computed<
    CngxErrorAggregatorContract | undefined
  >(
    () => {
      const raw = this.aggregator();
      if (raw === undefined) {
        return undefined;
      }
      return isSignal(raw) ? raw() : raw;
    },
    { equal: Object.is },
  );

  constructor() {
    effect(() => {
      // Track BOTH the resolved aggregator AND the presenter tabs
      // signal. The first run after the directive's construction may
      // hit a race window where `setupsByTab` does not yet contain
      // our `MatTab` (parent's `contentChildren(MatTab)` lands in the
      // same microtask as our injection). The presenter emission re-
      // fires this effect on the next sync tick, retrying the lookup
      // until the handle exists. The signal write below runs inside
      // `untracked()` for correctness — pre-empts a future regression
      // where `getHandleSetup` reads a signal (e.g. a switch from the
      // current Map lookup to a `computed()` projection); without the
      // wrap, that change would silently introduce a same-effect
      // re-fire on every aggregator pump.
      const aggregator = this.resolvedAggregator();
      this.presenter.tabs();

      untracked(() => {
        const setup = this.matTabs.getHandleSetup(this.matTab);
        setup?.errorAggregator.set(aggregator);
      });
    });

    this.destroyRef.onDestroy(() => {
      const setup = this.matTabs.getHandleSetup(this.matTab);
      setup?.errorAggregator.set(undefined);
    });
  }
}
