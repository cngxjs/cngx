import { ApplicationRef, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxDialogOpener, provideDialog } from './dialog.service';

// jsdom versions differ in HTMLDialogElement support; the outlet's <dialog>
// is created dynamically, so the missing methods are polyfilled on the
// prototype before the opener can call them.
beforeEach(() => {
  const proto = HTMLDialogElement.prototype as unknown as Record<string, unknown>;
  proto['showModal'] ??= function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  proto['show'] ??= function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  proto['close'] ??= function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
});

@Component({
  template: `<p id="dialog-content">content</p>`,
})
class TestContent {}

function createOpener(): CngxDialogOpener {
  TestBed.configureTestingModule({ providers: [provideDialog()] });
  return TestBed.inject(CngxDialogOpener);
}

describe('CngxDialogOpener', () => {
  it('opens a component dialog attached to body and removes it after close', () => {
    const opener = createOpener();
    const ref = opener.open<number>(TestContent);

    expect(document.body.querySelector('cngx-dialog-outlet')).not.toBeNull();
    expect(document.body.querySelector('#dialog-content')).not.toBeNull();

    ref.close(1);
    TestBed.flushEffects();

    expect(ref.result()).toBe(1);
    expect(document.body.querySelector('cngx-dialog-outlet')).toBeNull();
  });

  it('runs cleanup exactly once per open (the close-watcher effect is destroyed)', () => {
    const opener = createOpener();
    const detachSpy = vi.spyOn(TestBed.inject(ApplicationRef), 'detachView');
    const ref = opener.open<number>(TestContent);

    ref.close(1);
    TestBed.flushEffects();
    // A surviving close-watcher effect would re-enter cleanup on the next
    // flush; a destroyed one cannot.
    TestBed.flushEffects();

    expect(document.body.querySelector('cngx-dialog-outlet')).toBeNull();
    expect(detachSpy).toHaveBeenCalledTimes(1);
  });

  describe('programmatic parity with the declarative surface', () => {
    async function settle(): Promise<void> {
      await new Promise((resolve) => setTimeout(resolve, 0));
      TestBed.flushEffects();
    }

    // The outlet's inputs reach the inner cngxDialog via template bindings,
    // which propagate on the next change-detection tick - in production that
    // tick precedes any user interaction; the harness runs it explicitly.
    function tick(): void {
      TestBed.inject(ApplicationRef).tick();
    }

    it('runs the configured submitAction and exposes submitState on the ref', async () => {
      const opener = createOpener();
      let resolveFn!: () => void;
      const submitFn = vi.fn().mockReturnValue(new Promise<void>((resolve) => (resolveFn = resolve)));
      const ref = opener.open<number>(TestContent, { submitAction: submitFn });
      tick();

      ref.close(7);
      expect(submitFn).toHaveBeenCalledWith(7);
      expect(ref.submitState.status()).toBe('pending');

      resolveFn();
      await settle();

      expect(ref.submitState.status()).toBe('success');
      expect(ref.result()).toBe(7);
      expect(document.body.querySelector('cngx-dialog-outlet')).toBeNull();
    });

    it('keeps the dialog open and reports the error on submit failure', async () => {
      const opener = createOpener();
      const ref = opener.open<number>(TestContent, {
        submitAction: () => Promise.reject(new Error('fail')),
      });
      tick();

      ref.close(7);
      await settle();

      expect(ref.submitState.status()).toBe('error');
      expect(ref.submitState.error()).toBeInstanceOf(Error);
      expect(document.body.querySelector('cngx-dialog-outlet')).not.toBeNull();

      ref.dismiss();
      await settle();
    });

    it('submitState stays idle without a submitAction', () => {
      const opener = createOpener();
      const ref = opener.open<number>(TestContent);
      expect(ref.submitState.status()).toBe('idle');
      ref.close(1);
      TestBed.flushEffects();
    });

    it('forwards the error flag to the dialog host', () => {
      const opener = createOpener();
      const ref = opener.open(TestContent, { error: true });
      tick();

      const dialogEl = document.body.querySelector('dialog') as HTMLDialogElement;
      expect(dialogEl.classList.contains('cngx-dialog--error')).toBe(true);

      ref.dismiss();
      TestBed.flushEffects();
    });

    it('returns focus to the configured fallback when the trigger is gone', () => {
      const opener = createOpener();
      const trigger = document.createElement('button');
      const fallback = document.createElement('button');
      document.body.appendChild(trigger);
      document.body.appendChild(fallback);
      trigger.focus();
      try {
        const ref = opener.open(TestContent, { focusFallback: fallback });
        tick();
        trigger.remove();

        ref.dismiss();
        TestBed.flushEffects();

        expect(document.activeElement).toBe(fallback);
      } finally {
        trigger.remove();
        fallback.remove();
      }
    });
  });

  it('closeAll dismisses every open dialog', () => {
    const opener = createOpener();
    opener.open(TestContent);
    opener.open(TestContent);
    expect(document.body.querySelectorAll('cngx-dialog-outlet').length).toBe(2);

    opener.closeAll();
    TestBed.flushEffects();

    expect(document.body.querySelectorAll('cngx-dialog-outlet').length).toBe(0);
  });
});
