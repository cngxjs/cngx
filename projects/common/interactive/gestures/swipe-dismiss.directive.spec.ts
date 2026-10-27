import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it, vi } from 'vitest';
import { CngxSwipeDismiss } from './swipe-dismiss.directive';
import { SWIPE_CAPTURE_SLOP_PX } from './swipe-engine';

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
  describe('pointer capture', () => {
    // Capture retargets the follow-up click to the host, so it must wait
    // until the gesture is a swipe; a tap has to reach the child button.
    function spyCapture(el: HTMLElement) {
      const capture = vi.fn();
      const release = vi.fn();
      el.setPointerCapture = capture;
      el.releasePointerCapture = release;
      return { capture, release };
    }

    function down(el: HTMLElement, x: number): void {
      el.dispatchEvent(
        new PointerEvent('pointerdown', { pointerId: 7, clientX: x, clientY: 100, bubbles: true }),
      );
    }

    function docEvent(type: string, x: number): void {
      document.dispatchEvent(
        new PointerEvent(type, { pointerId: 7, clientX: x, clientY: 100, bubbles: true }),
      );
    }

    it('does not capture on pointerdown or a move inside the slop', () => {
      const { el } = setup();
      const { capture, release } = spyCapture(el);
      down(el, 200);
      expect(capture).not.toHaveBeenCalled();

      docEvent('pointermove', 200 - SWIPE_CAPTURE_SLOP_PX);
      expect(capture).not.toHaveBeenCalled();

      docEvent('pointerup', 200 - SWIPE_CAPTURE_SLOP_PX);
      expect(capture).not.toHaveBeenCalled();
      expect(release).not.toHaveBeenCalled();
    });

    it('lets a tap on a child button deliver its click', () => {
      const { el } = setup();
      spyCapture(el);
      const button = document.createElement('button');
      const clicked = vi.fn();
      button.addEventListener('click', clicked);
      el.appendChild(button);

      button.dispatchEvent(
        new PointerEvent('pointerdown', {
          pointerId: 7,
          clientX: 200,
          clientY: 100,
          bubbles: true,
        }),
      );
      expect(el.setPointerCapture).not.toHaveBeenCalled();
      docEvent('pointerup', 200);
      button.click();
      expect(clicked).toHaveBeenCalledOnce();
    });

    it('captures once the move crosses the slop and releases on pointerup', () => {
      const { el } = setup();
      const { capture, release } = spyCapture(el);
      down(el, 200);
      docEvent('pointermove', 200 - SWIPE_CAPTURE_SLOP_PX - 1);
      expect(capture).toHaveBeenCalledExactlyOnceWith(7);

      docEvent('pointermove', 100);
      expect(capture).toHaveBeenCalledOnce();

      docEvent('pointerup', 100);
      expect(release).toHaveBeenCalledExactlyOnceWith(7);
    });

    it('releases a captured pointer on pointercancel', () => {
      const { el, dir } = setup();
      const { capture, release } = spyCapture(el);
      down(el, 200);
      docEvent('pointermove', 150);
      expect(capture).toHaveBeenCalledOnce();

      docEvent('pointercancel', 150);
      expect(release).toHaveBeenCalledExactlyOnceWith(7);
      expect(dir.swiping()).toBe(false);
    });

    it('releases a captured pointer when the host is destroyed mid-swipe', () => {
      const { fixture, el } = setup();
      const { release } = spyCapture(el);
      down(el, 200);
      docEvent('pointermove', 150);

      fixture.destroy();
      expect(release).toHaveBeenCalledExactlyOnceWith(7);
    });
  });
});
