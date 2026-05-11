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
 * Single-tab atom. Registers with the enclosing presenter via
 * {@link CNGX_TAB_GROUP_HOST} on construction; deregisters via
 * {@link DestroyRef} on teardown. The presenter holds the atom's
 * input signals by reference, so input changes propagate without
 * re-registration. `labelTemplate` / `contentTemplate` are projected
 * by the organism — the atom carries no rendering logic.
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

  /** `true` when the presenter's `activeId` equals this tab's id. */
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
