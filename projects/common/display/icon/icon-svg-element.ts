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

// Whole pixels, as in `icon-svg.component.css`.
const ICON_BOX_SIZE = 'round(nearest, var(--cngx-icon-svg-size, 1em), 1px)';

/**
 * Imperative twin of `CngxIconSvg` for DOM a directive inserts into
 * consumer-projected content, where no component instance can render.
 *
 * The glyph is legible without any stylesheet: paint travels as SVG
 * presentation attributes (`fill` / `stroke`, round caps and joins), so
 * any class rule of the owning surface still wins over them, and the box
 * and stroke width read `--cngx-icon-svg-size` (rounded to whole
 * pixels) and `--cngx-icon-svg-stroke-width` through inline styles, so a
 * surface sizes it by setting those tokens. `className` is the surface's own
 * hook; a stroke icon adds `<className>--stroke`. The svg also carries the
 * shared `cngx-icon-glyph` class and its 24-grid path `cngx-icon-svg__path`.
 *
 * An icon with a 12-grid `micro` drawing gets a second path,
 * `cngx-icon-svg__micro`, scaled onto the 24 viewBox and hidden, and a
 * 16-grid `small` drawing a third, `cngx-icon-svg__small`; both are filled and
 * unstroked by presentation attributes. DOM order is always 24 path, micro,
 * small - a micro added to an svg that already has a small path is inserted
 * before it. Bare, the 24-grid path shows alone; with `cngx.css` loaded, the
 * `.cngx-icon-glyph` container rules show the micro path in a 10 to 14px box
 * and the small path in a 15 to 19px box.
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
  renderer.addClass(svg, 'cngx-icon-glyph');
  renderer.setAttribute(svg, 'aria-hidden', 'true');
  renderer.setAttribute(svg, 'focusable', 'false');
  renderer.setAttribute(svg, 'overflow', 'visible');
  setTokenStyle(renderer, svg, 'inline-size', ICON_BOX_SIZE);
  setTokenStyle(renderer, svg, 'block-size', ICON_BOX_SIZE);
  const path = renderer.createElement('path', 'svg') as SVGElement;
  renderer.addClass(path, 'cngx-icon-svg__path');
  renderer.appendChild(svg, path);
  let micro: SVGElement | null = null;
  let small: SVGElement | null = null;

  const setSmall = (d: string | undefined): void => {
    if (d === undefined) {
      if (small) {
        renderer.removeChild(svg, small);
        small = null;
      }
      return;
    }
    small ??= createSmallPath(renderer, svg);
    renderer.setAttribute(small, 'd', d);
  };

  const setMicro = (d: string | undefined): void => {
    if (d === undefined) {
      if (micro) {
        renderer.removeChild(svg, micro);
        micro = null;
      }
      return;
    }
    // Pinned DOM order is 24 path, micro, small: a micro created while a small
    // path already exists is inserted before it, never appended after it.
    micro ??= createMicroPath(renderer, svg, small);
    renderer.setAttribute(micro, 'd', d);
  };

  const strokeClassName = `${className}--stroke`;
  const setIcon = (next: CngxIconData): void => {
    renderer.setAttribute(svg, 'viewBox', next.viewBox);
    renderer.setAttribute(path, 'd', next.d);
    setMicro(next.micro?.d);
    setSmall(next.small?.d);
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

function createMicroPath(
  renderer: Renderer2,
  svg: SVGSVGElement,
  before: SVGElement | null,
): SVGElement {
  const micro = renderer.createElement('path', 'svg') as SVGElement;
  renderer.addClass(micro, 'cngx-icon-svg__micro');
  renderer.setAttribute(micro, 'transform', 'scale(2)');
  renderer.setAttribute(micro, 'fill', 'currentColor');
  renderer.setAttribute(micro, 'stroke', 'none');
  renderer.setAttribute(micro, 'display', 'none');
  // `before` is the small path when one exists (null appends), keeping the
  // 24 path, micro, small order.
  renderer.insertBefore(svg, micro, before);
  return micro;
}

function createSmallPath(renderer: Renderer2, svg: SVGSVGElement): SVGElement {
  const small = renderer.createElement('path', 'svg') as SVGElement;
  renderer.addClass(small, 'cngx-icon-svg__small');
  renderer.setAttribute(small, 'transform', 'scale(1.5)');
  renderer.setAttribute(small, 'fill', 'currentColor');
  renderer.setAttribute(small, 'stroke', 'none');
  renderer.setAttribute(small, 'display', 'none');
  renderer.appendChild(svg, small);
  return small;
}

function setTokenStyle(renderer: Renderer2, el: Element, property: string, value: string): void {
  renderer.setStyle(el, property, value, RendererStyleFlags2.DashCase);
}
