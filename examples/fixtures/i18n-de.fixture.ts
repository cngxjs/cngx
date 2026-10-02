import { computed, signal, type Provider } from '@angular/core';
import { provideLocaleAt } from '@cngx/core/utils';
import { provideKpiI18n, withKpiI18nLabels } from '@cngx/common/data';
import { provideDisplayI18n, withDisplayI18nLabels } from '@cngx/common/display';
import type { CngxStepperAriaLabels, CngxStepperFallbackLabels, CngxStepperI18nOverrides } from '@cngx/common/stepper';
import type { CngxTabsAriaLabels, CngxTabsFallbackLabels, CngxTabsI18n } from '@cngx/common/tabs';
import { provideInteractiveI18n, withInteractiveI18nLabels } from '@cngx/common/interactive';
import {
  provideTreetableAt,
  withTreetableLabels,
  type TreetableLabels,
} from '@cngx/data-display/treetable';
import type { ErrorMessageMap } from '@cngx/forms/field';
import { provideFilterBuilderConfigAt, withFilterBuilderI18n } from '@cngx/forms/filter-builder';
import { provideInputConfigAt, withInputAriaLabels, type InputAriaLabels } from '@cngx/forms/input';
import {
  provideSelectConfigAt,
  withFallbackLabels,
  type CngxSelectAnnouncerConfig,
  type CngxSelectAriaLabels,
  type CngxSelectFallbackLabels,
} from '@cngx/forms/select';
import { provideFeedbackI18n, type CngxFeedbackI18nOverrides } from '@cngx/ui/feedback';
import type { CngxPaginatorAnnouncements, CngxPaginatorAriaLabels } from '@cngx/ui/paginator';
import type { CngxBreadcrumbAriaLabels } from '@cngx/ui/breadcrumb';

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

/** German copy for the card, chart, layout and timeline surfaces, shared with the common live-switch story. */
export const CARD_DE = { selected: 'Ausgewählt', deselected: 'Abgewählt', loading: 'Wird geladen' };
export const CHART_DE = { empty: () => 'Keine Daten' };
export const LAYOUT_DE = {
  expandableTextMore: 'Mehr anzeigen',
  expandableTextLess: 'Weniger anzeigen',
};
export const TIMELINE_DE = { emptyFallback: 'Noch keine Ereignisse.', timelineRegion: 'Zeitleiste' };

/** German stepper copy for the stepper / tabs live-switch story. */
export const STEPPER_DE: CngxStepperI18nOverrides = {
  stepperLabel: 'Schrittfolge',
  stepIndicatorRoleDescription: 'Schrittanzeige',
  selectedStep: (label, position, count) => `Schritt ${position} von ${count}: ${label}`,
  stepHasErrors: (count) => `${count} Fehler`,
  previousStep: 'Vorheriger Schritt',
  nextStep: 'Nächster Schritt',
  commitInFlight: 'Schritt wird gespeichert…',
  commitRolledBackTo: (originLabel) => `Zurück zu Schritt „${originLabel}".`,
  stepRolledBack: (base) => `${base} Dieser Schritt wurde zurückgesetzt.`,
  statusLabels: { done: 'Erledigt', inProgress: 'In Arbeit', upNext: 'Als Nächstes', errored: 'Fehler' },
  textStepperFormat: (current, total) => `Schritt ${current} von ${total}`,
  groupSummaryCount: (total) => `${total} Schritte`,
  groupSummaryProgress: (completed, total) => `${completed} von ${total} Schritten erledigt`,
};

export const STEPPER_ARIA_DE: CngxStepperAriaLabels = { stepperRegion: 'Bestellschritte' };
export const STEPPER_FALLBACK_DE: CngxStepperFallbackLabels = {
  groupRoleDescription: 'Schrittgruppe',
  stepRoleDescription: 'Schrittfolge',
};

/** German tabs copy for the stepper / tabs live-switch story. */
export const TABS_DE: Partial<CngxTabsI18n> = {
  tabsLabel: 'Reiter',
  selectedTab: (label, position, count) => `Reiter ${position} von ${count}: ${label}`,
  tabHasErrors: (count) => `${count} Fehler`,
  moreTabsLabel: (count) => `${count} weitere`,
  previousTab: 'Vorheriger Reiter',
  nextTab: 'Nächster Reiter',
  closeTab: (label) => `„${label}" schließen`,
  addTab: 'Reiter hinzufügen',
  closedTab: (label) => (label ? `„${label}" geschlossen` : 'Reiter geschlossen'),
  commitInFlight: 'Reiter wird gewechselt…',
  commitRolledBackTo: (originLabel) => `Änderungen nicht gespeichert - zurück zu „${originLabel}".`,
};

export const TABS_ARIA_DE: CngxTabsAriaLabels = { tabsRegion: 'Reiter' };
export const TABS_FALLBACK_DE: CngxTabsFallbackLabels = {
  tabRoleDescription: 'Reiterliste',
  tabPanelRoleDescription: 'Reiterinhalt',
};

