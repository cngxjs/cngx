/**
 * Manifests for `reactive-i18n-coverage.test.mjs`.
 *
 * Kept beside the guard for the same reason as the string-coverage manifests:
 * the classification, the exempt list and the live-region manifest are the
 * auditable artefact of runtime language switching and change on a different
 * cadence than the scanner.
 *
 * Rows are keyed by `file` + `member` + `rule` + `token`, never by line. A
 * `member` is `Class.member` inside a class (`Class.constructor`,
 * `Class.template:<root>` for a template read), else the top-level
 * declaration.
 */

/**
 * A copy token: its strings reach users or assistive technology. `copyKeys`
 * is `'*'` for a dedicated i18n token (the whole value is copy); for a config
 * token, `copyKeys` and `settingsKeys` partition the interface keys exactly.
 *
 * @typedef {object} CopyTokenEntry
 * @property {string} token
 * @property {'dedicated' | 'config' | 'locale'} kind
 * @property {'*' | readonly string[]} copyKeys
 * @property {readonly string[]} settingsKeys
 * @property {string} [note]
 */

/**
 * One finding the guard knows about.
 *
 * @typedef {object} RatchetRow
 * @property {string} file
 * @property {string} member
 * @property {'R1' | 'R2' | 'R3' | 'R4'} rule
 * @property {string} token
 */

/**
 * A permanent exception. `debtRef` names the accepted-debt entry that settled
 * it, as `<register>.md#<entry heading>`.
 *
 * @typedef {object} ExemptRow
 * @property {string} file
 * @property {string} member
 * @property {'R1' | 'R2' | 'R3' | 'R4'} rule
 * @property {string} token
 * @property {string} reason
 * @property {string} debtRef
 */

/**
 * A live region that renders copy. `spec` + `testName` name the test that
 * proves it does not re-speak on a language flip. A region that only ever
 * renders consumer text is `kind: 'consumer-text'` with a `reason`.
 *
 * @typedef {object} LiveRegionEntry
 * @property {string} file
 * @property {string} region
 * @property {string} [spec]
 * @property {string} [testName]
 * @property {'consumer-text'} [kind]
 * @property {string} [reason]
 */

