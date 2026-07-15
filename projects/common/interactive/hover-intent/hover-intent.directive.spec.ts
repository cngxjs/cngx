import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxHoverIntent } from './hover-intent.directive';

@Component({
  template: `
    <div
      cngxHoverIntent
      [enterDelay]="enterDelay()"
      [leaveDelay]="leaveDelay()"
      (intentChange)="handleChange($event)"
      #hi="cngxHoverIntent"
    >
      Hover me
    </div>
  `,
  imports: [CngxHoverIntent],
})
class TestHost {
  readonly enterDelay = signal(120);
  readonly leaveDelay = signal(0);
  readonly edges: boolean[] = [];

  handleChange(active: boolean): void {
    this.edges.push(active);
  }
}

describe('CngxHoverIntent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.directive(CngxHoverIntent));
    const dir = el.injector.get(CngxHoverIntent);
    const host = el.nativeElement as HTMLElement;
    return { fixture, dir, host };
  }

  it('starts with active=false', () => {
    const { dir } = setup();
    expect(dir.active()).toBe(false);
  });

  it('stays false until enterDelay elapses after pointerenter', () => {
    const { host, dir } = setup();
    host.dispatchEvent(new PointerEvent('pointerenter'));
    vi.advanceTimersByTime(119);
    expect(dir.active()).toBe(false);
    vi.advanceTimersByTime(1);
    expect(dir.active()).toBe(true);
  });

  it('cancels when pointerleave arrives before enterDelay (never fires true)', () => {
    const { host, dir, fixture } = setup();
    host.dispatchEvent(new PointerEvent('pointerenter'));
    vi.advanceTimersByTime(80);
    host.dispatchEvent(new PointerEvent('pointerleave'));
    vi.advanceTimersByTime(500);
    expect(dir.active()).toBe(false);
    expect(fixture.componentInstance.edges).toEqual([]);
  });

  it('gates the false transition behind leaveDelay', () => {
    const { host, dir, fixture } = setup();
    fixture.componentInstance.leaveDelay.set(200);
    fixture.detectChanges();

    host.dispatchEvent(new PointerEvent('pointerenter'));
    vi.advanceTimersByTime(120);
    expect(dir.active()).toBe(true);

    host.dispatchEvent(new PointerEvent('pointerleave'));
    vi.advanceTimersByTime(199);
    expect(dir.active()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(dir.active()).toBe(false);
  });

  it('emits intentChange on each debounced edge', () => {
    const { host, fixture } = setup();
    fixture.componentInstance.leaveDelay.set(50);
    fixture.detectChanges();

    host.dispatchEvent(new PointerEvent('pointerenter'));
    vi.advanceTimersByTime(120);
    host.dispatchEvent(new PointerEvent('pointerleave'));
    vi.advanceTimersByTime(50);

    expect(fixture.componentInstance.edges).toEqual([true, false]);
  });

  it('does not re-emit when re-entering an already-active host', () => {
    const { host, fixture } = setup();
    host.dispatchEvent(new PointerEvent('pointerenter'));
    vi.advanceTimersByTime(120);
    expect(fixture.componentInstance.edges).toEqual([true]);

    host.dispatchEvent(new PointerEvent('pointerenter'));
    vi.advanceTimersByTime(120);
    expect(fixture.componentInstance.edges).toEqual([true]);
  });

  it('clears a pending timer on destroy (no late set after teardown)', () => {
    const { host, fixture } = setup();
    host.dispatchEvent(new PointerEvent('pointerenter'));
    vi.advanceTimersByTime(80);
    fixture.destroy();

    vi.advanceTimersByTime(500);
    expect(fixture.componentInstance.edges).toEqual([]);
  });
});
