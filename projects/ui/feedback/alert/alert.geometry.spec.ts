import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxAlert } from './alert';

// Runs in a real Chromium (the `test-geometry` target). The layout the
// `@scope (.cngx-alert)` block SETs (alert.css): the alert is a top-aligned flex
// row (icon, body, dismiss), the body grows and may shrink past its intrinsic
// width so a long message wraps instead of pushing the dismiss off the edge, and
// the dismiss is a centred inline-flex box whose hit area floors to the
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
    // min-inline-size / min-block-size are var(--cngx-target-min, 0px): inert on a
    // fine pointer, lift to the floor on a coarse pointer so the close affordance
    // always meets the touch-target minimum.
    expect(computedValue(dismiss, 'min-inline-size')).toBe('0px');
    expect(computedValue(dismiss, 'min-block-size')).toBe('0px');
    host.style.setProperty('--cngx-target-min', '44px');
    expect(computedValue(dismiss, 'min-inline-size')).toBe('44px');
    expect(computedValue(dismiss, 'min-block-size')).toBe('44px');
  });
});
