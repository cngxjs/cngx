import { Component, type Type } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { CngxFormField } from '@cngx/forms/field';
import { createMockField, type MockFieldRef } from '@cngx/forms/field/testing';
import { mousePick } from '@cngx/testing';

import { CngxActionMultiSelect } from '../action-multi-select/action-multi-select.component';
import { CngxActionSelect } from '../action-select/action-select.component';
import { CngxCombobox } from '../combobox/combobox.component';
import { CngxSelectOption } from '../declarative/option.component';
import { CngxMultiSelect } from '../multi-select/multi-select.component';
import { CngxReorderableMultiSelect } from '../reorderable-multi-select/reorderable-multi-select.component';
import { CngxSelectShell } from '../select-shell/select-shell.component';
import { CngxSelect } from '../single-select/select.component';
import { CngxTypeahead } from '../typeahead/typeahead.component';
import type { CngxSelectOptionDef } from './option.model';

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

@Component({
  selector: 'mpt-select',
  template: `
    <cngx-form-field [field]="field">
      <cngx-select [label]="'Color'" [options]="options" />
    </cngx-form-field>
    <button type="button">Outside</button>
  `,
  imports: [CngxFormField, CngxSelect],
})
class SelectHost {
  readonly options = OPTIONS;
  private readonly mock = createMockField<string | undefined>({ name: 'color', value: undefined });
  readonly field = this.mock.accessor;
  readonly ref: MockFieldRef<string | undefined> = this.mock.ref;
}

@Component({
  selector: 'mpt-multi-select',
  template: `
    <cngx-form-field [field]="field">
      <cngx-multi-select [label]="'Colors'" [options]="options" />
    </cngx-form-field>
    <button type="button">Outside</button>
  `,
  imports: [CngxFormField, CngxMultiSelect],
})
class MultiSelectHost {
  readonly options = OPTIONS;
  private readonly mock = createMockField<string[]>({ name: 'colors', value: [] });
  readonly field = this.mock.accessor;
  readonly ref: MockFieldRef<string[]> = this.mock.ref;
}

@Component({
  selector: 'mpt-combobox',
  template: `
    <cngx-form-field [field]="field">
      <cngx-combobox [label]="'Colors'" [options]="options" />
    </cngx-form-field>
    <button type="button">Outside</button>
  `,
  imports: [CngxFormField, CngxCombobox],
})
class ComboboxHost {
  readonly options = OPTIONS;
  private readonly mock = createMockField<string[]>({ name: 'colors', value: [] });
  readonly field = this.mock.accessor;
  readonly ref: MockFieldRef<string[]> = this.mock.ref;
}

@Component({
  selector: 'mpt-typeahead',
  template: `
    <cngx-form-field [field]="field">
      <cngx-typeahead [label]="'Color'" [options]="options" [displayWith]="displayWith" />
    </cngx-form-field>
    <button type="button">Outside</button>
  `,
  imports: [CngxFormField, CngxTypeahead],
})
class TypeaheadHost {
  readonly options = OPTIONS;
  readonly displayWith = displayWith;
  private readonly mock = createMockField<string | undefined>({ name: 'color', value: undefined });
  readonly field = this.mock.accessor;
  readonly ref: MockFieldRef<string | undefined> = this.mock.ref;
}

@Component({
  selector: 'mpt-reorderable',
  template: `
    <cngx-form-field [field]="field">
      <cngx-reorderable-multi-select [label]="'Colors'" [options]="options" />
    </cngx-form-field>
    <button type="button">Outside</button>
  `,
  imports: [CngxFormField, CngxReorderableMultiSelect],
})
class ReorderableHost {
  readonly options = OPTIONS;
  private readonly mock = createMockField<string[]>({ name: 'colors', value: [] });
  readonly field = this.mock.accessor;
  readonly ref: MockFieldRef<string[]> = this.mock.ref;
}

@Component({
  selector: 'mpt-action-select',
  template: `
    <cngx-form-field [field]="field">
      <cngx-action-select [label]="'Color'" [options]="options" [displayWith]="displayWith" />
    </cngx-form-field>
    <button type="button">Outside</button>
  `,
  imports: [CngxFormField, CngxActionSelect],
})
class ActionSelectHost {
  readonly options = OPTIONS;
  readonly displayWith = displayWith;
  private readonly mock = createMockField<string | undefined>({ name: 'color', value: undefined });
  readonly field = this.mock.accessor;
  readonly ref: MockFieldRef<string | undefined> = this.mock.ref;
}

