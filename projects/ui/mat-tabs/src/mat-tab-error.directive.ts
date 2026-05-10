import {
  DestroyRef,
  Directive,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { MatTab } from '@angular/material/tabs';

import { CNGX_TAB_GROUP_HOST } from '@cngx/common/tabs';
import type { CngxErrorAggregatorContract } from '@cngx/common/interactive';

import { CngxMatTabs } from './mat-tabs.directive';

/**
 * Per-tab error-aggregator binding for the `[cngxMatTabs]`
 * instrumentation surface. Attach to a `<mat-tab>` and the bound
 * aggregator's `shouldShow()` state projects onto the matching
 * Material tab button (badge + descriptor span) via the second
 * Renderer2 effect inside {@link CngxMatTabs}.
 *
 * Mirrors the cngx-native `[cngxTab] [errorAggregator]` shape
 * one-for-one — same plain `CngxErrorAggregatorContract | undefined`
 * input type (the contract carries its own reactive surface via
 * `shouldShow` / `announcement` Signals; consumers do not wrap their
 * aggregator in another Signal). The only difference is binding
 * co-location: cngx-native uses a dedicated `[cngxTab]` directive
 * whose `errorAggregator` is a plain Input; the Material variant
 * cannot host a child directive on `<mat-tab>` (Material owns the
 * tab declaration), so a sibling attribute directive carries the
 * binding instead.
 *
 * Empty-string transform: a bare `cngxMatTabError` attribute
 * (without `[]` brackets) binds the empty string per Angular's
 * attribute-binding semantics. The transform coerces strings to
 * `undefined` so the slot stays clean — pattern reference per
 * `feedback_bridge_input_not_required` (no required-input on
 * attribute-shaped bridges; empty-string normalisation is the
 * defensive default). Divergence-by-design vs the cngx-native
 * `[cngxTab] [errorAggregator]` sibling at
 * `projects/common/tabs/src/tab.directive.ts:45` — that input
 * lives on a property-binding-only directive (`[cngxTab]`
 * declares structural surface; `[errorAggregator]` is its data
 * input), so a bare attribute is not a reachable misuse. The
 * Material variant attaches `[cngxMatTabError]` directly to a
 * Material-owned `<mat-tab>` element where any developer can
 * type the attribute name without the brackets, so the
 * defensive transform earns its place here only.
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

  readonly aggregator = input<
    CngxErrorAggregatorContract | undefined,
    CngxErrorAggregatorContract | '' | undefined
  >(undefined, {
    alias: 'cngxMatTabError',
    transform: (value) => (typeof value === 'string' ? undefined : value),
  });

  constructor() {
    effect(() => {
      // Track BOTH the bound aggregator AND the presenter tabs
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
      const aggregator = this.aggregator();
      // Race-recovery dependency — tracks `setupsByTab` population so
      // the effect re-fires once our `MatTab` is registered. The bare
      // read is intentional; full rationale lives in the effect's
      // opening comment above. Do NOT tag as dead code.
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
