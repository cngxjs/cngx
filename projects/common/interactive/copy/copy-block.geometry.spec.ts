import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxCopyBlock } from './copy-block';

// Runs in a real Chromium (the `test-geometry` target). The `@scope
// (.cngx-copy-block)` block (copy-block.css:182) lays the content payload next
// to the copy button on one flex row: the content grows and may shrink past
// its intrinsic width (min-width:0) while the button stays intrinsic and its
// tap area floors off `--cngx-target-min`. jsdom reports `''` for every read.

let mountedRoot: HTMLElement | null = null;

@Component({
  standalone: true,
  imports: [CngxCopyBlock],
  template: `<cngx-copy-block [value]="'npm i @cngx/common'"><code>npm i @cngx/common</code></cngx-copy-block>`,
})
class CopyHost {}

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(CopyHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-copy-block');
  if (!host) {
    throw new Error('cngx-copy-block did not render');
  }
  return host as HTMLElement;
}

function query(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el as HTMLElement;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxCopyBlock geometry', () => {
  it('lays the content and button on one flex row', () => {
    const host = mount();
    expect(computedValue(host, 'display')).toBe('flex');
    expect(computedValue(host, 'align-items')).toBe('flex-start');
    // Content grows and may shrink below its intrinsic width.
    const content = query(host, '.cngx-copy-block__content');
    expect(computedValue(content, 'flex-grow')).toBe('1');
    expect(computedValue(content, 'min-width')).toBe('0px');
  });

  it('pins the button intrinsic and floors its tap area', () => {
    const host = mount();
    const button = query(host, '.cngx-copy-block__button');
    expect(computedValue(button, 'flex-shrink')).toBe('0');
    host.style.setProperty('--cngx-target-min', '44px');
    expect(computedValue(button, 'min-inline-size')).toBe('44px');
    expect(computedValue(button, 'min-block-size')).toBe('44px');
  });
});
