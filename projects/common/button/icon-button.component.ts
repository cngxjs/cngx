import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';

import { CngxButtonBrain } from './button-brain.directive';
import { provideButtonHost } from './button-host.token';

/**
 * Square, icon-only button on the same brain as `CngxButton`: the same
 * variant / tone / size axes, `aria-disabled` with a `disabledReason`, the
 * activation guard, `type="button"` by default and the busy layer of a
 * co-hosted `cngxAsyncClick`. The variant defaults to `ghost` unless a group
 * or `provideButtonConfig` picks one.
 *
 * Any icon works in the slot: an inline `svg`, an `img`, a `cngx-icon`
 * (recommended, it sizes itself; wrap a `mat-icon` in one, the Material
 * icon bridge sizes it to the rung). A bare `svg` or `img` is sized to
 * `1.25em` of the button font. The glyph is hidden from assistive
 * technology, so nothing projected (alt text, a ligature name, a font
 * glyph) ever becomes the button's name; the name is
 * the consumer's job: set `aria-label` (or `aria-labelledby` / `title`) on
 * the host. A host without any of them warns [`CNGX1071`](/error-codes/cngx1071.md) in development mode,
 * once the app is stable, so a label bound after the first render counts. A tooltip is a separate,
 * per-icon decision; co-host `[cngxTooltip]` where the icon alone is
 * ambiguous. Its id joins the button's `aria-describedby` through
 * `CNGX_DESCRIBED_BY`, next to the static ids, the `[cngxDescribedBy]` ids
 * and the disabled reason.
 *
 * The visual box follows `size` and stays square; on a coarse pointer the
 * box floors to `--cngx-target-min` on both axes, so the box is the hit
 * area and the icon keeps its design size.
 *
 * ```html
 * <button cngxIconButton aria-label="Delete row" tone="danger" (click)="remove()">
 *   <cngx-icon name="delete" />
 * </button>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/icon-button.component.ts
 * @since 0.1.0
 * @relatedTo CngxButton, CngxButtonBrain, CngxAsyncClick, provideButtonConfig, CngxSplitButton, CngxIconMenuButton
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
