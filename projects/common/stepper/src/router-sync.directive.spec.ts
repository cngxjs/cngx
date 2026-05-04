import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

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

describe('CngxStepperRouterSync', () => {
  it('navigates with fragment when activeStepId changes', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    const router = TestBed.inject(Router);
    const presenter = fixture.debugElement.injector.get(CngxStepperPresenter);
    presenter.select(1);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(router.url).toMatch(/#step=cngx-step-/);
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
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    const router = TestBed.inject(Router);
    const presenter = fixture.debugElement.injector.get(CngxStepperPresenter);
    presenter.select(1);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(router.url).toMatch(/\?phase=cngx-step-/);
    expect(router.url).not.toMatch(/#step=/);
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
    await fixture.whenStable();
    const sync = fixture.debugElement.injector.get(CngxStepperRouterSync);
    const errors: unknown[] = [];
    sync.syncError.subscribe((err) => errors.push(err));

    const presenter = fixture.debugElement.injector.get(CngxStepperPresenter);
    presenter.select(1);
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    expect(errors).toEqual([failure]);
  });
});
