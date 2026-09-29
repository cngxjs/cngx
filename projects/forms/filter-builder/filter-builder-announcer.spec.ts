import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import {
  CNGX_FILTER_BUILDER_ANNOUNCER_FACTORY,
  createFilterBuilderAnnouncer,
  injectFilterBuilderAnnouncerFactory,
  type CngxFilterBuilderAnnouncerFactory,
  type CngxFilterBuilderAnnouncerSources,
} from './filter-builder-announcer';
import { CNGX_FILTER_BUILDER_DEFAULTS } from './filter-builder.config';
import type { FilterMutationEvent } from './filter-builder-state';
import type { FilterFieldDef } from './filter-builder.types';

const FIELDS: ReadonlyMap<string, FilterFieldDef> = new Map([
  ['name', { key: 'name', label: 'First name', editorType: 'string' }],
  ['age', { key: 'age', label: 'Age', editorType: 'number' }],
]);

function buildSources(event: FilterMutationEvent | null): CngxFilterBuilderAnnouncerSources {
  return {
    lastMutation: signal<FilterMutationEvent | null>(event),
    fieldMap: signal<ReadonlyMap<string, FilterFieldDef>>(FIELDS),
    i18n: CNGX_FILTER_BUILDER_DEFAULTS.i18n,
  };
}

describe('createFilterBuilderAnnouncer', () => {
  it('returns empty string when there is no last mutation', () => {
    const announcer = createFilterBuilderAnnouncer(buildSources(null));
    expect(announcer.announcement()).toBe('');
  });

  it('resolves fieldKey to fieldDef.label for add-filter', () => {
    const announcer = createFilterBuilderAnnouncer(
      buildSources({ kind: 'add-filter', path: [0], context: { fieldKey: 'name' } }),
    );
    expect(announcer.announcement()).toBe('Filter added: First name');
  });

  it('falls back to raw fieldKey when fieldMap has no entry', () => {
    const announcer = createFilterBuilderAnnouncer(
      buildSources({ kind: 'add-filter', path: [0], context: { fieldKey: 'unknown' } }),
    );
    expect(announcer.announcement()).toBe('Filter added: unknown');
  });

  it('formats remove-filter with field label, operator label, and quoted value', () => {
    const announcer = createFilterBuilderAnnouncer(
      buildSources({
        kind: 'remove-filter',
        path: [0],
        context: { fieldKey: 'name', operator: 'contains', value: 'foo' },
      }),
    );
    expect(announcer.announcement()).toBe('Filter removed: First name Contains "foo"');
  });

  it('announces the operator label, not the raw key', () => {
    const announcer = createFilterBuilderAnnouncer(
      buildSources({ kind: 'set-operator', path: [0], context: { operator: 'gte' } }),
    );
    expect(announcer.announcement()).toBe('Operator changed to Greater than or equal');
  });

  it('falls back to the raw operator key when no label exists', () => {
    const announcer = createFilterBuilderAnnouncer(
      buildSources({ kind: 'set-operator', path: [0], context: { operator: 'custom' } }),
    );
    expect(announcer.announcement()).toBe('Operator changed to custom');
  });

  it('passes translated operator, logic and boolean words to the formatters', () => {
    const base = CNGX_FILTER_BUILDER_DEFAULTS.i18n;
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
    const announcer = createFilterBuilderAnnouncer({ ...buildSources(null), lastMutation, i18n });
    expect(announcer.announcement()).toBe('Operator geändert zu Größer oder gleich');
    lastMutation.set({ kind: 'set-logic', path: [], context: { logic: 'or' } });
    expect(announcer.announcement()).toBe('Logik: ODER');
    lastMutation.set({ kind: 'set-value', path: [0], context: { value: true } });
    expect(announcer.announcement()).toBe('Wert: wahr');
  });

  it('keeps numbers as String(value) when no locale is passed', () => {
    const announcer = createFilterBuilderAnnouncer(
      buildSources({ kind: 'set-value', path: [0], context: { value: 1234.5 } }),
    );
    expect(announcer.announcement()).toBe('Value changed to 1234.5');
  });

  it('formats numbers in the passed locale without grouping', () => {
    const announcer = createFilterBuilderAnnouncer({
      ...buildSources({ kind: 'set-value', path: [0], context: { value: 1234.5 } }),
      locale: signal('de-DE'),
    });
    expect(announcer.announcement()).toBe('Value changed to 1234,5');
  });

  it('does not re-speak the last mutation when the locale flips', () => {
    const locale = signal('en-US');
    const announcer = createFilterBuilderAnnouncer({
      ...buildSources({ kind: 'set-value', path: [0], context: { value: 1.5 } }),
      locale,
    });
    const first = announcer.announcement();
    expect(first).toBe('Value changed to 1.5');
    locale.set('de-DE');
    expect(announcer.announcement()).toBe(first);
  });

  it('formats set-logic as uppercase logic name', () => {
    const announcer = createFilterBuilderAnnouncer(
      buildSources({ kind: 'set-logic', path: [], context: { logic: 'or' } }),
    );
    expect(announcer.announcement()).toBe('Logic changed to OR');
  });

  it('distinguishes group negated vs un-negated', () => {
    const negated = createFilterBuilderAnnouncer(
      buildSources({ kind: 'toggle-negated', path: [], context: { negated: true } }),
    );
    const unnegated = createFilterBuilderAnnouncer(
      buildSources({ kind: 'toggle-negated', path: [], context: { negated: false } }),
    );
    expect(negated.announcement()).toBe('Group negated');
    expect(unnegated.announcement()).toBe('Group un-negated');
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
      i18n: CNGX_FILTER_BUILDER_DEFAULTS.i18n,
    });

    expect(announcer.announcement()).toBe('Filter added: First name');
    const readsAfterFirstAnnouncement = fieldMapReads;

    fieldMapStore.set(
      new Map([
        ['name', { key: 'name', label: 'First name', editorType: 'string' }],
        ['age', { key: 'age', label: 'Years', editorType: 'number' }],
      ]),
    );

    expect(announcer.announcement()).toBe('Filter added: First name');
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
    expect(announcer.announcement()).toBe('stubbed: add-filter');
  });
});
