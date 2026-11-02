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
 */
export type CngxButtonGroupOrientation = 'horizontal' | 'vertical';

/**
 * Joins buttons, icon buttons, addons and separators into one framed,
 * labelled row (or column). Every direct child is a segment: the seams
 * collapse to one border, only the two outer ends keep their radius, and a
 * hovered or focused segment is lifted above its neighbours so its border
 * and focus ring are never clipped at a seam. A group whose direct children
 * are groups is a toolbar: the sub-groups sit apart, the gap floored to
 * `--cngx-target-gap` on a coarse pointer. One group child is enough to make
 * the whole group a toolbar, so a loose button next to sub-groups gets no
 * segment geometry; wrap it in a group of its own.
 *
 * `variant` and `size` set once on the group reach every `cngxButton` and
 * `cngxIconButton` inside through `CNGX_BUTTON_GROUP`; a child's own input
 * still wins (`input ?? group ?? config ?? default`). A nested group without
 * its own value inherits the outer group's. `tone` is not passed: intent is
 * per button.
 *
 * The host is `role="group"` and needs a name: set `aria-label` or
 * `aria-labelledby`. A group without either warns `CNGX1072` in development
 * mode. Selection (pressed state) is not this group's job; use
 * `CngxButtonToggleGroup` for that.
 *
 * The segment geometry ships in the global `cngx.css` bundle
 * (`cngx-button-group.css`), not on the directive.
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
 * @relatedTo CngxButton, CngxIconButton, CngxButtonGroupAddon, CngxButtonGroupSeparator, CNGX_BUTTON_GROUP, CngxSplitButton, CngxIconMenuButton
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

  /** Emphasis handed to the buttons inside. Falls through to an outer group. */
  readonly variantInput = input<CngxButtonVariant | undefined>(undefined, { alias: 'variant' });

  /** Size handed to the buttons and addons inside. Falls through to an outer group. */
  readonly sizeInput = input<CngxButtonSize | undefined>(undefined, { alias: 'size' });

  /** Main axis. `vertical` stacks the segments; seams and radii follow. */
  readonly orientation = input<CngxButtonGroupOrientation>('horizontal');

  /** Resolved emphasis: this group's input, else the outer group's. */
  readonly variant = computed<CngxButtonVariant | undefined>(
    () => this.variantInput() ?? this.parent?.variant(),
  );

  /** Resolved size: this group's input, else the outer group's. */
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
