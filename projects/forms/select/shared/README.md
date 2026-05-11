# `shared/` — Select-family infrastructure

This folder is the spine of `@cngx/forms/select`.
The eight variants (`single-select`, `multi-select`, `combobox`, `typeahead`, `tree-select`, `reorderable-multi-select`, `action-select`, `action-multi-select`) are thin `@Component` declarations that delegate every cross-cutting concern to factories, tokens, slot directives, and config helpers defined here.

If you're consuming the public API, you usually don't import from here directly — pull from `@cngx/forms/select` and the right facade is re-exported.
If you're extending the family (new variant, telemetry override, custom commit policy), this README is the navigation guide.

For the architectural overview see [`../../../ARCHITECTURE.md`](../../../ARCHITECTURE.md).

## Reading guide

The artifacts cluster into seven concerns:

1. [Core factory](#1-core-factory) — `createSelectCore` and its inputs/outputs.
2. [Commit machinery](#2-commit-machinery) — controller + four flow handlers + announcer.
3. [Panel infrastructure](#3-panel-infrastructure) — host tokens, panel-shell, renderer.
4. [Lifecycle helpers](#4-lifecycle-helpers) — emitter, dismiss, search, focus, field-sync, AD-dispatch, display-binding.
5. [Template slot system](#5-template-slot-system) — directives + cascade registry.
6. [Configuration cascade](#6-configuration-cascade) — three config surfaces + aggregator.
7. [Family primitives](#7-family-primitives) — option model, navigation helpers, glyphs, CSS.

Every public token follows the `provide` / `with` / `inject` / `create` prefix convention (see global memory `reference_api_prefix_convention.md`).
Every factory has a corresponding DI token (`Cngx<Name>Factory` type + `CNGX_<NAME>_FACTORY` constant) for swap-without-fork extensibility.

---

## 1. Core factory

### `select-core.ts`

`createSelectCore<T, TCommit>(deps, announcerInputs)` is the heart of every variant. It bundles the pure-derivation signal graph (option model, panel view, ARIA projection, selection, commit infrastructure, announcer hook) into one object that the variant's `@Component` body delegates to.

Every variant calls it once in a field initialiser and stores the returned `CngxSelectCore<T, TCommit>` instance. What stays in the variant body is the trigger template and the value-shape adapter — everything else flows through this factory.

Public exports re-emitted from `@cngx/forms/select`:

| Symbol                           | Purpose                                             |
| -------------------------------- | --------------------------------------------------- |
| `createSelectCore`               | The factory                                         |
| `CngxSelectCore<T, TCommit>`     | Return shape                                        |
| `CngxSelectCoreDeps<T, TCommit>` | Input shape                                         |
| `CngxSelectCompareFn<T>`         | `(a: T \| undefined, b: T \| undefined) => boolean` |
| `cngxSelectDefaultCompare`       | `Object.is`-based default                           |
| `CngxSelectTriggerAria`          | Bundled ARIA projection for the trigger             |
| `CngxSelectAnnouncerInputs`      | Per-instance announcer config                       |
| `CngxSelectFormFieldControl`     | Full forms control contract                         |
| `CngxSelectStatus`               | Resolved field status type                          |

See [`ARCHITECTURE.md` § Core factory](../../../ARCHITECTURE.md#core-factory-createselectcore) for the input/output diagram.

---

## 2. Commit machinery

### `commit-action.types.ts`

Public type aliases for `[commitAction]` consumers:

| Type                           | Purpose                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `CngxSelectCommitAction<T>`    | `(intended: T \| undefined) => Observable<T \| undefined> \| Promise<T \| undefined> \| T \| undefined` |
| `CngxSelectCommitMode`         | `'optimistic' \| 'pessimistic'`                                                                         |
| `CngxSelectCommitErrorDisplay` | `'banner' \| 'inline' \| 'none'`                                                                        |

### `commit-action.runtime.ts`

Internal runtime that subscribes/awaits the value returned from a `CngxSelectCommitAction<T>` and dispatches `onSuccess` / `onError` callbacks.
Callable as `runCommitAction<T>(action, intended, handlers)`; returns a `CngxCommitHandle` with a `cancel()` method. Used internally by `createCommitController`. Not exported.

### `commit-controller.ts`

Low-level state machine for the async-commit lifecycle. Owns the `ManualAsyncState<T | undefined>` slot, the monotonic `commitId` for supersede semantics, the `intendedValue` signal driving the option-row spinner, and the `begin(action, intended, previous, handlers)`

- `cancel()` API.

| Symbol                                  | Purpose                                   |
| --------------------------------------- | ----------------------------------------- |
| `createCommitController<T>()`           | Default factory                           |
| `CngxCommitController<T>`               | Return shape                              |
| `CngxCommitBeginHandlers<T>`            | `{ onSuccess, onError }` outcome handlers |
| `CngxSelectCommitControllerFactory`     | DI factory type                           |
| `CNGX_SELECT_COMMIT_CONTROLLER_FACTORY` | DI token                                  |

Override the token to wrap the controller with retry-with-backoff, offline queues, or telemetry — every variant picks up the override without a fork.

### `array-commit-handler.ts`

Multi/Combobox/Action-multi/Reorderable per-toggle + clear-all flow.
Owns the value reconciliation (`sameArrayContents`-guarded), rollback on error in optimistic mode, `togglingOption.set(null)` on success, live-region "removed" announce on error/clear paths.

| Symbol                              | Purpose                                                  |
| ----------------------------------- | -------------------------------------------------------- |
| `createArrayCommitHandler<T>`       | Default factory                                          |
| `ArrayCommitHandler<T>`             | API: `beginToggle`, `beginClear`, `retryLast`            |
| `ArrayCommitHandlerOptions<T>`      | Input shape (consumer wires `core` + finalize callbacks) |
| `CngxArrayCommitHandlerFactory`     | DI factory type                                          |
| `CNGX_ARRAY_COMMIT_HANDLER_FACTORY` | DI token                                                 |

### `scalar-commit-handler.ts`

Single-value action-select commit flow. Sibling of `array-commit-handler`.

| Symbol                               | Purpose         |
| ------------------------------------ | --------------- |
| `createScalarCommitHandler<T>`       | Default factory |
| `ScalarCommitHandler<T>`             | API             |
| `ScalarCommitHandlerOptions<T>`      | Input shape     |
| `CngxScalarCommitHandlerFactory`     | DI factory type |
| `CNGX_SCALAR_COMMIT_HANDLER_FACTORY` | DI token        |

### `reorder-commit-handler.ts`

Reorderable-specific position-move commit. Bypasses the array handler's `sameArrayContents` membership-preserving guard (which would skip reorders) and talks to `commitController` directly with the new order.

| Symbol                                | Purpose         |
| ------------------------------------- | --------------- |
| `createReorderCommitHandler<T>`       | Default factory |
| `ReorderCommitHandler<T>`             | API             |
| `ReorderCommitHandlerOptions<T>`      | Input shape     |
| `CngxReorderCommitHandlerFactory`     | DI factory type |
| `CNGX_REORDER_COMMIT_HANDLER_FACTORY` | DI token        |

### `create-commit-handler.ts` + `create-action.types.ts`

Action-host quick-create commit flow (used by `CngxActionSelect` and `CngxActionMultiSelect`). Owns the `(created)` output dispatch, the `localItems` buffer write, and the action-slot's `retry()` / `(retry)` semantics.

| Symbol                               | Purpose                                              |
| ------------------------------------ | ---------------------------------------------------- |
| `createCreateCommitHandler<T>`       | Default factory                                      |
| `CreateCommitHandler<T>`             | API: `beginCreate`, `retryLast`                      |
| `CreateCommitHandlerOptions<T>`      | Input shape                                          |
| `CngxCreateCommitHandlerFactory`     | DI factory type                                      |
| `CNGX_CREATE_COMMIT_HANDLER_FACTORY` | DI token                                             |
| `CngxSelectCreateAction<T>`          | `(term: string) => Observable<T> \| Promise<T> \| T` |

### `commit-error-announcer.ts`

Declarative scalar commit-error announce policy. Two policies:

- `{ kind: 'verbose'; severity: 'assertive' \| 'polite' }` — `CngxSelect` reads.
- `{ kind: 'soft' }` — `CngxTypeahead` reads (announces "removed" politely).

| Symbol                                | Purpose              |
| ------------------------------------- | -------------------- |
| `createCommitErrorAnnouncer`          | Default factory      |
| `CngxCommitErrorAnnouncePolicy`       | Discriminated policy |
| `CngxCommitErrorAnnounceDeps`         | Wiring deps          |
| `CngxCommitErrorAnnouncerOptions`     | Input shape          |
| `CngxCommitErrorAnnouncerFactory`     | DI factory type      |
| `CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY` | DI token             |

The two-policy split is documented as accepted debt — see
`select-family-accepted-debt.md` entry #1.

### `chip-removal-handler.ts`

Per-chip ✕ click + Backspace-on-empty handler. Owns the disabled-guard

- `[...values()]` snapshot + `compareWith`-filtered next array + commit/sync branch dispatch + WeakMap closure cache (so `removeFor(item)` returns stable identity across CD cycles).

`removeOverride` escape hatch lets `CngxTreeSelect` keep its tree-aware mutation path while still using the WeakMap caching + disabled-guard.

| Symbol                                   | Purpose                            |
| ---------------------------------------- | ---------------------------------- |
| `createChipRemovalHandler<T, Item>`      | Default factory                    |
| `CngxChipRemovalHandler<Item>`           | API: `removeByValue`, `removeFor`  |
| `CngxChipRemovalHandlerOptions<T, Item>` | Input shape                        |
| `CngxChipRemovableItem<T>`               | `{ readonly value: T }` constraint |
| `CngxChipRemovalHandlerFactory`          | DI factory type                    |
| `CNGX_CHIP_REMOVAL_HANDLER_FACTORY`      | DI token                           |

---

## 3. Panel infrastructure

### `panel-host.ts`

Two host-contract tokens that the panel-shell + panel components consume from the variant component.

| Symbol                             | Purpose                                                                                                                                                                                        |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CngxSelectPanelViewHost<T>`       | Narrow shell contract — `activeView`, `skeletonIndices`, error/commit-error contexts, `tpl`, `fallbackLabels`, `ariaLabels`, optional `searchTerm` / `unfilteredCount` / `previousLoadedCount` |
| `CNGX_SELECT_PANEL_VIEW_HOST`      | Token for the narrow contract — provided by all 8 variants, injected by `CngxSelectPanelShell`                                                                                                 |
| `CngxSelectPanelHost<T>`           | Full option-loop contract — extends the view host with `options`, `isSelected`, `isIndeterminate`, indicator resolution, listbox comparator, AD active id, commit-error value                  |
| `CNGX_SELECT_PANEL_HOST`           | Token for the full contract — provided by 7 of 8 variants (tree-select uses `CNGX_TREE_SELECT_PANEL_HOST` instead)                                                                             |
| `CngxSelectPanelShellTemplates<T>` | Narrow 7-slot template bundle the shell reads                                                                                                                                                  |
| `CngxSelectActionCallbacks`        | Action-slot callback bundle                                                                                                                                                                    |

### `panel-shell/`

Subfolder containing `panel-shell.component.ts` — the shared frame around every variant's panel body.
Owns the `activeView()` switch (loading variants, empty/none, first-load error, refresh indicator, commit-error banner) and projects the variant-specific body via `<ng-content />`. Internal — `@internal` JSDoc tag — but exported as
`CngxSelectPanelShell` for variant components that compose it.

### `panel/`

Subfolder containing `panel.component.ts` — the flat option-loop panel body.
Wraps `<cngx-select-panel-shell>` and contributes the grouped/flat `@for` option loop with `viewChildren(CngxOption)`, `items` computed, and `isHighlighted(opt)`.
Used by 4 variants:
`CngxSelect`, `CngxMultiSelect`, `CngxCombobox`, `CngxTypeahead`.
Reorderable + action variants reuse it via `CNGX_SELECT_PANEL_HOST`.

Tree-select uses its own `tree-select-panel.component.ts` (sibling of this folder, in `tree-select/`) because the panel body is a `role="tree"` recursive structure rather than a flat option loop.

### `panel-renderer.ts` + `recycler-panel-renderer.ts`

Pluggable panel render strategy. Default identity renderer returns `flatOptions()` verbatim; recycler renderer slices `flatOptions` by the recycler's `start`/`end` window and exposes the virtualizer metadata (`offsetBefore`, `offsetAfter`, `setsize`, `scrollToIndex`) the panel template binds.

| Symbol                                         | Purpose                          |
| ---------------------------------------------- | -------------------------------- |
| `createIdentityPanelRenderer<T>`               | Default factory                  |
| `createRecyclerPanelRendererFactory(recycler)` | Recycler-backed factory builder  |
| `PanelRenderer<T>`                             | Output shape                     |
| `PanelRendererInput<T>`                        | Input shape (just `flatOptions`) |
| `CngxPanelRendererFactory`                     | DI factory type                  |
| `CNGX_PANEL_RENDERER_FACTORY`                  | DI token                         |

### `auto-virtualize.ts` + `setup-virtualization.ts`

Convenience helpers that wire the recycler renderer for variants with the `withVirtualization()` config feature enabled. `auto-virtualize` returns a `PanelRenderer<T>` wrapping the recycler with threshold-gated identity fallback for small lists; `setup-virtualization` is the field-init hook each variant calls.

---

## 4. Lifecycle helpers

### `panel-lifecycle-emitter.ts`

Single shared `effect()` that emits `openedChange` + `opened` + `closed` outputs in response to `panelOpen` flips and restores focus to the trigger after close. All 8 variants wire through this factory.

| Symbol                                 | Purpose         |
| -------------------------------------- | --------------- |
| `createPanelLifecycleEmitter`          | Default factory |
| `PanelLifecycleEmitterOptions`         | Input shape     |
| `CngxPanelLifecycleEmitterFactory`     | DI factory type |
| `CNGX_PANEL_LIFECYCLE_EMITTER_FACTORY` | DI token        |

### `dismiss-handler.ts`

Click-outside dismissal. Action-host-aware — when an action workflow is dirty, the handler's `shouldBlockDismiss` callback intercepts the dismissal so unsaved input doesn't get dumped.

| Symbol                         | Purpose                   |
| ------------------------------ | ------------------------- |
| `createDismissHandler`         | Default factory           |
| `DismissHandler`               | API: `handleClickOutside` |
| `DismissHandlerOptions`        | Input shape               |
| `CngxDismissHandlerFactory`    | DI factory type           |
| `CNGX_DISMISS_HANDLER_FACTORY` | DI token                  |

### `search-effects.ts`

Debounced `searchTerm` → `(searchTermChange)` emit + auto-open on typing. Used by combobox, typeahead, action-multi-select.

| Symbol                        | Purpose         |
| ----------------------------- | --------------- |
| `createSearchEffects`         | Default factory |
| `SearchEffectsOptions`        | Input shape     |
| `CngxSearchEffectsFactory`    | DI factory type |
| `CNGX_SEARCH_EFFECTS_FACTORY` | DI token        |

### `trigger-focus.ts`

Shared `focused` signal slot. Variants own their own focus reactions (open-on-focus, clearOnBlur typeahead reset, presenter `markAsTouched` forwarding) but the underlying `WritableSignal<boolean>` lives here.

| Symbol                       | Purpose                                           |
| ---------------------------- | ------------------------------------------------- |
| `createTriggerFocusState`    | Default factory                                   |
| `CngxTriggerFocusState`      | `{ focused, writable, markFocused, markBlurred }` |
| `CngxTriggerFocusFactory`    | DI factory type                                   |
| `CNGX_TRIGGER_FOCUS_FACTORY` | DI token                                          |

### `field-sync.ts`

Bidirectional `componentValue ↔ field.value()` sync via two `effect()`s, both directions guarded by `valueEquals` to suppress redundant writes.
No-op without a `CngxFormFieldPresenter` in scope (standalone use case).

| Symbol                | Purpose         |
| --------------------- | --------------- |
| `createFieldSync<V>`  | Default factory |
| `FieldSyncOptions<V>` | Input shape     |

### `ad-activation-dispatcher.ts`

Routes the listbox's `ActiveDescendant.activated` stream into the variant's commit / non-commit callbacks. Single `effect(onCleanup)` that resubscribes when the listbox ref resolves; opt-null guard drops activations for unknown values.

| Symbol                                | Purpose         |
| ------------------------------------- | --------------- |
| `createADActivationDispatcher<T, V>`  | Default factory |
| `ADActivationDispatcherOptions<T, V>` | Input shape     |

### `display-binding.ts`

Bidirectional binding between a scalar `value` signal and the visible text of a co-located `<input cngxListboxSearch>` element.
Used by `CngxTypeahead` (and reusable by any future scalar autocomplete).
Two effects: value → input text on commit; user typing → consumer callback (suppresses library writes via a `writingFlag`).

| Symbol                         | Purpose                                     |
| ------------------------------ | ------------------------------------------- |
| `createDisplayBinding<T>`      | Default factory                             |
| `DisplayBinding<T>`            | API: `writeFromValue`, `isWritingFromValue` |
| `DisplayBindingOptions<T>`     | Input shape                                 |
| `CngxDisplayBindingFactory`    | DI factory type                             |
| `CNGX_DISPLAY_BINDING_FACTORY` | DI token                                    |

### `action-host-bridge.ts`

Wires the action-select organisms' `*cngxSelectAction` slot into the panel-shell. Owns the dirty-flag tracking, the focus-trap policy, the Escape-intercept on dirty workflows, and the action-callback bundle
exposed to the slot context.

| Symbol                            | Purpose         |
| --------------------------------- | --------------- |
| `createActionHostBridge`          | Default factory |
| `ActionHostBridge`                | API             |
| `ActionHostBridgeOptions`         | Input shape     |
| `CngxActionHostBridgeFactory`     | DI factory type |
| `CNGX_ACTION_HOST_BRIDGE_FACTORY` | DI token        |

### `local-items-buffer.ts`

Persistent buffer of just-created items merged into the option list before the consumer's filter overlay runs. Survives `[state]` refetches; items drop out silently once the server-side list contains them (deduped via `compareWith`).

| Symbol                            | Purpose                      |
| --------------------------------- | ---------------------------- |
| `createLocalItemsBuffer<T>`       | Default factory              |
| `LocalItemsBuffer<T>`             | API: `items`, `add`, `clear` |
| `CngxLocalItemsBufferFactory`     | DI factory type              |
| `CNGX_LOCAL_ITEMS_BUFFER_FACTORY` | DI token                     |

### `inject-helpers.ts`

Two thin convenience helpers for the most-injected tokens:

| Symbol                    | Purpose                                                                          |
| ------------------------- | -------------------------------------------------------------------------------- |
| `injectSelectConfig()`    | `inject(CNGX_SELECT_CONFIG, { optional: true }) ?? CNGX_SELECT_DEFAULTS` cascade |
| `injectSelectAnnouncer()` | `inject(CngxSelectAnnouncer)`                                                    |

---

## 5. Template slot system

### `template-slots.ts`

The 17 public slot directives + their context interfaces.
Each slot is a structural directive whose only job is to project a `TemplateRef` with the documented context shape.

Slot list (with the cascade tier each slot belongs to — every slot flows through the three-stage cascade in `template-registry.ts`):

| Directive                                         | Context interface                   |
| ------------------------------------------------- | ----------------------------------- |
| `CngxSelectCheck<T>`                              | `CngxSelectCheckContext<T>`         |
| `CngxSelectCaret`                                 | `CngxSelectCaretContext`            |
| `CngxSelectOptgroupTemplate<T>`                   | `CngxSelectOptgroupContext<T>`      |
| `CngxSelectPlaceholder`                           | `CngxSelectPlaceholderContext`      |
| `CngxSelectEmpty`                                 | `CngxSelectEmptyContext`            |
| `CngxSelectLoading`                               | `CngxSelectLoadingContext`          |
| `CngxSelectRefreshing`                            | `CngxSelectRefreshingContext`       |
| `CngxSelectError`                                 | `CngxSelectErrorContext`            |
| `CngxSelectCommitError<T>`                        | `CngxSelectCommitErrorContext<T>`   |
| `CngxSelectRetryButton`                           | `CngxSelectRetryButtonContext`      |
| `CngxSelectLoadingGlyph`                          | (no context)                        |
| `CngxSelectClearButton`                           | `CngxSelectClearButtonContext`      |
| `CngxSelectOptionLabel<T>`                        | `CngxSelectOptionLabelContext<T>`   |
| `CngxSelectOptionPending<T>`                      | `CngxSelectOptionPendingContext<T>` |
| `CngxSelectOptionError<T>`                        | `CngxSelectOptionErrorContext<T>`   |
| `CngxSelectAction`                                | `CngxSelectActionContext`           |
| `CngxSelectInputPrefix` / `CngxSelectInputSuffix` | `CngxSelectInputSlotContext`        |

Plus the variant-specific slots (also defined here):

| Directive                                                   | Variant             |
| ----------------------------------------------------------- | ------------------- |
| `CngxSelectTriggerLabel<T>`                                 | single only         |
| `CngxMultiSelectChip<T>` / `CngxMultiSelectTriggerLabel<T>` | multi + reorderable |
| `CngxMultiSelectChipHandle`                                 | reorderable only    |
| `CngxComboboxChip<T>` / `CngxComboboxTriggerLabel<T>`       | combobox            |

### `template-registry.ts`

Three-stage cascade resolver. Variants declare their `contentChild()` queries inline (Angular's NG8110 rejects the call from helper functions) and pass the bundle to `createTemplateRegistry({...})`.
The factory wires each query through `resolveTemplate` to deliver the resolved `Signal<TemplateRef | null>` per slot.

| Symbol                                 | Purpose                                  |
| -------------------------------------- | ---------------------------------------- |
| `createTemplateRegistry<T>`            | Default factory                          |
| `CngxSelectTemplateRegistryQueries<T>` | Input shape (raw `contentChild` signals) |
| `CngxSelectTemplateRegistry<T>`        | Output shape (resolved per-slot signals) |
| `CngxTemplateRegistryFactory`          | DI factory type                          |
| `CNGX_TEMPLATE_REGISTRY_FACTORY`       | DI token                                 |

### `resolve-template.ts`

The actual three-stage cascade primitive: `instance contentChild → CNGX_SELECT_CONFIG.templates.<key> → null`.
Used internally by the registry + by tree-select for tree-specific slots that aren't part of the shared registry shape.

| Symbol                                         | Purpose                                  |
| ---------------------------------------------- | ---------------------------------------- |
| `injectResolvedTemplate(directive, configKey)` | Public helper for ad-hoc slot resolution |
| `resolveTemplate(...)`                         | Lower-level alias kept for back-compat   |

### `glyphs.ts`

**Internal-only**, NOT exported from `public-api.ts`. The 5 default glyph strings (`✕ ▾ ▸ ⋮⋮ !`) shared by the slot fallbacks.
Plain `as const` object — tree-shakeable, `aria-hidden` stays at the call site.

| Symbol               | Purpose                           |
| -------------------- | --------------------------------- |
| `CNGX_SELECT_GLYPHS` | The const                         |
| `CngxSelectGlyphKey` | `keyof typeof CNGX_SELECT_GLYPHS` |

Cascade order at every glyph site: structural directive → input override → `CNGX_SELECT_GLYPHS.<key>`.

---

## 6. Configuration cascade

### `config.ts`

The main `CNGX_SELECT_CONFIG` token + `provideSelectConfig(...)` / `provideSelectConfigAt(...)` providers + the entire `with*` feature catalog (panel width, virtualization, dismiss policy, announcer, ARIA labels, fallback labels, selection indicator, …).

Public exports:

- **Token**: `CNGX_SELECT_CONFIG`, `CNGX_SELECT_DEFAULTS`.
- **Providers**: `provideSelectConfig`, `provideSelectConfigAt`.
- **Type aliases**: `CngxSelectConfig`, `CngxSelectAnnouncerConfig`, `CngxSelectAriaLabels`, `CngxSelectFallbackLabels`, `CngxSelectTemplateContexts`, `CngxSelectConfigFeature`, `CngxSelectVirtualizationConfig`, plus the four enum types (`CngxSelectLoadingVariant`, `CngxSelectRefreshingVariant`, `CngxSelectSelectionIndicatorPosition`, `CngxSelectSelectionIndicatorVariant`).
- **Features (32+)**: `withPanelWidth`, `withPanelClass`, `withTypeaheadDebounce`, `withTypeaheadWhileClosed`, `withSelectionIndicator`, `withSelectionIndicatorPosition`, `withSelectionIndicatorVariant`, `withCaret`, `withRestoreFocus`, `withDismissOn`, `withOpenOn`, `withAnnouncer`, `withAriaLabels`, `withFallbackLabels`, `withLoadingVariant`, `withSkeletonRowCount`, `withRefreshingVariant`, `withCommitErrorDisplay`, `withCommitErrorAnnouncePolicy`, `withChipOverflow`, `withMaxVisibleChips`, `withInputMode`, `withEnterKeyHint`, `withPopoverPlacement`, `withVirtualization`.

### `action-select-config.ts`

`CNGX_ACTION_SELECT_CONFIG` token + `provideActionSelectConfig(...)` /
`*At` providers + 7 features specific to the action-host:

- **Features**: `withFocusTrapBehavior`, `withCloseOnCreate`, `withActionPopoverPlacement`, `withLiveInputFallback`, `withActionPosition`, `withActionAriaLabel`.
- **Type aliases**: `CngxActionSelectConfig`, `CngxActionFocusTrapBehavior`, `CngxActionPosition`, `CngxActionSelectConfigFeature`.
- **Resolver**: `resolveActionSelectConfig()` for variant injection.

### `reorderable-select-config.ts`

`CNGX_REORDERABLE_SELECT_CONFIG` token + `provideReorderableSelectConfig(...)` /
`*At` providers + 4 features:

- **Features**: `withReorderKeyboardModifier`, `withReorderAriaLabel`, `withReorderStripFreeze`, `withDefaultDragHandle`.
- **Types**: `CngxReorderableSelectConfig`, `CngxReorderableSelectConfigFeature`.

### `provide-cngx-select.ts`

Unified aggregator across all three config surfaces.
`provideCngxSelect(...features)` and `provideCngxSelectAt(...features)` accept a discriminated union `CngxSelectAggregatorFeature` and dispatch each feature to its target provider via the hidden `_target` field each feature carries.

| Symbol                                                   | Purpose                                                                                          |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `provideCngxSelect(...features): EnvironmentProviders[]` | App-wide                                                                                         |
| `provideCngxSelectAt(...features): Provider[]`           | Component-scoped (viewProviders)                                                                 |
| `CngxSelectAggregatorFeature`                            | `CngxSelectConfigFeature \| CngxActionSelectConfigFeature \| CngxReorderableSelectConfigFeature` |

The three individual `provide*` providers stay exported for back-compat — the aggregator is purely additive.
See [`ARCHITECTURE.md` § Configuration cascade](../../../ARCHITECTURE.md#configuration-cascade).

### `resolve-config.ts`

Internal injector-context resolver. Returns the merged `CngxSelectConfig` for the current scope (instance-level `CNGX_SELECT_CONFIG` overrides root-level overrides override library defaults).
Variants call `resolveSelectConfig()` once at construction.

### `announcer.ts`

`CngxSelectAnnouncer` is `providedIn: 'root'` — owns the global ARIA-live region and the `announce(message, politeness)` API.
The `format()` function in `CngxSelectAnnouncerConfig` builds the sentence; `withAnnouncer({ format: ... })` overrides per-locale.

---

## 7. Family primitives

### `option.model.ts`

The option-shape contract:

| Symbol                                            | Purpose                                                                                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `CngxSelectOptionDef<T>`                          | `{ value, label, disabled?, meta? }` — the canonical option                                                               |
| `CngxSelectOptionGroupDef<T>`                     | `{ label, children, disabled? }` — for grouped options                                                                    |
| `CngxSelectOptionsInput<T>`                       | `(CngxSelectOptionDef<T> \| CngxSelectOptionGroupDef<T>)[]`                                                               |
| `isCngxSelectOptionGroupDef`                      | Discriminator predicate                                                                                                   |
| `isOptionDisabled`                                | Handles dual-shape `boolean \| (() => boolean)` (element-component options expose `disabled` as a callable signal-getter) |
| `flattenSelectOptions(input)`                     | Drop group structure into a flat `CngxSelectOptionDef<T>[]`                                                               |
| `filterSelectOptions(input, term, matchFn)`       | Filter options with a matcher; preserves group structure, drops empty groups                                              |
| `mergeLocalItems(input, localItems, compareWith)` | Merge a quick-create buffer into the option list, deduped                                                                 |

### `compare.ts`

| Symbol                           | Purpose                                                         |
| -------------------------------- | --------------------------------------------------------------- |
| `sameArrayContents<T>(a, b, eq)` | Reference-short-circuit length-and-pairwise-`eq` array equality |

### `typeahead-controller.ts`

Keyboard typeahead engine: buffer signal + debounced reset + walk semantics (round-robin, disabled-skip). Plus the `resolvePageJumpTarget` helper for PageUp/Down clamped jumps.

| Symbol                               | Purpose                                        |
| ------------------------------------ | ---------------------------------------------- |
| `createTypeaheadController<T>(opts)` | Default factory                                |
| `TypeaheadController<T>`             | API: `matchFromIndex`, `clearBuffer`, `buffer` |
| `TypeaheadControllerOptions<T>`      | Input shape                                    |
| `resolvePageJumpTarget`              | Pure helper for the ±N page-jump               |

### `flat-nav-strategy.ts`

Policy layer over `TypeaheadController` + `resolvePageJumpTarget` shared by `CngxSelect`, `CngxMultiSelect`, `CngxReorderableMultiSelect`.
Returns a discriminated `CngxFlatNavAction` (`'select' \| 'highlight' \| 'noop'`) the variant dispatches.

| Symbol                                   | Purpose                                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------------------- |
| `createDefaultFlatNavStrategy(options?)` | Default factory                                                                    |
| `CngxFlatNavStrategy`                    | API: `onPageJump`, `onTypeaheadWhileClosed`                                        |
| `CngxFlatNavContext<T>`                  | Input shape (options, listbox items, current indices, compareWith)                 |
| `CngxFlatNavListboxItem`                 | Minimal listbox-item shape (handles `boolean \| (() => boolean) \| null` disabled) |
| `CngxFlatNavAction<T>`                   | Discriminated result                                                               |
| `CNGX_FLAT_NAV_STRATEGY`                 | DI token                                                                           |

### `page-jump-handler.ts`

Internal helper used by combobox/typeahead/action variants — they delegate to `CngxListboxSearch` for keyboard input but still need to intercept `PageUp` / `PageDown` directly. `handlePageJumpKey(event, ctx)` returns a boolean indicating whether the key was handled.

### `select-base.css`

Family-shared structural CSS. Panel frame, option rows, skeleton shimmer (`prefers-reduced-motion`-aware), spinner / loading-bar / refreshing-spinner / dots animations, option-row commit feedback, panel- level error surfaces, chip strip layout (shared by `CngxMultiSelect`, `CngxCombobox`, `CngxTypeahead`'s clear button surface, `CngxReorderableMultiSelect`, `CngxActionMultiSelect`, `CngxTreeSelect`), chip drag/drop styles for reorder.
All values are `--cngx-*` CSS custom properties with sensible fallbacks.

Variant-specific trigger skin lives next to each variant in `<variant>.component.css` and is `styleUrls`-linked alongside this file.
The schematic can eject the trigger skin into the consumer's project while keeping `select-base.css` linked from the library.

---

## How to extend

See [`ARCHITECTURE.md` § How to extend](../../../ARCHITECTURE.md#how-to-extend) — four walkthroughs covering new slots, new ariaLabels keys, factory overrides, and adding a ninth variant.
