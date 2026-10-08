import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { stripBidiIsolates } from '@cngx/testing';
import { describe, expect, it } from 'vitest';

import {
  CNGX_FILTER_BUILDER_ANNOUNCER_FACTORY,
  createFilterBuilderAnnouncer,
  injectFilterBuilderAnnouncerFactory,
  type CngxFilterBuilderAnnouncerFactory,
  type CngxFilterBuilderAnnouncerSources,
} from './filter-builder-announcer';
import { filterBuilderI18nFrom } from './i18n/filter-builder-i18n';
import { CNGX_FILTER_BUILDER_LANGUAGE_EN } from './i18n/filter-builder-language-section';
import type { FilterMutationEvent } from './filter-builder-state';
import type { FilterFieldDef } from './filter-builder.types';

const EN_I18N = filterBuilderI18nFrom(CNGX_FILTER_BUILDER_LANGUAGE_EN, 'en');

const FIELDS: ReadonlyMap<string, FilterFieldDef> = new Map([
  ['name', { key: 'name', label: 'First name', editorType: 'string' }],
  ['age', { key: 'age', label: 'Age', editorType: 'number' }],
]);

function buildSources(event: FilterMutationEvent | null): CngxFilterBuilderAnnouncerSources {
  return {
    lastMutation: signal<FilterMutationEvent | null>(event),
    fieldMap: signal<ReadonlyMap<string, FilterFieldDef>>(FIELDS),
    i18n: signal(EN_I18N),
  };
}

