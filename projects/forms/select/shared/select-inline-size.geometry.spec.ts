import { Component, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxFormField } from '@cngx/forms/field';
import { createMockField } from '@cngx/forms/field/testing';
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

// Runs in a real Chromium (the `test-geometry` target). A select sizes like an
// input: its min-width token is a preferred width that a standalone or
// content-sized select keeps, and a narrower container shrinks the select
// instead of letting it spill into the next cell. A bare select hugs its
// content unless the container sets --cngx-field-bare-inline-size, which then
// lines it up with the bare inputs; a select nested in a field box never takes
// the token.

const OPTIONS = [{ value: 'red', label: 'Red' }];

// [class, preferred width in px at 16px root]
const FLOORED: readonly (readonly [string, number])[] = [
  ['v-select', 160],
  ['v-multi', 160],
  ['v-combobox', 192],
  ['v-tree', 160],
  ['v-reorder', 160],
  ['v-action-multi', 192],
  ['v-shell', 160],
];
const ALL = [...FLOORED.map(([c]) => c), 'v-typeahead', 'v-action'];

const IMPORTS = [
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
  CngxFormField,
];

abstract class BaseHost {
  readonly options = OPTIONS;
  readonly nodeId = (value: unknown): string => String(value);
  readonly field = createMockField({ name: 'c' }).accessor;
  skin: 'outline' | 'bare' | undefined = undefined;
}

// Each select is the only child of an 8rem block cell: the host is an
// inline-block there, so the floor would widen it past the cell.
@Component({
  selector: 'cngx-select-narrow-cell-host',
  standalone: true,
  imports: IMPORTS,
  template: `<div class="cells" style="display: grid; grid-template-columns: repeat(9, 8rem)">
    <div class="cell">
      <cngx-select class="v-select" [skin]="skin" [label]="'C'" [options]="options" />
    </div>
    <div class="cell">
      <cngx-multi-select class="v-multi" [skin]="skin" [label]="'C'" [options]="options" />
    </div>
    <div class="cell">
      <cngx-combobox class="v-combobox" [skin]="skin" [label]="'C'" [options]="options" />
    </div>
    <div class="cell">
      <cngx-tree-select class="v-tree" [skin]="skin" [label]="'C'" [nodeIdFn]="nodeId" />
    </div>
    <div class="cell">
      <cngx-reorderable-multi-select
        class="v-reorder"
        [skin]="skin"
        [label]="'C'"
        [options]="options"
      />
    </div>
    <div class="cell">
      <cngx-action-multi-select
        class="v-action-multi"
        [skin]="skin"
        [label]="'C'"
        [options]="options"
      />
    </div>
    <div class="cell">
      <cngx-select-shell class="v-shell" [skin]="skin" [label]="'C'"
        ><cngx-option [value]="'red'">Red</cngx-option></cngx-select-shell
      >
    </div>
    <div class="cell">
      <cngx-typeahead class="v-typeahead" [skin]="skin" [label]="'C'" [options]="options" />
    </div>
    <div class="cell">
      <cngx-action-select class="v-action" [skin]="skin" [label]="'C'" [options]="options" />
    </div>
  </div>`,
})
class NarrowCellHost extends BaseHost {}

// Each select inside a labelled cngx-form-field (a flex column), in an 8rem cell.
@Component({
  selector: 'cngx-select-narrow-field-host',
  standalone: true,
  imports: IMPORTS,
  template: `<div style="display: grid; grid-template-columns: repeat(9, 8rem)">
    <div class="cell">
      <cngx-form-field [field]="field"
        ><cngx-select class="v-select" [skin]="skin" [label]="'C'" [options]="options"
      /></cngx-form-field>
    </div>
    <div class="cell">
      <cngx-form-field [field]="field"
        ><cngx-multi-select class="v-multi" [skin]="skin" [label]="'C'" [options]="options"
      /></cngx-form-field>
    </div>
    <div class="cell">
      <cngx-form-field [field]="field"
        ><cngx-combobox class="v-combobox" [skin]="skin" [label]="'C'" [options]="options"
      /></cngx-form-field>
    </div>
    <div class="cell">
      <cngx-form-field [field]="field"
        ><cngx-tree-select class="v-tree" [skin]="skin" [label]="'C'" [nodeIdFn]="nodeId"
      /></cngx-form-field>
    </div>
    <div class="cell">
      <cngx-form-field [field]="field"
        ><cngx-reorderable-multi-select
          class="v-reorder"
          [skin]="skin"
          [label]="'C'"
          [options]="options"
      /></cngx-form-field>
    </div>
    <div class="cell">
      <cngx-form-field [field]="field"
        ><cngx-action-multi-select
          class="v-action-multi"
          [skin]="skin"
          [label]="'C'"
          [options]="options"
      /></cngx-form-field>
    </div>
    <div class="cell">
      <cngx-form-field [field]="field"
        ><cngx-select-shell class="v-shell" [skin]="skin" [label]="'C'"
          ><cngx-option [value]="'red'">Red</cngx-option></cngx-select-shell
        ></cngx-form-field
      >
    </div>
    <div class="cell">
      <cngx-form-field [field]="field"
        ><cngx-typeahead class="v-typeahead" [skin]="skin" [label]="'C'" [options]="options"
      /></cngx-form-field>
    </div>
    <div class="cell">
      <cngx-form-field [field]="field"
        ><cngx-action-select class="v-action" [skin]="skin" [label]="'C'" [options]="options"
      /></cngx-form-field>
    </div>
  </div>`,
})
class NarrowFieldHost extends BaseHost {}

