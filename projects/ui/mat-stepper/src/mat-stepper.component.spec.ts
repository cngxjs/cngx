import { Component } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatStepper } from '@angular/material/stepper';
import { describe, expect, it } from 'vitest';

import {
  CngxStep,
  CngxStepperPresenter,
  type CngxStepperCommitAction,
} from '@cngx/common/stepper';

import { CngxMatStepper } from './mat-stepper.component';

@Component({
  standalone: true,
  imports: [CngxMatStepper, CngxStep],
  template: `
    <cngx-mat-stepper aria-label="Wizard">
      <div cngxStep label="One"></div>
      <div cngxStep label="Two"></div>
      <div cngxStep label="Three"></div>
    </cngx-mat-stepper>
  `,
})
class HostCmp {}

@Component({
  standalone: true,
  imports: [CngxMatStepper, CngxStep],
  template: `
    <cngx-mat-stepper [linear]="true" aria-label="Linear">
      <div cngxStep label="A"></div>
      <div cngxStep label="B"></div>
    </cngx-mat-stepper>
  `,
})
class LinearHost {}

@Component({
  standalone: true,
  imports: [CngxMatStepper, CngxStep],
  template: `
    <cngx-mat-stepper [commitAction]="commit" commitMode="pessimistic" aria-label="Async">
      <div cngxStep label="One"></div>
      <div cngxStep label="Two"></div>
    </cngx-mat-stepper>
  `,
})
class AsyncHost {
  protected commit: CngxStepperCommitAction = () => new Promise(() => undefined);
}

describe('CngxMatStepper organism', () => {
  it('renders <mat-stepper> with one <mat-step> per cngxStep child', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    const stepper = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatStepper,
    );
    expect(stepper).toBeTruthy();
    const matSteps = (stepper.componentInstance as MatStepper).steps;
    expect(matSteps.length).toBe(3);
  });

  it('presenter -> Material: writing presenter.activeStepIndex updates MatStepper.selectedIndex', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    const matStepper = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatStepper,
    ).componentInstance as MatStepper;
    const presenter = fixture.debugElement
      .query((el) => el.componentInstance instanceof CngxMatStepper)
      .injector.get(CngxStepperPresenter);

    presenter.select(2);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(matStepper.selectedIndex).toBe(2);
  });

  it('Material -> presenter: MatStepper.selectionChange writes presenter.activeStepIndex', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    const matStepper = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatStepper,
    ).componentInstance as MatStepper;
    const presenter = fixture.debugElement
      .query((el) => el.componentInstance instanceof CngxMatStepper)
      .injector.get(CngxStepperPresenter);

    matStepper.selectedIndex = 1;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(presenter.activeStepIndex()).toBe(1);
  });

  it('does not loop on initial sync', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    let writeCount = 0;
    const matStepperRef = () =>
      fixture.debugElement.query((el) => el.componentInstance instanceof MatStepper)
        .componentInstance as MatStepper;
    fixture.detectChanges();
    await fixture.whenStable();
    const stepper = matStepperRef();
    const original = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(stepper),
      'selectedIndex',
    );
    const setter = original?.set;
    if (setter) {
      Object.defineProperty(stepper, 'selectedIndex', {
        configurable: true,
        get: original?.get,
        set(v: number) {
          writeCount += 1;
          setter.call(stepper, v);
        },
      });
    }
    // Idle for two ticks; if a loop existed, writeCount would diverge.
    await fixture.whenStable();
    await fixture.whenStable();
    expect(writeCount).toBeLessThan(3);
  });

  it('forwards [linear] to <mat-stepper>', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(LinearHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const matStepper = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatStepper,
    ).componentInstance as MatStepper;
    expect(matStepper.linear).toBe(true);
  });

  it('pessimistic commitAction holds Material on origin step until resolution', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(AsyncHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const matStepper = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatStepper,
    ).componentInstance as MatStepper;
    const presenter = fixture.debugElement
      .query((el) => el.componentInstance instanceof CngxMatStepper)
      .injector.get(CngxStepperPresenter);
    presenter.select(1);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(matStepper.selectedIndex).toBe(0);
    expect(presenter.activeStepIndex()).toBe(0);
  });
});
