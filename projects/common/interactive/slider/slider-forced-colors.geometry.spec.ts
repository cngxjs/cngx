/// <reference types="@vitest/browser-playwright" />

import { CUSTOM_ELEMENTS_SCHEMA, Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). Under forced colors the
// slider track and fill used to flatten to Canvas (background-only paint), so
// only the thumb rings survived. They now opt out of forcing and paint with
// system colours: CanvasText track, Highlight value, and for a disabled slider
// a GrayText value on a Canvas track with a GrayText edge.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-slider-forced-host',
  standalone: true,
  styleUrls: [
    '../../../core/theming/system-tokens.css',
    './slider.component.css',
    './range-slider.component.css',
    '../../theming/components/cngx-slider.css',
  ],
  encapsulation: ViewEncapsulation.None,
  // Bare cngx-slider / cngx-range-slider tags carry only the shipped classes;
  // the components themselves are not under test here.
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <cngx-slider class="sl-on" style="--cngx-slider-fraction: 0.4">
      <span class="cngx-slider__track"><span class="cngx-slider__fill"></span></span>
      <span class="cngx-slider__thumb"></span>
    </cngx-slider>
    <cngx-slider class="sl-off" aria-disabled="true" style="--cngx-slider-fraction: 0.4">
      <span class="cngx-slider__track"><span class="cngx-slider__fill"></span></span>
      <span class="cngx-slider__thumb"></span>
    </cngx-slider>
    <cngx-range-slider
      class="rs-on"
      style="--cngx-slider-start-fraction: 0.2; --cngx-slider-end-fraction: 0.6"
    >
      <span class="cngx-slider__track"></span>
    </cngx-range-slider>
    <span cngxSliderTrack class="dir-on" style="--cngx-slider-fraction: 0.4">
      <span class="cngx-slider__track"><span class="cngx-slider__fill"></span></span>
    </span>
    <span class="probe-canvastext" style="color: CanvasText"></span>
    <span class="probe-highlight" style="color: Highlight"></span>
    <span class="probe-gray" style="color: GrayText"></span>
    <span class="probe-canvas" style="color: Canvas"></span>
  `,
})
class SliderHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(SliderHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function one(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('slider under forced colors, %s', (scheme) => {
  const probe = (root: HTMLElement, name: string): string => computedValue(one(root, `.probe-${name}`), 'color');

  async function mountForced(): Promise<HTMLElement> {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'forced-colors', value: 'active' },
        { name: 'prefers-color-scheme', value: scheme },
      ],
    });
    return mount();
  }

  it('paints the track CanvasText and the value Highlight', async () => {
    const root = await mountForced();
    expect(computedValue(one(root, '.sl-on .cngx-slider__track'), 'background-color')).toBe(probe(root, 'canvastext'));
    expect(computedValue(one(root, '.sl-on .cngx-slider__fill'), 'background-color')).toBe(probe(root, 'highlight'));
    expect(computedValue(one(root, '.dir-on .cngx-slider__track'), 'background-color')).toBe(probe(root, 'canvastext'));
    expect(computedValue(one(root, '.dir-on .cngx-slider__fill'), 'background-color')).toBe(probe(root, 'highlight'));
  });

  it('paints the range band with the same system colours', async () => {
    const root = await mountForced();
    const track = one(root, '.rs-on .cngx-slider__track');
    expect(computedValue(track, 'forced-color-adjust')).toBe('none');
    const image = computedValue(track, 'background-image');
    expect(image).toContain(probe(root, 'canvastext'));
    expect(image).toContain(probe(root, 'highlight'));
  });

  it('keeps a disabled value visible in GrayText on a Canvas track', async () => {
    const root = await mountForced();
    const gray = probe(root, 'gray');
    expect(computedValue(one(root, '.sl-off .cngx-slider__fill'), 'background-color')).toBe(gray);
    expect(computedValue(one(root, '.sl-off .cngx-slider__track'), 'background-color')).toBe(probe(root, 'canvas'));
    expect(computedValue(one(root, '.sl-off .cngx-slider__track'), 'outline-color')).toBe(gray);
    expect(computedValue(one(root, '.sl-off .cngx-slider__thumb'), 'border-top-color')).toBe(gray);
  });
});
