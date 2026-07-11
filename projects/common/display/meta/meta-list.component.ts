import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * An inline, wrapping metadata line - a flex row of projected {@link CngxMeta}
 * pairs separated by a consistent gap. It carries the shared muted colour + gap
 * so a detail zone reads `trace 9f31c0d4   tenant north   pod auth-7d9f4` without
 * the consumer hand-rolling `display:flex` + `<b>` markup for every row.
 *
 * Presentational by design (see {@link CngxMeta}): it is not a semantic list.
 * Tune the spacing / colour through the `--cngx-meta-list-*` custom properties.
 *
 * @category common/display
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/display/meta/meta-list.component.ts
 * @since 0.1.0
 * @relatedTo CngxMeta
 * <example-url>http://localhost:4200/#/common/display/meta/metadata-line</example-url>
 */
@Component({
  selector: 'cngx-meta-list',
  exportAs: 'cngxMetaList',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: '<ng-content />',
  styleUrl: './meta-list.css',
  host: {
    class: 'cngx-meta-list',
  },
})
export class CngxMetaList {}
