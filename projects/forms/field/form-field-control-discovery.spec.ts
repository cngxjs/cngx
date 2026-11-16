import { Component, Directive, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxCheckbox, CngxCheckboxGroup } from '@cngx/common/interactive';
import { CNGX_FORM_FIELD_CONTROL, type CngxFormFieldControl } from '@cngx/core/tokens';
import { CngxInput } from '@cngx/forms/input';
import { CngxFieldBox } from './field-box.directive';
import { CngxPrefix } from './prefix.directive';
import { CngxFormField } from './form-field.component';
import { CngxFormFieldPresenter } from './form-field-presenter';
import { CngxHint } from './hint.directive';
import { CngxLabel } from './label.component';
import { createMockField, type MockFieldRef } from './testing/mock-field';
import type { CngxFieldAccessor } from './models';

@Component({
  template: `
    <cngx-form-field [field]="field()">
      <label cngxLabel>E-Mail</label>
      <input cngxInput />
      <span cngxHint>Work address</span>
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxLabel, CngxInput, CngxHint],
})
class InputHost {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'email' }).accessor);
}

@Component({
  template: `
    <cngx-form-field [field]="field()">
      <label cngxLabel>Terms</label>
      <cngx-checkbox>Accept the terms</cngx-checkbox>
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxLabel, CngxCheckbox],
})
class CheckboxHost {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'terms' }).accessor);
}

@Component({
  template: `
    <cngx-form-field [field]="field()">
      <label cngxLabel>Channels</label>
      <cngx-checkbox-group [label]="groupLabel()">
        <cngx-checkbox>E-Mail</cngx-checkbox>
        <cngx-checkbox>SMS</cngx-checkbox>
      </cngx-checkbox-group>
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxLabel, CngxCheckboxGroup, CngxCheckbox],
})
class CheckboxGroupHost {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'channels' }).accessor);
  groupLabel = signal<string | undefined>(undefined);
}

@Directive({
  selector: '[stubControl]',
  providers: [{ provide: CNGX_FORM_FIELD_CONTROL, useExisting: StubControl }],
})
class StubControl implements CngxFormFieldControl {
  readonly stubId = input('stub');
  readonly off = input(false);
  readonly id = this.stubId;
  readonly focused = signal(false);
  readonly empty = signal(true);
  readonly disabled = this.off;
  readonly errorState = signal(false);
  focus(): void {
    /* no-op */
  }
}

@Component({
  template: `
    <cngx-form-field [field]="field">
      <label cngxLabel>Amount</label>
      <span cngxFieldBox>
        <span stubControl cngxPrefix stubId="affix" [off]="true"></span>
        <span stubControl stubId="main" [off]="mainOff()"></span>
      </span>
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxLabel, CngxFieldBox, CngxPrefix, StubControl],
})
class AffixFirstHost {
  readonly field = createMockField({ name: 'amount' }).accessor;
  readonly mainOff = signal(false);
}

