import { Component, type Type } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createManualState, type ManualAsyncState } from '@cngx/common/data';
import { CngxFormField } from '@cngx/forms/field';
import { createMockField, type MockFieldRef } from '@cngx/forms/field/testing';
import type { CngxTreeNode } from '@cngx/utils';
import { mousePick } from '@cngx/testing';

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
import type { CngxSelectOptionDef, CngxSelectOptionsInput } from './option.model';
import { CngxSelectAction } from './template-slots';

// jsdom does not implement the Popover API - polyfill so the panels can open.
function polyfillPopover(): void {
  const proto = HTMLElement.prototype as unknown as {
    showPopover?: () => void;
    hidePopover?: () => void;
    togglePopover?: (force?: boolean) => boolean;
  };
  if (typeof proto.showPopover !== 'function') {
    proto.showPopover = function (this: HTMLElement) {
      this.dispatchEvent(new Event('beforetoggle', { bubbles: false }));
      this.setAttribute('data-popover-open', 'true');
      this.dispatchEvent(new Event('toggle', { bubbles: false }));
    };
    proto.hidePopover = function (this: HTMLElement) {
      this.removeAttribute('data-popover-open');
      this.dispatchEvent(new Event('toggle', { bubbles: false }));
    };
    proto.togglePopover = function (this: HTMLElement) {
      if (this.hasAttribute('data-popover-open')) {
        (this as HTMLElement & { hidePopover: () => void }).hidePopover();
        return false;
      }
      (this as HTMLElement & { showPopover: () => void }).showPopover();
      return true;
    };
  }
}

const OPTIONS: CngxSelectOptionDef<string>[] = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
];

const displayWith = (v: string): string => OPTIONS.find((o) => o.value === v)?.label ?? '';

const NODES: CngxTreeNode<string>[] = [
  { value: 'a', children: [{ value: 'a1' }, { value: 'a2' }] },
  { value: 'b' },
];

@Component({
  selector: 'flc-select',
  template: `
    <cngx-form-field [field]="field">
      <cngx-select [label]="'Color'" [options]="options" [clearable]="true" />
    </cngx-form-field>
    <button type="button">Outside</button>
  `,
  imports: [CngxFormField, CngxSelect],
})
class SelectHost {
  readonly options = OPTIONS;
  private readonly mock = createMockField<string | undefined>({ name: 'color', value: 'red' });
  readonly field = this.mock.accessor;
  readonly ref: MockFieldRef<string | undefined> = this.mock.ref;
}

@Component({
  selector: 'flc-multi-select',
  template: `
    <cngx-form-field [field]="field">
      <cngx-multi-select [label]="'Colors'" [options]="options" [clearable]="true" />
    </cngx-form-field>
    <button type="button">Outside</button>
  `,
  imports: [CngxFormField, CngxMultiSelect],
})
class MultiSelectHost {
  readonly options = OPTIONS;
  private readonly mock = createMockField<string[]>({ name: 'colors', value: ['red'] });
  readonly field = this.mock.accessor;
  readonly ref: MockFieldRef<string[]> = this.mock.ref;
}

@Component({
  selector: 'flc-combobox',
  template: `
    <cngx-form-field [field]="field">
      <cngx-combobox [label]="'Colors'" [options]="options" [clearable]="true" />
    </cngx-form-field>
    <button type="button">Outside</button>
  `,
  imports: [CngxFormField, CngxCombobox],
})
class ComboboxHost {
  readonly options = OPTIONS;
  private readonly mock = createMockField<string[]>({ name: 'colors', value: ['red'] });
  readonly field = this.mock.accessor;
  readonly ref: MockFieldRef<string[]> = this.mock.ref;
}

@Component({
  selector: 'flc-typeahead',
  template: `
    <cngx-form-field [field]="field">
      <cngx-typeahead
        [label]="'Color'"
        [options]="options"
        [displayWith]="displayWith"
        [clearable]="true"
      />
    </cngx-form-field>
    <button type="button">Outside</button>
  `,
  imports: [CngxFormField, CngxTypeahead],
})
class TypeaheadHost {
  readonly options = OPTIONS;
  readonly displayWith = displayWith;
  private readonly mock = createMockField<string | undefined>({ name: 'color', value: 'red' });
  readonly field = this.mock.accessor;
  readonly ref: MockFieldRef<string | undefined> = this.mock.ref;
}

