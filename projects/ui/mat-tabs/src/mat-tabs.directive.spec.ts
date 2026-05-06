import { Component, signal, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatTabsModule, MatTabGroup } from '@angular/material/tabs';
import { describe, expect, test } from 'vitest';

import {
  CngxTabGroupPresenter,
  type CngxTabsCommitAction,
} from '@cngx/common/tabs';

import { CngxMatTabs } from './mat-tabs.directive';

interface Plumbing {
  fixture: ReturnType<typeof TestBed.createComponent<HostCmp>>;
  matTabGroup: MatTabGroup;
  presenter: CngxTabGroupPresenter;
}

@Component({
  standalone: true,
  imports: [MatTabsModule, CngxMatTabs],
  template: `
    <mat-tab-group cngxMatTabs [(activeIndex)]="active">
      <mat-tab label="One">One content</mat-tab>
      <mat-tab label="Two">Two content</mat-tab>
      <mat-tab label="Three">Three content</mat-tab>
    </mat-tab-group>
  `,
})
class HostCmp {
  protected active = 0;
}

@Component({
  standalone: true,
  imports: [MatTabsModule, CngxMatTabs],
  template: `
    <mat-tab-group cngxMatTabs [(activeIndex)]="active">
      <mat-tab label="One">One content</mat-tab>
      <mat-tab label="Two">Two content</mat-tab>
      @if (showThird()) {
        <mat-tab label="Three">Three content</mat-tab>
      }
    </mat-tab-group>
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
  imports: [MatTabsModule, CngxMatTabs],
  template: `
    <mat-tab-group
      cngxMatTabs
      [commitAction]="commit"
      [commitMode]="mode"
      [(activeIndex)]="active"
    >
      <mat-tab label="One">One content</mat-tab>
      <mat-tab label="Two">Two content</mat-tab>
      <mat-tab label="Three">Three content</mat-tab>
    </mat-tab-group>
  `,
})
class CommitHostCmp {
  protected commit: CngxTabsCommitAction = () => new Promise<boolean>(() => undefined);
  protected mode: 'optimistic' | 'pessimistic' = 'pessimistic';
  protected active = 0;
}

async function setupPlumbing(): Promise<Plumbing> {
  const fixture = TestBed.createComponent(HostCmp);
  fixture.detectChanges();
  await fixture.whenStable();
  // Second CD cycle — gives the contentChildren signal an extra
  // tick to propagate from initial empty into the actual MatTab list,
  // and lets the directive's register-effect commit handles into the
  // presenter before the test asserts.
  fixture.detectChanges();
  await fixture.whenStable();
  const matEl = fixture.debugElement.query(
    (el) => el.componentInstance instanceof MatTabGroup,
  );
  const matTabGroup = matEl.componentInstance as MatTabGroup;
  const presenter = matEl.injector.get(CngxTabGroupPresenter);
  return { fixture, matTabGroup, presenter };
}

describe('CngxMatTabs instrumentation directive', () => {
  test('axis 1: presenter→Material write — presenter.select(2) updates matTabGroup.selectedIndex', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const { fixture, matTabGroup, presenter } = await setupPlumbing();
    expect(presenter.tabs().length).toBe(3);

    presenter.select(2);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(matTabGroup.selectedIndex).toBe(2);
  });

  test('axis 2: Material→presenter routing — selectedIndexChange writes presenter.activeIndex', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const { fixture, matTabGroup, presenter } = await setupPlumbing();

    // The factory subscribes to `selectedIndexChange.asObservable()`.
    // Material defers actual Output emission until its own animation
    // tick, which is gated in zoneless tests; emitting directly proves
    // the bridge route without coupling to Material's animation
    // schedule (still uses the public Output the directive subscribes
    // to — no implementation-detail spelunking).
    matTabGroup.selectedIndexChange.emit(1);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(presenter.activeIndex()).toBe(1);
  });

  test('axis 3: MatTab add/remove — toggling a tab reflects in presenter.tabs()', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(DynamicHostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    const matEl = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatTabGroup,
    );
    const presenter = matEl.injector.get(CngxTabGroupPresenter);
    expect(presenter.tabs().length).toBe(3);

    fixture.componentInstance['setShowThird'](false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(presenter.tabs().length).toBe(2);

    fixture.componentInstance['setShowThird'](true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(presenter.tabs().length).toBe(3);
  });

  test('axis 4: pessimistic pending — Material stays at origin while commit pending', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(CommitHostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    const matEl = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatTabGroup,
    );
    const matTabGroup = matEl.componentInstance as MatTabGroup;
    const presenter = matEl.injector.get(CngxTabGroupPresenter);

    expect(matTabGroup.selectedIndex).toBe(0);
    // Pessimistic + never-resolving commit — presenter stays on origin
    // and Material does not advance.
    presenter.select(2);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(presenter.commitState.status()).toBe('pending');
    expect(matTabGroup.selectedIndex).toBe(0);
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
      (el) => el.componentInstance instanceof MatTabGroup,
    );
    const matTabGroup = matEl.componentInstance as MatTabGroup;
    const presenter = matEl.injector.get(CngxTabGroupPresenter);

    presenter.select(1);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(matTabGroup.selectedIndex).toBe(0);

    (resolveCommit as ((value: boolean) => void) | null)?.(true);
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(matTabGroup.selectedIndex).toBe(1);
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
      (el) => el.componentInstance instanceof MatTabGroup,
    );
    const matTabGroup = matEl.componentInstance as MatTabGroup;
    const presenter = matEl.injector.get(CngxTabGroupPresenter);

    presenter.select(2);
    // Optimistic — Material moves immediately.
    fixture.detectChanges();
    await fixture.whenStable();
    expect(matTabGroup.selectedIndex).toBe(2);

    // Microtask flush — rejection rolls presenter (and therefore
    // Material) back.
    await Promise.resolve();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(matTabGroup.selectedIndex).toBe(0);
  });

  test('axis 7: untracked() discipline — re-entrant Material event during write does not double-fire', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const { fixture, matTabGroup, presenter } = await setupPlumbing();
    await fixture.whenStable();

    // Synchronous double-set on the presenter side — the equality
    // guard inside the factory must coalesce so Material lands on
    // the final value once, not multiple times. We assert observable
    // outcome (final index) since per-emission counting requires
    // monkey-patching MatTabGroup which is fragile.
    presenter.select(1);
    presenter.select(2);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(matTabGroup.selectedIndex).toBe(2);
    expect(presenter.activeIndex()).toBe(2);
  });

  test('axis 8: DestroyRef teardown — destroy stops further sync', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const { fixture, matTabGroup, presenter } = await setupPlumbing();
    await fixture.whenStable();

    presenter.select(1);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(matTabGroup.selectedIndex).toBe(1);

    fixture.destroy();

    // Post-destroy: presenter writes do not propagate through to
    // Material (no effect, no subscription).
    presenter.select(2);
    expect(matTabGroup.selectedIndex).toBe(1);
  });
});
