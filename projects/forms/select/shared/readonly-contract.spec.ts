import { Component, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { form, readonly } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxFormField } from '@cngx/forms/field';

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

interface Variant {
  readonly name: string;
  readonly component: Type<unknown>;
  readonly selector: string;
  readonly inputs: string;
  readonly content?: string;
  readonly contentImports?: readonly Type<unknown>[];
  /** A pickable row inside the panel. */
  readonly optionSelector: string;
  readonly shape: 'scalar' | 'array';
  /** Variant reads printable keys on the closed trigger as a pick. */
  readonly typeaheadWhileClosed?: boolean;
  readonly chips?: boolean;
}

const LIST = '[options]="options"';
const TREE = '[nodes]="nodes" [nodeIdFn]="idFn" [labelFn]="labelFn"';

const VARIANTS: readonly Variant[] = [
  {
    name: 'CngxSelect',
    component: CngxSelect,
    selector: 'cngx-select',
    inputs: LIST,
    optionSelector: '[cngxOption]',
    shape: 'scalar',
    typeaheadWhileClosed: true,
  },
  {
    name: 'CngxMultiSelect',
    component: CngxMultiSelect,
    selector: 'cngx-multi-select',
    inputs: LIST,
    optionSelector: '[cngxOption]',
    shape: 'array',
    typeaheadWhileClosed: true,
    chips: true,
  },
  {
    name: 'CngxCombobox',
    component: CngxCombobox,
    selector: 'cngx-combobox',
    inputs: LIST,
    optionSelector: '[cngxOption]',
    shape: 'array',
    chips: true,
  },
  {
    name: 'CngxTypeahead',
    component: CngxTypeahead,
    selector: 'cngx-typeahead',
    inputs: LIST,
    optionSelector: '[cngxOption]',
    shape: 'scalar',
  },
  {
    name: 'CngxTreeSelect',
    component: CngxTreeSelect,
    selector: 'cngx-tree-select',
    inputs: TREE,
    optionSelector: '[role="treeitem"]',
    shape: 'array',
    chips: true,
  },
  {
    name: 'CngxReorderableMultiSelect',
    component: CngxReorderableMultiSelect,
    selector: 'cngx-reorderable-multi-select',
    inputs: LIST,
    optionSelector: '[cngxOption]',
    shape: 'array',
    typeaheadWhileClosed: true,
    chips: true,
  },
  {
    name: 'CngxActionSelect',
    component: CngxActionSelect,
    selector: 'cngx-action-select',
    inputs: LIST,
    optionSelector: '[cngxOption]',
    shape: 'scalar',
  },
  {
    name: 'CngxActionMultiSelect',
    component: CngxActionMultiSelect,
    selector: 'cngx-action-multi-select',
    inputs: LIST,
    optionSelector: '[cngxOption]',
    shape: 'array',
    chips: true,
  },
  {
    name: 'CngxSelectShell',
    component: CngxSelectShell,
    selector: 'cngx-select-shell',
    inputs: '',
    content: `
      <cngx-option [value]="'red'">Red</cngx-option>
      <cngx-option [value]="'green'">Green</cngx-option>
    `,
    contentImports: [CngxSelectOption],
    optionSelector: 'cngx-option',
    shape: 'scalar',
    typeaheadWhileClosed: true,
  },
];

interface VariantApi {
  open(): void;
  readonly panelOpen: () => boolean;
  readonly value?: () => unknown;
  readonly values?: () => unknown;
}

function flush(fixture: ComponentFixture<unknown>): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
}

