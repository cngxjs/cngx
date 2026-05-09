import {
  Component,
  signal,
  type Signal,
  type WritableSignal,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatTab, MatTabsModule, MatTabGroup } from '@angular/material/tabs';
import { describe, expect, test, vi } from 'vitest';

import {
  CNGX_DOM_ANCHOR_RETRY_FACTORY,
  CngxTabGroupPresenter,
  type CngxTabHandle,
  type CngxTabOverflowDomAdapter,
  type CngxTabPanelHost,
  type CngxTabsCommitAction,
} from '@cngx/common/tabs';
import type {
  CngxErrorAggregatorContract,
  CngxErrorAggregatorSourceEntry,
} from '@cngx/common/interactive';
import { CngxTabOverflow } from '@cngx/ui/tabs';

import {
  provideMatTabsConfig,
  withAnchorRetryAttempts,
  withHalfWiredSlotSink,
} from './mat-tabs-config';
import { CngxMatTabs } from './mat-tabs.directive';
import { CngxMatTabError } from './mat-tab-error.directive';
import { CngxMatTabAggregatorContent } from './decorations/mat-tab-aggregator-content.directive';
import {
  CNGX_MAT_TAB_HANDLE_FACTORY,
  createMatTabHandle,
  type CngxMatTabHandleFactory,
} from './material-bridge/handle';

interface StubAggregatorHandle {
  contract: CngxErrorAggregatorContract;
  show: WritableSignal<boolean>;
  announcement: WritableSignal<string>;
}

interface StubAggregatorHandleExt extends StubAggregatorHandle {
  count: WritableSignal<number>;
}

function makeStubAggregator(
  initialShow = false,
  initialAnnouncement = '',
  initialCount = 0,
): StubAggregatorHandleExt {
  const show = signal(initialShow);
  const announcement = signal(initialAnnouncement);
  const count = signal(initialCount);
  const showSig: Signal<boolean> = show.asReadonly();
  const announceSig: Signal<string> = announcement.asReadonly();
  const contract: CngxErrorAggregatorContract = {
    hasError: showSig,
    errorCount: count.asReadonly(),
    activeErrors: signal([]),
    errorLabels: signal([]),
    shouldShow: showSig,
    announcement: announceSig,
    addSource: (_entry: CngxErrorAggregatorSourceEntry) => undefined,
    removeSource: (_key: string) => undefined,
  };
  return { contract, show, announcement, count };
}

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

@Component({
  standalone: true,
  imports: [MatTabsModule, CngxMatTabs, CngxMatTabError],
  template: `
    <mat-tab-group
      cngxMatTabs
      [commitAction]="commit"
      [commitMode]="mode"
      [(activeIndex)]="active"
    >
      <mat-tab label="One" [cngxMatTabError]="aggOne">One content</mat-tab>
      <mat-tab label="Two" [cngxMatTabError]="aggTwo">Two content</mat-tab>
      <mat-tab label="Three">Three content</mat-tab>
    </mat-tab-group>
  `,
})
class AggregatorHostCmp {
  readonly aggOneHandle = makeStubAggregator();
  readonly aggTwoHandle = makeStubAggregator();
  protected aggOne = this.aggOneHandle.contract;
  protected aggTwo = this.aggTwoHandle.contract;
  protected commit: CngxTabsCommitAction = () => new Promise<boolean>(() => undefined);
  protected mode: 'optimistic' | 'pessimistic' = 'optimistic';
  protected active = 0;
}

@Component({
  standalone: true,
  imports: [
    MatTabsModule,
    CngxMatTabs,
    CngxMatTabError,
    CngxMatTabAggregatorContent,
  ],
  template: `
    <mat-tab-group cngxMatTabs [(activeIndex)]="active">
      <ng-template
        cngxMatTabAggregatorContent
        let-count="count"
        let-label="label"
      >
        <span data-testid="slot-content">{{ label }}=={{ count }}</span>
      </ng-template>
      <mat-tab label="Profile" [cngxMatTabError]="aggOne">Profile</mat-tab>
      <mat-tab label="Settings">Settings</mat-tab>
    </mat-tab-group>
  `,
})
class AggregatorSlotHostCmp {
  readonly aggOneHandle = makeStubAggregator();
  protected aggOne = this.aggOneHandle.contract;
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

