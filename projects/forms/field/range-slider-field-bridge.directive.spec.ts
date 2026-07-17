import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxRangeSlider, CngxRangeSliderTrack } from '@cngx/common/interactive';

import { CngxFormField } from './form-field.component';
import { CNGX_FORM_FIELD_CONTROL } from './form-field.token';
import { CngxRangeSliderFieldBridge } from './range-slider-field-bridge.directive';
import { createMockField, type MockFieldRef } from './testing/mock-field';

@Component({
  template: `
    <cngx-form-field [field]="field">
      <cngx-range-slider cngxRangeSliderFieldBridge [min]="0" [max]="1000" [step]="10" aria-label="Price" />
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxRangeSlider, CngxRangeSliderFieldBridge],
})
class Host {
  readonly _mock = createMockField<[number, number]>({ name: 'price', value: [200, 800] });
  readonly field = this._mock.accessor;
  readonly ref: MockFieldRef<[number, number]> = this._mock.ref;
}

function flush(fixture: { detectChanges: () => void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
}

describe('CngxRangeSliderFieldBridge', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host] });
  });

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    flush(fixture);
    const sliderDe = fixture.debugElement.query(By.directive(CngxRangeSlider));
    return {
      fixture,
      brain: sliderDe.injector.get(CngxRangeSliderTrack),
      bridge: sliderDe.injector.get(CngxRangeSliderFieldBridge),
      ref: fixture.componentInstance.ref,
    };
  }

  it('provides CNGX_FORM_FIELD_CONTROL via the bridge', () => {
    const { fixture, bridge } = setup();
    const resolved = fixture.debugElement
      .query(By.directive(CngxRangeSliderFieldBridge))
      .injector.get(CNGX_FORM_FIELD_CONTROL);
    expect(resolved).toBe(bridge);
  });

  it('syncs the initial tuple field value into the slider', () => {
    const { brain } = setup();
    expect(brain.value()).toEqual([200, 800]);
  });

  it('pushes external field mutation into the slider', () => {
    const { fixture, brain, ref } = setup();
    ref.value.set([300, 700]);
    flush(fixture);
    expect(brain.value()).toEqual([300, 700]);
  });

  it('pushes internal slider movement back into the field', () => {
    const { fixture, brain, ref } = setup();
    brain.value.set([250, 750]);
    flush(fixture);
    expect(ref.value()).toEqual([250, 750]);
  });

  it('is never empty (a range slider always has a tuple)', () => {
    const { bridge } = setup();
    expect(bridge.empty()).toBe(false);
  });
});

// Characterises the mount-time init-push: a range slider always has a tuple, so
// mounting over an undefined field seeds that field with its own value. Guards
// against a symmetric field<->control migration dropping the write - the
// Field->Slider read skips a non-tuple field, but the Slider->Field write fires.
@Component({
  selector: 'empty-range-host',
  template: `
    <cngx-form-field [field]="field">
      <cngx-range-slider cngxRangeSliderFieldBridge [min]="0" [max]="1000" [step]="10" aria-label="Price" />
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxRangeSlider, CngxRangeSliderFieldBridge],
})
class EmptyHost {
  readonly _mock = createMockField<[number, number]>({ name: 'price' });
  readonly field = this._mock.accessor;
  readonly ref: MockFieldRef<[number, number]> = this._mock.ref;
  constructor() {
    this.ref.value.set(undefined as unknown as [number, number]);
  }
}

describe('CngxRangeSliderFieldBridge — empty field mount', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [EmptyHost] });
  });

  it('seeds an undefined field with the slider tuple on mount', () => {
    const fixture = TestBed.createComponent(EmptyHost);
    fixture.detectChanges();
    flush(fixture);
    expect(fixture.componentInstance.ref.value()).toEqual([0, 100]);
  });
});
