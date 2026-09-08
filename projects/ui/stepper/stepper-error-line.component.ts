import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
} from '@angular/core';

import { CNGX_STEPPER_GLYPHS } from '@cngx/common/stepper';

/**
 * Shared aggregate error line for the stepper variants and the parent
 * organism's mobile-collapse branches - the single source of the
 * `role="status"` glyph + text markup. Each call site keeps its own
 * BEM block via `[block]` because the shipped CSS keys off the
 * per-variant class names.
 *
 * Always mounted: a live region inserted together with its content is
 * not reliably announced, so call sites bind `[text]` (empty when no
 * error) instead of `@if`-gating the element. While empty the host is
 * clipped out of flow (no flex-gap slot, still in the accessibility
 * tree) and carries no `data-state`.
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
    @if (text()) {
      <span [class]="block() + '-glyph'" aria-hidden="true">{{ glyph }}</span>
      <span [class]="block() + '-text'">{{ text() }}</span>
    }
  `,
  styles: `
    [cngxStepperErrorLine]:not([data-state='error']) {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `,
  host: {
    role: 'status',
    '[attr.data-state]': "text() ? 'error' : null",
    '[class]': 'block()',
  },
})
export class CngxStepperErrorLine {
  /** BEM block class of the owning variant, e.g. `cngx-dot-stepper__error`. */
  readonly block = input.required<string>();

  /** Resolved aggregate error phrase; empty string keeps the region quiet. */
  readonly text = input.required<string>();

  protected readonly glyph = CNGX_STEPPER_GLYPHS.errorBadge;
}
