import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxListbox, CngxOption } from '@cngx/common/interactive';

import { CngxFormField } from './form-field.component';
import { CNGX_FORM_FIELD_CONTROL } from './form-field.token';
import { CngxListboxFieldBridge } from './listbox-field-bridge.directive';
import { createMockField, type MockFieldRef } from './testing/mock-field';

@Component({
  template: `
    <cngx-form-field [field]="field">
      <div
        cngxListbox
        cngxListboxFieldBridge
        [label]="'Choice'"
        tabindex="0"
        #lb="cngxListbox"
      >
        <div cngxOption value="a">A</div>
        <div cngxOption value="b">B</div>
        <div cngxOption value="c">C</div>
      </div>
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxListbox, CngxListboxFieldBridge, CngxOption],
})
class SingleHost {
  readonly _mock = createMockField<string>({ name: 'choice', value: 'a' });
  readonly field = this._mock.accessor;
  readonly ref: MockFieldRef<string> = this._mock.ref;
}

@Component({
  template: `
    <cngx-form-field [field]="field">
      <div
        cngxListbox
        cngxListboxFieldBridge
        [label]="'Choices'"
        [multiple]="true"
        tabindex="0"
        #lb="cngxListbox"
      >
        <div cngxOption value="a">A</div>
        <div cngxOption value="b">B</div>
        <div cngxOption value="c">C</div>
      </div>
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxListbox, CngxListboxFieldBridge, CngxOption],
})
class MultiHost {
  readonly _mock = createMockField<string[]>({ name: 'choices', value: ['a'] });
  readonly field = this._mock.accessor;
  readonly ref: MockFieldRef<string[]> = this._mock.ref;
}

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
}

describe('CngxListboxFieldBridge — single select', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SingleHost] });
  });

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<SingleHost>>;
    listbox: CngxListbox;
    bridge: CngxListboxFieldBridge;
    ref: MockFieldRef<string>;
  } {
    const fixture = TestBed.createComponent(SingleHost);
    fixture.detectChanges();
    flush(fixture);
    const lbDe = fixture.debugElement.query(By.directive(CngxListbox));
    return {
      fixture,
      listbox: lbDe.injector.get(CngxListbox),
      bridge: lbDe.injector.get(CngxListboxFieldBridge),
      ref: fixture.componentInstance.ref,
    };
  }

  it('provides CNGX_FORM_FIELD_CONTROL via the bridge', () => {
    const { fixture, bridge } = setup();
    const resolved = fixture.debugElement
      .query(By.directive(CngxListboxFieldBridge))
      .injector.get(CNGX_FORM_FIELD_CONTROL);
    expect(resolved).toBe(bridge);
  });

  it('syncs initial field value to listbox', () => {
    const { listbox } = setup();
    expect(listbox.value()).toBe('a');
  });

  it('pushes external field mutation into listbox', () => {
    const { fixture, listbox, ref } = setup();
    ref.value.set('c');
    flush(fixture);
    expect(listbox.value()).toBe('c');
  });

  it('pushes internal listbox selection into field', () => {
    const { fixture, listbox, ref } = setup();
    listbox.select('b');
    flush(fixture);
    expect(ref.value()).toBe('b');
  });

  it('empty computed follows selection', () => {
    const { fixture, listbox, bridge, ref } = setup();
    expect(bridge.empty()).toBe(false);
    listbox.clear();
    ref.value.set(undefined as unknown as string);
    flush(fixture);
    expect(bridge.empty()).toBe(true);
  });

  it('disabled reflects field.disabled via presenter', () => {
    const { fixture, bridge, ref } = setup();
    expect(bridge.disabled()).toBe(false);
    ref.disabled.set(true);
    flush(fixture);
    expect(bridge.disabled()).toBe(true);
  });

  it('errorState reflects presenter.showError (touched && invalid)', () => {
    const { fixture, bridge, ref } = setup();
    expect(bridge.errorState()).toBe(false);
    ref.invalid.set(true);
    flush(fixture);
    expect(bridge.errorState()).toBe(false); // not touched yet
    ref.touched.set(true);
    flush(fixture);
    expect(bridge.errorState()).toBe(true);
  });

  it('sets aria-describedby on host when presenter has hints/errors', () => {
    const { fixture, ref } = setup();
    ref.invalid.set(true);
    ref.touched.set(true);
    flush(fixture);
    const hostEl = fixture.debugElement.query(By.directive(CngxListboxFieldBridge))
      .nativeElement as HTMLElement;
    expect(hostEl.getAttribute('aria-invalid')).toBe('true');
  });
});

describe('CngxListboxFieldBridge — multi select', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [MultiHost] });
  });

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<MultiHost>>;
    listbox: CngxListbox;
    ref: MockFieldRef<string[]>;
  } {
    const fixture = TestBed.createComponent(MultiHost);
    fixture.detectChanges();
    flush(fixture);
    return {
      fixture,
      listbox: fixture.debugElement
        .query(By.directive(CngxListbox))
        .injector.get(CngxListbox),
      ref: fixture.componentInstance.ref,
    };
  }

  it('syncs initial field array into selectedValues', () => {
    const { listbox } = setup();
    expect(listbox.selectedValues()).toEqual(['a']);
  });

  it('external field array mutation reflects in selectedValues', () => {
    const { fixture, listbox, ref } = setup();
    ref.value.set(['a', 'c']);
    flush(fixture);
    expect(listbox.selectedValues().sort()).toEqual(['a', 'c']);
  });

  it('toggling an option pushes the new array into the field', () => {
    const { fixture, listbox, ref } = setup();
    listbox.toggle('b');
    flush(fixture);
    expect(ref.value().sort()).toEqual(['a', 'b']);
  });
});
