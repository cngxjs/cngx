import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

  it('clears a stale pointer flag after pointerup so the next Tab-in shows the ring', () => {
    vi.useFakeTimers();
    const { buttons, dirA } = setup();
    // A pointerdown that never focuses (text selection, disabled child).
    buttons[0].triggerEventHandler('pointerdown');
    // The release lands wherever the pointer is - document catches it; the
    // clear defers one macrotask to survive the touch compat-event order.
    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    vi.runAllTimers();

    // Later keyboard Tab-in must show the ring again.
    buttons[0].triggerEventHandler('focusin');
    expect(dirA.focusVisible()).toBe(true);
  });

  it('keeps a touch tap classified as pointer focus (focusin after pointerup)', () => {
    vi.useFakeTimers();
    const { buttons, dirA } = setup();
    // Touch ordering: pointerdown -> pointerup -> compat mousedown -> focusin.
    buttons[0].triggerEventHandler('pointerdown');
    document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    buttons[0].triggerEventHandler('focusin');

    // The deferred clear must not have run before the focusin - no ring.
    expect(dirA.focusVisible()).toBe(false);
    vi.runAllTimers();
  });

  it('pointer click on A does not affect keyboard focus on B', () => {
    const { buttons, dirA, dirB } = setup();
    // Click A (pointer)
    buttons[0].triggerEventHandler('pointerdown');
    buttons[0].triggerEventHandler('focusin');
    expect(dirA.focusVisible()).toBe(false);
    // Tab to B (keyboard - no pointerdown on B)
    buttons[0].triggerEventHandler('focusout');
    buttons[1].triggerEventHandler('focusin');
    expect(dirB.focusVisible()).toBe(true);
  });
});
