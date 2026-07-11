import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

/**
 * A single metadata pair - a short bold `term` followed by its projected value -
 * for the supplementary key/value lines that sit inside detail zones, cards, and
 * popovers (e.g. `trace 9f31c0d4`). Compose several inside a {@link CngxMetaList}.
 *
 * This is the lightweight, presentational option: the term is a plain string
 * input and the pair reads linearly to a screen reader (`term value`). When you
 * need real term/description semantics for a longer or more structured block,
 * reach for a definition list instead - `CngxMeta` deliberately stays flat.
 *
 * @category common/display
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/display/meta/meta.component.ts
 * @since 0.1.0
 * @relatedTo CngxMetaList
 * <example-url>http://localhost:4200/#/common/display/meta/metadata-line</example-url>
 */
@Component({
  selector: 'cngx-meta',
  exportAs: 'cngxMeta',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `@if (term(); as t) {
      <span class="cngx-meta__term">{{ t }}</span>
    }<span class="cngx-meta__value"><ng-content /></span>`,
  styleUrl: './meta.css',
  host: {
    class: 'cngx-meta',
  },
})
export class CngxMeta {
  /** The metadata key. Rendered bold before the value; omit for a value-only item. */
  readonly term = input<string>();
}
