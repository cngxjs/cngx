import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
  type CngxLanguagePack,
} from '@cngx/core/i18n';
import { provideLocale, provideLocaleAt } from '@cngx/core/utils';
import { runInSubtree, stripBidiIsolates } from '@cngx/testing';

import {
  injectFilterBuilderI18n,
  provideFilterBuilderConfig,
  withFilterBuilderI18n,
  type CngxFilterBuilderI18n,
} from '../filter-builder.config';
import { injectFilterBuilderSectionI18n } from './filter-builder-i18n';
import { CNGX_FILTER_BUILDER_LANGUAGE_EN } from './filter-builder-language-section';

// Compile-checked: the English section is a complete filterBuilder section of a pack.
const EN_SECTION: CngxLanguagePack['filterBuilder'] = CNGX_FILTER_BUILDER_LANGUAGE_EN;

function i18n() {
  return TestBed.runInInjectionContext(() => injectFilterBuilderI18n());
}

const strip = stripBidiIsolates;

describe('filter-builder language section', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('derives the English copy from the English section, as before the section', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const en = i18n()();
    expect(en.addFilter).toBe('Add filter');
    expect(en.addGroup).toBe('Add group');
    expect(en.removeFilter).toBe('Remove filter');
    expect(en.removeGroup).toBe('Remove filter group');
    expect([en.and, en.or, en.xor]).toEqual(['AND', 'OR', 'XOR']);
    expect(en.logicLabel).toBe('Combine filters with');
    expect(en.negate).toBe('Negate');
    expect(en.emptyState).toBe('No filters defined');
    expect(en.operators).toEqual({
      contains: 'Contains',
      eq: 'Equals',
      neq: 'Not equals',
      startsWith: 'Starts with',
      endsWith: 'Ends with',
      isEmpty: 'Is empty',
      isNotEmpty: 'Is not empty',
      gt: 'Greater than',
      gte: 'Greater than or equal',
      lt: 'Less than',
      lte: 'Less than or equal',
      between: 'Between',
      in: 'In',
      notIn: 'Not in',
    });
    expect(en.unboundFilterLabel).toBe('Unbound filter');
    expect(en.negatedTag).toBe('negated');
    expect([en.booleanTrue, en.booleanFalse]).toEqual(['true', 'false']);
    expect(strip(en.quotedValue('foo'))).toBe('"foo"');

    const group = (isRoot: boolean, negated: boolean) =>
      strip(en.groupLabel({ logic: 'xor', negated, isRoot }));
    expect(group(true, false)).toBe('Root filter group (XOR)');
    expect(group(true, true)).toBe('Root filter group (XOR, negated)');
    expect(group(false, false)).toBe('Filter group (XOR)');
    expect(group(false, true)).toBe('Filter group (XOR, negated)');
    expect(
      strip(
        en.groupLabel({
          logic: 'or',
          negated: true,
          isRoot: false,
          logicLabel: 'ODER',
          negatedTag: 'negiert',
        }),
      ),
    ).toBe('Filter group (ODER, negiert)');

    expect(
      strip(en.expressionLabel({ fieldLabel: 'Name', operator: 'eq', operatorLabel: 'Equals' })),
    ).toBe('Filter: Name Equals');
    expect(strip(en.expressionLabel({ fieldLabel: 'Name', operator: '' }))).toBe(
      'Filter: Name (no operator)',
    );
    expect(strip(en.expressionLabel({ fieldLabel: 'Name', operator: 'eq' }))).toBe(
      'Filter: Name Equals',
    );

    const a = en.announcement;
    expect(strip(a.filterAdded({ fieldLabel: 'Name' }))).toBe('Filter added: Name');
    expect(
      strip(
        a.filterRemoved({
          fieldLabel: 'Name',
          operator: 'eq',
          operatorLabel: 'Equals',
          value: '"foo"',
        }),
      ),
    ).toBe('Filter removed: Name Equals "foo"');
    expect(strip(a.filterRemoved({ fieldLabel: 'Name', operator: 'isEmpty', value: '' }))).toBe(
      'Filter removed: Name Is empty',
    );
    expect(strip(a.filterRemoved({ fieldLabel: 'Name', operator: '', value: '"x"' }))).toBe(
      'Filter removed: Name "x"',
    );
    expect(strip(a.filterRemoved({ fieldLabel: 'Name', operator: '', value: '' }))).toBe(
      'Filter removed: Name',
    );
    expect(a.groupAdded()).toBe('Filter group added');
    expect(a.groupRemoved()).toBe('Filter group removed');
    expect(strip(a.logicChanged({ logic: 'xor' }))).toBe('Logic changed to XOR');
    expect(strip(a.logicChanged({ logic: 'or', logicLabel: 'ODER' }))).toBe(
      'Logic changed to ODER',
    );
    expect(a.groupNegated()).toBe('Group negated');
    expect(a.groupUnnegated()).toBe('Group un-negated');
    expect(strip(a.fieldChanged({ fieldLabel: 'Age' }))).toBe('Field changed to Age');
    expect(strip(a.operatorChanged({ operator: 'gte' }))).toBe(
      'Operator changed to Greater than or equal',
    );
    expect(strip(a.valueChanged({ value: '42' }))).toBe('Value changed to 42');
    expect(a.valueChanged({ value: '' })).toBe('Value changed');
    expect(a.filtersCleared()).toBe('Filters cleared');
    expect(EN_SECTION.quotedValue).toBe('"{value}"');
  });

  it('never shows or announces a raw operator key', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const en = i18n()();
    const label = en.expressionLabel({ fieldLabel: 'Name', operator: 'lengthGt' });
    expect(strip(label)).toBe('Filter: Name Unnamed operator');
    const changed = en.announcement.operatorChanged({ operator: 'lengthGt' });
    expect(strip(changed)).toBe('Operator changed to Unnamed operator');
    const removed = en.announcement.filterRemoved({
      fieldLabel: 'Name',
      operator: 'lengthGt',
      value: '3',
    });
    expect(strip(removed)).toBe('Filter removed: Name Unnamed operator 3');
    for (const text of [label, changed, removed]) {
      expect(text).not.toContain('lengthGt');
    }
  });

  it('reads the filterBuilder section of the active pack, with English for what it leaves out', () => {
    const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off')),
      ],
    });
    const resolved = i18n();
    expect(resolved().addFilter).toBe('Add filter');

    pack.set({
      locale: 'de',
      filterBuilder: {
        addFilter: 'Filter hinzufügen',
        operators: { contains: 'Enthält' },
        unnamedOperator: 'Unbenannter Operator',
        quotedValue: '„{value}“',
        rootGroupLabel: 'Wurzelgruppe ({logic})',
        and: 'UND',
        announceFilterRemoved: '{field} {operator} {value} entfernt',
      },
    });
    const de = resolved();
    expect(de.addFilter).toBe('Filter hinzufügen');
    expect(de.operators['contains']).toBe('Enthält');
    expect(de.operators['eq']).toBe('Equals');
    expect(strip(de.quotedValue('foo'))).toBe('„foo“');
    expect(strip(de.groupLabel({ logic: 'and', negated: false, isRoot: true }))).toBe(
      'Wurzelgruppe (UND)',
    );
    expect(strip(de.expressionLabel({ fieldLabel: 'Name', operator: 'custom' }))).toBe(
      'Filter: Name Unbenannter Operator',
    );
    expect(
      strip(
        de.announcement.filterRemoved({
          fieldLabel: 'Name',
          operator: 'contains',
          value: de.quotedValue('foo'),
        }),
      ),
    ).toBe('Name Enthält „foo“ entfernt');
    expect(de.removeFilter).toBe('Remove filter');

    pack.set(undefined);
    expect(resolved().addFilter).toBe('Add filter');
  });

  it('lets withFilterBuilderI18n override single keys on top of the active pack', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideCngxI18n(
          withPartialPack({
            locale: 'de',
            filterBuilder: {
              addFilter: 'Filter hinzufügen',
              removeFilter: 'Filter entfernen',
              operators: { contains: 'Enthält', eq: 'Gleich' },
            },
          }),
          withDocumentLanguage('off'),
        ),
        provideFilterBuilderConfig(
          withFilterBuilderI18n({
            addFilter: 'Bedingung hinzufügen',
            emptyState: undefined,
            operators: { eq: 'Ist' },
          }),
        ),
      ],
    });
    const resolved = i18n()();
    expect(resolved.addFilter).toBe('Bedingung hinzufügen');
    expect(resolved.removeFilter).toBe('Filter entfernen');
    expect(resolved.emptyState).toBe('No filters defined');
    expect(resolved.operators['eq']).toBe('Ist');
    expect(resolved.operators['contains']).toBe('Enthält');
    expect(resolved.operators['gte']).toBe('Greater than or equal');
  });

  it('formats with the locale of a provideLocaleAt subtree', () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideLocale('en'),
        provideCngxI18n(
          withPartialPack({
            locale: 'en',
            filterBuilder: {
              announceLogicChanged: (args, locale) => `${locale}: ${String(args['logic'])}`,
            },
          }),
          withDocumentLanguage('off'),
        ),
      ],
    });
    const root = i18n();
    const german = runInSubtree([provideLocaleAt('de')], () => injectFilterBuilderI18n());
    expect(root().announcement.logicChanged({ logic: 'or' })).toBe('en: OR');
    expect(german().announcement.logicChanged({ logic: 'or' })).toBe('de: OR');
  });

  it('keeps the bundle reference for the same section and locale', () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const first = i18n();
    const second = i18n();
    expect(Object.is(first, second)).toBe(true);
    expect(Object.is(first(), second())).toBe(true);
    const site = TestBed.runInInjectionContext(() => injectFilterBuilderSectionI18n());
    const again = TestBed.runInInjectionContext(() => injectFilterBuilderSectionI18n());
    expect(Object.is(site, again)).toBe(true);
    expect(Object.is(site(), again())).toBe(true);
  });

  it('keeps the bundle reference when an equal config override recomputes', () => {
    const overrides = signal<Partial<CngxFilterBuilderI18n>>({
      addFilter: 'Add rule',
      operators: { eq: 'Is' },
    });
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideFilterBuilderConfig(withFilterBuilderI18n(overrides)),
      ],
    });
    const resolved = i18n();
    const before = resolved();
    expect(before.operators['eq']).toBe('Is');
    overrides.set({
      addFilter: 'Add rule',
      emptyState: undefined,
      operators: { eq: 'Is' },
    });
    expect(Object.is(resolved(), before)).toBe(true);
    expect(resolved().emptyState).toBe('No filters defined');
    expect(resolved().operators['contains']).toBe('Contains');
    overrides.set({ addFilter: 'Add condition', operators: { eq: 'Is' } });
    expect(resolved().addFilter).toBe('Add condition');
  });
});
