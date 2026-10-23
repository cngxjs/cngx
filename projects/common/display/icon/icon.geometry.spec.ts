import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxIcon } from './icon.component';

// Runs in a real Chromium (the `test-geometry` target). The icon sizes itself
// through `font-size: var(--cngx-icon-size)` on its own host, which only
// resolves after style computation; jsdom reports `''` for every read. The
// context font size is pinned to 16px so every preset has an exact box.

const CONTEXT_PX = 16;
const PRESETS = [
  ['xs', 0.75],
  ['sm', 1],
  ['md', 1.25],
  ['lg', 1.5],
  ['xl', 2],
] as const;

@Component({
  selector: 'cngx-icon-geometry-host',
  standalone: true,
  imports: [CngxIcon],
  styleUrls: ['../../../core/theming/layers.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div style="font-size: 16px">
      @for (preset of presets; track preset[0]) {
        <cngx-icon class="p-{{ preset[0] }}" [size]="preset[0]">★</cngx-icon>
      }
      <cngx-icon class="p-default">★</cngx-icon>
      <span style="--cngx-icon-size-md: 2em">
        <cngx-icon class="o-ancestor">★</cngx-icon>
      </span>
      <cngx-icon class="o-inline" size="lg" style="--cngx-icon-size: 24px">★</cngx-icon>
      <cngx-icon class="o-inline-em" size="xs" style="--cngx-icon-size: 2.5em">★</cngx-icon>
    </div>
  `,
})
class IconGeometryHost {
  protected readonly presets = PRESETS;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(IconGeometryHost);
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

function fontPx(el: Element): number {
  return parseFloat(computedValue(el, 'font-size'));
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxIcon geometry', () => {
  it.each(PRESETS)('sizes the %s preset to %fem of the context font size', (size, em) => {
    const icon = query(mount(), `.p-${size}`);
    expect(fontPx(icon)).toBeCloseTo(em * CONTEXT_PX, 0);
    // A projected svg fills the host box: 1em of the icon's own font size.
    const box = icon.getBoundingClientRect();
    expect(Math.abs(box.height - em * CONTEXT_PX)).toBeLessThanOrEqual(0.5);
  });

  it('resolves the active size token on the host instead of computing it away', () => {
    const icon = query(mount(), '.p-md');
    expect(computedValue(icon, '--cngx-icon-size')).toBe('1.25em');
  });

  it('defaults to the md preset', () => {
    expect(fontPx(query(mount(), '.p-default'))).toBeCloseTo(1.25 * CONTEXT_PX, 0);
  });

  it('picks up a scale-token override set on an ancestor', () => {
    expect(fontPx(query(mount(), '.o-ancestor'))).toBeCloseTo(2 * CONTEXT_PX, 0);
  });

  it('lets an inline --cngx-icon-size beat the preset, in px and in em', () => {
    const root = mount();
    expect(fontPx(query(root, '.o-inline'))).toBeCloseTo(24, 0);
    expect(fontPx(query(root, '.o-inline-em'))).toBeCloseTo(2.5 * CONTEXT_PX, 0);
  });
});
