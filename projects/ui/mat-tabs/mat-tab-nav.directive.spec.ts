import {
  Component,
  provideZonelessChangeDetection,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatTabsModule } from '@angular/material/tabs';
import { NavigationEnd, provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CNGX_TABS_COMMIT_ACTION,
  CngxTabGroupPresenter,
  CngxTabsRouteSync,
} from '@cngx/common/tabs';
import type {
  CngxErrorAggregatorContract,
  CngxErrorAggregatorSourceEntry,
} from '@cngx/common/interactive';

import { CngxMatTabNav } from './mat-tab-nav.directive';
import { CngxMatTabLink } from './mat-tab-link.directive';

interface StubAggregator {
  contract: CngxErrorAggregatorContract;
  show: WritableSignal<boolean>;
  announcement: WritableSignal<string>;
  count: WritableSignal<number>;
}

function makeStubAggregator(): StubAggregator {
  const show = signal(false);
  const announcement = signal('');
  const count = signal(0);
  const showSig: Signal<boolean> = show.asReadonly();
  const contract: CngxErrorAggregatorContract = {
    hasError: showSig,
    errorCount: count.asReadonly(),
    activeErrors: signal([]),
    errorLabels: signal([]),
    shouldShow: showSig,
    announcement: announcement.asReadonly(),
    addSource: (_entry: CngxErrorAggregatorSourceEntry) => undefined,
    removeSource: (_key: string) => undefined,
  };
  return { contract, show, announcement, count };
}

@Component({
  standalone: true,
  imports: [MatTabsModule, CngxMatTabNav, CngxMatTabLink],
  template: `
    <nav mat-tab-nav-bar cngxMatTabNav [tabPanel]="panel" aria-label="Sections">
      <a mat-tab-link cngxMatTabLink id="a" label="A" [active]="active() === 'a'">A</a>
      <a
        mat-tab-link
        cngxMatTabLink
        id="b"
        label="B"
        [active]="active() === 'b'"
        [errorAggregator]="aggB"
        >B</a
      >
      <a mat-tab-link cngxMatTabLink id="c" label="C" [active]="active() === 'c'">C</a>
    </nav>
    <mat-tab-nav-panel #panel>panel</mat-tab-nav-panel>
  `,
})
class NavHostCmp {
  protected readonly active = signal<'a' | 'b' | 'c'>('a');
  readonly aggBHandle = makeStubAggregator();
  protected aggB = this.aggBHandle.contract;
}

@Component({
  standalone: true,
  imports: [MatTabsModule, CngxMatTabNav, CngxMatTabLink],
  template: `
    <nav mat-tab-nav-bar cngxMatTabNav [tabPanel]="panel" aria-label="Sections">
      <a mat-tab-link cngxMatTabLink id="a" label="A" [active]="true">A</a>
      @if (showThird()) {
        <a mat-tab-link cngxMatTabLink id="b" label="B" [active]="false">B</a>
      }
    </nav>
    <mat-tab-nav-panel #panel>panel</mat-tab-nav-panel>
  `,
})
class DynamicNavHostCmp {
  readonly showThird = signal(true);
}

@Component({
  standalone: true,
  imports: [MatTabsModule, CngxMatTabNav, CngxMatTabLink],
  // A refusing commit-action through the DI fallback drives
  // lastFailedIndex so the rejection projector can be exercised against
  // .mat-mdc-tab-link. Native nav usage installs no commit-action; this
  // is the seam a consumer composing one would hit.
  providers: [
    {
      provide: CNGX_TABS_COMMIT_ACTION,
      useValue: { action: signal(() => false), mode: signal('pessimistic') },
    },
  ],
  template: `
    <nav mat-tab-nav-bar cngxMatTabNav [tabPanel]="panel" aria-label="Sections">
      <a mat-tab-link cngxMatTabLink id="a" label="A" [active]="true">A</a>
      <a mat-tab-link cngxMatTabLink id="b" label="B" [active]="false">B</a>
      <a mat-tab-link cngxMatTabLink id="c" label="C" [active]="false">C</a>
    </nav>
    <mat-tab-nav-panel #panel>panel</mat-tab-nav-panel>
  `,
})
class RejectionNavHostCmp {}

@Component({
  standalone: true,
  imports: [MatTabsModule, CngxMatTabNav, CngxMatTabLink, CngxTabsRouteSync],
  template: `
    <nav mat-tab-nav-bar cngxMatTabNav cngxTabsRouteSync [tabPanel]="panel" aria-label="Sections">
      <a mat-tab-link cngxMatTabLink id="a" label="A" [active]="false">A</a>
      <a mat-tab-link cngxMatTabLink id="b" label="B" [active]="false">B</a>
      <a mat-tab-link cngxMatTabLink id="c" label="C" [active]="false">C</a>
    </nav>
    <mat-tab-nav-panel #panel>panel</mat-tab-nav-panel>
  `,
})
class RouteSyncNavHostCmp {}

