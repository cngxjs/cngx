/// <reference types="@vitest/browser-playwright" />

import { Component, signal, ViewEncapsulation } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxDataGridAccordion } from './data-grid-accordion.component';
import { CngxDgCell } from './data-grid-cell.directive';
import { CngxDataGridFooter } from './data-grid-footer.component';
import { CngxDataGridHeader } from './data-grid-header.component';
import { CngxDataGridRow } from './data-grid-row.component';

// Runs in a real Chromium (the `test-geometry` target) with the real
// data-grid-accordion, which composes CngxScrollEdges on its host. Block axis:
// the pinned head / foot cast a shadow only while rows are hidden beyond them.
// Inline axis: the host carries a mask fade only while columns are hidden
// sideways, mirrored under dir="rtl", dropped under forced colors and while
// the host itself holds keyboard focus. The dga `@property` registry is loaded
// for the transitioned `<length>` fade carriers and the fade-min opacity.
// `--cngx-dga-edge-duration: 0s` pins the end state of every edge transition,
// so a read never lands mid-ease.

const STYLES = [
  '../../core/theming/system-tokens.css',
  '../../common/theming/components/cngx-data-grid.css',
];
const ROWS = Array.from({ length: 40 }, (_, i) => ({ id: 'r' + i, label: 'Account ' + i }));
const FADE = 24;
const TOLERANCE = 0.5;

@Component({
  selector: 'cngx-dga-scroll-edges-block-host',
  standalone: true,
  imports: [CngxDataGridAccordion, CngxDataGridHeader, CngxDataGridRow, CngxDataGridFooter, CngxDgCell],
  styleUrls: STYLES,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div style="inline-size: 640px">
      <cngx-data-grid-accordion
        class="bounded"
        style="--cngx-dga-edge-duration: 0s"
        [multi]="true"
        [maxBlockSize]="320"
      >
        <cngx-dga-header>
          <span cngxDgaCell col="sm">ID</span>
          <span cngxDgaCell col="grow">Name</span>
        </cngx-dga-header>
        @for (row of rows(); track row.id) {
          <cngx-dga-row [panelId]="row.id">
            <span cngxDgaCell>{{ row.id }}</span>
            <span cngxDgaCell primary>{{ row.label }}</span>
            <div style="block-size: 480px">Detail of {{ row.label }}</div>
          </cngx-dga-row>
        }
        <cngx-dga-footer>
          <span cngxDgaCell>Total</span>
          <span cngxDgaCell></span>
        </cngx-dga-footer>
      </cngx-data-grid-accordion>
    </div>
  `,
})
class BlockHost {
  readonly rows = signal(ROWS);
}

@Component({
  selector: 'cngx-dga-scroll-edges-inline-host',
  standalone: true,
  imports: [CngxDataGridAccordion, CngxDataGridHeader, CngxDataGridRow, CngxDgCell],
  styleUrls: STYLES,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div [attr.dir]="dir()" [style.inline-size.px]="width()">
      <cngx-data-grid-accordion
        class="narrow"
        style="--cngx-dga-edge-duration: 0s"
        [skin]="'ledger'"
        tabindex="0"
      >
        <cngx-dga-header>
          <span cngxDgaCell col="md">Invoice</span>
          <span cngxDgaCell col="grow">Customer</span>
          <span cngxDgaCell col="md">Amount</span>
          <span cngxDgaCell col="md">Action</span>
        </cngx-dga-header>
        @for (row of rows; track row.id) {
          <cngx-dga-row [panelId]="row.id">
            <span cngxDgaCell>{{ row.id }}</span>
            <span cngxDgaCell primary>{{ row.label }}</span>
            <span cngxDgaCell>100</span>
            <span cngxDgaCell><button type="button" class="far-action">Open</button></span>
            Detail
          </cngx-dga-row>
        }
      </cngx-data-grid-accordion>
    </div>
  `,
})
class InlineHost {
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly width = signal(900);
  protected readonly rows = ROWS.slice(0, 3);
}

async function frames(count = 4): Promise<void> {
  for (let i = 0; i < count; i++) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
}

