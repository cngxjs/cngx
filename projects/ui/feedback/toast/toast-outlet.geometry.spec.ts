/// <reference types="@vitest/browser-playwright" />

import { Component, type TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxToaster, provideToasts } from './toast.service';
import { CngxToastOutlet } from './toast-outlet';

// Runs in a real Chromium (the `test-geometry` target). The layout the
// `@scope (.cngx-toast-outlet)` block SETs (toast-outlet.css): the outlet is a
// fixed-position vertical flex column that stacks its toasts, and each toast is a
// flex row whose body grows and may shrink past its intrinsic width. The toast
// draws on the overlay surface: a full 1px border instead of a severity stripe,
// the popover-panel shadow, and the action trailing the text block, centred on
// it. A title-less toast centres on one line; with a title the icon stays level
// with the title. jsdom reports `''` for every one of these reads.

const SCHEMES = ['light', 'dark'] as const;
const SIDES = ['top', 'right', 'bottom', 'left'] as const;

@Component({
  selector: 'cngx-toast-outlet-geometry-host',
  standalone: true,
  imports: [CngxToastOutlet],
  template: `
    <cngx-toast-outlet />
    <ng-template #multiRoot>
      <span class="root-a">First line of a projected body</span>
      <p class="root-b">Second root node</p>
      <p class="root-c">Third root node</p>
    </ng-template>
  `,
})
class ToastOutletHost {
  readonly multiRoot = viewChild.required<TemplateRef<unknown>>('multiRoot');
}

let mountedRoot: HTMLElement | null = null;

