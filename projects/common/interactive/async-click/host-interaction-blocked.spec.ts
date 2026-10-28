import { Component, Directive, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import {
  injectHostInteractionBlocked,
  type CngxHostInteractionBlocked,
} from './host-interaction-blocked';
import { CNGX_HOST_INTERACTION_STATE } from './host-interaction-state.token';

const hostDisabled = signal(false);

@Directive({
  selector: '[probeState]',
  providers: [{ provide: CNGX_HOST_INTERACTION_STATE, useValue: { disabled: hostDisabled } }],
})
class ProbeState {}

@Directive({ selector: '[probe]', exportAs: 'probe' })
class Probe {
  readonly guard: CngxHostInteractionBlocked = injectHostInteractionBlocked();
}

@Component({
  template: `
    <button id="stated" probe probeState>A</button>
    <button id="plain" probe>B</button>
    <button id="native" probe disabled>C</button>
    <button id="aria" probe aria-disabled="true">D</button>
  `,
  imports: [Probe, ProbeState],
})
class Host {}

function guardOf(id: string): CngxHostInteractionBlocked {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture.debugElement.query(By.css(`#${id}`)).injector.get(Probe).guard;
}

describe('injectHostInteractionBlocked', () => {
  it('follows the co-hosted interaction state reactively', () => {
    hostDisabled.set(false);
    const guard = guardOf('stated');
    expect(guard.blocked()).toBe(false);
    expect(guard.isBlockedNow()).toBe(false);
    hostDisabled.set(true);
    expect(guard.blocked()).toBe(true);
    expect(guard.isBlockedNow()).toBe(true);
    hostDisabled.set(false);
  });

  it('is open on a plain host without interaction state', () => {
    const guard = guardOf('plain');
    expect(guard.blocked()).toBe(false);
    expect(guard.isBlockedNow()).toBe(false);
  });

  it('falls back to a native disabled host at event time', () => {
    const guard = guardOf('native');
    expect(guard.blocked()).toBe(false);
    expect(guard.isBlockedNow()).toBe(true);
  });

  it('falls back to aria-disabled="true" at event time', () => {
    const guard = guardOf('aria');
    expect(guard.blocked()).toBe(false);
    expect(guard.isBlockedNow()).toBe(true);
  });
});