@Component({
  selector: 'flc-reorderable',
  template: `
    <cngx-form-field [field]="field">
      <cngx-reorderable-multi-select [label]="'Colors'" [options]="options" [clearable]="true" />
    </cngx-form-field>
    <button type="button">Outside</button>
  `,
  imports: [CngxFormField, CngxReorderableMultiSelect],
})
class ReorderableHost {
  readonly options = OPTIONS;
  private readonly mock = createMockField<string[]>({ name: 'colors', value: ['red'] });
  readonly field = this.mock.accessor;
  readonly ref: MockFieldRef<string[]> = this.mock.ref;
}

@Component({
  selector: 'flc-action-select',
  template: `
    <cngx-form-field [field]="field">
      <cngx-action-select
        [label]="'Color'"
        [options]="options"
        [displayWith]="displayWith"
        [clearable]="true"
      >
        <ng-template cngxSelectAction>
          <button type="button" class="flc-action">Create</button>
        </ng-template>
      </cngx-action-select>
    </cngx-form-field>
    <button type="button">Outside</button>
  `,
  imports: [CngxFormField, CngxActionSelect, CngxSelectAction],
})
class ActionSelectHost {
  readonly options = OPTIONS;
  readonly displayWith = displayWith;
  private readonly mock = createMockField<string | undefined>({ name: 'color', value: 'red' });
  readonly field = this.mock.accessor;
  readonly ref: MockFieldRef<string | undefined> = this.mock.ref;
}

@Component({
  selector: 'flc-action-multi-select',
  template: `
    <cngx-form-field [field]="field">
      <cngx-action-multi-select [label]="'Colors'" [options]="options" [clearable]="true">
        <ng-template cngxSelectAction>
          <button type="button" class="flc-action">Create</button>
        </ng-template>
      </cngx-action-multi-select>
    </cngx-form-field>
    <button type="button">Outside</button>
  `,
  imports: [CngxFormField, CngxActionMultiSelect, CngxSelectAction],
})
class ActionMultiSelectHost {
  readonly options = OPTIONS;
  private readonly mock = createMockField<string[]>({ name: 'colors', value: ['red'] });
  readonly field = this.mock.accessor;
  readonly ref: MockFieldRef<string[]> = this.mock.ref;
}

@Component({
  selector: 'flc-select-shell',
  template: `
    <cngx-form-field [field]="field">
      <cngx-select-shell [label]="'Color'" [clearable]="true">
        <cngx-select-search />
        <cngx-option [value]="'red'">Red</cngx-option>
        <cngx-option [value]="'green'">Green</cngx-option>
      </cngx-select-shell>
    </cngx-form-field>
    <button type="button">Outside</button>
  `,
  imports: [CngxFormField, CngxSelectShell, CngxSelectOption, CngxSelectSearch],
})
class SelectShellHost {
  private readonly mock = createMockField<string | undefined>({ name: 'color', value: 'red' });
  readonly field = this.mock.accessor;
  readonly ref: MockFieldRef<string | undefined> = this.mock.ref;
}

@Component({
  selector: 'flc-tree-select',
  template: `
    <cngx-form-field [field]="field">
      <cngx-tree-select [label]="'Nodes'" [nodes]="nodes" [nodeIdFn]="idFn" [clearable]="true" />
    </cngx-form-field>
    <button type="button">Outside</button>
  `,
  imports: [CngxFormField, CngxTreeSelect],
})
class TreeSelectHost {
  readonly nodes = NODES;
  readonly idFn = (v: string): string => v;
  private readonly mock = createMockField<string[]>({ name: 'nodes', value: ['b'] });
  readonly field = this.mock.accessor;
  readonly ref: MockFieldRef<string[]> = this.mock.ref;
}

@Component({
  selector: 'flc-select-retry',
  template: `
    <cngx-form-field [field]="field">
      <cngx-select [label]="'Color'" [state]="state" />
    </cngx-form-field>
    <button type="button">Outside</button>
  `,
  imports: [CngxFormField, CngxSelect],
})
class SelectRetryHost {
  readonly state: ManualAsyncState<CngxSelectOptionsInput<string>> =
    createManualState<CngxSelectOptionsInput<string>>();
  private readonly mock = createMockField<string | undefined>({ name: 'color', value: undefined });
  readonly field = this.mock.accessor;
  readonly ref: MockFieldRef<string | undefined> = this.mock.ref;
}

interface FieldHost {
  readonly ref: MockFieldRef<unknown>;
}

