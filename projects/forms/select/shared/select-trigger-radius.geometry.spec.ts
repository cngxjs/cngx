import { Component, ViewEncapsulation, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

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

// Runs in a real Chromium (the `test-geometry` target). On the default theme
// a lone select trigger has the same corner radius as a bare <input>: both
// end their chain on the shared `--cngx-radius-md` scale step. The second
// host drops system-tokens.css, so the scale is unregistered and both fall
// back to the literal end of that chain.

const TEMPLATE = `
  <div style="display: block; width: 20rem; margin: 1rem">
    <input class="bare-input" aria-label="Bare" />
    <cngx-select [label]="'C'" [options]="options" />
    <cngx-multi-select [label]="'C'" [options]="options" />
    <cngx-combobox [label]="'C'" [options]="options" />
    <cngx-typeahead [label]="'C'" [options]="options" />
    <cngx-tree-select [label]="'C'" [nodes]="options" [nodeIdFn]="nodeId" />
    <cngx-reorderable-multi-select [label]="'C'" [options]="options" />
    <cngx-action-select [label]="'C'" [options]="options" />
    <cngx-action-multi-select [label]="'C'" [options]="options" />
    <cngx-select-shell [label]="'C'">
      <cngx-option [value]="'red'">Red</cngx-option>
    </cngx-select-shell>
  </div>
`;

const IMPORTS = [
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
];

abstract class RadiusHostBase {
  readonly options = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
  ];
  readonly nodeId = (value: unknown): string => String(value);
}

@Component({
  selector: 'cngx-select-radius-host',
  standalone: true,
  imports: IMPORTS,
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
  template: TEMPLATE,
})
class RadiusHost extends RadiusHostBase {}

@Component({
  selector: 'cngx-select-radius-no-scale-host',
  standalone: true,
  imports: IMPORTS,
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/reset.css',
    '../../../core/theming/base.css',
    '../../theming/components/cngx-field-affix.css',
    '../../theming/components/cngx-field-skin.css',
    './select-base.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: TEMPLATE,
})
class RadiusNoScaleHost extends RadiusHostBase {}

const HOSTS = [
  'cngx-select',
  'cngx-multi-select',
  'cngx-combobox',
  'cngx-typeahead',
  'cngx-tree-select',
  'cngx-reorderable-multi-select',
  'cngx-action-select',
  'cngx-action-multi-select',
  'cngx-select-shell',
];

let mountedRoot: HTMLElement | null = null;

function mount(host: Type<RadiusHostBase>): HTMLElement {
  const fixture = TestBed.createComponent(host);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  return mountedRoot;
}

function triggerRadii(root: HTMLElement): Record<string, string> {
  return Object.fromEntries(
    HOSTS.map((tag) => {
      const trigger = root.querySelector<HTMLElement>(`${tag} .cngx-field-trigger`);
      expect(trigger, tag).not.toBeNull();
      return [tag, computedValue(trigger!, 'border-top-left-radius')];
    }),
  );
}

function inputRadius(root: HTMLElement): string {
  return computedValue(root.querySelector('.bare-input')!, 'border-top-left-radius');
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('select trigger radius (geometry)', () => {
  it('matches the bare input radius on every variant trigger', () => {
    const root = mount(RadiusHost);
    const input = inputRadius(root);

    expect(input).toBe('8px');
    expect(triggerRadii(root)).toEqual(Object.fromEntries(HOSTS.map((tag) => [tag, input])));
  });

  it('matches the bare input radius when the radius scale is not loaded', () => {
    const root = mount(RadiusNoScaleHost);
    const input = inputRadius(root);

    expect(input).toBe('8px');
    expect(triggerRadii(root)).toEqual(Object.fromEntries(HOSTS.map((tag) => [tag, input])));
  });

  it('still follows --cngx-select-radius set on an ancestor', () => {
    const root = mount(RadiusHost);
    root.querySelector<HTMLElement>('div')!.style.setProperty('--cngx-select-radius', '0.25rem');

    expect(triggerRadii(root)).toEqual(Object.fromEntries(HOSTS.map((tag) => [tag, '4px'])));
  });
});
