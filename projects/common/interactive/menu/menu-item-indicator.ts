import { effect, ElementRef, inject, Renderer2, type Signal } from '@angular/core';

import type { CngxIconData } from '@cngx/utils';

/** Class of the leading checked indicator the base menu skin sizes and paints. */
const INDICATOR_CLASS = 'cngx-menu-item__indicator';

/** Class of the `<svg>` inside the indicator, built from the shared icon data. */
const ICON_SVG_CLASS = 'cngx-menu-item__indicator-svg';

/**
 * Leading checked indicator of a checkbox or radio menu item in the base
 * skin: an `aria-hidden` `<span><svg><path>` inserted as the item's first
 * child while `checked()` holds, removed when it clears. The items are
 * consumer-templated, so the indicator is built on the host instead of
 * rendered from a template; `cngx-menu.css` sizes and paints it by its
 * classes, and hides it while the item projects a `cngxMenuItemIcon`.
 * `aria-checked` carries the state, the indicator never joins the name.
 *
 * Skips a host that does not carry `attribute` itself: an organism that
 * applies the item through `hostDirectives` renders its own indicator, so
 * the base one would double up.
 *
 * Call from an injection context.
 *
 * @internal
 */
export function injectMenuItemIndicator(
  checked: Signal<boolean>,
  icon: CngxIconData,
  attribute: string,
): void {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  if (!host.hasAttribute(attribute)) {
    return;
  }
  const renderer = inject(Renderer2);
  let indicator: HTMLElement | null = null;

  effect(() => {
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
  });
}

function createIndicator(renderer: Renderer2, icon: CngxIconData): HTMLElement {
  const span = renderer.createElement('span') as HTMLElement;
  renderer.addClass(span, INDICATOR_CLASS);
  renderer.setAttribute(span, 'aria-hidden', 'true');
  const svg = renderer.createElement('svg', 'svg') as SVGElement;
  renderer.addClass(svg, ICON_SVG_CLASS);
  if (icon.paint === 'stroke') {
    renderer.addClass(svg, `${ICON_SVG_CLASS}--stroke`);
  }
  renderer.setAttribute(svg, 'viewBox', icon.viewBox);
  renderer.setAttribute(svg, 'focusable', 'false');
  const path = renderer.createElement('path', 'svg') as SVGElement;
  renderer.setAttribute(path, 'd', icon.d);
  renderer.appendChild(svg, path);
  renderer.appendChild(span, svg);
  return span;
}
