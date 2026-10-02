<aside role="note" aria-label="Page metadata" class="cdx-ai-generated-note">
    <span class="cdx-badge cdx-badge--ai-generated">AI-assisted</span>
    <span>Drafted with Claude, reviewed by the maintainers.</span>
</aside>

# Localisation migration

<aside class="cc-tldr">

The next release makes every CNGX string follow a live language Signal. The dedicated i18n tokens become Signal tokens and the copy keys of the config tokens accept a Signal. This page lists every change your code may need, grouped by library.

</aside>

Each bullet names the symbol that changed, what it looked like before, and what to write instead. A bullet under "Breaking changes" fails to compile or changes a public type; a bullet under "Behaviour changes" compiles unchanged but renders or announces differently. With static (non-Signal) overrides, every string renders exactly as before unless a bullet says otherwise.

---

## Breaking changes

### @cngx/common/stepper

- `CNGX_STEPPER_I18N` is now `InjectionToken<Signal<CngxStepperI18n>>`, and `injectStepperI18n()` returns `Signal<CngxStepperI18n>`. Call the Signal where you read a label, inside a `computed()`, a template or a handler: `inject(CNGX_STEPPER_I18N).stepperLabel` becomes `inject(CNGX_STEPPER_I18N)().stepperLabel`.
- A direct `{ provide: CNGX_STEPPER_I18N, useValue: bundle }` must supply a Signal. Prefer `provideStepperI18n(withStepperI18nLabels(overrides))`, which merges over the English defaults. `withStepperI18nLabels` now also accepts a `Signal<CngxStepperI18nOverrides>` for runtime switching.
- `CngxStepperI18nFeature` maps `Signal<CngxStepperI18n>` to `Signal<CngxStepperI18n>`. A hand-written feature returns a derived Signal, best through `createOverrideMerge` from `@cngx/core/utils` so an equal result keeps its reference: `(bundle) => createOverrideMerge(bundle, { previousStep: 'Zurück' })`.
- The `i18n` option of `createStepperAnnouncementBuilders`, `createStepperSlotContextBuilders`, `createStepperAccname` and `createStepperGroupSummary` is now a `Signal`. Pass `injectStepperI18n()` as is.
- Note: the stepper landmark name resolves `CngxStepperConfig.ariaLabels.stepperRegion` (default `'Stepper'`) before `CngxStepperI18n.stepperLabel`, and the role description resolves `fallbackLabels.stepRoleDescription` first. A language Signal on `withStepperI18nLabels` alone therefore leaves the landmark in English; switch it through `withStepperAriaLabels` / `withStepperFallbackLabels` as well. This precedence is unchanged.
- `CngxStepperConfig.ariaLabels` and `.fallbackLabels` are typed `L | Signal<L>`, and once `withStepperAriaLabels` / `withStepperFallbackLabels` ran they hold a `Signal`. Code that reads them off `injectStepperConfig()` wraps the key: `config.ariaLabels?.stepperRegion` becomes `coerceSignal(config.ariaLabels)()?.stepperRegion` (`coerceSignal` from `@cngx/core/utils`), read inside a `computed()` or template. Both features now also accept a `Signal`.
- `CngxStepperI18n.stepCompleted` and `.stepErrored` are removed. They were deprecated and no CNGX surface read them. Use `statusLabels.done` and `statusLabels.errored` instead: `withStepperI18nLabels({ stepCompleted: 'Erledigt' })` becomes `withStepperI18nLabels({ statusLabels: { done: 'Erledigt' } })`.
- `CngxStepperI18n.stepRolledBackSuffix: string` is replaced by `stepRolledBack: (base: string) => string`, which receives the step's description and returns the whole sentence. `withStepperI18nLabels({ stepRolledBackSuffix: 'Zurückgesetzt.' })` becomes ``withStepperI18nLabels({ stepRolledBack: (base) => `${base} Zurückgesetzt.` })``. The English default renders the same text as before.
- `CngxStepperI18n.stepFallbackLabel` is now required. Bundles built through `provideStepperI18n(withStepperI18nLabels(...))` already carry the English default; a hand-built `Signal<CngxStepperI18n>` supplies the key, for example ``stepFallbackLabel: (id) => `Schritt ${id}` ``.
- `resolveStepFallbackLabel` is no longer exported. It was marked internal; read `injectStepperI18n()().stepFallbackLabel(id)` instead.

### @cngx/common/tabs

