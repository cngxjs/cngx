import { Component, signal, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { accessibleName } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxButton } from './button.component';
import type { CngxButtonSize } from './button.types';
import { CngxIconButton } from './icon-button.component';

// Runs in a real Chromium (the `test-geometry` target): the square box, the
// pseudo-element hit area and the md parity with CngxButton only exist after
// layout. jsdom reports `''` for every read.

type Density = 'comfortable' | 'compact' | 'spacious';

@Component({
  selector: 'cngx-icon-button-geometry-host',
  standalone: true,
  imports: [CngxButton, CngxIconButton],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    '../../core/theming/reset.css',
    '../../core/theming/base.css',
    '../../core/theming/density-tokens.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div [attr.data-density]="density()" [attr.data-touch]="touch()">
      @for (size of sizes; track size) {
        <p><button cngxIconButton class="i-{{ size }}" [size]="size" aria-label="Add">+</button></p>
      }
      <p><button cngxButton class="b-md">Save</button></p>
      <p class="row">
        <button cngxIconButton class="r-1" size="sm" aria-label="Bold">B</button
        ><button cngxIconButton class="r-2" size="sm" aria-label="Italic">I</button>
      </p>
    </div>
  `,
})
class GeometryHost {
  readonly sizes: readonly CngxButtonSize[] = ['xs', 'sm', 'md', 'lg'];
  readonly density = signal<Density>('comfortable');
  readonly touch = signal<'on' | null>(null);
}

let mountedRoot: HTMLElement | null = null;

function mount(density: Density = 'comfortable', touch = false): HTMLElement {
  const fixture = TestBed.createComponent(GeometryHost);
  fixture.componentInstance.density.set(density);
  fixture.componentInstance.touch.set(touch ? 'on' : null);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function query(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el as HTMLElement;
}

function pseudoSize(el: Element): { width: number; height: number } {
  const style = getComputedStyle(el, '::before');
  return { width: parseFloat(style.width), height: parseFloat(style.height) };
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe.each(['comfortable', 'compact', 'spacious'] as const)('CngxIconButton geometry: %s', (density) => {
  it('stays square at every size and grows with the size step', () => {
    const root = mount(density);
    let previous = 0;
    for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
      const rect = query(root, `.i-${size}`).getBoundingClientRect();
      expect(rect.width).toBeCloseTo(rect.height, 0);
      expect(rect.height).toBeGreaterThan(previous);
      previous = rect.height;
    }
  });

  it('matches the md button height at md', () => {
    const root = mount(density);
    expect(query(root, '.i-md').getBoundingClientRect().height).toBeCloseTo(
      query(root, '.b-md').getBoundingClientRect().height,
      0,
    );
  });
});

describe('CngxIconButton geometry: touch', () => {
  it('keeps the visual box and grows the hit area to 44px on a coarse pointer', () => {
    const fine = query(mount(), '.i-sm').getBoundingClientRect();
    mountedRoot?.remove();
    const btn = query(mount('comfortable', true), '.i-sm');
    const coarse = btn.getBoundingClientRect();
    expect(coarse.height).toBeCloseTo(fine.height, 0);
    expect(coarse.width).toBeCloseTo(fine.width, 0);
    const hit = pseudoSize(btn);
    expect(hit.width).toBeGreaterThanOrEqual(44 - 0.5);
    expect(hit.height).toBeGreaterThanOrEqual(44 - 0.5);
  });

  it('floors the spacing between adjacent icon buttons on a coarse pointer', () => {
    const root = mount('comfortable', true);
    const first = query(root, '.r-1').getBoundingClientRect();
    const second = query(root, '.r-2').getBoundingClientRect();
    expect(second.left - first.right).toBeGreaterThanOrEqual(8 - 0.5);
  });

  it('keeps the hit area at the box size on a fine pointer', () => {
    const btn = query(mount(), '.i-md');
    const rect = btn.getBoundingClientRect();
    // 100% of the padding box: the two border pixels short of the box.
    expect(pseudoSize(btn).width).toBeGreaterThanOrEqual(rect.width - 2.5);
    expect(pseudoSize(btn).width).toBeLessThanOrEqual(rect.width);
  });
});

// A 3:1 image, so a stretched or overflowing img shows in its box.
const WIDE_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='20'%3E%3Crect width='60' height='20'/%3E%3C/svg%3E";

@Component({
  selector: 'cngx-icon-button-glyph-host',
  standalone: true,
  imports: [CngxIconButton],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    '../../core/theming/reset.css',
    '../../core/theming/base.css',
    '../../core/theming/density-tokens.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (size of sizes; track size) {
      <p>
        <button cngxIconButton class="svg-{{ size }}" [size]="size" aria-label="Delete row">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /></svg>
        </button>
        <button cngxIconButton class="img-{{ size }}" [size]="size" aria-label="Delete row">
          <img alt="Trash can" [src]="img" />
        </button>
      </p>
    }
  `,
})
class GlyphHost {
  readonly sizes: readonly CngxButtonSize[] = ['sm', 'md', 'lg'];
  readonly img = WIDE_IMG;
}

function mountGlyphs(): HTMLElement {
  const fixture = TestBed.createComponent(GlyphHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

describe.each(['sm', 'md', 'lg'] as const)('CngxIconButton geometry: projected glyph at %s', (size) => {
  it('renders a bare svg and an img at the same box size', () => {
    const root = mountGlyphs();
    const svg = query(root, `.svg-${size} svg`).getBoundingClientRect();
    const img = query(root, `.img-${size} img`).getBoundingClientRect();
    expect(svg.width).toBeGreaterThan(0);
    expect(Math.abs(img.width - svg.width)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(img.height - svg.height)).toBeLessThanOrEqual(0.5);
  });

  it('keeps a wide img inside the button box', () => {
    const root = mountGlyphs();
    const box = query(root, `.img-${size}`).getBoundingClientRect();
    const img = query(root, `.img-${size} img`).getBoundingClientRect();
    expect(img.left).toBeGreaterThanOrEqual(box.left);
    expect(img.right).toBeLessThanOrEqual(box.right);
    expect(img.top).toBeGreaterThanOrEqual(box.top);
    expect(img.bottom).toBeLessThanOrEqual(box.bottom);
  });
});

describe('CngxIconButton geometry: accessible name', () => {
  it('takes the name from the host, never from the alt text of a projected img', async () => {
    mountGlyphs();
    expect(await accessibleName('.img-md')).toBe('Delete row');
  });
});
