import { Component, TemplateRef, type Type, viewChild } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeAll, describe, expect, it } from 'vitest';

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
import { provideSelectConfig, withTemplates } from './config';
import type { CngxSelectOptionDef } from './option.model';
import { CngxSelectLoadingGlyph } from './template-slots';

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

const NODES: CngxTreeNode<string>[] = [{ value: 'a', children: [{ value: 'a1' }] }, { value: 'b' }];

const GLYPH = `<ng-template cngxSelectLoadingGlyph><span class="lgs-projected-glyph"></span></ng-template>`;

@Component({
  selector: 'lgs-select',
  template: `
    <cngx-select [label]="'Color'" [options]="options" [loading]="true" loadingVariant="spinner">
      ${GLYPH}
    </cngx-select>
  `,
  imports: [CngxSelect, CngxSelectLoadingGlyph],
})
class SelectHost {
  readonly options = OPTIONS;
}

@Component({
  selector: 'lgs-multi-select',
  template: `
    <cngx-multi-select
      [label]="'Colors'"
      [options]="options"
      [loading]="true"
      loadingVariant="spinner"
    >
      ${GLYPH}
    </cngx-multi-select>
  `,
  imports: [CngxMultiSelect, CngxSelectLoadingGlyph],
})
class MultiSelectHost {
  readonly options = OPTIONS;
}

@Component({
  selector: 'lgs-reorderable',
  template: `
    <cngx-reorderable-multi-select
      [label]="'Colors'"
      [options]="options"
      [loading]="true"
      loadingVariant="spinner"
    >
      ${GLYPH}
    </cngx-reorderable-multi-select>
  `,
  imports: [CngxReorderableMultiSelect, CngxSelectLoadingGlyph],
})
class ReorderableHost {
  readonly options = OPTIONS;
}

@Component({
  selector: 'lgs-combobox',
  template: `
    <cngx-combobox [label]="'Colors'" [options]="options" [loading]="true" loadingVariant="spinner">
      ${GLYPH}
    </cngx-combobox>
  `,
  imports: [CngxCombobox, CngxSelectLoadingGlyph],
})
class ComboboxHost {
  readonly options = OPTIONS;
}

@Component({
  selector: 'lgs-typeahead',
  template: `
    <cngx-typeahead
      [label]="'Color'"
      [options]="options"
      [displayWith]="displayWith"
      [loading]="true"
      loadingVariant="spinner"
    >
      ${GLYPH}
    </cngx-typeahead>
  `,
  imports: [CngxTypeahead, CngxSelectLoadingGlyph],
})
class TypeaheadHost {
  readonly options = OPTIONS;
  readonly displayWith = displayWith;
}

@Component({
  selector: 'lgs-action-select',
  template: `
    <cngx-action-select
      [label]="'Color'"
      [options]="options"
      [displayWith]="displayWith"
      [loading]="true"
      loadingVariant="spinner"
    >
      ${GLYPH}
    </cngx-action-select>
  `,
  imports: [CngxActionSelect, CngxSelectLoadingGlyph],
})
class ActionSelectHost {
  readonly options = OPTIONS;
  readonly displayWith = displayWith;
}

@Component({
  selector: 'lgs-action-multi-select',
  template: `
    <cngx-action-multi-select
      [label]="'Colors'"
      [options]="options"
      [loading]="true"
      loadingVariant="spinner"
    >
      ${GLYPH}
    </cngx-action-multi-select>
  `,
  imports: [CngxActionMultiSelect, CngxSelectLoadingGlyph],
})
class ActionMultiSelectHost {
  readonly options = OPTIONS;
}

@Component({
  selector: 'lgs-select-shell',
  template: `
    <cngx-select-shell [label]="'Color'" [loading]="true" loadingVariant="spinner">
      ${GLYPH}
      <cngx-option [value]="'red'">Red</cngx-option>
      <cngx-option [value]="'green'">Green</cngx-option>
    </cngx-select-shell>
  `,
  imports: [CngxSelectShell, CngxSelectOption, CngxSelectLoadingGlyph],
})
class SelectShellHost {}

@Component({
  selector: 'lgs-tree-select',
  template: `
    <cngx-tree-select
      [label]="'Nodes'"
      [nodes]="nodes"
      [nodeIdFn]="idFn"
      [loading]="true"
      loadingVariant="spinner"
    >
      ${GLYPH}
    </cngx-tree-select>
  `,
  imports: [CngxTreeSelect, CngxSelectLoadingGlyph],
})
class TreeSelectHost {
  readonly nodes = NODES;
  readonly idFn = (v: string): string => v;
}

interface Variant {
  readonly name: string;
  readonly host: Type<unknown>;
  readonly component: Type<{ open(): void }>;
}

const VARIANTS: readonly Variant[] = [
  { name: 'CngxSelect', host: SelectHost, component: CngxSelect },
  { name: 'CngxMultiSelect', host: MultiSelectHost, component: CngxMultiSelect },
  {
    name: 'CngxReorderableMultiSelect',
    host: ReorderableHost,
    component: CngxReorderableMultiSelect,
  },
  { name: 'CngxCombobox', host: ComboboxHost, component: CngxCombobox },
  { name: 'CngxTypeahead', host: TypeaheadHost, component: CngxTypeahead },
  { name: 'CngxActionSelect', host: ActionSelectHost, component: CngxActionSelect },
  { name: 'CngxActionMultiSelect', host: ActionMultiSelectHost, component: CngxActionMultiSelect },
  { name: 'CngxSelectShell', host: SelectShellHost, component: CngxSelectShell },
  { name: 'CngxTreeSelect', host: TreeSelectHost, component: CngxTreeSelect },
];

@Component({
  selector: 'lgs-config-glyph',
  template: `<ng-template #glyph><span class="lgs-config-glyph"></span></ng-template>`,
})
class ConfigGlyphHolder {
  readonly glyph = viewChild.required<TemplateRef<void>>('glyph');
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  TestBed.flushEffects();
  await Promise.resolve();
  fixture.detectChanges();
  TestBed.flushEffects();
  await Promise.resolve();
}

async function mountOpen(variant: Variant): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(variant.host);
  await settle(fixture);
  const instance = fixture.debugElement.query(By.directive(variant.component))
    .componentInstance as { open(): void };
  instance.open();
  await settle(fixture);
  return fixture.nativeElement as HTMLElement;
}

describe.each(VARIANTS)('$name projected loading glyph', (variant) => {
  beforeAll(() => {
    polyfillPopover();
  });

  it('renders a projected *cngxSelectLoadingGlyph instead of the built-in spinner', async () => {
    const root = await mountOpen(variant);

    expect(root.querySelector('.cngx-select__spinner-wrap')).not.toBeNull();
    expect(root.querySelector('.lgs-projected-glyph')).not.toBeNull();
    expect(root.querySelector('.cngx-select__spinner')).toBeNull();
  });

  it('prefers the projected glyph over templates.loadingGlyph from withTemplates', async () => {
    const holder = TestBed.createComponent(ConfigGlyphHolder);
    holder.detectChanges();
    const configGlyph = holder.componentInstance.glyph();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideSelectConfig(withTemplates({ loadingGlyph: configGlyph }))],
    });
    const root = await mountOpen(variant);

    expect(root.querySelector('.lgs-projected-glyph')).not.toBeNull();
    expect(root.querySelector('.lgs-config-glyph')).toBeNull();
  });
});
