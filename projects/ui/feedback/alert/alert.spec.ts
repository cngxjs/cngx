import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createManualState } from '@cngx/common/data';
import type { ManualAsyncState } from '@cngx/common/data';

import { CngxAlert, CngxAlertAction, type AlertSeverity } from './alert';

// ── Helpers ─────────────────────────────────────────────────────

/** Simulate animation completion by dispatching animationend event. */
function fireAnimationEnd(el: HTMLElement, animationName: string): void {
  const event = new Event('animationend', { bubbles: true });
  (event as unknown as Record<string, unknown>)['animationName'] = animationName;
  el.dispatchEvent(event);
}

/** Flush effects + detect changes + advance animation fallback.
 * In jsdom (no matchMedia), fallback fires at 0ms (reduced-motion path). */
function flushAll(fixture: { detectChanges(): void }): void {
  TestBed.flushEffects();
  fixture.detectChanges();
  // Advance past animation fallback (0ms in jsdom, 500ms with animations)
  vi.advanceTimersByTime(1);
  TestBed.flushEffects();
  fixture.detectChanges();
}

// ── Test Host ───────────────────────────────────────────────────

@Component({
  template: `
    <cngx-alert
      [severity]="severity()"
      [state]="state()"
      [closable]="closable()"
      [dismissible]="dismissible()"
      [title]="title()"
      [when]="when()"
      [autoDismissDelay]="autoDismissDelay()"
      [collapsible]="collapsible()"
      [collapseDelay]="collapseDelay()"
    >
      Alert message
      @if (showAction()) {
        <button cngxAlertAction (click)="actionClicked.set(true)">Retry</button>
      }
    </cngx-alert>
  `,
  imports: [CngxAlert, CngxAlertAction],
})
class TestHost {
  readonly severity = signal<AlertSeverity>('info');
  readonly state = signal<ManualAsyncState<unknown> | undefined>(undefined);
  readonly closable = signal(false);
  readonly dismissible = signal(false);
  readonly title = signal<string | undefined>(undefined);
  readonly when = signal<boolean | undefined>(undefined);
  readonly autoDismissDelay = signal<number | undefined>(5000);
  readonly collapsible = signal(false);
  readonly collapseDelay = signal<number | undefined>(undefined);
  readonly showAction = signal(false);
  readonly actionClicked = signal(false);
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

  // ── Role based on severity ──────────────────────────────────

  it('uses role="status" for info severity', () => {
    const { alert } = setup();
    flushAll({ detectChanges: () => {} });
    expect(alert.getAttribute('role')).toBe('status');
  });

  it('uses role="status" for success severity', () => {
    const { fixture, alert, host } = setup();
    host.severity.set('success');
    flushAll(fixture);
    expect(alert.getAttribute('role')).toBe('status');
  });

  it('uses role="alert" for warning severity', () => {
    const { fixture, alert, host } = setup();
    host.severity.set('warning');
    flushAll(fixture);
    expect(alert.getAttribute('role')).toBe('alert');
  });

  it('uses role="alert" for error severity', () => {
    const { fixture, alert, host } = setup();
    host.severity.set('error');
    flushAll(fixture);
    expect(alert.getAttribute('role')).toBe('alert');
  });

  // ── Severity classes ────────────────────────────────────────

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

  // ── Closable / Dismissible ──────────────────────────────────

  it('does not render close button by default', () => {
    const { alert } = setup();
    expect(alert.querySelector('cngx-close-button')).toBeNull();
  });

  it('renders close button when closable', () => {
    const { fixture, alert, host } = setup();
    host.closable.set(true);
    fixture.detectChanges();
    expect(alert.querySelector('cngx-close-button')).toBeTruthy();
  });

  it('renders close button when deprecated dismissible is set', () => {
    const { fixture, alert, host } = setup();
    host.dismissible.set(true);
    fixture.detectChanges();
    expect(alert.querySelector('cngx-close-button')).toBeTruthy();
  });

