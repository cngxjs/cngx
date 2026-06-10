import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxTabHandle } from '../tab-group-host.token';

/**
 * Context for the `*cngxTabCloseIcon` template. Rendered inside each
 * closable tab's close button (the button itself owns the
 * `aria-label`); the template paints only the glyph, so it carries the
 * tab handle in case the visual varies per tab.
 *
 * @category common/tabs/slots
 */
export interface CngxTabCloseIconContext {
  /** The tab handle whose close button this icon paints. */
  readonly tab: CngxTabHandle;
}

/**
 * Structural slot for a tab's close-button glyph. 3-stage cascade:
 * per-instance directive > `CNGX_TABS_CONFIG.templates.closeIcon` >
 * `CNGX_TABS_GLYPHS.closeIcon`.
 *
 * ```html
 * <cngx-tab-group closable (tabClose)="remove($event.id)">
 *   <ng-template cngxTabCloseIcon><cngx-icon name="close" /></ng-template>
 *   ...
 * </cngx-tab-group>
 * ```
 *
 * @category common/tabs/slots
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/slots/tab-close-icon.directive.ts
 * @since 0.1.0
 * @relatedTo CngxTabAddIcon, CngxTabGroup
 */
@Directive({
  selector: 'ng-template[cngxTabCloseIcon]',
  exportAs: 'cngxTabCloseIcon',
  standalone: true,
})
export class CngxTabCloseIcon {
  readonly templateRef = inject<TemplateRef<CngxTabCloseIconContext>>(TemplateRef);
}
