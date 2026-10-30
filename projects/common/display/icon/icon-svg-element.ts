import { type Renderer2, RendererStyleFlags2 } from '@angular/core';
import type { CngxIconData } from '@cngx/utils';

/**
 * Handle on an `<svg>` built by {@link createIconSvgElement}.
 *
 * @internal
 */
export interface CngxIconSvgElement {
  /** The built `<svg>`, ready to insert. */
  readonly element: SVGSVGElement;
  /** Redraw the glyph from new icon data, switching the paint if it differs. */
  setIcon(icon: CngxIconData): void;
}

/**
 * Imperative twin of `CngxIconSvg` for DOM a directive inserts into
 * consumer-projected content, where no component instance can render.
 *
 * The glyph is legible without any stylesheet: paint travels as SVG
 * presentation attributes (`fill` / `stroke`, round caps and joins), so
 * any class rule of the owning surface still wins over them, and the box
 * and stroke width read `--cngx-icon-svg-size` and
 * `--cngx-icon-svg-stroke-width` through inline styles, so a surface
 * sizes it by setting those tokens. `className` is the surface's own
 * hook; a stroke icon adds `<className>--stroke`.
 *
 * Decorative only (`aria-hidden`, `focusable="false"`).
 *
 * @internal
 */
export function createIconSvgElement(
  renderer: Renderer2,
  icon: CngxIconData,
  className: string,
): CngxIconSvgElement {
  const svg = renderer.createElement('svg', 'svg') as SVGSVGElement;
  renderer.addClass(svg, className);
  renderer.setAttribute(svg, 'aria-hidden', 'true');
  renderer.setAttribute(svg, 'focusable', 'false');
  renderer.setAttribute(svg, 'overflow', 'visible');
  setTokenStyle(renderer, svg, 'inline-size', 'var(--cngx-icon-svg-size, 1em)');
  setTokenStyle(renderer, svg, 'block-size', 'var(--cngx-icon-svg-size, 1em)');
  const path = renderer.createElement('path', 'svg') as SVGElement;
  renderer.appendChild(svg, path);

  const strokeClassName = `${className}--stroke`;
  const setIcon = (next: CngxIconData): void => {
    renderer.setAttribute(svg, 'viewBox', next.viewBox);
    renderer.setAttribute(path, 'd', next.d);
    if (next.paint === 'stroke') {
      renderer.addClass(svg, strokeClassName);
      renderer.setAttribute(svg, 'fill', 'none');
      renderer.setAttribute(svg, 'stroke', 'currentColor');
      renderer.setAttribute(svg, 'stroke-linecap', 'round');
      renderer.setAttribute(svg, 'stroke-linejoin', 'round');
      setTokenStyle(renderer, svg, 'stroke-width', 'var(--cngx-icon-svg-stroke-width, 2)');
      return;
    }
    renderer.removeClass(svg, strokeClassName);
    renderer.setAttribute(svg, 'fill', 'currentColor');
    renderer.removeAttribute(svg, 'stroke');
    renderer.removeAttribute(svg, 'stroke-linecap');
    renderer.removeAttribute(svg, 'stroke-linejoin');
    renderer.removeStyle(svg, 'stroke-width', RendererStyleFlags2.DashCase);
  };
  setIcon(icon);

  return { element: svg, setIcon };
}

function setTokenStyle(renderer: Renderer2, el: Element, property: string, value: string): void {
  renderer.setStyle(el, property, value, RendererStyleFlags2.DashCase);
}
