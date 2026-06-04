import {
  Component,
  signal,
  type Signal,
  type WritableSignal,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatTabsModule, MatTabGroup } from '@angular/material/tabs';
import { describe, expect, test } from 'vitest';

import { CngxTabGroupPresenter } from '@cngx/common/tabs';
import type {
  CngxErrorAggregatorContract,
  CngxErrorAggregatorSourceEntry,
} from '@cngx/common/interactive';

import { CngxMatTabs } from './mat-tabs.directive';
import { CngxMatTabError } from './mat-tab-error.directive';

// Minimal aggregator stub with a stable reference. Sources are not
// exercised — the directive only writes the contract reference into
// the handle slot; downstream consumers (Renderer2 badge effect, AT)
// read `shouldShow` / `announcement` directly off the slot.
function makeStubAggregator(
  showSignal: Signal<boolean> = signal(false),
): CngxErrorAggregatorContract {
  return {
    hasError: showSignal,
    errorCount: signal(0),
    activeErrors: signal([]),
    errorLabels: signal([]),
    shouldShow: showSignal,
    announcement: signal(''),
    addSource: (_entry: CngxErrorAggregatorSourceEntry) => undefined,
    removeSource: (_key: string) => undefined,
  };
}

@Component({
  standalone: true,
  imports: [MatTabsModule, CngxMatTabs, CngxMatTabError],
  template: `
    <mat-tab-group cngxMatTabs [(activeIndex)]="active">
      <mat-tab label="One" [cngxMatTabError]="aggA()">One content</mat-tab>
      <mat-tab label="Two">Two content</mat-tab>
    </mat-tab-group>
  `,
})
class PlainHostCmp {
  protected readonly aggA: WritableSignal<
    CngxErrorAggregatorContract | undefined
  > = signal(makeStubAggregator());
  protected active = 0;
}

@Component({
  standalone: true,
  imports: [MatTabsModule, CngxMatTabs, CngxMatTabError],
  template: `
    <mat-tab-group cngxMatTabs [(activeIndex)]="active">
      <mat-tab label="One" cngxMatTabError>One content</mat-tab>
      <mat-tab label="Two">Two content</mat-tab>
    </mat-tab-group>
  `,
})
class BareAttributeHostCmp {
  protected active = 0;
}

describe('CngxMatTabError attribute directive', () => {
  test('axis 1: bound contract writes through to presenter.tabs()[i].errorAggregator()', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(PlainHostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    const matEl = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatTabGroup,
    );
    const presenter = matEl.injector.get(CngxTabGroupPresenter);
    const boundAggregator = (
      fixture.componentInstance as unknown as {
        aggA: WritableSignal<CngxErrorAggregatorContract>;
      }
    ).aggA();

    // Directive on first mat-tab pumps the bound aggregator into the
    // matching handle slot; second tab has no directive and stays at
    // the per-handle default of `undefined`.
    expect(presenter.tabs()[0].errorAggregator()).toBe(boundAggregator);
    expect(presenter.tabs()[1].errorAggregator()).toBeUndefined();
  });

  test('axis 2: bare cngxMatTabError attribute coerces empty string to undefined and the slot stays clean', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(BareAttributeHostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    const matEl = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatTabGroup,
    );
    const presenter = matEl.injector.get(CngxTabGroupPresenter);

    // Bare attribute (`cngxMatTabError` without a value) binds the
    // empty string per Angular's attribute-binding semantics. The
    // input transform coerces strings to `undefined`, so the slot
    // never receives a non-contract value — `shouldShow()` is never
    // called on a `''` reference and the badge effect stays at its
    // default no-op state.
    expect(presenter.tabs()[0].errorAggregator()).toBeUndefined();
  });

  test('axis 3: setting the bound input to undefined clears the handle slot', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(PlainHostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    const matEl = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatTabGroup,
    );
    const presenter = matEl.injector.get(CngxTabGroupPresenter);
    const aggA = (
      fixture.componentInstance as unknown as {
        aggA: WritableSignal<CngxErrorAggregatorContract | undefined>;
      }
    ).aggA;

    expect(presenter.tabs()[0].errorAggregator()).toBeDefined();

    // Consumer's natural cleanup path — unbind the aggregator
    // (e.g. form is no longer relevant for this tab); the directive's
    // effect re-runs with `undefined` and resets the handle slot to
    // its per-handle default. Mirrors the destroyRef.onDestroy path
    // for the (rare) case of `*ngIf`-toggling the directive while
    // keeping the MatTab alive — both routes converge on the same
    // slot-undefined invariant.
    aggA.set(undefined);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(presenter.tabs()[0].errorAggregator()).toBeUndefined();
  });
});
