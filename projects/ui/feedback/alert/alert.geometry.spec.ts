import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxAlert } from './alert';

// Runs in a real Chromium (the `test-geometry` target). The layout the
// `@scope (.cngx-alert)` block SETs (alert.css): the alert is a top-aligned flex
// row (icon, body, dismiss), the body grows and may shrink past its intrinsic
// width so a long message wraps instead of pushing the dismiss off the edge, and
// the dismiss (a cngxCloseButton) keeps its box while its hit area floors to the
// pointer-derived target. This one spec sits in `feedback/alert/`, which also
// carries `alert-stack.css` under the folder-level coverage heuristic. jsdom
// reports `''` for every one of these reads.

@Component({
  selector: 'cngx-alert-geometry-host',
  standalone: true,
  imports: [CngxAlert],
  template: `<cngx-alert [severity]="'info'" [closable]="true">Something happened</cngx-alert>`,
})
class AlertHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(AlertHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const host = mountedRoot.querySelector('.cngx-alert');
  if (!host) {
    throw new Error('cngx-alert did not render');
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

describe('CngxAlert geometry', () => {
  it('lays the alert out as a top-aligned flex row', () => {
    const host = mount();
    expect(computedValue(host, 'display')).toBe('flex');
    expect(computedValue(host, 'align-items')).toBe('flex-start');
  });

  it('grows the body and lets it shrink below its intrinsic width', () => {
    const host = mount();
    const body = query(host, '.cngx-alert__body');
    expect(computedValue(body, 'flex-grow')).toBe('1');
    expect(computedValue(body, 'min-width')).toBe('0px');
  });

  it('floors the dismiss hit area to the pointer-derived minimum', () => {
    const host = mount();
    const dismiss = query(host, '.cngx-alert__dismiss');
    // The dismiss is a cngxCloseButton: its visual box keeps its size and the
    // centred ::before hit area is max(100%, var(--cngx-target-min, 0px)), inert
    // on a fine pointer and lifted to the floor on a coarse one.
    // 100% resolves against the padding box (the containing block of the
    // absolutely positioned pseudo-element), so it is compared to clientWidth.
    const box = dismiss.getBoundingClientRect();
    const hit = (prop: 'inline-size' | 'block-size') =>
      parseFloat(getComputedStyle(dismiss, '::before').getPropertyValue(prop));
    expect(Math.abs(hit('inline-size') - dismiss.clientWidth)).toBeLessThanOrEqual(1);
    expect(Math.abs(hit('block-size') - dismiss.clientHeight)).toBeLessThanOrEqual(1);
    expect(hit('inline-size')).toBeLessThan(44);
    host.style.setProperty('--cngx-target-min', '44px');
    expect(hit('inline-size')).toBe(44);
    expect(hit('block-size')).toBe(44);
    expect(dismiss.getBoundingClientRect().width).toBeCloseTo(box.width, 0);
  });
});