// Content-sized contexts: a wrapping flex row and a plain block page.
@Component({
  selector: 'cngx-select-content-sized-host',
  standalone: true,
  imports: IMPORTS,
  template: `<div class="row" style="display: flex; flex-wrap: wrap; gap: 8px; inline-size: 120rem">
      <cngx-select class="v-zero" style="--cngx-select-min-width: 0px" [label]="'C'" [options]="options" />
      <cngx-select class="v-select" [skin]="skin" [label]="'C'" [options]="options" />
      <cngx-multi-select class="v-multi" [skin]="skin" [label]="'C'" [options]="options" />
      <cngx-combobox class="v-combobox" [skin]="skin" [label]="'C'" [options]="options" />
      <cngx-tree-select class="v-tree" [skin]="skin" [label]="'C'" [nodeIdFn]="nodeId" />
      <cngx-reorderable-multi-select
        class="v-reorder"
        [skin]="skin"
        [label]="'C'"
        [options]="options"
      />
      <cngx-action-multi-select
        class="v-action-multi"
        [skin]="skin"
        [label]="'C'"
        [options]="options"
      />
      <cngx-select-shell class="v-shell" [skin]="skin" [label]="'C'"
        ><cngx-option [value]="'red'">Red</cngx-option></cngx-select-shell
      >
      <cngx-typeahead class="v-typeahead" [skin]="skin" [label]="'C'" [options]="options" />
      <cngx-action-select class="v-action" [skin]="skin" [label]="'C'" [options]="options" />
    </div>
    <div class="page" style="inline-size: 40rem">
      <cngx-select class="v-select" [skin]="skin" [label]="'C'" [options]="options" />
      <cngx-multi-select class="v-multi" [skin]="skin" [label]="'C'" [options]="options" />
      <cngx-combobox class="v-combobox" [skin]="skin" [label]="'C'" [options]="options" />
      <cngx-tree-select class="v-tree" [skin]="skin" [label]="'C'" [nodeIdFn]="nodeId" />
      <cngx-reorderable-multi-select
        class="v-reorder"
        [skin]="skin"
        [label]="'C'"
        [options]="options"
      />
      <cngx-action-multi-select
        class="v-action-multi"
        [skin]="skin"
        [label]="'C'"
        [options]="options"
      />
      <cngx-select-shell class="v-shell" [skin]="skin" [label]="'C'"
        ><cngx-option [value]="'red'">Red</cngx-option></cngx-select-shell
      >
      <cngx-typeahead class="v-typeahead" [skin]="skin" [label]="'C'" [options]="options" />
      <cngx-action-select class="v-action" [skin]="skin" [label]="'C'" [options]="options" />
    </div>`,
})
class ContentSizedHost extends BaseHost {}

