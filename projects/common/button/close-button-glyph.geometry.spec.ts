/// <reference types="@vitest/browser-playwright" />

import { Component, type Type, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxCloseButton, provideButtonCloseIcon } from './close-button.component';

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

// A provided glyph component renders its svg one level below the glyph span,
// inside its own host, with no size of its own.
@Component({
  selector: 'cngx-geometry-provided-close',
  standalone: true,
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9" /></svg>`,
})
class ProvidedClose {}

@Component({
  selector: 'cngx-close-button-provided-glyph-host',
  standalone: true,
  imports: [CngxCloseButton],
  viewProviders: [provideButtonCloseIcon(ProvidedClose)],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    '../../core/theming/reset.css',
    '../../core/theming/base.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `<button cngxCloseButton aria-label="Close"></button>`,
})
class CloseButtonProvidedGlyphHost {}

let mountedRoot: HTMLElement | null = null;

function mount(host: Type<unknown> = CloseButtonGlyphHost): SVGSVGElement {
  const fixture = TestBed.createComponent(host);
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

  it('sizes a provided glyph component with a bare svg like the default glyph', () => {
    const svg = mount(CloseButtonProvidedGlyphHost);
    expect(svg.getBoundingClientRect().width).toBeCloseTo(16, 0);
    expect(svg.getBoundingClientRect().height).toBeCloseTo(16, 0);
  });

  it('centres a provided glyph on the button (its host takes no box)', () => {
    const svg = mount(CloseButtonProvidedGlyphHost);
    const button = svg.closest('button') as HTMLButtonElement;
    const glyph = svg.getBoundingClientRect();
    const box = button.getBoundingClientRect();
    expect(glyph.top + glyph.height / 2).toBeCloseTo(box.top + box.height / 2, 0);
    expect(glyph.left + glyph.width / 2).toBeCloseTo(box.left + box.width / 2, 0);
  });
});
