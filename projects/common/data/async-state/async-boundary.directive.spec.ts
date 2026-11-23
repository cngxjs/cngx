import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';
import { CNGX_STATEFUL } from '@cngx/core/utils';

import { createManualState } from './create-manual-state';
import { CngxAsyncBoundary, type AggregateSource } from './async-boundary.directive';

@Component({
  selector: 'test-boundary-host',
  template: `<div [cngxAsyncBoundary]="sources()"></div>`,
  imports: [CngxAsyncBoundary],
})
class BoundaryHost {
  readonly user = createManualState<string>();
  readonly perms = createManualState<string>();
  readonly flags = createManualState<string>();

  readonly sources = signal<readonly AggregateSource[]>([
    { key: 'user', label: 'User', state: this.user },
    { key: 'perms', label: 'Permissions', state: this.perms },
    { key: 'flags', label: 'Feature flags', state: this.flags },
  ]);
}

function setup() {
  TestBed.configureTestingModule({ imports: [BoundaryHost] });
  const fixture = TestBed.createComponent(BoundaryHost);
  fixture.detectChanges();
  const debugEl = fixture.debugElement.query(By.directive(CngxAsyncBoundary));
  const directive = debugEl.injector.get(CngxAsyncBoundary);
  return { fixture, host: fixture.componentInstance, debugEl, directive };
}

describe('CngxAsyncBoundary', () => {
  it('exposes an aggregate whose status follows the combined rule', () => {
    const { fixture, host, directive } = setup();

    host.user.set('loading');
    TestBed.flushEffects();
    expect(directive.state.status()).toBe('loading');

    host.user.setSuccess('u');
    host.perms.setSuccess('p');
    host.flags.setSuccess('f');
    TestBed.flushEffects();
    expect(directive.state.status()).toBe('success');
    expect(directive.state.data()).toEqual(['u', 'p', 'f']);

    fixture.destroy();
  });

  it('is discoverable through CNGX_STATEFUL from the host element injector', () => {
    const { debugEl, directive } = setup();
    expect(debugEl.injector.get(CNGX_STATEFUL)).toBe(directive);
  });

  it('lists only errored sources with key/label/error in input order', () => {
    const { host, directive } = setup();

    host.user.setSuccess('u');
    host.perms.setError('perms-down');
    host.flags.setError('flags-down');
    TestBed.flushEffects();

    expect(directive.failures()).toEqual([
      { key: 'perms', label: 'Permissions', error: 'perms-down' },
      { key: 'flags', label: 'Feature flags', error: 'flags-down' },
    ]);
  });

  it('keeps failures reference-stable while an unrelated source mutates', () => {
    const { host, directive } = setup();

    host.perms.setError('perms-down');
    TestBed.flushEffects();
    const first = directive.failures();

    host.user.setSuccess('u');
    TestBed.flushEffects();
    expect(directive.failures()).toBe(first);
  });

  it('follows a changed label of an errored source', () => {
    const { fixture, host, directive } = setup();

    host.perms.setError('perms-down');
    TestBed.flushEffects();
    expect(directive.failures()[0].label).toBe('Permissions');

    host.sources.set([
      { key: 'user', label: 'User', state: host.user },
      { key: 'perms', label: 'Access rights', state: host.perms },
      { key: 'flags', label: 'Feature flags', state: host.flags },
    ]);
    fixture.detectChanges();

    expect(directive.failures()[0].label).toBe('Access rights');
  });

  it('reflects aggregate busy through host aria-busy', () => {
    const { fixture, host, debugEl } = setup();

    host.perms.set('loading');
    fixture.detectChanges();
    expect(debugEl.nativeElement.getAttribute('aria-busy')).toBe('true');

    host.user.setSuccess('u');
    host.perms.setSuccess('p');
    host.flags.setSuccess('f');
    fixture.detectChanges();
    expect(debugEl.nativeElement.getAttribute('aria-busy')).toBeNull();
  });

  it('follows a swapped source list and keeps the state object identity', () => {
    const { fixture, host, directive, debugEl } = setup();
    const state = directive.state;
    host.user.setSuccess('u');
    host.perms.setSuccess('p');
    host.flags.setSuccess('f');
    fixture.detectChanges();
    expect(directive.state.status()).toBe('success');
    expect(debugEl.nativeElement.getAttribute('aria-busy')).toBeNull();

    const orders = createManualState<string>();
    const stock = createManualState<string>();
    orders.set('loading');
    stock.setError('stock-down');
    host.sources.set([
      { key: 'orders', label: 'Orders', state: orders },
      { key: 'stock', label: 'Stock', state: stock },
    ]);
    fixture.detectChanges();

    expect(directive.state).toBe(state);
    expect(directive.state.status()).toBe('error');
    expect(directive.failures()).toEqual([{ key: 'stock', label: 'Stock', error: 'stock-down' }]);

    stock.setSuccess('s');
    fixture.detectChanges();
    expect(directive.state.status()).toBe('loading');
    expect(directive.failures()).toEqual([]);
    expect(debugEl.nativeElement.getAttribute('aria-busy')).toBe('true');

    orders.setSuccess('o');
    fixture.detectChanges();
    expect(directive.state.status()).toBe('success');
    expect(debugEl.nativeElement.getAttribute('aria-busy')).toBeNull();
  });

  it('does not throw when a source mutates after the host is destroyed while busy', () => {
    const { fixture, host } = setup();
    host.perms.set('loading');
    fixture.detectChanges();

    fixture.destroy();

    expect(() => {
      host.perms.setSuccess('p');
      host.user.setError('late');
      TestBed.flushEffects();
    }).not.toThrow();
  });
});
