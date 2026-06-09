import {
  computed,
  DestroyRef,
  Directive,
  inject,
  input,
  type OnInit,
  type Signal,
  signal,
} from '@angular/core';
import { MatTabLink } from '@angular/material/tabs';

import { CNGX_TAB_GROUP_HOST, type CngxTabGroupHost, type CngxTabHandle } from '@cngx/common/tabs';
import { nextUid } from '@cngx/core/utils';
import type { CngxErrorAggregatorContract } from '@cngx/common/interactive';

/**
 * Registers an `<a mat-tab-link>` anchor as a {@link CngxTabHandle}
 * with the enclosing {@link CngxMatTabNav} presenter. `mat-tab-nav-bar`
 * has no `MatTab` to hang a handle on (the links are the tabs), so this
 * per-link directive is the registration seam - symmetric with how
 * `CngxTab` registers in the cngx-native path and how
 * {@link CngxMatTabsRegistry} registers each `<mat-tab>`.
 *
 * Registration order follows DOM order (Angular instantiates content
 * directives top-to-bottom), so the presenter's `tabs()` index aligns
 * with `nav.querySelectorAll('.mat-mdc-tab-link')` - the index the
 * decoration projectors correlate against.
 *
 * Gating is native: the link's `routerLink` runs `CanDeactivate`
 * directly, so this directive installs no commit-action. The active
 * index follows the route through `[cngxTabsRouteSync]` on the nav,
 * which matches each handle's `id` (set to the route segment) against
 * the URL.
 *
 * @category ui/mat-tabs
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/mat-tabs/mat-tab-link.directive.ts
 * @since 0.1.0
 * @relatedTo CngxMatTabNav, CngxMatTabs, CngxTab
 */
@Directive({
  selector: '[cngxMatTabLink]',
  exportAs: 'cngxMatTabLink',
  standalone: true,
})
export class CngxMatTabLink implements OnInit {
  private readonly matLink = inject(MatTabLink, { self: true });
  private readonly host = inject<CngxTabGroupHost>(CNGX_TAB_GROUP_HOST);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Handle id. Set it to the link's route segment so the nav's
   * `[cngxTabsRouteSync]` reflects the active route onto this tab via
   * the default `(h) => [h.id]` mapping. Defaults to a fresh uid when
   * route-sync is not used.
   */
  readonly id = input<string>(nextUid('cngx-mat-tab-link-'));
  /** Accessible label fed to the live-region announcer. */
  readonly label = input<string | undefined>(undefined);
  /**
   * Direct error flag for the link - `true` or a non-empty string marks
   * it invalid (the string doubles as the message). Mirrors
   * `CngxTab.error` and `[cngxMatTabErrorFlag]`.
   */
  readonly error = input<string | boolean>(false);
  /** Optional rich error aggregator for the link. */
  readonly errorAggregator = input<CngxErrorAggregatorContract | undefined>(undefined);

  /** Whether Material currently marks this link active (route-active). */
  get active(): boolean {
    return this.matLink.active;
  }

  private readonly errorMessage: Signal<string | undefined> = computed(() => {
    const value = this.error();
    return typeof value === 'string' && value !== '' ? value : undefined;
  });

  private readonly hasError: Signal<boolean> = computed(
    () => {
      const direct = this.error();
      return (
        (direct !== false && direct !== '') ||
        (this.errorAggregator()?.shouldShow?.() ?? false)
      );
    },
    { equal: Object.is },
  );

  // Material's MatTabLink.disabled is a plain property, not a signal;
  // nav links rarely toggle disabled at runtime, so snapshot it onto a
  // signal at registration. A live binding would need a Material
  // reactive surface MatTabLink does not expose.
  private readonly disabledState = signal<boolean>(false);

  ngOnInit(): void {
    this.disabledState.set(this.matLink.disabled);
    const handle: CngxTabHandle = {
      id: this.id(),
      label: this.label,
      subLabel: signal(undefined),
      disabled: this.disabledState.asReadonly(),
      errorAggregator: this.errorAggregator,
      hasError: this.hasError,
      errorMessage: this.errorMessage,
      closable: signal(undefined),
    };
    this.host.register(handle);
    this.destroyRef.onDestroy(() => this.host.unregister(handle.id));
  }
}
