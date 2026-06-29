import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { CngxLiveAnnouncer } from '@cngx/common/a11y';
import { CngxCapsLock } from './caps-lock.directive';
import { provideInputConfig, withInputAriaLabels } from './input-config';

@Component({
  template: `<input cngxCapsLock #caps="cngxCapsLock" type="password" />`,
  imports: [CngxCapsLock],
})
class Host {
  readonly directive = viewChild.required(CngxCapsLock);
}

function keyEvent(type: 'keydown' | 'keyup' | 'focus', capsLock: boolean): Event {
  const event = new KeyboardEvent(type, { bubbles: true });
  Object.defineProperty(event, 'getModifierState', {
    value: (key: string) => key === 'CapsLock' && capsLock,
  });
  return event;
}

function spyAnnouncer() {
  const announcer = TestBed.inject(CngxLiveAnnouncer);
  return vi.spyOn(announcer, 'announce').mockImplementation(() => {});
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  TestBed.flushEffects();
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  const directive = fixture.componentInstance.directive();
  return { fixture, input, directive };
}

describe('CngxCapsLock', () => {
  it('starts with capsOn = false', () => {
    spyAnnouncer();
    const { directive } = setup();
    expect(directive.capsOn()).toBe(false);
  });

  it('sets capsOn and announces once on the off->on edge', () => {
    const announce = spyAnnouncer();
    const { input, directive } = setup();
    input.dispatchEvent(keyEvent('keydown', true));
    expect(directive.capsOn()).toBe(true);
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith('Caps Lock is on', 'assertive');
  });

  it('does not re-announce while Caps Lock stays on', () => {
    const announce = spyAnnouncer();
    const { input } = setup();
    input.dispatchEvent(keyEvent('keydown', true));
    input.dispatchEvent(keyEvent('keyup', true));
    input.dispatchEvent(keyEvent('keydown', true));
    expect(announce).toHaveBeenCalledTimes(1);
  });

  it('re-announces on a fresh off->on edge after Caps Lock turns off', () => {
    const announce = spyAnnouncer();
    const { input } = setup();
    input.dispatchEvent(keyEvent('keydown', true));
    input.dispatchEvent(keyEvent('keydown', false));
    input.dispatchEvent(keyEvent('keydown', true));
    expect(announce).toHaveBeenCalledTimes(2);
  });

  it('clears capsOn on blur', () => {
    spyAnnouncer();
    const { input, directive } = setup();
    input.dispatchEvent(keyEvent('keydown', true));
    expect(directive.capsOn()).toBe(true);
    input.dispatchEvent(new FocusEvent('blur'));
    expect(directive.capsOn()).toBe(false);
  });

  it('ignores focus events that carry no modifier state', () => {
    const announce = spyAnnouncer();
    const { input, directive } = setup();
    input.dispatchEvent(new FocusEvent('focus'));
    expect(directive.capsOn()).toBe(false);
    expect(announce).not.toHaveBeenCalled();
  });

  it('announces the configured override string', () => {
    TestBed.configureTestingModule({
      providers: [provideInputConfig(withInputAriaLabels({ capsLockOn: 'Feststelltaste aktiv' }))],
    });
    const announce = spyAnnouncer();
    const { input } = setup();
    input.dispatchEvent(keyEvent('keydown', true));
    expect(announce).toHaveBeenCalledWith('Feststelltaste aktiv', 'assertive');
  });
});
