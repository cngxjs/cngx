---
name: cngx-builder
description: >-
  Build Angular features using the cngx component library.
  Keywords: table, sort, filter, search, paginate, treetable, overlay, grid, stack, speak, accessibility, focus trap, click outside, resize, intersection, data source, form.
  Modes: build (generate code), plan (classify into atoms/molecules/organisms and choose libraries), analyze (inspect a URL or file via Playwright and decompose into a cngx plan).
  Trigger: "build me a", "cngx", "use cngx to", "plan a cngx feature", "what cngx pieces do I need for", "analyze this component", "replicate this", "look at this URL".
---

# cngx Builder

## What is cngx?

cngx (`@cngx/*`) is an Angular component library that serves as the **missing composition layer between Angular CDK and Angular Material**. It makes both declarative and Signal-first without replacing them.

**Core philosophy:** CDK provides raw behavior primitives. Material provides opinionated, styled components. cngx fills the gap -- it composes CDK behaviors into reusable, Signal-driven directives and provides both headless (CDK) and Material-skinned variants of complex components. Consumers never need to choose between CDK and Material upfront; cngx gives them both.

**Key differentiators:**

- Signal-first: all state via `signal()`, `computed()`, `input()`, `output()`, `model()`, `linkedSignals()` -- no decorators, no BehaviorSubjects
- `inject()` over constructor injection, standalone components only, no NgModules
- "Consumer wires it up" -- sort, filter, search, paginate are orthogonal directives the consumer connects via `computed()`, not magic DI
- Dual rendering: data-display components ship as `[Presenter]` directive (logic) + `<cngx-xxx>` (CDK) + `<cngx-mat-xxx>` (Material)
- CSS custom properties with sensible defaults and `--mat-sys-*` token fallbacks -- fully themeable, no hardcoded colors
- Material theming system: every `@cngx/ui` and Material-variant component ships a `*-theme.scss` file with a `theme($theme)` mixin that consumers include alongside `mat.all-component-themes()` (see "Material Theme SCSS Convention" below)
- Atomic design internally: atoms (single-behavior directives, `@cngx/common`) -> molecules (composed atoms, CDK) -> organisms (Material composites, `@cngx/ui` / `@cngx/data-display`)

### Material Theme SCSS Convention

Every cngx component that has a Material variant (organisms in `@cngx/ui` or `@cngx/data-display`) ships a companion `*-theme.scss` file. This file follows the same structure as Angular Material's own theme mixins so consumers include it naturally:

**File structure** -- every theme SCSS exports a single `theme($theme)` mixin composed of three sub-mixins:

```scss
@use '@angular/material' as mat;

@mixin base() {
  // Structural tokens: sizes, spacing, radii, border widths, transitions
  // These don't change with color/density -- they're constants.
  --cngx-foo-size: 36px;
  --cngx-foo-radius: 8px;
}

@mixin color($theme) {
  @if mat.get-theme-version($theme) == 1 {
    // M3 -- reference --mat-sys-* CSS custom properties
    // This keeps the component in sync with Material's own theme changes.
    --cngx-foo-bg: var(--mat-sys-surface-container-low);
    --cngx-foo-color: var(--mat-sys-on-surface-variant);
    --cngx-foo-active: var(--mat-sys-primary);
  } @else {
    // M2 -- derive from palette via mat.get-theme-color()
    --cngx-foo-bg: #{mat.get-theme-color($theme, background, card)};
    --cngx-foo-color: rgba(0, 0, 0, 0.54);
    --cngx-foo-active: #{mat.get-theme-color($theme, primary)};
  }
}

@mixin density($theme) {
  $scale: mat.get-theme-density($theme);
  $scale: math.clamp(-4, $scale, 0);
  // Map density scale to concrete px values
  $sizes: (0: 36px, -1: 32px, -2: 28px, -3: 24px, -4: 20px);
  --cngx-foo-size: #{map.get($sizes, $scale)};
}

@mixin theme($theme) {
  :where(cngx-foo) {     // or `cngx-foo` without :where
    @include base();
    @include color($theme);
    @include density($theme);
  }
}
```

**Consumer usage** -- in global `styles.scss`:

