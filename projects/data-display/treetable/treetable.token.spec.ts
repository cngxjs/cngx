import { computed, Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { coerceSignal } from '@cngx/core/utils';
import { describe, expect, it } from 'vitest';

import {
  CNGX_TREETABLE_CONFIG,
  provideTreetable,
  provideTreetableAt,
  withHighlightOnHover,
  withTreetableDateFormat,
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

  it('withTreetableDateFormat sets only the date format', () => {
    const format: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' };
    TestBed.configureTestingModule({ providers: [provideTreetable(withTreetableDateFormat(format))] });
    expect(injectConfig()).toEqual({ dateFormat: format });
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
    expect(coerceSignal(injectConfig().labels)()).toEqual({
      loading: 'Loading rows',
      emptyFallback: 'Nothing here',
    });
  });

  it('withTreetableLabels follows a Signal and keeps the earlier keys', () => {
    const lang = signal<'en' | 'de'>('en');
    TestBed.configureTestingModule({
      providers: [
        provideTreetable(
          withTreetableLabels({ emptyFallback: 'Nothing here' }),
          withTreetableLabels(computed(() => (lang() === 'de' ? { loading: 'Lädt' } : {}))),
        ),
      ],
    });
    const labels = coerceSignal(injectConfig().labels);
    expect(labels()?.loading).toBeUndefined();
    lang.set('de');
    expect(labels()).toEqual({ emptyFallback: 'Nothing here', loading: 'Lädt' });
  });

  it('folds features left to right - the later feature wins on the same key', () => {
    TestBed.configureTestingModule({
      providers: [provideTreetable(withHighlightOnHover(true), withHighlightOnHover(false))],
    });
    expect(injectConfig()).toEqual({ highlightRowOnHover: false });
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
      providers: provideTreetableAt(withTreetableLabels({ loading: 'Loading rows' })),
      parent,
    });

    // The scope override is a full restatement - the ancestor's hover flag
    // does not leak into the child config.
    const scoped = child.get(CNGX_TREETABLE_CONFIG);
    expect(scoped.highlightRowOnHover).toBeUndefined();
    expect(coerceSignal(scoped.labels)()).toEqual({ loading: 'Loading rows' });
    expect(injectConfig()).toEqual({ highlightRowOnHover: true });
  });
});
