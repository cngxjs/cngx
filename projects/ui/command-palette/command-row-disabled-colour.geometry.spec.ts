/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). A disabled command row
// fades by colour (the 38% text recipe of a disabled field), never opacity; its
// match highlight inherits the colour. Under forced colors the row reads
// GrayText and the match highlight drops the system Mark fill (GrayText on it
// is faint) for an underline.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-command-row-disabled-host',
  standalone: true,
  styleUrls: ['../../core/theming/system-tokens.css', './panel/command-panel.component.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div [attr.data-color-scheme]="scheme" [class]="'scheme-' + scheme">
        <div class="cngx-command-row row-on">
          <span class="cngx-command-row-label">Open <mark>file</mark></span>
        </div>
        <div class="cngx-command-row cngx-option--disabled row-off" aria-disabled="true">
          <span class="cngx-command-row-label">Delete <mark>file</mark></span>
        </div>
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
class CommandRowHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(CommandRowHost);
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

describe.each(SCHEMES)('disabled command row, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);

  it('paints a disabled row and its match by the field recipe, not opacity', () => {
    const root = mount();
    const disabled = computedValue(at(root, '.probe-disabled'), 'color');
    for (const sel of ['.row-off', '.row-off .cngx-command-row-label', '.row-off mark']) {
      expect(effectiveOpacity(at(root, sel)), sel).toBe(1);
      expect(computedValue(at(root, sel), 'color'), sel).toBe(disabled);
    }
    expect(computedValue(at(root, '.row-on'), 'color')).not.toBe(disabled);
  });

  it('reads GrayText under forced colors and underlines the match', async () => {
    await forceColors(scheme);
    const root = mount();
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    const gray = computedValue(one(root, '.probe-gray'), 'color');
    const canvasText = computedValue(one(root, '.probe-canvas-text'), 'color');
    expect(gray).not.toBe(canvasText);
    // The author colour is forced away, so the palette is really active.
    expect(computedValue(at(root, '.plain'), 'color')).toBe(canvasText);
    expect(computedValue(at(root, '.row-on'), 'color')).toBe(canvasText);
    const row = at(root, '.row-off');
    expect(effectiveOpacity(row)).toBe(1);
    expect(computedValue(row, 'color')).toBe(gray);
    const mark = at(root, '.row-off mark');
    expect(computedValue(mark, 'color')).toBe(gray);
    // Forced colors keep the alpha of `transparent` on the system colour.
    expect(computedValue(mark, 'background-color')).toMatch(/, 0\)$/);
    expect(computedValue(mark, 'text-decoration-line')).toBe('underline');
  });
});
