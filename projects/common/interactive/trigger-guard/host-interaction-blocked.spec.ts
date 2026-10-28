import { Component, Directive, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import { CNGX_HOST_INTERACTION_STATE } from '../async-click/host-interaction-state.token';

import {
  injectHostInteractionBlocked,
  type CngxHostInteractionBlocked,
} from './host-interaction-blocked';

const hostDisabled = signal(false);

@Directive({
  selector: '[probeState]',
  providers: [{ provide: CNGX_HOST_INTERACTION_STATE, useValue: { disabled: hostDisabled } }],
})
class ProbeState {}

@Directive({ selector: '[probe]', exportAs: 'probe' })
class Probe {
  readonly open = signal(false);
  closeCalls = 0;
  readonly guard: CngxHostInteractionBlocked = injectHostInteractionBlocked({
    isOpen: () => this.open(),
    close: () => {
      this.closeCalls++;
      this.open.set(false);
    },
  });
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

function probeOf(id: string): Probe {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return fixture.debugElement.query(By.css(`#${id}`)).injector.get(Probe);
}

describe('injectHostInteractionBlocked', () => {
  it('follows the co-hosted interaction state reactively', () => {
    hostDisabled.set(false);
    const { guard } = probeOf('stated');
    expect(guard.blocked()).toBe(false);
    expect(guard.isBlockedNow()).toBe(false);
    hostDisabled.set(true);
    expect(guard.blocked()).toBe(true);
    expect(guard.isBlockedNow()).toBe(true);
    hostDisabled.set(false);
  });

  it('is open on a plain host without interaction state', () => {
    const { guard } = probeOf('plain');
    expect(guard.blocked()).toBe(false);
    expect(guard.isBlockedNow()).toBe(false);
  });

  it('falls back to a native disabled host at event time', () => {
    const { guard } = probeOf('native');
    expect(guard.blocked()).toBe(false);
    expect(guard.isBlockedNow()).toBe(true);
  });

  it('falls back to aria-disabled="true" at event time', () => {
    const { guard } = probeOf('aria');
    expect(guard.blocked()).toBe(false);
    expect(guard.isBlockedNow()).toBe(true);
  });

  it('closes an open panel once when the host reports disabled', () => {
    hostDisabled.set(false);
    const probe = probeOf('stated');
    probe.open.set(true);
    TestBed.flushEffects();
    expect(probe.closeCalls).toBe(0);

    hostDisabled.set(true);
    TestBed.flushEffects();
    expect(probe.open()).toBe(false);
    expect(probe.closeCalls).toBe(1);

    hostDisabled.set(true);
    TestBed.flushEffects();
    expect(probe.closeCalls).toBe(1);
    hostDisabled.set(false);
  });

  it('leaves a closed panel alone when the host reports disabled', () => {
    hostDisabled.set(false);
    const probe = probeOf('stated');
    hostDisabled.set(true);
    TestBed.flushEffects();
    expect(probe.closeCalls).toBe(0);
    hostDisabled.set(false);
  });
});
