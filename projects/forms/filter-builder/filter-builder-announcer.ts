import { computed, inject, InjectionToken, untracked, type Signal } from '@angular/core';
import { numberFormatterFor } from '@cngx/core/utils';

import type { CngxFilterBuilderI18n } from './filter-builder.config';
import { resolveOperatorLabel, type CngxFilterOperatorDef } from './filter-builder-operators';
import type { FilterMutationEvent } from './filter-builder-state';
import type { FilterFieldDef } from './filter-builder.types';

/**
 * Live-region announcer contract. Wraps a single `Signal<string>` the
 * component template binds into an `aria-live` region. The default
 * factory formats `lastMutation` events through `CngxFilterBuilderI18n.announcement`
 * - consumers can swap the whole formatter (locale, telemetry, test
 * doubles) by providing `CNGX_FILTER_BUILDER_ANNOUNCER_FACTORY`.
 *
 * @category forms/filter-builder/state
 */
export interface CngxFilterBuilderAnnouncer {
  readonly announcement: Signal<string>;
}

/**
 * Reactive sources the announcer factory needs to format mutation messages.
 *
 * @category forms/filter-builder/state
 */
export interface CngxFilterBuilderAnnouncerSources<TValue = unknown> {
  readonly lastMutation: Signal<FilterMutationEvent | null>;
  readonly fieldMap: Signal<ReadonlyMap<string, FilterFieldDef<TValue>>>;
  readonly i18n: Signal<CngxFilterBuilderI18n>;
  /**
   * Locale numeric filter values are spoken in. Read untracked, so a locale
   * flip never re-speaks the last mutation. Omitted: `String(value)`.
   */
  readonly locale?: Signal<string>;
  /**
   * Operator registry, so a custom operator announces its definition `label`
   * when the i18n bundle has no entry for it. Omitted: the builtin registry.
   */
  readonly operators?: ReadonlyMap<string, CngxFilterOperatorDef>;
}

/**
 * Factory signature carried by `CNGX_FILTER_BUILDER_ANNOUNCER_FACTORY`.
 *
 * @category forms/filter-builder/state
 */
export type CngxFilterBuilderAnnouncerFactory = <TValue = unknown>(
  sources: CngxFilterBuilderAnnouncerSources<TValue>,
) => CngxFilterBuilderAnnouncer;

/** @internal */
const ANNOUNCED_NUMBER: Intl.NumberFormatOptions = {
  useGrouping: false,
  maximumFractionDigits: 20,
};

/** @internal */
function renderValueForAnnouncement(
  value: unknown,
  i18n: CngxFilterBuilderI18n,
  locale: string | undefined,
): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  if (typeof value === 'boolean') {
    return (value ? i18n.booleanTrue : i18n.booleanFalse) ?? String(value);
  }
  if (typeof value === 'number' && locale) {
    return numberFormatterFor(locale, ANNOUNCED_NUMBER).format(value);
  }
  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }
  return '';
}

/**
 * Default announcer - derives the live-region string from `lastMutation` through the i18n formatter bundle.
 *
 * @category forms/filter-builder/state
 */
export function createFilterBuilderAnnouncer<TValue>(
  sources: CngxFilterBuilderAnnouncerSources<TValue>,
): CngxFilterBuilderAnnouncer {
  const announcement = computed<string>(() => {
    const event = sources.lastMutation();
    if (!event) {
      return '';
    }
    // Copy, locale and field labels are read untracked: a language flip must
    // not re-speak the last mutation; the next mutation speaks the new language.
    return untracked(() => formatMutation(event, sources));
  });
  return { announcement };
}

/** @internal */
function formatMutation<TValue>(
  event: FilterMutationEvent,
  sources: CngxFilterBuilderAnnouncerSources<TValue>,
): string {
  const ctx = event.context;
  const i18n = sources.i18n();
  const announce = i18n.announcement;
  const locale = sources.locale?.();
  const operator = ctx?.operator ?? '';
  const operatorLabel = resolveOperatorLabel(operator, i18n.operators, sources.operators);

  const fieldLabel = ctx?.fieldKey
    ? (sources.fieldMap().get(ctx.fieldKey)?.label ?? ctx.fieldKey)
    : '';

  switch (event.kind) {
    case 'add-filter':
      return announce.filterAdded({ fieldLabel });
    case 'remove-filter':
      return announce.filterRemoved({
        fieldLabel,
        operator,
        operatorLabel,
        value: renderValueForAnnouncement(ctx?.value, i18n, locale),
      });
    case 'add-group':
      return announce.groupAdded();
    case 'remove-group':
      return announce.groupRemoved();
    case 'set-logic': {
      const logic = ctx?.logic ?? 'and';
      return announce.logicChanged({ logic, logicLabel: i18n[logic] });
    }
    case 'toggle-negated':
      return ctx?.negated ? announce.groupNegated() : announce.groupUnnegated();
    case 'set-field':
      return announce.fieldChanged({ fieldLabel });
    case 'set-operator':
      return announce.operatorChanged({ operator, operatorLabel });
    case 'set-value':
      return announce.valueChanged({
        value: renderValueForAnnouncement(ctx?.value, i18n, locale),
      });
    case 'clear':
      return announce.filtersCleared();
    default:
      return '';
  }
}

/**
 * Factory that builds the live-region announcer for `<cngx-filter-builder>` -
 * a `Signal<string>` the component binds into its `aria-live` region,
 * re-derived from each `lastMutation` event through the
 * `CngxFilterBuilderI18n.announcement` formatters.
 *
 * Default: `createFilterBuilderAnnouncer`. Swap it to localise messages, route
 * them to telemetry, or stub them in tests, at root or component scope:
 *
 * ```ts
 * providers: [
 *   { provide: CNGX_FILTER_BUILDER_ANNOUNCER_FACTORY, useValue: myAnnouncer },
 * ]
 * ```
 *
 * For message text only, override `withFilterBuilderI18n({ announcement })` -
 * that keeps the default derivation and swaps just the strings.
 *
 * @category forms/filter-builder/state
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/filter-builder/filter-builder-announcer.ts
 * @since 0.1.0
 * @relatedTo createFilterBuilderAnnouncer, CngxFilterBuilderAnnouncer, withFilterBuilderI18n, CngxFilterBuilderPresenter
 */
export const CNGX_FILTER_BUILDER_ANNOUNCER_FACTORY =
  new InjectionToken<CngxFilterBuilderAnnouncerFactory>('CngxFilterBuilderAnnouncerFactory', {
    providedIn: 'root',
    factory: () => createFilterBuilderAnnouncer,
  });

/**
 * Inject-context helper that resolves `CNGX_FILTER_BUILDER_ANNOUNCER_FACTORY`.
 *
 * @category forms/filter-builder/state
 */
export function injectFilterBuilderAnnouncerFactory(): CngxFilterBuilderAnnouncerFactory {
  return inject(CNGX_FILTER_BUILDER_ANNOUNCER_FACTORY);
}
