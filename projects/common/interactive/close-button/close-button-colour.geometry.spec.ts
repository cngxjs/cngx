/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). The close button is
// quiet at rest by colour, never opacity: the hint colour (clears 4.5:1, where
// half-opacity currentColor sat near 3:1), lifting to the surrounding text
// colour on hover. The rest colour stays a consumer hook via
// --cngx-close-button-color.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-close-button-colour-host',
  standalone: true,
  styleUrls: ['../../../core/theming/system-tokens.css', './close-button.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div
        [attr.data-color-scheme]="scheme"
        [class]="'scheme-' + scheme"
        style="color: var(--cngx-color-text)"
      >
        <!-- Transition off so a computed colour read right after hover is the end state. -->
        <span class="cngx-close-button rest">
          <button type="button" class="cngx-close-button__btn" style="transition: none" aria-label="Close">x</button>
        </span>
        <span class="cngx-close-button custom" style="--cngx-close-button-color: rgb(200, 0, 0)">
          <button type="button" class="cngx-close-button__btn" aria-label="Close">x</button>
        </span>
        <span class="probe-muted" style="color: var(--cngx-color-text-muted)"></span>
      </div>
    }
  `,
})
class CloseButtonHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(CloseButtonHost);
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

function effectiveOpacity(el: Element): number {
  let value = 1;
  for (let node: Element | null = el; node; node = node.parentElement) {
    value *= parseFloat(computedValue(node, 'opacity'));
  }
  return value;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe.each(SCHEMES)('close button colour, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);

  it('rests in the hint colour at full opacity', () => {
    const root = mount();
    const btn = at(root, '.rest .cngx-close-button__btn');
    expect(effectiveOpacity(btn)).toBe(1);
    expect(computedValue(btn, 'color')).toBe(computedValue(at(root, '.probe-muted'), 'color'));
  });

  it('honours --cngx-close-button-color at rest', () => {
    const root = mount();
    expect(computedValue(at(root, '.custom .cngx-close-button__btn'), 'color')).toBe('rgb(200, 0, 0)');
  });

  it('lifts to the surrounding text colour on hover, not opacity', async () => {
    const root = mount();
    const btn = at(root, '.rest .cngx-close-button__btn');
    await userEvent.hover(btn);
    expect(effectiveOpacity(btn)).toBe(1);
    expect(computedValue(btn, 'color')).toBe(computedValue(at(root, '.rest'), 'color'));
  });
});