interface Variant {
  readonly name: string;
  readonly host: Type<FieldHost>;
  readonly component: Type<{ open(): void }>;
  /** Removes one selected value; chip variants only. */
  readonly chipRemove?: boolean;
  /** Clears the whole value. */
  readonly clear: string;
  /** A focusable inside the panel, besides the options. */
  readonly inPanel?: string;
  /** Opening moves focus from the trigger into the panel. */
  readonly focusesPanelOnOpen?: boolean;
}

const VARIANTS: readonly Variant[] = [
  { name: 'CngxSelect', host: SelectHost, component: CngxSelect, clear: '.cngx-select__clear' },
  {
    name: 'CngxMultiSelect',
    host: MultiSelectHost,
    component: CngxMultiSelect,
    chipRemove: true,
    clear: '.cngx-multi-select__clear-all',
  },
  {
    name: 'CngxCombobox',
    host: ComboboxHost,
    component: CngxCombobox,
    chipRemove: true,
    clear: '.cngx-combobox__clear-all',
  },
  {
    name: 'CngxTypeahead',
    host: TypeaheadHost,
    component: CngxTypeahead,
    clear: '.cngx-typeahead__clear',
  },
  {
    name: 'CngxReorderableMultiSelect',
    host: ReorderableHost,
    component: CngxReorderableMultiSelect,
    chipRemove: true,
    clear: '.cngx-reorderable-multi-select__clear-all',
  },
  {
    name: 'CngxActionSelect',
    host: ActionSelectHost,
    component: CngxActionSelect,
    clear: '.cngx-action-select__clear',
    inPanel: '.flc-action',
  },
  {
    name: 'CngxActionMultiSelect',
    host: ActionMultiSelectHost,
    component: CngxActionMultiSelect,
    chipRemove: true,
    clear: '.cngx-action-multi-select__clear-all',
    inPanel: '.flc-action',
  },
  {
    name: 'CngxSelectShell',
    host: SelectShellHost,
    component: CngxSelectShell,
    clear: '.cngx-select-shell__clear',
    inPanel: '.cngx-select-search__input',
  },
  {
    name: 'CngxTreeSelect',
    host: TreeSelectHost,
    component: CngxTreeSelect,
    chipRemove: true,
    clear: '.cngx-tree-select__clear-all',
    focusesPanelOnOpen: true,
  },
];

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  TestBed.flushEffects();
  await Promise.resolve();
  fixture.detectChanges();
  TestBed.flushEffects();
  await Promise.resolve();
}

interface Mounted<H> {
  readonly fixture: ComponentFixture<H>;
  readonly root: HTMLElement;
  readonly owner: HTMLElement;
  readonly outside: HTMLElement;
  readonly fieldFocused: () => boolean;
  readonly open: () => Promise<void>;
  readonly find: (selector: string) => HTMLElement;
}

async function mount<H>(
  name: string,
  host: Type<H>,
  component: Type<{ open(): void }>,
): Promise<Mounted<H>> {
  const fixture = TestBed.createComponent(host);
  await settle(fixture);
  const root = fixture.nativeElement as HTMLElement;
  const owner = root.querySelector<HTMLElement>('[role="combobox"]');
  if (!owner) {
    throw new Error(`${name}: no focus owner with role="combobox"`);
  }
  const outside = root.querySelector<HTMLElement>(':scope > button')!;
  const formField = root.querySelector<HTMLElement>('cngx-form-field')!;
  const instance = fixture.debugElement.query(By.directive(component)).componentInstance as {
    open(): void;
  };
  return {
    fixture,
    root,
    owner,
    outside,
    fieldFocused: () => formField.classList.contains('cngx-field--focused'),
    open: async () => {
      instance.open();
      await settle(fixture);
    },
    find: (selector) => {
      const el = root.querySelector<HTMLElement>(selector);
      if (!el) {
        throw new Error(`${name}: nothing matches ${selector}`);
      }
      return el;
    },
  };
}

function mountVariant(variant: Variant): Promise<Mounted<FieldHost>> {
  return mount(variant.name, variant.host, variant.component);
}

