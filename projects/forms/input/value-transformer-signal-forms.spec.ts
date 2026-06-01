import { Component, signal, viewChild } from '@angular/core';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CngxInputFormat } from './input-format.directive';
import { CngxInputMask } from './input-mask.directive';
import { CngxNumericInput } from './numeric-input.directive';

/**
 * After dropping CVA, each value-transformer directive exposes its primary
 * channel as `value = model<T>()` — the same shape Signal Forms' native
 * `[control]` directive binds against (a `FormValueControl<T>` is any
 * directive with a `value` model signal).
 *
 * These tests prove the two-way model binding round-trips both directions
 * for the three migrated directives. The Signal-Forms `[control]` binding
 * uses the same model channel under the hood; if model two-way binding
 * works, the `[control]` integration works.
 */

@Component({
  template: `<input cngxNumericInput [(value)]="hostValue" />`,
  imports: [CngxNumericInput],
})
class NumericHost {
  hostValue = signal<number | null>(null);
  readonly directive = viewChild.required(CngxNumericInput);
}

@Component({
  template: `<input [cngxInputFormat]="fmt" [(value)]="hostValue" />`,
  imports: [CngxInputFormat],
})
class FormatHost {
  fmt = (v: string) => v.toUpperCase();
  hostValue = signal<string>('');
  readonly directive = viewChild.required(CngxInputFormat);
}

@Component({
  template: `<input [cngxInputMask]="'(000) 000-0000'" [(value)]="hostValue" />`,
  imports: [CngxInputMask],
})
class MaskHost {
  hostValue = signal<string>('');
  readonly directive = viewChild.required(CngxInputMask);
}

describe('value-transformer directives — Signal-Forms style two-way binding', () => {
  describe('CngxNumericInput', () => {
    it('host signal -> directive -> formatted DOM', () => {
      TestBed.configureTestingModule({
        providers: [{ provide: LOCALE_ID, useValue: 'en-US' }],
      });
      const fixture = TestBed.createComponent(NumericHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      const host = fixture.componentInstance;

      host.hostValue.set(1234);
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(input.value).toBe('1,234');
      expect(host.directive().value()).toBe(1234);
    });

    it('user blur -> directive -> host signal (RF / Signal-Forms write-back path)', () => {
      TestBed.configureTestingModule({
        providers: [{ provide: LOCALE_ID, useValue: 'en-US' }],
      });
      const fixture = TestBed.createComponent(NumericHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      const host = fixture.componentInstance;

      input.dispatchEvent(new FocusEvent('focus'));
      TestBed.flushEffects();
      input.value = '99.5';
      input.dispatchEvent(new FocusEvent('blur'));
      TestBed.flushEffects();
      fixture.detectChanges();

      expect(host.hostValue()).toBe(99.5);
    });
  });

  describe('CngxInputFormat', () => {
    it('host signal -> directive -> formatted DOM', () => {
      const fixture = TestBed.createComponent(FormatHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      const host = fixture.componentInstance;

      host.hostValue.set('hello');
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(input.value).toBe('HELLO');
      expect(host.directive().value()).toBe('hello');
    });

    it('user blur -> directive -> host signal', () => {
      const fixture = TestBed.createComponent(FormatHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      const host = fixture.componentInstance;

      input.value = 'world';
      input.dispatchEvent(new FocusEvent('blur'));
      TestBed.flushEffects();
      fixture.detectChanges();

      expect(host.hostValue()).toBe('world');
    });
  });

  describe('CngxInputMask', () => {
    it('host signal -> directive -> masked DOM', () => {
      const fixture = TestBed.createComponent(MaskHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      const host = fixture.componentInstance;

      host.hostValue.set('5551234567');
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(input.value).toBe('(555) 123-4567');
      expect(host.directive().value()).toBe('5551234567');
    });
  });
});
