import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CNGX_CHART_RENDERER_THRESHOLD } from './renderer-threshold';

describe('CNGX_CHART_RENDERER_THRESHOLD', () => {
  it('defaults to 500', () => {
    TestBed.configureTestingModule({});
    expect(TestBed.inject(CNGX_CHART_RENDERER_THRESHOLD)).toBe(500);
  });

  it('an override shadows the root default', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: CNGX_CHART_RENDERER_THRESHOLD, useValue: 2000 }],
    });
    expect(TestBed.inject(CNGX_CHART_RENDERER_THRESHOLD)).toBe(2000);
  });
});
