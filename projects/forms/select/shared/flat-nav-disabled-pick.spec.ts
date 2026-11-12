import { Component, signal, type Type } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxSelectOption } from '../declarative/option.component';
import { CngxMultiSelect } from '../multi-select/multi-select.component';
import { CngxReorderableMultiSelect } from '../reorderable-multi-select/reorderable-multi-select.component';
import { CngxSelectShell } from '../select-shell/select-shell.component';
import { CngxSelect } from '../single-select/select.component';
import {
  CNGX_FLAT_NAV_STRATEGY,
  createDefaultFlatNavStrategy,
  type CngxFlatNavAction,
  type CngxFlatNavContext,
  type CngxFlatNavStrategy,
} from './flat-nav-strategy';
import type { CngxSelectOptionDef } from './option.model';

const OPTIONS: CngxSelectOptionDef<string>[] = [
  { value: 'red', label: 'Red', disabled: true },
  { value: 'green', label: 'Green' },
];

// Returns the first option for every printable key, disabled or not.
const pickFirst: CngxFlatNavStrategy = {
  onPageJump: createDefaultFlatNavStrategy().onPageJump,
  onTypeaheadWhileClosed<T>(ctx: CngxFlatNavContext<T>): CngxFlatNavAction<T> {
    return { kind: 'select', option: ctx.options[0] };
  },
};

@Component({
  selector: 'fnd-select',
  template: `<cngx-select [label]="'Colour'" [options]="options" [(value)]="value" />`,
  imports: [CngxSelect],
})
class SelectHost {
  readonly options = OPTIONS;
  readonly value = signal<string | undefined>(undefined);
  picked(): unknown {
    return this.value();
  }
}

@Component({
  selector: 'fnd-multi-select',
  template: `<cngx-multi-select [label]="'Colours'" [options]="options" [(values)]="values" />`,
  imports: [CngxMultiSelect],
})
class MultiSelectHost {
  readonly options = OPTIONS;
  readonly values = signal<string[]>([]);
  picked(): unknown {
    return this.values();
  }
}

@Component({
  selector: 'fnd-reorderable',
  template: `
    <cngx-reorderable-multi-select [label]="'Colours'" [options]="options" [(values)]="values" />
  `,
  imports: [CngxReorderableMultiSelect],
})
class ReorderableHost {
  readonly options = OPTIONS;
  readonly values = signal<string[]>([]);
  picked(): unknown {
    return this.values();
  }
}

@Component({
  selector: 'fnd-select-shell',
  template: `
    <cngx-select-shell [label]="'Colour'" [(value)]="value">
      <cngx-option [value]="'red'" [disabled]="true">Red</cngx-option>
      <cngx-option [value]="'green'">Green</cngx-option>
    </cngx-select-shell>
  `,
  imports: [CngxSelectShell, CngxSelectOption],
})
class SelectShellHost {
  readonly value = signal<string | undefined>(undefined);
  picked(): unknown {
    return this.value();
  }
}

interface Variant {
  readonly name: string;
  readonly host: Type<{ picked(): unknown }>;
  readonly unchanged: unknown;
}

const VARIANTS: readonly Variant[] = [
  { name: 'CngxSelect', host: SelectHost, unchanged: undefined },
  { name: 'CngxMultiSelect', host: MultiSelectHost, unchanged: [] },
  { name: 'CngxReorderableMultiSelect', host: ReorderableHost, unchanged: [] },
  { name: 'CngxSelectShell', host: SelectShellHost, unchanged: undefined },
];

function settle(fixture: ComponentFixture<unknown>): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
}

describe.each(VARIANTS)('$name closed typeahead with a custom flat-nav strategy', (variant) => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: CNGX_FLAT_NAV_STRATEGY, useValue: pickFirst }],
    });
  });

  it('ignores a select action that names a disabled option', () => {
    const fixture = TestBed.createComponent(variant.host);
    fixture.detectChanges();
    settle(fixture);
    const trigger = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '[role="combobox"]',
    );
    expect(trigger).not.toBeNull();

    trigger!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'r', bubbles: true, cancelable: true }),
    );
    settle(fixture);

    expect(fixture.componentInstance.picked()).toEqual(variant.unchanged);
  });
});
