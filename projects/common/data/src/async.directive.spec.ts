import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import type { ManualAsyncState } from './async-state/create-manual-state';
import { createManualState } from './async-state/create-manual-state';
import { CngxAsync } from './async.directive';

@Component({
  template: `
    <div
      *cngxAsync="state; let data; skeleton: skelTpl; empty: emptyTpl; error: errTpl"
    >
      {{ data }}
    </div>

    <ng-template #skelTpl>
      <span class="skeleton">Loading...</span>
    </ng-template>

    <ng-template #emptyTpl>
      <span class="empty">No data.</span>
    </ng-template>

    <ng-template #errTpl let-err>
      <span class="error">{{ err }}</span>
    </ng-template>
  `,
  imports: [CngxAsync],
})
class Host {
  state: ManualAsyncState<string> = createManualState<string>();
}

function createFixture(): { host: Host; el: HTMLElement } {
  TestBed.configureTestingModule({ imports: [Host] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return { host: fixture.componentInstance, el: fixture.nativeElement };
}

describe('CngxAsync', () => {
  let host: Host;
  let el: HTMLElement;

  beforeEach(() => {
    const ctx = createFixture();
    host = ctx.host;
    el = ctx.el;
  });

  it('shows nothing in idle', () => {
    expect(el.querySelector('.skeleton')).toBeNull();
    expect(el.querySelector('.empty')).toBeNull();
    expect(el.querySelector('.error')).toBeNull();
    expect(el.textContent!.trim()).toBe('');
  });

  it('shows skeleton template during first load', () => {
    host.state.set('loading');
    TestBed.flushEffects();

    expect(el.querySelector('.skeleton')).not.toBeNull();
    expect(el.querySelector('.skeleton')!.textContent).toContain('Loading...');
  });

  it('shows content with data on success', () => {
    host.state.setSuccess('hello world');
    TestBed.flushEffects();

    expect(el.querySelector('.skeleton')).toBeNull();
    expect(el.textContent).toContain('hello world');
  });

  it('shows empty template when empty', () => {
    // null data is considered empty by createManualState
    host.state.setSuccess(undefined as unknown as string);
    TestBed.flushEffects();

    expect(el.querySelector('.empty')).not.toBeNull();
    expect(el.querySelector('.empty')!.textContent).toContain('No data.');
  });

  it('shows error template on first-load error', () => {
    host.state.setError('Something broke');
    TestBed.flushEffects();

    expect(el.querySelector('.error')).not.toBeNull();
    expect(el.querySelector('.error')!.textContent).toContain('Something broke');
  });

  it('keeps content visible during refresh (not skeleton)', () => {
    host.state.setSuccess('initial data');
    TestBed.flushEffects();
    expect(el.textContent).toContain('initial data');

    // After success, refreshing should keep content visible
    host.state.set('refreshing');
    TestBed.flushEffects();

    expect(el.querySelector('.skeleton')).toBeNull();
    expect(el.textContent).toContain('initial data');
  });

  it('updates content context when data changes on success', () => {
    host.state.setSuccess('first');
    TestBed.flushEffects();
    expect(el.textContent).toContain('first');

    host.state.setSuccess('second');
    TestBed.flushEffects();
    expect(el.textContent).toContain('second');
  });

  it('shows content+error as content (error after data exists)', () => {
    host.state.setSuccess('existing data');
    TestBed.flushEffects();

    host.state.setError('late error');
    TestBed.flushEffects();

    // content+error resolves to content in structural directive
    expect(el.querySelector('.error')).toBeNull();
    expect(el.textContent).toContain('existing data');
  });
});