- `CNGX_TABS_I18N` is now `InjectionToken<Signal<CngxTabsI18n>>`, and `injectTabsI18n()` returns `Signal<CngxTabsI18n>`. Call the Signal where you read a label: `inject(CNGX_TABS_I18N).tabsLabel` becomes `inject(CNGX_TABS_I18N)().tabsLabel`.
- A direct `{ provide: CNGX_TABS_I18N, useValue: bundle }` must supply a Signal. Prefer `provideTabsI18n(withTabsI18nLabels(overrides))`; `withTabsI18nLabels` now also accepts a `Signal<Partial<CngxTabsI18n>>`.
- `CngxTabsI18nFeature` maps `Signal<CngxTabsI18n>` to `Signal<CngxTabsI18n>`. A hand-written feature returns a derived Signal, best through `createOverrideMerge` from `@cngx/core/utils` so an equal result keeps its reference: `(bundle) => createOverrideMerge(bundle, { addTab: 'Neuer Reiter' })`.
- The `i18n` option of `createTabGroupAnnouncements` and `createTabDismissals` is now a `Signal`. Pass `injectTabsI18n()` as is.
- `CngxTabsI18n.previousTab` and `.nextTab` change from `string` to `(positionPhrase: string) => string`. Each receives the `selectedTab(...)` phrase and returns the whole commit-success announcement, so a locale can reorder it. `withTabsI18nLabels({ nextTab: 'Nächster Reiter' })` becomes ``withTabsI18nLabels({ nextTab: (phrase) => `Nächster Reiter: ${phrase}` })``. The English default renders the same text as before.
- Note: the tab-group landmark name resolves `CngxTabsConfig.ariaLabels.tabsRegion` (default `'Tabs'`) before `CngxTabsI18n.tabsLabel`. A language Signal on `withTabsI18nLabels` alone therefore leaves the landmark in English; switch it through `withTabsAriaLabels` as well. This precedence is unchanged.
- `CngxTabsConfig.ariaLabels` and `.fallbackLabels` are typed `L | Signal<L>`, and once `withTabsAriaLabels` / `withTabsFallbackLabels` ran they hold a `Signal`. Code that reads them off `injectTabsConfig()` wraps the key: `config.ariaLabels?.tabsRegion` becomes `coerceSignal(config.ariaLabels)()?.tabsRegion` (`coerceSignal` from `@cngx/core/utils`), read inside a `computed()` or template. Both features now also accept a `Signal`.

### @cngx/common/card

- `CNGX_CARD_I18N` is now `InjectionToken<Signal<CngxCardI18n>>`, and `injectCardI18n()` returns `Signal<CngxCardI18n>`. Call the Signal where you read a phrase, inside a `computed()`, a template or a handler: `inject(CNGX_CARD_I18N).selected` becomes `inject(CNGX_CARD_I18N)().selected`.
- A direct `{ provide: CNGX_CARD_I18N, useValue: bundle }` must supply a Signal. Prefer `provideCardI18n(withCardI18nLabels(overrides))`; `withCardI18nLabels` now also accepts a `Signal<Partial<CngxCardI18n>>`.
- `CngxCardI18nFeature` maps `Signal<CngxCardI18n>` to `Signal<CngxCardI18n>`. A hand-written feature returns a derived Signal, best through `createOverrideMerge` from `@cngx/core/utils`: `(bundle) => createOverrideMerge(bundle, { loading: 'Lädt' })`.
- `CngxCardI18n` has a new required key `timestamp` (English `'{prefix} {date}'`): it sets the order of a `cngx-card-timestamp` prefix and its date. A complete bundle you provide directly adds it; `withCardI18nLabels` overrides are unaffected.

### @cngx/common/chart

- `CNGX_CHART_I18N` is now `InjectionToken<Signal<CngxChartI18n>>`. Call the Signal where you read a formatter, inside a `computed()`, a template or a handler: `inject(CNGX_CHART_I18N).summary(input)` becomes `inject(CNGX_CHART_I18N)().summary(input)`. The default factory reads the app locale live, so the default number formatting follows a `CNGX_LOCALE` switch.
- A direct `{ provide: CNGX_CHART_I18N, useValue: bundle }` must supply a Signal. Prefer `provideChartI18n(overrides)`, which merges over the English defaults. `provideChartI18n` now also accepts a `Signal<Partial<CngxChartI18n>>` for runtime switching, and returns a plain `Provider` (it used to return `{ provide, useValue }`).

### @cngx/common/data

- `CNGX_RECYCLER_I18N` is now `InjectionToken<Signal<RecyclerI18n>>`. Call the Signal where you read a phrase, inside a `computed()`, an effect or a handler: `inject(CNGX_RECYCLER_I18N).empty()` becomes `inject(CNGX_RECYCLER_I18N)().empty()`.
- A direct `{ provide: CNGX_RECYCLER_I18N, useValue: bundle }` must supply a Signal. Prefer `provideRecyclerI18n(bundle)`, which still replaces the whole bundle; it now also accepts a `Signal<RecyclerI18n>` for runtime switching, and returns a plain `Provider`.

### @cngx/common/dialog

- `CngxDialogDefaults.labels` is typed `CngxDialogLabels | Signal<CngxDialogLabels>`, and once `provideDialogConfig` / `provideDialogConfigAt` ran it holds a `Signal`. Code that reads it off `injectDialogConfig()` or `CNGX_DIALOG_DEFAULTS` wraps the key: `injectDialogConfig().labels.close` becomes `coerceSignal(injectDialogConfig().labels)().close` (`coerceSignal` from `@cngx/core/utils`), read inside a `computed()`, a template or a handler. A direct `{ provide: CNGX_DIALOG_DEFAULTS, useValue: { labels } }` with a plain bundle keeps compiling.
- `withDialogLabels` now also accepts a `Signal<Partial<CngxDialogLabels>>` for runtime switching; plain partials still merge over the English defaults.

### @cngx/common/interactive