@Component({
  selector: 'mpt-action-multi-select',
  template: `
    <cngx-form-field [field]="field">
      <cngx-action-multi-select [label]="'Colors'" [options]="options" />
    </cngx-form-field>
    <button type="button">Outside</button>
  `,
  imports: [CngxFormField, CngxActionMultiSelect],
})
class ActionMultiSelectHost {
  readonly options = OPTIONS;
  private readonly mock = createMockField<string[]>({ name: 'colors', value: [] });
  readonly field = this.mock.accessor;
  readonly ref: MockFieldRef<string[]> = this.mock.ref;
}

@Component({
  selector: 'mpt-select-shell',
  template: `
    <cngx-form-field [field]="field">
      <cngx-select-shell [label]="'Color'">
        <cngx-option [value]="'red'">Red</cngx-option>
        <cngx-option [value]="'green'">Green</cngx-option>
      </cngx-select-shell>
    </cngx-form-field>
    <button type="button">Outside</button>
  `,
  imports: [CngxFormField, CngxSelectShell, CngxSelectOption],
})
class SelectShellHost {
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
  readonly showsLabelInInput?: boolean;
}

const VARIANTS: readonly Variant[] = [
  { name: 'CngxSelect', host: SelectHost, component: CngxSelect },
  { name: 'CngxMultiSelect', host: MultiSelectHost, component: CngxMultiSelect },
  { name: 'CngxCombobox', host: ComboboxHost, component: CngxCombobox },
  { name: 'CngxTypeahead', host: TypeaheadHost, component: CngxTypeahead, showsLabelInInput: true },
  {
    name: 'CngxReorderableMultiSelect',
    host: ReorderableHost,
    component: CngxReorderableMultiSelect,
  },
  {
    name: 'CngxActionSelect',
    host: ActionSelectHost,
    component: CngxActionSelect,
    showsLabelInInput: true,
  },
  { name: 'CngxActionMultiSelect', host: ActionMultiSelectHost, component: CngxActionMultiSelect },
  { name: 'CngxSelectShell', host: SelectShellHost, component: CngxSelectShell },
];

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  TestBed.flushEffects();
  await Promise.resolve();
  fixture.detectChanges();
  TestBed.flushEffects();
}

async function mount(variant: Variant): Promise<{
  fixture: ComponentFixture<FieldHost>;
  owner: HTMLElement;
  outside: HTMLElement;
  open: () => Promise<void>;
  option: (label: string) => HTMLElement;
}> {
  const fixture = TestBed.createComponent(variant.host);
  await settle(fixture);
  const root = fixture.nativeElement as HTMLElement;
  const owner = root.querySelector<HTMLElement>('[role="combobox"]');
  if (!owner) {
    throw new Error(`${variant.name}: no focus owner with role="combobox"`);
  }
  const outside = root.querySelector<HTMLElement>(':scope > button')!;
  const component = fixture.debugElement.query(By.directive(variant.component))
    .componentInstance as { open(): void };
  return {
    fixture,
    owner,
    outside,
    open: async () => {
      component.open();
      await settle(fixture);
    },
    option: (label) => {
      const match = Array.from(root.querySelectorAll<HTMLElement>('[role="option"]')).find((el) =>
        el.textContent?.includes(label),
      );
      if (!match) {
        throw new Error(`${variant.name}: no option "${label}"`);
      }
      return match;
    },
  };
}

describe.each(VARIANTS)('$name mouse pick', (variant) => {
  beforeAll(() => {
    polyfillPopover();
  });

  afterEach(() => {
    (document.activeElement as HTMLElement | null)?.blur();
  });

  it('a mouse pick leaves the field untouched and focus on the owner', async () => {
    const { fixture, owner, open, option } = await mount(variant);
    owner.focus();
    await open();

    mousePick(option('Green'));
    await settle(fixture);

    expect(fixture.componentInstance.ref.touched()).toBe(false);
    expect(document.activeElement).toBe(owner);
  });

  it('leaving the field marks it touched', async () => {
    const { fixture, owner, outside } = await mount(variant);
    owner.focus();
    await settle(fixture);

    outside.focus();
    await settle(fixture);

    expect(fixture.componentInstance.ref.touched()).toBe(true);
  });
});

describe.each(VARIANTS.filter((v) => v.showsLabelInInput))('$name mouse pick label', (variant) => {
  beforeAll(() => {
    polyfillPopover();
  });

  afterEach(() => {
    (document.activeElement as HTMLElement | null)?.blur();
  });

  it('a mouse pick shows the selected label in the input like an Enter pick', async () => {
    const { fixture, owner, open, option } = await mount(variant);
    owner.focus();
    await open();

    mousePick(option('Green'));
    await settle(fixture);

    expect((owner as HTMLInputElement).value).toBe('Green');
  });
});
