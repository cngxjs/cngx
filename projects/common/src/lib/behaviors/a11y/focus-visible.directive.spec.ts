import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxFocusVisible } from './focus-visible.directive';

@Component({
  template: `
    <button cngxFocusVisible>A</button>
    <button cngxFocusVisible>B</button>
  `,
  imports: [CngxFocusVisible],
})
class TestHost {}

describe('CngxFocusVisible', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    const dirA = buttons[0].injector.get(CngxFocusVisible);
    const dirB = buttons[1].injector.get(CngxFocusVisible);
    return { fixture, buttons, dirA, dirB };
  }

  it('starts with focusVisible=false', () => {
    const { dirA } = setup();
    expect(dirA.focusVisible()).toBe(false);
  });

  it('sets focusVisible=true on keyboard focus (no prior pointerdown)', () => {
    const { buttons, dirA } = setup();
    buttons[0].triggerEventHandler('focusin');
    expect(dirA.focusVisible()).toBe(true);
  });

  it('keeps focusVisible=false on pointer focus', () => {
    const { buttons, dirA } = setup();
    buttons[0].triggerEventHandler('pointerdown');
    buttons[0].triggerEventHandler('focusin');
    expect(dirA.focusVisible()).toBe(false);
  });

  it('sets focusVisible=false on blur', () => {
    const { buttons, dirA } = setup();
    buttons[0].triggerEventHandler('focusin');
    expect(dirA.focusVisible()).toBe(true);
    buttons[0].triggerEventHandler('focusout');
    expect(dirA.focusVisible()).toBe(false);
  });

  it('adds cngx-focus-visible CSS class when focusVisible is true', () => {
    const { fixture, buttons } = setup();
    buttons[0].triggerEventHandler('focusin');
    fixture.detectChanges();
    expect(
      (buttons[0].nativeElement as HTMLButtonElement).classList.contains('cngx-focus-visible'),
    ).toBe(true);
  });

  it('pointer click on A does not affect keyboard focus on B', () => {
    const { buttons, dirA, dirB } = setup();
    // Click A (pointer)
    buttons[0].triggerEventHandler('pointerdown');
    buttons[0].triggerEventHandler('focusin');
    expect(dirA.focusVisible()).toBe(false);
    // Tab to B (keyboard — no pointerdown on B)
    buttons[0].triggerEventHandler('focusout');
    buttons[1].triggerEventHandler('focusin');
    expect(dirB.focusVisible()).toBe(true);
  });
});