function one(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

const shadow = (el: HTMLElement): string => computedValue(el, 'box-shadow');
const mask = (el: HTMLElement): string => computedValue(el, 'mask-image');

let fixture: ComponentFixture<unknown> | null = null;

afterEach(async () => {
  fixture?.destroy();
  fixture = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

async function mountBlock() {
  const created = TestBed.createComponent(BlockHost);
  fixture = created;
  created.autoDetectChanges();
  await created.whenStable();
  await frames();
  const grid = one(created.nativeElement as HTMLElement, '.bounded');
  return {
    created,
    grid,
    header: one(grid, '.cngx-dga-header'),
    footer: one(grid, '.cngx-dga-footer'),
  };
}

async function mountInline(dir: 'ltr' | 'rtl') {
  const created = TestBed.createComponent(InlineHost);
  fixture = created;
  created.componentInstance.dir.set(dir);
  created.autoDetectChanges();
  await created.whenStable();
  await frames();
  const grid = one(created.nativeElement as HTMLElement, '.narrow');
  const setWidth = async (width: number) => {
    created.componentInstance.width.set(width);
    await created.whenStable();
    await frames();
  };
  return { created, grid, setWidth };
}

describe('dga scroll edges, block axis', () => {
  it('casts the head / foot shadow only toward hidden rows', async () => {
    const { grid, header, footer } = await mountBlock();
    const scrollTo = async (top: number) => {
      grid.scrollTop = top;
      await frames();
    };

    await scrollTo(0);
    expect(shadow(header)).toBe('none');
    expect(shadow(footer)).not.toBe('none');

    await scrollTo((grid.scrollHeight - grid.clientHeight) / 2);
    expect(shadow(header)).not.toBe('none');
    expect(shadow(footer)).not.toBe('none');

    await scrollTo(grid.scrollHeight);
    expect(shadow(header)).not.toBe('none');
    expect(shadow(footer)).toBe('none');
  });

  it('flips data-scroll-block-end on when an expanded row outgrows a fitting grid', async () => {
    const { created, grid } = await mountBlock();
    (created.componentInstance as BlockHost).rows.set(ROWS.slice(0, 2));
    await created.whenStable();
    await frames();
    expect(grid.hasAttribute('data-scroll-block-end')).toBe(false);

    one(grid, '.cngx-dga-row__summary').click();
    await created.whenStable();
    await frames();

    expect(grid.hasAttribute('data-scroll-block-end')).toBe(true);
  });
});

describe.each(['ltr', 'rtl'] as const)('dga scroll edges, inline axis, %s', (dir) => {
  it('carries a mask only while columns are hidden sideways', async () => {
    const { grid, setWidth } = await mountInline(dir);
    expect(grid.scrollWidth - grid.clientWidth).toBeLessThanOrEqual(1);
    expect(mask(grid)).toBe('none');

    await setWidth(300);
    expect(grid.scrollWidth).toBeGreaterThan(grid.clientWidth + 1);
    expect(grid.hasAttribute('data-scroll-inline-end')).toBe(true);
    expect(mask(grid)).not.toBe('none');
    expect(mask(grid)).toContain(dir === 'rtl' ? 'to left' : 'to right');

    await setWidth(900);
    expect(mask(grid)).toBe('none');
  });

  it('composites the fade so the border ring stays unmasked and never fades to clear', async () => {
    const { grid, setWidth } = await mountInline(dir);
    await setWidth(300);

    expect(computedValue(grid, 'mask-clip')).toBe('padding-box, padding-box, border-box');
    expect(computedValue(grid, 'mask-origin')).toBe('padding-box, padding-box, border-box');
    // The composite list repeats to the layer count; the third value is unused.
    expect(computedValue(grid, 'mask-composite')).toBe('add, exclude, add');
    const fadeLayer = mask(grid).split('linear-gradient(')[1] ?? '';
    expect(fadeLayer).toContain('0.35');
    expect(fadeLayer).not.toContain('transparent');
  });

  it('lands a focused far cell clear of the fade without touching the mask', async () => {
    const { grid, setWidth } = await mountInline(dir);
    await setWidth(300);
    const target = one(grid, '.far-action');
    // Nearest-edge scroll, the path `scroll-padding-inline` governs in every engine.
    target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    await frames();
    const before = mask(grid);

    target.focus({ preventScroll: true });
    await frames(2);
    expect(document.activeElement).toBe(target);

    const ring = target.getBoundingClientRect();
    const style = getComputedStyle(target);
    const grow =
      (style.outlineStyle === 'none' ? 0 : parseFloat(style.outlineWidth) || 0) +
      Math.max(parseFloat(style.outlineOffset) || 0, 0);
    const host = grid.getBoundingClientRect();
    expect(ring.left - grow).toBeGreaterThanOrEqual(host.left + FADE - TOLERANCE);
    expect(ring.right + grow).toBeLessThanOrEqual(host.right - FADE + TOLERANCE);
    expect(mask(grid)).toBe(before);
  });

  it('drops the mask while the host itself holds keyboard focus', async () => {
    const { grid, setWidth } = await mountInline(dir);
    await setWidth(300);
    expect(mask(grid)).not.toBe('none');

    grid.focus({ preventScroll: true });
    await frames(2);
    expect(grid.matches(':focus-visible')).toBe(true);
    expect(mask(grid)).toBe('none');

    grid.blur();
    await frames(2);
    expect(mask(grid)).not.toBe('none');
  });
});

describe('dga scroll edges under forced colors', () => {
  it('drops the inline fade', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'forced-colors', value: 'active' }],
    });
    for (const dir of ['ltr', 'rtl'] as const) {
      const { grid, setWidth } = await mountInline(dir);
      await setWidth(300);
      expect(grid.hasAttribute('data-scroll-inline-end')).toBe(true);
      expect(mask(grid)).toBe('none');
      fixture?.destroy();
      fixture = null;
    }
  });
});
