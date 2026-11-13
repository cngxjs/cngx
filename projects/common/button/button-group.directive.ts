import {
  afterNextRender,
  computed,
  Directive,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { cngxDevWarn } from '@cngx/utils';

import { CNGX_BUTTON_GROUP, type CngxButtonGroupContext } from './button-group.token';
import type { CngxButtonSize, CngxButtonVariant } from './button.types';

/**
 * Main axis of a `cngxButtonGroup`.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-group.directive.ts
 * @since 0.1.0
 * @relatedTo CngxButtonGroup
 */
export type CngxButtonGroupOrientation = 'horizontal' | 'vertical';

/**
 * Joins buttons, icon buttons, addons and separators into one framed `role="group"` row or
 * column. Seams collapse to one border; a hovered or focused segment is lifted so its ring is
 * never clipped. `variant` and `size` reach every button inside; `tone` is per button.
 *
 * A group with a group child is a toolbar: the sub-groups sit apart, the gap floored to
 * `--cngx-target-gap` on a coarse pointer. Wrap a loose button next to sub-groups in its own
 * group.
 *
 * Needs `aria-label` or `aria-labelledby`, else warns [`CNGX1072`](/error-codes/cngx1072.md).
 * The geometry ships in the global `cngx.css` bundle, not on the directive.
 *
 * ```html
 * <div cngxButtonGroup variant="outline" aria-label="History">
 *   <button cngxButton>Undo</button>
 *   <button cngxButton>Redo</button>
 * </div>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-group.directive.ts
 * @since 0.1.0
 * @relatedTo CngxButton, CngxIconButton, CngxButtonGroupAddon, CngxButtonGroupSeparator, CNGX_BUTTON_GROUP, CngxSplitButton, CngxIconMenuButton, CngxButtonToggleGroup
 * <example-url>/#/common/button/group/basic</example-url>
 * <example-url>/#/common/button/group/vertical</example-url>
 * <example-url>/#/common/button/group/with-addon</example-url>
 * <example-url>/#/common/button/group/icon-toolbar</example-url>
 * <example-url>/#/common/menu-button/split-button/basic</example-url>
 * @axis level molecule
 */
@Directive({
  selector: '[cngxButtonGroup]',
  standalone: true,
  exportAs: 'cngxButtonGroup',
  providers: [{ provide: CNGX_BUTTON_GROUP, useExisting: CngxButtonGroup }],
  host: {
    class: 'cngx-button-group',
    role: 'group',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-size]': 'size() ?? null',
  },
})
export class CngxButtonGroup implements CngxButtonGroupContext {
  private readonly parent = inject(CNGX_BUTTON_GROUP, { optional: true, skipSelf: true });

  /** Emphasis for the buttons inside. Falls through to an outer group. */
  readonly variantInput = input<CngxButtonVariant | undefined>(undefined, { alias: 'variant' });

  /** Size for the buttons and addons inside. Falls through to an outer group. */
  readonly sizeInput = input<CngxButtonSize | undefined>(undefined, { alias: 'size' });

  /** `vertical` stacks the segments. */
  readonly orientation = input<CngxButtonGroupOrientation>('horizontal');

  /** This group's input, else the outer group's. */
  readonly variant = computed<CngxButtonVariant | undefined>(
    () => this.variantInput() ?? this.parent?.variant(),
  );

  /** This group's input, else the outer group's. */
  readonly size = computed<CngxButtonSize | undefined>(
    () => this.sizeInput() ?? this.parent?.size(),
  );

  constructor() {
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
      afterNextRender(() => {
        const named = ['aria-label', 'aria-labelledby'].some(
          (attr) => (host.getAttribute(attr) ?? '').trim() !== '',
        );
        if (named) {
          return;
        }
        cngxDevWarn(
          'CNGX1072',
          '[cngxButtonGroup] has no accessible name. Set aria-label or aria-labelledby on the host; a role="group" without a name gives assistive technology no context for the buttons inside.',
          host,
        );
      });
    }
  }
}
