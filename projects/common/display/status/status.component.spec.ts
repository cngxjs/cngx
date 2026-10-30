import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  CNGX_ICON_CHECK,
  CNGX_ICON_EXCLAMATION_SOLID,
  CNGX_ICON_INFO,
  CNGX_ICON_QUESTION,
  CNGX_ICON_X,
  type CngxIconData,
} from '@cngx/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxStatus, type StatusTone } from './status.component';

function glyphPath(dot: Element): string | null | undefined {
  return dot.querySelector('svg.cngx-icon-svg > path')?.getAttribute('d');
}

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

@Component({
  template: `<cngx-status tone="danger" aria-label="Database down" />`,
  imports: [CngxStatus],
})
class AriaLabelOnlyHost {}

@Component({
  template: `<cngx-status tone="danger" aria-hidden="true" /> Degraded`,
  imports: [CngxStatus],
})
class HiddenDotHost {}

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
    const cases: ReadonlyArray<[StatusTone, CngxIconData]> = [
      ['success', CNGX_ICON_CHECK],
      ['warning', CNGX_ICON_EXCLAMATION_SOLID],
      ['danger', CNGX_ICON_X],
      ['info', CNGX_ICON_INFO],
      ['neutral', CNGX_ICON_QUESTION],
    ];
    for (const [tone, icon] of cases) {
      host.tone.set(tone);
      fixture.detectChanges();
      const dot = el.querySelector('.cngx-status__dot')!;
      expect(el.classList.contains(`cngx-status--${tone}`)).toBe(true);
      expect(glyphPath(dot)).toBe(icon.d);
      expect(dot.textContent!.trim()).toBe('');
    }
  });

  it('renders the label and keeps the dot decorative', () => {
    const { el } = setup();
    expect(el.querySelector('.cngx-status__label')!.textContent!.trim()).toBe('Operational');
    expect(el.querySelector('.cngx-status__dot')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('hides the glyph when [glyph]="false" but keeps the coloured dot', () => {
    const { fixture, el, host } = setup();
    host.tone.set('success');
    host.glyph.set(false);
    fixture.detectChanges();
    const dot = el.querySelector('.cngx-status__dot')!;
    expect(dot.querySelector('svg')).toBeNull();
    // No whitespace either, so the forced-colors `:empty` disc still matches.
    expect(dot.matches(':empty')).toBe(true);
    expect(el.classList.contains('cngx-status--success')).toBe(true);
    expect(dot.getAttribute('aria-hidden')).toBe('true');
  });

  it('coerces the glyph attribute via booleanAttribute (bare shows, "false" hides)', () => {
    const fixture = TestBed.createComponent(AttrHost);
    fixture.detectChanges();
    const dots = fixture.nativeElement.querySelectorAll('.cngx-status__dot');
    expect(glyphPath(dots[0])).toBe(CNGX_ICON_CHECK.d);
    expect(dots[1].querySelector('svg')).toBeNull();
  });

  it('warns in dev mode when the glyph is hidden and no visible label is set', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.glyph.set(false);
    fixture.componentInstance.label.set(undefined);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(warn.mock.calls.some((c) => /^CNGX1017: \[cngx-status\] \[glyph\]="false"/.test(String(c[0])))).toBe(true);
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
    expect(warn.mock.calls[0][0]).toMatch(/^CNGX1016: \[cngx-status\] no `label`; /);
  });

  it('warns CNGX1016 for an aria-label on the role-less host, which is no valid name', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(AriaLabelOnlyHost);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(warn.mock.calls.filter((c) => /^CNGX1016: /.test(String(c[0])))).toHaveLength(1);
  });

  it('does not warn CNGX1016 for a host hidden with aria-hidden="true"', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(HiddenDotHost);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(warn.mock.calls.some((c) => /^CNGX1016: /.test(String(c[0])))).toBe(false);
  });

  it('does not warn when a label is present', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(warn).not.toHaveBeenCalled();
  });
});
