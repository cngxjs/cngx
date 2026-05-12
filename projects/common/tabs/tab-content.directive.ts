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
 */
@Directive({
  selector: 'ng-template[cngxTabContent]',
  exportAs: 'cngxTabContent',
  standalone: true,
})
export class CngxTabContent {
  readonly templateRef = inject(TemplateRef<unknown>);
}
