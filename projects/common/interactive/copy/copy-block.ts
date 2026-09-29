import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

import { injectResolvedInteractiveI18n } from '../i18n/interactive-i18n';
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
 *
 * @category common/interactive
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/copy/copy-block.ts
 * @since 0.1.0
 * @relatedTo CngxCopyText
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
    </button>
    <!-- Outside the button: a child of a button lands in its accessible
         name, so the announcement text would rename the control. -->
    <span aria-live="polite" class="cngx-sr-only">
      {{ cp.copied() ? srAnnouncement() : '' }}
    </span>
  `,
  styleUrls: ['./copy-block.css'],
})
export class CngxCopyBlock {
  private readonly i18n = injectResolvedInteractiveI18n();

  /** The text value to copy to clipboard. */
  readonly value = input.required<string>();
  /** Label for the copy button. Defaults to `CNGX_INTERACTIVE_I18N.copy`, read at construction. */
  readonly buttonLabel = input<string>(this.i18n().copy);
  /** Label shown after successful copy. Defaults to `CNGX_INTERACTIVE_I18N.copied`, read at construction. */
  readonly copiedLabel = input<string>(this.i18n().copied);
  /**
   * Screen reader announcement on copy. Defaults to
   * `CNGX_INTERACTIVE_I18N.copiedAnnouncement`, read at construction.
   */
  readonly srAnnouncement = input<string>(this.i18n().copiedAnnouncement);
}
