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

### @cngx/common/tabs

- `CNGX_TABS_I18N` is now `InjectionToken<Signal<CngxTabsI18n>>`, and `injectTabsI18n()` returns `Signal<CngxTabsI18n>`. Call the Signal where you read a label: `inject(CNGX_TABS_I18N).tabsLabel` becomes `inject(CNGX_TABS_I18N)().tabsLabel`.
- A direct `{ provide: CNGX_TABS_I18N, useValue: bundle }` must supply a Signal. Prefer `provideTabsI18n(withTabsI18nLabels(overrides))`; `withTabsI18nLabels` now also accepts a `Signal<Partial<CngxTabsI18n>>`.
- `CngxTabsI18nFeature` maps `Signal<CngxTabsI18n>` to `Signal<CngxTabsI18n>`. A hand-written feature returns a derived Signal, best through `createOverrideMerge` from `@cngx/core/utils` so an equal result keeps its reference: `(bundle) => createOverrideMerge(bundle, { addTab: 'Neuer Reiter' })`.
- The `i18n` option of `createTabGroupAnnouncements` and `createTabDismissals` is now a `Signal`. Pass `injectTabsI18n()` as is.
- Note: the tab-group landmark name resolves `CngxTabsConfig.ariaLabels.tabsRegion` (default `'Tabs'`) before `CngxTabsI18n.tabsLabel`. A language Signal on `withTabsI18nLabels` alone therefore leaves the landmark in English; switch it through `withTabsAriaLabels` as well. This precedence is unchanged.
- `CngxTabsConfig.ariaLabels` and `.fallbackLabels` are typed `L | Signal<L>`, and once `withTabsAriaLabels` / `withTabsFallbackLabels` ran they hold a `Signal`. Code that reads them off `injectTabsConfig()` wraps the key: `config.ariaLabels?.tabsRegion` becomes `coerceSignal(config.ariaLabels)()?.tabsRegion` (`coerceSignal` from `@cngx/core/utils`), read inside a `computed()` or template. Both features now also accept a `Signal`.

### @cngx/common/card

- `CNGX_CARD_I18N` is now `InjectionToken<Signal<CngxCardI18n>>`, and `injectCardI18n()` returns `Signal<CngxCardI18n>`. Call the Signal where you read a phrase, inside a `computed()`, a template or a handler: `inject(CNGX_CARD_I18N).selected` becomes `inject(CNGX_CARD_I18N)().selected`.
- A direct `{ provide: CNGX_CARD_I18N, useValue: bundle }` must supply a Signal. Prefer `provideCardI18n(withCardI18nLabels(overrides))`; `withCardI18nLabels` now also accepts a `Signal<Partial<CngxCardI18n>>`.
- `CngxCardI18nFeature` maps `Signal<CngxCardI18n>` to `Signal<CngxCardI18n>`. A hand-written feature returns a derived Signal, best through `createOverrideMerge` from `@cngx/core/utils`: `(bundle) => createOverrideMerge(bundle, { loading: 'Lädt' })`.

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

### @cngx/ui/timeline

- `createTimelineFallbackCopy(config)` now returns `Signal<CngxTimelineFallbackCopy>`. Call it where you read a string: `copy.retry` becomes `copy().retry`.
- The `labels` argument of `createTimelineView` and of a `CngxTimelineViewFactory` override (`CNGX_TIMELINE_VIEW_FACTORY`) is now `Signal<CngxTimelineFallbackCopy>`. An override that builds the announcement reads the copy inside `untracked(() => labels().loading)`, so a language switch does not re-voice the live region.

### @cngx/ui/mat-stepper

- The optional third argument of `createMatStepHandle` (and so of `CngxMatStepHandleFactory` overrides) is now `Signal<CngxStepperI18n>`. An override that delegates to `createMatStepHandle` forwards the Signal unchanged; the last-resort `Step <id>` label then follows a language switch.

### @cngx/ui/feedback

- `CNGX_FEEDBACK_I18N` is now `InjectionToken<Signal<CngxFeedbackI18n>>`, and `injectFeedbackI18n()` returns `Signal<CngxFeedbackI18n>`. Call the Signal where you read a label, inside a `computed()`, a template or a handler: `inject(CNGX_FEEDBACK_I18N).alertsRegionLabel` becomes `inject(CNGX_FEEDBACK_I18N)().alertsRegionLabel`.
- A direct `{ provide: CNGX_FEEDBACK_I18N, useValue: bundle }` must supply a Signal. Prefer `provideFeedbackI18n(overrides)`, which merges over the English defaults, `announcements` key by key. `provideFeedbackI18n` and `withFeedbackI18nLabels` now also accept a `Signal<CngxFeedbackI18nOverrides>` for runtime switching, and `provideFeedbackI18n` returns a plain `Provider` (it used to return `{ provide, useValue }`).
- The copy inputs `CngxLoadingIndicator.label`, `CngxLoadingOverlay.label` and `CngxProgress.label` are now `input<string | undefined>`, and an unbound input reads `undefined` instead of the construction-time `loadingLabel` / `progressLabel` default. Template bindings are unchanged; the rendered `aria-label` follows a language switch while the input is unbound. Code that reads the input programmatically (`indicator.label()`) gets `undefined` when nothing is bound; read the rendered `aria-label` instead.

### @cngx/ui/data-grid-accordion

- The copy inputs `CngxDgaCount.singular` / `.plural`, `CngxDgaFilter.ariaLabel`, `CngxDgaFilterField.label`, `CngxDataGridRow.errorMessage` and `CngxDgaSortHeader.notSortedLabel` / `.ascendingLabel` / `.descendingLabel` / `.ascendingAnnouncement` / `.descendingAnnouncement` / `.clearedAnnouncement` are now `input<string | undefined>`, and an unbound input reads `undefined` instead of the construction-time `withDataGridAccordionLabels` default. Template bindings and attribute values are unchanged; the rendered text follows a language switch while the input is unbound. Code that reads the input programmatically (`sortHeader.notSortedLabel()`) gets `undefined` when nothing is bound; read the rendered text instead.
- `CngxDgaCount`: a bound `cngxDgaCountSingular` or `cngxDgaCountPlural` now always composes `<count> <noun>`, also when it happens to equal the `countSingular` / `countPlural` default, and an unbound noun falls back to its label. Leave both unbound to use a custom `count` formatter.

### @cngx/forms/select

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

### @cngx/forms/select

- The `*cngxSelectAction` slot wrapper in every select panel is now a named group: `role="group"` with `aria-label` from `CngxActionSelectConfig.ariaLabel` (English default `'Inline action'`, set it with `withActionAriaLabel`). Screen readers announce the group name when focus enters the action slot. Before, the key was accepted but never rendered.
- A defaulted copy key that an override sets to `undefined` now resolves to its English default instead of `undefined`. `withFallbackLabels({ empty: undefined })` renders `'No Options'` where it rendered an empty message before; the same holds for every `ariaLabels` key except `clearButton` and `chipRemove`, whose fallback is per variant. To clear a label, set it to an empty string.
