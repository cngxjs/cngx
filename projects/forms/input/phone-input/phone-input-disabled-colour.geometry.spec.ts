/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxPhoneInput } from './phone-input.component';

// Runs in a real Chromium (the `test-geometry` target). The phone input is the
// real component: its country select and number input each fade by the
// disabled field recipe (38% of the text colour), so the group host adds no
// opacity on top, which used to fade a disabled phone input twice. Under
// forced colors both parts read GrayText.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-phone-input-disabled-colour-host',
  standalone: true,
  imports: [CngxPhoneInput],
  styleUrls: ['../../../core/theming/system-tokens.css', '../../../core/theming/base.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div [attr.data-color-scheme]="scheme" [class]="'scheme-' + scheme">
        <cngx-phone-input class="on" ariaLabel="Enabled" value="664 1234567" />
        <cngx-phone-input class="off" ariaLabel="Disabled" value="664 1234567" [disabled]="true" />
        <span
          class="probe-disabled"
          style="color: color-mix(in oklab, var(--cngx-color-text) 38%, transparent)"
        ></span>
        <span class="plain" style="color: rgb(200, 0, 0)">Plain</span>
      </div>
    }
    <span class="probe-gray" style="color: GrayText"></span>
    <span class="probe-canvas-text" style="color: CanvasText"></span>
  `,
})
class PhoneHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(PhoneHost);
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

async function forceColors(scheme: string): Promise<void> {
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'forced-colors', value: 'active' },
      { name: 'prefers-color-scheme', value: scheme },
    ],
  });
}

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('disabled phone input, %s', (scheme) => {
  const at = (selector: string): string => `.scheme-${scheme} ${selector}`;
  const NUMBER = '.cngx-phone-input__number';
  const COUNTRY = '.cngx-phone-input__country .cngx-field-trigger';

  it('marks the real host disabled and disables both parts', () => {
    const root = mount();
    const host = one(root, at('.off'));
    expect(host.classList).toContain('cngx-phone-input--disabled');
    expect(host.getAttribute('aria-disabled')).toBe('true');
    expect(one(root, at(`.off ${NUMBER}`)).hasAttribute('disabled')).toBe(true);
  });

  it('fades the number and the country picker once, by colour, not opacity', () => {
    const root = mount();
    const disabled = computedValue(one(root, at('.probe-disabled')), 'color');
    expect(effectiveOpacity(one(root, at('.off')))).toBe(1);
    for (const part of [NUMBER, COUNTRY]) {
      const el = one(root, at(`.off ${part}`));
      expect(effectiveOpacity(el)).toBe(1);
      expect(computedValue(el, 'color')).toBe(disabled);
      expect(computedValue(one(root, at(`.on ${part}`)), 'color')).not.toBe(disabled);
    }
  });

  it('reads GrayText for both disabled parts under forced colors', async () => {
    await forceColors(scheme);
    const root = mount();
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    const gray = computedValue(one(root, '.probe-gray'), 'color');
    const canvasText = computedValue(one(root, '.probe-canvas-text'), 'color');
    expect(gray).not.toBe(canvasText);
    // The author colour is forced away, so the palette is really active.
    expect(computedValue(one(root, at('.plain')), 'color')).toBe(canvasText);
    for (const part of [NUMBER, COUNTRY]) {
      expect(effectiveOpacity(one(root, at(`.off ${part}`)))).toBe(1);
      expect(computedValue(one(root, at(`.off ${part}`)), 'color')).toBe(gray);
      expect(computedValue(one(root, at(`.on ${part}`)), 'color')).not.toBe(gray);
    }
  });
});
