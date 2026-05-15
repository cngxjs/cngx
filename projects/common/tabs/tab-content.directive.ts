import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Structural slot directive marking the per-tab panel-body template.
 * Discovered by `<cngx-tab-group>` via `contentChild` on each
 * `CngxTab` and projected into the matching `role="tabpanel"`.
 *
 * ```html
 * <div cngxTab id="settings">
 *   <ng-template cngxTabLabel>Settings</ng-template>
 *   <ng-template cngxTabContent>
 *     <p>Settings panel body…</p>
 *   </ng-template>
 * </div>
 * ```
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
  selector: 'ng-template[cngxTabContent]',
  exportAs: 'cngxTabContent',
  standalone: true,
})
export class CngxTabContent {
  readonly templateRef = inject(TemplateRef<unknown>);
}
