import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import type { CngxIconData } from '@cngx/utils';

/**
 * Draws one default cngx glyph from its `CngxIconData` onto the host
 * `<svg>`. Decorative only (`aria-hidden`, `focusable="false"`): the
 * meaning lives in the owning component's ARIA, never in the glyph.
 *
 * Sizes to `1em` and paints in `currentColor`, so it follows the text it
 * sits in. Works standalone in a glyph span or projected into
 * `<cngx-icon>`, which then owns the box. A stroke icon binds
 * `fill="none"` because `<cngx-icon>` fills every svg without a `fill`
 * attribute.
 *
 * @internal
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute selector by design (sits on the native svg)
  selector: 'svg[cngxIconSvg]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: '<svg:path [attr.d]="icon().d" />',
  styleUrls: ['./icon-svg.component.css'],
  host: {
    class: 'cngx-icon-svg',
    'aria-hidden': 'true',
    focusable: 'false',
    '[attr.viewBox]': 'icon().viewBox',
    '[attr.fill]': 'icon().paint === "stroke" ? "none" : null',
    '[class.cngx-icon-svg--stroke]': 'icon().paint === "stroke"',
  },
})
export class CngxIconSvg {
  /** Path data of the glyph to draw. */
  readonly icon = input.required<CngxIconData>({ alias: 'cngxIconSvg' });
}