- `CngxMenuConfig.ariaLabels` is typed `CngxMenuAriaLabels | Signal<CngxMenuAriaLabels>`, and once `withAriaLabels` ran it holds a `Signal`. Code that reads it off `injectMenuConfig()` or `CNGX_MENU_CONFIG` wraps the key: `injectMenuConfig().ariaLabels.itemActivated` becomes `coerceSignal(injectMenuConfig().ariaLabels)().itemActivated` (`coerceSignal` from `@cngx/core/utils`), read inside a `computed()`, a template or a handler. A hand-written `CngxMenuConfigFeature` that spreads `cfg.ariaLabels` merges through `createOverrideMerge(cfg.ariaLabels, overrides)` instead.
- `withAriaLabels` now also accepts a `Signal<Partial<CngxMenuAriaLabels>>` for runtime switching; plain partials still merge over the inherited labels.
- The copy inputs `CngxAsyncClick.succeededAnnouncement` / `.failedAnnouncement`, `CngxBreadcrumb.label`, `CngxCopyBlock.buttonLabel` / `.copiedLabel` / `.srAnnouncement` and `CngxRangeSlider.startLabel` / `.endLabel` are now `input<string | undefined>`, and an unbound input reads `undefined` instead of the construction-time `CNGX_INTERACTIVE_I18N` default. Template bindings and attribute values are unchanged. Code that reads the input programmatically (`directive.succeededAnnouncement()`) gets `undefined` when nothing is bound; read the rendered result instead, for `CngxAsyncClick` its `announcement()`.

### @cngx/common/display

- The copy inputs `CngxAvatarGroup.label` and `CngxChip.removeAriaLabel` are now `input<string | undefined>`, and an unbound input reads `undefined` instead of the construction-time `CNGX_DISPLAY_I18N` default. Template bindings are unchanged; the rendered `aria-label` follows a language switch.
- `CngxAvatarGroup`: a bound `label` now always composes the English `<total> <noun>` summary, also when it happens to equal the `avatarGroupNoun` default. Leave `label` unbound to use a custom `avatarGroupLabel` formatter.

### @cngx/common/layout

- The copy inputs `CngxExpandableText.moreLabel` / `.lessLabel` are now `input<string | undefined>`, and an unbound input reads `undefined` instead of the construction-time `CNGX_LAYOUT_I18N` default. Template bindings are unchanged; the rendered toggle label follows a language switch.

### @cngx/common/timeline

- `CngxTimelineConfig.labels` is typed `CngxTimelineLabels | Signal<CngxTimelineLabels>`, and once `withTimelineLabels` ran it holds a `Signal`. Code that reads it off `injectTimelineConfig()` or `CNGX_TIMELINE_CONFIG` wraps the key once, in a field: with a module-level `const NO_LABELS: CngxTimelineLabels = {};`, write `private readonly labels = coerceSignal(injectTimelineConfig().labels ?? NO_LABELS);` (`coerceSignal` from `@cngx/core/utils`) and read `this.labels().retry` inside a `computed()`, a template or a handler, where you used to read `injectTimelineConfig().labels?.retry`. A fresh `{}` per call would create a new Signal on every read. A hand-written `CngxTimelineConfigFeature` that spreads `config.labels` merges through `createNestedOverrideMerge(config.labels ?? NO_LABELS, overrides, 'status')` instead, which keeps the per-status merge.
- `withTimelineLabels` now also accepts a `Signal<CngxTimelineLabels>` for runtime switching; plain bundles still merge over the inherited labels, `status` key by key.
- `CngxTimelineLabels.groupLabel` is now `(group, locale: string) => string`. The timeline passes the app locale (`CNGX_LOCALE`, else `LOCALE_ID`) and re-calls the formatter when it switches. A one-argument formatter keeps compiling and renders as before; code that calls `labels.groupLabel(group)` itself passes the locale as the second argument.
- `formatTimelineGroupDate` and `TIMELINE_DEFAULT_GROUP_LABEL` are no longer exported. They were marked internal; call the default `groupLabel` from `injectTimelineConfig()` with a locale instead.

### @cngx/ui/timeline

- `createTimelineFallbackCopy(config)` now returns `Signal<CngxTimelineFallbackCopy>`. Call it where you read a string: `copy.retry` becomes `copy().retry`.
- The `labels` argument of `createTimelineView` and of a `CngxTimelineViewFactory` override (`CNGX_TIMELINE_VIEW_FACTORY`) is now `Signal<CngxTimelineFallbackCopy>`. An override that builds the announcement reads the copy inside `untracked(() => labels().loading)`, so a language switch does not re-voice the live region.
- `CngxTimelineFallbackCopy.groupLabel` is now `(group, locale: string) => string`, mirroring `CngxTimelineLabels.groupLabel`.

### @cngx/ui/mat-stepper

- The optional third argument of `createMatStepHandle` (and so of `CngxMatStepHandleFactory` overrides) is now `Signal<CngxStepperI18n>`. An override that delegates to `createMatStepHandle` forwards the Signal unchanged; the last-resort `Step <id>` label then follows a language switch.
- The third argument of `createMatStepHandle`, the stepper i18n Signal, is now required. An override that declared only `(step, idSeed)` used to type-check and silently lost the localized label of an unlabelled step; it now fails to compile. Forward the argument: `(step, idSeed) => createMatStepHandle(step, idSeed)` becomes `(step, idSeed, i18n) => createMatStepHandle(step, idSeed, i18n)`.

### @cngx/ui/feedback

