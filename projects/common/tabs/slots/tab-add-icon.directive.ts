import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Structural slot for the add-tab button glyph. 3-stage cascade:
 * per-instance directive > `CNGX_TABS_CONFIG.templates.addIcon` >
 * `CNGX_TABS_GLYPHS.addIcon`. The button owns its `aria-label`; the
 * template paints only the glyph, so its context is `void`.
 *
 * ```html
 * <cngx-tab-group addable (tabAdd)="add()">
 *   <ng-template cngxTabAddIcon><cngx-icon name="plus" /></ng-template>
 *   ...
 * </cngx-tab-group>
 * ```
 *
 * @category common/tabs/slots
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/slots/tab-add-icon.directive.ts
 * @since 0.1.0
 * @relatedTo CngxTabCloseIcon, CngxTabGroup
 */
@Directive({
  selector: 'ng-template[cngxTabAddIcon]',
  exportAs: 'cngxTabAddIcon',
  standalone: true,
})
export class CngxTabAddIcon {
  readonly templateRef = inject<TemplateRef<void>>(TemplateRef);
}
