import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Display atom for icons. Projects its content (font glyph, SVG, image, custom
 * element) and adds size, colour, and ARIA semantics.
 *
 * Decorative by default (`aria-hidden="true"`); set `label` to make it
 * informative (`role="img"`, `aria-label`).
 * <example-url>http://localhost:4200/#/common/display/icon/decorative-vs-informative</example-url>
 * <example-url>http://localhost:4200/#/common/display/icon/sizes</example-url>
 * <example-url>http://localhost:4200/#/common/display/tag/app-wide-defaults-via-providetagconfig</example-url>
 * <example-url>http://localhost:4200/#/common/display/tag/color-palette</example-url>
 * <example-url>http://localhost:4200/#/common/display/tag/composition-with-cngxicon</example-url>
 * <example-url>http://localhost:4200/#/common/display/tag/density</example-url>
 * <example-url>http://localhost:4200/#/common/display/tag/group-semantic-list</example-url>
 * <example-url>http://localhost:4200/#/common/display/tag/group-with-header-accessory</example-url>
 * <example-url>http://localhost:4200/#/common/display/tag/layout-only-alignment</example-url>
 * <example-url>http://localhost:4200/#/common/display/tag/layout-only-gap-variants</example-url>
 * <example-url>http://localhost:4200/#/common/display/tag/link-mode</example-url>
 * <example-url>http://localhost:4200/#/common/display/tag/slot-overrides-custom-label</example-url>
 * <example-url>http://localhost:4200/#/common/display/tag/slot-overrides-prefix-label-suffix</example-url>
 * <example-url>http://localhost:4200/#/common/display/tag/truncate-maxwidth</example-url>
 * <example-url>http://localhost:4200/#/common/display/tag/variant-matrix</example-url>
 */
@Component({
  selector: 'cngx-icon, [cngxIcon]',
  exportAs: 'cngxIcon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  styleUrl: './icon.component.scss',
  host: {
    class: 'cngx-icon',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() ?? null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
    '[class.cngx-icon--xs]': 'size() === "xs"',
    '[class.cngx-icon--sm]': 'size() === "sm"',
    '[class.cngx-icon--md]': 'size() === "md"',
    '[class.cngx-icon--lg]': 'size() === "lg"',
    '[class.cngx-icon--xl]': 'size() === "xl"',
  },
})
export class CngxIcon {
  /** Accessible label. When set, the icon is treated as informative content. */
  readonly label = input<string | undefined>(undefined);

  /** Size preset. Maps to CSS custom properties on the host. */
  readonly size = input<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');
}
