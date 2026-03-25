import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxOtpInput, CngxOtpSlot } from './otp-input.directive';

@Component({
  template: `
    <div cngxOtpInput [length]="4" #otp="cngxOtpInput" (completed)="onCompleted($event)">
      @for (i of otp.indices(); track i) {
        <input [cngxOtpSlot]="i" />
      }
    </div>
  `,
  imports: [CngxOtpInput, CngxOtpSlot],
})
class Host {
  readonly otp = viewChild.required(CngxOtpInput);
  completedValue = '';
  onCompleted(val: string): void {
    this.completedValue = val;
  }
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  TestBed.flushEffects();
  const directive = fixture.componentInstance.otp();
  const inputs = Array.from(fixture.nativeElement.querySelectorAll('input')) as HTMLInputElement[];
  return { fixture, directive, inputs };
}

describe('CngxOtpInput', () => {
  it('should render the correct number of inputs', () => {
    const { inputs } = setup();
    expect(inputs.length).toBe(4);
  });

  it('should set maxlength=1 on each slot', () => {
    const { inputs } = setup();
    for (const input of inputs) {
      expect(input.getAttribute('maxlength')).toBe('1');
    }
  });

  it('should set autocomplete=one-time-code on first slot', () => {
    const { inputs } = setup();
    expect(inputs[0].getAttribute('autocomplete')).toBe('one-time-code');
    expect(inputs[1].getAttribute('autocomplete')).toBe('off');
  });

  it('should start with empty value', () => {
    const { directive } = setup();
    expect(directive.value()).toBe('');
    expect(directive.isComplete()).toBe(false);
  });

  it('should expose indices signal', () => {
    const { directive } = setup();
    expect(directive.indices()).toEqual([0, 1, 2, 3]);
  });

  it('should clear all inputs', () => {
    const { directive, inputs, fixture } = setup();
    inputs[0].value = '1';
    directive.handleSlotInput(0, '1');
    fixture.detectChanges();

    directive.clear();
    fixture.detectChanges();
    expect(directive.value()).toBe('');
    for (const input of inputs) {
      expect(input.value).toBe('');
    }
  });
});
