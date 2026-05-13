import { TestBed } from '@angular/core/testing';
import { CngxToggle } from '@cngx/common/interactive';
import { describe, expect, it } from 'vitest';

import { CNGX_FILTER_BUILDER_DEFAULTS } from './filter-builder.config';
import { CNGX_FILTER_EDITORS } from './filter-builder.tokens';

describe('CNGX_FILTER_EDITORS', () => {
  it('resolves with no explicit provider via the providedIn:root factory', () => {
    TestBed.configureTestingModule({});
    const registry = TestBed.inject(CNGX_FILTER_EDITORS);
    expect(registry.size).toBe(4);
  });

  it('default map keys cover the four builtin editor types', () => {
    TestBed.configureTestingModule({});
    const registry = TestBed.inject(CNGX_FILTER_EDITORS);
    expect([...registry.keys()].sort()).toEqual(['boolean', 'date', 'number', 'string']);
  });

  it('maps scalar editor types to native sentinels and boolean to CngxToggle', () => {
    TestBed.configureTestingModule({});
    const registry = TestBed.inject(CNGX_FILTER_EDITORS);
    expect(registry.get('string')).toBe('native:string');
    expect(registry.get('number')).toBe('native:number');
    expect(registry.get('date')).toBe('native:date');
    expect(registry.get('boolean')).toBe(CngxToggle);
  });

  it('accepts a consumer override that wins over the default factory', () => {
    class FakeStringEditor {}
    const overrides = new Map<string, typeof FakeStringEditor | string>([
      ['string', FakeStringEditor],
    ]);
    TestBed.configureTestingModule({
      providers: [{ provide: CNGX_FILTER_EDITORS, useValue: overrides }],
    });
    const registry = TestBed.inject(CNGX_FILTER_EDITORS);
    expect(registry.get('string')).toBe(FakeStringEditor);
  });

  it('shares its default entries with CNGX_FILTER_BUILDER_DEFAULTS.editors', () => {
    TestBed.configureTestingModule({});
    const registry = TestBed.inject(CNGX_FILTER_EDITORS);
    const defaults = CNGX_FILTER_BUILDER_DEFAULTS.editors;
    expect(registry.size).toBe(defaults.size);
    for (const [key, value] of defaults) {
      expect(registry.get(key)).toBe(value);
    }
    expect(registry.get('boolean')).toBe(CngxToggle);
  });
});