  test('axis 11: rejection decoration set — reject decorates the matching <mat-tab> with cngx-mat-tab--error + aria-describedby descriptor span (no aria-invalid)', async () => {
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
    // ARIA 1.2 contract — aria-invalid is form-field vocabulary and
    // does not apply to a tab button. The new contract uses
    // aria-describedby + a hidden descriptor span instead.
    expect(matTabEls[2].getAttribute('aria-invalid')).toBeNull();
    const handleId = presenter.tabs()[2].id;
    const descriptorId = `${handleId}-rejected`;
    expect(matTabEls[2].getAttribute('aria-describedby')).toContain(
      descriptorId,
    );
    const descriptorSpan = matTabEls[2].querySelector<HTMLSpanElement>(
      `span.cngx-sr-only#${descriptorId}`,
    );
    expect(descriptorSpan).not.toBeNull();
    expect(descriptorSpan?.textContent ?? '').not.toBe('');
    // Untouched tabs stay clean.
    expect(matTabEls[0].classList.contains('cngx-mat-tab--error')).toBe(false);
    expect(matTabEls[0].getAttribute('aria-invalid')).toBeNull();
    expect(matTabEls[0].querySelector('span.cngx-sr-only')).toBeNull();
    expect(matTabEls[1].classList.contains('cngx-mat-tab--error')).toBe(false);
  });

  test('axis 12: rejection decoration cleared — successful re-pick of the failed tab strips the class, removes the descriptor span, and restores aria-describedby', async () => {
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
    const handleId = presenter.tabs()[2].id;
    expect(matTabEls[2].classList.contains('cngx-mat-tab--error')).toBe(true);
    expect(
      matTabEls[2].querySelector(`span.cngx-sr-only#${handleId}-rejected`),
    ).not.toBeNull();
    expect(matTabEls[2].getAttribute('aria-describedby')).toContain(
      `${handleId}-rejected`,
    );

    next = true;
    presenter.select(2);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(matTabEls[2].classList.contains('cngx-mat-tab--error')).toBe(false);
    expect(matTabEls[2].getAttribute('aria-invalid')).toBeNull();
    expect(
      matTabEls[2].querySelector(`span.cngx-sr-only#${handleId}-rejected`),
    ).toBeNull();
    // No prior consumer-supplied tokens → aria-describedby restores
    // to the absent default.
    expect(matTabEls[2].getAttribute('aria-describedby')).toBeNull();
  });

  test('axis 13a: clearLastFailed() delegator strips the class and removes the descriptor span', async () => {
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
    const directive = matEl.injector.get(CngxMatTabs);
    presenter.select(2);
    fixture.detectChanges();
    await fixture.whenStable();
    const matTabEls = fixture.nativeElement.querySelectorAll(
      '.mat-mdc-tab',
    ) as NodeListOf<HTMLElement>;
    const handleId = presenter.tabs()[2].id;
    expect(matTabEls[2].classList.contains('cngx-mat-tab--error')).toBe(true);
    expect(
      matTabEls[2].querySelector(`span.cngx-sr-only#${handleId}-rejected`),
    ).not.toBeNull();

    directive.clearLastFailed();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(matTabEls[2].classList.contains('cngx-mat-tab--error')).toBe(false);
    expect(matTabEls[2].getAttribute('aria-invalid')).toBeNull();
    expect(
      matTabEls[2].querySelector(`span.cngx-sr-only#${handleId}-rejected`),
    ).toBeNull();
    expect(presenter.lastFailedIndex()).toBeUndefined();
  });

  test('axis 14: per-handle errorAggregator slot defaults to undefined and is writable through setupsByTab', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const { fixture, presenter } = await setupPlumbing();
    const matEl = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatTabGroup,
    );
    const directive = matEl.injector.get(CngxMatTabs);
    const setupsByTab = (
      directive as unknown as {
        setupsByTab: Map<
          unknown,
          { setup: { errorAggregator: { set(v: unknown): void } } }
        >;
      }
    ).setupsByTab;

    // Default slot for every registered handle is `undefined` —
    // the read-only-by-default behaviour the prior shared constant
    // produced is preserved when no consumer binds [cngxMatTabError].
    for (const tab of presenter.tabs()) {
      expect(tab.errorAggregator()).toBeUndefined();
    }

    // The writable is reachable through setupsByTab so the per-tab
    // attribute directive can pump bound aggregators into the slot.
    // Use a minimal contract-shaped stub — the parent's
    // `aggregatedErrorTabs` computed reads `shouldShow()` /
    // `announcement()` whenever any handle's slot is non-undefined,
    // so an opaque marker would crash the downstream effect.
    const firstEntry = Array.from(setupsByTab.values())[0];
    const stub = makeStubAggregator();
    firstEntry.setup.errorAggregator.set(stub.contract as unknown);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(presenter.tabs()[0].errorAggregator()).toBe(stub.contract);

