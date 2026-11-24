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
