import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxRipple } from './ripple.directive';

@Component({
  template: `<button cngxRipple [rippleDisabled]="disabled()" #r="cngxRipple">Click</button>`,
  imports: [CngxRipple],
})
class TestHost {
  readonly disabled = signal(false);
}

describe('CngxRipple', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.directive(CngxRipple));
    const dir = button.injector.get(CngxRipple);
    const host = button.nativeElement as HTMLElement;
    return { fixture, button, dir, host };
  }

  it('starts with active=false', () => {
    const { dir } = setup();
    expect(dir.active()).toBe(false);
  });

  it('creates a wave element on pointerdown', () => {
    const { host } = setup();
    host.dispatchEvent(new PointerEvent('pointerdown', { clientX: 50, clientY: 25 }));
    const wave = host.querySelector('.cngx-ripple__wave');
    expect(wave).toBeTruthy();
  });

  it('sets CSS custom properties on the wave', () => {
    const { host } = setup();
    host.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 50 }) as DOMRect;
    host.dispatchEvent(new PointerEvent('pointerdown', { clientX: 30, clientY: 20 }));
    const wave = host.querySelector('.cngx-ripple__wave') as HTMLElement;
    expect(wave.style.getPropertyValue('--cngx-ripple-x')).toBe('30px');
    expect(wave.style.getPropertyValue('--cngx-ripple-y')).toBe('20px');
    expect(wave.style.getPropertyValue('--cngx-ripple-size')).toBeTruthy();
  });

  it('does not create wave when disabled', () => {
    const { fixture, host } = setup();
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    host.dispatchEvent(new PointerEvent('pointerdown', { clientX: 50, clientY: 25 }));
    expect(host.querySelector('.cngx-ripple__wave')).toBeNull();
  });

  it('sets active=true during ripple animation', () => {
    const { host, dir } = setup();
    host.dispatchEvent(new PointerEvent('pointerdown', { clientX: 50, clientY: 25 }));
    expect(dir.active()).toBe(true);
  });

  it('marks the wave aria-hidden', () => {
    const { host } = setup();
    host.dispatchEvent(new PointerEvent('pointerdown', { clientX: 50, clientY: 25 }));
    const wave = host.querySelector('.cngx-ripple__wave') as HTMLElement;
    expect(wave.getAttribute('aria-hidden')).toBe('true');
  });

  it('flushes pending waves and their fallback timers on destroy', () => {
    vi.useFakeTimers();
    const { fixture, host, dir } = setup();
    host.dispatchEvent(new PointerEvent('pointerdown', { clientX: 50, clientY: 25 }));
    host.dispatchEvent(new PointerEvent('pointerdown', { clientX: 10, clientY: 10 }));
    expect(host.querySelectorAll('.cngx-ripple__wave').length).toBe(2);
    const timersBeforeDestroy = vi.getTimerCount();

    fixture.destroy();
    expect(host.querySelectorAll('.cngx-ripple__wave').length).toBe(0);
    expect(dir.active()).toBe(false);
    // Both 1s fallback timers are cleared; ambient scheduler timers stay.
    expect(vi.getTimerCount()).toBe(timersBeforeDestroy - 2);
  });
});
