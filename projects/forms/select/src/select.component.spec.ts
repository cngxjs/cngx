import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxListbox } from '@cngx/common/interactive';
import { CngxPopover } from '@cngx/common/popover';
import { CNGX_FORM_FIELD_CONTROL, CngxFormField } from '@cngx/forms/field';
import { createMockField, type MockFieldRef } from '../../field/src/testing/mock-field';

import { CngxSelect, type CngxSelectOption } from './select.component';

// jsdom does not implement the Popover API — polyfill so CngxPopover can toggle.
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

const OPTIONS: CngxSelectOption<string>[] = [
  { value: 'red', label: 'Rot' },
  { value: 'green', label: 'Grün' },
  { value: 'blue', label: 'Blau', disabled: true },
];

@Component({
  template: `
    <cngx-select
      [label]="'Farbe'"
      [options]="options"
      [(value)]="value"
      [placeholder]="placeholder"
    />
  `,
  imports: [CngxSelect],
})
class StandaloneHost {
  readonly options = OPTIONS;
  readonly value = signal<string | undefined>(undefined);
  readonly placeholder = 'Bitte wählen';
}

@Component({
  template: `
    <cngx-form-field [field]="field">
      <cngx-select [label]="'Farbe'" [options]="options" />
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxSelect],
})
class FormFieldHost {
  readonly options = OPTIONS;
  readonly _mock = createMockField<string>({ name: 'color', value: 'red', required: true });
  readonly field = this._mock.accessor;
  readonly ref: MockFieldRef<string> = this._mock.ref;
}

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
}

describe('CngxSelect — standalone', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [StandaloneHost] });
  });

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<StandaloneHost>>;
    triggerBtn: HTMLButtonElement;
    listbox: CngxListbox;
    popover: CngxPopover;
  } {
    const fixture = TestBed.createComponent(StandaloneHost);
    fixture.detectChanges();
    flush(fixture);
    const selectDe = fixture.debugElement.query(By.directive(CngxSelect));
    const listboxDe = fixture.debugElement.query(By.directive(CngxListbox));
    const popoverDe = fixture.debugElement.query(By.directive(CngxPopover));
    return {
      fixture,
      triggerBtn: selectDe.nativeElement.querySelector('button') as HTMLButtonElement,
      listbox: listboxDe.injector.get(CngxListbox),
      popover: popoverDe.injector.get(CngxPopover),
    };
  }

  it('renders the trigger with placeholder when no value selected', () => {
    const { triggerBtn } = setup();
    expect(triggerBtn.textContent?.trim()).toContain('Bitte wählen');
    expect(triggerBtn.getAttribute('aria-haspopup')).toBe('listbox');
    expect(triggerBtn.getAttribute('aria-expanded')).toBe('false');
  });

  it('renders one option per entry in options[]', () => {
    const { listbox } = setup();
    expect(listbox.options().length).toBe(3);
  });

  it('trigger label reflects initial value', () => {
    const { fixture, triggerBtn } = setup();
    fixture.componentInstance.value.set('red');
    flush(fixture);
    expect(triggerBtn.textContent?.trim()).toContain('Rot');
  });

  it('clicking the trigger opens the popover', () => {
    const { fixture, triggerBtn, popover } = setup();
    triggerBtn.click();
    flush(fixture);
    expect(popover.isVisible()).toBe(true);
    expect(triggerBtn.getAttribute('aria-expanded')).toBe('true');
  });

  it('clicking an option updates [(value)] and closes the popover', () => {
    const { fixture, triggerBtn, popover } = setup();
    triggerBtn.click();
    flush(fixture);
    const secondOption = fixture.debugElement.nativeElement.querySelector(
      '[cngxOption]:nth-of-type(2)',
    ) as HTMLElement;
    secondOption.click();
    flush(fixture);
    expect(fixture.componentInstance.value()).toBe('green');
    expect(popover.isVisible()).toBe(false);
  });

  it('clicking a disabled option does not update [(value)]', () => {
    const { fixture, triggerBtn } = setup();
    triggerBtn.click();
    flush(fixture);
    const thirdOption = fixture.debugElement.nativeElement.querySelector(
      '[cngxOption]:nth-of-type(3)',
    ) as HTMLElement;
    thirdOption.click();
    flush(fixture);
    expect(fixture.componentInstance.value()).toBeUndefined();
  });
});

describe('CngxSelect — form-field integration', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [FormFieldHost] });
  });

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<FormFieldHost>>;
    select: CngxSelect<string>;
    triggerBtn: HTMLButtonElement;
    ref: MockFieldRef<string>;
  } {
    const fixture = TestBed.createComponent(FormFieldHost);
    fixture.detectChanges();
    flush(fixture);
    const selectDe = fixture.debugElement.query(By.directive(CngxSelect));
    return {
      fixture,
      select: selectDe.componentInstance as CngxSelect<string>,
      triggerBtn: selectDe.nativeElement.querySelector('button') as HTMLButtonElement,
      ref: fixture.componentInstance.ref,
    };
  }

  it('provides CNGX_FORM_FIELD_CONTROL via the component', () => {
    const { fixture, select } = setup();
    const resolved = fixture.debugElement
      .query(By.directive(CngxSelect))
      .injector.get(CNGX_FORM_FIELD_CONTROL);
    expect(resolved).toBe(select);
  });

  it('syncs initial field value into the select', () => {
    const { select } = setup();
    expect(select.value()).toBe('red');
  });

  it('external field mutation reflects in the select', () => {
    const { fixture, select, ref } = setup();
    ref.value.set('green');
    flush(fixture);
    expect(select.value()).toBe('green');
  });

  it('internal selection pushes into the field', () => {
    const { fixture, triggerBtn, ref } = setup();
    triggerBtn.click();
    flush(fixture);
    const secondOption = fixture.debugElement.nativeElement.querySelector(
      '[cngxOption]:nth-of-type(2)',
    ) as HTMLElement;
    secondOption.click();
    flush(fixture);
    expect(ref.value()).toBe('green');
  });

  it('derives id + ARIA attributes from the presenter', () => {
    const { fixture } = setup();
    const selectHost = fixture.debugElement.query(By.directive(CngxSelect))
      .nativeElement as HTMLElement;
    expect(selectHost.id).toBe('cngx-color-input');
    expect(selectHost.getAttribute('aria-describedby')).toContain('cngx-color-hint');
    expect(selectHost.getAttribute('aria-describedby')).toContain('cngx-color-error');
  });

  it('errorState reflects presenter.showError (touched && invalid)', () => {
    const { fixture, select, ref } = setup();
    expect(select.errorState()).toBe(false);
    ref.invalid.set(true);
    flush(fixture);
    expect(select.errorState()).toBe(false);
    ref.touched.set(true);
    flush(fixture);
    expect(select.errorState()).toBe(true);
  });
});
