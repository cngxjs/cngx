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

describe('CngxCopyText', () => {
  let writeTextSpy: ReturnType<typeof vi.fn>;

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

  afterEach(() => vi.useRealTimers());

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
});
