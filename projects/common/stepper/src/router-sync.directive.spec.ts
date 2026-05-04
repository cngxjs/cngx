import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { CngxStepperPresenter } from './presenter.directive';
import { CngxStep } from './step.directive';
import { CngxStepperRouterSync } from './router-sync.directive';

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
});
