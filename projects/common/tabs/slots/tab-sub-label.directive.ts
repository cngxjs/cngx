import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Structural slot directive marking a tab's secondary label template.
 * Discovered by `<cngx-tab-group>` via `contentChild` on each
 * `CngxTab` and rendered as a stacked second line under the primary
 * label. Per-tab content, mirroring `CngxTabLabel` - the convenience
 * `[subLabel]` string input on `CngxTab` covers the plain-text case.
 *
 * ```html
 * <div cngxTab id="bookmarks">
 *   <ng-template cngxTabLabel>Bookmarks</ng-template>
 *   <ng-template cngxTabSubLabel>45 saved</ng-template>
 *   <ng-template cngxTabContent>...</ng-template>
 * </div>
 * ```
 *
 * @category common/tabs
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/slots/tab-sub-label.directive.ts
 * @since 0.1.0
 * @relatedTo CngxTab, CngxTabLabel, CngxTabContent
 * <example-url>http://localhost:4200/#/ui/tabs/tab-sub-label/label-with-count</example-url>
 */
@Directive({
  selector: 'ng-template[cngxTabSubLabel]',
  exportAs: 'cngxTabSubLabel',
  standalone: true,
})
export class CngxTabSubLabel {
  readonly templateRef = inject(TemplateRef<unknown>);
}
