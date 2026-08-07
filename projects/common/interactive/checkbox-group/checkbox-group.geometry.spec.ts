import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxCheckboxGroup } from './checkbox-group.component';

// Runs in a real Chromium (the `test-geometry` target). The `@scope
// (.cngx-checkbox-group)` block (checkbox-group.component.css:32) stacks its
// projected checkboxes in an inline-flex column with a scale-derived gap; the
// `--horizontal` modifier flips to a wrapping row. jsdom reports `''` for
// every read.

let mountedRoot: HTMLElement | null = null;

@Component({
  standalone: true,
  imports: [CngxCheckboxGroup],
  template: `<cngx-checkbox-group [orientation]="orientation" />`,
})
class GroupHost {
  orientation: 'horizontal' | 'vertical' = 'vertical';
}

function mount(orientation: 'horizontal' | 'vertical' = 'vertical'): HTMLElement {
  const fixture = TestBed.createComponent(GroupHost);
  fixture.componentInstance.orientation = orientation;
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-checkbox-group');
  if (!host) {
    throw new Error('cngx-checkbox-group did not render');
  }
  return host as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxCheckboxGroup geometry', () => {
  it('stacks children in a column with a scale-derived gap', () => {
    const host = mount('vertical');
    expect(computedValue(host, 'display')).toBe('inline-flex');
    expect(computedValue(host, 'flex-direction')).toBe('column');
    host.style.setProperty('--cngx-space-sm', '12px');
    expect(computedValue(host, 'gap')).toBe('12px');
  });

  it('flips to a wrapping row in the horizontal variant', () => {
    const host = mount('horizontal');
    expect(computedValue(host, 'flex-direction')).toBe('row');
    expect(computedValue(host, 'flex-wrap')).toBe('wrap');
  });
});
