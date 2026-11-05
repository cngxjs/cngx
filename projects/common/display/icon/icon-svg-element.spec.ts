import { Component, inject, Renderer2 } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CNGX_ICON_ALERT, CNGX_ICON_QUESTION, type CngxIconData } from '@cngx/utils';
import { describe, expect, it } from 'vitest';

import { createIconSvgElement } from './icon-svg-element';

@Component({ template: '' })
class RendererHost {
  readonly renderer = inject(Renderer2);
}

const WITH_MICRO: CngxIconData = {
  ...CNGX_ICON_ALERT,
  micro: { viewBox: '0 0 12 12', d: 'M5 1H7V9H5Z' },
  small: null,
};

const WITH_SMALL: CngxIconData = {
  ...CNGX_ICON_ALERT,
  micro: null,
  small: { viewBox: '0 0 16 16', d: 'M7 2H9V11H7Z' },
};

const WITH_BOTH: CngxIconData = {
  ...CNGX_ICON_ALERT,
  micro: { viewBox: '0 0 12 12', d: 'M5 1H7V9H5Z' },
  small: { viewBox: '0 0 16 16', d: 'M7 2H9V11H7Z' },
};

function renderer(): Renderer2 {
  return TestBed.createComponent(RendererHost).componentInstance.renderer;
}

// The tier each sibling path belongs to, in DOM order.
function tierOrder(el: SVGSVGElement): string[] {
  return Array.from(el.querySelectorAll('path')).map((p) =>
    p.classList.contains('cngx-icon-svg__micro')
      ? 'micro'
      : p.classList.contains('cngx-icon-svg__small')
        ? 'small'
        : 'path',
  );
}

