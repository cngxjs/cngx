import { Component, signal, ViewEncapsulation } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { DGA_SKINS } from './__test-helpers/dga-skins';
import type { CngxDataGridSkin } from './config/data-grid-accordion.config';
import { CngxDataGridAccordion } from './data-grid-accordion.component';
import { CngxDgCell } from './data-grid-cell.directive';
import { CngxDgaFilter } from './data-grid-filter.directive';
import { CngxDataGridFooter } from './data-grid-footer.component';
import { CngxDataGridHeader } from './data-grid-header.component';
import { CngxDataGridRow } from './data-grid-row.component';
import { CngxDgaSortHeader } from './data-grid-sort-header.directive';

// Runs in a real Chromium (the `test-geometry` target). A bounded grid pins its
// head and foot; keyboard focus moving to a row hidden beyond them must land
// clear of both bands, ring included (WCAG 2.4.11 Focus Not Obscured). The
// host's `scroll-padding-block` is the measured band size plus the ring
// clearance, so the check runs over the default look and every named skin,
// with a tall multi-line head (wrapped labels + a filter box) and a two-line
// foot. The dga `@property` registry is loaded so the host-only
// (`inherits: false`) band sizes behave as shipped.
//
// Chromium's focus scroll centres an off-screen target, which hides the defect;
// Firefox and Safari scroll it to the NEAREST edge, which is where an unpadded
// scrollport leaves it under a pinned band. `focusNearest` reproduces that
// path: focus without scrolling, then the nearest-edge scroll every engine
// applies to `scroll-padding`.

const TOLERANCE = 0.5;
const ROWS = Array.from({ length: 40 }, (_, i) => ({
  id: 'r' + i,
  label: 'Account ' + (1000 + i),
}));

@Component({
  selector: 'cngx-dga-focus-clearance-host',
  standalone: true,
  imports: [
    CngxDataGridAccordion,
    CngxDataGridHeader,
    CngxDataGridRow,
    CngxDataGridFooter,
    CngxDgCell,
    CngxDgaSortHeader,
    CngxDgaFilter,
  ],
  styleUrls: [
    '../../core/theming/system-tokens.css',
    '../../common/theming/components/cngx-data-grid.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div style="inline-size: 640px">
      <cngx-data-grid-accordion
        class="bounded"
        [skin]="skin()"
        [multi]="true"
        [maxBlockSize]="320"
      >
        <cngx-dga-header>
          <span cngxDgaCell col="sm" cngxDgaSortHeader="id">Account number of record</span>
          <span cngxDgaCell col="grow">
            <span style="display: block">Name</span>
            <input cngxDgaFilter style="display: block; inline-size: 100%" />
          </span>
        </cngx-dga-header>
        @for (row of rows; track row.id) {
          <cngx-dga-row [panelId]="row.id">
            <span cngxDgaCell>{{ row.id }}</span>
            <span cngxDgaCell primary>{{ row.label }}</span>
            Detail of {{ row.label }}
          </cngx-dga-row>
        }
        <cngx-dga-footer>
          <span cngxDgaCell>40 rows</span>
          <span cngxDgaCell><span style="display: block">Total</span>Carried forward</span>
        </cngx-dga-footer>
      </cngx-data-grid-accordion>
    </div>
  `,
})
class ClearanceHost {
  readonly skin = signal<CngxDataGridSkin | undefined>(undefined);
  protected readonly rows = ROWS;
}

@Component({
  selector: 'cngx-dga-nested-clearance-host',
  standalone: true,
  imports: [CngxDataGridAccordion, CngxDataGridHeader, CngxDgCell],
  styleUrls: [
    '../../core/theming/system-tokens.css',
    '../../common/theming/components/cngx-data-grid.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <cngx-data-grid-accordion class="outer" [maxBlockSize]="320">
      <cngx-dga-header><span cngxDgaCell>Name</span></cngx-dga-header>
      <cngx-data-grid-accordion class="inner" [maxBlockSize]="200"></cngx-data-grid-accordion>
    </cngx-data-grid-accordion>
  `,
})
class NestedClearanceHost {}

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

/** The element rect inflated by the drawn outline (width + outward offset). */
function ringRect(el: HTMLElement): { top: number; bottom: number } {
  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  const width = style.outlineStyle === 'none' ? 0 : parseFloat(style.outlineWidth) || 0;
  const offset = Math.max(parseFloat(style.outlineOffset) || 0, 0);
  const grow = width + offset;
  return { top: rect.top - grow, bottom: rect.bottom + grow };
}

async function focusNearest(target: HTMLElement): Promise<void> {
  target.focus({ preventScroll: true });
  target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  await frames(2);
}

let fixture: ComponentFixture<unknown> | null = null;

afterEach(() => {
  fixture?.destroy();
  fixture = null;
});

describe.each([undefined, ...DGA_SKINS])('dga focus clearance, skin %s', (skin) => {
  async function mount() {
    const created = TestBed.createComponent(ClearanceHost);
    fixture = created;
    created.componentInstance.skin.set(skin);
    created.autoDetectChanges();
    await created.whenStable();
    await frames();
    const root = created.nativeElement as HTMLElement;
    const grid = one(root, '.bounded');
    return {
      grid,
      header: one(grid, '.cngx-dga-header'),
      footer: one(grid, '.cngx-dga-footer'),
      summaries: Array.from(grid.querySelectorAll<HTMLElement>('.cngx-dga-row__summary')),
    };
  }

  function expectClear(focused: HTMLElement, header: HTMLElement, footer: HTMLElement): void {
    const ring = ringRect(focused);
    expect(ring.top).toBeGreaterThanOrEqual(header.getBoundingClientRect().bottom - TOLERANCE);
    expect(ring.bottom).toBeLessThanOrEqual(footer.getBoundingClientRect().top + TOLERANCE);
  }

  it('measures the head band onto the host', async () => {
    const { grid, header } = await mount();
    const measured = parseFloat(computedValue(grid, '--cngx-dga-head-block-size'));
    expect(Math.abs(measured - header.getBoundingClientRect().height)).toBeLessThanOrEqual(
      TOLERANCE,
    );
  });

  it('lands a row focused below the visible range above the foot band', async () => {
    const { grid, header, footer, summaries } = await mount();
    grid.scrollTop = 0;
    await frames(2);

    const target = summaries[30];
    await focusNearest(target);

    expect(document.activeElement).toBe(target);
    expect(grid.scrollTop).toBeGreaterThan(0);
    expectClear(target, header, footer);
  });

  it('lands a row focused above the visible range below the head band', async () => {
    const { grid, header, footer, summaries } = await mount();
    grid.scrollTop = grid.scrollHeight;
    await frames(2);

    const target = summaries[2];
    await focusNearest(target);

    expect(document.activeElement).toBe(target);
    expectClear(target, header, footer);
  });
});

describe('dga focus clearance, nested headerless grid', () => {
  it('pads a headerless inner grid by the clearance only', async () => {
    const created = TestBed.createComponent(NestedClearanceHost);
    fixture = created;
    created.autoDetectChanges();
    await created.whenStable();
    await frames();
    const root = created.nativeElement as HTMLElement;

    const outer = one(root, '.outer');
    const inner = one(root, '.inner');
    expect(parseFloat(computedValue(outer, '--cngx-dga-head-block-size'))).toBeGreaterThan(0);
    // `inherits: false`: the outer band size never reaches the inner host.
    expect(computedValue(inner, '--cngx-dga-head-block-size')).toBe('');
    expect(computedValue(inner, 'scroll-padding-block-start')).toBe('4px');
  });
});
