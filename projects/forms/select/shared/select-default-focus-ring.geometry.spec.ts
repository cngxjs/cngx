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

// Runs in a real Chromium (the `test-geometry` target) in the default cngx
// theme. A select trigger shows its focus ring on any focus, pointer or
// keyboard, the form-field convention: the four input-led variants used to
// light it on a click (their input is always :focus-visible) while the five
// div[role=combobox] ones lit it only from the keyboard. Every variant now
// draws the same 2px solid ring on both, and keeps it while the panel is open.

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
  selector: 'cngx-cngx-select-default-focus-ring-host',
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
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
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
class DefaultRingHost {
  readonly variant = signal<Variant>('select');
  readonly options = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
  ];
  readonly nodeId = (value: unknown): string => String(value);
}

let mountedRoot: HTMLElement | null = null;

// The pointer cases leave Chromium in pointer modality; with `isolate: false`
// a later spec's programmatic focus() would then miss :focus-visible. A Tab
// press hands the next test and the next file keyboard modality again.
afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await userEvent.tab();
  (document.activeElement as HTMLElement | null)?.blur();
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

interface Ring {
  style: string;
  width: string;
  color: string;
  offset: string;
}

function ring(el: HTMLElement): Ring {
  return {
    style: computedValue(el, 'outline-style'),
    width: computedValue(el, 'outline-width'),
    color: computedValue(el, 'outline-color'),
    offset: computedValue(el, 'outline-offset'),
  };
}

async function focusRing(variant: Variant, by: 'mouse' | 'keyboard'): Promise<Ring> {
  const fixture = TestBed.createComponent(DefaultRingHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.componentInstance.variant.set(variant);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  const trigger = one(mountedRoot, '.cngx-field-trigger');
  expect(computedValue(trigger, 'outline-style')).toBe('none');
  if (by === 'mouse') {
    await userEvent.click(trigger);
    await nextFrame();
    expect(one(mountedRoot, '.cngx-select__panel').matches(':popover-open')).toBe(true);
    // The tree panel moves focus into its tree; the open state keeps the ring.
  } else {
    one(mountedRoot, '.before').focus();
    await userEvent.tab();
    await nextFrame();
    expect(trigger.matches(':focus-within')).toBe(true);
  }
  const result = ring(trigger);
  mountedRoot.remove();
  mountedRoot = null;
  return result;
}

describe('select default theme trigger focus ring', () => {
  for (const variant of VARIANTS) {
    it(`${variant}: a pointer focus draws the same ring as a keyboard focus`, async () => {
      const keyboard = await focusRing(variant, 'keyboard');
      const mouse = await focusRing(variant, 'mouse');
      expect(keyboard.style).toBe('solid');
      expect(keyboard.width).toBe('2px');
      expect(mouse).toEqual(keyboard);
    });
  }

  // The tree trigger keeps its own documented 1px offset (tree-select.component.css);
  // style, width and colour are the family's.
  it('draws one ring style, width and colour across all nine variants', async () => {
    const reference = await focusRing('select', 'mouse');
    for (const variant of VARIANTS) {
      const { style, width, color } = await focusRing(variant, 'mouse');
      expect({ variant, style, width, color }).toEqual({
        variant,
        style: reference.style,
        width: reference.width,
        color: reference.color,
      });
    }
  });
});
