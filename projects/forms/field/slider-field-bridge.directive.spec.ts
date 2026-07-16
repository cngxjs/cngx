import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxSlider, CngxSliderTrack } from '@cngx/common/interactive';

import { CngxFormField } from './form-field.component';
import { CNGX_FORM_FIELD_CONTROL } from './form-field.token';
import { CngxSliderFieldBridge } from './slider-field-bridge.directive';
import { createMockField, type MockFieldRef } from './testing/mock-field';

@Component({
  template: `
    <cngx-form-field [field]="field">
      <cngx-slider cngxSliderFieldBridge [min]="0" [max]="100" [step]="5" aria-label="Volume" />
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxSlider, CngxSliderFieldBridge],
})
class Host {
  readonly _mock = createMockField<number>({ name: 'volume', value: 40 });
  readonly field = this._mock.accessor;
  readonly ref: MockFieldRef<number> = this._mock.ref;
}

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
}

describe('CngxSliderFieldBridge', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host] });
  });

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    flush(fixture);
    const sliderDe = fixture.debugElement.query(By.directive(CngxSlider));
    return {
      fixture,
      brain: sliderDe.injector.get(CngxSliderTrack),
      bridge: sliderDe.injector.get(CngxSliderFieldBridge),
      ref: fixture.componentInstance.ref,
    };
  }

  it('provides CNGX_FORM_FIELD_CONTROL via the bridge', () => {
    const { fixture, bridge } = setup();
    const resolved = fixture.debugElement
      .query(By.directive(CngxSliderFieldBridge))
      .injector.get(CNGX_FORM_FIELD_CONTROL);
    expect(resolved).toBe(bridge);
  });

  it('syncs the initial field value into the slider', () => {
    const { brain } = setup();
    expect(brain.value()).toBe(40);
  });

  it('pushes external field mutation into the slider', () => {
    const { fixture, brain, ref } = setup();
    ref.value.set(75);
    flush(fixture);
    expect(brain.value()).toBe(75);
  });

  it('pushes internal slider movement back into the field', () => {
    const { fixture, brain, ref } = setup();
    brain.value.set(65);
    flush(fixture);
    expect(ref.value()).toBe(65);
  });

  it('is never empty (a numeric slider always has a value)', () => {
    const { bridge } = setup();
    expect(bridge.empty()).toBe(false);
  });

  it('reflects errorState from the presenter', () => {
    const { fixture, bridge, ref } = setup();
    expect(bridge.errorState()).toBe(false);
    ref.invalid.set(true);
    ref.touched.set(true);
    flush(fixture);
    expect(bridge.errorState()).toBe(true);
  });
});

// Characterises the mount-time init-push: a numeric slider is never empty, so
// when it mounts over an undefined field it seeds that field with its own
// value. This guards against a symmetric field<->control migration silently
// dropping the write (field stays undefined) - the Field->Slider read skips a
// non-finite field, but the Slider->Field write must still fire.
@Component({
  selector: 'empty-slider-host',
  template: `
    <cngx-form-field [field]="field">
      <cngx-slider cngxSliderFieldBridge [min]="0" [max]="100" [step]="5" aria-label="Volume" />
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxSlider, CngxSliderFieldBridge],
})
class EmptyHost {
  readonly _mock = createMockField<number>({ name: 'volume' });
  readonly field = this._mock.accessor;
  readonly ref: MockFieldRef<number> = this._mock.ref;
  constructor() {
    this.ref.value.set(undefined as unknown as number);
  }
}

describe('CngxSliderFieldBridge — empty field mount', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [EmptyHost] });
  });

  it('seeds an undefined field with the slider value on mount', () => {
    const fixture = TestBed.createComponent(EmptyHost);
    fixture.detectChanges();
    flush(fixture);
    expect(fixture.componentInstance.ref.value()).toBe(0);
  });
});