export const SELECT_ARIA_DE: CngxSelectAriaLabels = {
  clearButton: 'Auswahl zurücksetzen',
  chipRemove: 'Entfernen',
  treeExpand: 'Knoten aufklappen',
  treeCollapse: 'Knoten zuklappen',
  statusLoading: 'Optionen werden geladen',
  statusRefreshing: 'Optionen werden aktualisiert',
  fieldLabelFallback: 'Auswahl',
  commitFailedMessage: 'Speichern fehlgeschlagen',
  searchInput: 'Optionen durchsuchen',
  listboxFallback: 'Optionen',
};
export const SELECT_FALLBACK_DE: CngxSelectFallbackLabels = {
  loading: 'Wird geladen…',
  empty: 'Keine Optionen',
  loadFailed: 'Laden fehlgeschlagen',
  loadFailedRetry: 'Erneut versuchen',
  refreshFailed: 'Aktualisierung fehlgeschlagen',
  refreshFailedRetry: 'Erneut versuchen',
  searchPlaceholder: 'Suchen…',
  commitFailed: 'Speichern fehlgeschlagen',
  commitFailedRetry: 'Erneut versuchen',
};
const SELECT_VERBS_DE = {
  added: 'hinzugefügt',
  removed: 'entfernt',
  reordered: 'verschoben',
  created: 'erstellt',
};
export const SELECT_ANNOUNCER_DE: CngxSelectAnnouncerConfig = {
  format: ({ selectedLabel, fieldLabel, multi, action, count }) => {
    if (selectedLabel == null) {
      return `${fieldLabel}: Auswahl gelöscht`;
    }
    const verb = action ? SELECT_VERBS_DE[action] : 'ausgewählt';
    if (multi && typeof count === 'number') {
      return `${fieldLabel}: ${selectedLabel} ${verb}, ${count} ausgewählt`;
    }
    return `${fieldLabel}: ${selectedLabel} ${verb}`;
  },
};

const minLengthOf = (error: unknown): number =>
  (error as { minLength?: number }).minLength ?? 0;
export const ERROR_MESSAGES_EN: ErrorMessageMap = {
  required: () => 'This field is required.',
  minLength: (e) => `At least ${minLengthOf(e)} characters.`,
};
export const ERROR_MESSAGES_DE: ErrorMessageMap = {
  required: () => 'Pflichtfeld.',
  minLength: (e) => `Mindestens ${minLengthOf(e)} Zeichen.`,
};
export const INPUT_ARIA_DE: Partial<InputAriaLabels> = { clear: 'Leeren' };
export const FEEDBACK_DE: CngxFeedbackI18nOverrides = {
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
};
export const PAGINATOR_ARIA_DE: Partial<CngxPaginatorAriaLabels> = {
  label: 'Seitennavigation',
  previous: 'Vorherige Seite',
  next: 'Nächste Seite',
};
export const PAGINATOR_ANNOUNCEMENTS_DE: Partial<CngxPaginatorAnnouncements> = {
  pageChange: (page, totalPages) => `Seite ${page} von ${totalPages}`,
  loading: 'Wird geladen',
  updated: 'Aktualisiert',
};
export const ACCORDION_DE = {
  disabledReason: 'Dieser Abschnitt ist derzeit nicht verfügbar.',
  errorMessage: 'Dieser Abschnitt konnte nicht geladen werden.',
} as const;
export const BREADCRUMB_ARIA_DE: CngxBreadcrumbAriaLabels = {
  bar: 'Brotkrumenpfad',
  overflowTrigger: 'Ausgeblendete Ebenen anzeigen',
  overflowMenu: 'Ausgeblendete Ebenen',
  siblingsTrigger: 'Geschwisterseiten anzeigen',
  siblingsMenu: 'Geschwisterseiten',
};
export const TREETABLE_DE: Partial<TreetableLabels> = {
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
};

/**
 * Language of the live-switch story, flipped by its EN / DE toggle. The
 * computed sources below feed the reactive-from-birth tokens, so the flip
 * re-renders their copy without a reload. Module-level, so the story's
 * `viewProviders` can reference them.
 */