```scss
@use '@angular/material' as mat;
@use '@cngx/ui/speak/speak-button-theme' as speak;
@use '@cngx/data-display/treetable/mat-treetable-theme' as treetable;

$theme: mat.define-theme((...));

html {
  @include mat.all-component-themes($theme);
  @include speak.theme($theme);
  @include treetable.theme($theme);
}

// Dark theme scope:
[data-theme='dark'] {
  @include mat.all-component-colors($dark-theme);
  @include speak.theme($dark-theme);
  @include treetable.theme($dark-theme);
}
```

**Rules for theme SCSS:**
- M3 first: use `var(--mat-sys-*)` tokens for colors -- they auto-adapt to light/dark via Material's own theme system
- M2 fallback: use `mat.get-theme-color($theme, ...)` for older setups
- All tokens are CSS custom properties (`--cngx-*`) -- consumers can override them from the outside
- Density: clamp to `[-4, 0]` range, map to concrete px values via Sass maps
- The `theme()` mixin scopes to the component selector (`:where(cngx-foo)` or `cngx-foo`)
- Name tokens with the component prefix: `--cngx-speak-btn-*`, `--cngx-mat-treetable-*`
- Never use hardcoded hex colors inside the theme mixin -- always derive from the `$theme` or reference `--mat-sys-*`
- The theme file lives next to the component: `speak/speak-button-theme.scss`, `treetable/mat-treetable-theme.scss`

**Six libraries, strict dependency levels:**

| Level | Library | Scope |
|-|-|-|
| 0 | `@cngx/utils` | Pure TypeScript utilities, no Angular |
| 1 | `@cngx/core` | Angular-only tokens and utilities |
| 2 | `@cngx/common` | Behavior directives + data behaviors (Angular + CDK, no Material) |
| 3 | `@cngx/forms` | Typed form controls + validators (Material Forms) |
| 3 | `@cngx/data-display` | Tables, treetables (CDK primary; Material only in `mat-treetable` secondary entry) |
| 4 | `@cngx/ui` | Finished composites (CDK + common primary; Material only in `ui/material` secondary entry) |

**All 21 entry points:**

| Entry point | Key exports |
|-|-|
| `@cngx/utils` | Pure TS utilities, `Version`, `coerceArray` |
| `@cngx/utils/rxjs-interop` | `ensureObservable` |
| `@cngx/core` | `VERSION` |
| `@cngx/core/tokens` | `ENVIRONMENT`, `WINDOW`, `provideEnvironment`, `provideWindow`, `injectWindow` |
| `@cngx/core/utils` | `coerceBooleanProperty`, `coerceNumberProperty`, `memoize` |
| `@cngx/common` | Barrel re-export of all secondary entries + `VERSION`; prefer specific entries |
| `@cngx/common/a11y` | `CngxAriaExpanded`, `CngxFocusTrap`, `CngxFocusVisible`, `CngxLiveRegion`, `CngxReducedMotion` |
| `@cngx/common/interactive` | `CngxClickOutside`, `CngxDisclosure`, `CngxHoverable`, `CngxNavLink`, `CngxNavGroup`, `CngxNavBadge`, `CngxNavLabel`, `CngxNavGroupRegistry`, `CngxSearch`, `CngxSpeak`, `CngxSwipeDismiss`, `provideNavConfig`, `injectNavConfig`, `CNGX_NAV_CONFIG` |
| `@cngx/common/layout` | `CngxIntersectionObserver`, `CngxResizeObserver`, `CngxScrollLock`, `CngxBackdrop`, `CngxDrawer`, `CngxDrawerPanel`, `CngxDrawerContent`, `CngxMediaQuery` |
| `@cngx/common/data` | `CngxSort`, `CngxSortHeader`, `CngxFilter`, `CngxPaginate`, `injectDataSource`, `injectSmartDataSource` |
| `@cngx/forms` | `VERSION` |
| `@cngx/forms/controls` | `CngxTypedControl` |
| `@cngx/forms/validators` | `patternMatch`, `requiredTrue` |
| `@cngx/ui` | `CngxSidenavLayout`, `CngxSidenav`, `CngxSidenavContent`, `CngxSidenavHeader`, `CngxSidenavFooter`, `CngxSpeakButton` |
| `@cngx/ui/layout` | `CngxStack`, `CngxGrid` |
| `@cngx/ui/overlay` | `CngxOverlay`, `CngxOverlayRef`, `provideOverlay`, `CngxOverlayConfig` |
| `@cngx/ui/material` | `CngxMatPaginator` |
| `@cngx/data-display` | `VERSION` |
| `@cngx/data-display/treetable` | `CngxTreetable`, `CngxTreetablePresenter`, `CngxTreetableRow`, `CngxCellTpl`, `CngxHeaderTpl`, `CngxEmptyTpl`, `provideTreetable`, tree utilities, types |
| `@cngx/data-display/mat-treetable` | `CngxMaterialTreetable` |

