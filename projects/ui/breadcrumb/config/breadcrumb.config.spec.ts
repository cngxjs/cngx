import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CNGX_BREADCRUMB_CONFIG } from './breadcrumb.config.defaults';

describe('CNGX_BREADCRUMB_CONFIG', () => {
  it('resolves to the EN library defaults with no provider present', () => {
    const cfg = TestBed.inject(CNGX_BREADCRUMB_CONFIG);

    expect(cfg.ariaLabels?.bar).toBe('Breadcrumb');
    expect(cfg.ariaLabels?.overflowTrigger).toBe('Show collapsed breadcrumbs');
    expect(cfg.ariaLabels?.overflowMenu).toBe('Collapsed breadcrumbs');
    expect(cfg.ariaLabels?.siblingsTrigger).toBe('Show sibling pages');
    expect(cfg.ariaLabels?.siblingsMenu).toBe('Sibling pages');
    expect(cfg.router?.dataKey).toBe('breadcrumb');
  });
});
