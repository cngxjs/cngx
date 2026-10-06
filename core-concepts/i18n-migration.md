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
- `CngxStepperI18n` has four new required keys: `groupRoleDescription` (English `'step group'`), `stepWithDetail(step, detail)` (English `'{step}: {detail}'`, the joiner of a step name and its status or label), `groupSummaryCountShort(total)` and `groupSummaryProgressShort(completed, total)` (the visible collapsed-group badge, English `'4'` and `'1/4'`). A hand-built `Signal<CngxStepperI18n>` supplies them; `withStepperI18nLabels` overrides are unaffected.
- `injectStepperConfig().ariaLabels` and `.fallbackLabels` now always hold a `Signal`, also without `withStepperAriaLabels` / `withStepperFallbackLabels`: their defaults come from the stepper section of the language pack. `provideStepperConfig` and `provideStepperConfigAt` resolve their features when the token is first injected, not when the provider is created.

### @cngx/common/tabs

- `CNGX_TABS_I18N` is now `InjectionToken<Signal<CngxTabsI18n>>`, and `injectTabsI18n()` returns `Signal<CngxTabsI18n>`. Call the Signal where you read a label: `inject(CNGX_TABS_I18N).tabsLabel` becomes `inject(CNGX_TABS_I18N)().tabsLabel`.
- A direct `{ provide: CNGX_TABS_I18N, useValue: bundle }` must supply a Signal. Prefer `provideTabsI18n(withTabsI18nLabels(overrides))`; `withTabsI18nLabels` now also accepts a `Signal<Partial<CngxTabsI18n>>`.
- `CngxTabsI18nFeature` maps `Signal<CngxTabsI18n>` to `Signal<CngxTabsI18n>`. A hand-written feature returns a derived Signal, best through `createOverrideMerge` from `@cngx/core/utils` so an equal result keeps its reference: `(bundle) => createOverrideMerge(bundle, { addTab: 'Neuer Reiter' })`.
- The `i18n` option of `createTabGroupAnnouncements` and `createTabDismissals` is now a `Signal`. Pass `injectTabsI18n()` as is.
- `CngxTabsI18n.previousTab` and `.nextTab` change from `string` to `(positionPhrase: string) => string`. Each receives the `selectedTab(...)` phrase and returns the whole commit-success announcement, so a locale can reorder it. `withTabsI18nLabels({ nextTab: 'Nächster Reiter' })` becomes ``withTabsI18nLabels({ nextTab: (phrase) => `Nächster Reiter: ${phrase}` })``. The English default renders the same text as before.
- Note: the tab-group landmark name resolves `CngxTabsConfig.ariaLabels.tabsRegion` (default `'Tabs'`) before `CngxTabsI18n.tabsLabel`. A language Signal on `withTabsI18nLabels` alone therefore leaves the landmark in English; switch it through `withTabsAriaLabels` as well. This precedence is unchanged.
- `CngxTabsConfig.ariaLabels` and `.fallbackLabels` are typed `L | Signal<L>`, and once `withTabsAriaLabels` / `withTabsFallbackLabels` ran they hold a `Signal`. Code that reads them off `injectTabsConfig()` wraps the key: `config.ariaLabels?.tabsRegion` becomes `coerceSignal(config.ariaLabels)()?.tabsRegion` (`coerceSignal` from `@cngx/core/utils`), read inside a `computed()` or template. Both features now also accept a `Signal`.
- `injectTabsConfig().ariaLabels` and `.fallbackLabels` now always hold a `Signal`, also without `withTabsAriaLabels` / `withTabsFallbackLabels`: their defaults come from the tabs section of the language pack. `provideTabsConfig` and `provideTabsConfigAt` resolve their features when the token is first injected, not when the provider is created.
- `CngxTabsI18n` has a new required key `unlabeledTab(position)` (English `'Tab {position}'`), the name of a tab without a label. A hand-built `Signal<CngxTabsI18n>` supplies it; `withTabsI18nLabels` overrides are unaffected.

### @cngx/common/card

- `CNGX_CARD_I18N` is now `InjectionToken<Signal<CngxCardI18n>>`, and `injectCardI18n()` returns `Signal<CngxCardI18n>`. Call the Signal where you read a phrase, inside a `computed()`, a template or a handler: `inject(CNGX_CARD_I18N).selected` becomes `inject(CNGX_CARD_I18N)().selected`.
- A direct `{ provide: CNGX_CARD_I18N, useValue: bundle }` must supply a Signal. Prefer `provideCardI18n(withCardI18nLabels(overrides))`; `withCardI18nLabels` now also accepts a `Signal<Partial<CngxCardI18n>>`.
- `CngxCardI18nFeature` maps `Signal<CngxCardI18n>` to `Signal<CngxCardI18n>`. A hand-written feature returns a derived Signal, best through `createOverrideMerge` from `@cngx/core/utils`: `(bundle) => createOverrideMerge(bundle, { loading: 'Lädt' })`.
- `CngxCardI18n` has a new required key `timestamp` (English `'{prefix} {date}'`): it sets the order of a `cngx-card-timestamp` prefix and its date. A complete bundle you provide directly adds it; `withCardI18nLabels` overrides are unaffected.

