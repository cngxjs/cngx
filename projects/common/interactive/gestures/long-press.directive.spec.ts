import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxLongPress } from './long-press.directive';

@Component({
  template: `
    <div
      cngxLongPress
      [threshold]="threshold()"
      [enabled]="enabled()"
      (longPressed)="handleLongPress($event)"
      (click)="clicks = clicks + 1"
      #lp="cngxLongPress"
    >
      Hold me <span class="child" (click)="childClicks = childClicks + 1">child</span>
    </div>
  `,
  imports: [CngxLongPress],
})
class TestHost {
  readonly threshold = signal(500);
  readonly enabled = signal(true);
  longPressCount = 0;
  clicks = 0;
  childClicks = 0;
  lastEvent: PointerEvent | null = null;

  handleLongPress(event: PointerEvent): void {
    this.longPressCount++;
    this.lastEvent = event;
  }
}

describe('CngxLongPress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.directive(CngxLongPress));
    const dir = el.injector.get(CngxLongPress);
    const host = el.nativeElement as HTMLElement;
    return { fixture, el, dir, host };
  }

  it('starts with longPressing=false', () => {
    const { dir } = setup();
    expect(dir.longPressing()).toBe(false);
  });

  it('sets longPressing=true on pointerdown', () => {
    const { host, dir } = setup();
    host.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    expect(dir.longPressing()).toBe(true);
  });

  it('emits longPressed after threshold', () => {
    const { host, fixture } = setup();
    host.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    vi.advanceTimersByTime(500);
    expect(fixture.componentInstance.longPressCount).toBe(1);
  });

  it('does not emit before threshold', () => {
    const { host, fixture } = setup();
    host.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    vi.advanceTimersByTime(400);
    expect(fixture.componentInstance.longPressCount).toBe(0);
  });

  it('cancels on pointerup before threshold', () => {
    const { host, dir, fixture } = setup();
    host.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    vi.advanceTimersByTime(200);
    document.dispatchEvent(new PointerEvent('pointerup'));
    expect(dir.longPressing()).toBe(false);
    vi.advanceTimersByTime(300);
    expect(fixture.componentInstance.longPressCount).toBe(0);
  });

  it('cancels when pointer moves beyond threshold', () => {
    const { host, dir, fixture } = setup();
    host.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    // Move 15px - beyond 10px threshold
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 115, clientY: 100 }));
    expect(dir.longPressing()).toBe(false);
    vi.advanceTimersByTime(500);
    expect(fixture.componentInstance.longPressCount).toBe(0);
  });

  it('does not cancel on small movement', () => {
    const { host, fixture } = setup();
    host.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    // Move 5px - within threshold
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 105, clientY: 100 }));
    vi.advanceTimersByTime(500);
    expect(fixture.componentInstance.longPressCount).toBe(1);
  });

  it('ignores a non-primary button', () => {
    const { host, dir, fixture } = setup();
    host.dispatchEvent(new PointerEvent('pointerdown', { button: 2, clientX: 100, clientY: 100 }));
    expect(dir.longPressing()).toBe(false);
    vi.advanceTimersByTime(500);
    expect(fixture.componentInstance.longPressCount).toBe(0);
  });

  it('cancels on pointercancel', () => {
    const { host, dir, fixture } = setup();
    host.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    host.dispatchEvent(new PointerEvent('pointercancel'));
    expect(dir.longPressing()).toBe(false);
    vi.advanceTimersByTime(500);
    expect(fixture.componentInstance.longPressCount).toBe(0);
  });

  it('stops a pending press when disabled mid-gesture', () => {
    const { host, dir, fixture } = setup();
    host.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    vi.advanceTimersByTime(200);
    fixture.componentInstance.enabled.set(false);
    fixture.detectChanges();
    expect(dir.longPressing()).toBe(false);
    vi.advanceTimersByTime(300);
    expect(fixture.componentInstance.longPressCount).toBe(0);
  });

  it('does not resume a press that was disabled and re-enabled mid-gesture', () => {
    const { host, fixture } = setup();
    host.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    vi.advanceTimersByTime(200);
    fixture.componentInstance.enabled.set(false);
    fixture.detectChanges();
    vi.advanceTimersByTime(100);
    fixture.componentInstance.enabled.set(true);
    fixture.detectChanges();
    vi.advanceTimersByTime(200);
    expect(fixture.componentInstance.longPressCount).toBe(0);
  });

  describe('trailing click', () => {
    function completeAndRelease(target: HTMLElement, host: HTMLElement): void {
      host.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
      vi.advanceTimersByTime(500);
      document.dispatchEvent(new PointerEvent('pointerup'));
      target.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    }

    it('suppresses the click that follows a completed long press', () => {
      const { host, fixture } = setup();
      completeAndRelease(host, host);
      expect(fixture.componentInstance.longPressCount).toBe(1);
      expect(fixture.componentInstance.clicks).toBe(0);
    });

    it('suppresses it on a descendant too', () => {
      const { host, fixture } = setup();
      const child = host.querySelector<HTMLElement>('.child');
      if (!child) {
        throw new Error('no child');
      }
      completeAndRelease(child, host);
      expect(fixture.componentInstance.childClicks).toBe(0);
      expect(fixture.componentInstance.clicks).toBe(0);
    });

    it('lets the next ordinary click through', () => {
      const { host, fixture } = setup();
      completeAndRelease(host, host);
      host.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
      document.dispatchEvent(new PointerEvent('pointerup'));
      host.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
      expect(fixture.componentInstance.clicks).toBe(1);
    });

    it('never swallows a keyboard click, even when no pointer click followed the press', () => {
      const { host, fixture } = setup();
      host.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
      vi.advanceTimersByTime(500);
      // Released outside the host: the pointer click lands elsewhere, the guard stays armed.
      document.dispatchEvent(new PointerEvent('pointerup'));
      // Enter / Space activation and el.click() carry detail 0.
      host.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
      expect(fixture.componentInstance.clicks).toBe(1);
    });

    it('disarms on any pointerdown, even one a descendant stops from reaching the host', () => {
      const { host, fixture } = setup();
      const child = host.querySelector<HTMLElement>('.child');
      if (!child) {
        throw new Error('no child');
      }
      child.addEventListener('pointerdown', (e) => e.stopPropagation());
      host.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
      vi.advanceTimersByTime(500);
      // Released outside the host: the trailing click never reaches it.
      document.dispatchEvent(new PointerEvent('pointerup'));
      child.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      child.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
      expect(fixture.componentInstance.childClicks).toBe(1);
    });

    it('disarms on a keydown anywhere', () => {
      const { host, fixture } = setup();
      host.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
      vi.advanceTimersByTime(500);
      document.dispatchEvent(new PointerEvent('pointerup'));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
      host.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
      expect(fixture.componentInstance.clicks).toBe(1);
    });

    it('does not touch a click after a short tap', () => {
      const { host, fixture } = setup();
      host.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
      vi.advanceTimersByTime(100);
      document.dispatchEvent(new PointerEvent('pointerup'));
      host.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
      expect(fixture.componentInstance.clicks).toBe(1);
    });
  });
});