// Bare: a toolbar with and without the container token, plus a picker nested
// in a field box inside the token container.
@Component({
  selector: 'cngx-select-bare-toolbar-host',
  standalone: true,
  imports: IMPORTS,
  template: `<div
      class="with-token"
      style="display: flex; flex-wrap: wrap; gap: 8px; inline-size: 200rem; --cngx-field-bare-inline-size: 16rem"
    >
      <cngx-select class="v-select" [skin]="skin" [label]="'C'" [options]="options" />
      <cngx-multi-select class="v-multi" [skin]="skin" [label]="'C'" [options]="options" />
      <cngx-combobox class="v-combobox" [skin]="skin" [label]="'C'" [options]="options" />
      <cngx-tree-select class="v-tree" [skin]="skin" [label]="'C'" [nodeIdFn]="nodeId" />
      <cngx-reorderable-multi-select
        class="v-reorder"
        [skin]="skin"
        [label]="'C'"
        [options]="options"
      />
      <cngx-action-multi-select
        class="v-action-multi"
        [skin]="skin"
        [label]="'C'"
        [options]="options"
      />
      <cngx-select-shell class="v-shell" [skin]="skin" [label]="'C'"
        ><cngx-option [value]="'red'">Red</cngx-option></cngx-select-shell
      >
      <cngx-typeahead class="v-typeahead" [skin]="skin" [label]="'C'" [options]="options" />
      <cngx-action-select class="v-action" [skin]="skin" [label]="'C'" [options]="options" />

      <span class="cngx-field-box" data-skin="outline">
        <cngx-select class="nested" skin="bare" [label]="'C'" [options]="options" />
        <input type="text" />
      </span>
    </div>
    <div class="no-token" style="display: flex; flex-wrap: wrap; gap: 8px; inline-size: 200rem">
      <cngx-select class="v-select" [skin]="skin" [label]="'C'" [options]="options" />
      <cngx-multi-select class="v-multi" [skin]="skin" [label]="'C'" [options]="options" />
      <cngx-combobox class="v-combobox" [skin]="skin" [label]="'C'" [options]="options" />
      <cngx-tree-select class="v-tree" [skin]="skin" [label]="'C'" [nodeIdFn]="nodeId" />
      <cngx-reorderable-multi-select
        class="v-reorder"
        [skin]="skin"
        [label]="'C'"
        [options]="options"
      />
      <cngx-action-multi-select
        class="v-action-multi"
        [skin]="skin"
        [label]="'C'"
        [options]="options"
      />
      <cngx-select-shell class="v-shell" [skin]="skin" [label]="'C'"
        ><cngx-option [value]="'red'">Red</cngx-option></cngx-select-shell
      >
      <cngx-typeahead class="v-typeahead" [skin]="skin" [label]="'C'" [options]="options" />
      <cngx-action-select class="v-action" [skin]="skin" [label]="'C'" [options]="options" />
    </div>`,
})
class BareToolbarHost extends BaseHost {
  override skin = 'bare' as const;
}

let mountedRoot: HTMLElement | null = null;

function mount(host: Type<BaseHost>): HTMLElement {
  const fixture = TestBed.createComponent(host);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function width(root: ParentNode, selector: string): number {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return Math.round(el.getBoundingClientRect().width);
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('select-family inline size', () => {
  it.each(ALL)('keeps the %s host inside an 8rem block cell', (variant) => {
    const root = mount(NarrowCellHost);
    expect(width(root, `.${variant}`)).toBeLessThanOrEqual(128);
    expect(width(root, `.${variant} .cngx-field-trigger`)).toBeLessThanOrEqual(128);
  });

  it.each(ALL)('shrinks the %s trigger to an 8rem cell inside a form field', (variant) => {
    const root = mount(NarrowFieldHost);
    expect(width(root, `.${variant} .cngx-field-trigger`)).toBe(128);
  });

  it.each(FLOORED)('keeps the %s preferred width (%ipx) in a wrapping row', (variant, floor) => {
    const root = mount(ContentSizedHost);
    expect(width(root, `.row .${variant}`)).toBeGreaterThanOrEqual(floor);
  });

  // The min-width token is registered non-inheriting and set on the host, so
  // the preferred width must be resolved there, not on a descendant.
  it('honours a min-width token set on the host', () => {
    const root = mount(ContentSizedHost);
    expect(width(root, '.row .v-zero')).toBeLessThan(160);
  });

  it.each(FLOORED)('keeps the %s preferred width (%ipx) on a plain page', (variant, floor) => {
    const root = mount(ContentSizedHost);
    expect(width(root, `.page .${variant}`)).toBeGreaterThanOrEqual(floor);
  });

  it.each(ALL)('lines the bare %s up at the container token width', (variant) => {
    const root = mount(BareToolbarHost);
    expect(width(root, `.with-token .${variant}`)).toBe(256);
  });

  it.each(FLOORED.map(([c]) => c))(
    'keeps the bare %s at its content width without the token',
    (variant) => {
      const root = mount(BareToolbarHost);
      expect(width(root, `.no-token .${variant}`)).toBeLessThan(256);
    },
  );

  // Typeahead and action select are full-width blocks by default; an unset
  // token must not take that away.
  it.each(['v-typeahead', 'v-action'])(
    'keeps the bare %s at its full-width default without the token',
    (variant) => {
      const root = mount(BareToolbarHost);
      expect(width(root, `.no-token .${variant}`)).toBeGreaterThan(256);
    },
  );

  it('keeps a bare select nested in a field box at its content width under the token', () => {
    const root = mount(BareToolbarHost);
    expect(width(root, '.with-token .nested')).toBeLessThan(256);
  });
});
