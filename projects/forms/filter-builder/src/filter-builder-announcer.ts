import { computed, inject, InjectionToken, untracked, type Signal } from '@angular/core';

import type { CngxFilterBuilderI18n } from './filter-builder.config';
import type { FilterMutationEvent } from './filter-builder-state';
import type { FilterFieldDef } from './filter-builder.types';

/**
 * Live-region announcer contract. Wraps a single `Signal<string>` the
 * component template binds into an `aria-live` region. The default
 * factory formats `lastMutation` events through `CngxFilterBuilderI18n.announcement`
 * — consumers can swap the whole formatter (locale, telemetry, test
 * doubles) by providing `CNGX_FILTER_BUILDER_ANNOUNCER_FACTORY`.
 */
export interface CngxFilterBuilderAnnouncer {
  readonly announcement: Signal<string>;
}

export interface CngxFilterBuilderAnnouncerSources<TValue = unknown> {
  readonly lastMutation: Signal<FilterMutationEvent | null>;
  readonly fieldMap: Signal<ReadonlyMap<string, FilterFieldDef<TValue>>>;
  readonly i18n: CngxFilterBuilderI18n;
}

export type CngxFilterBuilderAnnouncerFactory = <TValue = unknown>(
  sources: CngxFilterBuilderAnnouncerSources<TValue>,
) => CngxFilterBuilderAnnouncer;

function renderValueForAnnouncement(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  return '';
}

export function createFilterBuilderAnnouncer<TValue>(
  sources: CngxFilterBuilderAnnouncerSources<TValue>,
): CngxFilterBuilderAnnouncer {
  const announcement = computed<string>(() => {
    const event = sources.lastMutation();
    if (!event) {
      return '';
    }
    const ctx = event.context;
    const announce = sources.i18n.announcement;

    const fieldLabel = ctx?.fieldKey
      ? untracked(() => sources.fieldMap().get(ctx.fieldKey!)?.label) ?? ctx.fieldKey
      : '';

    switch (event.kind) {
      case 'add-filter':
        return announce.filterAdded({ fieldLabel });
      case 'remove-filter':
        return announce.filterRemoved({
          fieldLabel,
          operator: ctx?.operator ?? '',
          value: renderValueForAnnouncement(ctx?.value),
        });
      case 'add-group':
        return announce.groupAdded();
      case 'remove-group':
        return announce.groupRemoved();
      case 'set-logic':
        return announce.logicChanged({ logic: ctx?.logic ?? 'and' });
      case 'toggle-negated':
        return ctx?.negated ? announce.groupNegated() : announce.groupUnnegated();
      case 'set-field':
        return announce.fieldChanged({ fieldLabel });
      case 'set-operator':
        return announce.operatorChanged({ operator: ctx?.operator ?? '' });
      case 'set-value':
        return announce.valueChanged({ value: renderValueForAnnouncement(ctx?.value) });
      case 'clear':
        return announce.filtersCleared();
      default:
        return '';
    }
  });
  return { announcement };
}

export const CNGX_FILTER_BUILDER_ANNOUNCER_FACTORY = new InjectionToken<CngxFilterBuilderAnnouncerFactory>(
  'CngxFilterBuilderAnnouncerFactory',
  { providedIn: 'root', factory: () => createFilterBuilderAnnouncer },
);

export function injectFilterBuilderAnnouncerFactory(): CngxFilterBuilderAnnouncerFactory {
  return inject(CNGX_FILTER_BUILDER_ANNOUNCER_FACTORY);
}
