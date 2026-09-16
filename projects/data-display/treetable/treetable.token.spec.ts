import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import {
  CNGX_TREETABLE_CONFIG,
  provideTreetable,
  provideTreetableAt,
  withCapitaliseHeaders,
  withHighlightOnHover,
  withTreetableLabels,
} from './treetable.token';

describe('CNGX_TREETABLE_CONFIG cascade', () => {
  function injectConfig() {
    return TestBed.inject(CNGX_TREETABLE_CONFIG);
  }

  it('resolves to an empty config without any provider', () => {
    expect(injectConfig()).toEqual({});
  });

  it('provideTreetable with no features equals the unprovided default', () => {
    TestBed.configureTestingModule({ providers: [provideTreetable()] });
    expect(injectConfig()).toEqual({});
  });

  it('withHighlightOnHover sets only the hover flag', () => {
    TestBed.configureTestingModule({ providers: [provideTreetable(withHighlightOnHover())] });
    expect(injectConfig()).toEqual({ highlightRowOnHover: true });
  });

  it('withCapitaliseHeaders(false) sets only the header flag', () => {
    TestBed.configureTestingModule({
      providers: [provideTreetable(withCapitaliseHeaders(false))],
    });
    expect(injectConfig()).toEqual({ capitaliseHeader: false });
  });

  it('withTreetableLabels merges partial label bags across features', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTreetable(
          withTreetableLabels({ loading: 'Loading rows' }),
          withTreetableLabels({ emptyFallback: 'Nothing here' }),
        ),
      ],
    });
    expect(injectConfig()).toEqual({
      labels: { loading: 'Loading rows', emptyFallback: 'Nothing here' },
    });
  });

  it('folds features left to right - the later feature wins on the same key', () => {
    TestBed.configureTestingModule({
      providers: [provideTreetable(withCapitaliseHeaders(true), withCapitaliseHeaders(false))],
    });
    expect(injectConfig()).toEqual({ capitaliseHeader: false });
  });

  it('provideTreetableAt yields the same resolution as a Provider[] scope', () => {
    TestBed.configureTestingModule({
      providers: [provideTreetableAt(withHighlightOnHover())],
    });
    expect(injectConfig()).toEqual({ highlightRowOnHover: true });
  });

  it('a nested At-scope resolves against the empty defaults, not the ancestor override', () => {
    TestBed.configureTestingModule({ providers: [provideTreetable(withHighlightOnHover())] });
    const parent = TestBed.inject(Injector);
    const child = Injector.create({
      providers: provideTreetableAt(withCapitaliseHeaders(false)),
      parent,
    });

    // The scope override is a full restatement - the ancestor's hover flag
    // does not leak into the child config.
    expect(child.get(CNGX_TREETABLE_CONFIG)).toEqual({ capitaliseHeader: false });
    expect(injectConfig()).toEqual({ highlightRowOnHover: true });
  });
});
