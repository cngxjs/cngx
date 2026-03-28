import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createManualState } from '@cngx/common/data';
import type { ManualAsyncState } from '@cngx/common/data';

import { CngxAlert, type AlertSeverity } from './alert';

@Component({
  template: `
    <cngx-alert
      [severity]="severity()"
      [state]="state()"
      [dismissible]="dismissible()"
      [title]="title()"
    >
      Alert message
    </cngx-alert>
  `,
  imports: [CngxAlert],
})
class TestHost {
  readonly severity = signal<AlertSeverity>('info');
  readonly state = signal<ManualAsyncState<unknown> | undefined>(undefined);
  readonly dismissible = signal(false);
  readonly title = signal<string | undefined>(undefined);
}

describe('CngxAlert', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const alert: HTMLElement = fixture.nativeElement.querySelector('cngx-alert');
    return { fixture, alert, host: fixture.componentInstance };
  }

  // --- Role based on severity ---

  it('uses role="status" for info severity', () => {
    const { alert } = setup();
    expect(alert.getAttribute('role')).toBe('status');
  });

  it('uses role="status" for success severity', () => {
    const { fixture, alert, host } = setup();
    host.severity.set('success');
    fixture.detectChanges();
    expect(alert.getAttribute('role')).toBe('status');
  });

  it('uses role="alert" for warning severity', () => {
    const { fixture, alert, host } = setup();
    host.severity.set('warning');
    fixture.detectChanges();
    expect(alert.getAttribute('role')).toBe('alert');
  });

  it('uses role="alert" for error severity', () => {
    const { fixture, alert, host } = setup();
    host.severity.set('error');
    fixture.detectChanges();
    expect(alert.getAttribute('role')).toBe('alert');
  });

  // --- Severity classes ---

  it('applies severity class', () => {
    const { alert } = setup();
    expect(alert.classList.contains('cngx-alert--info')).toBe(true);
  });

  it('updates severity class on change', () => {
    const { fixture, alert, host } = setup();
    host.severity.set('error');
    fixture.detectChanges();
    expect(alert.classList.contains('cngx-alert--error')).toBe(true);
    expect(alert.classList.contains('cngx-alert--info')).toBe(false);
  });

  // --- Dismissible ---

  it('does not render close button by default', () => {
    const { alert } = setup();
    expect(alert.querySelector('cngx-close-button')).toBeNull();
  });

  it('renders close button when dismissible', () => {
    const { fixture, alert, host } = setup();
    host.dismissible.set(true);
    fixture.detectChanges();
    expect(alert.querySelector('cngx-close-button')).toBeTruthy();
  });

  // --- Default icon ---

  it('renders default SVG icon', () => {
    const { alert } = setup();
    expect(alert.querySelector('.cngx-alert__default-icon')).toBeTruthy();
  });

  // --- Title ---

  it('renders title when set', () => {
    const { fixture, alert, host } = setup();
    host.title.set('Heads up');
    fixture.detectChanges();
    const titleEl = alert.querySelector('.cngx-alert__title');
    expect(titleEl?.textContent).toContain('Heads up');
  });

  // --- Static alert (no state) ---

  it('is always visible without state binding', () => {
    const { alert } = setup();
    expect(alert.hasAttribute('hidden')).toBe(false);
    expect(alert.getAttribute('role')).toBe('status');
  });

  // --- State-driven visibility ---

  it('is hidden when state is idle', () => {
    const state = createManualState<string>();
    const { fixture, alert, host } = setup();
    host.state.set(state);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(alert.hasAttribute('hidden')).toBe(true);
  });

  it('is hidden when state is loading (no prior error)', () => {
    const state = createManualState<string>();
    state.set('loading');
    const { fixture, alert, host } = setup();
    host.state.set(state);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(alert.hasAttribute('hidden')).toBe(true);
  });

  it('is visible when state is error', () => {
    const state = createManualState<string>();
    state.setError('boom');
    const { fixture, alert, host } = setup();
    host.state.set(state);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(alert.hasAttribute('hidden')).toBe(false);
    expect(alert.getAttribute('role')).toBe('status');
  });

  it('strips role and aria-atomic when hidden', () => {
    const state = createManualState<string>();
    const { fixture, alert, host } = setup();
    host.state.set(state);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(alert.getAttribute('role')).toBeNull();
    expect(alert.getAttribute('aria-atomic')).toBeNull();
  });

  it('shows on success with min-display hold, then auto-hides', () => {
    const state = createManualState<string>();
    const { fixture, alert, host } = setup();
    host.state.set(state);
    fixture.detectChanges();
    TestBed.flushEffects();

    state.setSuccess('done');
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    // Visible during 3s min-display window
    expect(alert.hasAttribute('hidden')).toBe(false);

    // Auto-hides after 3s
    vi.advanceTimersByTime(3000);
    fixture.detectChanges();
    expect(alert.hasAttribute('hidden')).toBe(true);
  });

  it('dismiss button hides the alert and emits dismissed', () => {
    const state = createManualState<string>();
    state.setError('fail');
    const { fixture, alert, host } = setup();
    host.state.set(state);
    host.dismissible.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();

    const closeBtn = alert.querySelector('cngx-close-button') as HTMLElement;
    expect(closeBtn).toBeTruthy();
    closeBtn.click();
    fixture.detectChanges();

    expect(alert.hasAttribute('hidden')).toBe(true);
  });
});
