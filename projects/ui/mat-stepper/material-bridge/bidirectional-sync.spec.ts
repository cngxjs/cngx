import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { describe, expect, test } from 'vitest';

import { CngxStepperPresenter } from '@cngx/common/stepper';

import { CngxMatStepper } from '../mat-stepper.directive';

@Component({
  standalone: true,
  imports: [MatStepperModule, CngxMatStepper],
  template: `
    <mat-stepper cngxMatStepper>
      <mat-step label="One"><p>One</p></mat-step>
      <mat-step label="Two"><p>Two</p></mat-step>
      <mat-step label="Three"><p>Three</p></mat-step>
    </mat-stepper>
  `,
})
class HostCmp {}

interface Plumbing {
  fixture: ReturnType<typeof TestBed.createComponent<HostCmp>>;
  matStepper: MatStepper;
  presenter: CngxStepperPresenter;
}

async function setupPlumbing(): Promise<Plumbing> {
  const fixture = TestBed.createComponent(HostCmp);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  await fixture.whenStable();
  const matEl = fixture.debugElement.query(
    (el) => el.componentInstance instanceof MatStepper,
  );
  const matStepper = matEl.componentInstance as MatStepper;
  const presenter = matEl.injector.get(CngxStepperPresenter);
  return { fixture, matStepper, presenter };
}

describe('createMatStepperBidirectionalSync (Phase 7.2 - shared glue helper)', () => {
  test('axis 1: presenter→Material - presenter.select(2) writes through to matStepper.selectedIndex', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const { fixture, matStepper, presenter } = await setupPlumbing();
    expect(matStepper.selectedIndex).toBe(0);

    presenter.select(2);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(matStepper.selectedIndex).toBe(2);
  });

  test('axis 2: Material→presenter - selectedIndexChange emission writes presenter.activeStepIndex', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const { fixture, matStepper, presenter } = await setupPlumbing();

    matStepper.selectedIndexChange.emit(1);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(presenter.activeStepIndex()).toBe(1);
  });

  test('axis 3: destroyRef cleanup - fixture.destroy() halts the presenter→Material sync', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const { fixture, matStepper, presenter } = await setupPlumbing();
    presenter.select(1);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(matStepper.selectedIndex).toBe(1);

    fixture.destroy();
    presenter.select(2);
    expect(matStepper.selectedIndex).toBe(1);
  });
});
