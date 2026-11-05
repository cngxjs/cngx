import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import { CngxAsyncClick, type AsyncAction, type CngxAsyncSettle } from './async-click.directive';
import { CNGX_ASYNC_RUN_STATE } from './async-run-state.token';

@Component({
  template: `<button [cngxAsyncClick]="action()" [enabled]="enabled()">Run</button>`,
  imports: [CngxAsyncClick],
})
class Host {
  readonly enabled = signal(true);
  resolveRun: (() => void) | null = null;
  rejectRun: ((err: unknown) => void) | null = null;
  readonly action = signal<AsyncAction>(
    () =>
      new Promise<void>((resolve, reject) => {
        this.resolveRun = resolve;
        this.rejectRun = reject;
      }),
  );
}

async function drainMicrotasks(): Promise<void> {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  TestBed.flushEffects();
  const de = fixture.debugElement.query(By.directive(CngxAsyncClick));
  const directive = de.injector.get(CngxAsyncClick);
  const runState = de.injector.get(CNGX_ASYNC_RUN_STATE, null, { self: true });
  const button = de.nativeElement as HTMLButtonElement;
  return { fixture, directive, runState, button, host: fixture.componentInstance };
}

describe('CNGX_ASYNC_RUN_STATE', () => {
  it('resolves to the directive on the same element', () => {
    const { directive, runState } = setup();

    expect(runState).toBe(directive);
  });

  it('is not visible to a sibling element', () => {
    const { fixture } = setup();

    const root = fixture.debugElement.injector.get(CNGX_ASYNC_RUN_STATE, null, { optional: true });
    expect(root).toBeNull();
  });

  it('mirrors pending, enabled and state across a run', async () => {
    const { fixture, directive, runState, button, host } = setup();
    expect(runState).not.toBeNull();
    const run = runState!;

    expect(run.pending()).toBe(false);
    expect(run.state.status()).toBe('idle');

    button.click();
    fixture.detectChanges();
    expect(run.pending()).toBe(true);
    expect(run.pending()).toBe(directive.pending());
    expect(run.state.status()).toBe('pending');
    expect(run.busyVisible()).toBe(directive.busyVisible());

    host.resolveRun?.();
    await drainMicrotasks();
    fixture.detectChanges();
    expect(run.pending()).toBe(false);
    expect(run.state.status()).toBe('success');
    expect(run.state.lastUpdated()).toBeInstanceOf(Date);

    host.enabled.set(false);
    fixture.detectChanges();
    expect(run.enabled()).toBe(false);
  });

  it('carries the error through state', async () => {
    const { fixture, runState, button, host } = setup();

    button.click();
    fixture.detectChanges();
    host.rejectRun?.(new Error('boom'));
    await drainMicrotasks();
    fixture.detectChanges();

    expect(runState!.state.status()).toBe('error');
    expect((runState!.state.error() as Error).message).toBe('boom');
  });

  it('emits settled once per settle through the token', async () => {
    const { fixture, runState, button, host } = setup();
    const settles: CngxAsyncSettle[] = [];
    const sub = runState!.settled.subscribe((s) => settles.push(s));

    button.click();
    fixture.detectChanges();
    host.resolveRun?.();
    await drainMicrotasks();

    button.click();
    fixture.detectChanges();
    host.rejectRun?.('nope');
    await drainMicrotasks();

    expect(settles.map((s) => [s.generation, s.status])).toEqual([
      [1, 'success'],
      [2, 'error'],
    ]);
    sub.unsubscribe();
  });

  it('exposes announce on the token', () => {
    const { runState, directive } = setup();

    expect(runState!.announce).toBe(directive.announce);
  });
});
