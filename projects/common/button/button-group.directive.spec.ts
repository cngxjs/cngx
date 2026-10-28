import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { provideButtonConfig, withButtonSize, withButtonVariant } from './button-config';
import { CngxButtonGroupAddon } from './button-group-addon.directive';
import { CngxButtonGroupSeparator } from './button-group-separator.directive';
import { CngxButtonGroup, type CngxButtonGroupOrientation } from './button-group.directive';
import { CngxButton } from './button.component';
import type { CngxButtonSize, CngxButtonVariant } from './button.types';
import { CngxIconButton } from './icon-button.component';

@Component({
  template: `
    <div
      id="group"
      cngxButtonGroup
      aria-label="History"
      [variant]="variant()"
      [size]="size()"
      [orientation]="orientation()"
    >
      <button id="plain" cngxButton>Undo</button>
      <button id="own" cngxButton="ghost" size="lg">Redo</button>
      <button id="icon" cngxIconButton aria-label="More">+</button>
      <span id="addon" cngxButtonGroupAddon>3 open</span>
      <span id="sep" cngxButtonGroupSeparator></span>
    </div>
    <button id="outside" cngxButton>Outside</button>
  `,
  imports: [CngxButtonGroup, CngxButtonGroupAddon, CngxButtonGroupSeparator, CngxButton, CngxIconButton],
})
class GroupHost {
  readonly variant = signal<CngxButtonVariant | undefined>('outline');
  readonly size = signal<CngxButtonSize | undefined>('sm');
  readonly orientation = signal<CngxButtonGroupOrientation>('horizontal');
}

@Component({
  template: `
    <div id="outer" cngxButtonGroup variant="secondary" size="lg" aria-label="Formatting">
      <div id="inner" cngxButtonGroup aria-labelledby="inner-label">
        <button id="inherits" cngxButton>Bold</button>
      </div>
      <div id="own-inner" cngxButtonGroup variant="ghost" aria-label="Alignment">
        <button id="overrides" cngxButton>Left</button>
      </div>
    </div>
    <span id="inner-label">Text style</span>
  `,
  imports: [CngxButtonGroup, CngxButton],
})
class NestedHost {}

@Component({
  template: `<div id="unnamed" cngxButtonGroup><button cngxButton>A</button></div>`,
  imports: [CngxButtonGroup, CngxButton],
})
class UnnamedHost {}

@Component({
  template: `<div id="blank" cngxButtonGroup aria-label="  "><button cngxButton>A</button></div>`,
  imports: [CngxButtonGroup, CngxButton],
})
class BlankLabelHost {}

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

function codeCalls(calls: readonly unknown[][], code: string): unknown[][] {
  return calls.filter(([msg]) => String(msg).startsWith(code));
}

