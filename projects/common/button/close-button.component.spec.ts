import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxAsyncClick } from '@cngx/common/interactive';
import { CNGX_ICON_X } from '@cngx/utils';
import { vi } from 'vitest';

import { CngxButtonGroup } from './button-group.directive';
import { provideButtonConfig, withButtonSize, withButtonVariant } from './button-config';
import { CNGX_CLOSE_ICON, CngxCloseButton } from './close-button.component';

@Component({
  template: `
    <button id="plain" cngxCloseButton [attr.aria-label]="label()" (click)="clicks = clicks + 1"></button>
    <button id="outline" cngxCloseButton="outline" size="md" tone="danger" aria-label="Remove"></button>
    <button id="projected" cngxCloseButton aria-label="Collapse"><span class="custom-glyph">-</span></button>
    <button
      id="blocked"
      cngxCloseButton
      aria-label="Close"
      [disabled]="blocked()"
      disabledReason="Saving"
      (click)="clicks = clicks + 1"
    ></button>
  `,
  imports: [CngxCloseButton],
})
class Host {
  readonly label = signal('Close session-expired alert');
  readonly blocked = signal(true);
  clicks = 0;
}

@Component({
  template: `
    <div cngxButtonGroup variant="solid" size="lg" aria-label="Toolbar">
      <button id="grouped" cngxCloseButton aria-label="Close"></button>
    </div>
  `,
  imports: [CngxCloseButton, CngxButtonGroup],
})
class GroupHost {}

@Component({
  template: `<button id="unnamed" cngxCloseButton></button>`,
  imports: [CngxCloseButton],
})
class UnnamedHost {}

@Component({
  selector: 'cngx-test-close-glyph',
  template: `<i class="token-glyph">x</i>`,
})
class TokenGlyph {}

@Component({
  template: `<button id="tokened" cngxCloseButton aria-label="Close"></button>`,
  imports: [CngxCloseButton],
})
class TokenHost {}

@Component({
  template: `
    <button id="async" cngxCloseButton aria-label="Close" [cngxAsyncClick]="run" [disabled]="blocked()"></button>
  `,
  imports: [CngxCloseButton, CngxAsyncClick],
})
class AsyncHost {
  readonly blocked = signal(true);
  readonly run = () => Promise.resolve();
}

function render<T>(type: new () => T) {
  const fixture = TestBed.createComponent(type);
  fixture.detectChanges();
  TestBed.flushEffects();
  const el = fixture.nativeElement as HTMLElement;
  return {
    fixture,
    host: fixture.componentInstance,
    q: (s: string) => el.querySelector(s) as HTMLElement,
  };
}

describe('CngxCloseButton', () => {
  it('sits on the native button with the icon-button classes and type="button"', () => {
    const { q } = render(Host);
    const btn = q('#plain');
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.classList).toContain('cngx-button');
    expect(btn.classList).toContain('cngx-icon-button');
    expect(btn.classList).toContain('cngx-close-button');
    expect(btn.getAttribute('type')).toBe('button');
    expect(btn.querySelector('button')).toBeNull();
  });

  it('defaults to ghost, neutral and sm, and takes per-instance axes', () => {
    const { q } = render(Host);
    expect(q('#plain').dataset['variant']).toBe('ghost');
    expect(q('#plain').dataset['tone']).toBe('neutral');
    expect(q('#plain').dataset['size']).toBe('sm');
    expect(q('#outline').dataset['variant']).toBe('outline');
    expect(q('#outline').dataset['size']).toBe('md');
    expect(q('#outline').dataset['tone']).toBe('danger');
  });

  it('keeps ghost and sm inside a group and under an app-wide config', () => {
    TestBed.configureTestingModule({
      providers: [provideButtonConfig(withButtonVariant('solid'), withButtonSize('lg'))],
    });
    const { q } = render(GroupHost);
    expect(q('#grouped').dataset['variant']).toBe('ghost');
    expect(q('#grouped').dataset['size']).toBe('sm');
  });

  it('takes its name from the consumer aria-label, reactively', () => {
    const { fixture, host, q } = render(Host);
    expect(q('#plain').getAttribute('aria-label')).toBe('Close session-expired alert');
    host.label.set('Dismiss session toast');
    fixture.detectChanges();
    expect(q('#plain').getAttribute('aria-label')).toBe('Dismiss session toast');
  });

  it('renders the default X glyph inside an aria-hidden glyph span', () => {
    const { q } = render(Host);
    const glyph = q('#plain').querySelector('.cngx-icon-button__glyph')!;
    expect(glyph.getAttribute('aria-hidden')).toBe('true');
    const svg = glyph.querySelector('svg.cngx-close-button__icon');
    expect(svg).not.toBeNull();
    expect(svg!.querySelector('path')!.getAttribute('d')).toBe(CNGX_ICON_X.d);
    expect(svg!.classList.contains('cngx-icon-svg--stroke')).toBe(true);
  });

  it('replaces the default glyph with projected content', () => {
    const { q } = render(Host);
    const btn = q('#projected');
    expect(btn.querySelector('.custom-glyph')).not.toBeNull();
    expect(btn.querySelector('svg.cngx-close-button__icon')).toBeNull();
    expect(btn.querySelector('.cngx-icon-button__glyph')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders the CNGX_CLOSE_ICON component when nothing is projected', () => {
    TestBed.configureTestingModule({ providers: [{ provide: CNGX_CLOSE_ICON, useValue: TokenGlyph }] });
    const { q } = render(TokenHost);
    const btn = q('#tokened');
    expect(btn.querySelector('.token-glyph')).not.toBeNull();
    expect(btn.querySelector('svg.cngx-close-button__icon')).toBeNull();
  });

  it('renders a blocked close as aria-disabled with the reason and swallows clicks', () => {
    const { fixture, host, q } = render(Host);
    const btn = q('#blocked');
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    expect(btn.hasAttribute('disabled')).toBe(false);
    const reason = document.getElementById(btn.getAttribute('aria-describedby') ?? '');
    expect(reason?.textContent?.trim()).toBe('Saving');
    btn.click();
    expect(host.clicks).toBe(0);

    host.blocked.set(false);
    fixture.detectChanges();
    expect(btn.hasAttribute('aria-disabled')).toBe(false);
    expect(btn.hasAttribute('aria-describedby')).toBe(false);
    btn.click();
    expect(host.clicks).toBe(1);
  });

  it('keeps aria-disabled when a co-hosted cngxAsyncClick is idle', () => {
    const { fixture, host, q } = render(AsyncHost);
    const btn = q('#async');
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    host.blocked.set(false);
    fixture.detectChanges();
    expect(btn.hasAttribute('aria-disabled')).toBe(false);
  });

  it('stays silent when the host is named', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture } = render(Host);
    await fixture.whenStable();
    expect(warn.mock.calls.filter(([msg]) => String(msg).startsWith('CNGX1071'))).toEqual([]);
    warn.mockRestore();
  });

  it('warns CNGX1071 when the host has no accessible name', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture, q } = render(UnnamedHost);
    await fixture.whenStable();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/^CNGX1071: \[cngxCloseButton\] has no accessible name\./);
    expect(warn.mock.calls[0]).toContain(q('#unnamed'));
    warn.mockRestore();
  });
});
