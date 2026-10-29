import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxButton } from '@cngx/common/button';
import { CngxAsyncClick } from '@cngx/common/interactive';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target) against the compiled
// async-click Material bridge (async-click-bridge.spec-host.scss). The hosts
// bind `[cngxAsyncClick]="fn"`, the only form the directive is used in: a
// property binding with no attribute in the DOM. A bridge selector that
// matches nothing leaves the `--cngx-async-*` tokens unset and the semantic
// tint paints, so these probes read the bridged Material roles on the host.

@Component({
  selector: 'cngx-async-click-bridge-host',
  standalone: true,
  imports: [CngxAsyncClick, CngxButton],
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/system-tokens.css',
    '../../../core/theming/reset.css',
    '../../../core/theming/base.css',
    '../../button/button.component.css',
    './cngx-async.css',
    './async-click-bridge.spec-host.scss',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <button type="button" class="ok" [cngxAsyncClick]="succeed" [feedbackDuration]="60000">
      Save
    </button>
    <button type="button" class="fail" [cngxAsyncClick]="fail" [feedbackDuration]="60000">
      Save
    </button>
    <button cngxButton class="ref">Save</button>
    <button cngxButton class="btn-ok" [cngxAsyncClick]="succeed" [feedbackDuration]="60000">
      Save
    </button>
    <span class="probe-primary" style="color: var(--mat-sys-primary)"></span>
    <span
      class="probe-primary-bg"
      style="color: color-mix(in srgb, var(--mat-sys-primary) 12%, transparent)"
    ></span>
    <span class="probe-error" style="color: var(--mat-sys-error)"></span>
  `,
})
class AsyncClickBridgeHost {
  readonly succeed = (): Promise<void> => Promise.resolve();
  readonly fail = (): Promise<void> => Promise.reject(new Error('nope'));
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(AsyncClickBridgeHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function one(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

async function settle(el: HTMLElement, stateClass: string): Promise<HTMLElement> {
  el.click();
  await vi.waitFor(() => {
    TestBed.tick();
    expect(el.classList.contains(stateClass)).toBe(true);
  });
  await Promise.all(el.getAnimations().map((a) => a.finished));
  return el;
}

// The geometry specs share one page, and earlier specs leave the real pointer
// wherever they hovered last; a host mounted under it paints its hover state.
async function atRest(el: HTMLElement): Promise<HTMLElement> {
  await userEvent.unhover(el);
  await Promise.all(el.getAnimations().map((a) => a.finished));
  return el;
}

const PAINT = ['background-color', 'color', 'border-top-color'] as const;

function paintOf(el: HTMLElement): Record<string, string> {
  return Object.fromEntries(PAINT.map((p) => [p, computedValue(el, p)]));
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('async-click Material bridge, rendered', () => {
  it('resolves the bridged tokens on a bare host at rest', () => {
    const root = mount();
    const host = one(root, '.ok');
    expect(host.classList.contains('cngx-async')).toBe(true);
    expect(host.hasAttribute('cngxAsyncClick')).toBe(false);
    const style = getComputedStyle(host);
    expect(style.getPropertyValue('--cngx-async-success-color').trim()).not.toBe('');
    expect(style.getPropertyValue('--cngx-async-error-color').trim()).not.toBe('');
  });

  it('paints a settled success in the Material primary role', async () => {
    const root = mount();
    const el = await settle(one(root, '.ok'), 'cngx-async--success');
    const primary = computedValue(one(root, '.probe-primary'), 'color');
    expect(computedValue(el, 'color')).toBe(primary);
    expect(computedValue(el, 'border-top-color')).toBe(primary);
    expect(computedValue(el, 'background-color')).toBe(
      computedValue(one(root, '.probe-primary-bg'), 'color'),
    );
  });

  it('paints a settled failure in the Material error role', async () => {
    const root = mount();
    const el = await settle(one(root, '.fail'), 'cngx-async--error');
    const error = computedValue(one(root, '.probe-error'), 'color');
    expect(computedValue(el, 'color')).toBe(error);
    expect(computedValue(el, 'border-top-color')).toBe(error);
  });

  it('reaches a cngxButton host without repainting it', async () => {
    const root = mount();
    const el = await settle(one(root, '.btn-ok'), 'cngx-async--success');
    expect(el.classList.contains('cngx-async')).toBe(true);
    expect(getComputedStyle(el).getPropertyValue('--cngx-async-success-color').trim()).not.toBe('');
    const ref = await atRest(one(root, '.ref'));
    expect(paintOf(await atRest(el))).toEqual(paintOf(ref));
  });
});
