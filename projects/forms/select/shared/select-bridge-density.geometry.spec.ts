import { Component, signal, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxSelectOption } from '../declarative/option.component';
import { CngxSelectShell } from '../select-shell/select-shell.component';
import { CngxSelect } from '../single-select/select.component';
import { CngxTreeSelect } from '../tree-select/tree-select.component';

// Runs in a real Chromium (the `test-geometry` target) against the working-tree
// select bridge (`./select-bridge-states.spec-host.scss`). The bridge metrics
// are rungs of the density scale picked so comfortable equals the M3 outlined
// field and mat-option (56px trigger, 16px inline, 48px row with 12px / 16px
// padding, 8px list inset), and a [data-density] island re-scales them:
// compact < comfortable < spacious on every metric. The flat data-mode panel,
// the declarative shell and the tree stand in for the family.

type Density = 'compact' | 'comfortable' | 'spacious';
type Variant = 'select' | 'shell' | 'tree';

interface Openable {
  open(): void;
}

@Component({
  selector: 'cngx-select-bridge-density-host',
  standalone: true,
  imports: [CngxSelect, CngxSelectShell, CngxSelectOption, CngxTreeSelect],
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/system-tokens.css',
    '../../../core/theming/density-tokens.css',
    '../../../core/theming/reset.css',
    '../../../core/theming/base.css',
    '../../../common/theming/components/cngx-listbox.css',
    '../../theming/components/cngx-field-affix.css',
    '../../theming/components/cngx-field-skin.css',
    './select-base.css',
    './select-bridge-states.spec-host.scss',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="slot"
      [attr.data-density]="density()"
      style="display: block; width: 20rem; margin: 1rem; --cngx-tree-select-panel-min-inline-size: 0px"
    >
      @switch (variant()) {
        @case ('select') {
          <cngx-select [label]="'C'" [options]="options" />
        }
        @case ('shell') {
          <cngx-select-shell [label]="'C'">
            <cngx-option [value]="'red'">Red</cngx-option>
            <cngx-option [value]="'green'">Green</cngx-option>
          </cngx-select-shell>
        }
        @case ('tree') {
          <cngx-tree-select [label]="'C'" [nodes]="options" [nodeIdFn]="nodeId" />
        }
      }
    </div>
  `,
})
class DensityHost {
  readonly density = signal<Density>('comfortable');
  readonly variant = signal<Variant>('select');
  readonly options = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
  ];
  readonly nodeId = (value: unknown): string => String(value);
}

interface Metrics {
  triggerHeight: number;
  triggerInline: number;
  rowHeight: number;
  rowInline: number;
  listInset: number;
}

let mountedRoot: HTMLElement | null = null;

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

async function nextFrame(): Promise<void> {
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
}

function px(el: Element, property: string): number {
  return parseFloat(computedValue(el, property));
}

function one(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

async function measure(variant: Variant, density: Density): Promise<Metrics> {
  const fixture = TestBed.createComponent(DensityHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.componentInstance.variant.set(variant);
  fixture.componentInstance.density.set(density);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  (fixture.debugElement.query(By.css('.slot > *')).componentInstance as Openable).open();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  await nextFrame();
  const root = fixture.nativeElement as HTMLElement;
  const trigger = one(root, '.cngx-field-trigger');
  const panel = one(root, '.cngx-select__panel');
  const row = one(panel, "[role='option'], [role='treeitem']");
  const list = one(panel, '[cngxListbox], .cngx-tree-select__tree');
  const metrics = {
    triggerHeight: trigger.getBoundingClientRect().height,
    triggerInline: px(trigger, 'padding-left'),
    rowHeight: row.getBoundingClientRect().height,
    rowInline: px(row, 'padding-right'),
    listInset: px(list, 'padding-top'),
  };
  mountedRoot.remove();
  mountedRoot = null;
  return metrics;
}

describe('select Material bridge density', () => {
  for (const variant of ['select', 'shell', 'tree'] as const) {
    it(`${variant}: comfortable equals the M3 metrics`, async () => {
      const m = await measure(variant, 'comfortable');
      expect(m.triggerHeight).toBeCloseTo(56, 0);
      expect(m.triggerInline).toBe(16);
      expect(m.rowHeight).toBeCloseTo(48, 0);
      expect(m.rowInline).toBe(16);
      expect(m.listInset).toBe(8);
    });

    it(`${variant}: compact < comfortable < spacious on every metric`, async () => {
      const compact = await measure(variant, 'compact');
      const comfortable = await measure(variant, 'comfortable');
      const spacious = await measure(variant, 'spacious');
      for (const key of Object.keys(comfortable) as (keyof Metrics)[]) {
        expect(compact[key], `compact ${key}`).toBeLessThan(comfortable[key]);
        expect(spacious[key], `spacious ${key}`).toBeGreaterThan(comfortable[key]);
      }
    });
  }

  it('keeps the option row block padding on the sm rung', async () => {
    const fixture = TestBed.createComponent(DensityHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    (fixture.debugElement.query(By.css('.slot > *')).componentInstance as Openable).open();
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    await nextFrame();
    const row = one(mountedRoot, ".cngx-select__panel [role='option']");
    expect(px(row, 'padding-top')).toBe(12);
  });
});
