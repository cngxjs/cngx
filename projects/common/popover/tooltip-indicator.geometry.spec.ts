/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target). The opt-in tooltip
// indicator (the ::after info icon of tooltip-indicator.scss) is quiet by
// colour, never opacity: it paints the muted text colour at full opacity and
// keeps --cngx-tooltip-indicator-color as the consumer hook.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-tooltip-indicator-host',
  standalone: true,
  styleUrls: ['../../core/theming/system-tokens.css', './tooltip-indicator.spec-host.scss'],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div
        [attr.data-color-scheme]="scheme"
        [class]="'scheme-' + scheme"
        style="color: var(--cngx-color-text)"
      >
        <span cngxTooltip class="trigger">Due date</span>
        <span cngxTooltip class="custom" style="--cngx-tooltip-indicator-color: rgb(200, 0, 0)">Owner</span>
        <span class="probe-muted" style="color: var(--cngx-color-text-muted)"></span>
      </div>
    }
  `,
})
class TooltipIndicatorHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(TooltipIndicatorHost);
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

function indicator(el: Element): CSSStyleDeclaration {
  return getComputedStyle(el, '::after');
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe.each(SCHEMES)('tooltip indicator, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);

  it('paints the muted text colour at full opacity', () => {
    const root = mount();
    const icon = indicator(at(root, '.trigger'));
    expect(icon.opacity).toBe('1');
    expect(icon.backgroundColor).toBe(computedValue(at(root, '.probe-muted'), 'color'));
  });

  it('keeps the colour token as the consumer hook', () => {
    const root = mount();
    expect(indicator(at(root, '.custom')).backgroundColor).toBe('rgb(200, 0, 0)');
  });
});
