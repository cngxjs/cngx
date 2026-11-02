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
 * An icon with a 12-grid `micro` drawing gets a second path,
 * `.cngx-icon-svg__micro`, scaled onto the shared 24 viewBox. It carries
 * `display="none"`, `fill="currentColor"` and `stroke="none"` as
 * presentation attributes, so without `cngx.css` the 24-grid path shows
 * alone. With `cngx.css` loaded, the `.cngx-icon-glyph` container rules
 * show the micro path instead of the 24-grid path in a 10 to 14px box.
 *
 * @internal
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute selector by design (sits on the native svg)
  selector: 'svg[cngxIconSvg]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <svg:path class="cngx-icon-svg__path" [attr.d]="icon().d" />
    @if (icon().micro; as micro) {
      <svg:path
        class="cngx-icon-svg__micro"
        transform="scale(2)"
        fill="currentColor"
        stroke="none"
        display="none"
        [attr.d]="micro.d"
      />
    }
  `,
  styleUrls: ['./icon-svg.component.css'],
  host: {
    class: 'cngx-icon-svg cngx-icon-glyph',
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
