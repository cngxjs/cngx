import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Structural slot directive marking the per-tab label template.
 * Discovered by `<cngx-tab-group>` via `contentChild` on each
 * `CngxTab` and projected into the tab strip.
 *
 * ```html
 * <div cngxTab id="settings">
 *   <ng-template cngxTabLabel>Settings</ng-template>
 *   <ng-template cngxTabContent>...</ng-template>
 * </div>
 * ```
 */
@Directive({
  selector: 'ng-template[cngxTabLabel]',
  exportAs: 'cngxTabLabel',
  standalone: true,
})
export class CngxTabLabel {
  readonly templateRef = inject(TemplateRef<unknown>);
}