describe.each(VARIANTS)('$name focus leaves the control', (variant) => {
  const itOpensIntoPanel = variant.focusesPanelOnOpen ? it.fails : it;

  beforeAll(() => {
    polyfillPopover();
  });

  afterEach(() => {
    (document.activeElement as HTMLElement | null)?.blur();
  });

  it('leaving to the outside marks the field touched and clears focused', async () => {
    const { fixture, owner, outside, fieldFocused } = await mountVariant(variant);
    owner.focus();
    await settle(fixture);
    expect(fieldFocused()).toBe(true);

    outside.focus();
    await settle(fixture);

    expect(fixture.componentInstance.ref.touched()).toBe(true);
    expect(fieldFocused()).toBe(false);
  });

  itOpensIntoPanel('opening keeps the field focused and untouched', async () => {
    const { fixture, owner, open, fieldFocused } = await mountVariant(variant);
    owner.focus();
    await open();

    expect(fixture.componentInstance.ref.touched()).toBe(false);
    expect(fieldFocused()).toBe(true);
  });

  itOpensIntoPanel('closing with Escape leaves the field untouched', async () => {
    const { fixture, owner, open } = await mountVariant(variant);
    owner.focus();
    await open();

    (document.activeElement as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    await settle(fixture);

    expect(fixture.componentInstance.ref.touched()).toBe(false);
  });

  it.fails(
    'clicking the clear control leaves the field untouched with focus on the owner',
    async () => {
      const { fixture, owner, find } = await mountVariant(variant);
      owner.focus();
      await settle(fixture);

      mousePick(find(variant.clear));
      await settle(fixture);

      expect(fixture.componentInstance.ref.touched()).toBe(false);
      expect(document.activeElement).toBe(owner);
    },
  );
});

describe.each(VARIANTS.filter((v) => v.chipRemove))('$name chip removal', (variant) => {
  beforeAll(() => {
    polyfillPopover();
  });

  afterEach(() => {
    (document.activeElement as HTMLElement | null)?.blur();
  });

  it.fails('clicking a chip x leaves the field untouched with focus on the owner', async () => {
    const { fixture, owner, find } = await mountVariant(variant);
    owner.focus();
    await settle(fixture);

    mousePick(find('.cngx-chip__remove'));
    await settle(fixture);

    expect(fixture.componentInstance.ref.touched()).toBe(false);
    expect(document.activeElement).toBe(owner);
  });
});

describe.each(VARIANTS.filter((v) => v.inPanel))('$name focusable inside the panel', (variant) => {
  beforeAll(() => {
    polyfillPopover();
  });

  afterEach(() => {
    (document.activeElement as HTMLElement | null)?.blur();
  });

  it.fails('clicking it keeps the field focused and untouched', async () => {
    const { fixture, owner, open, find, fieldFocused } = await mountVariant(variant);
    owner.focus();
    await open();

    const target = find(variant.inPanel!);
    mousePick(target);
    await settle(fixture);

    expect(document.activeElement).toBe(target);
    expect(fixture.componentInstance.ref.touched()).toBe(false);
    expect(fieldFocused()).toBe(true);
  });
});

describe('CngxSelect retry inside the panel', () => {
  beforeAll(() => {
    polyfillPopover();
  });

  afterEach(() => {
    (document.activeElement as HTMLElement | null)?.blur();
  });

  it.fails('clicking retry leaves the field untouched with focus on the owner', async () => {
    const { fixture, owner, open, find } = await mount(
      'CngxSelect retry',
      SelectRetryHost,
      CngxSelect,
    );
    fixture.componentInstance.state.setError(new Error('network'));
    owner.focus();
    await open();

    mousePick(find('button.cngx-select__error-retry'));
    await settle(fixture);

    expect(fixture.componentInstance.ref.touched()).toBe(false);
    expect(document.activeElement).toBe(owner);
  });
});

describe('CngxTreeSelect tree container', () => {
  beforeAll(() => {
    polyfillPopover();
  });

  afterEach(() => {
    (document.activeElement as HTMLElement | null)?.blur();
  });

  async function openTree(): Promise<Mounted<TreeSelectHost> & { tree: HTMLElement }> {
    const mounted = await mount('CngxTreeSelect', TreeSelectHost, CngxTreeSelect);
    mounted.owner.focus();
    await mounted.open();
    return { ...mounted, tree: mounted.find('[role="tree"]') };
  }

  it('opening moves focus into the tree', async () => {
    const { tree } = await openTree();
    expect(document.activeElement).toBe(tree);
  });

  it.fails('a twisty click keeps focus on the tree and the field untouched', async () => {
    const { fixture, tree, find } = await openTree();

    mousePick(find('.cngx-tree-select__twisty'));
    await settle(fixture);

    expect(document.activeElement).toBe(tree);
    expect(fixture.componentInstance.ref.touched()).toBe(false);
  });

  it('a row click keeps focus on the tree', async () => {
    const { fixture, tree, find } = await openTree();

    mousePick(find('.cngx-tree-select__label'));
    await settle(fixture);

    expect(document.activeElement).toBe(tree);
  });
});
