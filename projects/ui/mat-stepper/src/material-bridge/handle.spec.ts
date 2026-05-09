import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatStepperModule, MatStep, MatStepper } from '@angular/material/stepper';
import { describe, expect, test } from 'vitest';

import { createMatStepHandle } from './handle';

let idCounter = 0;
function seedId(): string {
  idCounter += 1;
  return `cngx-mat-step-spec-${idCounter}`;
}

@Component({
  standalone: true,
  imports: [MatStepperModule],
  template: `
    <mat-stepper>
      <mat-step label="Plain"><p>P</p></mat-step>
      <mat-step aria-label="Aria fallback"><p>A</p></mat-step>
      <mat-step>
        <ng-template matStepLabel>Template Static Label</ng-template>
        <p>T</p>
      </mat-step>
      <mat-step><p>U</p></mat-step>
    </mat-stepper>
  `,
})
class LabelHostCmp {}

@Component({
  standalone: true,
  imports: [MatStepperModule],
  template: `
    <mat-stepper>
      <mat-step label="Single"><p>S</p></mat-step>
    </mat-stepper>
  `,
})
class SingleStepHostCmp {}

async function renderLabels(): Promise<MatStep[]> {
  const fixture = TestBed.createComponent(LabelHostCmp);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  await fixture.whenStable();
  const matStepperEl = fixture.debugElement.query(
    (el) => el.componentInstance instanceof MatStepper,
  );
  const matStepper = matStepperEl.componentInstance as MatStepper;
  return matStepper.steps.toArray();
}

describe('createMatStepHandle — Phase 6.2 label fallback ladder', () => {
  test('axis L1: MatStep.label string wins (tier 1)', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const matSteps = await renderLabels();
    const setup = createMatStepHandle(matSteps[0], seedId);
    expect(setup.handle.label()).toBe('Plain');
  });

  test('axis L2: aria-label fills the slot when label input is unset (tier 2)', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const matSteps = await renderLabels();
    // matSteps[1] declares only `aria-label="Aria fallback"`, no string label.
    const setup = createMatStepHandle(matSteps[1], seedId);
    expect(setup.handle.label()).toBe('Aria fallback');
  });

  test('axis L3: matStepLabel template static text resolves via detached embedded view (tier 3)', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const matSteps = await renderLabels();
    // matSteps[2] declares only `<ng-template matStepLabel>Template Static Label</ng-template>`;
    // no string label, no aria-label. The fallback walks the detached
    // embedded view and snapshots its textContent.
    const setup = createMatStepHandle(matSteps[2], seedId);
    expect(setup.handle.label()).toBe('Template Static Label');
  });

  test('axis L4: deterministic Step <id> fallback when no label / aria / template is set (tier 4)', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const matSteps = await renderLabels();
    const handle = createMatStepHandle(matSteps[3], seedId).handle;
    expect(handle.label()).toBe(`Step ${handle.id}`);
    expect(handle.label().length).toBeGreaterThan('Step '.length);
  });

  test('axis L5: paired hasError + completed write — `_completedOverride` re-fire surfaces the error', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(SingleStepHostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    const matStepperEl = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatStepper,
    );
    const matStepper = matStepperEl.componentInstance as MatStepper;
    const [matStep] = matStepper.steps.toArray();
    const handle = createMatStepHandle(matStep, seedId).handle;
    expect(handle.state()).toBe('idle');
    // Drive Material's typical error-state-matcher write pattern:
    // `hasError = true; completed = true` — the second line writes
    // through `_completedOverride.set(true)`, which the cngx `state`
    // computed tracks via `MatStep.completed`'s getter and re-fires.
    // Stepper-accepted-debt §4 tracks the documented limitation that
    // a `hasError` flip ALONE (without the paired completion write)
    // does not re-trigger the computed — `hasError` is a plain CdkStep
    // setter, not a Signal.
    matStep.hasError = true;
    matStep.completed = true;
    expect(handle.state()).toBe('error');
  });
});
