import type { Provider } from '@angular/core';
import { provideLocaleAt } from '@cngx/core/utils';
import { provideKpiI18n, withKpiI18nLabels } from '@cngx/common/data';
import { provideDisplayI18n, withDisplayI18nLabels } from '@cngx/common/display';
import { provideInteractiveI18n, withInteractiveI18nLabels } from '@cngx/common/interactive';
import { provideTreetableAt, withTreetableLabels } from '@cngx/data-display/treetable';
import { provideFilterBuilderConfigAt, withFilterBuilderI18n } from '@cngx/forms/filter-builder';
import { provideInputConfigAt, withInputAriaLabels } from '@cngx/forms/input';
import { provideSelectConfigAt, withAriaLabels } from '@cngx/forms/select';
import { provideFeedbackI18n } from '@cngx/ui/feedback';

// German reference pack for the examples app. Not a shipped translation: it
// proves that every surface the i18n residue pages render is reachable from
// one language file. Plain `Provider`s only, so the pack also fits a story's
// `viewProviders` (the root `provideTreetable` / `provideSelectConfig`
// variants return `EnvironmentProviders`, hence the `*At` forms).

const OPERATORS_DE: Readonly<Record<string, string>> = {
  contains: 'Enthält',
  eq: 'Gleich',
  neq: 'Ungleich',
  startsWith: 'Beginnt mit',
  endsWith: 'Endet mit',
  isEmpty: 'Ist leer',
  isNotEmpty: 'Ist nicht leer',
  gt: 'Größer als',
  gte: 'Größer oder gleich',
  lt: 'Kleiner als',
  lte: 'Kleiner oder gleich',
  between: 'Zwischen',
  in: 'In',
  notIn: 'Nicht in',
};

const SENTIMENT_DE = { positive: 'verbessert', negative: 'verschlechtert', neutral: 'unverändert' };
const DIRECTION_DE = { up: 'aufwärts', down: 'abwärts', flat: 'unverändert' };
const AVATAR_STATUS_DE = {
  online: 'online',
  offline: 'offline',
  busy: 'beschäftigt',
  away: 'abwesend',
};

/** German copy for the reactive-from-birth tokens, shared with the live-switch story. */
export const KPI_DE = {
  deltaLabel: (formatted: string, sentiment: keyof typeof SENTIMENT_DE) =>
    `${formatted} ${SENTIMENT_DE[sentiment]}`,
  trendLabel: (formatted: string, direction: keyof typeof DIRECTION_DE) =>
    `${formatted} ${DIRECTION_DE[direction]}`,
  goalValueText: (now: number, max: number) => `${now} von ${max}`,
};

export const DISPLAY_DE = {
  avatarStatus: (status: keyof typeof AVATAR_STATUS_DE) => AVATAR_STATUS_DE[status],
  avatarGroupNoun: 'Avatare',
  avatarGroupLabel: (total: number, hidden: number) =>
    hidden > 0 ? `${total} Avatare, ${hidden} ausgeblendet` : `${total} Avatare`,
  segmentedProgressValueText: (now: number, max: number) => `${now} von ${max}`,
  chipRemove: 'Entfernen',
};

export const INTERACTIVE_DE = {
  asyncClickSucceeded: 'Aktion erfolgreich',
  asyncClickFailed: 'Aktion fehlgeschlagen',
  copy: 'Kopieren',
  copied: 'Kopiert!',
  copiedAnnouncement: 'In die Zwischenablage kopiert',
  rangeMinimum: 'Minimum',
  rangeMaximum: 'Maximum',
  breadcrumb: 'Brotkrumennavigation',
};

export const POPOVER_PANEL_DE = { close: 'Schließen' };