- `CNGX_FEEDBACK_I18N` is now `InjectionToken<Signal<CngxFeedbackI18n>>`, and `injectFeedbackI18n()` returns `Signal<CngxFeedbackI18n>`. Call the Signal where you read a label, inside a `computed()`, a template or a handler: `inject(CNGX_FEEDBACK_I18N).alertsRegionLabel` becomes `inject(CNGX_FEEDBACK_I18N)().alertsRegionLabel`.
- A direct `{ provide: CNGX_FEEDBACK_I18N, useValue: bundle }` must supply a Signal. Prefer `provideFeedbackI18n(overrides)`, which merges over the English defaults, `announcements` key by key. `provideFeedbackI18n` and `withFeedbackI18nLabels` now also accept a `Signal<CngxFeedbackI18nOverrides>` for runtime switching, and `provideFeedbackI18n` returns a plain `Provider` (it used to return `{ provide, useValue }`).
- The copy inputs `CngxLoadingIndicator.label`, `CngxLoadingOverlay.label` and `CngxProgress.label` are now `input<string | undefined>`, and an unbound input reads `undefined` instead of the construction-time `loadingLabel` / `progressLabel` default. Template bindings are unchanged; the rendered `aria-label` follows a language switch while the input is unbound. Code that reads the input programmatically (`indicator.label()`) gets `undefined` when nothing is bound; read the rendered `aria-label` instead.

### @cngx/ui/data-grid-accordion

- The copy inputs `CngxDgaCount.singular` / `.plural`, `CngxDgaFilter.ariaLabel`, `CngxDgaFilterField.label`, `CngxDataGridRow.errorMessage` and `CngxDgaSortHeader.notSortedLabel` / `.ascendingLabel` / `.descendingLabel` / `.ascendingAnnouncement` / `.descendingAnnouncement` / `.clearedAnnouncement` are now `input<string | undefined>`, and an unbound input reads `undefined` instead of the construction-time `withDataGridAccordionLabels` default. Template bindings and attribute values are unchanged; the rendered text follows a language switch while the input is unbound. Code that reads the input programmatically (`sortHeader.notSortedLabel()`) gets `undefined` when nothing is bound; read the rendered text instead.
- `CngxDgaCount`: a bound `cngxDgaCountSingular` or `cngxDgaCountPlural` now always composes `<count> <noun>`, also when it happens to equal the `countSingular` / `countPlural` default, and an unbound noun falls back to its label. Leave both unbound to use a custom `count` formatter.

### @cngx/ui/sidenav

- The copy input `CngxSidenav.resizeLabel` is now `input<string | undefined>`, and an unbound input reads `undefined` instead of the construction-time `withSidenavLabels` `resizeHandle` default. Template bindings are unchanged; the rendered resize-handle `aria-label` follows a language switch while the input is unbound. Code that reads `sidenav.resizeLabel()` programmatically gets `undefined` when nothing is bound.

### @cngx/ui/speak

- The copy inputs `CngxSpeakButton.readAloudLabel` / `.stopLabel` are now `input<string | undefined>`, and an unbound input reads `undefined` instead of the construction-time `CNGX_SPEAK_I18N` default. Template bindings are unchanged; the rendered button `aria-label` follows a language switch while the input is unbound. Code that reads the input programmatically gets `undefined` when nothing is bound.

### @cngx/ui/command-palette

- The copy keys of `CngxCommandPaletteConfig` (`searchPlaceholder`, `listboxLabel`, `emptyLabel`, `loadingLabel`, `errorLabel`, `retryLabel`, `paletteLabel`, `resultCount`, `footerLegend`) are typed `T | Signal<T>`, and once a `Signal` was passed to a feature they hold a `Signal`. Code that reads a key off `injectCommandPaletteConfig()` or `CNGX_COMMAND_PALETTE_CONFIG` wraps it once, in a field: `private readonly emptyLabel = coerceSignal(injectCommandPaletteConfig().emptyLabel);` (`coerceSignal` from `@cngx/core/utils`), then `this.emptyLabel()` inside a `computed()`, a template or a handler. A hand-written `CngxCommandPaletteConfigFeature` keeps working; one that reads a copy key wraps it the same way.
- `withCommandPaletteLabels` now also accepts a `Signal` of the label overrides: a key the Signal sets wins, an unset key follows the inherited value. `withResultCountFormatter` and `withKeyboardLegend` accept a value or a `Signal`. Plain values keep their merge rules.
- `CngxCommandPalette.ariaLabel` is now `input<string | undefined>`, and an unbound input reads `undefined` instead of the construction-time `paletteLabel` default. Template bindings are unchanged; the rendered dialog name follows a language switch while the input is unbound.

### @cngx/ui/paginator

- `CngxPaginatorConfig.ariaLabels`, `.announcements` and `.formats` are typed `L | Signal<L>`, and once a `with*` feature ran they hold a `Signal`. Code that reads them off `injectPaginatorConfig()` or `CNGX_PAGINATOR_CONFIG` reads the resolved bundle through the new accessors instead: `injectPaginatorConfig().ariaLabels.next` becomes `injectPaginatorAriaLabels()().next`, likewise `injectPaginatorAnnouncements()` and `injectPaginatorFormats()` (the latter fills the optional readout formatters), each called inside a `computed()`, a template or a handler. `CNGX_PAGINATOR_DEFAULTS` keeps its plain bundles.
- `withPaginatorAriaLabels` and `withPaginatorAnnouncements` now also accept a `Signal` of the partial bundle, and `withPaginatorRangeFormat`, `withPaginatorPageStatusFormat`, `withPaginatorPageOfPagesFormat` and `withPaginatorLoadMoreFormat` accept a formatter or a `Signal` of one. Plain values keep their merge rules; `provideCngxPaginatorConfigAt` still merges over the parent scope. A hand-built `CngxPaginatorConfigFeature` payload may be a `Signal` as well.
- `@cngx/ui/mat-paginator`: the bridge reads `announcements.pageChange` and a bound `[announceLabel]` formatter untracked, so a language switch does not re-speak the current page; the next page change speaks the new language.

