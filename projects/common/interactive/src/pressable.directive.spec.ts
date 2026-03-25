import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxPressable } from './pressable.directive';

@Component({
  template: `<button cngxPressable [pressableReleaseDelay]="delay()">Press</button>`,
  imports: [CngxPressable],
})
class TestHost {
  readonly delay = signal(80);
}

describe('CngxPressable', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('button'));
    const dir = button.injector.get(CngxPressable);
    return { fixture, button, dir };
  }

  it('starts unpressed', () => {
    const { dir } = setup();
    expect(dir.pressed()).toBe(false);
  });

  it('sets pressed=true on pointerdown', () => {
    const { button, dir } = setup();
    button.triggerEventHandler('pointerdown');
    expect(dir.pressed()).toBe(true);
  });

  it('adds cngx-pressed class when pressed', () => {
    const { fixture, button } = setup();
    button.triggerEventHandler('pointerdown');
    fixture.detectChanges();
    expect((button.nativeElement as HTMLElement).classList.contains('cngx-pressed')).toBe(true);
  });

  it('releases after delay on pointerup', () => {
    const { button, dir } = setup();
    button.triggerEventHandler('pointerdown');
    expect(dir.pressed()).toBe(true);

    button.triggerEventHandler('pointerup');
    expect(dir.pressed()).toBe(true); // still pressed during delay

    vi.advanceTimersByTime(80);
    expect(dir.pressed()).toBe(false);
  });

  it('releases immediately with delay=0', () => {
    const { button, dir, fixture } = setup();
    fixture.componentInstance.delay.set(0);
    fixture.detectChanges();

    button.triggerEventHandler('pointerdown');
    button.triggerEventHandler('pointerup');
    expect(dir.pressed()).toBe(false);
  });

  it('releases immediately on pointercancel', () => {
    const { button, dir } = setup();
    button.triggerEventHandler('pointerdown');
    button.triggerEventHandler('pointercancel');
    expect(dir.pressed()).toBe(false);
  });

  it('releases immediately on pointerleave', () => {
    const { button, dir } = setup();
    button.triggerEventHandler('pointerdown');
    button.triggerEventHandler('pointerleave');
    expect(dir.pressed()).toBe(false);
  });

  it('clears pending timer on new pointerdown', () => {
    const { button, dir } = setup();
    button.triggerEventHandler('pointerdown');
    button.triggerEventHandler('pointerup');
    // Timer running — press again before it fires
    button.triggerEventHandler('pointerdown');
    vi.advanceTimersByTime(80);
    expect(dir.pressed()).toBe(true); // still pressed from second press
  });
});