export const DEMO_LANG = signal<'en' | 'de'>('en');
const isDe = (): boolean => DEMO_LANG() === 'de';
export const DEMO_KPI_LABELS = computed(() => (isDe() ? KPI_DE : {}));
export const DEMO_DISPLAY_LABELS = computed(() => (isDe() ? DISPLAY_DE : {}));
export const DEMO_INTERACTIVE_LABELS = computed(() => (isDe() ? INTERACTIVE_DE : {}));
export const DEMO_POPOVER_PANEL_LABELS = computed(() => (isDe() ? POPOVER_PANEL_DE : {}));
export const DEMO_LOCALE = computed(() => (isDe() ? 'de-DE' : 'en-US'));
export const DEMO_CARD_LABELS = computed(() => (isDe() ? CARD_DE : {}));
export const DEMO_CHART_LABELS = computed(() => (isDe() ? CHART_DE : {}));
export const DEMO_LAYOUT_LABELS = computed(() => (isDe() ? LAYOUT_DE : {}));
export const DEMO_TIMELINE_LABELS = computed(() => (isDe() ? TIMELINE_DE : {}));
export const DEMO_STEPPER_LABELS = computed<CngxStepperI18nOverrides>(() => (isDe() ? STEPPER_DE : {}));
export const DEMO_STEPPER_ARIA_LABELS = computed<CngxStepperAriaLabels>(() =>
  isDe() ? STEPPER_ARIA_DE : {},
);
export const DEMO_STEPPER_FALLBACK_LABELS = computed<CngxStepperFallbackLabels>(() =>
  isDe() ? STEPPER_FALLBACK_DE : {},
);
/** Consumer-owned step and tab labels, translated by the same language signal. */
export const DEMO_FLOW_LABELS = computed(() =>
  isDe()
    ? {
        customer: 'Kunde',
        payment: 'Zahlung',
        review: 'Prüfung',
        profile: 'Profil',
        account: 'Konto',
        notifications: 'Benachrichtigungen',
      }
    : {
        customer: 'Customer',
        payment: 'Payment',
        review: 'Review',
        profile: 'Profile',
        account: 'Account',
        notifications: 'Notifications',
      },
);
export const DEMO_TABS_LABELS = computed<Partial<CngxTabsI18n>>(() => (isDe() ? TABS_DE : {}));
export const DEMO_TABS_ARIA_LABELS = computed<CngxTabsAriaLabels>(() => (isDe() ? TABS_ARIA_DE : {}));
export const DEMO_TABS_FALLBACK_LABELS = computed<CngxTabsFallbackLabels>(() =>
  isDe() ? TABS_FALLBACK_DE : {},
);

export const DEMO_SELECT_ARIA_LABELS = computed<CngxSelectAriaLabels>(() =>
  isDe() ? SELECT_ARIA_DE : {},
);
export const DEMO_SELECT_FALLBACK_LABELS = computed<CngxSelectFallbackLabels>(() =>
  isDe() ? SELECT_FALLBACK_DE : {},
);
export const DEMO_SELECT_ANNOUNCER = computed<CngxSelectAnnouncerConfig>(() =>
  isDe() ? SELECT_ANNOUNCER_DE : {},
);

export const DEMO_ERROR_MESSAGES = computed<ErrorMessageMap>(() =>
  isDe() ? ERROR_MESSAGES_DE : ERROR_MESSAGES_EN,
);
export const DEMO_INPUT_ARIA_LABELS = computed<Partial<InputAriaLabels>>(() =>
  isDe() ? INPUT_ARIA_DE : {},
);
export const DEMO_TREETABLE_LABELS = computed<Partial<TreetableLabels>>(() =>
  isDe() ? TREETABLE_DE : {},
);
export const DEMO_FEEDBACK_LABELS = computed<CngxFeedbackI18nOverrides>(() =>
  isDe() ? FEEDBACK_DE : {},
);
export const DEMO_PAGINATOR_ARIA_LABELS = computed<Partial<CngxPaginatorAriaLabels>>(() =>
  isDe() ? PAGINATOR_ARIA_DE : {},
);
export const DEMO_PAGINATOR_ANNOUNCEMENTS = computed<Partial<CngxPaginatorAnnouncements>>(() =>
  isDe() ? PAGINATOR_ANNOUNCEMENTS_DE : {},
);
export const DEMO_PAGINATOR_STATUS_FORMAT = computed(() =>
  isDe()
    ? (page: number, totalPages: number) => `Seite <b>${page}</b> von ${totalPages}`
    : (page: number, totalPages: number) => `Page <b>${page}</b> of ${totalPages}`,
);
export const DEMO_ACCORDION_DISABLED_REASON = computed(() =>
  isDe() ? ACCORDION_DE.disabledReason : 'This section is currently unavailable.',
);
export const DEMO_ACCORDION_ERROR_MESSAGE = computed(() =>
  isDe() ? ACCORDION_DE.errorMessage : 'This section could not be loaded.',
);
export const DEMO_BREADCRUMB_ARIA_LABELS = computed<CngxBreadcrumbAriaLabels>(() =>
  isDe() ? BREADCRUMB_ARIA_DE : {},
);

/** The German pack, spread into the root providers by `?lang=de`. */
export const DE_PACK: Provider[] = [
  provideFeedbackI18n(FEEDBACK_DE),
  ...provideTreetableAt(withTreetableLabels(TREETABLE_DE)),
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
  ...provideSelectConfigAt(withFallbackLabels({ searchPlaceholder: 'Suchen…' })),
  provideKpiI18n(withKpiI18nLabels(KPI_DE)),
  provideInteractiveI18n(withInteractiveI18nLabels(INTERACTIVE_DE)),
  provideDisplayI18n(withDisplayI18nLabels(DISPLAY_DE)),
  ...provideLocaleAt('de-DE'),
];

export { EN_RESIDUE_STRINGS } from './i18n-en-residue.fixture';