### @cngx/ui/accordion

- `CngxAccordionConfig.disabledReason` and `.errorMessage` are typed `string | Signal<string>`, and hold a `Signal` once one was passed to `withAccordionLabels`. Code that reads them off `injectAccordionConfig()` or `CNGX_ACCORDION_CONFIG` wraps the key once, in a field: `private readonly reason = coerceSignal(injectAccordionConfig().disabledReason);` (`coerceSignal` from `@cngx/core/utils`), then `this.reason()` inside a `computed()`, a template or a handler. `withAccordionLabels` now also accepts a `Signal<string>` per key; plain strings keep their merge rules.
- The copy inputs `CngxAccordionItem.disabledReason` / `.errorMessage` are now `input<string | undefined>`, and an unbound input reads `undefined` instead of the construction-time config default. Template bindings are unchanged; the rendered reason follows a language switch while the input is unbound, and the error alert speaks the new language with the next error. Code that reads the input programmatically gets `undefined` when nothing is bound.

### @cngx/ui/breadcrumb

- `CngxBreadcrumbConfig.ariaLabels` is typed `CngxBreadcrumbAriaLabels | Signal<CngxBreadcrumbAriaLabels>`, and once `withBreadcrumbAriaLabels` ran it holds a `Signal`. Code that reads it off `injectBreadcrumbConfig()` or `CNGX_BREADCRUMB_CONFIG` reads the resolved bundle through the new accessor instead: `injectBreadcrumbConfig().ariaLabels?.bar` becomes `injectBreadcrumbAriaLabels()().bar`, called inside a `computed()`, a template or a handler; every key is filled from the English defaults. `withBreadcrumbAriaLabels` now also accepts a `Signal<CngxBreadcrumbAriaLabels>`; plain objects still merge key by key, and `provideBreadcrumbConfigAt` still merges over the parent scope.
- The copy inputs `CngxBreadcrumbBar.label`, `CngxBreadcrumbOverflow.triggerLabel` / `.menuLabel` and `CngxBreadcrumbSiblings.triggerLabel` / `.menuLabel` are now `input<string | undefined>`, and an unbound input reads `undefined` instead of the construction-time config default. Template bindings are unchanged; the rendered name follows a language switch while the input is unbound. Code that reads the input programmatically gets `undefined` when nothing is bound.

### @cngx/ui/chart-panel

- `CngxChartPanelConfig.ariaLabels` is typed `CngxChartPanelAriaLabels | Signal<CngxChartPanelAriaLabels>`, and once `withChartPanelAriaLabels` ran it holds a `Signal`. Code that reads it off `injectChartPanelConfig()` or `CNGX_CHART_PANEL_CONFIG` reads the resolved bundle through the new accessor instead: `injectChartPanelConfig().ariaLabels?.busy` becomes `injectChartPanelAriaLabels()().busy`, called inside a `computed()`, a template or a handler. `withChartPanelAriaLabels` now also accepts a `Signal<CngxChartPanelAriaLabels>`; plain objects still merge key by key, and `provideChartPanelConfigAt` still merges over the parent scope.
- The hidden busy status reads its label untracked: a language switch during a running busy phase does not re-announce it, and the next busy phase speaks the new language. The busy description of the action cluster follows the switch at once.

### @cngx/ui/collection

- `CngxIncrementalListConfig.ariaLabels` is typed `CngxIncrementalListAriaLabels | Signal<CngxIncrementalListAriaLabels>`, and once `withIncrementalListAriaLabels` ran it holds a `Signal`. Code that reads it off `injectIncrementalListConfig()` or `CNGX_INCREMENTAL_LIST_CONFIG` reads the resolved bundle through the new accessor instead: `injectIncrementalListConfig().ariaLabels.empty` becomes `injectIncrementalListAriaLabels()().empty`, called inside a `computed()`, a template or a handler. `CNGX_INCREMENTAL_LIST_DEFAULTS` keeps its plain bundle.
- `withIncrementalListAriaLabels` now also accepts a `Signal` of the partial bundle. Plain partials keep their merge rules; `provideIncrementalListConfigAt` still merges over the parent scope. A hand-built `CngxIncrementalListConfigFeature` payload may be a `Signal` as well.
- The settle live region and the recycler load-count announcement read their phrasing untracked: a language switch does not re-speak the current message, the next settle or load speaks the new language. The empty-state title (a status region of its own) keeps its text until the next settle too; the visible error, retry and end texts follow the switch at once.

### @cngx/ui/stat-card

- `CngxStatCardConfig.ariaLabels` is typed `CngxStatCardAriaLabels | Signal<CngxStatCardAriaLabels>`, and once `withStatCardAriaLabels` ran it holds a `Signal`. Code that reads it off `injectStatCardConfig()` or `CNGX_STAT_CARD_CONFIG` reads the resolved bundle through the new accessor instead: `injectStatCardConfig().ariaLabels?.busy` becomes `injectStatCardAriaLabels()().busy`, called inside a `computed()`, a template or a handler. `withStatCardAriaLabels` now also accepts a `Signal<CngxStatCardAriaLabels>`; plain objects still merge key by key, and `provideStatCardConfigAt` still merges over the parent scope.
- The copy inputs `CngxStatCard.busyLabel`, `.errorText`, `.errorDescription`, `.staleText` and `.emptyText` are now `input<string | undefined>`, and an unbound input reads `undefined` instead of the construction-time config default. Template bindings are unchanged. Code that reads the input programmatically gets `undefined` when nothing is bound.
- Because the whole tile can be a live region (`[live]`), an unbound copy input reads its cascade string untracked: the tile keeps its text on a language switch and shows the new language with its next view or busy change, also while `[live]` is `'off'`.

