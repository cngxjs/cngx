import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CngxNumericInput } from './numeric-input.directive';
import { provideInputConfig } from './input-config';
import { withCurrency } from './currency.feature';

describe('withCurrency (feature merge)', () => {
  it('writes the currency code into the config', () => {
    expect(withCurrency({ code: 'USD' })({})).toEqual({ numericCurrency: 'USD' });
  });

  it('also writes the numeric locale when supplied', () => {
    expect(withCurrency({ code: 'CHF', locale: 'de-CH' })({})).toEqual({
      numericCurrency: 'CHF',
      numericLocale: 'de-CH',
    });
  });
});

@Component({
  template: `<input cngxNumericInput [value]="value()" [decimals]="decimals()" />`,
  imports: [CngxNumericInput],
})
class Host {
  readonly value = signal<number | null>(null);
  readonly decimals = signal<number | undefined>(undefined);
}

function setupNumeric(code: string, value: number, locale = 'en-US', decimals?: number) {
  TestBed.configureTestingModule({
    providers: [provideInputConfig(withCurrency({ code, locale }))],
  });
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.value.set(value);
  fixture.componentInstance.decimals.set(decimals);
  fixture.detectChanges();
  TestBed.flushEffects();
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  return { fixture, input };
}

describe('CngxNumericInput currency formatting', () => {
  it('formats with currency grouping and 2 fraction digits, no symbol (USD)', () => {
    const { input } = setupNumeric('USD', 1234.5);
    expect(input.value).toBe('1,234.50');
    expect(input.value).not.toContain('$');
  });

  it('uses the currency standard of zero fraction digits (JPY)', () => {
    const { input } = setupNumeric('JPY', 1200);
    expect(input.value).toBe('1,200');
    expect(input.value).not.toMatch(/[¥]/);
  });

  it('falls back to plain decimal formatting for an unknown currency code', () => {
    const { input } = setupNumeric('BADCODE', 1234.5);
    expect(input.value).toBe('1,234.5');
  });

  it('uses the currency standard fraction digits when [decimals] is unset', () => {
    const { input } = setupNumeric('USD', 1500);
    expect(input.value).toBe('1,500.00');
  });

  it('lets an explicit [decimals] override the currency standard fraction digits', () => {
    const { input } = setupNumeric('USD', 1500, 'en-US', 0);
    expect(input.value).toBe('1,500');
  });

  it('strips the symbol and symbol-adjacent literal for a suffix-symbol locale', () => {
    const { input } = setupNumeric('EUR', 1234.5, 'fr-FR');
    expect(input.value).not.toContain('€');
    // fr-FR groups with a narrow no-break space; `.` matches that separator.
    expect(input.value).toMatch(/^1.234,50$/);
  });
});
