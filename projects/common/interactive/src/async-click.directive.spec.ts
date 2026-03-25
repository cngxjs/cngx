import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { of, type Observable } from 'rxjs';
import { CngxAsyncClick, type AsyncAction } from './async-click.directive';

// ── Deferred promise helper ─────────────────────────────────────────────

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// ── Test hosts ──────────────────────────────────────────────────────────

@Component({
  template: `<button [cngxAsyncClick]="action" [enabled]="enabled()">Go</button>`,
  imports: [CngxAsyncClick],
})
class ButtonHost {
  readonly enabled = signal(true);
  readonly directive = viewChild.required(CngxAsyncClick);
  callCount = 0;
  actionImpl: () => Promise<unknown> | Observable<unknown> = () => Promise.resolve();
  readonly action: AsyncAction = () => {
    this.callCount++;
    return this.actionImpl();
  };
}

@Component({
  template: `<div [cngxAsyncClick]="action">Go</div>`,
  imports: [CngxAsyncClick],
})
class DivHost {
  readonly directive = viewChild.required(CngxAsyncClick);
  actionImpl: () => Promise<unknown> | Observable<unknown> = () => Promise.resolve();
  readonly action: AsyncAction = () => this.actionImpl();
}

function setupButton(overrides: { enabled?: boolean } = {}) {
  const fixture = TestBed.createComponent(ButtonHost);
  if (overrides.enabled != null) {
    fixture.componentInstance.enabled.set(overrides.enabled);
  }
  fixture.detectChanges();
  TestBed.flushEffects();
  const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  const directive = fixture.componentInstance.directive();
  return { fixture, btn, directive, host: fixture.componentInstance };
}

function setupDiv() {
  const fixture = TestBed.createComponent(DivHost);
  fixture.detectChanges();
  TestBed.flushEffects();
  const div = fixture.nativeElement.querySelector('div') as HTMLDivElement;
  const directive = fixture.componentInstance.directive();
  return { fixture, div, directive, host: fixture.componentInstance };
}

function flush(fixture: ReturnType<typeof TestBed.createComponent>): void {
  fixture.detectChanges();
  TestBed.flushEffects();
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('CngxAsyncClick', () => {
  it('should call the action on click', async () => {
    const { btn, host } = setupButton();
    btn.click();
    await vi.waitFor(() => expect(host.callCount).toBe(1));
  });

  it('should set pending during execution', async () => {
    const d = deferred();
    const { btn, directive, host, fixture } = setupButton();
    host.actionImpl = () => d.promise;
    btn.click();
    flush(fixture);
    expect(directive.pending()).toBe(true);
    d.resolve();
    await d.promise;
    flush(fixture);
    expect(directive.pending()).toBe(false);
  });

  it('should guard against double-click', async () => {
    const d = deferred();
    const { btn, host } = setupButton();
    host.actionImpl = () => d.promise;
    btn.click();
    btn.click();
    btn.click();
    expect(host.callCount).toBe(1);
    d.resolve();
    await d.promise;
  });

  it('should set succeeded after resolve', async () => {
    const { btn, directive, fixture } = setupButton();
    btn.click();
    await vi.waitFor(() => {
      flush(fixture);
      expect(directive.succeeded()).toBe(true);
    });
  });

  it('should reset succeeded after feedbackDuration', async () => {
    vi.useFakeTimers();
    const d = deferred();
    const { btn, directive, host, fixture } = setupButton();
    host.actionImpl = () => d.promise;
    btn.click();
    flush(fixture);
    expect(directive.pending()).toBe(true);
    // Resolve the action
    d.resolve();
    await vi.advanceTimersByTimeAsync(0);
    flush(fixture);
    expect(directive.succeeded()).toBe(true);
    // Advance past feedback duration
    vi.advanceTimersByTime(2001);
    expect(directive.succeeded()).toBe(false);
    vi.useRealTimers();
  });

  it('should set failed and error on rejection', async () => {
    const { btn, directive, host, fixture } = setupButton();
    host.actionImpl = () => Promise.reject('oops');
    btn.click();
    await vi.waitFor(() => {
      flush(fixture);
      expect(directive.failed()).toBe(true);
    });
    expect(directive.error()).toBe('oops');
  });

  it('should set disabled attr on button while pending', async () => {
    const d = deferred();
    const { btn, host, fixture } = setupButton();
    host.actionImpl = () => d.promise;
    btn.click();
    flush(fixture);
    expect(btn.hasAttribute('disabled')).toBe(true);
    d.resolve();
    await d.promise;
    flush(fixture);
    expect(btn.hasAttribute('disabled')).toBe(false);
  });

  it('should NOT set disabled on div, but set aria-disabled', async () => {
    const d = deferred();
    const { div, host, fixture } = setupDiv();
    host.actionImpl = () => d.promise;
    div.click();
    flush(fixture);
    expect(div.hasAttribute('disabled')).toBe(false);
    expect(div.getAttribute('aria-disabled')).toBe('true');
    d.resolve();
    await d.promise;
  });

  it('should set aria-busy while pending', async () => {
    const d = deferred();
    const { btn, host, fixture } = setupButton();
    host.actionImpl = () => d.promise;
    btn.click();
    flush(fixture);
    expect(btn.getAttribute('aria-busy')).toBe('true');
    d.resolve();
    await d.promise;
  });

  it('should not call action when enabled is false', () => {
    const { btn, host } = setupButton({ enabled: false });
    btn.click();
    expect(host.callCount).toBe(0);
  });

  it('should apply CSS classes', async () => {
    const d = deferred();
    const { btn, host, fixture } = setupButton();
    host.actionImpl = () => d.promise;
    btn.click();
    flush(fixture);
    expect(btn.classList.contains('cngx-async--pending')).toBe(true);
    d.resolve();
    await d.promise;
    flush(fixture);
    expect(btn.classList.contains('cngx-async--succeeded')).toBe(true);
  });

  it('should work with Observable actions', async () => {
    const { btn, directive, host, fixture } = setupButton();
    host.actionImpl = () => of('done');
    btn.click();
    await vi.waitFor(() => {
      flush(fixture);
      expect(directive.succeeded()).toBe(true);
    });
  });
});
