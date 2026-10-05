import { Component, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxActionMultiSelect } from '../action-multi-select/action-multi-select.component';
import { CngxCombobox } from '../combobox/combobox.component';
import { CngxMultiSelect } from '../multi-select/multi-select.component';
import type { CngxSelectOptionDef } from './option.model';
import { CngxSelectChipOverflow } from './template-slots';

const OPTIONS: CngxSelectOptionDef<string>[] = [
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
  { value: 'black', label: 'Black' },
];

const BADGE = '.cngx-select__chip-overflow-badge';
const PROJECTED = '.projected-overflow';

function polyfillPopover(): void {
  const proto = HTMLElement.prototype as unknown as {
    showPopover?: () => void;
    hidePopover?: () => void;
    togglePopover?: () => boolean;
  };
  if (typeof proto.showPopover === 'function') {
    return;
  }
  proto.showPopover = function (this: HTMLElement) {
    this.setAttribute('data-popover-open', 'true');
  };
  proto.hidePopover = function (this: HTMLElement) {
    this.removeAttribute('data-popover-open');
  };
  proto.togglePopover = function (this: HTMLElement) {
    const open = this.hasAttribute('data-popover-open');
    if (open) {
      this.removeAttribute('data-popover-open');
    } else {
      this.setAttribute('data-popover-open', 'true');
    }
    return !open;
  };
}

@Component({
  template: `
    <cngx-multi-select
      [label]="'Colours'"
      [options]="options"
      [chipOverflow]="'truncate'"
      [maxVisibleChips]="1"
      [(values)]="values"
    ></cngx-multi-select>
  `,
  imports: [CngxMultiSelect],
})
class MultiDefaultHost {
  readonly options = OPTIONS;
  readonly values = signal<string[]>(['red', 'green', 'blue', 'black']);
}

@Component({
  template: `
    <cngx-multi-select
      [label]="'Colours'"
      [options]="options"
      [chipOverflow]="'truncate'"
      [maxVisibleChips]="1"
      [(values)]="values"
    >
      <ng-template cngxSelectChipOverflow let-n let-count="count" let-label="label">
        <span class="projected-overflow" [attr.data-implicit]="n" [attr.data-count]="count">{{
          label
        }}</span>
      </ng-template>
    </cngx-multi-select>
  `,
  imports: [CngxMultiSelect, CngxSelectChipOverflow],
})
class MultiProjectedHost {
  readonly options = OPTIONS;
  readonly values = signal<string[]>(['red', 'green', 'blue', 'black']);
}

@Component({
  template: `
    <cngx-combobox
      [label]="'Colours'"
      [options]="options"
      [chipOverflow]="'truncate'"
      [maxVisibleChips]="1"
      [(values)]="values"
    ></cngx-combobox>
  `,
  imports: [CngxCombobox],
})
class ComboboxDefaultHost {
  readonly options = OPTIONS;
  readonly values = signal<string[]>(['red', 'green', 'blue', 'black']);
}

@Component({
  template: `
    <cngx-combobox
      [label]="'Colours'"
      [options]="options"
      [chipOverflow]="'truncate'"
      [maxVisibleChips]="1"
      [(values)]="values"
    >
      <ng-template cngxSelectChipOverflow let-n let-count="count" let-label="label">
        <span class="projected-overflow" [attr.data-implicit]="n" [attr.data-count]="count">{{
          label
        }}</span>
      </ng-template>
    </cngx-combobox>
  `,
  imports: [CngxCombobox, CngxSelectChipOverflow],
})
class ComboboxProjectedHost {
  readonly options = OPTIONS;
  readonly values = signal<string[]>(['red', 'green', 'blue', 'black']);
}

@Component({
  template: `
    <cngx-action-multi-select
      [label]="'Colours'"
      [options]="options"
      [chipOverflow]="'truncate'"
      [maxVisibleChips]="1"
      [(values)]="values"
    ></cngx-action-multi-select>
  `,
  imports: [CngxActionMultiSelect],
})
class ActionMultiDefaultHost {
  readonly options = OPTIONS;
  readonly values = signal<string[]>(['red', 'green', 'blue', 'black']);
}

@Component({
  template: `
    <cngx-action-multi-select
      [label]="'Colours'"
      [options]="options"
      [chipOverflow]="'truncate'"
      [maxVisibleChips]="1"
      [(values)]="values"
    >
      <ng-template cngxSelectChipOverflow let-n let-count="count" let-label="label">
        <span class="projected-overflow" [attr.data-implicit]="n" [attr.data-count]="count">{{
          label
        }}</span>
      </ng-template>
    </cngx-action-multi-select>
  `,
  imports: [CngxActionMultiSelect, CngxSelectChipOverflow],
})
class ActionMultiProjectedHost {
  readonly options = OPTIONS;
  readonly values = signal<string[]>(['red', 'green', 'blue', 'black']);
}

const HOSTS: readonly { name: string; plain: Type<unknown>; projected: Type<unknown> }[] = [
  { name: 'CngxMultiSelect', plain: MultiDefaultHost, projected: MultiProjectedHost },
  { name: 'CngxCombobox', plain: ComboboxDefaultHost, projected: ComboboxProjectedHost },
  {
    name: 'CngxActionMultiSelect',
    plain: ActionMultiDefaultHost,
    projected: ActionMultiProjectedHost,
  },
];

function render(host: Type<unknown>): HTMLElement {
  const fixture = TestBed.createComponent(host);
  TestBed.flushEffects();
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('cngxSelectChipOverflow slot', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.resetTestingModule();
  });

  for (const { name, plain, projected: projectedHost } of HOSTS) {
    describe(name, () => {
      it('keeps the default +N badge without a projected template', () => {
        const root = render(plain);
        expect(root.querySelector(BADGE)?.textContent?.trim()).toBe('+3');
        expect(root.querySelector(BADGE)?.getAttribute('aria-hidden')).toBe('true');
        expect(root.querySelector(PROJECTED)).toBeNull();
      });

      it('replaces the badge with the projected template and passes count and label', () => {
        const root = render(projectedHost);
        expect(root.querySelector(BADGE)).toBeNull();
        const projected = root.querySelector(PROJECTED);
        expect(projected?.getAttribute('data-implicit')).toBe('3');
        expect(projected?.getAttribute('data-count')).toBe('3');
        expect(projected?.textContent?.trim()).toBe('+3');
      });
    });
  }
});
