import { Component, computed, signal, ViewEncapsulation } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxCombobox } from '../combobox/combobox.component';
import { CngxMultiSelect } from '../multi-select/multi-select.component';
import { CngxTreeSelect } from '../tree-select/tree-select.component';

// Runs in a real Chromium (the `test-geometry` target). Under the touch floor
// (`data-touch="on"`, the same 44px a coarse pointer sets) the multi-value
// triggers swap their chips for a one-line summary: the first label plus a
// `+N` badge. The row keeps the 44px family height and its width at every
// selection count, and a long first label is cut, not wrapped.

const LONG_LABEL = 'L'.repeat(200);

function optionsWith(firstLabel: string): { value: string; label: string }[] {
  return Array.from({ length: 50 }, (_, i) => ({
    value: `v${i}`,
    label: i === 0 ? firstLabel : `Option ${i}`,
  }));
}

@Component({
  selector: 'cngx-select-summary-trigger-host',
  standalone: true,
  imports: [CngxMultiSelect, CngxTreeSelect, CngxCombobox],
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/system-tokens.css',
    '../../../core/theming/reset.css',
    '../../../core/theming/base.css',
    '../../theming/components/cngx-field-affix.css',
    '../../theming/components/cngx-field-skin.css',
    './select-base.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div data-touch="on" style="display: block; width: 20rem; margin: 1rem">
      <cngx-multi-select [label]="'C'" [options]="options()" [values]="values()" />
      <cngx-tree-select
        [label]="'T'"
        [nodes]="treeNodes()"
        [nodeIdFn]="treeId"
        [labelFn]="treeLabel"
        [values]="values()"
      />
      <cngx-combobox [label]="'B'" [options]="options()" [values]="values()" />
    </div>
    <div data-touch="on" class="input-row" style="display: block; width: 390px; margin: 1rem">
      <cngx-combobox
        style="display: block"
        [label]="'B'"
        [options]="options()"
        [values]="values()"
      />
    </div>
  `,
})
class SummaryTriggerHost {
  readonly options = signal(optionsWith('Red'));
  readonly values = signal<string[]>([]);
  readonly treeNodes = computed(() => this.options().map((o) => ({ value: o.value })));
  readonly treeId = (v: string): string => v;
  readonly treeLabel = (v: string): string => this.options().find((o) => o.value === v)?.label ?? v;
}

/** Every summary variant: its host tag. */
const VARIANTS = ['cngx-multi-select', 'cngx-tree-select', 'cngx-combobox'] as const;

/** The variants whose trigger keeps a search input next to the summary. */
const INPUT_VARIANTS = ['cngx-combobox'] as const;

let mountedRoot: HTMLElement | null = null;

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function settle(fixture: ComponentFixture<SummaryTriggerHost>): Promise<void> {
  for (let i = 0; i < 3; i++) {
    fixture.detectChanges();
    TestBed.flushEffects();
    await nextFrame();
  }
  fixture.detectChanges();
}

async function mount(): Promise<ComponentFixture<SummaryTriggerHost>> {
  const fixture = TestBed.createComponent(SummaryTriggerHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  await settle(fixture);
  return fixture;
}

async function select(fixture: ComponentFixture<SummaryTriggerHost>, count: number): Promise<void> {
  fixture.componentInstance.values.set(
    fixture.componentInstance
      .options()
      .slice(0, count)
      .map((o) => o.value),
  );
  await settle(fixture);
}

function trigger(tag: string): HTMLElement {
  return mountedRoot!.querySelector<HTMLElement>(
    `[data-touch]:not(.input-row) ${tag} .cngx-field-trigger`,
  )!;
}

function box(tag: string): { width: number; height: number } {
  const rect = trigger(tag).getBoundingClientRect();
  return { width: Math.round(rect.width), height: Math.round(rect.height) };
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('select summary trigger under the touch floor', () => {
  for (const tag of VARIANTS) {
    it(`${tag} keeps one 44px box at 0, 1, 5 and 50 values`, async () => {
      const fixture = await mount();
      const empty = box(tag);
      expect(empty.height).toBe(44);
      for (const count of [1, 5, 50]) {
        await select(fixture, count);
        expect(trigger(tag).querySelectorAll('cngx-chip')).toHaveLength(0);
        expect(trigger(tag).querySelector('cngx-select-summary'), `${count}`).not.toBeNull();
        expect(box(tag), `${tag} at ${count} values`).toEqual(empty);
      }
    });

    it(`${tag} cuts a 200-character first label at 44px and keeps the badge inside the row`, async () => {
      const fixture = await mount();
      fixture.componentInstance.options.set(optionsWith(LONG_LABEL));
      await select(fixture, 5);
      // A content-sized trigger grows up to its container, never past it, and
      // never by a line.
      const wrapper = mountedRoot!.querySelector<HTMLElement>('[data-touch]')!;
      expect(box(tag).height).toBe(44);
      expect(box(tag).width).toBeLessThanOrEqual(Math.round(wrapper.getBoundingClientRect().width));

      const row = trigger(tag).getBoundingClientRect();
      const label = trigger(tag).querySelector<HTMLElement>('.cngx-select-summary__label')!;
      expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
      const badge = trigger(tag)
        .querySelector<HTMLElement>('.cngx-select__chip-overflow-badge')!
        .getBoundingClientRect();
      expect(badge.left).toBeGreaterThanOrEqual(row.left);
      expect(badge.right).toBeLessThanOrEqual(row.right);
      expect(badge.top).toBeGreaterThanOrEqual(row.top);
      expect(badge.bottom).toBeLessThanOrEqual(row.bottom);
    });
  }
});

describe('select summary trigger next to the search input at 390px', () => {
  for (const tag of INPUT_VARIANTS) {
    it(`${tag} keeps the input and the summary inside one 44px row`, async () => {
      const fixture = await mount();
      fixture.componentInstance.options.set(optionsWith(LONG_LABEL));
      await select(fixture, 5);
      const row = mountedRoot!.querySelector<HTMLElement>(`.input-row ${tag} .cngx-field-trigger`)!;
      const rect = row.getBoundingClientRect();
      expect(Math.round(rect.height)).toBe(44);
      expect(Math.round(rect.width)).toBe(390);
      expect(row.querySelectorAll('cngx-chip')).toHaveLength(0);

      const input = row
        .querySelector<HTMLElement>('input[role="combobox"]')!
        .getBoundingClientRect();
      const summary = row
        .querySelector<HTMLElement>('cngx-select-summary')!
        .getBoundingClientRect();
      // The input keeps its 4rem floor as the tap and typing target.
      expect(input.width).toBeGreaterThanOrEqual(64);
      expect(summary.right).toBeLessThanOrEqual(input.left);
      for (const part of [input, summary]) {
        expect(part.left).toBeGreaterThanOrEqual(rect.left);
        expect(part.right).toBeLessThanOrEqual(rect.right);
        expect(part.top).toBeGreaterThanOrEqual(rect.top);
        expect(part.bottom).toBeLessThanOrEqual(rect.bottom);
      }
    });
  }
});
