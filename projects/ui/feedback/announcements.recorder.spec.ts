import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxLiveAnnouncer } from '@cngx/common/a11y';
import { CngxDialog } from '@cngx/common/dialog';
import {
  createAnnouncementRecorder,
  type CngxAnnouncementRecorder,
  type CngxRecordedAnnouncement,
} from '@cngx/core/utils';

import { CngxAlert } from './alert/alert';
import { CngxBanner } from './banner/banner.service';
import { CngxBannerOutlet } from './banner/banner-outlet';
import { CngxToaster, provideToasts } from './toast/toast.service';
import { CngxToastOutlet } from './toast/toast-outlet';

// Recorder coverage for three template regions that never touch
// CngxLiveAnnouncer, plus the routed announcer itself. Each entry's `origin`
// is pinned as observed: toast and banner messages render as a new element
// already holding role and text, which some screen readers do not announce
// for role="status".

const observed = () => Promise.resolve();

const summary = (entry: CngxRecordedAnnouncement) => ({
  text: entry.text,
  role: entry.role,
  politeness: entry.politeness,
  origin: entry.origin,
  suppressedBy: entry.suppressedBy,
});

@Component({
  template: `
    <cngx-toast-outlet />
    <cngx-banner-outlet />
    <cngx-alert severity="error" [when]="alertShown()" [closable]="true">Upload failed</cngx-alert>
  `,
  imports: [CngxToastOutlet, CngxBannerOutlet, CngxAlert],
})
class FeedbackHost {
  readonly alertShown = signal(false);
}

@Component({
  template: `<dialog cngxDialog #dlg="cngxDialog"><p>Edit profile</p></dialog>`,
  imports: [CngxDialog],
})
class ModalHost {
  readonly dialog = viewChild.required(CngxDialog);
}

// jsdom does not implement showModal / show / close. Unconditional instance
// assignment: the builder runs with isolate:false and another spec may have
// polyfilled the shared prototype.
function stubDialogElement(el: HTMLDialogElement): void {
  el.showModal = vi.fn(() => el.setAttribute('open', ''));
  el.show = vi.fn(() => el.setAttribute('open', ''));
  el.close = vi.fn(() => el.removeAttribute('open'));
}

