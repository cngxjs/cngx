import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxStatus, type StatusTone } from './status.component';

@Component({
  template: `<cngx-status [tone]="tone()" [label]="label()" [live]="live()" [glyph]="glyph()" />`,
  imports: [CngxStatus],
})
class TestHost {
  tone = signal<StatusTone>('neutral');
  label = signal<string | undefined>('Operational');
  live = signal<'off' | 'polite' | 'assertive'>('off');
  glyph = signal<boolean>(true);
}

@Component({
  template: `
    <cngx-status tone="success" label="Bare" glyph />
    <cngx-status tone="success" label="String-false" glyph="false" />
  `,
  imports: [CngxStatus],
})
class AttrHost {}

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

  it('hides the glyph char when [glyph]="false" but keeps the coloured dot', () => {
    const { fixture, el, host } = setup();
    host.tone.set('success');
    host.glyph.set(false);
    fixture.detectChanges();
    const dot = el.querySelector('.cngx-status__dot')!;
    expect(dot.textContent!.trim()).toBe('');
    expect(el.classList.contains('cngx-status--success')).toBe(true);
    expect(dot.getAttribute('aria-hidden')).toBe('true');
  });

  it('coerces the glyph attribute via booleanAttribute (bare shows, "false" hides)', () => {
    const fixture = TestBed.createComponent(AttrHost);
    fixture.detectChanges();
    const dots = fixture.nativeElement.querySelectorAll('.cngx-status__dot');
    expect(dots[0].textContent!.trim()).toBe('✓');
    expect(dots[1].textContent!.trim()).toBe('');
  });

  it('warns in dev mode when the glyph is hidden and no visible label is set', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.glyph.set(false);
    fixture.componentInstance.label.set(undefined);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(warn.mock.calls.some((c) => String(c[0]).includes('[glyph]="false"'))).toBe(true);
  });

  it('does not warn colour-only when the glyph is hidden but a label is present', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.glyph.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(warn).not.toHaveBeenCalled();
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
