import {
  computed,
  contentChild,
  DestroyRef,
  Directive,
  inject,
  input,
  type Signal,
} from '@angular/core';

import { nextUid } from '@cngx/core/utils';

import type { CngxErrorAggregatorContract } from '@cngx/common/interactive';

import { CngxTabContent } from './tab-content.directive';
import { CngxTabLabel } from './tab-label.directive';
import { CNGX_TAB_GROUP_HOST } from './tab-group-host.token';

/**
 * Single-tab atom. Registers with the enclosing
 * {@link CngxTabGroupPresenter} via {@link CNGX_TAB_GROUP_HOST} on
 * construction, deregisters via {@link DestroyRef} on teardown.
 *
 * Inputs are pure data — `id`, `disabled`, `label`, `errorAggregator`.
 * The atom owns its own field signals; the presenter holds them by
 * reference so subsequent input changes propagate without
 * re-registration.
 *
 * Slot discovery (`labelTemplate` / `contentTemplate`) lets the
 * Level-4 organism project consumer-supplied label and panel-body
 * templates into its tab strip + panel container without the atom
 * carrying any rendering logic itself.
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxTab]',
  exportAs: 'cngxTab',
  standalone: true,
})
export class CngxTab {
  readonly id = input<string>(nextUid('cngx-tab-'));
  readonly disabled = input<boolean>(false);
  readonly label = input<string | undefined>(undefined);
  readonly errorAggregator = input<CngxErrorAggregatorContract | undefined>(
    undefined,
  );

  readonly labelTemplate = contentChild(CngxTabLabel);
  readonly contentTemplate = contentChild(CngxTabContent);

  private readonly host = inject(CNGX_TAB_GROUP_HOST, { optional: true });

  /**
   * `true` when this tab is the presenter's currently active tab.
   * Driven entirely by the presenter — atoms never compute selection
   * locally.
   */
  readonly selected: Signal<boolean> = computed(
    () => this.host?.activeId() === this.id(),
    { equal: Object.is },
  );

  constructor() {
    if (!this.host) {
      throw new Error(
        'CngxTab: no enclosing CngxTabGroupPresenter found. Wrap the tab inside an element carrying [cngxTabGroup] (or place it inside <cngx-tab-group>).',
      );
    }
    const tabId = this.id();
    this.host.register({
      id: tabId,
      label: this.label,
      disabled: this.disabled,
      errorAggregator: this.errorAggregator,
    });
    const host = this.host;
    inject(DestroyRef).onDestroy(() => host.unregister(tabId));
  }
}
