import { Directive } from '@angular/core';

/**
 * Divider between segments of a `cngxButtonGroup`, drawn as a border so it survives forced
 * colors, and follows the orientation. `aria-hidden="true"`: when the split carries meaning, use
 * two labelled groups.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-group-separator.directive.ts
 * @since 0.1.0
 * @relatedTo CngxButtonGroup, CngxButtonGroupAddon
 * <example-url>/#/common/button/group/basic</example-url>
 */
@Directive({
  selector: '[cngxButtonGroupSeparator]',
  standalone: true,
  host: { class: 'cngx-button-group__separator', 'aria-hidden': 'true' },
})
export class CngxButtonGroupSeparator {}
