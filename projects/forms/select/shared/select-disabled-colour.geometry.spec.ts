/// <reference types="@vitest/browser-playwright" />

import { CUSTOM_ELEMENTS_SCHEMA, Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxActionMultiSelect } from '../action-multi-select/action-multi-select.component';
import { CngxActionSelect } from '../action-select/action-select.component';
import { CngxCombobox } from '../combobox/combobox.component';
import { CngxSelectOptgroup } from '../declarative/optgroup.component';
import { CngxSelectOption } from '../declarative/option.component';
import { CngxMultiSelect } from '../multi-select/multi-select.component';
import { CngxReorderableMultiSelect } from '../reorderable-multi-select/reorderable-multi-select.component';
import { CngxSelectShell } from '../select-shell/select-shell.component';
import { CngxSelect } from '../single-select/select.component';
import { CngxTreeSelect } from '../tree-select/tree-select.component';
import { CngxTypeahead } from '../typeahead/typeahead.component';
import type { CngxSelectOptionDef } from './option.model';

// Runs in a real Chromium (the `test-geometry` target). The select family
// paints disabled and quiet states by colour, never by opacity: a disabled
// option, declarative option and tree node take the 38% text recipe of a
// disabled field, the group header and the message rows the muted text rung,
// and no trigger, caret or clear button carries an opacity. Forced colors
// replace the faded colour with CanvasText, so disabled rows name GrayText.

const OPTIONS: CngxSelectOptionDef<string>[] = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
];

const SCHEMES = ['light', 'dark'] as const;

