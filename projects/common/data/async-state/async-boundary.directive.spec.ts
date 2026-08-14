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
});
