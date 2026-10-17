import { ApplicationRef, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxDialogOpener, CngxDialogRef, provideDialog } from './dialog.service';
import { CngxDialogStack } from './dialog-stack';
import { CngxDialogTitle } from './dialog-title.directive';
import { CngxDialogDescription } from './dialog-description.directive';

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

@Component({
  template: `
    <h2 cngxDialogTitle>Programmatic Title</h2>
    <p cngxDialogDescription>Programmatic Description</p>
  `,
  imports: [CngxDialogTitle, CngxDialogDescription],
})
class LabelledContent {}

@Component({
  template: `<p>never rendered</p>`,
})
class ThrowingContent {
  ngOnInit(): void {
    throw new Error('content init failed');
  }
}

@Component({
  template: `<p>never rendered</p>`,
})
class ThrowingConstructorContent {
  constructor() {
    throw new Error('content constructor failed');
  }
}

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

  it('exposes the inner dialog identity on the ref', () => {
    const opener = createOpener();
    const ref = opener.open<number>(TestContent);
    expect(ref.id()).toMatch(/^cngx-dialog-\d+$/);
    ref.close(1);
    TestBed.flushEffects();
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

    // open() applies the outlet's bindings once before the dialog opens; the
    // rest of the view (content bindings, values set after open) settles on
    // the next change-detection tick, which the harness runs explicitly.
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

    it('labels the dialog from content directives in the dynamic view', () => {
      const opener = createOpener();
      const ref = opener.open(LabelledContent);
      tick();

      const dialogEl = document.body.querySelector('dialog') as HTMLDialogElement;
      const labelledBy = dialogEl.getAttribute('aria-labelledby');
      const describedBy = dialogEl.getAttribute('aria-describedby');

      // Same id convention as the declarative path: `${dialogId}-title/-desc`.
      expect(labelledBy).toBe(`${ref.id()}-title`);
      expect(describedBy).toBe(`${ref.id()}-desc`);
      expect(document.getElementById(labelledBy!)?.textContent).toBe('Programmatic Title');
      expect(document.getElementById(describedBy!)?.textContent).toBe('Programmatic Description');

      ref.dismiss();
      TestBed.flushEffects();
    });

    it('announces the programmatic title via the live region on open', async () => {
      const opener = createOpener();
      const ref = opener.open(LabelledContent);
      tick();

      // open() promotes 'opening' -> 'open' on the next animation frame.
      await new Promise((resolve) => requestAnimationFrame(resolve));
      TestBed.flushEffects();

      const liveRegion = document.body.querySelector(
        'dialog [aria-live="polite"]',
      ) as HTMLElement;
      expect(liveRegion.textContent).toBe('Programmatic Title');

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

  describe('modal flag', () => {
    function dialogEl(): HTMLDialogElement {
      return document.body.querySelector('dialog') as HTMLDialogElement;
    }

    async function reachOpen(): Promise<void> {
      TestBed.inject(ApplicationRef).tick();
      await new Promise((resolve) => requestAnimationFrame(resolve));
      TestBed.flushEffects();
    }

    it('opens with show(), not showModal(), when the config says modal: false', () => {
      const opener = createOpener();
      const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockClear();
      const show = vi.spyOn(HTMLDialogElement.prototype, 'show').mockClear();

      const ref = opener.open(TestContent, { modal: false });
      TestBed.inject(ApplicationRef).tick();

      expect(show).toHaveBeenCalledTimes(1);
      expect(showModal).not.toHaveBeenCalled();
      expect(dialogEl().getAttribute('aria-modal')).toBeNull();

      ref.dismiss();
      TestBed.flushEffects();
    });

    it('stays modal by default', () => {
      const opener = createOpener();
      const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockClear();
      const show = vi.spyOn(HTMLDialogElement.prototype, 'show').mockClear();

      const ref = opener.open(TestContent);
      TestBed.inject(ApplicationRef).tick();

      expect(showModal).toHaveBeenCalledTimes(1);
      expect(show).not.toHaveBeenCalled();
      expect(dialogEl().getAttribute('aria-modal')).toBe('true');

      ref.dismiss();
      TestBed.flushEffects();
    });

    it('warns CNGX1015 for an untitled non-modal opener dialog', async () => {
      const opener = createOpener();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      warnSpy.mockClear();

      const ref = opener.open(TestContent, { modal: false });
      await reachOpen();

      const calls = warnSpy.mock.calls.filter(([m]) => /^CNGX1015: /.test(String(m)));
      expect(calls).toHaveLength(1);
      expect(calls[0][0]).toMatch(
        new RegExp(`^CNGX1015: \\[cngxDialog\\] non-modal dialog "${ref.id()}" opened without a title\\. `),
      );

      ref.dismiss();
      TestBed.flushEffects();
    });

    it('does not warn CNGX1015 for a titled non-modal opener dialog', async () => {
      const opener = createOpener();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      warnSpy.mockClear();

      const ref = opener.open(LabelledContent, { modal: false });
      await reachOpen();

      expect(warnSpy.mock.calls.some(([m]) => /^CNGX1015: /.test(String(m)))).toBe(false);

      ref.dismiss();
      TestBed.flushEffects();
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

  it.each([
    ['on its first render', ThrowingContent, 'content init failed'],
    ['in its constructor', ThrowingConstructorContent, 'content constructor failed'],
  ])('leaves no outlet and no ref behind when the content throws %s', (_, content, message) => {
    const opener = createOpener();

    expect(() => opener.open(content)).toThrow(message);
    expect(document.body.querySelector('cngx-dialog-outlet')).toBeNull();

    const dismiss = vi.spyOn(CngxDialogRef.prototype, 'dismiss');
    opener.open(TestContent);
    opener.closeAll();
    TestBed.flushEffects();

    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(document.body.querySelector('cngx-dialog-outlet')).toBeNull();
    dismiss.mockRestore();
  });

  it.each([
    ['in showModal()', () => vi.spyOn(HTMLDialogElement.prototype, 'showModal')],
    ['after the scroll lock', () => vi.spyOn(CngxDialogStack.prototype, 'push')],
  ])('releases the scroll lock and the stack when the dialog open throws %s', (_, target) => {
    const opener = createOpener();
    const stack = TestBed.inject(CngxDialogStack);
    const html = document.documentElement;
    const overflow = html.style.overflow;
    const fail = target().mockImplementationOnce(() => {
      throw new Error('open failed');
    });

    expect(() => opener.open(TestContent)).toThrow('open failed');
    expect(document.body.querySelector('cngx-dialog-outlet')).toBeNull();
    expect(stack.stack()).toEqual([]);
    expect(html.style.overflow).toBe(overflow);

    fail.mockRestore();
    const ref = opener.open(TestContent);
    expect(stack.stack()).toEqual([ref.id()]);
    opener.closeAll();
    TestBed.flushEffects();
    expect(stack.stack()).toEqual([]);
    expect(html.style.overflow).toBe(overflow);
  });
});
