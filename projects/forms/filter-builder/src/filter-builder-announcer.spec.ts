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

  it('formats remove-filter with field label, operator, and quoted value', () => {
    const announcer = createFilterBuilderAnnouncer(
      buildSources({
        kind: 'remove-filter',
        path: [0],
        context: { fieldKey: 'name', operator: 'contains', value: 'foo' },
      }),
    );
    expect(announcer.announcement()).toBe('Filter removed: First name contains "foo"');
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