  // ── Default icon ────────────────────────────────────────────

  it('renders default SVG icon', () => {
    const { alert } = setup();
    expect(alert.querySelector('.cngx-alert__default-icon')).toBeTruthy();
  });

  // ── Title ───────────────────────────────────────────────────

  it('renders title when set', () => {
    const { fixture, alert, host } = setup();
    host.title.set('Heads up');
    fixture.detectChanges();
    const titleEl = alert.querySelector('.cngx-alert__title');
    expect(titleEl?.textContent).toContain('Heads up');
  });

  // ── Static alert (no state, no when) ────────────────────────

  it('is visible without state or when binding (static)', () => {
    const { alert } = setup();
    flushAll({ detectChanges: () => {} });
    expect(alert.hasAttribute('hidden')).toBe(false);
    expect(alert.getAttribute('role')).toBe('status');
  });

  // ── Visibility phases & animation ───────────────────────────

  it('starts in entering phase for static alerts', () => {
    const { fixture, alert } = setup();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(alert.classList.contains('cngx-alert--entering')).toBe(true);
  });

  it('transitions to visible phase after animation completes', () => {
    const { fixture, alert } = setup();
    TestBed.flushEffects();
    fixture.detectChanges();
    fireAnimationEnd(alert, 'cngx-alert-enter');
    fixture.detectChanges();
    expect(alert.classList.contains('cngx-alert--visible')).toBe(true);
    expect(alert.classList.contains('cngx-alert--entering')).toBe(false);
  });

  it('uses animation fallback for reduced-motion', () => {
    const { fixture, alert } = setup();
    TestBed.flushEffects();
    fixture.detectChanges();
    // Don't fire animationend — simulate reduced-motion
    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(alert.classList.contains('cngx-alert--visible')).toBe(true);
  });

  // ── State-driven visibility ─────────────────────────────────

  it('is hidden when state is idle', () => {
    const state = createManualState<string>();
    const { fixture, alert, host } = setup();
    host.state.set(state);
    flushAll(fixture);
    expect(alert.hasAttribute('hidden')).toBe(true);
  });

  it('is visible when state is loading', () => {
    const state = createManualState<string>();
    state.set('loading');
    const { fixture, alert, host } = setup();
    host.state.set(state);
    flushAll(fixture);
    expect(alert.hasAttribute('hidden')).toBe(false);
    expect(alert.getAttribute('aria-busy')).toBe('true');
  });

  it('is visible when state is error', () => {
    const state = createManualState<string>();
    state.setError('boom');
    const { fixture, alert, host } = setup();
    host.state.set(state);
    flushAll(fixture);
    expect(alert.hasAttribute('hidden')).toBe(false);
  });

  it('strips role and aria-atomic when hidden', () => {
    const state = createManualState<string>();
    const { fixture, alert, host } = setup();
    host.state.set(state);
    flushAll(fixture);
    expect(alert.getAttribute('role')).toBeNull();
    expect(alert.getAttribute('aria-atomic')).toBeNull();
  });

  it('auto-dismisses after autoDismissDelay on success', () => {
    const state = createManualState<string>();
    const { fixture, alert, host } = setup();
    host.state.set(state);
    flushAll(fixture);

    state.setSuccess('done');
    TestBed.flushEffects();
    fixture.detectChanges();
    // Enter animation fallback
    vi.advanceTimersByTime(1);
    fixture.detectChanges();

    // Visible during auto-dismiss window
    expect(alert.hasAttribute('hidden')).toBe(false);

    // Auto-hides after 5s (default autoDismissDelay)
    vi.advanceTimersByTime(5000);
    fixture.detectChanges();
    // Exit animation fallback
    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(alert.hasAttribute('hidden')).toBe(true);
  });

