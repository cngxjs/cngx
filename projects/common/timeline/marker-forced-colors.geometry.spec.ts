/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxTimelineMarker } from './marker.component';

// Runs in a real Chromium (the `test-geometry` target). Under forced colors a
// bare timeline marker (no projected glyph) used to keep only a CanvasText ring,
// so done, active and rejected read alike. A bare marker now encodes its status
// by shape: done filled CanvasText, active filled Highlight, rejected a double
// ring, upcoming a dashed ring. A marker with a glyph keeps the plain ring.

const SCHEMES = ['light', 'dark'] as const;
const STATUSES = ['done', 'active', 'rejected', 'upcoming'] as const;

@Component({
  selector: 'cngx-timeline-marker-forced-host',
  standalone: true,
  imports: [CngxTimelineMarker],
  styleUrls: ['../../core/theming/system-tokens.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <cngx-timeline-marker class="mk-done" status="done" />
    <cngx-timeline-marker class="mk-active" status="active" />
    <cngx-timeline-marker class="mk-rejected" status="rejected" />
    <cngx-timeline-marker class="mk-upcoming" status="upcoming" />
    <cngx-timeline-marker class="mk-glyph" status="done">✓</cngx-timeline-marker>
    <span class="plain" style="color: rgb(200, 0, 0)">plain</span>
    <span class="probe-canvastext" style="color: CanvasText"></span>
    <span class="probe-canvas" style="color: Canvas"></span>
    <span class="probe-highlight" style="color: Highlight"></span>
  `,
})
class MarkerHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(MarkerHost);
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

const paint = (el: HTMLElement): string =>
  ['background-color', 'border-top-style', 'border-top-color', 'border-top-width'].map((p) => computedValue(el, p)).join('|');

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('timeline marker under forced colors, %s', (scheme) => {
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

  it('forces a plain author colour (the emulation is live)', async () => {
    const root = await mountForced();
    expect(computedValue(one(root, '.plain'), 'color')).toBe(probe(root, 'canvastext'));
  });

  it('fills a bare done marker with CanvasText', async () => {
    const root = await mountForced();
    const done = one(root, '.mk-done');
    expect(computedValue(done, 'background-color')).toBe(probe(root, 'canvastext'));
    expect(computedValue(done, 'border-top-color')).toBe(probe(root, 'canvastext'));
  });

  it('fills a bare active marker with Highlight', async () => {
    const root = await mountForced();
    const active = one(root, '.mk-active');
    expect(computedValue(active, 'background-color')).toBe(probe(root, 'highlight'));
    expect(computedValue(active, 'border-top-color')).toBe(probe(root, 'highlight'));
  });

  it('rings a bare rejected marker twice and a bare upcoming marker dashed', async () => {
    const root = await mountForced();
    const rejected = one(root, '.mk-rejected');
    expect(computedValue(rejected, 'border-top-style')).toBe('double');
    expect(computedValue(rejected, 'border-top-width')).toBe('3px');
    expect(computedValue(rejected, 'border-top-color')).toBe(probe(root, 'canvastext'));
    const upcoming = one(root, '.mk-upcoming');
    expect(computedValue(upcoming, 'border-top-style')).toBe('dashed');
    expect(computedValue(upcoming, 'border-top-color')).toBe(probe(root, 'canvastext'));
    expect(computedValue(upcoming, 'box-sizing')).toBe('border-box');
  });

  it('never paints two bare statuses alike', async () => {
    const root = await mountForced();
    const paints = STATUSES.map((status) => paint(one(root, `.mk-${status}`)));
    expect(new Set(paints).size).toBe(STATUSES.length);
  });

  it('keeps a glyph marker as a hollow ring around its CanvasText glyph', async () => {
    const root = await mountForced();
    const glyph = one(root, '.mk-glyph');
    expect(computedValue(glyph, 'background-color')).toBe(probe(root, 'canvas'));
    expect(computedValue(glyph, 'border-top-style')).toBe('solid');
    expect(computedValue(glyph, 'color')).toBe(probe(root, 'canvastext'));
  });
});

describe('timeline marker without forced colors', () => {
  it('keeps the author paint: filled done marker without a border', () => {
    const root = mount();
    const done = one(root, '.mk-done');
    expect(computedValue(done, 'border-top-style')).toBe('none');
    expect(computedValue(done, 'background-color')).not.toBe(computedValue(one(root, '.probe-canvastext'), 'color'));
  });
});