function mount(
  pushToast: boolean,
  withAction = false,
  title?: string,
  multiRoot = false,
): HTMLElement {
  const fixture = TestBed.createComponent(ToastOutletHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  if (pushToast) {
    TestBed.inject(CngxToaster).show({
      message: 'Saved',
      title,
      severity: 'success',
      action: withAction ? { label: 'Undo', handler: () => undefined } : undefined,
      contentTemplate: multiRoot ? fixture.componentInstance.multiRoot() : undefined,
    });
    fixture.detectChanges();
  }
  const outlet = mountedRoot.querySelector('.cngx-toast-outlet');
  if (!outlet) {
    throw new Error('cngx-toast-outlet did not render');
  }
  return outlet as HTMLElement;
}

function centreOffset(root: HTMLElement, a: string, b: string): number {
  const middle = (r: DOMRect): number => r.top + r.height / 2;
  return Math.abs(
    middle(query(root, a).getBoundingClientRect()) - middle(query(root, b).getBoundingClientRect()),
  );
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

  it('lays a pushed toast out as a flex row with a growing body', () => {
    const outlet = mount(true);
    const toast = query(outlet, '.cngx-toast');
    expect(computedValue(toast, 'display')).toBe('flex');
    expect(computedValue(toast, 'align-items')).toBe('center');
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

  it('puts the action after the text, centred on the text line', () => {
    const outlet = mount(true, true);
    const message = query(outlet, '.cngx-toast__message');
    const action = query(outlet, '.cngx-toast__action');
    const gap = parseFloat(computedValue(action, '--cngx-toast-actions-gap'));
    expect(gap).toBeGreaterThan(0);
    const text = message.getBoundingClientRect();
    const box = action.getBoundingClientRect();
    expect(box.left - text.right).toBeGreaterThanOrEqual(gap - 0.5);
    const middle = (r: DOMRect): number => r.top + r.height / 2;
    expect(Math.abs(middle(box) - middle(text))).toBeLessThanOrEqual(1);
  });

  it('centres a title-less toast on one line', () => {
    const outlet = mount(true, true);
    const toast = query(outlet, '.cngx-toast');
    expect(computedValue(toast, 'align-items')).toBe('center');
    const middle = (el: HTMLElement): number => {
      const r = el.getBoundingClientRect();
      return r.top + r.height / 2;
    };
    const icon = middle(query(outlet, '.cngx-toast__icon'));
    expect(Math.abs(icon - middle(query(outlet, '.cngx-toast__message')))).toBeLessThanOrEqual(1);
  });

  it('keeps the icon level with the title and centres the action on the text block', () => {
    const outlet = mount(true, true, 'Offline');
    const toast = query(outlet, '.cngx-toast');
    expect(computedValue(toast, 'align-items')).toBe('flex-start');
    expect(centreOffset(outlet, '.cngx-toast__action', '.cngx-toast__text')).toBeLessThanOrEqual(1);
  });

  // A projected template with several root nodes still lands in the text
  // block, so the action centres on all of them, not on the first.
  it('centres the action on a multi-root projected body', () => {
    const outlet = mount(true, true, 'Synced', true);
    const text = query(outlet, '.cngx-toast__text');
    for (const sel of ['.root-a', '.root-b', '.root-c']) {
      expect(text.contains(query(outlet, sel)), sel).toBe(true);
    }
    const action = query(outlet, '.cngx-toast__action').getBoundingClientRect();
    expect(action.left).toBeGreaterThanOrEqual(text.getBoundingClientRect().right);
    expect(centreOffset(outlet, '.cngx-toast__action', '.cngx-toast__text')).toBeLessThanOrEqual(1);
  });

  it('draws the action border in its label colour', () => {
    const action = query(mount(true, true), '.cngx-toast__action');
    expect(computedValue(action, 'border-top-style')).toBe('solid');
    expect(computedValue(action, 'border-top-color')).toBe(computedValue(action, 'color'));
  });
});

// The countdown bar the default skin draws from the outlet's timer hooks: a
// border along the bottom inner edge in the severity accent, scaled from the
// inline start.
describe('CngxToastOutlet countdown bar geometry', () => {
  function showTimed(
    config: {
      severity?: 'info' | 'success' | 'warning' | 'error';
      duration?: number | 'persistent';
    } = {},
  ): HTMLElement {
    const fixture = TestBed.createComponent(ToastOutletHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    TestBed.inject(CngxToaster).show({ message: 'Saved', duration: 5000, ...config });
    fixture.detectChanges();
    return mountedRoot;
  }

  // The registry publishes timer segments in a microtask, so the timer node
  // renders one change-detection pass after show().
  async function settle(): Promise<void> {
    await Promise.resolve();
    TestBed.tick();
  }

  afterEach(() => {
    document.documentElement.removeAttribute('data-motion');
    document.documentElement.removeAttribute('dir');
  });

  for (const severity of ['info', 'success', 'warning', 'error'] as const) {
    it(`draws a 2px bottom bar in the ${severity} accent`, async () => {
      const root = showTimed({ severity, duration: 5000 });
      await settle();
      const timer = query(root, '.cngx-toast__timer');
      const icon = query(root, '.cngx-toast__icon');
      expect(computedValue(timer, 'position')).toBe('absolute');
      expect(computedValue(timer, 'bottom')).toBe('0px');
      expect(computedValue(timer, 'border-bottom-style')).toBe('solid');
      expect(computedValue(timer, 'border-bottom-width')).toBe('2px');
      expect(computedValue(timer, 'border-bottom-color')).toBe(computedValue(icon, 'color'));
      expect(computedValue(timer, 'animation-name')).toBe('cngx-toast-timer');
      expect(computedValue(timer, 'animation-duration')).toBe('5s');
    });
  }

  it('renders no timer node on a persistent toast', async () => {
    const root = showTimed({ duration: 'persistent' });
    await settle();
    expect(root.querySelector('.cngx-toast__timer')).toBeNull();
  });

  it('pauses the bar animation while the timer is paused', async () => {
    const root = showTimed();
    await settle();
    query(root, '.cngx-toast').dispatchEvent(new PointerEvent('pointerenter'));
    await settle();
    expect(query(root, '.cngx-toast').getAttribute('data-timer')).toBe('paused');
    expect(computedValue(query(root, '.cngx-toast__timer'), 'animation-play-state')).toBe('paused');
  });

  it('turns the bar off with a zero height token', async () => {
    const root = showTimed();
    await settle();
    query(root, '.cngx-toast').style.setProperty('--cngx-toast-timer-height', '0px');
    const timer = query(root, '.cngx-toast__timer');
    expect(computedValue(timer, 'border-bottom-width')).toBe('0px');
    expect(timer.getBoundingClientRect().height).toBe(0);
  });

  it('hides the bar under the data-motion reduced axis', async () => {
    document.documentElement.setAttribute('data-motion', 'reduced');
    const root = showTimed();
    await settle();
    expect(computedValue(query(root, '.cngx-toast__timer'), 'display')).toBe('none');
  });

  it('hides the bar under the OS preference unless the root opts back into full motion', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
    const root = showTimed();
    await settle();
    const timer = query(root, '.cngx-toast__timer');
    expect(computedValue(timer, 'display')).toBe('none');
    document.documentElement.setAttribute('data-motion', 'full');
    expect(computedValue(timer, 'display')).not.toBe('none');
  });

  it('scales from the left edge in LTR and from the right edge in RTL', async () => {
    const ltr = query(showTimed(), '.cngx-toast');
    await settle();
    const ltrTimer = query(ltr, '.cngx-toast__timer');
    expect(computedValue(ltrTimer, 'transform-origin').split(' ')[0]).toBe('0px');
    mountedRoot?.remove();
    document.documentElement.setAttribute('dir', 'rtl');
    const rtl = query(showTimed(), '.cngx-toast');
    await settle();
    const rtlTimer = query(rtl, '.cngx-toast__timer');
    const width = rtlTimer.getBoundingClientRect().width;
    expect(parseFloat(computedValue(rtlTimer, 'transform-origin').split(' ')[0])).toBeCloseTo(
      width,
      0,
    );
  });

  it('keeps a visible border in the system text colour under forced colors', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'forced-colors', value: 'active' }],
    });
    const root = showTimed();
    await settle();
    const timer = query(root, '.cngx-toast__timer');
    expect(computedValue(timer, 'border-bottom-style')).toBe('solid');
    expect(parseFloat(computedValue(timer, 'border-bottom-width'))).toBeGreaterThan(0);
    expect(computedValue(timer, 'border-bottom-color')).not.toBe('rgba(0, 0, 0, 0)');
    expect(computedValue(timer, 'border-bottom-color')).toBe(
      computedValue(query(root, '.cngx-toast__message'), 'color'),
    );
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
