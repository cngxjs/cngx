import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxCopyValue } from './copy-value.directive';
import { provideInputConfig, withCopyResetDelay } from './input-config';

@Component({
  template: `<button [cngxCopyValue]="'test-value'" #cp="cngxCopyValue">Copy</button>`,
  imports: [CngxCopyValue],
})
class Host {
  readonly directive = viewChild.required(CngxCopyValue);
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  TestBed.flushEffects();
  const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  const directive = fixture.componentInstance.directive();
  return { fixture, button, directive };
}

describe('CngxCopyValue', () => {
  it('should be created', () => {
    const { directive } = setup();
    expect(directive).toBeTruthy();
  });

  it('should start with copied = false', () => {
    const { directive } = setup();
    expect(directive.copied()).toBe(false);
  });

  it('should expose copy() method', () => {
    const { directive } = setup();
    expect(typeof directive.copy).toBe('function');
  });

  describe('resetTimer race-guard', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('back-to-back copy() schedules a single fresh reset; first timer no-ops', async () => {
      const { directive, fixture } = setup();

      await directive.copy();
      TestBed.flushEffects();
      expect(directive.copied()).toBe(true);

      // Mid-window: second copy() before resetDelay elapses.
      vi.advanceTimersByTime(500);
      await directive.copy();
      TestBed.flushEffects();
      expect(directive.copied()).toBe(true);

      // Original reset would have fired at T=2000; the race-guard makes it a no-op.
      vi.advanceTimersByTime(1500);
      fixture.detectChanges();
      expect(directive.copied()).toBe(true);

      // Second reset fires at T=2500 (500ms after second copy + 2000ms delay).
      vi.advanceTimersByTime(1000);
      fixture.detectChanges();
      expect(directive.copied()).toBe(false);
    });
  });

  describe('config fallback (withCopyResetDelay)', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('honours copyResetDelay from global config when no [resetDelay] binding is set', async () => {
      TestBed.configureTestingModule({
        providers: [provideInputConfig(withCopyResetDelay(5000))],
      });
      const { directive, fixture } = setup();

      await directive.copy();
      TestBed.flushEffects();
      expect(directive.copied()).toBe(true);

      // Under the old literal 2000 default the flag would already be false here;
      // the config fallback keeps it true until t=5000.
      vi.advanceTimersByTime(2000);
      fixture.detectChanges();
      expect(directive.copied()).toBe(true);

      vi.advanceTimersByTime(3000);
      fixture.detectChanges();
      expect(directive.copied()).toBe(false);
    });
  });
});
