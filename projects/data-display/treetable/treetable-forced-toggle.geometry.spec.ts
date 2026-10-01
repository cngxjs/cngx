/// <reference types="@vitest/browser-playwright" />

import { CUSTOM_ELEMENTS_SCHEMA, Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). Under forced colors a
// selected treetable row paints the Highlight pair. Its expand toggle is a
// <button>, which the forced palette paints ButtonText on a Canvas backplate
// box. The toggle alone opts out of forcing and draws its glyph in the row ink
// on a transparent background; the row itself stays forced, and so does the
// toggle of an unselected row.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-treetable-forced-toggle-host',
  standalone: true,
  styleUrls: ['../../core/theming/system-tokens.css', './treetable.component.css'],
  encapsulation: ViewEncapsulation.None,
  // Bare cdk-* tags carry only the shipped classes; the CDK table is not under
  // test here.
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @for (scheme of schemes; track scheme) {
      <div [attr.data-color-scheme]="scheme" [class]="'scheme-' + scheme">
        <div class="cngx-treetable">
          <cdk-table>
            <cdk-row class="cngx-treetable__row--selected row-selected">
              <cdk-cell class="cngx-treetable__expand-cell">
                <button type="button" class="cngx-treetable__toggle" tabindex="-1" aria-expanded="true">
                  ▾
                </button>
              </cdk-cell>
              <cdk-cell class="cngx-treetable__first-data-cell">Alice</cdk-cell>
            </cdk-row>
            <cdk-row class="row-plain">
              <cdk-cell class="cngx-treetable__expand-cell">
                <button type="button" class="cngx-treetable__toggle" tabindex="-1" aria-expanded="false">
                  ▸
                </button>
              </cdk-cell>
              <cdk-cell class="cngx-treetable__first-data-cell">Bob</cdk-cell>
            </cdk-row>
          </cdk-table>
        </div>
        <span class="plain" style="color: rgb(200, 0, 0)">Plain</span>
      </div>
    }
    <span class="probe-canvas-text" style="color: CanvasText"></span>
    <span class="probe-highlight" style="color: Highlight"></span>
    <span class="probe-highlight-text" style="color: HighlightText"></span>
  `,
})
class TreetableForcedToggleHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(TreetableForcedToggleHost);
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

describe.each(SCHEMES)('treetable toggle under forced colors, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);

  it('draws the selected row toggle in HighlightText on a transparent background', async () => {
    await forceColors(scheme);
    const root = mount();
    const ink = computedValue(one(root, '.probe-highlight-text'), 'color');
    // The author colour is forced away, so the palette is really active.
    expect(computedValue(at(root, '.plain'), 'color')).toBe(
      computedValue(one(root, '.probe-canvas-text'), 'color'),
    );
    expect(computedValue(at(root, '.row-selected'), 'background-color')).toBe(
      computedValue(one(root, '.probe-highlight'), 'color'),
    );
    const toggle = at(root, '.row-selected .cngx-treetable__toggle');
    expect(computedValue(toggle, 'forced-color-adjust')).toBe('none');
    expect(computedValue(toggle, 'background-color')).toBe('rgba(0, 0, 0, 0)');
    expect(computedValue(toggle, 'color')).toBe(ink);
    expect(computedValue(toggle, 'outline-color')).toBe(ink);
  });

  it('keeps the row itself and an unselected toggle forced', async () => {
    await forceColors(scheme);
    const root = mount();
    expect(computedValue(at(root, '.row-selected'), 'forced-color-adjust')).toBe('auto');
    expect(computedValue(at(root, '.row-plain .cngx-treetable__toggle'), 'forced-color-adjust')).toBe(
      'auto',
    );
  });

  it('leaves the toggle to the author colours without forced colors', () => {
    const root = mount();
    const toggle = at(root, '.row-selected .cngx-treetable__toggle');
    expect(computedValue(toggle, 'forced-color-adjust')).toBe('auto');
    expect(computedValue(toggle, 'color')).toBe(
      computedValue(at(root, '.row-plain .cngx-treetable__toggle'), 'color'),
    );
  });
});