**Angular version:** 21+, TypeScript ~5.9, strict mode.

---

You are a cngx library expert. Given keywords, a file path, or a URL, you either **plan** it (classify into atomic design layers, pick the right libraries and directives), **build** it (generate production Angular code using cngx APIs), or **analyze** it (inspect an external artifact via Playwright, decompose it, and produce a cngx implementation plan).
You use the "consumer wires it up" pattern for sort/filter/search/paginate, and `hostDirectives` + `injectSmartDataSource()` when auto-wiring is appropriate. Always follow cngx conventions for code structure and styling.
For UX and UI decisions, follow the cngx design principles: composable, accessible, performant, and themeable. Use CSS custom properties for all styling, with sensible defaults and Material token fallbacks where appropriate.
If you need to make assumptions about the feature, state them clearly. Always ask clarifying questions if the requirements are vague or incomplete. You are using other skills like the ui-ux-pro-max and frontend-design to develop top notch quality features.

## Input Types

This skill accepts three types of input:

1. **Keywords** — descriptive terms like "sortable table with search and pagination"
2. **File paths** — local files containing source code (any framework: Angular, React, Vue, Svelte, plain JS/HTML). Read the file, extract the component structure, and use it as the basis for planning/building.
3. **URLs** — links to live components, documentation pages, or demos (any framework, any site). Use Playwright to inspect the artifact visually and structurally.

The source artifact does NOT need to be Angular. It can be React, Vue, Svelte, plain JavaScript, or even a static HTML mockup. The skill's job is to decompose whatever it receives and translate the result into a cngx implementation plan.

## Modes

### Plan mode

When the user says "plan", "what do I need", "which pieces", or "classify":

1. Break the feature into **atoms**, **molecules**, and **organisms** using cngx's atomic design system.
2. For each piece, name the cngx directive/component, its library, and its layer level.
3. Show a composition diagram (text, not Mermaid) showing how they wire together.
4. Call out any "consumer wires it up" patterns needed (sort, filter, search, paginate are always consumer-wired via `computed()`).

**Atomic design layers in cngx:**

| Layer    | Description                                | Target library                     | Material allowed |
| -------- | ------------------------------------------ | ---------------------------------- | ---------------- |
| Atom     | Single-behavior directive, no CDK/Material | `@cngx/common`                     | No               |
| Molecule | Multiple atoms combined, CDK possible      | `@cngx/common` or feature lib      | CDK only         |
| Organism | Material-based composites                  | `@cngx/ui` or `@cngx/data-display` | Yes              |

**Library dependency levels (lower imports from lower only):**

| Level | Library | May use |
|-|-|-|
| 0 | `@cngx/utils` | TypeScript only |
| 1 | `@cngx/core` | Angular only |
| 2 | `@cngx/common` | Angular + CDK |
| 3 | `@cngx/forms` | common + Material Forms |
| 3 | `@cngx/data-display` | common + CDK Table (Material only in `mat-treetable` entry) |
| 4 | `@cngx/ui` | CDK + common (Material only in `ui/material` entry) |

### Build mode

When the user says "build", "generate", "create", "make", or just gives keywords:

1. Identify which cngx directives/components to use from the catalog below.
2. Generate a standalone Angular component using Signal-based APIs.
3. Follow all cngx conventions: `inject()` not constructor injection, `input()`/`output()` not decorators, `computed()` for derived state, `effect()` only for side effects, no `any`, CSS custom properties for styling.
4. Use the "consumer wires it up" pattern for sort/filter/search/paginate.
5. Use `hostDirectives` when composing atoms into a component.