  it('respects custom autoDismissDelay', () => {
    const state = createManualState<string>();
    const { fixture, alert, host } = setup();
    host.autoDismissDelay.set(1000);
    host.state.set(state);
    flushAll(fixture);

    state.setSuccess('done');
    TestBed.flushEffects();
    fixture.detectChanges();
    vi.advanceTimersByTime(1); // enter fallback
    fixture.detectChanges();

    // Still visible at 500ms
    vi.advanceTimersByTime(500);
    fixture.detectChanges();
    expect(alert.hasAttribute('hidden')).toBe(false);

    // Hidden after 1000ms + exit animation
    vi.advanceTimersByTime(500);
    fixture.detectChanges();
    vi.advanceTimersByTime(1); // exit fallback
    fixture.detectChanges();
    expect(alert.hasAttribute('hidden')).toBe(true);
  });

  it('dismiss button hides the alert', () => {
    const state = createManualState<string>();
    state.setError('fail');
    const { fixture, alert, host } = setup();
    host.state.set(state);
    host.closable.set(true);
    flushAll(fixture);

    const closeBtn = alert.querySelector('cngx-close-button') as HTMLElement;
    expect(closeBtn).toBeTruthy();
    closeBtn.click();
    fixture.detectChanges();
    vi.advanceTimersByTime(1); // exit fallback
    fixture.detectChanges();

    expect(alert.hasAttribute('hidden')).toBe(true);
  });

  it('resets manual dismiss when error state arrives', () => {
    const state = createManualState<string>();
    state.setError('fail');
    const { fixture, alert, host } = setup();
    host.state.set(state);
    host.closable.set(true);
    flushAll(fixture);

    // Dismiss manually
    (alert.querySelector('cngx-close-button') as HTMLElement).click();
    flushAll(fixture);
    expect(alert.hasAttribute('hidden')).toBe(true);

    // Retry: loading -> new error. Status must actually change for effect to re-fire.
    state.set('loading');
    TestBed.flushEffects();
    fixture.detectChanges();

    state.setError('new error');
    TestBed.flushEffects();
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(alert.hasAttribute('hidden')).toBe(false);
  });

  // ── [when] boolean trigger ──────────────────────────────────

  it('shows when [when]=true', () => {
    const { fixture, alert, host } = setup();
    host.when.set(true);
    flushAll(fixture);
    expect(alert.hasAttribute('hidden')).toBe(false);
  });

  it('hides when [when]=false', () => {
    const { fixture, alert, host } = setup();
    host.when.set(false);
    flushAll(fixture);
    expect(alert.hasAttribute('hidden')).toBe(true);
  });

  it('[state] takes precedence over [when]', () => {
    const state = createManualState<string>();
    state.setError('err');
    const { fixture, alert, host } = setup();
    host.when.set(false);
    host.state.set(state);
    flushAll(fixture);
    // State says visible (error), when says hidden — state wins
    expect(alert.hasAttribute('hidden')).toBe(false);
  });

  // ── Pause-on-hover/focus ────────────────────────────────────

  it('pauses auto-dismiss on pointerenter, resumes on pointerleave', () => {
    const state = createManualState<string>();
    const { fixture, alert, host } = setup();
    host.autoDismissDelay.set(1000);
    host.state.set(state);
    flushAll(fixture);

    state.setSuccess('done');
    TestBed.flushEffects();
    fixture.detectChanges();
    vi.advanceTimersByTime(1); // enter fallback
    fixture.detectChanges();

    // Advance 500ms of the 1000ms timer
    vi.advanceTimersByTime(500);

    // Hover pauses
    alert.dispatchEvent(new PointerEvent('pointerenter'));
    fixture.detectChanges();

    // Advance past the remaining 500ms — should NOT dismiss
    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    expect(alert.hasAttribute('hidden')).toBe(false);

    // Leave resumes
    alert.dispatchEvent(new PointerEvent('pointerleave'));
    fixture.detectChanges();

    // Remaining ~500ms elapses
    vi.advanceTimersByTime(500);
    fixture.detectChanges();
    vi.advanceTimersByTime(1); // exit fallback
    fixture.detectChanges();
    expect(alert.hasAttribute('hidden')).toBe(true);
  });

