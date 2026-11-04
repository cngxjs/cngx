import { Component, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, describe, expect, it } from 'vitest';

import type { CngxTreeNode } from '@cngx/utils';

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
import type { CngxSelectOptionDef } from './option.model';

interface FormControlLike {
  readonly empty: () => boolean;
}

function flush(fixture: ComponentFixture<unknown>): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
}

const LANGUAGES: CngxSelectOptionDef<string>[] = [
  { value: 'de', label: 'German' },
  { value: 'fr', label: 'French' },
];

const mountedRoots: HTMLElement[] = [];
afterEach(() => {
  mountedRoots.splice(0).forEach((el) => el.remove());
});

function attach(fixture: ComponentFixture<unknown>): HTMLElement {
  const root = fixture.nativeElement as HTMLElement;
  document.body.appendChild(root);
  mountedRoots.push(root);
  return root;
}

const chipTexts = (root: HTMLElement): string[] =>
  Array.from(root.querySelectorAll('cngx-chip')).map((c) => c.textContent?.trim() ?? '');

interface ArrayVariant {
  readonly name: string;
  readonly component: Type<unknown>;
  readonly selector: string;
}

const ARRAY_VARIANTS: readonly ArrayVariant[] = [
  { name: 'CngxMultiSelect', component: CngxMultiSelect, selector: 'cngx-multi-select' },
  { name: 'CngxCombobox', component: CngxCombobox, selector: 'cngx-combobox' },
  {
    name: 'CngxReorderableMultiSelect',
    component: CngxReorderableMultiSelect,
    selector: 'cngx-reorderable-multi-select',
  },
  {
    name: 'CngxActionMultiSelect',
    component: CngxActionMultiSelect,
    selector: 'cngx-action-multi-select',
  },
];

// A8 / A17: a value bound before its options load (or one a server list
// dropped) is still drawn, so the trigger agrees with `isEmpty`.
describe.each(ARRAY_VARIANTS)('unresolved values ($name)', (variant) => {
  @Component({ template: '', imports: [] })
  class ArrayHost {
    readonly options = signal<CngxSelectOptionDef<string>[]>([]);
    values = ['de', 'xx'];
  }

  function mount() {
    TestBed.overrideComponent(ArrayHost, {
      set: {
        template: `
          <${variant.selector}
            [label]="'Languages'"
            [placeholder]="'Pick languages'"
            [options]="options()"
            [(values)]="values"
          />
        `,
        imports: [variant.component],
      },
    });
    const fixture = TestBed.createComponent(ArrayHost);
    const root = attach(fixture);
    fixture.detectChanges();
    flush(fixture);
    const cmp = fixture.debugElement.query(By.directive(variant.component))
      .componentInstance as FormControlLike;
    return { fixture, root, cmp, host: fixture.componentInstance };
  }

  it('draws a chip per value before the options arrive', () => {
    const { root, cmp } = mount();
    expect(cmp.empty()).toBe(false);
    expect(chipTexts(root)).toEqual(['de', 'xx']);
    expect(root.textContent).not.toContain('Pick languages');
  });

  it('relabels the chip once its option arrives and keeps the unmatched one', () => {
    const { fixture, root, host } = mount();
    host.options.set(LANGUAGES);
    flush(fixture);
    expect(chipTexts(root)).toEqual(['German', 'xx']);
  });
});

describe('unresolved values (CngxSelect)', () => {
  @Component({
    template: `
      <cngx-select
        [label]="'Language'"
        [placeholder]="'Pick a language'"
        [options]="options()"
        [(value)]="value"
      />
    `,
    imports: [CngxSelect],
  })
  class SingleHost {
    readonly options = signal<CngxSelectOptionDef<string>[]>([]);
    readonly value = signal<string | undefined>('de');
  }

  function mount() {
    const fixture = TestBed.createComponent(SingleHost);
    const root = attach(fixture);
    fixture.detectChanges();
    flush(fixture);
    const select = fixture.debugElement.query(By.directive(CngxSelect))
      .componentInstance as CngxSelect<string>;
    const label = () => root.querySelector<HTMLElement>('.cngx-select__label')!;
    return { fixture, root, select, label, host: fixture.componentInstance };
  }

  it('shows the value, not the placeholder, before the options arrive', () => {
    const { select, label } = mount();
    expect(select.empty()).toBe(false);
    expect(label().textContent?.trim()).toBe('de');
    expect(label().classList.contains('cngx-select__label--placeholder')).toBe(false);
    expect(select.triggerValue()).toBe('de');
  });

  it('switches to the option label once it arrives', () => {
    const { fixture, host, label } = mount();
    host.options.set(LANGUAGES);
    flush(fixture);
    expect(label().textContent?.trim()).toBe('German');
  });

  it('shows the placeholder only when nothing is selected', () => {
    const { fixture, host, label } = mount();
    host.value.set(undefined);
    flush(fixture);
    expect(label().textContent?.trim()).toBe('Pick a language');
    expect(label().classList.contains('cngx-select__label--placeholder')).toBe(true);
  });
});

