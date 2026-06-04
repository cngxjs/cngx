import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CNGX_FORM_FIELD_HOST, type CngxFormFieldHostContract } from '@cngx/core/tokens';
import { CNGX_VALUE_TRANSFORMER, type CngxValueTransformer } from '@cngx/forms/field';
import { describe, expect, it, vi } from 'vitest';
import { CngxInputFormat } from './input-format.directive';

@Component({
  template: `<input [cngxInputFormat]="formatFn" [parse]="parseFn" />`,
  imports: [CngxInputFormat],
})
class Host {
  formatFn = (v: string) => v.toUpperCase();
  parseFn = (v: string) => v.toLowerCase();
  readonly directive = viewChild.required(CngxInputFormat);
}

function setup(hostMock?: CngxFormFieldHostContract) {
  TestBed.configureTestingModule({
    providers: hostMock ? [{ provide: CNGX_FORM_FIELD_HOST, useValue: hostMock }] : [],
  });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  TestBed.flushEffects();
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  const directive = fixture.componentInstance.directive();
  return { fixture, input, directive };
}

describe('CngxInputFormat', () => {
  it('should be created', () => {
    const { directive } = setup();
    expect(directive).toBeTruthy();
  });

  it('provides CNGX_VALUE_TRANSFORMER (no NG_VALUE_ACCESSOR)', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const transformer = fixture.debugElement
      .query((d) => d.nativeElement.tagName === 'INPUT')
      .injector.get(CNGX_VALUE_TRANSFORMER) as CngxValueTransformer<string>;
    expect(transformer).toBeTruthy();
    expect(transformer.format('hello')).toBe('HELLO');
    expect(transformer.parse('HELLO')).toBe('hello');
  });

  it('should format on blur', () => {
    const { input, directive } = setup();
    input.value = 'hello';
    input.dispatchEvent(new FocusEvent('blur'));
    expect(input.value).toBe('HELLO');
    expect(directive.displayValue()).toBe('HELLO');
  });

  it('should parse on focus', () => {
    const { input, directive } = setup();
    input.value = 'HELLO';
    input.dispatchEvent(new FocusEvent('focus'));
    expect(input.value).toBe('hello');
    expect(directive.value()).toBe('hello');
  });

  it('should update value on input', () => {
    const { input, directive } = setup();
    input.value = 'test';
    input.dispatchEvent(new Event('input'));
    expect(directive.value()).toBe('test');
  });

  it('keeps rawValue as a deprecated alias of value', () => {
    const { directive } = setup();
    directive.value.set('alpha');
    expect(directive.rawValue()).toBe('alpha');
  });

  it('calls host.markAsTouched() on blur when CNGX_FORM_FIELD_HOST is provided', () => {
    const hostMock: CngxFormFieldHostContract = {
      showError: signal(false),
      markAsTouched: vi.fn(),
    };
    const { input } = setup(hostMock);
    input.dispatchEvent(new FocusEvent('blur'));
    expect(hostMock.markAsTouched).toHaveBeenCalledTimes(1);
  });

  it('effect does not write to el.value while the input is focused', () => {
    const { fixture, input, directive } = setup();
    input.focus();
    expect(document.activeElement).toBe(input);
    directive.value.set('hello');
    TestBed.flushEffects();
    expect(input.value).not.toBe('HELLO');
    // value lives in the model regardless of the focused DOM
    expect(directive.value()).toBe('hello');
    fixture.destroy();
  });

  it('termination guard: external value.set while unfocused formats el.value exactly once and value() still reads raw', () => {
    // Non-idempotent format (wrap in brackets) — a missing termination guard
    // would re-feed "[hello]" as raw, then "[[hello]]", etc.
    @Component({
      template: `<input [cngxInputFormat]="formatFn" />`,
      imports: [CngxInputFormat],
    })
    class BracketHost {
      formatFn = (v: string) => `[${v}]`;
      readonly directive = viewChild.required(CngxInputFormat);
    }

    const fixture = TestBed.createComponent(BracketHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const directive = fixture.componentInstance.directive();

    // Ensure the input is not focused — the effect's "don't fight the cursor"
    // branch would otherwise short-circuit the test.
    input.blur();
    expect(document.activeElement).not.toBe(input);

    directive.value.set('hello');
    TestBed.flushEffects();

    expect(input.value).toBe('[hello]');
    expect(directive.value()).toBe('hello'); // raw, not re-fed formatted
  });
});
