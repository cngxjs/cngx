import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxAsyncClick } from '@cngx/common/interactive';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target). cngx-async.css paints
// the state classes CngxAsyncClick sets on its host, so a settled run must read
// the success or the danger tint. The buttons run the real directive: a
// selector that drifts from the emitted class name fails here.

@Component({
  selector: 'cngx-async-state-tint-host',
  standalone: true,
  imports: [CngxAsyncClick],
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/system-tokens.css',
    '../../../core/theming/reset.css',
    '../../../core/theming/base.css',
    './cngx-async.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <button type="button" class="ok" [cngxAsyncClick]="succeed" [feedbackDuration]="60000">
      Save
    </button>
    <button type="button" class="fail" [cngxAsyncClick]="fail" [feedbackDuration]="60000">
      Save
    </button>
    <button type="button" class="idle" [cngxAsyncClick]="succeed">Save</button>
    <span class="probe-success" style="color: var(--cngx-color-success)"></span>
    <span class="probe-danger" style="color: var(--cngx-color-danger)"></span>
  `,
})
class TintHost {
  readonly succeed = () => Promise.resolve();
  readonly fail = () => Promise.reject(new Error('nope'));
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(TintHost);
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

async function settle(root: HTMLElement, selector: string, stateClass: string): Promise<HTMLElement> {
  const el = one(root, selector);
  el.click();
  await vi.waitFor(() => {
    TestBed.tick();
    expect(el.classList.contains(stateClass)).toBe(true);
  });
  await Promise.all(el.getAnimations().map((a) => a.finished));
  return el;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('cngx-async state tint', () => {
  it('paints the success tint on a settled run', async () => {
    const root = mount();
    const success = computedValue(one(root, '.probe-success'), 'color');
    const idleBg = computedValue(one(root, '.idle'), 'background-color');
    const el = await settle(root, '.ok', 'cngx-async--success');
    expect(computedValue(el, 'border-top-color')).toBe(success);
    expect(computedValue(el, 'background-color')).not.toBe(idleBg);
  });

  it('paints the danger tint on a failed run', async () => {
    const root = mount();
    const danger = computedValue(one(root, '.probe-danger'), 'color');
    const idleBg = computedValue(one(root, '.idle'), 'background-color');
    const el = await settle(root, '.fail', 'cngx-async--error');
    expect(computedValue(el, 'border-top-color')).toBe(danger);
    expect(computedValue(el, 'background-color')).not.toBe(idleBg);
  });
});