### Analyze mode

When the user provides a **URL** or a **file path** (or says "analyze", "replicate", "look at this", "decompose"):

**For URLs -- use Playwright:**

1. Navigate to the URL with `browser_navigate`.
2. Take a screenshot with `browser_take_screenshot` to capture the visual appearance.
3. Take a snapshot with `browser_snapshot` to capture the accessibility tree / DOM structure.
4. Analyze visible UI elements: layout, data patterns, interactive controls, states.
5. If the artifact has interactive behavior that needs exploration (dropdowns, modals, tabs, hover states, drag-and-drop), **ask the user** what interactions to perform or what to click/hover to reveal hidden states. Then use `browser_click`, `browser_hover`, `browser_fill_form`, `browser_press_key` etc. and take additional screenshots/snapshots.
6. If the artifact's purpose or behavior is ambiguous, **ask the user for a short description** of what the component does and what aspects matter most for the cngx version.
7. Optionally inspect the page source via `browser_evaluate` to extract component structure, CSS custom properties, data shapes, or framework-specific attributes (React props, Vue bindings, Angular inputs).

**For file paths -- read the source with cross-reference tracing:**

1. Read the file(s) with the Read tool.
2. Identify the framework (Angular, React, Vue, Svelte, plain JS/HTML) from imports and syntax.
3. Extract: component structure, props/inputs/outputs, state management, event handlers, template structure, styling approach.
4. **Trace cross-references automatically.** Scan all import statements, template references, service injections, and type imports. For each dependency:
   - Classify it as **internal** (same repo, resolvable via relative or alias path) or **external** (npm package, CDK, Material, etc.).
   - For internal dependencies, use Glob to locate the file by name/path pattern, then Read it. Do NOT ask the user for permission on each file -- follow the import graph proactively.
   - Build a dependency map: which components compose which, which services feed data, which directives add behavior, which types define the data shape.
5. **Recursive depth:** Follow imports up to 3 levels deep (component -> service -> model). Stop at framework primitives (Angular core, React hooks, Vue composables) and external packages. If an import chain goes deeper than 3 levels, list the unresolved references and ask the user if they matter.
6. **Cross-artifact patterns to detect:**
   - Sub-components used in the template (e.g., a grid component that uses a custom cell renderer component from a sibling folder)
   - Shared directives applied in the template (e.g., tooltip, drag-drop, resize handles from a utility folder)
   - Services injected for data, state, or side effects (e.g., a data service, selection service, column config service)
   - Models/interfaces/enums imported for data shape (e.g., `GridColumn`, `SortDescriptor`, `FilterDescriptor`)
   - Shared SCSS/CSS (mixins, variables, theme files imported via `@use` or `@import`)
   - Configuration objects or providers (e.g., `forRoot()` config, InjectionTokens, default options)
7. **Repo context awareness:** When the user provides a file from a library repo (like Kendo, PrimeNG, AG Grid, etc.), recognize that the component likely has:
   - A public API barrel file (`index.ts`, `public-api.ts`) -- find and read it to understand what the library exposes
   - Related components in sibling directories (e.g., `grid/` has `column.component.ts`, `cell.component.ts`, `header.component.ts`)
   - Shared utilities in a `utils/`, `common/`, or `shared/` folder nearby
   - Use Glob patterns like `<parent-dir>/**/*.ts` to discover related files when the import graph alone is insufficient

**After gathering information (URL or file), produce the plan:**

1. **Source decomposition**: List every distinct UI element, behavior, and data flow found in the source artifact. Note the original framework. Include a **dependency graph** showing which files were analyzed and how they relate.
2. **cngx mapping**: For each element/behavior, map it to the closest cngx directive, component, or pattern. Flag anything that has no cngx equivalent yet (potential new atom/molecule).
3. **Atomic classification**: Classify each mapped piece as atom/molecule/organism with its target library.
4. **Composition plan**: Show how the pieces wire together in cngx, including hostDirectives, template structure, and signal flow.
5. **Gaps and decisions**: List anything that needs user input -- missing behaviors, ambiguous interactions, styling choices, data shape assumptions.
6. **Implementation sequence**: Ordered steps to build the cngx version, noting which steps can be parallelized.