describe('CngxButtonGroup', () => {
  it('is a named role="group" with orientation and size on the host', () => {
    const { fixture, host, q } = render(GroupHost);
    const group = q('#group');
    expect(group.classList).toContain('cngx-button-group');
    expect(group.getAttribute('role')).toBe('group');
    expect(group.dataset['orientation']).toBe('horizontal');
    expect(group.dataset['size']).toBe('sm');
    // aria-orientation is not an allowed attribute on role="group".
    expect(group.hasAttribute('aria-orientation')).toBe(false);

    host.orientation.set('vertical');
    host.size.set(undefined);
    fixture.detectChanges();
    expect(group.dataset['orientation']).toBe('vertical');
    expect(group.hasAttribute('data-size')).toBe(false);
    expect(group.hasAttribute('aria-orientation')).toBe(false);
  });

  it('hands variant and size to its children; a child input still wins', () => {
    const { q } = render(GroupHost);
    expect(q('#plain').dataset['variant']).toBe('outline');
    expect(q('#plain').dataset['size']).toBe('sm');
    expect(q('#own').dataset['variant']).toBe('ghost');
    expect(q('#own').dataset['size']).toBe('lg');
    expect(q('#icon').dataset['variant']).toBe('outline');
    expect(q('#icon').dataset['size']).toBe('sm');
    expect(q('#outside').dataset['variant']).toBe('solid');
    expect(q('#outside').dataset['size']).toBe('md');
  });

  it('beats the config, and an unset group value falls through to it', () => {
    TestBed.configureTestingModule({
      providers: [provideButtonConfig(withButtonVariant('secondary'), withButtonSize('xs'))],
    });
    const { fixture, host, q } = render(GroupHost);
    expect(q('#plain').dataset['variant']).toBe('outline');
    expect(q('#plain').dataset['size']).toBe('sm');

    host.variant.set(undefined);
    host.size.set(undefined);
    fixture.detectChanges();
    expect(q('#plain').dataset['variant']).toBe('secondary');
    expect(q('#plain').dataset['size']).toBe('xs');
    expect(q('#icon').dataset['variant']).toBe('secondary');
    expect(q('#addon').dataset['size']).toBe('xs');
  });

  it('gives the addon the size its sibling buttons resolve', () => {
    const { fixture, host, q } = render(GroupHost);
    expect(q('#addon').dataset['size']).toBe('sm');
    host.size.set(undefined);
    fixture.detectChanges();
    expect(q('#addon').dataset['size']).toBe('md');
    expect(q('#addon').dataset['size']).toBe(q('#plain').dataset['size']);
  });

  it('re-resolves the children when the group inputs change', () => {
    const { fixture, host, q } = render(GroupHost);
    host.variant.set('solid');
    host.size.set('lg');
    fixture.detectChanges();
    expect(q('#plain').dataset['variant']).toBe('solid');
    expect(q('#plain').dataset['size']).toBe('lg');
    expect(q('#own').dataset['variant']).toBe('ghost');
  });

  it('lets a nested group inherit the outer values unless it sets its own', () => {
    const { q } = render(NestedHost);
    expect(q('#inherits').dataset['variant']).toBe('secondary');
    expect(q('#inherits').dataset['size']).toBe('lg');
    expect(q('#overrides').dataset['variant']).toBe('ghost');
    expect(q('#overrides').dataset['size']).toBe('lg');
    expect(q('#inner').dataset['size']).toBe('lg');
  });

  it('marks the addon as a segment and the separator as decorative', () => {
    const { q } = render(GroupHost);
    expect(q('#addon').classList).toContain('cngx-button-group__addon');
    expect(q('#addon').hasAttribute('role')).toBe(false);
    expect(q('#sep').classList).toContain('cngx-button-group__separator');
    expect(q('#sep').getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps aria-describedby and the disabled guard of a grouped button intact', () => {
    @Component({
      template: `
        <div cngxButtonGroup aria-label="Actions">
          <button
            id="grouped"
            cngxButton
            aria-describedby="hint"
            [disabled]="true"
            disabledReason="Read only"
            (click)="clicks = clicks + 1"
          >Save</button>
        </div>
        <span id="hint">Saves the draft</span>
      `,
      imports: [CngxButtonGroup, CngxButton],
    })
    class DescribedHost {
      clicks = 0;
    }
    const { host, q } = render(DescribedHost);
    const btn = q('#grouped');
    const ids = (btn.getAttribute('aria-describedby') ?? '').split(' ');
    expect(ids[0]).toBe('hint');
    expect(ids).toHaveLength(2);
    expect(document.getElementById(ids[1])?.textContent?.trim()).toBe('Read only');
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    btn.click();
    expect(host.clicks).toBe(0);
  });

  it('stays silent when aria-label or aria-labelledby names the group', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture } = render(NestedHost);
    await fixture.whenStable();
    expect(codeCalls(warn.mock.calls, 'CNGX1072')).toEqual([]);
    warn.mockRestore();
  });

  it('warns CNGX1072 when the group has no name', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture, q } = render(UnnamedHost);
    await fixture.whenStable();
    const calls = codeCalls(warn.mock.calls, 'CNGX1072');
    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toMatch(/^CNGX1072: \[cngxButtonGroup\] has no accessible name\./);
    expect(calls[0]).toContain(q('#unnamed'));
    warn.mockRestore();
  });

  it('treats a whitespace-only aria-label as no name', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture } = render(BlankLabelHost);
    await fixture.whenStable();
    expect(codeCalls(warn.mock.calls, 'CNGX1072')).toHaveLength(1);
    warn.mockRestore();
  });
});