// The panel rows are static markup under the shipped stylesheets, so the
// data-mode rules are read without opening a popover. The declarative option
// and optgroup are the real components.
@Component({
  selector: 'cngx-select-disabled-colour-host',
  standalone: true,
  imports: [CngxSelectOption, CngxSelectOptgroup],
  styleUrls: [
    '../../../core/theming/system-tokens.css',
    './select-base.css',
    '../tree-select/tree-select-panel.component.css',
  ],
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @for (scheme of schemes; track scheme) {
      <div [attr.data-color-scheme]="scheme" [class]="'scheme-' + scheme">
        <div class="cngx-select__option opt-on">Red</div>
        <div class="cngx-select__option opt-off" aria-disabled="true">
          Off <span class="cngx-select__check check-off">✓</span>
        </div>
        <div class="cngx-select__group-header header">Warm</div>
        <div class="cngx-select__empty empty">No match</div>
        <cngx-option class="decl-off" [value]="'off'" [disabled]="true">Off</cngx-option>
        <cngx-optgroup class="group" label="Warm">
          <cngx-option [value]="'red'">Red</cngx-option>
        </cngx-optgroup>
        <cngx-tree-select-panel>
          <div class="cngx-tree-select__node node-off" aria-disabled="true">
            <span class="cngx-tree-select__twisty twisty-off">+</span> Alpha
          </div>
        </cngx-tree-select-panel>
        <span
          class="probe-disabled"
          style="color: color-mix(in oklab, var(--cngx-color-text) 38%, transparent)"
        ></span>
        <span class="probe-muted" style="color: var(--cngx-color-text-muted)"></span>
      </div>
    }
  `,
})
class PanelRowsHost {
  readonly schemes = SCHEMES;
}

// Every variant with a value and a clear button, plus every variant disabled
// inside a field box: the box scope is the one place the old trigger opacity
// was never lifted, so a boxed disabled select faded twice.
@Component({
  selector: 'cngx-select-disabled-trigger-host',
  standalone: true,
  imports: [
    CngxSelect,
    CngxMultiSelect,
    CngxCombobox,
    CngxTypeahead,
    CngxTreeSelect,
    CngxActionSelect,
    CngxActionMultiSelect,
    CngxReorderableMultiSelect,
    CngxSelectShell,
    CngxSelectOption,
  ],
  template: `
    @for (off of [false, true]; track off) {
      <span class="cngx-field-box" data-skin="outline" [class]="off ? 'box-off' : 'box-on'">
        <cngx-select class="v-select" skin="bare" [disabled]="off" [clearable]="true" [label]="'C'" [options]="options" [value]="'red'" />
        <cngx-multi-select class="v-multi" skin="bare" [disabled]="off" [clearable]="true" [label]="'C'" [options]="options" [values]="['red']" />
        <cngx-combobox class="v-combobox" skin="bare" [disabled]="off" [clearable]="true" [label]="'C'" [options]="options" [values]="['red']" />
        <cngx-typeahead class="v-typeahead" skin="bare" [disabled]="off" [clearable]="true" [label]="'C'" [options]="options" [value]="'red'" />
        <cngx-tree-select class="v-tree" skin="bare" [disabled]="off" [clearable]="true" [label]="'C'" [nodes]="nodes" [values]="['a']" [nodeIdFn]="nodeId" />
        <cngx-action-select class="v-action" skin="bare" [disabled]="off" [clearable]="true" [label]="'C'" [options]="options" [value]="'red'" />
        <cngx-action-multi-select class="v-action-multi" skin="bare" [disabled]="off" [clearable]="true" [label]="'C'" [options]="options" [values]="['red']" />
        <cngx-reorderable-multi-select class="v-reorder" skin="bare" [disabled]="off" [clearable]="true" [label]="'C'" [options]="options" [values]="['red']" />
        <cngx-select-shell class="v-shell" skin="bare" [disabled]="off" [clearable]="true" [label]="'C'" [value]="'red'">
          <cngx-option [value]="'red'">Red</cngx-option>
        </cngx-select-shell>
      </span>
    }
  `,
})
class TriggersHost {
  readonly options = OPTIONS;
  readonly nodes = [{ value: 'a', label: 'Alpha' }];
  readonly nodeId = (value: unknown): string => String(value);
}

const VARIANTS = [
  '.v-select',
  '.v-multi',
  '.v-combobox',
  '.v-typeahead',
  '.v-tree',
  '.v-action',
  '.v-action-multi',
  '.v-reorder',
  '.v-shell',
];

let mountedRoot: HTMLElement | null = null;

function mount(host: new () => unknown): HTMLElement {
  const fixture = TestBed.createComponent(host);
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

// Opacity of the element and every ancestor multiplied: the value a user
// actually sees, whichever element carries it.
function effectiveOpacity(el: Element): number {
  let value = 1;
  for (let node: Element | null = el; node; node = node.parentElement) {
    value *= parseFloat(computedValue(node, 'opacity'));
  }
  return value;
}

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe('select-family disabled and quiet states by colour', () => {
  describe.each(SCHEMES)('%s scheme', (scheme) => {
    const at = (root: HTMLElement, selector: string): HTMLElement =>
      one(root, `.scheme-${scheme} ${selector}`);

    it('fades a disabled data-mode option by the field recipe, not opacity', () => {
      const root = mount(PanelRowsHost);
      const off = at(root, '.opt-off');
      expect(effectiveOpacity(off)).toBe(1);
      expect(computedValue(off, 'color')).toBe(computedValue(at(root, '.probe-disabled'), 'color'));
      expect(computedValue(at(root, '.check-off'), 'color')).toBe(computedValue(off, 'color'));
      expect(computedValue(off, 'color')).not.toBe(computedValue(at(root, '.opt-on'), 'color'));
    });

    it('fades a disabled declarative option by the field recipe, not opacity', () => {
      const root = mount(PanelRowsHost);
      const off = at(root, '.decl-off');
      expect(effectiveOpacity(off)).toBe(1);
      expect(computedValue(off, 'color')).toBe(computedValue(at(root, '.probe-disabled'), 'color'));
    });

    it('fades a disabled tree node and its twisty by the field recipe, not opacity', () => {
      const root = mount(PanelRowsHost);
      const off = at(root, '.node-off');
      expect(effectiveOpacity(off)).toBe(1);
      expect(computedValue(off, 'color')).toBe(computedValue(at(root, '.probe-disabled'), 'color'));
      expect(computedValue(at(root, '.twisty-off'), 'color')).toBe(computedValue(off, 'color'));
    });

    it('quiets the group headers and the message row by the muted colour, not opacity', () => {
      const root = mount(PanelRowsHost);
      const muted = computedValue(at(root, '.probe-muted'), 'color');
      for (const header of [at(root, '.header'), at(root, '.group .cngx-select__group-header')]) {
        expect(effectiveOpacity(header)).toBe(1);
        expect(computedValue(header, 'color')).toBe(muted);
      }
      const empty = at(root, '.empty');
      expect(effectiveOpacity(empty)).toBe(1);
      expect(computedValue(empty, 'color')).toBe(muted);
    });
  });

  it.each(VARIANTS)('fades a disabled %s in a field box once, by colour', (variant) => {
    const root = mount(TriggersHost);
    const trigger = one(root, `.box-off ${variant} .cngx-field-trigger`);
    expect(trigger.getAttribute('aria-disabled') ?? 'native').not.toBe('false');
    expect(effectiveOpacity(trigger)).toBe(1);
    const input = trigger.querySelector(':scope > [role="combobox"]');
    if (input) {
      expect(effectiveOpacity(input)).toBe(1);
    }
  });

  it.each(VARIANTS)('rests the %s caret and clear button at full opacity', (variant) => {
    const root = mount(TriggersHost);
    const trigger = one(root, `.box-on ${variant} .cngx-field-trigger`);
    const caret = one(trigger, '[class*="__caret"]');
    expect(effectiveOpacity(caret)).toBe(1);
    const clear = trigger.querySelector('button[class$="__clear"], button[class$="__clear-all"]');
    expect(clear).not.toBeNull();
    expect(effectiveOpacity(clear!)).toBe(1);
  });

  describe('forced colors', () => {
    it.each([
      ['data-mode option', '.opt-off'],
      ['declarative option', '.decl-off'],
      ['tree node', '.node-off'],
    ])('names GrayText for a disabled %s', async (_name, selector) => {
      await cdp().send('Emulation.setEmulatedMedia', {
        features: [{ name: 'forced-colors', value: 'active' }],
      });
      const root = mount(PanelRowsHost);
      expect(matchMedia('(forced-colors: active)').matches).toBe(true);
      const probe = document.createElement('span');
      probe.style.color = 'GrayText';
      root.appendChild(probe);
      const off = one(root, `.scheme-light ${selector}`);
      expect(computedValue(off, 'color')).toBe(computedValue(probe, 'color'));
      expect(computedValue(off, 'color')).not.toBe(
        computedValue(one(root, '.scheme-light .opt-on'), 'color'),
      );
    });
  });
});