/** @type {readonly CopyTokenEntry[]} */
export const COPY_TOKENS = [
  {
    token: 'CNGX_STEPPER_CONFIG',
    kind: 'config',
    copyKeys: ['ariaLabels', 'fallbackLabels'],
    settingsKeys: [
      'defaultOrientation',
      'defaultLinear',
      'defaultCommitMode',
      'routerSyncMode',
      'routerSyncParam',
      'skin',
      'headerNavigation',
      'groupCollapse',
      'groupCollapseSummary',
      'density',
      'densityBreakpoints',
      'connectors',
      'mobileCollapse',
      'mobileIndicatorPosition',
      'mobileSwipe',
      'templates',
    ],
  },
  {
    token: 'CNGX_STEPPER_I18N',
    kind: 'dedicated',
    copyKeys: '*',
    settingsKeys: [],
  },
  {
    token: 'CNGX_TABS_CONFIG',
    kind: 'config',
    copyKeys: ['ariaLabels', 'fallbackLabels'],
    settingsKeys: [
      'defaultOrientation',
      'defaultLoop',
      'defaultCommitMode',
      'fragmentSyncMode',
      'fragmentSyncParam',
      'routeMatch',
      'linkAriaCurrent',
      'skin',
      'iconLayout',
      'panelMode',
      'fitted',
      'tabAlign',
      'closable',
      'addable',
      'overflowStabilizeMs',
      'overflowMaxDeferMs',
      'templates',
    ],
  },
  {
    token: 'CNGX_TABS_I18N',
    kind: 'dedicated',
    copyKeys: '*',
    settingsKeys: [],
  },
  {
    token: 'CNGX_CARD_I18N',
    kind: 'dedicated',
    copyKeys: '*',
    settingsKeys: [],
  },
  {
    token: 'CNGX_CHART_I18N',
    kind: 'dedicated',
    copyKeys: '*',
    settingsKeys: [],
  },
  {
    token: 'CNGX_KPI_I18N',
    kind: 'dedicated',
    copyKeys: '*',
    settingsKeys: [],
  },
  {
    token: 'CNGX_RECYCLER_I18N',
    kind: 'dedicated',
    copyKeys: '*',
    settingsKeys: [],
  },
  {
    token: 'CNGX_DIALOG_DEFAULTS',
    kind: 'config',
    copyKeys: ['labels'],
    settingsKeys: [],
  },
  {
    token: 'CNGX_DISPLAY_I18N',
    kind: 'dedicated',
    copyKeys: '*',
    settingsKeys: [],
  },
  {
    token: 'CNGX_INTERACTIVE_I18N',
    kind: 'dedicated',
    copyKeys: '*',
    settingsKeys: [],
  },
  {
    token: 'CNGX_MENU_CONFIG',
    kind: 'config',
    copyKeys: ['ariaLabels'],
    settingsKeys: [
      'typeaheadDebounce',
      'submenuOpenDelay',
      'submenuCloseDelay',
      'closeOnSelect',
      'dismissOnOutsideClick',
      'dismissOnScroll',
      'dismissOnBlur',
    ],
  },
  {
    token: 'CNGX_LAYOUT_I18N',
    kind: 'dedicated',
    copyKeys: '*',
    settingsKeys: [],
  },
  {
    token: 'CNGX_POPOVER_PANEL_CONFIG',
    kind: 'config',
    copyKeys: ['labels'],
    settingsKeys: [
      'autoDismiss',
      'closeOnSuccessDelay',
      'defaultVariant',
      'showClose',
      'showArrow',
      'templates',
    ],
  },
  {
    token: 'CNGX_TIMELINE_CONFIG',
    kind: 'config',
    copyKeys: ['labels'],
    settingsKeys: ['templates'],
  },
  {
    token: 'CNGX_SELECT_CONFIG',
    kind: 'config',
    copyKeys: ['ariaLabels', 'fallbackLabels', 'announcer'],
    settingsKeys: [
      'panelWidth',
      'loadingVariant',
      'skeletonRowCount',
      'refreshingVariant',
      'commitErrorDisplay',
      'popoverPlacement',
      'inputMode',
      'enterKeyHint',
      'chipOverflow',
      'virtualization',
      'maxVisibleChips',
      'commitErrorAnnouncePolicy',
      'panelClass',
      'typeaheadDebounceInterval',
      'typeaheadWhileClosed',
      'searchMatchFn',
      'showSelectionIndicator',
      'selectionIndicatorPosition',
      'selectionIndicatorVariant',
      'showCaret',
      'restoreFocus',
      'dismissOn',
      'openOn',
      'templates',
    ],
    note: 'announcer carries the live-region formatter next to enabled / politeness',
  },
  {
    token: 'CNGX_ACTION_SELECT_CONFIG',
    kind: 'config',
    copyKeys: ['ariaLabel'],
    settingsKeys: [
      'focusTrapBehavior',
      'closeOnCreate',
      'actionPosition',
      'liveInputFallback',
      'popoverPlacement',
    ],
  },
  {
    token: 'CNGX_REORDERABLE_SELECT_CONFIG',
    kind: 'config',
    copyKeys: ['ariaLabel'],
    settingsKeys: ['keyboardModifier', 'dragHandle', 'freezeStripOnCommit'],
  },
  {
    token: 'CNGX_ERROR_MESSAGES',
    kind: 'dedicated',
    copyKeys: '*',
    settingsKeys: [],
  },
  {
    token: 'CNGX_FORM_FIELD_I18N',
    kind: 'dedicated',
    copyKeys: '*',
    settingsKeys: [],
  },
  {
    token: 'CNGX_FORM_FIELD_CONFIG',
    kind: 'config',
    copyKeys: ['errorMessages', 'constraintHints'],
    settingsKeys: [
      'autocompleteMappings',
      'noSpellcheckFields',
      'requiredMarker',
      'errorStrategy',
      'skin',
    ],
  },
  {
    token: 'CNGX_FILTER_BUILDER_CONFIG',
    kind: 'config',
    copyKeys: ['i18n'],
    settingsKeys: [
      'templates',
      'maxNestingDepth',
      'defaultOperators',
      'operators',
      'caseInsensitive',
      'logicOptions',
      'negationEnabled',
    ],
    note: 'operators are consumer operator definitions; built-in operator labels ride i18n.operators',
  },
  {
    token: 'CNGX_INPUT_CONFIG',
    kind: 'config',
    copyKeys: ['ariaLabels', 'numericLocale'],
    settingsKeys: [
      'phonePatterns',
      'ibanPatterns',
      'zipPatterns',
      'dateFormats',
      'maskPlaceholder',
      'maskGuide',
      'customTokens',
      'numericDecimals',
      'numericStep',
      'numericCurrency',
      'copyResetDelay',
      'fileMaxSize',
      'fileMaxFiles',
      'phoneDefaultRegion',
    ],
    note: 'numericLocale outranks CNGX_LOCALE for numeric inputs, so it is locale copy',
  },
  {
    token: 'CNGX_TREETABLE_CONFIG',
    kind: 'config',
    copyKeys: ['labels'],
    settingsKeys: ['highlightRowOnHover', 'dateFormat', 'templates'],
  },
  {
    token: 'CNGX_FEEDBACK_I18N',
    kind: 'dedicated',
    copyKeys: '*',
    settingsKeys: [],
  },
  {
    token: 'CNGX_DATA_GRID_ACCORDION_CONFIG',
    kind: 'config',
    copyKeys: ['labels'],
    settingsKeys: ['skin'],
  },
  {
    token: 'CNGX_SIDENAV_CONFIG',
    kind: 'config',
    copyKeys: ['labels'],
    settingsKeys: ['dimensions', 'hover', 'routerSync', 'shortcut'],
  },
  {
    token: 'CNGX_SPEAK_I18N',
    kind: 'dedicated',
    copyKeys: '*',
    settingsKeys: [],
  },
  {
    token: 'CNGX_COMMAND_PALETTE_CONFIG',
    kind: 'config',
    copyKeys: [
      'searchPlaceholder',
      'listboxLabel',
      'emptyLabel',
      'loadingLabel',
      'errorLabel',
      'retryLabel',
      'paletteLabel',
      'resultCount',
      'footerLegend',
    ],
    settingsKeys: ['openShortcut', 'templates'],
  },
  {
    token: 'CNGX_PAGINATOR_CONFIG',
    kind: 'config',
    copyKeys: ['ariaLabels', 'announcements', 'formats'],
    settingsKeys: ['pageSizeOptions', 'templates'],
  },
  {
    token: 'CNGX_ACCORDION_CONFIG',
    kind: 'config',
    copyKeys: ['disabledReason', 'errorMessage'],
    settingsKeys: ['headingLevel', 'skin', 'templates'],
  },
  {
    token: 'CNGX_BREADCRUMB_CONFIG',
    kind: 'config',
    copyKeys: ['ariaLabels'],
    settingsKeys: ['router', 'skin'],
  },
  {
    token: 'CNGX_CHART_PANEL_CONFIG',
    kind: 'config',
    copyKeys: ['ariaLabels'],
    settingsKeys: ['legendPosition'],
  },
  {
    token: 'CNGX_INCREMENTAL_LIST_CONFIG',
    kind: 'config',
    copyKeys: ['ariaLabels'],
    settingsKeys: ['templates'],
  },
  {
    token: 'CNGX_STAT_CARD_CONFIG',
    kind: 'config',
    copyKeys: ['ariaLabels'],
    settingsKeys: ['loadingTreatment'],
  },
  {
    token: 'CNGX_TOC_CONFIG',
    kind: 'config',
    copyKeys: ['ariaLabels'],
    settingsKeys: ['scrollBehavior', 'spy', 'templates'],
  },
  {
    token: 'CNGX_A11Y_PANEL_CONFIG',
    kind: 'config',
    copyKeys: ['labels', 'axes'],
    settingsKeys: [],
    note: 'axes carries the option labels next to their values',
  },
  {
    token: 'CNGX_LOCALE',
    kind: 'locale',
    copyKeys: '*',
    settingsKeys: [],
    note: 'copy-equivalent source; a locale row closes with the lib that reads it',
  },
  {
    token: 'CNGX_LANGUAGE_PACK',
    kind: 'locale',
    copyKeys: '*',
    settingsKeys: [],
    note: 'copy-equivalent source like CNGX_LOCALE: the active pack feeds the area tokens through their sections',
  },
];

