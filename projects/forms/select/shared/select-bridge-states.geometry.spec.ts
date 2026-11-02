import { CUSTOM_ELEMENTS_SCHEMA, Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target) against the working-tree
// select bridge and the M3 system tokens (`./select-bridge-states.spec-host.scss`).
// The option rows must paint the mat-option state matrix as mat-select renders
// it in the material lab:
//
//   state                         fill                              label
//   rest                          none                              on-surface
//   hovered, not active           on-surface x hover opacity (8%)   on-surface
//   keyboard-active               on-surface x focus opacity (12%)  on-surface
//   selected                      secondary-container               on-secondary-container
//   selected + active / hovered   the active / hover layer          on-surface
//
// A multi-value row keeps no selected fill. The tree rows take the same hover
// and active layers. Every expectation is resolved from the --mat-sys-* tokens
// on a probe element, so the spec reads the roles, not the bridge's tokens.

const TEMPLATE = `
  <div class="probes">
    <span class="probe-hover" style="background: color-mix(in srgb, var(--mat-sys-on-surface) calc(var(--mat-sys-hover-state-layer-opacity) * 100%), transparent)"></span>
    <span class="probe-focus" style="background: color-mix(in srgb, var(--mat-sys-on-surface) calc(var(--mat-sys-focus-state-layer-opacity) * 100%), transparent)"></span>
    <span class="probe-selected" style="background: var(--mat-sys-secondary-container); color: var(--mat-sys-on-secondary-container)"></span>
    <span class="probe-text" style="color: var(--mat-sys-on-surface)"></span>
  </div>
  <cngx-select style="display: block; color: var(--mat-sys-on-surface)">
    <div class="cngx-select__panel" style="position: static">
      <div cngxListbox role="listbox">
        <div class="cngx-select__option row-rest">Red</div>
        <div class="cngx-select__option row-hover">Green</div>
        <div class="cngx-select__option cngx-option--highlighted row-active">Blue</div>
        <div class="cngx-select__option cngx-option--selected row-selected">Amber</div>
        <div class="cngx-select__option cngx-option--selected cngx-option--highlighted row-selected-active">
          Violet
        </div>
        <div class="cngx-select__option cngx-option--selected row-selected-hover">Teal</div>
      </div>
    </div>
  </cngx-select>
  <cngx-multi-select style="display: block">
    <div class="cngx-select__panel" style="position: static">
      <div cngxListbox role="listbox" aria-multiselectable="true">
        <div class="cngx-select__option cngx-select__option--indicated cngx-option--selected row-multi-selected">
          Red
        </div>
      </div>
    </div>
  </cngx-multi-select>
  <cngx-tree-select style="display: block">
    <cngx-tree-select-panel>
      <div class="cngx-tree-select__tree">
        <div class="cngx-tree-select__node node-hover">Alpha</div>
        <div class="cngx-tree-select__node cngx-tree-select__node--active node-active">Beta</div>
      </div>
    </cngx-tree-select-panel>
  </cngx-tree-select>
`;

@Component({
  selector: 'cngx-select-bridge-states-host',
  standalone: true,
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/system-tokens.css',
    '../../../common/theming/components/cngx-listbox.css',
    './select-base.css',
    '../tree-select/tree-select-panel.component.css',
    './select-bridge-states.spec-host.scss',
  ],
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: TEMPLATE,
})
class StatesHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(StatesHost);
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

function bg(root: ParentNode, selector: string): string {
  return computedValue(one(root, selector), 'background-color');
}

function ink(root: ParentNode, selector: string): string {
  return computedValue(one(root, selector), 'color');
}

afterEach(async () => {
  await userEvent.unhover(document.body);
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('select Material bridge option state layers', () => {
  it('resolves distinct M3 roles for the probes', () => {
    const root = mount();
    const values = new Set([
      bg(root, '.probe-hover'),
      bg(root, '.probe-focus'),
      bg(root, '.probe-selected'),
    ]);
    expect(values.size).toBe(3);
  });

  it('leaves a resting row unfilled in the on-surface ink', () => {
    const root = mount();
    expect(bg(root, '.row-rest')).toBe('rgba(0, 0, 0, 0)');
    expect(ink(root, '.row-rest')).toBe(ink(root, '.probe-text'));
  });

  it('paints the keyboard-active row with the focus state layer', () => {
    const root = mount();
    expect(bg(root, '.row-active')).toBe(bg(root, '.probe-focus'));
  });

  it('paints a hovered row that is not active with the hover state layer', async () => {
    const root = mount();
    await userEvent.hover(one(root, '.row-hover'));
    expect(bg(root, '.row-hover')).toBe(bg(root, '.probe-hover'));
  });

  it('fills a selected single-value row with secondary-container and its ink', () => {
    const root = mount();
    expect(bg(root, '.row-selected')).toBe(bg(root, '.probe-selected'));
    expect(ink(root, '.row-selected')).toBe(ink(root, '.probe-selected'));
  });

  it('shows the focus layer and the on-surface ink on a selected active row', () => {
    const root = mount();
    expect(bg(root, '.row-selected-active')).toBe(bg(root, '.probe-focus'));
    expect(ink(root, '.row-selected-active')).toBe(ink(root, '.probe-text'));
  });

  it('shows the hover layer and the on-surface ink on a selected hovered row', async () => {
    const root = mount();
    await userEvent.hover(one(root, '.row-selected-hover'));
    expect(bg(root, '.row-selected-hover')).toBe(bg(root, '.probe-hover'));
    expect(ink(root, '.row-selected-hover')).toBe(ink(root, '.probe-text'));
  });

  it('keeps a selected multi-value row unfilled', () => {
    const root = mount();
    expect(bg(root, '.row-multi-selected')).toBe('rgba(0, 0, 0, 0)');
  });

  it('paints the tree rows with the same hover and active layers', async () => {
    const root = mount();
    expect(bg(root, '.node-active')).toBe(bg(root, '.probe-focus'));
    await userEvent.hover(one(root, '.node-hover'));
    expect(bg(root, '.node-hover')).toBe(bg(root, '.probe-hover'));
  });
});