// OD4: a readonly field opens for browsing and refuses every write; the
// combobox element announces it.
describe.each(VARIANTS)('readonly contract ($name)', (variant) => {
  @Component({ template: '', imports: [] })
  class ReadonlyHost {
    readonly options = [
      { value: 'red', label: 'Red' },
      { value: 'green', label: 'Green' },
    ];
    readonly nodes = [{ value: 'red' }, { value: 'green' }];
    readonly idFn = (v: unknown): string => String(v);
    readonly labelFn = (v: unknown): string => String(v);
    readonly readonlyFlag = signal(true);
    readonly model = signal<{ pick: string | string[] | null }>({
      pick: variant.shape === 'array' ? ['red'] : 'red',
    });
    readonly f = form(this.model, (p) => {
      readonly(p.pick, () => this.readonlyFlag());
    });
  }

  const mountedRoots: HTMLElement[] = [];
  afterEach(() => {
    mountedRoots.splice(0).forEach((el) => el.remove());
  });

  function mount() {
    TestBed.overrideComponent(ReadonlyHost, {
      set: {
        template: `
          <cngx-form-field [field]="f.pick">
            <${variant.selector} [label]="'Colour'" [clearable]="true" ${variant.inputs}>${
              variant.content ?? ''
            }</${variant.selector}>
          </cngx-form-field>
        `,
        imports: [CngxFormField, variant.component, ...(variant.contentImports ?? [])],
      },
    });
    const fixture = TestBed.createComponent(ReadonlyHost);
    const root = fixture.nativeElement as HTMLElement;
    document.body.appendChild(root);
    mountedRoots.push(root);
    fixture.detectChanges();
    flush(fixture);
    const de = fixture.debugElement.query(By.directive(variant.component));
    const el = de.nativeElement as HTMLElement;
    const combobox = el.querySelector<HTMLElement>('[role="combobox"]')!;
    const panel = () => el.querySelector<HTMLElement>('.cngx-select__panel')!;
    return {
      fixture,
      host: fixture.componentInstance,
      el,
      combobox,
      panel,
      api: de.componentInstance as VariantApi,
      // The field sync never writes a readonly field back, so the model alone
      // cannot show a refused write: the variant's own value must hold too.
      shown: (): unknown => {
        const api = de.componentInstance as VariantApi;
        return variant.shape === 'array' ? api.values?.() : api.value?.();
      },
    };
  }

  const seeded = (): unknown => (variant.shape === 'array' ? ['red'] : 'red');

  it('sets aria-readonly on the role="combobox" element and never on the host', () => {
    const { fixture, host, el, combobox } = mount();
    expect(combobox.getAttribute('aria-readonly')).toBe('true');
    expect(el.hasAttribute('aria-readonly')).toBe(false);
    host.readonlyFlag.set(false);
    flush(fixture);
    expect(combobox.getAttribute('aria-readonly')).toBeNull();
  });

  it('still opens the panel for browsing', () => {
    const { fixture, combobox, api } = mount();
    combobox.click();
    flush(fixture);
    expect(api.panelOpen()).toBe(true);
  });

  it('refuses a pick and leaves the field value unchanged', () => {
    const { fixture, host, api, panel, shown } = mount();
    expect(shown()).toEqual(seeded());
    api.open();
    flush(fixture);
    const rows = panel().querySelectorAll<HTMLElement>(variant.optionSelector);
    expect(rows.length).toBeGreaterThan(1);
    rows[1].click();
    flush(fixture);
    expect(shown()).toEqual(seeded());
    expect(host.model().pick).toEqual(seeded());
  });

  it('renders no clear button', () => {
    const { el, fixture, host } = mount();
    expect(el.querySelector('.cngx-select__clear-target')).toBeNull();
    host.readonlyFlag.set(false);
    flush(fixture);
    expect(el.querySelector('.cngx-select__clear-target')).not.toBeNull();
  });

  if (variant.chips) {
    it('offers no chip removal', () => {
      const { el, fixture, host } = mount();
      expect(el.querySelector('cngx-chip')).not.toBeNull();
      expect(el.querySelector('.cngx-chip__remove')).toBeNull();
      host.readonlyFlag.set(false);
      flush(fixture);
      expect(el.querySelector('.cngx-chip__remove')).not.toBeNull();
    });
  }

  if (variant.typeaheadWhileClosed) {
    it('ignores typeahead on the closed trigger', () => {
      const { fixture, host, combobox, api, shown } = mount();
      combobox.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true }));
      flush(fixture);
      expect(api.panelOpen()).toBe(false);
      expect(shown()).toEqual(seeded());
      expect(host.model().pick).toEqual(seeded());
    });
  }
});

describe('readonly contract (CngxReorderableMultiSelect reorder)', () => {
  @Component({
    template: `
      <cngx-form-field [field]="f.pick">
        <cngx-reorderable-multi-select [label]="'Colour'" [options]="options" />
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxReorderableMultiSelect],
  })
  class ReorderHost {
    readonly options = [
      { value: 'red', label: 'Red' },
      { value: 'green', label: 'Green' },
    ];
    readonly model = signal<{ pick: string[] }>({ pick: ['red', 'green'] });
    readonly f = form(this.model, (p) => {
      readonly(p.pick);
    });
  }

  it('marks the chip strip reorder group disabled', () => {
    const fixture = TestBed.createComponent(ReorderHost);
    fixture.detectChanges();
    flush(fixture);
    const group = (fixture.nativeElement as HTMLElement).querySelector('[role="group"]');
    expect(group?.getAttribute('aria-disabled')).toBe('true');
    expect(fixture.componentInstance.model().pick).toEqual(['red', 'green']);
  });
});

describe('readonly contract (CngxTreeSelect footer clear-all)', () => {
  @Component({
    template: `
      <cngx-form-field [field]="f.pick">
        <cngx-tree-select [label]="'Colour'" [nodes]="nodes" [nodeIdFn]="idFn" />
      </cngx-form-field>
    `,
    imports: [CngxFormField, CngxTreeSelect],
  })
  class TreeFooterHost {
    readonly nodes = [{ value: 'red' }, { value: 'green' }];
    readonly idFn = (v: unknown): string => String(v);
    readonly model = signal<{ pick: string[] }>({ pick: ['red'] });
    readonly f = form(this.model, (p) => {
      readonly(p.pick);
    });
  }

  it('renders the footer clear-all aria-disabled and refuses it', () => {
    const fixture = TestBed.createComponent(TreeFooterHost);
    fixture.detectChanges();
    flush(fixture);
    const tree = fixture.debugElement.query(By.directive(CngxTreeSelect))
      .componentInstance as CngxTreeSelect<string>;
    tree.open();
    flush(fixture);
    const clear = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '.cngx-tree-select__footer-clear',
    )!;
    expect(clear.getAttribute('aria-disabled')).toBe('true');
    clear.click();
    flush(fixture);
    expect(tree.values()).toEqual(['red']);
  });
});
