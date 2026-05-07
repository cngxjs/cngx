import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Structural slot directive marking a per-tab label template. The
 * Level-4 organism (`<cngx-tab-group>`) discovers labels via
 * `contentChild(CngxTabLabel)` on each `CngxTab` and projects them
 * into the tab strip.
 *
 * Usage:
 *
 * ```html
 * <div cngxTab id="settings">
 *   <ng-template cngxTabLabel>⚙ Settings</ng-template>
 *   <ng-template cngxTabContent>...</ng-template>
 * </div>
 * ```
 *
 * Pure marker — zero logic. The directive holds only a
 * {@link TemplateRef} reference for the consumer-provided template.
 *
 * @category interactive
 */
@Directive({
  selector: 'ng-template[cngxTabLabel]',
  exportAs: 'cngxTabLabel',
  standalone: true,
})
export class CngxTabLabel {
  readonly templateRef = inject(TemplateRef<unknown>);
}
