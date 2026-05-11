import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxBindField } from './bind-field.directive';
import { CngxFormField } from './form-field.component';
import { CNGX_FORM_FIELD_CONTROL } from './form-field.token';
import { createMockField, type MockFieldRef } from './testing/mock-field';

@Component({
  template: `
    <cngx-form-field [field]="field">
      <input cngxBindField #ctrl />
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxBindField],
})
class Host {
  readonly _mock = createMockField<string>({ name: 'color', value: '' });
  readonly field = this._mock.accessor;
  readonly ref: MockFieldRef<string> = this._mock.ref;
}

@Component({
  template: `
    <cngx-form-field [field]="field">
      <div cngxBindField role="listbox"></div>
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxBindField],
})
class ArrayHost {
  readonly _mock = createMockField<string[]>({ name: 'tags', value: [] });
  readonly field = this._mock.accessor;
  readonly ref: MockFieldRef<string[]> = this._mock.ref;
}

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
}

describe('CngxBindField', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host] });
  });

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<Host>>;
    bridge: CngxBindField;
    host: HTMLElement;
    ref: MockFieldRef<string>;
  } {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    flush(fixture);
    const de = fixture.debugElement.query(By.directive(CngxBindField));
    return {
      fixture,
      bridge: de.injector.get(CngxBindField),
      host: de.nativeElement as HTMLElement,
      ref: fixture.componentInstance.ref,
    };
  }

  it('provides CNGX_FORM_FIELD_CONTROL via the directive', () => {
    const { fixture, bridge } = setup();
    const resolved = fixture.debugElement
      .query(By.directive(CngxBindField))
      .injector.get(CNGX_FORM_FIELD_CONTROL);
    expect(resolved).toBe(bridge);
  });

  it('derives id from presenter.inputId()', () => {
    const { bridge, host } = setup();
    expect(bridge.id()).toBe('cngx-color-input');
    expect(host.id).toBe('cngx-color-input');
  });

  it('empty follows field value (string, null, array)', () => {
    const { fixture, bridge, ref } = setup();
    expect(bridge.empty()).toBe(true);
    ref.value.set('red');
    flush(fixture);
    expect(bridge.empty()).toBe(false);
    ref.value.set('');
    flush(fixture);
    expect(bridge.empty()).toBe(true);
    ref.value.set(null as unknown as string);
    flush(fixture);
    expect(bridge.empty()).toBe(true);
  });

  it('empty returns true for empty array and false for populated array', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [ArrayHost] });
    const fixture = TestBed.createComponent(ArrayHost);
    fixture.detectChanges();
    flush(fixture);
    const de = fixture.debugElement.query(By.directive(CngxBindField));
    const bridge = de.injector.get(CngxBindField);
    const ref = fixture.componentInstance.ref;

    expect(bridge.empty()).toBe(true);
    ref.value.set(['a']);
    flush(fixture);
    expect(bridge.empty()).toBe(false);
    ref.value.set([]);
    flush(fixture);
    expect(bridge.empty()).toBe(true);
  });

  it('focused toggles via focusin/focusout', () => {
    const { fixture, bridge, host } = setup();
    expect(bridge.focused()).toBe(false);
    host.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    flush(fixture);
    expect(bridge.focused()).toBe(true);
    host.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    flush(fixture);
    expect(bridge.focused()).toBe(false);
  });

  it('focusout marks the field as touched', () => {
    const { fixture, host, ref } = setup();
    expect(ref.touched()).toBe(false);
    host.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    host.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    flush(fixture);
    expect(ref.touched()).toBe(true);
  });

  it('disabled follows presenter.disabled', () => {
    const { fixture, bridge, ref } = setup();
    expect(bridge.disabled()).toBe(false);
    ref.disabled.set(true);
    flush(fixture);
    expect(bridge.disabled()).toBe(true);
  });

  it('errorState follows presenter.showError (touched && invalid)', () => {
    const { fixture, bridge, ref } = setup();
    expect(bridge.errorState()).toBe(false);
    ref.invalid.set(true);
    flush(fixture);
    expect(bridge.errorState()).toBe(false);
    ref.touched.set(true);
    flush(fixture);
    expect(bridge.errorState()).toBe(true);
  });

  it('projects ARIA attributes onto the host', () => {
    const { fixture, host, ref } = setup();
    ref.required.set(true);
    ref.invalid.set(true);
    ref.touched.set(true);
    flush(fixture);
    expect(host.getAttribute('aria-required')).toBe('true');
    expect(host.getAttribute('aria-invalid')).toBe('true');
    expect(host.getAttribute('aria-errormessage')).toBe('cngx-color-error');
    expect(host.getAttribute('aria-describedby')).toContain('cngx-color-error');
  });
});
