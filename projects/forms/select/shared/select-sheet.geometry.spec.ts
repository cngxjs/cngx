/// <reference types="@vitest/browser-playwright" />

import { Component, signal, viewChild, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { CngxPopoverPresentationRequest } from '@cngx/common/popover';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxActionMultiSelect } from '../action-multi-select/action-multi-select.component';
import { CngxActionSelect } from '../action-select/action-select.component';
import { CngxCombobox } from '../combobox/combobox.component';
import { CngxSelectOption } from '../declarative/option.component';
import { CngxSelectSearch } from '../declarative/select-search.component';
import { CngxMultiSelect } from '../multi-select/multi-select.component';
import { CngxReorderableMultiSelect } from '../reorderable-multi-select/reorderable-multi-select.component';
import { CngxSelectShell } from '../select-shell/select-shell.component';
import { CngxSelect } from '../single-select/select.component';
import { CngxTreeSelect } from '../tree-select/tree-select.component';
import { CngxTypeahead } from '../typeahead/typeahead.component';

// Runs in a real Chromium (the `test-geometry` target) against the shipped
// sheet stylesheet. Every variant is forced into the presentation its static
// height fact picks on a phone: fullscreen for the four input variants and a
// shell led by a search, a content-sized sheet for the rest. Reduced motion
// keeps the slide transition from leaving a panel mid-flight.

const HARNESS_STYLES = [
  '../../../core/theming/layers.css',
  '../../../core/theming/system-tokens.css',
  '../../../core/theming/reset.css',
  '../../../core/theming/base.css',
  '../../../common/theming/components/cngx-popover.css',
  '../../../common/theming/components/cngx-popover-sheet.css',
  '../../theming/components/cngx-field-affix.css',
  '../../theming/components/cngx-field-skin.css',
  './select-base.css',
];

type Variant =
  | 'select'
  | 'multi'
  | 'combobox'
  | 'typeahead'
  | 'tree'
  | 'reorder'
  | 'action'
  | 'action-multi'
  | 'shell'
  | 'shell-search';

const FILL: Record<Variant, 'sheet' | 'fullscreen'> = {
  select: 'sheet',
  multi: 'sheet',
  combobox: 'fullscreen',
  typeahead: 'fullscreen',
  tree: 'sheet',
  reorder: 'sheet',
  action: 'fullscreen',
  'action-multi': 'fullscreen',
  shell: 'sheet',
  'shell-search': 'fullscreen',
};
const VARIANTS = Object.keys(FILL) as Variant[];
const WITH_DONE: readonly Variant[] = [
  'multi',
  'combobox',
  'typeahead',
  'tree',
  'reorder',
  'action',
  'action-multi',
];

interface Openable {
  open(): void;
}