### @cngx/ui/toc

- `CngxTocConfig.ariaLabels` is typed `CngxTocAriaLabels | Signal<CngxTocAriaLabels>`, and once `withTocAriaLabels` ran it holds a `Signal`. Code that reads it off `injectTocConfig()` or `CNGX_TOC_CONFIG` reads the resolved bundle through the new accessor instead: `injectTocConfig().ariaLabels?.nav` becomes `injectTocAriaLabels()().nav`, called inside a `computed()`, a template or a handler. `withTocAriaLabels` now also accepts a `Signal<CngxTocAriaLabels>`; plain objects still merge key by key, and `provideTocConfigAt` still merges over the parent scope.

### @cngx/ui/a11y

- `CngxA11yPanelConfig.labels` is typed `CngxA11yPanelLabels | Signal<CngxA11yPanelLabels>` and `.axes` is typed `readonly CngxA11yPanelAxisSpec[] | Signal<readonly CngxA11yPanelAxisSpec[]>`; once a feature ran, `labels` holds a `Signal`. Code that reads them off `injectA11yPanelConfig()` or `CNGX_A11Y_PANEL_CONFIG` reads them through the new accessors instead: `injectA11yPanelConfig().labels.heading` becomes `injectA11yPanelLabels()().heading`, and `injectA11yPanelConfig().axes` becomes `injectA11yPanelAxes()()`, each called inside a `computed()`, a template or a handler. `CNGX_A11Y_PANEL_DEFAULTS` keeps its plain values.
- `withA11yPanelLabels` now also accepts a `Signal<CngxA11yPanelLabelsOverride>` (the `axes` record still merges key by key), and `withA11yPanelAxes` accepts a `Signal` of the axis list, so translated option labels follow a switch. Plain values keep their merge rules; `provideA11yPanelConfigAt` still merges over the parent scope.

### @cngx/forms/select

- `CngxSelectAriaLabels.commitFailedMessage` changes from `string` to `(label: string, detail: string | undefined) => string`. It receives the field label and the rejection's `Error.message` (`undefined` for a non-`Error` rejection) and returns the whole commit-error announcement, so a locale can reorder it. `withAriaLabels({ commitFailedMessage: 'Speichern fehlgeschlagen' })` becomes ``withAriaLabels({ commitFailedMessage: (label, detail) => (detail ? `${label}: Speichern fehlgeschlagen - ${detail}` : `${label}: Speichern fehlgeschlagen`) })``. The English default renders the same text as before.
- `CngxSelectConfig.ariaLabels`, `.fallbackLabels` and `.announcer` accept a value or a `Signal`, and once `withAriaLabels` / `withFallbackLabels` / `withAnnouncer` ran the key holds a `Signal`. Code that reads a key off `CNGX_SELECT_CONFIG` or a `makeSelectConfig(...)` result wraps it once, in a field: with a module-level `const NO_ARIA_LABELS: CngxSelectAriaLabels = {};`, write `private readonly ariaLabels = coerceSignal(config.ariaLabels ?? NO_ARIA_LABELS);` (`coerceSignal` from `@cngx/core/utils`) and read `this.ariaLabels().clearButton` inside a `computed()`, a template or a handler, where you used to read `config.ariaLabels?.clearButton`. A fresh `{}` per call would create a new Signal on every read.
- `injectSelectConfig()` returns `ariaLabels`, `fallbackLabels` and `announcer` as `Signal`s over the library defaults: `injectSelectConfig().fallbackLabels.empty` becomes `injectSelectConfig().fallbackLabels().empty`, and `injectSelectConfig().announcer.format` becomes `injectSelectConfig().announcer().format`. Read them where the text is used, not in a field initializer, so a language switch reaches your composite. The settings keys (`panelWidth`, `loadingVariant`, ...) are unchanged.
- `withAriaLabels`, `withFallbackLabels` and `withAnnouncer` now also accept a `Signal` for runtime switching. Plain values keep their merge rules: `withAriaLabels` and `withAnnouncer` merge key by key across features, a later `withFallbackLabels` replaces an earlier one.
- The `fallbackLabels` and `ariaLabels` members of every select component (`CngxSelect`, `CngxMultiSelect`, `CngxCombobox`, `CngxTypeahead`, `CngxTreeSelect`, `CngxReorderableMultiSelect`, `CngxActionSelect`, `CngxActionMultiSelect`, `CngxSelectShell`) are now `Signal`s. A custom panel that reads them off the component calls them: `select.fallbackLabels.empty` becomes `select.fallbackLabels().empty`.
- `CngxActionSelectConfig.ariaLabel` and `CngxReorderableSelectConfig.ariaLabel` accept a `string` or a `Signal<string>`, and `withActionAriaLabel` / `withReorderAriaLabel` accept either. `injectActionSelectConfig().ariaLabel` and `injectReorderableSelectConfig().ariaLabel` are now `Signal<string>`: `config.ariaLabel` becomes `config.ariaLabel()`, read where the label is rendered. Code that reads the key off `CNGX_ACTION_SELECT_CONFIG` / `CNGX_REORDERABLE_SELECT_CONFIG` wraps it in `coerceSignal(...)`.
- The copy inputs `clearButtonAriaLabel` (every select component), `chipRemoveAriaLabel` (`CngxMultiSelect`, `CngxCombobox`, `CngxTreeSelect`, `CngxReorderableMultiSelect`, `CngxActionMultiSelect`), `twistyExpandLabel` / `twistyCollapseLabel` (`CngxTreeSelect`), `reorderAriaLabel` (`CngxReorderableMultiSelect`) and `CngxSelectSearch.placeholder` are now `input<string | undefined>`, and an unbound input reads `undefined` instead of the construction-time `CNGX_SELECT_CONFIG` default. Template bindings are unchanged; the rendered label follows a language switch while the input is unbound. Code that reads the input programmatically (`select.clearButtonAriaLabel()`) gets `undefined` when nothing is bound; read the rendered `aria-label` instead.

