import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { connectRecyclerToRoving } from './connect-recycler-roving';
import type { CngxRecycler } from './recycler';
import type { CngxRovingTabindex } from '@cngx/common/a11y';

@Component({
  selector: 'roving-recycler-probe',
  standalone: true,
  template: `
    @for (i of indices; track i) {
      <button [attr.data-cngx-recycle-index]="i">item {{ i }}</button>
    }
  `,
})
class Probe {
  readonly indices = [0, 1, 2, 3, 4];
  readonly pendingFocus = signal<number | null>(null);
  readonly start = signal(0);
  readonly end = signal(0);
  readonly scrollCalls: number[] = [];
  clearCount = 0;

  readonly recycler = {
    scrollToIndex: (i: number) => this.scrollCalls.push(i),
    start: this.start,
    end: this.end,
  } as unknown as CngxRecycler;

  readonly roving = {
    pendingFocus: this.pendingFocus,
    clearPendingFocus: () => {
      this.clearCount++;
      this.pendingFocus.set(null);
    },
  } as unknown as CngxRovingTabindex;

  constructor() {
    connectRecyclerToRoving(this.recycler, this.roving);
  }
}

describe('connectRecyclerToRoving', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  function flushRaf(): void {
    // jsdom rAF is backed by a timer; advance one frame to drain it.
    vi.advanceTimersByTime(16);
  }

  function setup() {
    const fixture = TestBed.createComponent(Probe);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    TestBed.flushEffects();
    const c = fixture.componentInstance;
    const button = (i: number): HTMLElement | null =>
      fixture.nativeElement.querySelector(`[data-cngx-recycle-index="${i}"]`);
    return { fixture, c, button };
  }

  it('scrolls the recycler to a freshly pending out-of-range target', () => {
    const { c } = setup();
    c.pendingFocus.set(3);
    TestBed.flushEffects();
    flushRaf();
    expect(c.scrollCalls).toEqual([3]);
  });

  it('debounces rapid pendingFocus changes to a single scrollToIndex on the latest', () => {
    const { c } = setup();
    for (const i of [1, 2, 3]) {
      c.pendingFocus.set(i);
      TestBed.flushEffects();
    }
    flushRaf();
    expect(c.scrollCalls).toEqual([3]);
  });

  it('focuses and clears when a range change brings the pending target into view', () => {
    const { c, button } = setup();
    c.pendingFocus.set(2);
    TestBed.flushEffects();
    // Range now renders indices 0..4 - the target is in view.
    c.end.set(5);
    TestBed.flushEffects();
    flushRaf();
    expect(document.activeElement).toBe(button(2));
    expect(c.clearCount).toBe(1);
  });

  it('does not focus when the pending target is outside the rendered range', () => {
    const { c } = setup();
    c.pendingFocus.set(10);
    TestBed.flushEffects();
    c.end.set(5);
    TestBed.flushEffects();
    flushRaf();
    expect(c.clearCount).toBe(0);
    expect((document.activeElement as HTMLElement)?.dataset?.['cngxRecycleIndex']).toBeUndefined();
  });
});
