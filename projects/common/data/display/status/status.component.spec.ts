import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxStatus, type StatusTone } from './status.component';

@Component({
  template: `<cngx-status [tone]="tone()" [label]="label()" [live]="live()" />`,
  imports: [CngxStatus],
})
class TestHost {
  tone = signal<StatusTone>('neutral');
  label = signal<string | undefined>('Operational');
  live = signal<'off' | 'polite' | 'assertive'>('off');
}

describe('CngxStatus', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));
  afterEach(() => vi.restoreAllMocks());

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement.querySelector('cngx-status');
    return { fixture, el, host: fixture.componentInstance };
  }

  it('renders a distinct tone class and glyph per tone', () => {
    const { fixture, el, host } = setup();
    const cases: ReadonlyArray<[StatusTone, string]> = [
      ['success', '✓'],
      ['warning', '!'],
      ['danger', '✕'],
      ['info', 'i'],
      ['neutral', '•'],
    ];
    for (const [tone, glyph] of cases) {
      host.tone.set(tone);
      fixture.detectChanges();
      expect(el.classList.contains(`cngx-status--${tone}`)).toBe(true);
      expect(el.querySelector('.cngx-status__dot')!.textContent!.trim()).toBe(glyph);
    }
  });

  it('renders the label and keeps the dot decorative', () => {
    const { el } = setup();
    expect(el.querySelector('.cngx-status__label')!.textContent!.trim()).toBe('Operational');
    expect(el.querySelector('.cngx-status__dot')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('reflects aria-live from the input', () => {
    const { fixture, el, host } = setup();
    expect(el.getAttribute('aria-live')).toBe('off');
    host.live.set('assertive');
    fixture.detectChanges();
    expect(el.getAttribute('aria-live')).toBe('assertive');
  });

  it('warns in dev mode when no label and no external aria-label is present', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.label.set(undefined);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain('cngx-status');
  });

  it('does not warn when a label is present', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(warn).not.toHaveBeenCalled();
  });
});
