import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CngxAsyncClick } from '@cngx/common/interactive';
import { CNGX_LOADING_DEFAULTS } from '@cngx/core/utils';
import { vi } from 'vitest';

import { provideButtonConfig, withButtonVariant } from './button-config';
import { CNGX_BUTTON_STATE } from './button-state.token';
import { CngxIconButton } from './icon-button.component';

@Component({
  template: `
    <button id="named" cngxIconButton aria-label="Delete row">x</button>
    <button id="titled" cngxIconButton title="Delete row">x</button>
    <span id="lbl">Delete row</span>
    <button id="labelled" cngxIconButton aria-labelledby="lbl">x</button>
    <button id="solid" cngxIconButton="solid" aria-label="Save">s</button>
    <a id="anchor" cngxIconButton href="#x" aria-label="Open">o</a>
    <button
      id="disabled"
      cngxIconButton
      aria-label="Delete row"
      [disabled]="disabled()"
      disabledReason="Read only"
      (click)="clicks = clicks + 1"
    >x</button>
  `,
  imports: [CngxIconButton],
})
class NamedHost {
  readonly disabled = signal(true);
  clicks = 0;
}

@Component({
  template: `<button id="unnamed" cngxIconButton>x</button>`,
  imports: [CngxIconButton],
})
class UnnamedHost {}

@Component({
  template: `
    <button id="img" cngxIconButton aria-label="Delete row"><img alt="Trash can" src="data:," /></button>
    <button id="ligature" cngxIconButton aria-label="Delete row"><span class="material-icons">delete</span></button>
  `,
  imports: [CngxIconButton],
})
class GlyphHost {}

@Component({
  template: `<button id="gated" cngxIconButton aria-label="Run" [cngxAsyncClick]="run"></button>`,
  imports: [CngxIconButton, CngxAsyncClick],
})
class GatedAsyncHost {
  release: () => void = () => undefined;
  readonly run = (): Promise<void> => new Promise<void>((resolve) => (this.release = resolve));
}

function render<T>(type: new () => T) {
  const fixture = TestBed.createComponent(type);
  fixture.detectChanges();
  TestBed.flushEffects();
  const el = fixture.nativeElement as HTMLElement;
  return { fixture, host: fixture.componentInstance, q: (s: string) => el.querySelector(s) as HTMLElement };
}

describe('CngxIconButton', () => {
  it('gates the busy layer of a co-hosted cngxAsyncClick behind the loading config', async () => {
    vi.useFakeTimers();
    const { fixture, host, q } = render(GatedAsyncHost);
    const btn = q('#gated');
    const advance = async (ms: number): Promise<void> => {
      await vi.advanceTimersByTimeAsync(ms);
      fixture.detectChanges();
      TestBed.flushEffects();
    };

    btn.click();
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(btn.getAttribute('aria-busy')).toBe('true');
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    expect(btn.getAttribute('data-pending')).toBe('true');
    expect(btn.hasAttribute('data-busy')).toBe(false);
    expect(btn.querySelector('.cngx-button__busy')).toBeNull();

    await advance(CNGX_LOADING_DEFAULTS.showDelay);
    expect(btn.getAttribute('data-busy')).toBe('true');
    expect(btn.querySelector('.cngx-button__busy')?.getAttribute('aria-hidden')).toBe('true');

    host.release();
    await advance(0);
    expect(btn.hasAttribute('data-pending')).toBe(false);
    expect(btn.hasAttribute('aria-busy')).toBe(false);
    expect(btn.getAttribute('data-busy')).toBe('true');

    await advance(CNGX_LOADING_DEFAULTS.minDwell);
    expect(btn.hasAttribute('data-busy')).toBe(false);
    expect(btn.querySelector('.cngx-button__busy')).toBeNull();
  });

  it('defaults to the ghost variant, neutral tone and md size', () => {
    const { q } = render(NamedHost);
    const btn = q('#named');
    expect(btn.classList).toContain('cngx-button');
    expect(btn.classList).toContain('cngx-icon-button');
    expect(btn.dataset['variant']).toBe('ghost');
    expect(btn.dataset['tone']).toBe('neutral');
    expect(btn.dataset['size']).toBe('md');
    expect(btn.getAttribute('type')).toBe('button');
    expect(q('#solid').dataset['variant']).toBe('solid');
    expect(q('#anchor').hasAttribute('type')).toBe(false);
  });

  it('lets the config replace the ghost default', () => {
    TestBed.configureTestingModule({ providers: [provideButtonConfig(withButtonVariant('outline'))] });
    const { q } = render(NamedHost);
    expect(q('#named').dataset['variant']).toBe('outline');
  });

  it('renders disabled as aria-disabled with a gated reason and swallows clicks', () => {
    const { fixture, host, q } = render(NamedHost);
    const btn = q('#disabled');
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    const reason = document.getElementById(btn.getAttribute('aria-describedby') ?? '');
    expect(reason?.textContent?.trim()).toBe('Read only');
    btn.click();
    expect(host.clicks).toBe(0);

    host.disabled.set(false);
    fixture.detectChanges();
    expect(btn.hasAttribute('aria-describedby')).toBe(false);
    btn.click();
    expect(host.clicks).toBe(1);
  });

  it('publishes its blocked state through CNGX_BUTTON_STATE', () => {
    const { fixture, host } = render(NamedHost);
    const de = fixture.debugElement.query(By.css('#disabled'));
    const state = de.injector.get(CNGX_BUTTON_STATE);
    expect(state).toBe(de.injector.get(CngxIconButton));
    expect(state.blocked()).toBe(true);

    host.disabled.set(false);
    fixture.detectChanges();
    expect(state.blocked()).toBe(false);
  });

  it('hides the glyph from assistive technology so projected content never names the button', () => {
    const { q } = render(GlyphHost);
    for (const id of ['#img', '#ligature']) {
      const btn = q(id);
      const glyph = btn.querySelector('.cngx-icon-button__glyph');
      expect(glyph?.getAttribute('aria-hidden')).toBe('true');
      expect(glyph?.contains(btn.querySelector('img, .material-icons'))).toBe(true);
      expect(btn.getAttribute('aria-label')).toBe('Delete row');
    }
  });

  it('stays silent when aria-label, aria-labelledby or title names the button', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture } = render(NamedHost);
    await fixture.whenStable();
    expect(warn.mock.calls.filter(([msg]) => String(msg).startsWith('CNGX1071'))).toEqual([]);
    warn.mockRestore();
  });

  it('warns CNGX1071 when the host has no accessible name', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture, q } = render(UnnamedHost);
    await fixture.whenStable();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/^CNGX1071: \[cngxIconButton\] has no accessible name\./);
    expect(warn.mock.calls[0]).toContain(q('#unnamed'));
    warn.mockRestore();
  });
});