/** @type {readonly string[]} */
export const SETTINGS_TOKENS = [
  'CNGX_A11Y_STORAGE',
  'CNGX_ACCORDION',
  'CNGX_ACCORDION_GROUP',
  'CNGX_ACTION_HOST_BRIDGE_FACTORY',
  'CNGX_AD_ITEM',
  'CNGX_ARRAY_COMMIT_HANDLER_FACTORY',
  'CNGX_AUDIO_CONFIG',
  'CNGX_AUDIO_ENGINE',
  'CNGX_AUDIO_ENGINE_FACTORY',
  'CNGX_AUDIO_TONE_GENERATOR_FACTORY',
  'CNGX_BREADCRUMB',
  'CNGX_BREADCRUMB_COLLAPSE_STRATEGY',
  'CNGX_BREADCRUMB_ITEMS_SOURCE',
  'CNGX_BREADCRUMB_SIBLINGS_SOURCE',
  'CNGX_BUCKET_PAGINATE_HOST',
  'CNGX_BUTTON_MULTI_TOGGLE_GROUP',
  'CNGX_BUTTON_TOGGLE_GROUP',
  'CNGX_CHART_AXIS',
  'CNGX_CHART_CONTEXT',
  'CNGX_CHART_LAYER',
  'CNGX_CHART_PANEL',
  'CNGX_CHART_RENDERER_FACTORY',
  'CNGX_CHART_RENDERER_THRESHOLD',
  'CNGX_CHIP_GROUP_HOST',
  'CNGX_CHIP_REMOVAL_HANDLER_FACTORY',
  'CNGX_CHIP_STRIP_ROVING_FACTORY',
  'CNGX_CLOSE_ICON',
  'CNGX_COMMAND_MATCH_FACTORY',
  'CNGX_COMMAND_PALETTE_HOST',
  'CNGX_COMMAND_SOURCE',
  'CNGX_COMMIT_CONTROLLER_FACTORY',
  'CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY',
  'CNGX_CONTAINER_SIZE',
  'CNGX_CONTEXT_MENU_PANEL',
  'CNGX_CONTRAST',
  'CNGX_CONTROL_VALUE',
  'CNGX_CREATE_COMMIT_HANDLER_FACTORY',
  'CNGX_DATA_GRID_ACCORDION',
  'CNGX_DENSITY',
  'CNGX_DIALOG_ARIA_REGISTRY',
  'CNGX_DIALOG_DATA',
  'CNGX_DIRECTION',
  'CNGX_DIRECTIVE_BY_ID_MAP_FACTORY',
  'CNGX_DISMISS_HANDLER_FACTORY',
  'CNGX_DISPLAY_BINDING_FACTORY',
  'CNGX_DOM_ANCHOR_RETRY_FACTORY',
  'CNGX_ERROR_AGGREGATOR',
  'CNGX_ERROR_SCOPE',
  'CNGX_FEEDBACK_CONFIG',
  'CNGX_FIELD_AFFIX',
  'CNGX_FIELD_BOX',
  'CNGX_FILTER_BUILDER_ANNOUNCER_FACTORY',
  'CNGX_FILTER_BUILDER_BODY_HOST',
  'CNGX_FILTER_BUILDER_HOST',
  'CNGX_FILTER_BUILDER_STATE_FACTORY',
  'CNGX_FILTER_BUILDER_TEMPLATE_REGISTRY_FACTORY',
  'CNGX_FILTER_EDITORS',
  'CNGX_FILTER_ROW_CONTROLLER_FACTORY',
  'CNGX_FLAT_NAV_STRATEGY',
  'CNGX_FLOATING_FALLBACK',
  'CNGX_FORM_FIELD_CONTROL',
  'CNGX_FORM_FIELD_HOST',
  'CNGX_FORM_FIELD_REVEAL',
  'CNGX_HIERARCHICAL_NAV_STRATEGY',
  'CNGX_HOVER_INTENT_DEFAULTS',
  'CNGX_LOADING_CONFIG',
  'CNGX_LOCAL_ITEMS_BUFFER_FACTORY',
  'CNGX_MAT_STEP_HANDLE_FACTORY',
  'CNGX_MAT_TABS_CONFIG',
  'CNGX_MAT_TABS_REGISTRY_HOST',
  'CNGX_MAT_TAB_HANDLE_FACTORY',
  'CNGX_MENU_ANNOUNCER_FACTORY',
  'CNGX_MENU_DISMISS_HANDLER_FACTORY',
  'CNGX_MENU_FOCUS_STACK_FACTORY',
  'CNGX_MENU_HOST',
  'CNGX_MENU_NAV_STRATEGY',
  'CNGX_MENU_RADIO_GROUP',
  'CNGX_MENU_SUBMENU_ITEM',
  'CNGX_MENU_SUBMENU_WIRING',
  'CNGX_MOTION',
  'CNGX_NAV_CONFIG',
  'CNGX_OPTION_CONTAINER',
  'CNGX_OPTION_FILTER_HOST',
  'CNGX_OPTION_INTERACTION_HOST',
  'CNGX_OPTION_STATUS_HOST',
  'CNGX_ORGANISM_SCROLL_SYNC_FACTORY',
  'CNGX_OVERFLOW_POPOVER_HIGHLIGHT_FACTORY',
  'CNGX_PAGINATOR_ANNOUNCER_FACTORY',
  'CNGX_PAGINATOR_HOST',
  'CNGX_PAGINATOR_PAGE_WINDOW_FACTORY',
  'CNGX_PALETTE_KEYBINDING_FACTORY',
  'CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY',
  'CNGX_PANEL_RENDERER_FACTORY',
  'CNGX_PASSWORD_STRENGTH_FACTORY',
  'CNGX_PHONE_METADATA',
  'CNGX_POPOVER_ARROW_BOUNDS',
  'CNGX_PROJECTED_OPTION_MODEL_FACTORY',
  'CNGX_RADIO_GROUP',
  'CNGX_RECYCLER_PLACEHOLDER_ROW',
  'CNGX_REORDER_COMMIT_HANDLER_FACTORY',
  'CNGX_SCALAR_COMMIT_HANDLER_FACTORY',
  'CNGX_SEARCH_EFFECTS_FACTORY',
  'CNGX_SELECTION_CONTROLLER_FACTORY',
  'CNGX_SELECT_COMMIT_CONTROLLER_FACTORY',
  'CNGX_SELECT_DISABLE_FIELD_SYNC',
  'CNGX_SELECT_PANEL_HOST',
  'CNGX_SELECT_PANEL_VIEW_HOST',
  'CNGX_SELECT_SHELL_SEARCH_HOST',
  'CNGX_SIDENAV',
  'CNGX_SLIDER_RANGE',
  'CNGX_STAT',
  'CNGX_STATEFUL',
  'CNGX_STEPPER_COMMIT_HANDLER_FACTORY',
  'CNGX_STEPPER_HOST',
  'CNGX_STEP_GROUP_HOST',
  'CNGX_STEP_PANEL_HOST',
  'CNGX_TABS_COMMIT_ACTION',
  'CNGX_TABS_COMMIT_HANDLER_FACTORY',
  'CNGX_TAB_GROUP_HOST',
  'CNGX_TAB_NAV_HOST',
  'CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY',
  'CNGX_TAB_PANEL_HOST',
  'CNGX_TAB_URL_MATCH_STRATEGY',
  'CNGX_TAG_CONFIG',
  'CNGX_TAG_GROUP',
  'CNGX_TEMPLATE_REGISTRY_FACTORY',
  'CNGX_TEXT_SCALE',
  'CNGX_TIMELINE_GROUPING_FACTORY',
  'CNGX_TIMELINE_MARKER_HOST',
  'CNGX_TIMELINE_VIEW_FACTORY',
  'CNGX_TOC',
  'CNGX_TOUCH_TARGET',
  'CNGX_TREE_CONFIG',
  'CNGX_TREE_CONTROLLER_FACTORY',
  'CNGX_TREE_SELECT_PANEL_HOST',
  'CNGX_TRIGGER_FOCUS_FACTORY',
  'CNGX_VALUE_TRANSFORMER',
  'DIALOG_REF',
  'ENVIRONMENT',
  'WINDOW',
];

