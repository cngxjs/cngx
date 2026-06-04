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
      (longPressed)="handleLongPress($event)"
      #lp="cngxLongPress"
    >
      Hold me
    </div>
  `,
  imports: [CngxLongPress],
})
class TestHost {
  readonly threshold = signal(500);
  longPressCount = 0;
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
    // Move 15px — beyond 10px threshold
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 115, clientY: 100 }));
    expect(dir.longPressing()).toBe(false);
    vi.advanceTimersByTime(500);
    expect(fixture.componentInstance.longPressCount).toBe(0);
  });

  it('does not cancel on small movement', () => {
    const { host, fixture } = setup();
    host.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
    // Move 5px — within threshold
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 105, clientY: 100 }));
    vi.advanceTimersByTime(500);
    expect(fixture.componentInstance.longPressCount).toBe(1);
  });
});
