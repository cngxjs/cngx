/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). The paginator dots are
// background-only circles on a ::before and used to flatten into Canvas under
// forced colors, the current page with them. Every dot now carries an inset
// CanvasText ring and the current dot fills with Highlight. The dot markup is
// static with the shipped classes: paginator-base.css styles flat classes
// (no @scope, no encapsulation), and @cngx/ui renders the same markup.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-paginator-dots-forced-host',
  standalone: true,
  styleUrls: ['../../../core/theming/system-tokens.css', './styles/paginator-base.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="cngx-paginator">
      <button type="button" class="cngx-paginator__dot dot-a" aria-label="Page 1"></button>
      <button
        type="button"
        class="cngx-paginator__dot cngx-paginator__dot--current dot-current"
        aria-current="page"
        aria-label="Page 2"
      ></button>
      <button type="button" class="cngx-paginator__dot dot-small" data-size="small" aria-label="Page 3"></button>
      <button type="button" class="cngx-paginator__dot dot-off" aria-disabled="true" aria-label="Page 4"></button>
    </div>
    <span class="plain" style="color: rgb(200, 0, 0)">plain</span>
    <span class="probe-canvastext" style="color: CanvasText"></span>
    <span class="probe-canvas" style="color: Canvas"></span>
    <span class="probe-highlight" style="color: Highlight"></span>
    <span class="probe-gray" style="color: GrayText"></span>
  `,
})
class PaginatorDotsHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(PaginatorDotsHost);
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

const before = (el: Element, property: string): string =>
  getComputedStyle(el, '::before').getPropertyValue(property).trim();

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('paginator dots under forced colors, %s', (scheme) => {
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

  it('rings every dot on Canvas, including a shrunk edge dot', async () => {
    const root = await mountForced();
    for (const dot of ['.dot-a', '.dot-small']) {
      const el = one(root, dot);
      expect(before(el, 'forced-color-adjust')).toBe('none');
      expect(before(el, 'background-color')).toBe(probe(root, 'canvas'));
      expect(before(el, 'box-shadow')).toBe(`${probe(root, 'canvastext')} 0px 0px 0px 1px inset`);
    }
  });

  it('fills the current dot with Highlight and drops its ring', async () => {
    const root = await mountForced();
    const current = one(root, '.dot-current');
    expect(before(current, 'background-color')).toBe(probe(root, 'highlight'));
    expect(before(current, 'box-shadow')).toBe('none');
  });

  it('rings a disabled dot in GrayText', async () => {
    const root = await mountForced();
    expect(before(one(root, '.dot-off'), 'box-shadow')).toBe(`${probe(root, 'gray')} 0px 0px 0px 1px inset`);
  });
});

describe('paginator dots without forced colors', () => {
  it('keeps the author paint: tinted dots, no ring', () => {
    const root = mount();
    expect(before(one(root, '.dot-a'), 'box-shadow')).toBe('none');
    expect(before(one(root, '.dot-a'), 'forced-color-adjust')).toBe('auto');
    expect(before(one(root, '.dot-current'), 'background-color')).not.toBe(before(one(root, '.dot-a'), 'background-color'));
  });
});