@Component({
  selector: 'cngx-select-sheet-geometry-host',
  standalone: true,
  imports: [
    CngxSelect,
    CngxMultiSelect,
    CngxCombobox,
    CngxTypeahead,
    CngxTreeSelect,
    CngxReorderableMultiSelect,
    CngxActionSelect,
    CngxActionMultiSelect,
    CngxSelectShell,
    CngxSelectOption,
    CngxSelectSearch,
  ],
  styleUrls: HARNESS_STYLES,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div [attr.dir]="dir()" style="display: block; width: 20rem; margin: 1rem">
      @switch (variant()) {
        @case ('select') {
          <cngx-select #v [label]="'Colour'" [options]="options()" [presentation]="request()" />
        }
        @case ('multi') {
          <cngx-multi-select
            #v
            [label]="'Colour'"
            [options]="options()"
            [presentation]="request()"
          />
        }
        @case ('combobox') {
          <cngx-combobox #v [label]="'Colour'" [options]="options()" [presentation]="request()" />
        }
        @case ('typeahead') {
          <cngx-typeahead #v [label]="'Colour'" [options]="options()" [presentation]="request()" />
        }
        @case ('tree') {
          <cngx-tree-select
            #v
            [label]="'Colour'"
            [nodes]="options()"
            [nodeIdFn]="nodeId"
            [presentation]="request()"
          />
        }
        @case ('reorder') {
          <cngx-reorderable-multi-select
            #v
            [label]="'Colour'"
            [options]="options()"
            [presentation]="request()"
          />
        }
        @case ('action') {
          <cngx-action-select
            #v
            [label]="'Colour'"
            [options]="options()"
            [presentation]="request()"
          />
        }
        @case ('action-multi') {
          <cngx-action-multi-select
            #v
            [label]="'Colour'"
            [options]="options()"
            [presentation]="request()"
          />
        }
        @case ('shell') {
          <cngx-select-shell #v [label]="'Colour'" [presentation]="request()">
            @for (o of options(); track o.value) {
              <cngx-option [value]="o.value">{{ o.label }}</cngx-option>
            }
          </cngx-select-shell>
        }
        @case ('shell-search') {
          <cngx-select-shell #v [label]="'Colour'" [presentation]="request()">
            <cngx-select-search />
            @for (o of options(); track o.value) {
              <cngx-option [value]="o.value">{{ o.label }}</cngx-option>
            }
          </cngx-select-shell>
        }
      }
    </div>
  `,
})
class SheetVariantHost {
  readonly variant = signal<Variant>('select');
  readonly request = signal<CngxPopoverPresentationRequest>('sheet');
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly count = signal(3);
  readonly options = () =>
    Array.from({ length: this.count() }, (_, i) => ({ value: `o${i}`, label: `Option ${i}` }));
  readonly nodeId = (value: unknown): string => String(value);
  readonly select = viewChild.required<Openable>('v');
}

let mountedRoot: HTMLElement | null = null;

const frames = async (count: number): Promise<void> => {
  for (let i = 0; i < count; i++) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

async function emulate(features: { name: string; value: string }[]): Promise<void> {
  await cdp().send('Emulation.setEmulatedMedia', { features });
}

// The fixed containing block: the viewport minus any scrollbar gutter.
const viewport = () => {
  const probe = document.createElement('div');
  probe.style.cssText = 'position: fixed; inset: 0; visibility: hidden';
  document.body.appendChild(probe);
  const rect = probe.getBoundingClientRect();
  probe.remove();
  return { width: Math.round(rect.width), height: Math.round(rect.height) };
};

async function open(variant: Variant, configure?: (host: SheetVariantHost) => void) {
  const fixture = TestBed.createComponent(SheetVariantHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  const host = fixture.componentInstance;
  host.variant.set(variant);
  host.request.set(FILL[variant]);
  configure?.(host);
  fixture.detectChanges();
  await fixture.whenStable();
  host.select().open();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  await frames(6);
  const panel = mountedRoot.querySelector<HTMLElement>('.cngx-select__panel')!;
  // The direct child below the header scrolls: the listbox, or the tree
  // panel host that wraps the tree.
  const scroller = panel.querySelector<HTMLElement>(
    ':scope > [role="listbox"], :scope > cngx-tree-select-panel',
  )!;
  return { fixture, host, panel, scroller };
}

beforeEach(async () => {
  await emulate([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
});

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  document.body.removeAttribute('style');
  document.documentElement.removeAttribute('style');
  await emulate([]);
});

describe('select mobile sheet geometry', () => {
  for (const variant of VARIANTS) {
    describe(variant, () => {
      it(`lays the panel out as a ${FILL[variant]} at full inline size`, async () => {
        const { panel } = await open(variant);
        const rect = panel.getBoundingClientRect();
        const vp = viewport();
        expect(panel.getAttribute('data-cngx-presentation')).toBe(FILL[variant]);
        expect(Math.round(rect.bottom)).toBe(vp.height);
        expect(Math.round(rect.left)).toBe(0);
        expect(Math.round(rect.width)).toBe(vp.width);
        expect(panel.style.getPropertyValue('--cngx-select-panel-min-width')).toBe('');
        if (FILL[variant] === 'fullscreen') {
          expect(Math.round(rect.top)).toBe(0);
        } else {
          expect(rect.height).toBeLessThan(vp.height * 0.8 + 1);
        }
      });

      it('scrolls the list, not the panel', async () => {
        const { panel, scroller } = await open(variant, (h) => h.count.set(60));
        expect(computedValue(panel, 'overflow-y')).toBe('hidden');
        expect(panel.scrollHeight).toBeLessThanOrEqual(panel.clientHeight + 1);
        expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight);
      });

      it('shows the header with the label, X and the variant Done', async () => {
        const { panel } = await open(variant);
        const header = panel.querySelector<HTMLElement>('cngx-select-sheet-header')!;
        const title = header.querySelector<HTMLElement>('.cngx-select-sheet-header__title')!;
        const x = header.querySelector<HTMLElement>('.cngx-select-sheet-header__close')!;
        expect(computedValue(header, 'display')).not.toBe('none');
        expect(computedValue(header, 'flex-shrink')).toBe('0');
        expect(title.textContent?.trim()).toBe('Colour');
        expect(x.getBoundingClientRect().width).toBeGreaterThan(0);
        expect(!!header.querySelector('.cngx-select-sheet-header__done')).toBe(
          WITH_DONE.includes(variant),
        );
      });

      it('puts X at the inline end in LTR and RTL', async () => {
        for (const dir of ['ltr', 'rtl'] as const) {
          const { panel } = await open(variant, (h) => h.dir.set(dir));
          const title = panel.querySelector<HTMLElement>('.cngx-select-sheet-header__title')!;
          const x = panel.querySelector<HTMLElement>('.cngx-select-sheet-header__close')!;
          const titleRect = title.getBoundingClientRect();
          const xRect = x.getBoundingClientRect();
          if (dir === 'ltr') {
            expect(xRect.left).toBeGreaterThanOrEqual(titleRect.right - 1);
          } else {
            expect(xRect.right).toBeLessThanOrEqual(titleRect.left + 1);
          }
          mountedRoot?.remove();
        }
      });
    });
  }

  it('paints a CanvasText top edge under forced colors', async () => {
    await emulate([{ name: 'forced-colors', value: 'active' }]);
    const { panel } = await open('select');
    const probe = document.createElement('span');
    probe.style.color = 'CanvasText';
    document.body.appendChild(probe);
    expect(computedValue(panel, 'border-top-style')).toBe('solid');
    expect(computedValue(panel, 'border-top-color')).toBe(computedValue(probe, 'color'));
    probe.remove();
  });
});
