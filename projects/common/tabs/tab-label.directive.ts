import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Structural slot directive marking the per-tab label template. \
 * Discovered by `<cngx-tab-group>` via `contentChild` on each
 * `CngxTab` and projected into the tab strip.
 *
 * ```html
 * <div cngxTab id="settings">
 *   <ng-template cngxTabLabel>Settings</ng-template>
 *   ... tab content ...
 * </div>
 * ```
 *
 * @category common/tabs
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/tab-label.directive.ts
 * @since 0.1.0
 * @relatedTo CngxTab, CngxTabContent
 */
@Directive({
  selector: 'ng-template[cngxTabLabel]',
  exportAs: 'cngxTabLabel',
  standalone: true,
})
export class CngxTabLabel {
  readonly templateRef = inject(TemplateRef<unknown>);
}
