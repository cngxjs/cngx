import { computed, Directive, inject } from '@angular/core';

import { injectButtonConfig } from './button-config';
import { resolveButtonSize } from './button-core';
import { CNGX_BUTTON_GROUP } from './button-group.token';
import type { CngxButtonSize } from './button.types';

/**
 * A non-interactive segment in a `cngxButtonGroup` for an avatar, icon, count or short text. It
 * takes the row height of the buttons beside it and their padding and type tokens, so a theme
 * that re-sets them (the Material bridge) reaches it too. No role; its text is read in document
 * order.
 *
 * ```html
 * <div cngxButtonGroup variant="outline" aria-label="Assignee">
 *   <span cngxButtonGroupAddon><cngx-avatar name="Ada Lovelace" size="sm" /></span>
 *   <button cngxButton>Reassign</button>
 * </div>
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-group-addon.directive.ts
 * @since 0.1.0
 * @relatedTo CngxButtonGroup, CngxButtonGroupSeparator, CngxButton
 * <example-url>/#/common/button/group/with-addon</example-url>
 */
@Directive({
  selector: '[cngxButtonGroupAddon]',
  standalone: true,
  host: {
    class: 'cngx-button-group__addon',
    '[attr.data-size]': 'size()',
  },
})
export class CngxButtonGroupAddon {
  private readonly group = inject(CNGX_BUTTON_GROUP, { optional: true });
  private readonly config = injectButtonConfig();

  /** Resolved row size. */
  protected readonly size = computed<CngxButtonSize>(
    () => resolveButtonSize(undefined, this.group, this.config),
  );
}