### @cngx/forms/field

- `CNGX_ERROR_MESSAGES` is now `InjectionToken<Signal<ErrorMessageMap>>`. Call the Signal where you read a message, inside a `computed()`, a template or a handler: `inject(CNGX_ERROR_MESSAGES)[kind]` becomes `inject(CNGX_ERROR_MESSAGES)()[kind]`.
- A direct `{ provide: CNGX_ERROR_MESSAGES, useValue: map }` must supply a Signal. Prefer `provideErrorMessages(map)` at an environment injector, or `provideFormFieldAt(withErrorMessages(map))` on a component. `provideErrorMessages` and `withErrorMessages` now also accept a `Signal<ErrorMessageMap>` for runtime switching; `withErrorMessages` still merges key by key across features.
- `FormFieldConfig.errorMessages` and `.constraintHints` are typed `T | Signal<T>`, and once `withErrorMessages` / `withConstraintHints` ran they hold a `Signal`. Code that reads them off `injectFormFieldConfig()` or `CNGX_FORM_FIELD_CONFIG` wraps the key once, in a field: `private readonly hints = coerceSignal(injectFormFieldConfig().constraintHints);` (`coerceSignal` from `@cngx/core/utils`), then `this.hints()?.lengthRange(8, 64)` inside a `computed()`, a template or a handler. `withConstraintHints` now also accepts a `Signal<Partial<ConstraintHintFormatters>>`; unset formatters keep the English defaults.

### @cngx/forms/input

- `InputConfig.ariaLabels` is typed `Partial<InputAriaLabels> | Signal<Partial<InputAriaLabels>>`, and once `withInputAriaLabels` ran it holds a `Signal`. Code that reads it off `injectInputConfig()` or `CNGX_INPUT_CONFIG` wraps the key once, in a field: with a module-level `const NO_LABELS: Partial<InputAriaLabels> = {};`, write `private readonly labels = coerceSignal(injectInputConfig().ariaLabels ?? NO_LABELS);` (`coerceSignal` from `@cngx/core/utils`) and read `this.labels().clear ?? DEFAULT_INPUT_ARIA_LABELS.clear` inside a `computed()`, a template or a handler. `withInputAriaLabels` now also accepts a `Signal<Partial<InputAriaLabels>>`; plain partials still merge key by key across features.
- `InputConfig.numericLocale` is typed `string | Signal<string>`. Code that reads it off the config wraps it the same way: `coerceSignal(injectInputConfig().numericLocale)()`. `withNumericDefaults({ locale })` and `withCurrency({ locale })` now also accept a `Signal<string>`; `CngxNumericInput` follows a switch while blurred and applies it on blur while focused, as it already does for `CNGX_LOCALE`.
- `CngxPhoneInput.countries` is now `input<readonly Country[] | undefined>`, and an unbound input reads `undefined` instead of the built-in list named in the construction-time locale. Template bindings are unchanged. Unbound, the picker lists the built-in regions named in the live `CNGX_LOCALE` and relabels them on a switch; code that read the list programmatically (`phone.countries()`) gets `undefined` and reads the picker's options instead. `country` keeps its construction-time default object; the picker still shows the live-locale row with the same region.

### @cngx/forms/filter-builder

- `CngxFilterBuilderConfig.i18n` is typed `CngxFilterBuilderI18n | Signal<CngxFilterBuilderI18n>`, and once `withFilterBuilderI18n` ran it holds a `Signal`. Code that reads it off `injectFilterBuilderConfig()`, `CNGX_FILTER_BUILDER_CONFIG` or `CNGX_FILTER_BUILDER_DEFAULTS` wraps the key once, in a field: `private readonly i18n = coerceSignal(injectFilterBuilderConfig().i18n);` (`coerceSignal` from `@cngx/core/utils`), then `this.i18n().addFilter` inside a `computed()`, a template or a handler. A hand-written `CngxFilterBuilderConfigFeature` that spreads `config.i18n` merges through `createNestedOverrideMerge(config.i18n, overrides, 'operators')` instead, which keeps the per-operator merge.
- `withFilterBuilderI18n` now also accepts a `Signal<Partial<CngxFilterBuilderI18n>>` for runtime switching. Plain partials keep their merge rules: top-level keys and `operators` merge key by key across features, `announcement` is replaced as a whole.
- `CngxFilterBuilderAnnouncerSources.i18n` is now `Signal<CngxFilterBuilderI18n>`. A custom `CNGX_FILTER_BUILDER_ANNOUNCER_FACTORY` reads it as `sources.i18n()`, inside `untracked` where it builds the live-region text, so a language switch does not re-speak the last mutation.

