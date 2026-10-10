import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxLiveAnnouncer } from '@cngx/common/a11y';
import { createManualState } from '@cngx/common/data';
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

// Recorder coverage for the toast and banner template regions, which never
// touch CngxLiveAnnouncer, the alert (host role plus a dismissal routed
// through the announcer), and the routed announcer itself. Each entry's
// `origin` is pinned as observed: toast and banner messages render as a new
// element already holding role and text, which some screen readers do not
// announce for role="status".

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

@Component({
  template: `
    <cngx-alert severity="error" [state]="state" [closable]="true">Upload failed</cngx-alert>
  `,
  imports: [CngxAlert],
})
class StateAlertHost {
  readonly state = createManualState<string>();
}

@Component({
  template: `
    <dialog cngxDialog #dlg="cngxDialog">
      <cngx-alert severity="error" [closable]="true">Upload failed</cngx-alert>
    </dialog>
  `,
  imports: [CngxDialog, CngxAlert],
})
class ModalAlertHost {
  readonly dialog = viewChild.required(CngxDialog);
}

@Component({
  template: `
    @if (!dismissed()) {
      <cngx-alert severity="error" [closable]="true" (dismissed)="dismissed.set(true)">
        Upload failed
      </cngx-alert>
    }
  `,
  imports: [CngxAlert],
})
class DestroyOnDismissHost {
  readonly dismissed = signal(false);
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
  });

  describe('CngxAlert', () => {
    function dismissButton(fixture: { nativeElement: HTMLElement }): HTMLButtonElement {
      return fixture.nativeElement.querySelector(
        '.cngx-alert__dismiss button',
      ) as HTMLButtonElement;
    }

    // click -> settle -> 16 ms -> observe: the announcer's clear and its write
    // reach the observer in separate batches, as they do in a browser.
    async function dismiss(fixture: {
      nativeElement: HTMLElement;
      detectChanges(): void;
    }): Promise<void> {
      dismissButton(fixture).click();
      await settle(fixture);
      vi.advanceTimersByTime(16);
      await observed();
    }

    const dismissedEntry = {
      text: 'Alert dismissed',
      role: null,
      politeness: 'polite',
      origin: 'mutation',
      suppressedBy: null,
    };

    it('records the alert host as became-live and its dismissal through the shared announcer', async () => {
      const fixture = TestBed.createComponent(FeedbackHost);
      await settle(fixture);
      startRecording();

      fixture.componentInstance.alertShown.set(true);
      await settle(fixture);
      const hostEntries = recorder.entries().map(summary);

      await dismiss(fixture);

      expect(hostEntries).toEqual([
        {
          text: 'Upload failed',
          role: 'alert',
          politeness: 'assertive',
          origin: 'became-live',
          suppressedBy: null,
        },
      ]);
      expect(recorder.entries().slice(1).map(summary)).toEqual([dismissedEntry]);
      expect(fixture.nativeElement.querySelector('cngx-alert [aria-live]')).toBeNull();
    });

    it('re-shows a [state] alert without the previous dismiss text', async () => {
      const fixture = TestBed.createComponent(StateAlertHost);
      await settle(fixture);
      startRecording();
      const state = fixture.componentInstance.state;

      state.setError('boom');
      await settle(fixture);
      await dismiss(fixture);
      state.reset();
      await settle(fixture);
      state.setError('boom');
      await settle(fixture);

      const entries = recorder.entries().map(summary);
      expect(entries.at(-1)).toEqual({
        text: 'Upload failed',
        role: 'alert',
        politeness: 'assertive',
        origin: 'became-live',
        suppressedBy: null,
      });
    });

    it('records one announcement per dismiss across two cycles', async () => {
      const fixture = TestBed.createComponent(StateAlertHost);
      await settle(fixture);
      startRecording();
      const state = fixture.componentInstance.state;

      state.setError('boom');
      await settle(fixture);
      await dismiss(fixture);
      state.reset();
      await settle(fixture);
      state.setError('boom');
      await settle(fixture);
      await dismiss(fixture);

      expect(
        recorder
          .entries()
          .map(summary)
          .filter((entry) => entry.text === 'Alert dismissed'),
      ).toEqual([dismissedEntry, dismissedEntry]);
    });

    it('records a dismissal inside an open modal CngxDialog as suppressed by aria-modal', async () => {
      const fixture = TestBed.createComponent(ModalAlertHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      stubDialogElement(fixture.nativeElement.querySelector('dialog'));
      fixture.componentInstance.dialog().open();
      vi.advanceTimersByTime(16);
      await settle(fixture);
      expect(fixture.nativeElement.querySelector('dialog').getAttribute('aria-modal')).toBe('true');
      startRecording();

      await dismiss(fixture);

      expect(recorder.entries().map(summary)).toEqual([
        { ...dismissedEntry, suppressedBy: 'aria-modal' },
      ]);
    });

    it('announces the dismissal after a destroy-on-dismiss host removes the alert', async () => {
      const fixture = TestBed.createComponent(DestroyOnDismissHost);
      await settle(fixture);
      startRecording();

      await dismiss(fixture);

      expect(fixture.nativeElement.querySelector('cngx-alert')).toBeNull();
      expect(recorder.entries().map(summary)).toEqual([dismissedEntry]);
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
