import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxLiveAnnouncer } from '@cngx/common/a11y';
import { CngxOtpInput, CngxOtpSlot } from './otp-input.directive';
import { provideInputConfig, withInputAriaLabels } from './input-config';

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

  it('should label each slot with its position', () => {
    const { inputs } = setup();
    expect(inputs[0].getAttribute('aria-label')).toBe('Digit 1 of 4');
    expect(inputs[3].getAttribute('aria-label')).toBe('Digit 4 of 4');
  });

  it('should expose the container as a labelled role=group', () => {
    const { fixture } = setup();
    const group = fixture.nativeElement.querySelector('[cngxOtpInput]') as HTMLElement;
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBe('One-time code');
  });

  it('should announce completion once when the last slot fills', () => {
    const announcer = TestBed.inject(CngxLiveAnnouncer);
    const announce = vi.spyOn(announcer, 'announce').mockImplementation(() => {});
    const { directive } = setup();
    directive.handleSlotInput(0, '1');
    directive.handleSlotInput(1, '2');
    directive.handleSlotInput(2, '3');
    expect(announce).not.toHaveBeenCalled();
    directive.handleSlotInput(3, '4');
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith('Code complete');
  });

  it('should announce the configured completion string', () => {
    TestBed.configureTestingModule({
      providers: [provideInputConfig(withInputAriaLabels({ otpComplete: 'Fertig' }))],
    });
    const announcer = TestBed.inject(CngxLiveAnnouncer);
    const announce = vi.spyOn(announcer, 'announce').mockImplementation(() => {});
    const { directive } = setup();
    directive.handleSlotInput(0, '1');
    directive.handleSlotInput(1, '2');
    directive.handleSlotInput(2, '3');
    directive.handleSlotInput(3, '4');
    expect(announce).toHaveBeenCalledWith('Fertig');
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
