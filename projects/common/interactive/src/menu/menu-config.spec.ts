import { TestBed } from '@angular/core/testing';
import { Injector, runInInjectionContext } from '@angular/core';
import { describe, expect, it } from 'vitest';

import {
  CNGX_MENU_CONFIG,
  DEFAULT_MENU_CONFIG,
  injectMenuConfig,
  provideMenuConfig,
} from './menu-config';
import {
  withAriaLabels,
  withCloseOnSelect,
  withSubmenuCloseDelay,
  withSubmenuOpenDelay,
  withTypeaheadDebounce,
} from './menu-config-features';

describe('CNGX_MENU_CONFIG', () => {
  it('default factory provides English defaults', () => {
    TestBed.configureTestingModule({});
    const config = TestBed.inject(CNGX_MENU_CONFIG);
    expect(config.ariaLabels.submenuOpened).toBe('Submenu opened');
    expect(config.ariaLabels.submenuClosed).toBe('Submenu closed');
    expect(config.ariaLabels.itemActivated).toBe('Item activated');
    expect(config.ariaLabels.itemDisabled).toBe('Item disabled');
    expect(config.typeaheadDebounce).toBe(300);
    expect(config.submenuOpenDelay).toBe(0);
    expect(config.submenuCloseDelay).toBe(0);
    expect(config.closeOnSelect).toBe(true);
    expect(config).toEqual(DEFAULT_MENU_CONFIG);
  });

  it('provideMenuConfig + withAriaLabels overrides only the keys passed in', () => {
    TestBed.configureTestingModule({
      providers: [provideMenuConfig(withAriaLabels({ submenuOpened: 'Untermenü geöffnet' }))],
    });
    const config = TestBed.inject(CNGX_MENU_CONFIG);
    expect(config.ariaLabels.submenuOpened).toBe('Untermenü geöffnet');
    expect(config.ariaLabels.submenuClosed).toBe('Submenu closed');
    expect(config.ariaLabels.itemActivated).toBe('Item activated');
  });

  it('multiple features compose left-to-right', () => {
    TestBed.configureTestingModule({
      providers: [
        provideMenuConfig(
          withTypeaheadDebounce(500),
          withSubmenuOpenDelay(150),
          withSubmenuCloseDelay(75),
          withCloseOnSelect(false),
        ),
      ],
    });
    const config = TestBed.inject(CNGX_MENU_CONFIG);
    expect(config.typeaheadDebounce).toBe(500);
    expect(config.submenuOpenDelay).toBe(150);
    expect(config.submenuCloseDelay).toBe(75);
    expect(config.closeOnSelect).toBe(false);
    expect(config.ariaLabels).toEqual(DEFAULT_MENU_CONFIG.ariaLabels);
  });

  it('repeat applications of withAriaLabels merge incrementally', () => {
    TestBed.configureTestingModule({
      providers: [
        provideMenuConfig(
          withAriaLabels({ submenuOpened: 'A' }),
          withAriaLabels({ submenuClosed: 'B' }),
        ),
      ],
    });
    const config = TestBed.inject(CNGX_MENU_CONFIG);
    expect(config.ariaLabels.submenuOpened).toBe('A');
    expect(config.ariaLabels.submenuClosed).toBe('B');
    expect(config.ariaLabels.itemActivated).toBe('Item activated');
  });

  it('injectMenuConfig works inside an injection context', () => {
    TestBed.configureTestingModule({
      providers: [provideMenuConfig(withTypeaheadDebounce(123))],
    });
    const injector = TestBed.inject(Injector);
    const captured = runInInjectionContext(injector, () => injectMenuConfig());
    expect(captured.typeaheadDebounce).toBe(123);
  });

  it('every with* feature carries the _target=config discriminator', () => {
    const features = [
      withAriaLabels({ submenuOpened: 'X' }),
      withTypeaheadDebounce(1),
      withSubmenuCloseDelay(1),
      withSubmenuOpenDelay(1),
      withCloseOnSelect(false),
    ];
    for (const f of features) {
      expect((f as { _target?: string })._target).toBe('config');
    }
  });
});
