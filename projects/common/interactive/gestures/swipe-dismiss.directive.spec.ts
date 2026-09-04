import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it, vi } from 'vitest';
import { CngxSwipeDismiss } from './swipe-dismiss.directive';

@Component({
  template: `<div
    cngxSwipeDismiss="left"
    [threshold]="threshold()"
    [enabled]="enabled()"
    (swiped)="swiped()"
  ></div>`,
  imports: [CngxSwipeDismiss],
})
class TestHost {
  threshold = signal(50);
  enabled = signal(true);
  swiped = vi.fn();
}

describe('CngxSwipeDismiss', () => {
  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.directive(CngxSwipeDismiss))
      .nativeElement as HTMLElement;
    const dir = fixture.debugElement
      .query(By.directive(CngxSwipeDismiss))
      .injector.get(CngxSwipeDismiss);
    return { fixture, el, dir, host: fixture.componentInstance };
  }

  function simulateSwipe(el: HTMLElement, startX: number, endX: number): void {
    el.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: startX, clientY: 100, bubbles: true }),
    );
    document.dispatchEvent(
      new PointerEvent('pointermove', { clientX: endX, clientY: 100, bubbles: true }),
    );
    document.dispatchEvent(
      new PointerEvent('pointerup', { clientX: endX, clientY: 100, bubbles: true }),
    );
  }

  it('starts with swiping=false and progress=0', () => {
    const { dir } = setup();
    expect(dir.swiping()).toBe(false);
    expect(dir.swipeProgress()).toBe(0);
  });

  it('emits swiped when swipe exceeds threshold (left)', () => {
    const { el, host } = setup();
    simulateSwipe(el, 200, 100); // 100px left swipe, threshold 50
    expect(host.swiped).toHaveBeenCalledOnce();
  });

  it('does not emit when swipe is below threshold', () => {
    const { el, host } = setup();
    simulateSwipe(el, 200, 180); // 20px left swipe, threshold 50
    expect(host.swiped).not.toHaveBeenCalled();
  });

  it('does not emit when disabled', () => {
    const { fixture, el, host } = setup();
    host.enabled.set(false);
    fixture.detectChanges();
    simulateSwipe(el, 200, 100);
    expect(host.swiped).not.toHaveBeenCalled();
  });

  it('resets progress after swipe completes', () => {
    const { el, dir } = setup();
    simulateSwipe(el, 200, 100);
    expect(dir.swiping()).toBe(false);
    expect(dir.swipeProgress()).toBe(0);
  });

  it('resets in-flight state on pointercancel without emitting', () => {
    const { el, dir, host } = setup();
    el.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 200, clientY: 100, bubbles: true }),
    );
    document.dispatchEvent(
      new PointerEvent('pointermove', { clientX: 100, clientY: 100, bubbles: true }),
    );
    expect(dir.swiping()).toBe(true);

    // The browser reclaims the pointer (system gesture): state must unstick.
    document.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }));
    expect(dir.swiping()).toBe(false);
    expect(dir.swipeProgress()).toBe(0);
    expect(host.swiped).not.toHaveBeenCalled();
  });

  it('ignores document events of a different pointerId', () => {
    const { el, dir } = setup();
    el.dispatchEvent(
      new PointerEvent('pointerdown', { pointerId: 1, clientX: 200, clientY: 100, bubbles: true }),
    );
    // A second finger moves - must not steer this gesture.
    document.dispatchEvent(
      new PointerEvent('pointermove', { pointerId: 2, clientX: 0, clientY: 100, bubbles: true }),
    );
    expect(dir.swiping()).toBe(false);

    document.dispatchEvent(
      new PointerEvent('pointermove', { pointerId: 1, clientX: 100, clientY: 100, bubbles: true }),
    );
    expect(dir.swiping()).toBe(true);

    document.dispatchEvent(
      new PointerEvent('pointerup', { pointerId: 1, clientX: 100, clientY: 100, bubbles: true }),
    );
    expect(dir.swiping()).toBe(false);
  });

  it('advertises touch-action derived from the dismiss direction', () => {
    const { el } = setup();
    // Horizontal dismiss hands vertical panning back to the browser.
    expect(el.style.touchAction).toBe('pan-y');
  });
});
