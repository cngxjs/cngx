import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxListbox } from '@cngx/common/interactive';
import { CngxPopover } from '@cngx/common/popover';
import { CNGX_STATEFUL } from '@cngx/core/utils';

import { CngxCombobox, type CngxComboboxChange } from './combobox.component';
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
    <cngx-combobox
      [label]="'Farbe'"
      [options]="options"
      [placeholder]="placeholder"
      [clearable]="clearable"
      [(values)]="values"
      (selectionChange)="lastChange.set($event)"
      (openedChange)="openedLog.set($event)"
    />
  `,
  imports: [CngxCombobox],
})
class Host {
  readonly options = OPTIONS;
  readonly values = signal<string[]>([]);
  readonly placeholder = 'Themen suchen';
  clearable = false;
  readonly lastChange = signal<CngxComboboxChange<string> | null>(null);
  readonly openedLog = signal<boolean | null>(null);
}

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
}

beforeEach(() => {
  polyfillPopover();
});

describe('CngxCombobox — skeleton', () => {
  it('renders role="combobox" on the inner <input> and role="group" on the wrapper', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      '.cngx-combobox__input',
    );
    expect(input).not.toBeNull();
    expect(input.getAttribute('role')).toBe('combobox');
    const wrapper: HTMLElement = fixture.nativeElement.querySelector(
      '.cngx-combobox__trigger',
    );
    expect(wrapper.getAttribute('role')).toBe('group');
  });

  it('forwards placeholder to the <input>', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      '.cngx-combobox__input',
    );
    expect(input.placeholder).toBe('Themen suchen');
  });

  it('renders a chip per selected value with a remove button', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.values.set(['red', 'green']);
    flush(fixture);
    const chips: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('cngx-chip'),
    );
    expect(chips.length).toBe(2);
    expect(chips[0].textContent).toContain('Rot');
    expect(chips[1].textContent).toContain('Grün');
  });

  it('removes a value when its chip × is clicked', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.values.set(['red', 'green']);
    flush(fixture);
    const firstRemove: HTMLElement = fixture.nativeElement.querySelector(
      '.cngx-chip__remove',
    );
    firstRemove.click();
    flush(fixture);
    expect(fixture.componentInstance.values()).toEqual(['green']);
    const change = fixture.componentInstance.lastChange();
    expect(change).not.toBeNull();
    expect(change!.action).toBe('toggle');
    expect(change!.removed).toEqual(['red']);
  });

  it('clear-all empties values and emits a clear-action selectionChange', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.clearable = true;
    fixture.componentInstance.values.set(['red', 'green']);
    flush(fixture);
    const clear: HTMLElement = fixture.nativeElement.querySelector(
      '.cngx-combobox__clear-all',
    );
    expect(clear).not.toBeNull();
    clear.click();
    flush(fixture);
    expect(fixture.componentInstance.values()).toEqual([]);
    const change = fixture.componentInstance.lastChange();
    expect(change!.action).toBe('clear');
    expect(change!.removed).toEqual(['red', 'green']);
  });

  it('isSelected uses the map fast-path with the default comparator', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.values.set(['red']);
    flush(fixture);
    const combo = fixture.debugElement.query(By.directive(CngxCombobox))
      .componentInstance as CngxCombobox<string> & {
      isSelected: (opt: CngxSelectOptionDef<string>) => boolean;
    };
    expect(combo.isSelected(OPTIONS[0])).toBe(true);
    expect(combo.isSelected(OPTIONS[1])).toBe(false);
  });

  it('focusing the input opens the panel (openOnFocus=true)', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const input: HTMLElement = fixture.nativeElement.querySelector(
      '.cngx-combobox__input',
    );
    input.focus();
    input.dispatchEvent(new FocusEvent('focus'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    flush(fixture);
    const popover = fixture.debugElement
      .query(By.directive(CngxPopover))
      .injector.get(CngxPopover);
    expect(popover.isVisible()).toBe(true);
  });

  it('open() / close() drive the panel imperatively', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const combo = fixture.debugElement.query(By.directive(CngxCombobox))
      .componentInstance as CngxCombobox<string>;
    const popover = fixture.debugElement
      .query(By.directive(CngxPopover))
      .injector.get(CngxPopover);
    combo.open();
    flush(fixture);
    expect(popover.isVisible()).toBe(true);
    combo.close();
    flush(fixture);
    expect(popover.isVisible()).toBe(false);
  });

  it('provides CNGX_STATEFUL that resolves to commitState', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const stateful = fixture.debugElement
      .query(By.directive(CngxCombobox))
      .injector.get(CNGX_STATEFUL);
    const combo = fixture.debugElement.query(By.directive(CngxCombobox))
      .componentInstance as CngxCombobox<string>;
    expect(stateful.state).toBe(combo.commitState);
  });

  it('renders options via the shared panel (explicitOptions wiring)', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const combo = fixture.debugElement.query(By.directive(CngxCombobox))
      .componentInstance as CngxCombobox<string>;
    combo.open();
    flush(fixture);
    const rows = fixture.nativeElement.querySelectorAll('[cngxOption]');
    expect(rows.length).toBe(3);
    const lb = fixture.debugElement
      .query(By.directive(CngxListbox))
      .injector.get(CngxListbox);
    expect(lb.options().length).toBe(3);
  });

  it('clicking an option while panel is open toggles it into values and keeps panel open', () => {
    const fixture = TestBed.createComponent(Host);
    flush(fixture);
    const combo = fixture.debugElement.query(By.directive(CngxCombobox))
      .componentInstance as CngxCombobox<string>;
    combo.open();
    flush(fixture);
    const firstOption: HTMLElement = fixture.nativeElement.querySelector(
      '[cngxOption]',
    );
    firstOption.click();
    flush(fixture);
    expect(fixture.componentInstance.values()).toEqual(['red']);
    expect(combo.panelOpen()).toBe(true);
  });
});
