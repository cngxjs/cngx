import { computed, Directive, inject } from '@angular/core';

import { injectButtonConfig } from './button-config';
import { DEFAULT_SIZE } from './button-core';
import { CNGX_BUTTON_GROUP } from './button-group.token';
import type { CngxButtonSize } from './button.types';

/**
 * Gives content that is not a box of its own a segment inside a
 * `cngxButtonGroup`: an avatar, an icon, a count, a short status text. The
 * addon gets the group's border and the button row of the resolved size
 * (`group ?? provideButtonConfig ?? md`, the same chain a button inside the
 * group resolves), centres its content and reads the button's padding and
 * type tokens, so a theme that re-sets them (the Material bridge) reaches
 * the addon too. Content sized in `em` follows the row.
 *
 * The addon is not interactive and adds no role; its text is read in
 * document order between the buttons.
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
 * @relatedTo CngxButtonGroup, CngxButtonGroupSeparator
 * <example-url>http://localhost:4200/#/common/button/group/with-addon</example-url>
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

  /** Resolved row size: the group's, else the button config's, else `md`. */
  protected readonly size = computed<CngxButtonSize>(
    () => this.group?.size() ?? this.config.size ?? DEFAULT_SIZE,
  );
}
