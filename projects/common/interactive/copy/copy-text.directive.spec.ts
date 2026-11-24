import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxCopyText } from './copy-text.directive';

@Component({
  template: `<button [cngxCopyText]="'hello world'" #cp="cngxCopyText">Copy</button>`,
  imports: [CngxCopyText],
})
class TestHost {}

// `isolate: false` shares one environment per project and the setup file
// only unstubs `vi.stubGlobal`, so a defineProperty on navigator survives.
const clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

function restoreClipboard(): void {
  if (clipboardDescriptor) {
    Object.defineProperty(navigator, 'clipboard', clipboardDescriptor);
  } else {
    delete (navigator as unknown as Record<string, unknown>)['clipboard'];
  }
}

describe('CngxCopyText', () => {
  let writeTextSpy: ReturnType<typeof vi.fn>;

  afterEach(restoreClipboard);

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ imports: [TestHost] });

    writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextSpy },
      writable: true,
      configurable: true,
    });
  });

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.directive(CngxCopyText));
    const dir = button.injector.get(CngxCopyText);
    return { fixture, button, dir };
  }

  it('starts with copied=false', () => {
    const { dir } = setup();
    expect(dir.copied()).toBe(false);
  });

  it('sets copied=true after click', async () => {
    const { dir } = setup();
    await dir.copy();
    expect(dir.copied()).toBe(true);
  });

  it('resets copied after resetDelay', async () => {
    const { dir } = setup();
    await dir.copy();
    expect(dir.copied()).toBe(true);

    vi.advanceTimersByTime(2000);
    expect(dir.copied()).toBe(false);
  });

  it('calls clipboard.writeText with the text', async () => {
    const { dir } = setup();
    await dir.copy();
    expect(writeTextSpy).toHaveBeenCalledWith('hello world');
  });

  it('reports supported=true when clipboard API exists', () => {
    const { dir } = setup();
    expect(dir.supported).toBe(true);
  });

  describe('outcome state', () => {
    it('switches a copied state to failed when a later write rejects', async () => {
      const { dir } = setup();
      await dir.copy();
      vi.advanceTimersByTime(500);

      writeTextSpy.mockRejectedValueOnce(new Error('denied'));
      await dir.copy();
      expect(dir.copied()).toBe(false);
      expect(dir.failed()).toBe(true);
      expect(vi.getTimerCount()).toBe(1);

      // The first copy's timer would have fired here; the failure owns the clock now.
      vi.advanceTimersByTime(1500);
      expect(dir.failed()).toBe(true);

      vi.advanceTimersByTime(500);
      expect(dir.copied()).toBe(false);
      expect(dir.failed()).toBe(false);
    });

    it('switches a failed state to copied on the next successful write', async () => {
      const { dir } = setup();
      writeTextSpy.mockRejectedValueOnce(new Error('denied'));
      await dir.copy();
      expect(dir.failed()).toBe(true);

      await dir.copy();
      expect(dir.failed()).toBe(false);
      expect(dir.copied()).toBe(true);
      expect(vi.getTimerCount()).toBe(1);
    });

    it('carries the rejection reason and resets failed after resetDelay', async () => {
      const { dir } = setup();
      const reason = new Error('denied');
      const copyFailed = vi.fn();
      dir.copyFailed.subscribe(copyFailed);
      writeTextSpy.mockRejectedValueOnce(reason);

      await dir.copy();
      expect(dir.failed()).toBe(true);
      expect(dir.copied()).toBe(false);
      expect(copyFailed).toHaveBeenCalledWith(reason);

      vi.advanceTimersByTime(2000);
      expect(dir.failed()).toBe(false);
      expect(vi.getTimerCount()).toBe(0);
    });

    it('keeps copied through a repeat copy and restarts the delay', async () => {
      const { dir } = setup();
      await dir.copy();
      vi.advanceTimersByTime(1500);

      await dir.copy();
      expect(dir.copied()).toBe(true);
      expect(vi.getTimerCount()).toBe(1);

      vi.advanceTimersByTime(1000);
      expect(dir.copied()).toBe(true);

      vi.advanceTimersByTime(1000);
      expect(dir.copied()).toBe(false);
    });
  });

  describe('after destroy', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    function deferredWrite() {
      let settle!: { resolve: () => void; reject: (reason: unknown) => void };
      writeTextSpy.mockImplementationOnce(
        () => new Promise<void>((resolve, reject) => (settle = { resolve, reject })),
      );
      return () => settle;
    }

    it('drops a write that resolves after destroy', async () => {
      const settle = deferredWrite();
      const { fixture, dir } = setup();
      const didCopy = vi.fn();
      dir.didCopy.subscribe(didCopy);

      const pending = dir.copy();
      fixture.destroy();
      settle().resolve();
      await pending;

      expect(didCopy).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('drops a write that rejects after destroy', async () => {
      const settle = deferredWrite();
      const { fixture, dir } = setup();
      const copyFailed = vi.fn();
      dir.copyFailed.subscribe(copyFailed);

      const pending = dir.copy();
      fixture.destroy();
      settle().reject(new Error('denied'));
      await pending;

      expect(copyFailed).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('fallback', () => {
    const execDescriptor = Object.getOwnPropertyDescriptor(document, 'execCommand');
    let execResult: boolean;
    let textareaInBodyDuringCopy: boolean;

    beforeEach(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      execResult = true;
      textareaInBodyDuringCopy = false;
      Object.defineProperty(document, 'execCommand', {
        value: vi.fn(() => {
          textareaInBodyDuringCopy = document.body.querySelector('textarea') !== null;
          return execResult;
        }),
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      if (execDescriptor) {
        Object.defineProperty(document, 'execCommand', execDescriptor);
      } else {
        delete (document as unknown as Record<string, unknown>)['execCommand'];
      }
    });

    function subscribeOutputs(dir: CngxCopyText) {
      const didCopy = vi.fn();
      const copyFailed = vi.fn();
      dir.didCopy.subscribe(didCopy);
      dir.copyFailed.subscribe(copyFailed);
      return { didCopy, copyFailed };
    }

    it('reports a refused execCommand as failed and emits copyFailed with undefined', async () => {
      execResult = false;
      const { dir } = setup();
      expect(dir.supported).toBe(false);
      const { didCopy, copyFailed } = subscribeOutputs(dir);

      await dir.copy();

      expect(dir.copied()).toBe(false);
      expect(dir.failed()).toBe(true);
      expect(copyFailed).toHaveBeenCalledTimes(1);
      expect(copyFailed).toHaveBeenCalledWith(undefined);
      expect(didCopy).not.toHaveBeenCalled();
      expect(textareaInBodyDuringCopy).toBe(true);
      expect(document.body.querySelector('textarea')).toBeNull();
    });

    it('reports an accepted execCommand as copied', async () => {
      const { dir } = setup();
      const { didCopy, copyFailed } = subscribeOutputs(dir);

      await dir.copy();

      expect(dir.copied()).toBe(true);
      expect(dir.failed()).toBe(false);
      expect(didCopy).toHaveBeenCalledWith('hello world');
      expect(copyFailed).not.toHaveBeenCalled();
      expect(document.body.querySelector('textarea')).toBeNull();
    });
  });
});
