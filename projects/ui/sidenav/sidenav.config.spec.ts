import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CNGX_SIDENAV_CONFIG } from './config/sidenav.config.defaults';

describe('CNGX_SIDENAV_CONFIG', () => {
  it('resolves to the library defaults with no provider present', () => {
    const cfg = TestBed.inject(CNGX_SIDENAV_CONFIG);

    expect(cfg.dimensions?.width).toBe('280px');
    expect(cfg.dimensions?.miniWidth).toBe('56px');
    expect(cfg.dimensions?.minWidth).toBe('120px');
    expect(cfg.dimensions?.maxWidth).toBe('600px');
    expect(cfg.hover?.enterDelay).toBe(120);
    expect(cfg.hover?.leaveDelay).toBe(0);
    expect(cfg.responsive).toBeUndefined();
    expect(cfg.shortcut).toBeUndefined();
  });
});
