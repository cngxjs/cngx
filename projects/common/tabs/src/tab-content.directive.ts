import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Structural slot directive marking a per-tab panel-body template.
 * The Level-4 organism (`<cngx-tab-group>`) discovers panel content
 * via `contentChild(CngxTabContent)` on each `CngxTab` and renders
 * it inside the matching `role="tabpanel"` container.
 *
 * Usage:
 *
 * ```html
 * <div cngxTab id="settings">
 *   <ng-template cngxTabLabel>⚙ Settings</ng-template>
 *   <ng-template cngxTabContent>
 *     <p>Settings panel body…</p>
 *   </ng-template>
 * </div>
 * ```
 *
 * Pure marker — zero logic. The directive holds only a
 * {@link TemplateRef} reference for the consumer-provided template.
 *
 * @category interactive
 */
@Directive({
  selector: 'ng-template[cngxTabContent]',
  exportAs: 'cngxTabContent',
  standalone: true,
})
export class CngxTabContent {
  readonly templateRef = inject(TemplateRef<unknown>);
}
