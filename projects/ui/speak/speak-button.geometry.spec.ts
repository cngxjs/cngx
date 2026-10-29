import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type CngxSpeak } from '@cngx/common';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxSpeakButton } from './speak-button';

// Runs in a real Chromium (the `test-geometry` target). The speaker and stop
// glyphs come from the shared icon set and keep the 18px box, the ink and the
// 1px optical nudge of the inline drawings they replaced (speak-button.css).

let mountedRoot: HTMLElement | null = null;

function mount(speaking: boolean): {
  button: HTMLElement;
  svg: SVGSVGElement;
  path: SVGPathElement;
} {
  const fixture = TestBed.createComponent(CngxSpeakButton);
  const ref = { speaking: signal(speaking), supported: true, toggle: () => undefined };
  fixture.componentRef.setInput('speakRef', ref as unknown as CngxSpeak);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const button = mountedRoot.querySelector<HTMLElement>('.cngx-speak-button__btn');
  const svg = mountedRoot.querySelector<SVGSVGElement>('svg.cngx-speak-button__icon');
  const path = svg?.querySelector('path');
  if (!button || !svg || !path) {
    throw new Error('cngx-speak-button renders no icon');
  }
  return { button, svg, path };
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

function centre(rect: DOMRect): { x: number; y: number } {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

describe('CngxSpeakButton glyphs', () => {
  it('sizes the icon from --cngx-speak-btn-icon-size', () => {
    const { svg } = mount(false);
    expect(svg.getBoundingClientRect().width).toBeCloseTo(18, 1);
    expect(svg.getBoundingClientRect().height).toBeCloseTo(18, 1);
  });

  // The speaker and its waves span 22 of 24 units across with the 2-unit stroke.
  it('draws the idle speaker 22/24 of the icon box wide in a 1.5px line', () => {
    const { svg, path } = mount(false);
    const stroke = (parseFloat(computedValue(svg, 'stroke-width')) * 18) / 24;
    expect(stroke).toBeCloseTo(1.5, 1);
    expect(path.getBoundingClientRect().width + stroke).toBeCloseTo((18 * 22) / 24, 0);
    expect(computedValue(svg, 'fill')).toBe('none');
  });

  it('draws the stop square 12/24 of the icon box as a fill', () => {
    const { svg, path } = mount(true);
    expect(path.getBoundingClientRect().width).toBeCloseTo(9, 1);
    expect(computedValue(svg, 'fill')).toBe(computedValue(svg, 'color'));
  });

  it('keeps the 1px inline nudge off the button centre', () => {
    const { button, svg } = mount(true);
    const icon = centre(svg.getBoundingClientRect());
    const box = centre(button.getBoundingClientRect());
    expect(icon.x - box.x).toBeCloseTo(1, 1);
    expect(icon.y - box.y).toBeCloseTo(0, 1);
  });
});
