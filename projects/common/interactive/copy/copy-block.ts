import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';

import { injectResolvedInteractiveI18n } from '../i18n/interactive-i18n';
import { CngxCopyText } from './copy-text.directive';

/**
 * Molecule: code/text block with a built-in copy button.
 *
 * Renders content in a container with a "Copy" button that uses `CngxCopyText`
 * internally. Shows "Copied!" after a copy and "Copy failed" (with the
 * `--failed` modifier) after a failed one; both return to the idle label after
 * the reset delay. One always-present polite `aria-live` region next to the
 * button announces either outcome. Every label and announcement follows
 * `CNGX_INTERACTIVE_I18N` unless its input is bound. The block forwards the
 * `CngxCopyText` contract: `didCopy`, `copyFailed` and `resetDelay` behave as
 * on the directive.
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
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/copy/copy-block.ts
 * @since 0.1.0
 * @relatedTo CngxCopyText
 * <example-url>/#/common/interactive/copy/block/api-key</example-url>
 * <example-url>/#/common/interactive/copy/block/code-snippet</example-url>
 * <example-url>/#/common/interactive/copy/block/failed-copy</example-url>
 * @axis level molecule
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
      [resetDelay]="resetDelay()"
      (didCopy)="didCopy.emit($event)"
      (copyFailed)="copyFailed.emit($event)"
      [class.cngx-copy-block__button--copied]="cp.copied()"
      [class.cngx-copy-block__button--failed]="cp.failed()"
    >
      {{ buttonText() }}
    </button>
    <!-- Outside the button: a child of a button lands in its accessible
         name, so the announcement text would rename the control. -->
    <span aria-live="polite" class="cngx-sr-only">
      {{ liveAnnouncement() }}
    </span>
  `,
  styleUrls: ['./copy-block.css'],
})
export class CngxCopyBlock {
  private readonly i18n = injectResolvedInteractiveI18n();

  /** The text value to copy to clipboard. */
  readonly value = input.required<string>();
  /** Label for the copy button. Unbound, it follows `CNGX_INTERACTIVE_I18N.copy`. */
  readonly buttonLabel = input<string | undefined>(undefined);
  /** Label shown after successful copy. Unbound, it follows `CNGX_INTERACTIVE_I18N.copied`. */
  readonly copiedLabel = input<string | undefined>(undefined);
  /**
   * Screen reader announcement on copy. Unbound, it follows
   * `CNGX_INTERACTIVE_I18N.copiedAnnouncement`.
   */
  readonly srAnnouncement = input<string | undefined>(undefined);
  /** Label shown after a failed copy. Unbound, it follows `CNGX_INTERACTIVE_I18N.copyFailed`. */
  readonly failedLabel = input<string | undefined>(undefined);
  /**
   * Screen reader announcement on a failed copy. Unbound, it follows
   * `CNGX_INTERACTIVE_I18N.copyFailedAnnouncement`.
   */
  readonly failedAnnouncement = input<string | undefined>(undefined);
  /**
   * Duration in ms the copied or failed label stays before the button returns
   * to its idle label. Forwarded to `CngxCopyText.resetDelay`.
   */
  readonly resetDelay = input<number>(2000);

  /** Emitted after a successful copy with the copied text. */
  readonly didCopy = output<string>();
  /**
   * Emitted when a copy attempt fails: with the rejection reason when the
   * Clipboard API rejects the write, with `undefined` when the
   * `execCommand('copy')` fallback reports `false`.
   */
  readonly copyFailed = output<unknown>();

  private readonly copyText = viewChild(CngxCopyText);

  protected readonly resolvedButtonLabel = computed(() => this.buttonLabel() ?? this.i18n().copy);
  protected readonly resolvedCopiedLabel = computed(
    () => this.copiedLabel() ?? this.i18n().copied,
  );
  protected readonly resolvedFailedLabel = computed(
    () => this.failedLabel() ?? this.i18n().copyFailed,
  );

  protected readonly buttonText = computed(() => {
    const copyText = this.copyText();
    if (copyText?.copied()) {
      return this.resolvedCopiedLabel();
    }
    if (copyText?.failed()) {
      return this.resolvedFailedLabel();
    }
    return this.resolvedButtonLabel();
  });

  /**
   * Live-region text. Only the copied and failed states are tracked: a
   * language switch never re-voices the region; the next copy speaks the new
   * language.
   */
  protected readonly liveAnnouncement = computed(() => {
    const copyText = this.copyText();
    if (copyText?.copied()) {
      return untracked(() => this.srAnnouncement() ?? this.i18n().copiedAnnouncement);
    }
    if (copyText?.failed()) {
      return untracked(() => this.failedAnnouncement() ?? this.i18n().copyFailedAnnouncement);
    }
    return '';
  });
}
