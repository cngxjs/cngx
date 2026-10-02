/// <reference types="@vitest/browser-playwright" />

import { CUSTOM_ELEMENTS_SCHEMA, Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). A disabled alert or
// banner action fades by colour (the 38% text recipe of a disabled field),
// never opacity, and its border follows; the native disabled button reads
// GrayText under forced colors from the UA. A pending banner keeps its dim
// while motion is allowed (the enter animation no longer pins opacity 1 after
// it ends). The toast repeat count de-emphasises with the muted text colour.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-feedback-disabled-colour-host',
  standalone: true,
  styleUrls: [
    '../../core/theming/system-tokens.css',
    './styles/feedback-severity.css',
    './alert/alert.css',
    './banner/banner-outlet.css',
    './toast/toast-outlet.css',
  ],
  encapsulation: ViewEncapsulation.None,
  // Bare outlet tags carry only the shipped classes; the components
  // themselves are not under test here.
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @for (scheme of schemes; track scheme) {
      <div [attr.data-color-scheme]="scheme" [class]="'scheme-' + scheme">
        <div class="cngx-alert cngx-alert--warning">
          <button type="button" class="cngx-alert__action alert-on">Retry</button>
          <button type="button" class="cngx-alert__action alert-off" disabled>Undo</button>
        </div>
        <cngx-banner-outlet class="cngx-banner-outlet">
          <div class="cngx-banner cngx-banner--error">
            <button type="button" class="cngx-banner__action banner-on">Reconnect</button>
            <button type="button" class="cngx-banner__action banner-off" disabled>Details</button>
          </div>
        </cngx-banner-outlet>
        <cngx-toast-outlet class="cngx-toast-outlet">
          <!-- The enter animation starts at opacity 0; it is not under test. -->
          <div class="cngx-toast" style="animation: none">
            <span class="cngx-toast__message">Saved</span>
            <span class="cngx-toast__count toast-count">(3)</span>
          </div>
        </cngx-toast-outlet>
        <span
          class="probe-disabled"
          style="color: color-mix(in oklab, var(--cngx-color-text) 38%, transparent)"
        ></span>
        <span class="probe-muted" style="color: var(--cngx-color-text-muted)"></span>
        <span class="plain" style="color: rgb(200, 0, 0)">Plain</span>
      </div>
    }
    <span class="probe-gray" style="color: GrayText"></span>
    <span class="probe-canvas-text" style="color: CanvasText"></span>
  `,
})
class FeedbackHost {
  readonly schemes = SCHEMES;
}

@Component({
  selector: 'cngx-banner-pending-host',
  standalone: true,
  styleUrls: [
    '../../core/theming/system-tokens.css',
    './styles/feedback-severity.css',
    './banner/banner-outlet.css',
  ],
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <cngx-banner-outlet class="cngx-banner-outlet">
      <div class="cngx-banner cngx-banner--info cngx-banner--animate cngx-banner--pending pending">
        Saving
      </div>
      <div class="cngx-banner cngx-banner--info cngx-banner--animate settled">Saved</div>
    </cngx-banner-outlet>
  `,
})
class BannerPendingHost {}

let mountedRoot: HTMLElement | null = null;

function mount<T>(host: new () => T): HTMLElement {
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

// Opacity of the element and every ancestor multiplied: the value a user
// actually sees, whichever element carries it.
function effectiveOpacity(el: Element): number {
  let value = 1;
  for (let node: Element | null = el; node; node = node.parentElement) {
    value *= parseFloat(computedValue(node, 'opacity'));
  }
  return value;
}

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('disabled feedback actions, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);

  it('paints a disabled alert and banner action by the field recipe, border included', () => {
    const root = mount(FeedbackHost);
    const disabled = computedValue(at(root, '.probe-disabled'), 'color');
    for (const sel of ['.alert-off', '.banner-off']) {
      const action = at(root, sel);
      expect(effectiveOpacity(action), sel).toBe(1);
      expect(computedValue(action, 'color'), sel).toBe(disabled);
      expect(computedValue(action, 'border-top-color'), sel).toBe(disabled);
    }
    // The enabled actions keep their severity colour.
    expect(computedValue(at(root, '.alert-on'), 'color')).not.toBe(disabled);
    expect(computedValue(at(root, '.banner-on'), 'color')).not.toBe(disabled);
  });

  it('mutes the toast repeat count by colour, not opacity', () => {
    const root = mount(FeedbackHost);
    const count = at(root, '.toast-count');
    expect(effectiveOpacity(count)).toBe(1);
    expect(computedValue(count, 'color')).toBe(computedValue(at(root, '.probe-muted'), 'color'));
  });

  it('leaves a disabled action GrayText under forced colors (UA)', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'forced-colors', value: 'active' },
        { name: 'prefers-color-scheme', value: scheme },
      ],
    });
    const root = mount(FeedbackHost);
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    const gray = computedValue(one(root, '.probe-gray'), 'color');
    const canvasText = computedValue(one(root, '.probe-canvas-text'), 'color');
    expect(gray).not.toBe(canvasText);
    // The author colour is forced away, so the palette is really active.
    expect(computedValue(at(root, '.plain'), 'color')).toBe(canvasText);
    for (const sel of ['.alert-off', '.banner-off']) {
      const action = at(root, sel);
      expect(effectiveOpacity(action), sel).toBe(1);
      expect(computedValue(action, 'color'), sel).toBe(gray);
    }
    expect(computedValue(at(root, '.alert-on'), 'color')).not.toBe(gray);
  });
});

describe('pending banner with motion allowed', () => {
  it('keeps the pending dim once the enter animation ends, and settles at rest', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
    });
    const root = mount(BannerPendingHost);
    const pending = one(root, '.pending');
    const settled = one(root, '.settled');
    expect(pending.getAnimations()).toHaveLength(1);
    for (const el of [pending, settled]) {
      for (const animation of el.getAnimations()) {
        animation.finish();
      }
    }
    expect(computedValue(pending, 'opacity')).toBe('0.85');
    expect(computedValue(settled, 'opacity')).toBe('1');
    expect(computedValue(settled, 'transform')).toBe('none');
  });
});