  // ── Auto-collapse ───────────────────────────────────────────

  it('collapses after collapseDelay when collapsible', () => {
    const { fixture, alert, host } = setup();
    host.collapsible.set(true);
    host.collapseDelay.set(2000);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    // Enter animation fallback triggers onBecameVisible -> collapse timer starts
    vi.advanceTimersByTime(1);
    fixture.detectChanges();

    expect(alert.classList.contains('cngx-alert--collapsed')).toBe(false);

    vi.advanceTimersByTime(2000);
    fixture.detectChanges();
    expect(alert.classList.contains('cngx-alert--collapsed')).toBe(true);
  });

  it('expands on hover and restarts collapse timer on leave', () => {
    const { fixture, alert, host } = setup();
    host.collapsible.set(true);
    host.collapseDelay.set(1000);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    vi.advanceTimersByTime(1); // enter fallback
    fixture.detectChanges();

    // Wait for collapse
    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    expect(alert.classList.contains('cngx-alert--collapsed')).toBe(true);

    // Hover expands
    alert.dispatchEvent(new PointerEvent('pointerenter'));
    fixture.detectChanges();
    expect(alert.classList.contains('cngx-alert--collapsed')).toBe(false);

    // Leave restarts timer
    alert.dispatchEvent(new PointerEvent('pointerleave'));
    fixture.detectChanges();

    // Not collapsed yet
    vi.advanceTimersByTime(500);
    fixture.detectChanges();
    expect(alert.classList.contains('cngx-alert--collapsed')).toBe(false);

    // Collapsed after full delay
    vi.advanceTimersByTime(500);
    fixture.detectChanges();
    expect(alert.classList.contains('cngx-alert--collapsed')).toBe(true);
  });

  it('sets aria-expanded when collapsible', () => {
    const { fixture, alert, host } = setup();
    host.collapsible.set(true);
    host.collapseDelay.set(1000);
    flushAll(fixture);

    expect(alert.getAttribute('aria-expanded')).toBe('true');

    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    expect(alert.getAttribute('aria-expanded')).toBe('false');
  });

  // ── aria-atomic with actions ────────────────────────────────

  it('uses aria-atomic="true" by default', () => {
    const { fixture, alert } = setup();
    flushAll(fixture);
    expect(alert.getAttribute('aria-atomic')).toBe('true');
  });

  it('uses aria-atomic="false" when action is projected', () => {
    const { fixture, alert, host } = setup();
    host.showAction.set(true);
    flushAll(fixture);
    expect(alert.getAttribute('aria-atomic')).toBe('false');
  });

  // ── aria-busy for loading states ────────────────────────────

  it('sets aria-busy when state is loading', () => {
    const state = createManualState<string>();
    state.set('loading');
    const { fixture, alert, host } = setup();
    host.state.set(state);
    flushAll(fixture);
    expect(alert.getAttribute('aria-busy')).toBe('true');
  });

  it('clears aria-busy when state is not loading', () => {
    const state = createManualState<string>();
    state.setError('boom');
    const { fixture, alert, host } = setup();
    host.state.set(state);
    flushAll(fixture);
    expect(alert.getAttribute('aria-busy')).toBeNull();
  });

  // ── SR announcement ─────────────────────────────────────────

  it('announces "Alert dismissed" on dismiss', () => {
    const state = createManualState<string>();
    state.setError('fail');
    const { fixture, alert, host } = setup();
    host.state.set(state);
    host.closable.set(true);
    flushAll(fixture);

    (alert.querySelector('cngx-close-button') as HTMLElement).click();
    fixture.detectChanges();

    const srRegion = alert.querySelector('[aria-live]');
    expect(srRegion?.textContent).toContain('Alert dismissed');
  });
});
