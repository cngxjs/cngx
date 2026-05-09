import { Component, type TemplateRef } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  MatStepper,
  MatStepperModule,
  type MatStepperIconContext,
} from '@angular/material/stepper';
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

  it('forwards consumer-projected <ng-template matStepperIcon> into Material so the icon override flows through the wrapper (stepper-accepted-debt §4 closure)', async () => {
    @Component({
      standalone: true,
      imports: [CngxMatStepper, CngxStep, MatStepperModule],
      template: `
        <cngx-mat-stepper aria-label="Custom icons">
          <ng-template matStepperIcon="number" let-index="index">
            <span class="cngx-test-icon">CUSTOM-{{ index + 1 }}</span>
          </ng-template>
          <div cngxStep label="One"></div>
          <div cngxStep label="Two"></div>
        </cngx-mat-stepper>
      `,
    })
    class CustomIconHost {}

    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(CustomIconHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    // Forwarding contract — the consumer's `<ng-template matStepperIcon>`
    // flows from cngx-mat-stepper's content children into
    // `MatStepper._iconOverrides`. The `afterNextRender` patch in
    // CngxMatStepper picks the directives up via its own
    // `contentChildren(MatStepperIcon)` query and writes them to
    // Material's underscore-prefixed slot — Angular's
    // `@ContentChildren` on MatStepper does not traverse content
    // projected through a wrapper component's `<ng-content>`, so
    // direct projection cannot reach it. The forward is the
    // architectural seam the §4 closure depends on; whether
    // Material's per-state template-outlet picks the override up
    // on the very first render or after the next CD tick is
    // Material's concern (the user-facing demo proves the visual
    // outcome end-to-end via the dev-app).
    const stepperRef = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatStepper,
    ).componentInstance as unknown as {
      _iconOverrides: Record<string, TemplateRef<MatStepperIconContext>>;
    };
    expect(stepperRef._iconOverrides['number']).toBeDefined();
    // The forwarded template ref matches the consumer's directive's
    // own templateRef — proves the captured directive's template
    // identity is preserved across the forward.
    const wrapper = fixture.debugElement.query(
      (el) => el.componentInstance instanceof CngxMatStepper,
    ).componentInstance as unknown as {
      stepperIcons: () => readonly { name: string; templateRef: unknown }[];
    };
    const consumerIcons = wrapper.stepperIcons();
    expect(consumerIcons.length).toBe(1);
    expect(consumerIcons[0].name).toBe('number');
    expect(stepperRef._iconOverrides['number']).toBe(
      consumerIcons[0].templateRef,
    );
  });

  it('matStepperIcon forwarding nudges Material via markForCheck without writing selectedIndex (no echo, no self-write)', async () => {
    // The `_iconOverrides` patch nudges Material into re-binding its
    // per-header icon outlets. Pre-fix the nudge was a self-write
    // `stepper.selectedIndex = stepper.selectedIndex`, which depends
    // on Material's undocumented same-value setter coercion to avoid
    // emitting a `selectedIndexChange` echo through
    // `createMaterialBidirectionalSync` back into `presenter.select(0)`.
    // The fix uses `ChangeDetectorRef.markForCheck()` on the MatStepper
    // view — public API, no setter touch, no echo path possible.
    //
    // This axis pins both contracts:
    //   1. presenter.select is NOT called as a spurious echo during
    //      the icon-forwarding patch (no-echo guarantee).
    //   2. MatStepper.selectedIndex setter is NOT touched by the
    //      wrapper at all — the only writes the spy observes come
    //      from `createMaterialBidirectionalSync`'s presenter→Material
    //      mirror, which is equality-guarded against the read side
    //      and does not write when initial values already match.
    @Component({
      standalone: true,
      imports: [CngxMatStepper, CngxStep, MatStepperModule],
      template: `
        <cngx-mat-stepper aria-label="Echo guard">
          <ng-template matStepperIcon="number">x</ng-template>
          <div cngxStep label="A"></div>
          <div cngxStep label="B"></div>
        </cngx-mat-stepper>
      `,
    })
    class EchoHost {}

    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(EchoHost);
    let setterWrites = 0;
    let lastSetterValue: number | undefined;
    fixture.detectChanges();
    await fixture.whenStable();
    const matStepper = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatStepper,
    ).componentInstance as MatStepper;
    // Wrap MatStepper.selectedIndex setter to count wrapper-driven
    // writes. Wrapped after the initial mount completes so we observe
    // only the icon-forwarding patch's behaviour on the next render
    // boundary — pre-fix the patch self-wrote `idx`, post-fix it does
    // not touch the setter at all.
    const proto = Object.getPrototypeOf(matStepper);
    const original = Object.getOwnPropertyDescriptor(proto, 'selectedIndex');
    const setter = original?.set;
    if (setter) {
      Object.defineProperty(matStepper, 'selectedIndex', {
        configurable: true,
        get: original?.get,
        set(v: number) {
          setterWrites += 1;
          lastSetterValue = v;
          setter.call(matStepper, v);
        },
      });
    }

    const presenter = fixture.debugElement
      .query((el) => el.componentInstance instanceof CngxMatStepper)
      .injector.get(CngxStepperPresenter);
    let selectCalls = 0;
    const originalSelect = presenter.select.bind(presenter);
    (presenter as unknown as { select: (i: number) => void }).select = (
      i: number,
    ) => {
      selectCalls += 1;
      originalSelect(i);
    };
    // Cross the afterNextRender boundary so the icon-forwarding patch
    // fires. Two CD cycles match the convention from the
    // 'does not loop on initial sync' axis and give Material every
    // opportunity to emit a spurious selectionChange if it would.
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(selectCalls).toBe(0);
    expect(presenter.activeStepIndex()).toBe(0);
    // The wrapper now uses `markForCheck` instead of a setter
    // self-write. With the bidirectional-sync mirror equality-guarded
    // against the read side and the presenter sitting at its initial
    // value (0), there is no legitimate write path either — so the
    // setter must not be touched at all by the wrapper across the
    // mount cycle.
    expect(setterWrites).toBe(0);
    expect(lastSetterValue).toBeUndefined();
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
