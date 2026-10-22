import { Component, signal, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxAsyncClick, type AsyncAction } from '@cngx/common/interactive';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxButton } from './button.component';
import type { CngxButtonSize } from './button.types';
import { CngxButtonStart } from './slots';

// Runs in a real Chromium (the `test-geometry` target). The button sheet reads
// the spacing scale, the control font and the touch floor from core theming,
// so the host loads the same foundation the forms sizing contract runs on.
// jsdom reports `''` for every read.

type Density = 'comfortable' | 'compact' | 'spacious';

@Component({
  selector: 'cngx-button-geometry-host',
  standalone: true,
  imports: [CngxButton, CngxButtonStart, CngxAsyncClick],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../core/theming/system-tokens.css',
    '../../core/theming/reset.css',
    '../../core/theming/base.css',
    '../../core/theming/density-tokens.css',
    './button.component.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div [attr.data-density]="density()" [attr.data-touch]="touch()">
      @for (size of sizes; track size) {
        <p><button cngxButton class="b-{{ size }}" [size]="size">Save</button></p>
      }
      <p>
        <button cngxButton class="b-start"><span cngxButtonStart>+</span>Save</button>
      </p>
      <p>
        <button cngxButton class="b-svg-self">
          <svg cngxButtonStart viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14" /></svg>Save
        </button>
        <button cngxButton class="b-svg-child">
          <span cngxButtonStart><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14" /></svg></span>Save
        </button>
      </p>
      <p>Read the <a cngxButton="link" class="b-link" href="#docs">docs</a> first.</p>
      <p>
        <button cngxButton class="b-busy" [cngxAsyncClick]="action">Save changes</button>
      </p>
    </div>
  `,
})
class GeometryHost {
  readonly sizes: readonly CngxButtonSize[] = ['xs', 'sm', 'md', 'lg'];
  readonly density = signal<Density>('comfortable');
  readonly touch = signal<'on' | null>(null);
  readonly action: AsyncAction = () => new Promise<void>(() => undefined);
}

let mountedRoot: HTMLElement | null = null;

function mount(density: Density = 'comfortable', touch = false) {
  const fixture = TestBed.createComponent(GeometryHost);
  fixture.componentInstance.density.set(density);
  fixture.componentInstance.touch.set(touch ? 'on' : null);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return { fixture, root: mountedRoot };
}

function query(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el as HTMLElement;
}

function px(el: Element, property: string): number {
  return parseFloat(computedValue(el, property));
}

function height(el: Element): number {
  return el.getBoundingClientRect().height;
}

// line box + 2 * block padding + 2 * border, floored by min-block-size.
function expectedHeight(el: HTMLElement): number {
  const formula =
    px(el, 'line-height') +
    px(el, 'padding-top') +
    px(el, 'padding-bottom') +
    px(el, 'border-top-width') +
    px(el, 'border-bottom-width');
  return Math.max(formula, px(el, 'min-height') || 0);
}

const MD_HEIGHT: Readonly<Record<Density, number>> = { comfortable: 42, compact: 34, spacious: 50 };
const SPACE: Readonly<Record<Density, { xs: number; sm: number; md: number }>> = {
  comfortable: { xs: 4, sm: 8, md: 16 },
  compact: { xs: 2, sm: 4, md: 8 },
  spacious: { xs: 6, sm: 12, md: 20 },
};

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.style.removeProperty('font-size');
});

describe.each(['comfortable', 'compact', 'spacious'] as const)('CngxButton geometry: %s', (density) => {
  it('sizes md to the form-control row', () => {
    const md = query(mount(density).root, '.b-md');
    expect(height(md)).toBeCloseTo(MD_HEIGHT[density], 0);
    expect(px(md, 'padding-top')).toBe(SPACE[density].sm);
    expect(px(md, 'padding-left')).toBe(SPACE[density].md);
    expect(px(md, 'border-top-width')).toBe(1);
  });

  it('steps xs < sm < md < lg, each on its formula', () => {
    const { root } = mount(density);
    const heights = (['xs', 'sm', 'md', 'lg'] as const).map((size) => {
      const el = query(root, `.b-${size}`);
      expect(height(el)).toBeCloseTo(expectedHeight(el), 0);
      return height(el);
    });
    for (let i = 1; i < heights.length; i++) {
      expect(heights[i]).toBeGreaterThan(heights[i - 1]);
    }
    expect(px(query(root, '.b-sm'), 'padding-top')).toBe(SPACE[density].xs);
  });

  it('floors every control size to 44px on a coarse pointer', () => {
    const { root } = mount(density, true);
    for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
      expect(height(query(root, `.b-${size}`))).toBeGreaterThanOrEqual(44 - 0.5);
    }
  });
});

describe('CngxButton geometry: text scale', () => {
  it('grows the md row with the root font size', () => {
    const before = height(query(mount().root, '.b-md'));
    mountedRoot?.remove();
    document.documentElement.style.fontSize = '20px';
    const md = query(mount().root, '.b-md');
    expect(height(md)).toBeGreaterThan(before);
    expect(height(md)).toBeCloseTo(expectedHeight(md), 0);
  });
});

describe('CngxButton geometry: link', () => {
  it('drops the control height and the touch floor', () => {
    const { root } = mount('comfortable', true);
    const link = query(root, '.b-link');
    expect(px(link, 'padding-top')).toBe(0);
    expect(computedValue(link, 'min-height')).toBe('0px');
    expect(height(link)).toBeLessThan(44);
  });
});

describe('CngxButton geometry: slots', () => {
  it('trims the inline-start padding next to a filled start slot', () => {
    const { root } = mount();
    const start = query(root, '.b-start');
    expect(px(start, 'padding-left')).toBeLessThan(px(query(root, '.b-md'), 'padding-left'));
    expect(px(start, 'padding-right')).toBe(px(query(root, '.b-md'), 'padding-right'));
  });

  it('sizes an svg to 1.25em whether it carries the slot marker or sits inside one', () => {
    const { root } = mount();
    const md = query(root, '.b-md');
    for (const host of ['.b-svg-self', '.b-svg-child']) {
      const btn = query(root, host);
      const svg = query(btn, 'svg').getBoundingClientRect();
      expect(svg.width).toBeCloseTo(px(btn, 'font-size') * 1.25, 0);
      expect(svg.height).toBeCloseTo(px(btn, 'font-size') * 1.25, 0);
      expect(height(btn)).toBeCloseTo(height(md), 0);
    }
  });
});

describe('CngxButton geometry: busy', () => {
  it('keeps the width while the busy layer covers the label', () => {
    const { fixture, root } = mount();
    const btn = query(root, '.b-busy');
    const width = btn.getBoundingClientRect().width;
    btn.click();
    fixture.detectChanges();
    expect(btn.dataset['busy']).toBe('true');
    expect(btn.getBoundingClientRect().width).toBeCloseTo(width, 0);
    expect(computedValue(query(btn, '.cngx-button__label'), 'visibility')).toBe('hidden');
    const busy = query(btn, '.cngx-button__busy');
    // inset: 0 spans the padding box, so it misses only the two border pixels.
    expect(busy.getBoundingClientRect().width).toBeGreaterThanOrEqual(width - 2.5);
  });
});
