import {
  afterNextRender,
  computed,
  contentChildren,
  Directive,
  input,
  isDevMode,
  type Signal,
} from '@angular/core';

import { CNGX_OPTION_CONTAINER } from './option-container';
import { CngxOption } from './option.directive';

/**
 * Groups related `CngxOption`s under a visual and semantic header.
 *
 * Renders `role="group"` and `aria-label` — children stay flat in the AD item
 * list; grouping is purely presentational and for ATs that render group labels.
 *
 * Hierarchy-aware projection roots (e.g. `CngxSelectShell`) query
 * `CNGX_OPTION_CONTAINER` to walk the direct children in DOM order and read
 * each group's `options` to populate `CngxSelectOptionGroupDef.options`.
 * Nested option groups are unsupported — a dev-warning fires when one is
 * detected.
 *
 * @category interactive
 */
@Directive({
  selector: '[cngxOptionGroup]',
  exportAs: 'cngxOptionGroup',
  standalone: true,
  providers: [{ provide: CNGX_OPTION_CONTAINER, useExisting: CngxOptionGroup }],
  host: {
    role: 'group',
    '[attr.aria-label]': 'label()',
  },
})
export class CngxOptionGroup {
  /** Discriminator for `CNGX_OPTION_CONTAINER` consumers. */
  readonly kind = 'group' as const;
  /** Accessible group label. */
  readonly label = input.required<string>();

  private readonly optionsQuery = contentChildren(CngxOption, { descendants: false });
  private readonly nestedGroupsQuery = contentChildren(CngxOptionGroup, { descendants: true });

  /**
   * Direct `CngxOption` children of this group, DOM-ordered. Reference-stable
   * across change-detection runs when the underlying option set is unchanged.
   */
  readonly options: Signal<readonly CngxOption[]> = computed(() => this.optionsQuery(), {
    equal: (a, b) => a.length === b.length && a.every((v, i) => v === b[i]),
  });

  constructor() {
    afterNextRender(() => {
      if (isDevMode() && this.nestedGroupsQuery().length > 0) {
        console.error(
          '[cngxOptionGroup] Nested option groups are unsupported. ' +
            'Use CngxTreeSelect for arbitrary tree shapes.',
        );
      }
    });
  }
}