**Interactive exploration protocol:**

When analyzing a URL, some artifacts require interaction to fully understand. Follow this protocol:

- After the initial screenshot + snapshot, assess whether the artifact has hidden states (collapsed sections, modals, tooltips, hover effects, multi-step flows).
- If yes, ask the user: "I can see [X]. To fully analyze this, I'd need to [click Y / hover Z / fill in W]. Should I proceed, or can you describe what happens?"
- The user may either grant permission to interact or describe the behavior verbally.
- After each interaction round, take a new screenshot and reassess.
- Continue until you have a complete picture of all states and behaviors.

## Directive & Component Catalog

Prefer importing from the specific secondary entry point, not the `@cngx/common` barrel.

### @cngx/common/a11y

- `[cngxAriaExpanded]` — manages `aria-expanded`/`aria-controls`; inputs: `expanded` (bool), `controls` (string)
- `[cngxFocusTrap]` — CDK FocusTrap wrapper; inputs: `enabled`, `autoFocus`; methods: `focusFirst()`, `focusLast()`
- `[cngxFocusVisible]` — adds `cngx-focus-visible` CSS class on keyboard focus; signal: `focusVisible`
- `[cngxLiveRegion]` — ARIA live region; inputs: `politeness` (`'polite'|'assertive'|'off'`), `atomic`, `relevant`
- `[cngxReducedMotion]` — reflects `prefers-reduced-motion`; signal: `prefersReducedMotion`; adds `cngx-reduced-motion` class

### @cngx/common/interactive

- `[cngxClickOutside]` — output: `clickOutside`; inputs: `eventType` (`'pointerdown'|'click'|'mousedown'|'touchstart'`), `enabled`
- `[cngxDisclosure]` — generic expand/collapse; exportAs `"cngxDisclosure"`; input: `cngxDisclosureOpened`, `controls`; signal: `opened`; output: `openedChange`; methods: `open()`, `close()`, `toggle()`; click + Enter/Space toggle
- `[cngxHoverable]` — signal: `hovered` (bool)
- `[cngxNavLink]` — `a[cngxNavLink]` / `button[cngxNavLink]`; exportAs `"cngxNavLink"`; inputs: `active`, `ariaCurrent`, `depth`, `scrollOnActive`
- `[cngxNavGroup]` — collapsible nav section; exportAs `"cngxNavGroup"`; input: `depth`; composes `CngxDisclosure` as hostDirective; `singleAccordion` support via `CngxNavGroupRegistry` + `CNGX_NAV_CONFIG`
- `[cngxNavBadge]` — inline count/dot/status badge; exportAs `"cngxNavBadge"`; inputs: `value`, `variant` (`'count'|'dot'|'status'`), `ariaLabel`
- `[cngxNavLabel]` — non-interactive section header; exportAs `"cngxNavLabel"`; inputs: `heading`, `level`
- `CngxNavGroupRegistry` — injectable service; provide at component level alongside `provideNavConfig`; manages group registration for single-accordion mode
- `provideNavConfig(config)` — convenience provider for `CNGX_NAV_CONFIG`; options: `indent` (px), `singleAccordion` (bool), `animationDuration` (ms)
- `injectNavConfig()` — inject resolved nav config
- `CNGX_NAV_CONFIG` — `InjectionToken<CngxNavConfig>`
- `input[cngxSearch]` — signals: `term`, `hasValue`; output: `searchChange`; input: `debounceMs` (default 300); method: `clear()`
- `[cngxSpeak]` — headless TTS; exportAs `"cngxSpeak"`; input: `cngxSpeak` (text), `rate`, `pitch`, `volume`, `lang`, `enabled`; signals: `speaking`; `supported` is a plain `boolean` (not a signal — access as `speak.supported`); methods: `speak(text)`, `cancel()`, `toggle()`
- `[cngxSwipeDismiss]` — Pointer Events swipe detection; exportAs `"cngxSwipeDismiss"`; input: `cngxSwipeDismiss` (required `SwipeDirection`: `'left'|'right'|'up'|'down'`), `threshold`, `enabled`; output: `swiped`; signals: `swiping`, `swipeProgress`

