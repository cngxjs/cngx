import {
  Component,
  provideZonelessChangeDetection,
  signal,
  type WritableSignal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, beforeEach } from 'vitest';

import { createAnnouncementRecorder, type CngxAnnouncementRecorder } from '@cngx/core/utils';

import { CngxRecyclerAnnouncer } from './recycler-announcer.component';
import type { CngxRecycler } from './recycler';

function createMockRecycler(announcement = ''): CngxRecycler {
  return {
    announcement: signal(announcement),
    ariaSetSize: signal(0),
    start: signal(0),
    end: signal(0),
    offsetBefore: signal(0),
    offsetAfter: signal(0),
    totalSize: signal(0),
    placeholdersBefore: signal(0),
    placeholdersAfter: signal(0),
    isLoading: signal(false),
    isRefreshing: signal(false),
    isEmpty: signal(true),
    skeletonSlots: signal(0),
    showSkeleton: signal(false),
    firstVisible: signal(0),
    lastVisible: signal(0),
    visibleCount: signal(0),
    lostFocus: signal(null),
    pendingTarget: signal(null),
    anchorTo: () => {},
    releaseAnchor: () => {},
    sliced: () => signal([]),
    measure: () => {},
    scrollToIndex: () => {},
    reset: () => {},
  } as unknown as CngxRecycler;
}

@Component({
  standalone: true,
  imports: [CngxRecyclerAnnouncer],
  template: `<cngx-recycler-announcer [cngxRecyclerAnnouncer]="recycler" />`,
})
class TestHost {
  recycler = createMockRecycler();
}

describe('CngxRecyclerAnnouncer', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  it('should render aria-live region', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('[aria-live]') as HTMLElement;
    expect(span).toBeTruthy();
    expect(span.getAttribute('aria-live')).toBe('polite');
    expect(span.getAttribute('aria-atomic')).toBe('true');
  });

  it('should render announcement text', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.recycler = createMockRecycler('20 more items loaded. 60 total.');
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('[aria-live]') as HTMLElement;
    expect(span.textContent).toContain('20 more items loaded. 60 total.');
  });

  it('should have display: contents on host', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('cngx-recycler-announcer') as HTMLElement;
    expect(host.style.display).toBe('contents');
  });

  it('should have cngx-sr-only class on span', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('[aria-live]') as HTMLElement;
    expect(span.classList.contains('cngx-sr-only')).toBe(true);
  });
});

describe('CngxRecyclerAnnouncer recorded', () => {
  let recorder: CngxAnnouncementRecorder | undefined;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  afterEach(() => {
    recorder?.destroy();
  });

  it('records one polite entry when a range change updates the announcement', async () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    recorder = createAnnouncementRecorder({ owner: () => null });

    (fixture.componentInstance.recycler.announcement as WritableSignal<string>).set(
      '20 more items loaded. 60 total.',
    );
    fixture.detectChanges();
    await Promise.resolve();

    expect(
      recorder.entries().map(({ text, politeness, origin, suppressedBy }) => ({
        text,
        politeness,
        origin,
        suppressedBy,
      })),
    ).toEqual([
      {
        text: '20 more items loaded. 60 total.',
        politeness: 'polite',
        origin: 'mutation',
        suppressedBy: null,
      },
    ]);
  });
});