### @cngx/data-display/treetable

- `TreetableConfig.labels` is typed `Partial<TreetableLabels> | Signal<Partial<TreetableLabels>>`, and once `withTreetableLabels` ran it holds a `Signal`. Code that reads it off `CNGX_TREETABLE_CONFIG` wraps the key once, in a field: with a module-level `const NO_LABELS: Partial<TreetableLabels> = {};`, write `private readonly labels = coerceSignal(inject(CNGX_TREETABLE_CONFIG).labels ?? NO_LABELS);` (`coerceSignal` from `@cngx/core/utils`) and read `this.labels().loading` inside a `computed()`, a template or a handler. `withTreetableLabels` now also accepts a `Signal<Partial<TreetableLabels>>`; plain partials still merge key by key across features.

---

## Behaviour changes

### All libraries

- A live region keeps its text when the language switches, and speaks the new language with its next status change. This also holds when a consumer formatter reads a language Signal itself, such as `withErrorMessages({ required: () => translate('required') })` or a `format` function on a select announcer or a stepper count: CNGX now calls these formatters untracked inside the live region, so a switch no longer re-renders the region at once. Shown validation messages in `cngx-field-errors` and `cngx-form-errors` therefore stay in the old language until the field's errors change. Labels outside live regions follow the switch immediately.
- Copy that CNGX builds from a message with arguments wraps every inserted text argument in the Unicode isolates U+2068 / U+2069 and formats every inserted number with the active locale (`1,200`, `1.200` in German). A Latin name inside an Arabic sentence, or the reverse, keeps its own direction. Tests that compare such copy exactly strip the isolates first: `text.replace(/[\u2068\u2069]/g, '')`.
- Type-to-find ignores accents and lowercases with the app locale, in `CngxActiveDescendant` and everything built on it (listbox, menu, select family) and in the `CngxTreeSelect` expand-to-reveal search: `u` now finds `Über`, and under `tr` an `I` finds `Istanbul` but not `İzmir`. `matchesTypeahead(label, term, locale?)` from `@cngx/core/utils` takes the locale as an optional third argument; without it, it lowercases as before and still ignores accents.

### @cngx/forms/select

- The `*cngxSelectAction` slot wrapper in every select panel is now a named group: `role="group"` with `aria-label` from `CngxActionSelectConfig.ariaLabel` (English default `'Inline action'`, set it with `withActionAriaLabel`). Screen readers announce the group name when focus enters the action slot. Before, the key was accepted but never rendered.
- A defaulted copy key that an override sets to `undefined` now resolves to its English default instead of `undefined`. `withFallbackLabels({ empty: undefined })` renders `'No Options'` where it rendered an empty message before; the same holds for every `ariaLabels` key except `clearButton` and `chipRemove`, whose fallback is per variant. To clear a label, set it to an empty string.

---

## Language files

These apply once your app config calls `provideCngxI18n(...)` from `@cngx/core/i18n`. An app without it is not affected.

- `provideCngxI18n` provides `CNGX_LOCALE` from the active pack's `locale`. A component-level `{ provide: LOCALE_ID, useValue: 'de-CH' }` no longer reaches CNGX formatters, because a provided `CNGX_LOCALE` outranks every `LOCALE_ID`. Use `provideLocaleAt('de-CH')` in that component's `viewProviders` instead.
- `provideCngxI18n` writes `<html lang>` and `<html dir>` from the active pack, and `CNGX_DIRECTION` reports the pack's direction instead of reading `dir` from the DOM. An app that sets these attributes itself passes `withDocumentLanguage('off')`.

---

## Checklist

Work through it once per app; each step points back to the bullets above.

- [ ] Replace every `{ provide: CNGX_*_I18N, useValue: bundle }` with the area's `provide*I18n(with*I18nLabels(...))`, or supply a `Signal`.
- [ ] Call the Signal wherever you read a dedicated token directly: `inject(CNGX_X_I18N).key` becomes `inject(CNGX_X_I18N)().key`, inside a `computed()`, a template or a handler.
- [ ] Wrap config copy keys you read off an `inject*Config()` in `coerceSignal(...)` before reading them; they may now hold a `Signal`.
- [ ] Rewrite hand-written `*Feature` functions that spread a copy bundle to `createOverrideMerge` (or `createNestedOverrideMerge` for `announcements`, `statusLabels`, `operators` and the timeline `labels.status`).
- [ ] Replace programmatic reads of a copy input (`instance.label()`) that expected the default; an unbound copy input now reads `undefined`, and the rendered text comes from the token.
- [ ] Reshape the formatter keys you override: stepper `stepRolledBack`, tabs `previousTab` / `nextTab`, timeline `groupLabel` (now receives the locale), select `commitFailedMessage`; move `stepCompleted` / `stepErrored` overrides to `statusLabels`.
- [ ] Forward the stepper i18n Signal in custom `createMatStepHandle` overrides.
- [ ] Optional: drive your language file from one Signal and `provideLocale(signal)` to switch at runtime, as shown in [Runtime language switching](./i18n.md#runtime-language-switching).
