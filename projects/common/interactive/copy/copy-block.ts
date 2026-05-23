import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

import { CngxCopyText } from './copy-text.directive';

/**
 * Molecule: code/text block with a built-in copy button.
 *
 * Renders content in a container with a "Copy" button that uses `CngxCopyText`
 * internally. Shows "Copied!" feedback automatically. The copy button includes
 * an `aria-live` region for screen reader announcements.
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
 * <example-url>http://localhost:4200/#/common/interactive/copy/block/api-key</example-url>
 * <example-url>http://localhost:4200/#/common/interactive/copy/block/code-snippet</example-url>
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
  styleUrls: ['./copy-block.css'],
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
