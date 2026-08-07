import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxMultiChipGroup } from './multi-chip-group.component';

// Runs in a real Chromium (the `test-geometry` target). The `@scope
// (.cngx-multi-chip-group)` block (multi-chip-group.component.css:37) stacks
// its projected chips in an inline-flex column and floors the gap to the
// adjacent-target minimum via `max(scale-gap, --cngx-target-gap)`; the
// `--horizontal` modifier flips to a wrapping row. jsdom reports `''` for
// every read.

let mountedRoot: HTMLElement | null = null;

@Component({
  standalone: true,
  imports: [CngxMultiChipGroup],
  template: `<cngx-multi-chip-group [orientation]="orientation" />`,
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
  const host = mountedRoot.querySelector('.cngx-multi-chip-group');
  if (!host) {
    throw new Error('cngx-multi-chip-group did not render');
  }
  return host as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxMultiChipGroup geometry', () => {
  it('is an inline-flex container with a scale-derived gap', () => {
    const host = mount('horizontal');
    expect(computedValue(host, 'display')).toBe('inline-flex');
    host.style.setProperty('--cngx-space-sm', '14px');
    expect(computedValue(host, 'gap')).toBe('14px');
  });

  it('floors the gap to the adjacent-target minimum (WCAG 2.5.8)', () => {
    const host = mount('horizontal');
    host.style.setProperty('--cngx-space-sm', '8px');
    host.style.setProperty('--cngx-target-gap', '24px');
    expect(computedValue(host, 'gap')).toBe('24px');
  });

  it('flips to a wrapping row in the horizontal variant', () => {
    const host = mount('horizontal');
    expect(computedValue(host, 'flex-direction')).toBe('row');
    expect(computedValue(host, 'flex-wrap')).toBe('wrap');
  });
});