### @cngx/common/layout

- `[cngxIntersectionObserver]` — inputs: `root`, `rootMargin`, `threshold`; signals: `isIntersecting`, `intersectionRatio`; outputs: `intersectionChange`, `entered`, `left`
- `[cngxResizeObserver]` — input: `box`; signals: `width`, `height`, `contentRect`, `isReady`; output: `resize`
- `[cngxScrollLock]` — prevents body scroll; input: `cngxScrollLock` (bool enabled); exportAs `"cngxScrollLock"`
- `[cngxBackdrop]` — overlay visibility + inert-sibling toggling; exportAs `"cngxBackdrop"`; input: `cngxBackdrop` (bool visible), `closeOnClick`; output: `backdropClick`
- `[cngxDrawer]` — state owner for a drawer system; exportAs `"cngxDrawer"`; input: `cngxDrawerOpened`; outputs: `openedChange`, `closed`; signal: `opened`; methods: `open()`, `close()`, `toggle()`
- `[cngxDrawerPanel]` — sliding panel; input: `cngxDrawerPanel` (required `CngxDrawer` ref), `position` (`'left'|'right'|'top'|'bottom'`), `mode` (`'over'|'push'|'side'`), `closeOnClickOutside`; composes `CngxFocusTrap` as hostDirective
- `[cngxDrawerContent]` — marks main content area; input: `cngxDrawerContent` (required `CngxDrawer` ref); signal: `isOpen`
- `[cngxMediaQuery]` — reactive `window.matchMedia()` wrapper; exportAs `"cngxMediaQuery"`; input: `cngxMediaQuery` (required CSS media query string); signal: `matches`

### @cngx/common/data (consumer wires it up)

- `[cngxSort]` — exportAs `"cngxSort"`; inputs: `cngxSortActive`, `cngxSortDirection`, `multiSort`; signals: `sort` (primary `SortEntry|null`), `sorts` (`SortEntry[]`), `isActive`; outputs: `sortChange`, `sortsChange`; methods: `setSort(field, additive?)`, `clear()`
- `[cngxSortHeader]` — inputs: `field` (via `cngxSortHeader="colName"`), `cngxSortRef` (required ref to `CngxSort`); signals: `isActive`, `isAsc`, `isDesc`, `priority`; Shift+click for additive sort when `multiSort` enabled
- `[cngxFilter]` — exportAs `"cngxFilter"`; multi-filter: `addPredicate(key, fn)`, `removePredicate(key)`, `predicates` signal, `activeCount` computed; single-filter: `setPredicate(fn|null)`, `clear()`; controlled mode: `[cngxFilter]="pred()"`; `predicate` computed AND-combines all
- `input[cngxSearch]` — signals: `term`, `hasValue`; output: `searchChange`; input: `debounceMs` (default 300); method: `clear()`
- `[cngxPaginate]` — exportAs `"cngxPaginate"`; inputs: `cngxPageIndex`, `cngxPageSize`, `total`; computeds: `pageIndex`, `pageSize`, `totalPages`, `isFirst`, `isLast`, `range` (`[start, end]` for `Array.slice()`); methods: `setPage()`, `setPageSize()`, `next()`, `previous()`, `first()`, `last()`; outputs: `pageChange`, `pageSizeChange`
- `injectDataSource(signal)` — dumb CDK bridge, must be called in injection context
- `injectSmartDataSource(signal, options?)` — auto-discovers `CngxSort`/`CngxFilter`/`CngxPaginate` from element injector when used as `hostDirectives`; exposes `filteredCount` signal; **CngxSearch does NOT auto-wire** (lives on child input element); extends CDK `DataSource<T>` — works with `mat-table [dataSource]`

### @cngx/ui — Organisms (Level 4)

