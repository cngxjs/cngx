import { Component } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatStepper } from '@angular/material/stepper';
import { describe, expect, it } from 'vitest';

import {
  type CngxStepNode,
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
    // Drain effects + microtasks twice deterministically. Earlier
    // versions of this test used `await fixture.whenStable()` here,
    // but that path proved CI-flaky in zoneless mode — `whenStable`
    // can occasionally hang when no Angular task is pending and the
    // resolver awaits an idle signal that never arrives. The pattern
    // below is the cngx-testing convention (per `feedback_test_command`
    // + `feedback_afternextrender_in_zoneless_tests`): synchronously
    // flush effects, then yield once to drain microtasks. Two cycles
    // — if a loop existed, writeCount would diverge well past 3.
    TestBed.flushEffects();
    await Promise.resolve();
    TestBed.flushEffects();
    await Promise.resolve();
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

  it('stepsOnly memoises via flatStepsEqual — shape-stable re-emits preserve the signal reference', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    const matStepper = fixture.debugElement.query(
      (el) => el.componentInstance instanceof CngxMatStepper,
    ).componentInstance as unknown as {
      stepsOnly: () => readonly CngxStepNode[];
    };
    const v1 = matStepper.stepsOnly();
    expect(v1.length).toBe(3);

    // Force another CD cycle + drain effects without changing the
    // registered children. The computed re-runs lazily on read;
    // `flatStepsEqual` must keep the returned array identity stable
    // so downstream consumers (label/content templates, panel @for)
    // don't cascade-rebind. Sibling-symmetric with CngxStepper at
    // projects/ui/stepper/src/stepper.component.ts:210-213.
    fixture.detectChanges();
    TestBed.flushEffects();
    await fixture.whenStable();
    const v2 = matStepper.stepsOnly();
    expect(v2).toBe(v1);
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
