import { Component, Injector, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CngxLiveAnnouncer } from '@cngx/common/a11y';

import { mountLiveRegionAnnouncer } from './live-region';

// Non-generic vi.spyOn call so the spy type is inferred; the explicit
// vi.spyOn<T, K> generic form trips vitest's overload constraint here.
function makeLiveSpy(): ReturnType<typeof vi.fn> {
  return vi.spyOn(TestBed.inject(CngxLiveAnnouncer), 'announce').mockImplementation(() => {});
}

@Component({ selector: 'cngx-polite-host', template: '' })
class PoliteHost {
  readonly text = signal('');
  constructor() {
    mountLiveRegionAnnouncer({
      announcement: this.text,
      injector: inject(Injector),
    });
  }
}

@Component({ selector: 'cngx-assertive-host', template: '' })
class AssertiveHost {
  readonly text = signal('');
  constructor() {
    mountLiveRegionAnnouncer({
      announcement: this.text,
      injector: inject(Injector),
      politeness: 'assertive',
    });
  }
}

describe('mountLiveRegionAnnouncer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('forwards a non-empty announcement to the shared announcer as polite', () => {
    const live = makeLiveSpy();
    const fixture = TestBed.createComponent(PoliteHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    fixture.componentInstance.text.set('Tab 2 failed to load');
    TestBed.flushEffects();

    expect(live).toHaveBeenCalledExactlyOnceWith('Tab 2 failed to load', 'polite');
  });

  it('routes the assertive politeness argument through to the announcer', () => {
    const live = makeLiveSpy();
    const fixture = TestBed.createComponent(AssertiveHost);
    fixture.detectChanges();

    fixture.componentInstance.text.set('Critical failure');
    TestBed.flushEffects();

    expect(live).toHaveBeenCalledWith('Critical failure', 'assertive');
  });

  it('skips empty strings so a no-op tick never announces', () => {
    const live = makeLiveSpy();
    const fixture = TestBed.createComponent(PoliteHost);
    fixture.detectChanges();

    fixture.componentInstance.text.set('now speaking');
    TestBed.flushEffects();
    fixture.componentInstance.text.set('');
    TestBed.flushEffects();

    expect(live).toHaveBeenCalledTimes(1);
  });

  it('mounts no span of its own on document.body', () => {
    makeLiveSpy();
    const before = document.body.querySelectorAll('span').length;

    const fixture = TestBed.createComponent(PoliteHost);
    fixture.detectChanges();
    fixture.componentInstance.text.set('anything');
    TestBed.flushEffects();

    expect(document.body.querySelectorAll('span').length).toBe(before);
  });

  it('polite host writes into the shared polite live region', () => {
    vi.useFakeTimers();
    const live = TestBed.inject(CngxLiveAnnouncer);
    try {
      const fixture = TestBed.createComponent(PoliteHost);
      fixture.detectChanges();
      fixture.componentInstance.text.set('Tab loaded');
      TestBed.flushEffects();
      vi.advanceTimersByTime(20);
      expect(document.querySelector('span[aria-live="polite"]')?.textContent).toBe('Tab loaded');
    } finally {
      vi.useRealTimers();
      live.ngOnDestroy();
    }
  });

  it('assertive host writes into the shared assertive live region only', () => {
    vi.useFakeTimers();
    const live = TestBed.inject(CngxLiveAnnouncer);
    try {
      const fixture = TestBed.createComponent(AssertiveHost);
      fixture.detectChanges();
      fixture.componentInstance.text.set('Load failed');
      TestBed.flushEffects();
      vi.advanceTimersByTime(20);
      expect(document.querySelector('span[aria-live="assertive"]')?.textContent).toBe('Load failed');
      expect(document.querySelector('span[aria-live="polite"]')).toBeNull();
    } finally {
      vi.useRealTimers();
      live.ngOnDestroy();
    }
  });
});
