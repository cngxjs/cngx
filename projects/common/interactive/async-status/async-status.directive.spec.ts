import { Component, signal } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { buildAsyncStateView, type AsyncStatus, type CngxAsyncState } from '@cngx/core/utils';

import { CngxFailed, CngxPending, CngxSucceeded } from '../async-click/async-status-templates';
import { CngxAsyncStatus, reflectAsyncDisplayStatus } from './async-status.directive';

function buildMockState(initial: AsyncStatus = 'idle'): {
  state: CngxAsyncState<unknown>;
  status: ReturnType<typeof signal<AsyncStatus>>;
  error: ReturnType<typeof signal<unknown>>;
} {
  const status = signal<AsyncStatus>(initial);
  const error = signal<unknown>(undefined);
  const state = buildAsyncStateView<unknown>({
    status: status.asReadonly(),
    data: signal(undefined).asReadonly(),
    error: error.asReadonly(),
  });
  return { state, status, error };
}

@Component({
  standalone: true,
  imports: [CngxAsyncStatus, CngxPending, CngxSucceeded, CngxFailed],
  template: `
    <button
      [cngxAsyncStatus]="mockState"
      [disableWhilePending]="disableWhilePending"
      #ref="cngxAsyncStatus"
    >
      Go
      <ng-template cngxPending>Pending</ng-template>
      <ng-template cngxSucceeded>Done</ng-template>
      <ng-template cngxFailed>Failed</ng-template>
    </button>
  `,
})
class Host {
  readonly mock = buildMockState();
  readonly mockState = this.mock.state;
  disableWhilePending = false;
}

function setup(disable = false): {
  fixture: ReturnType<typeof TestBed.createComponent<Host>>;
  btn: HTMLButtonElement;
  dir: CngxAsyncStatus;
  host: Host;
} {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.disableWhilePending = disable;
  fixture.detectChanges();
  const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  const dir = fixture.debugElement.children[0].references['ref'] as CngxAsyncStatus;
  return { fixture, btn, dir, host: fixture.componentInstance };
}

describe('CngxAsyncStatus', () => {
  it('aria-busy flips with state.isBusy()', () => {
    const { fixture, btn, host } = setup();
    expect(btn.getAttribute('aria-busy')).toBeNull();
    host.mock.status.set('pending');
    fixture.detectChanges();
    expect(btn.getAttribute('aria-busy')).toBe('true');
    host.mock.status.set('success');
    fixture.detectChanges();
    expect(btn.getAttribute('aria-busy')).toBeNull();
  });

  it('treats loading and refreshing as busy for aria-busy', () => {
    const { fixture, btn, host } = setup();
    host.mock.status.set('loading');
    fixture.detectChanges();
    expect(btn.getAttribute('aria-busy')).toBe('true');
    host.mock.status.set('refreshing');
    fixture.detectChanges();
    expect(btn.getAttribute('aria-busy')).toBe('true');
  });

  it('disableWhilePending toggles [disabled] while busy', () => {
    const { fixture, btn, host } = setup(true);
    expect(btn.hasAttribute('disabled')).toBe(false);
    host.mock.status.set('pending');
    fixture.detectChanges();
    expect(btn.hasAttribute('disabled')).toBe(true);
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    host.mock.status.set('success');
    fixture.detectChanges();
    expect(btn.hasAttribute('disabled')).toBe(false);
  });

  it('does not set [disabled] while busy when disableWhilePending is false', () => {
    const { fixture, btn, host } = setup(false);
    host.mock.status.set('pending');
    fixture.detectChanges();
    expect(btn.hasAttribute('disabled')).toBe(false);
    expect(btn.getAttribute('aria-disabled')).toBeNull();
  });

  it('status() collapses the state into its display bucket', () => {
    const { fixture, dir, host } = setup();
    expect(dir.status()).toBe('idle');
    host.mock.status.set('loading');
    fixture.detectChanges();
    expect(dir.status()).toBe('pending');
    host.mock.status.set('error');
    fixture.detectChanges();
    expect(dir.status()).toBe('error');
  });

  it('activeTemplate() switches the projected marker on status()', () => {
    const { fixture, dir, host } = setup();
    expect(dir.activeTemplate()).toBeNull();
    host.mock.status.set('pending');
    fixture.detectChanges();
    expect(dir.activeTemplate()).not.toBeNull();
    const pendingRef = dir.activeTemplate();
    host.mock.status.set('error');
    fixture.detectChanges();
    expect(dir.activeTemplate()).not.toBeNull();
    expect(dir.activeTemplate()).not.toBe(pendingRef);
  });

  it('error() reflects the state error', () => {
    const { fixture, dir, host } = setup();
    expect(dir.error()).toBeUndefined();
    host.mock.error.set('boom');
    host.mock.status.set('error');
    fixture.detectChanges();
    expect(dir.error()).toBe('boom');
  });
});

describe('reflectAsyncDisplayStatus', () => {
  function stateOf(status: AsyncStatus): CngxAsyncState<unknown> {
    return buildMockState(status).state;
  }

  it('maps the busy variants to pending', () => {
    expect(reflectAsyncDisplayStatus(stateOf('pending'))).toBe('pending');
    expect(reflectAsyncDisplayStatus(stateOf('loading'))).toBe('pending');
    expect(reflectAsyncDisplayStatus(stateOf('refreshing'))).toBe('pending');
  });

  it('maps settled and empty states', () => {
    expect(reflectAsyncDisplayStatus(stateOf('success'))).toBe('success');
    expect(reflectAsyncDisplayStatus(stateOf('error'))).toBe('error');
    expect(reflectAsyncDisplayStatus(stateOf('idle'))).toBe('idle');
    expect(reflectAsyncDisplayStatus(null)).toBe('idle');
    expect(reflectAsyncDisplayStatus(undefined)).toBe('idle');
  });
});
