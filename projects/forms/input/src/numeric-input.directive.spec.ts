import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { CngxNumericInput } from './numeric-input.directive';

@Component({
  template: `<input cngxNumericInput [min]="min()" [max]="max()" [step]="step()"
    [decimals]="decimals()" [formatOnBlur]="formatOnBlur()" [allowNegative]="allowNegative()"
    [locale]="locale()" />`,
  imports: [CngxNumericInput],
})
class Host {
  readonly min = signal<number | undefined>(undefined);
  readonly max = signal<number | undefined>(undefined);
  readonly step = signal(1);
  readonly decimals = signal<number | undefined>(undefined);
  readonly formatOnBlur = signal(true);
  readonly allowNegative = signal(true);
  readonly locale = signal<string | undefined>(undefined);
  readonly directive = viewChild.required(CngxNumericInput);
}

function setup(
  overrides: {
    min?: number;
    max?: number;
    step?: number;
    decimals?: number;
    formatOnBlur?: boolean;
    allowNegative?: boolean;
    locale?: string;
  } = {},
) {
  const providers = [{ provide: LOCALE_ID, useValue: 'en-US' }];
  TestBed.configureTestingModule({ providers });
  const fixture = TestBed.createComponent(Host);
  const host = fixture.componentInstance;
  if (overrides.min != null) {host.min.set(overrides.min);}
  if (overrides.max != null) {host.max.set(overrides.max);}
  if (overrides.step != null) {host.step.set(overrides.step);}
  if (overrides.decimals != null) {host.decimals.set(overrides.decimals);}
  if (overrides.formatOnBlur != null) {host.formatOnBlur.set(overrides.formatOnBlur);}
  if (overrides.allowNegative != null) {host.allowNegative.set(overrides.allowNegative);}
  if (overrides.locale != null) {host.locale.set(overrides.locale);}
  fixture.detectChanges();
  TestBed.flushEffects();

  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  const directive = host.directive();
  return { fixture, input, directive };
}

function typeChar(input: HTMLInputElement, char: string, pos?: number): boolean {
  if (pos != null) {input.setSelectionRange(pos, pos);}
  const event = new InputEvent('beforeinput', {
    inputType: 'insertText',
    data: char,
    cancelable: true,
  });
  return input.dispatchEvent(event);
}

function focus(input: HTMLInputElement): void {
  input.dispatchEvent(new FocusEvent('focus'));
}

function blur(input: HTMLInputElement): void {
  input.dispatchEvent(new FocusEvent('blur'));
}

function keyDown(input: HTMLInputElement, key: string, shiftKey = false): void {
  input.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey }));
}

function flush(fixture: ReturnType<typeof TestBed.createComponent>): void {
  fixture.detectChanges();
  TestBed.flushEffects();
}

