import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxBanner } from './banner.service';

describe('CngxBanner', () => {
  let banner: CngxBanner;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CngxBanner] });
    banner = TestBed.inject(CngxBanner);
  });

  it('starts with empty banners', () => {
    expect(banner.banners()).toEqual([]);
  });

  it('adds a banner via show()', () => {
    banner.show({ message: 'Offline', id: 'net:offline', severity: 'error' });
    expect(banner.banners().length).toBe(1);
    expect(banner.banners()[0].config.message).toBe('Offline');
    expect(banner.banners()[0].id).toBe('net:offline');
  });

  it('defaults severity to info and dismissible to true', () => {
    banner.show({ message: 'Info', id: 'test' });
    expect(banner.banners()[0].config.severity).toBe('info');
    expect(banner.banners()[0].config.dismissible).toBe(true);
  });

  // ── Dedup by id ──────────────────────────────────────────

  it('updates existing banner instead of adding duplicate', () => {
    banner.show({ message: 'Session expires in 5 min', id: 'auth:timeout', severity: 'warning' });
    banner.show({ message: 'Session expires in 2 min', id: 'auth:timeout', severity: 'warning' });

    expect(banner.banners().length).toBe(1);
    expect(banner.banners()[0].config.message).toBe('Session expires in 2 min');
  });

  it('allows different ids', () => {
    banner.show({ message: 'Offline', id: 'net:offline' });
    banner.show({ message: 'Maintenance', id: 'sys:maint' });
    expect(banner.banners().length).toBe(2);
  });

  // ── Update ───────────────────────────────────────────────

  it('update() patches an existing banner', () => {
    banner.show({ message: 'Old', id: 'test', severity: 'info' });
    banner.update('test', { message: 'New', severity: 'warning' });

    expect(banner.banners()[0].config.message).toBe('New');
    expect(banner.banners()[0].config.severity).toBe('warning');
  });

  // ── Dismiss ──────────────────────────────────────────────

  it('dismiss() removes by id', () => {
    const ref = banner.show({ message: 'Bye', id: 'test' });
    ref.dismiss();
    expect(banner.banners().length).toBe(0);
  });

  it('dismiss() emits afterDismissed', () => {
    const ref = banner.show({ message: 'Watch', id: 'test' });
    let dismissed = false;
    ref.afterDismissed().subscribe(() => (dismissed = true));
    ref.dismiss();
    expect(dismissed).toBe(true);
  });

  it('dismissAll() clears everything', () => {
    banner.show({ message: 'A', id: 'a' });
    banner.show({ message: 'B', id: 'b' });
    banner.dismissAll();
    expect(banner.banners().length).toBe(0);
  });

  // ── Async action ─────────────────────────────────────────

  it('executeAction sets actionPending during execution', async () => {
    let resolve!: () => void;
    const promise = new Promise<void>((r) => (resolve = r));

    banner.show({
      message: 'Session timeout',
      id: 'auth:timeout',
      action: { label: 'Extend', handler: () => promise },
    });

    const exec = banner.executeAction('auth:timeout');
    expect(banner.banners()[0].actionPending).toBe(true);

    resolve();
    await exec;

    // Success: banner is dismissed
    expect(banner.banners().length).toBe(0);
  });

  it('executeAction keeps banner on error and sets actionError', async () => {
    banner.show({
      message: 'Extend session',
      id: 'auth:timeout',
      action: {
        label: 'Extend',
        handler: () => Promise.reject(new Error('Network error')),
      },
    });

    await banner.executeAction('auth:timeout');

    expect(banner.banners().length).toBe(1);
    expect(banner.banners()[0].actionPending).toBe(false);
    expect(banner.banners()[0].actionError).toBeInstanceOf(Error);
  });
});
