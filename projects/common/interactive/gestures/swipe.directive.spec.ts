import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it, vi } from 'vitest';
import { CngxSwipe } from './swipe.directive';
import type { SwipeAxis, SwipeDirection } from './swipe-direction';

@Component({
  template: `<div
    cngxSwipe
    [threshold]="threshold()"
    [axis]="axis()"
    [enabled]="enabled()"
    (swiped)="swiped($event)"
  ></div>`,
  imports: [CngxSwipe],
})
class TestHost {
  threshold = signal(50);
  axis = signal<SwipeAxis>('both');
  enabled = signal(true);
  swiped = vi.fn<(direction: SwipeDirection) => void>();
}

describe('CngxSwipe', () => {
  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.directive(CngxSwipe)).nativeElement as HTMLElement;
    const dir = fixture.debugElement.query(By.directive(CngxSwipe)).injector.get(CngxSwipe);
    return { fixture, el, dir, host: fixture.componentInstance };
  }

  function swipe(
    el: HTMLElement,
    from: { x: number; y: number },
    to: { x: number; y: number },
  ): void {
    el.dispatchEvent(new PointerEvent('pointerdown', { clientX: from.x, clientY: from.y, bubbles: true }));
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: to.x, clientY: to.y, bubbles: true }));
    document.dispatchEvent(new PointerEvent('pointerup', { clientX: to.x, clientY: to.y, bubbles: true }));
  }

  it('starts idle', () => {
    const { dir } = setup();
    expect(dir.swiping()).toBe(false);
    expect(dir.swipeProgress()).toBe(0);
    expect(dir.swipeDirection()).toBeNull();
  });

  it('emits the dominant direction past the threshold', () => {
    const { el, host } = setup();
    swipe(el, { x: 200, y: 100 }, { x: 80, y: 100 }); // 120px left
    expect(host.swiped).toHaveBeenCalledExactlyOnceWith('left');
  });

  it('resolves right / up / down', () => {
    const right = setup();
    swipe(right.el, { x: 80, y: 100 }, { x: 200, y: 100 });
    expect(right.host.swiped).toHaveBeenCalledExactlyOnceWith('right');

    const up = setup();
    swipe(up.el, { x: 100, y: 200 }, { x: 100, y: 80 });
    expect(up.host.swiped).toHaveBeenCalledExactlyOnceWith('up');

    const down = setup();
    swipe(down.el, { x: 100, y: 80 }, { x: 100, y: 200 });
    expect(down.host.swiped).toHaveBeenCalledExactlyOnceWith('down');
  });

  it('does not emit below the threshold', () => {
    const { el, host } = setup();
    swipe(el, { x: 200, y: 100 }, { x: 180, y: 100 }); // 20px
    expect(host.swiped).not.toHaveBeenCalled();
  });

  it('does not emit when disabled', () => {
    const { fixture, el, host } = setup();
    host.enabled.set(false);
    fixture.detectChanges();
    swipe(el, { x: 200, y: 100 }, { x: 80, y: 100 });
    expect(host.swiped).not.toHaveBeenCalled();
  });

  it('ignores the orthogonal axis when pinned', () => {
    const { fixture, el, host } = setup();
    host.axis.set('x');
    fixture.detectChanges();
    swipe(el, { x: 100, y: 200 }, { x: 100, y: 80 }); // vertical, but axis=x
    expect(host.swiped).not.toHaveBeenCalled();
  });

  it('emits a pinned-axis swipe even when the orthogonal delta dominates at release', () => {
    // Regression: a natural thumb arc leaves |dy| slightly larger than
    // |dx| at pointerup. The old endpoint-dominance check discarded
    // this as "not horizontal"; with axis pinned, only |dx| matters.
    const { fixture, el, host } = setup();
    host.axis.set('x');
    fixture.detectChanges();
    swipe(el, { x: 200, y: 100 }, { x: 80, y: 225 }); // dx=-120, dy=+125
    expect(host.swiped).toHaveBeenCalledExactlyOnceWith('left');
  });

  it('advertises touch-action derived from the axis', () => {
    const { fixture, el, host } = setup();
    expect(el.style.touchAction).toBe('none'); // axis 'both' (default)

    host.axis.set('x');
    fixture.detectChanges();
    expect(el.style.touchAction).toBe('pan-y');

    host.axis.set('y');
    fixture.detectChanges();
    expect(el.style.touchAction).toBe('pan-x');
  });

  it('clears touch-action when disabled so native scroll is untouched', () => {
    const { fixture, el, host } = setup();
    host.axis.set('x');
    fixture.detectChanges();
    expect(el.style.touchAction).toBe('pan-y');

    host.enabled.set(false);
    fixture.detectChanges();
    expect(el.style.touchAction).toBe('');
  });

  it('resets gesture state after completion', () => {
    const { el, dir } = setup();
    swipe(el, { x: 200, y: 100 }, { x: 80, y: 100 });
    expect(dir.swiping()).toBe(false);
    expect(dir.swipeProgress()).toBe(0);
    expect(dir.swipeDirection()).toBeNull();
  });

  it('resets gesture state on pointercancel (no stuck swiping)', () => {
    const { el, dir, host } = setup();
    el.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, clientY: 100, bubbles: true }));
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 120, clientY: 100, bubbles: true }));
    expect(dir.swiping()).toBe(true);
    document.dispatchEvent(new PointerEvent('pointercancel', { clientX: 120, clientY: 100, bubbles: true }));
    expect(dir.swiping()).toBe(false);
    expect(dir.swipeProgress()).toBe(0);
    expect(dir.swipeDirection()).toBeNull();
    expect(host.swiped).not.toHaveBeenCalled();
  });

  it('does not strand user-select on the host after pointercancel', () => {
    const { el } = setup();
    el.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, clientY: 100, bubbles: true }));
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 120, clientY: 100, bubbles: true }));
    document.dispatchEvent(new PointerEvent('pointercancel', { clientX: 120, clientY: 100, bubbles: true }));
    expect(el.style.userSelect).toBe('');
  });

  it('host user-select is unset while idle', () => {
    const { el } = setup();
    expect(el.style.userSelect).toBe('');
  });
});