// Cross-lib integration witnesses for the CNGX_FORM_FIELD_CONTROL discovery
// query: a same-lib reference control (CngxInput) and a Level-2 atom from
// @cngx/common/interactive (CngxCheckbox) discovered through the Level-1
// token alone.
describe('CNGX_FORM_FIELD_CONTROL discovery integration', () => {
  describe('CngxInput (same-lib reference control)', () => {
    let fixture: ReturnType<typeof TestBed.createComponent<InputHost>>;
    let presenter: CngxFormFieldPresenter;
    let fieldEl: HTMLElement;
    let labelEl: HTMLLabelElement;
    let inputEl: HTMLInputElement;
    let ref: MockFieldRef;

    beforeEach(() => {
      const mock = createMockField({ name: 'email' });
      ref = mock.ref;
      TestBed.configureTestingModule({ imports: [InputHost] });
      fixture = TestBed.createComponent(InputHost);
      fixture.componentInstance.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();

      const fieldDebug = fixture.debugElement.query(By.directive(CngxFormField));
      presenter = fieldDebug.injector.get(CngxFormFieldPresenter);
      fieldEl = fieldDebug.nativeElement;
      labelEl = fixture.debugElement.query(By.directive(CngxLabel)).nativeElement;
      inputEl = fixture.debugElement.query(By.directive(CngxInput)).nativeElement;
    });

    function flush() {
      TestBed.flushEffects();
      fixture.detectChanges();
    }

    it('discovers the input through the token', () => {
      expect(presenter.control()).toBe(
        fixture.debugElement.query(By.directive(CngxInput)).injector.get(CngxInput),
      );
    });

    it('associates the label with the input id', () => {
      expect(inputEl.id).toBe('cngx-email-input');
      expect(labelEl.getAttribute('for')).toBe('cngx-email-input');
    });

    it('toggles cngx-field--focused on input focus and blur', () => {
      expect(fieldEl.classList.contains('cngx-field--focused')).toBe(false);

      inputEl.dispatchEvent(new Event('focus'));
      flush();
      expect(fieldEl.classList.contains('cngx-field--focused')).toBe(true);

      inputEl.dispatchEvent(new Event('blur'));
      flush();
      expect(fieldEl.classList.contains('cngx-field--focused')).toBe(false);
    });

    it('toggles cngx-field--empty on value edits', () => {
      expect(fieldEl.classList.contains('cngx-field--empty')).toBe(true);

      inputEl.value = 'user@example.com';
      inputEl.dispatchEvent(new Event('input'));
      flush();
      expect(fieldEl.classList.contains('cngx-field--empty')).toBe(false);

      inputEl.value = '';
      inputEl.dispatchEvent(new Event('input'));
      flush();
      expect(fieldEl.classList.contains('cngx-field--empty')).toBe(true);
    });

    it('leaves the control-side pull channel untouched', () => {
      expect(inputEl.getAttribute('aria-describedby')).toBe('cngx-email-hint');

      ref.invalid.set(true);
      ref.touched.set(true);
      flush();
      expect(inputEl.getAttribute('aria-describedby')).toBe('cngx-email-hint cngx-email-error');
    });
  });

  describe('CngxCheckbox (cross-lib Level-2 atom)', () => {
    let fixture: ReturnType<typeof TestBed.createComponent<CheckboxHost>>;
    let presenter: CngxFormFieldPresenter;
    let fieldEl: HTMLElement;
    let labelEl: HTMLLabelElement;
    let checkbox: CngxCheckbox;
    let checkboxEl: HTMLElement;
    let ref: MockFieldRef;

    beforeEach(() => {
      const mock = createMockField({ name: 'terms' });
      ref = mock.ref;
      TestBed.configureTestingModule({ imports: [CheckboxHost] });
      fixture = TestBed.createComponent(CheckboxHost);
      fixture.componentInstance.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();

      const fieldDebug = fixture.debugElement.query(By.directive(CngxFormField));
      presenter = fieldDebug.injector.get(CngxFormFieldPresenter);
      fieldEl = fieldDebug.nativeElement;
      labelEl = fixture.debugElement.query(By.directive(CngxLabel)).nativeElement;
      const checkboxDebug = fixture.debugElement.query(By.directive(CngxCheckbox));
      checkbox = checkboxDebug.componentInstance;
      checkboxEl = checkboxDebug.nativeElement;
    });

    function flush() {
      TestBed.flushEffects();
      fixture.detectChanges();
    }

    it('discovers the checkbox through the Level-1 token', () => {
      expect(presenter.control()).toBe(checkbox);
    });

    it('reports the checkbox host id as the control id but binds no for on a non-labelable host', () => {
      const hostId = checkboxEl.getAttribute('id');
      expect(hostId).toMatch(/^cngx-checkbox-/);
      expect(presenter.controlId()).toBe(hostId);
      // `for` names only labelable elements; the checkbox takes the field
      // label through aria-labelledby instead.
      expect(labelEl.hasAttribute('for')).toBe(false);
    });

    it('tracks the field showError through the CNGX_FORM_FIELD_HOST cascade into --error', () => {
      expect(checkbox.errorState()).toBe(false);
      expect(fieldEl.classList.contains('cngx-field--error')).toBe(false);

      ref.invalid.set(true);
      ref.touched.set(true);
      flush();
      expect(checkbox.errorState()).toBe(true);
      expect(presenter.controlErrorState()).toBe(true);
      expect(fieldEl.classList.contains('cngx-field--error')).toBe(true);

      ref.invalid.set(false);
      flush();
      expect(checkbox.errorState()).toBe(false);
      expect(fieldEl.classList.contains('cngx-field--error')).toBe(false);
    });

    it('reports empty until the checkbox is checked', () => {
      expect(fieldEl.classList.contains('cngx-field--empty')).toBe(true);

      checkbox.value.set(true);
      flush();
      expect(fieldEl.classList.contains('cngx-field--empty')).toBe(false);
    });

    it('names the leaf atom by the field label, then its own content', () => {
      // aria-labelledby replaces name-from-content, so the checkbox lists the
      // field label first and its own label span second.
      const [field, own] = (checkboxEl.getAttribute('aria-labelledby') ?? '').split(' ');
      expect(field).toBe(labelEl.id);
      expect(checkboxEl.querySelector(`[id="${own}"]`)).not.toBeNull();
    });
  });

  describe('CngxCheckboxGroup (group role, field-label accname)', () => {
    let fixture: ReturnType<typeof TestBed.createComponent<CheckboxGroupHost>>;
    let presenter: CngxFormFieldPresenter;
    let labelEl: HTMLLabelElement;
    let group: CngxCheckboxGroup;
    let groupEl: HTMLElement;

    beforeEach(() => {
      const mock = createMockField({ name: 'channels' });
      TestBed.configureTestingModule({ imports: [CheckboxGroupHost] });
      fixture = TestBed.createComponent(CheckboxGroupHost);
      fixture.componentInstance.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();

      const fieldDebug = fixture.debugElement.query(By.directive(CngxFormField));
      presenter = fieldDebug.injector.get(CngxFormFieldPresenter);
      labelEl = fixture.debugElement.query(By.directive(CngxLabel)).nativeElement;
      const groupDebug = fixture.debugElement.query(By.directive(CngxCheckboxGroup));
      group = groupDebug.componentInstance;
      groupEl = groupDebug.nativeElement;
    });

    it('discovers the outer group, not the inner checkboxes (content-order precedence)', () => {
      expect(presenter.control()).toBe(group);
      expect(presenter.controlId()).toBe(groupEl.getAttribute('id'));
      expect(labelEl.hasAttribute('for')).toBe(false);
    });

    it('names the group from the field label via aria-labelledby', () => {
      // role="group" takes no name from content - without this reference the
      // group has no accessible name inside a cngx-form-field.
      expect(groupEl.getAttribute('aria-labelledby')).toBe('cngx-channels-label');
      expect(labelEl.id).toBe('cngx-channels-label');
    });

    it('an explicit [label] input wins over the field-label reference', () => {
      fixture.componentInstance.groupLabel.set('Notification channels');
      TestBed.flushEffects();
      fixture.detectChanges();
      expect(groupEl.getAttribute('aria-label')).toBe('Notification channels');
      expect(groupEl.hasAttribute('aria-labelledby')).toBe(false);
    });
  });

  describe('affix control before the main control', () => {
    let fixture: ReturnType<typeof TestBed.createComponent<AffixFirstHost>>;
    let presenter: CngxFormFieldPresenter;
    let labelEl: HTMLLabelElement;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [AffixFirstHost] });
      fixture = TestBed.createComponent(AffixFirstHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      presenter = fixture.debugElement
        .query(By.directive(CngxFormField))
        .injector.get(CngxFormFieldPresenter);
      labelEl = fixture.debugElement.query(By.directive(CngxLabel)).nativeElement;
    });

    it('resolves the main control, not the affix that precedes it', () => {
      expect(presenter.control()?.id()).toBe('main');
      expect(presenter.controlId()).toBe('main');
      // The stub hosts are spans, not labelable: no `for`.
      expect(labelEl.hasAttribute('for')).toBe(false);
    });

    it('reports controlDisabled from the main control while the affix is disabled', () => {
      expect(presenter.controlDisabled()).toBe(false);

      fixture.componentInstance.mainOff.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(presenter.controlDisabled()).toBe(true);
    });
  });
});