/**
 * Functions whose body may dereference raw copy: the resolver choke points a
 * reader goes through.
 *
 * @type {readonly string[]}
 */
export const HELPERS = [
  'injectResolvedFeedbackI18n',
  'injectChartI18n',
  'resolveSelectConfig',
  'resolveCommandPaletteCopy',
  'resolveAccordionCopy',
];

/**
 * Reader functions that return a locale-kind token's Signal, by name, mapped
 * to that token. A call is treated exactly like `inject(<token>)`, so a
 * snapshot of it (R2) or a tracked read in a live region (R4) is a finding.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const LOCALE_READERS = {
  injectLocale: 'CNGX_LOCALE',
  injectLanguageSection: 'CNGX_LANGUAGE_PACK',
};

/**
 * Findings that are neither fixed nor exempt. Permanently empty: a new copy
 * input, snapshot, raw dereference or tracked live-region read is fixed in the
 * commit that introduces it, or settled as accepted debt on `EXEMPT`.
 *
 * @type {readonly RatchetRow[]}
 */
export const RATCHET = [];

/** @type {readonly ExemptRow[]} */
export const EXEMPT = [
  {
    file: 'projects/forms/input/phone-input/phone-input.component.ts',
    member: 'CngxPhoneInput.country',
    rule: 'R1',
    token: 'CNGX_LOCALE',
    reason:
      'model<Country> default; widening it breaks [(country)] bindings to Country-typed targets, and resolvedCountry re-matches the region against the live list, so the shown name follows a flip anyway',
    debtRef: 'forms-accepted-debt.md#phone-input country default',
  },
];

