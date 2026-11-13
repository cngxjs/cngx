import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';

import { CngxButtonBrain } from './button-brain.directive';
import { provideButtonHost } from './button-host.token';

/**
 * Square, icon-only button on the same brain as `CngxButton`. It takes the same axes, disabled
 * reason and busy layer. The variant defaults to `ghost`.
 *
 * Project an inline `svg`, an `img` or a `cngx-icon`. A bare `svg` or `img` is sized to `1.25em`
 * of the button font. Wrap a `mat-icon` in a `cngx-icon` so the Material icon bridge sizes it.
 *
 * The glyph is `aria-hidden`, so nothing projected ever becomes the name. Set `aria-label`,
 * `aria-labelledby` or `title` on the host. Without one the host warns
 * [`CNGX1071`](/error-codes/cngx1071.md) in development, once the app is stable, so a label bound
 * after the first render counts. Co-host `[cngxTooltip]` where the icon alone is ambiguous.
 *
 * The box follows `size` and stays square. On a coarse pointer it floors to `--cngx-target-min`
 * on both axes, and the icon keeps its design size.
 *
 * ```html
 * <button cngxIconButton aria-label="Delete row" tone="danger" (click)="remove()">
 *   <svg aria-hidden="true" viewBox="0 0 24 24">...</svg>
 * </button>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/icon-button.component.ts
 * @since 0.1.0
 * @relatedTo CngxButton, CngxButtonBrain, CngxAsyncClick, provideButtonConfig, CngxSplitButton, CngxIconMenuButton, CngxCloseButton
 * <example-url>/#/common/button/icon-button/basic</example-url>
 * <example-url>/#/common/button/icon-button/with-badge</example-url>
 * @axis level atom
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute selector by design (sits on the native button / anchor)
  selector: 'button[cngxIconButton], a[cngxIconButton]',
  standalone: true,
  exportAs: 'cngxIconButton',
  imports: [NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    {
      directive: CngxButtonBrain,
      inputs: [
        'variant: cngxIconButton',
        'tone',
        'size',
        'disabled',
        'disabledReason',
        'cngxDescribedBy',
        'type',
      ],
    },
  ],
  providers: [provideButtonHost('cngxIconButton', { defaultVariant: 'ghost', iconOnly: true })],
  host: { class: 'cngx-button cngx-icon-button' },
  template: `
    <span class="cngx-button__label cngx-icon-button__glyph" aria-hidden="true"
      ><ng-content
    /></span>
    @if (brain.busyVisible()) {
      <span class="cngx-button__busy" aria-hidden="true">
        @if (brain.spinner; as spinner) {
          <ng-container *ngComponentOutlet="spinner" />
        } @else {
          <span class="cngx-button__spinner"></span>
        }
      </span>
    }
    @if (brain.disabledReason(); as reason) {
      <span class="cngx-button__reason" [id]="brain.reasonId" hidden>{{ reason }}</span>
    }
  `,
  styleUrls: ['./button.component.css', './icon-button.component.css'],
})
export class CngxIconButton {
  /** @internal */
  protected readonly brain = inject(CngxButtonBrain);
}
