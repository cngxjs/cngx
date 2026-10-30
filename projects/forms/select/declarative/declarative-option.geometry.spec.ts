import { CUSTOM_ELEMENTS_SCHEMA, Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxSelectDivider } from './divider.component';
import { CngxSelectOptgroup } from './optgroup.component';
import { CngxSelectOption } from './option.component';

// Runs in a real Chromium (the `test-geometry` target). The declarative parts
// sit in the cngx.components layer like select-base.css: a consumer rule in a
// later layer overrides their tokens, and under the Material bridge a
// declarative <cngx-option> row has the height and padding of a data-mode row.

@Component({
  selector: 'cngx-declarative-option-override-host',
  standalone: true,
  imports: [CngxSelectOption, CngxSelectOptgroup, CngxSelectDivider],
  styleUrls: ['../../../core/theming/layers.css', '../../../core/theming/system-tokens.css'],
  styles: [
    `
      @layer app {
        .consumer cngx-option {
          --cngx-select-option-padding: 3px 5px;
        }
        .consumer .cngx-select__group-header {
          --cngx-select-optgroup-padding: 3px 5px;
        }
        .consumer cngx-select-divider {
          --cngx-select-divider-margin: 3px 0;
        }
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="consumer">
      <cngx-option class="decl" [value]="'red'">Red</cngx-option>
      <cngx-optgroup class="group" label="Warm">
        <cngx-option [value]="'amber'">Amber</cngx-option>
      </cngx-optgroup>
      <cngx-select-divider class="divider" />
    </div>
    <cngx-option class="plain" [value]="'green'">Green</cngx-option>
  `,
})
class OverrideHost {}

@Component({
  selector: 'cngx-declarative-option-bridge-host',
  standalone: true,
  imports: [CngxSelectOption],
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/system-tokens.css',
    '../../../core/theming/reset.css',
    '../shared/select-base.css',
    '../shared/select-bridge-padding.spec-host.scss',
  ],
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <cngx-select-shell>
      <div class="cngx-select__panel">
        <div class="cngx-select__option data">Red</div>
        <cngx-option class="decl" [value]="'red'">Red</cngx-option>
      </div>
    </cngx-select-shell>
  `,
})
class BridgeHost {}

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

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('declarative select parts in the cascade', () => {
  it('lets a layered consumer rule override the declarative option padding', () => {
    const root = mount(OverrideHost);
    const decl = one(root, '.decl');
    expect(computedValue(decl, 'padding-top')).toBe('3px');
    expect(computedValue(decl, 'padding-left')).toBe('5px');
    expect(computedValue(one(root, '.plain'), 'padding-top')).not.toBe('3px');
  });

  it('lets a layered consumer rule override the optgroup header and divider', () => {
    const root = mount(OverrideHost);
    expect(computedValue(one(root, '.group .cngx-select__group-header'), 'padding-left')).toBe(
      '5px',
    );
    expect(computedValue(one(root, '.divider'), 'margin-top')).toBe('3px');
  });

  it('gives a bridged declarative row the height and padding of a data-mode row', () => {
    const root = mount(BridgeHost);
    const data = one(root, '.data');
    const decl = one(root, '.decl');
    expect(data.getBoundingClientRect().height).toBe(48);
    expect(decl.getBoundingClientRect().height).toBe(data.getBoundingClientRect().height);
    expect(computedValue(decl, 'padding-top')).toBe(computedValue(data, 'padding-top'));
    expect(computedValue(decl, 'padding-left')).toBe('16px');
  });
});