describe('unresolved values (CngxTreeSelect)', () => {
  @Component({
    template: `
      <cngx-tree-select
        [label]="'Languages'"
        [nodes]="nodes()"
        [nodeIdFn]="idFn"
        [(values)]="values"
      />
    `,
    imports: [CngxTreeSelect],
  })
  class TreeHost {
    readonly nodes = signal<readonly CngxTreeNode<string>[]>([]);
    readonly idFn = (v: string): string => v;
    values = ['de'];
  }

  it('draws the value as a chip before the nodes arrive, labelled by the same rule', () => {
    const fixture = TestBed.createComponent(TreeHost);
    const root = attach(fixture);
    fixture.detectChanges();
    flush(fixture);
    const tree = fixture.debugElement.query(By.directive(CngxTreeSelect))
      .componentInstance as CngxTreeSelect<string>;
    expect(tree.empty()).toBe(false);
    expect(chipTexts(root)).toEqual(['de']);
    fixture.componentInstance.nodes.set([{ value: 'de', label: 'German' }]);
    flush(fixture);
    expect(chipTexts(root)).toEqual(['German']);
  });
});

// F3: the input-led scalar composites draw the raw bound value into their
// field before the options load, so an unresolved value is never lost.
describe.each([
  { name: 'CngxTypeahead', component: CngxTypeahead, selector: 'cngx-typeahead' },
  { name: 'CngxActionSelect', component: CngxActionSelect, selector: 'cngx-action-select' },
])('unresolved values ($name)', (variant) => {
  @Component({ template: '', imports: [] })
  class InputHost {
    readonly options = signal<CngxSelectOptionDef<string>[]>([]);
    readonly value = signal<string | undefined>('green');
  }

  function mount() {
    TestBed.overrideComponent(InputHost, {
      set: {
        template: `
          <${variant.selector}
            [label]="'Colour'"
            [placeholder]="'Pick a colour'"
            [options]="options()"
            [(value)]="value"
          />
        `,
        imports: [variant.component],
      },
    });
    const fixture = TestBed.createComponent(InputHost);
    const root = attach(fixture);
    fixture.detectChanges();
    flush(fixture);
    const input = () => root.querySelector<HTMLInputElement>('input')!;
    return { fixture, root, input, host: fixture.componentInstance };
  }

  it('shows the raw value in the input before the options arrive', () => {
    const { input } = mount();
    expect(input().value).toBe('green');
  });
});

describe('unresolved values (CngxSelectShell)', () => {
  @Component({ template: '', imports: [] })
  class ShellHost {
    readonly value = signal<string | undefined>('green');
    readonly show = signal(false);
  }

  function mount() {
    TestBed.overrideComponent(ShellHost, {
      set: {
        template: `
          <cngx-select-shell [label]="'Colour'" [placeholder]="'Pick a colour'" [(value)]="value" [presentation]="'anchored'">
            @if (show()) {
              <cngx-option [value]="'red'">Red</cngx-option>
              <cngx-option [value]="'green'">Green</cngx-option>
            }
          </cngx-select-shell>
        `,
        imports: [CngxSelectShell, CngxSelectOption],
      },
    });
    const fixture = TestBed.createComponent(ShellHost);
    const root = attach(fixture);
    fixture.detectChanges();
    flush(fixture);
    const label = () => root.querySelector<HTMLElement>('.cngx-select__label')!;
    return { fixture, root, label, host: fixture.componentInstance };
  }

  // A23 / H3: a projected option behind @if is not mounted yet, but the bound
  // value must still read as the raw value, not fall back to the placeholder.
  it.fails('shows the raw value, not the placeholder, while the options are hidden', () => {
    const { label } = mount();
    expect(label().textContent?.trim()).toBe('green');
    expect(label().classList.contains('cngx-select__label--placeholder')).toBe(false);
  });
});
