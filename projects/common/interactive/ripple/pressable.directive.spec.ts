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

  it('keeps the release delay on touch, where pointerleave follows pointerup', () => {
    const { button, dir } = setup();
    button.triggerEventHandler('pointerdown');
    button.triggerEventHandler('pointerup');
    button.triggerEventHandler('pointerleave');
    expect(dir.pressed()).toBe(true);

    vi.advanceTimersByTime(80);
    expect(dir.pressed()).toBe(false);
  });

  it('keeps one release timer when a second pointerup arrives without a pointerdown', () => {
    const { button, dir } = setup();
    button.triggerEventHandler('pointerdown');
    button.triggerEventHandler('pointerup');
    vi.advanceTimersByTime(10);
    // A second finger lifting: no pointerdown in between.
    button.triggerEventHandler('pointerup');
    vi.advanceTimersByTime(40);
    // New press at 50 ms. An orphaned first timer would release it at 80 ms.
    button.triggerEventHandler('pointerdown');
    vi.advanceTimersByTime(40);
    expect(dir.pressed()).toBe(true);
  });

  it('clears pending timer on new pointerdown', () => {
    const { button, dir } = setup();
    button.triggerEventHandler('pointerdown');
    button.triggerEventHandler('pointerup');
    // Timer running - press again before it fires
    button.triggerEventHandler('pointerdown');
    vi.advanceTimersByTime(80);
    expect(dir.pressed()).toBe(true); // still pressed from second press
  });

  describe('keyboard', () => {
    @Component({
      template: `<div cngxPressable role="button" tabindex="0"><input class="inner" /></div>`,
      imports: [CngxPressable],
    })
    class KeyHost {}

    function setupKey() {
      const fixture = TestBed.createComponent(KeyHost);
      fixture.detectChanges();
      const host = fixture.debugElement.query(By.css('[role=button]'));
      const dir = host.injector.get(CngxPressable);
      const el = host.nativeElement as HTMLElement;
      const key = (type: 'keydown' | 'keyup', k: string, init: KeyboardEventInit = {}, target: HTMLElement = el) =>
        target.dispatchEvent(new KeyboardEvent(type, { key: k, bubbles: true, ...init }));
      return { fixture, el, dir, key };
    }

    it('presses while Space is held on the host', () => {
      const { dir, key } = setupKey();
      key('keydown', ' ');
      expect(dir.pressed()).toBe(true);
      key('keyup', ' ');
      vi.advanceTimersByTime(80);
      expect(dir.pressed()).toBe(false);
    });

    it('presses on Enter until keyup', () => {
      const { dir, key } = setupKey();
      key('keydown', 'Enter');
      expect(dir.pressed()).toBe(true);
      key('keyup', 'Enter');
      vi.advanceTimersByTime(80);
      expect(dir.pressed()).toBe(false);
    });

    it('ignores keys from a descendant control', () => {
      const { el, dir, key } = setupKey();
      const input = el.querySelector<HTMLElement>('.inner');
      if (!input) {
        throw new Error('no inner input');
      }
      key('keydown', ' ', {}, input);
      expect(dir.pressed()).toBe(false);
    });

    it('releases on blur while a key is held', () => {
      const { el, dir, key } = setupKey();
      key('keydown', ' ');
      el.dispatchEvent(new FocusEvent('blur'));
      expect(dir.pressed()).toBe(false);
    });
  });
});
