import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

import { CngxCopyText } from './copy-text.directive';

/**
 * Molecule: code/text block with a built-in copy button.
 *
 * Renders content in a container with a "Copy" button that uses `CngxCopyText`
 * internally. Shows "Copied!" feedback automatically. The copy button includes
 * an `aria-live` region for screen reader announcements.
 *
 * @usageNotes
 *
 * ### Copy a code snippet
 * ```html
 * <cngx-copy-block [value]="'npm install @cngx/common'">
 *   <code>npm install &#64;cngx/common</code>
 * </cngx-copy-block>
 * ```
 *
 * ### Copy an API key
 * ```html
 * <cngx-copy-block [value]="apiKey()" buttonLabel="Copy Key">
 *   {{ apiKey() }}
 * </cngx-copy-block>
 * ```
 *
 * @category interactive
 */
@Component({
  selector: 'cngx-copy-block',
  exportAs: 'cngxCopyBlock',
  standalone: true,
  imports: [CngxCopyText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'cngx-copy-block',
    '[class.cngx-copy-block--copied]': 'false',
  },
  template: `
    <div class="cngx-copy-block__content">
      <ng-content />
    </div>
    <button
      type="button"
      class="cngx-copy-block__button"
      [cngxCopyText]="value()"
      #cp="cngxCopyText"
      [class.cngx-copy-block__button--copied]="cp.copied()"
    >
      {{ cp.copied() ? copiedLabel() : buttonLabel() }}
      <span aria-live="polite" class="cngx-sr-only">
        {{ cp.copied() ? srAnnouncement() : '' }}
      </span>
    </button>
  `,
  styles: `
    .cngx-copy-block {
      display: flex;
      align-items: flex-start;
      gap: var(--cngx-copy-block-gap, 8px);
    }
    .cngx-copy-block__content {
      flex: 1;
      min-width: 0;
      overflow: hidden;
    }
    .cngx-copy-block__button {
      flex-shrink: 0;
      cursor: pointer;
      border: 1px solid var(--cngx-copy-block-btn-border, currentColor);
      background: var(--cngx-copy-block-btn-bg, transparent);
      color: var(--cngx-copy-block-btn-color, inherit);
      border-radius: var(--cngx-copy-block-btn-radius, 4px);
      padding: var(--cngx-copy-block-btn-padding, 4px 8px);
      font-size: var(--cngx-copy-block-btn-font-size, 0.75rem);
      transition:
        background 0.15s,
        border-color 0.15s;
    }
    .cngx-copy-block__button--copied {
      background: var(--cngx-copy-block-btn-copied-bg, #e8f5e9);
      border-color: var(--cngx-copy-block-btn-copied-border, #2e7d32);
      color: var(--cngx-copy-block-btn-copied-color, #2e7d32);
    }
    .cngx-sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `,
})
export class CngxCopyBlock {
  /** The text value to copy to clipboard. */
  readonly value = input.required<string>();
  /** Label for the copy button. */
  readonly buttonLabel = input<string>('Copy');
  /** Label shown after successful copy. */
  readonly copiedLabel = input<string>('Copied!');
  /** Screen reader announcement on copy. */
  readonly srAnnouncement = input<string>('Copied to clipboard');
}
