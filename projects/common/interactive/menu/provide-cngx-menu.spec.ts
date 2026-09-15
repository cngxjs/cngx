import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { provideCngxMenu } from './provide-cngx-menu';
import { CNGX_MENU_CONFIG, DEFAULT_MENU_CONFIG, injectMenuConfig } from './menu-config';
import { withAriaLabels, withTypeaheadDebounce } from './menu-config-features';

describe('provideCngxMenu', () => {
  it('provides the menu-config defaults with no features', () => {
    TestBed.configureTestingModule({ providers: [provideCngxMenu()] });
    expect(TestBed.inject(CNGX_MENU_CONFIG)).toEqual(DEFAULT_MENU_CONFIG);
  });

  it('dispatches config features to CNGX_MENU_CONFIG', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCngxMenu(
          withTypeaheadDebounce(500),
          withAriaLabels({ submenuOpened: 'Submenu opened (override)' }),
        ),
      ],
    });
    const injector = TestBed.inject(Injector);
    const config = runInInjectionContext(injector, () => injectMenuConfig());
    expect(config.typeaheadDebounce).toBe(500);
    expect(config.ariaLabels.submenuOpened).toBe('Submenu opened (override)');
    // Untouched keys keep their defaults.
    expect(config.ariaLabels.submenuClosed).toBe(DEFAULT_MENU_CONFIG.ariaLabels.submenuClosed);
    expect(config.closeOnSelect).toBe(DEFAULT_MENU_CONFIG.closeOnSelect);
  });
});