/** @type {readonly LiveRegionEntry[]} */
export const LIVE_REGIONS = [
  {
    file: 'projects/common/card/card.component.ts',
    region: 'CngxCard.span(liveAnnouncement,liveRegionId)',
    spec: 'projects/common/card/card.component.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/common/chart/chart/chart-announcer.component.ts',
    region: 'CngxChartAnnouncer.span(assertiveAnnouncement)',
    spec: 'projects/common/chart/chart/chart-announcer.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/common/chart/chart/chart-announcer.component.ts',
    region: 'CngxChartAnnouncer.span(politeAnnouncement)',
    spec: 'projects/common/chart/chart/chart-announcer.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/common/chart/chart/chart.component.ts',
    region: 'CngxChart.div(connectionOverlayText)',
    spec: 'projects/common/chart/chart/chart.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/common/chart/chart/chart.component.ts',
    region: 'CngxChart.div(connectionOverlayText)#2',
    spec: 'projects/common/chart/chart/chart.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/common/chart/chart/chart.component.ts',
    region: 'CngxChart.span(connectionRestoredAnnouncement)',
    spec: 'projects/common/chart/chart/chart.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/common/interactive/async-click/async-click.directive.ts',
    region: 'CngxAsyncClick.installAnnounceRegion:effect#1',
    spec: 'projects/common/interactive/async-click/async-click.directive.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/common/interactive/copy/copy-block.ts',
    region: 'CngxCopyBlock.span(liveAnnouncement)',
    spec: 'projects/common/interactive/copy/copy-block.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/common/interactive/menu/menu-item-submenu.directive.ts',
    region: 'CngxMenuItemSubmenu.constructor:effect#1',
    spec: 'projects/common/interactive/menu/menu-item-submenu.directive.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/common/stepper/stepper-count.ts',
    region: 'CngxStepperCount.span(liveLabel)',
    spec: 'projects/common/stepper/stepper-count.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/data-display/treetable/treetable.component.ts',
    region: 'CngxTreetable.span(stateAnnouncement)',
    spec: 'projects/data-display/treetable/treetable.component.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/forms/field/field-errors.component.ts',
    region: 'CngxFieldErrors.host',
    spec: 'projects/forms/field/field-errors.component.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/forms/field/form-errors.component.ts',
    region: 'CngxFormErrors.host',
    spec: 'projects/forms/field/form-errors.component.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/forms/input/password-strength.directive.ts',
    region: 'CngxPasswordStrength.constructor:effect#1',
    spec: 'projects/forms/input/password-strength.directive.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/forms/select/shared/internal/panel-shell/panel-shell.component.ts',
    region: 'CngxSelectPanelShell.div(commitErrorCopy,host.commitErrorContext,host.tpl)',
    spec: 'projects/forms/select/shared/internal/panel-shell/panel-shell.component.spec.ts',
    testName: 'keeps the commit-error banner and its retry label on a language flip',
  },
  {
    file: 'projects/forms/select/shared/internal/panel-shell/panel-shell.component.ts',
    region: 'CngxSelectPanelShell.div(host.errorContext,host.handleRetry,host.tpl,inlineErrorCopy)',
    spec: 'projects/forms/select/shared/internal/panel-shell/panel-shell.component.spec.ts',
    testName: 'keeps the inline refresh error and its retry label on a language flip',
  },
  {
    file: 'projects/forms/select/shared/internal/panel-shell/panel-shell.component.ts',
    region: 'CngxSelectPanelShell.div(host.errorContext,host.handleRetry,host.tpl,viewCopy)',
    spec: 'projects/forms/select/shared/internal/panel-shell/panel-shell.component.spec.ts',
    testName: 'keeps the first-load error and its retry label on a language flip',
  },
  {
    file: 'projects/forms/select/shared/internal/panel-shell/panel-shell.component.ts',
    region: 'CngxSelectPanelShell.div(host.skeletonIndices,viewCopy)',
    spec: 'projects/forms/select/shared/internal/panel-shell/panel-shell.component.spec.ts',
    testName: 'keeps the skeleton loading label on a language flip',
  },
  {
    file: 'projects/forms/select/shared/internal/panel-shell/panel-shell.component.ts',
    region: 'CngxSelectPanelShell.div(host.tpl,refreshingLabel)',
    spec: 'projects/forms/select/shared/internal/panel-shell/panel-shell.component.spec.ts',
    testName: 'keeps the spinner refreshing label on a language flip',
  },
  {
    file: 'projects/forms/select/shared/internal/panel-shell/panel-shell.component.ts',
    region: 'CngxSelectPanelShell.div(host.tpl,refreshingLabel)#2',
    spec: 'projects/forms/select/shared/internal/panel-shell/panel-shell.component.spec.ts',
    testName: 'keeps the dots refreshing label on a language flip',
  },
  {
    file: 'projects/forms/select/shared/internal/panel-shell/panel-shell.component.ts',
    region: 'CngxSelectPanelShell.div(host.tpl,refreshingLabel)#3',
    spec: 'projects/forms/select/shared/internal/panel-shell/panel-shell.component.spec.ts',
    testName: 'keeps the bar refreshing label on a language flip',
  },
  {
    file: 'projects/forms/select/shared/internal/panel-shell/panel-shell.component.ts',
    region: 'CngxSelectPanelShell.div(host.tpl,viewCopy)',
    spec: 'projects/forms/select/shared/internal/panel-shell/panel-shell.component.spec.ts',
    testName: 'keeps the spinner loading label on a language flip',
  },
  {
    file: 'projects/forms/select/shared/internal/panel-shell/panel-shell.component.ts',
    region: 'CngxSelectPanelShell.div(host.tpl,viewCopy)#2',
    spec: 'projects/forms/select/shared/internal/panel-shell/panel-shell.component.spec.ts',
    testName: 'keeps the bar loading label on a language flip',
  },
  {
    file: 'projects/forms/select/shared/internal/panel-shell/panel-shell.component.ts',
    region: 'CngxSelectPanelShell.div(viewCopy)',
    spec: 'projects/forms/select/shared/internal/panel-shell/panel-shell.component.spec.ts',
    testName: 'keeps the text loading message on a language flip',
  },
  {
    file: 'projects/ui/accordion/accordion-item.component.ts',
    region: 'CngxAccordionItem.div(errorTemplate,resolvedErrorMessage)',
    spec: 'projects/ui/accordion/accordion-item.component.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/ui/action-button/action-button.ts',
    region: 'CngxActionButton.span(effectiveAnnouncement)',
    spec: 'projects/ui/action-button/action-button.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/ui/chart-panel/chart-panel.component.ts',
    region: 'CngxChartPanel.span(busyStatus)',
    spec: 'projects/ui/chart-panel/chart-panel.component.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/ui/collection/incremental-list.component.ts',
    region: 'CngxIncrementalList.span(statusMessage)',
    spec: 'projects/ui/collection/incremental-list.component.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/ui/command-palette/panel/command-panel-shell.component.ts',
    region: 'CngxCommandPanelShell.div(errorText,retry.emit,retryText)',
    spec: 'projects/ui/command-palette/panel/command-panel-shell.component.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/ui/command-palette/panel/command-panel-shell.component.ts',
    region: 'CngxCommandPanelShell.div(errorText)',
    spec: 'projects/ui/command-palette/panel/command-panel-shell.component.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/ui/command-palette/panel/command-panel.component.ts',
    region: 'CngxCommandPanel.span(countMessage)',
    spec: 'projects/ui/command-palette/panel/command-panel.component.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/ui/data-grid-accordion/data-grid-row.component.ts',
    region: 'CngxDataGridRow.div(errorTemplate,resolvedErrorMessage)',
    spec: 'projects/ui/data-grid-accordion/data-grid-row.component.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/ui/feedback/alert/alert-stack.ts',
    region: 'CngxAlertStack.div(dismissLabel,iconFor)',
    spec: 'projects/ui/feedback/alert/alert-stack.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/ui/feedback/alert/alert.ts',
    region: 'CngxAlert.host',
    spec: 'projects/ui/feedback/alert/alert.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/ui/feedback/banner/banner-outlet.ts',
    region:
      'CngxBannerOutlet.div(actionFailedCopy,dismissLabel,iconFor,pastFirstRender,service.dismiss,service.executeAction)',
    spec: 'projects/ui/feedback/banner/banner-outlet.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/ui/feedback/banner/banner-outlet.ts',
    region: 'CngxBannerOutlet.span(actionFailedCopy)',
    spec: 'projects/ui/feedback/banner/banner-outlet.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/ui/feedback/loading/loading-indicator.ts',
    region: 'CngxLoadingIndicator.host',
    spec: 'projects/ui/feedback/loading/loading-indicator.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/ui/feedback/loading/loading-overlay.ts',
    region: 'CngxLoadingOverlay.div(resolvedLabel)',
    spec: 'projects/ui/feedback/loading/loading-overlay.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/ui/feedback/toast/toast-outlet.ts',
    region:
      'CngxToastOutlet.div(dismissLabel,iconFor,repeatCount,service.dismiss,service.pauseTimer,service.resumeTimer)',
    spec: 'projects/ui/feedback/toast/toast-outlet.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/ui/mat-paginator/mat-paginator-bridge.directive.ts',
    region: 'CngxMatPaginator.constructor:effect#1',
    spec: 'projects/ui/mat-paginator/mat-paginator-bridge.directive.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/ui/stat-card/stat-card.component.ts',
    region:
      'CngxStatCard.cngx-card(activeView,cardLabelledBy,live,resolvedBusyLabel,resolvedEmptyText,resolvedErrorDescription,resolvedErrorText,resolvedStaleText,resolvedTreatment,showRefreshIndicator,skeletonSlots)',
    spec: 'projects/ui/stat-card/stat-card.component.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/ui/stepper/dot-stepper.component.ts',
    region: 'CngxDotStepper.span(errorText)',
    spec: 'projects/ui/stepper/dot-stepper.component.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/ui/stepper/progress-bar-stepper.component.ts',
    region: 'CngxProgressBarStepper.span(errorText)',
    spec: 'projects/ui/stepper/progress-bar-stepper.component.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/ui/stepper/stepper.component.ts',
    region: 'CngxStepper.span(announcement.liveAnnouncement)',
    spec: 'projects/ui/stepper/stepper.component.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/ui/stepper/stepper.component.ts',
    region: 'CngxStepper.span(mobileErrorSummary)',
    spec: 'projects/ui/stepper/stepper.component.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/ui/stepper/stepper.component.ts',
    region: 'CngxStepper.span(mobileErrorSummary)#2',
    spec: 'projects/ui/stepper/stepper.component.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/ui/stepper/text-stepper.component.ts',
    region: 'CngxTextStepper.span(errorText)',
    spec: 'projects/ui/stepper/text-stepper.component.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/ui/stepper/text-stepper.component.ts',
    region: 'CngxTextStepper.span(stepText)',
    spec: 'projects/ui/stepper/text-stepper.component.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
  {
    file: 'projects/ui/tabs/tab-group.component.ts',
    region: 'CngxTabGroup.span(announcements.liveAnnouncement)',
    spec: 'projects/common/tabs/announcements/tab-group-announcements.spec.ts',
    testName: 'does not re-announce on a language flip',
  },
];

// ---------------------------------------------------------------------------
// Rule fixtures: one in-memory program, a negative and a passing file per
// rule. The prescribed shapes from the plan are the passing files.

const TOKENS = `
import { InjectionToken, computed, inject, signal, type Signal } from '@angular/core';

export interface DemoI18n {
  readonly previous: string;
  readonly count: (n: number) => string;
}

export interface DemoSignalI18n {
  readonly previous: string;
  readonly count: (n: number) => string;
}

export interface DemoLabels {
  readonly clear: string;
  readonly more: string;
}

export interface DemoConfig {
  readonly ariaLabels: DemoLabels;
  readonly title: string;
  readonly delay: number;
}

export const DEMO_DEFAULTS: DemoConfig = {
  ariaLabels: { clear: 'Clear', more: 'More' },
  title: 'Title',
  delay: 0,
};

const DEMO_I18N_DEFAULTS: DemoI18n = { previous: 'Previous', count: (n) => n + ' items' };

export const DEMO_I18N = new InjectionToken<DemoI18n>('DemoI18n', {
  providedIn: 'root',
  factory: () => DEMO_I18N_DEFAULTS,
});

export const DEMO_SIGNAL_I18N = new InjectionToken<Signal<DemoSignalI18n>>('DemoSignalI18n', {
  providedIn: 'root',
  factory: () => signal<DemoSignalI18n>(DEMO_I18N_DEFAULTS).asReadonly(),
});

export const DEMO_CONFIG = new InjectionToken<DemoConfig>('DemoConfig', {
  providedIn: 'root',
  factory: () => DEMO_DEFAULTS,
});

export const DEMO_LOCALE = new InjectionToken<Signal<string>>('DemoLocale', {
  providedIn: 'root',
  factory: () => signal('en').asReadonly(),
});

export const DEMO_DELAY = new InjectionToken<number>('DemoDelay');

export function injectLocale(): Signal<string> {
  return inject(DEMO_LOCALE);
}

export interface DemoSection {
  readonly title: string;
  readonly saved: string;
}

export const DEMO_PACK = new InjectionToken<Signal<{ readonly demo?: DemoSection }>>('DemoPack', {
  providedIn: 'root',
  factory: () => signal({}).asReadonly(),
});

export function injectLanguageSection(key: 'demo'): Signal<DemoSection | undefined> {
  const pack = inject(DEMO_PACK);
  return computed(() => pack()[key]);
}

export function injectDemoPrevious(): string {
  return inject(DEMO_I18N).previous;
}
`;

const HELPER_FUNCTIONS = `
import { computed, isSignal, signal, type Signal } from '@angular/core';

export function coerceSignal<T>(source: T | Signal<T>): Signal<T> {
  return isSignal(source) ? source : signal(source).asReadonly();
}

export function createOverrideMerge<T extends object>(
  defaults: T | Signal<T>,
  overrides: Partial<T> | Signal<Partial<T>> | undefined,
): Signal<T> {
  const d = coerceSignal(defaults);
  const o = coerceSignal<Partial<T>>(overrides ?? {});
  return computed(() => ({ ...d(), ...o() }));
}
`;

const R1 = `
import { Directive, computed, inject, input } from '@angular/core';
import { DEMO_CONFIG, DEMO_SIGNAL_I18N, injectLocale } from './tokens';

@Directive({ selector: '[r1]' })
export class R1Static {
  protected readonly i18n = inject(DEMO_SIGNAL_I18N);
  protected readonly cfg = inject(DEMO_CONFIG);
  protected readonly fallback = computed(() => this.i18n().previous);
  readonly previousLabel = input(this.i18n().previous);
  readonly title = input(this.cfg.title ?? 'Title');
  readonly localeInput = input(injectLocale()());
  readonly fromCarrier = input(this.fallback());
}
`;

const R1_PASS = `
import { Directive, computed, inject, input } from '@angular/core';
import { DEMO_SIGNAL_I18N } from './tokens';

@Directive({ selector: '[r1Pass]' })
export class R1Reactive {
  protected readonly i18n = inject(DEMO_SIGNAL_I18N);
  readonly previousLabel = input<string | undefined>(undefined);
  protected readonly resolvedPrevious = computed(
    () => this.previousLabel() ?? this.i18n().previous,
  );
}
`;

const R2 = `
import { Directive, InjectionToken, inject } from '@angular/core';
import { DEMO_SIGNAL_I18N, injectLocale } from './tokens';

@Directive({ selector: '[r2]' })
export class R2Snapshot {
  protected readonly i18n = inject(DEMO_SIGNAL_I18N);
  protected readonly snapshot = this.i18n().previous;
  protected readonly lang: string;

  constructor() {
    this.lang = injectLocale()();
  }
}

export const DEMO_FORMAT = new InjectionToken<Intl.NumberFormat>('DemoFormat', {
  providedIn: 'root',
  factory: () => new Intl.NumberFormat(injectLocale()()),
});
`;

const R2_PASS = `
import { Directive, computed, inject } from '@angular/core';
import { coerceSignal, createOverrideMerge } from './helpers';
import { DEMO_CONFIG, DEMO_DEFAULTS, injectLocale } from './tokens';

@Directive({ selector: '[r2Pass]' })
export class R2Lazy {
  protected readonly cfg = inject(DEMO_CONFIG);
  protected readonly labels = createOverrideMerge(DEMO_DEFAULTS.ariaLabels, this.cfg.ariaLabels);
  protected readonly title = coerceSignal(this.cfg.title ?? DEMO_DEFAULTS.title);
  protected readonly locale = injectLocale();
  protected readonly clearLabel = computed(() => this.labels().clear);
  protected readonly lang = computed(() => this.locale());
}
`;

const R3 = `
import { Component, Directive, computed, inject } from '@angular/core';
import { DEMO_CONFIG, DEMO_I18N, type DemoConfig, type DemoLabels } from './tokens';

@Directive({ selector: '[r3]' })
export class R3Raw {
  protected readonly raw = inject(DEMO_I18N);
  protected readonly cfg = inject(DEMO_CONFIG);
  protected readonly previous = computed(() => this.raw.previous);
  protected readonly clear = computed(() => this.cfg.ariaLabels.clear);
  protected readonly heading = computed(() => this.cfg.title);
}

@Component({ selector: 'r3-template', template: '<span>{{ raw.previous }}</span>' })
export class R3Template {
  protected readonly raw = inject(DEMO_I18N);
}

export function withDemoLabels(labels: Partial<DemoLabels>) {
  return (base: DemoConfig): DemoConfig => ({
    ...base,
    ariaLabels: { ...base.ariaLabels, ...labels },
  });
}

export function describeOptions(options: { readonly config: DemoConfig }): string {
  return options.config.ariaLabels.more;
}
`;

const R3_PASS = `
import { Directive, computed, inject } from '@angular/core';
import { DEMO_DEFAULTS, DEMO_SIGNAL_I18N, type DemoLabels } from './tokens';

export function clearText(labels: DemoLabels): string {
  return labels.clear;
}

@Directive({ selector: '[r3Pass]' })
export class R3Signal {
  protected readonly i18n = inject(DEMO_SIGNAL_I18N);
  protected readonly previous = computed(() => this.i18n().previous);
  protected readonly defaultsClear = DEMO_DEFAULTS.ariaLabels.clear;
}
`;

const R4 = `
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { DEMO_SIGNAL_I18N } from './tokens';

class Announcer {
  announce(message: string): string {
    return message;
  }
}

@Component({
  selector: 'r4-tracked',
  template: '<span>{{ title() }}</span><p aria-live="polite">{{ message() }}</p>',
  host: { role: 'status', '[attr.aria-label]': 'label()' },
})
export class R4Tracked {
  protected readonly i18n = inject(DEMO_SIGNAL_I18N);
  protected readonly announcer = new Announcer();
  readonly count = input(0);
  protected readonly label = computed(() => this.i18n().count(this.count()));
  protected readonly title = signal('Board');
  protected readonly message = computed(() => this.i18n().previous);

  constructor() {
    effect(() => {
      this.announcer.announce(this.i18n().previous);
    });
  }
}
`;

const R_PACK = `
import { Component, computed } from '@angular/core';
import { injectLanguageSection } from './tokens';

@Component({ selector: 'r-pack', template: '<p aria-live="polite">{{ status() }}</p>' })
export class RPackTracked {
  protected readonly section = injectLanguageSection('demo');
  protected readonly snapshot = injectLanguageSection('demo')();
  protected readonly status = computed(() => this.section()?.saved);
}
`;

const R_PACK_PASS = `
import { Component, computed, input, untracked } from '@angular/core';
import { injectLanguageSection } from './tokens';

@Component({
  selector: 'r-pack-pass',
  template: '<p aria-live="polite">{{ status() }}</p><span>{{ title() }}</span>',
})
export class RPackUntracked {
  protected readonly section = injectLanguageSection('demo');
  readonly saved = input(false);
  protected readonly title = computed(() => this.section()?.title);
  protected readonly status = computed(() => {
    if (!this.saved()) {
      return '';
    }
    return untracked(() => this.section()?.saved);
  });
}
`;

const R4_PASS = `
import { Component, computed, inject, input, untracked } from '@angular/core';
import { DEMO_SIGNAL_I18N } from './tokens';

@Component({
  selector: 'r4-untracked',
  template: \`
    <p aria-live="polite">{{ announcement() }}</p>
    <span>{{ label() }}</span>
    <span role="status">{{ spoken() }}</span>
  \`,
  host: { '[attr.aria-label]': 'label()' },
})
export class R4Untracked {
  protected readonly i18n = inject(DEMO_SIGNAL_I18N);
  readonly status = input<'idle' | 'done'>('idle');
  readonly text = input<string | undefined>(undefined);
  protected readonly label = computed(() => this.i18n().previous);
  protected readonly announcement = computed(() => {
    const status = this.status();
    return untracked(() => (status === 'done' ? this.i18n().previous : ''));
  });
  protected readonly resolvedText = computed(() => this.text() ?? this.i18n().previous);
  protected readonly spoken = computed(() => {
    const status = this.status();
    return untracked(() => (status === 'done' ? this.resolvedText() : ''));
  });
}
`;

const R4_SHAPES = `
import { Component, Directive, computed, effect, inject, signal } from '@angular/core';
import { DEMO_I18N, DEMO_SIGNAL_I18N, type DemoI18n } from './tokens';

@Directive({ selector: '[demoLive]', host: { '[attr.aria-live]': "'polite'" } })
export class DemoLive {}

export class DemoAnnouncer {
  announceChange(message: string): string {
    return message;
  }
}

export function createDemoAnnouncements(i18n: DemoI18n, status: () => string) {
  const liveAnnouncement = computed(() => (status() === 'done' ? i18n.previous : ''));
  return { liveAnnouncement };
}

export function mountDemoAnnouncer(i18n: DemoI18n, announcer: DemoAnnouncer): void {
  effect(() => {
    announcer.announceChange(i18n.previous);
  });
}

@Component({
  selector: 'r4-shapes',
  imports: [DemoLive],
  template: \`
    <div [attr.role]="failed() ? 'alert' : 'status'">{{ message() }}</div>
    <span demoLive>{{ announcements.liveAnnouncement() }}</span>
    <p demoLive>{{ spoken() }}</p>
  \`,
})
export class R4Shapes {
  protected readonly i18n = inject(DEMO_SIGNAL_I18N);
  protected readonly raw = inject(DEMO_I18N);
  protected readonly failed = signal(false);
  protected readonly status = signal('idle');
  protected readonly message = computed(() => this.i18n().previous);
  protected readonly announcements = createDemoAnnouncements(this.raw, () => this.status());
  protected readonly spoken = createDemoAnnouncements(this.raw, () => this.status())
    .liveAnnouncement;
}

@Component({
  selector: 'r4-bound-host',
  template: '',
  host: { '[attr.role]': 'liveRole()', '[attr.aria-label]': 'label()' },
})
export class R4BoundHost {
  protected readonly i18n = inject(DEMO_SIGNAL_I18N);
  protected readonly liveRole = computed(() => 'status');
  protected readonly label = computed(() => this.i18n().previous);
}
`;

/**
 * In-memory sources, the copy model they run against, and the rows each file
 * must produce (`member rule token`).
 */
const R4_INTERSECTION = `
import { Component, computed, input, signal, untracked, type Signal } from '@angular/core';
import type { DemoLabels } from './tokens';

type ResolvedDemoLabels = DemoLabels & Required<Pick<DemoLabels, 'clear'>>;

@Component({
  selector: 'r4-intersection',
  template: \`
    <p aria-live="polite">{{ tracked() }}</p>
    <span role="status">{{ keyed() }}</span>
  \`,
})
export class R4Intersection {
  protected readonly labels: Signal<ResolvedDemoLabels> = signal({ clear: 'Clear', more: 'More' });
  readonly status = input(false);
  protected readonly tracked = computed(() => this.labels().clear);
  protected readonly keyed = computed(() => {
    this.status();
    return untracked(() => this.labels().clear);
  });
}
`;

export const RULE_FIXTURES = {
  sources: {
    'tokens.ts': TOKENS,
    'helpers.ts': HELPER_FUNCTIONS,
    'r1.ts': R1,
    'r1-pass.ts': R1_PASS,
    'r2.ts': R2,
    'r2-pass.ts': R2_PASS,
    'r3.ts': R3,
    'r3-pass.ts': R3_PASS,
    'r4.ts': R4,
    'r4-pass.ts': R4_PASS,
    'r4-shapes.ts': R4_SHAPES,
    'r4-intersection.ts': R4_INTERSECTION,
    'r-pack.ts': R_PACK,
    'r-pack-pass.ts': R_PACK_PASS,
  },
  /** @type {readonly CopyTokenEntry[]} */
  copyTokens: [
    { token: 'DEMO_I18N', kind: 'dedicated', copyKeys: '*', settingsKeys: [] },
    { token: 'DEMO_SIGNAL_I18N', kind: 'dedicated', copyKeys: '*', settingsKeys: [] },
    {
      token: 'DEMO_CONFIG',
      kind: 'config',
      copyKeys: ['ariaLabels', 'title'],
      settingsKeys: ['delay'],
    },
    { token: 'DEMO_LOCALE', kind: 'locale', copyKeys: '*', settingsKeys: [] },
    { token: 'DEMO_PACK', kind: 'locale', copyKeys: '*', settingsKeys: [] },
  ],
  localeReaders: { injectLocale: 'DEMO_LOCALE', injectLanguageSection: 'DEMO_PACK' },
  settingsTokens: ['DEMO_DELAY', 'DEMO_FORMAT'],
  helpers: ['injectDemoPrevious'],
  expected: {
    'tokens.ts': [],
    'helpers.ts': [],
    'r1.ts': [
      'R1Static.previousLabel R1 DEMO_SIGNAL_I18N',
      'R1Static.title R1 DEMO_CONFIG',
      'R1Static.localeInput R1 DEMO_LOCALE',
      'R1Static.fromCarrier R1 DEMO_SIGNAL_I18N',
    ],
    'r1-pass.ts': [],
    'r2.ts': [
      'R2Snapshot.snapshot R2 DEMO_SIGNAL_I18N',
      'R2Snapshot.constructor R2 DEMO_LOCALE',
      'DEMO_FORMAT R2 DEMO_LOCALE',
    ],
    'r2-pass.ts': [],
    'r3.ts': [
      'R3Raw.previous R3 DEMO_I18N',
      'R3Raw.clear R3 DEMO_CONFIG',
      'R3Raw.heading R3 DEMO_CONFIG',
      'R3Template.template:raw R3 DEMO_I18N',
      'withDemoLabels R3 DEMO_CONFIG',
      'describeOptions R3 DEMO_CONFIG',
    ],
    'r3-pass.ts': [],
    'r4.ts': [
      'R4Tracked.label R4 DEMO_SIGNAL_I18N',
      'R4Tracked.message R4 DEMO_SIGNAL_I18N',
      'R4Tracked.constructor R4 DEMO_SIGNAL_I18N',
    ],
    'r4-pass.ts': [],
    'r4-shapes.ts': [
      'R4Shapes.message R4 DEMO_SIGNAL_I18N',
      'R4Shapes.announcements R4 DEMO_I18N',
      'R4Shapes.spoken R4 DEMO_I18N',
      'R4BoundHost.label R4 DEMO_SIGNAL_I18N',
      'mountDemoAnnouncer R4 DEMO_I18N',
    ],
    'r4-intersection.ts': ['R4Intersection.tracked R4 DEMO_CONFIG'],
    'r-pack.ts': ['RPackTracked.snapshot R2 DEMO_PACK', 'RPackTracked.status R4 DEMO_PACK'],
    'r-pack-pass.ts': [],
  },
  expectedRegions: [
    'r-pack.ts RPackTracked.p(status)',
    'r-pack-pass.ts RPackUntracked.p(status)',
    'r4.ts R4Tracked.host',
    'r4.ts R4Tracked.p(message)',
    'r4.ts R4Tracked.constructor:effect#1',
    'r4-pass.ts R4Untracked.p(announcement)',
    'r4-pass.ts R4Untracked.span(spoken)',
    'r4-shapes.ts R4Shapes.div(failed,message)',
    'r4-shapes.ts R4Shapes.span(announcements.liveAnnouncement)',
    'r4-shapes.ts R4Shapes.p(spoken)',
    'r4-shapes.ts R4BoundHost.host',
    'r4-shapes.ts mountDemoAnnouncer:effect#1',
    'r4-intersection.ts R4Intersection.p(tracked)',
    'r4-intersection.ts R4Intersection.span(keyed)',
  ],
};
