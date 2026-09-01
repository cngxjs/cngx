import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CNGX_FEEDBACK_CONFIG, type FeedbackConfig } from '../config/feedback-config';
import { CngxAlerter } from './alerter.service';

describe('CngxAlerter', () => {
  let alerter: CngxAlerter;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [CngxAlerter] });
    alerter = TestBed.inject(CngxAlerter);
  });

  function reconfigure(config: FeedbackConfig): CngxAlerter {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [CngxAlerter, { provide: CNGX_FEEDBACK_CONFIG, useValue: config }],
    });
    return TestBed.inject(CngxAlerter);
  }

  it('starts with empty alerts', () => {
    expect(alerter.alerts()).toEqual([]);
  });

  it('adds an alert via show()', () => {
    alerter.show({ message: 'Error occurred', severity: 'error' });
    expect(alerter.alerts().length).toBe(1);
    expect(alerter.alerts()[0].config.message).toBe('Error occurred');
    expect(alerter.alerts()[0].config.severity).toBe('error');
  });

  it('defaults severity to info', () => {
    alerter.show({ message: 'Info' });
    expect(alerter.alerts()[0].config.severity).toBe('info');
  });

  it('defaults persistent to true and dismissible to true', () => {
    alerter.show({ message: 'Test' });
    expect(alerter.alerts()[0].config.persistent).toBe(true);
    expect(alerter.alerts()[0].config.dismissible).toBe(true);
  });

  it('newest alert is first in the array', () => {
    alerter.show({ message: 'First' });
    alerter.show({ message: 'Second' });
    expect(alerter.alerts()[0].config.message).toBe('Second');
    expect(alerter.alerts()[1].config.message).toBe('First');
  });

  // ── Dismiss ──────────────────────────────────────────────

  it('dismiss() removes an alert by id', () => {
    const ref = alerter.show({ message: 'To remove' });
    expect(alerter.alerts().length).toBe(1);
    ref.dismiss();
    expect(alerter.alerts().length).toBe(0);
  });

  it('dismiss() emits afterDismissed', () => {
    const ref = alerter.show({ message: 'Watch me' });
    let dismissed = false;
    ref.afterDismissed().subscribe(() => (dismissed = true));
    ref.dismiss();
    expect(dismissed).toBe(true);
  });

  it('dismissAll() removes all alerts', () => {
    alerter.show({ message: 'A' });
    alerter.show({ message: 'B' });
    alerter.show({ message: 'C' });
    expect(alerter.alerts().length).toBe(3);
    alerter.dismissAll();
    expect(alerter.alerts().length).toBe(0);
  });

  it('dismissAll(scope) removes only matching scope', () => {
    alerter.show({ message: 'Global' });
    alerter.show({ message: 'Scoped A', scope: 'form' });
    alerter.show({ message: 'Scoped B', scope: 'form' });
    expect(alerter.alerts().length).toBe(3);

    alerter.dismissAll('form');
    expect(alerter.alerts().length).toBe(1);
    expect(alerter.alerts()[0].config.message).toBe('Global');
  });

  // ── Dedup ────────────────────────────────────────────────

  it('deduplicates identical alerts within dedup window', () => {
    alerter.show({ message: 'Same', severity: 'error' });
    alerter.show({ message: 'Same', severity: 'error' });
    expect(alerter.alerts().length).toBe(1);
  });

  it('does not dedup alerts with different severity', () => {
    alerter.show({ message: 'Same', severity: 'error' });
    alerter.show({ message: 'Same', severity: 'warning' });
    expect(alerter.alerts().length).toBe(2);
  });

  it('does not dedup alerts with different scope', () => {
    alerter.show({ message: 'Same', scope: 'a' });
    alerter.show({ message: 'Same', scope: 'b' });
    expect(alerter.alerts().length).toBe(2);
  });

  // ── Auto-dismiss ─────────────────────────────────────────

  it('persistent alerts (the default) never auto-dismiss', () => {
    alerter.show({ message: 'Stay' });
    vi.advanceTimersByTime(60000);
    expect(alerter.alerts().length).toBe(1);
  });

  it('an explicit duration implies non-persistent and auto-dismisses', () => {
    alerter.show({ message: 'Timed', duration: 3000 });
    expect(alerter.alerts()[0].config.persistent).toBe(false);
    vi.advanceTimersByTime(2999);
    expect(alerter.alerts().length).toBe(1);
    vi.advanceTimersByTime(1);
    expect(alerter.alerts().length).toBe(0);
  });

  it('persistent: false without a duration falls back to 5000ms', () => {
    alerter.show({ message: 'Fallback', persistent: false });
    vi.advanceTimersByTime(4999);
    expect(alerter.alerts().length).toBe(1);
    vi.advanceTimersByTime(1);
    expect(alerter.alerts().length).toBe(0);
  });

  it('persistent: true wins over an explicit duration', () => {
    alerter.show({ message: 'Pinned', persistent: true, duration: 1000 });
    vi.advanceTimersByTime(60000);
    expect(alerter.alerts().length).toBe(1);
  });

  it('auto-dismiss emits afterDismissed', () => {
    const ref = alerter.show({ message: 'Watch me', duration: 1000 });
    let dismissed = false;
    ref.afterDismissed().subscribe(() => (dismissed = true));
    vi.advanceTimersByTime(1000);
    expect(dismissed).toBe(true);
  });

  it('honors withAlerts defaultDuration for alerts without explicit config', () => {
    const configured = reconfigure({ alertDefaultDuration: 2000 });
    configured.show({ message: 'Configured' });
    expect(configured.alerts()[0].config.persistent).toBe(false);
    vi.advanceTimersByTime(1999);
    expect(configured.alerts().length).toBe(1);
    vi.advanceTimersByTime(1);
    expect(configured.alerts().length).toBe(0);
  });

  it('persistent: true opts out of the configured defaultDuration', () => {
    const configured = reconfigure({ alertDefaultDuration: 2000 });
    configured.show({ message: 'Pinned', persistent: true });
    vi.advanceTimersByTime(60000);
    expect(configured.alerts().length).toBe(1);
  });

  // ── Pause / Resume (WCAG 2.2.1) ──────────────────────────

  it('pauseTimer() pauses auto-dismiss', () => {
    alerter.show({ message: 'Pause me', duration: 3000 });
    const id = alerter.alerts()[0].id;
    vi.advanceTimersByTime(1000);
    alerter.pauseTimer(id);
    vi.advanceTimersByTime(60000);
    expect(alerter.alerts().length).toBe(1);
  });

  it('resumeTimer() resumes with the per-start remaining time', () => {
    alerter.show({ message: 'Resume me', duration: 3000 });
    const id = alerter.alerts()[0].id;
    vi.advanceTimersByTime(1000);
    alerter.pauseTimer(id);
    alerter.resumeTimer(id);
    vi.advanceTimersByTime(1999);
    expect(alerter.alerts().length).toBe(1);
    vi.advanceTimersByTime(1);
    expect(alerter.alerts().length).toBe(0);
  });

  it('dedup restarts the auto-dismiss clock on the merged alert', () => {
    alerter.show({ message: 'Dup', duration: 3000 });
    vi.advanceTimersByTime(500);
    alerter.show({ message: 'Dup', duration: 3000 });
    expect(alerter.alerts().length).toBe(1);
    vi.advanceTimersByTime(2999);
    expect(alerter.alerts().length).toBe(1);
    vi.advanceTimersByTime(1);
    expect(alerter.alerts().length).toBe(0);
  });
});
