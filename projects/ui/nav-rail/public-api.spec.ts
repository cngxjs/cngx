import { describe, expect, it } from 'vitest';

import * as api from './public-api';

describe('@cngx/ui/nav-rail public API shape', () => {
  it('exports the rail tooltip injection function', () => {
    expect(typeof api.injectNavRailTooltip).toBe('function');
  });

  it('exports the rail organism, its copy token and its English section', () => {
    expect(api.CngxNavRail).toBeDefined();
    expect(api.CNGX_NAV_RAIL_I18N).toBeDefined();
    expect(api.provideNavRailI18n).toBeTypeOf('function');
    expect(api.withNavRailI18nLabels).toBeTypeOf('function');
    expect(api.injectNavRailI18n).toBeTypeOf('function');
    expect(api.CNGX_NAV_RAIL_LANGUAGE_EN).toEqual({ ariaLabel: 'Navigation' });
  });

  it('exports the rail config cascade', () => {
    expect(api.CNGX_NAV_RAIL_CONFIG).toBeDefined();
    expect(api.provideNavRailConfig).toBeTypeOf('function');
    expect(api.provideNavRailConfigAt).toBeTypeOf('function');
    expect(api.injectNavRailConfig).toBeTypeOf('function');
    expect(api.withNavRailLabelPlacement).toBeTypeOf('function');
    expect(api.withNavRailTooltip).toBeTypeOf('function');
    expect(api.withNavRailTooltipDelay).toBeTypeOf('function');
  });

  it('exports the rail group flyout injection function', () => {
    expect(typeof api.injectNavRailFlyout).toBe('function');
  });

  it('exports the tooltip and flyout swap tokens', () => {
    expect(api.CNGX_NAV_RAIL_TOOLTIP_FACTORY).toBeDefined();
    expect(api.CNGX_NAV_RAIL_FLYOUT_FACTORY).toBeDefined();
  });
});
