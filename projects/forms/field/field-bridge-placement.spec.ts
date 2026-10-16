import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CngxListbox, CngxRangeSlider, CngxSlider } from '@cngx/common/interactive';

import { CngxBindField } from './bind-field.directive';
import { CngxFormField } from './form-field.component';
import { CngxListboxFieldBridge } from './listbox-field-bridge.directive';
import { CngxRangeSliderFieldBridge } from './range-slider-field-bridge.directive';
import { CngxSliderFieldBridge } from './slider-field-bridge.directive';
import { createMockField } from './testing/mock-field';

@Component({
  template: `
    <input cngxBindField aria-label="Color" />
    <div cngxListbox cngxListboxFieldBridge [label]="'Tags'"></div>
    <cngx-slider cngxSliderFieldBridge aria-label="Volume" />
    <cngx-range-slider cngxRangeSliderFieldBridge aria-label="Price" />
  `,
  imports: [
    CngxBindField,
    CngxListbox,
    CngxListboxFieldBridge,
    CngxSlider,
    CngxSliderFieldBridge,
    CngxRangeSlider,
    CngxRangeSliderFieldBridge,
  ],
})
class UnboundBridges {}

@Component({
  template: `
    <cngx-form-field [field]="field">
      <input cngxBindField />
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxBindField],
})
class BoundBridge {
  readonly field = createMockField<string>({ name: 'color', value: '' }).accessor;
}

function fieldBridgeWarnings(host: new () => unknown): string[] {
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  warnSpy.mockClear();
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  return warnSpy.mock.calls
    .map((call: unknown[]) => String(call[0]))
    .filter((message: string) => message.startsWith('CNGX2015: '));
}

describe('field bridges without a form field (CNGX2015)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('warns once per bridge that has no form field to bind to', () => {
    const warnings = fieldBridgeWarnings(UnboundBridges);
    expect(warnings).toHaveLength(4);
    expect(warnings[0]).toMatch(/^CNGX2015: \[cngxBindField\] has no form field to bind to/);
    expect(warnings[1]).toMatch(
      /^CNGX2015: \[cngxListboxFieldBridge\] has no form field to bind to/,
    );
    expect(warnings[2]).toMatch(
      /^CNGX2015: \[cngxSliderFieldBridge\] has no form field to bind to/,
    );
    expect(warnings[3]).toMatch(
      /^CNGX2015: \[cngxRangeSliderFieldBridge\] has no form field to bind to/,
    );
  });

  it('stays silent inside a form field', () => {
    expect(fieldBridgeWarnings(BoundBridge)).toHaveLength(0);
  });
});
