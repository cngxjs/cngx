import { Component, ElementRef, inject, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createScopedLiveRegion } from './scoped-live-region';

const CLEAR_DELAY_MS = 16;

@Component({
  selector: 'cngx-scoped-region-host',
  template: '',
})
class RegionHost {
  readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly region = createScopedLiveRegion(this.host);
}

describe('createScopedLiveRegion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  function setup() {
    const fixture = TestBed.createComponent(RegionHost);
    const { host, region } = fixture.componentInstance;
    const inHost = (politeness: string) =>
      host.querySelector<HTMLElement>(`span[aria-live="${politeness}"]`);
    return { fixture, host, region, inHost };
  }

  it('creates no node before the first announce or ensure()', () => {
    const { host } = setup();
    expect(host.children).toHaveLength(0);
  });

  it('places one region per politeness inside the host', () => {
    const { region, inHost } = setup();
    region.ensure();
    expect(inHost('polite')).not.toBeNull();
    expect(inHost('assertive')).not.toBeNull();
    expect(document.body.querySelector(':scope > span[aria-live]')).toBeNull();
  });

  it('speaks polite by default and keeps assertive in its own region', () => {
    const { region, inHost } = setup();
    region.announce('3 results');
    region.announce('Save failed', 'assertive');
    vi.advanceTimersByTime(CLEAR_DELAY_MS);
    expect(inHost('polite')?.textContent).toBe('3 results');
    expect(inHost('assertive')?.textContent).toBe('Save failed');
  });

  it('takePending() hands back an unwritten message and cancels its write', () => {
    const { region, inHost } = setup();
    region.announce('Picked Apple');
    expect(region.takePending()).toEqual([{ message: 'Picked Apple', politeness: 'polite' }]);
    vi.advanceTimersByTime(CLEAR_DELAY_MS);
    expect(inHost('polite')?.textContent).toBe('');
  });

  it('removes the regions and cancels pending timers on destroy', () => {
    const { fixture, host, region } = setup();
    region.announce('Late');
    fixture.destroy();
    vi.advanceTimersByTime(CLEAR_DELAY_MS);
    expect(host.querySelector('span[aria-live]')).toBeNull();
  });

  it('is a no-op on the server', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    const { host, region } = setup();
    region.ensure();
    region.announce('nope', 'assertive');
    expect(host.querySelector('span[aria-live]')).toBeNull();
    expect(region.takePending()).toEqual([]);
  });
});
