import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CngxToaster, provideToasts } from './toast.service';
import { CngxToastOutlet } from './toast-outlet';

// Runs in a real Chromium (the `test-geometry` target). The layout the
// `@scope (.cngx-toast-outlet)` block SETs (toast-outlet.css): the outlet is a
// fixed-position vertical flex column that stacks its toasts, and each toast is a
// top-aligned flex row whose body grows and may shrink past its intrinsic width.
// jsdom reports `''` for every one of these reads.

@Component({
  selector: 'cngx-toast-outlet-geometry-host',
  standalone: true,
  imports: [CngxToastOutlet],
  template: `<cngx-toast-outlet />`,
})
class ToastOutletHost {}

let mountedRoot: HTMLElement | null = null;

function mount(pushToast: boolean): HTMLElement {
  const fixture = TestBed.createComponent(ToastOutletHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  if (pushToast) {
    TestBed.inject(CngxToaster).show({ message: 'Saved' });
    fixture.detectChanges();
  }
  const outlet = mountedRoot.querySelector('.cngx-toast-outlet');
  if (!outlet) {
    throw new Error('cngx-toast-outlet did not render');
  }
  return outlet as HTMLElement;
}

function query(root: HTMLElement, selector: string): HTMLElement {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el as HTMLElement;
}

beforeEach(() => {
  TestBed.configureTestingModule({ providers: [provideToasts()] });
});

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxToastOutlet geometry', () => {
  it('pins the outlet fixed and stacks toasts in a vertical flex column', () => {
    // The host lays out even while empty - it is the fixed viewport anchor the
    // toasts stack inside.
    const outlet = mount(false);
    expect(computedValue(outlet, 'position')).toBe('fixed');
    expect(computedValue(outlet, 'display')).toBe('flex');
    expect(computedValue(outlet, 'flex-direction')).toBe('column');
  });

  it('lays a pushed toast out as a top-aligned flex row with a growing body', () => {
    const outlet = mount(true);
    const toast = query(outlet, '.cngx-toast');
    expect(computedValue(toast, 'display')).toBe('flex');
    expect(computedValue(toast, 'align-items')).toBe('flex-start');
    const body = query(outlet, '.cngx-toast__body');
    expect(computedValue(body, 'flex-grow')).toBe('1');
    expect(computedValue(body, 'min-width')).toBe('0px');
  });
});