describe('createFilterBuilderAnnouncer', () => {
  it('returns empty string when there is no last mutation', () => {
    const announcer = createFilterBuilderAnnouncer(buildSources(null));
    expect(stripBidiIsolates(announcer.announcement())).toBe('');
  });

  it('resolves fieldKey to fieldDef.label for add-filter', () => {
    const announcer = createFilterBuilderAnnouncer(
      buildSources({ kind: 'add-filter', path: [0], context: { fieldKey: 'name' } }),
    );
    expect(stripBidiIsolates(announcer.announcement())).toBe('Filter added: First name');
  });

  it('falls back to raw fieldKey when fieldMap has no entry', () => {
    const announcer = createFilterBuilderAnnouncer(
      buildSources({ kind: 'add-filter', path: [0], context: { fieldKey: 'unknown' } }),
    );
    expect(stripBidiIsolates(announcer.announcement())).toBe('Filter added: unknown');
  });

  it('formats remove-filter with field label, operator label, and quoted value', () => {
    const announcer = createFilterBuilderAnnouncer(
      buildSources({
        kind: 'remove-filter',
        path: [0],
        context: { fieldKey: 'name', operator: 'contains', value: 'foo' },
      }),
    );
    expect(stripBidiIsolates(announcer.announcement())).toBe(
      'Filter removed: First name Contains "foo"',
    );
  });

  it('names a filter without a field with the unbound-filter word', () => {
    const announcer = createFilterBuilderAnnouncer(
      buildSources({
        kind: 'remove-filter',
        path: [0],
        context: { fieldKey: '', operator: 'eq', value: 'x' },
      }),
    );
    expect(stripBidiIsolates(announcer.announcement())).toBe(
      'Filter removed: Unbound filter Equals "x"',
    );
  });

  it('announces the operator label, not the raw key', () => {
    const announcer = createFilterBuilderAnnouncer(
      buildSources({ kind: 'set-operator', path: [0], context: { operator: 'gte' } }),
    );
    expect(stripBidiIsolates(announcer.announcement())).toBe(
      'Operator changed to Greater than or equal',
    );
  });

  it('never announces the raw operator key when no label exists', () => {
    const announcer = createFilterBuilderAnnouncer(
      buildSources({ kind: 'set-operator', path: [0], context: { operator: 'custom' } }),
    );
    expect(stripBidiIsolates(announcer.announcement())).toBe(
      'Operator changed to Unnamed operator',
    );
    expect(announcer.announcement()).not.toContain('custom');
  });

  it('announces a custom operator by its definition label', () => {
    const operators = new Map([['near', { label: 'Near', evaluate: () => true }]]);
    const announcer = createFilterBuilderAnnouncer({
      ...buildSources({ kind: 'set-operator', path: [0], context: { operator: 'near' } }),
      operators,
    });
    expect(stripBidiIsolates(announcer.announcement())).toBe('Operator changed to Near');
  });

  it('lets an i18n entry win over the operator definition label', () => {
    const operators = new Map([['near', { label: 'Near', evaluate: () => true }]]);
    const base = EN_I18N;
    const announcer = createFilterBuilderAnnouncer({
      ...buildSources({ kind: 'set-operator', path: [0], context: { operator: 'near' } }),
      i18n: signal({ ...base, operators: { ...base.operators, near: 'In der Nähe' } }),
      operators,
    });
    expect(stripBidiIsolates(announcer.announcement())).toBe('Operator changed to In der Nähe');
  });

  it('passes translated operator, logic and boolean words to the formatters', () => {
    const base = EN_I18N;
    const i18n = {
      ...base,
      or: 'ODER',
      booleanTrue: 'wahr',
      operators: { ...base.operators, gte: 'Größer oder gleich' },
      announcement: {
        ...base.announcement,
        operatorChanged: ({ operatorLabel }: { operator: string; operatorLabel?: string }) =>
          `Operator geändert zu ${operatorLabel}`,
        logicChanged: ({ logicLabel }: { logicLabel?: string }) => `Logik: ${logicLabel}`,
        valueChanged: ({ value }: { value: string }) => `Wert: ${value}`,
      },
    };
    const lastMutation = signal<FilterMutationEvent | null>({
      kind: 'set-operator',
      path: [0],
      context: { operator: 'gte' },
    });
    const announcer = createFilterBuilderAnnouncer({
      ...buildSources(null),
      lastMutation,
      i18n: signal(i18n),
    });
    expect(stripBidiIsolates(announcer.announcement())).toBe(
      'Operator geändert zu Größer oder gleich',
    );
    lastMutation.set({ kind: 'set-logic', path: [], context: { logic: 'or' } });
    expect(stripBidiIsolates(announcer.announcement())).toBe('Logik: ODER');
    lastMutation.set({ kind: 'set-value', path: [0], context: { value: true } });
    expect(stripBidiIsolates(announcer.announcement())).toBe('Wert: wahr');
  });

  it('does not re-announce on a language flip', () => {
    const base = EN_I18N;
    const i18n = signal(base);
    const lastMutation = signal<FilterMutationEvent | null>({
      kind: 'clear',
      path: [],
    });
    const announcer = createFilterBuilderAnnouncer({ ...buildSources(null), lastMutation, i18n });
    expect(stripBidiIsolates(announcer.announcement())).toBe('Filters cleared');

    i18n.set({
      ...base,
      announcement: { ...base.announcement, filtersCleared: () => 'Filter entfernt' },
    });
    expect(stripBidiIsolates(announcer.announcement())).toBe('Filters cleared');

    lastMutation.set({ kind: 'clear', path: [] });
    expect(stripBidiIsolates(announcer.announcement())).toBe('Filter entfernt');
  });

  it('keeps numbers as String(value) when no locale is passed', () => {
    const announcer = createFilterBuilderAnnouncer(
      buildSources({ kind: 'set-value', path: [0], context: { value: 1234.5 } }),
    );
    expect(stripBidiIsolates(announcer.announcement())).toBe('Value changed to 1234.5');
  });

  it('formats numbers in the passed locale without grouping', () => {
    const announcer = createFilterBuilderAnnouncer({
      ...buildSources({ kind: 'set-value', path: [0], context: { value: 1234.5 } }),
      locale: signal('de-DE'),
    });
    expect(stripBidiIsolates(announcer.announcement())).toBe('Value changed to 1234,5');
  });

  it('does not re-speak the last mutation when the locale flips', () => {
    const locale = signal('en-US');
    const announcer = createFilterBuilderAnnouncer({
      ...buildSources({ kind: 'set-value', path: [0], context: { value: 1.5 } }),
      locale,
    });
    const first = announcer.announcement();
    expect(stripBidiIsolates(first)).toBe('Value changed to 1.5');
    locale.set('de-DE');
    expect(announcer.announcement()).toBe(first);
  });

  it('formats set-logic as uppercase logic name', () => {
    const announcer = createFilterBuilderAnnouncer(
      buildSources({ kind: 'set-logic', path: [], context: { logic: 'or' } }),
    );
    expect(stripBidiIsolates(announcer.announcement())).toBe('Logic changed to OR');
  });

  it('distinguishes group negated vs un-negated', () => {
    const negated = createFilterBuilderAnnouncer(
      buildSources({ kind: 'toggle-negated', path: [], context: { negated: true } }),
    );
    const unnegated = createFilterBuilderAnnouncer(
      buildSources({ kind: 'toggle-negated', path: [], context: { negated: false } }),
    );
    expect(stripBidiIsolates(negated.announcement())).toBe('Group negated');
    expect(stripBidiIsolates(unnegated.announcement())).toBe('Group negation removed');
  });

  it('does NOT re-run when only fieldMap mutates (untracked)', () => {
    const lastMutation = signal<FilterMutationEvent | null>({
      kind: 'add-filter',
      path: [0],
      context: { fieldKey: 'name' },
    });
    let fieldMapReads = 0;
    const fieldMapStore = signal<ReadonlyMap<string, FilterFieldDef>>(FIELDS);
    const fieldMap = ((): ReadonlyMap<string, FilterFieldDef> => {
      fieldMapReads++;
      return fieldMapStore();
    }) as unknown as typeof fieldMapStore;

    const announcer = createFilterBuilderAnnouncer({
      lastMutation,
      fieldMap,
      i18n: signal(EN_I18N),
    });

    expect(stripBidiIsolates(announcer.announcement())).toBe('Filter added: First name');
    const readsAfterFirstAnnouncement = fieldMapReads;

    fieldMapStore.set(
      new Map([
        ['name', { key: 'name', label: 'First name', editorType: 'string' }],
        ['age', { key: 'age', label: 'Years', editorType: 'number' }],
      ]),
    );

    expect(stripBidiIsolates(announcer.announcement())).toBe('Filter added: First name');
    expect(fieldMapReads).toBe(readsAfterFirstAnnouncement);
  });
});

describe('CNGX_FILTER_BUILDER_ANNOUNCER_FACTORY', () => {
  it('provides createFilterBuilderAnnouncer as the root default', () => {
    const factory = TestBed.runInInjectionContext(() => injectFilterBuilderAnnouncerFactory());
    expect(factory).toBe(createFilterBuilderAnnouncer);
  });

  it('honours consumer-supplied factory override', () => {
    const stub: CngxFilterBuilderAnnouncerFactory = (sources) => ({
      announcement: signal(`stubbed: ${sources.lastMutation()?.kind ?? 'idle'}`).asReadonly(),
    });

    TestBed.configureTestingModule({
      providers: [{ provide: CNGX_FILTER_BUILDER_ANNOUNCER_FACTORY, useValue: stub }],
    });

    const factory = TestBed.runInInjectionContext(() => injectFilterBuilderAnnouncerFactory());
    const announcer = factory(
      buildSources({ kind: 'add-filter', path: [0], context: { fieldKey: 'name' } }),
    );
    expect(stripBidiIsolates(announcer.announcement())).toBe('stubbed: add-filter');
  });
});
