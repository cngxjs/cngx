import { Component, Directive, EventEmitter, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CNGX_ASYNC_RUN_STATE, type CngxAsyncRunState } from '@cngx/common/interactive';
import { buildAsyncStateView, type AsyncStatus } from '@cngx/core/utils';
import { describe, expect, it } from 'vitest';

import { CngxButton } from './button.component';

// A runner that is not CngxAsyncClick: it only provides the run-state token.
@Directive({
  selector: '[fakeRunner]',
  exportAs: 'fakeRunner',
  providers: [{ provide: CNGX_ASYNC_RUN_STATE, useExisting: FakeRunner }],
})
class FakeRunner implements CngxAsyncRunState {
  readonly pendingState = signal(false);
  readonly busyVisibleState = signal(false);
  readonly enabledState = signal(true);
  readonly pending = this.pendingState.asReadonly();
  readonly busyVisible = this.busyVisibleState.asReadonly();
  readonly enabled = this.enabledState.asReadonly();
  readonly state = buildAsyncStateView<unknown>({
    status: signal<AsyncStatus>('idle'),
    data: signal(undefined),
    error: signal(undefined),
    lastUpdated: signal(undefined),
  });
  readonly settled = new EventEmitter<never>();
  announce(): void {
    // not under test
  }
}

@Component({
  template: `<button id="run" cngxButton fakeRunner>Run</button>
    <button id="plain" cngxButton>Plain</button>`,
  imports: [CngxButton, FakeRunner],
})
class Host {}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  TestBed.flushEffects();
  const runDe = fixture.debugElement.query(By.css('#run'));
  const runner = runDe.injector.get(FakeRunner);
  const button = runDe.nativeElement as HTMLButtonElement;
  const plain = fixture.debugElement.query(By.css('#plain')).nativeElement as HTMLButtonElement;
  const flush = () => {
    fixture.detectChanges();
    TestBed.flushEffects();
  };
  return { fixture, runner, button, plain, flush };
}

describe('CngxButton run-state seam', () => {
  it('a provider-only runner drives data-pending and aria-disabled', () => {
    const { runner, button, flush } = setup();
    expect(button.getAttribute('data-pending')).toBeNull();
    expect(button.getAttribute('aria-disabled')).toBeNull();

    runner.pendingState.set(true);
    flush();
    expect(button.getAttribute('data-pending')).toBe('true');
    expect(button.getAttribute('aria-disabled')).toBe('true');

    runner.pendingState.set(false);
    flush();
    expect(button.getAttribute('data-pending')).toBeNull();
    expect(button.getAttribute('aria-disabled')).toBeNull();
  });

  it('a provider-only runner drives data-busy and the busy layer', () => {
    const { runner, button, flush } = setup();
    expect(button.getAttribute('data-busy')).toBeNull();
    expect(button.querySelector('.cngx-button__busy')).toBeNull();

    runner.busyVisibleState.set(true);
    flush();
    expect(button.getAttribute('data-busy')).toBe('true');
    expect(button.querySelector('.cngx-button__busy')).not.toBeNull();
  });

  it('folds the runner enabled flag into aria-disabled', () => {
    const { runner, button, flush } = setup();

    runner.enabledState.set(false);
    flush();
    expect(button.getAttribute('aria-disabled')).toBe('true');
  });

  it('a button without a runner stays idle', () => {
    const { plain } = setup();

    expect(plain.getAttribute('data-pending')).toBeNull();
    expect(plain.getAttribute('data-busy')).toBeNull();
    expect(plain.getAttribute('aria-disabled')).toBeNull();
  });
});
