import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CNGX_HOVER_INTENT_DEFAULTS, CngxHoverIntent } from './hover-intent.directive';

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

@Component({
  template: `<div cngxHoverIntent #hi="cngxHoverIntent">Hover</div>`,
  imports: [CngxHoverIntent],
})
class UnboundHost {}

@Component({
  template: `<div cngxHoverIntent [enterDelay]="300" #hi="cngxHoverIntent">Hover</div>`,
  imports: [CngxHoverIntent],
})
class BoundEnterHost {}

describe('CngxHoverIntent DI defaults', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup(host: typeof UnboundHost | typeof BoundEnterHost, defaults?: CngxHoverIntentDefaultsInput) {
    TestBed.configureTestingModule({
      imports: [host],
      providers: defaults
        ? [{ provide: CNGX_HOVER_INTENT_DEFAULTS, useValue: defaults }]
        : [],
    });
    const fixture = TestBed.createComponent(host);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.directive(CngxHoverIntent));
    return { fixture, dir: el.injector.get(CngxHoverIntent), host: el.nativeElement as HTMLElement };
  }

  type CngxHoverIntentDefaultsInput = { enterDelay?: number; leaveDelay?: number };

  it('sources un-bound enterDelay/leaveDelay from CNGX_HOVER_INTENT_DEFAULTS', () => {
    const { dir } = setup(UnboundHost, { enterDelay: 250, leaveDelay: 150 });
    expect(dir.enterDelay()).toBe(250);
    expect(dir.leaveDelay()).toBe(150);
  });

  it('settles active on the injected enterDelay when un-bound', () => {
    const { dir, host } = setup(UnboundHost, { enterDelay: 250 });
    host.dispatchEvent(new PointerEvent('pointerenter'));
    vi.advanceTimersByTime(249);
    expect(dir.active()).toBe(false);
    vi.advanceTimersByTime(1);
    expect(dir.active()).toBe(true);
  });

  it('a bound [enterDelay] still wins over the injected default', () => {
    const { dir } = setup(BoundEnterHost, { enterDelay: 250 });
    expect(dir.enterDelay()).toBe(300);
  });

  it('a partial default keeps the literal for the unset key', () => {
    const { dir } = setup(UnboundHost, { enterDelay: 200 });
    expect(dir.enterDelay()).toBe(200);
    expect(dir.leaveDelay()).toBe(0);
  });

  it('falls back to the 120/0 literals when the token is absent', () => {
    const { dir } = setup(UnboundHost);
    expect(dir.enterDelay()).toBe(120);
    expect(dir.leaveDelay()).toBe(0);
  });
});
