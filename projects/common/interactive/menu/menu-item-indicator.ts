import {
  afterRenderEffect,
  ElementRef,
  inject,
  InjectionToken,
  Renderer2,
  type Signal,
} from '@angular/core';

import { createIconSvgElement } from '@cngx/common/display';
import type { CngxIconData } from '@cngx/utils';

/** Class of the leading checked indicator the base menu skin sizes and paints. */
const INDICATOR_CLASS = 'cngx-menu-item__indicator';

/** Class of the `<svg>` inside the indicator, built from the shared icon data. */
const ICON_SVG_CLASS = 'cngx-menu-item__indicator-svg';

/**
 * Opt-out for the base checked indicator of `CngxMenuItemCheckbox` and
 * `CngxMenuItemRadio`. A component that applies either item through
 * `hostDirectives` and renders its own checked cue provides `true` here,
 * so the base indicator does not double up. Read from the item's own
 * element only.
 *
 * ```ts
 * providers: [{ provide: CNGX_MENU_ITEM_OWN_INDICATOR, useValue: true }]
 * ```
 *
 * @category interactive
 */
export const CNGX_MENU_ITEM_OWN_INDICATOR = new InjectionToken<boolean>(
  'CNGX_MENU_ITEM_OWN_INDICATOR',
);

/**
 * Leading checked indicator of a checkbox or radio menu item in the base
 * skin: an `aria-hidden` `<span><svg><path>` inserted as the item's first
 * child while `checked()` holds, removed when it clears. The items are
 * consumer-templated, so the indicator is built on the host instead of
 * rendered from a template; `cngx-menu.css` sizes it by its classes, and
 * hides it while the item projects a `cngxMenuItemIcon`. `aria-checked`
 * carries the state, the indicator never joins the name.
 *
 * Skipped when the host provides {@link CNGX_MENU_ITEM_OWN_INDICATOR}. Runs
 * after render, so it never touches server-rendered DOM before hydration.
 *
 * Call from an injection context.
 *
 * @internal
 */
export function injectMenuItemIndicator(checked: Signal<boolean>, icon: CngxIconData): void {
  if (inject(CNGX_MENU_ITEM_OWN_INDICATOR, { self: true, optional: true })) {
    return;
  }
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const renderer = inject(Renderer2);
  let indicator: HTMLElement | null = null;

  afterRenderEffect({
    write: () => {
      const isChecked = checked();
      if (!isChecked) {
        if (indicator) {
          renderer.removeChild(host, indicator);
          indicator = null;
        }
        return;
      }
      if (indicator) {
        return;
      }
      indicator = createIndicator(renderer, icon);
      renderer.insertBefore(host, indicator, host.firstChild);
    },
  });
}

function createIndicator(renderer: Renderer2, icon: CngxIconData): HTMLElement {
  const span = renderer.createElement('span') as HTMLElement;
  renderer.addClass(span, INDICATOR_CLASS);
  renderer.setAttribute(span, 'aria-hidden', 'true');
  renderer.appendChild(span, createIconSvgElement(renderer, icon, ICON_SVG_CLASS).element);
  return span;
}
