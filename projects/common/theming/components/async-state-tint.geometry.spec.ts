import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxButton } from '@cngx/common/button';
import { CngxAsyncClick } from '@cngx/common/interactive';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target). cngx-async.css paints
// the state classes CngxAsyncClick sets on its host, so a settled run must read
// the success or the danger tint. The buttons run the real directive: a
// selector that drifts from the emitted class name fails here.
//
// The colour tokens are registered without an initial value. A registered
// literal would never let the `var(--cngx-async-*, ...)` fallback fire, so the
// tint would stay light in the dark scheme; the per-scheme probes catch that.
//
// The button family owns the paint of its own states, so a `.cngx-button` host
// keeps its variant paint through every phase and shows its own busy treatment
// while pending. ButtonHost pins that against a twin without cngxAsyncClick.

const SCHEMES = ['light', 'dark'] as const;

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
    @for (scheme of schemes; track scheme) {
      <div [attr.data-color-scheme]="scheme" [class]="'scheme-' + scheme">
        <button type="button" class="ok" [cngxAsyncClick]="succeed" [feedbackDuration]="60000">
          Save
        </button>
        <button type="button" class="fail" [cngxAsyncClick]="fail" [feedbackDuration]="60000">
          Save
        </button>
        <button type="button" class="busy" [cngxAsyncClick]="hang">Save</button>
        <span
          class="probe-success-bg"
          style="color: color-mix(in oklab, var(--cngx-color-success) 12%, transparent)"
        ></span>
        <span
          class="probe-success-text"
          style="color: color-mix(in oklab, var(--cngx-color-success) 75%, var(--cngx-color-text))"
        ></span>
        <span class="probe-success" style="color: var(--cngx-color-success)"></span>
        <span
          class="probe-danger-bg"
          style="color: color-mix(in oklab, var(--cngx-color-danger) 12%, transparent)"
        ></span>
        <span class="probe-danger-text" style="color: var(--cngx-color-danger-text)"></span>
        <span class="probe-danger" style="color: var(--cngx-color-danger)"></span>
      </div>
    }
    <div
      class="themed"
      style="--cngx-async-success-bg: rgb(1, 2, 3); --cngx-async-error-color: rgb(4, 5, 6)"
    >
      <button type="button" class="ok" [cngxAsyncClick]="succeed" [feedbackDuration]="60000">
        Save
      </button>
      <button type="button" class="fail" [cngxAsyncClick]="fail" [feedbackDuration]="60000">
        Save
      </button>
    </div>
  `,
})
class TintHost {
  readonly schemes = SCHEMES;
  readonly succeed = () => Promise.resolve();
  readonly fail = () => Promise.reject(new Error('nope'));
  readonly hang = () => new Promise<void>(() => undefined);
}

@Component({
  selector: 'cngx-async-state-button-host',
  standalone: true,
  imports: [CngxAsyncClick, CngxButton],
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/system-tokens.css',
    '../../../core/theming/reset.css',
    '../../../core/theming/base.css',
    '../../button/button.component.css',
    './cngx-async.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <p class="solid">
      <button cngxButton class="ref">Save</button>
      <button cngxButton class="ok" [cngxAsyncClick]="succeed" [feedbackDuration]="60000">
        Save
      </button>
      <button cngxButton class="fail" [cngxAsyncClick]="fail" [feedbackDuration]="60000">
        Save
      </button>
      <button cngxButton class="busy" [cngxAsyncClick]="hang">Save</button>
    </p>
    <p class="outline-danger">
      <button cngxButton="outline" tone="danger" class="ref">Save</button>
      <button
        cngxButton="outline"
        tone="danger"
        class="ok"
        [cngxAsyncClick]="succeed"
        [feedbackDuration]="60000"
      >
        Save
      </button>
      <button
        cngxButton="outline"
        tone="danger"
        class="fail"
        [cngxAsyncClick]="fail"
        [feedbackDuration]="60000"
      >
        Save
      </button>
      <button cngxButton="outline" tone="danger" class="busy" [cngxAsyncClick]="hang">Save</button>
    </p>
  `,
})
class ButtonHost {
  readonly succeed = () => Promise.resolve();
  readonly fail = () => Promise.reject(new Error('nope'));
  readonly hang = () => new Promise<void>(() => undefined);
}

let mountedRoot: HTMLElement | null = null;

function mount(host: typeof TintHost | typeof ButtonHost = TintHost): HTMLElement {
  const fixture = TestBed.createComponent(host);
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

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe.each(SCHEMES)('cngx-async state tint, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);
  const probe = (root: HTMLElement, name: string): string =>
    computedValue(at(root, `.probe-${name}`), 'color');

  it('paints the success tint from the semantic palette', async () => {
    const root = mount();
    const el = await settle(at(root, '.ok'), 'cngx-async--success');
    expect(computedValue(el, 'background-color')).toBe(probe(root, 'success-bg'));
    expect(computedValue(el, 'color')).toBe(probe(root, 'success-text'));
    expect(computedValue(el, 'border-top-color')).toBe(probe(root, 'success'));
  });

  it('paints the danger tint from the semantic palette', async () => {
    const root = mount();
    const el = await settle(at(root, '.fail'), 'cngx-async--error');
    expect(computedValue(el, 'background-color')).toBe(probe(root, 'danger-bg'));
    expect(computedValue(el, 'color')).toBe(probe(root, 'danger-text'));
    expect(computedValue(el, 'border-top-color')).toBe(probe(root, 'danger'));
  });

  it('dims a pending run by the registered pending opacity', async () => {
    const root = mount();
    const el = await settle(at(root, '.busy'), 'cngx-async--pending');
    expect(computedValue(el, 'opacity')).toBe('0.7');
    expect(computedValue(el, 'cursor')).toBe('wait');
  });
});

describe('cngx-async state tint, themed', () => {
  it('lets an ancestor SET of a colour token reach the state host', async () => {
    const root = mount();
    const ok = await settle(one(root, '.themed .ok'), 'cngx-async--success');
    expect(computedValue(ok, 'background-color')).toBe('rgb(1, 2, 3)');
    const fail = await settle(one(root, '.themed .fail'), 'cngx-async--error');
    expect(computedValue(fail, 'color')).toBe('rgb(4, 5, 6)');
  });
});

const PAINT = ['background-color', 'color', 'border-top-color'] as const;

function paintOf(el: HTMLElement): Record<string, string> {
  return Object.fromEntries(PAINT.map((p) => [p, computedValue(el, p)]));
}

describe.each(['solid', 'outline-danger'])('cngx-async on a cngxButton host, %s', (variant) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.${variant} ${selector}`);

  it('keeps the variant paint after a successful run', async () => {
    const root = mount(ButtonHost);
    const el = await settle(at(root, '.ok'), 'cngx-async--success');
    expect(paintOf(el)).toEqual(paintOf(at(root, '.ref')));
  });

  it('keeps the variant paint after a failed run', async () => {
    const root = mount(ButtonHost);
    const el = await settle(at(root, '.fail'), 'cngx-async--error');
    expect(paintOf(el)).toEqual(paintOf(at(root, '.ref')));
  });

  it('shows the button busy treatment, not the pending dim', async () => {
    const root = mount(ButtonHost);
    const el = await settle(at(root, '.busy'), 'cngx-async--pending');
    expect(el.getAttribute('data-busy')).toBe('true');
    expect(computedValue(el, 'opacity')).toBe('1');
    expect(computedValue(el, 'cursor')).toBe('progress');
    expect(paintOf(el)).toEqual(paintOf(at(root, '.ref')));
  });
});