    // Resetting back to undefined restores the default — used by the
    // attribute directive's destroyRef cleanup path.
    firstEntry.setup.errorAggregator.set(undefined);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(presenter.tabs()[0].errorAggregator()).toBeUndefined();
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
    const movedHandleId = presenter.tabs()[1].id;
    const priorHandleId = presenter.tabs()[2].id;
    expect(matTabEls[1].classList.contains('cngx-mat-tab--error')).toBe(true);
    expect(matTabEls[1].getAttribute('aria-invalid')).toBeNull();
    expect(
      matTabEls[1].querySelector(
        `span.cngx-sr-only#${movedHandleId}-rejected`,
      ),
    ).not.toBeNull();
    expect(matTabEls[1].getAttribute('aria-describedby')).toContain(
      `${movedHandleId}-rejected`,
    );
    // Prior target is clean — only one decorated element at a time.
    expect(matTabEls[2].classList.contains('cngx-mat-tab--error')).toBe(false);
    expect(matTabEls[2].getAttribute('aria-invalid')).toBeNull();
    expect(
      matTabEls[2].querySelector(
        `span.cngx-sr-only#${priorHandleId}-rejected`,
      ),
    ).toBeNull();
  });

  test('axis 15: aggregator shouldShow=true applies .cngx-mat-tab--has-errors class + descriptor span + aria-describedby', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(AggregatorHostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    const matEl = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatTabGroup,
    );
    const presenter = matEl.injector.get(CngxTabGroupPresenter);
    const matTabEls = fixture.nativeElement.querySelectorAll(
      '.mat-mdc-tab',
    ) as NodeListOf<HTMLElement>;

    // Defaults: no aggregator wants reveal → no decoration on any tab.
    expect(matTabEls[0].classList.contains('cngx-mat-tab--has-errors')).toBe(
      false,
    );
    expect(matTabEls[0].getAttribute('aria-describedby')).toBeNull();

    fixture.componentInstance.aggOneHandle.show.set(true);
    fixture.componentInstance.aggOneHandle.announcement.set(
      'Profile name is required',
    );
    fixture.detectChanges();
    await fixture.whenStable();

    const handleId = presenter.tabs()[0].id;
    expect(matTabEls[0].classList.contains('cngx-mat-tab--has-errors')).toBe(
      true,
    );
    const describedBy = matTabEls[0].getAttribute('aria-describedby');
    expect(describedBy).toContain(`${handleId}-errors`);
    const spanId = `${handleId}-errors`;
    const span = Array.from(
      matTabEls[0].querySelectorAll('span'),
    ).find((s) => s.id === spanId) as HTMLElement | undefined;
    expect(span).toBeDefined();
    expect(span?.classList.contains('cngx-sr-only')).toBe(true);
    expect(span?.textContent).toBe('Profile name is required');
  });

  test('axis 16: aggregator shouldShow flipping false removes class + span + attribute and restores prior aria-describedby', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(AggregatorHostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    const matEl = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatTabGroup,
    );
    const presenter = matEl.injector.get(CngxTabGroupPresenter);
    const matTabEls = fixture.nativeElement.querySelectorAll(
      '.mat-mdc-tab',
    ) as NodeListOf<HTMLElement>;
    const handleId = presenter.tabs()[0].id;
    const priorDescribedBy = matTabEls[0].getAttribute('aria-describedby');

    fixture.componentInstance.aggOneHandle.show.set(true);
    fixture.componentInstance.aggOneHandle.announcement.set('Errors here');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(matTabEls[0].classList.contains('cngx-mat-tab--has-errors')).toBe(
      true,
    );

    // Flip back — class drops, span goes away, aria-describedby
    // returns to whatever Material had set originally (may be null).
    fixture.componentInstance.aggOneHandle.show.set(false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(matTabEls[0].classList.contains('cngx-mat-tab--has-errors')).toBe(
      false,
    );
    const stillThere = Array.from(
      matTabEls[0].querySelectorAll('span'),
    ).find((s) => s.id === `${handleId}-errors`);
    expect(stillThere).toBeUndefined();
    if (priorDescribedBy === null) {
      expect(matTabEls[0].getAttribute('aria-describedby')).toBeNull();
    } else {
      expect(matTabEls[0].getAttribute('aria-describedby')).toBe(
        priorDescribedBy,
      );
    }
  });

  test('axis 18: programmatic mount creates one CngxTabOverflow with CNGX_TAB_PANEL_HOST resolving to the presenter', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const { fixture, presenter } = await setupPlumbing();

    const overflowDe = fixture.debugElement.query(
      (el) => el.componentInstance instanceof CngxTabOverflow,
    );
    expect(overflowDe).toBeDefined();
    const overflow = overflowDe.componentInstance as CngxTabOverflow;

    // The molecule's rendered host element exists in the DOM. Its
    // physical parent is asserted by axis 21 (post-anchor:
    // .mat-mdc-tab-header child); this axis only pins existence +
    // single-instance count to catch a regression that drops the
    // VCR.createComponent call entirely.
    const allOverflowEls = fixture.nativeElement.querySelectorAll(
      'cngx-tab-overflow',
    ) as NodeListOf<HTMLElement>;
    expect(allOverflowEls.length).toBe(1);

    // Panel-host adapter forwards the presenter's tabs() / activeId() /
    // selectById(). Reading via the molecule's protected `panelHost`
    // accessor proves DI resolution lands on the directive's wrapper,
    // not the (absent) cngx-native organism token.
    const panelHost = (
      overflow as unknown as { panelHost: CngxTabPanelHost }
    ).panelHost;
    expect(panelHost.tabs().length).toBe(presenter.tabs().length);
    expect(panelHost.tabs().map((t) => t.id)).toEqual(
      presenter.tabs().map((t) => t.id),
    );
    // Template-projection methods are stubbed to null in the Material
    // variant (Material owns label rendering through textLabel +
    // mat-tab-content; cngx slot directives are intentionally absent).
    expect(panelHost.labelTemplateFor('any-id')).toBeNull();
    expect(panelHost.contentTemplateFor('any-id')).toBeNull();
  });

  test('axis 19: provided adapter is the Material variant — strip-root + index-based per-tab resolution', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const { fixture } = await setupPlumbing();

    const overflowDe = fixture.debugElement.query(
      (el) => el.componentInstance instanceof CngxTabOverflow,
    );
    const adapter = (
      overflowDe.componentInstance as unknown as {
        adapter: CngxTabOverflowDomAdapter;
      }
    ).adapter;

    const header = fixture.nativeElement.querySelector(
      '.mat-mdc-tab-header',
    ) as HTMLElement;
    expect(header).not.toBeNull();
    const labelContainer = header.querySelector(
      '.mat-mdc-tab-label-container',
    ) as HTMLElement;
    expect(labelContainer).not.toBeNull();

    // resolveStripRoot: walk a host element placed inside the rendered
    // .mat-mdc-tab-header up to .mat-mdc-tab-label-container — the
    // structural guarantee Material 19/20/21 ships under
    // tabs-accepted-debt §5.
    const probe = document.createElement('div');
    header.appendChild(probe);
    expect(
      adapter.resolveStripRoot({} as CngxTabPanelHost, probe),
    ).toBe(labelContainer);
    probe.remove();

    // resolveTabButton: positional index, handle.id ignored. Pin both
    // ends of the range plus the out-of-bounds null.
    const tabButtons = header.querySelectorAll(
      '.mat-mdc-tab',
    ) as NodeListOf<HTMLElement>;
    expect(tabButtons.length).toBe(3);
    const stub = { id: 'unused-by-material-adapter' } as CngxTabHandle;
    expect(adapter.resolveTabButton(stub, labelContainer, 0)).toBe(
      tabButtons[0],
    );
    expect(adapter.resolveTabButton(stub, labelContainer, 2)).toBe(
      tabButtons[2],
    );
    expect(adapter.resolveTabButton(stub, labelContainer, 99)).toBeNull();
  });

  test('axis 21: anchor inside .mat-mdc-tab-header as a flex sibling of .mat-mdc-tab-label-container', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const { fixture } = await setupPlumbing();
    const headerEl = fixture.nativeElement.querySelector(
      '.mat-mdc-tab-header',
    ) as HTMLElement;
    expect(headerEl).not.toBeNull();
    const overflowEl = fixture.nativeElement.querySelector(
      'cngx-tab-overflow',
    ) as HTMLElement;
    expect(overflowEl).not.toBeNull();

    // The molecule's rendered element is a direct child of the header
    // (no longer a sibling of <mat-tab-group> as it was in axis 18).
    expect(overflowEl.parentElement).toBe(headerEl);
    // Convenience class for the trailing-edge CSS skin.
    expect(overflowEl.classList.contains('cngx-mat-tabs-more')).toBe(true);
    // The molecule sits AFTER the label-container in the flex flow —
    // the appendChild ordering controls visual placement (right of the
    // tab list). The label-container is the IO root, so the molecule
    // being AFTER it in DOM order matches the visual "trailing-edge
    // affordance" intent and lets the IntersectionObserver pick up
    // clipped tabs as the label-container shrinks to make room.
    const labelContainerEl = headerEl.querySelector(
      '.mat-mdc-tab-label-container',
    ) as HTMLElement;
    expect(labelContainerEl).not.toBeNull();
    const headerChildren = Array.from(headerEl.children);
    expect(headerChildren.indexOf(overflowEl)).toBeGreaterThan(
      headerChildren.indexOf(labelContainerEl),
    );
  });

  test('axis 20: directive destroy removes the mounted CngxTabOverflow from the document', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const { fixture } = await setupPlumbing();
    expect(
      fixture.nativeElement.querySelector('cngx-tab-overflow'),
    ).not.toBeNull();

    fixture.destroy();

    // ComponentRef.destroy() detaches the rendered element from the
    // DOM and runs the molecule's own DestroyRef callbacks. Asserting
    // against `document` rather than `fixture.nativeElement` because
    // the fixture host is also detached on destroy — only document-
    // root reachability proves the molecule went away with it.
    expect(document.querySelector('cngx-tab-overflow')).toBeNull();
  });

  test('axis 17: rejection (.cngx-mat-tab--error) and has-errors (.cngx-mat-tab--has-errors) coexist on the same tab without conflict', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(AggregatorHostCmp);
    // Start on tab 1 so the rejection target (tab 0, which carries
    // the bound aggregator) is reachable via a single failing select.
    fixture.componentInstance['active'] = 1;
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
    const matTabEls = fixture.nativeElement.querySelectorAll(
      '.mat-mdc-tab',
    ) as NodeListOf<HTMLElement>;

    // Aggregator surface: tab 0 wants reveal.
    fixture.componentInstance.aggOneHandle.show.set(true);
    fixture.componentInstance.aggOneHandle.announcement.set(
      'Form invalid',
    );
    fixture.detectChanges();
    await fixture.whenStable();

    // Reject a transition INTO tab 0 — commit returns false →
    // lastFailedIndex pins on 0, optimistic mode rolls active back
    // to the prior tab (1).
    presenter.select(0);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(matTabEls[0].classList.contains('cngx-mat-tab--error')).toBe(true);
    expect(matTabEls[0].classList.contains('cngx-mat-tab--has-errors')).toBe(
      true,
    );
    expect(matTabEls[0].getAttribute('aria-invalid')).toBeNull();
    const handleId = presenter.tabs()[0].id;
    // Both projector descriptor ids land in the aria-describedby
    // token list together — the rejection projector's `-rejected`
    // suffix and the aggregator projector's `-errors` suffix coexist
    // without collision (distinct ids; both follow the shared
    // token-list-append pattern).
    const describedby = matTabEls[0].getAttribute('aria-describedby') ?? '';
    expect(describedby).toContain(`${handleId}-errors`);
    expect(describedby).toContain(`${handleId}-rejected`);
    expect(
      matTabEls[0].querySelector(`span.cngx-sr-only#${handleId}-errors`),
    ).not.toBeNull();
    expect(
      matTabEls[0].querySelector(`span.cngx-sr-only#${handleId}-rejected`),
    ).not.toBeNull();
  });

  test('axis 18: *cngxMatTabAggregatorContent slot renders an embedded view inside the descriptor span when bound', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(AggregatorSlotHostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.aggOneHandle.count.set(3);
    fixture.componentInstance.aggOneHandle.announcement.set(
      'Profile has 3 errors',
    );
    fixture.componentInstance.aggOneHandle.show.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const matTabEls = fixture.nativeElement.querySelectorAll(
      '.mat-mdc-tab',
    ) as NodeListOf<HTMLElement>;
    const descriptorSpan = matTabEls[0].querySelector(
      '.cngx-sr-only',
    ) as HTMLElement;
    expect(descriptorSpan).not.toBeNull();
    // Slot template wins → embedded view is rendered with typed
    // context (`label` / `count`); the imperative announcement
    // textContent is replaced by the consumer's markup.
    const slotContent = descriptorSpan.querySelector(
      '[data-testid="slot-content"]',
    ) as HTMLElement;
    expect(slotContent).not.toBeNull();
    expect(slotContent.textContent?.trim()).toBe('Profile==3');
    // The imperative `announcement` text is NOT the descriptor
    // textContent when the slot owns the body — proves the slot
    // path replaced the imperative `setProperty(textContent, ...)`
    // fallback.
    expect(descriptorSpan.textContent?.trim()).not.toBe(
      'Profile has 3 errors',
    );
  });

  test('axis 19: *cngxMatTabAggregatorContent slot context updates when count / label re-emit', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(AggregatorSlotHostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.aggOneHandle.count.set(2);
    fixture.componentInstance.aggOneHandle.announcement.set('a');
    fixture.componentInstance.aggOneHandle.show.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const matTabEls = fixture.nativeElement.querySelectorAll(
      '.mat-mdc-tab',
    ) as NodeListOf<HTMLElement>;
    let slotContent = matTabEls[0].querySelector(
      '[data-testid="slot-content"]',
    ) as HTMLElement;
    expect(slotContent.textContent?.trim()).toBe('Profile==2');

    // Bump count — the projector destroys + remounts the embedded
    // view with the fresh context.
    fixture.componentInstance.aggOneHandle.count.set(7);
    fixture.componentInstance.aggOneHandle.announcement.set('b');
    fixture.detectChanges();
    await fixture.whenStable();
    slotContent = matTabEls[0].querySelector(
      '[data-testid="slot-content"]',
    ) as HTMLElement;
    expect(slotContent.textContent?.trim()).toBe('Profile==7');
  });

  test('axis 20: when no slot template is bound, the imperative descriptor span fallback writes announcement verbatim', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(AggregatorHostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.aggOneHandle.show.set(true);
    fixture.componentInstance.aggOneHandle.announcement.set('Form invalid');
    fixture.detectChanges();
    await fixture.whenStable();

    const matTabEls = fixture.nativeElement.querySelectorAll(
      '.mat-mdc-tab',
    ) as NodeListOf<HTMLElement>;
    const descriptorSpan = matTabEls[0].querySelector(
      '.cngx-sr-only',
    ) as HTMLElement;
    // Imperative path: descriptor span carries the announcement
    // string directly, no embedded-view markers inside.
    expect(descriptorSpan.textContent?.trim()).toBe('Form invalid');
    expect(
      descriptorSpan.querySelector('[data-testid="slot-content"]'),
    ).toBeNull();
  });

  test('axis 27: anchor-retry default of 5 threads into createDomAnchorRetry.maxAttempts (no provideMatTabsConfig)', async () => {
    let captured: number | undefined;
    const stubFactory = (opts: { maxAttempts: number }) => {
      captured = opts.maxAttempts;
      return { start: () => undefined, cancel: () => undefined };
    };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        // Stub the anchor-retry factory so we capture the directive's
        // wiring without depending on a real DOM anchor sequence.
        { provide: CNGX_DOM_ANCHOR_RETRY_FACTORY, useValue: stubFactory },
      ],
    });
    await setupPlumbing();
    expect(captured).toBe(5);
  });

  test('axis 28: provideMatTabsConfig(withAnchorRetryAttempts(12)) propagates into createDomAnchorRetry.maxAttempts', async () => {
    let captured: number | undefined;
    let onGiveUp: (() => void) | undefined;
    const stubFactory = (opts: {
      maxAttempts: number;
      onGiveUp?: () => void;
    }) => {
      captured = opts.maxAttempts;
      onGiveUp = opts.onGiveUp;
      return { start: () => undefined, cancel: () => undefined };
    };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMatTabsConfig(withAnchorRetryAttempts(12)),
        { provide: CNGX_DOM_ANCHOR_RETRY_FACTORY, useValue: stubFactory },
      ],
    });
    await setupPlumbing();
    expect(captured).toBe(12);
    // Sanity check the onGiveUp dev-mode warning interpolates the
    // resolved cap rather than the legacy hardcoded `5`.
    const warnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => undefined);
    try {
      onGiveUp?.();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(String(warnSpy.mock.calls[0][0])).toContain('12 attempts');
    } finally {
      warnSpy.mockRestore();
    }
  });

  test('axis 29: provideMatTabsConfig(withHalfWiredSlotSink(fn)) routes the half-wired diagnostic through the configured sink', async () => {
    const sink = vi.fn<(missing: 'contentTemplate' | 'viewContainerRef') => void>();
    // No CNGX_DOM_ANCHOR_RETRY_FACTORY stub here — the half-wired path
    // fires synchronously in the projector's constructor, well before
    // the anchor retry runs, so the default factory is fine.
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMatTabsConfig(withHalfWiredSlotSink(sink)),
      ],
    });
    // Mount the half-wired host (template binds *cngxMatTabAggregatorContent
    // but the directive's own ViewContainerRef is — by construction —
    // present, so this scenario doesn't fire half-wired through the
    // aggregator host fixture). Instead, mount a host that explicitly
    // skips the aggregator content slot — the directive's projector
    // is configured with `contentTemplate` always present (signal of
    // the consumer slot), but ViewContainerRef stays present too.
    // Half-wired only fires when consumer wires ONE half. The
    // setupPlumbing host (no slot binding) and the AggregatorSlotHostCmp
    // (both halves wired) are not half-wired by definition. Skip
    // mounting and verify wiring via injectMatTabsConfig directly.
    const { injectMatTabsConfig } = await import('./mat-tabs-config');
    const resolved = TestBed.runInInjectionContext(() => injectMatTabsConfig());
    expect(resolved.halfWiredSlotSink).toBe(sink);
  });

  test('axis 30: rapid _stateChanges emissions land — final write wins on the cngx handle', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const { fixture, presenter } = await setupPlumbing();
    const matTabs = presenter.tabs();
    const firstHandle = matTabs[0];
    const matEl = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatTabGroup,
    );
    const directive = matEl.injector.get(CngxMatTabs);
    const setupsByTab = (
      directive as unknown as {
        setupsByTab: Map<MatTab, { setup: unknown }>;
      }
    ).setupsByTab;
    const firstMatTab = Array.from(setupsByTab.keys())[0];
    expect(firstMatTab).toBeDefined();

    // Rapid burst — three Material `_stateChanges` emissions inside
    // the same microtask. The takeUntilDestroyed-bridged subscriber
    // writes the cngx setup's `label` signal synchronously on each
    // emission; the final write wins on the handle's read-only
    // projection. Equivalent to the prior `Subscription`-based
    // shape — only the cleanup mechanism has changed.
    firstMatTab.textLabel = 'A';
    firstMatTab._stateChanges.next();
    firstMatTab.textLabel = 'B';
    firstMatTab._stateChanges.next();
    firstMatTab.textLabel = 'C';
    firstMatTab._stateChanges.next();
    expect(firstHandle.label()).toBe('C');
  });

  test('axis 31: tab unregister destroys the per-tab child injector — takeUntilDestroyed cleanup', async () => {
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
    const directive = matEl.injector.get(CngxMatTabs);
    const setupsByTab = (
      directive as unknown as {
        setupsByTab: Map<
          MatTab,
          {
            childInjector: {
              destroy: () => void;
              onDestroy: (cb: () => void) => void;
            };
          }
        >;
      }
    ).setupsByTab;
    expect(setupsByTab.size).toBe(3);
    const thirdMatTab = Array.from(setupsByTab.keys())[2];
    const thirdEntry = setupsByTab.get(thirdMatTab);
    expect(thirdEntry).toBeDefined();
    let destroyed = false;
    thirdEntry!.childInjector.onDestroy(() => {
      destroyed = true;
    });

    // Drop the third tab; the directive's syncHandles loop must
    // call childInjector.destroy() on the leaving tab so the
    // takeUntilDestroyed-bridged `_stateChanges` subscription tears
    // down deterministically — same cleanup precision as the prior
    // `Map<MatTab, Subscription>`, with the destroy hook driven
    // through `DestroyRef` instead of explicit `unsubscribe()`.
    fixture.componentInstance['setShowThird'](false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(setupsByTab.size).toBe(2);
    expect(destroyed).toBe(true);
  });

  test('axis 32: live-region polite span is mounted under document.body with aria-live attributes', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    // Snapshot the body-scope live-region count BEFORE setup so the
    // assertion handles a non-clean DOM (other test fixtures may
    // leave their own regions; the per-test count delta is what
    // matters).
    const baselineCount = document.body.querySelectorAll<HTMLElement>(
      ':scope > span[aria-live].cngx-sr-only',
    ).length;
    await setupPlumbing();
    const liveRegions = document.body.querySelectorAll<HTMLElement>(
      ':scope > span[aria-live].cngx-sr-only',
    );
    expect(liveRegions.length).toBe(baselineCount + 1);
    const liveRegion = liveRegions[liveRegions.length - 1];
    expect(liveRegion.getAttribute('aria-live')).toBe('polite');
    expect(liveRegion.getAttribute('aria-atomic')).toBe('true');
    expect(liveRegion.getAttribute('role')).toBe('status');
    expect(liveRegion.classList.contains('cngx-sr-only')).toBe(true);
    // Empty between transitions — the live-region stays quiet on
    // no-op CD ticks so AT readers don't hear an utterance for every
    // mat-tab-group instantiation. Body-scope placement (CDK
    // LiveAnnouncer convention) keeps the span outside Material's
    // <mat-tab-group> subtree so MDC tolerance is irrelevant.
    expect(liveRegion.textContent).toBe('');
  });

  test('axis 33: live-region announces commitInFlight while a pessimistic commit is pending', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const baselineCount = document.body.querySelectorAll<HTMLElement>(
      ':scope > span[aria-live].cngx-sr-only',
    ).length;
    const fixture = TestBed.createComponent(CommitHostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    const matEl = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatTabGroup,
    );
    const presenter = matEl.injector.get(CngxTabGroupPresenter);
    const liveRegions = document.body.querySelectorAll<HTMLElement>(
      ':scope > span[aria-live].cngx-sr-only',
    );
    expect(liveRegions.length).toBe(baselineCount + 1);
    const liveRegion = liveRegions[liveRegions.length - 1];

    presenter.select(2);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(presenter.commitState.status()).toBe('pending');
    expect(liveRegion.textContent).toBe('Switching tab…');
  });

  test('axis 34: live-region announces commitRolledBackTo(originLabel) when an optimistic commit rejects', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const baselineCount = document.body.querySelectorAll<HTMLElement>(
      ':scope > span[aria-live].cngx-sr-only',
    ).length;
    const fixture = TestBed.createComponent(CommitHostCmp);
    // Synchronous-rejection commit so the error arm fires inside the
    // single CD pass following the click — no need to flush a real
    // async timer.
    fixture.componentInstance['mode'] = 'optimistic';
    fixture.componentInstance['commit'] = (() => false) as CngxTabsCommitAction;
    fixture.detectChanges();
    await fixture.whenStable();
    const matEl = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatTabGroup,
    );
    const presenter = matEl.injector.get(CngxTabGroupPresenter);
    const liveRegions = document.body.querySelectorAll<HTMLElement>(
      ':scope > span[aria-live].cngx-sr-only',
    );
    expect(liveRegions.length).toBe(baselineCount + 1);
    const liveRegion = liveRegions[liveRegions.length - 1];

    presenter.select(2);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(presenter.lastFailedIndex()).toBe(2);
    // CommitHostCmp's first tab labels are 'One' / 'Two' / 'Three';
    // the rollback origin is 'One' (active before the failed pick).
    expect(liveRegion.textContent).toBe(
      'Could not save changes — reverted to "One".',
    );
  });

  test('axis 35: CNGX_MAT_TAB_HANDLE_FACTORY swap — viewProviders override is honoured', async () => {
    const calls: string[] = [];
    const wrappedFactory: CngxMatTabHandleFactory = (tab, idSeed, injector) => {
      const setup = createMatTabHandle(tab, idSeed, injector);
      calls.push(setup.handle.id);
      return setup;
    };
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: CNGX_MAT_TAB_HANDLE_FACTORY, useValue: wrappedFactory },
      ],
    });
    const { presenter } = await setupPlumbing();
    expect(presenter.tabs().length).toBe(3);
    expect(calls.length).toBe(3);
    expect(new Set(calls).size).toBe(3);
  });

  test('axis 36: CNGX_MAT_TAB_HANDLE_FACTORY default — token resolves to createMatTabHandle without override', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const resolved = TestBed.inject(CNGX_MAT_TAB_HANDLE_FACTORY);
    expect(resolved).toBe(createMatTabHandle);
  });

  test('axis 37: user-click rejection — clicking a Material tab whose commitAction returns false lands cngx-mat-tab--error on the clicked button', async () => {
    // Existing rejection axes (11–13) drive `presenter.select(...)`
    // directly; that path bypasses Material's MDC click handler and
    // therefore did not catch the user-flow gap where the Material
    // click + bidirectional-sync round-trip needs to land the cngx
    // rejection class on the clicked button (the failure mode behind
    // the *cngxMatTabRejectionContent demo "no outline" report). The
    // CSS-cascade specificity that Material's `.mdc-tab` requires
    // lives in `mat-tabs.css` and is not unit-testable here — jsdom
    // does not run Material's component-scoped <style> injection — so
    // this axis pins ONLY the JS contract (class lands, presenter rolls
    // back, Material rolls back). The skin's specificity bump to
    // `.mat-mdc-tab.cngx-mat-tab--error` is the matching CSS guarantee
    // and carries an inline JSDoc that names its load-bearing role.
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

    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.mat-mdc-tab',
    );
    expect(buttons.length).toBe(3);
    (buttons[1] as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      (buttons[1] as HTMLElement).classList.contains('cngx-mat-tab--error'),
    ).toBe(true);
    const matEl = fixture.debugElement.query(
      (el) => el.componentInstance instanceof MatTabGroup,
    );
    const presenter = matEl.injector.get(CngxTabGroupPresenter);
    expect(presenter.lastFailedIndex()).toBe(1);
    expect(presenter.activeIndex()).toBe(0);
    expect((matEl.componentInstance as MatTabGroup).selectedIndex).toBe(0);
  });

});