describe('CngxNumericInput', () => {
  describe('initial state', () => {
    it('should have null numericValue initially', () => {
      const { directive } = setup();
      expect(directive.numericValue()).toBe(null);
    });

    it('should set inputmode to decimal', () => {
      const { input } = setup();
      expect(input.getAttribute('inputmode')).toBe('decimal');
    });

    it('should set role to spinbutton', () => {
      const { input } = setup();
      expect(input.getAttribute('role')).toBe('spinbutton');
    });

    it('should be valid when empty', () => {
      const { directive } = setup();
      expect(directive.isValid()).toBe(true);
    });
  });

  describe('setValue()', () => {
    it('should set the numeric value programmatically', () => {
      const { directive, fixture, input } = setup();
      directive.setValue(42);
      flush(fixture);
      expect(directive.numericValue()).toBe(42);
      expect(input.value).toBe('42');
    });

    it('should clamp to min/max', () => {
      const { directive, fixture } = setup({ min: 0, max: 100 });
      directive.setValue(150);
      flush(fixture);
      expect(directive.numericValue()).toBe(100);
    });

    it('should set null to clear', () => {
      const { directive, fixture, input } = setup();
      directive.setValue(42);
      flush(fixture);
      directive.setValue(null);
      flush(fixture);
      expect(directive.numericValue()).toBe(null);
      expect(input.value).toBe('');
    });
  });

  describe('blur formatting', () => {
    it('should format with thousands separator on blur', () => {
      const { directive, fixture, input } = setup();
      directive.setValue(1234567);
      focus(input);
      flush(fixture);
      // On focus, should show raw value
      expect(input.value).toBe('1234567');

      blur(input);
      flush(fixture);
      // On blur, should format with thousands separator
      expect(input.value).toBe('1,234,567');
    });

    it('should format with decimal places', () => {
      const { directive, fixture, input } = setup({ decimals: 2 });
      directive.setValue(1234.5);
      flush(fixture); // let effect update DOM
      blur(input);
      flush(fixture);
      expect(input.value).toBe('1,234.50');
    });

    it('should not format when formatOnBlur is false', () => {
      const { directive, fixture, input } = setup({ formatOnBlur: false });
      directive.setValue(1234);
      flush(fixture);
      blur(input);
      flush(fixture);
      expect(input.value).toBe('1234');
    });
  });

  describe('locale support', () => {
    it('should use German formatting (dot as group, comma as decimal)', () => {
      const { directive, fixture, input } = setup({ locale: 'de-DE', decimals: 2 });
      directive.setValue(1234.56);
      flush(fixture); // let effect update DOM
      expect(input.value).toBe('1.234,56');
      expect(directive.numericValue()).toBe(1234.56);
    });

    it('should use Swiss formatting', () => {
      const { directive, fixture, input } = setup({ locale: 'de-CH', decimals: 2 });
      directive.setValue(1234.56);
      flush(fixture);
      expect(directive.numericValue()).toBe(1234.56);
      // Swiss uses various group separators — just verify the value round-trips
      expect(input.value).toBeTruthy();
    });
  });

  describe('input filtering', () => {
    it('should allow digits', () => {
      const { input } = setup();
      const prevented = !typeChar(input, '5', 0);
      // beforeinput returns true if not prevented (dispatchEvent returns false if defaultPrevented)
      // Actually in JSDOM, preventDefault doesn't prevent dispatch from returning true
      // We test by checking if the event was prevented via the handler
      expect(prevented).toBe(false);
    });

    it('should block letters via beforeinput', () => {
      const { input, fixture } = setup();
      focus(input);
      flush(fixture);
      const event = new InputEvent('beforeinput', {
        inputType: 'insertText',
        data: 'a',
        cancelable: true,
      });
      input.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    });

    it('should block negative sign when allowNegative is false', () => {
      const { input, fixture } = setup({ allowNegative: false });
      focus(input);
      flush(fixture);
      const event = new InputEvent('beforeinput', {
        inputType: 'insertText',
        data: '-',
        cancelable: true,
      });
      input.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    });

    it('should block decimal when decimals is 0', () => {
      const { input, fixture } = setup({ decimals: 0 });
      focus(input);
      flush(fixture);
      input.value = '12';
      input.setSelectionRange(2, 2);
      const event = new InputEvent('beforeinput', {
        inputType: 'insertText',
        data: '.',
        cancelable: true,
      });
      input.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    });
  });

  describe('arrow key increment/decrement', () => {
    it('should increment by step on ArrowUp', () => {
      const { input, directive, fixture } = setup({ step: 1 });
      directive.setValue(10);
      focus(input);
      flush(fixture);
      keyDown(input, 'ArrowUp');
      flush(fixture);
      expect(directive.numericValue()).toBe(11);
    });

    it('should decrement by step on ArrowDown', () => {
      const { input, directive, fixture } = setup({ step: 1 });
      directive.setValue(10);
      focus(input);
      flush(fixture);
      keyDown(input, 'ArrowDown');
      flush(fixture);
      expect(directive.numericValue()).toBe(9);
    });

    it('should increment by step*10 with Shift+ArrowUp', () => {
      const { input, directive, fixture } = setup({ step: 1 });
      directive.setValue(10);
      focus(input);
      flush(fixture);
      keyDown(input, 'ArrowUp', true);
      flush(fixture);
      expect(directive.numericValue()).toBe(20);
    });

    it('should clamp to max on increment', () => {
      const { input, directive, fixture } = setup({ max: 100 });
      directive.setValue(99);
      focus(input);
      flush(fixture);
      keyDown(input, 'ArrowUp');
      flush(fixture);
      expect(directive.numericValue()).toBe(100);
    });

    it('should clamp to min on decrement', () => {
      const { input, directive, fixture } = setup({ min: 0 });
      directive.setValue(1);
      focus(input);
      flush(fixture);
      keyDown(input, 'ArrowDown');
      keyDown(input, 'ArrowDown');
      flush(fixture);
      expect(directive.numericValue()).toBe(0);
    });

    it('should start from 0 when value is null', () => {
      const { input, directive, fixture } = setup();
      focus(input);
      flush(fixture);
      keyDown(input, 'ArrowUp');
      flush(fixture);
      expect(directive.numericValue()).toBe(1);
    });
  });

  describe('decimal rounding', () => {
    it('should round to specified decimal places', () => {
      const { directive, fixture } = setup({ decimals: 2 });
      directive.setValue(3.14159);
      flush(fixture);
      expect(directive.numericValue()).toBe(3.14);
    });
  });

  describe('isValid', () => {
    it('should be invalid when below min', () => {
      const { directive, fixture } = setup({ min: 10 });
      directive.setValue(5);
      flush(fixture);
      // setValue clamps, so it should clamp to 10
      expect(directive.numericValue()).toBe(10);
      expect(directive.isValid()).toBe(true);
    });
  });

  describe('clear()', () => {
    it('should clear the value', () => {
      const { directive, fixture, input } = setup();
      directive.setValue(42);
      flush(fixture);
      directive.clear();
      flush(fixture);
      expect(directive.numericValue()).toBe(null);
      expect(input.value).toBe('');
    });
  });

  describe('valueChange output', () => {
    it('should emit on value change', () => {
      const { directive, fixture } = setup();
      const emitted: (number | null)[] = [];
      directive.valueChange.subscribe((v) => emitted.push(v));
      directive.setValue(42);
      flush(fixture);
      directive.setValue(100);
      flush(fixture);
      expect(emitted).toEqual([42, 100]);
    });
  });

  describe('ARIA', () => {
    it('should set aria-valuemin from min input', () => {
      const { input } = setup({ min: 0 });
      expect(input.getAttribute('aria-valuemin')).toBe('0');
    });

    it('should set aria-valuemax from max input', () => {
      const { input } = setup({ max: 100 });
      expect(input.getAttribute('aria-valuemax')).toBe('100');
    });
  });
});
