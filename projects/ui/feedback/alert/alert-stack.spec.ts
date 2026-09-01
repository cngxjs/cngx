import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CNGX_FEEDBACK_CONFIG } from '../config/feedback-config';
import { CngxAlerter } from './alerter.service';
import { CngxAlertStack } from './alert-stack';

@Component({
  template: `<cngx-alert-stack [scope]="'test'" [maxVisible]="3" />`,
  imports: [CngxAlertStack],
})
class TestHost {
  readonly stack = viewChild.required(CngxAlertStack);
}

@Component({
  template: `<cngx-alert-stack [position]="position()" [autoScroll]="autoScroll()" />`,
  imports: [CngxAlertStack],
})
class UnscopedHost {
  readonly stack = viewChild.required(CngxAlertStack);
  readonly position = signal<'top' | 'bottom'>('top');
  readonly autoScroll = signal(true);
}

describe('CngxAlertStack', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const stackEl: HTMLElement = fixture.nativeElement.querySelector('cngx-alert-stack');
    // Get the CngxAlerter from the stack's view injector
    const alerter = fixture.componentInstance.stack()['alerter'] as CngxAlerter;
    return { fixture, stackEl, alerter };
  }

  it('renders as role="log" with aria-live="polite"', () => {
    const { stackEl } = setup();
    expect(stackEl.getAttribute('role')).toBe('log');
    expect(stackEl.getAttribute('aria-live')).toBe('polite');
  });

  it('provides CngxAlerter via viewProviders', () => {
    const { alerter } = setup();
    expect(alerter).toBeInstanceOf(CngxAlerter);
  });

  it('renders alerts from the scoped alerter', () => {
    const { fixture, stackEl, alerter } = setup();
    alerter.show({ message: 'Error 1', severity: 'error', scope: 'test' });
    alerter.show({ message: 'Error 2', severity: 'error', scope: 'test' });
    fixture.detectChanges();

    const items = stackEl.querySelectorAll('.cngx-alert-stack__item');
    expect(items.length).toBe(2);
  });

  it('limits visible alerts to maxVisible', () => {
    const { fixture, stackEl, alerter } = setup();
    for (let i = 0; i < 5; i++) {
      alerter.show({ message: `Alert ${i}`, severity: 'error', scope: 'test' });
    }
    fixture.detectChanges();

    const items = stackEl.querySelectorAll('.cngx-alert-stack__item');
    expect(items.length).toBe(3);
  });

  it('shows overflow button when alerts exceed maxVisible', () => {
    const { fixture, stackEl, alerter } = setup();
    for (let i = 0; i < 5; i++) {
      alerter.show({ message: `Alert ${i}`, severity: 'error', scope: 'test' });
    }
    fixture.detectChanges();

    const overflow = stackEl.querySelector('.cngx-alert-stack__overflow');
    expect(overflow).toBeTruthy();
    expect(overflow?.textContent).toContain('2 more');
  });

  it('expands all alerts when overflow button is clicked', () => {
    const { fixture, stackEl, alerter } = setup();
    for (let i = 0; i < 5; i++) {
      alerter.show({ message: `Alert ${i}`, severity: 'error', scope: 'test' });
    }
    fixture.detectChanges();

    const overflow = stackEl.querySelector('.cngx-alert-stack__overflow') as HTMLElement;
    overflow.click();
    fixture.detectChanges();

    const items = stackEl.querySelectorAll('.cngx-alert-stack__item');
    expect(items.length).toBe(5);
    expect(stackEl.querySelector('.cngx-alert-stack__overflow')).toBeNull();
  });

  it('dismiss button removes the alert', () => {
    const { fixture, stackEl, alerter } = setup();
    alerter.show({ message: 'Dismissable', severity: 'error', scope: 'test' });
    fixture.detectChanges();

    const dismiss = stackEl.querySelector('cngx-close-button') as HTMLElement;
    expect(dismiss).toBeTruthy();
    dismiss.click();
    fixture.detectChanges();

    expect(stackEl.querySelectorAll('.cngx-alert-stack__item').length).toBe(0);
  });

  it('applies severity classes to items', () => {
    const { fixture, stackEl, alerter } = setup();
    alerter.show({ message: 'Error', severity: 'error', scope: 'test' });
    fixture.detectChanges();

    const item = stackEl.querySelector('.cngx-alert-stack__item');
    expect(item?.classList.contains('cngx-alert-stack__item--error')).toBe(true);
  });

  it('uses role="alert" for error items', () => {
    const { fixture, stackEl, alerter } = setup();
    alerter.show({ message: 'Error', severity: 'error', scope: 'test' });
    fixture.detectChanges();

    const item = stackEl.querySelector('.cngx-alert-stack__item');
    expect(item?.getAttribute('role')).toBe('alert');
  });

  it('uses role="status" for info items', () => {
    const { fixture, stackEl, alerter } = setup();
    alerter.show({ message: 'Info', severity: 'info', scope: 'test' });
    fixture.detectChanges();

    const item = stackEl.querySelector('.cngx-alert-stack__item');
    expect(item?.getAttribute('role')).toBe('status');
  });

  it('filters alerts by scope', () => {
    const { fixture, stackEl, alerter } = setup();
    alerter.show({ message: 'Wrong scope', scope: 'other' });
    alerter.show({ message: 'Right scope', scope: 'test' });
    fixture.detectChanges();

    const items = stackEl.querySelectorAll('.cngx-alert-stack__item');
    expect(items.length).toBe(1);
  });

  // ── Ancestor/environment alerter merge ───────────────────

  function setupWithEnvAlerter() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [UnscopedHost],
      providers: [CngxAlerter],
    });
    const envAlerter = TestBed.inject(CngxAlerter);
    const fixture = TestBed.createComponent(UnscopedHost);
    fixture.detectChanges();
    const stackEl: HTMLElement = fixture.nativeElement.querySelector('cngx-alert-stack');
    const ownAlerter = fixture.componentInstance.stack()['alerter'] as CngxAlerter;
    return { fixture, stackEl, envAlerter, ownAlerter };
  }

  it('renders alerts from the environment alerter (withAlerts routing)', () => {
    const { fixture, stackEl, envAlerter, ownAlerter } = setupWithEnvAlerter();
    expect(ownAlerter).not.toBe(envAlerter);

    envAlerter.show({ message: 'From env', severity: 'error' });
    fixture.detectChanges();

    const items = stackEl.querySelectorAll('.cngx-alert-stack__item');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('From env');
  });

  it('merges own and environment alerts in one stack', () => {
    const { fixture, stackEl, envAlerter, ownAlerter } = setupWithEnvAlerter();
    envAlerter.show({ message: 'Env alert' });
    ownAlerter.show({ message: 'Own alert' });
    fixture.detectChanges();

    const items = stackEl.querySelectorAll('.cngx-alert-stack__item');
    expect(items.length).toBe(2);
  });

  it('dismiss routes to the owning alerter', () => {
    const { fixture, stackEl, envAlerter } = setupWithEnvAlerter();
    envAlerter.show({ message: 'Env alert', dismissible: true });
    fixture.detectChanges();

    const dismiss = stackEl.querySelector('cngx-close-button') as HTMLElement;
    dismiss.click();
    fixture.detectChanges();

    expect(envAlerter.alerts().length).toBe(0);
    expect(stackEl.querySelectorAll('.cngx-alert-stack__item').length).toBe(0);
  });

  // ── position / autoScroll / config maxVisible ────────────

  it('position="bottom" renders newest alerts last', () => {
    const { fixture, stackEl, ownAlerter } = setupWithEnvAlerter();
    fixture.componentInstance.position.set('bottom');
    ownAlerter.show({ message: 'First' });
    ownAlerter.show({ message: 'Second' });
    fixture.detectChanges();

    const items = stackEl.querySelectorAll('.cngx-alert-stack__item');
    expect(items[0].textContent).toContain('First');
    expect(items[1].textContent).toContain('Second');
  });

  it('position="top" (default) renders newest alerts first', () => {
    const { fixture, stackEl, ownAlerter } = setupWithEnvAlerter();
    ownAlerter.show({ message: 'First' });
    ownAlerter.show({ message: 'Second' });
    fixture.detectChanges();

    const items = stackEl.querySelectorAll('.cngx-alert-stack__item');
    expect(items[0].textContent).toContain('Second');
    expect(items[1].textContent).toContain('First');
  });

  it('scrolls the stack into view when a new alert arrives', () => {
    const { fixture, stackEl, ownAlerter } = setupWithEnvAlerter();
    const scrollSpy = vi.fn();
    stackEl.scrollIntoView = scrollSpy;

    ownAlerter.show({ message: 'Arrive' });
    fixture.detectChanges();

    expect(scrollSpy).toHaveBeenCalled();
  });

  it('does not scroll when [autoScroll] is false', () => {
    const { fixture, stackEl, ownAlerter } = setupWithEnvAlerter();
    fixture.componentInstance.autoScroll.set(false);
    fixture.detectChanges();
    const scrollSpy = vi.fn();
    stackEl.scrollIntoView = scrollSpy;

    ownAlerter.show({ message: 'Quiet' });
    fixture.detectChanges();

    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it('does not scroll when a dismissal exposes an older alert', () => {
    const { fixture, stackEl, ownAlerter } = setupWithEnvAlerter();
    ownAlerter.show({ message: 'Old' });
    const newest = ownAlerter.show({ message: 'New' });
    fixture.detectChanges();

    const scrollSpy = vi.fn();
    stackEl.scrollIntoView = scrollSpy;
    newest.dismiss();
    fixture.detectChanges();

    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it('defaults maxVisible from withAlerts({ maxVisible })', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [UnscopedHost],
      providers: [CngxAlerter, { provide: CNGX_FEEDBACK_CONFIG, useValue: { alertMaxVisible: 2 } }],
    });
    const fixture = TestBed.createComponent(UnscopedHost);
    fixture.detectChanges();
    const stackEl: HTMLElement = fixture.nativeElement.querySelector('cngx-alert-stack');
    const alerter = fixture.componentInstance.stack()['alerter'] as CngxAlerter;

    for (let i = 0; i < 4; i++) {
      alerter.show({ message: `Alert ${i}` });
    }
    fixture.detectChanges();

    expect(stackEl.querySelectorAll('.cngx-alert-stack__item').length).toBe(2);
    expect(stackEl.querySelector('.cngx-alert-stack__overflow')?.textContent).toContain('2 more');
  });

  // ── Overflow disclosure ARIA ─────────────────────────────

  it('hands focus to the first newly revealed item when the overflow button removes itself', async () => {
    const { fixture, stackEl, alerter } = setup();
    for (let i = 0; i < 5; i++) {
      alerter.show({ message: `Alert ${i}`, severity: 'error', scope: 'test' });
    }
    fixture.detectChanges();

    const overflow = stackEl.querySelector('.cngx-alert-stack__overflow') as HTMLElement;
    overflow.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const items = stackEl.querySelectorAll<HTMLElement>('.cngx-alert-stack__item');
    expect(items.length).toBe(5);
    expect(document.activeElement).toBe(items[3]);
  });

  it('overflow button carries no dangling disclosure ARIA, only a label', () => {
    const { fixture, stackEl, alerter } = setup();
    for (let i = 0; i < 5; i++) {
      alerter.show({ message: `Alert ${i}`, severity: 'error', scope: 'test' });
    }
    fixture.detectChanges();

    const overflow = stackEl.querySelector('.cngx-alert-stack__overflow');
    expect(overflow?.hasAttribute('aria-controls')).toBe(false);
    expect(overflow?.hasAttribute('aria-expanded')).toBe(false);
    expect(overflow?.getAttribute('aria-label')).toBe('Show 2 more alerts');
  });

  // ── Timer pause on hover/focus (WCAG 2.2.1) ──────────────

  it('pauses the auto-dismiss timer on pointerenter and resumes on pointerleave', () => {
    vi.useFakeTimers();
    const { fixture, stackEl, alerter } = setup();
    alerter.show({ message: 'Timed', scope: 'test', duration: 3000 });
    fixture.detectChanges();

    const item = stackEl.querySelector('.cngx-alert-stack__item') as HTMLElement;
    vi.advanceTimersByTime(1000);
    item.dispatchEvent(new Event('pointerenter'));
    vi.advanceTimersByTime(60000);
    expect(alerter.alerts().length).toBe(1);

    item.dispatchEvent(new Event('pointerleave'));
    vi.advanceTimersByTime(1999);
    expect(alerter.alerts().length).toBe(1);
    vi.advanceTimersByTime(1);
    expect(alerter.alerts().length).toBe(0);
  });

  it('pins the dismiss close-button with flex-shrink: 0 to survive narrow widths', () => {
    setup();

    const styleText = Array.from(document.querySelectorAll('style'))
      .map((node) => node.textContent ?? '')
      .join('\n');
    expect(styleText).toMatch(/\.cngx-alert-stack__dismiss\s*\{[^}]*flex-shrink:\s*0/);
  });
});
