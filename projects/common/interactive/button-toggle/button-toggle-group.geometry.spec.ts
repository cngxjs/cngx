import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxButtonToggleGroup } from './button-toggle-group.component';
import { CngxButtonToggle } from './button-toggle.directive';

// Runs in a real Chromium (the `test-geometry` target). The `@scope
// (.cngx-button-toggle-group, .cngx-button-multi-toggle-group)` block
// (button-toggle-group.component.css:46) lays the toggles out as a zero-gap
// inline-flex row so they read as one segmented control; the absence of the
// `--horizontal` class flips the axis to a column via `:scope:not(...)`. jsdom
// reports `''` for every read.

let mountedRoot: HTMLElement | null = null;

@Component({
  standalone: true,
  imports: [CngxButtonToggleGroup],
  template: `<cngx-button-toggle-group [orientation]="orientation" />`,
})
class GroupHost {
  orientation: 'horizontal' | 'vertical' = 'horizontal';
}

function mount(orientation: 'horizontal' | 'vertical' = 'horizontal'): HTMLElement {
  const fixture = TestBed.createComponent(GroupHost);
  fixture.componentInstance.orientation = orientation;
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-button-toggle-group');
  if (!host) {
    throw new Error('cngx-button-toggle-group did not render');
  }
  return host as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxButtonToggleGroup geometry', () => {
  it('lays the toggles out as a zero-gap segmented row', () => {
    const host = mount('horizontal');
    expect(computedValue(host, 'display')).toBe('inline-flex');
    expect(computedValue(host, 'flex-direction')).toBe('row');
    // Zero gap so adjacent toggles share an edge (segmented-control look).
    expect(computedValue(host, 'gap')).toBe('0px');
  });

  it('flips to a column when the horizontal class is absent', () => {
    const host = mount('vertical');
    expect(computedValue(host, 'flex-direction')).toBe('column');
  });
});

// The group radius is registered with a fixed initial, so a use-site fallback
// never paints: the theme reaches it only through the SET.
describe('CngxButtonToggleGroup theme-derived radius', () => {
  it('derives the group radius from the md radius', () => {
    const host = mount();
    mountedRoot!.style.setProperty('--cngx-radius-md', '5px');
    expect(computedValue(host, 'border-top-left-radius')).toBe('5px');
  });
});

@Component({
  standalone: true,
  imports: [CngxButtonToggleGroup, CngxButtonToggle],
  styleUrls: ['../../theming/components/cngx-button-toggle.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <cngx-button-toggle-group [orientation]="orientation">
      <button cngxButtonToggle value="a">A</button>
      <button cngxButtonToggle value="b">B</button>
      <button cngxButtonToggle value="c">C</button>
    </cngx-button-toggle-group>
  `,
})
class SegmentHost {
  orientation: 'horizontal' | 'vertical' = 'horizontal';
}

function segments(orientation: 'horizontal' | 'vertical'): HTMLElement[] {
  const fixture = TestBed.createComponent(SegmentHost);
  fixture.componentInstance.orientation = orientation;
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return Array.from(mountedRoot.querySelectorAll<HTMLElement>('button.cngx-button-toggle'));
}

// Each segment draws a 1px border; adjacent segments share one seam.
describe('CngxButtonToggle segment seams', () => {
  it('collapses each shared seam in a row to one border', () => {
    const [first, second, third] = segments('horizontal');
    expect(computedValue(first, 'border-left-width')).toBe('1px');
    expect(computedValue(second, 'border-left-width')).toBe('0px');
    expect(computedValue(third, 'border-left-width')).toBe('0px');
    expect(computedValue(third, 'border-right-width')).toBe('1px');
  });

  it('keeps both inline edges on a column segment', () => {
    const [, second] = segments('vertical');
    expect(computedValue(second, 'border-left-width')).toBe('1px');
  });
});