- `cngx-sidenav-layout` (`CngxSidenavLayout`) — container managing shared backdrop, scroll lock, and up to two `CngxSidenav` panels; methods: `closeAllOverlays()`
- `cngx-sidenav` (`CngxSidenav`) — sidebar panel; inputs: `position` (`'start'|'end'`), `mode` (`'over'|'push'|'side'|'mini'`), `responsive` (CSS media query string), `width` (model, two-way), `miniWidth`, `resizable`, `minWidth`, `maxWidth`, `expandOnHover`, `ariaLabel`, `shortcut` (e.g. `'ctrl+b'`), `opened` (model, two-way); computed: `effectiveMode`, `isOverlay`, `resizing`, `effectiveWidth`, `expanded`; methods: `open()`, `close()`, `toggle()`
- `cngx-sidenav-content` (`CngxSidenavContent`) — marks main content area; must be direct child of `CngxSidenavLayout`
- `CngxSidenavHeader` / `CngxSidenavFooter` — slot directives projected into named `ng-content` slots
- `cngx-speak-button` (`CngxSpeakButton`) — ready-made TTS button; input: `speakRef` (required `CngxSpeak` instance); CSS vars: `--cngx-speak-btn-size`, `--cngx-speak-btn-radius`, etc.
- `cngx-stack` (from `@cngx/ui/layout`) — inputs: `direction`, `gap`, `align`
- `cngx-grid` (from `@cngx/ui/layout`) — inputs: `columns`, `gap`
- `CngxOverlay` service (from `@cngx/ui/overlay`) — requires `provideOverlay()` in app providers; `open<C, R>(component, config)` returns `CngxOverlayRef<R>`; `CngxOverlayConfig` is `type CngxOverlayConfig = Partial<OverlayConfig>`
- `provideOverlay()` (from `@cngx/ui/overlay`) — must be added to app/component providers before using `CngxOverlay`

### @cngx/ui/material — Material organisms (Level 4, Material peer here only)

- `cngx-mat-paginator` (`CngxMatPaginator`) — Material paginator; input: `cngxPaginateRef` (required, ref to `CngxPaginate`), `pageSizeOptions` (number[])

### @cngx/data-display/treetable — CDK treetable (Level 3)

- `cngx-treetable` (`CngxTreetable`) — CDK variant (headless, unstyled)
- Both `cngx-treetable` and `cngx-mat-treetable` use `CngxTreetablePresenter` hostDirective — inputs: `tree`, `options`, `nodeId`, `expandedIds`, `selectionMode` (`'none'|'single'|'multi'`), `showCheckboxes`, `selectedIds`, `trackBy`; outputs: `nodeClicked`, `nodeExpanded`, `nodeCollapsed`, `expandedIdsChange`, `selectionChanged`, `selectedIdsChange`
- `[cngxCell]="'colName'"` (`CngxCellTpl`) — custom cell template; context: `let-node` (FlatNode), `let-value="value"`
- `[cngxHeader]="'colName'"` (`CngxHeaderTpl`) — custom header template
- `cngxEmpty` (`CngxEmptyTpl`) — empty state template
- `provideTreetable` / `CNGX_TREETABLE_CONFIG` — configuration token and provider
- Tree utilities: `filterTree(nodes, predicate)`, `sortTree(nodes, field, direction)`, `nodeMatchesSearch(value, term)`, `flattenTree`
- Types: `Node<T>`, `FlatNode<T>`, `TreetableOptions<T>`, `CngxCellTplContext<T>`

### @cngx/data-display/mat-treetable — Material treetable (Material peer here only)

- `cngx-mat-treetable` (`CngxMaterialTreetable`) — Material variant (themed via `mat-treetable-theme.scss`)

### @cngx/forms (Level 3)

- `[cngxTypedControl]` (from `@cngx/forms/controls`) — typed form control directive; `control` is a `Signal` (`computed`) — access as `typedCtrl.control()`, not a getter
- `requiredTrue`, `patternMatch` (from `@cngx/forms/validators`)

### @cngx/core (Level 1)

- `ENVIRONMENT`, `provideEnvironment()` (from `@cngx/core/tokens`)
- `WINDOW`, `provideWindow()`, `injectWindow()` (from `@cngx/core/tokens`)
- `coerceBooleanProperty()`, `coerceNumberProperty()` (from `@cngx/core/utils`)
- `memoize()` (from `@cngx/core/utils`)

### @cngx/utils (Level 0)

- `coerceArray<T>()` — ensures value is array
- `Version` class, `VERSION` constant
- `ensureObservable<T>()` (from `@cngx/utils/rxjs-interop`)

