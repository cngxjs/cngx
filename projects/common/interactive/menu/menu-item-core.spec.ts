import { ElementRef, signal, type Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { CngxActiveDescendant } from '@cngx/common/a11y';

import { CNGX_MENU_ANNOUNCER_FACTORY } from './menu-announcer';
import { injectMenuItemCore, type CngxMenuItemCoreOptions } from './menu-item-core';

function makeAd(calls: string[]) {
  return {
    activeId: signal<string | null>(null),
    highlightByValue: vi.fn(() => calls.push('highlight')),
    activateCurrent: vi.fn(() => calls.push('activate')),
  };
}

function setupCore(opts?: {
  ad?: ReturnType<typeof makeAd> | null;
  options?: Partial<CngxMenuItemCoreOptions<string>>;
  text?: string;
}) {
  const announce = vi.fn();
  const host = document.createElement('button');
  host.textContent = opts?.text ?? '  Save file  ';
  TestBed.resetTestingModule();
  const providers: Provider[] = [
    { provide: ElementRef, useValue: new ElementRef(host) },
    { provide: CNGX_MENU_ANNOUNCER_FACTORY, useValue: () => ({ announce }) },
  ];
  if (opts?.ad) {
    providers.push({ provide: CngxActiveDescendant, useValue: opts.ad });
  }
  TestBed.configureTestingModule({ providers });
  const core = TestBed.runInInjectionContext(() =>
    injectMenuItemCore<string>({
      value: signal<string | undefined>('save'),
      disabled: signal(false),
      labelInput: signal<string | undefined>(undefined),
      ...opts?.options,
    }),
  );
  return { core, announce };
}

describe('injectMenuItemCore', () => {
  it('prefixes the item id and reflects the AD highlight', () => {
    const ad = makeAd([]);
    const { core } = setupCore({ ad });
    expect(core.id).toMatch(/^cngx-menu-item/);
    expect(core.isHighlighted()).toBe(false);
    ad.activeId.set(core.id);
    expect(core.isHighlighted()).toBe(true);
  });

  it('a disabled click announces itemDisabled and does not touch the AD or the activation hook', () => {
    const ad = makeAd([]);
    const onActivate = vi.fn();
    const { core, announce } = setupCore({
      ad,
      options: { disabled: signal(true), onActivate },
    });
    core.handleClick();
    expect(announce).toHaveBeenCalledWith('Item disabled');
    expect(ad.highlightByValue).not.toHaveBeenCalled();
    expect(ad.activateCurrent).not.toHaveBeenCalled();
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('a click without a surrounding active-descendant is a complete no-op', () => {
    const onActivate = vi.fn();
    const { core, announce } = setupCore({ options: { onActivate } });
    core.handleClick();
    expect(onActivate).not.toHaveBeenCalled();
    expect(announce).not.toHaveBeenCalled();
  });

  it('the AD click path runs highlight, then the activation hook, then activateCurrent', () => {
    const calls: string[] = [];
    const ad = makeAd(calls);
    const { core } = setupCore({
      ad,
      options: { onActivate: () => calls.push('variant') },
    });
    core.handleClick();
    expect(calls).toEqual(['highlight', 'variant', 'activate']);
    expect(ad.highlightByValue).toHaveBeenCalledWith('save');
  });

  it('pointerenter highlights while enabled and stays inert while disabled', () => {
    const ad = makeAd([]);
    const { core } = setupCore({ ad, options: { disabled: signal(true) } });
    core.handlePointerEnter();
    expect(ad.highlightByValue).not.toHaveBeenCalled();

    const enabledAd = makeAd([]);
    const { core: enabledCore } = setupCore({ ad: enabledAd });
    enabledCore.handlePointerEnter();
    expect(enabledAd.highlightByValue).toHaveBeenCalledWith('save');
  });

  it('label prefers the explicit input over the trimmed host text content', () => {
    const { core } = setupCore({ options: { labelInput: signal<string | undefined>('Save') } });
    expect(core.label()).toBe('Save');

    const { core: fallbackCore } = setupCore({ text: '  Export as PDF  ' });
    expect(fallbackCore.label()).toBe('Export as PDF');
  });
});
