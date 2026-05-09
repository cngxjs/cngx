import { Component, signal, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { describe, expect, test } from 'vitest';

import {
  CngxStepperPresenter,
  type CngxStepperCommitAction,
} from '@cngx/common/stepper';

import { CngxMatStepperBridge } from './mat-stepper.directive';
import {
  CNGX_MAT_STEP_HANDLE_FACTORY,
  createMatStepHandle,
  type CngxMatStepHandleFactory,
} from './material-bridge/handle';

interface Plumbing {
  fixture: ReturnType<typeof TestBed.createComponent<HostCmp>>;
  matStepper: MatStepper;
  presenter: CngxStepperPresenter;
}

@Component({
  standalone: true,
  imports: [MatStepperModule, CngxMatStepperBridge],
  template: `
    <mat-stepper cngxMatStepper [(activeStepIndex)]="active">
      <mat-step label="One"><p>One content</p></mat-step>
      <mat-step label="Two"><p>Two content</p></mat-step>
      <mat-step label="Three"><p>Three content</p></mat-step>
    </mat-stepper>
  `,
})
class HostCmp {
  protected active = 0;
}

@Component({
  standalone: true,
  imports: [MatStepperModule, CngxMatStepperBridge],
  template: `
    <mat-stepper cngxMatStepper [(activeStepIndex)]="active">
      <mat-step label="Same"><p>First</p></mat-step>
      <mat-step label="Same"><p>Second</p></mat-step>
      <mat-step label="Same"><p>Third</p></mat-step>
    </mat-stepper>
  `,
})
class DuplicateLabelHostCmp {
  protected active = 0;
}

@Component({
  standalone: true,
  imports: [MatStepperModule, CngxMatStepperBridge],
  template: `
    <mat-stepper cngxMatStepper [(activeStepIndex)]="active">
      <mat-step label="One"><p>One</p></mat-step>
      <mat-step label="Two"><p>Two</p></mat-step>
      @if (showThird()) {
        <mat-step label="Three"><p>Three</p></mat-step>
      }
    </mat-stepper>
  `,
})
class DynamicHostCmp {
  protected readonly showThird = signal<boolean>(true);
  protected active = 0;

  setShowThird(next: boolean): void {
    this.showThird.set(next);
  }
}

@Component({
  standalone: true,
  imports: [MatStepperModule, CngxMatStepperBridge],
  template: `
    <mat-stepper
      cngxMatStepper
      [commitAction]="commit"
      [commitMode]="mode"
      [(activeStepIndex)]="active"
    >
      <mat-step label="One"><p>One</p></mat-step>
      <mat-step label="Two"><p>Two</p></mat-step>
      <mat-step label="Three"><p>Three</p></mat-step>
    </mat-stepper>
  `,
})
class CommitHostCmp {
  protected commit: CngxStepperCommitAction = () =>
    new Promise<boolean>(() => undefined);
  protected mode: 'optimistic' | 'pessimistic' = 'pessimistic';
  protected active = 0;
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

describe('CngxMatStepper instrumentation directive', () => {
  test('axis 1: presenter→Material write — presenter.select(2) updates matStepper.selectedIndex', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const { fixture, matStepper, presenter } = await setupPlumbing();
    expect(presenter.flatSteps().length).toBe(3);

    presenter.select(2);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(matStepper.selectedIndex).toBe(2);
  });

  test('axis 2: Material→presenter routing — selectedIndexChange writes presenter.activeStepIndex', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const { fixture, matStepper, presenter } = await setupPlumbing();

    matStepper.selectedIndexChange.emit(1);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(presenter.activeStepIndex()).toBe(1);
  });

  test('axis 3: MatStep add/remove — toggling a step reflects in presenter.flatSteps()', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(DynamicHostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    const matEl = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatStepper,
    );
    const presenter = matEl.injector.get(CngxStepperPresenter);
    expect(presenter.flatSteps().length).toBe(3);

    fixture.componentInstance['setShowThird'](false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(presenter.flatSteps().length).toBe(2);

    fixture.componentInstance['setShowThird'](true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(presenter.flatSteps().length).toBe(3);
  });

  test('axis 4: pessimistic pending — Material stays at origin while commit pending', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(CommitHostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    const matEl = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatStepper,
    );
    const matStepper = matEl.componentInstance as MatStepper;
    const presenter = matEl.injector.get(CngxStepperPresenter);

    expect(matStepper.selectedIndex).toBe(0);
    presenter.select(2);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(presenter.commitState.status()).toBe('pending');
    expect(matStepper.selectedIndex).toBe(0);
  });

  test('axis 5: pessimistic resolve — Material flips to target after commit success', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(CommitHostCmp);
    let resolveCommit: ((value: boolean) => void) | null = null;
    fixture.componentInstance['commit'] = () =>
      new Promise<boolean>((res) => {
        resolveCommit = res;
      });
    fixture.detectChanges();
    await fixture.whenStable();
    const matEl = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatStepper,
    );
    const matStepper = matEl.componentInstance as MatStepper;
    const presenter = matEl.injector.get(CngxStepperPresenter);

    presenter.select(1);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(matStepper.selectedIndex).toBe(0);

    (resolveCommit as ((value: boolean) => void) | null)?.(true);
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(matStepper.selectedIndex).toBe(1);
  });

  test('axis 6: optimistic rollback — sync rejection reverts Material', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(CommitHostCmp);
    fixture.componentInstance['mode'] = 'optimistic';
    fixture.componentInstance['commit'] = () =>
      Promise.reject<boolean>(new Error('boom'));
    fixture.detectChanges();
    await fixture.whenStable();
    const matEl = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatStepper,
    );
    const matStepper = matEl.componentInstance as MatStepper;
    const presenter = matEl.injector.get(CngxStepperPresenter);

    presenter.select(2);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(matStepper.selectedIndex).toBe(2);

    // Drain the rejection-rollback cycle deterministically. The
    // commitAction returned `Promise.reject(...)` — the rejection
    // settles on the next microtask, the rollback effect fires
    // synchronously off that, and the bidirectional-sync effect
    // writes back to Material. Earlier versions of this test used
    // `await fixture.whenStable()` here but that path is CI-flaky
    // in zoneless mode (whenStable can hang when no Angular task
    // is pending). The pattern below mirrors the cngx-native
    // stepper's "does not loop on initial sync" test (commit
    // 91ea5a9): yield once for the rejection, flush effects, yield
    // once more, flush again — the rollback + write are guaranteed
    // to have landed by the second flush.
    await Promise.resolve();
    TestBed.flushEffects();
    await Promise.resolve();
    fixture.detectChanges();
    TestBed.flushEffects();
    await Promise.resolve();
    expect(matStepper.selectedIndex).toBe(0);
  });

  test('axis 7: untracked() discipline — coalesce synchronous double-set on final value', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const { fixture, matStepper, presenter } = await setupPlumbing();

    presenter.select(1);
    presenter.select(2);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(matStepper.selectedIndex).toBe(2);
    expect(presenter.activeStepIndex()).toBe(2);
  });

  test('axis 8: DestroyRef teardown — destroy stops further sync', async () => {
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

  test('axis 9: duplicate-label MatSteps get distinct handle ids', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(DuplicateLabelHostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    const matEl = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatStepper,
    );
    const presenter = matEl.injector.get(CngxStepperPresenter);
    const ids = presenter.flatSteps().map((n) => n.id);
    expect(ids.length).toBe(3);
    expect(new Set(ids).size).toBe(3);
  });

  test('axis 11: CNGX_MAT_STEP_HANDLE_FACTORY swap — viewProviders override is honoured', async () => {
    const calls: string[] = [];
    const wrappedFactory: CngxMatStepHandleFactory = (step, idSeed) => {
      const setup = createMatStepHandle(step, idSeed);
      calls.push(setup.handle.id);
      return setup;
    };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: CNGX_MAT_STEP_HANDLE_FACTORY, useValue: wrappedFactory },
      ],
    });
    const { presenter } = await setupPlumbing();
    expect(presenter.flatSteps().length).toBe(3);
    expect(calls.length).toBe(3);
    expect(new Set(calls).size).toBe(3);
  });

  test('axis 12: CNGX_MAT_STEP_HANDLE_FACTORY default — token resolves to createMatStepHandle without override', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const resolved = TestBed.inject(CNGX_MAT_STEP_HANDLE_FACTORY);
    expect(resolved).toBe(createMatStepHandle);
  });

  test('axis 10: live MatStep.completed — toggling Material completion flips presenter state to "success"', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const { fixture, matStepper, presenter } = await setupPlumbing();
    expect(presenter.flatSteps().length).toBe(3);
    expect(presenter.flatSteps()[0].state()).toBe('idle');

    const firstStep = matStepper.steps.first;
    firstStep.completed = true;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(presenter.flatSteps()[0].state()).toBe('success');

    firstStep.hasError = true;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(presenter.flatSteps()[0].state()).toBe('error');
  });
});
