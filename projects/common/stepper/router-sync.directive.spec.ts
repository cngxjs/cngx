import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxStepperPresenter } from './presenter.directive';
import { CngxStep } from './step.directive';
import { CngxStepperRouterSync } from './router-sync.directive';
import {
  provideStepperConfig,
  withStepperRouterSync,
} from './stepper-config';

@Component({
  standalone: true,
  selector: 'host-cmp',
  imports: [CngxStep],
  hostDirectives: [CngxStepperPresenter, CngxStepperRouterSync],
  template: `
    <div cngxStep label="A"></div>
    <div cngxStep label="B"></div>
  `,
})
class HostCmp {}

// Drains pending microtasks so the directive's effect() chain (which
// reads activeStepId, then calls router.navigate inside untracked()) has
// a chance to fire and the spy captures the call. Avoids
// `fixture.whenStable()` because it has been observed to hang under
// Node 20 + zoneless tests with a Router in providers.
async function flushMicrotasks(rounds = 5): Promise<void> {
  for (let i = 0; i < rounds; i++) {
    await Promise.resolve();
  }
}

describe('CngxStepperRouterSync', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('calls router.navigate with a fragment when activeStepId changes', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    const navigateSpy = vi
      .spyOn(router, 'navigate')
      .mockResolvedValue(true);

    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    await flushMicrotasks();
    const presenter = fixture.debugElement.injector.get(CngxStepperPresenter);
    presenter.select(1);
    fixture.detectChanges();
    await flushMicrotasks();

    const calls = navigateSpy.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const lastCall = calls[calls.length - 1];
    const extras = lastCall[1] as { fragment?: string; queryParams?: Record<string, string> };
    expect(extras.fragment).toMatch(/^step=cngx-step-/);
  });

  it('is a graceful no-op when Router is not provided', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    expect(() => {
      const fixture = TestBed.createComponent(HostCmp);
      fixture.detectChanges();
    }).not.toThrow();
  });

  it('falls back to provideStepperConfig defaults when Inputs unbound', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideStepperConfig(withStepperRouterSync('queryParam', 'phase')),
      ],
    });
    const router = TestBed.inject(Router);
    const navigateSpy = vi
      .spyOn(router, 'navigate')
      .mockResolvedValue(true);

    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    await flushMicrotasks();
    const presenter = fixture.debugElement.injector.get(CngxStepperPresenter);
    presenter.select(1);
    fixture.detectChanges();
    await flushMicrotasks();

    const calls = navigateSpy.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const lastCall = calls[calls.length - 1];
    const extras = lastCall[1] as { fragment?: string; queryParams?: Record<string, string> };
    expect(extras.queryParams).toEqual({ phase: expect.stringMatching(/^cngx-step-/) });
    expect(extras.fragment).toBeUndefined();
  });

  it('emits (syncError) when router.navigate rejects', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    const failure = new Error('navigation refused');
    vi.spyOn(router, 'navigate').mockReturnValue(Promise.reject(failure));

    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    await flushMicrotasks();
    const sync = fixture.debugElement.injector.get(CngxStepperRouterSync);
    const errors: unknown[] = [];
    sync.syncError.subscribe((err) => errors.push(err));

    const presenter = fixture.debugElement.injector.get(CngxStepperPresenter);
    presenter.select(1);
    fixture.detectChanges();
    await flushMicrotasks();
    expect(errors).toEqual([failure]);
  });
});
