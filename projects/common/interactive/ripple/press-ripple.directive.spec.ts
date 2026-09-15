import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxPressRipple } from './press-ripple.directive';
import { CngxPressable } from './pressable.directive';
import { CngxRipple } from './ripple.directive';

@Component({
  template: `
    <button
      cngxPressRipple
      [rippleDisabled]="rippleDisabled()"
      [rippleCentered]="centered()"
    >
      Click
    </button>
  `,
  imports: [CngxPressRipple],
})
class TestHost {
  readonly rippleDisabled = signal(false);
  readonly centered = signal(false);
}

describe('CngxPressRipple', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('button'));
    const el = button.nativeElement as HTMLElement;
    return {
      fixture,
      button,
      el,
      pressable: button.injector.get(CngxPressable),
      ripple: button.injector.get(CngxRipple),
    };
  }

  it('composes both press and ripple host directives on one attribute', () => {
    const { button } = setup();
    expect(button.injector.get(CngxPressRipple)).toBeTruthy();
    expect(button.injector.get(CngxPressable)).toBeTruthy();
    expect(button.injector.get(CngxRipple)).toBeTruthy();
  });

  it('drives press feedback on pointerdown', () => {
    const { fixture, el, pressable } = setup();
    el.dispatchEvent(new PointerEvent('pointerdown', { clientX: 40, clientY: 20 }));
    fixture.detectChanges();
    expect(pressable.pressed()).toBe(true);
    expect(el.classList.contains('cngx-pressed')).toBe(true);
  });

  it('emits a ripple wave on pointerdown', () => {
    const { el } = setup();
    el.dispatchEvent(new PointerEvent('pointerdown', { clientX: 40, clientY: 20 }));
    expect(el.querySelector('.cngx-ripple__wave')).toBeTruthy();
  });

  it('forwards rippleDisabled to the ripple host directive', () => {
    const { fixture, el } = setup();
    fixture.componentInstance.rippleDisabled.set(true);
    fixture.detectChanges();
    el.dispatchEvent(new PointerEvent('pointerdown', { clientX: 40, clientY: 20 }));
    expect(el.querySelector('.cngx-ripple__wave')).toBeNull();
  });
});
