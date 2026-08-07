import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxButtonToggleGroup } from './button-toggle-group.component';

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
