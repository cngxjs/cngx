import { DestroyRef, Directive, effect, inject, input, untracked } from '@angular/core';
import { MatTab } from '@angular/material/tabs';

import { CNGX_TAB_GROUP_HOST } from '@cngx/common/tabs';
import type { CngxErrorAggregatorContract } from '@cngx/common/interactive';

import { CNGX_MAT_TABS_REGISTRY_HOST } from './mat-tabs-registry.directive';

/**
 * Per-tab error-aggregator binding for `[cngxMatTabs]`. Attach to a
 * `<mat-tab>`; the bound aggregator's `shouldShow()` projects onto
 * the matching Material tab button (badge + descriptor span) via
 * the Renderer2 effect inside {@link CngxMatTabs}.
 *
 * Material owns `<mat-tab>` declarations — `[cngxTab]` cannot host
 * here — so a sibling attribute directive carries the input.
 * Empty-string transform handles the bare-attribute case per
 * `feedback_bridge_input_not_required` (a developer typing
 * `cngxMatTabError` without `[]` brackets must not poison the
 * slot).
 *
 * Locates its target via {@link CNGX_MAT_TABS_REGISTRY_HOST} —
 * the registry provides the token with `useExisting`, so sibling
 * directives reach per-handle slots through a typed contract
 * instead of the concrete class. Tracks `presenter.tabs()` to
 * recover from a same-microtask race where the directive injects
 * before the registry's sync runs. `destroyRef.onDestroy` clears
 * the slot so an `*ngIf`-toggled binding returns to the
 * no-aggregator default.
 */
@Directive({
  selector: '[cngxMatTabError]',
  exportAs: 'cngxMatTabError',
  standalone: true,
})
export class CngxMatTabError {
  private readonly matTab = inject(MatTab, { self: true });
  private readonly registry = inject(CNGX_MAT_TABS_REGISTRY_HOST, {
    host: true,
  });
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
      // Race window - registry's `contentChildren(MatTab)` query and
      // our injection land in the same microtask, so the first lookup
      // can miss our handle. Tracking `presenter.tabs()` re-fires the
      // effect on the next sync tick. `untracked` around the write
      // pre-empts a future regression where `getHandleSetup` reads a
      // signal and self-triggers the aggregator pump.
      const aggregator = this.aggregator();
      // Race-recovery dependency — tracks `setupsByTab` population so
      // the effect re-fires once our `MatTab` is registered. The bare
      // read is intentional; full rationale lives in the effect's
      // opening comment above. Do NOT tag as dead code.
      this.presenter.tabs();

      untracked(() => {
        const setup = this.registry.getHandleSetup(this.matTab);
        setup?.errorAggregator.set(aggregator);
      });
    });

    this.destroyRef.onDestroy(() => {
      const setup = this.registry.getHandleSetup(this.matTab);
      setup?.errorAggregator.set(undefined);
    });
  }
}
