import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CNGX_FILTER_EDITORS, injectFilterEditors } from './filter-builder.tokens';

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

  it('maps every builtin editor type to a native sentinel', () => {
    TestBed.configureTestingModule({});
    const registry = TestBed.inject(CNGX_FILTER_EDITORS);
    expect(registry.get('string')).toBe('native:string');
    expect(registry.get('number')).toBe('native:number');
    expect(registry.get('date')).toBe('native:date');
    expect(registry.get('boolean')).toBe('native:boolean');
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
});

@Component({ template: '' })
class EditorsProbe {
  readonly resolved = injectFilterEditors();
}

describe('injectFilterEditors', () => {
  it('returns the providedIn:root default when no override is provided', () => {
    TestBed.configureTestingModule({});
    const fixture = TestBed.createComponent(EditorsProbe);
    const { resolved } = fixture.componentInstance;
    expect(resolved.size).toBe(4);
    expect(resolved.get('boolean')).toBe('native:boolean');
  });

  it('returns the consumer-provided CNGX_FILTER_EDITORS map', () => {
    class FakeNumberEditor {}
    const overrides = new Map<string, typeof FakeNumberEditor | string>([
      ['number', FakeNumberEditor],
    ]);
    TestBed.configureTestingModule({
      providers: [{ provide: CNGX_FILTER_EDITORS, useValue: overrides }],
    });
    const fixture = TestBed.createComponent(EditorsProbe);
    expect(fixture.componentInstance.resolved.get('number')).toBe(FakeNumberEditor);
  });
});
