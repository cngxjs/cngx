import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxAlerter } from './alerter.service';

describe('CngxAlerter', () => {
  let alerter: CngxAlerter;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CngxAlerter] });
    alerter = TestBed.inject(CngxAlerter);
  });

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
});
