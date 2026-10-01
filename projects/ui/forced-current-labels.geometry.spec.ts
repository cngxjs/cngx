/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). Under forced colors the
// current breadcrumb, the highlighted command row and the current stepper
// indicator paint the Highlight pair. Chromium draws a Canvas backplate behind
// text, so without opting out the HighlightText label sat on that plate and
// vanished. They now opt out; inside the command row the match highlight and a
// shortcut chip follow the row ink instead of their unforced author colours.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-ui-forced-current-host',
  standalone: true,
  styleUrls: [
    '../core/theming/system-tokens.css',
    './breadcrumb/breadcrumb-bar.component.css',
    './command-palette/panel/command-panel.component.css',
    './stepper/stepper.component.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <nav><a class="cngx-breadcrumb__link crumb-current" aria-current="page" href="#">Books</a></nav>
    <div class="cngx-command-row cngx-option--highlighted row-active">
      <span class="cngx-command-row-label">Dark <mark>the</mark>me</span> <kbd>Ctrl D</kbd>
    </div>
    <div class="cngx-stepper__step" aria-current="step">
      <span class="cngx-stepper__indicator step-current">1</span>
    </div>
    <span class="probe-highlighttext" style="color: HighlightText"></span>
  `,
})
class CurrentHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(CurrentHost);
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

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('current labels under forced colors, %s', (scheme) => {
  it('opt out of forcing so the HighlightText label survives the backplate', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'forced-colors', value: 'active' },
        { name: 'prefers-color-scheme', value: scheme },
      ],
    });
    const root = mount();
    const ink = computedValue(one(root, '.probe-highlighttext'), 'color');
    for (const sel of ['.crumb-current', '.row-active', '.step-current']) {
      expect(computedValue(one(root, sel), 'forced-color-adjust'), sel).toBe('none');
      expect(computedValue(one(root, sel), 'color'), sel).toBe(ink);
    }
    for (const sel of ['.row-active mark', '.row-active kbd']) {
      expect(computedValue(one(root, sel), 'background-color'), sel).toBe('rgba(0, 0, 0, 0)');
      expect(computedValue(one(root, sel), 'color'), sel).toBe(ink);
    }
  });
});
