/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). A disabled tab that
// carries a rejected commit takes no opacity fade: Material paints the disabled
// label colour, and the error outline keeps it apart from a healthy disabled
// tab, in both schemes and under forced colors. Static markup with Material's
// own classes; Material's stylesheet is not loaded here.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-mat-tab-disabled-error-host',
  standalone: true,
  styleUrls: ['../../core/theming/system-tokens.css', './styles/mat-tabs.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div [attr.data-color-scheme]="scheme" [class]="'scheme-' + scheme">
        <button type="button" class="mat-mdc-tab cngx-mat-tab--error tab-error">Billing</button>
        <button
          type="button"
          class="mat-mdc-tab mat-mdc-tab-disabled cngx-mat-tab--error tab-error-off"
          aria-disabled="true"
        >
          Shipping
        </button>
        <span class="plain" style="color: rgb(200, 0, 0)">Plain</span>
      </div>
    }
    <span class="probe-canvas-text" style="color: CanvasText"></span>
  `,
})
class MatTabHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(MatTabHost);
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

function outline(el: Element): string {
  return ['outline-style', 'outline-width', 'outline-offset']
    .map((property) => computedValue(el, property))
    .join(' ');
}

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('disabled rejected mat tab, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);

  it('keeps full opacity and the error outline of an enabled rejected tab', () => {
    const root = mount();
    const tab = at(root, '.tab-error-off');
    expect(effectiveOpacity(tab)).toBe(1);
    expect(outline(tab)).toBe('solid 2px 1px');
    expect(outline(tab)).toBe(outline(at(root, '.tab-error')));
  });

  it('keeps full opacity and the outline under forced colors', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'forced-colors', value: 'active' },
        { name: 'prefers-color-scheme', value: scheme },
      ],
    });
    const root = mount();
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    // The author colour is forced away, so the palette is really active.
    expect(computedValue(at(root, '.plain'), 'color')).toBe(
      computedValue(one(root, '.probe-canvas-text'), 'color'),
    );
    const tab = at(root, '.tab-error-off');
    expect(effectiveOpacity(tab)).toBe(1);
    expect(outline(tab)).toBe('solid 2px 1px');
  });
});