## Key Patterns

### Consumer wires it up (sort + filter + search + paginate)

Sort, filter, search, and paginate are orthogonal directives. No component injects them. The consumer connects them via `computed()`:

```typescript
readonly processedData = computed(() => {
  let data = this.rawData();
  const term = this.search.term();
  const pred = this.filter.predicate();
  const s = this.sort.sort();
  if (term) data = data.filter(item => matchesSearch(item, term));
  if (pred) data = data.filter(pred);
  if (s) data = sortBy(data, s.active, s.direction);
  // paginate last
  const [start, end] = this.paginate.range();
  return data.slice(start, end);
});
```

### SmartDataSource with hostDirectives

When sort/filter/paginate should auto-wire, use `hostDirectives` + `injectSmartDataSource()`:

```typescript
@Component({
  hostDirectives: [
    { directive: CngxSort },
    { directive: CngxFilter },
    { directive: CngxPaginate, inputs: ['total'] },
  ],
})
class MyTable {
  readonly sort = inject(CngxSort, { host: true });
  readonly filter = inject(CngxFilter, { host: true });
  readonly paginate = inject(CngxPaginate, { host: true });

  private readonly items = signal(DATA);
  private readonly ds = injectSmartDataSource(this.items);
  readonly rows = toSignal(this.ds.connect(), { initialValue: [] });
  readonly filteredCount = this.ds.filteredCount;
}
```

### Treetable with search + sort

```typescript
readonly processedTree = computed(() => {
  let tree = this.rawTree();
  const term = this.search.term();
  const s = this.sort.sort();
  if (term) tree = filterTree(tree, v => nodeMatchesSearch(v, term));
  if (s) tree = sortTree(tree, s.active, s.direction);
  return tree;
});
```

### Sort header explicit ref (no ancestor injection)

```html
<div cngxSort #sort="cngxSort">
  <button cngxSortHeader="name" [cngxSortRef]="sort" #h="cngxSortHeader">
    Name @if (h.isActive()) { {{ h.isAsc() ? 'up' : 'down' }} }
  </button>
</div>
```

### Controlled + Uncontrolled pattern

Directives support both modes. Controlled input takes precedence:

```typescript
readonly activeInput = input<string | undefined>(undefined, { alias: 'cngxSortActive' });
private readonly _active = signal<string | undefined>(undefined);
readonly active = computed(() => this.activeInput() ?? this._active());
```

### CSS custom properties

All colors/spacing use CSS vars with fallback defaults. Never hardcode. Material variants use `--mat-sys-*` tokens.

```scss
:host {
  --cngx-table-header-bg: var(--mat-sys-surface-variant, #f5f5f5);
}
```

## Code generation rules

1. All components are `standalone: true` (no NgModule).
2. Use `inject()` for DI, never constructor injection.
3. Use `input()` / `output()` signal APIs, never `@Input()` / `@Output()`.
4. Use `@if` / `@for` / `@empty` control flow, never `*ngIf` / `*ngFor`.
5. No `any` -- use `unknown` and narrow.
6. No class suffixes: `MyTable` not `MyTableComponent`, `CngxRipple` not `CngxRippleDirective`.
7. `CngxSortHeader` always needs explicit `[cngxSortRef]` -- no ancestor injection.
8. `CngxSearch` does NOT auto-wire with `injectSmartDataSource()` -- always use `injectDataSource()` + manual `computed()` when search is involved.
9. `injectDataSource()` and `injectSmartDataSource()` must be called in injection context (field initializer or constructor).
10. Prefer `toSignal()` to convert DataSource `.connect()` to a signal.
11. Prefer importing from specific entry points (`@cngx/common/data`, `@cngx/common/layout`) over the barrel (`@cngx/common`).
12. `provideOverlay()` must be added to app or component providers before injecting `CngxOverlay`.
13. No `_` prefix on private members -- `private readonly activeState` not `_activeState`.
14. Event handlers use `handle` prefix -- `handleClick()`, `handlePointerDown()`, never `onClick()`.
15. Template-accessed internal members use `protected` -- `protected readonly state = inject(...)`.
16. Public API members always `readonly` -- `readonly active = this.activeState.asReadonly()`.
