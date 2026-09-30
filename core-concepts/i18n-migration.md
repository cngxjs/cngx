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

### @cngx/ui/mat-stepper

- The optional third argument of `createMatStepHandle` (and so of `CngxMatStepHandleFactory` overrides) is now `Signal<CngxStepperI18n>`. An override that delegates to `createMatStepHandle` forwards the Signal unchanged; the last-resort `Step <id>` label then follows a language switch.

---

## Behaviour changes

No behaviour changes yet.
