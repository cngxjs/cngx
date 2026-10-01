/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). Under forced colors the
// keyboard-cursor option and the active tree node paint the Highlight pair.
// Chromium draws a Canvas backplate behind text, so without opting out the
// HighlightText label sat on that plate and vanished. Both rows now opt out and
// declare HighlightText as the ink for nested indicators.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-select-forced-cursor-host',
  standalone: true,
  styleUrls: [
    '../../../core/theming/system-tokens.css',
    './select-base.css',
    '../tree-select/tree-select-panel.component.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div role="listbox">
      <div class="cngx-select__option cngx-option--highlighted option-cursor">Blue</div>
    </div>
    <div role="tree">
      <div class="cngx-tree-select__node cngx-tree-select__node--active node-active">Frontend</div>
    </div>
    <span class="probe-highlighttext" style="color: HighlightText"></span>
  `,
})
class CursorHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(CursorHost);
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

describe.each(SCHEMES)('select cursor rows under forced colors, %s', (scheme) => {
  it('opt out of forcing and declare HighlightText as the row ink', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'forced-colors', value: 'active' },
        { name: 'prefers-color-scheme', value: scheme },
      ],
    });
    const root = mount();
    const ink = computedValue(one(root, '.probe-highlighttext'), 'color');
    for (const sel of ['.option-cursor', '.node-active']) {
      const row = one(root, sel);
      expect(computedValue(row, 'forced-color-adjust'), sel).toBe('none');
      expect(computedValue(row, 'color'), sel).toBe(ink);
      expect(getComputedStyle(row).getPropertyValue('--_cngx-forced-ink').trim(), sel).toBe('HighlightText');
    }
  });
});
