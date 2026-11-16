import type { Signal } from '@angular/core';
import { describe, expect, expectTypeOf, it } from 'vitest';

import * as api from './public-api';

describe('@cngx/common/interactive public API shape', () => {
  it('exports CNGX_NAV_DEFAULTS next to the nav config token', () => {
    expect('CNGX_NAV_CONFIG' in api).toBe(true);
    expect(api.CNGX_NAV_DEFAULTS).toEqual({
      indent: 12,
      singleAccordion: false,
      animationDuration: 150,
    });
  });

  it('exports the nav icon slot', () => {
    expect(typeof api.CngxNavIcon).toBe('function');
  });

  it('exports the nav header, footer, mark and name slots', () => {
    for (const slot of [api.CngxNavHeader, api.CngxNavFooter, api.CngxNavMark, api.CngxNavName]) {
      expect(typeof slot).toBe('function');
    }
  });

  it('exports the rail tooltip and group flyout with their swap tokens', () => {
    expect(typeof api.injectNavRailTooltip).toBe('function');
    expect(typeof api.injectNavRailFlyout).toBe('function');
    expect(api.CNGX_NAV_RAIL_TOOLTIP_FACTORY).toBeDefined();
    expect(api.CNGX_NAV_RAIL_FLYOUT_FACTORY).toBeDefined();
  });

  it('exports the rail behaviour directive for nav containers of your own', () => {
    expect(typeof api.CngxNavRailed).toBe('function');
  });

  it('types the flyout on a group contract the nav atoms match', () => {
    expectTypeOf<api.CngxNavGroup>().toMatchTypeOf<api.CngxNavRailFlyoutGroup>();
    expectTypeOf<api.CngxNavGroupContent>().toMatchTypeOf<api.CngxNavRailFlyoutContent>();
  });

  it('types the rail side as the logical edge union', () => {
    expectTypeOf<api.CngxNavRailTooltipSources['side']>().toEqualTypeOf<Signal<'start' | 'end'>>();
  });
});
