/// <reference types="@vitest/browser-playwright" />

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxToaster, provideToasts } from './toast.service';
import { CngxToastOutlet } from './toast-outlet';

// Runs in a real Chromium (the `test-geometry` target). The layout the
// `@scope (.cngx-toast-outlet)` block SETs (toast-outlet.css): the outlet is a
// fixed-position vertical flex column that stacks its toasts, and each toast is a
// top-aligned flex row whose body grows and may shrink past its intrinsic width.
// The toast draws on the overlay surface: a full 1px border instead of a
// severity stripe, the popover-panel shadow, and the action on its own row
// below the body. jsdom reports `''` for every one of these reads.

const SCHEMES = ['light', 'dark'] as const;
const SIDES = ['top', 'right', 'bottom', 'left'] as const;

@Component({
  selector: 'cngx-toast-outlet-geometry-host',
  standalone: true,
  imports: [CngxToastOutlet],
  template: `<cngx-toast-outlet />`,
})
class ToastOutletHost {}

let mountedRoot: HTMLElement | null = null;

function mount(pushToast: boolean, withAction = false): HTMLElement {
  const fixture = TestBed.createComponent(ToastOutletHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  if (pushToast) {
    TestBed.inject(CngxToaster).show({
      message: 'Saved',
      severity: 'success',
      action: withAction ? { label: 'Undo', handler: () => undefined } : undefined,
    });
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

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.documentElement.removeAttribute('data-color-scheme');
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
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

  it('draws four equal 1px borders and no severity stripe', () => {
    const toast = query(mount(true), '.cngx-toast');
    for (const side of SIDES) {
      expect(computedValue(toast, `border-${side}-style`), side).toBe('solid');
      expect(computedValue(toast, `border-${side}-width`), side).toBe('1px');
    }
    expect(computedValue(toast, 'border-inline-start-width')).toBe(
      computedValue(toast, 'border-inline-end-width'),
    );
    expect(computedValue(toast, 'border-inline-start-color')).toBe(
      computedValue(toast, 'border-top-color'),
    );
  });

  it('casts the overlay shadow', () => {
    const toast = query(mount(true), '.cngx-toast');
    expect(computedValue(toast, 'box-shadow')).not.toBe('none');
  });

  // The border token is set on :root and the scheme hooks and read on the
  // toast, so it must inherit down to .cngx-toast.
  it('resolves the border from the root and the dark scheme hook', () => {
    const light = computedValue(query(mount(true), '.cngx-toast'), 'border-top-color');
    expect(light).toBe('oklch(0 0 0 / 0.08)');
    mountedRoot?.remove();
    document.documentElement.setAttribute('data-color-scheme', 'dark');
    const dark = computedValue(query(mount(true), '.cngx-toast'), 'border-top-color');
    expect(dark).toBe('oklch(1 0 0 / 0.12)');
  });

  it('puts the action on its own row below the body text', () => {
    const outlet = mount(true, true);
    const message = query(outlet, '.cngx-toast__message');
    const action = query(outlet, '.cngx-toast__action');
    expect(computedValue(action, 'display')).toBe('flex');
    const gap = parseFloat(computedValue(action, '--cngx-toast-actions-gap'));
    expect(gap).toBeGreaterThan(0);
    const above = message.getBoundingClientRect();
    const box = action.getBoundingClientRect();
    expect(box.top - above.bottom).toBeGreaterThanOrEqual(gap - 0.5);
    expect(box.left).toBeCloseTo(above.left, 0);
  });

  it('draws the action border in its label colour', () => {
    const action = query(mount(true, true), '.cngx-toast__action');
    expect(computedValue(action, 'border-top-style')).toBe('solid');
    expect(computedValue(action, 'border-top-color')).toBe(computedValue(action, 'color'));
  });
});

// Without a forced-colors block the toast relies on its real border: the UA
// drops the shadow, and the border must still draw a visible edge.
describe.each(SCHEMES)('CngxToastOutlet geometry under forced colors, %s', (scheme) => {
  it('keeps a solid, visible 1px border', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'forced-colors', value: 'active' },
        { name: 'prefers-color-scheme', value: scheme },
      ],
    });
    const toast = query(mount(true), '.cngx-toast');
    expect(computedValue(toast, 'border-top-style')).toBe('solid');
    expect(computedValue(toast, 'border-top-width')).toBe('1px');
    expect(computedValue(toast, 'border-top-color')).not.toBe('rgba(0, 0, 0, 0)');
    expect(computedValue(toast, 'border-top-color')).not.toBe('transparent');
  });
});
