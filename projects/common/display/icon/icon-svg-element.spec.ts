import { Component, inject, Renderer2 } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CNGX_ICON_ALERT, CNGX_ICON_DOT } from '@cngx/utils';
import { describe, expect, it } from 'vitest';

import { createIconSvgElement } from './icon-svg-element';

@Component({ template: '' })
class RendererHost {
  readonly renderer = inject(Renderer2);
}

function renderer(): Renderer2 {
  return TestBed.createComponent(RendererHost).componentInstance.renderer;
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
    expect(element.style.getPropertyValue('inline-size')).toBe('var(--cngx-icon-svg-size, 1em)');
    expect(element.style.getPropertyValue('stroke-width')).toBe(
      'var(--cngx-icon-svg-stroke-width, 2)',
    );
  });

  it('switches the paint when a fill icon replaces a stroke icon', () => {
    const icon = createIconSvgElement(renderer(), CNGX_ICON_ALERT, 'my-icon');
    icon.setIcon(CNGX_ICON_DOT);
    const { element } = icon;
    expect(element.querySelector('path')?.getAttribute('d')).toBe(CNGX_ICON_DOT.d);
    expect(element.classList.contains('my-icon--stroke')).toBe(false);
    expect(element.getAttribute('fill')).toBe('currentColor');
    expect(element.hasAttribute('stroke')).toBe(false);
    expect(element.style.getPropertyValue('stroke-width')).toBe('');
    expect(element.querySelectorAll('path').length).toBe(1);
  });
});
