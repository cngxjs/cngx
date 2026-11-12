import { describe, expect, it } from 'vitest';

import * as api from './public-api';

describe('@cngx/ui/nav-rail public API shape', () => {
  it('exports the rail tooltip injection function', () => {
    expect(typeof api.injectNavRailTooltip).toBe('function');
  });

  it('exports the rail group flyout injection function', () => {
    expect(typeof api.injectNavRailFlyout).toBe('function');
  });
});
