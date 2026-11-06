import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CNGX_FEEDBACK_I18N, type CngxFeedbackI18n } from '../config/feedback-i18n';
import { CngxToaster, provideToasts } from './toast.service';
import { CngxToastOutlet } from './toast-outlet';

@Component({
  template: `<cngx-toast-outlet />`,
  imports: [CngxToastOutlet],
})
class TestHost {}

describe('CngxToastOutlet', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [provideToasts()],
    });
  });

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const outletEl: HTMLElement = fixture.nativeElement.querySelector('cngx-toast-outlet');
    return { fixture, outletEl };
  }

  it('renders with the cngx-toast-outlet host class and Notifications landmark', () => {
    const { outletEl } = setup();
    expect(outletEl.classList.contains('cngx-toast-outlet')).toBe(true);
    expect(outletEl.getAttribute('role')).toBe('region');
    expect(outletEl.getAttribute('aria-label')).toBe('Notifications');
  });

  it('pins the dismiss close-button with flex-shrink: 0 to survive narrow widths', () => {
    setup();

    const styleText = Array.from(document.querySelectorAll('style'))
      .map((node) => node.textContent ?? '')
      .join('\n');
    expect(styleText).toMatch(/\.cngx-toast__dismiss\s*\{[^}]*flex-shrink:\s*0/);
  });

  it('keeps a shown repeat marker on a copy flip and uses the new copy on the next repeat', () => {
    // The public token type is a plain bundle; a Signal-carrying value exercises the
    // reactive-ready read path the follow-up program switches on.
    const copy = signal<Partial<CngxFeedbackI18n>>({});
    TestBed.overrideProvider(CNGX_FEEDBACK_I18N, { useValue: copy as unknown as CngxFeedbackI18n });
    const { fixture, outletEl } = setup();
    const toaster = fixture.debugElement.children[0].injector.get(CngxToaster);
    const countText = (): string | undefined =>
      outletEl.querySelector('.cngx-toast__count')?.textContent?.trim();

    toaster.show({ message: 'Saved' });
    toaster.show({ message: 'Saved' });
    fixture.detectChanges();
    expect(countText()).toBe('(x2)');

    copy.set({ toastRepeatCount: (count) => `${count}-mal` });
    fixture.detectChanges();
    expect(countText()).toBe('(x2)');

    toaster.show({ message: 'Saved' });
    fixture.detectChanges();
    expect(countText()).toBe('3-mal');
  });

  it('does not re-announce on a language flip', () => {
    const copy = signal<Partial<CngxFeedbackI18n>>({});
    TestBed.overrideProvider(CNGX_FEEDBACK_I18N, { useValue: copy });
    const { fixture, outletEl } = setup();
    const toaster = fixture.debugElement.children[0].injector.get(CngxToaster);
    const dismissLabels = (): (string | null)[] =>
      Array.from(outletEl.querySelectorAll('button.cngx-toast__dismiss')).map((b) =>
        b.getAttribute('aria-label'),
      );
    toaster.show({ message: 'Saved' });
    fixture.detectChanges();
    expect(dismissLabels()).toEqual(['Dismiss']);

    copy.set({ dismissLabel: 'Schliessen', notificationsRegionLabel: 'Meldungen' });
    fixture.detectChanges();
    expect(dismissLabels()).toEqual(['Dismiss']);
    expect(outletEl.getAttribute('aria-label')).toBe('Meldungen');

    toaster.show({ message: 'Sent' });
    fixture.detectChanges();
    expect(dismissLabels()).toEqual(['Schliessen', 'Schliessen']);
  });

  describe('timer hooks', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    async function render(fixture: ReturnType<typeof setup>['fixture']): Promise<void> {
      await Promise.resolve();
      fixture.detectChanges();
    }

    function timerSetup() {
      const { fixture, outletEl } = setup();
      const toaster = fixture.debugElement.children[0].injector.get(CngxToaster);
      const toastEl = (index = 0): HTMLElement =>
        outletEl.querySelectorAll<HTMLElement>('.cngx-toast')[index];
      const timerEl = (index = 0): HTMLElement | null =>
        toastEl(index)?.querySelector('.cngx-toast__timer') ?? null;
      const prop = (name: string, index = 0): string => toastEl(index).style.getPropertyValue(name);
      return { fixture, outletEl, toaster, toastEl, timerEl, prop };
    }

    it('marks a timed toast running and leaves persistent and error toasts unmarked', async () => {
      const { fixture, toaster, toastEl, timerEl } = timerSetup();
      toaster.show({ message: 'Error', severity: 'error' });
      toaster.show({ message: 'Pinned', duration: 'persistent' });
      toaster.show({ message: 'Timed', duration: 5000 });
      await render(fixture);

      expect(toastEl(0).getAttribute('data-timer')).toBe('running');
      expect(timerEl(0)).not.toBeNull();
      for (const index of [1, 2]) {
        expect(toastEl(index).hasAttribute('data-timer')).toBe(false);
        expect(toastEl(index).style.getPropertyValue('--cngx-toast-timer-duration')).toBe('');
        expect(timerEl(index)).toBeNull();
      }
    });

    it('flips to paused on pointerenter and back on pointerleave', async () => {
      const { fixture, toaster, toastEl } = timerSetup();
      toaster.show({ message: 'Hover me', duration: 5000 });
      await render(fixture);

      toastEl().dispatchEvent(new Event('pointerenter'));
      await render(fixture);
      expect(toastEl().getAttribute('data-timer')).toBe('paused');

      toastEl().dispatchEvent(new Event('pointerleave'));
      await render(fixture);
      expect(toastEl().getAttribute('data-timer')).toBe('running');
    });

    it('carries the total and the negative elapsed time as custom properties', async () => {
      const { fixture, toaster, toastEl, prop } = timerSetup();
      toaster.show({ message: 'Clock', duration: 5000 });
      await render(fixture);
      expect(prop('--cngx-toast-timer-duration')).toBe('5000ms');
      expect(prop('--cngx-toast-timer-offset')).toBe('0ms');

      vi.advanceTimersByTime(2000);
      toastEl().dispatchEvent(new Event('pointerenter'));
      await render(fixture);
      expect(prop('--cngx-toast-timer-duration')).toBe('5000ms');
      expect(prop('--cngx-toast-timer-offset')).toBe('-2000ms');
      expect(toastEl().getAttribute('data-timer')).toBe('paused');

      toastEl().dispatchEvent(new Event('pointerleave'));
      vi.advanceTimersByTime(2999);
      expect(toaster.toasts().length).toBe(1);
      vi.advanceTimersByTime(1);
      expect(toaster.toasts().length).toBe(0);
    });

    it('re-creates the timer element on pause, dedup restart and release', async () => {
      const { fixture, toaster, toastEl, timerEl } = timerSetup();
      toaster.show({ message: 'Again', duration: 5000 });
      await render(fixture);
      const started = timerEl();

      toastEl().dispatchEvent(new Event('pointerenter'));
      await render(fixture);
      const paused = timerEl();
      expect(paused).not.toBe(started);

      toaster.show({ message: 'Again', duration: 5000 });
      await render(fixture);
      const restarted = timerEl();
      expect(restarted).not.toBe(paused);
      expect(toaster.toasts().length).toBe(1);

      toastEl().dispatchEvent(new Event('pointerleave'));
      await render(fixture);
      expect(timerEl()).not.toBe(restarted);
      expect(timerEl()).not.toBeNull();
    });

    it('hides the timer element from assistive technology', async () => {
      const { fixture, toaster, timerEl } = timerSetup();
      toaster.show({ message: 'Quiet', duration: 5000 });
      await render(fixture);
      expect(timerEl()?.getAttribute('aria-hidden')).toBe('true');
    });

    it('survives the dismissal of a focused toast without a render-pass signal write', async () => {
      const { fixture, toaster, toastEl } = timerSetup();
      toaster.show({
        message: 'Undo me',
        duration: 5000,
        action: { label: 'Undo', handler: () => undefined },
      });
      await render(fixture);
      const removed = toastEl();
      removed.querySelector<HTMLButtonElement>('.cngx-toast__action')!.focus();
      const id = toaster.toasts()[0].id;

      toaster.dismiss(id);
      expect(() => fixture.detectChanges()).not.toThrow();
      removed.dispatchEvent(new FocusEvent('focusout'));
      expect(() => fixture.detectChanges()).not.toThrow();
      await render(fixture);
      expect(toaster.timerSegments().has(id)).toBe(false);
    });

    it('survives the maxVisible eviction of a focused toast', async () => {
      const { fixture, toaster, toastEl } = timerSetup();
      toaster.show({
        message: 'Oldest',
        duration: 5000,
        action: { label: 'Undo', handler: () => undefined },
      });
      await render(fixture);
      const evicted = toastEl();
      evicted.querySelector<HTMLButtonElement>('.cngx-toast__action')!.focus();

      toaster.show({ message: 'Second', duration: 5000 });
      toaster.show({ message: 'Third', duration: 5000 });
      toaster.show({ message: 'Fourth', duration: 5000 });
      expect(() => fixture.detectChanges()).not.toThrow();
      evicted.dispatchEvent(new FocusEvent('focusout'));
      expect(() => fixture.detectChanges()).not.toThrow();
      await render(fixture);
      expect(evicted.isConnected).toBe(false);
    });
  });
});