describe('announcement recorder over ui/feedback', () => {
  let recorder: CngxAnnouncementRecorder;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [provideToasts(), CngxBanner] });
  });

  afterEach(() => {
    recorder?.destroy();
    vi.restoreAllMocks();
  });

  function startRecording(): void {
    recorder = createAnnouncementRecorder({ owner: () => null });
  }

  async function settle(fixture: { detectChanges(): void }): Promise<void> {
    TestBed.flushEffects();
    fixture.detectChanges();
    vi.advanceTimersByTime(1);
    TestBed.flushEffects();
    fixture.detectChanges();
    await observed();
  }

  describe('template regions', () => {
    async function mount() {
      const fixture = TestBed.createComponent(FeedbackHost);
      await settle(fixture);
      startRecording();
      return fixture;
    }

    it('records a success toast as a role=status insertion', async () => {
      const fixture = await mount();

      TestBed.inject(CngxToaster).show({ message: 'Saved', severity: 'success' });
      await settle(fixture);

      expect(recorder.entries().map(summary)).toEqual([
        {
          text: 'Saved',
          role: 'status',
          politeness: 'polite',
          origin: 'insertion',
          suppressedBy: null,
        },
      ]);
    });

    it('records an error toast as a role=alert insertion', async () => {
      const fixture = await mount();

      TestBed.inject(CngxToaster).show({ message: 'Save failed', severity: 'error' });
      await settle(fixture);

      expect(recorder.entries().map(summary)).toEqual([
        {
          text: 'Save failed',
          role: 'alert',
          politeness: 'assertive',
          origin: 'insertion',
          suppressedBy: null,
        },
      ]);
    });

    it('records an info banner as a role=status insertion and a warning banner as role=alert', async () => {
      const fixture = await mount();
      const banner = TestBed.inject(CngxBanner);

      banner.show({ id: 'sync', message: 'Sync paused', severity: 'info' });
      await settle(fixture);
      banner.show({ id: 'quota', message: 'Storage almost full', severity: 'warning' });
      await settle(fixture);

      expect(recorder.entries().map(summary)).toEqual([
        {
          text: 'Sync paused',
          role: 'status',
          politeness: 'polite',
          origin: 'insertion',
          suppressedBy: null,
        },
        {
          text: 'Storage almost full',
          role: 'alert',
          politeness: 'assertive',
          origin: 'insertion',
          suppressedBy: null,
        },
      ]);
    });

    it('records the alert host as became-live and its own aria-live span as a mutation', async () => {
      const fixture = await mount();

      fixture.componentInstance.alertShown.set(true);
      await settle(fixture);
      const hostEntries = recorder.entries().map(summary);

      const dismiss = fixture.nativeElement.querySelector(
        '.cngx-alert__dismiss button',
      ) as HTMLButtonElement;
      dismiss.click();
      await settle(fixture);

      expect(hostEntries).toEqual([
        {
          text: 'Upload failed',
          role: 'alert',
          politeness: 'assertive',
          origin: 'became-live',
          suppressedBy: null,
        },
      ]);
      // Observed, not endorsed: the dismiss announcement lands in the same
      // pass that sets `hidden` on the host, so AT would not speak it.
      expect(recorder.entries().slice(1).map(summary)).toEqual([
        {
          text: 'Alert dismissed',
          role: null,
          politeness: 'polite',
          origin: 'mutation',
          suppressedBy: 'hidden',
        },
      ]);
    });
  });

  describe('routed through CngxLiveAnnouncer', () => {
    it('records an announce() once its 16 ms write delay has passed', async () => {
      const announcer = TestBed.inject(CngxLiveAnnouncer);
      announcer.announce('warm-up');
      vi.advanceTimersByTime(16);
      startRecording();

      announcer.announce('Copied');
      await observed();
      expect(recorder.entries()).toEqual([]);

      vi.advanceTimersByTime(16);
      await observed();
      expect(recorder.entries().map(summary)).toEqual([
        {
          text: 'Copied',
          role: null,
          politeness: 'polite',
          origin: 'mutation',
          suppressedBy: null,
        },
      ]);
    });

    it('records an assertive announce() from a region created after recording started', async () => {
      startRecording();

      TestBed.inject(CngxLiveAnnouncer).announce('Connection lost', 'assertive');
      vi.advanceTimersByTime(16);
      await observed();

      expect(recorder.entries().map(summary)).toEqual([
        {
          text: 'Connection lost',
          role: null,
          politeness: 'assertive',
          origin: 'mutation',
          suppressedBy: null,
        },
      ]);
    });

    it('records an announce() behind an open modal CngxDialog as suppressed by aria-modal', async () => {
      const fixture = TestBed.createComponent(ModalHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      stubDialogElement(fixture.nativeElement.querySelector('dialog'));
      fixture.componentInstance.dialog().open();
      vi.advanceTimersByTime(16);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(fixture.nativeElement.querySelector('dialog').getAttribute('aria-modal')).toBe('true');
      startRecording();

      TestBed.inject(CngxLiveAnnouncer).announce('Draft saved');
      vi.advanceTimersByTime(16);
      await observed();

      expect(recorder.entries().map(summary)).toEqual([
        {
          text: 'Draft saved',
          role: null,
          politeness: 'polite',
          origin: 'mutation',
          suppressedBy: 'aria-modal',
        },
      ]);
    });

    it('records only the surviving message when two polite announce() calls land within 16 ms', async () => {
      startRecording();
      const announcer = TestBed.inject(CngxLiveAnnouncer);

      announcer.announce('Option selected');
      vi.advanceTimersByTime(8);
      announcer.announce('Menu closed');
      vi.advanceTimersByTime(16);
      await observed();

      expect(recorder.entries().map((entry) => entry.text)).toEqual(['Menu closed']);
    });
  });
});
