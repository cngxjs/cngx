import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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

function setup() {
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
    expect(directive.rawValue()).toBe('hello');
  });

  it('should update rawValue on input', () => {
    const { input, directive } = setup();
    input.value = 'test';
    input.dispatchEvent(new Event('input'));
    expect(directive.rawValue()).toBe('test');
  });
});
