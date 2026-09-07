import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
} from '@angular/core';

import { CNGX_STEPPER_GLYPHS } from '@cngx/common/stepper';

/**
 * Shared aggregate error line for the stepper variants and the parent
 * organism's mobile-collapse branches. One source for the
 * `role="status"` glyph + text markup that was previously duplicated
 * per variant; each call site keeps its own BEM block via `[block]`
 * because the shipped CSS keys off the per-variant class names.
 *
 * Internal - not exported from the entry's public API; the visible
 * surface stays the per-variant class contract.
 *
 * @internal
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute selector by design (keeps the shipped <span> error-line DOM)
  selector: 'span[cngxStepperErrorLine]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <span [class]="block() + '-glyph'" aria-hidden="true">{{ glyph }}</span>
    <span [class]="block() + '-text'">{{ text() }}</span>
  `,
  host: {
    role: 'status',
    'data-state': 'error',
    '[class]': 'block()',
  },
})
export class CngxStepperErrorLine {
  /** BEM block class of the owning variant, e.g. `cngx-dot-stepper__error`. */
  readonly block = input.required<string>();

  /** Resolved aggregate error phrase (see `resolveStepperErrorSummary`). */
  readonly text = input.required<string>();

  protected readonly glyph = CNGX_STEPPER_GLYPHS.errorBadge;
}