describe('createIconSvgElement', () => {
  it('builds a decorative svg with the icon path and the surface class', () => {
    const { element } = createIconSvgElement(renderer(), CNGX_ICON_ALERT, 'my-icon');
    expect(element.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(element.classList.contains('my-icon')).toBe(true);
    expect(element.getAttribute('aria-hidden')).toBe('true');
    expect(element.getAttribute('focusable')).toBe('false');
    expect(element.getAttribute('viewBox')).toBe(CNGX_ICON_ALERT.viewBox);
    expect(element.querySelector('path')?.getAttribute('d')).toBe(CNGX_ICON_ALERT.d);
  });

  it('paints a stroke icon by presentation attributes and sizes it from the tokens', () => {
    const { element } = createIconSvgElement(renderer(), CNGX_ICON_ALERT, 'my-icon');
    expect(element.classList.contains('my-icon--stroke')).toBe(true);
    expect(element.getAttribute('fill')).toBe('none');
    expect(element.getAttribute('stroke')).toBe('currentColor');
    expect(element.getAttribute('stroke-linecap')).toBe('round');
    expect(element.getAttribute('stroke-linejoin')).toBe('round');
    expect(element.style.getPropertyValue('inline-size')).toBe(
      'round(nearest, var(--cngx-icon-svg-size, 1em), 1px)',
    );
    expect(element.style.getPropertyValue('block-size')).toBe(
      'round(nearest, var(--cngx-icon-svg-size, 1em), 1px)',
    );
    expect(element.style.getPropertyValue('stroke-width')).toBe(
      'var(--cngx-icon-svg-stroke-width, 2)',
    );
  });

  it('switches the paint when a fill icon replaces a stroke icon', () => {
    const icon = createIconSvgElement(renderer(), CNGX_ICON_ALERT, 'my-icon');
    icon.setIcon(CNGX_ICON_QUESTION);
    const { element } = icon;
    expect(element.querySelector('path')?.getAttribute('d')).toBe(CNGX_ICON_QUESTION.d);
    expect(element.classList.contains('my-icon--stroke')).toBe(false);
    expect(element.getAttribute('fill')).toBe('currentColor');
    expect(element.hasAttribute('stroke')).toBe(false);
    expect(element.style.getPropertyValue('stroke-width')).toBe('');
    expect(element.querySelectorAll('path').length).toBe(1);
  });

  it('carries the shared glyph class and marks the 24-grid path', () => {
    const { element } = createIconSvgElement(renderer(), CNGX_ICON_ALERT, 'my-icon');
    expect(element.classList.contains('cngx-icon-glyph')).toBe(true);
    expect(element.querySelector('path')?.classList.contains('cngx-icon-svg__path')).toBe(true);
  });

  it('builds the micro path second, hidden and filled by presentation attributes', () => {
    const { element } = createIconSvgElement(renderer(), WITH_MICRO, 'my-icon');
    const paths = element.querySelectorAll('path');
    expect(paths.length).toBe(2);
    expect(paths[0].getAttribute('d')).toBe(CNGX_ICON_ALERT.d);
    const micro = paths[1];
    expect(micro.classList.contains('cngx-icon-svg__micro')).toBe(true);
    expect(micro.getAttribute('d')).toBe(WITH_MICRO.micro?.d);
    expect(micro.getAttribute('transform')).toBe('scale(2)');
    expect(micro.getAttribute('fill')).toBe('currentColor');
    expect(micro.getAttribute('stroke')).toBe('none');
    expect(micro.getAttribute('display')).toBe('none');
  });

  it('drops the micro path when the next icon has none, and rebuilds it once', () => {
    const icon = createIconSvgElement(renderer(), WITH_MICRO, 'my-icon');
    icon.setIcon(CNGX_ICON_QUESTION);
    expect(icon.element.querySelectorAll('path').length).toBe(1);
    expect(icon.element.querySelector('.cngx-icon-svg__micro')).toBeNull();
    icon.setIcon(WITH_MICRO);
    icon.setIcon(WITH_MICRO);
    expect(icon.element.querySelectorAll('.cngx-icon-svg__micro').length).toBe(1);
  });

  it('builds the small path third, hidden and filled by presentation attributes', () => {
    const { element } = createIconSvgElement(renderer(), WITH_BOTH, 'my-icon');
    const paths = element.querySelectorAll('path');
    expect(paths.length).toBe(3);
    expect(paths[0].getAttribute('d')).toBe(CNGX_ICON_ALERT.d);
    expect(paths[1].classList.contains('cngx-icon-svg__micro')).toBe(true);
    const small = paths[2];
    expect(small.classList.contains('cngx-icon-svg__small')).toBe(true);
    expect(small.getAttribute('d')).toBe(WITH_BOTH.small?.d);
    expect(small.getAttribute('transform')).toBe('scale(1.5)');
    expect(small.getAttribute('fill')).toBe('currentColor');
    expect(small.getAttribute('stroke')).toBe('none');
    expect(small.getAttribute('display')).toBe('none');
  });

  it('drops the small path when the next icon has none, and rebuilds it once', () => {
    const icon = createIconSvgElement(renderer(), WITH_SMALL, 'my-icon');
    icon.setIcon(CNGX_ICON_QUESTION);
    expect(icon.element.querySelector('.cngx-icon-svg__small')).toBeNull();
    icon.setIcon(WITH_SMALL);
    icon.setIcon(WITH_SMALL);
    expect(icon.element.querySelectorAll('.cngx-icon-svg__small').length).toBe(1);
  });

  it('keeps the DOM order 24, micro, small through a full swap sequence', () => {
    const icon = createIconSvgElement(renderer(), CNGX_ICON_QUESTION, 'my-icon');
    expect(tierOrder(icon.element)).toEqual(['path']);
    icon.setIcon(WITH_MICRO);
    expect(tierOrder(icon.element)).toEqual(['path', 'micro']);
    icon.setIcon(WITH_SMALL);
    expect(tierOrder(icon.element)).toEqual(['path', 'small']);
    // small-only -> both: the new micro path must land before the existing small.
    icon.setIcon(WITH_BOTH);
    expect(tierOrder(icon.element)).toEqual(['path', 'micro', 'small']);
    icon.setIcon(WITH_MICRO);
    expect(tierOrder(icon.element)).toEqual(['path', 'micro']);
    icon.setIcon(CNGX_ICON_QUESTION);
    expect(tierOrder(icon.element)).toEqual(['path']);
  });
});
