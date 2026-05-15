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
 * @example-url http://localhost:4200/tab-error-aggregation/per-tab-error-badges
 * @example-url http://localhost:4200/tab-group-vertical/vertical-sidebar-tabs
 * @example-url http://localhost:4200/tab-group/three-tab-navigation
 * @example-url http://localhost:4200/tab-overflow/8-tabs-in-a-narrow-container
 */
@Directive({
  selector: 'ng-template[cngxTabContent]',
  exportAs: 'cngxTabContent',
  standalone: true,
})
export class CngxTabContent {
  readonly templateRef = inject(TemplateRef<unknown>);
}
