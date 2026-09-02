import { Directive, input } from '@angular/core';

import type { CngxCommandPalette } from './command-palette.component';

/**
 * Optional explicit trigger for a {@link CngxCommandPalette}. Opens the palette
 * on click and advertises the popup relationship to assistive tech:
 * `aria-haspopup="dialog"` plus `aria-expanded` derived from the palette's
 * `isOpen()` host seam, so the trigger communicates the open state without any
 * synced local flag. Pass the palette by template reference - orthogonal
 * composition, no ancestor injection.
 *
 * ```html
 * <button [cngxCommandPaletteTrigger]="palette">
 *   Search <kbd>Cmd K</kbd>
 * </button>
 * <cngx-command-palette #palette />
 * ```
 *
 * @category ui/command-palette
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/command-palette/palette/command-palette-trigger.directive.ts
 * @since 0.1.0
 * @relatedTo CngxCommandPalette
 */
@Directive({
  selector: '[cngxCommandPaletteTrigger]',
  exportAs: 'cngxCommandPaletteTrigger',
  standalone: true,
  host: {
    '[attr.aria-haspopup]': '"dialog"',
    '[attr.aria-expanded]': 'palette().isOpen()',
    '(click)': 'open()',
  },
})
export class CngxCommandPaletteTrigger {
  /** The palette this trigger opens. */
  readonly palette = input.required<CngxCommandPalette>({ alias: 'cngxCommandPaletteTrigger' });

  protected open(): void {
    this.palette().open();
  }
}
