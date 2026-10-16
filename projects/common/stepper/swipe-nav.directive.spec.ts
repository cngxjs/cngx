import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxStepperPresenter } from './presenter.directive';
import { CngxStepperSwipeNav } from './swipe-nav.directive';

@Component({
  template: `<div cngxStepperSwipeNav></div>`,
  imports: [CngxStepperSwipeNav],
})
class OrphanHost {}

@Component({
  template: `<div cngxStepper><div cngxStepperSwipeNav></div></div>`,
  imports: [CngxStepperPresenter, CngxStepperSwipeNav],
})
class InsideStepperHost {}

describe('CngxStepperSwipeNav placement (CNGX1055)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it('throws CNGX1055 without a stepper presenter', () => {
    expect(() => TestBed.createComponent(OrphanHost).detectChanges()).toThrow(
      expect.objectContaining({
        name: 'CngxRuntimeError',
        code: 'CNGX1055',
        message: expect.stringMatching(
          /^CNGX1055: \[cngxStepperSwipeNav\] must be placed on or inside an element with \[cngxStepper\], such as <cngx-stepper>\./,
        ),
      }),
    );
  });

  it('resolves a stepper presenter above it', () => {
    const fixture = TestBed.createComponent(InsideStepperHost);
    expect(() => fixture.detectChanges()).not.toThrow();
  });
});
