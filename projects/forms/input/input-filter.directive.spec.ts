import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { CngxLiveAnnouncer } from '@cngx/common/a11y';
import { CngxInputFilter, type InputFilterPattern } from './input-filter.directive';
import { provideInputConfig, withInputAriaLabels } from './input-config';

@Component({
  template: `<input [cngxInputFilter]="pattern()" />`,
  imports: [CngxInputFilter],
})
class Host {
  readonly pattern = signal<InputFilterPattern>('digits');
}

function setup(pattern: InputFilterPattern = 'digits') {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.pattern.set(pattern);
  fixture.detectChanges();
  TestBed.flushEffects();
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  return { fixture, input };
}

function beforeInput(input: HTMLInputElement, data: string | null): InputEvent {
  const event = new InputEvent('beforeinput', { data, cancelable: true, bubbles: true });
  input.dispatchEvent(event);
  return event;
}

function spyAnnouncer() {
  const announcer = TestBed.inject(CngxLiveAnnouncer);
  return vi.spyOn(announcer, 'announce').mockImplementation(() => {});
}

describe('CngxInputFilter', () => {
  it('allows a matching character', () => {
    const announce = spyAnnouncer();
    const { input } = setup('digits');
    const event = beforeInput(input, '5');
    expect(event.defaultPrevented).toBe(false);
    expect(announce).not.toHaveBeenCalled();
  });

  it('cancels and announces a disallowed character', () => {
    const announce = spyAnnouncer();
    const { input } = setup('digits');
    const event = beforeInput(input, 'a');
    expect(event.defaultPrevented).toBe(true);
    expect(announce).toHaveBeenCalledWith('Character not allowed', 'assertive');
  });

  it('rejects a paste when any character is disallowed', () => {
    spyAnnouncer();
    const { input } = setup('digits');
    expect(beforeInput(input, '12a34').defaultPrevented).toBe(true);
    expect(beforeInput(input, '1234').defaultPrevented).toBe(false);
  });

  it('ignores deletions (null data)', () => {
    const announce = spyAnnouncer();
    const { input } = setup('digits');
    expect(beforeInput(input, null).defaultPrevented).toBe(false);
    expect(announce).not.toHaveBeenCalled();
  });

  it('honours the alpha preset', () => {
    spyAnnouncer();
    const { input } = setup('alpha');
    expect(beforeInput(input, 'Q').defaultPrevented).toBe(false);
    expect(beforeInput(input, '7').defaultPrevented).toBe(true);
  });

  it('honours a custom RegExp matched per character', () => {
    spyAnnouncer();
    const { input } = setup(/[a-z-]/);
    expect(beforeInput(input, 'a-b').defaultPrevented).toBe(false);
    expect(beforeInput(input, 'A').defaultPrevented).toBe(true);
  });

  it('reacts to a pattern change without re-creating the directive', () => {
    spyAnnouncer();
    const { fixture, input } = setup('digits');
    expect(beforeInput(input, 'a').defaultPrevented).toBe(true);
    fixture.componentInstance.pattern.set('alpha');
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(beforeInput(input, 'a').defaultPrevented).toBe(false);
  });

  it('announces the configured rejection string', () => {
    TestBed.configureTestingModule({
      providers: [provideInputConfig(withInputAriaLabels({ inputRejected: 'Nicht erlaubt' }))],
    });
    const announce = spyAnnouncer();
    const { input } = setup('digits');
    beforeInput(input, 'a');
    expect(announce).toHaveBeenCalledWith('Nicht erlaubt', 'assertive');
  });
});