### @cngx/common/command

- The default `CNGX_COMMAND_MATCH_FACTORY` reads the app locale with `injectLocale()` when it is called, so call it in an injection context, as `CngxCommandPanel` does in a field initializer: `inject(CNGX_COMMAND_MATCH_FACTORY)()`. `createDefaultCommandMatcher(locale?)` itself still works anywhere.

### @cngx/common/chart

- `CNGX_CHART_I18N` is now `InjectionToken<Signal<CngxChartI18n>>`. Call the Signal where you read a formatter, inside a `computed()`, a template or a handler: `inject(CNGX_CHART_I18N).summary(input)` becomes `inject(CNGX_CHART_I18N)().summary(input)`. The default factory reads the app locale live, so the default number formatting follows a `CNGX_LOCALE` switch.
- A direct `{ provide: CNGX_CHART_I18N, useValue: bundle }` must supply a Signal. Prefer `provideChartI18n(withChartI18nLabels(overrides))`, which merges over the language pack and the English defaults; `withChartI18nLabels` also accepts a `Signal<Partial<CngxChartI18n>>` for runtime switching. `provideChartI18n` returns a plain `Provider` (it used to return `{ provide, useValue }`).
- `provideChartI18n` takes features like its siblings: `provideChartI18n(overrides)` becomes `provideChartI18n(withChartI18nLabels(overrides))`.

### @cngx/common/data

