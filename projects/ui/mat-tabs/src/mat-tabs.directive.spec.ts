import { Component, signal, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatTab, MatTabsModule, MatTabGroup } from '@angular/material/tabs';
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
      <mat-tab label="Same">First content</mat-tab>
      <mat-tab label="Same">Second content</mat-tab>
      <mat-tab label="Same">Third content</mat-tab>
    </mat-tab-group>
  `,
})
class DuplicateLabelHostCmp {
  protected active = 0;
}

@Component({
  standalone: true,
  imports: [MatTabsModule, CngxMatTabs],
  template: `
    <mat-tab-group cngxMatTabs [(activeIndex)]="active">
      <mat-tab label="One" [disabled]="firstDisabled()">One content</mat-tab>
      <mat-tab label="Two">Two content</mat-tab>
    </mat-tab-group>
  `,
})
class ReactiveDisabledHostCmp {
  protected readonly firstDisabled = signal<boolean>(false);
  protected active = 0;

  setFirstDisabled(next: boolean): void {
    this.firstDisabled.set(next);
  }
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

  test('axis 9: duplicate-label MatTabs get distinct handle ids — no presenter-registry collision', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(DuplicateLabelHostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    const matEl = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatTabGroup,
    );
    const presenter = matEl.injector.get(CngxTabGroupPresenter);
    const ids = presenter.tabs().map((h) => h.id);
    expect(ids.length).toBe(3);
    // Set semantics confirms uniqueness.
    expect(new Set(ids).size).toBe(3);
  });

  test('axis 9b: Material API contract pin — MatTab._stateChanges Subject exists at runtime', () => {
    // Load-bearing coupling check. The directive subscribes to
    // `MatTab._stateChanges` (Material-internal underscore field) to
    // pump live `label`/`disabled` projections; if Material renames
    // or removes this field on upgrade, axis 10 fails silently with
    // stale snapshots. This spec fails LOUD at the upgrade boundary
    // so the JSDoc-acknowledged coupling note in
    // `handle.ts:39-42` has a regression gate.
    const proto = MatTab.prototype as unknown as {
      _stateChanges?: unknown;
    };
    // Constructed instances expose it (it's an instance field
    // initialised in MatTab's constructor body). We can't construct
    // MatTab without DI plumbing, so verify via a TestBed render
    // that the field is present on a real instance.
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HostCmp);
    fixture.detectChanges();
    const matEl = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatTabGroup,
    );
    const matTabGroup = matEl.componentInstance as MatTabGroup;
    const firstTab = matTabGroup._allTabs.first;
    expect(firstTab._stateChanges).toBeDefined();
    expect(typeof firstTab._stateChanges.subscribe).toBe('function');
    // Belt-and-suspenders: prototype-level absence is also accepted
    // (instance-only fields are valid Material patterns), but at
    // least one of the two paths must surface the field.
    expect(
      proto._stateChanges !== undefined || firstTab._stateChanges !== undefined,
    ).toBe(true);
  });

  test('axis 10: live MatTab.disabled — toggling Material input propagates to presenter handle', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(ReactiveDisabledHostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    const matEl = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatTabGroup,
    );
    const presenter = matEl.injector.get(CngxTabGroupPresenter);
    expect(presenter.tabs().length).toBe(2);
    expect(presenter.tabs()[0].disabled()).toBe(false);

    fixture.componentInstance['setFirstDisabled'](true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(presenter.tabs()[0].disabled()).toBe(true);

    fixture.componentInstance['setFirstDisabled'](false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(presenter.tabs()[0].disabled()).toBe(false);
  });

  test('axis 11: rejection decoration set — reject decorates the matching <mat-tab> with cngx-mat-tab--error + aria-invalid="true"', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(CommitHostCmp);
    fixture.componentInstance['mode'] = 'optimistic';
    fixture.componentInstance['commit'] = (() => false) as CngxTabsCommitAction;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    const matEl = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatTabGroup,
    );
    const presenter = matEl.injector.get(CngxTabGroupPresenter);
    presenter.select(2);
    fixture.detectChanges();
    await fixture.whenStable();
    const matTabEls = fixture.nativeElement.querySelectorAll(
      '.mat-mdc-tab',
    ) as NodeListOf<HTMLElement>;
    expect(matTabEls.length).toBe(3);
    expect(matTabEls[2].classList.contains('cngx-mat-tab--error')).toBe(true);
    expect(matTabEls[2].getAttribute('aria-invalid')).toBe('true');
    // Untouched tabs stay clean.
    expect(matTabEls[0].classList.contains('cngx-mat-tab--error')).toBe(false);
    expect(matTabEls[0].getAttribute('aria-invalid')).toBeNull();
    expect(matTabEls[1].classList.contains('cngx-mat-tab--error')).toBe(false);
  });

  test('axis 12: rejection decoration cleared — successful re-pick of the failed tab strips both the class and the attribute', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(CommitHostCmp);
    fixture.componentInstance['mode'] = 'optimistic';
    let next = false;
    fixture.componentInstance['commit'] = (() => next) as CngxTabsCommitAction;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    const matEl = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatTabGroup,
    );
    const presenter = matEl.injector.get(CngxTabGroupPresenter);
    presenter.select(2);
    fixture.detectChanges();
    await fixture.whenStable();
    const matTabEls = fixture.nativeElement.querySelectorAll(
      '.mat-mdc-tab',
    ) as NodeListOf<HTMLElement>;
    expect(matTabEls[2].classList.contains('cngx-mat-tab--error')).toBe(true);
    expect(matTabEls[2].getAttribute('aria-invalid')).toBe('true');

    next = true;
    presenter.select(2);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(matTabEls[2].classList.contains('cngx-mat-tab--error')).toBe(false);
    expect(matTabEls[2].getAttribute('aria-invalid')).toBeNull();
  });

  test('axis 13: rejection decoration follows index shift — decorated element moves when lastFailedIndex changes', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(CommitHostCmp);
    fixture.componentInstance['mode'] = 'optimistic';
    fixture.componentInstance['commit'] = (() => false) as CngxTabsCommitAction;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    const matEl = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatTabGroup,
    );
    const presenter = matEl.injector.get(CngxTabGroupPresenter);
    presenter.select(2);
    fixture.detectChanges();
    await fixture.whenStable();
    const matTabEls = fixture.nativeElement.querySelectorAll(
      '.mat-mdc-tab',
    ) as NodeListOf<HTMLElement>;
    expect(matTabEls[2].classList.contains('cngx-mat-tab--error')).toBe(true);

    // Reject a different target — decoration should move.
    presenter.select(1);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(matTabEls[1].classList.contains('cngx-mat-tab--error')).toBe(true);
    expect(matTabEls[1].getAttribute('aria-invalid')).toBe('true');
    // Prior target is clean — only one decorated element at a time.
    expect(matTabEls[2].classList.contains('cngx-mat-tab--error')).toBe(false);
    expect(matTabEls[2].getAttribute('aria-invalid')).toBeNull();
  });
});
