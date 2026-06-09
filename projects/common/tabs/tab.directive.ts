import {
  computed,
  contentChild,
  DestroyRef,
  Directive,
  inject,
  input,
  type OnInit,
  type Signal,
} from '@angular/core';

import { nextUid } from '@cngx/core/utils';

import type { CngxErrorAggregatorContract } from '@cngx/common/interactive';

import { CngxTabContent } from './tab-content.directive';
import { CngxTabLabel } from './tab-label.directive';
import { CngxTabSubLabel } from './slots/tab-sub-label.directive';
import { CNGX_TAB_GROUP_HOST } from './tab-group-host.token';

/**
 * Single-tab atom. Registers with the enclosing presenter via
 * {@link CNGX_TAB_GROUP_HOST} on construction; deregisters via
 * {@link DestroyRef} on teardown. The presenter holds the atom's
 * input signals by reference, so input changes propagate without
 * re-registration. `labelTemplate` / `contentTemplate` are projected
 * by the organism - the atom carries no rendering logic.
 *
 * @category common/tabs
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/tab.directive.ts
 * @since 0.1.0
 * @relatedTo CngxTabGroupPresenter, CngxTabLabel, CngxTabContent, CngxTabErrorBadge
 * <example-url>http://localhost:4200/#/ui/tabs/tab-commit-action/optimistic-pessimistic-commits-with-bridge-directives</example-url>
 * <example-url>http://localhost:4200/#/ui/tabs/tab-error-aggregation/per-tab-error-badges</example-url>
 * <example-url>http://localhost:4200/#/ui/tabs/tab-group-vertical/vertical-sidebar-tabs</example-url>
 * <example-url>http://localhost:4200/#/ui/tabs/tab-group/three-tab-navigation</example-url>
 * <example-url>http://localhost:4200/#/ui/tabs/tab-overflow/8-tabs-in-a-narrow-container</example-url>
 * <example-url>http://localhost:4200/#/ui/tabs/tab-slot-overrides/custom-busy-spinner-via-code-cngxtabbusyspinner-code</example-url>
 * <example-url>http://localhost:4200/#/ui/tabs/tab-slot-overrides/custom-error-badge-via-code-cngxtaberrorbadge-code</example-url>
 * <example-url>http://localhost:4200/#/ui/tabs/tab-slot-overrides/rejection-decoration-via-code-cngxtabrejectionicon-code</example-url>
 */
@Directive({
  selector: '[cngxTab]',
  exportAs: 'cngxTab',
  standalone: true,
})
export class CngxTab implements OnInit {
  readonly id = input<string>(nextUid('cngx-tab-'));
  readonly disabled = input<boolean>(false);
  readonly label = input<string | undefined>(undefined);
  /**
   * Optional secondary text line under the primary label (a count, a
   * status word, a short detail). Convenience for the common text
   * case, parallel to `[label]`; the `*cngxTabSubLabel` slot covers
   * richer content. Folds into the tab's accessible name.
   */
  readonly subLabel = input<string | undefined>(undefined);
  readonly errorAggregator = input<CngxErrorAggregatorContract | undefined>(undefined);

  /**
   * Direct error flag for the common "this tab is invalid" case - no
   * `errorAggregator` boilerplate required. `true` or a non-empty string
   * drives the error state; a string doubles as the inline message
   * (surfaced via the `*cngxTabErrorBadge` slot context). `false` / `''`
   * clear it. The aggregator stays the rich multi-source forms path; the
   * two channels compose (either errors). Mirrors `CngxStep.error`.
   */
  readonly error = input<string | boolean>(false);

  /**
   * Resolved direct-error message: the `[error]` string when non-empty,
   * else `undefined`. Carried onto the registration handle so the error
   * badge slot can render it. `computed` over the input - never written.
   */
  readonly errorMessage: Signal<string | undefined> = computed(() => {
    const value = this.error();
    return typeof value === 'string' && value !== '' ? value : undefined;
  });

  /**
   * Per-tab error fold - the tab-equivalent of the step's `state ===
   * 'error'` arm. `true` when the direct `[error]` flag is set OR the
   * optional aggregator reports errors. A boolean, not a status enum:
   * tabs carry no success/completed/disabled model (Pillar 3).
   */
  readonly hasError: Signal<boolean> = computed(
    () => {
      const directError = this.error();
      return (
        (directError !== false && directError !== '') ||
        (this.errorAggregator()?.hasError?.() ?? false)
      );
    },
    { equal: Object.is },
  );

  /**
   * Per-tab close-affordance override. `undefined` (default) inherits
   * the group-level `[closable]` resolution; set `false` to pin this
   * tab open inside a dismissable group, or `true` to make a single tab
   * closable while the group default is off.
   */
  readonly closable = input<boolean | undefined>(undefined);

  readonly labelTemplate = contentChild(CngxTabLabel);
  readonly subLabelTemplate = contentChild(CngxTabSubLabel);
  readonly contentTemplate = contentChild(CngxTabContent);

  private readonly host = inject(CNGX_TAB_GROUP_HOST, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  /** `true` when the presenter's `activeId` equals this tab's id. */
  readonly selected: Signal<boolean> = computed(() => this.host?.activeId() === this.id(), {
    equal: Object.is,
  });

  constructor() {
    if (!this.host) {
      throw new Error(
        'CngxTab: no enclosing CngxTabGroupPresenter found. Wrap the tab inside an element carrying [cngxTabGroup] (or place it inside <cngx-tab-group>).',
      );
    }
  }

  ngOnInit(): void {
    // Register in ngOnInit, NOT the constructor: a dynamically-bound
    // `[id]` (or `[label]`) signal input is not applied until the first
    // change detection, so a constructor read would capture the default
    // auto-id. The handle id is the stable key consumers map `(tabClose)`
    // back to their data with, so it must reflect the bound `[id]`.
    const host = this.host!;
    const tabId = this.id();
    host.register({
      id: tabId,
      label: this.label,
      subLabel: this.subLabel,
      disabled: this.disabled,
      errorAggregator: this.errorAggregator,
      closable: this.closable,
    });
    this.destroyRef.onDestroy(() => host.unregister(tabId));
  }
}