- `CNGX_RECYCLER_I18N` is now `InjectionToken<Signal<RecyclerI18n>>`. Call the Signal where you read a phrase, inside a `computed()`, an effect or a handler: `inject(CNGX_RECYCLER_I18N).empty()` becomes `inject(CNGX_RECYCLER_I18N)().empty()`.
- A direct `{ provide: CNGX_RECYCLER_I18N, useValue: bundle }` must supply a Signal. Prefer `provideRecyclerI18n(withRecyclerI18nLabels(overrides))`; the feature accepts a `Signal` for runtime switching, and the provider returns a plain `Provider`.
- `provideRecyclerI18n` takes features like its siblings: `provideRecyclerI18n(bundle)` becomes `provideRecyclerI18n(withRecyclerI18nLabels(bundle))`. The overrides are partial and merge over the language pack's recycler section: keys you leave out keep their translated or English text.
- `CngxKpiI18n` has three new required keys: `metricValueWithUnit` (English `'{value} {unit}'`, the order of a metric's value and unit), `metricPlaceholder` (the glyph a metric without a value shows) and `metricNoValue` (English `'No value'`, its accessible name). A hand-built `Signal<CngxKpiI18n>` supplies them; `withKpiI18nLabels` overrides are unaffected.

### @cngx/common/dialog

- `CngxDialogDefaults.labels` is typed `CngxDialogLabels | Signal<CngxDialogLabels>`, and once `provideDialogConfig` / `provideDialogConfigAt` ran it holds a `Signal`. Code that reads it off `injectDialogConfig()` or `CNGX_DIALOG_DEFAULTS` wraps the key: `injectDialogConfig().labels.close` becomes `coerceSignal(injectDialogConfig().labels)().close` (`coerceSignal` from `@cngx/core/utils`), read inside a `computed()`, a template or a handler. A direct `{ provide: CNGX_DIALOG_DEFAULTS, useValue: { labels } }` with a plain bundle keeps compiling.
- `withDialogLabels` now also accepts a `Signal<Partial<CngxDialogLabels>>` for runtime switching; plain partials still merge over the English defaults.
- `CNGX_DIALOG_DEFAULTS.labels` now always holds a `Signal`, also without `provideDialogConfig`: the labels come from the dialog section of the language pack. Read them through `coerceSignal` as above.

### @cngx/common/interactive

- `CngxMenuConfig.ariaLabels` is typed `CngxMenuAriaLabels | Signal<CngxMenuAriaLabels>`, and once `withAriaLabels` ran it holds a `Signal`. Code that reads it off `injectMenuConfig()` or `CNGX_MENU_CONFIG` wraps the key: `injectMenuConfig().ariaLabels.itemActivated` becomes `coerceSignal(injectMenuConfig().ariaLabels)().itemActivated` (`coerceSignal` from `@cngx/core/utils`), read inside a `computed()`, a template or a handler. A hand-written `CngxMenuConfigFeature` that spreads `cfg.ariaLabels` merges through `createOverrideMerge(cfg.ariaLabels, overrides)` instead.
- `withAriaLabels` now also accepts a `Signal<Partial<CngxMenuAriaLabels>>` for runtime switching; plain partials still merge over the inherited labels.
- The copy inputs `CngxAsyncClick.succeededAnnouncement` / `.failedAnnouncement`, `CngxBreadcrumb.label`, `CngxCopyBlock.buttonLabel` / `.copiedLabel` / `.srAnnouncement` and `CngxRangeSlider.startLabel` / `.endLabel` are now `input<string | undefined>`, and an unbound input reads `undefined` instead of the construction-time `CNGX_INTERACTIVE_I18N` default. Template bindings and attribute values are unchanged. Code that reads the input programmatically (`directive.succeededAnnouncement()`) gets `undefined` when nothing is bound; read the rendered result instead, for `CngxAsyncClick` its `announcement()`.
- `injectMenuConfig().ariaLabels` now always holds a `Signal`, also without `withAriaLabels`: its default comes from the menu section of the language pack. `DEFAULT_MENU_CONFIG.ariaLabels` stays the plain English object.
- `canDeactivateWhenClean(isDirty, message?)` no longer has an English default in its signature: without `message` it asks with `CNGX_INTERACTIVE_I18N.unsavedChanges`, read when the guard runs.

### @cngx/common/display

- The copy inputs `CngxAvatarGroup.label` and `CngxChip.removeAriaLabel` are now `input<string | undefined>`, and an unbound input reads `undefined` instead of the construction-time `CNGX_DISPLAY_I18N` default. Template bindings are unchanged; the rendered `aria-label` follows a language switch.
- `CngxAvatarGroup`: a bound `label` now always composes the `<total> <noun>` summary of the language's `avatarGroupLabel` message, also when it happens to equal the `avatarGroupNoun` default. Leave `label` unbound to use a custom `avatarGroupLabel` formatter.
- `CngxDisplayI18n` has three new required keys: `avatarGroupLabelFor(total, hidden, noun)` (the summary for a given noun), `avatarGroupOverflow(count)` (the visible `+N` pill) and `badgeOverflow(max)` (English `'99+'`). A hand-built `Signal<CngxDisplayI18n>` supplies them; `withDisplayI18nLabels` overrides are unaffected.

### @cngx/common/layout

- The copy inputs `CngxExpandableText.moreLabel` / `.lessLabel` are now `input<string | undefined>`, and an unbound input reads `undefined` instead of the construction-time `CNGX_LAYOUT_I18N` default. Template bindings are unchanged; the rendered toggle label follows a language switch.

### @cngx/common/timeline

- `CngxTimelineConfig.labels` is typed `CngxTimelineLabels | Signal<CngxTimelineLabels>`, and once `withTimelineLabels` ran it holds a `Signal`. Code that reads it off `injectTimelineConfig()` or `CNGX_TIMELINE_CONFIG` wraps the key once, in a field: with a module-level `const NO_LABELS: CngxTimelineLabels = {};`, write `private readonly labels = coerceSignal(injectTimelineConfig().labels ?? NO_LABELS);` (`coerceSignal` from `@cngx/core/utils`) and read `this.labels().retry` inside a `computed()`, a template or a handler, where you used to read `injectTimelineConfig().labels?.retry`. A fresh `{}` per call would create a new Signal on every read. A hand-written `CngxTimelineConfigFeature` that spreads `config.labels` merges through `createNestedOverrideMerge(config.labels ?? NO_LABELS, overrides, 'status')` instead, which keeps the per-status merge.
- `withTimelineLabels` now also accepts a `Signal<CngxTimelineLabels>` for runtime switching; plain bundles still merge over the inherited labels, `status` key by key.
- `CngxTimelineLabels.groupLabel` is now `(group, locale: string) => string`. The timeline passes the app locale (`CNGX_LOCALE`, else `LOCALE_ID`) and re-calls the formatter when it switches. A one-argument formatter keeps compiling and renders as before; code that calls `labels.groupLabel(group)` itself passes the locale as the second argument.
- `formatTimelineGroupDate` and `TIMELINE_DEFAULT_GROUP_LABEL` are no longer exported. They were marked internal; call the default `groupLabel` from `injectTimelineConfig()` with a locale instead.
- `injectTimelineConfig().labels` now always holds a `Signal`, also without `withTimelineLabels`: its default comes from the timeline section of the language pack. `provideTimelineConfig` resolves its features when the token is first injected, not when the provider is created.

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
- `CngxSelectAriaLabels` gains `chipRemoveFor: (action, label) => string` and `CngxSelectFallbackLabels` gains `chipOverflowBadge: (count) => string`; both default to the `select` section of the language pack. The resolved `ariaLabels()` / `fallbackLabels()` of `injectSelectConfig()` and of every select component always carry them, and `ariaLabels().chipRemove` is now always a string (`'Remove'` by default). A hand-built `CngxSelectPanelHost` or test double that types its labels as the resolved shape supplies the two new keys.
- `CngxSelectShell.searchMatchFn` takes the option as one object, like every other select matcher: `(value, label, term) => boolean` becomes `(option, term) => boolean` with `option: { value, label }`, typed `CngxSelectMatchFn<T>` (new export). `[searchMatchFn]="(value, label, term) => label.startsWith(term)"` becomes `(option, term) => option.label.startsWith(term)`.
- The `searchMatchFn` input of `CngxCombobox`, `CngxTypeahead`, `CngxActionSelect` and `CngxActionMultiSelect` is typed `CngxSelectMatchFn` instead of `ListboxMatchFn`: the matcher receives `{ value, label }` and no `id`. A matcher declared as `ListboxMatchFn` no longer compiles there; declare it as `CngxSelectMatchFn` (a `CngxSelectMatchFn` still works as a `ListboxMatchFn` on `CngxListboxSearch`).
- `filterSelectOptions(input, term, match)` takes a `CngxSelectMatchFn<T>` and passes each option definition object itself to it, instead of a fresh `{ id: '', value, label, disabled }` literal. A matcher that read `id` or `disabled` gets neither; read `disabled` off the `CngxSelectOptionDef` if you need it, and declare the matcher as `CngxSelectMatchFn<T>`.

### @cngx/forms/field

- `CNGX_ERROR_MESSAGES` is now `InjectionToken<Signal<ErrorMessageMap>>`. Call the Signal where you read a message, inside a `computed()`, a template or a handler: `inject(CNGX_ERROR_MESSAGES)[kind]` becomes `inject(CNGX_ERROR_MESSAGES)()[kind]`.
- A direct `{ provide: CNGX_ERROR_MESSAGES, useValue: map }` must supply a Signal. Prefer `provideErrorMessages(map)` at an environment injector, or `provideFormFieldAt(withErrorMessages(map))` on a component. `provideErrorMessages` and `withErrorMessages` now also accept a `Signal<ErrorMessageMap>` for runtime switching; `withErrorMessages` still merges key by key across features.
- `FormFieldConfig.errorMessages` and `.constraintHints` are typed `T | Signal<T>`, and once `withErrorMessages` / `withConstraintHints` ran they hold a `Signal`. Code that reads them off `injectFormFieldConfig()` or `CNGX_FORM_FIELD_CONFIG` wraps the key once, in a field: `private readonly hints = coerceSignal(injectFormFieldConfig().constraintHints);` (`coerceSignal` from `@cngx/core/utils`), then `this.hints()` inside a `computed()`, a template or a handler. `withConstraintHints` now also accepts a `Signal<Partial<ConstraintHintFormatters>>`.
- `DEFAULT_HINT_FORMATTERS` is removed. The English constraint hints are the `hintLengthRange` / `hintMinLength` / `hintMaxLength` / `hintValueRange` / `hintMinValue` / `hintMaxValue` messages of the `formField` language section, read through `CNGX_FORM_FIELD_I18N`. A `{ provide: CNGX_FORM_FIELD_CONFIG, useValue: { constraintHints: DEFAULT_HINT_FORMATTERS } }` becomes `{ constraintHints: {} }`, or `provideFormFieldAt(withConstraintHints())`.
- `FormFieldConfig.constraintHints` now holds only the formatters passed to `withConstraintHints` (`Partial<ConstraintHintFormatters>`, `{}` without arguments), no longer a set merged over English. The field reads every formatter left out from the language pack at its own locale. Code that called `injectFormFieldConfig().constraintHints` to format a hint reads `injectFormFieldI18n()().hintLengthRange(8, 64)` instead.
- `FormErrorItem` gains a `label` member (the visible `CngxLabel` text, `undefined` without a label). A custom `<cngx-form-errors>` template that renders `err.fieldName` shows the model key; render `err.label` instead.

### @cngx/forms/input

- `InputConfig.ariaLabels` is typed `Partial<InputAriaLabels> | Signal<Partial<InputAriaLabels>>`, and once `withInputAriaLabels` ran it holds a `Signal`. Code that reads it off `injectInputConfig()` or `CNGX_INPUT_CONFIG` wraps the key once, in a field: with a module-level `const NO_LABELS: Partial<InputAriaLabels> = {};`, write `private readonly labels = coerceSignal(injectInputConfig().ariaLabels ?? NO_LABELS);` (`coerceSignal` from `@cngx/core/utils`) and read `this.labels().clear` inside a `computed()`, a template or a handler; a key the config leaves unset is `undefined` there, and the library reads it from the `input` language section. `withInputAriaLabels` now also accepts a `Signal<Partial<InputAriaLabels>>`; plain partials still merge key by key across features.
- `InputConfig.numericLocale` is typed `string | Signal<string>`. Code that reads it off the config wraps it the same way: `coerceSignal(injectInputConfig().numericLocale)()`. `withNumericDefaults({ locale })` and `withCurrency({ locale })` now also accept a `Signal<string>`; `CngxNumericInput` follows a switch while blurred and applies it on blur while focused, as it already does for `CNGX_LOCALE`.
- `CngxPhoneInput.countries` is now `input<readonly Country[] | undefined>`, and an unbound input reads `undefined` instead of the built-in list named in the construction-time locale. Template bindings are unchanged. Unbound, the picker lists the built-in regions named in the live `CNGX_LOCALE` and relabels them on a switch; code that read the list programmatically (`phone.countries()`) gets `undefined` and reads the picker's options instead. `country` keeps its construction-time default object; the picker still shows the live-locale row with the same region.
- `InputAriaLabels.passwordStrength(label)` receives the level word instead of the level key. The word comes from the new optional `passwordStrengthLevel: (level) => string` key, which defaults to the `passwordStrengthLevel` words of the `input` language section (English: the key itself, so English output is unchanged). A formatter that mapped the key to a word, `(label) => DE_WORDS[label]`, moves the mapping to `passwordStrengthLevel: (level) => DE_WORDS[level]` and keeps only the sentence in `passwordStrength`.
- `InputAriaLabels` gains the optional `phoneCountryOption: (dialCode, country) => string` key: one row of the `CngxPhoneInput` country picker, English `'{dialCode} {country}'` (`+43 Austria` as before), so a language can reorder it.

### @cngx/forms/filter-builder

- `CngxFilterBuilderConfig.i18n` is optional and typed `Partial<CngxFilterBuilderI18n> | Signal<Partial<CngxFilterBuilderI18n>>`: it holds only the `withFilterBuilderI18n` overrides, and once a feature ran it holds a `Signal`. The library defaults no longer carry an i18n bundle; unset keys read the `filterBuilder` language section. Code that read the copy off `injectFilterBuilderConfig().i18n` or `CNGX_FILTER_BUILDER_CONFIG` reads the resolved bundle instead, in a field: `private readonly i18n = injectFilterBuilderI18n();` (new export), then `this.i18n().addFilter` inside a `computed()`, a template or a handler. A hand-written `CngxFilterBuilderConfigFeature` that spreads `config.i18n` merges through `createNestedOverrideMerge(config.i18n ?? {}, overrides, 'operators')` instead, which keeps the per-operator merge.
- `withFilterBuilderI18n` now also accepts a `Signal<Partial<CngxFilterBuilderI18n>>` for runtime switching. Plain partials keep their merge rules: top-level keys and `operators` merge key by key across features, `announcement` is replaced as a whole.
- `CngxFilterBuilderAnnouncerSources.i18n` is now `Signal<CngxFilterBuilderI18n>`. A custom `CNGX_FILTER_BUILDER_ANNOUNCER_FACTORY` reads it as `sources.i18n()`, inside `untracked` where it builds the live-region text, so a language switch does not re-speak the last mutation.
- `CngxFilterBuilderI18n` gains two required keys: `unnamedOperator: string`, the label of an operator without an `operators` entry or definition label, and `quotedValue: (value) => string`, a text filter value in announcements. Partials passed to `withFilterBuilderI18n` are unaffected; a hand-built complete bundle (for example the `i18n` of a custom announcer's sources in a test) adds both keys, or reads `injectFilterBuilderI18n()`.
- `CngxFilterRowControllerDeps` gains the required `i18n: Signal<CngxFilterBuilderI18n>`, the copy the row reads. Code that calls `createFilterRowController(...)` itself passes `i18n: injectFilterBuilderI18n()`; a custom `CNGX_FILTER_ROW_CONTROLLER_FACTORY` receives it from the shipped rows.

### @cngx/data-display/treetable

- `TreetableConfig.labels` is typed `Partial<TreetableLabels> | Signal<Partial<TreetableLabels>>`, and once `withTreetableLabels` ran it holds a `Signal`. Code that reads it off `CNGX_TREETABLE_CONFIG` wraps the key once, in a field: with a module-level `const NO_LABELS: Partial<TreetableLabels> = {};`, write `private readonly labels = coerceSignal(inject(CNGX_TREETABLE_CONFIG).labels ?? NO_LABELS);` (`coerceSignal` from `@cngx/core/utils`) and read `this.labels().loading` inside a `computed()`, a template or a handler. `withTreetableLabels` now also accepts a `Signal<Partial<TreetableLabels>>`; plain partials still merge key by key across features.
- `TreetableLabels` gains two optional keys: `columnLabels`, the column header labels by column key, and `unlabeledColumn: (position, column) => string`, the header of a column without a label (English `'Column {position}'`; the column key is passed for a consumer function and never rendered by the default). Both default to the `treetable` section of the language pack; `columnLabels` from `withTreetableLabels` merges key by key over the pack's.
- The internal English label bundle is gone; every English treetable string comes from the new `CNGX_TREETABLE_LANGUAGE_EN` export, the `treetable` section of the language pack.
- `sortTree(nodes, field, direction, locale?)` takes the collation locale as an optional fourth argument. Pass the use-site locale, `sortTree(nodes, 'name', 'asc', injectLocale()())`; without it the runtime default collation applies as before.
- `withCapitaliseHeaders` is removed, and so is the `capitaliseHeader` key of `TreetableConfig` and `CngxTreetableOptions`. It only switched the case of the column key a development build shows for a column without a label; production builds never show that key. Delete the call and the option; development builds now always capitalise the key.

---

## Behaviour changes

### All libraries

- A live region keeps its text when the language switches, and speaks the new language with its next status change. This also holds when a consumer formatter reads a language Signal itself, such as `withErrorMessages({ required: () => translate('required') })` or a `format` function on a select announcer or a stepper count: CNGX now calls these formatters untracked inside the live region, so a switch no longer re-renders the region at once. Shown validation messages in `cngx-field-errors` and `cngx-form-errors` therefore stay in the old language until the field's errors change. Labels outside live regions follow the switch immediately.
- Copy that CNGX builds from a message with arguments wraps every inserted text argument in the Unicode isolates U+2068 / U+2069 and formats every inserted number with the active locale (`1,200`, `1.200` in German). A Latin name inside an Arabic sentence, or the reverse, keeps its own direction. Tests that compare such copy exactly strip the isolates first: `text.replace(/[\u2068\u2069]/g, '')`.
- Copy follows `provideLocaleAt` subtrees. Numbers and plural forms inside CNGX copy (badge overflow, stepper and tabs captions, KPI value text, chart summaries, recycler announcements) format in the locale of the component that shows them, not the root locale. A key you override through a `with*I18nLabels` feature keeps your value; every key you leave alone follows the subtree. A token value you provide directly keeps every key it sets, and the keys it leaves out follow the subtree too.
- Type-to-find ignores accents and lowercases with the app locale, in `CngxActiveDescendant` and everything built on it (listbox, menu, select family) and in the `CngxTreeSelect` expand-to-reveal search: `u` now finds `Über`, and under `tr` an `I` finds `Istanbul` but not `İzmir`. `matchesTypeahead(label, term, locale?)` from `@cngx/core/utils` takes the locale as an optional third argument; without it, it lowercases as before and still ignores accents.
- The default `CngxListboxSearch` matcher and the default `CngxSmartDataSource` search use the same folding: case, accents and invisible format characters (bidi isolates) are ignored in the app locale, so `uber` finds `Über`. A custom `matchFn` / `searchFn` is unaffected.
- The default command matcher (`CngxCommandPanel`, `createDefaultCommandMatcher`) compares query, labels and keywords case- and accent-tolerant in the app locale: `uber` finds `Über`, `cafe` finds the keyword `Café`. The fold is exported as `foldForMatching(value, locale?)` from `@cngx/core/utils`.

### @cngx/common/chart

- `CngxChartI18n` has two new optional keys: `indexColumnLabel` (the data table's index header, English `#`) and `stackedBarSegmentTitle(label, value)` (the stacked-bar segment tooltip, English `label: value`). A full override keeps compiling; the keys it leaves out read the language pack, then English.
- The data table's row numbers and a number `value` in `cngx-chart-legend` format with the app locale (`6,6` in German). A non-finite chart number renders as `∞` / `-∞` / `NaN` in the locale instead of `Infinity`. A legend `value` that is not a number renders as text, as before.
- The words, order and list separator of the default `summary` and `stackedBarSummary` come from the chart section of the language pack, so a German pack can write `Minimum 1,5; Maximum 9` instead of the ambiguous `Min 1,5, max 9`.

### @cngx/common/data

- `CngxSmartDataSource` sorts string fields with a collator of the app locale (`CNGX_LOCALE`) instead of the runtime's default locale, so `Ä` sorts after `Z` in Swedish and next to `A` in German.
- The recycler announcements use the singular for one item (`1 more item loaded`, `1 result found`) and format counts in the app locale (`1,200`).
- `CngxGoal` formats `now` and `max` in its default `aria-valuetext` with the app locale (`1,234.5 of 2,000`, before `1234.5 of 2000`).
- `CngxDelta` lets the locale draw the plus sign of a positive magnitude (`Intl` `signDisplay`), so a locale with its own plus sign or spacing gets it.
- A `CngxMetric` without a value announces `No value` instead of the dash glyph; the glyph still shows, and the unit is neither shown nor announced while there is no value. A pack can place the unit before the value through `metricValueWithUnit`.

### @cngx/common/display

- `CngxBadge` formats a numeric value with the app locale (`1,200`) and renders a count above `max` through `badgeOverflow`. The `CngxAvatarGroup` `+N` pill formats its count the same way.
- A `CngxAvatarGroup` with a bound `label` noun builds its summary from the language's `avatarGroupLabel` message instead of a fixed English composition; English output is unchanged. Its noun is bidi-isolated.

### @cngx/common/interactive

- `CngxSlider` and `CngxRangeSlider` format tick labels and the visible value with the app locale when no `valueText` is bound (`1,000`, `1.000` in German; before `1000`).
- The visible `CngxRangeSlider` value is one message (`rangeValue`, English `'{start} - {end}'`) and reads in the page direction; it is no longer forced `ltr`. Pin a left-to-right readout with `--cngx-slider-range-direction: ltr`.
- `CngxNavLink` derives `data-initial` from the first full character of the link text, uppercased with the app locale (`İ` for Turkish `istanbul`, a whole emoji or accented letter).
- `CngxSpeak` speaks in the app locale while `lang` is unbound, in the order cngx formatters read it: a provided `CNGX_LOCALE` (`provideLocale`, `provideCngxI18n`), else a `LOCALE_ID` other than `en-US`, else `<html lang>`. With none of them, the browser's default voice language applies as before. `en-US` is Angular's `LOCALE_ID` when an app sets none and cannot be told apart from an explicit one, so it never picks the voice: German page text would otherwise be read with an English voice. Ask for American English speech with `provideLocale('en-US')`, `<html lang="en-US">` or `[lang]`.

### @cngx/common/tabs

- The close button of a tab without a label is named by its position through `unlabeledTab` (`Close "Tab 2"`), instead of `Close ""`.

### @cngx/common/timeline

- `CngxTimeline` with `groupBy="week"` starts a week on the first day of the app locale (`Intl.Locale` week info): Sunday under `en-US`, Monday under `de` or `en-GB`. Before, weeks always started on Monday. Where the runtime has no week info, and for `createTimelineGrouping` without a `locale` option, weeks still start on Monday.
- The default group header places the date through the `groupHeader` message; the date is bidi-isolated.

### @cngx/common/stepper

- The collapsed-group screen-reader phrases use the singular for one step: `1 step`, `0 of 1 step complete` (before: `1 steps`).
- The visible collapsed-group badge formats its numbers with the app locale (`1.200` in German) and its order comes from `groupSummaryProgressShort`.
- `cngx-stepper-count` no longer forces `direction: ltr`; the caption reads in the page direction. A `format` that renders a bare ratio such as `2/9` keeps its order under RTL with `--cngx-stepper-count-direction: ltr`.

### @cngx/forms/field

- `CngxFieldErrors` and `CngxFormErrors` no longer show the raw error `kind` (`minLength`). An error resolves to the `CNGX_ERROR_MESSAGES` entry for its kind, then its own `message`, then the English message of a built-in kind (`required`, `requiredTrue`, `email`, `min`, `max`, `minLength`, `maxLength`, `pattern`, `parse`), then `'This value is invalid.'`. A registry entry and a validator `message` still win, so an app that maps every kind sees no change. Translate the library messages through the `formField` section of a language pack or `provideFormFieldI18n(withFormFieldI18nLabels(...))`.
- The default `CngxFormErrors` summary names each field by the visible text of its `CngxLabel` instead of its model key (`E-mail address: ...` where it showed `email: ...`), and places label and message through the `errorSummaryItem` message (English `'{label}: {message}'`). A field without a `CngxLabel` shows its message alone.
- Constraint hints come from the `formField` language section and format their numbers with the field's locale: `1,000–5,000` where English showed `1000–5000`, `1.000–5.000` in German. The length hints pick the singular for one (`Min. 1 character` where it showed `Min. 1 characters`).

### @cngx/forms/select

- The `*cngxSelectAction` slot wrapper in every select panel is now a named group: `role="group"` with `aria-label` from `CngxActionSelectConfig.ariaLabel` (English default `'Inline action'`, set it with `withActionAriaLabel`). Screen readers announce the group name when focus enters the action slot. Before, the key was accepted but never rendered.
- A defaulted copy key that an override sets to `undefined` now resolves to its English default instead of `undefined`. `withFallbackLabels({ empty: undefined })` renders `'No Options'` where it rendered an empty message before; the same holds for every `ariaLabels` key except `clearButton`, whose fallback is per variant. To clear a label, set it to an empty string.
- The select copy comes from the `select` section of the language pack: `CNGX_SELECT_CONFIG` `ariaLabels`, `fallbackLabels` and the announcer format, `CngxActionSelectConfig.ariaLabel` and `CngxReorderableSelectConfig.ariaLabel` default to it, and the clear button falls back to its `clearSelection` (single) or `resetSelection` (multi and input variants). A `with*` feature or a per-instance input still wins. English output is unchanged.
- The accessible name of a chip's remove button is placed by the `chipRemoveFor` message (English `'{action}: {label}'`, `Remove: Red` as before), so a language can reorder it (`Red entfernen`).
- The `+N` chip-overflow badge of `CngxMultiSelect`, `CngxCombobox` and `CngxActionMultiSelect` renders the `chipOverflowBadge` message (English `'+{count}'`) with the count in the locale's digits, and no longer forces `direction: ltr`: it reads in the page direction. A formatter that renders a bare sign-fixed `+N` keeps the sign left under RTL with `--cngx-select-chip-overflow-badge-direction: ltr`.
- Selection announcements format the selected count and the reorder position with the locale (`moved to position 1,500`, `1.500` in German).
- The default search filter of `CngxCombobox`, `CngxTypeahead`, `CngxActionSelect`, `CngxActionMultiSelect` and `CngxSelectShell` uses the same folding as `CngxListboxSearch`: case, accents and invisible format characters are ignored in the locale, so `brule` finds `Crème brûlée`. The closed-trigger type-to-select of `CngxSelect`, `CngxMultiSelect` and `CngxReorderableMultiSelect` matches the same way (`createTypeaheadController` takes an optional `locale` signal). A custom `searchMatchFn` is unaffected.

### @cngx/forms/input

- The input copy comes from the `input` section of the language pack: every `CNGX_INPUT_CONFIG` `ariaLabels` key the config leaves unset, or sets to `undefined`, reads it. `withInputAriaLabels` still wins key by key, also on top of a pack. English output is unchanged apart from the number formatting below.
- `CngxCharCount` readouts, `CngxRating` announcements and star labels, and `CngxOtpSlot` labels format their numbers with the locale: `1,200/5,000` where English showed `1200/5000`, `1.200/5.000` and `2,5 of 5` in German.
- The `cngxInputMask="time"` preset follows the hour cycle of the locale (`Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hourCycle`): `en-US` gets the 12-hour mask `00:00 AA`, `de` the 24-hour `00:00`. The time part of `datetime` follows the same rule (`00/00/0000 00:00 AA` in `en-US`). Before, both were always 24-hour. `time:24` pins the 24-hour mask; `time:12` now renders the 12-hour mask, where before its suffix was ignored and it rendered 24-hour.

### @cngx/forms/filter-builder

- The filter-builder copy comes from the `filterBuilder` section of the language pack: every `CNGX_FILTER_BUILDER_CONFIG` `i18n` key the config leaves unset, or sets to `undefined`, reads it; before, an override set to `undefined` rendered nothing. `withFilterBuilderI18n` still wins key by key, also on top of a pack (`operators` merges per operator, `announcement` is replaced as a whole). English output is unchanged apart from the points below.
- An operator key without an `operators` entry and without a definition `label` is shown and announced as `unnamedOperator` (English `'Unnamed operator'`) in the picker, the row's accessible name and the live region. Before, the raw key (`lengthGt`) was shown and spoken. Give such operators a `label` through `withOperators` or an entry through `withFilterBuilderI18n({ operators })`.
- Announcements about a filter without a field name it with `unboundFilterLabel`: `Filter removed: Unbound filter Equals "x"` where English said `Filter removed: Equals "x"`, and `Filter added: Unbound filter` where it said `Filter added: `. A custom `filterAdded` / `filterRemoved` / `fieldChanged` formatter receives the word as `fieldLabel` instead of an empty string.
- The removal announcement is one message per shape (with or without operator and value) instead of a joined and whitespace-collapsed string, so runs of spaces inside a field label or value are spoken as written. Text values are quoted by the `quotedValue` message (English `'"{value}"'`), so a language can use its own quotation marks.

### @cngx/data-display/treetable

- The treetable copy comes from the `treetable` section of the language pack; `withTreetableLabels` still wins key by key, also on top of a pack. English output is unchanged apart from the points below.
- A column without a `columnLabels` entry and without a `*cngxHeader` template no longer shows its data key in production builds: the header reads `unlabeledColumn` (`Column 2`). Development builds still show the key, capitalised, and warn once per key. Give every column a label through `withTreetableLabels({ columnLabels: { name: 'Name' } })`, the `treetable.columnLabels` of your language pack, or a `*cngxHeader` template.
- The default cell formats numbers and dates with the treetable's locale: `1234.5` renders `1,234.5` in English and `1.234,5` in German (at most three fraction digits), and a `Date` renders as `Oct 5, 2026` instead of `Date.toString()`; an invalid date renders empty. To show the time of day, set `provideTreetable(withTreetableDateFormat({ dateStyle: 'medium', timeStyle: 'short' }))` or the per-instance `dateFormat` option. A `*cngxCell` template still receives the raw value.
- The select-all announcements format the count with the locale: `1,200 rows selected` where English said `1200 rows selected`.


---

## Language files

These apply once your app config calls `provideCngxI18n(...)` from `@cngx/core/i18n`. An app without it is not affected.

- `provideCngxI18n` provides `CNGX_LOCALE` from the active pack's `locale`. A component-level `{ provide: LOCALE_ID, useValue: 'de-CH' }` no longer reaches CNGX formatters, because a provided `CNGX_LOCALE` outranks every `LOCALE_ID`. Use `provideLocaleAt('de-CH')` in that component's `viewProviders` instead.
- `provideCngxI18n` writes `<html lang>` and `<html dir>` from the active pack, and `CNGX_DIRECTION` reports the pack's direction instead of reading `dir` from the DOM. An app that sets these attributes itself passes `withDocumentLanguage('off')`.
- A pack `locale` that is not a BCP 47 tag (`'de_DE'`) reads as English for numbers, plurals, `CNGX_LOCALE` and `<html lang>`, with a warning in development. Write region tags with a hyphen: `'de-DE'`.

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
