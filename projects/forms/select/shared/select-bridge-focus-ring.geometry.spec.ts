import { Component, signal, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

import { CngxActionMultiSelect } from '../action-multi-select/action-multi-select.component';
import { CngxActionSelect } from '../action-select/action-select.component';
import { CngxCombobox } from '../combobox/combobox.component';
import { CngxSelectOption } from '../declarative/option.component';
import { CngxMultiSelect } from '../multi-select/multi-select.component';
import { CngxReorderableMultiSelect } from '../reorderable-multi-select/reorderable-multi-select.component';
import { CngxSelectShell } from '../select-shell/select-shell.component';
import { CngxSelect } from '../single-select/select.component';
import { CngxTreeSelect } from '../tree-select/tree-select.component';
import { CngxTypeahead } from '../typeahead/typeahead.component';

// Runs in a real Chromium (the `test-geometry` target) against the working-tree
// select bridge and the M3 system tokens (`./select-bridge-states.spec-host.scss`).
// mat-form-field appearance='outline' thickens its edge to 2px primary inside
// the box on any focus. Under the bridge every outlined select trigger draws
// the same ring: 2px, --mat-sys-primary, offset -2px (nothing outside the
// box, the box keeps its height), on a pointer focus and a keyboard focus
// alike, and the flush panel opens on the trigger's bottom edge.

type Variant =
  | 'select'
  | 'multi'
  | 'combobox'
  | 'typeahead'
  | 'tree'
  | 'reorder'
  | 'action'
  | 'action-multi'
  | 'shell';

const VARIANTS: readonly Variant[] = [
  'select',
  'multi',
  'combobox',
  'typeahead',
  'tree',
  'reorder',
  'action',
  'action-multi',
  'shell',
];

@Component({
  selector: 'cngx-select-bridge-focus-ring-host',
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
  ],
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/system-tokens.css',
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
    <span class="probe-primary" style="color: var(--mat-sys-primary)"></span>
    <span
      class="probe-danger"
      style="color: var(--cngx-select-trigger-invalid-outline-color, var(--cngx-color-danger))"
    ></span>
    <button type="button" class="before">Before</button>
    <div
      class="slot"
      style="display: block; width: 20rem; margin: 1rem; --cngx-tree-select-panel-min-inline-size: 0px"
    >
      @switch (variant()) {
        @case ('select') {
          <cngx-select [label]="'C'" [options]="options" />
        }
        @case ('multi') {
          <cngx-multi-select [label]="'C'" [options]="options" />
        }
        @case ('combobox') {
          <cngx-combobox [label]="'C'" [options]="options" />
        }
        @case ('typeahead') {
          <cngx-typeahead [label]="'C'" [options]="options" />
        }
        @case ('tree') {
          <cngx-tree-select [label]="'C'" [nodes]="options" [nodeIdFn]="nodeId" />
        }
        @case ('reorder') {
          <cngx-reorderable-multi-select [label]="'C'" [options]="options" />
        }
        @case ('action') {
          <cngx-action-select [label]="'C'" [options]="options" />
        }
        @case ('action-multi') {
          <cngx-action-multi-select [label]="'C'" [options]="options" />
        }
        @case ('shell') {
          <cngx-select-shell [label]="'C'">
            <cngx-option [value]="'red'">Red</cngx-option>
            <cngx-option [value]="'green'">Green</cngx-option>
          </cngx-select-shell>
        }
      }
    </div>
  `,
})
class FocusRingHost {
  readonly variant = signal<Variant>('select');
  readonly options = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
  ];
  readonly nodeId = (value: unknown): string => String(value);
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

function one(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

function mount(variant: Variant): HTMLElement {
  const fixture = TestBed.createComponent(FocusRingHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.componentInstance.variant.set(variant);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  return mountedRoot;
}

function expectInsideRing(root: HTMLElement, trigger: HTMLElement, restingHeight: number): void {
  const width = parseFloat(computedValue(trigger, 'outline-width'));
  const offset = parseFloat(computedValue(trigger, 'outline-offset'));
  expect(computedValue(trigger, 'outline-style')).toBe('solid');
  expect(width).toBe(2);
  expect(offset).toBe(-2);
  // The ring ends where the border box ends: nothing paints outside the box.
  expect(offset + width).toBeLessThanOrEqual(0);
  expect(computedValue(trigger, 'outline-color')).toBe(
    computedValue(one(root, '.probe-primary'), 'color'),
  );
  expect(trigger.getBoundingClientRect().height).toBeCloseTo(restingHeight, 0);
}

describe('select Material bridge trigger focus ring', () => {
  for (const variant of VARIANTS) {
    it(`${variant}: a pointer focus draws the ring inside the edge and the panel opens flush`, async () => {
      const root = mount(variant);
      const trigger = one(root, '.cngx-field-trigger');
      const resting = trigger.getBoundingClientRect().height;
      await userEvent.click(trigger);
      await nextFrame();
      const panel = one(root, '.cngx-select__panel');
      expect(panel.matches(':popover-open')).toBe(true);
      expectInsideRing(root, trigger, resting);
      expect(panel.getBoundingClientRect().top).toBeCloseTo(
        trigger.getBoundingClientRect().bottom,
        0,
      );
    });

    it(`${variant}: a keyboard focus draws the same ring`, async () => {
      const root = mount(variant);
      const trigger = one(root, '.cngx-field-trigger');
      const resting = trigger.getBoundingClientRect().height;
      one(root, '.before').focus();
      await userEvent.tab();
      await nextFrame();
      expect(trigger.matches(':focus-within')).toBe(true);
      expectInsideRing(root, trigger, resting);
    });
  }

  // The invalid state normally comes from the field; the attribute is set by
  // hand on the element that carries it (the trigger, or the inner combobox
  // input of an input-led variant).
  for (const variant of ['select', 'typeahead'] as const) {
    it(`${variant}: an invalid focused trigger keeps the danger ring inside the edge`, async () => {
      const root = mount(variant);
      const trigger = one(root, '.cngx-field-trigger');
      const resting = trigger.getBoundingClientRect().height;
      const carrier = trigger.matches("[role='combobox']")
        ? trigger
        : one(trigger, "[role='combobox']");
      carrier.setAttribute('aria-invalid', 'true');
      one(root, '.before').focus();
      await userEvent.tab();
      await nextFrame();
      expect(computedValue(trigger, 'outline-color')).toBe(
        computedValue(one(root, '.probe-danger'), 'color'),
      );
      expect(computedValue(trigger, 'outline-offset')).toBe('-2px');
      expect(computedValue(trigger, 'box-shadow')).toBe('none');
      expect(trigger.getBoundingClientRect().height).toBeCloseTo(resting, 0);
    });
  }
});
