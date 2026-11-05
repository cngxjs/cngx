/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxCloseButton } from './close-button.component';

// Runs in a real Chromium (the `test-geometry` target). The default close button
// is size sm and renders its X glyph in a 16px box, inside the 15 to 19px band,
// so the global icon sheet swaps it to the hand-hinted 16-grid small X. The host
// loads that sheet as cngx.css does; without it the band rule never fires.

@Component({
  selector: 'cngx-close-button-glyph-host',
  standalone: true,
  imports: [CngxCloseButton],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    '../../core/theming/reset.css',
    '../../core/theming/base.css',
    '../theming/components/cngx-icon-glyph.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `<button cngxCloseButton aria-label="Close"></button>`,
})
class CloseButtonGlyphHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): SVGSVGElement {
  const fixture = TestBed.createComponent(CloseButtonGlyphHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const svg = mountedRoot.querySelector<SVGSVGElement>('button svg');
  if (!svg) {
    throw new Error('close button glyph did not render');
  }
  return svg;
}

function visiblePath(svg: SVGSVGElement): SVGPathElement {
  const painted = Array.from(svg.querySelectorAll('path')).filter(
    (path) => getComputedStyle(path).display !== 'none',
  );
  expect(painted).toHaveLength(1);
  return painted[0];
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('close button glyph geometry', () => {
  it('sizes the sm close glyph to a 16px box', () => {
    const svg = mount();
    expect(svg.getBoundingClientRect().width).toBeCloseTo(16, 0);
    expect(svg.getBoundingClientRect().height).toBeCloseTo(16, 0);
  });

  it('draws the X on the 16-grid small path in the band', () => {
    const svg = mount();
    expect(visiblePath(svg).classList.contains('cngx-icon-svg__small')).toBe(true);
  });
});
