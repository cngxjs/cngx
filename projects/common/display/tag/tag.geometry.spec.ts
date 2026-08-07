import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxTag } from './tag.directive';

// Runs in a real Chromium (the `test-geometry` target). This guards the
// shared structural base `shared/tag-base.css` (linked first in CngxTag's
// styleUrls) via the parent-folder rule. Its `@scope (.cngx-tag)` block
// (tag-base.css:61) lays the tag out as an inline-flex pill, caps the width,
// and derives gap + padding from the `--cngx-space-*` scale. jsdom reports
// `''` for every read.

let mountedRoot: HTMLElement | null = null;

@Component({
  standalone: true,
  imports: [CngxTag],
  template: `<cngx-tag>Label</cngx-tag>`,
})
class TagHost {}

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(TagHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-tag');
  if (!host) {
    throw new Error('cngx-tag did not render');
  }
  return host as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxTag geometry (shared tag-base)', () => {
  it('lays the tag out as a width-capped inline-flex pill', () => {
    const host = mount();
    expect(computedValue(host, 'display')).toBe('inline-flex');
    expect(computedValue(host, 'align-items')).toBe('center');
    // max-width: 100% keeps the pill inside its container.
    expect(computedValue(host, 'max-width')).toBe('100%');
  });

  it('derives the inner gap from the scale', () => {
    const host = mount();
    // :scope SETs --cngx-tag-gap from var(--cngx-space-xs); driving the scale
    // token compacts the gap between prefix / label / suffix.
    host.style.setProperty('--cngx-space-xs', '6px');
    expect(computedValue(host, 'gap')).toBe('6px');
  });
});