/** The German pack, spread into the root providers by `?lang=de`. */
export const DE_PACK: Provider[] = [
  provideFeedbackI18n({
    alertsRegionLabel: 'Hinweise',
    notificationsRegionLabel: 'Benachrichtigungen',
    dismissLabel: 'Schließen',
    bannerActionFailed: 'Aktion fehlgeschlagen',
    toastRepeatCount: (count) => `(${count}-mal)`,
    loadingLabel: 'Wird geladen',
    progressLabel: 'Fortschritt',
    announcements: {
      alertDismissed: 'Hinweis geschlossen',
      alertOverflow: (count) => `+ ${count} weitere Meldungen`,
      alertOverflowVisible: (count) => `+ ${count} weitere`,
      asyncLoading: 'Inhalt wird geladen',
      asyncLoaded: 'Inhalt geladen',
      asyncError: 'Fehler beim Laden',
      asyncRefreshing: 'Inhalt wird aktualisiert',
      asyncRefreshed: 'Inhalt aktualisiert',
      asyncRefreshFailed: 'Aktualisierung fehlgeschlagen',
    },
  }),
  ...provideTreetableAt(
    withTreetableLabels({
      loading: 'Wird geladen',
      refreshing: 'Wird aktualisiert',
      errorFallback: 'Daten konnten nicht geladen werden',
      emptyFallback: 'Keine Daten',
      expand: 'Aufklappen',
      collapse: 'Zuklappen',
      selectAll: 'Alle Zeilen auswählen',
      selectRow: 'Zeile auswählen',
      rowsSelected: (n) => (n === 1 ? '1 Zeile ausgewählt' : `${n} Zeilen ausgewählt`),
      rowsDeselected: (n) => (n === 1 ? '1 Zeile abgewählt' : `${n} Zeilen abgewählt`),
    }),
  ),
  ...provideFilterBuilderConfigAt(
    withFilterBuilderI18n({
      addFilter: 'Filter hinzufügen',
      addGroup: 'Gruppe hinzufügen',
      removeFilter: 'Filter entfernen',
      removeGroup: 'Filtergruppe entfernen',
      and: 'UND',
      or: 'ODER',
      xor: 'XODER',
      logicLabel: 'Filter verknüpfen mit',
      negate: 'Negieren',
      emptyState: 'Keine Filter definiert',
      unboundFilterLabel: 'Ungebundener Filter',
      negatedTag: 'negiert',
      booleanTrue: 'wahr',
      booleanFalse: 'falsch',
      operators: OPERATORS_DE,
      groupLabel: ({ logic, negated, isRoot, logicLabel, negatedTag }) =>
        `${isRoot ? 'Oberste Filtergruppe' : 'Filtergruppe'} (${logicLabel ?? logic}${negated ? `, ${negatedTag}` : ''})`,
      expressionLabel: ({ fieldLabel, operator, operatorLabel }) =>
        `Filter: ${fieldLabel} ${(operatorLabel ?? operator) || '(kein Operator)'}`,
      announcement: {
        filterAdded: ({ fieldLabel }) => `Filter hinzugefügt: ${fieldLabel}`,
        filterRemoved: ({ fieldLabel, operator, operatorLabel, value }) =>
          `Filter entfernt: ${fieldLabel} ${operatorLabel ?? operator} ${value}`.trim(),
        groupAdded: () => 'Filtergruppe hinzugefügt',
        groupRemoved: () => 'Filtergruppe entfernt',
        logicChanged: ({ logic, logicLabel }) => `Verknüpfung geändert zu ${logicLabel ?? logic}`,
        groupNegated: () => 'Gruppe negiert',
        groupUnnegated: () => 'Negierung aufgehoben',
        fieldChanged: ({ fieldLabel }) => `Feld geändert zu ${fieldLabel}`,
        operatorChanged: ({ operator, operatorLabel }) =>
          `Operator geändert zu ${operatorLabel ?? operator}`,
        valueChanged: ({ value }) => (value ? `Wert geändert zu ${value}` : 'Wert geändert'),
        filtersCleared: () => 'Filter zurückgesetzt',
      },
    }),
  ),
  ...provideInputConfigAt(
    withInputAriaLabels({
      charCountMax: (current, max) => `${current} von ${max}`,
      charCountMin: (current, min) => `${current} (mindestens ${min})`,
    }),
  ),
  ...provideSelectConfigAt(withAriaLabels({ searchPlaceholder: 'Suchen…' })),
  provideKpiI18n(withKpiI18nLabels(KPI_DE)),
  provideInteractiveI18n(withInteractiveI18nLabels(INTERACTIVE_DE)),
  provideDisplayI18n(withDisplayI18nLabels(DISPLAY_DE)),
  ...provideLocaleAt('de-DE'),
];

export { EN_RESIDUE_STRINGS } from './i18n-en-residue.fixture';
