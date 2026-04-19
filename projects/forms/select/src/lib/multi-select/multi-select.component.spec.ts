import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxListbox } from '@cngx/common/interactive';
import { CngxPopover } from '@cngx/common/popover';

import { CngxMultiSelect, type CngxMultiSelectChange } from './multi-select.component';
import type { CngxSelectOptionDef } from '../shared/option.model';

// jsdom has no Popover API — polyfill so CngxPopover can toggle.
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
  { value: 'red', label: 'Rot' },
  { value: 'green', label: 'Grün' },
  { value: 'blue', label: 'Blau', disabled: true },
];

@Component({
  template: `
    <cngx-multi-select
      [label]="'Farbe'"
      [options]="options"
      [placeholder]="placeholder"
      [clearable]="clearable"
      [(values)]="values"
      (selectionChange)="lastChange.set($event)"
      (openedChange)="openedLog.set($event)"
    />
  `,
  imports: [CngxMultiSelect],
})
class Host {
  readonly options = OPTIONS;
  readonly values = signal<string[]>([]);
  readonly placeholder = 'Bitte wählen';
  clearable = false;
  readonly lastChange = signal<CngxMultiSelectChange<string> | null>(null);
  readonly openedLog = signal<boolean | null>(null);
}

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
}

beforeEach(() => {
  polyfillPopover();
});

describe('CngxMultiSelect — skeleton', () => {
  it('renders the placeholder when no value is selected', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const placeholder: HTMLElement | null = fixture.nativeElement.querySelector(
      '.cngx-multi-select__placeholder',
    );
    expect(placeholder).not.toBeNull();
    expect(placeholder!.textContent!.trim()).toBe('Bitte wählen');
  });

  it('sets aria-multiselectable on the inner listbox', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    // Open the panel so the listbox is rendered.
    fixture.componentInstance.values.set([]);
    const trigger: HTMLElement = fixture.nativeElement.querySelector(
      '.cngx-multi-select__trigger',
    );
    trigger.click();
    flush(fixture);
    const listbox = fixture.debugElement.query(By.directive(CngxListbox));
    expect(listbox.nativeElement.getAttribute('aria-multiselectable')).toBe('true');
  });

  it('renders a chip per selected value with a remove button', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.values.set(['red', 'green']);
    flush(fixture);
    const chips: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.cngx-multi-select__chip'),
    );
    expect(chips.length).toBe(2);
    expect(chips[0].textContent).toContain('Rot');
    expect(chips[1].textContent).toContain('Grün');
    const removes = fixture.nativeElement.querySelectorAll(
      '.cngx-multi-select__chip-remove',
    );
    expect(removes.length).toBe(2);
  });

  it('removes a value when its chip × is clicked', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.values.set(['red', 'green']);
    flush(fixture);
    const firstRemove: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.cngx-multi-select__chip-remove',
    );
    firstRemove.click();
    flush(fixture);
    expect(fixture.componentInstance.values()).toEqual(['green']);
    const change = fixture.componentInstance.lastChange();
    expect(change).not.toBeNull();
    expect(change!.action).toBe('toggle');
    expect(change!.removed).toEqual(['red']);
  });

  it('renders a clear-all button only when clearable and not empty', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.clearable = true;
    fixture.componentInstance.values.set(['red']);
    flush(fixture);
    const clear: HTMLElement | null = fixture.nativeElement.querySelector(
      '.cngx-multi-select__clear-all',
    );
    expect(clear).not.toBeNull();
  });

  it('clear-all empties values and emits a clear-action selectionChange', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.clearable = true;
    fixture.componentInstance.values.set(['red', 'green']);
    flush(fixture);
    const clear: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.cngx-multi-select__clear-all',
    );
    clear.click();
    flush(fixture);
    expect(fixture.componentInstance.values()).toEqual([]);
    const change = fixture.componentInstance.lastChange();
    expect(change!.action).toBe('clear');
    expect(change!.removed).toEqual(['red', 'green']);
    expect(change!.values).toEqual([]);
  });

  it('mirrors programmatic values writes into the inner listbox', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.values.set(['red']);
    flush(fixture);
    const trigger: HTMLElement = fixture.nativeElement.querySelector(
      '.cngx-multi-select__trigger',
    );
    trigger.click();
    flush(fixture);
    const listbox = fixture.debugElement
      .query(By.directive(CngxListbox))
      .injector.get(CngxListbox);
    expect(listbox.selectedValues()).toEqual(['red']);
  });

  it('opens and closes the panel via toggle()', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const multi = fixture.debugElement.query(By.directive(CngxMultiSelect))
      .componentInstance as CngxMultiSelect<string>;
    const popover = fixture.debugElement
      .query(By.directive(CngxPopover))
      .injector.get(CngxPopover);
    multi.open();
    flush(fixture);
    expect(popover.isVisible()).toBe(true);
    multi.close();
    flush(fixture);
    expect(popover.isVisible()).toBe(false);
  });

  it('keyboard: Escape closes the panel', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const multi = fixture.debugElement.query(By.directive(CngxMultiSelect))
      .componentInstance as CngxMultiSelect<string>;
    multi.open();
    flush(fixture);
    const trigger: HTMLElement = fixture.nativeElement.querySelector(
      '.cngx-multi-select__trigger',
    );
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    flush(fixture);
    const popover = fixture.debugElement
      .query(By.directive(CngxPopover))
      .injector.get(CngxPopover);
    expect(popover.isVisible()).toBe(false);
  });

  it('isSelected returns correct membership per option', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.values.set(['red']);
    flush(fixture);
    const multi = fixture.debugElement.query(By.directive(CngxMultiSelect))
      .componentInstance as CngxMultiSelect<string> & {
      isSelected: (opt: CngxSelectOptionDef<string>) => boolean;
    };
    expect(multi.isSelected(OPTIONS[0])).toBe(true); // red
    expect(multi.isSelected(OPTIONS[1])).toBe(false); // green
  });
});
