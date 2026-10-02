/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxDataGridAccordion } from './data-grid-accordion.component';
import { CngxDgCell } from './data-grid-cell.directive';
import { CngxDataGridHeader } from './data-grid-header.component';
import { CngxDataGridRow } from './data-grid-row.component';

// Runs in a real Chromium (the `test-geometry` target) with the real
// data-grid-accordion, since the edge hangs on the grid's [data-skin] and the
// row's [data-severity] host attributes. Under forced colors the log-stream
// severity edge was a background-only strip and vanished. It now draws in
// CanvasText for every severity (the LEVEL text names which one); a row
// without a severity keeps no edge.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-dga-log-stream-forced-host',
  standalone: true,
  imports: [CngxDataGridAccordion, CngxDataGridHeader, CngxDataGridRow, CngxDgCell],
  styleUrls: ['../../core/theming/system-tokens.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <cngx-data-grid-accordion [skin]="'log-stream'" [multi]="true">
      <cngx-dga-header>
        <span cngxDgaCell col="md">Time</span>
        <span cngxDgaCell col="fit">Level</span>
      </cngx-dga-header>
      <cngx-dga-row class="row-error" panelId="e" [severity]="'error'">
        <span cngxDgaCell>14:02</span>
        <span cngxDgaCell>ERROR</span>
        Detail
      </cngx-dga-row>
      <cngx-dga-row class="row-warning" panelId="w" [severity]="'warning'">
        <span cngxDgaCell>14:01</span>
        <span cngxDgaCell>WARN</span>
        Detail
      </cngx-dga-row>
      <cngx-dga-row class="row-info" panelId="i" [severity]="'info'">
        <span cngxDgaCell>14:00</span>
        <span cngxDgaCell>INFO</span>
        Detail
      </cngx-dga-row>
      <cngx-dga-row class="row-none" panelId="n">
        <span cngxDgaCell>13:59</span>
        <span cngxDgaCell>DEBUG</span>
        Detail
      </cngx-dga-row>
    </cngx-data-grid-accordion>
    <span class="plain" style="color: rgb(200, 0, 0)">plain</span>
    <span class="probe-canvastext" style="color: CanvasText"></span>
  `,
})
class LogStreamHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(LogStreamHost);
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

const edge = (root: HTMLElement, row: string): string =>
  getComputedStyle(one(root, `.${row} .cngx-dga-row__summary`), '::before').getPropertyValue('background-color').trim();

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('log-stream severity edge under forced colors, %s', (scheme) => {
  const probe = (root: HTMLElement, name: string): string => computedValue(one(root, `.probe-${name}`), 'color');

  async function mountForced(): Promise<HTMLElement> {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'forced-colors', value: 'active' },
        { name: 'prefers-color-scheme', value: scheme },
      ],
    });
    return mount();
  }

  it('forces a plain author colour (the emulation is live)', async () => {
    const root = await mountForced();
    expect(computedValue(one(root, '.plain'), 'color')).toBe(probe(root, 'canvastext'));
  });

  it('draws the edge in CanvasText for every severity', async () => {
    const root = await mountForced();
    for (const row of ['row-error', 'row-warning', 'row-info']) {
      expect(edge(root, row)).toBe(probe(root, 'canvastext'));
    }
  });

  it('keeps no edge on a row without a severity', async () => {
    const root = await mountForced();
    expect(edge(root, 'row-none')).not.toBe(probe(root, 'canvastext'));
  });
});

describe('log-stream severity edge without forced colors', () => {
  it('keeps the author severity colours', () => {
    const root = mount();
    const colours = ['row-error', 'row-warning', 'row-info'].map((row) => edge(root, row));
    expect(new Set(colours).size).toBe(3);
    expect(edge(root, 'row-none')).toBe('rgba(0, 0, 0, 0)');
  });
});
