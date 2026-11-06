import { Component, Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CNGX_BUTTON_CARET_ICON } from './caret-icon.token';
import { CNGX_MENU_BUTTON_I18N, withMenuButtonI18nLabels } from './i18n/menu-button-i18n';
import {
  provideCngxMenuButton,
  provideCngxMenuButtonAt,
  withButtonCaretIcon,
  type CngxMenuButtonFeature,
} from './provide-cngx-menu-button';

@Component({ selector: 'demo-caret', template: 'v' })
class DemoCaret {}

describe('provideCngxMenuButton', () => {
  afterEach(() => vi.restoreAllMocks());

  it('dispatches the caret glyph and the labels in one call', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCngxMenuButton(
          withButtonCaretIcon(DemoCaret),
          withMenuButtonI18nLabels({ splitToggle: 'More actions' }),
        ),
      ],
    });
    expect(TestBed.inject(CNGX_BUTTON_CARET_ICON)).toBe(DemoCaret);
    expect(TestBed.inject(CNGX_MENU_BUTTON_I18N)().splitToggle).toBe('More actions');
    expect(TestBed.inject(CNGX_MENU_BUTTON_I18N)().splitMainBusy).toBe(
      'The main action is running',
    );
  });

  it('drops an unbranded feature with CNGX1041 and keeps the others', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const rogue = { component: DemoCaret } as unknown as CngxMenuButtonFeature;
    TestBed.configureTestingModule({
      providers: [provideCngxMenuButton(rogue, withButtonCaretIcon(DemoCaret))],
    });
    expect(TestBed.inject(CNGX_BUTTON_CARET_ICON)).toBe(DemoCaret);
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/^CNGX1041: provideCngxMenuButton\(\): dropped feature/),
    );
  });
});

describe('provideCngxMenuButtonAt', () => {
  afterEach(() => vi.restoreAllMocks());

  it('overrides labels on a subtree and plants nothing for an empty call', () => {
    const child = Injector.create({
      providers: provideCngxMenuButtonAt(withMenuButtonI18nLabels({ splitToggle: 'Mehr' })),
      parent: TestBed.inject(Injector),
    });
    expect(child.get(CNGX_MENU_BUTTON_I18N)().splitToggle).toBe('Mehr');
    expect(child.get(CNGX_BUTTON_CARET_ICON, null)).toBeNull();
    expect(provideCngxMenuButtonAt()).toEqual([]);
  });

  it('names itself when it drops an unbranded feature', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    provideCngxMenuButtonAt({} as unknown as CngxMenuButtonFeature);
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/^CNGX1041: provideCngxMenuButtonAt\(\): dropped feature/),
    );
  });
});