function navPresenter(
  fixture: ReturnType<typeof TestBed.createComponent>,
): CngxTabGroupPresenter {
  const navEl = fixture.debugElement.query((el) => el.nativeElement?.tagName === 'NAV');
  return navEl.injector.get(CngxTabGroupPresenter);
}

function tabLinks(fixture: ReturnType<typeof TestBed.createComponent>): NodeListOf<HTMLElement> {
  return (fixture.nativeElement as HTMLElement).querySelectorAll('.mat-mdc-tab-link');
}

describe('CngxMatTabNav native nav-bar bridge', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('registers each <a mat-tab-link> as a handle in DOM order', async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(NavHostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    const presenter = navPresenter(fixture);
    expect(presenter.tabs().map((t) => t.id)).toEqual(['a', 'b', 'c']);
    expect(presenter.tabs().map((t) => t.label())).toEqual(['A', 'B', 'C']);
  });

  it('lands the aggregator decoration on the matching .mat-mdc-tab-link', async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(NavHostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    const links = tabLinks(fixture);
    expect(links.length).toBe(3);
    expect(links[1].classList.contains('cngx-mat-tab--has-errors')).toBe(false);

    fixture.componentInstance.aggBHandle.show.set(true);
    fixture.componentInstance.aggBHandle.announcement.set('Card on file has expired');
    fixture.detectChanges();
    await fixture.whenStable();

    // Decoration lands on the second link (id 'b'), not the others.
    expect(links[1].classList.contains('cngx-mat-tab--has-errors')).toBe(true);
    const describedby = links[1].getAttribute('aria-describedby') ?? '';
    expect(describedby).toContain('b-errors');
    const span = links[1].querySelector('span.cngx-sr-only#b-errors');
    expect(span).not.toBeNull();
    expect(span?.textContent).toBe('Card on file has expired');
    expect(links[0].classList.contains('cngx-mat-tab--has-errors')).toBe(false);
    expect(links[2].classList.contains('cngx-mat-tab--has-errors')).toBe(false);
  });

  it('clears the aggregator decoration when the link recovers', async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(NavHostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    const links = tabLinks(fixture);

    fixture.componentInstance.aggBHandle.show.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(links[1].classList.contains('cngx-mat-tab--has-errors')).toBe(true);

    fixture.componentInstance.aggBHandle.show.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(links[1].classList.contains('cngx-mat-tab--has-errors')).toBe(false);
    expect(links[1].querySelector('span.cngx-sr-only#b-errors')).toBeNull();
  });

  it('mounts a polite live region under document.body', async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const baseline = document.body.querySelectorAll<HTMLElement>(
      ':scope > span[aria-live].cngx-sr-only',
    ).length;
    const fixture = TestBed.createComponent(NavHostCmp);
    fixture.detectChanges();
    await fixture.whenStable();

    const regions = document.body.querySelectorAll<HTMLElement>(
      ':scope > span[aria-live].cngx-sr-only',
    );
    expect(regions.length).toBe(baseline + 1);
    expect(regions[regions.length - 1].getAttribute('role')).toBe('status');
  });

  it('unregisters a link handle when its anchor leaves the DOM', async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(DynamicNavHostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    const presenter = navPresenter(fixture);
    expect(presenter.tabs().length).toBe(2);

    fixture.componentInstance.showThird.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(presenter.tabs().map((t) => t.id)).toEqual(['a']);
  });

  it('lands the rejection decoration on the matching .mat-mdc-tab-link when a commit refuses', async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(RejectionNavHostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    const presenter = navPresenter(fixture);
    const links = tabLinks(fixture);
    expect(links.length).toBe(3);

    // Pessimistic refusing commit → lastFailedIndex pins on the target,
    // and the rejection projector decorates that .mat-mdc-tab-link.
    presenter.select(2);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(presenter.lastFailedIndex()).toBe(2);
    expect(links[2].classList.contains('cngx-mat-tab--error')).toBe(true);
    expect(links[2].getAttribute('aria-describedby') ?? '').toContain('c-rejected');
    expect(links[2].querySelector('span.cngx-sr-only#c-rejected')).not.toBeNull();
    expect(links[0].classList.contains('cngx-mat-tab--error')).toBe(false);
  });

  it('reflects the route-active link onto activeIndex via composed [cngxTabsRouteSync]', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const urlSpy = vi.spyOn(router, 'url', 'get').mockReturnValue('/');

    const fixture = TestBed.createComponent(RouteSyncNavHostCmp);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    const presenter = navPresenter(fixture);
    expect(presenter.tabs().length).toBe(3);
    expect(presenter.activeIndex()).toBe(0);

    // External navigation to /b — route-sync reflects it onto activeIndex
    // by matching the handle id (= route segment) against the URL tail.
    urlSpy.mockReturnValue('/b');
    (router.events as unknown as { next: (e: unknown) => void }).next(
      new NavigationEnd(1, '/b', '/b'),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    expect(presenter.activeId()).toBe('b');
  });
});
