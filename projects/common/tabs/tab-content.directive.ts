import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Structural slot directive marking the per-tab panel-body template. \
 * Discovered by `<cngx-tab-group>` via `contentChild` on each
 * `CngxTab` and projected into the matching `role="tabpanel"`.
 *
 * ```html
 * <div cngxTab [label]="'Settings'">
 *   <ng-template cngxTabContent>
 *     <p>Settings panel body…</p>
 *   </ng-template>
 * </div>
 * ```
 *
 * @category common/tabs
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/tab-content.directive.ts
 * @since 0.1.0
 * @relatedTo CngxTab, CngxTabLabel
 */
@Directive({
  selector: 'ng-template[cngxTabContent]',
  exportAs: 'cngxTabContent',
  standalone: true,
})
export class CngxTabContent {
  readonly templateRef = inject(TemplateRef<unknown>);
}
